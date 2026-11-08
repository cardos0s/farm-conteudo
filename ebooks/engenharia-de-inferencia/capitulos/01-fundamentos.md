# Capítulo 1 — Fundamentos de Engenharia de Inferência {#cap-01}

Este capítulo é a base de todo o resto do livro. Se você entender bem três ideias, metade das perguntas de entrevista fica fácil:

1. Gerar texto é um processo **sequencial**: um token de cada vez, e cada token depende do anterior.
2. Para gerar cada token, a GPU precisa **ler todos os pesos do modelo** da memória. Ler é muito mais lento que calcular.
3. A saída para esse gargalo é **atender muitos usuários ao mesmo tempo** (batching), e isso cria todos os trade-offs entre latência, throughput e custo.

O entrevistador que pergunta "por que a inferência é memory-bound?" ou "o que são TTFT e TPOT?" está testando se você tem esse modelo mental. Se tiver, você consegue raciocinar sobre qualquer sistema novo. Se não tiver, você só repete nomes de ferramentas.

## 1.1 A vida de uma requisição

Antes de entrar na GPU, vale ver o caminho completo de uma requisição num serviço de LLM:

```text
 Usuário                                                  Usuário
   │ "Explique o que é um buraco negro"                      ▲
   ▼                                                         │ tokens
┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐    │ chegando
│ Gateway  │─▶│ Roteador │─▶│ Fila do   │─▶│ Scheduler  │    │ um a um
│ auth,    │  │ escolhe  │  │ servidor  │  │ do motor   │    │ (stream)
│ rate     │  │ réplica  │  │ de modelo │  │ monta o    │    │
│ limit    │  │          │  │           │  │ batch      │    │
└──────────┘  └──────────┘  └───────────┘  └─────┬──────┘    │
                                                 ▼           │
              ┌──────────────────────────────────────────┐   │
              │ GPU                                      │   │
              │ 1. tokeniza o prompt (na CPU, antes)     │   │
              │ 2. PREFILL: processa o prompt inteiro    │   │
              │    de uma vez, gera o 1º token           │───┤
              │ 3. DECODE: gera 1 token por passo,       │   │
              │    repete até parar                      │───┘
              └──────────────────────────────────────────┘
```

Duas fases aparecem dentro da GPU, e elas têm comportamentos opostos:

- **Prefill** (pré-preenchimento): o modelo lê o prompt inteiro de uma vez. Se o prompt tem 2.000 tokens, a GPU processa os 2.000 em paralelo numa única passada. Isso é muito trabalho de cálculo e a GPU fica bem ocupada.
- **Decode** (decodificação): o modelo gera a resposta, um token por passada. Para gerar o token 501, ele precisa do token 500. Não dá para paralelizar dentro de uma mesma resposta.

O [Capítulo 2](#cap-02) mostra o que acontece dentro do modelo em cada fase. Aqui o importante é a consequência: o prefill é limitado por **cálculo** e o decode é limitado por **memória**.

## 1.2 Ler é mais caro que calcular

Uma GPU tem dois recursos principais:

- **Capacidade de cálculo**, medida em FLOPS (operações de ponto flutuante por segundo). Uma H100 faz cerca de **989 trilhões** de operações BF16 por segundo nas unidades de matriz (tensor cores).
- **Banda de memória**, medida em bytes por segundo. A memória principal da H100 (HBM3, 80 GB) entrega cerca de **3,35 trilhões de bytes** por segundo.

Divida um pelo outro:

$$\frac{989 \times 10^{12} \text{ FLOP/s}}{3{,}35 \times 10^{12} \text{ B/s}} \approx 295 \text{ FLOP por byte}$$

Isso quer dizer: para a H100 ficar ocupada calculando, cada byte que ela lê da memória precisa ser usado em umas 295 operações. Se você faz menos que isso por byte, as unidades de cálculo ficam esperando os dados chegarem. Esse número tem nome: é o **ponto de equilíbrio** (ridge point) da GPU, e a métrica "operações por byte lido" se chama **intensidade aritmética**.

::: analogia
**Analogia:** imagine um cozinheiro extremamente rápido (o cálculo) que depende de um ajudante buscando ingredientes na despensa (a memória). Se cada ingrediente que chega vira um prato complicado, com 300 passos, o cozinheiro fica sempre ocupado. Se cada ingrediente vira só um passo ("coloca o sal"), o cozinheiro passa o dia parado esperando o ajudante. O decode de um LLM é o segundo caso.
:::

### Quanto o decode faz por byte

Num passo de decode para **um** usuário, o modelo multiplica um vetor (o estado do token atual) por cada matriz de pesos. Cada peso é lido da memória uma vez e participa de uma multiplicação e uma soma: **2 operações**. Em BF16, cada peso ocupa **2 bytes**. Então:

$$\text{intensidade} = \frac{2 \text{ FLOP}}{2 \text{ bytes}} = 1 \text{ FLOP por byte}$$

A GPU aguenta 295 e você está dando 1. As unidades de cálculo ficam ociosas mais de 99% do tempo. Isso é o que significa dizer que o decode é **memory-bound** (limitado pela banda de memória).

::: conta
**Fazendo a conta:** Llama 3 8B em BF16 tem cerca de 8 bilhões de parâmetros × 2 bytes = **16 GB** de pesos.

- Tempo para ler 16 GB a 3,35 TB/s: 16 / 3.350 = **~4,8 ms** por passo de decode.
- Operações por token: ~2 × 8 bilhões = **16 GFLOP**. A 989 TFLOPS, isso leva **~0,016 ms**.
- O passo é limitado pelos 4,8 ms de leitura, não pelos 0,016 ms de cálculo. A leitura é **300 vezes** mais lenta.
- Velocidade máxima teórica para um usuário sozinho: 1 / 4,8 ms ≈ **210 tokens por segundo**. Na prática, com overheads, fica bem abaixo disso.
:::

### O batching resolve (em parte)

Agora imagine 64 usuários gerando ao mesmo tempo. Em vez de multiplicar a matriz por 1 vetor, você multiplica por 64 vetores empilhados (uma matriz de 64 linhas). Os pesos são lidos **uma vez** e usados 64 vezes. A intensidade aritmética sobe para cerca de 64 FLOP por byte.

O tempo do passo quase não muda, porque continua dominado pela leitura dos 16 GB. Mas agora cada passo gera 64 tokens em vez de 1. O throughput multiplica por quase 64, de graça.

```text
 Tempo por passo de decode (Llama 3 8B, H100, só pesos)

  batch    leitura    cálculo    passo     tokens/s total
  ─────    ───────    ───────    ─────     ──────────────
      1    4,8 ms     0,02 ms    4,8 ms           ~210
     16    4,8 ms     0,26 ms    4,8 ms         ~3.300
     64    4,8 ms     1,0 ms     4,8 ms        ~13.000
    256    4,8 ms     4,1 ms     ~5 ms         ~50.000
    512    4,8 ms     8,3 ms     ~8 ms         ~60.000
           (a partir daqui, o cálculo vira o gargalo)
```

Esses números são o limite ideal, considerando só os pesos. Na vida real, dois fatores atrapalham:

1. **O KV cache**. Cada usuário tem um cache de atenção que também precisa ser lido em todo passo, e ele **não é compartilhado** entre usuários. Com 64 usuários de 4.000 tokens de contexto, o KV cache do 8B tem uns 33 GB (a conta está no [Capítulo 6](#cap-06)), mais que os próprios pesos. Batching não amortiza essa leitura.
2. **A memória acaba**. Os 80 GB da GPU precisam caber os pesos e os KV caches de todos os usuários. É isso que limita o tamanho do batch na prática.

Por isso o KV cache é o assunto mais cobrado em entrevistas: ele é o que impede o batching de resolver tudo.

## 1.3 O modelo roofline

O **roofline** (telhado) é um gráfico que resume tudo isso. No eixo X fica a intensidade aritmética de um kernel. No eixo Y, a performance que ele consegue atingir.

```text
 TFLOPS
 atingíveis
   ▲
989┤                         ┌──────────────────────────── teto de
   │                        ╱    COMPUTE-BOUND             cálculo
   │                       ╱     (prefill, GEMMs grandes)
   │                      ╱
   │                     ╱
   │                    ╱  MEMORY-BOUND
   │                   ╱   (decode com batch pequeno,
   │                  ╱     atenção no decode,
   │                 ╱      softmax, layernorm)
   │                ╱
   │   inclinação  ╱
   │   = banda    ╱
   │   3,35 TB/s ╱
   └────────────┴─────────────┬─────────────────────────▶
               1             295            intensidade
           (decode b=1)  (ponto de          (FLOP/byte)
                          equilíbrio)
```

A regra:

$$\text{performance} = \min(\text{pico de FLOPS},\; \text{banda} \times \text{intensidade})$$

À esquerda do ponto de equilíbrio, você está limitado pela memória: a única forma de ficar mais rápido é ler menos bytes (quantizar, fundir kernels, reaproveitar dados) ou aumentar a intensidade (batching). À direita, você está limitado pelo cálculo: precisa usar melhor os tensor cores ou fazer menos operações.

O [Capítulo 4](#cap-04) usa o roofline a fundo para diagnosticar kernels. Por enquanto, guarde a ideia: **antes de otimizar qualquer coisa, descubra de que lado do telhado você está**.

## 1.4 As métricas que importam

Um serviço de LLM é avaliado por métricas de **latência** (quanto um usuário espera) e de **throughput** (quanto trabalho o sistema faz). Todo entrevistador espera que você saiba defini-las com precisão.

```text
 Linha do tempo de UMA requisição com streaming

 envio      1º token      2º       3º       4º            último
   │            │          │        │        │               │
   ▼            ▼          ▼        ▼        ▼               ▼
   ├────────────┼──────────┼────────┼────────┼─── ... ───────┤
   │◀── TTFT ──▶│◀─ ITL ──▶│◀─ ITL ▶│◀─ ITL ▶│               │
   │  (fila +   │                                            │
   │  prefill)  │◀──────── (N−1) × TPOT médio ──────────────▶│
   │◀───────────────── latência ponta a ponta ──────────────▶│
```

| Métrica | O que é | Dominada por | Quem sente |
|---|---|---|---|
| **TTFT** (time to first token) | tempo do envio até o primeiro token | fila + prefill | usuário de chat: "travou?" |
| **ITL** (inter-token latency) | tempo entre dois tokens seguidos | um passo de decode | fluidez do texto aparecendo |
| **TPOT** (time per output token) | média de tempo por token depois do primeiro | decode | velocidade de leitura |
| **Latência E2E** | do envio ao último token | TTFT + (N−1) × TPOT | API sem streaming, agentes |
| **Throughput** | tokens (ou requisições) por segundo do sistema | tamanho do batch, eficiência | quem paga a conta |
| **Goodput** | throughput que **cumpre o SLO** | tudo junto | o negócio |

A fórmula que liga as três primeiras:

$$\text{latência E2E} = \text{TTFT} + (N - 1) \times \text{TPOT}$$

onde $N$ é o número de tokens gerados.

::: conta
**Fazendo a conta:** um chat com TTFT de 400 ms e TPOT de 25 ms gera uma resposta de 500 tokens em 0,4 + 499 × 0,025 ≈ **12,9 segundos**. O usuário vê o primeiro token em 0,4 s e lê a uma velocidade de 40 tokens por segundo, mais rápido do que uma pessoa lê (umas 4 a 5 palavras por segundo, ou seja, uns 6 a 8 tokens por segundo). Para chat, um TPOT abaixo de ~50 ms já parece fluido. Para um agente que encadeia 20 chamadas, os 12,9 s viram mais de 4 minutos, e aí cada milissegundo de TPOT importa.
:::

### Percentis: a média mente

Latência nunca deve ser reportada só pela média. Use **percentis**:

- **p50** (mediana): metade das requisições é mais rápida que isso.
- **p90, p99**: 90% ou 99% são mais rápidas. O resto é a **cauda** (tail).

Num serviço com 10 milhões de requisições por dia, o p99 representa 100 mil requisições por dia. São pessoas reais tendo uma experiência ruim. Além disso, se uma tela depende de 10 chamadas em paralelo, a chance de pelo menos uma cair no p99 é $1 - 0{,}99^{10} \approx 9{,}6\%$. A cauda de um componente vira a experiência comum do sistema.

### Goodput: throughput que serve

Um sistema que gera 50 mil tokens por segundo, mas com TTFT de 30 segundos, não serve para chat. **Goodput** é o número de requisições por segundo que o sistema atende **cumprindo o SLO** (por exemplo, TTFT p99 < 1 s e TPOT p99 < 50 ms). É a métrica certa para comparar configurações. O paper do DistServe (Zhong et al., 2024) popularizou o termo para inferência de LLM.

### O trade-off fundamental

Aumentar o batch aumenta o throughput, mas cada passo de decode fica mais lento (mais KV cache para ler, mais cálculo), e novas requisições esperam mais para entrar. A curva típica:

```text
 Throughput
 (tokens/s)
    ▲
    │                                   ●─────●  batch 256
    │                            ●──────          (satura)
    │                     ●─────     batch 64
    │               ●────     batch 32
    │          ●───   batch 16
    │      ●──   batch 8
    │   ●─  batch 4
    │ ● batch 1
    └──────────────────────────────────────────────▶
     baixa                                      alta
                  Latência por token (TPOT)

  Escolher o ponto de operação = escolher o maior throughput
  que ainda cumpre o SLO de latência.
```

Toda otimização boa de inferência faz uma de duas coisas: **move a curva inteira** para cima e para a esquerda (mais throughput com a mesma latência), ou permite **operar num ponto melhor** da curva com segurança.

## 1.5 Custo por token

No fim, o negócio olha uma métrica: **quanto custa gerar um milhão de tokens**.

$$\text{custo por 1M tokens} = \frac{\text{custo da GPU por hora}}{\text{tokens por hora}} \times 10^6$$

::: conta
**Fazendo a conta (valores hipotéticos):** suponha uma H100 a US$ 2,50 por hora e um serviço que sustenta 2.500 tokens de saída por segundo nessa GPU, cumprindo o SLO.

- Tokens por hora: 2.500 × 3.600 = 9.000.000.
- Custo por 1M tokens: 2,50 / 9 = **US$ 0,28**.

Se uma otimização aumenta o throughput para 3.500 tokens/s com o mesmo SLO, o custo cai para US$ 0,20. Numa frota de 10.000 GPUs rodando 24 horas por dia, a mesma melhoria de 40% equivale a economizar umas 2.900 GPUs, ou cerca de US$ 63 milhões por ano ao preço hipotético acima.
:::

Duas observações que impressionam entrevistadores:

1. **Tokens de entrada e de saída têm custos diferentes.** Prefill processa muitos tokens por passada e usa bem a GPU. Decode gera um token por passada por usuário. Por isso as APIs comerciais costumam cobrar mais caro o token de saída do que o de entrada.
2. **Utilização não é eficiência.** O `nvidia-smi` pode mostrar "100% GPU utilization" com a GPU fazendo pouco trabalho útil. Essa métrica só diz que algum kernel estava rodando naquele intervalo, não quanto do hardware ele usava. Meça tokens por segundo por GPU e MFU/MBU (veja o [Capítulo 4](#cap-04)).

## 1.6 Inferência síncrona, assíncrona e em lote

Nem toda inferência precisa responder na hora. Existem três modos principais:

```text
 SÍNCRONA (online)
 cliente ──req──▶ servidor ──▶ GPU
 cliente ◀──resp (ou stream)── servidor
 o cliente fica esperando com a conexão aberta

 ASSÍNCRONA (job)
 cliente ──req──▶ API ──▶ fila ──▶ worker ──▶ GPU
 cliente ◀─ "job 123 aceito" (na hora)
 ... depois ...
 cliente ──GET /jobs/123──▶ API     (polling)
   ou   API ──POST webhook──▶ cliente (callback)

 BATCH (offline)
 cliente envia arquivo com 1 milhão de prompts
 sistema processa quando há GPU sobrando (horas)
 cliente baixa arquivo com resultados
```

| | Síncrona | Assíncrona | Batch offline |
|---|---|---|---|
| Latência esperada | ms a segundos | segundos a minutos | horas |
| Exemplo | chat, autocomplete | geração de relatório, vídeo | rotular dataset, avaliações |
| SLO principal | TTFT, TPOT | tempo de conclusão | custo, prazo (ex.: 24 h) |
| Uso da GPU | precisa de folga para picos | fila suaviza picos | enche os vales de uso |
| Falhas | cliente vê erro, tenta de novo | sistema faz retry sozinho | retry por item |

A grande vantagem dos modos assíncronos e em lote é **econômica**: o tráfego síncrono tem picos (horário comercial) e vales (madrugada). Você precisa de GPUs para o pico, e elas ficam ociosas no vale. Trabalho assíncrono e em lote preenche esses vales com prioridade baixa, e por isso pode ser vendido mais barato.

::: dica
**Dica de entrevista:** quando falar de síncrono vs assíncrono, fale de **prioridades e preempção**. Um bom sistema mistura os dois na mesma frota: requisições síncronas têm prioridade, e as de batch usam a capacidade que sobra e podem ser pausadas ou interrompidas quando o tráfego síncrono sobe.
:::

## 1.7 O mapa de otimizações

Para fechar a teoria, um mapa das principais alavancas, com o capítulo que aprofunda cada uma:

| Alavanca | O que ataca | Ganho típico | Capítulo |
|---|---|---|---|
| Continuous batching | GPU ociosa entre requisições | grande em throughput | [7](#cap-07) |
| PagedAttention | desperdício de memória do KV cache | batch maior | [6](#cap-06) |
| Prefix caching | prefill repetido (system prompt, chat) | TTFT e custo | [6](#cap-06) |
| Quantização (FP8, INT4) | bytes lidos por passo | ~1,5–3× no decode | [8](#cap-08) |
| FlashAttention | tráfego de memória da atenção | atenção bem mais rápida | [2](#cap-02) |
| Fusão de kernels, CUDA graphs | overhead de lançamento e leituras extras | 10–30% em decode | [4](#cap-04) |
| Tensor/pipeline parallel | modelo não cabe, latência | permite servir | [9](#cap-09) |
| Speculative decoding | decode sequencial | ~2–3× em latência | [14](#cap-14) |
| Prefill/decode separados | interferência entre fases | goodput | [9](#cap-09) |

Os ganhos variam muito por modelo, hardware e carga. Na entrevista, fale de faixas e do mecanismo, nunca de um número mágico.

## Perguntas de entrevista comentadas

## Q001 — Qual é a sua experiência com otimização de inferência para LLMs? {#q001}

::: pergunta-meta
**[Relatado]** Groq · Research Engineer · Londres · relatado em 2025 · Médio · [fonte](https://www.glassdoor.ca/Interview/Groq-Interview-E2473036-RVW103307190.htm)
:::

### Resposta em 30 segundos

"Trabalhei principalmente em [área]. O caso mais relevante foi [projeto]: o serviço tinha [problema medido], eu descobri com [ferramenta/medição] que o gargalo era [causa], fiz [mudança] e o resultado foi [número antes → depois] em [métrica que o negócio usa]. Também tenho experiência com [2 ou 3 técnicas], e hoje estou estudando [tema atual]."

### Resposta completa

Essa pergunta parece um bate-papo, mas é uma triagem técnica disfarçada. O entrevistador quer saber três coisas:

1. **Você mediu antes de mexer?** Quem otimiza sem medir chuta.
2. **Você entende o porquê?** "Usei vLLM e ficou mais rápido" não mostra entendimento. "O decode estava limitado por memória e o batch médio era 6 porque o KV cache fragmentava; o PagedAttention elevou o batch para 40" mostra.
3. **Você conhece o espaço de técnicas?** Quantização, batching, KV cache, kernels, paralelismo, speculative decoding.

Use a estrutura **contexto → medição → hipótese → mudança → resultado → aprendizado**:

```text
 ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
 │ CONTEXTO │─▶│ MEDIÇÃO  │─▶│ HIPÓTESE │─▶│ MUDANÇA  │─▶│RESULTADO │
 │ modelo,  │  │ profiler,│  │ "é o KV  │  │ o que    │  │ antes →  │
 │ hardware,│  │ métricas,│  │ cache    │  │ você fez │  │ depois,  │
 │ carga,   │  │ p50/p99  │  │ que..."  │  │ e por quê│  │ em $ ou  │
 │ SLO      │  │          │  │          │  │          │  │ latência │
 └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Exemplo de resposta modelo** (adapte à sua experiência real; nunca invente números numa entrevista):

> "No meu último trabalho eu cuidava do serviço de um modelo de 13B para um assistente interno, em A100s. O TTFT p99 passava de 6 segundos no horário de pico, e o SLO era 2 segundos. Medindo, vi que o problema não era o prefill em si: requisições ficavam até 4 segundos na fila, porque usávamos batching estático e uma requisição com prompt de 8 mil tokens travava o batch inteiro. Migrei para um motor com continuous batching e chunked prefill, com chunks de 512 tokens. O TTFT p99 caiu para 1,3 segundo e o throughput subiu 2,4 vezes, o que nos deixou desligar 5 das 12 GPUs. Depois testei quantização FP8 dos pesos; a perda na nossa avaliação interna ficou dentro da margem de ruído, e ganhamos mais uns 30% de throughput. O que aprendi é que o primeiro gargalo quase sempre está no scheduling, não no kernel."

Se você ainda não tem experiência profissional com isso, seja honesto e mostre projeto próprio com medições: "Ainda não fiz isso em produção. No meu projeto pessoal servi um Llama 3 8B numa RTX 4090, medi TTFT e TPOT com batch 1 a 64, comparei FP16 com AWQ INT4 e entendi por que o ganho no decode foi maior do que no prefill." Isso vale muito mais do que fingir.

### Perguntas de acompanhamento prováveis

- **Como você mediu?** Cite ferramentas e métricas concretas: benchmark de carga com distribuição real de tamanhos de prompt, TTFT/TPOT p50 e p99, `torch.profiler`, Nsight Systems, métricas do motor (tamanho do batch, uso do KV cache, preempções).
- **Qual foi o maior trade-off?** Por exemplo: chunked prefill melhorou o TTFT, mas piorou um pouco o TPOT dos usuários em decode. Mostre que você notou e decidiu de propósito.
- **O que você faria diferente?** Mostre maturidade: "teria montado o benchmark de carga reproduzível antes de mexer em qualquer coisa".
- **Como garantiu que a qualidade não caiu?** Avaliação antes e depois (benchmarks da tarefa, comparação lado a lado, taxa de erro em produção), principalmente para quantização.

### Armadilhas comuns

- Listar ferramentas ("usei vLLM, TensorRT, Triton...") sem nenhum número ou causa.
- Dar números sem dizer **o que** foi medido (throughput de quê? com qual batch? qual percentil?).
- Atribuir a si o trabalho do time inteiro. Diga "eu" para o que você fez e "nós" para o resto.
- Não mencionar a qualidade do modelo depois de otimizações que podem alterá-la.

## Q002 — Por que a inferência de LLMs é limitada por memória (memory-bound)? {#q002}

::: pergunta-meta
**[Fornecedor]** Compilado de relatos de candidatos, sem empresa citada · Triagem · 2026 · Fácil · [fonte](https://adilshamim8.medium.com/every-ai-engineer-interview-question-you-need-to-know-in-2026-from-100-real-interviews-b5b7ae4b961a)
:::

### Resposta em 30 segundos

"Porque no decode cada token novo exige ler todos os pesos do modelo e todo o KV cache da memória, mas faz só umas 2 operações por peso lido. Isso dá uma intensidade aritmética perto de 1 FLOP por byte com batch 1, enquanto uma H100 precisa de uns 300 para ficar limitada por cálculo. A GPU passa a maior parte do tempo esperando a memória. O batching sobe a intensidade para os pesos, mas o KV cache é por usuário e não se amortiza, e a memória limita o tamanho do batch."

### Resposta completa

Comece pela distinção entre as fases, porque a pergunta só é verdadeira para o decode:

- **Prefill** processa $T$ tokens de uma vez. Cada peso lido é usado $T$ vezes. Com prompts de algumas centenas de tokens, a intensidade passa do ponto de equilíbrio e o prefill é **compute-bound**.
- **Decode** processa 1 token por usuário por passo. Cada peso lido é usado uma vez por usuário do batch.

Depois mostre a conta (seção [1.2](#cap-01)): 16 GB de pesos do 8B lidos a 3,35 TB/s levam ~4,8 ms; o cálculo leva ~0,016 ms. A leitura domina.

Em seguida, explique por que o batching não resolve tudo:

```text
 Bytes lidos por passo de decode
 ─────────────────────────────────────────────────────────
 pesos          W bytes        (lidos 1× para o batch todo)
 KV cache       B × L × k      (cada usuário tem o seu)
                B = batch, L = contexto, k = bytes/token
 ─────────────────────────────────────────────────────────
 FLOPs úteis    ≈ 2 × P × B    (P = parâmetros)

 intensidade ≈ 2PB / (W + B·L·k)
   - com contexto curto: cresce com B (bom)
   - com contexto longo: o termo do KV domina e a
     intensidade empaca, por maior que seja o batch
```

A atenção do decode é intrinsecamente memory-bound: cada usuário lê o próprio KV cache e faz poucas operações com ele (um produto escalar e uma soma ponderada por token armazenado). Não há reaproveitamento entre usuários.

Por último, liste as consequências práticas, porque é aí que você mostra senioridade:

1. **Quantizar ajuda o decode mais do que o prefill.** Pesos em INT4 leem 4× menos bytes que BF16. Num regime memory-bound, isso vira quase direto velocidade.
2. **Tamanho do batch é limitado por memória, não por cálculo.** Por isso técnicas de memória (PagedAttention, GQA, quantização do KV cache) aumentam o throughput.
3. **A banda de memória é o número mais importante da GPU para decode.** Por isso a geração de GPUs com mais HBM e mais banda (H200, B200) dá ganhos grandes em inferência mesmo quando o FLOPS cresce menos.
4. **Speculative decoding funciona** porque usa o cálculo ocioso: verificar vários tokens de uma vez custa quase o mesmo que gerar um.

### Perguntas de acompanhamento prováveis

- **O prefill também é memory-bound?** Em geral não. Com prompts de centenas de tokens ou mais, as multiplicações de matriz têm intensidade alta e ficam compute-bound. Prompts muito curtos (poucas dezenas de tokens) podem continuar memory-bound.
- **A partir de qual batch o decode vira compute-bound?** Olhando só os pesos, perto do ponto de equilíbrio: algumas centenas na H100 em BF16. Com FP8 nos pesos e cálculo em FP8, o ponto muda (o pico de FP8 é ~2× maior, e os bytes caem pela metade). Na prática, a memória do KV cache costuma limitar o batch antes disso.
- **Como você confirmaria isso com um profiler?** No Nsight Compute, kernels de GEMV/GEMM do decode mostram throughput de memória (DRAM) perto do pico e throughput de SM/tensor core baixo. A métrica MBU (model bandwidth utilization) perto de 70–90% indica que você está bem otimizado para memória.
- **E MoE?** Num modelo Mixture of Experts, cada token usa só alguns especialistas. Com batch pequeno, você lê poucos especialistas; com batch grande, quase todos são ativados e os bytes lidos crescem. A intensidade por especialista é menor do que num modelo denso de mesmo tamanho ativo, o que torna o MoE ainda mais memory-bound no decode.

### Armadilhas comuns

- Dizer "porque o modelo é grande e não cabe na GPU". Isso é capacidade de memória, não banda. São problemas diferentes.
- Esquecer o KV cache e dizer que batching resolve tudo.
- Não diferenciar prefill de decode.
- Confundir "memory-bound" com "falta de memória (OOM)".

## Q003 — O que são TTFT, TPOT e throughput, e como um compete com o outro? {#q003}

::: pergunta-meta
**[Fornecedor]** Banco público de perguntas · Triagem · 2026 · Fácil · [fonte](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
:::

### Resposta em 30 segundos

"TTFT é o tempo até o primeiro token: fila mais prefill. TPOT é o tempo médio por token gerado depois disso: um passo de decode. Throughput é quantos tokens ou requisições por segundo o sistema entrega. Eles competem porque batches maiores aumentam o throughput, mas deixam cada passo de decode mais lento (TPOT sobe) e, se você prioriza o decode de quem já está rodando, novos prompts esperam mais (TTFT sobe). Se você prioriza prefills novos, o TTFT melhora e quem está no decode sofre pausas. O objetivo é o maior throughput que ainda cumpre o SLO de TTFT e TPOT, ou seja, maximizar o goodput."

### Resposta completa

Defina com precisão (seção [1.4](#cap-01)) e depois mostre os três conflitos:

**Conflito 1 — Throughput vs TPOT.** Batch maior → mais KV cache lido por passo e mais cálculo → cada passo demora mais → cada usuário vê tokens mais devagar. Mas o sistema gera mais tokens no total.

**Conflito 2 — TTFT vs TPOT.** Quando chega uma requisição nova, o scheduler pode:

```text
 Opção A: prioriza prefill novo (TTFT bom)
 passo:   │ D │ D │PREFILL 4000 tokens│ D │ D │ D │
 usuário em decode vê um "soluço" de várias dezenas de ms

 Opção B: prioriza decode (TPOT estável)
 passo:   │ D │ D │ D │ D │ D │ D │ D │PREFILL│
 a nova requisição espera → TTFT ruim

 Opção C: chunked prefill (meio-termo)
 passo:   │D+p│D+p│D+p│D+p│ D │ D │
 cada passo junta os decodes + um pedaço (chunk) do prefill
```

O chunked prefill (SARATHI, Agrawal et al.) e a desagregação de prefill e decode em máquinas diferentes (DistServe, Splitwise, Mooncake) são as duas respostas modernas a esse conflito. Estão nos Capítulos [7](#cap-07) e [9](#cap-09).

**Conflito 3 — Throughput vs custo de cauda.** Rodar a GPU a 95% de ocupação maximiza throughput, mas qualquer pico vira fila, e a fila explode o TTFT p99. Teoria de filas: o tempo de espera cresce de forma não linear quando a utilização se aproxima de 100%. Em sistemas simples, a espera média é proporcional a $\rho / (1-\rho)$, onde $\rho$ é a utilização. Com 50% de uso, o fator é 1; com 90%, é 9; com 95%, é 19.

Para ligar tudo, use a fórmula E2E $=$ TTFT $+ (N-1) \times$ TPOT e explique que **o peso relativo de cada métrica depende do produto**:

| Produto | Métrica principal | Por quê |
|---|---|---|
| Chat | TTFT e TPOT | o usuário está olhando a tela |
| Autocomplete de código | TTFT (bem baixo) | saídas curtas, precisa parecer instantâneo |
| Agente com muitas chamadas | latência E2E | as chamadas são sequenciais |
| API de resumo em lote | throughput / custo | ninguém está esperando |
| Voz | TTFT | silêncio na conversa é muito perceptível |

### Perguntas de acompanhamento prováveis

- **ITL e TPOT são a mesma coisa?** Quase. ITL é cada intervalo individual entre tokens; TPOT costuma ser a média por requisição. Os percentis de ITL mostram os "soluços" que a média do TPOT esconde.
- **Como você mede TTFT corretamente?** Do ponto de vista do cliente, do envio até o primeiro byte do primeiro token no stream. Medir só dentro do servidor ignora fila no gateway, rede e tokenização.
- **Throughput em tokens ou em requisições?** Depende. Tokens por segundo é melhor para comparar eficiência de hardware; requisições por segundo com SLO (goodput) é melhor para planejar capacidade. Sempre separe tokens de entrada e de saída.
- **Como o tamanho do prompt afeta cada métrica?** Prompt longo aumenta o TTFT (mais prefill) e o TPOT (mais KV cache lido em cada passo de decode).

### Armadilhas comuns

- Definir TPOT incluindo o primeiro token. TPOT é sobre os tokens seguintes.
- Falar de média em vez de percentis.
- Dizer que throughput e latência "sempre" se opõem. Otimizações como quantização ou kernels melhores melhoram os dois.
- Esquecer o tempo de fila no TTFT.

## Q004 — Explique passo a passo como um forward pass de um transformer é executado de fato numa GPU. {#q004}

::: pergunta-meta
**[Fornecedor]** Lista de perguntas comuns de inferência de um fornecedor de preparação · Presencial · 2026 · Médio · [fonte](https://www.techinterview.org/post/3233475331/ai-inference-infrastructure-interview-prep-2026-vllm-triton/)
:::

### Resposta em 30 segundos

"A CPU tokeniza o texto e copia os IDs para a GPU. A GPU faz um lookup na tabela de embeddings. Para cada camada, ela lança uma sequência de kernels: normalização, uma GEMM para Q, K e V, RoPE, o kernel de atenção que também lê e escreve o KV cache, a GEMM de projeção de saída, a soma residual, outra normalização, as GEMMs do MLP com a ativação no meio e outra soma residual. No fim, normalização final, a GEMM do LM head gera os logits e um kernel de sampling escolhe o próximo token. Pesos e ativações moram na HBM; cada kernel traz blocos para SRAM e registradores, calcula e escreve de volta. No decode, isso tudo é limitado pela leitura dos pesos, e o overhead de lançar centenas de kernels pesa; por isso usam-se fusão de kernels e CUDA graphs."

### Resposta completa

Desenhe o fluxo para um modelo estilo Llama (o [Capítulo 2](#cap-02) explica cada bloco em detalhe):

```text
 CPU                               GPU (HBM = memória principal)
 ───                               ──────────────────────────────
 texto ─▶ tokenizer ─▶ IDs ──cópia─▶ IDs [B, T]
 (Python/Rust)        (PCIe)        │
                                    ▼
                         [K1] embedding lookup (gather)
                                    │  x: [B, T, d]
            ┌───────────────────────┼─── repete para cada camada
            │                       ▼
            │            [K2] RMSNorm
            │            [K3] GEMM x·W_qkv  → Q, K, V
            │            [K4] RoPE em Q e K
            │            [K5] grava K, V no KV cache
            │            [K6] atenção (FlashAttention /
            │                 PagedAttention): lê KV cache
            │            [K7] GEMM saída · W_o
            │            [K8] soma residual (+ x)
            │            [K9] RMSNorm
            │            [K10] GEMM x·W_gate, x·W_up
            │            [K11] SiLU(gate) * up
            │            [K12] GEMM · W_down
            │            [K13] soma residual
            └───────────────────────┼───
                                    ▼
                         [K14] RMSNorm final
                         [K15] GEMM LM head → logits [B, V]
                         [K16] sampling (temperature,
                               top-p) → próximo token
 próximo token ◀──cópia (PCIe)──────┘
```

Agora detalhe o que acontece **dentro** de um kernel típico, porque é isso que separa uma resposta média de uma excelente:

1. **Lançamento.** A CPU chama a API do CUDA, que coloca o kernel numa fila (stream) da GPU. Cada lançamento custa alguns microssegundos de CPU. Um modelo de 80 camadas com ~13 kernels por camada lança mais de mil kernels por passo de decode. Se cada kernel leva poucos microssegundos de GPU, a CPU vira o gargalo.
2. **Grid de blocos.** O kernel é dividido em blocos de threads (por exemplo, cada bloco calcula um pedaço 128×128 da matriz de saída). O hardware distribui os blocos entre os **SMs** (streaming multiprocessors; a H100 tem 132).
3. **Movimento de dados.** Cada bloco carrega os pedaços de que precisa da **HBM** (grande e lenta) para a **shared memory** (pequena e rápida, dentro do SM) e para os **registradores**. Os **tensor cores** fazem as multiplicações de matriz nesses dados.
4. **Escrita.** O resultado vai de volta para a HBM, onde o próximo kernel vai ler.

```text
 HBM (80 GB, ~3,35 TB/s)
   │  pesos, ativações, KV cache
   ▼
 L2 cache (50 MB, compartilhado por todos os SMs)
   ▼
 SM: shared memory / L1 (até ~228 KB por SM)
   ▼
 registradores (~256 KB por SM) ─▶ tensor cores / CUDA cores
```

Esse ciclo "lê da HBM, calcula, escreve na HBM" a cada kernel é a fonte de duas ineficiências:

- **Tráfego extra.** O resultado da RMSNorm é escrito na HBM só para a GEMM seguinte ler de novo. A **fusão de kernels** junta operações (por exemplo, RMSNorm + quantização, ou SiLU × up) para os dados intermediários não saírem do chip.
- **Overhead de lançamento.** Os **CUDA graphs** gravam a sequência inteira de kernels de um passo de decode uma vez e a reexecutam com um único lançamento. Em decode com batch pequeno, isso pode dar ganhos de dezenas de por cento.

Por fim, diga o que muda com mais de uma GPU: com tensor parallelism, cada GPU tem uma fatia das matrizes, e depois da projeção de saída da atenção e da GEMM `W_down` do MLP há um **all-reduce** (soma entre GPUs) pela NVLink. Isso dá dois all-reduces por camada ([Capítulo 9](#cap-09)).

::: dica
**Dica de entrevista:** depois de descrever o fluxo, diferencie prefill e decode no mesmo diagrama. "No prefill, x tem T linhas e as GEMMs são grandes e compute-bound. No decode, x tem uma linha por usuário, as GEMMs viram quase multiplicações matriz-vetor e tudo fica limitado pela leitura de pesos e do KV cache." Isso mostra que você entende o desempenho, não só o fluxo.
:::

### Perguntas de acompanhamento prováveis

- **Quais desses kernels dominam o tempo?** Em prefill, as GEMMs (QKV, saída, MLP) e, com contextos longos, a atenção. Em decode com batch pequeno, as GEMMs (limitadas pela leitura dos pesos). Em decode com batch grande e contexto longo, a atenção (leitura do KV cache) cresce muito.
- **Onde fica o KV cache e quando ele é escrito?** Na HBM. K e V do token atual são calculados no kernel QKV e gravados no cache antes ou durante o kernel de atenção, que então lê o cache inteiro daquela sequência.
- **Por que o sampling pode ser um problema?** Ordenar um vocabulário de 128 mil entradas para top-p é caro se feito ingenuamente, e sincronizar com a CPU a cada token (para checar tokens de parada) adiciona latência. Motores modernos fazem o sampling na GPU e reduzem as sincronizações.
- **O que muda num modelo MoE?** O bloco MLP vira um roteador (gate) que escolhe os k especialistas por token, seguido de GEMMs agrupadas (grouped GEMM) por especialista e uma etapa para recombinar os resultados.

### Armadilhas comuns

- Descrever só a matemática ("Q vezes K transposto...") sem falar de kernels, memória e lançamento.
- Esquecer a tokenização na CPU e as cópias CPU↔GPU.
- Não mencionar onde o KV cache entra.
- Ignorar o overhead de lançamento de kernels no decode.

## Q007 — Como você aborda a otimização de custos de um sistema de IA que está estourando o orçamento? {#q007}

::: pergunta-meta
**[Fornecedor]** Banco público de perguntas · Comportamental-técnica · 2026 · Médio · [fonte](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
:::

### Resposta em 30 segundos

"Primeiro eu meço para onde o dinheiro vai: custo por requisição e por funcionalidade, utilização real das GPUs, tokens de entrada e saída por chamada. Depois ataco em ordem de retorno sobre esforço: cortar desperdício (GPUs ociosas, chamadas duplicadas, prompts inchados, saídas longas demais), usar cache (prefix caching, cache de respostas), escolher o modelo certo para cada tarefa (roteamento para modelos menores), mover o que pode para batch assíncrono, e só então otimizações de serving: quantização, batching melhor, kernels. Toda mudança passa por avaliação de qualidade, e acompanho o custo por unidade de negócio, não só a conta total."

### Resposta completa

Mostre um processo. O entrevistador quer ver se você parte de dados e se pensa em produto, não só em GPU.

**Passo 1 — Medir e decompor.** Monte uma visão como esta:

```text
 Custo mensal: US$ 400k  (orçamento: US$ 250k)
 ├── Funcionalidade A (chat)              US$ 220k
 │   ├── tokens de entrada                 70%  ◀ system prompt
 │   │                                          de 3.000 tokens
 │   │                                          em toda chamada!
 │   └── tokens de saída                   30%
 ├── Funcionalidade B (resumo diário)     US$ 120k
 │   └── roda síncrono às 9h, pico        ◀ podia ser batch
 └── GPUs reservadas ociosas à noite      US$ 60k  ◀ desperdício
```

A métrica certa é **custo por unidade de valor**: custo por conversa, por documento resumido, por usuário ativo. Se a conta total sobe porque o uso triplicou, talvez o problema seja preço, não eficiência.

**Passo 2 — Cortes baratos (dias).**

- **Prompts**: system prompts enormes repetidos em toda chamada. Enxugar ou usar prefix caching (o prefixo comum é calculado uma vez e reaproveitado; [Q043](#q043)).
- **Saídas**: limitar `max_tokens`, pedir respostas mais concisas, formatos estruturados.
- **Chamadas duplicadas**: retries sem controle, a mesma pergunta processada várias vezes. Cache de respostas para entradas idênticas.
- **Ociosidade**: autoscaling, desligar réplicas fora do pico, juntar modelos pouco usados em menos GPUs.

**Passo 3 — Mudanças de arquitetura (semanas).**

- **Roteamento de modelos**: 70% das perguntas podem ser simples o bastante para um modelo menor. Um classificador barato (ou o próprio modelo pequeno com fallback) manda só as difíceis para o grande.
- **Assíncrono e batch**: tudo que não precisa de resposta imediata vai para filas de baixa prioridade que usam capacidade ociosa ([Q008](#q008)).
- **Distilação**: treinar um modelo menor especializado na tarefa ([Capítulo 8](#cap-08)).

**Passo 4 — Eficiência de serving (semanas a meses).**

- Quantização FP8/INT4, continuous batching, ajuste do tamanho do batch e do paralelismo, speculative decoding, GPUs mais adequadas (por exemplo, GPUs de inferência mais baratas para modelos pequenos).

**Passo 5 — Governança.** Painel de custo por equipe e funcionalidade, orçamento por time, alertas de anomalia. Sem isso, o custo volta a subir.

::: dica
**Dica de entrevista:** termine com o trade-off com qualidade: "Toda redução de custo que muda o modelo, o prompt ou a precisão passa por uma avaliação offline e um teste A/B. Economizar 40% e perder 5% de satisfação pode ser um mau negócio."
:::

### Perguntas de acompanhamento prováveis

- **Qual seria sua primeira ação na segunda-feira?** Instrumentar: custo por funcionalidade e por chamada, com contagem de tokens. Sem isso tudo é chute.
- **Como decidir entre um modelo maior quantizado e um menor em precisão total?** Avaliar os dois na tarefa real, com o mesmo orçamento de GPU. Em geral, modelos maiores quantizados para 8 bits perdem muito pouco; 4 bits depende do método e do modelo.
- **E se a empresa usa uma API externa (não hospeda o modelo)?** As alavancas mudam: prompt caching da API, batch API com desconto, escolha do modelo por tarefa, controle de tokens. Hospedar o próprio modelo só compensa acima de um volume em que as GPUs ficam bem utilizadas.
- **Como evitar que a otimização quebre algo?** Rollout gradual, métricas de qualidade e de erro por versão, possibilidade de rollback rápido.

### Armadilhas comuns

- Pular direto para "vou escrever kernels" sem medir onde está o custo.
- Ignorar a qualidade.
- Otimizar o total em vez do custo por unidade de valor.
- Esquecer as GPUs ociosas: muitas vezes são o maior desperdício.

## Q008 — Inferência síncrona vs. assíncrona: quando usar cada uma? {#q008}

::: pergunta-meta
**[Fornecedor]** Banco público de perguntas · Triagem · 2026 · Fácil · [fonte](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
:::

### Resposta em 30 segundos

"Síncrona quando há um humano ou sistema esperando a resposta naquele momento, com SLO de segundos: chat, autocomplete, voz. Assíncrona quando a resposta pode chegar depois: jobs longos, processamento de documentos, geração em lote, avaliações. A assíncrona usa fila, desacopla o pico de chegada da capacidade, permite retries e prioridade baixa, e usa GPU ociosa; o custo é complexidade (status, polling ou webhooks, idempotência) e latência maior. Muitos sistemas usam os dois na mesma frota, com o tráfego síncrono tendo prioridade."

### Resposta completa

Use a tabela da seção [1.6](#cap-01) e depois aprofunde três pontos.

**1. Critério de decisão.** Pergunte: *quem está esperando, e quanto tempo aguenta?*

```text
 Alguém está esperando a resposta agora?
 ├── Sim
 │   ├── A resposta sai em < ~30–60 s?
 │   │   ├── Sim ─▶ SÍNCRONA (de preferência com streaming)
 │   │   └── Não ─▶ ASSÍNCRONA com barra de progresso
 │   │              (conexões longas caem: proxies, celular)
 │   └──
 └── Não
     ├── Precisa terminar até um prazo (ex.: 24 h)?
     │   └── BATCH offline, prioridade baixa
     └── Reage a um evento (upload, e-mail novo)?
         └── ASSÍNCRONA dirigida por eventos (fila)
```

**2. O que a assíncrona exige.**

- **Fila durável** (Kafka, SQS, Pub/Sub, Redis Streams) e workers que puxam trabalho.
- **Idempotência**: se o worker morrer no meio, o job é refeito. A chave de idempotência evita cobrar ou processar duas vezes.
- **Status do job**: `pendente → rodando → concluído/falhou`, com resultado guardado num armazenamento (objeto, banco).
- **Notificação**: polling (`GET /jobs/{id}`) ou webhook (o servidor chama o cliente). Webhook precisa de assinatura, retries e de um fallback de polling.
- **Backpressure**: se a fila crescer demais, recuse ou atrase novos jobs antes de a latência virar dias.

**3. Por que isso importa para a GPU.** O tráfego síncrono tem picos. Você dimensiona a frota para o pico com folga, e o vale fica ocioso. Jobs assíncronos e em lote com prioridade baixa preenchem o vale. O scheduler precisa conseguir **preemptar** (pausar ou interromper) trabalho de baixa prioridade quando chega tráfego síncrono. Também ajuda que jobs em lote toleram batches enormes e latência alta, então rodam no ponto de máximo throughput da curva da seção [1.4](#cap-01).

```text
 Uso da frota ao longo do dia

 100% ┤        ████████████
      │      ██████████████████          ░ = batch/async
      │    ██████████████████████░░        preenchendo
  50% ┤░░████████████████████████░░░░      os vales
      │░░████████████████████████████░░
      │░░████████████████████████████░░░
   0% └┴──────┴──────┴──────┴──────┴──────▶
      0h     6h    12h    18h    24h
      █ = tráfego síncrono
```

### Perguntas de acompanhamento prováveis

- **Streaming é síncrono ou assíncrono?** Síncrono: a conexão fica aberta e os tokens chegam conforme são gerados (Server-Sent Events, WebSocket ou gRPC streaming). Melhora a latência percebida, mas a conexão continua ocupada até o fim.
- **Como garantir que um job assíncrono não roda duas vezes?** Não dá para garantir "exatamente uma vez" em sistemas distribuídos com falhas. Use entrega "pelo menos uma vez" com processamento idempotente: chave de deduplicação, escrita do resultado condicionada ao estado do job.
- **Como priorizar batch sem prejudicar o síncrono?** Filas separadas por prioridade, cotas, e preempção no scheduler do motor (pausar ou devolver para a fila requisições de baixa prioridade quando o KV cache aperta).
- **Quando uma requisição síncrona deveria virar assíncrona?** Quando o tempo esperado passa dos timeouts típicos (proxies e balanceadores costumam cortar conexões ociosas em dezenas de segundos ou alguns minutos) ou quando o cliente é móvel e a conexão é instável.

### Armadilhas comuns

- Achar que assíncrono é sempre mais barato. Só é se a capacidade usada for a ociosa ou se permitir batches maiores.
- Esquecer idempotência e retries.
- Usar polling agressivo (milhares de clientes a cada 100 ms) e criar um problema de carga novo.
- Não falar de prioridade e preempção.

## Resumo do capítulo

- Gerar texto tem duas fases: **prefill** (prompt inteiro de uma vez, compute-bound) e **decode** (um token por passo, memory-bound).
- No decode com batch 1, a intensidade aritmética é ~1 FLOP/byte, enquanto a H100 precisa de ~295 para ficar limitada por cálculo.
- Llama 3 8B em BF16: 16 GB de pesos → ~4,8 ms por passo só de leitura numa H100 → no máximo ~210 tokens/s para um usuário sozinho.
- **Batching** amortiza a leitura dos pesos, mas o **KV cache** é por usuário e limita o batch pela memória.
- O **roofline** diz se um kernel é limitado por memória ou por cálculo: performance = min(pico, banda × intensidade).
- **TTFT** = fila + prefill. **TPOT/ITL** = passo de decode. **E2E** = TTFT + (N−1) × TPOT. **Goodput** = throughput que cumpre o SLO.
- Reporte latência em **percentis** (p50, p99), nunca só a média.
- Custo por 1M tokens = custo da GPU por hora ÷ tokens por hora × 10⁶.
- Síncrono para quem espera agora; assíncrono e batch para o resto, preenchendo a capacidade ociosa com prioridade baixa.

## Checklist para a entrevista

- [ ] Explico prefill vs decode e por que um é compute-bound e o outro memory-bound.
- [ ] Faço a conta do tempo mínimo de um passo de decode para qualquer modelo e GPU.
- [ ] Sei o ponto de equilíbrio da H100 (~295 FLOP/byte) e de onde ele vem.
- [ ] Desenho o roofline e posiciono decode, prefill e operações elementares nele.
- [ ] Defino TTFT, ITL, TPOT, E2E, throughput e goodput sem hesitar.
- [ ] Explico os três conflitos: throughput vs TPOT, TTFT vs TPOT, utilização vs cauda.
- [ ] Calculo custo por milhão de tokens.
- [ ] Descrevo o forward pass como sequência de kernels, com o caminho dos dados na memória.
- [ ] Tenho uma história de otimização com contexto, medição, causa, mudança e resultado em números.
- [ ] Sei quando usar inferência síncrona, assíncrona e em lote, e o que a assíncrona exige.
