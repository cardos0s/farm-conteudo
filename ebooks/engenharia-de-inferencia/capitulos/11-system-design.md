# Capítulo 11 — Design de Sistemas de Inferência {#cap-11}

As entrevistas de system design de inferência juntam tudo o que vimos até aqui: batching, KV cache, paralelismo, rede, quantização. A diferença em relação ao system design "clássico" (encurtador de URL, feed de rede social) é que o recurso escasso é a **GPU**: cara, de subida lenta, com memória pequena, e com um desempenho que depende fortemente de como as requisições são agrupadas.

Os relatos de entrevista na Anthropic aparecem repetidamente neste capítulo: serviço de LLM de alta concorrência, API de inferência para vários modelos, distribuição de pesos. Vamos primeiro montar um **roteiro de resposta** que serve para qualquer enunciado, depois uma **arquitetura de referência**, e então aplicar os dois às três perguntas.

## 11.1 O roteiro de resposta

Uma entrevista de design dura de 45 a 60 minutos. Use o tempo assim:

```text
 ┌──────────────────────────────────────────────────────────┐
 │ 1. REQUISITOS (5–8 min)                                  │
 │    funcionais: o que a API faz                           │
 │    não funcionais: SLOs, escala, custo, isolamento       │
 │    restrições: modelos, hardware, regiões                │
 ├──────────────────────────────────────────────────────────┤
 │ 2. CONTAS DE GUARDANAPO (5 min)                          │
 │    tokens/s de entrada e saída, KV cache, GPUs           │
 ├──────────────────────────────────────────────────────────┤
 │ 3. API E ARQUITETURA DE ALTO NÍVEL (10 min)              │
 │    caminho de uma requisição de ponta a ponta            │
 ├──────────────────────────────────────────────────────────┤
 │ 4. APROFUNDAMENTOS (15–20 min)                           │
 │    os 2 ou 3 componentes mais difíceis; deixe o          │
 │    entrevistador escolher                                │
 ├──────────────────────────────────────────────────────────┤
 │ 5. FALHAS, OPERAÇÃO, EVOLUÇÃO (5–10 min)                 │
 │    o que quebra, como você vê, como cresce               │
 └──────────────────────────────────────────────────────────┘
```

As perguntas de requisito que você deve fazer em quase todo design de inferência:

- **Que modelos?** Tamanho, arquitetura (denso, MoE), quantos modelos e versões.
- **Que carga?** Requisições por segundo (média e pico), tamanho típico de entrada e saída, distribuição (cauda longa?), streaming ou não.
- **Que SLOs?** TTFT e TPOT p50/p99, disponibilidade, latência E2E para não streaming.
- **Quem são os clientes?** Interno ou externo, multi-tenant, prioridades, quotas.
- **Que hardware?** Tipo de GPU, homogêneo ou misto, capacidade disponível, uma ou várias regiões.
- **O que é pior: rejeitar ou atrasar?** Define a estratégia de sobrecarga.

## 11.2 Contas de guardanapo

::: conta
**Fazendo a conta: dimensionamento (cenário hipotético).**

*Requisitos:* pico de 200 requisições/s; entrada média de 1.500 tokens; saída média de 300 tokens; modelo 70B em FP8; réplicas de 8 H100 com TP=8; SLO de TPOT p99 de 40 ms.

*Demanda:*

- Tokens de entrada: 200 × 1.500 = **300 mil tokens/s**.
- Tokens de saída: 200 × 300 = **60 mil tokens/s**.
- Requisições em andamento (lei de Little): taxa × duração. Cada uma dura uns 300 × 40 ms = 12 s → 200 × 12 ≈ **2.400 sequências simultâneas**.

*Capacidade de uma réplica (estimativas):*

- Prefill: 8 × ~1.979 TFLOPS FP8 × 40% de eficiência ≈ 6,3 PFLOPS. Cada token custa ~2 × 70 × 10⁹ = 140 GFLOP → ~**45 mil tokens/s** de prefill.
- Decode: suponha que, para manter o TPOT em 40 ms, a réplica aguente ~150 sequências → 150 / 0,04 = **3.750 tokens/s**.
- KV cache para 150 sequências de ~1.650 tokens (FP8, 160 KiB/token): 150 × 1.650 × 160 KiB ≈ **40 GB**. Cabe com folga nos ~500 GB livres. A memória **não** é o limite; o SLO de TPOT é.

*Réplicas:*

- Decode: 2.400 / 150 = **16 réplicas**.
- Prefill: 300 mil / 45 mil ≈ **7 réplicas-equivalentes** de tempo de GPU. Com chunked prefill, parte disso vai "de carona" nos passos de decode, então o total fica entre 16 e 23 réplicas.
- Com 30% de folga para picos e falhas: ~**25 a 30 réplicas = 200 a 240 H100**.

Os números de capacidade por réplica são hipóteses; num design real, você os mede com um benchmark. Mas a estrutura da conta (demanda em tokens, lei de Little, capacidade por réplica limitada pelo SLO ou pela memória, folga) é o que o entrevistador quer ver.
:::

## 11.3 Arquitetura de referência

```text
                         clientes
                            │ HTTPS (streaming SSE)
                            ▼
 ┌───────────────────────────────────────────────────────────┐
 │ API GATEWAY                                               │
 │ autenticação, quotas e rate limit (por tokens), validação,│
 │ tokenização (opcional aqui), logs de auditoria            │
 └──────────────────────────┬────────────────────────────────┘
                            ▼
 ┌───────────────────────────────────────────────────────────┐
 │ ROTEADOR                                                  │
 │ modelo/versão → pool; A/B e canary; afinidade de prefixo; │
 │ carga por réplica (tokens em voo, KV livre, fila);        │
 │ admissão e rejeição antecipada                            │
 └───────┬─────────────────────┬───────────────────┬─────────┘
         ▼                     ▼                   ▼
 ┌───────────────┐     ┌───────────────┐   ┌───────────────┐
 │ pool modelo A │     │ pool modelo A │   │ pool modelo B │
 │ v7 (estável)  │     │ v8 (canary)   │   │ ...           │
 │ réplicas:     │     │               │   │               │
 │ engine + GPUs │     │               │   │               │
 └───────────────┘     └───────────────┘   └───────────────┘

 PLANO DE CONTROLE                     DADOS
 ┌──────────────────────────┐   ┌─────────────────────────┐
 │ registro de modelos      │   │ armazenamento de pesos  │
 │ controlador de deploy    │   │ (objeto + caches locais)│
 │ autoscaler               │   │ cache distribuído de KV │
 │ configuração e quotas    │   │ fila de jobs assíncronos│
 └──────────────────────────┘   └─────────────────────────┘
 OBSERVABILIDADE: métricas (TTFT, TPOT, filas, KV, GPU),
 traces por requisição, logs, alertas por SLO
```

### Componentes que costumam ser aprofundados

**Roteamento e balanceamento.**

- Balancear por **carga em tokens**, não por número de requisições: uma réplica com 3 prompts de 50 mil tokens está mais carregada que uma com 30 prompts curtos.
- **Power of two choices**: sortear duas réplicas e escolher a menos carregada. Quase tão bom quanto olhar todas, sem precisar de estado global perfeito.
- **Afinidade de prefixo**: mandar requisições com o mesmo prefixo para a mesma réplica (hash consistente do prefixo), com desvio quando ela estiver sobrecarregada ([Q043](#q043)).

**Autoscaling.**

- Métricas boas: tokens em voo por réplica, uso do KV cache, tamanho da fila, TTFT p95 recente. CPU e "GPU utilization" do `nvidia-smi` são métricas ruins.
- O problema central: **subir uma réplica leva minutos** (alocar GPUs, baixar pesos, carregar, compilar, aquecer). Soluções: escalar por previsão (padrão diário), manter folga, pools quentes, carga rápida de pesos ([Q083](#q083)).
- Escalar para baixo com cuidado: drenar a réplica (parar de mandar requisições novas e esperar as atuais terminarem) antes de desligar.

**Admissão e backpressure.**

- Fila limitada por réplica e no roteador.
- Rejeitar cedo (HTTP 429 com `Retry-After`) quando o tempo estimado de espera já passa do SLO.
- Prioridades: tráfego pago e síncrono antes de gratuito e batch; preempção de baixa prioridade.

**Multi-tenancy.**

- Quotas por cliente em tokens por minuto (entrada e saída separadas), não só requisições.
- Fair share: um cliente não pode ocupar toda a fila. Filas por cliente com round robin ponderado.
- Isolamento de cache (prefix cache com salt por tenant) e de dados (logs).
- Clientes grandes ou com SLO rígido: capacidade dedicada ([Q091](#q091)).

**Streaming, cancelamento e falhas.**

- SSE ou gRPC streaming. Detectar cliente desconectado e cancelar a geração para liberar a GPU.
- Se uma réplica morre no meio de uma geração: o cliente recebe erro e tenta de novo (com idempotência), ou o roteador refaz a requisição em outra réplica com o prompt + tokens já enviados como novo prompt, continuando a resposta. A segunda opção é melhor para o usuário, mais complexa e pode mudar o texto se houver sampling.

## Perguntas de entrevista comentadas

## Q081 — Projete um serviço de inferência de LLM de alta concorrência: utilização da GPU, memória do KV cache, batching e escalonamento, divisão e junção de requisições. {#q081}

::: pergunta-meta
**[Relatado]** Anthropic · Software Engineer · presencial · listada em fev. 2026 · Difícil · [fonte](https://prachub.com/interview-questions/design-a-high-concurrency-llm-inference-service)
:::

### Resposta em 30 segundos

"Gateway com autenticação e quotas por tokens, um roteador que balanceia por carga em tokens e por afinidade de prefixo, e pools de réplicas, cada uma com um engine de continuous batching. Dentro da réplica, o scheduler monta cada passo com os decodes em andamento e pedaços de prefill dentro de um orçamento de tokens, admitindo novas requisições só se houver blocos de KV, com preempção quando a memória aperta. O KV cache é paginado, com prefix caching e possivelmente FP8, e o dimensionamento sai da conta de tokens por segundo e do SLO de TPOT. Divisão e junção: prompts longos são divididos em chunks de prefill; requisições com várias amostras compartilham o prefixo; e requisições pequenas são juntadas no mesmo passo. Fecho com autoscaling por tokens em voo, rejeição antecipada e métricas por SLO."

### Resposta completa

Siga o roteiro.

**1. Requisitos (exemplo de como conduzir).** "Vou assumir um modelo de 70B para chat e API, picos de 200 requisições/s, entradas de 1.500 tokens e saídas de 300 em média, com cauda longa até 100 mil tokens de contexto; SLO de TTFT p99 de 1 s para prompts até 8 mil tokens e TPOT p99 de 40 ms; streaming." Confirme com o entrevistador.

**2. Contas.** As da seção [11.2](#cap-11): ~2.400 sequências simultâneas, 16 a 23 réplicas de 8 GPUs, e a observação de que o limite é o SLO de TPOT, não a memória (para esse perfil de tamanhos).

**3. Arquitetura.** A da seção [11.3](#cap-11).

**4. Aprofundamentos, com os quatro tópicos do enunciado:**

*Utilização da GPU.*

- Continuous batching ([Capítulo 7](#cap-07)): nenhuma vaga ociosa enquanto houver fila.
- Chunked prefill: aproveita o cálculo ocioso dos passos de decode.
- CUDA graphs no decode, kernels de atenção paginada, FP8.
- Escolha do ponto de operação: o maior batch que cumpre o TPOT, medido pela curva throughput × latência.
- Cuidado com a métrica: "GPU utilization" não serve; meça tokens/s por GPU e MBU.

*Memória do KV cache.*

- Conta por token (FP8: 160 KiB no 70B) e capacidade por réplica.
- PagedAttention: desperdício só no último bloco.
- Prefix caching para system prompts e chats multi-turno.
- Admissão com margem; preempção (recomputação para curtas, swap para longas); offload para a CPU de conversas pausadas.
- Contexto longo: limitar a parcela da memória que requisições acima de 32 mil tokens podem ocupar, para elas não expulsarem todo mundo ([Q053](#q053)).

*Batching e scheduling.* O scheduler da [Q052](#q052), com prioridades e orçamento de tokens escolhido pelo SLO de ITL.

*Divisão e junção de requisições.* Explique as várias formas:

```text
 DIVIDIR
 ├── prompt longo → chunks de prefill (orçamento por passo)
 ├── prompt muito longo → context parallelism / pool
 │   dedicado a contexto longo
 └── requisição de "batch" do cliente (ex.: 500 prompts
     num só POST) → 500 sequências independentes no
     scheduler, resultados reagrupados na resposta

 JUNTAR
 ├── muitas requisições pequenas → mesmo passo
 │   (continuous batching, layout achatado de tokens)
 ├── n amostras do mesmo prompt → um prefill, KV do
 │   prompt compartilhado, n sequências de decode
 └── requisições com o mesmo prefixo → blocos de KV
     compartilhados (prefix caching)
```

**5. Falhas e operação.**

- Réplica morre: o roteador para de mandar tráfego (health check), as gerações em andamento falham ou são refeitas; o autoscaler repõe a capacidade.
- Sobrecarga: rejeição antecipada, prioridades, degradação (por exemplo, limitar `max_tokens` do tráfego gratuito).
- Deploy de nova versão: canary com comparação de métricas de latência, erro e qualidade.
- Painel: TTFT/TPOT p50/p99 por classe de tamanho, tokens/s por GPU, uso do KV, preempções, taxa de acerto do prefix cache, filas, rejeições.

### Perguntas de acompanhamento prováveis

- **Onde fica a tokenização?** No gateway (libera a CPU das réplicas e permite contar tokens para quotas) ou no processo do servidor, separado do loop do engine. O importante é não bloquear o scheduler.
- **Como você testaria a capacidade antes de lançar?** Benchmark de carga com distribuição real de tamanhos (amostrada de logs), aumentando a taxa até violar o SLO; o ponto de quebra define a capacidade por réplica.
- **O que muda se o modelo for MoE?** Paralelismo (EP), batches maiores para amortizar a leitura dos especialistas, e balanceamento entre especialistas ([Capítulo 9](#cap-09)).
- **E se o TTFT p99 estourar só para prompts longos?** Pool dedicado a contexto longo, ou desagregação de prefill e decode ([Q067](#q067)).

### Armadilhas comuns

- Desenhar só caixas, sem números.
- Não mencionar KV cache nem continuous batching.
- Balancear por número de requisições.
- Ignorar o tempo de subida das réplicas no autoscaling.

## Q082 — Projete uma API de inferência baseada em GPU para servir vários modelos de ML: SLOs, batching dinâmico, versionamento e roteamento A/B, autoscaling em nós de GPU heterogêneos, backpressure, isolamento multi-tenant, carregamento e aquecimento (warmup) de modelos. {#q082}

::: pergunta-meta
**[Relatado]** Anthropic · Software Engineer · presencial · listada em 2025 · Difícil · [fonte](https://www.prachub.com/interview-questions/design-a-gpu-inference-api)
:::

### Resposta em 30 segundos

"Um plano de controle com registro de modelos e versões, e um plano de dados com gateway, roteador e pools de réplicas por modelo e versão. Cada réplica roda um servidor com batching dinâmico adequado ao tipo do modelo: continuous batching para LLMs e batching por tamanho e prazo para modelos de custo fixo. O roteador aplica pesos de A/B e canary, quotas por tenant e prioridades, e rejeita cedo quando a fila prevista estoura o SLO. O autoscaler é por modelo, usa métricas de fila e tokens em voo, e escolhe o tipo de GPU com um perfil de cada modelo em cada hardware. Carregamento: pesos em cache local, carga paralela, e a réplica só entra no balanceador depois de aquecer, com compilação e CUDA graphs prontos e um teste de saúde. Isolamento: quotas, filas por tenant, pools dedicados para quem precisa."

### Resposta completa

**1. Requisitos e escopo.** Quantos modelos (dezenas? centenas?), de que tipos (LLMs, embeddings, visão), com que distribuição de tráfego (alguns modelos muito usados e uma cauda longa de pouco usados), que GPUs (H100, A100, L4), que SLOs por modelo.

**2. API.**

```text
 POST /v1/models/{modelo}/infer
   headers: Authorization, Idempotency-Key (opcional)
   body:    { entradas, parâmetros, versão (opcional),
              prioridade (opcional), stream: bool }
   respostas: 200 (resultado ou stream SSE)
              429 (quota/sobrecarga, com Retry-After)
              503 (modelo indisponível)
 GET  /v1/models                → lista, versões, status
 POST /v1/jobs (assíncrono)     → para lotes grandes
```

**3. Plano de controle.**

- **Registro de modelos**: nome, versão, artefato (local dos pesos, checksum), formato e precisão, requisitos (memória, GPU mínima, paralelismo), configuração do servidor, SLO alvo, dono.
- **Política de roteamento**: por modelo, as versões ativas e seus pesos (por exemplo, v7: 95%, v8: 5%), regras por tenant (o cliente X fica fixo na v7).
- **Controlador de deploy**: cria e destrói réplicas conforme o estado desejado (como um operador do Kubernetes).

**4. Plano de dados.**

```text
 gateway ─▶ roteador ─▶ escolhe (modelo, versão) pela política
                        escolhe réplica pela carga
                        aplica quota e prioridade do tenant
            │
            ▼
 réplica: [fila por prioridade] ─▶ [batcher] ─▶ [GPU]
          batcher depende do tipo:
          - LLM: continuous batching (Capítulo 7)
          - custo fixo: até B_max ou T_max (Q049)
```

**5. Versionamento e A/B.**

- Versões imutáveis; cada uma com seu pool.
- **Canary**: começa com 1% do tráfego, compara latência, erros e métricas de qualidade (para LLMs: avaliações automáticas, feedback, taxa de recusa) contra a versão estável; avança em degraus; rollback automático se piorar.
- **A/B**: atribuição estável por usuário ou tenant (hash do ID), para o mesmo usuário não alternar entre versões; registro da versão em cada resposta para a análise.
- **Shadow**: espelhar tráfego para a versão nova sem devolver a resposta, para medir latência e diferenças sem risco.

**6. Autoscaling em GPUs heterogêneas.**

Monte uma tabela de **perfis** (medida, não estimada) de cada modelo em cada tipo de GPU:

| Modelo | GPU | Réplica | Capacidade no SLO | Custo/h (hipotético) | Custo por 1M tokens |
|---|---|---|---|---|---|
| LLM 70B FP8 | 8× H100 | TP=8 | 3.750 tok/s | US$ 20 | US$ 1,48 |
| LLM 70B FP8 | 8× A100 | TP=8 | (não suporta FP8 nativo) | — | — |
| LLM 8B | 1× H100 | — | 3.000 tok/s | US$ 2,50 | US$ 0,23 |
| LLM 8B | 1× L4 | — | 400 tok/s | US$ 0,70 | US$ 0,49 |
| Embedding | 1× L4 | — | 2.000 req/s | US$ 0,70 | — |

Com isso, o autoscaler resolve um problema de alocação: atender a demanda de cada modelo no SLO com o menor custo, dada a disponibilidade de cada tipo de GPU. Na prática, uma heurística gulosa funciona bem: cada modelo tem uma lista ordenada de GPUs preferidas (por custo por token no SLO), e usa a próxima da lista quando a preferida acaba.

Sinais para escalar: fila por réplica, tokens em voo, uso de KV, TTFT p95 recente; previsão por horário; folga mínima. Para modelos da cauda longa (pouco tráfego): **escala a zero** com o custo de cold start, ou **multiplexação** (vários modelos pequenos na mesma GPU, carregados sob demanda, como servidores com múltiplos modelos e LRU de modelos em memória).

**7. Backpressure.** Em três camadas: quota por tenant no gateway; fila limitada e rejeição antecipada no roteador (com estimativa de espera); fila limitada e preempção na réplica. Sempre devolver 429 rápido em vez de deixar a requisição esperar até o timeout.

**8. Isolamento multi-tenant.**

- Quotas em tokens por minuto e em requisições simultâneas.
- Filas por tenant com fair share, para que uma rajada de um cliente não aumente a latência dos outros.
- Classes de prioridade (por plano).
- Pools dedicados para clientes com SLO contratual ([Q091](#q091)).
- Isolamento de dados: sem prefix cache compartilhado entre tenants quando houver risco; logs separados.

**9. Carregamento e aquecimento.**

```text
 Subida de uma réplica (pronta para tráfego só no fim)

 1. alocar GPUs (scheduler do cluster)
 2. baixar pesos  ─ cache local NVMe? ─▶ pular
 3. carregar na GPU (safetensors, paralelo, direto)
 4. inicializar engine: reservar KV cache, compilar
    (torch.compile / engine TensorRT do cache),
    capturar CUDA graphs para cada tamanho de batch
 5. AQUECER: rodar requisições sintéticas cobrindo
    os tamanhos típicos (sem isso, as primeiras
    requisições reais pagam autotuning e alocações)
 6. teste de saúde: resposta de referência confere?
 7. registrar no roteador (readiness = true)
```

A réplica só fica "pronta" (readiness probe) depois do passo 6. Os passos 2 a 5 são o cold start; reduzi-los é o que torna o autoscaling útil.

### Perguntas de acompanhamento prováveis

- **Como garantir que a versão nova não piorou a qualidade?** Avaliações offline antes do deploy, shadow, canary com métricas de qualidade e comparação lado a lado, e rollback rápido.
- **O que acontece com requisições em andamento quando uma versão é desligada?** Drenagem: a réplica sai do balanceador, termina o que tem, e só então é desligada (com um prazo máximo).
- **Como lidar com 500 modelos, a maioria com pouco tráfego?** Multiplexação em GPUs compartilhadas, carga sob demanda com LRU, escala a zero, e serving multi-LoRA quando os modelos são variações do mesmo base ([Capítulo 14](#cap-14)).
- **Como rotear entre regiões?** Pela latência e pela capacidade disponível; requisições podem ir para outra região quando a local está saturada, se as regras de dados permitirem.

### Armadilhas comuns

- Tratar todos os modelos como iguais (o batching certo depende do tipo).
- Esquecer o warmup e mandar tráfego para réplicas frias.
- Autoscaling sem considerar o tempo de subida e o tipo de GPU.
- A/B sem atribuição estável por usuário.

## Q083 — Projete um sistema para distribuir arquivos grandes de pesos de modelo (dezenas a centenas de GB, divididos em shards) para uma frota de workers de inferência. {#q083}

::: pergunta-meta
**[Relatado]** Anthropic · Software Engineer · presencial · listada em maio de 2026 · Médio · [fonte](https://prachub.com/interview-questions/design-model-weight-distribution)
:::

### Resposta em 30 segundos

"Fonte de verdade num armazenamento de objetos, com cada versão imutável, dividida em shards e descrita por um manifesto com checksums. Os workers não baixam todos da origem, porque a banda de saída dela vira gargalo; uso distribuição em árvore ou peer-to-peer, em que cada nó que já tem um pedaço o repassa, com caches por rack e cache local em NVMe em cada nó. Cada GPU baixa só os shards de que precisa para o seu rank de paralelismo. O lançamento é em duas fases: pré-distribuir a versão nova em segundo plano, com limite de banda para não atrapalhar o tráfego, e só ativar quando todos tiverem os arquivos verificados. Para escalar rápido, um nó novo pode puxar os pesos de réplicas vizinhas por RDMA. Integridade com checksum e assinatura, retomada de downloads e coleta de versões antigas."

### Resposta completa

**1. Requisitos e números.**

- Tamanho: um modelo de 140 GB (70B em BF16) a ~1 TB (MoE grande), em shards de alguns GB.
- Frota: centenas a milhares de nós.
- Casos de uso: (a) lançamento de uma versão nova para toda a frota; (b) autoscaling: um nó novo precisa dos pesos rápido; (c) rollback.
- Objetivos: tempo para a frota toda ficar pronta, tempo de subida de um nó, não afetar o tráfego de produção, integridade.

::: conta
**Fazendo a conta: por que não baixar todos da origem.** 1.000 nós × 140 GB = **140 TB**.

- Se a origem (armazenamento de objetos) entrega 100 Gb/s agregados (12,5 GB/s) para esse fluxo: 140 TB / 12,5 GB/s ≈ **3,1 horas**.
- Com peer-to-peer, cada nó também envia. Se cada nó tem ~25 Gb/s (~3 GB/s) livres para isso: no regime ideal, o tempo fica perto de 140 GB / 3 GB/s ≈ **47 s**, mais alguns fatores de propagação, independentemente do número de nós.
- Diferença de duas ordens de grandeza. É o argumento central do design.
:::

**2. Formato do artefato.**

```text
 modelos/llm-70b/v8/
   manifesto.json   ← lista de shards, tamanhos, sha256,
                      mapeamento shard → rank de TP/PP,
                      assinatura
   shard-00000.safetensors   (~5 GB cada)
   shard-00001.safetensors
   ...
```

- **Imutável e endereçado por conteúdo** (o hash identifica o arquivo): fácil de cachear, deduplicar e verificar.
- **Pré-dividido por rank**: com TP=8, cada GPU precisa de 1/8 dos pesos. Se os arquivos já estão divididos assim, cada GPU baixa e carrega só o seu pedaço, sem ler tudo e descartar 7/8.
- **safetensors**: formato sem código executável (seguro), com cabeçalho que permite mapear o arquivo em memória (mmap) e carregar tensores diretamente.

**3. Distribuição.**

```text
               ┌───────────────────────────┐
               │ armazenamento de objetos  │  origem
               └─────────────┬─────────────┘
                             │ poucos downloads
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
        ┌─────────┐     ┌─────────┐      ┌─────────┐
        │ cache   │     │ cache   │      │ cache   │  um por
        │ rack A  │     │ rack B  │      │ rack C  │  rack ou
        └────┬────┘     └────┬────┘      └────┬────┘  zona
             │ P2P dentro do rack (cada nó repassa
             ▼ os pedaços que já tem)
        nó ◀──▶ nó ◀──▶ nó ◀──▶ nó
         │
         ▼
      NVMe local (cache de versões) ─▶ GPUs
```

- **Peer-to-peer em pedaços** (como BitTorrent; ferramentas como Dragonfly e Kraken fazem isso para imagens de contêiner): o arquivo é dividido em pedaços de dezenas de MB; cada nó pede pedaços aos vizinhos que os têm, priorizando os mais raros, e serve os que já tem.
- **Hierarquia**: caches por rack ou zona reduzem o tráfego entre racks, que costuma ser o mais caro.
- **Cache local em NVMe**: versões recentes ficam no disco do nó, para rollback e reinício instantâneos.

**4. Lançamento em duas fases.**

```text
 Fase 1 (pré-distribuição, em segundo plano)
   controlador publica "v8 disponível"
   nós baixam com limite de banda (QoS), sem afetar
   o tráfego de inferência; verificam checksums;
   reportam "v8 pronta"
 Fase 2 (ativação)
   quando ≥ X% dos nós de um pool têm a v8 pronta,
   o controlador troca réplicas para a v8 de forma
   gradual (canary → 100%), cada réplica carregando
   do NVMe local
```

**5. Autoscaling: subida rápida de um nó.** O nó novo tem disco vazio. Opções, da mais lenta para a mais rápida:

1. Baixar da origem (minutos, e ruim em rajadas de autoscaling).
2. P2P a partir dos nós do rack (dezenas de segundos a poucos minutos).
3. **Copiar direto das GPUs de uma réplica viva** pela rede RDMA (GPU para GPU, com GPUDirect RDMA): a 50 GB/s por GPU, os 17,5 GB de cada rank num TP=8 do 70B levam ~0,35 s no limite teórico. Exige coordenação para não atrapalhar a réplica de origem.

**6. Carregar na GPU.** Ler do NVMe com várias threads ou com GPUDirect Storage, direto para a memória da GPU; evitar desserializar com `pickle`; carregar os ranks em paralelo; validar a forma e o tipo de cada tensor contra o manifesto.

**7. Integridade e segurança.** Checksum por pedaço e por shard (detecta corrupção em trânsito ou no disco), manifesto **assinado** (garante que os pesos vieram do pipeline oficial), controle de acesso (pesos são propriedade intelectual valiosa), criptografia em trânsito.

**8. Falhas e limpeza.** Downloads retomáveis por pedaço; nós que falham na verificação refazem o pedaço; tempo limite e alerta para nós atrasados; coleta das versões antigas mantendo as N mais recentes (para rollback).

### Perguntas de acompanhamento prováveis

- **Como evitar que a distribuição atrapalhe a inferência?** Limite de banda por nó, classes de QoS na rede (o tráfego de inferência e de coletivas tem prioridade), janelas de distribuição em horários de menos carga quando possível.
- **E se um shard estiver corrompido na origem?** O checksum do manifesto (gerado no pipeline de treino/exportação) detecta; a versão é bloqueada antes de qualquer ativação.
- **Como lidar com 10 modelos diferentes na mesma frota?** O cache local guarda os modelos de acordo com a atribuição do nó; o controlador decide quais nós precisam de quais modelos e pré-distribui só para esses.
- **Por que não colocar os pesos dentro da imagem do contêiner?** Imagens de 140 GB são lentas para construir, enviar e versionar, e misturam o ciclo de vida do código com o dos pesos. Pesos separados permitem trocar a versão do modelo sem rebuild e reaproveitar o cache.

### Armadilhas comuns

- Todos os nós baixando da origem ao mesmo tempo.
- Não pré-dividir por rank, fazendo cada GPU ler o modelo inteiro.
- Esquecer integridade e assinatura.
- Ativar a versão nova antes de todos terem os arquivos.
- Ignorar o caso do autoscaling (nó novo com disco vazio).

## Resumo do capítulo

- Roteiro: requisitos → contas → API e arquitetura → aprofundamentos → falhas e operação.
- Faça as contas: tokens/s de entrada e saída, sequências simultâneas pela lei de Little, capacidade por réplica limitada pelo SLO ou pela memória, folga.
- Arquitetura: gateway (auth, quotas por tokens) → roteador (versão, carga em tokens, afinidade de prefixo, admissão) → pools de réplicas com engine; plano de controle com registro, deploy e autoscaler.
- Autoscaling por tokens em voo, KV e fila; o tempo de subida é o grande problema.
- Backpressure em camadas, rejeição antecipada com 429.
- Multi-tenancy: quotas por tokens, fair share, prioridades, pools dedicados, isolamento de cache.
- Versionamento: imutável, canary, A/B com atribuição estável, shadow, rollback.
- Distribuição de pesos: origem imutável com manifesto, P2P hierárquico, NVMe local, pré-divisão por rank, duas fases, cópia GPU-GPU para autoscaling, integridade e assinatura.

## Checklist para a entrevista

- [ ] Sigo o roteiro de cinco etapas e controlo o tempo.
- [ ] Faço as perguntas de requisito certas para inferência.
- [ ] Dimensiono um serviço em tokens/s, sequências simultâneas e réplicas.
- [ ] Desenho a arquitetura de referência de memória.
- [ ] Explico balanceamento por tokens, power of two choices e afinidade de prefixo.
- [ ] Explico por que o autoscaling de GPU é difícil e como mitigar.
- [ ] Descrevo canary, A/B e shadow para modelos.
- [ ] Monto a tabela de perfis por tipo de GPU para o autoscaling heterogêneo.
- [ ] Descrevo as etapas de subida e aquecimento de uma réplica.
- [ ] Projeto a distribuição de pesos com P2P e calculo o ganho sobre baixar da origem.
