# Capítulo 4 — Otimização de Desempenho em GPU {#cap-04}

O capítulo anterior explicou como a GPU funciona. Este explica como descobrir **por que** um código está lento e o que fazer a respeito. É o tipo de pergunta em que o entrevistador dá um sintoma ("o kernel só usa 30% da banda", "o bloco menor ficou mais lento") e observa seu raciocínio. Ninguém espera que você acerte a causa de primeira. Esperam que você tenha um **método**.

## 4.1 O método

Toda investigação de desempenho segue o mesmo ciclo:

```text
     ┌──────────────────────────────────────────────┐
     ▼                                              │
 ┌────────┐   ┌───────────┐   ┌─────────┐   ┌───────┴──┐
 │ MEDIR  │──▶│CLASSIFICAR│──▶│HIPÓTESE │──▶│ MUDAR UMA│
 │ tempo, │   │ memória?  │   │ "falta  │   │ COISA E  │
 │ bytes, │   │ cálculo?  │   │ paralel-│   │ MEDIR DE │
 │ FLOPs  │   │ latência? │   │ ismo..."│   │ NOVO     │
 └────────┘   │ overhead? │   └─────────┘   └──────────┘
              └───────────┘
```

As quatro classes de gargalo:

| Classe | Sintoma | Exemplo |
|---|---|---|
| **Memory-bound** | throughput de memória perto do pico, SMs ociosos | decode, normas, ativações |
| **Compute-bound** | tensor cores / ALUs perto do pico | GEMM grande no prefill |
| **Latency-bound** | nem memória nem cálculo perto do pico; warps esperando | pouco paralelismo, dependências |
| **Overhead-bound** | GPU ociosa entre kernels | kernels curtos, CPU lenta, Python |

A terceira classe é a mais traiçoeira: o kernel não está usando nem a memória nem o cálculo, porque não tem trabalho independente suficiente em andamento para esconder a latência. A quarta é a mais comum em inferência com batch pequeno.

## 4.2 Roofline a fundo: MFU e MBU

O roofline do [Capítulo 1](#cap-01) dá o limite teórico. Para saber quão perto você está dele, use duas métricas:

$$\text{MFU} = \frac{\text{FLOPs úteis por segundo atingidos}}{\text{pico de FLOPS}}$$

$$\text{MBU} = \frac{\text{bytes necessários por segundo atingidos}}{\text{pico de banda}}$$

- **MFU** (model FLOPs utilization) é a métrica de quem está compute-bound: treino e prefill.
- **MBU** (model bandwidth utilization) é a métrica de quem está memory-bound: decode.

::: conta
**Fazendo a conta: MBU de um decode.** Llama 3 8B em BF16 numa H100, batch 16, contexto médio de 2.000 tokens, passo medido de 7 ms.

- Pesos: 16 GB.
- KV cache lido: 16 sequências × 2.000 tokens × 128 KiB ≈ 4,2 GB.
- Bytes por passo: ~20,2 GB.
- Banda atingida: 20,2 GB / 7 ms ≈ 2,9 TB/s.
- MBU = 2,9 / 3,35 ≈ **86%**. Muito bom. Ganhos grandes agora só vêm de ler menos bytes (quantização, cache menor), não de kernels melhores.

Se o passo medido fosse 15 ms, o MBU seria ~40%, e haveria muito espaço para otimizar kernels e overhead.
:::

Também existe o **roofline hierárquico**: um telhado para cada nível de memória (HBM, L2, shared memory). Um kernel pode estar longe do limite da HBM porque está limitado pela banda da L2 ou da shared memory. O Nsight Compute desenha esses rooflines automaticamente.

## 4.3 Ferramentas

**Nsight Systems (nsys)** mostra a **linha do tempo**: CPU, chamadas de API do CUDA, kernels, cópias de memória, comunicação NCCL. Use primeiro, para responder "onde está o tempo?" e "a GPU fica ociosa?".

```bash
nsys profile -o perfil --trace=cuda,nvtx,osrt \
    python servir.py --benchmark
```

```text
 Linha do tempo (nsys), decode com batch pequeno:

 CPU  │▓▓launch▓▓│▓▓launch▓▓│▓▓launch▓▓│▓▓launch▓▓│
 GPU  │ ▒ │      │ ▒ │      │ ▒ │      │ ▒ │
         ▲ kernel de 8 µs   ▲ GPU parada esperando
                              a CPU lançar o próximo
 → overhead-bound: CUDA graphs resolvem
```

**Nsight Compute (ncu)** analisa **um kernel** em detalhe: throughput de memória e de cálculo em % do pico (seção "Speed of Light"), análise da hierarquia de memória, occupancy, motivos de espera dos warps, e contadores por linha de código-fonte.

```bash
ncu --set full -k regex:rms_norm -c 5 -o kernel \
    python servir.py --benchmark
```

**`torch.profiler`** dá a visão do PyTorch: que operador gerou que kernel, quanto tempo de CPU e GPU cada um levou, e exporta para o Chrome Trace ou Perfetto.

**DCGM / `nvidia-smi`** servem para monitorar a frota, não para otimizar kernels. A "GPU utilization" do `nvidia-smi` só diz que havia **algum** kernel rodando; métricas do DCGM como `SM_ACTIVE`, `TENSOR_ACTIVE` (pipe de tensor ativo) e `DRAM_ACTIVE` são bem mais informativas.

### Motivos de espera dos warps

O Nsight Compute mostra **por que** os warps não estão emitindo instruções. Os principais:

| Motivo (warp stall) | Significado | Ação típica |
|---|---|---|
| Long scoreboard | esperando dado da memória global/local | mais bytes em voo, melhor reuso, prefetch |
| Short scoreboard | esperando shared memory ou função especial | reduzir conflitos de banco |
| Barrier | parado em `__syncthreads` | balancear trabalho, menos barreiras |
| MIO throttle | fila de instruções de memória cheia | leituras vetorizadas (menos instruções) |
| Math pipe throttle | unidade de cálculo saturada | bom sinal se for o esperado |
| Wait | dependência fixa entre instruções | mais ILP |
| Not selected | havia warp pronto, outro foi escolhido | normal; indica occupancy suficiente |

## 4.4 Escondendo latência: a lei de Little

Esta é a ideia que explica a maioria dos kernels memory-bound que não chegam ao pico. A **lei de Little** diz:

$$\text{dados em trânsito} = \text{banda} \times \text{latência}$$

Para usar toda a banda da HBM, a GPU precisa ter, a todo momento, uma quantidade grande de leituras pedidas e ainda não respondidas.

::: conta
**Fazendo a conta:** suponha uma latência de memória da ordem de 600 ns (valor ilustrativo; varia com a carga) e 3,35 TB/s.

- Bytes em voo necessários: 3,35 × 10¹² × 600 × 10⁻⁹ ≈ **2 MB** na GPU toda.
- Por SM: 2 MB / 132 ≈ **15 KB** em voo, o tempo todo.
- Se cada thread tem uma leitura de 4 bytes pendente por vez, você precisaria de ~3.800 threads por SM. O máximo é 2.048.
- Se cada thread lê 16 bytes (`float4`) e tem 2 leituras independentes pendentes, bastam ~480 threads por SM.

Conclusão: **leituras largas e independentes** (vetorização e ILP) são tão importantes quanto a occupancy.
:::

```text
 Thread com uma leitura por vez (dependente):
 ──[pede]──────────espera──────────[usa][pede]────espera────...

 Thread com 4 leituras independentes em voo:
 ──[pede][pede][pede][pede]────espera────[usa][usa][usa][usa]──
   mesma latência, 4× mais bytes por unidade de tempo
```

## 4.5 Fusão de kernels

Cada kernel separado lê suas entradas da HBM e escreve suas saídas na HBM. Para operações elemento a elemento, esse tráfego **é** o custo inteiro.

```text
 Sem fusão (3 kernels):            Com fusão (1 kernel):
 HBM ─▶ [x + residual] ─▶ HBM      HBM ─▶ ┌─────────────────┐
 HBM ─▶ [RMSNorm]      ─▶ HBM             │ x + residual    │
 HBM ─▶ [quantiza FP8] ─▶ HBM             │ RMSNorm         │
                                          │ quantiza FP8    │
 tráfego ≈ 6 leituras/escritas            └────────┬────────┘
 do tensor                                         ▼ HBM
                                          tráfego ≈ 2 (+1 resid.)
```

Fusões comuns em LLMs:

- **Residual + RMSNorm** (+ quantização da saída).
- **SiLU × up** no MLP (ou a GEMM de gate e up juntas numa só, com a ativação no epílogo).
- **QKV numa GEMM só** + RoPE + escrita no KV cache.
- **Epílogo de GEMM**: bias, ativação, quantização e soma residual feitas enquanto o resultado ainda está em registradores.
- **Atenção inteira** (FlashAttention).

## 4.6 Overhead de CPU e CUDA graphs

No decode com batch pequeno, um passo pode ter mais de mil kernels de poucos microssegundos cada. O Python e o driver do CUDA levam alguns microssegundos para lançar cada um. A GPU termina o kernel e fica esperando o próximo.

**CUDA graphs** resolvem isso: você grava a sequência de lançamentos uma vez e a reexecuta com uma única chamada.

```python
import torch

# entradas e saídas com endereço FIXO (o grafo grava ponteiros)
x_estatico = torch.zeros(batch, d, device="cuda")
s = torch.cuda.Stream()
s.wait_stream(torch.cuda.current_stream())
with torch.cuda.stream(s):          # aquecimento obrigatório
    for _ in range(3):
        y_estatico = modelo_passo(x_estatico)
torch.cuda.current_stream().wait_stream(s)

g = torch.cuda.CUDAGraph()
with torch.cuda.graph(g):
    y_estatico = modelo_passo(x_estatico)

# a cada passo: copia a entrada para o buffer e reexecuta
x_estatico.copy_(x_novo)
g.replay()
resultado = y_estatico.clone()
```

Limitações que você deve citar:

- **Formas fixas.** O grafo é gravado para um tamanho. Motores de inferência gravam um grafo para cada tamanho de batch de uma lista (1, 2, 4, 8, 16, ..., 256) e completam o batch com padding até o tamanho gravado mais próximo.
- **Endereços fixos.** Entradas e saídas precisam estar sempre nos mesmos buffers.
- **Nada de sincronização com a CPU** nem de fluxo de controle dependente de dados dentro do grafo.
- **Memória.** Cada grafo reserva sua memória; muitos tamanhos gravados consomem memória que poderia ir para o KV cache.

Por isso, a prática comum é usar CUDA graphs para o **decode** (formas previsíveis) e execução normal para o **prefill** (formas variáveis, kernels longos, overhead irrelevante).

## 4.7 torch.compile por dentro

O `torch.compile` é a forma de otimizar modelos PyTorch sem reescrever tudo à mão. Ele tem três camadas:

```text
 código Python do modelo
        │
        ▼
 ┌──────────────────┐  captura o grafo lendo o bytecode Python;
 │ TorchDynamo      │  cria "guards" (condições de validade);
 │                  │  partes que não entende viram graph breaks
 └────────┬─────────┘
          ▼  grafo FX
 ┌──────────────────┐  (no treino) separa forward e backward;
 │ AOTAutograd      │  decompõe em operadores primitivos
 └────────┬─────────┘
          ▼
 ┌──────────────────┐  funde operações, escolhe kernels,
 │ backend:         │  gera Triton (GPU) ou C++ (CPU);
 │ TorchInductor    │  GEMMs vão para cuBLAS ou templates
 │ (ou TensorRT,    │  Triton com autotuning
 │  ONNX Runtime..) │
 └──────────────────┘
```

- **Guards**: o código compilado só é reutilizado se as condições valem (mesmo dtype, mesmas dimensões ou dimensões marcadas como dinâmicas, etc.). Se mudam, há **recompilação**. Em serving, recompilações em produção causam picos de latência enormes.
- **Graph breaks**: código que o Dynamo não consegue capturar (algumas chamadas externas, `print`, conversões para Python como `.item()`) quebra o grafo em pedaços. Cada quebra impede fusões. `torch._dynamo.explain()` e `TORCH_LOGS="graph_breaks"` mostram onde estão.
- **Modos**: `default`; `reduce-overhead` (usa CUDA graphs); `max-autotune` (testa várias configurações de kernel; compila bem mais devagar).
- **Backends externos**: `torch_tensorrt` compila partes do grafo para TensorRT; também há backends para ONNX Runtime e outros. Úteis quando o backend tem kernels melhores para o seu hardware ou formato (por exemplo, INT8/FP8 com calibração).

## 4.8 Medindo direito

Metade dos "ganhos" que aparecem em entrevistas são erros de medição. As regras:

1. **Aquecimento.** Os primeiros passos incluem compilação, autotuning, alocação de memória e caches frios. Descarte-os.
2. **Sincronização.** Lançamentos de kernel são assíncronos. Medir com `time.time()` sem `torch.cuda.synchronize()` mede só o tempo de lançamento. Use **CUDA events**.
3. **Repetições e estatística.** Reporte mediana e percentis de várias execuções.
4. **Formas realistas.** Benchmark com batch e contexto da produção. Um kernel ótimo para batch 256 pode ser péssimo para batch 4.
5. **Clocks estáveis.** GPUs mudam de frequência com temperatura e potência. Para comparações finas, trave os clocks ou rode tempo suficiente para estabilizar.
6. **Mesma qualidade.** Ao comparar com quantização, compare também a qualidade.

```python
import torch

def medir(fn, aquecimento=10, repeticoes=100):
    for _ in range(aquecimento):
        fn()
    torch.cuda.synchronize()
    tempos = []
    for _ in range(repeticoes):
        ini = torch.cuda.Event(enable_timing=True)
        fim = torch.cuda.Event(enable_timing=True)
        ini.record()
        fn()
        fim.record()
        torch.cuda.synchronize()
        tempos.append(ini.elapsed_time(fim))   # em ms
    tempos.sort()
    return {"p50": tempos[len(tempos) // 2],
            "p90": tempos[int(len(tempos) * 0.9)],
            "min": tempos[0]}
```

## Perguntas de entrevista comentadas

## Q025 — Um kernel atinge 30% da largura de banda de memória máxima numa H100. Como você descobre o porquê? {#q025}

::: pergunta-meta
**[Fornecedor]** NVIDIA, segundo fornecedor de preparação · Presencial · 2026 · Difícil · [fonte](https://www.techinterview.org/post/3233475452/how-nvidia-tests-cuda-and-gpu-skills/)
:::

### Resposta em 30 segundos

"Primeiro confirmo que o kernel deveria ser memory-bound, calculando a intensidade aritmética. Depois abro no Nsight Compute: se o cálculo também está baixo, é problema de latência ou de paralelismo, não de banda. Aí verifico, em ordem: o tamanho do problema e da grade (poucos blocos, kernel curto demais, efeito de cauda); occupancy e bytes em voo por SM, pela lei de Little; coalescing, olhando setores por requisição; largura das leituras (escalares vs 128 bits); e motivos de espera dos warps. As causas mais comuns são acessos não coalescidos, poucos bytes em voo e grade pequena demais. Corrijo uma coisa por vez e meço de novo."

### Resposta completa

Mostre o método como uma árvore de decisão:

```text
 30% da banda
   │
   ├─ 1. Deveria ser memory-bound?
   │     intensidade << 295 FLOP/byte? Se não, o alvo é
   │     o pico de FLOPS, e 30% de banda pode ser normal.
   │
   ├─ 2. O kernel é grande o suficiente?
   │     dura poucos µs? lê poucos MB?  → overhead de
   │     lançamento e rampa dominam. Juntar trabalho,
   │     fundir kernels, CUDA graphs.
   │
   ├─ 3. A grade enche a GPU?
   │     blocos < (132 SMs × blocos por SM)? cauda?
   │     → mais blocos, grid-stride, split do trabalho.
   │
   ├─ 4. Há bytes em voo suficientes? (lei de Little)
   │     occupancy baixa? leituras dependentes?
   │     leituras de 4 bytes?
   │     → vetorizar (16 B), desenrolar laços para
   │       várias leituras independentes, reduzir
   │       registradores.
   │
   ├─ 5. Os acessos são eficientes?
   │     setores por requisição > ideal? stride?
   │     desalinhamento?  → reorganizar layout,
   │     transpor via shared memory, alinhar.
   │
   └─ 6. Algum outro limite?
         MIO throttle, conflitos de banco, atômicos
         disputados, cálculo de índice pesado (divisão
         inteira, módulo), L2 com padrão ruim.
```

Detalhe as principais causas com o sintoma que o Nsight Compute mostra e a correção:

| Causa | Sintoma no Nsight Compute | Correção |
|---|---|---|
| Acesso não coalescido | setores/requisição alto; "uncoalesced global accesses" | threadIdx.x na dimensão contígua; transpor via shared |
| Poucos bytes em voo | stall "long scoreboard" dominante; occupancy baixa | `float4`/`uint4`, ILP, menos registradores |
| Grade pequena | poucos blocos; "waves per SM" < 1 | mais blocos, dividir o trabalho |
| Kernel curto | duração de poucos µs | fusão, CUDA graphs, mais trabalho por kernel |
| Desalinhamento | setores extras por requisição | alinhar ponteiros e tamanhos em 16 B |
| Instruções demais | "issue slot" alto, "MIO throttle" | vetorizar, simplificar índices |
| Atômicos disputados | stalls em operações atômicas | reduzir localmente antes do atômico |

Um exemplo concreto ajuda muito:

> "Num kernel de RMSNorm em BF16, cada thread lia um `__nv_bfloat16` (2 bytes) por vez. Com 2 bytes por leitura e uma leitura pendente por thread, não havia bytes em voo suficientes. Troquei por leituras de 16 bytes (8 valores) e duas leituras independentes por iteração, e a banda foi de 30% para uns 80%."

E termine com a régua do que é bom: "Kernels de streaming simples (cópia, elemento a elemento) bem escritos costumam chegar a 80–90% da banda nominal. Abaixo de 60%, quase sempre há algo a corrigir."

### Perguntas de acompanhamento prováveis

- **E se o problema for pequeno, digamos 1 MB?** A 3,35 TB/s, 1 MB leva 0,3 µs; o lançamento e a rampa levam mais que isso. Esse kernel nunca vai atingir a banda de pico sozinho. A saída é fundi-lo com outro ou rodar dentro de um CUDA graph.
- **Como a L2 entra nisso?** Se os dados cabem na L2 (50 MB), leituras repetidas podem vir da L2 com banda maior do que a HBM. Às vezes a "banda de DRAM baixa" é boa notícia: os dados estão vindo do cache.
- **Como você sabe a latência de memória da GPU?** Microbenchmarks de pointer chasing (cada leitura depende da anterior) medem a latência; os valores variam com a geração e a carga.
- **O que é partition camping?** Padrões de acesso que concentram as requisições em poucos canais ou partições de memória, reduzindo a banda efetiva. Em GPUs modernas, o hash de endereços reduz o problema, mas padrões com stride potência de 2 ainda podem sofrer.

### Armadilhas comuns

- Pular para uma solução ("aumentaria a occupancy") sem dizer como mediria.
- Não confirmar antes se o kernel deveria ser memory-bound.
- Esquecer a lei de Little e a largura das leituras.
- Não citar a ferramenta (Nsight Compute) e as métricas específicas.

## Q026 — Sua redução é mais lenta com 64 threads por bloco do que com 256. O que está acontecendo? {#q026}

::: pergunta-meta
**[Fornecedor]** NVIDIA, segundo fornecedor de preparação · Presencial · 2026 · Médio · [fonte](https://www.techinterview.org/post/3233475452/how-nvidia-tests-cuda-and-gpu-skills/)
:::

### Resposta em 30 segundos

"Com blocos de 64 threads, o SM pode bater no limite de blocos residentes antes do limite de threads, e a occupancy cai; em várias GPUs o limite é 16 ou 32 blocos por SM. Também há 4 vezes mais blocos, então 4 vezes mais resultados parciais: mais escritas na memória global ou mais atômicos disputando o mesmo endereço, ou uma segunda etapa de redução maior. E o custo fixo de cada bloco (iniciar, sincronizar, as etapas finais da árvore com poucas threads ativas, escrever o resultado) é amortizado sobre menos elementos. Eu confirmaria no Nsight Compute olhando a occupancy atingida e o limitador de blocos, e mudaria para um laço grid-stride com um número fixo de blocos, soma em registradores, redução por warp com shuffle e um atômico por bloco."

### Resposta completa

Comece com uma redução típica, para ter algo concreto:

```cuda
// cada bloco soma blockDim.x elementos e faz 1 atômico
__global__ void soma_v1(const float* x, float* total, int n) {
    extern __shared__ float s[];
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    s[threadIdx.x] = (i < n) ? x[i] : 0.0f;
    __syncthreads();
    for (int passo = blockDim.x / 2; passo > 0; passo /= 2) {
        if (threadIdx.x < passo)
            s[threadIdx.x] += s[threadIdx.x + passo];
        __syncthreads();
    }
    if (threadIdx.x == 0) atomicAdd(total, s[0]);
}
```

Agora analise o que muda de 256 para 64 threads por bloco, com $n$ = 100 milhões de elementos:

**1. Número de blocos e atômicos.** Com 256 threads: ~390 mil blocos e 390 mil `atomicAdd` no mesmo endereço. Com 64: ~1,56 milhão de blocos e **1,56 milhão de atômicos** no mesmo endereço. Atômicos no mesmo endereço são serializados na L2. Isso sozinho pode dominar.

**2. Limite de blocos por SM.** Cada SM aceita um número máximo de blocos residentes (32 na Ampere e Hopper, 16 em gerações como a Turing). Com 64 threads por bloco:

```text
 Hopper:  32 blocos × 64 threads = 2.048 threads → 100% ok
 Turing:  16 blocos × 64 threads = 1.024 threads
          (máximo do SM na Turing = 1.024)    → ok
 GPU com limite de 16 blocos e 2.048 threads por SM:
          16 × 64 = 1.024 de 2.048            → 50%
```

O efeito depende da arquitetura; diga isso e explique como verificar (o Nsight Compute mostra o "block limit" de cada recurso).

**3. Custo fixo por bloco.** Cada bloco tem custo de agendamento, inicialização, $\log_2(\text{threads})$ etapas com `__syncthreads()` e a escrita final. As últimas etapas da árvore usam poucas threads (as outras ficam ociosas). Com blocos menores, a proporção de trabalho "útil" por bloco cai.

**4. Pouco trabalho por thread.** Cada thread lê **um** elemento. Não há ILP, há poucos bytes em voo por thread, e quase todo o tempo é overhead.

A correção (o padrão que os entrevistadores querem ver):

```cuda
__inline__ __device__ float soma_warp(float v) {
    for (int d = 16; d > 0; d /= 2)
        v += __shfl_down_sync(0xffffffff, v, d);
    return v;
}

__global__ void soma_v2(const float* __restrict__ x,
                        float* total, int n) {
    float acc = 0.0f;
    // grid-stride: cada thread soma muitos elementos
    for (int i = blockIdx.x * blockDim.x + threadIdx.x;
         i < n; i += gridDim.x * blockDim.x)
        acc += x[i];

    acc = soma_warp(acc);                 // redução no warp
    __shared__ float parciais[32];        // 1 por warp
    int lane = threadIdx.x % 32, warp = threadIdx.x / 32;
    if (lane == 0) parciais[warp] = acc;
    __syncthreads();
    if (warp == 0) {
        int nwarps = blockDim.x / 32;
        acc = (lane < nwarps) ? parciais[lane] : 0.0f;
        acc = soma_warp(acc);
        if (lane == 0) atomicAdd(total, acc);  // 1 por bloco
    }
}
// lançar com ~ (número de SMs × 4) blocos de 256 threads
```

Melhorias: cada thread soma milhares de elementos em registradores; a redução no warp usa shuffle, sem shared memory nem `__syncthreads()`; há só uma barreira por bloco; e só algumas centenas de atômicos no total. Com leituras `float4`, chega perto do pico de banda.

### Perguntas de acompanhamento prováveis

- **E se eu precisar de um resultado determinístico?** `atomicAdd` em ponto flutuante não é determinístico: a ordem das somas muda entre execuções, e ponto flutuante não é associativo. Use duas passadas (cada bloco escreve seu parcial num vetor, e um segundo kernel soma os parciais em ordem fixa). Ver [Q034](#q034).
- **Por que `__shfl_down_sync` e não shared memory?** O shuffle troca registradores dentro do warp em uma instrução, sem barreira e sem conflitos de banco.
- **Qual o número ideal de blocos?** O suficiente para encher a GPU com algumas ondas (por exemplo, número de SMs × blocos residentes por SM), não um bloco por elemento. Dá para consultar com `cudaOccupancyMaxActiveBlocksPerMultiprocessor`.
- **Blocos maiores (1.024) seriam ainda melhores?** Não necessariamente: menos flexibilidade de agendamento, barreiras mais caras e possíveis limites de registradores. 128 a 512 costuma ser um bom intervalo.

### Armadilhas comuns

- Responder só "occupancy" sem explicar o limite de blocos por SM.
- Esquecer o custo dos atômicos.
- Não propor grid-stride e redução por warp.
- Ignorar o não determinismo do `atomicAdd` em float.

## Q027 — Dê um exemplo de kernel que atingiu alta utilização dos tensor cores. Como você conseguiu isso? {#q027}

::: pergunta-meta
**[Relatado]** AMD · GPU Kernel Developer, AI Models · primeira rodada · relatado · Difícil · [fonte](https://www.glassdoor.ca/Interview/AMD-GPU-Kernel-Developer-AI-Models-Interview-Questions-EI_IE15.0,3_KO4,34.htm)
:::

### Resposta em 30 segundos

"Uma GEMM agrupada em FP8 para as camadas de especialistas de um modelo MoE. Para chegar perto do pico, garanti quatro coisas: dados no formato e alinhamento que os tensor cores querem (dimensões múltiplas de 16, layout certo para cada operando); tiles grandes o bastante para a intensidade aritmética passar do ponto de equilíbrio, com o reuso feito em shared memory e registradores; um pipeline com várias etapas de cópia assíncrona para os tensor cores nunca esperarem dados; e o trabalho de todos os especialistas num kernel persistente, para encher todos os SMs mesmo com especialistas pequenos. O epílogo fazia a descompactação de escala e a conversão no próprio kernel. Chegamos a uns 70% do pico de FP8, contra uns 35% da versão com uma GEMM por especialista."

### Resposta completa

O entrevistador quer duas coisas: que você conheça **os requisitos para alimentar tensor cores** e que tenha uma história crível. Explique primeiro os requisitos, depois a história.

**Os requisitos.**

```text
 Para os tensor cores trabalharem perto do pico:

 1. FORMATO   tipos suportados (BF16, FP16, FP8, INT8),
              dimensões múltiplas do tamanho de instrução
              (ex.: 8 ou 16), ponteiros alinhados (16 B+)

 2. REUSO     tiles grandes (ex.: 128×128 ou 128×256 por
              bloco) → intensidade acima do ponto de
              equilíbrio. Senão, o kernel é memory-bound
              e os tensor cores esperam.

 3. ALIMEN-   pipeline de várias etapas: carregar o tile k+2
    TAÇÃO     enquanto calcula o tile k (cp.async, TMA);
              layout em shared memory sem conflitos de
              banco (swizzle)

 4. OCUPAÇÃO  tiles suficientes para todos os SMs, sem
              cauda ruim (split-K, stream-K, kernels
              persistentes)

 5. EPÍLOGO   escrita do resultado (com bias, ativação,
              conversão) sem virar gargalo
```

Na prática, para dimensões típicas de LLM, você raramente escreve isso do zero: usa CUTLASS/CuTe, Triton, as bibliotecas do fornecedor (cuBLASLt, hipBLASLt, Composable Kernel na AMD) e ajusta a configuração. A habilidade está em saber **por que** uma configuração é melhor e em escrever a parte que a biblioteca não tem (fusões, layouts especiais, MoE).

**Uma história modelo** (adapte à sua experiência real):

> "**Contexto.** Num modelo MoE com 64 especialistas e 8 ativos por token, as camadas de especialistas eram 55% do tempo do prefill. A implementação lançava uma GEMM por especialista. Com tokens distribuídos de forma desigual, vários especialistas recebiam poucos tokens, e as GEMMs pequenas não enchiam a GPU.
>
> **Medição.** No Nsight Compute, o pipe de tensor core ficava ativo uns 35% do tempo; havia dezenas de kernels curtos com cauda longa; e os especialistas com poucos tokens tinham intensidade aritmética baixa.
>
> **O que fiz.** (1) Uma GEMM agrupada num único kernel persistente: cada bloco pega tiles de uma fila global que cobre todos os especialistas, então os SMs ficam ocupados até o fim. (2) Ordenei os tokens por especialista antes da GEMM (um kernel de permutação), para que as linhas de cada especialista ficassem contíguas e as leituras, coalescidas. (3) Usei FP8 com fator de escala por bloco de 128 elementos e apliquei as escalas no epílogo, em registradores. (4) Ajustei tamanho do tile e número de etapas do pipeline com autotuning nas formas reais do tráfego: tiles de 128×128 com 4 etapas foram os melhores para os especialistas grandes, e 64×128 para os pequenos.
>
> **Desafio.** A distribuição de tokens muda a cada lote. Um tamanho de tile fixo era ótimo para um caso e ruim para outro. A solução foi escolher a configuração em tempo de execução, com base no número de tokens por especialista, entre duas ou três variantes compiladas.
>
> **Resultado.** O pipe de tensor core ativo foi para uns 70%, e o tempo das camadas de especialistas caiu pela metade. O prefill inteiro ficou uns 35% mais rápido."

### Perguntas de acompanhamento prováveis

- **Qual métrica mostra a utilização dos tensor cores?** No Nsight Compute, o throughput do pipe de tensor (porcentagem do pico das instruções HMMA/WGMMA); no DCGM, `TENSOR_ACTIVE`. Compare também os TFLOPS atingidos com o pico do formato.
- **Por que dimensões múltiplas de 8 ou 16?** As instruções de tensor core operam em fragmentos de tamanho fixo. Dimensões fora disso exigem padding ou caminhos mais lentos. Por isso modelos são desenhados com dimensões como 4.096 e vocabulários com padding para múltiplos de 64 ou 128.
- **Por que é mais difícil chegar ao pico em FP8 do que em BF16?** O pico de FP8 é o dobro. Para manter os tensor cores ocupados, você precisa entregar dados duas vezes mais rápido em relação ao cálculo, e o epílogo (escalas, conversões) pesa mais.
- **Na AMD, o que muda?** Os matrix cores usam instruções MFMA, os wavefronts têm 64 threads nas GPUs de data center (CDNA), e a memória local (LDS) tem outras regras de banco. Os princípios (reuso, pipeline, ocupação) são os mesmos.

### Armadilhas comuns

- Dizer "usei cuBLAS e deu 90%" sem explicar o que você fez.
- Não saber os requisitos de formato e alinhamento.
- Esquecer o pipeline (sobrepor cópia e cálculo).
- Não mencionar o problema de encher os SMs (cauda, MoE, formas pequenas).

## Q028 — Projete e faça o benchmark de um pipeline de inferência otimizado: TorchDynamo, TorchInductor, backends externos, fusão, CUDA graphs, quantização. {#q028}

::: pergunta-meta
**[Relatado]** NVIDIA · Software Engineer · triagem técnica · listada em 2026 · Médio · [fonte](https://prachub.com/interview-questions/design-and-benchmark-optimized-inference-pipelines)
:::

### Resposta em 30 segundos

"Começo com uma linha de base em eager PyTorch e um benchmark confiável: formas reais, aquecimento, CUDA events, percentis, e uma métrica de qualidade para cada variante. Depois subo uma camada por vez, medindo cada uma: torch.compile com Inductor para fusões automáticas, olhando graph breaks e recompilações; o modo reduce-overhead para usar CUDA graphs no decode; quantização (pesos em FP8 ou INT8/INT4) validada contra a avaliação de qualidade; e um backend externo como TensorRT quando ele tiver kernels melhores para o caso. No fim, a tabela compara latência p50/p99, throughput, memória, tempo de compilação e qualidade, e eu escolho com base no SLO, não só no número mais bonito."

### Resposta completa

Estruture como um projeto, com o pipeline e o benchmark lado a lado.

**1. Defina o alvo.** Que modelo, que hardware, que métrica (latência com batch 1? throughput com batch 64?), que formas de entrada (distribuição de tamanhos), e que critério de qualidade aceitável (por exemplo, no máximo 0,5 ponto de queda num benchmark interno).

**2. Linha de base.** PyTorch eager, BF16. Meça com a função `medir` da seção [4.8](#cap-04). Rode o `torch.profiler` para ver a distribuição do tempo entre GEMMs, atenção, ops elemento a elemento e tempo ocioso.

**3. As camadas de otimização, em ordem:**

```text
 Etapa                    O que ataca            Risco
 ────────────────────     ───────────────────    ─────────────────
 0 eager BF16             (base)                 —
 1 SDPA/FlashAttention    atenção                pouco
 2 torch.compile          fusões elemento a      graph breaks,
   (Inductor)             elemento, menos        recompilações,
                          kernels                tempo de compilação
 3 reduce-overhead        overhead de CPU        formas fixas,
   (CUDA graphs)          no decode              memória extra
 4 max-autotune           escolha de kernels     compilação longa
 5 quantização FP8/INT8   bytes lidos,           qualidade
   /INT4 (pesos)          FLOPs mais rápidos
 6 backend externo        kernels específicos,   cobertura de ops,
   (TensorRT)             fusões agressivas      manutenção
```

**4. O código do benchmark** (esqueleto):

```python
import torch

def preparar(modelo, variante):
    if variante == "eager":
        return modelo
    if variante == "compile":
        return torch.compile(modelo)
    if variante == "compile-graphs":
        return torch.compile(modelo, mode="reduce-overhead")
    if variante == "autotune":
        return torch.compile(modelo, mode="max-autotune")
    raise ValueError(variante)

def bench(modelo, entradas, variante):
    m = preparar(modelo, variante)
    resultados = {}
    for nome, x in entradas.items():      # ex.: "b1_ctx512"
        with torch.inference_mode():
            resultados[nome] = medir(lambda: m(x))
    return resultados
```

Pontos de atenção que você deve dizer em voz alta:

- **Separe o tempo de compilação** do tempo de execução. Em serving, a compilação acontece na subida do servidor ou antes (cache de compilação); ela não pode acontecer no meio do tráfego.
- **Verifique graph breaks** (`TORCH_LOGS="graph_breaks,recompiles"`). Um graph break no meio de cada camada anula boa parte das fusões.
- **Formas dinâmicas**: marque as dimensões que variam (`torch._dynamo.mark_dynamic`) ou faça buckets de tamanhos, para não recompilar a cada tamanho de entrada.
- **Qualidade**: para cada variante quantizada, rode a avaliação. Para as variantes não quantizadas, compare os logits com a linha de base (diferença máxima dentro da tolerância).

**5. O relatório final.**

| Variante | p50 b=1 (ms/token) | Throughput b=64 (tok/s) | Memória | Compilação | Qualidade |
|---|---|---|---|---|---|
| eager BF16 | (medido) | (medido) | (medido) | 0 s | referência |
| compile | ... | ... | ... | ... | = |
| compile + graphs | ... | ... | ... | ... | = |
| + FP8 pesos | ... | ... | ... | ... | Δ medido |
| TensorRT FP8 | ... | ... | ... | ... | Δ medido |

Deixe a tabela vazia na entrevista e explique o que **espera** ver e por quê: "Para batch 1, espero que CUDA graphs deem o maior ganho isolado, porque o decode é overhead-bound; para batch 64, quantização e kernels melhores devem dominar, porque o passo é limitado por banda e cálculo." Isso mostra que você tem um modelo, não só uma ferramenta.

**6. Fusão manual quando a automática não basta.** Se o profiler mostrar que uma sequência importante não foi fundida (por exemplo, residual + norma + quantização), escreva um kernel Triton para ela e registre como operador customizado (`torch.library`), para continuar compatível com o `torch.compile`.

### Perguntas de acompanhamento prováveis

- **Por que não usar direto um motor como vLLM ou TensorRT-LLM?** Para serving de LLMs, normalmente você usaria. Eles já trazem continuous batching, KV cache paginado e kernels especializados. Essa pergunta testa se você entende as peças que esses motores combinam. Ver [Q035](#q035).
- **Como evitar recompilações em produção?** Fixar buckets de formas, aquecer todos os buckets na subida, usar o cache de compilação, alertar quando houver recompilação.
- **Quando o TensorRT ganha?** Quando há kernels muito otimizados para o seu hardware e formato (por exemplo, FP8 na Hopper), fusões agressivas e formas previsíveis. O custo é uma etapa de build separada, menos flexibilidade e cobertura de operadores menor.
- **O que você faria se o compile deixasse mais lento?** Olhar os kernels gerados (`TORCH_LOGS="output_code"`), verificar se uma GEMM foi trocada por uma versão pior, se houve graph breaks, ou se o autotuning escolheu mal para as formas reais.

### Armadilhas comuns

- Medir sem aquecimento ou sem sincronização.
- Comparar variantes com formas diferentes ou com batch irreal.
- Ignorar o tempo de compilação e as recompilações.
- Aplicar quantização sem medir qualidade.
- Empilhar todas as otimizações de uma vez e não saber qual deu o ganho.

## Resumo do capítulo

- Método: medir → classificar (memória, cálculo, latência, overhead) → hipótese → mudar uma coisa → medir.
- **MFU** para quem é compute-bound, **MBU** para quem é memory-bound (decode). MBU acima de ~80% significa que só reduzir bytes ajuda.
- Nsight Systems para a linha do tempo; Nsight Compute para o kernel; motivos de espera dos warps dizem o que falta.
- **Lei de Little**: para saturar a HBM, é preciso muitos bytes em voo por SM. Leituras largas e independentes importam tanto quanto a occupancy.
- **Fusão** elimina idas e vindas à HBM; **CUDA graphs** eliminam o overhead de lançamento no decode.
- `torch.compile` = Dynamo (captura e guards) + AOTAutograd + Inductor (Triton). Cuidado com graph breaks e recompilações.
- Redução eficiente: grid-stride, soma em registradores, shuffle no warp, um atômico por bloco (ou duas passadas para determinismo).
- Tensor cores perto do pico exigem formato e alinhamento, tiles grandes, pipeline de cópias e SMs cheios.
- Benchmark sério: aquecimento, CUDA events, percentis, formas reais, qualidade medida.

## Checklist para a entrevista

- [ ] Classifico um kernel nas quatro classes de gargalo e digo como confirmar cada uma.
- [ ] Calculo MBU de um passo de decode.
- [ ] Sei o que mostram o Nsight Systems e o Nsight Compute e uso os nomes certos das métricas.
- [ ] Aplico a lei de Little para estimar bytes em voo.
- [ ] Percorro a árvore de diagnóstico de banda baixa sem consultar.
- [ ] Escrevo a redução com grid-stride e shuffle.
- [ ] Explico os requisitos para alimentar tensor cores.
- [ ] Explico Dynamo, Inductor, guards, graph breaks e modos do `torch.compile`.
- [ ] Explico CUDA graphs e suas limitações.
- [ ] Desenho um plano de benchmark com qualidade, latência, throughput e memória.
