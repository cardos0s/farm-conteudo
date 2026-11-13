import { FALAS, TOTAL_QUADROS } from "./roteiro";
import tempos from "./tempos.json";

// Quando existe locução, `tempos.json` (gerado por scripts/explica-mente/montar_locucao.ts) diz em que
// quadro cada fala realmente começa e termina. O vídeo inteiro acompanha: cada trecho da animação é
// esticado ou encolhido para caber na voz.
const novos = tempos.falas as number[][];
const ajustado = novos.length === FALAS.length;

/** Duração do vídeo, em quadros. */
export const TOTAL = ajustado ? tempos.total : TOTAL_QUADROS;

const ancoras: [number, number][] = [[0, 0]];
if (ajustado) FALAS.forEach((fl, i) => ancoras.push([novos[i][0], fl.de], [novos[i][1], fl.ate]));
ancoras.push([TOTAL, TOTAL_QUADROS]);

/** Converte um quadro do vídeo no quadro correspondente do roteiro original. */
export const noRoteiro = (f: number) => {
  for (let i = 1; i < ancoras.length; i++) {
    const [a, x] = ancoras[i - 1];
    const [b, y] = ancoras[i];
    if (f <= b) return b === a ? y : x + ((f - a) / (b - a)) * (y - x);
  }
  return TOTAL_QUADROS;
};
