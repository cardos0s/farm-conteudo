import type { Fala } from "./roteiro";

/**
 * Quando existe locução, o `tempos.json` do episódio diz em que quadro cada fala realmente começa
 * e termina. O vídeo inteiro acompanha: cada trecho da animação é esticado ou encolhido para caber
 * na voz. Sem locução (lista vazia), vale o tempo estimado do roteiro.
 */
export const criarTempo = (falas: Fala[], totalRoteiro: number, tempos: { total: number; falas: number[][] }) => {
  const ajustado = tempos.falas.length === falas.length;
  const TOTAL = ajustado ? tempos.total : totalRoteiro;
  const ancoras: [number, number][] = [[0, 0]];
  if (ajustado) falas.forEach((fl, i) => ancoras.push([tempos.falas[i][0], fl.de], [tempos.falas[i][1], fl.ate]));
  ancoras.push([TOTAL, totalRoteiro]);
  /** Converte um quadro do vídeo no quadro correspondente do roteiro. */
  const noRoteiro = (f: number) => {
    for (let i = 1; i < ancoras.length; i++) {
      const [a, x] = ancoras[i - 1];
      const [b, y] = ancoras[i];
      if (f <= b) return b === a ? y : x + ((f - a) / (b - a)) * (y - x);
    }
    return totalRoteiro;
  };
  return { TOTAL, noRoteiro };
};
