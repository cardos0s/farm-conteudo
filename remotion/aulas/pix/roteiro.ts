// Reel "Um Pix, 30 minutos e uma falha que poderia ter sido evitada" (1080x1920), com narração.
// Abre com tomadas da viagem (Intro.tsx); depois, o canvas ilustra cada parte e a legenda mostra a fala.
//
// Tempo de projeto x tempo real: as cenas, legendas e efeitos do canvas foram desenhados num tempo
// "de projeto" (0–90 s). A narração gravada depois tem outro ritmo, então ANCORAS prende instantes do
// projeto a palavras da fala (tempos de remotion/aulas/pix/edicao/narracao.json, transcrita por
// scripts/aulas/transcrever_narracao.py) e o tempo entre elas é esticado ou encolhido em linha reta.
// Se a narração for regravada, basta atualizar as âncoras.

export const FPS = 30;
/** Duração da intro com as tomadas da viagem (s). */
export const INTRO = 8;
/** Fim do canvas no tempo de projeto (s). */
export const FIM = 90;

/**
 * Trecho da narração (s do arquivo de áudio) que acompanha o canvas: o canvas começa em
 * `INICIO_VOZ_CANVAS` do áudio (logo antes de "Um Pix") e o resto da fala segue sem cortes.
 */
export const INICIO_VOZ_CANVAS = 3.85;

/** [instante de projeto do canvas, segundo da narração em que ele deve cair] */
const ANCORAS: [number, number][] = [
  [0, INICIO_VOZ_CANVAS],
  [6.0, 8.62], // "O Pix ia expirar"
  [10.1, 11.86], // "descarregou"
  [13.0, 12.88], // "Liguei de novo"
  [16.6, 15.44], // "paguei"
  [19.3, 16.66], // "Só que o sistema da loja"
  [21.0, 18.86], // "duplicada"
  [22.0, 20.08], // "não paga"
  [22.7, 21.16], // "e outra paga"
  [24.8, 21.86], // "Chamaram"
  [24.9, 22.36], // "funcionários"
  [25.5, 23.86], // "extrato"
  [26.1, 24.78], // "documentos"
  [26.6, 25.86], // "Quase meia hora"
  [27.2, 26.64], // "hora"
  [29.0, 27.14], // "O cliente virou"
  [30.2, 29.44], // "suporte"
  [32.6, 30.0], // "Primeiro"
  [32.9, 31.14], // "máquina de estados"
  [33.3, 32.44], // "Cada tentativa"
  [36.4, 35.9], // "do pedido"
  [38.6, 36.72], // "O pedido está pago"
  [39.6, 38.08], // "alguma"
  [40.9, 39.24], // "paga."
  [43.3, 40.06], // "Segundo"
  [44.4, 42.04], // "Se a confirmação"
  [45.2, 42.96], // "não chegou"
  [48.2, 44.28], // "consulta"
  [49.3, 45.54], // "recupera"
  [51.0, 46.88], // "transação."
  [51.3, 47.88], // "O webhook atrasou?"
  [51.6, 49.18], // "Não espera"
  [54.3, 51.22], // "Terceiro"
  [55.8, 53.48], // "Qualquer funcionário"
  [56.0, 54.72], // "acha o pedido"
  [57.3, 55.84], // "cada cobrança"
  [57.9, 57.18], // "status"
  [59.6, 57.88], // "sem investigar"
  [60.0, 60.0], // "Em segundos"
  [64.3, 61.3], // "Quarto"
  [64.5, 62.12], // "contingência"
  [65.0, 63.34], // "Webhooks"
  [66.0, 64.58], // "conexões"
  [67.0, 65.62], // "celulares"
  [68.0, 66.4],
  [69.4, 67.08], // "Isso faz parte"
  [69.7, 67.34],
  [73.8, 70.12], // "Agora imagina"
  [74.2, 70.92], // "centenas"
  [78.0, 75.12], // "O gargalo"
  [79.0, 77.74], // "operacional"
  [82.3, 78.76], // "O básico"
  [85.0, 82.88], // "É um sistema"
  [85.8, 84.38], // "recuperar"
  [88.6, 86.04], // "E você"
  [FIM, 89.0],
];

/** Interpolação linear por partes (com extrapolação pela inclinação das pontas). */
function porPartes(pares: [number, number][], x: number): number {
  let i = 1;
  while (i < pares.length - 1 && x > pares[i][0]) i++;
  const [x0, y0] = pares[i - 1];
  const [x1, y1] = pares[i];
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

const PARA_REAL: [number, number][] = ANCORAS.map(([p, voz]) => [p, voz - INICIO_VOZ_CANVAS]);
const PARA_PROJETO: [number, number][] = PARA_REAL.map(([p, r]) => [r, p]);

/** Segundo real do canvas (a partir do fim da intro) em que um instante de projeto aparece. */
export const real = (tProjeto: number) => porPartes(PARA_REAL, tProjeto);
/** Instante de projeto que aparece num segundo real do canvas. */
export const projeto = (tReal: number) => porPartes(PARA_PROJETO, tReal);

/** Duração real do canvas e do vídeo inteiro. */
export const FIM_REAL = real(FIM);
export const TOTAL_QUADROS = Math.round((INTRO + FIM_REAL) * FPS);

/** Partes do vídeo (a etiqueta aparece na barra da legenda). Tempos de projeto. */
export const PARTES = [
  { t: 0, rotulo: "um Pix, 30 minutos" },
  { t: 5.8, rotulo: "a história" },
  { t: 19.0, rotulo: "o problema" },
  { t: 32.5, rotulo: "1/4 · máquina de estados" },
  { t: 43.0, rotulo: "2/4 · reconciliação" },
  { t: 54.0, rotulo: "3/4 · observabilidade" },
  { t: 64.0, rotulo: "4/4 · contingência" },
  { t: 73.5, rotulo: "em escala" },
  { t: 82.0, rotulo: "o básico bem feito" },
] as const;

/** Frases da legenda (o que é falado). `*{...}` destaca. Cada frase fica até a próxima começar. Tempos de projeto. */
export const LEGENDAS: { de: number; ate?: number; texto: string }[] = [
  { de: 0.4, texto: "Um Pix, 30 minutos e uma falha\nque poderia ter sido *{evitada}." },
  { de: 6.0, texto: "O Pix ia expirar em\n*{2 segundos}…" },
  { de: 10.1, texto: "…e o meu celular *{descarregou}." },
  { de: 13.0, texto: "Liguei de novo, gerei uma\nnova cobrança e *{paguei}." },
  { de: 19.3, texto: "O sistema da loja viu uma\n*{transação duplicada}: uma\nnão paga e outra paga." },
  { de: 24.8, texto: "Chamaram funcionários, abriram\nmeu extrato, pediram documentos…\nquase *{meia hora}." },
  { de: 29.0, texto: "O cliente virou parte\ndo processo de *{suporte}." },
  { de: 32.6, texto: "Primeiro: *{máquina de estados}.\nCada tentativa tem o próprio\nestado, separado do pedido." },
  { de: 38.6, texto: "O pedido está pago se\n*{alguma} tentativa foi paga." },
  { de: 43.3, texto: "Segundo: *{reconciliação}.\nSe a confirmação não chegou,\no sistema consulta o provedor." },
  { de: 51.3, texto: "O webhook atrasou?\nNão espera: *{pergunta}." },
  { de: 54.3, texto: "Terceiro: *{observabilidade}.\nQualquer funcionário acha o\npedido e vê cada cobrança." },
  { de: 59.6, texto: "Sem investigar o extrato\ndo cliente. Em *{segundos}." },
  { de: 64.3, texto: "Quarto: *{contingência}.\nWebhooks atrasam, conexões\ncaem, celulares descarregam." },
  { de: 69.4, texto: "Isso faz parte do projeto,\nnão é *{exceção}." },
  { de: 73.8, texto: "Agora imagina *{centenas}\nde pessoas passando por isso\nao mesmo tempo, na Black Friday." },
  { de: 78.0, texto: "O gargalo deixa de ser\ntecnológico e vira *{operacional}." },
  { de: 82.3, texto: "O básico bem feito não é um\nsistema que funciona quando\ntudo dá certo." },
  { de: 85.0, texto: "É um sistema que sabe se\n*{recuperar} quando algo dá errado." },
  { de: 88.6, texto: "E você, já passou\npor *{isso}?" },
];
