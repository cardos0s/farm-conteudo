# Capítulo 7 — Serving de LLMs e Continuous Batching {#cap-07}

Você já sabe que o decode é memory-bound e que o batching é a saída ([Capítulo 1](#cap-01)), e sabe que a memória do KV cache limita o batch ([Capítulo 6](#cap-06)). Este capítulo trata de **como montar os batches**: quem entra, quando, quem sai, o que fazer com um prompt gigante que chega no meio, como não deixar ninguém esperando para sempre.

É o tema preferido das entrevistas da Anthropic: o levantamento encontrou pelo menos oito enunciados relatados sobre batching, APIs de inferência em GPU ou distribuição de pesos. Os enunciados variam ("projete um sistema de batching", "critique este design", "projete o scheduler"), mas o núcleo é o mesmo, e este capítulo o cobre do zero.

## 7.1 Batching estático

A forma mais simples: junte $B$ requisições, rode o batch inteiro até **todas** terminarem, devolva, junte o próximo batch.

```text
 Batching estático, batch de 4 (█ = gerando, ░ = slot ocioso)

 passo:    1  2  3  4  5  6  7  8  9 10 11 12
 req A:    █  █  █  ░  ░  ░  ░  ░  ░  ░  ░  ░   (3 tokens)
 req B:    █  █  █  █  █  █  █  █  █  █  █  █   (12 tokens)
 req C:    █  █  █  █  █  ░  ░  ░  ░  ░  ░  ░   (5 tokens)
 req D:    █  █  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░   (2 tokens)
           └── o batch só termina no passo 12 ──┘
 utilização: 22 de 48 slots = 46%
 A e D esperam até o passo 12 para devolver a resposta
 (sem streaming); a req E, que chegou no passo 2,
 espera até o passo 13 para começar
```

Três problemas:

1. **Slots ociosos**: quem termina cedo deixa o lugar vazio até o fim.
2. **Latência inflada**: sem streaming, quem termina cedo espera o mais lento. Mesmo com streaming, quem chega espera o batch inteiro acabar para entrar.
3. **Padding**: prompts de tamanhos diferentes precisam ser completados até o maior.

As saídas de LLMs têm tamanhos muito variados (de 1 a milhares de tokens), então esses problemas são graves.

## 7.2 Batching dinâmico (clássico)

Para modelos de **custo fixo por entrada** (classificadores, modelos de embedding, reconhecimento de imagem), o padrão clássico é o **batching dinâmico**, usado por servidores como o Triton Inference Server e o TorchServe:

- Requisições entram numa fila.
- Um laço tira da fila até $B_{max}$ itens **ou** até passar um tempo máximo de espera $T_{max}$ desde o primeiro item.
- Roda o batch, devolve todos, repete.

```text
 tempo ─────────────────────────────────────────────▶
 chegadas:  ●  ● ●     ●●●●●●●●●●●●●●●●     ●
            │                                │
            ├─T_max─┤                        ├─T_max─┤
            [batch 3]  [batch cheio: B_max]  [batch 1]
            saiu pelo   saiu pelo tamanho     saiu pelo
            tempo                             tempo
```

Os dois parâmetros controlam o trade-off:

- $T_{max}$ maior → batches mais cheios em carga baixa, mais latência.
- $B_{max}$ maior → mais throughput em carga alta, cada batch demora mais.

Esse padrão funciona bem quando todos os itens custam parecido e terminam juntos. Para LLMs, que geram um número variável de tokens, não basta.

## 7.3 Continuous batching

A ideia que mudou o serving de LLMs veio do paper do **Orca** (Yu et al., OSDI 2022): **agendar por iteração, não por requisição**. A cada passo do modelo (cada token), o scheduler decide de novo quem está no batch. Quem termina sai na hora; quem chega entra no passo seguinte.

```text
 Continuous batching, até 4 slots (letras = requisições)

 passo:    1  2  3  4  5  6  7  8  9 10 11 12
 slot 1:   A  A  A  F  F  F  F  F  F  H  H  H
 slot 2:   B  B  B  B  B  B  B  B  B  B  B  B
 slot 3:   C  C  C  C  C  G  G  G  G  G  G  G
 slot 4:   D  D  E  E  E  E  E  E  I  I  I  I
           D sai no passo 2 e E entra no passo 3; A sai
           no passo 3 e F entra no 4; e assim por diante.
 utilização perto de 100% enquanto houver fila
```

O mesmo paper introduziu o **selective batching**: as operações que não dependem de outras posições (as GEMMs das projeções e do MLP) rodam juntas para todos os tokens do batch, achatados num eixo só, independentemente de sequência. Só a atenção, que depende do histórico de cada sequência, é calculada sequência por sequência (ou com um kernel que entende sequências de tamanhos diferentes). Isso permite misturar no mesmo passo uma sequência em prefill (com centenas de tokens) e várias em decode (com um token cada).

```text
 Um passo com batching seletivo (layout "achatado")

 tokens do passo: [ s1:t57 | s2:t903 | s3: p0 p1 ... p511 ]
                    decode    decode     prefill (512 tok.)
                  └──────────── 514 tokens ──────────────┘
 GEMMs (QKV, saída, MLP): uma matriz [514 × d] para todos
 atenção: cada sequência contra o próprio KV cache
          (kernel com comprimentos variáveis)
```

Todos os motores modernos (vLLM, TensorRT-LLM, SGLang, TGI, LMDeploy) fazem continuous batching. A NVIDIA chama de **in-flight batching**.

## 7.4 Anatomia de um scheduler

O scheduler é o coração de um motor de inferência. A cada passo ele monta o "plano" do passo: quais sequências rodam e quantos tokens cada uma processa.

```text
              ┌───────────── chegadas ────────────┐
              ▼                                   │
     ┌─────────────────┐                          │
     │ ESPERANDO (fila)│  ordenada por prioridade │
     │ ainda sem KV    │  e chegada               │
     └────────┬────────┘                          │
              │ admite se houver memória          │
              │ e orçamento de tokens             │
              ▼                                   │
     ┌─────────────────┐   preempção    ┌──────────────────┐
     │ RODANDO         │──(falta de ──▶ │ PREEMPTADAS      │
     │ têm blocos de KV│   memória)     │ KV descartado    │
     │ prefill/decode  │◀── retomada ───│ (recomputa) ou   │
     └────────┬────────┘                │ na CPU (swap)    │
              │ terminou (EOS, max      └──────────────────┘
              ▼ tokens, cancelada)
     ┌─────────────────┐
     │ FINALIZADAS     │  libera blocos (ou deixa no
     └─────────────────┘  prefix cache)
```

Os parâmetros principais (os nomes variam por motor):

| Parâmetro | Controla | Efeito de aumentar |
|---|---|---|
| Máximo de sequências por passo | tamanho do batch | mais throughput, TPOT maior |
| Máximo de tokens por passo (orçamento) | quanto prefill entra por passo | TTFT melhor, ITL pior |
| Fração da memória para KV | capacidade total | mais sequências, risco de OOM em picos |
| Tamanho do bloco de KV | granularidade | ver [Capítulo 6](#cap-06) |

E as políticas:

- **Ordem de admissão**: FCFS (primeiro a chegar, primeiro a ser atendido), prioridades (pago vs gratuito, síncrono vs batch), justiça entre clientes.
- **Quem preemptar**: normalmente a sequência que chegou por último (perde menos trabalho e preserva o FCFS).
- **Como preemptar**: recomputar ou swap ([Capítulo 6](#cap-06)).
- **Reserva de memória**: admitir uma sequência só se houver margem para ela crescer alguns passos, para evitar preempções em cadeia.

## 7.5 Chunked prefill

Um problema do continuous batching ingênuo: quando chega um prompt de 30 mil tokens, o passo em que ele faz prefill demora centenas de milissegundos, e **todos** os usuários em decode ficam sem token nesse tempo. É um soluço de latência (pico de ITL).

O **chunked prefill** (SARATHI, Agrawal et al., 2023; Sarathi-Serve, 2024) divide o prefill em pedaços e junta cada pedaço com os decodes em andamento, respeitando um orçamento de tokens por passo:

```text
 Orçamento: 2.048 tokens por passo. 60 sequências em decode.
 Chega um prompt de 6.000 tokens.

 passo t:    [60 decodes][pedaço 1: 1.988 tokens do prompt]
 passo t+1:  [60 decodes][pedaço 2: 1.988 tokens]
 passo t+2:  [60 decodes][pedaço 3: 1.988 tokens]
 passo t+3:  [60 decodes][pedaço 4: 36 tokens] → 1º token
             do novo usuário sai neste passo
 passo t+4:  [61 decodes]
```

Os benefícios:

1. **ITL estável**: nenhum passo fica muito mais longo que os outros.
2. **Melhor uso da GPU**: os passos de decode são memory-bound e deixam cálculo ocioso; o pedaço de prefill usa esse cálculo "de carona". O custo marginal dos decodes num passo que já tem prefill é pequeno, e vice-versa.
3. **Pico de memória limitado**: as ativações temporárias são proporcionais ao orçamento, não ao maior prompt.

O custo: o TTFT de prompts longos aumenta um pouco (o prefill fica espalhado em vários passos, e cada pedaço precisa ler o KV dos pedaços anteriores). O orçamento de tokens é o botão que ajusta esse trade-off.

## 7.6 Head-of-line blocking

**Head-of-line (HOL) blocking** é quando um item no começo da fila trava todos os que estão atrás. Em serving de LLMs, aparece em três níveis:

```text
 1. NO BATCH (batching estático)
    o batch espera a sequência mais longa terminar

 2. NO PASSO (prefill longo sem chunking)
    um prefill de 30k tokens congela todos os decodes

 3. NA FILA (FCFS puro com memória cheia)
    uma requisição gigante no começo da fila espera
    memória para caber, e as pequenas atrás dela,
    que caberiam, esperam também
```

As soluções correspondentes:

1. Continuous batching (resolve o nível 1).
2. Chunked prefill (resolve o nível 2).
3. Políticas de fila mais espertas para o nível 3:
   - **Pular** (com limite): admitir requisições menores que cabem enquanto a grande espera, com um mecanismo anti-inanição (envelhecimento: quanto mais tempo esperando, mais prioridade).
   - **Filas separadas por tamanho** (curtas e longas), com capacidade reservada para cada uma.
   - **Pools separados**: réplicas dedicadas a contextos longos.
   - **Aproximações de "shortest job first"**: se o sistema conseguir **prever** o tamanho da saída (por um modelo pequeno ou por histórico do cliente), priorizar as mais curtas reduz a latência média, sempre com proteção contra inanição.

## 7.7 Os motores

| Motor | Origem | Destaques |
|---|---|---|
| vLLM | UC Berkeley, comunidade | PagedAttention, muitos modelos e hardwares, prefix caching, chunked prefill, API compatível com OpenAI |
| TensorRT-LLM | NVIDIA | kernels mais afinados para NVIDIA (FP8, FP4), runtime C++, in-flight batching, integração com Triton Inference Server |
| SGLang | LMSYS, comunidade | RadixAttention, runtime eficiente, bom para programas com muitas chamadas e saídas estruturadas |
| TGI | Hugging Face | servidor integrado ao ecossistema HF |
| LMDeploy | OpenMMLab | runtime TurboMind, quantização |

O funcionamento interno de vLLM e TensorRT-LLM está na [Q035](#q035). Na entrevista, mais importante que saber detalhes de cada motor é saber **as peças comuns** e os trade-offs.

## Perguntas de entrevista comentadas

## Q049 — Projete um sistema de batching de inferência para uma única GPU que processe até 100 entradas por batch enquanto os usuários esperam de forma síncrona, maximizando a utilização sob restrições de computação. {#q049}

::: pergunta-meta
**[Relatado]** Anthropic · ML engineer · design de sistemas · 2026 · Difícil · [fonte](https://www.tryexponent.com/blog/ai-engineer-interview-questions)
:::

### Resposta em 30 segundos

"Uma fila na frente da GPU e um único laço de batching. Cada requisição vira uma future e entra na fila; o laço pega o primeiro item e continua juntando até ter 100 ou até passar um tempo máximo curto, alguns milissegundos, calibrado pelo SLO. Enquanto a GPU roda um batch, o próximo já vai se formando, então em carga alta os batches saem cheios sem espera extra. A GPU roda fora do event loop; o resultado de cada item vai para a future dele. Tenho fila limitada com rejeição rápida quando enche, timeouts e cancelamento, isolamento de erros por item e métricas de tamanho de batch, espera na fila e latência. Se o modelo for um LLM, troco o batching por requisição por continuous batching por iteração, porque as saídas têm tamanhos diferentes."

### Resposta completa

**1. Esclareça os requisitos.** Faça perguntas antes de desenhar:

- Que modelo? Custo fixo por entrada (classificador, embedding) ou geração de tamanho variável (LLM)?
- As entradas têm tamanhos parecidos? Precisa de padding?
- Qual o SLO de latência (p99)? Qual a taxa de chegada esperada e os picos?
- O que acontece com sobrecarga: rejeitar, degradar, esperar?

Vou assumir primeiro um modelo de custo aproximadamente fixo, e depois mostrar a variação para LLM.

**2. Arquitetura.**

```text
 clientes (HTTP, síncronos)
     │ requisição
     ▼
 ┌────────────────────────────────────────────────────────┐
 │ servidor (async)                                       │
 │  handler: valida → cria future → põe na fila → await   │
 │                         │                              │
 │                  ┌──────▼──────┐   fila LIMITADA       │
 │                  │ fila (FIFO) │   cheia → 429/503     │
 │                  └──────┬──────┘                       │
 │                         ▼                              │
 │  laço de batching: junta até 100 ou até T_max          │
 │                         │                              │
 │                         ▼                              │
 │  executor da GPU (thread/processo separado)            │
 │   pré-processa → forward → pós-processa                │
 │                         │                              │
 │  resolve as futures ◀───┘                              │
 └────────────────────────────────────────────────────────┘
```

**3. O código do núcleo.**

```python
import asyncio
import time

class Sobrecarga(Exception):
    pass

class Batcher:
    def __init__(self, modelo, max_batch=100,
                 max_espera_ms=5.0, max_fila=5000):
        self.modelo = modelo          # fn(list) -> list
        self.max_batch = max_batch
        self.max_espera = max_espera_ms / 1000
        self.fila = asyncio.Queue(maxsize=max_fila)

    async def inferir(self, entrada, timeout_s=2.0):
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        try:
            self.fila.put_nowait((entrada, fut))
        except asyncio.QueueFull:
            raise Sobrecarga("fila cheia")   # vira 429
        # wait_for cancela a future se estourar o prazo
        return await asyncio.wait_for(fut, timeout_s)

    async def _juntar(self):
        lote = [await self.fila.get()]       # bloqueia
        prazo = time.monotonic() + self.max_espera
        while len(lote) < self.max_batch:
            resta = prazo - time.monotonic()
            if resta <= 0:
                break
            try:
                item = await asyncio.wait_for(
                    self.fila.get(), resta)
            except asyncio.TimeoutError:
                break
            lote.append(item)
        # descarta quem desistiu (timeout ou cancelamento)
        return [(e, f) for e, f in lote if not f.done()]

    async def laco(self):
        loop = asyncio.get_running_loop()
        while True:
            lote = await self._juntar()
            if not lote:
                continue
            entradas = [e for e, _ in lote]
            try:
                # GPU fora do event loop
                saidas = await loop.run_in_executor(
                    None, self.modelo, entradas)
            except Exception as erro:
                for _, f in lote:
                    if not f.done():
                        f.set_exception(erro)
                continue
            for (_, f), s in zip(lote, saidas):
                if not f.done():
                    f.set_result(s)
```

**4. As decisões e os porquês.**

- **Tempo máximo de espera curto e adaptativo.** Com carga baixa, esperar 5 ms por companhia é barato comparado ao tempo de inferência. Com carga alta, a fila já tem itens quando o laço volta, e o batch sai cheio na hora. Esse comportamento ("batching adaptativo") surge naturalmente porque a coleta do próximo batch acontece enquanto o atual roda.
- **Quanto esperar?** Calcule: se o SLO p99 é 200 ms e o forward de 100 itens leva 60 ms, sobram ~140 ms para fila e espera no pior caso. Comece com uma espera máxima de poucos milissegundos e ajuste olhando o tamanho médio do batch e a latência.
- **Por que limitar a fila?** Uma fila sem limite transforma sobrecarga em latência infinita para todos. Rejeitar cedo (429 com `Retry-After`) é melhor do que aceitar uma requisição que vai estourar o timeout de qualquer jeito. Um bom critério: rejeitar se o tempo estimado de espera (tamanho da fila ÷ throughput) já passa do SLO.
- **Por que uma única execução por vez na GPU?** Várias threads disputando a GPU não aumentam o throughput e pioram a previsibilidade. Uma melhoria é **pipeline**: pré-processar e copiar o batch $k+1$ para a GPU (em outra stream CUDA) enquanto o batch $k$ calcula.
- **Padding e buckets.** Se as entradas variam em tamanho (texto), agrupe por faixas de tamanho para reduzir o padding, ou use kernels que aceitam tamanhos variáveis.
- **Isolamento de erros.** Uma entrada malformada não deve derrubar as outras 99. Valide na entrada; se o batch falhar, reexecute dividindo ao meio (busca binária) para isolar o culpado.
- **Cancelamento.** Se o cliente desistiu, não gaste GPU com ele.

**5. Maximizar a utilização.**

```text
 utilização da GPU ao longo do tempo

 sem pipeline:  [cpu prep][  GPU  ][cpu pós][cpu prep][  GPU  ]
                 GPU ociosa ▲               ▲
 com pipeline:  [  GPU k  ][  GPU k+1  ][  GPU k+2  ]
                [prep k+1 ][prep k+2   ]  (outra thread/stream)
```

- Escolha o tamanho do batch pela curva throughput × latência medida (não necessariamente 100 sempre).
- Use CUDA graphs para tamanhos de batch fixos (buckets), o que exige padding até o bucket.
- Meça a utilização real (tempo de GPU ocupada, MFU), não só o `nvidia-smi`.

**6. Se for um LLM.** O batching por requisição desperdiça muito ([7.1](#cap-07)). O design muda para continuous batching: o "laço" passa a ser o scheduler por iteração ([Q052](#q052)), o limite de 100 vira o máximo de sequências simultâneas (limitado também pela memória do KV cache), e os usuários síncronos recebem os tokens por streaming.

**7. Observabilidade.** Histogramas de tamanho do batch, tempo na fila, tempo de forward, latência ponta a ponta, taxa de rejeição, taxa de timeout e uso da GPU.

### Perguntas de acompanhamento prováveis

- **O que acontece se chegar uma rajada de 10 mil requisições?** A fila enche até o limite, o excedente recebe 429 rapidamente, a GPU processa batches cheios na capacidade máxima, e a latência dos aceitos fica limitada. Com autoscaling, novas réplicas sobem; com uma GPU só, rejeitar é o correto.
- **Como escolher entre latência e throughput?** Pelo SLO. Meça a curva de latência e throughput por tamanho de batch e escolha o maior batch cuja latência p99 ainda cumpre o SLO com folga para a fila.
- **Por que não `asyncio.sleep` num laço para verificar a fila?** Polling com sleep adiciona latência e gasta CPU. Esperar na própria fila com timeout acorda exatamente quando há trabalho.
- **E se as entradas tiverem prioridades diferentes?** Use uma fila de prioridade (ou várias filas), com proteção contra inanição.

### Armadilhas comuns

- Esperar o batch encher (100) sem tempo máximo: em carga baixa, a latência explode.
- Fila sem limite.
- Chamar o modelo dentro do event loop (bloqueia todo o servidor).
- Não tratar timeouts, cancelamentos e erros por item.
- Usar batching por requisição para um LLM sem discutir continuous batching.

## Q050 — Aqui está o design de um desenvolvedor júnior para um sistema de batching de inferência. Critique-o e proponha melhorias. {#q050}

::: pergunta-meta
**[Relatado]** Anthropic · Engineering Manager · rodada técnica · 2025 · Difícil · [fonte](https://www.jointaro.com/interviews/companies/anthropic/experiences/engineering-manager-seattle-wa-august-1-2025-no-offer-positive-9d853f74/)
:::

### Resposta em 30 segundos

"Eu leria o design procurando, em ordem: corretude (cada resposta volta para a requisição certa, erros e timeouts tratados), latência (espera por batch cheio sem prazo, polling com sleep), robustez (fila sem limite, sem backpressure, uma entrada ruim derruba o batch), utilização da GPU (GPU ociosa durante pré e pós-processamento, padding, várias threads disputando a GPU) e operação (métricas, configuração, testes de carga). Para cada problema, explico o impacto com um cenário concreto e proponho a mudança, priorizando o que é bug de corretude antes do que é otimização. Como gestor, também cuidaria da forma: feedback específico, começando pelo que está bom, e transformando os problemas em perguntas que ensinem."

### Resposta completa

Como o design real é dado na hora, você precisa de um **roteiro de revisão**. Vamos usar um design júnior típico como exemplo:

```python
# design do júnior (exemplo típico)
fila = []
resultados = {}

def handler(req):
    fila.append(req)
    while req.id not in resultados:   # espera ativa
        time.sleep(0.01)
    return resultados.pop(req.id)

def worker():
    while True:
        if len(fila) >= 100:          # só roda com 100
            lote = fila[:100]
            del fila[:100]
            saidas = modelo(lote)
            for r, s in zip(lote, saidas):
                resultados[r.id] = s
        time.sleep(0.01)
```

**A crítica, organizada por gravidade:**

| # | Problema | Cenário de falha | Correção |
|---|---|---|---|
| 1 | Só roda com 100 itens | às 3h, com 5 req/s, cada requisição espera ~20 s | prazo máximo de espera ($T_{max}$) |
| 2 | Lista compartilhada sem lock | `append` e `del` concorrentes perdem ou duplicam itens | fila thread-safe (`queue.Queue` ou `asyncio.Queue`) |
| 3 | Erro no modelo não é tratado | uma exceção mata o worker; todos os handlers esperam para sempre | try/except, propagar erro para cada requisição, reiniciar |
| 4 | Sem timeout no handler | cliente e thread presos indefinidamente | timeout, e remover a requisição se desistir |
| 5 | Espera ativa com sleep | 10 ms de latência extra e CPU gasta por requisição | future/evento por requisição |
| 6 | Fila sem limite | numa rajada, a latência cresce sem parar | limite + rejeição rápida (429) |
| 7 | `resultados` cresce se ninguém buscar | vazamento de memória com clientes que desistem | futures (não há dicionário global) |
| 8 | Uma entrada ruim derruba o batch | um texto malformado faz 99 falharem | validação + isolamento por bisseção |
| 9 | GPU ociosa durante pré/pós | utilização baixa | pipeline com outra thread/stream |
| 10 | Sem métricas | ninguém sabe o tamanho real dos batches | histogramas de batch, fila e latência |
| 11 | IDs podem colidir | duas requisições com o mesmo id trocam respostas | IDs gerados pelo servidor (UUID) ou futures |

A **proposta** é o design da [Q049](#q049), apresentado como evolução do que o júnior fez, não como substituição.

**Para LLMs, mais quatro pontos** que aparecem com frequência em designs júnior:

- Batching estático para geração de tamanho variável (usar continuous batching).
- Nenhuma noção de memória do KV cache na admissão (OOM em picos).
- Prefills longos travando todos (chunked prefill).
- Sem streaming para usuários síncronos.

**A parte de gestão.** Como a vaga era de Engineering Manager, o entrevistador também avalia **como** você dá o feedback:

```text
 1. Comece pelo que está certo
    ("a ideia de juntar em batches e ter um worker
     separado é exatamente o caminho")
 2. Priorize: corretude > robustez > desempenho > estilo
 3. Para cada problema, mostre o CENÁRIO de falha
    (mais convincente que uma regra abstrata)
 4. Faça perguntas que levem a pessoa à resposta
    ("o que acontece às 3 da manhã, com pouco tráfego?")
 5. Combine os próximos passos e como validar
    (teste de carga, testes de falha)
```

### Perguntas de acompanhamento prováveis

- **Qual desses problemas você corrigiria primeiro?** Os de corretude e disponibilidade: lista sem lock, erro que mata o worker, ausência de timeout. Depois o prazo máximo de espera (latência inaceitável em carga baixa).
- **Como você testaria o design corrigido?** Teste de carga com taxa variável (baixa, nominal, rajada), injeção de falhas (modelo levantando exceção, entradas malformadas, clientes que desistem), e verificação de que cada resposta corresponde à entrada certa.
- **Como você lidaria se o júnior discordasse?** Usar dados: um teste rápido que mostre o cenário de falha resolve a discussão melhor do que autoridade.

### Armadilhas comuns

- Listar problemas sem priorizar.
- Reescrever tudo do zero sem aproveitar o que estava certo.
- Ignorar problemas de concorrência (lock, IDs) e focar só em desempenho.
- Em vaga de gestão, esquecer a forma do feedback.

## Q051 — Quando o TensorRT-LLM é melhor que o vLLM? {#q051}

::: pergunta-meta
**[Fornecedor]** Banco público de perguntas de inferência, marcada como comum · Presencial · 2026 · Médio · [fonte](https://tracker-7ex.pages.dev/10_interview_bank/production/inference-serving/)
:::

### Resposta em 30 segundos

"Quando o hardware é NVIDIA, o modelo é estável e já bem suportado, e o objetivo é o máximo de desempenho por GPU: os kernels do TensorRT-LLM costumam ser os mais afinados para cada geração, principalmente em FP8 na Hopper e FP4 na Blackwell, com fusões agressivas. Compensa em escala grande, em que alguns por cento de throughput valem muito dinheiro, e quando o time pode investir no build e na configuração. O vLLM ganha quando você precisa de flexibilidade: modelos novos no dia do lançamento, arquiteturas variadas, hardware que não é NVIDIA, iteração rápida e uma comunidade grande. A resposta certa é medir os dois com a carga real."

### Resposta completa

Organize como critérios de decisão:

| Critério | Favorece TensorRT-LLM | Favorece vLLM |
|---|---|---|
| Hardware | só NVIDIA, especialmente gerações recentes | AMD, outros aceleradores, frota mista |
| Modelo | estável, popular, já otimizado | lançado ontem, arquitetura incomum |
| Prioridade | desempenho máximo, custo por token | velocidade de iteração, flexibilidade |
| Precisão | FP8/FP4 com kernels e calibração da NVIDIA | formatos variados da comunidade (AWQ, GPTQ...) |
| Escala | frota grande (ganhos pequenos valem muito) | pequena e média |
| Operação | time com experiência no stack NVIDIA, Triton Inference Server | time Python, integração rápida |
| Customização | aceita a estrutura do framework | precisa mexer no scheduler ou no modelo em Python |

E três ressalvas que mostram maturidade:

1. **A diferença muda com o tempo.** Os dois projetos evoluem rápido e copiam boas ideias um do outro. Uma comparação de seis meses atrás pode estar errada hoje.
2. **Benchmarks públicos raramente batem com a sua carga.** A distribuição de tamanhos de prompt e de saída, a taxa de prefix cache e o SLO mudam qual é o melhor.
3. **O custo total inclui engenharia.** Um motor 10% mais rápido que exige o dobro de esforço de manutenção pode não compensar numa frota pequena.

O processo de decisão que você descreveria:

```text
 1. Definir a carga representativa (tamanhos reais,
    taxa de chegada, prefixos compartilhados)
 2. Definir o SLO (TTFT p99, TPOT p99)
 3. Configurar os dois motores com esforço comparável
    (mesma precisão, mesmo paralelismo, ajuste básico)
 4. Medir goodput: requisições/s que cumprem o SLO
 5. Medir qualidade (a quantização difere)
 6. Pesar custo de operação e velocidade de iteração
```

### Perguntas de acompanhamento prováveis

- **Por que o TensorRT-LLM tende a ser mais rápido em NVIDIA?** Kernels escritos pela própria NVIDIA para cada arquitetura, acesso antecipado a recursos novos do hardware, fusões agressivas e ferramentas de quantização integradas.
- **E o SGLang?** Forte em cargas com muito prefixo compartilhado e em programas com várias chamadas (agentes, saídas estruturadas), graças ao RadixAttention e ao runtime enxuto. Também entra na comparação.
- **Dá para usar os dois?** Sim, inclusive por modelo: motores diferentes atrás do mesmo gateway, escolhidos pelo melhor resultado em cada caso.

### Armadilhas comuns

- Responder com um número fixo ("TensorRT-LLM é 30% mais rápido").
- Ignorar hardware e cobertura de modelos.
- Não propor medir com a carga real.
- Esquecer o custo de engenharia.

## Q052 — Projete o escalonador de um motor de inferência com continuous batching. {#q052}

::: pergunta-meta
**[Fornecedor]** Banco público de perguntas por empresa (startups de inferência) · Presencial · 2026 · Difícil · [fonte](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)
:::

### Resposta em 30 segundos

"O scheduler roda uma vez por passo do modelo e monta o plano do passo: quais sequências entram e quantos tokens cada uma processa. Mantém filas de espera, em execução e preemptadas. Em cada passo, primeiro garante o decode de quem já está rodando, um token cada, alocando blocos de KV e preemptando a sequência mais recente se faltar memória. Depois continua prefills em andamento em pedaços, e por último admite novas requisições enquanto houver orçamento de tokens e memória com margem. Os parâmetros são o máximo de sequências, o orçamento de tokens por passo e a margem de memória; as políticas são de ordem (FCFS, prioridade, justiça), de preempção e de anti-inanição. Precisa ser rápido: roda a cada poucos milissegundos, então as estruturas são incrementais."

### Resposta completa

**1. Requisitos.**

- Maximizar goodput: throughput dentro do SLO de TTFT e TPOT.
- Nunca dar OOM: respeitar a memória do KV cache.
- Justiça e prioridades; nenhuma requisição esperando para sempre.
- Overhead pequeno: o scheduler roda a cada passo (a cada 10–50 ms).

**2. Estado.**

```text
 Sequência:
   id, prioridade, chegada
   tokens do prompt, tokens gerados
   tokens já processados (KV calculado)
   tabela de blocos de KV
   estado: ESPERANDO | RODANDO | PREEMPTADA | FINALIZADA
   parâmetros: max_tokens, stop, sampling

 Filas:
   esperando  (ordenada por prioridade e chegada)
   rodando    (ordem de admissão)
   preemptadas (voltam antes das novas)

 Gerenciador de KV: blocos livres, contagem de
   referências, prefix cache (hash → bloco)
```

**3. O algoritmo de um passo.**

```python
from collections import deque

class Scheduler:
    def __init__(self, kv, max_seqs=256, max_tokens=8192,
                 margem_blocos=64):
        self.kv = kv                  # gerenciador de blocos
        self.max_seqs = max_seqs
        self.max_tokens = max_tokens  # orçamento por passo
        self.margem = margem_blocos   # folga ao admitir
        self.esperando = deque()      # inclui preemptadas
        self.rodando = []             # ordem de admissão

    def _preemptar(self, seq):
        self.kv.liberar(seq)          # recomputação
        seq.processados = 0           # refará o prefill
        self.rodando.remove(seq)
        self.esperando.appendleft(seq)   # volta na frente

    def passo(self):
        orc = self.max_tokens
        plano = []                    # (seq, n_tokens)

        # 1) quem já roda: decode (1) ou resto do prefill
        for seq in list(self.rodando):
            if orc == 0:
                break
            if seq not in self.rodando:   # foi preemptada
                continue                  # neste passo
            n = min(seq.tokens_pendentes(), orc)
            while not self.kv.reservar(seq, n):
                vitima = self.rodando[-1]   # a mais nova
                self._preemptar(vitima)
                if vitima is seq:
                    n = 0
                    break
            if n > 0:
                plano.append((seq, n))
                orc -= n

        # 2) admite novas (ou preemptadas) se couber
        while (self.esperando and orc > 0
               and len(self.rodando) < self.max_seqs):
            seq = self.esperando[0]
            self.kv.aplicar_prefix_cache(seq)  # pula prefixo
            n = min(seq.tokens_pendentes(), orc)
            if not self.kv.reservar(seq, n,
                                    margem=self.margem):
                break        # FCFS: não pula a da frente
            self.esperando.popleft()
            self.rodando.append(seq)
            plano.append((seq, n))
            orc -= n
        return plano

    def depois_do_passo(self, resultados):
        for seq, token in resultados:
            seq.anexar(token)
            if seq.terminou():        # EOS, stop, max_tokens
                self.kv.liberar(seq, manter_no_cache=True)
                self.rodando.remove(seq)
```

**4. As decisões importantes.**

- **Decode antes de prefill novo**: protege o TPOT de quem já está recebendo tokens. Os prefills novos usam o orçamento que sobra (é o chunked prefill da seção [7.5](#cap-07)).
- **Preemptar a mais recente**: perde menos trabalho e mantém a ordem de chegada. Alternativas: preemptar a de menor prioridade, ou a que tem o menor KV (mais barata de recomputar).
- **Margem ao admitir**: se você admitir até o último bloco livre, o próximo passo de decode já precisa preemptar alguém. A margem evita esse ciclo de admitir e preemptar.
- **FCFS estrito na admissão** (o `break`): simples e justo, mas causa head-of-line blocking se a primeira da fila for enorme. Variante: permitir pular com limite e envelhecimento ([Q053](#q053)).
- **Prefix cache na admissão**: antes de reservar, descontar os tokens que já estão no cache; a requisição precisa de menos memória e menos prefill.

**5. Extensões que o entrevistador pode pedir.**

- **Prioridades**: várias filas, ou uma fila ordenada por (prioridade, chegada); preempção de baixa prioridade quando chega alta.
- **Justiça entre clientes**: orçamento de tokens por cliente por janela de tempo (deficit round robin, fair queuing por tokens).
- **SLO-aware**: estimar, para cada requisição, se ela ainda vai cumprir o TTFT; priorizar as que estão perto de estourar, ou rejeitar cedo as que já estouraram.
- **Speculative decoding**: cada sequência pode processar $k+1$ tokens por passo; o orçamento precisa contar isso.
- **Pipeline parallelism**: vários micro-batches em voo ao mesmo tempo; o scheduler monta batches para estágios diferentes.

**6. Desempenho do próprio scheduler.** Num passo de 20 ms, o scheduler e a preparação das entradas (tabelas de blocos, posições, metadados de atenção) precisam levar bem menos que isso. Técnicas: estruturas incrementais (só atualizar o que mudou), preparar o passo $t+1$ na CPU enquanto a GPU executa o passo $t$ (scheduling assíncrono), e mover partes da preparação para a GPU.

### Perguntas de acompanhamento prováveis

- **Como você escolheria o orçamento de tokens por passo?** Pelo SLO de ITL: meça o tempo do passo em função do número de tokens e escolha o maior orçamento cujo tempo de passo ainda cumpre o ITL p99. Valores comuns ficam entre algumas centenas e alguns milhares de tokens.
- **Recomputar ou swap na preempção?** Ver [Capítulo 6](#cap-06). Recomputar é mais simples; swap compensa para contextos longos.
- **Como evitar que uma requisição seja preemptada repetidamente?** Contar preempções por sequência e protegê-la depois de um limite, ou aumentar sua prioridade (envelhecimento).
- **E o cancelamento pelo cliente?** O handler marca a sequência como cancelada; o scheduler a remove no próximo passo e libera os blocos.

### Armadilhas comuns

- Esquecer a memória do KV na admissão.
- Não ter política de preempção.
- Misturar prefill e decode sem orçamento (soluços de ITL).
- Ignorar o custo de CPU do próprio scheduler.
- Esquecer inanição e justiça.

## Q053 — Agrupe em batch requisições com tamanhos de prompt e de saída muito diferentes sem bloqueio head-of-line. {#q053}

::: pergunta-meta
**[Fornecedor]** Together AI, segundo fornecedor de preparação ("candidatos supostamente recebem") · Design de sistemas · 2026 · Difícil · [fonte](https://www.techinterview.org/post/3233475437/together-ai-engineering-interview/)
:::

### Resposta em 30 segundos

"Ataco o bloqueio nos três níveis. No batch, continuous batching: cada sequência sai quando termina e alguém entra no lugar, então saídas longas não seguram as curtas. No passo, chunked prefill com orçamento de tokens: um prompt de 100 mil tokens entra em pedaços e não congela os decodes. Na fila, admissão que não deixa uma requisição gigante travar as pequenas: permito pular com limite e envelhecimento, separo filas ou capacidade por classe de tamanho e, em escala, uso pools dedicados a contexto longo. Se tiver uma estimativa do tamanho da saída, aproximo shortest-job-first com proteção contra inanição. E meço TTFT e ITL por classe de tamanho, para ver se alguma classe está sendo sacrificada."

### Resposta completa

Comece mostrando os três níveis de HOL blocking (seção [7.6](#cap-07)) e resolva cada um.

**Nível 1 — saídas de tamanhos diferentes.** Continuous batching ([7.3](#cap-07)). Com batching por iteração, uma sequência que gera 4.000 tokens não atrasa uma que gera 10.

**Nível 2 — prompts de tamanhos diferentes.** Chunked prefill com orçamento ([7.5](#cap-07)). Um prompt de 100 mil tokens, com orçamento de 4.096 tokens por passo, leva umas 25 iterações de prefill, e os decodes continuam saindo em todas elas.

**Nível 3 — a fila.** É onde está a parte interessante.

```text
 Fila FCFS com memória quase cheia:

 [GIGANTE 120k tokens][p 300][p 500][p 200][p 800] ...
     ▲ não cabe agora; espera blocos liberarem
       e as pequenas, que caberiam, esperam junto

 Admissão com "pulo limitado":
   - tenta a primeira; se não cabe, tenta as seguintes
     até K posições à frente
   - a gigante acumula "idade"; quando passa de um
     limite, o scheduler PARA de admitir as outras e
     reserva memória para ela (drena até caber)
```

As opções, com seus trade-offs:

| Técnica | Como | Trade-off |
|---|---|---|
| Pulo limitado + envelhecimento | admite as que cabem, com prioridade crescente para quem espera | simples; a gigante pode esperar mais |
| Reserva de capacidade por classe | ex.: no máximo 30% dos blocos para contextos > 32k | protege as pequenas; pode deixar capacidade ociosa |
| Pools separados | réplicas dedicadas a contexto longo (mais memória, outro paralelismo) | melhor isolamento; custo de frota e roteamento |
| SJF aproximado | prioriza saídas previstas curtas | menor latência média; depende de previsão, risco de inanição |
| Preempção de longas | pausa uma longa para aliviar a memória | protege as curtas; a longa refaz trabalho |
| Limites por cliente | tokens em voo por cliente | um cliente não monopoliza |

**Prevendo o tamanho da saída.** O tamanho da saída é desconhecido, mas pode ser estimado: pelo `max_tokens` pedido, pelo histórico do cliente ou do tipo de tarefa, ou por um modelo pequeno que prevê a faixa de tamanho a partir do prompt. Com uma previsão razoável, ordenar por "trabalho restante estimado" aproxima o shortest-job-first, que minimiza a latência média. Sempre com envelhecimento, senão as longas nunca rodam.

**O papel do roteamento entre réplicas.** Com várias réplicas, o balanceador deve considerar a carga de **tokens** de cada réplica (KV em uso, tokens na fila), não o número de requisições. Mandar dois prompts de 100 mil tokens para a mesma réplica cria um gargalo local mesmo com a frota ociosa.

**Medição.** Separe as métricas por classe de tamanho (por exemplo, prompt < 1k, 1k–8k, 8k–32k, > 32k). O p99 agregado pode parecer bom enquanto a classe de contexto longo está com TTFT de minutos, ou o contrário.

### Perguntas de acompanhamento prováveis

- **Chunked prefill não piora o TTFT dos prompts longos?** Um pouco: o prefill é espalhado em vários passos e cada pedaço relê o KV dos anteriores. É o preço de não congelar os outros. Pools dedicados podem dar TTFT melhor para contextos longos.
- **Por que não ordenar só pelo tamanho do prompt?** O tamanho do prompt afeta o prefill (TTFT), mas a ocupação de memória e GPU ao longo do tempo depende também do tamanho da saída. O ideal é estimar o trabalho total.
- **Como evitar que um cliente com muitos prompts longos prejudique os outros?** Quotas de tokens por cliente e fair queuing, além das reservas por classe.
- **A desagregação de prefill e decode ajuda aqui?** Sim: prompts longos ficam no pool de prefill e não interferem no ITL de quem está em decode. Ver [Q067](#q067).

### Armadilhas comuns

- Resolver só um dos três níveis.
- Propor SJF sem proteção contra inanição.
- Esquecer o roteamento entre réplicas.
- Medir só o p99 agregado.

## Resumo do capítulo

- **Batching estático** desperdiça slots e infla a latência quando as saídas têm tamanhos diferentes.
- **Batching dinâmico** (até $B_{max}$ ou $T_{max}$) serve para modelos de custo fixo; não basta para LLMs.
- **Continuous batching** (Orca): agendar por iteração; quem termina sai, quem chega entra no próximo passo. Batching seletivo junta as GEMMs de todos os tokens e trata a atenção por sequência.
- O **scheduler** mantém filas de espera, execução e preempção; respeita memória do KV, orçamento de tokens e máximo de sequências; decide prioridade e preempção.
- **Chunked prefill**: prompts longos em pedaços junto com os decodes; ITL estável, cálculo ocioso aproveitado, pico de memória limitado.
- **HOL blocking** em três níveis: batch, passo e fila. Soluções: continuous batching, chunked prefill e admissão com pulo limitado, reservas por classe, pools separados e SJF aproximado com envelhecimento.
- Batching síncrono para modelos de custo fixo: fila limitada, prazo máximo de espera, futures, GPU fora do event loop, isolamento de erros, cancelamento, métricas.

## Checklist para a entrevista

- [ ] Desenho batching estático e continuous batching e calculo a utilização de cada um.
- [ ] Explico batching seletivo e o layout achatado de tokens.
- [ ] Escrevo um batcher assíncrono com tamanho máximo, prazo máximo e fila limitada.
- [ ] Faço uma revisão de design priorizando corretude, robustez, desempenho e operação.
- [ ] Explico quando TensorRT-LLM ganha do vLLM e como decidir com medição.
- [ ] Escrevo o laço de um scheduler com decode primeiro, preempção e admissão com margem.
- [ ] Explico o orçamento de tokens e como escolhê-lo pelo SLO de ITL.
- [ ] Explico os três níveis de head-of-line blocking e as soluções de cada um.
- [ ] Discuto SJF aproximado e envelhecimento.
- [ ] Sei quais métricas separar por classe de tamanho.
