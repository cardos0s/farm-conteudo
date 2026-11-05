import type { Pagina } from "../../lousa/Lousa";

// Onde cada cena fica no canvas infinito. Páginas de 960 de largura aparecem na metade
// direita da tela (tela dividida com a câmera); as de 1920 ocupam a tela toda.
const meia = (x: number, y: number): Pagina => ({ x, y, w: 960, h: 1080 });
const cheia = (x: number, y: number): Pagina => ({ x, y, w: 1920, h: 1080 });

export const P = {
  abertura: cheia(0, 0),
  ia: meia(2000, 0),
  ferrari: meia(3000, 0),
  questionar: meia(4000, 0),
  fundamentos: meia(5000, 0),
  baseMl: meia(6000, 0),

  eficiencia: cheia(0, 1300),
  quantidades: cheia(2000, 1300),
  cronometro: cheia(4000, 1300),
  fatores: cheia(6000, 1300),

  ramIntro: cheia(0, 2600),
  principios: cheia(2000, 2600),
  cpu: cheia(4000, 2600),
  atribuicoes: cheia(6000, 2600),

  hipoteses: cheia(0, 3900),
  bigo: cheia(2000, 3900),
  classes: cheia(4000, 3900),
  estruturas: cheia(6000, 3900),
} satisfies Record<string, Pagina>;

export const todas = Object.values(P);
