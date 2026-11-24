// Reel "Um Pix, 30 minutos e uma falha que poderia ter sido evitada" (1080x1920, sem gravação).
// Abre com cortes rápidos da viagem (Intro.tsx); depois, o texto do post entra como legenda
// embaixo e o canvas ilustra cada parte.
// Os tempos do canvas e das legendas contam a partir do fim da intro.

export const FPS = 30;
/** Duração da intro com os cortes da viagem (s). */
export const INTRO = 5;
/** Duração da parte do canvas (s). */
export const FIM = 90;
export const TOTAL_QUADROS = (INTRO + FIM) * FPS;

/** Partes do vídeo (a etiqueta aparece na barra da legenda). */
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

/** Frases da legenda. `*{...}` destaca. Cada frase fica até a próxima começar (ou até `ate`). */
export const LEGENDAS: { de: number; ate?: number; texto: string }[] = [
  { de: 0.4, texto: "Um Pix, 30 minutos e uma falha\nque poderia ter sido *{evitada}." },
  { de: 6.0, texto: "Black Friday, no Paraguai.\nO Pix ia expirar em *{2 segundos}…" },
  { de: 10.1, texto: "…e o celular *{descarregou}." },
  { de: 13.0, texto: "Liguei de novo, gerei uma\nnova cobrança e *{paguei}." },
  { de: 19.3, texto: "O sistema viu uma\n*{transação duplicada}: uma\nnão paga e outra paga." },
  { de: 24.8, texto: "Funcionários, extrato bancário,\ndocumentos… quase *{meia hora}." },
  { de: 29.0, texto: "O cliente virou parte\ndo processo de *{suporte}." },
  { de: 32.8, texto: "*{Máquina de estados}: cada\ntentativa tem o próprio estado,\nseparado do estado do pedido." },
  { de: 38.6, texto: "O pedido está pago se\n*{alguma} tentativa foi paga." },
  { de: 43.3, texto: "*{Reconciliação}: a confirmação\nnão chegou? O sistema consulta\no provedor e recupera o estado." },
  { de: 54.3, texto: "*{Observabilidade}: qualquer\nfuncionário acha o pedido e vê\ncada cobrança e o seu status." },
  { de: 59.6, texto: "Sem investigar o extrato\ndo cliente." },
  { de: 64.3, texto: "*{Contingência}: webhooks\natrasam, conexões caem,\ncelulares descarregam." },
  { de: 69.4, texto: "Isso faz parte do projeto,\nnão é *{exceção}." },
  { de: 73.8, texto: "Agora imagina *{centenas} de\npessoas assim, na Black Friday." },
  { de: 78.0, texto: "O gargalo deixa de ser\ntecnológico e vira *{operacional}." },
  { de: 82.3, texto: "Um sistema que sabe se\n*{recuperar} quando algo dá errado." },
];
