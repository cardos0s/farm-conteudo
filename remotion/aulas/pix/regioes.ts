import type { Pagina, Tela } from "../../lousa/Lousa";

// Onde cada parte do Reel fica no canvas. Cada região ocupa a área de cima da tela
// (a legenda fica embaixo) e é vista sem zoom; perto do fim, a câmera se afasta e mostra tudo.

export const TELA: Tela = { w: 1080, h: 1920 };

/** Retângulo da tela onde as regiões do canvas aparecem (acima da legenda). */
export const ALVO: Pagina = { x: 0, y: 150, w: 1080, h: 1080 };

/** Painel da legenda (à esquerda, longe dos botões do Reels, e acima do texto do post). */
export const LEGENDA = { x: 40, y: 1262, w: 860, h: 322 };

const regiao = (x: number, y: number): Pagina => ({ x, y, w: 1080, h: 1080 });

export const R = {
  // bem acima, para não aparecer na borda da visão geral
  abertura: regiao(600, -1900),
  historia: regiao(0, 0),
  problema: regiao(1200, 0),
  estados: regiao(0, 1200),
  reconciliacao: regiao(1200, 1200),
  observabilidade: regiao(0, 2400),
  contingencia: regiao(1200, 2400),
  final: regiao(600, 3750),
} satisfies Record<string, Pagina>;

/** Caixa que envolve as regiões da explicação (para a visão geral). */
export const TUDO: Pagina = { x: -40, y: -40, w: 2360, h: 3560 };
