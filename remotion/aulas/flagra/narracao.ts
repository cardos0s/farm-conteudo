// Narração do Reel do Flagra. Cada fala começa no segundo `em` do vídeo final (ReelFlagra).
// O áudio de cada uma é gerado pela ElevenLabs com scripts/flagra/narrar.mjs e fica em
// public/flagra/narracao/<id>.mp3. Mudou o texto? Rode o script de novo (ele só refaz o que mudou).

export type Fala = { id: string; em: number; texto: string };

const EXPLICACAO = 6; // início da explicação no Reel
const APP = 90.5; // início da demo do app no Reel
const app = (s: number) => APP + s;
const sd = (s: number) => EXPLICACAO + s;

export const FALAS: Fala[] = [
  // trailer
  { id: "01-pergunta", em: 0.8, texto: "E se esse feed do GTA 6 fosse um app de verdade?" },
  // explicação (os segundos batem com remotion/aulas/systemdesign/roteiro.ts)
  { id: "02-abertura", em: sd(0.3), texto: "Eu construí um. E vou te mostrar o que acontece por trás de cada toque." },
  {
    id: "03-mapa",
    em: sd(5.6),
    texto: "O mapa: fotos e vídeos vêm de uma CDN, perto de você. O resto passa pela API, que divide o trabalho entre serviços. E eles conversam por uma fila de eventos: ninguém espera ninguém.",
  },
  {
    id: "04-postar",
    em: sd(17.6),
    texto: "Quando você posta, o arquivo vai direto pro armazenamento, sem passar pela API. Ele é convertido em vários tamanhos, vai pra CDN, e só então o post é publicado.",
  },
  {
    id: "05-feed",
    em: sd(30.1),
    texto: "Pra montar o feed, existem dois jeitos. No push, o post vai pra timeline de cada seguidor na hora. No pull, tudo é juntado quando você abre o app. Os apps grandes misturam os dois, e cada post ganha uma nota.",
  },
  {
    id: "06-curtida",
    em: sd(44.1),
    texto: "Uma curtida grava uma única linha, na hora. Contador, notificação e ranking vêm depois, pela fila. Se cada toque somasse direto no banco, milhares de curtidas por segundo travariam tudo.",
  },
  {
    id: "07-stories",
    em: sd(57.1),
    texto: "O story nasce com prazo de vinte e quatro horas. Quando você vê, ele entra numa lista de vistos e o anel fica cinza. No fim do prazo, se apaga sozinho.",
  },
  {
    id: "08-reels",
    em: sd(68.1),
    texto: "Nos reels, quem manda é a recomendação. De bilhões de vídeos, o sistema escolhe os dez próximos. E o sinal mais forte é o tempo que você assiste.",
  },
  { id: "09-geral", em: sd(81.3), texto: "Esse é o sistema inteiro." },
  // app (os segundos batem com os passos de scripts/flagra/gravar-demo.cjs)
  { id: "10-app", em: app(0.2), texto: "Agora, o app. Essa é a Duda e esse é o Rafa." },
  { id: "11-story", em: app(3.7), texto: "Anel colorido é story que eu ainda não vi." },
  { id: "12-enquete", em: app(8.2), texto: "Votar na enquete também conta como interação." },
  { id: "13-anel", em: app(13.2), texto: "Vi tudo: o anel fica cinza e vai pro fim da fila." },
  { id: "14-repost", em: app(17.7), texto: "Eu não sigo a Duda. Esse post chegou porque o Rafa repostou." },
  { id: "15-seguir", em: app(22.2), texto: "Agora eu sigo." },
  { id: "16-curtida", em: app(25.7), texto: "Curti: uma linha no banco, mais um no contador e uma notificação pra ela." },
  { id: "17-comentarios", em: app(29.7), texto: "Nos comentários, os dois estão discutindo. E eu entro na conversa." },
  { id: "18-repostar", em: app(35.2), texto: "Reposto, e o post vai pro feed de quem me segue." },
  { id: "19-reels", em: app(38.7), texto: "Nos reels, o vídeo do Rafa está bombando. Olha a nota subindo." },
  { id: "20-feed", em: app(47.7), texto: "Com tudo isso, o ranking recalcula e a Duda vai pro topo do meu feed." },
  { id: "21-fecho", em: 149.3, texto: "É isso que roda quando você curte." },
];
