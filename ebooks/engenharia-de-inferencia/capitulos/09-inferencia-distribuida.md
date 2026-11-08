# Capítulo 9 — Inferência Distribuída {#cap-09}

Um Llama 3 70B em BF16 não cabe numa H100. Modelos de centenas de bilhões de parâmetros, ou MoEs com quase um trilhão, precisam de dezenas de GPUs. Mesmo quando o modelo cabe, dividir entre várias GPUs pode reduzir a latência, porque soma a banda de memória de todas elas. Este capítulo explica as formas de dividir o trabalho entre GPUs, quanto cada uma custa em comunicação e quando usar cada uma.

As entrevistas pedem, quase sempre, três coisas: comparar **tensor parallelism** com **pipeline parallelism**, projetar uma **multiplicação de matrizes distribuída** e discutir a **desagregação de prefill e decode**. Os detalhes de rede e das operações coletivas estão no [Capítulo 10](#cap-10).

## 9.1 Por que distribuir

Três motivos diferentes, que levam a escolhas diferentes:

1. **Capacidade**: os pesos e o KV cache não cabem numa GPU.
2. **Latência**: dividir cada camada entre $p$ GPUs faz cada uma ler $1/p$ dos pesos; o passo de decode pode ficar perto de $p$ vezes mais rápido (menos a comunicação).
3. **Throughput**: mais réplicas atendem mais requisições.

```text
 Os eixos de paralelismo

 DP   data parallel      réplicas inteiras do modelo
 TP   tensor parallel    cada matriz dividida entre GPUs
 PP   pipeline parallel  camadas divididas em estágios
 EP   expert parallel    especialistas de MoE em GPUs
                         diferentes
 CP   context parallel   a sequência dividida entre GPUs
      (ou SP)            (contextos muito longos)
```

## 9.2 Data parallelism (réplicas)

Cada GPU (ou grupo de GPUs) tem o modelo inteiro e atende requisições diferentes. Não há comunicação entre réplicas durante a inferência; um balanceador distribui as requisições.

- **Prós**: simples, throughput escala linearmente, uma réplica com problema não derruba as outras.
- **Contras**: não reduz a latência de uma requisição, e exige que o modelo caiba no grupo de cada réplica.

Na prática, todo serviço em produção usa DP no nível mais alto, combinado com TP, PP ou EP dentro de cada réplica.

## 9.3 Tensor parallelism

Cada matriz de pesos é dividida entre as $p$ GPUs. Todas as GPUs participam de toda camada, cada uma com uma fatia. O esquema padrão vem do **Megatron-LM** (Shoeybi et al., 2019) e usa dois tipos de camada linear:

**Paralela em colunas.** $W$ é dividida por colunas: a GPU $i$ tem $W_{:, i}$. Cada GPU calcula $Y_i = X W_{:, i}$, uma fatia das colunas da saída. Não precisa de comunicação se a próxima operação trabalhar com essa fatia.

**Paralela em linhas.** $W$ é dividida por linhas e a entrada chega já fatiada: a GPU $i$ tem $X_i$ e $W_{i, :}$ e calcula $X_i W_{i,:}$, que é uma **soma parcial** da saída completa. Um **all-reduce** (soma entre todas as GPUs) junta os parciais.

```text
 MLP com TP = 2 (Megatron)

            X  (replicado nas 2 GPUs)
        ┌───────────┴───────────┐
        ▼ GPU 0                 ▼ GPU 1
  gate, up: colunas 0..n/2   colunas n/2..n     ◀ colunas
        │                       │                 (sem comunicação)
  SiLU(gate) × up (local)   SiLU(gate) × up
        │                       │
  down: linhas 0..n/2       linhas n/2..n       ◀ linhas
        │ parcial               │ parcial
        └──────── ALL-REDUCE ───┘                ◀ 1 comunicação
                    │
                    ▼ Y (replicado)
```

A **atenção** se divide naturalmente por heads: cada GPU calcula $H/p$ heads (projeções Q, K, V em colunas), roda a atenção dessas heads localmente com a sua parte do KV cache, e a projeção de saída é paralela em linhas, com um all-reduce.

Resultado: **dois all-reduces por camada** (um depois da atenção, um depois do MLP), cada um com um tensor de tamanho [tokens × d_model].

Em código, com `torch.distributed`:

```python
import torch
import torch.distributed as dist

class LinearColunas(torch.nn.Module):
    """W dividida por colunas: saída local, sem comunicação."""
    def __init__(self, d_in, d_out, tp):
        super().__init__()
        self.w = torch.nn.Parameter(
            torch.empty(d_in, d_out // tp))

    def forward(self, x):            # x replicado
        return x @ self.w            # fatia das colunas

class LinearLinhas(torch.nn.Module):
    """W dividida por linhas: soma parcial + all-reduce."""
    def __init__(self, d_in, d_out, tp):
        super().__init__()
        self.w = torch.nn.Parameter(
            torch.empty(d_in // tp, d_out))

    def forward(self, x_local):      # x já fatiado
        y = x_local @ self.w         # parcial
        dist.all_reduce(y, op=dist.ReduceOp.SUM)
        return y                     # completo, replicado

class MLPParalelo(torch.nn.Module):
    def __init__(self, d, d_ff, tp):
        super().__init__()
        self.gate = LinearColunas(d, d_ff, tp)
        self.up = LinearColunas(d, d_ff, tp)
        self.down = LinearLinhas(d_ff, d, tp)

    def forward(self, x):
        h = torch.nn.functional.silu(self.gate(x)) * self.up(x)
        return self.down(h)
```

### O custo da comunicação

::: conta
**Fazendo a conta: Llama 3 70B com TP = 8 numa máquina com NVLink.**

*Decode, batch de 64:*

- Cada all-reduce: 64 tokens × 8.192 × 2 bytes = **1 MB**.
- Por passo: 80 camadas × 2 = **160 all-reduces**.
- Mensagens de 1 MB são pequenas: o custo é dominado pela **latência** de cada coletiva (da ordem de 10 a 20 µs), não pela banda.
- 160 × ~15 µs ≈ **2,4 ms** por passo.
- Leitura de pesos por GPU: 140 GB / 8 = 17,5 GB → a 3,35 TB/s, **5,2 ms**.
- A comunicação acrescenta uns 45% ao passo se não for sobreposta. Por isso motores usam all-reduces customizados para mensagens pequenas e tentam sobrepor comunicação e cálculo.

*Prefill de 8.000 tokens:*

- Cada all-reduce: 8.000 × 8.192 × 2 bytes ≈ **131 MB**.
- No all-reduce em anel, cada GPU envia ~2 × (7/8) × 131 MB ≈ 230 MB. Por passo: 160 × 230 MB ≈ **37 GB** por GPU.
- Com ~450 GB/s por sentido na NVLink da H100: **~80 ms**, contra ~300 ms de cálculo. Relevante, mas sobreponível.
:::

Por isso a regra prática: **TP dentro de uma máquina** (NVLink, centenas de GB/s), quase nunca entre máquinas (InfiniBand, ~50 GB/s por GPU).

## 9.4 Pipeline parallelism

As camadas são divididas em **estágios**: a GPU 0 tem as camadas 0 a 19, a GPU 1 tem 20 a 39, e assim por diante. Cada estágio passa as ativações para o próximo.

```text
 PP = 4, 80 camadas

 GPU 0: camadas  0–19 ─▶ GPU 1: 20–39 ─▶ GPU 2: 40–59 ─▶ GPU 3: 60–79
        envia [tokens × d_model] para o próximo estágio
        (comunicação ponto a ponto, pequena)
```

- **Comunicação**: só ponto a ponto, um tensor de ativações por fronteira de estágio. Muito menos do que o TP. Funciona bem **entre máquinas**.
- **Latência**: uma requisição passa por todos os estágios em sequência. O PP **não** reduz a latência de um passo; adiciona os saltos de rede.
- **Bolhas**: com um único batch, só um estágio trabalha por vez. A solução é ter vários **micro-batches** em voo:

```text
 Sem micro-batches:           Com 4 micro-batches (m1..m4):
 GPU0 ██░░░░░░██░░░░░░        GPU0 m1 m2 m3 m4 m1 m2 m3 m4
 GPU1 ░░██░░░░░░██░░░░        GPU1 ░░ m1 m2 m3 m4 m1 m2 m3
 GPU2 ░░░░██░░░░░░██░░        GPU2 ░░ ░░ m1 m2 m3 m4 m1 m2
 GPU3 ░░░░░░██░░░░░░██        GPU3 ░░ ░░ ░░ m1 m2 m3 m4 m1
 utilização: 25%              utilização perto de 100% em regime
```

Na inferência, os micro-batches são simplesmente grupos diferentes de requisições: enquanto o estágio 1 processa o grupo A, o estágio 0 já processa o grupo B. No treino, a fração de bolha é $(p-1)/(m+p-1)$ com $m$ micro-batches; na inferência com fluxo contínuo, as bolhas aparecem quando os grupos têm tamanhos diferentes ou o fluxo é irregular.

## 9.5 Expert parallelism (MoE)

Num modelo **Mixture of Experts**, o MLP de cada camada é substituído por vários **especialistas** (MLPs menores) e um **roteador** que escolhe, para cada token, os $k$ especialistas que vão processá-lo (por exemplo, 8 de 256).

Com **EP**, os especialistas ficam em GPUs diferentes. Cada camada de MoE vira:

```text
 1. roteador decide os especialistas de cada token (local)
 2. ALL-TO-ALL (dispatch): cada GPU envia cada token para
    as GPUs que têm os especialistas escolhidos
 3. cada GPU roda os seus especialistas sobre os tokens
    que recebeu (GEMM agrupada)
 4. ALL-TO-ALL (combine): os resultados voltam para a GPU
    de origem e são somados com os pesos do roteador
```

Desafios:

- **Desequilíbrio de carga**: se muitos tokens escolhem o mesmo especialista, a GPU dele vira gargalo. Soluções: perdas de balanceamento no treino, replicar especialistas populares, limitar a capacidade por especialista.
- **All-to-all é caro**, principalmente entre máquinas. Kernels especializados de comunicação e sobreposição com cálculo são essenciais.
- A atenção de um MoE costuma ser servida com DP (cada GPU com seu grupo de requisições), enquanto as camadas de especialistas usam EP. Essa combinação é comum em implantações de MoE grandes.

## 9.6 Context parallelism

Para contextos muito longos (centenas de milhares a milhões de tokens), até o prefill de **uma** sequência é pesado demais para um grupo de TP. O **context parallelism** divide a sequência entre GPUs: cada uma guarda os K e V de um pedaço do contexto. Na atenção, os blocos de K e V circulam entre as GPUs em anel (**ring attention**), e cada GPU acumula a atenção das suas queries com o softmax online ([Capítulo 2](#cap-02)), sobrepondo a comunicação do próximo bloco com o cálculo do atual.

## 9.7 Combinando tudo

```text
 Exemplo: modelo denso de 400B, nós de 8 H100

 ┌──────────── réplica 1 (DP) ─────────────┐ ┌─ réplica 2 ─┐
 │ nó A: TP=8 (camadas 0–63)  ── PP ──▶    │ │   ...       │
 │ nó B: TP=8 (camadas 64–127)             │ │             │
 └─────────────────────────────────────────┘ └─────────────┘

 TP dentro do nó (NVLink), PP entre nós (InfiniBand),
 DP entre réplicas (balanceador)
```

Como escolher, em ordem:

1. **Quanto de memória preciso?** Pesos + KV cache para o batch e o contexto alvo. Isso dá o número mínimo de GPUs por réplica.
2. **Cabe num nó?** Se sim, TP dentro do nó (latência baixa). Se não, PP entre nós (ou EP para MoE).
3. **Quanto de TP?** Mais TP reduz a latência por passo, mas a comunicação cresce em proporção ao trabalho. Teste TP = 2, 4, 8 e meça goodput.
4. **Quantas réplicas?** Pela demanda de throughput.

## 9.8 Desagregação de prefill e decode

O [Capítulo 2](#cap-02) mostrou que prefill e decode têm gargalos opostos, e o [Capítulo 7](#cap-07) mostrou que misturá-los no mesmo passo cria interferência. A **desagregação** coloca as duas fases em **pools de GPUs diferentes**:

```text
                ┌──────────────────────┐
 requisição ───▶│ roteador / scheduler │
                └─────┬──────────▲─────┘
                      ▼          │
           ┌──────────────────┐  │
           │ POOL DE PREFILL  │  │
           │ GPUs com cálculo │  │
           │ TP alto (TTFT)   │  │
           └────────┬─────────┘  │
                    │ KV cache   │  (RDMA, NVLink)
                    ▼            │
           ┌──────────────────┐  │
           │ POOL DE DECODE   │──┘ tokens (stream)
           │ batch grande,    │
           │ memória para KV  │
           └──────────────────┘
```

Sistemas de referência: **DistServe** (Zhong et al., 2024), **Splitwise** (Patel et al., 2024) e **Mooncake** (Qin et al., 2024, da Moonshot AI, que serve o Kimi). O Mooncake é descrito como uma arquitetura **centrada no KV cache**: além de separar os pools, usa a DRAM e os SSDs ociosos do cluster como um armazenamento distribuído de KV cache, e um scheduler global que decide onde fazer o prefill para aproveitar o cache existente e rejeita requisições cedo quando a sobrecarga é prevista.

## Perguntas de entrevista comentadas

## Q065 — Explique paralelismo de tensor versus paralelismo de pipeline, e quando você usaria cada um. {#q065}

::: pergunta-meta
**[Relatado]** NVIDIA · Software Engineer · triagem técnica · listada em 2026 · Difícil · [fonte](https://prachub.com/interview-questions/explain-optimization-and-tensor-vs-pipeline-parallelism)
:::

### Resposta em 30 segundos

"Tensor parallelism divide cada matriz entre as GPUs: todas trabalham em toda camada, com dois all-reduces por camada. Isso reduz a latência de cada passo, porque cada GPU lê só uma fatia dos pesos, mas exige comunicação frequente e rápida, então uso dentro de um nó com NVLink. Pipeline parallelism divide as camadas em estágios: a comunicação é só ponto a ponto entre estágios e é pequena, então funciona entre nós, mas não reduz a latência de uma requisição e precisa de vários micro-batches em voo para não deixar estágios ociosos. Na prática: TP dentro do nó para latência; PP entre nós quando o modelo não cabe num nó; e DP por cima para throughput."

### Resposta completa

Use a tabela e os números:

| | Tensor parallelism | Pipeline parallelism |
|---|---|---|
| O que divide | cada matriz (colunas/linhas, heads) | as camadas (estágios) |
| Comunicação | 2 all-reduces por camada, [tokens × d] | 1 envio ponto a ponto por fronteira de estágio |
| Volume | alto e frequente | baixo |
| Sensível à latência da rede | muito | pouco |
| Latência de um passo | cai (~1/p da leitura de pesos) | não cai (soma os saltos) |
| Throughput | bom | bom, se houver micro-batches suficientes |
| KV cache | dividido por heads | cada estágio guarda o das suas camadas |
| Onde | dentro do nó (NVLink) | entre nós (InfiniBand) |
| Limite | número de heads de KV (TP > H_kv replica KV) | bolhas, desequilíbrio entre estágios |

Detalhes que impressionam:

- **TP e GQA**: o Llama 3 70B tem 8 heads de KV. Com TP = 8, cada GPU tem uma head de KV. Com TP = 16, as heads de KV precisam ser **replicadas**, e o KV cache por GPU deixa de diminuir. O número de heads de KV limita o TP útil.
- **TP e eficiência das GEMMs**: com TP alto, cada GPU multiplica matrizes mais finas; em batch pequeno, as GEMMs ficam ainda mais memory-bound e a fração de comunicação cresce. Há um ponto a partir do qual aumentar o TP piora.
- **PP e balanceamento**: o estágio mais lento dita o ritmo. A primeira e a última GPU têm trabalho extra (embedding, LM head), então os estágios nem sempre têm o mesmo número de camadas.
- **PP no decode**: com um único fluxo de requisições, só um estágio trabalha por vez. Para o PP ter bom throughput no decode, o scheduler precisa manter $p$ grupos de requisições em voo ao mesmo tempo, um por estágio.

Exemplos de decisão:

```text
 70B BF16, 8 H100 num nó          → TP=8 (ou TP=4 × DP=2
                                     se a latência permitir)
 70B FP8, 1 H100 cabe             → DP (réplicas de 1 GPU)
                                     ou TP=2 para latência
 400B denso, 16 H100 em 2 nós     → TP=8 × PP=2
 MoE de ~700B, muitos nós         → EP para especialistas +
                                     DP/TP para a atenção
```

### Perguntas de acompanhamento prováveis

- **Por que não TP entre nós?** A banda por GPU cai de centenas de GB/s (NVLink) para ~50 GB/s (InfiniBand NDR), e a latência sobe. Com 160 all-reduces por passo, a comunicação passaria a dominar.
- **Sequence parallelism, no contexto do Megatron, é o quê?** Uma extensão do TP em que as operações que não são divididas pelo TP (normas, dropout) são divididas ao longo da sequência; o all-reduce vira reduce-scatter + all-gather. Reduz memória de ativações (mais relevante no treino).
- **Como sobrepor a comunicação do TP?** Dividir a GEMM em pedaços e começar a comunicar o primeiro enquanto calcula o segundo, ou fundir a GEMM com a coletiva em kernels que fazem as duas coisas.
- **O que muda com MoE?** Os especialistas pedem EP com all-to-all ([9.5](#cap-09)), que é outro padrão de comunicação.

### Armadilhas comuns

- Dizer que PP reduz a latência.
- Não saber quantas comunicações o TP faz por camada.
- Ignorar o limite imposto pelo número de heads de KV.
- Não falar de micro-batches e bolhas.

## Q066 — Projete uma multiplicação de matrizes em múltiplas GPUs. {#q066}

::: pergunta-meta
**[Relatado]** Google · design de sistemas de ML · listada em 2026 · Difícil · [fonte](https://prachub.com/interview-questions/design-multi-gpu-matrix-multiplication)
:::

### Resposta em 30 segundos

"Depende das formas e de onde os dados já estão. Para C = A·B com p GPUs, há três divisões básicas: por linhas de A, com B replicado e nenhuma comunicação no cálculo; por colunas de B, com A replicado, que é o column-parallel do Megatron; e ao longo de K, em que cada GPU calcula uma soma parcial e um all-reduce ou reduce-scatter junta tudo, o row-parallel. Para matrizes grandes nas três dimensões, uso uma decomposição 2D como o SUMMA, que reduz a memória e a comunicação por GPU para a ordem de 1/√p. Escolho com um modelo de custo de comunicação e sobreponho comunicação e cálculo dividindo o trabalho em blocos."

### Resposta completa

**1. Perguntas de esclarecimento.** Tamanhos de M, N e K? Quantas GPUs e como estão ligadas? Onde A e B estão no começo, e onde C precisa terminar? É uma multiplicação única ou parte de uma sequência (como camadas de um modelo, em que a saída de uma é a entrada da próxima)?

**2. As decomposições.**

```text
 (a) por linhas de A           (b) por colunas de B
   A      B       C              A       B        C
 ┌───┐  ┌───┐  ┌───┐           ┌───┐  ┌─┬─┬─┐  ┌─┬─┬─┐
 │ 0 │  │   │  │ 0 │           │   │  │0│1│2│  │0│1│2│
 ├───┤  │ B │  ├───┤           │ A │  │ │ │ │  │ │ │ │
 │ 1 │ ×│rep│ =│ 1 │           │rep│ ×│ │ │ │ =│ │ │ │
 ├───┤  │   │  ├───┤           │   │  │ │ │ │  │ │ │ │
 │ 2 │  │   │  │ 2 │           └───┘  └─┴─┴─┘  └─┴─┴─┘
 └───┘  └───┘  └───┘
 comunicação: replicar B        comunicação: replicar A
 (ou já estar replicado)        C sai dividido por colunas

 (c) ao longo de K (soma parcial)
   A            B         C
 ┌─┬─┬─┐      ┌───┐
 │0│1│2│      │ 0 │     C = A0·B0 + A1·B1 + A2·B2
 │ │ │ │   ×  ├───┤        (cada GPU calcula um termo)
 │ │ │ │      │ 1 │     comunicação: ALL-REDUCE de C
 └─┴─┴─┘      ├───┤     (ou REDUCE-SCATTER se C pode
              │ 2 │      terminar dividido)
              └───┘
```

**3. Modelo de custo.** Use o modelo α-β: enviar $n$ bytes custa $\alpha + n\beta$ (latência + tempo por byte). Para cada decomposição, com elementos de $b$ bytes:

| Decomposição | Cálculo por GPU | Dados a comunicar (aprox.) | Memória por GPU |
|---|---|---|---|
| (a) linhas de A | $2MNK/p$ | replicar B: $KN \cdot b$ | $(MK/p + KN + MN/p) \cdot b$ |
| (b) colunas de B | $2MNK/p$ | replicar A: $MK \cdot b$ | $(MK + KN/p + MN/p) \cdot b$ |
| (c) ao longo de K | $2MNK/p$ | all-reduce de C: ~$2MN \cdot b$ | $(MK/p + KN/p + MN) \cdot b$ |
| 2D (SUMMA) | $2MNK/p$ | ~$(MK + KN) \cdot b/\sqrt{p}$ | $(MK + KN + MN) \cdot b/p$ |

A regra que sai da tabela: **comunique a matriz menor** e **evite replicar a maior**.

- Camada de LLM no decode: A = ativações (pequena: batch × d), B = pesos (enorme). Replicar A e dividir B: decomposição (b) ou (c). É exatamente o TP do Megatron.
- Treino com batch gigante e pesos pequenos: replicar B (pesos) e dividir A (dados): decomposição (a), que é data parallelism.

**4. SUMMA (2D) em detalhe.** As GPUs formam uma grade $\sqrt{p} \times \sqrt{p}$. A GPU $(i, j)$ guarda o bloco $A_{ij}$, $B_{ij}$ e calcula $C_{ij}$:

```text
 para k = 0 .. √p − 1:
     a GPU (i, k) envia A_ik para toda a linha i
     a GPU (k, j) envia B_kj para toda a coluna j
     cada GPU (i, j): C_ij += A_ik · B_kj
```

A memória fica dividida por $p$ em todas as matrizes, e cada GPU recebe $O((MK + KN)/\sqrt{p})$ dados. É a escolha para matrizes grandes nas três dimensões. Em hardware com topologia de malha ou toro (como pods de TPU), decomposições 2D e 3D se encaixam naturalmente na topologia.

**5. Sobrepor comunicação e cálculo.** Divida cada transferência em blocos e faça pipeline:

```text
 sem sobreposição: [ comunica tudo ][   calcula tudo   ]
 com sobreposição: [com 1][com 2][com 3][com 4]
                          [calc 1][calc 2][calc 3][calc 4]
```

Em GPUs: streams CUDA separadas para NCCL e para os kernels, ou kernels que fazem cálculo e comunicação juntos. Em TPUs/XLA, a mesma ideia aparece como "collective matmul".

**6. Considerações práticas.** Topologia (NVLink dentro do nó, InfiniBand entre nós: use decomposições hierárquicas, com a comunicação pesada dentro do nó), formas não divisíveis por $p$ (padding ou fatias desiguais), precisão (somas parciais em FP32 antes de reduzir) e determinismo da redução.

### Perguntas de acompanhamento prováveis

- **E se uma das matrizes já estiver distribuída de um jeito específico?** Escolha a decomposição que aproveita o layout existente; redistribuir também custa comunicação. Em sequências de camadas, alterne colunas e linhas (como no Megatron) para que a saída de uma já esteja no layout que a próxima precisa.
- **Qual o speedup máximo?** Pela lei de Amdahl ([Q018](#q018)), a comunicação não sobreposta limita. Com o modelo α-β, compare o tempo de cálculo $2MNK/(p \cdot F)$ com o de comunicação; quando a comunicação domina, adicionar GPUs piora.
- **Por que reduce-scatter em vez de all-reduce?** Se a próxima operação aceita C dividido, o reduce-scatter custa metade do all-reduce (que é um reduce-scatter seguido de um all-gather).
- **Algoritmos com menos comunicação?** Decomposições 2,5D e 3D usam memória extra (replicação parcial) para reduzir ainda mais a comunicação.

### Armadilhas comuns

- Apresentar uma única decomposição sem discutir as formas.
- Ignorar o custo de comunicação ou a topologia.
- Esquecer a sobreposição de comunicação e cálculo.
- Não conectar com o TP de LLMs, que é a aplicação mais comum.

## Q067 — Por que você separaria (desagregaria) prefill e decode em máquinas diferentes, como faz o Mooncake? O que isso traz de ganho e qual é o custo? {#q067}

::: pergunta-meta
**[Fornecedor]** Moonshot AI (Kimi), segundo banco público de perguntas por empresa · Presencial · 2026 · Difícil · [fonte](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)
:::

### Resposta em 30 segundos

"Porque prefill e decode têm gargalos e SLOs opostos: prefill é compute-bound e define o TTFT; decode é memory-bound e define o TPOT. Na mesma GPU, um prefill longo atrasa os decodes de todo mundo e vice-versa. Separando, cada pool tem a configuração, o paralelismo e até o hardware certos para a sua fase, e cada um é dimensionado para o seu SLO, o que aumenta o goodput. O custo é transferir o KV cache do prefill para o decode, centenas de MB a GB por requisição longa, o que exige rede RDMA rápida; mais complexidade de scheduling e de falhas; e o risco de desequilíbrio entre os dois pools, porque a proporção ideal muda com a carga. O Mooncake vai além e trata o KV cache como um recurso do cluster todo, usando DRAM e SSD ociosos como cache distribuído para reaproveitar prefixos."

### Resposta completa

**Os ganhos.**

1. **Fim da interferência.** Sem prefills no meio, os passos de decode têm tempo previsível: ITL estável. Sem decodes, o prefill usa a GPU inteira: TTFT melhor.
2. **Configuração por fase.** Prefill pode usar TP alto (corta o TTFT de prompts longos); decode pode usar TP menor e batch enorme (throughput). Na mesma máquina, você precisa de um compromisso.
3. **Escala independente.** Se os prompts ficam mais longos (RAG, agentes), aumenta só o pool de prefill. Se as respostas ficam mais longas (raciocínio), aumenta só o de decode.
4. **Hardware especializado.** Prefill pede FLOPS; decode pede banda e capacidade de memória. Em princípio, cada pool pode usar a GPU com melhor custo para a sua fase.
5. **Goodput.** O DistServe mostrou que otimizar cada fase para seu próprio SLO aumenta o número de requisições por GPU que cumprem os dois SLOs, em comparação com sistemas que colocam as duas fases juntas.

**Os custos.**

::: conta
**Fazendo a conta: a transferência do KV.** Llama 3 70B, prompt de 8.000 tokens: 2,6 GB de KV cache.

- Com TP = 8 nos dois pools, cada GPU de prefill envia sua fatia (~330 MB) para a GPU correspondente no decode.
- Com InfiniBand NDR (~50 GB/s por GPU): ~**7 ms**. Contra ~300 ms de prefill, é pouco, e dá para enviar camada por camada enquanto o prefill ainda calcula as próximas, escondendo quase tudo.
- Sem RDMA (por exemplo, TCP em rede de 25 Gb/s, ~3 GB/s): ~**110 ms por GPU** de fatia. Aí a transferência pesa no TTFT.
- Para prompts curtos (200 tokens, ~65 MB), a transferência é desprezível, mas o ganho da desagregação também é menor.
:::

Outros custos:

- **Complexidade**: dois pools, um protocolo de transferência, um scheduler global que escolhe o par prefill-decode, tratamento de falhas no meio da transferência (se a GPU de decode morre, o KV se perde).
- **Desequilíbrio**: a razão entre capacidade de prefill e de decode depende da distribuição de tamanhos de entrada e saída. Se a carga muda, um pool fica ocioso enquanto o outro enfileira. Mitigações: pools elásticos, máquinas que podem trocar de papel, ou modo híbrido com chunked prefill.
- **Memória duplicada temporariamente**: o KV existe nos dois lados até a transferência terminar.

**Quando não vale.** Para cargas com prompts curtos e SLOs folgados, o chunked prefill numa arquitetura única costuma ser mais simples e quase tão bom. A desagregação compensa em escala, com prompts longos, SLOs rígidos de ITL e rede RDMA disponível.

**O que o Mooncake adiciona.** A arquitetura é centrada no KV cache:

```text
 ┌──────────────────────────────────────────────────┐
 │ scheduler global ("Conductor")                   │
 │  escolhe a máquina de prefill que já tem o maior │
 │  prefixo em cache, e a de decode com folga;      │
 │  rejeita cedo se previsão indica sobrecarga      │
 └───────┬──────────────────────────────┬───────────┘
         ▼                              ▼
 ┌─────────────────┐  KV via RDMA  ┌─────────────────┐
 │ pool de prefill │──────────────▶│ pool de decode  │
 └────────┬────────┘               └─────────────────┘
          │ lê/grava prefixos
          ▼
 ┌──────────────────────────────────────────────────┐
 │ armazenamento distribuído de KV cache            │
 │ DRAM e SSD ociosos de todas as máquinas do       │
 │ cluster, compartilhados via rede                 │
 └──────────────────────────────────────────────────┘
```

Para um produto de chat com contextos longos (como o Kimi, conhecido por isso), reaproveitar prefixos entre turnos e entre usuários vale muito, e a memória da CPU do cluster inteiro é muito maior do que a HBM.

### Perguntas de acompanhamento prováveis

- **Como dimensionar a proporção entre prefill e decode?** Pela carga: tokens de entrada por segundo ÷ throughput de prefill por GPU, e sequências simultâneas ÷ capacidade de decode por GPU. Ajustar dinamicamente com base nas filas de cada pool.
- **E se a GPU de decode falhar no meio da geração?** O KV dela se perde. Opções: refazer o prefill (talvez com prefixo no cache distribuído) e continuar de onde parou com os tokens já gerados, ou devolver erro e deixar o cliente tentar de novo.
- **Chunked prefill não resolve o mesmo problema?** Resolve parte: limita a interferência, mas as duas fases ainda dividem a GPU e a configuração. A desagregação elimina a interferência e permite configurações diferentes, ao custo da transferência.
- **Por que rejeitar requisições cedo?** Se a previsão mostra que a requisição não vai cumprir o SLO, rejeitá-la antes do prefill evita gastar GPU com trabalho que será inútil (o cliente vai desistir ou estourar o timeout).

### Armadilhas comuns

- Não quantificar a transferência do KV cache.
- Ignorar o problema de desequilíbrio entre os pools.
- Dizer que desagregação é sempre melhor.
- Não diferenciar a ideia geral (DistServe, Splitwise) do que o Mooncake adiciona (KV cache distribuído no cluster).

## Resumo do capítulo

- Motivos para distribuir: capacidade, latência, throughput. Cada um leva a um eixo diferente.
- **DP**: réplicas, sem comunicação, throughput linear.
- **TP** (Megatron): colunas e depois linhas; dois all-reduces por camada; reduz a latência; dentro do nó; limitado pelas heads de KV.
- **PP**: estágios de camadas; comunicação pequena ponto a ponto; entre nós; não reduz a latência; precisa de micro-batches.
- **EP**: especialistas de MoE distribuídos; dois all-to-all por camada de MoE; desafio de balanceamento.
- **CP**: sequência dividida, ring attention para contextos muito longos.
- GEMM distribuída: por linhas, por colunas, ao longo de K, ou 2D (SUMMA). Comunique a menor matriz; sobreponha comunicação e cálculo.
- **Desagregação** de prefill e decode: sem interferência, configuração e escala por fase; custo: transferência do KV, complexidade e desequilíbrio. Mooncake: KV cache distribuído no cluster.

## Checklist para a entrevista

- [ ] Explico os cinco eixos de paralelismo e o motivo de cada um.
- [ ] Desenho o MLP com TP (colunas, linhas, all-reduce) e escrevo o código.
- [ ] Calculo o volume e o tempo da comunicação do TP no decode e no prefill.
- [ ] Explico bolhas no PP e como micro-batches resolvem.
- [ ] Explico o fluxo de uma camada MoE com EP (dispatch e combine).
- [ ] Monto a configuração de paralelismo para um modelo e hardware dados.
- [ ] Desenho as três decomposições de GEMM e preencho a tabela de custos.
- [ ] Explico SUMMA em poucas linhas.
- [ ] Listo ganhos e custos da desagregação, com a conta da transferência do KV.
- [ ] Explico o que o Mooncake adiciona à desagregação básica.
