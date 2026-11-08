# Capítulo 5 — Kernels CUDA e Triton {#cap-05}

Este é o capítulo "mão na massa". Nos capítulos 3 e 4 você aprendeu como a GPU funciona e como diagnosticar desempenho. Aqui você vai ver os kernels completos que mais caem em entrevista: a multiplicação de matrizes em FP32 com todas as otimizações clássicas, a redução determinística, e kernels em Triton. No fim, a visão de cima: como motores inteiros como o vLLM e o TensorRT-LLM juntam kernels, scheduler e gerenciamento de memória.

Em entrevistas de código para GPU, o entrevistador avalia três coisas: **o kernel está correto** (bordas, sincronização, índices), **você sabe explicar cada decisão de desempenho**, e **você sabe dizer qual seria o próximo passo**. Treine escrever estes kernels à mão, sem compilador, e explicar em voz alta.

## 5.1 Esqueleto de um programa CUDA

Todo programa CUDA de teste segue o mesmo roteiro:

```cuda
#include <cstdio>
#include <cuda_runtime.h>

// macro para checar erros: TODA chamada da API pode falhar
#define CHECK(x) do { cudaError_t e = (x);                   \
    if (e != cudaSuccess) {                                   \
        printf("CUDA: %s (%s:%d)\n", cudaGetErrorString(e),   \
               __FILE__, __LINE__);                           \
        exit(1); } } while (0)

int main() {
    // 1. aloca e preenche dados no host (CPU)
    // 2. aloca na GPU:          CHECK(cudaMalloc(...))
    // 3. copia host -> GPU:     CHECK(cudaMemcpy(..., H2D))
    // 4. lança o kernel:        kernel<<<grade, bloco>>>(...)
    //    checa o lançamento:    CHECK(cudaGetLastError())
    // 5. copia GPU -> host:     CHECK(cudaMemcpy(..., D2H))
    // 6. confere com uma referência na CPU
    // 7. libera a memória:      cudaFree(...)
}
```

Dois detalhes que mostram experiência:

- **Erros de kernel são assíncronos.** Um acesso fora dos limites dentro do kernel só aparece na próxima chamada que sincroniza. Para depurar, use `cudaDeviceSynchronize()` logo depois do lançamento e a ferramenta `compute-sanitizer`.
- **Sempre compare com uma referência.** Um kernel rápido e errado não vale nada.

## 5.2 GEMM FP32 completa, em três versões

O problema: $C = A \cdot B$, com $A$ de $M \times K$, $B$ de $K \times N$, tudo em FP32 e row-major. Vamos do ingênuo até o tiling 2D em registradores. A versão ingênua e a versão com shared memory já apareceram no [Capítulo 3](#cap-03) ([Q017](#q017)). Aqui está a terceira, que é a que separa candidatos medianos dos bons.

### Tiling 2D em registradores

A ideia em duas camadas:

1. **Bloco**: calcula um tile de $C$ de $BM \times BN$ (128 × 128). A cada iteração em $K$, carrega na shared memory um tile de $A$ ($BM \times BK$) e um de $B$ ($BK \times BN$), com $BK = 8$.
2. **Thread**: calcula $TM \times TN$ (8 × 8 = 64) elementos de $C$ em registradores. São $(128 \times 128) / 64 = 256$ threads por bloco.

```text
                    tile de B na shared (BK × BN = 8 × 128)
                       ┌───────────────────────────────┐
                       │ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ (8 colunas    │
                       │                  por thread)  │
                       └───────────────────────────────┘
 tile de A na shared   ┌───────────────────────────────┐
 (BM × BK = 128 × 8)   │                               │
 ┌──┐                  │   tile de C do bloco          │
 │▒ │ 8 linhas         │   128 × 128                   │
 │▒ │ por thread       │                               │
 │▒ │                  │   cada uma das 256 threads    │
 │  │                  │   acumula 8 × 8 = 64 valores  │
 │  │                  │   em registradores            │
 └──┘                  └───────────────────────────────┘

 Por passo k (de 0 a 7), cada thread:
   lê 8 valores de A e 8 de B da shared  → 16 leituras
   faz 8 × 8 = 64 multiplicações-somas    → 4 FMAs/leitura
```

Um detalhe importante é **quais** linhas e colunas cada thread pega. Se a thread $t$ pegasse 8 colunas **seguidas** ($8t$ a $8t+7$), threads vizinhas leriam endereços separados por 8 floats na shared memory, o que causa conflitos de banco. Em vez disso, cada thread pega colunas **espaçadas** ($t$, $t+16$, $t+32$, ...): threads vizinhas leem endereços vizinhos, sem conflitos, e a escrita final em $C$ também fica coalescida.

```cuda
#include <cuda_runtime.h>

template <int BM, int BN, int BK, int TM, int TN>
__global__ void __launch_bounds__((BM * BN) / (TM * TN))
sgemm_2d(int M, int N, int K,
         const float* __restrict__ A,
         const float* __restrict__ B,
         float* __restrict__ C) {
    constexpr int NT = (BM * BN) / (TM * TN);  // 256 threads
    constexpr int TC = BN / TN;   // 16 threads por linha
    constexpr int TR = BM / TM;   // 16 threads por coluna
    // A transposto na shared (As[k][m]) e +4 de padding:
    // a escrita transposta fica sem conflitos de banco
    __shared__ float As[BK][BM + 4];
    __shared__ float Bs[BK][BN];

    const int bm = blockIdx.y * BM;   // canto do tile de C
    const int bn = blockIdx.x * BN;
    const int tr = threadIdx.x / TC;  // 0..15
    const int tc = threadIdx.x % TC;  // 0..15

    float acc[TM][TN] = {};
    float ra[TM], rb[TN];

    for (int k0 = 0; k0 < K; k0 += BK) {
        // carrega A (BM x BK): 1024 floats, 4 por thread
        for (int i = threadIdx.x; i < BM * BK; i += NT) {
            int r = i / BK, c = i % BK;
            int gr = bm + r, gc = k0 + c;
            As[c][r] = (gr < M && gc < K) ? A[gr * K + gc]
                                          : 0.0f;
        }
        // carrega B (BK x BN): coalescido por linha
        for (int i = threadIdx.x; i < BK * BN; i += NT) {
            int r = i / BN, c = i % BN;
            int gr = k0 + r, gc = bn + c;
            Bs[r][c] = (gr < K && gc < N) ? B[gr * N + gc]
                                          : 0.0f;
        }
        __syncthreads();

        #pragma unroll
        for (int k = 0; k < BK; ++k) {
            #pragma unroll
            for (int i = 0; i < TM; ++i)
                ra[i] = As[k][tr + i * TR];   // espaçado
            #pragma unroll
            for (int j = 0; j < TN; ++j)
                rb[j] = Bs[k][tc + j * TC];   // espaçado
            #pragma unroll
            for (int i = 0; i < TM; ++i)
                #pragma unroll
                for (int j = 0; j < TN; ++j)
                    acc[i][j] += ra[i] * rb[j];
        }
        __syncthreads();
    }

    #pragma unroll
    for (int i = 0; i < TM; ++i) {
        int r = bm + tr + i * TR;
        #pragma unroll
        for (int j = 0; j < TN; ++j) {
            int c = bn + tc + j * TC;
            if (r < M && c < N) C[r * N + c] = acc[i][j];
        }
    }
}
```

E o código do host, com conferência e medição:

```cuda
#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>

int main() {
    const int M = 2048, N = 2048, K = 2048;
    std::vector<float> hA(M * K), hB(K * N), hC(M * N);
    for (auto& v : hA) v = rand() / (float)RAND_MAX - 0.5f;
    for (auto& v : hB) v = rand() / (float)RAND_MAX - 0.5f;

    float *dA, *dB, *dC;
    cudaMalloc(&dA, hA.size() * sizeof(float));
    cudaMalloc(&dB, hB.size() * sizeof(float));
    cudaMalloc(&dC, hC.size() * sizeof(float));
    cudaMemcpy(dA, hA.data(), hA.size() * 4,
               cudaMemcpyHostToDevice);
    cudaMemcpy(dB, hB.data(), hB.size() * 4,
               cudaMemcpyHostToDevice);

    dim3 bloco(256);
    dim3 grade((N + 127) / 128, (M + 127) / 128);
    auto roda = [&] {
        sgemm_2d<128, 128, 8, 8, 8>
            <<<grade, bloco>>>(M, N, K, dA, dB, dC);
    };
    roda();                       // aquecimento
    cudaDeviceSynchronize();

    cudaEvent_t ini, fim;
    cudaEventCreate(&ini);
    cudaEventCreate(&fim);
    cudaEventRecord(ini);
    for (int r = 0; r < 20; ++r) roda();
    cudaEventRecord(fim);
    cudaEventSynchronize(fim);
    float ms = 0;
    cudaEventElapsedTime(&ms, ini, fim);
    ms /= 20;
    double tflops = 2.0 * M * N * K / (ms * 1e-3) / 1e12;
    printf("%.3f ms, %.2f TFLOPS\n", ms, tflops);

    // confere 1000 posições aleatórias contra a CPU
    cudaMemcpy(hC.data(), dC, hC.size() * 4,
               cudaMemcpyDeviceToHost);
    double erro_max = 0;
    for (int t = 0; t < 1000; ++t) {
        int i = rand() % M, j = rand() % N;
        double ref = 0;
        for (int k = 0; k < K; ++k)
            ref += (double)hA[i * K + k] * hB[k * N + j];
        erro_max = fmax(erro_max, fabs(ref - hC[i * N + j]));
    }
    printf("erro máximo: %g\n", erro_max);
    cudaFree(dA); cudaFree(dB); cudaFree(dC);
}
// compilar: nvcc -O3 -arch=sm_90 sgemm.cu -o sgemm
```

### Por que cada decisão

| Decisão | Motivo |
|---|---|
| Tile de bloco 128 × 128 | reuso alto: cada valor carregado da HBM é usado 128 vezes |
| BK = 8 | pouca shared memory por bloco (~8 KB), permite vários blocos por SM |
| Micro-tile 8 × 8 em registradores | 4 FMAs por leitura de shared; antes era 0,5 |
| A transposto na shared | as leituras `As[k][...]` ficam contíguas |
| Padding `BM + 4` | a escrita transposta não tem conflitos de banco |
| Linhas/colunas espaçadas por thread | leituras da shared sem conflito e escrita em C coalescida |
| `__launch_bounds__` | diz ao compilador o máximo de threads, ajudando a alocação de registradores |
| `#pragma unroll` | índices constantes mantêm `acc`, `ra` e `rb` em registradores |

### O que vem depois

Este kernel costuma chegar a uma fração alta do cuBLAS em FP32, mas ainda tem caminho:

1. **Leituras vetorizadas** (`float4`) na carga dos tiles: 4 vezes menos instruções de leitura.
2. **Double buffering**: dois buffers na shared; enquanto calcula com um, carrega o próximo (com `cp.async` na Ampere ou TMA na Hopper).
3. **Warp tiling**: um nível intermediário em que cada warp calcula um sub-tile, para melhorar a localidade nos registradores e preparar o terreno para os tensor cores.
4. **Autotuning** de BM, BN, BK, TM e TN para cada forma de matriz.
5. **Tensor cores** (TF32 ou BF16), se o problema aceitar outra precisão. Isso muda o pico em uma ordem de grandeza.

::: dica
**Dica de entrevista:** se pedirem "implemente uma GEMM rápida", escreva primeiro a versão com shared memory (curta e segura), diga que ela funciona e então descreva o register tiling, escrevendo-o se houver tempo. Um kernel simples e correto vale mais que um kernel ambicioso com bug de índice.
:::

## 5.3 Reduções

Uma **redução** combina muitos valores em um só (soma, máximo, norma). Aparece em todo lugar em LLMs: softmax (máximo e soma), RMSNorm (soma dos quadrados), sampling, cálculo de escalas de quantização. A técnica básica é a **redução em árvore**:

```text
 8 valores, 3 níveis (log2 8):

 nível 0:  a0   a1   a2   a3   a4   a5   a6   a7
            │    │    │    │    │    │    │    │
            └──┬─┼────┼────┼────┘    │    │    │   passo 4
               │ └──┬─┼────┼─────────┘    │    │
 nível 1:   a0+a4 a1+a5 a2+a6 a3+a7
              └───┬─┼──────┘  │                     passo 2
                  │ └───┬─────┘
 nível 2:      s0+s2  s1+s3
                  └──┬──┘                           passo 1
 nível 3:          total
```

Dentro de um warp, a forma mais rápida é o **shuffle**, que troca registradores entre as 32 threads sem passar pela memória:

```cuda
__inline__ __device__ float soma_warp(float v) {
    // ao fim, a lane 0 tem a soma das 32 lanes
    for (int d = 16; d > 0; d /= 2)
        v += __shfl_down_sync(0xffffffff, v, d);
    return v;
}

__inline__ __device__ float max_warp(float v) {
    // com xor, TODAS as lanes terminam com o resultado
    for (int d = 16; d > 0; d /= 2)
        v = fmaxf(v, __shfl_xor_sync(0xffffffff, v, d));
    return v;
}
```

A redução de um vetor inteiro com grid-stride e um atômico por bloco foi mostrada na [Q026](#q026). Ela é rápida, mas **não é determinística**, e isso nos leva à próxima pergunta de entrevista.

### Por que reduções em float não são determinísticas

Soma em ponto flutuante não é associativa:

$$(10^{20} + (-10^{20})) + 1 = 1 \qquad \text{mas} \qquad 10^{20} + ((-10^{20}) + 1) = 0$$

Com `atomicAdd`, a ordem em que os blocos somam no resultado depende de qual bloco termina primeiro, o que muda de execução para execução. O resultado varia nos últimos bits. Em inferência isso importa porque:

- Testes de regressão "bit a bit" falham sem motivo.
- Com greedy decoding, uma diferença minúscula num logit pode trocar o token escolhido e mudar a resposta inteira a partir dali.
- Depurar fica muito difícil quando nada se repete.

## 5.4 Triton

**Triton** (OpenAI) é uma linguagem embutida em Python para escrever kernels de GPU. Em vez de programar threads individuais, você programa **blocos**: cada instância do programa opera sobre vetores e matrizes inteiros, e o compilador cuida de distribuir o trabalho entre threads, coalescer acessos, usar a shared memory e gerar instruções de tensor core.

```text
 CUDA                                 Triton
 ─────────────────────────────────    ─────────────────────────────
 você controla cada thread            você controla cada bloco
 threadIdx, blockIdx                  tl.program_id, tl.arange
 shared memory manual                 automática
 __syncthreads manual                 automático
 coalescing por sua conta             compilador cuida
 mma.sync / WMMA para tensor cores    tl.dot
 máximo controle                      ~80–100% do desempenho em muitos
                                      kernels, com muito menos código
```

Por isso Triton virou o padrão para kernels customizados em PyTorch: o `torch.compile` (Inductor) gera Triton, e muitos motores de inferência têm kernels de atenção, MoE e quantização escritos em Triton.

### Softmax por linha em Triton

```python
import torch
import triton
import triton.language as tl

@triton.jit
def softmax_kernel(saida, entrada, stride_e, stride_s,
                   n_cols, BLOCO: tl.constexpr):
    linha = tl.program_id(0)          # uma instância por linha
    cols = tl.arange(0, BLOCO)        # vetor de índices
    mask = cols < n_cols              # BLOCO é potência de 2
    x = tl.load(entrada + linha * stride_e + cols,
                mask=mask, other=-float("inf"))
    x = x - tl.max(x, axis=0)         # estabilidade numérica
    num = tl.exp(x)
    y = num / tl.sum(num, axis=0)
    tl.store(saida + linha * stride_s + cols, y, mask=mask)

def softmax(x: torch.Tensor) -> torch.Tensor:
    n_lin, n_cols = x.shape
    y = torch.empty_like(x)
    BLOCO = triton.next_power_of_2(n_cols)
    softmax_kernel[(n_lin,)](y, x, x.stride(0), y.stride(0),
                             n_cols, BLOCO=BLOCO)
    return y

x = torch.randn(1024, 3000, device="cuda")
assert torch.allclose(softmax(x), torch.softmax(x, dim=1),
                      atol=1e-6)
```

O kernel inteiro é um softmax **fundido**: lê cada linha uma vez, calcula máximo, exponencial e soma em registradores e escreve uma vez. O PyTorch eager faria várias passadas pela memória.

### Multiplicação de matrizes em Triton

```python
@triton.jit
def matmul_kernel(a, b, c, M, N, K,
                  s_am, s_ak, s_bk, s_bn, s_cm, s_cn,
                  BM: tl.constexpr, BN: tl.constexpr,
                  BK: tl.constexpr):
    pid_m = tl.program_id(0)
    pid_n = tl.program_id(1)
    rm = pid_m * BM + tl.arange(0, BM)
    rn = pid_n * BN + tl.arange(0, BN)
    rk = tl.arange(0, BK)
    acc = tl.zeros((BM, BN), dtype=tl.float32)
    for k0 in range(0, K, BK):
        kk = k0 + rk
        pa = a + rm[:, None] * s_am + kk[None, :] * s_ak
        pb = b + kk[:, None] * s_bk + rn[None, :] * s_bn
        ma = (rm[:, None] < M) & (kk[None, :] < K)
        mb = (kk[:, None] < K) & (rn[None, :] < N)
        ta = tl.load(pa, mask=ma, other=0.0)
        tb = tl.load(pb, mask=mb, other=0.0)
        acc += tl.dot(ta, tb)        # tensor cores
    pc = c + rm[:, None] * s_cm + rn[None, :] * s_cn
    mc = (rm[:, None] < M) & (rn[None, :] < N)
    tl.store(pc, acc.to(c.dtype.element_ty), mask=mc)

def matmul(a, b, BM=128, BN=128, BK=32):
    M, K = a.shape
    _, N = b.shape
    c = torch.empty((M, N), device=a.device, dtype=a.dtype)
    grade = (triton.cdiv(M, BM), triton.cdiv(N, BN))
    matmul_kernel[grade](a, b, c, M, N, K,
                         a.stride(0), a.stride(1),
                         b.stride(0), b.stride(1),
                         c.stride(0), c.stride(1),
                         BM=BM, BN=BN, BK=BK)
    return c
```

Compare com a GEMM em CUDA da seção 5.2: o mesmo tiling, em 30 linhas. Para chegar ao desempenho do cuBLAS, versões de produção adicionam `@triton.autotune` (testa várias configurações de BM/BN/BK, `num_warps` e `num_stages`), reordenação dos blocos para melhorar o acerto na L2 e epílogos fundidos.

### Quando usar CUDA e quando usar Triton

- **Triton**: fusões de operações elemento a elemento e reduções, variantes de atenção, kernels de quantização, protótipos rápidos. Ótimo custo-benefício.
- **CUDA/CUTLASS/CuTe**: quando você precisa de controle total (layouts especiais, recursos novos do hardware antes de o Triton suportar, os últimos 10–20% de desempenho em kernels críticos como atenção e GEMM em FP8).

## Perguntas de entrevista comentadas

## Q033 — Implemente um kernel CUDA FP32 de alto desempenho para C = A·B (A é m×k, B é k×n) e explique suas escolhas de arquitetura. {#q033}

::: pergunta-meta
**[Relatado]** NVIDIA · vaga de software de GPU · triagem · listada em 2026 · Difícil · [fonte](https://prachub.com/interview-questions/implement-cuda-tiled-matrix-multiplication-and-explain-architecture)
:::

### Resposta em 30 segundos

"Uso tiling em dois níveis. Cada bloco de 256 threads calcula um tile de 128×128 de C, carregando em cada iteração um tile 128×8 de A (transposto na shared) e 8×128 de B. Cada thread calcula 8×8 elementos em registradores, com linhas e colunas espaçadas para não ter conflito de banco e para escrever C de forma coalescida. A intensidade aritmética sai de 0,25 FLOP/byte no kernel ingênuo para dezenas por byte da HBM, e a shared memory deixa de ser gargalo porque cada leitura dela alimenta 4 FMAs. Trato as bordas com máscaras, confiro contra a CPU e meço TFLOPS com CUDA events. Os próximos passos seriam float4, double buffering com cp.async e autotuning."

### Resposta completa

Use a sequência de três versões:

1. **Ingênua** ([Capítulo 3](#cap-03)): uma thread por elemento. Correta, simples, lenta. Escreva em 1 minuto para ter uma referência.
2. **Tiling em shared memory** ([Q017](#q017)): reuso de 32×; dois `__syncthreads()`; coalescing nas cargas.
3. **Tiling 2D em registradores** (seção [5.2](#cap-05)): reuso em shared e em registradores.

Para cada uma, faça a conta de reuso:

::: conta
**Fazendo a conta: bytes da HBM por FLOP.** Para um tile de bloco $BM \times BN$, a cada passo de $BK$:

- Bytes lidos da HBM: $(BM + BN) \times BK \times 4$.
- FLOPs: $2 \times BM \times BN \times BK$.
- Intensidade: $\frac{2 \cdot BM \cdot BN}{4 (BM + BN)}$.

Com 32×32: 2 × 1.024 / (4 × 64) = **8 FLOP/byte**.
Com 128×128: 2 × 16.384 / (4 × 256) = **32 FLOP/byte**.

O pico FP32 de uma H100 é ~67 TFLOPS e a banda é 3,35 TB/s, então o ponto de equilíbrio em FP32 nos CUDA cores é ~20 FLOP/byte. O tile de 32×32 ainda é limitado por memória; o de 128×128 passa do ponto de equilíbrio. Esse é o argumento quantitativo para tiles grandes (com a ajuda da L2, que reduz ainda mais o tráfego real).
:::

E a conta para a shared memory: no kernel 2, cada FMA lê 2 floats da shared. A banda da shared memory é alta, mas não infinita; com o micro-tile 8×8, cada leitura alimenta 4 FMAs, e a shared deixa de limitar.

Explique a **arquitetura** (o "explain your architecture choices" do enunciado):

- **Por que 256 threads**: 8 warps por bloco; com ~8 KB de shared por bloco e uns 128 registradores por thread, cabem 2 blocos por SM (os registradores limitam). São 16 warps por SM: occupancy baixa (25%), mas cada thread tem 64 FMAs independentes por passo: ILP de sobra para esconder a latência da shared memory.
- **Por que BK = 8**: equilíbrio entre shared memory por bloco, número de sincronizações por FLOP e registradores.
- **Por que transpor A**: para que as leituras de `As[k][...]` sejam contíguas no índice de linha da matriz.

Termine com a precisão: "Em FP32, a ordem de soma muda em relação à CPU; comparo com tolerância relativa ao tamanho de K. Se a aplicação aceitar TF32 ou BF16, os tensor cores multiplicam o pico disponível."

### Perguntas de acompanhamento prováveis

- **Quantos registradores esse kernel usa?** 64 acumuladores + 16 para `ra` e `rb` + índices e ponteiros: perto de 100 a 128. Confira com `nvcc --resource-usage` ou `-Xptxas -v`.
- **Como você lidaria com matrizes que não são múltiplas de 128?** As máscaras (`gr < M`, etc.) já tratam. Para desempenho, uma alternativa é ter um caminho rápido sem checagens para os tiles internos e um caminho com checagens só para as bordas.
- **E se M for pequeno, como no decode?** Com M = 8, um tile de 128 linhas desperdiça 94% do trabalho. Use tiles com BM pequeno, split-K ou um kernel tipo GEMV que distribui N e K entre os blocos.
- **Por que não usar o cuBLAS?** Em produção, usaria. Escrever o kernel mostra que você entende o que o cuBLAS faz e permite fusões que a biblioteca não oferece.

### Armadilhas comuns

- Bug de índice ao misturar linha e coluna entre A, B e C.
- Esquecer as bordas.
- Usar arrays indexados dinamicamente e jogar `acc` para a memória local.
- Não ter uma forma de verificar o resultado.
- Não saber calcular a intensidade aritmética das versões.

## Q034 — Projete uma redução CUDA determinística que garanta uma ordem de redução bem definida. (Dica dada: parecido com prefix sum.) {#q034}

::: pergunta-meta
**[Relatado]** Applied (empresa listada) · Fundamentos de engenharia de software · listada em 2026 · Difícil · [fonte](https://prachub.com/interview-questions/design-ordered-cuda-reduction)
:::

### Resposta em 30 segundos

"O não determinismo vem dos atômicos e de qualquer coisa que dependa da ordem de execução dos blocos. Eu fixo a estrutura da árvore: divido a entrada em folhas de tamanho fixo, por exemplo 2.048 elementos; cada bloco reduz uma folha numa ordem fixa, primeiro em registradores e depois numa árvore em shared memory com passos fixos, e escreve o parcial num vetor, na posição do seu índice. Depois aplico o mesmo kernel ao vetor de parciais, nível por nível, até sobrar um valor. É a fase de subida (up-sweep) de um prefix sum. Como a árvore só depende do tamanho da entrada e das constantes, o resultado é bit a bit igual em toda execução e em qualquer GPU com a mesma aritmética."

### Resposta completa

**Primeiro, defina o que é "determinístico".** Há dois níveis:

1. **Reprodutível**: mesma entrada, mesma GPU, mesma configuração → mesmo resultado, bit a bit. Basta eliminar a dependência da ordem de execução.
2. **Independente de configuração**: o resultado não muda se você trocar o número de blocos ou a GPU (mais ou menos SMs). Exige que a forma da árvore dependa só de $n$ e de constantes, nunca de `gridDim` ou do número de SMs.

O design abaixo atende os dois.

```text
 Entrada (n elementos), folhas de tamanho fixo F = 2048

 [──── folha 0 ────][──── folha 1 ────][──── folha 2 ────] ...
         │                  │                  │
   bloco 0 reduz      bloco 1 reduz      bloco 2 reduz
   em ordem fixa      em ordem fixa      em ordem fixa
         ▼                  ▼                  ▼
 parciais nível 1:  [ p0 ][ p1 ][ p2 ] ... (n/F valores)
                         │
          o MESMO kernel aplicado de novo
                         ▼
 parciais nível 2:  [ q0 ][ q1 ] ...       (n/F² valores)
                         ▼
                       total
```

O código:

```cuda
constexpr int BLOCO = 256;            // threads por bloco
constexpr int POR_THREAD = 8;         // elementos por thread
constexpr int FOLHA = BLOCO * POR_THREAD;   // 2048

__global__ void reduz_nivel(const float* __restrict__ x,
                            float* __restrict__ parciais,
                            int n) {
    __shared__ float s[BLOCO];
    const int base = blockIdx.x * FOLHA;

    // 1. cada thread soma seus 8 elementos em ordem fixa;
    //    o índice base + i*BLOCO + tid mantém a leitura
    //    coalescida
    float acc = 0.0f;
    #pragma unroll
    for (int i = 0; i < POR_THREAD; ++i) {
        int idx = base + i * BLOCO + threadIdx.x;
        if (idx < n) acc += x[idx];
    }

    // 2. árvore em shared memory com passos fixos
    s[threadIdx.x] = acc;
    __syncthreads();
    for (int passo = BLOCO / 2; passo > 0; passo /= 2) {
        if (threadIdx.x < passo)
            s[threadIdx.x] += s[threadIdx.x + passo];
        __syncthreads();
    }

    // 3. escreve na posição do bloco: sem atômicos
    if (threadIdx.x == 0) parciais[blockIdx.x] = s[0];
}

// host: aplica níveis até sobrar 1 valor
float soma_deterministica(const float* d_x, int n,
                          float* d_buf1, float* d_buf2) {
    const float* entrada = d_x;
    float* saida = d_buf1;
    while (true) {
        int blocos = (n + FOLHA - 1) / FOLHA;
        reduz_nivel<<<blocos, BLOCO>>>(entrada, saida, n);
        if (blocos == 1) break;
        n = blocos;
        entrada = saida;
        saida = (saida == d_buf1) ? d_buf2 : d_buf1;
    }
    float total;
    cudaMemcpy(&total, saida, sizeof(float),
               cudaMemcpyDeviceToHost);
    return total;
}
```

Por que isso é determinístico:

- Cada thread soma sempre os mesmos elementos, na mesma ordem.
- A árvore da shared memory tem passos fixos: o par que é somado em cada posição não depende do tempo.
- Cada bloco escreve num endereço próprio: nenhuma corrida.
- O número de níveis e o tamanho de cada nível dependem só de $n$.

**A conexão com prefix sum.** O algoritmo de Blelloch para prefix sum tem duas fases: **up-sweep** (uma redução em árvore que deixa somas parciais em posições fixas) e **down-sweep** (que distribui os prefixos). A redução determinística é exatamente o up-sweep. Se o entrevistador pedir um prefix sum depois, você reaproveita a mesma estrutura, guardando os parciais de cada nível.

**Custo.** Comparado com a versão com atômicos ([Q026](#q026)), há lançamentos extras (um por nível; com $n$ = 100 milhões e folhas de 2.048, são 3 níveis) e uma escrita do vetor de parciais. Ambos são desprezíveis perto da leitura da entrada. A versão determinística continua perto do pico de banda.

**Indo além: precisão.** Determinismo não é exatidão. Para somas longas com valores de magnitudes muito diferentes, você pode:

- Acumular em FP64 dentro do bloco.
- Usar **soma compensada de Kahan** para reduzir o erro de arredondamento.
- Para resultado exato e independente da ordem: converter para ponto fixo com inteiros de 64 bits (ou acumuladores largos) e somar inteiros, que são associativos. É a ideia de bibliotecas de soma reprodutível como a ReproBLAS.

### Perguntas de acompanhamento prováveis

- **Por que não usar `atomicAdd` com uma única thread somando os parciais no fim?** Também é determinístico (uma thread soma em ordem), mas é serial. Com milhares de parciais, a árvore paralela é melhor.
- **O que o PyTorch faz?** `torch.use_deterministic_algorithms(True)` força versões determinísticas das operações que têm uma, ou levanta erro nas que não têm. Algumas reduções e o backward de certas operações usam atômicos por padrão.
- **E em inferência de LLMs, onde aparece isso?** Kernels de atenção com split-K ou split-KV, reduções de MoE e all-reduce com tensor parallelism podem mudar a ordem de soma conforme o tamanho do batch. É uma das causas de a mesma pergunta gerar respostas diferentes com temperatura 0 quando o batch muda. Kernels "invariantes ao batch" fixam a ordem de redução para resolver isso.
- **A redução por warp com shuffle é determinística?** Sim. O padrão de trocas é fixo. O que quebra o determinismo é depender da ordem de chegada (atômicos) ou de configuração variável.

### Armadilhas comuns

- Achar que remover os atômicos basta, mas deixar a forma da árvore depender de `gridDim` ou do número de SMs.
- Confundir determinismo com exatidão.
- Ler a entrada com padrão não coalescido (cada thread lendo 8 elementos seguidos).
- Esquecer de sincronizar entre os níveis (no host, os lançamentos na mesma stream já são ordenados; diga isso).

## Q035 — Como funcionam o TensorRT-LLM e o vLLM? (perguntada junto com "implemente um loop de inferência em PyTorch") {#q035}

::: pergunta-meta
**[Relatado]** NVIDIA · Senior Software Engineer · entrevista técnica · 2026 · Médio · [fonte](https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW103158258.htm)
:::

### Resposta em 30 segundos

"Os dois são motores de serving de LLM com as mesmas peças: um scheduler com continuous batching, que a cada passo decide quais requisições rodam; um gerenciador de KV cache paginado; kernels otimizados de atenção e GEMM, com quantização; CUDA graphs para o decode; e paralelismo multi-GPU com NCCL. O vLLM nasceu do PagedAttention, é escrito principalmente em Python com kernels em CUDA e Triton, roda modelos do Hugging Face quase direto e tem um servidor compatível com a API da OpenAI. O TensorRT-LLM é da NVIDIA: historicamente compilava o modelo num engine TensorRT com plugins otimizados, com um runtime em C++ que faz in-flight batching, e tem os kernels mais afinados para GPUs NVIDIA, principalmente em FP8. Em geral, o vLLM ganha em flexibilidade e cobertura de modelos, e o TensorRT-LLM em desempenho máximo em hardware NVIDIA."

### Resposta completa

Comece pela arquitetura comum, porque ela é a resposta verdadeira à pergunta "como funcionam":

```text
 ┌──────────────────────────────────────────────────────────────┐
 │ API (HTTP/gRPC, compatível com OpenAI)                       │
 │   tokenização, detokenização, streaming                      │
 └──────────────┬─────────────────────────────▲─────────────────┘
                ▼                             │ tokens novos
 ┌──────────────────────────────────────────────────────────────┐
 │ ENGINE                                                       │
 │ ┌────────────────────┐   ┌─────────────────────────────────┐ │
 │ │ Scheduler          │◀─▶│ Gerenciador de KV cache         │ │
 │ │ filas: esperando,  │   │ blocos de tamanho fixo,         │ │
 │ │ rodando, pausadas  │   │ tabela de blocos por requisição,│ │
 │ │ continuous batching│   │ prefix caching, preempção       │ │
 │ │ chunked prefill    │   └─────────────────────────────────┘ │
 │ └─────────┬──────────┘                                       │
 │           ▼ "batch" deste passo                              │
 │ ┌────────────────────────────────────────────────────────┐   │
 │ │ Executor do modelo (1 processo por GPU com TP/PP)      │   │
 │ │ prepara entradas → forward → sampling                  │   │
 │ │ kernels: atenção paginada, GEMMs (FP8/INT4),           │   │
 │ │ fusões; CUDA graphs no decode; NCCL entre GPUs         │   │
 │ └────────────────────────────────────────────────────────┘   │
 └──────────────────────────────────────────────────────────────┘
```

O laço principal, em ambos:

```text
 enquanto houver requisições:
   1. scheduler escolhe o batch do passo, respeitando:
      - memória livre para o KV cache (blocos)
      - orçamento de tokens por passo (prefill em pedaços)
      - prioridades; se faltar memória, preempta alguém
   2. aloca blocos de KV para os tokens novos
   3. executa o forward de todos juntos (prefill + decode)
   4. faz o sampling, anexa os tokens novos
   5. requisições que terminaram liberam seus blocos
   6. envia os tokens novos para os clientes (stream)
```

**vLLM.**

- **Origem**: o paper do PagedAttention (Kwon et al., 2023). A ideia central é gerenciar o KV cache como memória virtual paginada, o que elimina a fragmentação e permite batches muito maiores ([Capítulo 6](#cap-06)).
- **Implementação**: núcleo em Python, kernels em CUDA, C++ e Triton, e integração com bibliotecas de atenção (FlashAttention, FlashInfer). Usa `torch.compile` e CUDA graphs.
- **Arquitetura recente (V1)**: o núcleo do engine roda num processo separado do servidor HTTP, para que tokenização e rede não atrasem o scheduler. O scheduler trata prefill e decode de forma unificada ("quantos tokens cada requisição processa neste passo"), o que dá chunked prefill e prefix caching de forma natural.
- **Pontos fortes**: suporta muitos modelos e arquiteturas (incluindo MoE e multimodais), muitos formatos de quantização (FP8, AWQ, GPTQ e outros), speculative decoding, multi-LoRA, vários fabricantes de hardware, e uma comunidade grande.

**TensorRT-LLM.**

- **Origem**: NVIDIA, construído sobre o TensorRT (o compilador de inferência da NVIDIA).
- **Fluxo clássico**: o modelo é definido numa API Python, convertido e **compilado** num engine TensorRT para uma GPU e configuração específicas (tamanhos máximos de batch e sequência, paralelismo, precisão). Operações críticas, como a atenção, entram como **plugins** com kernels escritos à mão. As versões recentes também oferecem um caminho baseado em PyTorch, sem a etapa separada de build, para facilitar o uso.
- **Runtime em C++** com **in-flight batching** (o nome da NVIDIA para continuous batching), KV cache paginado, reuso de KV, chunked prefill e speculative decoding.
- **Pontos fortes**: kernels mais otimizados para cada geração de GPU NVIDIA (FP8 na Hopper, FP4 na Blackwell), integração com o Triton Inference Server e com as ferramentas de quantização da NVIDIA (Model Optimizer).
- **Custos**: só NVIDIA, etapa de build e configuração mais complexas, suporte a modelos novos às vezes chega depois.

**Comparação direta:**

| | vLLM | TensorRT-LLM |
|---|---|---|
| Linguagem principal | Python + kernels CUDA/Triton | C++ runtime + Python |
| Preparação | carrega pesos do HF direto | build de engine (ou caminho PyTorch) |
| Hardware | NVIDIA, AMD, outros | só NVIDIA |
| Modelos novos | costumam chegar rápido | podem demorar mais |
| Desempenho | muito bom | geralmente o melhor em NVIDIA |
| Ecossistema | comunidade aberta grande | integrado ao stack NVIDIA |

Diga também que o **SGLang** é um terceiro motor importante, conhecido pelo RadixAttention (prefix caching com uma árvore de prefixos) e por um runtime eficiente para programas com várias chamadas ao LLM.

Como a pergunta veio junto com "implemente um loop de inferência", feche ligando os dois: "Um loop de inferência simples em PyTorch ([Q097](#q097)) faz prefill, depois decode com KV cache, um token por vez, para um batch fixo. O que esses motores adicionam é o que acontece entre os passos: entrar e sair do batch a qualquer momento, gerenciar a memória do cache em páginas, e kernels e grafos que eliminam o overhead."

### Perguntas de acompanhamento prováveis

- **Quando TensorRT-LLM ganha do vLLM?** Ver [Q051](#q051).
- **O que é o engine do TensorRT, exatamente?** Um plano de execução otimizado e serializado para uma GPU específica: kernels escolhidos por autotuning, fusões aplicadas, memória planejada. Não é portável entre gerações de GPU.
- **Como o vLLM implementa tensor parallelism?** Um processo (worker) por GPU, cada um com sua fatia dos pesos; as camadas lineares são divididas em colunas e linhas no estilo Megatron, com all-reduce via NCCL ([Capítulo 9](#cap-09)).
- **O que é o Triton Inference Server?** Outro produto, sem relação com a linguagem Triton: um servidor de modelos genérico da NVIDIA, com batching, múltiplos modelos e backends (incluindo TensorRT-LLM e vLLM). É fácil confundir os dois nomes numa entrevista.

### Armadilhas comuns

- Confundir Triton (linguagem de kernels) com Triton Inference Server.
- Descrever só "o vLLM usa PagedAttention" sem falar de scheduler, batching e kernels.
- Afirmar números de desempenho sem contexto (modelo, hardware, carga).
- Não saber o que é in-flight batching.

## Resumo do capítulo

- Todo programa CUDA: alocar, copiar, lançar, checar erro, copiar de volta, comparar com referência.
- GEMM FP32 rápida: tiling de bloco (128×128) em shared memory + micro-tile (8×8) em registradores, A transposto com padding, linhas e colunas espaçadas por thread.
- Intensidade da GEMM em tiles: $2 \cdot BM \cdot BN / (4(BM + BN))$ FLOP/byte; tiles maiores passam do ponto de equilíbrio.
- Reduções: árvore, shuffle no warp, grid-stride. `atomicAdd` em float não é determinístico.
- Redução determinística: folhas de tamanho fixo, árvore fixa, escrita sem atômicos, níveis repetidos (up-sweep do prefix sum).
- Triton programa blocos, não threads; compilador cuida de shared memory, coalescing e tensor cores (`tl.dot`).
- vLLM e TensorRT-LLM têm as mesmas peças: scheduler com continuous batching, KV cache paginado, kernels otimizados, CUDA graphs, paralelismo com NCCL.

## Checklist para a entrevista

- [ ] Escrevo o esqueleto de um programa CUDA com checagem de erros e verificação.
- [ ] Escrevo a GEMM com tiling em shared memory sem consultar.
- [ ] Explico o tiling 2D em registradores e o mapeamento espaçado de linhas e colunas.
- [ ] Calculo a intensidade aritmética para cada tamanho de tile.
- [ ] Escrevo reduções por warp com `__shfl_down_sync` e `__shfl_xor_sync`.
- [ ] Explico por que somas em float não são determinísticas.
- [ ] Projeto uma redução determinística e independente da configuração.
- [ ] Escrevo um softmax fundido em Triton.
- [ ] Explico quando usar Triton e quando usar CUDA.
- [ ] Desenho a arquitetura de um motor de inferência e comparo vLLM e TensorRT-LLM.
