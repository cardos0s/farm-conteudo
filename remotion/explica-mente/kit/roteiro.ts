import type { Fala } from "../roteiro";

export const FPS = 30;
/** Quadros reservados no fim para a logo. */
export const CAUDA = 100;

/**
 * Monta as falas de um episódio a partir do texto, com um tempo estimado por número de palavras.
 * Com a locução gravada, os tempos reais vêm do tempos.json do episódio (ver ../tempo.ts).
 */
export const estimar = (textos: string[]) => {
  let cursor = 6;
  const FALAS: Fala[] = textos.map((texto) => {
    const de = cursor;
    const ate = de + Math.round(texto.split(/\s+/).length * 10.5) + 14;
    cursor = ate + 8;
    return { de, ate, quem: "narracao", texto };
  });
  return { FALAS, TOTAL_QUADROS: cursor - 8 + CAUDA };
};
