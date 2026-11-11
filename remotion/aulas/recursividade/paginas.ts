import type { Pagina } from "../../lousa/Lousa";

// Onde cada cena da aula 2 fica no canvas infinito: 3 linhas, as duas de cima centralizadas sobre a de baixo,
// para a visão geral final ficar equilibrada.
const meia = (x: number, y: number): Pagina => ({ x, y, w: 960, h: 1080 });
const cheia = (x: number, y: number): Pagina => ({ x, y, w: 1920, h: 1080 });

export const P = {
  abertura: cheia(1000, 0),
  chamadas: meia(3000, 0),
  parar: meia(4000, 0),
  fatorial: cheia(5000, 0),

  conceitos: cheia(1000, 1300),
  sequencia: cheia(3000, 1300),
  arvore: cheia(5000, 1300),

  bigo: cheia(0, 2600),
  custo: cheia(2000, 2600),
  grafico: cheia(4000, 2600),
  recap: cheia(6000, 2600),
} satisfies Record<string, Pagina>;

export const todas = Object.values(P);
