# Capítulo 14 — Arquitetura Avançada de Inferência {#cap-14}

Este último capítulo cobre as técnicas e os designs que aparecem em entrevistas de nível sênior e Staff: **speculative decoding**, serving de **muitos adaptadores LoRA** sobre um modelo base, **saídas estruturadas**, **modelos multimodais**, e as variações de "projete uma API com batching dinâmico" que a Anthropic e a xAI pedem. Ele se apoia em tudo que veio antes, então os links para os capítulos anteriores são frequentes.

## 14.1 Speculative decoding

O decode gera um token por passo e é memory-bound ([Capítulo 1](#cap-01)): a GPU passa o passo lendo os pesos e fica com o cálculo ocioso. **Verificar** vários tokens de uma vez custa quase o mesmo que gerar um, porque a leitura dos pesos é a mesma; só a quantidade de cálculo aumenta, e cálculo está sobrando.

O **speculative decoding** (Leviathan et al., 2023; Chen et al., 2023) explora isso:

1. Um **rascunho** barato propõe os próximos $k$ tokens.
2. O modelo **alvo** (o grande) processa os $k$ tokens propostos numa única passada e calcula sua própria distribuição em cada posição.
3. Os tokens propostos são **aceitos** da esquerda para a direita enquanto passam no teste; no primeiro rejeitado, o alvo escolhe um token correto naquela posição, e o resto é descartado.

```text
 contexto: "O gato subiu no"

 rascunho propõe (k = 4):   telhado  da   casa   ontem
 alvo verifica, 1 passada:   ✔        ✔     ✔      ✘
                                              no lugar de "ontem",
                                              o alvo amostra "à"
 resultado do passo: "telhado da casa à"  → 4 tokens em 1 passada
                                            do modelo grande
```

### A regra de aceitação

Seja $p(x)$ a probabilidade do token $x$ segundo o alvo e $q(x)$ segundo o rascunho. O token proposto $x$ é aceito com probabilidade:

$$\min\left(1, \frac{p(x)}{q(x)}\right)$$

Se for rejeitado, um token novo é amostrado da distribuição corrigida:

$$p'(x) = \frac{\max(0,\, p(x) - q(x))}{\sum_{y} \max(0,\, p(y) - q(y))}$$

Essa regra (uma forma de rejection sampling) garante que a saída tem **exatamente a mesma distribuição** que o modelo alvo sozinho produziria. O speculative decoding não troca qualidade por velocidade: só troca cálculo ocioso por velocidade. Com greedy, a regra fica simples: aceita se o token proposto é o argmax do alvo.

### Quanto acelera

Se cada token proposto é aceito com probabilidade $\alpha$ (independente, como aproximação), o número esperado de tokens produzidos por passada do alvo, com $k$ propostas, é:

$$E[\text{tokens}] = \frac{1 - \alpha^{k+1}}{1 - \alpha}$$

::: conta
**Fazendo a conta:** $\alpha = 0{,}8$ e $k = 4$.

- $E = (1 - 0{,}8^5) / (1 - 0{,}8) = (1 - 0{,}328) / 0{,}2 \approx$ **3,36 tokens** por passada do alvo.
- Se a passada de verificação custa 1,1× um passo normal (cálculo extra) e o rascunho custa 0,2× para gerar as 4 propostas, cada "rodada" custa 1,3×.
- Speedup: 3,36 / 1,3 ≈ **2,6×** no TPOT.
- Com $\alpha = 0{,}5$: $E = (1 - 0{,}5^5)/0{,}5 \approx 1{,}94$ → speedup ~1,5×. A taxa de aceitação manda em tudo.
:::

### Tipos de rascunho

| Rascunho | Como propõe | Prós | Contras |
|---|---|---|---|
| Modelo pequeno separado | um LLM menor da mesma família | simples, genérico | memória e cálculo extras; precisa do mesmo tokenizer |
| N-gramas / prompt lookup | copia trechos que já aparecem no contexto | grátis; ótimo para edição de código, RAG | só funciona quando há repetição |
| Medusa | várias "cabeças" extras no próprio modelo preveem os tokens +1, +2, +3... | sem modelo separado | exige treinar as cabeças |
| EAGLE | rascunho leve que trabalha com as representações internas do alvo | aceitação alta | exige treinar o rascunho |
| MTP (multi-token prediction) | modelo treinado para prever vários tokens (ex.: DeepSeek-V3) | vem do treino | depende do modelo |

Variações com **árvore**: em vez de uma única sequência de $k$ propostas, o rascunho propõe várias alternativas em forma de árvore, e o alvo verifica todos os ramos de uma vez com uma **máscara de atenção em árvore** (cada token só enxerga seus ancestrais). Aumenta a chance de aceitar mais tokens por passada.

### Quando não ajuda

- **Batch grande**: com muitas sequências, o decode já fica mais perto do limite de cálculo, e o cálculo extra da verificação deixa de ser grátis. O ganho diminui e pode virar perda. Muitos motores ajustam $k$ (ou desligam a especulação) conforme a carga.
- **Taxa de aceitação baixa**: texto muito criativo (temperatura alta) ou um rascunho ruim para o domínio.
- **KV cache**: os tokens rejeitados escreveram K e V no cache; é preciso desfazer (voltar o comprimento). Com cache paginado, isso é barato.

## 14.2 Serving de muitos adaptadores LoRA

**LoRA** (low-rank adaptation) adapta um modelo adicionando a cada matriz $W$ um termo de posto baixo: $W' = W + BA$, com $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times k}$ e $r$ pequeno (8, 16, 64). Um adaptador ocupa uma fração pequena do modelo.

Um provedor pode ter **milhares** de adaptadores (um por cliente ou tarefa) sobre o mesmo modelo base. Uma réplica por adaptador seria um desperdício absurdo. O serving multi-LoRA mantém **um** modelo base e aplica o adaptador certo para cada requisição, **no mesmo batch**:

$$y_i = W x_i + B_{a(i)} A_{a(i)} x_i$$

onde $a(i)$ é o adaptador da requisição $i$.

```text
 batch com 4 requisições, 3 adaptadores

 x1 (adaptador A) ┐
 x2 (adaptador B) ├─▶ W·X  (uma GEMM grande, compartilhada)
 x3 (adaptador A) │       +
 x4 (adaptador C) ┘   para cada adaptador: B_a·(A_a·X_a)
                      (GEMMs pequenas agrupadas num kernel
                       só, como as SGMV do Punica)
```

Peças do sistema (ideias de sistemas como Punica e S-LoRA):

- **Kernels agrupados** para aplicar adaptadores diferentes a linhas diferentes do batch num único lançamento.
- **Cache de adaptadores** na GPU, com os demais na CPU, carregados sob demanda (LRU).
- **Memória unificada**: adaptadores e KV cache dividindo o mesmo depósito de blocos.
- **Roteamento**: mandar requisições do mesmo adaptador para as réplicas que já o têm carregado.
- **Prefix cache por adaptador**: a chave do cache precisa incluir o adaptador ([Q043](#q043)).

## 14.3 Saídas estruturadas (constrained decoding)

Muitas aplicações exigem que a saída siga um formato: JSON com um esquema, uma chamada de função, uma expressão regular. **Constrained decoding** garante isso: a cada passo, calcula-se o conjunto de tokens que mantêm a saída válida, e os outros recebem logit $-\infty$ antes do sampling.

```text
 esquema: {"nome": string, "idade": inteiro}
 já gerado: {"nome": "Ana", "idade":
 tokens permitidos agora: espaços, dígitos, "-"
 máscara: logits de todos os outros tokens → −∞
```

A gramática (esquema JSON, regex) é compilada num autômato; o estado do autômato avança a cada token. O desafio de desempenho: calcular a máscara sobre um vocabulário de 128 mil tokens a cada passo, sem atrasar a GPU. Bibliotecas como Outlines e XGrammar pré-computam a maior parte por estado do autômato e calculam a máscara na CPU **enquanto** a GPU roda o forward. Uma otimização extra: quando só existe um caminho possível (por exemplo, o texto fixo `", "idade": `), os tokens podem ser anexados de uma vez, sem passar pelo modelo um a um.

## 14.4 Modelos multimodais

Modelos de visão e linguagem transformam cada imagem em **tokens visuais** com um encoder (por exemplo, um ViT), que entram no LLM junto com o texto. Cada imagem pode virar de centenas a milhares de tokens, dependendo da resolução.

Consequências para o serving:

- **Prefill mais pesado**: imagens aumentam muito o número de tokens de entrada.
- **Encoder como etapa separada**: o encoder de visão é outro modelo, com outro perfil (compute-bound, sem KV cache). Pode rodar em GPUs separadas, com batching próprio, e entregar os embeddings para o LLM, uma desagregação "encoder → prefill → decode".
- **Cache por conteúdo**: a mesma imagem enviada de novo (comum em chats) pode reaproveitar os embeddings do encoder e o KV cache, se a chave incluir o **hash da imagem**, não só os tokens de placeholder.
- **Áudio e vídeo**: áudio vira tokens por janela de tempo; vídeo vira quadros amostrados. Os números de tokens crescem rápido, e decidir quantos quadros e que resolução usar vira uma decisão de custo.

## Perguntas de entrevista comentadas

## Q105 — Projete uma API HTTP de alta concorrência para inferência de modelos de linguagem, em que workers de GPU processam requisições compatíveis em batches dinâmicos num pool limitado de GPUs. {#q105}

::: pergunta-meta
**[Relatado]** Anthropic · Machine Learning Engineer · presencial · listada em jul. 2026 · Difícil · [fonte](https://prachub.com/interview-questions/design-a-dynamically-batched-inference-api)
:::

### Resposta em 30 segundos

"Frontends HTTP assíncronos aceitam as requisições, validam, tokenizam e calculam uma chave de compatibilidade: modelo, versão, adaptador e o que mais impedir que duas requisições dividam um batch. Cada chave tem uma fila. Os workers de GPU puxam trabalho, o que dá backpressure natural: um worker só pega o que consegue admitir no KV cache. Dentro do worker, continuous batching junta todas as requisições compatíveis num passo. Como o pool é limitado, o despachante decide qual fila atender com uma pontuação que combina prioridade, idade e tamanho do lote possível, e chaves raras ganham um prazo máximo para não morrerem de fome. Respostas voltam por streaming. Na sobrecarga, rejeito cedo com 429 com base no tempo estimado de fila."

### Resposta completa

**1. O que é "compatível".** É a palavra-chave do enunciado. Duas requisições podem dividir um passo de GPU se usam os **mesmos pesos** e o **mesmo programa de execução**:

| Atributo | Precisa ser igual? | Observação |
|---|---|---|
| Modelo e versão | sim | pesos diferentes |
| Precisão (FP8, BF16) | sim | outro engine/kernels |
| Adaptador LoRA | não, com multi-LoRA ([14.2](#cap-14)) | sim, sem suporte |
| Parâmetros de sampling | não | aplicados por sequência |
| Tamanho do prompt | não, com continuous batching | sim, em engines de formas fixas (buckets) |
| Saída estruturada | não | máscara por sequência |
| Prioridade | não | afeta a ordem, não a compatibilidade |

Conclusão que você deve dizer: "Com um engine moderno, a chave de compatibilidade se reduz basicamente a (modelo, versão, precisão), e às vezes adaptador. Quanto menos atributos na chave, maiores os batches."

**2. Arquitetura.**

```text
 clientes ──HTTP/SSE──▶ ┌──────────────────────────────┐
                        │ FRONTENDS (async, sem estado)│
                        │ auth, quota, validação,      │
                        │ tokenização, chave de compat.│
                        └──────────────┬───────────────┘
                                       ▼
                        ┌──────────────────────────────┐
                        │ FILAS POR CHAVE              │
                        │ (modelo A v3) ████████       │
                        │ (modelo A v4) ██             │
                        │ (modelo B v1) █████          │
                        └──────────────┬───────────────┘
                                       ▼ despachante:
                                       │ qual fila atender?
              ┌────────────────────────┼─────────────────────┐
              ▼ PULL                   ▼ PULL                ▼
      ┌──────────────┐         ┌──────────────┐      ┌──────────────┐
      │ worker GPU 1 │         │ worker GPU 2 │      │ worker GPU N │
      │ modelo A v3  │         │ modelo A v3  │      │ modelo B v1  │
      │ continuous   │         │              │      │              │
      │ batching     │         │              │      │              │
      └──────┬───────┘         └──────────────┘      └──────────────┘
             │ tokens (stream) de volta ao frontend que
             ▼ segura a conexão do cliente
```

**3. Pull em vez de push.** Os workers **pedem** trabalho quando têm capacidade (blocos de KV livres, orçamento de tokens). Vantagens: backpressure natural (um worker cheio não recebe nada), balanceamento automático (o worker mais livre pede mais), e falhas simples (um worker que morre para de pedir). Desvantagem: latência de ida e volta para pedir trabalho, mitigada pedindo em lote e antecipando.

**4. O despachante com pool limitado.** Quando há mais filas do que workers livres, quem é atendido? Uma pontuação por fila:

$$\text{score} = w_1 \cdot \text{prioridade} + w_2 \cdot \text{idade da mais antiga} + w_3 \cdot \min(\text{tamanho}, B_{max})$$

- O termo de **tamanho** favorece filas que formam batches cheios (eficiência).
- O termo de **idade** impede inanição: uma chave rara (um modelo pouco usado) acaba atendida antes de estourar o SLO, mesmo com um batch pequeno.
- Se a chave exige um modelo que nenhum worker tem carregado, o despachante pode decidir **trocar** o modelo de um worker (caro: segundos a minutos), o que só compensa com fila suficiente. Por isso, réplicas por modelo são decididas pelo autoscaler, e a troca sob demanda é a exceção.

**5. Batching dentro do worker.** Continuous batching com chunked prefill ([Capítulo 7](#cap-07)). O worker admite requisições da fila enquanto houver memória e orçamento.

**6. Concorrência alta no HTTP.** Dezenas de milhares de conexões abertas (muitas em streaming por dezenas de segundos):

- Frontends assíncronos (event loop), sem uma thread por conexão.
- Os tokens voltam do worker para o frontend que segura a conexão (por um canal direto, gRPC streaming, ou um barramento de mensagens).
- Keep-alive e limites de conexões por cliente.
- Cancelamento: cliente desconectou → o frontend avisa o worker → a sequência sai do batch.

**7. Sobrecarga.** Estimar a espera: (tokens na fila da chave) ÷ (throughput dos workers da chave). Se passa do SLO, 429 imediato com `Retry-After`. Prioridades por plano.

**8. Números.** Faça uma conta rápida como a da [seção 11.2](#cap-11) para mostrar quantos workers o pool precisa e onde está o limite.

### Perguntas de acompanhamento prováveis

- **Por que não uma fila única?** Requisições incompatíveis não dividem batch; uma fila única obrigaria o worker a pular itens, e o FCFS deixaria de fazer sentido. Filas por chave tornam o despacho explícito.
- **Como garantir justiça entre clientes dentro da mesma chave?** Subfilas por cliente com round robin ponderado, ou fair queuing por tokens.
- **E se um worker morrer com 200 sequências em andamento?** As conexões no frontend recebem erro ou as requisições são reenfileiradas com o texto já gerado como continuação. O despachante para de contar com aquele worker.
- **Onde ficaria o prefix caching?** No worker; o despachante pode preferir o worker com o prefixo em cache (afinidade), como na [Q043](#q043).

### Armadilhas comuns

- Não definir "compatível".
- Push cego para workers, sem backpressure.
- Esquecer a inanição de chaves raras.
- Thread por conexão no HTTP.

## Q106 — Projete um serviço que aceite requisições de inferência online de baixa latência, agrupe requisições compatíveis em batches, roteie o trabalho para workers de GPU e suporte vários modelos e versões ao mesmo tempo. {#q106}

::: pergunta-meta
**[Relatado]** Anthropic · Software Engineer · presencial · listada em mar. 2026 · Difícil · [fonte](https://prachub.com/interview-questions/design-gpu-inference-request-batching)
:::

### Resposta em 30 segundos

"É a mesma base da Q105, com a ênfase em vários modelos e versões. Separo o problema em três: posicionamento, que decide quais modelos e versões ficam em quais GPUs, com base na demanda e na memória; roteamento, que manda cada requisição para um worker que tem o modelo e a versão certos, com balanceamento por carga em tokens; e batching dentro do worker, por modelo. Para baixa latência: orçamento de latência por etapa, prazo de espera curto no batching, workers sempre aquecidos para os modelos de maior tráfego, e nada de carregar modelo no caminho da requisição. Para versões: pools por versão, roteamento por pesos para canary e A/B, drenagem antes de desligar, e roteamento fixo por cliente quando a versão importa para ele."

### Resposta completa

**1. Orçamento de latência.** Para "baixa latência", quebre o SLO em partes e diga quanto cada componente pode gastar:

```text
 SLO: TTFT p99 < 300 ms (prompts < 2k tokens)

 rede + TLS ............................  20 ms
 frontend (auth, validação, tokenização)   5 ms
 roteamento ............................   2 ms
 fila + espera de batching ..............  60 ms  ◀ o botão
 prefill (2k tokens) .................... 150 ms
 primeiro token de volta ................  10 ms
 folga .................................. ~50 ms
```

A espera de batching é o botão que troca latência por eficiência. Com continuous batching, a espera é até o próximo passo do worker (dezenas de ms), não um prazo fixo.

**2. Posicionamento (placement).** Decidir quais modelos rodam onde:

```text
 entradas: demanda por (modelo, versão) em tokens/s,
           memória de cada modelo, perfil de GPU,
           SLO de cada um
 saída:    número de réplicas por (modelo, versão)
           e em quais nós

 heurística:
 1. modelos grandes e muito usados: réplicas dedicadas,
    número ∝ demanda / capacidade por réplica
 2. modelos pequenos: vários na mesma GPU (multiplexação),
    se a soma da memória e do tráfego couber
 3. versões em canary: poucas réplicas, crescem com o peso
 4. cauda longa: carga sob demanda, com custo de cold start
    aceito (ou SLO diferente)
```

**3. Roteamento.** O roteador mantém um mapa (modelo, versão) → workers saudáveis com aquele modelo carregado, atualizado pelo plano de controle. Para cada requisição:

1. Resolver a versão: a pedida explicitamente, ou a escolhida pela política (pesos de canary e A/B, atribuição estável por cliente).
2. Escolher o worker: menor carga em tokens entre duas sorteadas (power of two choices), com preferência por afinidade de prefixo.
3. Enviar e receber o stream.

**4. Batching por modelo, no worker.** Continuous batching. Se vários modelos pequenos dividem uma GPU, cada um tem seu engine e o compartilhamento é de memória e tempo de GPU (com MPS ou MIG para isolamento).

**5. Ciclo de vida das versões.**

```text
 v8 publicada no registro
   └─▶ pré-distribuição dos pesos (Q083)
   └─▶ réplicas da v8 sobem e aquecem (fora do tráfego)
   └─▶ roteador: v8 com 1% → compara métricas
   └─▶ 5% → 25% → 100% (ou rollback)
   └─▶ v7: drena (sem requisições novas, termina as atuais)
   └─▶ v7: desligada; pesos mantidos no cache por N dias
```

Clientes que fixaram a v7 (por reprodutibilidade) mantêm uma réplica mínima da v7 até a data de descontinuação anunciada.

**6. Diferenças em relação à Q105**, que você pode verbalizar: a Q105 é sobre o despacho com pool limitado (quem é atendido); esta é sobre o mapa de modelos para GPUs e as transições de versão sem perder requisições.

### Perguntas de acompanhamento prováveis

- **Como você multiplexa vários modelos pequenos numa GPU sem que um prejudique o outro?** MIG para isolamento de hardware; ou processos separados com MPS e limites de memória; e monitoramento de latência por modelo para detectar interferência.
- **O que acontece se a demanda por um modelo triplicar de repente?** Rejeição antecipada e prioridades no curto prazo; o autoscaler sobe réplicas (minutos); se houver modelos de baixa prioridade ocupando GPUs, eles podem ser despejados para dar lugar.
- **Como garantir a mesma resposta para o mesmo prompt numa mesma versão?** Fixar a versão, temperatura 0 e kernels invariantes ao tamanho do batch; mesmo assim, diferenças numéricas entre configurações podem mudar tokens. Seja honesto sobre isso ([Q034](#q034)).
- **Como medir se o batching está ajudando?** Tamanho médio de batch por modelo, tokens/s por GPU, e a latência adicionada pela espera.

### Armadilhas comuns

- Não ter orçamento de latência por etapa.
- Carregar modelos no caminho da requisição.
- Trocar de versão sem drenagem.
- Ignorar o posicionamento de modelos em GPUs.

## Q107 — Projete um sistema de upload de arquivos para um app de chat com IA que lide com uploads multimodais grandes e os coloque no contexto do modelo. {#q107}

::: pergunta-meta
**[Relatado]** xAI · AI engineer · design de sistemas · 2026 · Difícil · [fonte](https://www.tryexponent.com/blog/ai-engineer-interview-questions)
:::

### Resposta em 30 segundos

"O upload vai direto do cliente para o armazenamento de objetos, em partes e com retomada, usando URLs pré-assinadas, sem passar pelos servidores da aplicação. O cliente calcula o hash para deduplicar. Quando o upload termina, um pipeline assíncrono valida o tipo e o tamanho, faz a varredura de segurança e processa por tipo: extração de texto e OCR para PDFs, redimensionamento para imagens, transcrição para áudio, amostragem de quadros para vídeo. Ele conta os tokens e, se o arquivo couber no orçamento de contexto, coloca o conteúdo inteiro; se não couber, divide em pedaços com embeddings e usa busca para trazer só os trechos relevantes. Guardo as representações processadas por hash do conteúdo, inclusive as saídas do encoder de visão, e coloco o arquivo numa posição estável do prompt para o prefix cache funcionar nos turnos seguintes. O cliente acompanha o status em tempo real. E trato o conteúdo do arquivo como dados, nunca como instruções."

### Resposta completa

**1. Requisitos.** Tipos (PDF, imagens, planilhas, código, áudio, vídeo), tamanho máximo (centenas de MB? GB?), volume (uploads por dia), latência aceitável até o arquivo estar "pronto", limites de contexto do modelo, privacidade e retenção.

::: conta
**Fazendo a conta (hipotética):** 2 milhões de uploads por dia, 5 MB em média.

- Volume: 10 TB por dia de entrada; ~115 MB/s em média, com picos de 3 a 5×.
- Um PDF de 100 páginas vira ~50 mil tokens de texto. Uma imagem, de centenas a alguns milhares de tokens visuais.
- Se 30% dos uploads são PDFs grandes, o processamento (OCR, extração) é o gargalo de CPU/GPU, não o armazenamento.
:::

**2. O caminho do upload.**

```text
 cliente                      API                  objeto (S3/GCS)
   │ 1. POST /uploads          │                         │
   │    {nome, tamanho, hash}  │                         │
   │──────────────────────────▶│ dedup? (hash já existe  │
   │                           │ para este usuário → ok) │
   │ 2. URLs pré-assinadas     │                         │
   │◀──────────────────────────│ (multipart, 1 por parte)│
   │ 3. PUT das partes (paralelo, retomável) ───────────▶│
   │ 4. POST /uploads/{id}/concluir                      │
   │──────────────────────────▶│ ── evento ─▶ pipeline   │
   │ 5. status via SSE/WebSocket: enviando → processando │
   │    → pronto (ou erro com motivo)                    │
```

- **Direto para o armazenamento**: os servidores da aplicação não carregam bytes, só metadados. Escala e custo muito melhores.
- **Multipart e retomada**: arquivos grandes em partes de 8 a 64 MB; se a conexão cai, só a parte atual é reenviada.
- **Deduplicação por hash** (por usuário ou organização, para não vazar a existência de arquivos de outras pessoas).

**3. O pipeline de processamento.**

```text
 evento "upload concluído"
   ▼
 VALIDAR: tipo real (pelos bytes, não pela extensão),
          tamanho, páginas, duração
   ▼
 SEGURANÇA: antivírus/malware, arquivos compactados
            maliciosos (zip bomb), PDFs com scripts
   ▼
 PROCESSAR POR TIPO (workers separados por tipo,
                     filas com prioridade):
   PDF/DOCX → texto + layout; OCR em páginas escaneadas
   imagem   → normaliza, redimensiona, gera miniatura
   áudio    → transcrição (modelo de fala)
   vídeo    → amostra quadros + transcreve o áudio
   planilha → tabelas em texto estruturado (ou ferramenta)
   código   → texto, com linguagem detectada
   ▼
 CONTAR TOKENS e decidir a ESTRATÉGIA DE CONTEXTO
   ▼
 GUARDAR: representação processada, chave = hash do
          conteúdo + versão do processador
   ▼
 status "pronto"
```

**4. Como o arquivo entra no contexto.** A decisão central:

| Situação | Estratégia |
|---|---|
| Cabe com folga no contexto | conteúdo inteiro no prompt |
| Grande, mas a pergunta é geral ("resuma") | resumo hierárquico (map-reduce) gerado sob demanda e cacheado |
| Grande, pergunta específica | dividir em trechos, embeddings, buscar os relevantes (RAG) |
| Imagens | tokens visuais pelo encoder; resolução escolhida pelo orçamento |
| Vídeo longo | quadros amostrados + transcrição, com busca por trecho |

**5. Ligação com o serving (o que diferencia a resposta).**

- **Prefix caching**: o arquivo vira um prefixo enorme. Se ele entra sempre na **mesma posição** do prompt (logo depois do system prompt e antes da conversa), os turnos seguintes reaproveitam o KV do arquivo inteiro. Se a aplicação reordena ou reformata o conteúdo a cada turno, o cache se perde e cada pergunta paga o prefill de 50 mil tokens de novo ([Q043](#q043)).
- **Cache do encoder**: embeddings visuais por hash da imagem, para não reprocessar.
- **Roteamento por afinidade**: a conversa com um arquivo grande deve voltar para a réplica que tem o KV dele.
- **Contexto longo é caro**: o prefill de 100 mil tokens leva segundos; mostrar "lendo o arquivo..." na interface e usar a resposta em streaming.

**6. Segurança e privacidade.**

- Controle de acesso: só o dono (e quem ele compartilhou) lê o arquivo e suas representações.
- Criptografia em repouso e em trânsito; retenção e exclusão (apagar o arquivo apaga também as representações, embeddings e caches).
- **Injeção de prompt em documentos**: um PDF pode conter texto como "ignore as instruções anteriores e...". O conteúdo do arquivo é **dado**, não instrução; o template do prompt deve delimitar claramente o conteúdo, e o sistema não deve dar a esse conteúdo autoridade para acionar ferramentas sensíveis sem confirmação.

**7. Falhas e operação.** Retries idempotentes por etapa, filas com dead letter, limite de tempo por arquivo, métricas de tempo até "pronto" por tipo e tamanho, taxa de falha por tipo.

### Perguntas de acompanhamento prováveis

- **Por que não mandar o arquivo para o servidor da API?** Os servidores ficariam ocupados com bytes, com conexões longas e uso de memória, e escalariam mal. URLs pré-assinadas tiram esse peso.
- **O usuário pergunta algo antes do processamento terminar. E agora?** Mostrar o status; responder com o que já está pronto (por exemplo, as primeiras páginas) deixando isso claro; ou esperar com um tempo limite.
- **Como escolher o tamanho dos trechos para RAG?** Pelo tipo de documento: por seção ou parágrafo, com sobreposição pequena, algumas centenas de tokens; avaliar a qualidade das respostas com perguntas reais.
- **Como lidar com um vídeo de 2 horas?** Transcrição + amostragem esparsa de quadros, indexados por tempo; buscar os trechos relevantes à pergunta em vez de colocar tudo no contexto.

### Armadilhas comuns

- Passar os bytes pelos servidores da aplicação.
- Processar de forma síncrona no upload.
- Ignorar o limite de contexto e o custo do prefill.
- Esquecer o prefix caching e a posição estável do arquivo no prompt.
- Não tratar injeção de prompt nos documentos.

## Resumo do capítulo

- **Speculative decoding**: rascunho propõe $k$ tokens, alvo verifica numa passada; regra $\min(1, p/q)$ preserva a distribuição; $E = (1-\alpha^{k+1})/(1-\alpha)$ tokens por passada; perde força com batch grande.
- Rascunhos: modelo pequeno, n-gramas, Medusa, EAGLE, MTP; verificação em árvore.
- **Multi-LoRA**: um modelo base, adaptadores aplicados por requisição no mesmo batch com kernels agrupados; cache de adaptadores; chave de cache com o adaptador.
- **Constrained decoding**: autômato da gramática gera máscara de tokens; calcular na CPU em paralelo com a GPU.
- **Multimodal**: tokens visuais aumentam o prefill; encoder separado; cache por hash do conteúdo.
- **APIs com batching dinâmico**: chave de compatibilidade mínima, filas por chave, workers que puxam trabalho, despachante com pontuação anti-inanição.
- **Vários modelos e versões**: orçamento de latência, posicionamento, roteamento, ciclo de vida com canary e drenagem.
- **Upload multimodal**: direto ao armazenamento, pipeline assíncrono por tipo, estratégia de contexto (inteiro, resumo, RAG), posição estável para o prefix cache, segurança e injeção de prompt.

## Checklist para a entrevista

- [ ] Explico speculative decoding e a regra de aceitação, e por que a distribuição é preservada.
- [ ] Calculo o número esperado de tokens por passada e o speedup.
- [ ] Comparo os tipos de rascunho e digo quando a especulação não ajuda.
- [ ] Explico serving multi-LoRA com a fórmula e os kernels agrupados.
- [ ] Explico constrained decoding e o problema de desempenho da máscara.
- [ ] Listo os impactos de entradas multimodais no serving.
- [ ] Defino a chave de compatibilidade para batching e o que dispensa estar nela.
- [ ] Desenho um sistema pull com filas por chave e um despachante justo.
- [ ] Monto um orçamento de latência por etapa.
- [ ] Projeto o upload multimodal ponta a ponta, incluindo prefix cache e segurança.
