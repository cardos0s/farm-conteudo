# Capítulo 3 — Arquitetura de GPU e CUDA {#cap-03}

Quase todo o tempo de um LLM em produção é gasto dentro de kernels de GPU. Para otimizar inferência, você precisa saber como a GPU executa código: como as threads são organizadas, onde os dados moram, por que um acesso à memória pode ser 10 vezes mais lento que outro feito de jeito diferente, e por que "mais threads" nem sempre significa "mais rápido".

A NVIDIA, a AMD e qualquer empresa que escreve kernels testam isso diretamente: "explique o modelo de execução do CUDA", "o que é occupancy", "otimize esta multiplicação de matrizes". Este capítulo cobre a arquitetura e o modelo de programação. O [Capítulo 4](#cap-04) cobre a metodologia de otimização, e o [Capítulo 5](#cap-05) traz os kernels completos.

## 3.1 CPU vs GPU: duas filosofias

Uma CPU é feita para **latência**: poucos núcleos muito poderosos, com caches enormes, previsão de desvio e execução fora de ordem, tudo para terminar **uma** tarefa o mais rápido possível.

Uma GPU é feita para **throughput**: milhares de unidades simples que executam a mesma instrução em muitos dados ao mesmo tempo. Cada thread individual é lenta. A GPU compensa tendo tantas threads que sempre há alguma pronta para trabalhar enquanto outras esperam a memória.

::: analogia
**Analogia:** a CPU é um carro esportivo que leva uma pessoa de São Paulo ao Rio em 4 horas. A GPU é uma frota de ônibus que leva 5.000 pessoas, cada uma demorando 6 horas. Para levar uma pessoa, o carro ganha. Para levar uma cidade inteira, os ônibus ganham de lavada. Multiplicar matrizes de bilhões de elementos é levar uma cidade inteira.
:::

```text
 CPU (ex.: servidor com 64 núcleos)   GPU (ex.: H100 com 132 SMs)
 ┌────────┬────────┬────────┐         ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐
 │ núcleo │ núcleo │ núcleo │         │SM│SM│SM│SM│SM│SM│SM│SM│SM│
 │ grande │ grande │ grande │         ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
 │  OoO,  │  OoO,  │  ...   │         │SM│SM│SM│SM│SM│SM│SM│SM│SM│
 │ branch │ branch │        │         ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
 │  pred. │  pred. │        │         │  ...  132 SMs, cada um   │
 ├────────┴────────┴────────┤         │  com até 2.048 threads   │
 │   cache L3 grande        │         ├──────────────────────────┤
 └──────────────────────────┘         │ L2 50 MB                 │
   ~100 GB/s de memória               └──────────────────────────┘
                                        ~3.350 GB/s de memória
```

## 3.2 Anatomia de uma GPU NVIDIA (Hopper / H100)

A unidade básica é o **SM** (streaming multiprocessor). A H100 SXM tem **132 SMs**. Cada SM é dividido em **4 partições**, e cada partição tem:

- Um **escalonador de warps** que, a cada ciclo, escolhe um warp pronto e emite uma instrução dele.
- **32 unidades FP32** (os "CUDA cores"), unidades de inteiro e de FP64.
- **1 tensor core**, unidade especializada em multiplicação de matrizes pequenas.
- Um pedaço do **banco de registradores** (o SM inteiro tem 65.536 registradores de 32 bits, 256 KB).

As 4 partições compartilham:

- **Shared memory + L1**: 256 KB por SM, dos quais até **228 KB** podem ser shared memory.
- Unidades de load/store, de funções especiais (exp, sin...) e de textura.
- Na Hopper, a **TMA** (Tensor Memory Accelerator), que copia blocos de tensores da memória global para a shared memory de forma assíncrona.

```text
 ┌──────────────────────── SM (H100) ─────────────────────────┐
 │ ┌──────────────┐┌──────────────┐┌──────────────┐┌─────────┐│
 │ │ Partição 0   ││ Partição 1   ││ Partição 2   ││ Part. 3 ││
 │ │ escalonador  ││ escalonador  ││ escalonador  ││  ...    ││
 │ │ registradores││ registradores││ registradores││         ││
 │ │ 32× FP32     ││ 32× FP32     ││ 32× FP32     ││         ││
 │ │ 1 tensor core││ 1 tensor core││ 1 tensor core││         ││
 │ └──────────────┘└──────────────┘└──────────────┘└─────────┘│
 │ ┌────────────────────────────────────────────────────────┐ │
 │ │ L1 / shared memory (256 KB, até 228 KB de shared)      │ │
 │ └────────────────────────────────────────────────────────┘ │
 └────────────────────────────────────────────────────────────┘
             │  (todos os SMs)
             ▼
 ┌────────────────────────────────────────────────────────────┐
 │ L2 (50 MB)                                                 │
 └────────────────────────────────────────────────────────────┘
             ▼
 ┌────────────────────────────────────────────────────────────┐
 │ HBM3 (80 GB, ~3,35 TB/s)                                   │
 └────────────────────────────────────────────────────────────┘
```

Os números mudam de geração em geração, mas a estrutura (muitos SMs, warps, hierarquia de memória, tensor cores) se mantém desde a Volta (2017). As GPUs da AMD têm conceitos equivalentes com outros nomes: **CU** (compute unit) em vez de SM, **wavefront** de 64 (ou 32) threads em vez de warp, **LDS** em vez de shared memory e **matrix cores** em vez de tensor cores.

## 3.3 O modelo de programação: grid, blocos, threads, warps

Em CUDA, você escreve um **kernel**: uma função que roda em muitas threads ao mesmo tempo. Ao lançar, você define uma **grade** (grid) de **blocos**, cada bloco com várias **threads**:

```cuda
// soma de vetores: cada thread cuida de um elemento
__global__ void soma(const float* a, const float* b,
                     float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {          // a última leva pode sobrar
        c[i] = a[i] + b[i];
    }
}

// no host (CPU):
int threads = 256;
int blocos = (n + threads - 1) / threads;  // arredonda p/ cima
soma<<<blocos, threads>>>(d_a, d_b, d_c, n);
```

A hierarquia lógica e como ela vira hardware:

```text
 LÓGICO (o que você programa)        FÍSICO (onde roda)
 ─────────────────────────────       ──────────────────────────
 Grid: todos os blocos               GPU inteira
   │
   ├─ Bloco (até 1.024 threads)  ──▶  roda inteiro num único SM;
   │   compartilha shared memory      vários blocos podem
   │   pode sincronizar               dividir o mesmo SM
   │   (__syncthreads)
   │
   │   ├─ Warp (32 threads)       ──▶  unidade de execução real:
   │   │   mesma instrução,            o escalonador emite uma
   │   │   ao mesmo tempo              instrução para os 32
   │   │
   │   │   └─ Thread              ──▶  uma "faixa" (lane) do warp,
   │                                   com seus registradores
```

Regras que você precisa saber de cor:

- **Warp = 32 threads.** É a unidade que realmente executa. Blocos devem ter tamanho múltiplo de 32.
- **Blocos são independentes.** Não há ordem garantida entre blocos, e eles não sincronizam entre si dentro de um kernel (fora de recursos especiais como cooperative groups ou clusters na Hopper).
- **Máximo de 1.024 threads por bloco.**
- **Um SM roda vários blocos ao mesmo tempo**, até os limites de registradores, shared memory, warps (64 por SM na H100, ou seja, 2.048 threads) e blocos (32 por SM).

### SIMT e divergência

O modelo se chama **SIMT** (single instruction, multiple threads). As 32 threads de um warp executam a mesma instrução. Se houver um `if` em que metade vai para um lado e metade para o outro, o warp executa **os dois caminhos**, desligando as threads que não participam de cada um. Isso é a **divergência de warp**.

```text
 if (threadIdx.x % 2 == 0) A(); else B();

 tempo ──▶
 lanes pares:   [ A A A A ][ - - - - ]
 lanes ímpares: [ - - - - ][ B B B B ]
                └ metade do warp ociosa em cada trecho ┘

 if (threadIdx.x < 32) A(); else B();   (divide por warp)
 warp 0: [ A A A A ]
 warp 1: [ B B B B ]        sem divergência
```

Desde a Volta, cada thread tem seu próprio contador de programa (independent thread scheduling), o que permite padrões de sincronização mais flexíveis, mas não elimina o custo da divergência.

## 3.4 A hierarquia de memória

Este é o assunto mais importante do capítulo. Quase toda otimização de kernel é, no fundo, **mover dados para mais perto do cálculo e reutilizá-los o máximo possível**.

| Nível | Tamanho (H100) | Escopo | Latência (ordem de grandeza) |
|---|---|---|---|
| Registradores | 256 KB por SM | uma thread | ~1 ciclo |
| Shared memory | até 228 KB por SM | um bloco | dezenas de ciclos |
| L1 | (mesmo espaço físico da shared) | um SM | dezenas de ciclos |
| L2 | 50 MB | GPU inteira | centenas de ciclos |
| HBM (global) | 80 GB | GPU inteira + host | centenas a ~mil ciclos |

Os valores de latência são aproximados e variam com o acesso. O importante é a ordem de grandeza: **cada nível abaixo é muito mais lento e muito maior**.

::: analogia
**Analogia:** registradores são o que você tem na mão. Shared memory é a bancada da cozinha, compartilhada pela equipe daquela estação. L2 é a despensa do restaurante. HBM é o depósito do outro lado da rua. Um bom cozinheiro busca uma caixa inteira do depósito de uma vez, deixa na bancada e usa muitas vezes, em vez de atravessar a rua para cada cebola.
:::

### Memória global e coalescing

Quando um warp lê da memória global, o hardware junta os 32 endereços e busca os **setores** de 32 bytes necessários. Se as 32 threads leem 32 floats **consecutivos** (128 bytes alinhados), isso vira 4 setores, a eficiência máxima. Isso é um acesso **coalescido**.

```text
 Coalescido: thread i lê a[i]
 threads:  0   1   2   3  ...  31
 endereço: │0 │4 │8 │12│ ... │124│   → 128 bytes, 4 setores
           └──────────────────────┘     100% dos bytes usados

 Com passo (stride) 32: thread i lê a[i*32]
 threads:  0     1     2    ...   31
 endereço: 0   128   256   ...  3968  → 32 setores diferentes
           cada setor de 32 B traz 4 B úteis: 12,5% de eficiência
```

Um caso clássico em GEMM: em C/C++ as matrizes são guardadas por linha (row-major). Se cada thread de um warp percorrer uma **coluna** diferente lendo elementos em linhas diferentes, os acessos ficam separados por uma linha inteira: nada coalescido. A solução é organizar quem lê o quê para que threads vizinhas leiam endereços vizinhos, e transpor ou reorganizar na shared memory.

### Shared memory e bank conflicts

A shared memory é dividida em **32 bancos** de 4 bytes. Endereços consecutivos de 4 bytes ficam em bancos consecutivos. Se as 32 threads de um warp acessam 32 bancos diferentes, a leitura sai num ciclo. Se duas threads acessam **endereços diferentes no mesmo banco**, há um **conflito de banco** e os acessos são serializados. (Se várias threads leem o **mesmo** endereço, é broadcast e não há conflito.)

```text
 float tile[32][32];   // cada linha tem 32 floats = 32 bancos
 Ler uma COLUNA: thread i lê tile[i][0]
   endereços: 0, 32, 64, ... (em floats) → todos no banco 0
   → conflito de 32 vias: 32× mais lento

 float tile[32][33];   // +1 de padding por linha
   endereços: 0, 33, 66, ... → bancos 0, 1, 2, ... 31
   → sem conflito
```

Esse truque do **padding** (`[32][33]`) aparece em quase toda entrevista que envolve transposição ou GEMM com shared memory.

### Registradores

São a memória mais rápida e são privados de cada thread. Os kernels mais rápidos de GEMM fazem cada thread calcular um **pedaço** da saída (por exemplo, 8×8 elementos) mantido inteiro em registradores. Mas cada SM tem um número fixo de registradores, e isso leva ao próximo conceito.

## 3.5 Occupancy

**Occupancy** é a razão entre os warps ativos num SM e o máximo que ele suporta (64 na H100). Ela importa porque a GPU esconde a latência da memória **trocando de warp**: enquanto um warp espera dados da HBM, o escalonador emite instruções de outro. Com poucos warps residentes, pode não haver ninguém pronto para trabalhar.

O que limita a occupancy:

1. **Registradores por thread.** 65.536 registradores por SM. Se cada thread usa 128, cabem 512 threads = 16 warps = **25%**.
2. **Shared memory por bloco.** Se cada bloco usa 100 KB, cabem 2 blocos por SM (228 KB).
3. **Threads por bloco** e o limite de blocos por SM.

::: conta
**Fazendo a conta:** kernel com 256 threads por bloco, 64 registradores por thread e 48 KB de shared memory por bloco, na H100.

- Registradores por bloco: 256 × 64 = 16.384 → cabem 65.536 / 16.384 = **4 blocos**.
- Shared memory: 228 / 48 = **4 blocos** (arredondando para baixo).
- Warps: 4 blocos × 8 warps = 32 warps de 64 possíveis.
- Occupancy: **50%**.

Se você reduzir para 32 registradores por thread, os registradores deixam de ser o limite, mas a shared memory continua limitando em 4 blocos. Para subir, teria que reduzir a shared memory também.
:::

::: atencao
**Cuidado:** occupancy alta **não** é o objetivo final. Os kernels de GEMM mais rápidos rodam com occupancy baixa (às vezes 1 ou 2 warps por partição), porque usam muitos registradores para reaproveitar dados e escondem a latência com **paralelismo em nível de instrução** (ILP): cada thread tem várias leituras e multiplicações independentes em andamento ao mesmo tempo. Vasily Volkov mostrou isso em "Better Performance at Lower Occupancy" (2010). Occupancy é uma ferramenta para esconder latência, não uma métrica de sucesso.
:::

## 3.6 Tensor cores

Os **tensor cores** fazem uma operação só: multiplicação e acumulação de matrizes pequenas, $D = A \times B + C$, em um tile por instrução. Nas GPUs recentes:

- Volta e Turing: FP16.
- Ampere (A100): + BF16, TF32, INT8, INT4 e esparsidade estruturada 2:4.
- Hopper (H100): + FP8 (E4M3 e E5M2), instruções **WGMMA** que operam num grupo de 4 warps (128 threads) e leem operandos direto da shared memory.
- Blackwell (B200): + FP4 e FP6.

A diferença de throughput é enorme: na H100, o pico FP32 nos CUDA cores comuns é de ~67 TFLOPS, enquanto os tensor cores fazem ~989 TFLOPS em BF16 denso. Por isso, **quem não usa tensor cores para GEMMs está usando uma fração pequena da GPU**.

Você raramente programa tensor cores na mão. As camadas comuns:

```text
 mais alto nível  ┌─────────────────────────────────┐
                  │ PyTorch (torch.matmul)          │ chama cuBLAS
                  ├─────────────────────────────────┤
                  │ Triton (tl.dot)                 │ gera MMA
                  ├─────────────────────────────────┤
                  │ CUTLASS / CuTe (templates C++)  │
                  ├─────────────────────────────────┤
                  │ WMMA API (nvcuda::wmma)         │
                  ├─────────────────────────────────┤
                  │ PTX: mma.sync, wgmma.mma_async  │
 mais baixo nível └─────────────────────────────────┘
```

O [Capítulo 4](#cap-04) ([Q027](#q027)) mostra como chegar perto do pico dos tensor cores.

## 3.7 Lei de Amdahl

A lei de Amdahl diz quanto um sistema inteiro acelera quando você acelera só uma parte dele. Se uma fração $p$ do tempo é acelerada $s$ vezes:

$$\text{speedup total} = \frac{1}{(1 - p) + \frac{p}{s}}$$

Mesmo com $s$ infinito, o speedup máximo é $1/(1-p)$: a parte que você não otimizou vira o teto.

```text
 Antes:   [████████ GEMM 70% ████████][██ resto 30% ██]
 GEMM 10× mais rápida:
 Depois:  [█ 7% █][██ resto 30% ██]   total = 37% do original
          speedup = 1 / 0,37 ≈ 2,7×  (não 10×)
```

Isso vale em todos os níveis: um kernel dentro de uma camada, uma camada dentro de um passo, um passo dentro de uma requisição, uma requisição dentro de um fluxo de produto. A [Q018](#q018) aprofunda.

## 3.8 Multiplicação de matrizes: a progressão de otimizações

GEMM (general matrix multiply, $C = A \cdot B$) é a operação mais importante em LLMs. Entender como otimizá-la passo a passo é a base para entender qualquer kernel.

Seja $A$ de tamanho $M \times K$, $B$ de $K \times N$ e $C$ de $M \times N$. São $2MNK$ FLOPs.

**Nível 0 — ingênuo.** Cada thread calcula um elemento de $C$, lendo uma linha de $A$ e uma coluna de $B$ da memória global:

```cuda
__global__ void gemm_ingenua(const float* A, const float* B,
                             float* C, int M, int N, int K) {
    int lin = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (lin < M && col < N) {
        float acc = 0.0f;
        for (int k = 0; k < K; ++k)
            acc += A[lin * K + k] * B[k * N + col];
        C[lin * N + col] = acc;
    }
}
```

Cada multiplicação-soma (2 FLOPs) lê 2 floats (8 bytes): **0,25 FLOP/byte**, muito abaixo do ponto de equilíbrio. O L1 e o L2 ajudam um pouco, porque threads vizinhas leem os mesmos dados, mas esse kernel costuma ficar numa fração pequena do pico.

**Nível 1 — tiling com shared memory.** Cada bloco calcula um tile de $C$ (por exemplo, 32×32). Ele carrega um tile de $A$ e um de $B$ para a shared memory, todas as threads do bloco usam esses dados, e o bloco avança no eixo $K$:

```text
            K                         N
      ┌──┬──┬──┬──┐            ┌──┬──┬──┬──┐
      │  │  │  │  │            │  │▓▓│  │  │  ◀ tile de B
  M   ├──┼──┼──┼──┤        K   ├──┼──┼──┼──┤    (anda para baixo)
      │▓▓│▓▓│▓▓│▓▓│ ◀ tile     │  │▓▓│  │  │
      ├──┼──┼──┼──┤   de A     ├──┼──┼──┼──┤
      │  │  │  │  │ (anda      │  │▓▓│  │  │
      └──┴──┴──┴──┘  p/ dir.)  └──┴──┴──┴──┘
                C[bloco] += A[tile k] · B[tile k],  k = 0, 1, ...
```

Com tile $T \times T$, cada elemento carregado da memória global é reutilizado $T$ vezes. A intensidade sobe em um fator de aproximadamente $T$.

**Nível 2 — tiling em registradores (register blocking).** Cada thread calcula um micro-tile (ex.: 8×8) de $C$ em registradores. Para cada passo em $k$, ela carrega 8 valores de $A$ e 8 de $B$ da shared memory e faz 64 multiplicações-somas. Reuso dentro da thread, menos leituras da shared memory.

**Nível 3 — leituras vetorizadas e layout.** Ler `float4` (16 bytes) por instrução, transpor $A$ na shared memory para leituras sem conflito de banco, alinhar tudo.

**Nível 4 — pipeline (double buffering).** Enquanto o bloco calcula com o tile atual, já carrega o próximo (cópias assíncronas `cp.async` na Ampere, TMA na Hopper). O cálculo esconde a latência da memória.

**Nível 5 — tensor cores.** Trocar as multiplicações escalares por instruções MMA. Isso muda a ordem de grandeza do pico disponível.

```text
 Desempenho relativo típico (FP32, ilustrativo)

 ingênuo              ██                      poucos % do cuBLAS
 tiling shared        ██████
 + register tiling    ██████████████
 + vetorização        ████████████████
 + double buffering   ██████████████████      perto do cuBLAS
 cuBLAS (FP32)        ████████████████████
```

As proporções exatas dependem da GPU e do tamanho da matriz. Mas a ordem das otimizações e o porquê de cada uma é exatamente o que o entrevistador quer ouvir. O código completo de cada nível está no [Capítulo 5](#cap-05) ([Q033](#q033)).

## Perguntas de entrevista comentadas

## Q017 — Explique o modelo de execução do CUDA, a hierarquia de memória e a ocupação (occupancy). Depois, otimize uma GEMM com tiling e coalescing. {#q017}

::: pergunta-meta
**[Relatado]** NVIDIA · vaga de software de GPU · triagem · listada em 2026 · Difícil · [fonte](https://prachub.com/interview-questions/optimize-cuda-gemm-with-tiling-and-coalescing)
:::

### Resposta em 30 segundos

"Um kernel roda como uma grade de blocos; cada bloco vai inteiro para um SM e é dividido em warps de 32 threads que executam a mesma instrução (SIMT). A memória vai de registradores (por thread) a shared memory (por bloco), L2 (global) e HBM. Occupancy é a fração de warps ativos por SM, limitada por registradores, shared memory e tamanho do bloco, e serve para esconder latência. Para a GEMM: começo com uma thread por elemento, que tem intensidade de 0,25 FLOP/byte; faço tiling com shared memory para reaproveitar cada elemento T vezes; garanto que threads vizinhas leiam endereços vizinhos ao carregar os tiles (coalescing); depois uso micro-tiles em registradores, leituras vetorizadas, double buffering e, se a precisão permitir, tensor cores."

### Resposta completa

Divida em duas partes e use diagramas.

**Parte 1 — conceitos.** Use as seções [3.3](#cap-03) a [3.5](#cap-03): grid → bloco → warp → thread; SIMT e divergência; a tabela da hierarquia de memória; occupancy e seus limites, com uma conta rápida. Diga explicitamente que occupancy alta não é o objetivo, e sim esconder latência.

**Parte 2 — a GEMM com tiling.** Escreva o kernel com shared memory. É o código mais pedido em entrevistas de GPU:

```cuda
#define TILE 32

__global__ void gemm_tiled(const float* A, const float* B,
                           float* C, int M, int N, int K) {
    __shared__ float As[TILE][TILE];
    __shared__ float Bs[TILE][TILE + 1];  // padding: sem conflito

    int tx = threadIdx.x, ty = threadIdx.y;
    int lin = blockIdx.y * TILE + ty;     // linha de C
    int col = blockIdx.x * TILE + tx;     // coluna de C
    float acc = 0.0f;

    for (int k0 = 0; k0 < K; k0 += TILE) {
        // Carga coalescida: threads com tx vizinhos leem
        // endereços vizinhos (mesma linha, colunas seguidas).
        As[ty][tx] = (lin < M && k0 + tx < K)
                   ? A[lin * K + k0 + tx] : 0.0f;
        Bs[ty][tx] = (k0 + ty < K && col < N)
                   ? B[(k0 + ty) * N + col] : 0.0f;
        __syncthreads();          // tiles prontos para todos

        #pragma unroll
        for (int k = 0; k < TILE; ++k)
            acc += As[ty][k] * Bs[k][tx];
        __syncthreads();          // antes de sobrescrever
    }
    if (lin < M && col < N) C[lin * N + col] = acc;
}
// lançamento: dim3 bloco(TILE, TILE);
// dim3 grade((N + TILE - 1) / TILE, (M + TILE - 1) / TILE);
```

Explique cada decisão:

- **Coalescing**: `threadIdx.x` varia mais rápido dentro do warp. Por isso ele indexa a **coluna** na leitura de `A` (dentro de uma linha) e de `B`. As 32 threads de um warp leem 32 floats seguidos.
- **Dois `__syncthreads()`**: o primeiro garante que o tile está completo antes do cálculo; o segundo, que ninguém sobrescreve o tile enquanto outras threads ainda o usam.
- **Bordas**: matrizes que não são múltiplas de 32 recebem zero fora dos limites.
- **Padding**: no laço interno, `As[ty][k]` é o mesmo endereço para todas as threads do warp (broadcast), e `Bs[k][tx]` lê endereços consecutivos de uma linha (bancos diferentes). Com esse padrão específico o padding não é estritamente necessário, mas ele evita conflitos se você mudar o padrão de acesso, como ao transpor um tile.
- **Reuso**: cada elemento carregado da memória global é usado 32 vezes. A intensidade passa de 0,25 para cerca de 8 FLOP/byte.

Depois, diga qual seria o próximo passo e por quê: "Esse kernel ainda faz duas leituras de shared memory por multiplicação-soma. O próximo nível é cada thread calcular um micro-tile de 4×4 ou 8×8 em registradores, o que divide as leituras de shared memory por 4 a 8."

::: dica
**Dica de entrevista:** antes de escrever código, faça a conta de intensidade aritmética de cada versão. Mostra que você otimiza com base em um modelo, não por tentativa e erro.
:::

### Perguntas de acompanhamento prováveis

- **Por que 32×32 e não 64×64?** Um bloco de 64×64 threads teria 4.096 threads, acima do limite de 1.024. Para tiles maiores, cada thread precisa calcular vários elementos (register tiling). Tiles maiores aumentam o reuso, mas consomem mais shared memory e registradores e reduzem a occupancy.
- **Como você verificaria se os acessos estão coalescidos?** No Nsight Compute, olhando os setores por requisição na seção de memória: em acessos de 4 bytes perfeitamente coalescidos, são 4 setores por requisição de warp. Valores maiores indicam desperdício.
- **O que é `__syncthreads()` dentro de um `if`?** Um bug: se só parte das threads do bloco chega ao barrier, o comportamento é indefinido (normalmente trava).
- **Quando a GEMM fica memory-bound mesmo com tiling?** Quando uma dimensão é pequena, como no decode (M = tamanho do batch, às vezes 1 a 16). Aí não há reuso suficiente de B, e o kernel vira, na prática, uma GEMV limitada pela leitura dos pesos.

### Armadilhas comuns

- Esquecer o segundo `__syncthreads()`.
- Indexar com `threadIdx.y` na dimensão contígua e destruir o coalescing.
- Confundir occupancy com desempenho.
- Não tratar bordas quando M, N, K não são múltiplos do tile.

## Q018 — Explique a lei de Amdahl e como ela se aplica à multiplicação de matrizes em GPU e aos ganhos de velocidade de ponta a ponta. {#q018}

::: pergunta-meta
**[Relatado]** NVIDIA · Software Engineer · rodada de fundamentos · listada em 2026 · Médio · [fonte](https://prachub.com/interview-questions/explain-amdahl-s-law-and-gpu-matmul-optimization)
:::

### Resposta em 30 segundos

"Amdahl diz que, se uma fração p do tempo fica s vezes mais rápida, o speedup total é 1/((1−p) + p/s), e o teto é 1/(1−p). Numa GEMM em GPU, a parte paralela é o cálculo dentro do kernel, mas há partes que não aceleram: cópias CPU↔GPU, lançamento do kernel, as bordas e a fase final em que poucos blocos sobram para poucos SMs. De ponta a ponta, se as GEMMs são 60% do passo de decode e eu as deixo 2× mais rápidas, o passo fica só 1,43× mais rápido. Por isso eu meço o perfil inteiro antes de escolher o que otimizar."

### Resposta completa

**A fórmula e o teto.** Mostre a fórmula da seção [3.7](#cap-03) e o caso limite: com $p = 0{,}9$, mesmo com $s = \infty$, o máximo é 10×.

**Aplicação 1 — dentro de um kernel de GEMM.** Mesmo um kernel "100% paralelo" tem partes seriais ou mal paralelizadas:

```text
 Tempo de uma GEMM pequena na GPU
 ├── lançamento do kernel (CPU → GPU)       alguns µs
 ├── "rampa" de início (blocos subindo)
 ├── corpo: todos os SMs ocupados           ◀ a parte que
 │                                            escala
 └── "cauda" (tail effect): última leva
     de blocos ocupa só parte dos SMs

 Ex.: 140 blocos em 132 SMs → 1ª leva com 132 blocos,
 2ª leva com só 8 → a 2ª leva demora o mesmo que a 1ª
 com 94% dos SMs parados (efeito de quantização das ondas)
```

O efeito de **quantização de ondas** (wave quantization) é um exemplo direto de Amdahl: aumentar o número de SMs não acelera a segunda onda. Soluções: tiles de outro tamanho, **split-K** (dividir o eixo K entre blocos e somar no fim) ou kernels persistentes com escalonamento por **stream-K**.

**Aplicação 2 — GEMM dentro do programa.** Se a matriz está na CPU, você precisa copiar para a GPU pelo PCIe (~64 GB/s por sentido no Gen5, contra ~3.350 GB/s da HBM). Para uma GEMM de 4096×4096×4096 em FP32: 3 matrizes × 64 MB = 192 MB de cópias ≈ 3 ms no PCIe. O cálculo, 137 GFLOP, leva uns 2 ms em FP32 nos CUDA cores de uma H100 e bem menos em TF32 nos tensor cores. A cópia domina, e otimizar o kernel quase não muda o total. Solução: manter dados na GPU, sobrepor cópias e cálculo com streams.

**Aplicação 3 — ponta a ponta na inferência.**

::: conta
**Fazendo a conta:** perfil hipotético de um passo de decode:

| Parte | % do tempo |
|---|---|
| GEMMs (QKV, saída, MLP, LM head) | 60% |
| Atenção (leitura do KV cache) | 25% |
| Normas, ativações, RoPE, sampling | 10% |
| Overhead de CPU / lançamento | 5% |

- GEMMs 2× mais rápidas (quantização FP8): 1 / (0,4 + 0,3) = **1,43×**.
- Atenção 2× mais rápida: 1 / (0,75 + 0,125) = **1,14×**.
- As duas: 1 / (0,15 + 0,3 + 0,125) = **1,74×**.
- Depois disso, os 15% de normas e overhead viram 26% do novo tempo. Fusão de kernels e CUDA graphs passam a ser a melhor alavanca.
:::

**Aplicação 4 — no sistema.** O TTFT inclui fila, tokenização, rede e prefill. Se a fila é 70% do TTFT p99, um prefill 2× mais rápido melhora pouco o p99; o que resolve é capacidade ou scheduling.

**Gustafson como contraponto.** A lei de Gustafson lembra que, com mais recursos, normalmente aumentamos o tamanho do problema (batch maior, contexto maior), e a fração paralela cresce. É por isso que GPUs maiores continuam valendo a pena para cargas que escalam.

### Perguntas de acompanhamento prováveis

- **Como você descobre o p de cada parte?** Com um profiler de linha do tempo (Nsight Systems, `torch.profiler`), somando o tempo por categoria de kernel e os intervalos em que a GPU fica ociosa.
- **Qual a relação entre Amdahl e o overhead de lançamento?** Em decode com batch pequeno, os kernels são curtos e o tempo de CPU para lançá-los vira uma fração serial grande. CUDA graphs reduzem essa fração.
- **Amdahl vale para paralelismo entre GPUs?** Sim. Com tensor parallelism, as comunicações (all-reduce) não diminuem com mais GPUs e podem até crescer; elas viram o teto do speedup.

### Armadilhas comuns

- Prometer speedup total igual ao speedup do kernel.
- Esquecer cópias e lançamento.
- Não saber aplicar a fórmula com números na hora.
- Ignorar o efeito de cauda/ondas em GPUs com muitos SMs.

## Q019 — Como você calcularia uma multiplicação de matrizes de forma eficiente numa GPU sem usar memória compartilhada? {#q019}

::: pergunta-meta
**[Relatado]** NVIDIA · GPU Architect · entrevista · relato antigo, ainda comum · Difícil · [fonte](https://fr.glassdoor.ca/Entretien/NVIDIA-Entretien-E7633-RVW4163393.htm)
:::

### Resposta em 30 segundos

"Sem shared memory, o reuso tem que vir dos registradores e dos caches. Cada thread calcula um micro-tile da saída, por exemplo 8×8, mantido em registradores; a cada passo em K ela carrega 8 valores de A e 8 de B e faz 64 multiplicações-somas, o que dá 8 vezes mais reuso que uma thread por elemento. Organizo as threads para que as leituras sejam coalescidas e para que threads vizinhas leiam os mesmos dados ao mesmo tempo, aproveitando L1 e L2. Também dá para trocar dados entre threads do warp com warp shuffle, que funciona como uma shared memory de warp sem usar a shared memory. E os tensor cores, via mma.sync, operam direto em registradores."

### Resposta completa

O entrevistador quer ver se você entende **por que** a shared memory é usada (reuso de dados entre threads) e se conhece as alternativas. São quatro.

**1. Register tiling (o principal).** Cada thread acumula um bloco $R_M \times R_N$ de $C$ em registradores:

```cuda
// cada thread calcula um micro-tile 4x4 de C
// (versão didática; supõe M e N múltiplos de 4 * dim)
__global__ void gemm_registradores(const float* A,
        const float* B, float* C, int M, int N, int K) {
    int lin0 = (blockIdx.y * blockDim.y + threadIdx.y) * 4;
    int col0 = (blockIdx.x * blockDim.x + threadIdx.x) * 4;
    float acc[4][4] = {};
    for (int k = 0; k < K; ++k) {
        float a[4], b[4];
        #pragma unroll
        for (int i = 0; i < 4; ++i)
            a[i] = __ldg(&A[(lin0 + i) * K + k]);
        #pragma unroll
        for (int j = 0; j < 4; ++j)
            b[j] = __ldg(&B[k * N + col0 + j]);
        #pragma unroll
        for (int i = 0; i < 4; ++i)
            #pragma unroll
            for (int j = 0; j < 4; ++j)
                acc[i][j] += a[i] * b[j];   // 16 FMAs
    }
    for (int i = 0; i < 4; ++i)
        for (int j = 0; j < 4; ++j)
            C[(lin0 + i) * N + col0 + j] = acc[i][j];
}
```

Reuso: 8 leituras para 16 FMAs (2 por leitura), contra 2 leituras por FMA no kernel ingênuo. Com 8×8: 16 leituras para 64 FMAs.

**2. Caches L1 e L2.** Threads de um mesmo warp e de blocos vizinhos leem os mesmos elementos de $A$ e $B$. Com uma boa ordem de execução dos blocos, esses dados ficam no L1 (por SM) e no L2 (50 MB na H100) e são reaproveitados sem voltar à HBM. Truques:

- `__ldg()` ou `const __restrict__` para usar o caminho de leitura somente-leitura.
- **Rasterização em swizzle**: lançar os blocos numa ordem que agrupa tiles vizinhos de $C$ (que compartilham linhas de $A$ e colunas de $B$) para aumentar o acerto no L2.

**3. Warp shuffle.** As instruções `__shfl_sync` deixam uma thread ler um registrador de outra thread do mesmo warp, sem passar pela memória. Uma thread carrega um valor de $B$ e o distribui para as outras 31:

```cuda
// cada lane carrega um elemento de B; todas usam todos
float b_meu = B[k * N + col_base + lane];
#pragma unroll
for (int j = 0; j < 32; ++j) {
    float b_j = __shfl_sync(0xffffffff, b_meu, j);
    acc[j] += a * b_j;   // (acc[] em registradores)
}
```

Isso é uma "shared memory de warp", com custo de uma instrução por troca.

**4. Tensor cores direto dos registradores.** A instrução `mma.sync` (Ampere) recebe os operandos em registradores, distribuídos pelas 32 threads do warp. Dá para alimentar os tensor cores carregando os fragmentos direto da memória global, com acessos bem organizados. Os kernels mais rápidos ainda usam shared memory para reorganizar os dados, mas é possível.

**Comparação honesta.** Sem shared memory, você perde o reuso **entre warps** de um bloco e depende dos caches, que não são controlados por você. Para matrizes grandes, a versão com shared memory (ou TMA na Hopper) vence. Para matrizes **pequenas ou finas** (como no decode, com M pequeno), uma versão só com registradores e shuffle pode ser tão boa quanto ou melhor, porque o problema é memory-bound de qualquer jeito e evita o overhead de sincronização.

### Perguntas de acompanhamento prováveis

- **Qual o limite do register tiling?** Registradores por thread (máximo de 255). Micro-tiles grandes usam muitos registradores, reduzem a occupancy e podem causar spilling (registradores derramados para a memória local, que é lenta).
- **Como o compilador sabe deixar `acc[4][4]` em registradores?** Os índices precisam ser constantes em tempo de compilação (laços com `#pragma unroll`). Indexação dinâmica força o array para a memória local.
- **O L1 e a shared memory não são a mesma memória física?** São, na maioria das gerações recentes; a divisão é configurável. Usar shared memory é controlar explicitamente o que fica ali, em vez de deixar o cache decidir.

### Armadilhas comuns

- Responder "não dá para ser eficiente". Dá, com registradores, caches e shuffle.
- Esquecer o coalescing ao ler direto da memória global.
- Usar arrays indexados dinamicamente e causar spilling.
- Não discutir quando essa abordagem é de fato competitiva (matrizes finas, memory-bound).

## Q020 — Fale de um kernel CUDA que você escreveu: as otimizações, os desafios e exatamente o que você fez. {#q020}

::: pergunta-meta
**[Relatado]** NVIDIA · Deep Learning Software Engineer, Inference · triagem com o gestor da vaga · 2025 · Médio · [fonte](https://www.datainterview.com/courses/nvidia-inference-engineer/the-loop)
:::

### Resposta em 30 segundos

"Escrevi um kernel fundido de RMSNorm com quantização FP8 para a entrada das GEMMs do decode. Antes eram dois kernels, cada um lendo e escrevendo o tensor inteiro na HBM. Medindo, vi que os dois juntos eram 9% do passo de decode e estavam a uns 40% da banda de pico. Fundi os dois, fiz uma redução por warp com shuffle, usei leituras vetorizadas de 16 bytes e um bloco por linha. Chegou a uns 85% da banda e o passo ficou 6% mais rápido. O desafio maior foi a corretude numérica do fator de escala do FP8, que validei contra a referência em PyTorch."

### Resposta completa

Assim como a [Q001](#q001), esta é uma pergunta de história. Mas aqui o gestor quer **detalhe técnico real**: ele vai fazer perguntas até o nível de registradores e instruções para ver se foi você mesmo que escreveu. Prepare uma história que você domine por completo.

**Estrutura recomendada:**

```text
 1. O QUE o kernel faz (1 frase) e POR QUE ele importava
    (que % do tempo, qual métrica de negócio)
 2. COMO você mediu o ponto de partida (profiler, % da banda
    ou do pico de FLOPS, roofline)
 3. A HIPÓTESE (memory-bound? compute-bound? latência?)
 4. As OTIMIZAÇÕES, em ordem, com o ganho de cada uma
 5. O DESAFIO mais difícil (bug, corretude numérica,
    caso de borda) e como resolveu
 6. O RESULTADO (kernel e ponta a ponta) e o que faria
    a seguir
```

**Exemplo de história completa** (um modelo para você adaptar; use a sua experiência real):

> "**Contexto.** No nosso serviço de decode, depois de passar as GEMMs para FP8, o perfil mostrou que RMSNorm seguida da quantização para FP8 da entrada da próxima GEMM somava uns 9% do tempo do passo. Eram dois kernels separados: a RMSNorm lia o tensor em BF16 e escrevia em BF16; a quantização lia de novo, calculava o máximo absoluto e escrevia em FP8.
>
> **Medição.** No Nsight Compute, os dois estavam em uns 40% da banda de pico da HBM, e não havia motivo para serem outra coisa além de memory-bound: poucos FLOPs por byte.
>
> **Hipótese.** O desperdício era duplo: tráfego extra (o tensor intermediário em BF16 ia e voltava da HBM) e uma implementação ruim de redução (um bloco por linha, mas usando shared memory com muitos `__syncthreads`).
>
> **Otimizações.** (1) Fundi os dois em um kernel: lê BF16 uma vez, escreve FP8 uma vez. Isso cortou o tráfego em pouco mais de metade. (2) Para a soma dos quadrados, fiz a redução dentro do warp com `__shfl_xor_sync` e só um passo pela shared memory para combinar os warps. (3) Leituras de 16 bytes (8 valores BF16 por instrução). (4) Para a linha de 4.096 elementos, usei 512 threads por linha, cada uma com 8 elementos em registradores, então os dados eram lidos da HBM uma única vez, mesmo eu precisando deles duas vezes (soma dos quadrados e normalização).
>
> **Desafio.** O fator de escala do FP8. Na primeira versão, eu usava um fator por tensor, calculado num kernel anterior, e havia saturação em algumas camadas com outliers. Passei a usar um fator por linha (por token), calculado no próprio kernel depois da normalização, o que exigiu uma segunda redução (máximo absoluto) na mesma passada. Validei comparando com uma referência em PyTorch em FP32: erro máximo dentro do esperado para FP8, e a avaliação de qualidade do modelo ficou igual.
>
> **Resultado.** O kernel fundido chegou a uns 85% da banda de pico. O tempo das duas operações caiu de 9% para uns 3% do passo, e o passo ficou uns 6% mais rápido, o que, pela lei de Amdahl, era o esperado. O próximo passo seria fundir isso direto no prólogo da GEMM, eliminando a escrita em FP8."

Por que essa história funciona: tem números, um modelo mental (memory-bound → reduzir bytes), uma sequência de decisões justificadas, um desafio real de corretude e uma conexão com o ganho de ponta a ponta.

### Perguntas de acompanhamento prováveis

- **Por que 512 threads por linha?** Para que cada thread ficasse com um número pequeno de elementos em registradores e para ter warps suficientes para esconder latência. Esteja pronto para justificar o seu número com uma conta de occupancy ([3.5](#cap-03)).
- **Como você testou a corretude?** Comparação com referência de alta precisão, tolerâncias definidas por formato, testes com tamanhos de borda (linhas não múltiplas de 8, valores extremos, zeros, NaN).
- **O que o Nsight mostrou depois?** Throughput de memória perto do pico; se não estiver, explique o que limitava (por exemplo, latência por falta de bytes em voo).
- **Por que não usar uma biblioteca?** Às vezes não existe a fusão exata de que você precisa. Mostre que você verificou as opções antes de escrever código próprio.

### Armadilhas comuns

- Contar uma história que você não domina até o fim. O gestor vai cavar.
- Falar só do que funcionou. Os desafios mostram mais senioridade.
- Não ter números antes e depois.
- Não conectar o ganho do kernel ao ganho de ponta a ponta (Amdahl).

## Resumo do capítulo

- A GPU é uma máquina de throughput: muitos SMs, cada um com milhares de threads residentes, escondendo a latência da memória trocando de warp.
- Hierarquia lógica: grid → bloco (um SM, shared memory, `__syncthreads`) → warp (32 threads, SIMT) → thread.
- Hierarquia de memória: registradores → shared/L1 → L2 → HBM. Cada nível abaixo é muito maior e muito mais lento.
- **Coalescing**: threads vizinhas lendo endereços vizinhos. **Bank conflicts**: threads acessando endereços diferentes no mesmo banco da shared memory; padding resolve.
- **Occupancy** = warps ativos / máximo; limitada por registradores, shared memory e tamanho do bloco. Serve para esconder latência; não é o objetivo final.
- Tensor cores dão uma ordem de grandeza a mais de FLOPS para GEMMs (~989 TFLOPS BF16 vs ~67 TFLOPS FP32 na H100).
- **Amdahl**: speedup = 1 / ((1 − p) + p/s). A parte não otimizada vira o teto.
- GEMM: ingênua (0,25 FLOP/byte) → tiling em shared → tiling em registradores → vetorização → double buffering → tensor cores.

## Checklist para a entrevista

- [ ] Explico grid, bloco, warp e thread e como viram hardware.
- [ ] Explico divergência de warp com um exemplo.
- [ ] Recito a hierarquia de memória com tamanhos e latências aproximadas.
- [ ] Mostro um acesso coalescido e um não coalescido.
- [ ] Explico bank conflicts e o truque do padding.
- [ ] Calculo a occupancy de um kernel a partir de registradores e shared memory.
- [ ] Escrevo de memória a GEMM com tiling em shared memory, com os dois `__syncthreads`.
- [ ] Explico como fazer GEMM eficiente sem shared memory.
- [ ] Aplico Amdahl com números a um passo de decode.
- [ ] Tenho uma história de kernel com medição, hipótese, otimizações, desafio e resultado.
