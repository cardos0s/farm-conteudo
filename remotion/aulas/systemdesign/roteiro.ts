import type { Pagina, Tela } from "../../lousa/Lousa";

// Reel (1080x1920): o system design por trás do feed do Flagra, no canvas pontilhado com traço à mão.
// Ainda sem narração: cada parte começa num segundo fixo. Quando a voz for gravada, basta trocar
// os inícios abaixo (ou passar a usar S("clipe", segundo) como no Reel de agentes).

export const FPS = 30;
export const TELA: Tela = { w: 1080, h: 1920 };

/** Retângulo da tela onde cada região do canvas aparece (sobra uma faixa embaixo para legenda). */
export const ALVO: Pagina = { x: 0, y: 110, w: 1080, h: 1640 };

const regiao = (x: number, y: number): Pagina => ({ x, y, w: 1080, h: 1640 });

export const R = {
  abertura: regiao(640, -1840),
  mapa: regiao(0, 0),
  postar: regiao(1280, 0),
  feed: regiao(0, 1840),
  curtida: regiao(1280, 1840),
  stories: regiao(0, 3680),
  reels: regiao(1280, 3680),
  fim: regiao(640, 5520),
} satisfies Record<string, Pagina>;

/** Caixa que envolve as seis partes (para a visão geral). */
export const TUDO: Pagina = { x: -40, y: -40, w: 2440, h: 5400 };

/** Segundo em que cada parte começa. */
export const T = {
  abertura: 0,
  mapa: 5.5,
  postar: 17.5,
  feed: 30,
  curtida: 44,
  stories: 57,
  reels: 68,
  geral: 81,
  fim: 84.5,
  total: 90,
} as const;

export const TOTAL_QUADROS = Math.round(T.total * FPS);
