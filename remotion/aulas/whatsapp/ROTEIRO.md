# Roteiro de gravação: projetando o WhatsApp (system design)

Material para a próxima aula da comunidade, no mesmo formato da Aula 1 (câmera + lousa no estilo
Excalidraw, 1920×1080). Está organizado para gravar no celular, capítulo por capítulo, e depois passar
pelo pipeline de `scripts/aulas/`.

**Fontes** (sintetizadas, não traduzidas):

- Hayk Simonyan, *System Design Interview: Design WhatsApp* (Substack, 07/10/2026).
- Ashish Pratap Singh, *Design a Chat Application like WhatsApp* (AlgoMaster, 10/11/2024).

Os dois artigos cobrem o mesmo problema com recortes diferentes: o primeiro é uma entrevista enxuta
(só 1:1 e texto, API REST e fila na frente do banco); o segundo é mais completo (WebSocket, presença,
tiques de entrega, grupos, mídia, ID da mensagem). Usamos o segundo como espinha e o primeiro para o
jeito de conduzir a entrevista e para comparar as contas. Os pontos em que os dois erram ou simplificam
demais estão marcados com **⚠ cuidado** e reunidos no fim.

**Duração alvo:** ~14 min gravados, ~11–12 min depois dos cortes.

**O fio da aula, numa frase:** um app de chat é um monte de conexões abertas que precisam saber onde o
outro usuário está conectado, e uma mensagem só pode ser confirmada depois que foi gravada em algum lugar.

---

## 0. Abertura (~0:40)

**Falar**

- Gancho: o WhatsApp passa de 2 bilhões de usuários e de 100 bilhões de mensagens por dia. Numa
  entrevista te dão 45 minutos para desenhar isso.
- O mapa da aula: requisitos → contas → por que WebSocket → arquitetura → o caminho de uma mensagem e
  os tiques → grupos → ID da mensagem e banco → o que acontece quando algo quebra.
- Promessa: no fim você consegue desenhar a arquitetura inteira de cabeça e defender cada caixa.

**Lousa** (`abertura`, cheia)

- Título "System Design" (cinza) e "Projetando o WhatsApp" grande, sublinhado azul, etiqueta amarela
  com o número da aula.
- Canto: dois balões de chat e os tiques ✓ ✓✓ ✓✓(azul) se desenhando.

---

## 1. Requisitos: pergunte antes de desenhar (~1:30)

**Falar**

- A primeira coisa numa entrevista é **cortar escopo**. Desenhar o WhatsApp inteiro em uma hora é
  impossível; o entrevistador quer ver você escolher.
- Funcionais (escolha e diga em voz alta o que fica de fora):
  - mensagem 1:1 em tempo real;
  - tiques: enviada, entregue, lida;
  - online / visto por último;
  - grupos (até um limite);
  - mídia (foto, vídeo, áudio);
  - notificação push quando a pessoa está offline;
  - histórico da conversa.
- Mostre que dá para começar menor: o primeiro artigo resolve só 1:1 e texto. Começar pequeno e crescer
  é uma resposta válida.
- Não funcionais:
  - **latência baixa**: a mensagem tem que parecer instantânea (na casa de 100–200 ms);
  - **alta disponibilidade**;
  - **não perder mensagem**: é o requisito que mais muda o desenho;
  - **ordem dentro da conversa**: as mensagens aparecem na ordem em que foram enviadas;
  - consistência eventual é aceitável para tiques e "visto por último".

**Lousa** (`requisitos`, meia)

- Duas colunas: "o que faz" e "como se comporta". Cada item entra com um `Check` verde; mídia e
  grupos com um asterisco "depois".
- `Marca` amarela sobre "não perder mensagem".

---

## 2. Contas de guardanapo (~2:00)

**Falar**

- Escolha **um** conjunto de premissas e siga com ele. Os dois artigos usam números diferentes e chegam
  na mesma ordem de grandeza; é isso que importa.
- Premissas: 1 bilhão de usuários, 500 milhões ativos por dia, 10 mensagens por pessoa por dia.
- Mensagens: 500 mi × 10 = **5 bilhões por dia**. Dividido por 86.400 s ≈ **58 mil por segundo** em
  média. No pico, uns 3× isso: **~175 mil por segundo**.
  - Comparação: o primeiro artigo parte de 10 bilhões por dia ≈ 116 mil/s, dobrando para ~230 mil/s em
    um ano. Mesma ordem de grandeza.
- Armazenamento: 1 KB por mensagem (texto + metadados, é generoso) → 5 bi × 1 KB = **5 TB por dia** →
  **~1,8 PB por ano**. Com 3 réplicas, **~5,5 PB**. Nenhuma máquina guarda isso: tem que particionar.
- Conexões: 50 milhões de pessoas conectadas no pico. Se cada servidor de chat segurar ~100 mil conexões,
  são **~500 servidores de chat**. (Curiosidade: em 2012 o WhatsApp contou que passou de 2 milhões de
  conexões num único servidor, com Erlang.)
- Heartbeat (o "tô vivo" que o app manda): 50 mi conexões a cada 30 s ≈ **1,7 milhão de escritas por
  segundo** no cache de presença. Guarde esse número para o capítulo 4.
- Banda das mensagens de texto: 175 mil/s × 1 KB ≈ **175 MB/s** (~1,4 Gbit/s). Quem pesa na banda é a
  mídia, e por isso ela sai do caminho dos servidores de chat (CDN).

**⚠ cuidado:** o segundo artigo usa 50 milhões de conexões no pico e logo depois calcula a banda com
10 milhões, a 10 KB/s cada (100 GB/s). Para texto, 10 KB/s por conexão é exagero de umas 100×. Não
repita essa conta.

**Lousa** (`contas`, cheia)

- Uma conta por linha, letra a letra: `500 mi × 10 = 5 bi/dia`, `÷ 86.400 ≈ 58 mil/s`, `pico ×3 ≈ 175 mil/s`.
- Ao lado, uma pilha de discos: `5 TB/dia → 1,8 PB/ano → ×3 = 5,5 PB`.
- Embaixo, 5 retângulos pequenos com "…" e `≈ 500 servidores`.
- `Etiqueta` vermelha em `1,7 mi/s` (heartbeats), para voltar nela depois.

---

## 3. Por que WebSocket (~1:30)

**Falar**

- O problema: o servidor precisa **empurrar** a mensagem para o celular de quem recebe. HTTP comum só
  responde quando o cliente pergunta.
- **Polling**: o app pergunta a cada X segundos "tem coisa nova?". Quase sempre a resposta é "não".
  Desperdício de bateria, rede e servidor; e a mensagem chega com até X segundos de atraso.
- **Long polling**: o app pergunta e o servidor segura a resposta até ter novidade ou estourar o tempo.
  Melhora, mas cada mensagem fecha a requisição e o app tem que abrir outra; timeout longo atrasa,
  timeout curto vira polling de novo.
- **WebSocket**: abre uma conexão uma vez (começa como HTTP e faz *upgrade*) e ela fica aberta nos dois
  sentidos. O servidor manda quando quiser, sem cabeçalho HTTP a cada mensagem.
- Detalhe do mundo real: no celular, quando o app vai para segundo plano o sistema derruba a conexão. É
  aí que entra a notificação push (FCM no Android, APNs no iPhone).

**Lousa** (`websocket`, cheia)

- Três diagramas de sequência lado a lado (cliente à esquerda, servidor à direita, tempo descendo):
  - polling: várias setas indo e voltando, as respostas com `Xis` cinza "nada", uma só com ✓;
  - long polling: seta que vai, linha tracejada longa esperando, resposta, e seta nova;
  - WebSocket: uma seta de "upgrade" e depois uma faixa grossa contínua com setas nos dois sentidos.
- `Check` verde embaixo do WebSocket.

---

## 4. A arquitetura, caixa por caixa (~2:30)

Desenhar **aos poucos**, uma caixa por vez, sempre dizendo por que ela existe.

**Falar**

1. **App** (iOS/Android) → **balanceador de carga** → **servidores de chat**. Os servidores de chat têm
   estado: cada um segura as conexões WebSocket dos seus usuários.
2. **Servidores de API** (sem estado) ao lado, para o que é requisição comum: login, perfil, buscar
   histórico, criar grupo. O primeiro artigo descreve essa parte como REST (`POST /messages`,
   `GET /messages`…); na prática, o envio em tempo real vai pelo WebSocket e o REST fica para o resto.
3. **Cache de conexões** (Redis): `usuário → em qual servidor de chat ele está` + `última atividade`.
   É o que responde "onde está o B?" e "o B está online?".
   - Presença: o app manda heartbeat; se a última atividade é recente, mostra online; senão, "visto
     por último às…".
4. **Fila** (Kafka): o servidor de chat joga a mensagem na fila e segue a vida. Um **serviço de
   armazenamento** lê a fila e grava no **banco de mensagens** (Cassandra, feito para muita escrita).
   A fila absorve os picos e desacopla o tempo real da gravação.
5. **Serviço de notificação**: se o destinatário está offline, a mensagem vai (pela fila) para ele, que
   chama FCM/APNs.
6. **Serviço de grupos** + **banco de grupos** (PostgreSQL): quem está em cada grupo, quem é admin.
   Dados de usuário e grupo são relacionais e pequenos; mensagens são enormes e só crescem, por isso
   bancos diferentes.
7. **Mídia**: o arquivo **não passa** pelo servidor de chat. O app envia o arquivo para o
   armazenamento de objetos (S3 ou parecido), recebe um link e manda **só o link** na mensagem. Quem
   recebe baixa pela **CDN**, do ponto mais perto.

**⚠ cuidado (presença):** o segundo artigo sugere marcar offline quem ficou 3 s sem heartbeat. Para
isso o app teria que mandar heartbeat a cada 1–2 s: com 50 mi conexões são ~17 milhões de escritas por
segundo só de "tô vivo", e bateria indo embora. Use algo como heartbeat a cada 30 s e offline depois de
~60 s; quando a conexão cai de verdade, o servidor já sabe na hora e atualiza.

**⚠ cuidado (sessão persistente):** o segundo artigo fala em prender o usuário no mesmo servidor por
hash de IP. Uma conexão WebSocket já é uma conexão só, então ela naturalmente fica no mesmo servidor
enquanto está aberta. Quando cai e reconecta, **tanto faz** cair em outro servidor: o cache de conexões
é atualizado. E no celular o IP muda o tempo todo (Wi-Fi ↔ 4G, CGNAT), então hash de IP prende mal.
A alternativa que o artigo cita (perguntar a um serviço de descoberta qual servidor usar e conectar
direto) é válida.

**⚠ cuidado (CDN):** o segundo artigo diz que o app sobe o arquivo "direto para a CDN, perto do
destinatário". O mais comum é subir para o armazenamento de objetos (por uma URL pré-assinada) e a CDN
servir os downloads.

**Lousa** (`arquitetura`, cheia; a câmera vai abrindo o quadro conforme as caixas entram)

- Fluxo da esquerda para a direita: `App` → `Balanceador` → três `Servidor de chat` empilhados.
- Acima: `Cache de conexões` (vermelho claro), ligado aos servidores por linha tracejada.
- À direita: `Fila` (cilindro deitado, laranja) → `Armazenamento` → `Cassandra` (pilha de discos, azul).
- Abaixo da fila: `Notificação` → ícones `FCM` e `APNs`.
- Embaixo: `Grupos` → `PostgreSQL`; `Mídia` → `S3` e uma nuvem `CDN` com seta direta do `App`.
- Cada caixa nova entra com `Caixa` + `Seta`; as que já estavam ficam em cinza para o foco ficar na nova.

---

## 5. O caminho de uma mensagem e os tiques (~2:00)

**Falar**

- A manda "oi" para B.
  1. Vai pelo WebSocket de A até o **servidor A**.
  2. Servidor A grava a mensagem (fila durável) e só então responde para A: **✓ enviada**.
     Ponto-chave: o ✓ significa "o servidor guardou", não "chegou no B". Se responder antes de gravar e
     o servidor cair, a mensagem some.
  3. Servidor A pergunta ao cache: "onde está o B?".
     - **B online** no servidor B → A repassa para B → B entrega pelo WebSocket.
     - **B offline** → a mensagem fica guardada como pendente e vai uma notificação push.
  4. O celular de B confirma que recebeu → servidor B avisa servidor A → **✓✓ entregue**.
  5. B abre a conversa → confirmação de leitura → **✓✓ azul, lida**.
- **Quando B volta a ficar online**: o app pede "tudo depois da última mensagem que eu recebi" e só aí
  envia o ✓✓ das que chegaram. Notificação push é um aviso, não a entrega.
- **Quando A está sem internet**: a mensagem fica no relógio (pendente) no celular de A até reconectar.
- **Reenvio sem duplicar**: o app gera o ID da mensagem antes de enviar. Se a rede falhar e ele
  reenviar, o servidor reconhece o mesmo ID e não grava duas vezes.
- Curiosidade sobre o WhatsApp de verdade: as mensagens são criptografadas de ponta a ponta (protocolo
  Signal), então o servidor só vê conteúdo cifrado, e ele não guarda o histórico para sempre: apaga
  depois de entregar (o backup fica no iCloud/Google Drive do usuário). Os dois artigos desenham um
  sistema que guarda o histórico no servidor, como Telegram ou Messenger. Os dois são desenhos válidos;
  vale dizer isso na entrevista.

**⚠ cuidado:** no segundo artigo, quando B está offline o servidor só manda a notificação. Faltou dizer
que a mensagem precisa ficar guardada para B buscar quando reconectar; sem isso, ela se perde.

**Lousa** (`caminho`, cheia)

- `A` à esquerda, `B` à direita, `Servidor A` e `Servidor B` no meio, `Cache` em cima, `Fila` embaixo.
- As setas numeradas ①…⑤ vão aparecendo junto com a fala.
- Embaixo, um balão "oi" que troca de tique: 🕓 → ✓ → ✓✓ → ✓✓ azul, cada troca alinhada com o passo
  correspondente.
- Para o caso offline: `Xis` vermelho sobre B, seta para `Notificação` e um retângulo "pendentes".

---

## 6. Grupos (~1:00)

**Falar**

- Mesma coisa, com um passo a mais: o servidor A pergunta ao **serviço de grupos** quem está no grupo,
  depois ao cache onde cada um está, e entrega um por um (direto, repassando a outro servidor ou por
  push).
- Isso é *fan-out*: uma mensagem num grupo de 1.024 pessoas vira 1.024 entregas. Por isso todo app limita
  o tamanho do grupo (o WhatsApp está em 1.024).
- A mensagem é gravada **uma vez**; o que multiplica são as entregas e os tiques (cada membro tem o seu
  "entregue" e "lido", e A vê quem leu).

**Lousa** (`grupos`, meia)

- Um balão saindo de A e se abrindo em leque para 8 bonequinhos; `Texto` "× 1.024".
- Embaixo, a conta `1 mensagem → 1.024 entregas` com `Marca` amarela.

---

## 7. O ID da mensagem e o banco (~1:30)

**Falar**

- Por que o ID importa: queremos as mensagens em ordem e o "carregar mais" (as 50 anteriores a esta)
  barato.
- Ideia: **ID que começa pelo horário**. Ordenar pelo ID já é ordenar pelo tempo.
- Formato tipo Snowflake (o do Twitter), 64 bits:
  - 41 bits de milissegundos (dá ~69 anos);
  - 10 bits de qual máquina gerou (até 1.024 máquinas);
  - 12 bits de sequência (até 4.096 IDs por milissegundo por máquina).
- **⚠ cuidado:** o segundo artigo dá como exemplo data e hora + uma sequência `001`. Sem a parte "qual
  máquina", dois servidores no mesmo milissegundo geram o mesmo ID.
- No banco (Cassandra), a chave é o que decide tudo:
  - **partição = id da conversa**, **ordem = id da mensagem (decrescente)**;
  - abrir uma conversa e "carregar mais" vira uma leitura contínua dentro de uma partição só.
- **⚠ cuidado:** o segundo artigo sugere particionar mensagens pelo `message_id`. Aí as mensagens de uma
  mesma conversa ficam espalhadas por máquinas diferentes e abrir uma conversa vira consultar todas.
  O primeiro artigo particiona por `userId`, o que funciona para "minhas mensagens", mas numa conversa
  1:1 obriga a gravar a mensagem duas vezes ou juntar duas partições. Conversa é a unidade natural.
- Grupos muito ativos: a partição cresce sem parar; divida por período (conversa + mês).
- Para achar a máquina certa: **hash consistente** (o próprio Cassandra faz) ou um **serviço de
  metadados** com o mapa de partições, as duas opções do primeiro artigo.

**Lousa** (`ids`, cheia)

- Uma régua de 64 quadradinhos dividida em três blocos coloridos: `tempo (41)` azul, `máquina (10)`
  verde, `sequência (12)` laranja.
- Embaixo, uma tabela: `conversa_id | message_id | de | texto`, com chaves desenhadas agrupando as
  linhas da mesma conversa e a seta "carregar mais" subindo.
- Ao lado, o desenho errado (mensagens de uma conversa espalhadas em 4 discos) com `Xis`.

---

## 8. Quando algo quebra, e quanto custa (~1:00)

**Falar**

- **Servidor de chat cai**: todos os clientes dele perdem a conexão. O balanceador percebe pelo health
  check e para de mandar gente para lá. Os apps reconectam em outro servidor e o cache é atualizado.
  - Reconectar com espera crescente e um pouco de aleatoriedade: se 100 mil apps reconectarem no mesmo
    segundo, derrubam o próximo servidor.
  - Mensagem não se perde porque o ✓ só foi dado depois de gravar (capítulo 5).
- **Custo de armazenamento**:
  - comprimir mídia;
  - mensagens antigas para armazenamento frio e barato (tipo Glacier): quase ninguém rola a conversa
    até 2019;
  - não guardar o mesmo arquivo duas vezes (deduplicar pelo hash do arquivo);
  - metadados (tipo, tamanho, data) num banco separado do arquivo.

**Lousa** (`falhas`, meia)

- Três servidores; o do meio leva um `Xis` vermelho, os bonequinhos dele saltam com setas curvas para
  os outros dois.
- Uma escadinha `1s, 2s, 4s, 8s…` com "+ aleatório".
- Lista curta de custo com ícones: compressão, gelo (frio), dois arquivos iguais → um.

---

## 9. Encerramento (~0:30)

**Falar**

- Volta para o desenho completo e recapitula em uma frase por caixa.
- O que ficou de fora e dá aula própria: criptografia de ponta a ponta, vários aparelhos na mesma conta,
  chamadas de voz e vídeo.
- Chamada para a comunidade.

**Lousa**

- A câmera sai do zoom e mostra a página `arquitetura` inteira, com o caminho da mensagem destacado
  em azul por cima.

---

## Cola das contas (para ter do lado na gravação)

| Conta | Resultado |
|---|---|
| 500 mi ativos × 10 mensagens | 5 bilhões por dia |
| 5 bi ÷ 86.400 s | ~58 mil por segundo |
| pico (×3) | ~175 mil por segundo |
| 5 bi × 1 KB | 5 TB por dia |
| 5 TB × 365 | ~1,8 PB por ano (~5,5 PB com 3 réplicas) |
| 50 mi conexões ÷ 100 mil por servidor | ~500 servidores de chat |
| 50 mi heartbeats a cada 30 s | ~1,7 mi escritas por segundo |
| 50 mi heartbeats a cada 3 s | ~17 mi escritas por segundo (por isso não) |
| 175 mil/s × 1 KB | ~175 MB/s de texto |
| Snowflake: 41 + 10 + 12 bits (+1 de sinal) | ~69 anos, 1.024 máquinas, 4.096 IDs/ms |
| artigo 1: 10 bi/dia ÷ 86.400 | ~116 mil/s (×2 em um ano ≈ 230 mil/s) |

## Resumo dos ⚠ cuidados

1. Banda de 10 KB/s por conexão, calculada com 10 mi conexões quando o pico era 50 mi (artigo 2).
2. Offline depois de 3 s sem heartbeat (artigo 2): caro demais em escrita e bateria.
3. Sessão persistente por hash de IP (artigo 2): desnecessária para WebSocket e ruim no celular.
4. Upload "direto para a CDN" (artigo 2): normalmente é armazenamento de objetos + CDN para download.
5. Usuário offline só recebe push (artigo 2): a mensagem tem que ficar guardada para a sincronização.
6. ID com data + sequência sem identificar a máquina (artigo 2): colide entre servidores.
7. Mensagens particionadas por `message_id` (artigo 2) ou por `userId` (artigo 1): use a conversa.
8. Os dois desenham histórico guardado no servidor; o WhatsApp real apaga depois de entregar e usa
   criptografia de ponta a ponta.

## Dicas para a gravação (aprendidas na Aula 1)

- Grave **um clipe por capítulo** e deixe 2–3 s de silêncio antes e depois: os cortes e os respiros
  entre capítulos ficam mais fáceis no `cortes.json`.
- Fale os números devagar e por extenso ("cinquenta e oito mil por segundo"): o Whisper pula fala
  rápida, e a lousa é sincronizada pela palavra.
- Se errar, pare, respire e repita a frase inteira; o tropeço sai no corte.
- As páginas da lousa (`abertura`, `requisitos`, `contas`, `websocket`, `arquitetura`, `caminho`,
  `grupos`, `ids`, `falhas`) viram o `paginas.ts` desta aula; as marcadas como "meia" ficam na tela
  dividida com a câmera.
