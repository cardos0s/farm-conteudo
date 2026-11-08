# Narração dos Reels: System Design do WhatsApp

Texto para gravar por cima dos três MP4 (`saida/materiais/reels/system-design-whatsapp-parte-N.mp4`).
Cada fala começa no **tempo** indicado, que é quando a legenda correspondente aparece na tela, e cabe no
tempo até a próxima legenda num ritmo animado de Reels (~2,8 palavras por segundo).

**Como gravar:** importe o vídeo no CapCut (ou no editor do Instagram), dê play e use **Narração**. As
legendas na tela funcionam como teleprompter: comece cada frase quando a legenda dela aparecer. A narração
não repete a legenda palavra por palavra (às vezes é mais curta, para caber no tempo), então fale olhando
para este texto. Os números estão escritos por extenso do jeito que se fala.

Se alguma frase ficar apertada, acelere a narração para 1,1× no editor; se sobrar tempo, tudo bem: o
vídeo segue no ritmo das legendas.

---

## Parte 1 · Projete o WhatsApp (1:21)

| Tempo | Narração |
|---|---|
| 0:00 | Numa entrevista te pedem: projete o WhatsApp. Por onde você começa? |
| 0:04,5 | É uma das perguntas mais comuns de system design. |
| 0:07,7 | Dá pra responder em quarenta e cinco minutos, nessa ordem. |
| 0:12,6 | Primeiro: não desenhe nada. Feche o escopo. |
| 0:15,5 | O entrevistador quer ver você decidir o que entra e o que sai. |
| 0:20,3 | E guarde esse requisito: não pode perder mensagem. |
| 0:24,9 | Quinhentos milhões de pessoas, dez mensagens cada: cinco bilhões por dia. |
| 0:28,8 | Por segundo, uns cinquenta e oito mil. |
| 0:31,8 | No pico, o triplo: cento e setenta e cinco mil. |
| 0:35,5 | Um kilobyte cada: cinco terabytes por dia, quase dois petabytes por ano. |
| 0:39,7 | Cinquenta milhões conectados: uns quinhentos servidores de chat. |
| 0:43,5 | Ou seja: banco dividido, e uma fila na frente pra aguentar o pico. |
| 0:48,8 | Polling: o app pergunta toda hora se tem mensagem. Quase sempre, não. |
| 0:53,1 | Long polling: o servidor segura a resposta, mas reabre a conexão a cada mensagem. |
| 0:57,6 | WebSocket: uma conexão aberta, e o servidor manda na hora. |
| 1:01,6 | É esse que o chat usa. |
| 1:05,4 | E isso é só o começo. |
| 1:07,5 | O guia completo tem vinte páginas: diagramas, contas e perguntas com resposta. |
| 1:11,7 | **System Design do WhatsApp, quinze reais, link na bio.** |
| 1:15,5 | Na parte dois: o caminho de uma mensagem e o que o tique quer dizer. |

## Parte 2 · O primeiro tique não quer dizer que chegou (1:30)

| Tempo | Narração |
|---|---|
| 0:00 | O primeiro tique do WhatsApp não quer dizer que chegou. Vem comigo seguir uma mensagem. |
| 0:06,4 | Quando você abre o app, ele conecta num servidor de chat e fica conectado. |
| 0:11,5 | São centenas deles. Um cache guarda onde cada pessoa está. |
| 0:15,8 | Por trás tem fila, banco de mensagens, notificação e mídia. |
| 0:20,3 | Um: a mensagem vai até o servidor de A. |
| 0:24,3 | Dois: antes de tudo, o servidor grava a mensagem numa fila. |
| 0:28,3 | Três: só depois de gravar ele responde. É aí que aparece o primeiro tique. |
| 0:33,1 | Se respondesse antes e caísse, a mensagem sumia. O tique quer dizer: guardei. |
| 0:37,4 | Depois, o cache diz onde está B, e o servidor de B entrega no celular dele. |
| 0:43,0 | O celular de B confirma, isso volta pra A, e aparecem dois tiques: entregue. |
| 0:48,9 | Relógio: a mensagem ainda tá só no seu celular. |
| 0:52,4 | Um tique: o servidor gravou. |
| 0:54,5 | Dois tiques: chegou no celular. |
| 0:57,1 | Dois tiques azuis: a pessoa leu. |
| 1:00,3 | E se B estiver offline? A mensagem fica pendente, esperando por ele. |
| 1:04,6 | Vai uma notificação, mas push é só um aviso. Pode se perder. |
| 1:08,8 | Quando B volta, o app busca tudo que chegou. |
| 1:12,8 | Por isso fica um tique só até ele aparecer. |
| 1:17,4 | O fluxo completo e as perguntas do entrevistador estão no guia. |
| 1:21,7 | **System Design do WhatsApp, quinze reais, link na bio.** |
| 1:25,4 | Na parte três: grupos, petabytes e servidor caindo. |

## Parte 3 · Uma mensagem, 1.024 entregas (1:23)

| Tempo | Narração |
|---|---|
| 0:00 | Num grupo cheio do WhatsApp, cada mensagem vira mil e vinte e quatro entregas. |
| 0:05,4 | O servidor grava a mensagem uma vez e busca quem tá no grupo. |
| 0:09,6 | Quem tá online recebe na hora. Quem tá offline ganha um push. |
| 0:14,4 | Isso é o fan-out. E é por isso que todo grupo tem limite. |
| 0:20,3 | Quase dois petabytes por ano: o banco precisa ser dividido. |
| 0:24,6 | Dividir pelo id da mensagem espalha a conversa por todas as máquinas. |
| 0:29,1 | O certo é dividir pela conversa: cada uma inteira num lugar. |
| 0:34,0 | O id começa pelo horário, então já sai em ordem. |
| 0:38,0 | Depois, qual máquina gerou e um contador. |
| 0:40,9 | Assim dois servidores nunca geram o mesmo id. |
| 0:45,4 | Servidor caiu? Todo mundo reconecta em outro. |
| 0:48,3 | Mas não todos de uma vez: cada app espera um pouco mais a cada tentativa. |
| 0:53,7 | E nada se perde, porque o tique só aparece depois de gravar. |
| 0:58,3 | Bônus: o WhatsApp real tem criptografia de ponta a ponta. |
| 1:01,7 | E apaga a mensagem do servidor depois de entregar. |
| 1:04,9 | Falar isso na entrevista impressiona. |
| 1:09,2 | No guia tem tudo com calma: catorze capítulos e os diagramas. |
| 1:13,2 | Contas prontas, os erros que reprovam e as perguntas com resposta. |
| 1:17,4 | **System Design do WhatsApp, quinze reais, link na bio.** |

---

Os tempos saem de `remotion/reels/whatsapp/roteiro.ts`. Se mudar alguma legenda lá e renderizar de novo,
os tempos daqui a seguir mudam junto e precisam ser revistos.
