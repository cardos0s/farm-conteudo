# Guia de estilo do ebook

Como escrever e desenhar os capítulos de **System Design: 50 conceitos essenciais**. A build
(`build/montar.py`) depende deste formato, então siga à risca.

## Mapa dos capítulos

Use sempre estes números e títulos, inclusive nas referências cruzadas ("capítulo 25", "cap. 25").

| Nº | Arquivo | Título | Título original |
|---|---|---|---|
| | **Parte 1 — Princípios de arquitetura** (`parte-1-principios/`) | | *Core Architecture Principles* |
| 1 | `01-escalabilidade-vertical-horizontal.md` | Escalabilidade vertical vs. horizontal | Vertical vs Horizontal Scaling |
| 2 | `02-teorema-cap.md` | Teorema CAP | CAP Theorem |
| 3 | `03-teorema-pacelc.md` | Teorema PACELC | PACELC Theorem |
| 4 | `04-acid-vs-base.md` | ACID vs. BASE | ACID vs BASE |
| 5 | `05-throughput-vs-latencia.md` | Throughput vs. latência | Throughput vs Latency |
| 6 | `06-lei-de-amdahl.md` | Lei de Amdahl | Amdahl's Law |
| 7 | `07-consistencia-forte-vs-eventual.md` | Consistência forte vs. eventual | Strong vs Eventual Consistency |
| 8 | `08-stateful-vs-stateless.md` | Arquitetura stateful vs. stateless | Stateful vs Stateless Architecture |
| 9 | `09-microsservicos-vs-monolito.md` | Microsserviços vs. monólito | Microservices vs Monoliths |
| 10 | `10-serverless.md` | Arquitetura serverless | Serverless Architecture |
| | **Parte 2 — Redes e comunicação** (`parte-2-redes/`) | | *Networking and Communication* |
| 11 | `11-balanceamento-de-carga.md` | Balanceamento de carga | Load Balancing |
| 12 | `12-algoritmos-de-balanceamento.md` | Algoritmos de balanceamento | Load Balancing Algorithms |
| 13 | `13-proxy-reverso-vs-proxy-direto.md` | Proxy reverso vs. proxy direto | Reverse Proxy vs Forward Proxy |
| 14 | `14-api-gateway.md` | API Gateway | API Gateway |
| 15 | `15-cdn.md` | CDN | CDN (Content Delivery Network) |
| 16 | `16-dns.md` | DNS | DNS (Domain Name System) |
| 17 | `17-tcp-vs-udp.md` | TCP vs. UDP | TCP vs UDP |
| 18 | `18-http2-http3.md` | HTTP/2 e HTTP/3 (QUIC) | HTTP/2 and HTTP/3 (QUIC) |
| 19 | `19-grpc-vs-rest.md` | gRPC vs. REST | gRPC vs REST |
| 20 | `20-websocket-e-sse.md` | WebSocket e Server-Sent Events | WebSocket and Server-Sent Events (SSE) |
| 21 | `21-long-polling.md` | Long polling | Long Polling |
| 22 | `22-protocolo-gossip.md` | Protocolo gossip | Gossip Protocol |
| | **Parte 3 — Bancos de dados e armazenamento** (`parte-3-dados/`) | | *Database and Storage Internals* |
| 23 | `23-sharding.md` | Sharding | Sharding (Data Partitioning) |
| 24 | `24-replicacao.md` | Padrões de replicação | Replication Patterns (Master Slave, Master Master) |
| 25 | `25-hashing-consistente.md` | Hashing consistente | Consistent Hashing |
| 26 | `26-indices-btree-lsm.md` | Índices: B-Tree e LSM-Tree | Database Indexing (B Trees, LSM Trees) |
| 27 | `27-write-ahead-log.md` | Write-Ahead Logging (WAL) | Write Ahead Logging (WAL) |
| 28 | `28-normalizacao-vs-desnormalizacao.md` | Normalização vs. desnormalização | Normalization vs Denormalization |
| 29 | `29-persistencia-poliglota.md` | Persistência poliglota | Polyglot Persistence |
| 30 | `30-bloom-filter.md` | Bloom filter | Bloom Filters |
| 31 | `31-bancos-vetoriais.md` | Bancos de dados vetoriais | Vector Databases |
| | **Parte 4 — Confiabilidade e tolerância a falhas** (`parte-4-confiabilidade/`) | | *Reliability and Fault Tolerance* |
| 32 | `32-rate-limiting.md` | Rate limiting | Rate Limiting |
| 33 | `33-circuit-breaker.md` | Circuit breaker | Circuit Breaker Pattern |
| 34 | `34-bulkhead.md` | Bulkhead | Bulkhead Pattern |
| 35 | `35-retry-e-backoff.md` | Retries e backoff exponencial | Retry Patterns and Exponential Backoff |
| 36 | `36-idempotencia.md` | Idempotência | Idempotency |
| 37 | `37-heartbeat.md` | Heartbeat | Heartbeat |
| 38 | `38-eleicao-de-lider.md` | Eleição de líder (Paxos e Raft) | Leader Election (Paxos, Raft) |
| 39 | `39-saga.md` | Transações distribuídas: o padrão SAGA | Distributed Transactions (SAGA Pattern) |
| 40 | `40-two-phase-commit.md` | Two-Phase Commit (2PC) | Two Phase Commit (2PC) |
| | **Parte 5 — Cache e mensageria** (`parte-5-cache-mensageria/`) | | *Caching and Messaging* |
| 41 | `41-cache.md` | Cache | Caching |
| 42 | `42-estrategias-de-cache.md` | Estratégias de cache | Caching Strategies (Cache Aside, Write Through, etc.) |
| 43 | `43-politicas-de-remocao.md` | Políticas de remoção (LRU, LFU) | Cache Eviction Policies (LRU, LFU) |
| 44 | `44-filas-de-mensagens.md` | Filas de mensagens | Message Queues (Point to Point) |
| 45 | `45-pub-sub.md` | Pub/Sub | Pub Sub (Publish Subscribe) |
| 46 | `46-dead-letter-queue.md` | Dead letter queue | Dead Letter Queues |
| | **Parte 6 — Observabilidade e segurança** (`parte-6-observabilidade-seguranca/`) | | *Observability and Security* |
| 47 | `47-tracing-distribuido.md` | Tracing distribuído | Distributed Tracing |
| 48 | `48-sla-slo-sli.md` | SLA vs. SLO vs. SLI | SLA vs SLO vs SLI |
| 49 | `49-oauth2-oidc.md` | OAuth 2.0 e OIDC | OAuth 2.0 and OIDC |
| 50 | `50-tls-handshake.md` | Handshake TLS | TLS/SSL Handshake |
| 51 | `51-zero-trust.md` | Zero Trust | Zero Trust Security |

O artigo original promete 50 conceitos e entrega 51. Mantivemos todos.

## Formato de um capítulo

O modelo completo é `conteudo/parte-1-principios/02-teorema-cap.md`. Copie a estrutura dele.

```markdown
---
numero: 2
titulo: Teorema CAP
original: CAP Theorem
resumo: Uma frase de até ~35 palavras com a ideia central do conceito.
relacionados: [3, 4, 7]
---

## O essencial
## Aprofundando
## Analogia
## No mundo real
## Trade-offs
## Na entrevista
## Cuidado com
## Teste-se
```

- **Cabeçalho (YAML)**: `numero` e `titulo` iguais ao mapa acima; `original` é o título em inglês do
  artigo; `resumo` vira o "Em uma frase" do capítulo, a linha da cola e um flashcard, então precisa
  ficar de pé sozinho; `relacionados` lista de 2 a 5 capítulos ligados.
- **Seções**: exatamente estas oito, com estes nomes, nesta ordem, como `##`. Nada de `#` (o título
  vem do cabeçalho). Dentro de "Aprofundando" você pode usar `###`.

### O que vai em cada seção

| Seção | Conteúdo | Tamanho |
|---|---|---|
| O essencial | **Tradução fiel** do trecho do artigo original sobre o conceito. Mantém o sentido, as listas e os exemplos do autor; adapta só o que soaria estranho em português. Não acrescente nada aqui. | o do original |
| Aprofundando | Como funciona por dentro, passo a passo, com exemplo concreto. É onde o ebook vai além do artigo. Pode ter `###`, listas, tabela, bloco de código curto e o diagrama. | 200–420 palavras |
| Analogia | Uma analogia do dia a dia, de preferência brasileira (padaria, fila do banco, entregador, Pix, condomínio). Diferente da analogia do autor, se ele já usou uma. | 40–90 palavras |
| No mundo real | 2 a 4 itens com sistemas, tecnologias ou empresas reais que usam o conceito. Só fatos bem documentados; na dúvida, descreva de forma genérica. | 50–130 palavras |
| Trade-offs | Tabela comparativa (ideal para "X vs. Y") ou duas listas: **Você ganha** / **Você paga**. | 4–7 linhas |
| Na entrevista | 2 a 4 itens: quando trazer o conceito, como falar, o que o entrevistador quer ouvir. Pode ter uma frase pronta entre aspas. | 60–130 palavras |
| Cuidado com | 2 a 4 itens: confusões comuns, pegadinhas e o que o artigo simplificou ou ficou desatualizado (escreva **Atualização:** no começo desse item). | 50–130 palavras |
| Teste-se | Exatamente 3 perguntas com resposta, no formato abaixo. Misture uma de definição, uma de aplicação ("num sistema X, qual você escolhe?") e uma de pegadinha. | respostas de 1–3 frases |

Formato do "Teste-se" (a build transforma em perguntas com resposta escondida e em flashcards):

```markdown
**P:** Pergunta?

**R:** Resposta curta.
```

### Abertura de cada parte (`_parte.md`)

Cada pasta de parte tem um `_parte.md` com a introdução da parte (90 a 160 palavras, dois parágrafos
curtos: o que a parte cobre, por que importa e como os capítulos conversam entre si):

```markdown
---
parte: 1
titulo: Princípios de arquitetura
original: Core Architecture Principles
---

Texto da introdução.
```

### Apêndices (`conteudo/apendices/`)

Cabeçalho com `apendice` (letra) e `titulo`; corpo livre com seções `##`. Dois têm formato fixo:

- **Glossário** (`d-glossario.md`): seções `### A`, `### B`... e um item por termo:
  `- **Throughput** (*vazão*): quantas requisições o sistema atende por segundo. Capítulo 5.`
- **Simulado** (`e-simulado.md`): cada questão é um `###` numerado, quatro alternativas em lista de
  tarefas com exatamente uma marcada e a explicação em citação:

  ```markdown
  ### 1. Texto da pergunta?

  - [ ] alternativa
  - [x] alternativa correta
  - [ ] alternativa
  - [ ] alternativa

  > Por que a correta é a correta, em uma ou duas frases. Capítulo 2.
  ```

Confira o formato de tudo com:

```bash
python3 ebooks/system-design/build/checar.py
```

## Como escrever

- **Português do Brasil**, tratando o leitor por "você". Tom de quem explica numa lousa: direto,
  didático, sem enrolação. Frases curtas. Nada de emoji no texto (o layout já põe os ícones).
- **Termos técnicos**: use o termo que a área usa no Brasil. Se o mercado fala em inglês, mantenha em
  inglês (cache, load balancer, sharding, throughput, deploy, failover, timeout, retry, endpoint); na
  primeira vez que aparecer no capítulo, dê o equivalente em português entre parênteses quando ajudar:
  "balanceador de carga (load balancer)". Termos em inglês no meio do texto ficam sem itálico.
- **Números e fatos**: não invente. Ordens de grandeza conhecidas são bem-vindas ("um round trip
  entre continentes leva ~150 ms"). Exemplos de empresas só com fatos públicos e consolidados
  ("o Cassandra usa hashing consistente", "o etcd usa Raft"). Cenários hipotéticos são ótimos desde
  que fique claro que são hipotéticos ("imagine o checkout de uma loja na Black Friday").
- **Referências cruzadas**: escreva "capítulo 25" ou "(cap. 25)"; a build vira link.
- **Markdown**: compatível com pandoc e GitHub. Tabelas com `|`, código com três crases e a linguagem
  (`python`, `http`, `sql`, `text`). Sem HTML, sem notas de rodapé, sem imagens que não sejam diagramas
  do kit.

## Diagramas

Os diagramas usam o kit `diagramas/kit.mjs`: o mesmo roughjs, a mesma fonte manuscrita (Excalifont)
e a mesma paleta da lousa das aulas. Cada diagrama é um arquivo em `diagramas/fontes/NN-nome.mjs`
(o número do capítulo na frente; um segundo diagrama no mesmo capítulo vira `NNb-nome.mjs`).

```bash
node ebooks/system-design/diagramas/renderizar.mjs 25-hashing-consistente
node ebooks/system-design/diagramas/previa.mjs /tmp/previa.png 25-hashing-consistente
```

O primeiro gera `diagramas/25-hashing-consistente.svg`; o segundo gera um PNG para conferir. **Sempre
abra o PNG e confira** antes de dar o diagrama por pronto: nada sobreposto, nenhum texto saindo da
caixa ou do quadro, setas apontando para o lugar certo.

No capítulo, o diagrama entra como imagem, num parágrafo sozinho, dentro de "Aprofundando":

```markdown
![Legenda curta que explica o que olhar no diagrama.](../../diagramas/25-hashing-consistente.svg)
```

### Regras de desenho

- Quadro com no máximo **720 px de largura**; altura de 240 a 460 px. Margem de pelo menos 16 px.
- Texto com **16 a 20 px** (o padrão é 18). A Excalifont tem ~0,58 do tamanho por letra: com 18 px,
  uma caixa de 200 px comporta ~17 letras por linha. Quebre linhas com `\n`.
- Poucos elementos (até ~12). O diagrama mostra o mecanismo; o texto explica.
- Cores com significado: `azul` componentes principais, `verde` sucesso/dados ok, `vermelho` falha ou
  perigo, `laranja`/`amarelo` cache, fila ou atenção, `violeta` destaque especial, `cinza` coadjuvantes.
- Sempre chame `d.tela(...).titulo("título", "descrição")` com uma descrição útil para quem não enxerga
  o diagrama.

### API do kit (resumo)

| Chamada | O que faz |
|---|---|
| `d.tela(w, h)` / `d.titulo(t, desc)` | tamanho do quadro e texto acessível |
| `d.caixa(x, y, w, h, "texto", { tom, hachura, tam, tracejado, redondo })` | retângulo com texto centralizado; devolve âncoras |
| `d.etiqueta(cx, cy, "texto", { tom })` | caixa ajustada ao texto, centrada em (cx, cy) |
| `d.elipse(cx, cy, w, h, "texto", op)` / `d.circulo(cx, cy, diam, "texto", op)` | elipse e círculo |
| `d.cilindro(x, y, w, h, "texto", op)` | banco de dados |
| `d.nuvem(cx, cy, w, h, "texto", op)` | internet / nuvem |
| `d.pessoa(cx, cy, altura, { rotulo })` | bonequinho (usuário, cliente) |
| `d.grupo(x, y, w, h, "rótulo", op)` | região tracejada (datacenter, serviço) |
| `d.celulas(x, y, ["0","1",...], { destacadas: [i], tom, lado })` | fileira de células (bits, slots) |
| `d.texto(x, y, "texto", { tam, cor, ancora })` | texto solto; (x, y) é a linha de base |
| `d.textoCentro(cx, cy, "texto", op)` | texto centralizado num ponto |
| `d.seta(de, ate, { rotulo, curva, tracejado, duasPontas, desloc, posRotulo })` | seta entre dois pontos |
| `d.linha(pts, op)` / `d.curva(pts, op)` / `d.caminho("M...", op)` | traços livres |
| `d.xis(cx, cy, tam)` / `d.certo(cx, cy, tam)` | marca de falha / de sucesso |
| `d.marca(x, y, w, h, "amarelo")` | marca-texto (desenhe antes do texto) |

Opções comuns: `tom` (azul, verde, vermelho, laranja, amarelo, violeta, rosa, ciano, cinza) pinta traço e
preenchimento; `cor` só o traço; `preench: "none"` deixa vazio; `hachura: "solid"` preenche liso.
No texto, `*{palavra}` destaca em vermelho (ou na cor de `destaque`), `^{2}` sobrescrito, `_{i}` subscrito.

As formas devolvem âncoras para ligar setas: `topo`, `base`, `esq`, `dir`, `centro`, `cx`, `cy`, e as
funções `emCima(t)`, `emBaixo(t)`, `naEsq(t)`, `naDir(t)` (t de 0 a 1 ao longo da borda).
