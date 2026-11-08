# Reels: System Design do WhatsApp (série em 3 partes)

Três Reels explicativos que ensinam de verdade e terminam sempre no ebook
**System Design do WhatsApp** (R$ 15, link na bio). Cada parte se sustenta sozinha, mas puxa a próxima.

| Parte | Tema | Gancho | Duração |
|---|---|---|---|
| 1 | Requisitos, contas e WebSocket | "Projete o WhatsApp em 45 minutos" | ~85 s |
| 2 | O caminho de uma mensagem e os tiques | "O primeiro tique não quer dizer que chegou" | ~90 s |
| 3 | Grupos, banco e o que acontece quando quebra | "Uma mensagem, 1.024 entregas" | ~90 s |

**Telas prontas:** `npm run reels:whatsapp` gera as imagens verticais (9:16, em 2160×3840 para aguentar zoom) de cada cena em
`saida/materiais/reels/`, com os mesmos diagramas do ebook. Os nomes dos arquivos batem com a coluna "Tela"
dos roteiros (ex.: `p1-2-contas.png`).

**Vídeos prontos (sem narração):** `npm run render:reels-whatsapp` gera os três MP4 em
`saida/materiais/reels/`. Neles, a fala deste roteiro virou legenda na tela (versão mais curta, no ritmo de
leitura) e os diagramas se desenham sozinhos. Dá para postar assim, com uma música do Instagram, ou gravar sua
voz por cima. Para mudar textos e tempos, edite `remotion/reels/whatsapp/roteiro.ts`.

**Como ler o roteiro:** **Fala** é o que você diz para a câmera (ou em off). **Tela** é o que aparece:
você em tela cheia, a imagem pronta, ou você pequena num canto com a imagem atrás. **Texto** é a frase
grande na tela, que ajuda quem assiste sem som.

---

## A chamada (CTA), igual nas três partes

A chamada é sempre a mesma, para o público decorar:

> "Isso é só um pedaço. O guia completo tem **20 páginas**, todos os diagramas, as contas prontas, os erros que
> reprovam e as perguntas que o entrevistador faz, com resposta. **System Design do WhatsApp, R$ 15, link na
> bio.**"

Na tela, durante a chamada: as páginas do PDF passando (grave a tela rolando o PDF no celular) e depois
`cta.png` parada por 2 s.

---

## Parte 1: projete o WhatsApp em 45 minutos

**Objetivo:** mostrar que existe um método e que as contas não são bicho de sete cabeças.

| Tempo | Fala | Tela | Texto |
|---|---|---|---|
| 0–3 s | "Se numa entrevista te pedirem: projete o WhatsApp. Você saberia por onde começar?" | você, close | **"Projete o WhatsApp."** |
| 3–8 s | "Essa é uma das perguntas mais comuns de system design. E dá pra responder em 45 minutos, se você seguir a ordem certa. Vou te mostrar o começo." | `p1-1-roteiro.png` | **o roteiro de 45 min** |
| 8–20 s | "Primeiro passo: não desenhe nada ainda. Pergunte. Só conversa entre duas pessoas ou grupos também? Só texto ou foto e vídeo? Precisa dos tiques de enviada, entregue e lida? E diga em voz alta o que fica de fora, tipo chamada de vídeo. O entrevistador quer ver você decidir." | você, com a lista entrando item a item ao lado | **1. pergunte antes de desenhar** |
| 20–24 s | "E tem um requisito que muda o desenho inteiro: não pode perder mensagem. Guarda esse." | você, close | **não pode perder mensagem** |
| 24–45 s | "Segundo passo: as contas. Quinhentos milhões de pessoas usando por dia, dez mensagens cada: cinco bilhões de mensagens por dia. Divide por oitenta e seis mil e quatrocentos segundos: umas cinquenta e oito mil por segundo. No horário de pico, três vezes isso: cento e setenta e cinco mil por segundo. Se cada mensagem tem um kilobyte, são cinco terabytes por dia. Quase dois petabytes por ano." | `p1-2-contas.png`, com você pequena no canto apontando cada linha | **5 bi/dia → 175 mil/s no pico** |
| 45–52 s | "E o que esses números decidem? Que nenhuma máquina guarda isso sozinha: o banco vai ter que ser dividido. E que vai precisar de uma fila na frente dele pra aguentar o pico." | `p1-2-contas.png` (destaque embaixo) | **número bom é número que decide** |
| 52–72 s | "Terceiro: como a mensagem chega no celular de quem recebe? Se o app ficar perguntando 'tem mensagem nova?' a cada poucos segundos, isso é polling: quase sempre a resposta é não, e é bateria e servidor jogados fora. O long polling melhora, mas reabre a conexão a cada mensagem. A resposta é o WebSocket: uma conexão que fica aberta, e o servidor manda a mensagem na hora que ela chega." | `p1-3-websocket.png` | **polling ✗ · long polling · WebSocket ✓** |
| 72–75 s | "Com cinquenta milhões de pessoas conectadas no pico, são uns quinhentos servidores só segurando conexões." | você, close | **50 mi conexões ≈ 500 servidores** |
| 75–85 s | CTA (texto acima) + "Na parte dois, eu te mostro o caminho de uma mensagem e o que o tique quer dizer de verdade." | PDF rolando → `cta.png` | **System Design do WhatsApp · R$ 15 · link na bio** |

**Legenda do post**

> "Projete o WhatsApp" é das perguntas mais comuns em entrevista de system design. 📱
>
> Nesta parte 1: o que perguntar antes de desenhar, as contas (5 bilhões de mensagens por dia → 175 mil por
> segundo no pico) e por que o WhatsApp usa WebSocket em vez de ficar perguntando ao servidor.
>
> 📘 O guia completo, com 20 páginas, todos os diagramas, as contas prontas e as perguntas do entrevistador com
> resposta: **System Design do WhatsApp, R$ 15, link na bio.**
>
> Salva para estudar e manda para quem está se preparando para entrevista. A parte 2 sai em breve.
>
> #systemdesign #entrevistadeemprego #programacao #desenvolvimentodesoftware #engenhariadesoftware #backend #tecnologia #dev

**Comentário fixado:** "📘 Guia completo System Design do WhatsApp, R$ 15: link na bio. Qual parte você quer que eu
explique melhor?"

---

## Parte 2: o primeiro tique não quer dizer que chegou

**Objetivo:** a parte mais "uau" da série. Explicar o caminho de uma mensagem com os tiques, que todo mundo usa
e ninguém pensa como funcionam.

| Tempo | Fala | Tela | Texto |
|---|---|---|---|
| 0–3 s | "Você sabe o que o primeiro tique do WhatsApp quer dizer? Não é que a mensagem chegou." | você, close, segurando o celular | **✓ ≠ chegou** |
| 3–8 s | "Pra entender, vamos seguir uma mensagem do seu celular até o da outra pessoa. Parte dois da série sobre o system design do WhatsApp." | `p2-1-arquitetura.png` | **parte 2: o caminho de uma mensagem** |
| 8–22 s | "Quando você abre o app, ele conecta num servidor de chat e a conexão fica aberta. Tem centenas desses servidores. Então o sistema precisa de um lugar que diga em qual servidor cada pessoa está: é um cache em memória, tipo o Redis. Guarda isso: o cache sabe onde cada um está." | `p2-1-arquitetura.png` (zoom no app → servidores → cache) | **cache: onde cada um está** |
| 22–36 s | "Agora a Ana manda 'oi' pro Bruno. A mensagem vai até o servidor da Ana. E aqui está o pulo do gato: antes de qualquer coisa, o servidor grava a mensagem numa fila. Só depois de gravar ele responde pra Ana. E é aí que aparece o primeiro tique." | `p2-2-caminho.png` (passos 1 a 3) | **✓ = o servidor guardou** |
| 36–44 s | "Por quê? Se o servidor respondesse antes de gravar e caísse logo depois, a mensagem ia sumir e ninguém ia saber. O tique significa: o sistema guardou a sua mensagem." | você, close | **responder antes de gravar = mensagem perdida** |
| 44–58 s | "Depois o servidor da Ana pergunta pro cache: onde está o Bruno? Está no servidor B. Ele repassa a mensagem pra lá, o servidor B entrega pro celular do Bruno, o celular confirma que recebeu, e essa confirmação volta até a Ana. Dois tiques: entregue." | `p2-2-caminho.png` (passos 4 a 8) | **✓✓ = chegou no celular** |
| 58–64 s | "Quando o Bruno abre a conversa, o celular dele manda mais uma confirmação: os tiques ficam azuis." | `p2-3-tiques.png` | **✓✓ azul = leu** |
| 64–78 s | "E se o Bruno estiver offline? A mensagem já está gravada, então ela fica na lista de pendentes dele e vai uma notificação push. Mas atenção: o push é só um aviso, ele pode se perder. Quando o Bruno volta, o app pede tudo que chegou desde a última mensagem que ele recebeu. É por isso que a Ana fica só com um tique até o Bruno aparecer." | `p2-3-tiques.png` → você | **push é aviso, não é entrega** |
| 78–90 s | CTA + "Na parte três: grupos, como guardar petabytes de mensagem e o que acontece quando um servidor cai." | PDF rolando → `cta.png` | **System Design do WhatsApp · R$ 15 · link na bio** |

**Legenda do post**

> O primeiro tique do WhatsApp não quer dizer que a mensagem chegou. ✓
>
> ✓ = o servidor gravou a mensagem
> ✓✓ = chegou no celular da pessoa
> ✓✓ azul = ela abriu a conversa
>
> Nesta parte 2: o caminho completo de uma mensagem, por que o servidor só responde depois de gravar e o que
> acontece quando a outra pessoa está offline.
>
> 📘 O guia completo, com o fluxo passo a passo, o protocolo, os diagramas e as perguntas do entrevistador:
> **System Design do WhatsApp, R$ 15, link na bio.**
>
> #systemdesign #whatsapp #programacao #backend #entrevistadeemprego #engenhariadesoftware #dev #tecnologia

**Comentário fixado:** "📘 Guia completo, R$ 15: link na bio. Você sabia o que era o primeiro tique? Conta aqui 👇"

---

## Parte 3: uma mensagem, 1.024 entregas

**Objetivo:** mostrar a profundidade (grupos, banco, falhas) e fechar com o argumento mais forte para comprar.

| Tempo | Fala | Tela | Texto |
|---|---|---|---|
| 0–3 s | "Num grupo de mil e vinte e quatro pessoas, cada mensagem que você manda vira mil e vinte e quatro entregas." | você, close | **1 mensagem → 1.024 entregas** |
| 3–6 s | "Parte três, a última, do system design do WhatsApp: o que acontece quando o sistema fica gigante." | `p3-1-grupos.png` | **parte 3: escala** |
| 6–22 s | "Grupo funciona igual à conversa entre duas pessoas, com um passo a mais. O servidor grava a mensagem uma vez só, pergunta quem está no grupo e entrega pra cada membro: quem está online recebe na hora, quem está offline ganha uma notificação. Esse 'um vira muitos' tem nome: fan-out. E é por isso que todo app limita o tamanho do grupo. No WhatsApp, o limite é mil e vinte e quatro." | `p3-1-grupos.png` | **fan-out: por isso existe limite** |
| 22–40 s | "Agora o banco. Lembra das contas da parte um? Quase dois petabytes por ano. Isso tem que ser dividido em muitas máquinas. A pergunta é: dividir por quê? Se você dividir pelo id da mensagem, uma mesma conversa fica espalhada por todas as máquinas, e abrir uma conversa vira perguntar pra todo mundo. O certo é dividir pela conversa: cada conversa fica inteira num lugar, já em ordem." | `p3-2-banco.png` (parte de cima) | **divida pela conversa, não pela mensagem** |
| 40–52 s | "E o id de cada mensagem começa pelo horário. Assim, ordenar pelo id já é ordenar pelo tempo. Junto vai qual máquina gerou e um contador, pra dois servidores nunca criarem o mesmo id no mesmo milissegundo." | `p3-2-banco.png` (parte de baixo) | **id = tempo + máquina + sequência** |
| 52–68 s | "E se um servidor cair? Todo mundo conectado nele perde a conexão e reconecta em outro servidor. Mas não pode ser todo mundo ao mesmo tempo, senão derruba o próximo. Então cada app espera um pouco mais a cada tentativa, com um pouco de sorteio. E nenhuma mensagem se perde, porque lembra da parte dois: o tique só aparece depois de gravar." | `p3-3-falhas.png` | **espera crescente + sorteio** |
| 68–78 s | "E um detalhe que quase ninguém conta: o WhatsApp de verdade tem criptografia de ponta a ponta e apaga a mensagem do servidor depois que ela é entregue. O seu histórico mora no seu celular. Falar isso no fim da entrevista impressiona." | você, close | **o WhatsApp real apaga depois de entregar** |
| 78–92 s | "Essa foi a série inteira em três vídeos. No guia está tudo com calma: 14 capítulos, todos os diagramas desenhados pra você reproduzir no quadro, as contas prontas, os oito erros que mais reprovam, as perguntas do entrevistador com resposta e uma cola de uma página pra revisar antes da entrevista. **System Design do WhatsApp, R$ 15, link na bio.**" | PDF rolando devagar (sumário → diagramas → cola) → `cta.png` | **System Design do WhatsApp · R$ 15 · link na bio** |

**Legenda do post**

> Num grupo de 1.024 pessoas, cada mensagem vira 1.024 entregas. 🤯
>
> Nesta parte 3 (a última): como funcionam os grupos, como guardar petabytes de mensagens sem travar e o que
> acontece quando um servidor cai. E um bônus: o que o WhatsApp de verdade faz diferente.
>
> 📘 Tudo isso com calma, em 20 páginas: 14 capítulos, todos os diagramas, as contas prontas, os erros que
> reprovam, as perguntas do entrevistador com resposta e uma cola de uma página.
> **System Design do WhatsApp, R$ 15, link na bio.**
>
> Perdeu as outras partes? Estão no meu perfil.
>
> #systemdesign #whatsapp #programacao #backend #entrevistadeemprego #engenhariadesoftware #dev #tecnologia

**Comentário fixado:** "📘 Guia completo, R$ 15: link na bio. Qual app você quer que eu desmonte na próxima série?"

---

## Dicas de gravação e edição

- **Os 3 primeiros segundos decidem tudo.** Comece já falando a frase do gancho, sem "oi, gente". O texto do
  gancho entra no primeiro quadro.
- **Legenda queimada no vídeo** (CapCut ou o próprio Instagram): muita gente assiste sem som.
- **Área segura:** as telas prontas deixam livres o topo e a parte de baixo, onde ficam os botões e a legenda
  do Instagram. Se colocar texto seu por cima, mantenha entre o terço de cima e a altura dos botões.
- **Zoom nas imagens:** para os diagramas largos (arquitetura e caminho da mensagem), dê zoom lento na parte que
  você está explicando. É isso que deixa o vídeo "explicativo" e não um slide parado.
- **Fale os números por extenso e devagar.** Eles são o que mais prende a atenção nesta série.
- **Publique com 2 ou 3 dias de intervalo** e coloque as três partes num destaque fixo no perfil ("System
  Design") com o link do ebook.
- **Capa de cada Reel:** o texto do gancho grande, com "parte 1/3", "2/3", "3/3" no canto, para o perfil ficar
  organizado em sequência.
