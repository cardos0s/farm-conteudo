import type { Pagina, Tela } from "../../lousa/Lousa";

// Onde cada parte do Reel fica no canvas. Cada região ocupa a área de cima da tela
// (o painel da câmera fica embaixo) e é vista sem zoom; no fim, a câmera se afasta e mostra tudo.

export const TELA: Tela = { w: 1080, h: 1920 };

/** Retângulo da tela onde o canvas aparece enquanto a câmera está no painel de baixo. */
export const ALVO: Pagina = { x: 0, y: 118, w: 1080, h: 990 };

const regiao = (x: number, y: number): Pagina => ({ x, y, w: 1080, h: 990 });

export const R = {
  chat: regiao(0, 0),
  agente: regiao(1200, 0),
  equipe: regiao(0, 1150),
  subagentes: regiao(1200, 1150),
  config: regiao(1200, 2300),
  construir: regiao(0, 2300),
} satisfies Record<string, Pagina>;

/** Caixa que envolve todas as regiões (para a visão geral). */
export const TUDO: Pagina = { x: -40, y: -40, w: 2360, h: 3370 };
