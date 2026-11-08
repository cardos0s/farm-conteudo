# Capítulo 12 — Confiabilidade em Produção e Observabilidade {#cap-12}

Um serviço de inferência rápido e barato que cai toda semana não serve. E sistemas de GPU falham de jeitos que serviços web comuns não falham: GPUs que somem do barramento, coletivas que travam o grupo inteiro, NaNs que aparecem só com certas entradas, uma GPU lenta que atrasa as outras sete. A pessoa de inferência carrega o pager, então os entrevistadores querem saber se você entende **como o sistema quebra, como você enxerga a quebra e o que faz quando acontece**.

## 12.1 SLIs, SLOs e orçamento de erro

- **SLI** (indicador): uma medida, como "fração de requisições com TTFT < 1 s".
- **SLO** (objetivo): a meta para o indicador, como "99% das requisições com TTFT < 1 s, em janelas de 28 dias".
- **Orçamento de erro**: o que sobra. Com SLO de 99,9% de disponibilidade, você pode falhar 0,1% das requisições. Se o orçamento está sendo queimado rápido, pare os lançamentos arriscados; se está sobrando, pode arriscar mais.

SLIs típicos de um serviço de LLM:

| SLI | Definição | Observação |
|---|---|---|
| Disponibilidade | requisições sem erro de servidor / total | 429 por quota do cliente não conta como falha do serviço |
| TTFT | percentil, por classe de tamanho de prompt | prompts de 100 mil tokens não podem ter o mesmo alvo que de 500 |
| TPOT / ITL | percentil durante o streaming | ITL p99 pega os "soluços" |
| Latência E2E | para chamadas sem streaming | depende do tamanho da saída |
| Taxa de rejeição | 429/503 por sobrecarga | sobe antes de a latência estourar |
| Qualidade | avaliações automáticas, taxa de erro de formato, feedback | detecta regressões silenciosas |

## 12.2 O que medir

Os **quatro sinais dourados** (tráfego, erros, latência, saturação), adaptados a inferência:

```text
 TRÁFEGO     requisições/s, tokens de entrada/s, tokens de
             saída/s (por modelo, versão, tenant)
 ERROS       5xx, timeouts, cancelamentos, OOM, NaN, erros
             de CUDA/NCCL, falhas de health check
 LATÊNCIA    TTFT, ITL/TPOT, E2E, tempo na fila
             (percentis, por classe de tamanho)
 SATURAÇÃO   uso do KV cache (%), tamanho da fila,
             sequências em execução, preempções/s,
             tokens em voo por réplica
```

E as métricas de **GPU**, coletadas pelo DCGM exporter para o Prometheus:

| Métrica | O que indica |
|---|---|
| SM active / occupancy | quanto do tempo os SMs têm trabalho |
| Tensor pipe active | uso real dos tensor cores |
| DRAM active | uso da banda de memória (decode deve estar alto) |
| Memória usada | perto de 100% é normal (KV cache reservado) |
| Clocks e motivo de throttling | térmico, energia: GPU mais lenta que as outras |
| Temperatura e potência | refrigeração, limites de energia |
| Erros ECC (corrigidos e não corrigidos) | memória degradando |
| Eventos Xid | erros reportados pelo driver |
| Erros de NVLink e de PCIe (replays) | enlaces com problema |

::: dica
**Dica de entrevista:** explique que "GPU utilization" do `nvidia-smi` não mede eficiência: ela só diz se havia **algum** kernel rodando. Uma GPU pode mostrar 100% fazendo pouco trabalho útil. Métricas como SM active, tensor active e DRAM active, junto com tokens/s por GPU, dizem muito mais.
:::

### Tracing por requisição

Um trace distribuído mostra onde cada requisição gastou o tempo:

```text
 trace req-7f3a  (TTFT = 1.840 ms)
 ├─ gateway: auth + quota ............  4 ms
 ├─ roteador: escolha da réplica .....  2 ms
 ├─ fila na réplica r-12 ............ 1.410 ms  ◀ o problema
 ├─ prefill (6.200 tokens, 3 chunks)   410 ms
 │    atributos: prefix_hit = 0 tokens
 └─ decode (412 tokens) ............. 11.900 ms
      atributos: preempções = 0, ITL p99 = 41 ms
```

Atributos úteis em cada trace: modelo e versão, réplica, tokens de entrada e saída, tokens reaproveitados do prefix cache, preempções, prioridade, tenant (de forma anônima). Por privacidade, o **conteúdo** de prompts e respostas não deve ir para logs e traces por padrão.

## 12.3 Como a stack de inferência falha

Organize as falhas por camada. É exatamente o que a [Q090](#q090) pede.

```text
 ┌──────────────────────────────────────────────────────┐
 │ TRÁFEGO     picos, rajadas de prompts longos,        │
 │             tempestade de retries, cliente abusivo   │
 ├──────────────────────────────────────────────────────┤
 │ ROTEAMENTO  balanceamento ruim, réplica doente       │
 │             recebendo tráfego, afinidade desbalanc.  │
 ├──────────────────────────────────────────────────────┤
 │ ENGINE      OOM, KV esgotado, tempestade de          │
 │             preempções, scheduler travado,           │
 │             recompilação, vazamento de memória       │
 ├──────────────────────────────────────────────────────┤
 │ MODELO      versão errada, tokenizer/template        │
 │             diferente, NaN/Inf, quantização ruim     │
 ├──────────────────────────────────────────────────────┤
 │ COMUNICAÇÃO NCCL travado, GPU lenta (straggler),     │
 │             enlace NVLink/IB degradado               │
 ├──────────────────────────────────────────────────────┤
 │ DRIVER/CUDA erro de CUDA corrompe o contexto,        │
 │             incompatibilidade de versões             │
 ├──────────────────────────────────────────────────────┤
 │ HARDWARE    GPU caiu do barramento, ECC, térmico,    │
 │             energia, corrupção silenciosa de dados   │
 ├──────────────────────────────────────────────────────┤
 │ PLATAFORMA  pod Pending, imagem não baixa, pesos     │
 │             não baixam, nó sem rede RDMA             │
 └──────────────────────────────────────────────────────┘
```

Alguns comportamentos específicos que você deve conhecer:

- **Erros de CUDA "pegajosos"**: depois de um acesso ilegal à memória dentro de um kernel, o contexto CUDA do processo fica corrompido e toda chamada seguinte falha. Não há recuperação dentro do processo: é preciso reiniciar. O health check precisa detectar isso.
- **NCCL hang**: com TP, se uma GPU não chega à coletiva (travou, morreu, ficou lenta), as outras esperam para sempre. Sem timeout, a réplica inteira fica parada e parece "viva" para um health check superficial.
- **Straggler**: uma GPU com throttling térmico ou um enlace degradado deixa a coletiva esperar por ela em todo passo. A réplica inteira fica mais lenta. Detectar comparando o tempo de cada rank.
- **Xid**: erros reportados pelo driver NVIDIA no log do kernel, com um número. Exemplos conhecidos: o Xid 79 indica que a GPU "caiu do barramento"; o Xid 48 indica erro de ECC com dois bits (não corrigível); há Xids específicos para erros de NVLink e para remapeamento de linhas de memória. Alguns exigem reiniciar o processo; outros, reiniciar ou trocar a GPU.
- **Corrupção silenciosa de dados**: raramente, uma GPU com defeito produz resultados errados **sem** reportar erro. Em LLMs, aparece como respostas estranhas vindas sempre da mesma réplica. Detectar com testes de resposta conhecida periódicos e diagnósticos (como `dcgmi diag`).
- **NaN/Inf**: overflow em FP16, problemas de escala na quantização, ou uma entrada patológica. Uma sequência com NaN pode gerar lixo; dependendo do kernel, pode contaminar outras do batch.

## 12.4 Cauda de latência

O p99 de um serviço de LLM costuma ser dominado por:

1. **Fila**: picos de chegada com a capacidade perto do limite.
2. **Prefills longos** sem chunking, congelando decodes.
3. **Preempções**: a vítima refaz o prefill.
4. **Stragglers** em TP: o passo espera a GPU mais lenta.
5. **Pausas no host**: coleta de lixo do Python, recompilação, CPU do scheduler sobrecarregada.
6. **Vizinhos barulhentos**: outro tenant enchendo a réplica com prompts gigantes.

E a regra de teoria de filas que justifica capacidade ociosa: o tempo de espera cresce muito rápido quando a utilização se aproxima de 100% (fator $\rho/(1-\rho)$, [Capítulo 1](#cap-01)). Um serviço com p99 rígido **precisa** operar com utilização bem abaixo do máximo.

## 12.5 Resposta a incidentes

```text
 alerta (queima rápida do orçamento de erro de TTFT)
   │
   ├─ 1. MITIGAR primeiro, investigar depois
   │     - rollback da última mudança (deploy, config,
   │       driver), se coincidir
   │     - tirar réplicas doentes do balanceador
   │     - aumentar capacidade / desviar para outra região
   │     - rejeitar tráfego de baixa prioridade
   │
   ├─ 2. DIAGNOSTICAR com os traces e métricas:
   │     é uma réplica, um modelo, uma classe de tamanho,
   │     um tenant, uma região?
   │
   ├─ 3. CORRIGIR a causa
   │
   └─ 4. POSTMORTEM sem culpados: linha do tempo, causa,
         por que não foi detectado antes, ações
```

Runbooks para as falhas comuns (Xid, NCCL hang, OOM, preempção excessiva, pod Pending) transformam o plantão das 2 da manhã num procedimento em vez de uma investigação.

## Perguntas de entrevista comentadas

## Q089 — Como você investigaria um pod do Kubernetes travado no status Pending? {#q089}

::: pergunta-meta
**[Relatado]** CoreWeave · Operations Engineer · entrevista técnica · relatado em abr. 2026 · Médio · [fonte](https://www.glassdoor.ca/Interview/CoreWeave-Interview-E5711823-RVW97131103.htm)
:::

### Resposta em 30 segundos

"Pending quer dizer que o pod ainda não foi agendado num nó, ou foi agendado mas não pode começar. Começo com `kubectl describe pod` e leio os eventos: o scheduler diz por que nenhum nó serve, por exemplo GPUs insuficientes, nodeSelector ou afinidade que não batem, taints sem tolerations, ou um PVC que não se liga. Depois confiro os nós: se o recurso nvidia.com/gpu está sendo anunciado, se o device plugin está rodando, se há GPUs marcadas como não saudáveis, se os nós estão cordoned ou com pressão de recursos. Também verifico quotas do namespace, PriorityClass e preempção, e se o pod precisa de um gang scheduler esperando o grupo inteiro. Para GPU, a causa mais comum é pedir 8 GPUs quando nenhum nó tem 8 livres ao mesmo tempo por causa de fragmentação."

### Resposta completa

Mostre um processo, do geral ao específico:

```text
 1. kubectl describe pod <pod> -n <ns>
    → seção Events. Mensagens típicas do scheduler:
      "0/40 nodes are available: 32 Insufficient
       nvidia.com/gpu, 8 node(s) had untolerated taint
       {gpu-maintenance: true}"
      "pod has unbound immediate PersistentVolumeClaims"
      "node(s) didn't match Pod's node affinity/selector"

 2. Se não houver eventos do scheduler:
    → o pod está esperando outro scheduler (schedulerName)
      ou um gang scheduler/fila (Kueue, Volcano)
    → kubectl get events -n <ns> --sort-by=.lastTimestamp

 3. Recursos dos nós
    kubectl describe node <nó>  → Capacity / Allocatable /
                                  Allocated resources
    kubectl get nodes -o custom-columns=NOME:.metadata.name,\
GPU:.status.allocatable.nvidia\.com/gpu
```

As causas, agrupadas:

| Categoria | Causa | Como confirmar | Correção |
|---|---|---|---|
| Recurso | nenhum nó com GPUs livres suficientes | eventos "Insufficient nvidia.com/gpu"; nós alocados | liberar, escalar o cluster, reduzir o pedido |
| Recurso | fragmentação: 8 GPUs livres no total, mas espalhadas | somar GPUs livres por nó | bin packing, desfragmentar, reservar nós inteiros |
| Recurso | CPU, memória ou ephemeral storage insuficientes (não só GPU) | eventos | ajustar requests |
| GPU | device plugin parado, nó anuncia 0 GPUs | `allocatable` sem `nvidia.com/gpu`; pods do GPU Operator | reiniciar plugin, driver, investigar o nó |
| GPU | GPUs marcadas como não saudáveis (Xid, ECC) | logs do device plugin, DCGM | isolar o nó, manutenção |
| GPU | MIG configurado diferente do pedido (ex.: pede GPU inteira, nó só tem fatias MIG) | rótulos do nó (`nvidia.com/mig...`) | ajustar perfil MIG ou o pedido |
| Restrição | nodeSelector, afinidade, topologia não batem | eventos "didn't match" | corrigir rótulos ou o spec |
| Restrição | taints sem tolerations (nós de GPU costumam ter taint) | `kubectl describe node` → Taints | adicionar toleration |
| Restrição | nós cordoned (unschedulable) | `kubectl get nodes` | uncordon se for o caso |
| Volume | PVC não ligado, volume em outra zona | eventos, `kubectl get pvc` | storage class, zona |
| Política | ResourceQuota do namespace estourada | eventos de quota, `kubectl describe quota` | aumentar a quota |
| Política | prioridade baixa e sem preempção | PriorityClass | ajustar prioridade |
| Fila | gang scheduling esperando o grupo inteiro caber | status do Kueue/Volcano | liberar capacidade para o grupo |

E o caso "parece Pending mas não é do scheduler": o pod foi agendado (tem `nodeName`), mas os contêineres não sobem. Aí o status costuma mostrar `ContainerCreating` ou `Init`, e a causa é imagem que não baixa (`ImagePullBackOff`), volume que não monta, CNI sem IP, ou um init container baixando pesos de 140 GB. Mostre que você distingue os dois casos.

::: dica
**Dica de entrevista:** termine com prevenção: alertas para pods Pending há mais de N minutos, painel de GPUs livres por nó (não só o total, por causa da fragmentação), e automação que isola nós com GPUs não saudáveis.
:::

### Perguntas de acompanhamento prováveis

- **O cluster tem 16 GPUs livres e o pod de 8 não sobe. Por quê?** Fragmentação: as GPUs livres estão em nós diferentes (por exemplo, 2 livres em cada um de 8 nós). Soluções: scheduler com bin packing (preencher nós antes de abrir novos), pools separados para pods de nó inteiro, desfragmentação planejada.
- **O que é o cluster autoscaler e por que ele não resolveu?** Ele cria nós quando há pods Pending por falta de recursos. Pode não resolver se o tipo de nó de GPU não está disponível na nuvem (falta de capacidade), se há limites máximos, ou se a restrição do pod (zona, rótulo) não bate com nenhum grupo de nós.
- **Como o device plugin decide que uma GPU não está saudável?** Ele observa eventos de saúde (por exemplo, Xids críticos) e remove a GPU da lista anunciada ao kubelet.
- **E se o pod ficar Pending por causa de prioridade?** Pods com PriorityClass mais alta podem preemptar pods de prioridade menor; se o seu é de prioridade baixa, ele espera.

### Armadilhas comuns

- Ir direto para os logs do contêiner (um pod Pending não tem contêiner rodando).
- Não ler os eventos do `describe`.
- Esquecer taints, quotas e fragmentação de GPUs.
- Confundir Pending com ContainerCreating e ImagePullBackOff.

## Q090 — Explique a stack de inferência de LLMs e seus cenários de falha. {#q090}

::: pergunta-meta
**[Relatado]** Anthropic · Staff Software Engineer · conselho de preparação de um candidato que passou pelo processo · 2026 · Difícil · [fonte](https://www.tryexponent.com/experiences/anthropic-staff-software-engineer-interview-243751)
:::

### Resposta em 30 segundos

"De cima para baixo: cliente, gateway com autenticação e quotas, roteador, servidor do modelo com o engine, que tem scheduler, gerenciador de KV cache e executor, os kernels, a comunicação entre GPUs com NCCL, o driver e o CUDA, o hardware, e a plataforma por baixo, Kubernetes, rede e armazenamento de pesos. Cada camada falha de um jeito: tráfego com picos e tempestades de retry; roteamento mandando para réplica doente; engine com OOM, KV esgotado e preempções em cascata; modelo com NaN, versão ou template errado; comunicação com NCCL travado e stragglers; CUDA com erros que corrompem o contexto; hardware com Xid, ECC, throttling e corrupção silenciosa. Para cada uma, digo como detecto, como contenho o raio de impacto e como me recupero."

### Resposta completa

Esta pergunta é de nível Staff: o entrevistador quer **amplitude e profundidade**, e principalmente o raciocínio sobre **raio de impacto** e **detecção**. Use a pilha da seção [12.3](#cap-12) e, para cada camada, uma linha com sintoma, detecção e resposta:

| Camada | Falha | Sintoma | Detecção | Resposta |
|---|---|---|---|---|
| Tráfego | tempestade de retries | carga 3× após um blip | taxa de retries, rajadas | retries com backoff e jitter, orçamento de retry, 429 com Retry-After |
| Tráfego | rajada de prompts longos | TTFT explode, preempções | métricas por classe de tamanho | limite por classe, pools separados, chunked prefill |
| Roteamento | réplica doente no balanceador | erros concentrados numa réplica | erros por réplica, health check profundo | ejeção automática (outlier detection) |
| Engine | KV esgotado | preempções em cascata, TPOT ruim | uso de KV, preempções/s | admissão com margem, limitar concorrência |
| Engine | OOM no prefill | processo morre com prompt grande | logs, reinícios | limite de tokens por passo, logits só do último token |
| Engine | recompilação em produção | picos de latência de segundos | logs de recompilação | buckets fixos, aquecimento |
| Modelo | template ou tokenizer errado | respostas estranhas, queda de qualidade | avaliações canário, métricas de formato | rollback, testes de compatibilidade no CI |
| Modelo | NaN/Inf | lixo nas respostas | checagem de NaN nos logits | isolar a sequência, investigar entrada e precisão |
| Comunicação | NCCL travado | réplica parada, sem erros | watchdog com timeout, progresso por passo | reiniciar a réplica inteira |
| Comunicação | straggler | réplica 20% mais lenta | tempo por rank, clocks | drenar e investigar o nó |
| CUDA | acesso ilegal | todas as chamadas falham | health check com forward real | reiniciar o processo |
| Hardware | GPU caiu do barramento (Xid 79) | GPU some | Xid, DCGM | isolar o nó, trocar a GPU |
| Hardware | ECC não corrigível | erros de CUDA, Xid | contadores ECC | reiniciar, remapear, trocar |
| Hardware | corrupção silenciosa | respostas ruins de uma réplica só | testes de resposta conhecida, comparação entre réplicas | isolar e diagnosticar |
| Plataforma | pesos não baixam | réplicas não sobem, autoscaling falha | tempo de subida, erros de download | caches locais, P2P ([Q083](#q083)) |

Depois, fale dos **princípios** que atravessam as camadas, porque é isso que diferencia uma resposta Staff:

1. **Raio de impacto.** A unidade de falha de uma réplica com TP=8 é o nó inteiro: uma GPU ruim derruba as oito. Desenhe para que uma réplica ruim afete só as requisições dela, e para que as falhas sejam detectadas e a réplica ejetada rapidamente.
2. **Health checks profundos.** Um endpoint `/health` que só responde "ok" não detecta NCCL travado nem contexto CUDA corrompido. O health check precisa rodar um forward pequeno de verdade (com timeout) e verificar a resposta.
3. **Falhar rápido e reiniciar.** Muitos estados ruins de GPU não têm recuperação dentro do processo. É melhor reiniciar a réplica (e ter subida rápida) do que tentar consertar em execução.
4. **Degradação graciosa.** Sob sobrecarga, rejeitar tráfego de baixa prioridade, reduzir `max_tokens` e desligar recursos caros é melhor do que todos sofrerem.
5. **Detecção de problemas de qualidade.** Falhas de modelo (template, quantização, versão) não geram erros HTTP. Avaliações automáticas contínuas e métricas de formato são o "health check" da qualidade.
6. **Mudanças são a principal causa de incidentes.** Drivers, versões de engine, configurações e modelos novos passam por canary com rollback automático.

### Perguntas de acompanhamento prováveis

- **Qual falha é mais difícil de detectar?** Corrupção silenciosa e regressões de qualidade: o sistema parece saudável em todas as métricas operacionais. Por isso testes de resposta conhecida e avaliações contínuas.
- **Como você faria o health check de uma réplica com TP=8?** Um forward curto com entrada fixa, com timeout, conferindo a saída (por exemplo, os primeiros tokens com greedy) contra o esperado. Executado periodicamente e fora do caminho das requisições reais.
- **O que você faria se uma GPU de uma réplica de 8 morresse?** A réplica inteira sai do balanceador; as requisições em andamento falham e os clientes tentam de novo; o nó é isolado; o autoscaler sobe uma réplica nova em outro nó.
- **Como evitar que retries piorem um incidente?** Backoff exponencial com jitter, orçamento de retries por cliente, circuit breakers, e respostas 429/503 com `Retry-After`.

### Armadilhas comuns

- Listar falhas sem detecção e resposta.
- Ignorar falhas sem erro (qualidade, corrupção silenciosa).
- Health check superficial.
- Não pensar em raio de impacto.

## Q091 — Construa um endpoint dedicado com garantias rígidas de latência de cauda e explique o que muda em relação ao pool compartilhado. {#q091}

::: pergunta-meta
**[Fornecedor]** Together AI, segundo fornecedor de preparação ("candidatos supostamente recebem") · Design de sistemas · 2026 · Difícil · [fonte](https://www.techinterview.org/post/3233475437/together-ai-engineering-interview/)
:::

### Resposta em 30 segundos

"Um endpoint dedicado é capacidade reservada para um cliente, dimensionada pelo perfil de tráfego dele e por um SLO contratual de p99. O que muda em relação ao pool compartilhado: não há vizinhos, então a variância cai; o alvo de utilização é mais baixo, porque a latência de cauda explode perto de 100%; o batch e o orçamento de tokens são ajustados para latência, não para throughput; a configuração é estática e aquecida, sem recompilações nem cold starts; há redundância N+1 em domínios de falha diferentes; e a admissão limita o cliente à taxa contratada, rejeitando o excesso em vez de deixar a fila crescer. Ele custa mais por token, então o cliente paga por GPU-hora reservada. Monitoro o SLO do endpoint e meço a margem continuamente."

### Resposta completa

**1. Requisitos do contrato.** Defina com o cliente: taxa máxima (requisições/s e tokens/s), distribuição de tamanhos de entrada e saída, SLO (por exemplo, TTFT p99 < 500 ms e TPOT p99 < 30 ms para prompts até 8 mil tokens), disponibilidade, região. **Garantias rígidas só existem dentro de limites declarados**: acima da taxa contratada, o endpoint pode rejeitar.

**2. Dimensionamento para o p99, não para a média.**

::: conta
**Fazendo a conta (hipotética):** contrato de até 30 requisições/s, saídas de ~400 tokens, TPOT p99 < 30 ms.

- Sequências simultâneas no pico (lei de Little): 30 × (400 × 0,03 s) = 30 × 12 s = **360**.
- Medindo a réplica: para TPOT p99 < 30 ms, ela aguenta ~120 sequências (no pool compartilhado, com TPOT de 40 ms, aguentava 150).
- Réplicas para o pico: 360 / 120 = 3. Com N+1 para falha de uma réplica: **4**.
- Utilização média esperada, se o tráfego médio for metade do pico: ~37%. Esse é o preço da garantia.
:::

**3. O que muda na configuração.**

| Aspecto | Pool compartilhado | Endpoint dedicado |
|---|---|---|
| Objetivo | maximizar goodput e custo | cumprir o p99 com margem |
| Utilização alvo | alta (70–90%) | moderada (30–60%) |
| Batch máximo e orçamento de tokens | maiores (throughput) | menores (latência previsível) |
| Vizinhos | muitos tenants, prompts imprevisíveis | só o cliente, perfil conhecido |
| Admissão | quotas e fair share | limite na taxa contratada, rejeição fora dela |
| Capacidade | elástica, autoscaling | reservada, N+1, pré-aquecida |
| Configuração | ajustada para a média dos clientes | ajustada para o perfil do cliente (tamanhos, paralelismo, speculative decoding) |
| Mudanças | lançamentos frequentes | janelas combinadas, canary dentro do endpoint |
| Prefix cache | compartilhado (com isolamento) | só do cliente, pode ser maior |
| Cobrança | por token | por GPU-hora reservada |

**4. Técnicas específicas para a cauda.**

- **TP maior** para reduzir o tempo de cada passo (ao custo de throughput por GPU).
- **Speculative decoding** para reduzir o TPOT ([Capítulo 14](#cap-14)), ajustado ao tipo de texto do cliente.
- **Chunked prefill com orçamento pequeno**, ou **desagregação** de prefill e decode, para o ITL ficar estável.
- **Configuração estática**: tamanhos de batch fixos com CUDA graphs capturados, nada de recompilação, warmup completo antes de receber tráfego.
- **Sem preempção** em condições normais: a admissão garante memória para todo mundo que entra.
- **Redundância em domínios de falha**: réplicas em nós (e se possível racks) diferentes; se uma cai, as outras absorvem dentro do SLO.
- **Verificação contínua**: tráfego sintético medindo o p99 de fora, alertas quando a margem diminui (antes de violar).

**5. A conversa de negócio.** O endpoint dedicado custa mais por token porque a utilização é menor. Mostre que você entende isso e proponha meios-termos: capacidade reservada com "estouro" para o pool compartilhado (com SLO mais fraco no excesso), ou um piso dedicado mais autoscaling para a parte variável.

### Perguntas de acompanhamento prováveis

- **O cliente manda o dobro da taxa contratada. O que acontece?** O excesso recebe 429, ou é desviado para o pool compartilhado sem garantia, conforme o contrato. Nunca deixar o excesso degradar o SLO do tráfego contratado.
- **Como provar que o SLO está sendo cumprido?** Medição do lado do servidor e sondas sintéticas do lado de fora, com relatórios por janela; definir no contrato como se mede (incluindo rede e exclusões).
- **E se o cliente mudar o perfil (prompts muito mais longos)?** O SLO só vale para o perfil acordado; monitorar o perfil, avisar o cliente e redimensionar.
- **Vale usar hedging (mandar a mesma requisição para duas réplicas)?** Para LLMs, duplicar uma geração inteira é caro. Uma variante viável é fazer hedge apenas da fase de admissão: se a réplica escolhida não começar o prefill em X ms, tentar outra e cancelar a primeira.

### Armadilhas comuns

- Prometer p99 sem limites de taxa e perfil.
- Dimensionar pela média.
- Esquecer a redundância (uma falha de réplica viola o SLO).
- Não discutir o custo e a utilização baixa.

## Resumo do capítulo

- SLIs de LLM: disponibilidade, TTFT e ITL por classe de tamanho, E2E, rejeição, qualidade. SLOs com orçamento de erro.
- Sinais dourados adaptados: tráfego em tokens, erros (incluindo CUDA/NCCL/NaN), latência (TTFT, ITL, fila), saturação (KV, fila, preempções).
- Métricas de GPU do DCGM: SM/tensor/DRAM active, clocks e throttling, ECC, Xid, erros de NVLink/PCIe. "GPU utilization" não mede eficiência.
- Traces por requisição mostram fila vs prefill vs decode.
- Falhas por camada: tráfego, roteamento, engine, modelo, comunicação, CUDA, hardware, plataforma. Erros de CUDA corrompem o contexto; NCCL trava o grupo; stragglers atrasam todos; corrupção silenciosa não gera erro.
- Princípios: raio de impacto, health check profundo, falhar rápido e reiniciar, degradação graciosa, detecção de qualidade, canary.
- Pod Pending: `describe` e eventos; recursos, fragmentação de GPUs, device plugin, taints, afinidade, quotas, PVC, gang scheduling.
- Endpoint dedicado: capacidade reservada pelo perfil e pelo p99, utilização menor, configuração estática para latência, N+1, admissão na taxa contratada.

## Checklist para a entrevista

- [ ] Defino SLIs e SLOs para um serviço de LLM, separados por classe de tamanho.
- [ ] Listo os quatro sinais dourados adaptados a inferência.
- [ ] Sei quais métricas do DCGM importam e por que "GPU utilization" engana.
- [ ] Desenho um trace de requisição e explico como ele localiza o problema.
- [ ] Percorro a pilha de falhas camada por camada, com detecção e resposta.
- [ ] Explico erros de CUDA pegajosos, NCCL hang, stragglers e corrupção silenciosa.
- [ ] Tenho um roteiro de resposta a incidentes (mitigar antes de investigar).
- [ ] Investigo um pod Pending com `describe`, eventos e a tabela de causas.
- [ ] Dimensiono um endpoint dedicado para um p99 com N+1.
- [ ] Comparo endpoint dedicado e pool compartilhado em configuração e custo.
