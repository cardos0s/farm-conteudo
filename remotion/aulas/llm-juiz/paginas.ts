import type { Pagina } from "../../lousa/Lousa";

// Onde cada cena fica no canvas infinito (todas em tela cheia, 1920x1080).
const pg = (col: number, lin: number): Pagina => ({ x: col * 2100, y: lin * 1300, w: 1920, h: 1080 });

export const P = {
  abertura: pg(0, 0),
  agente: pg(1, 0),
  pergunta: pg(2, 0),
  promessa: pg(3, 0),
  frase: pg(0, 1),
  llm: pg(1, 1),
  proxima: pg(2, 1),
  confianca: pg(3, 1),
  alucinacao: pg(0, 2),
  colega: pg(1, 2),
} satisfies Record<string, Pagina>;

export const todas = Object.values(P);
