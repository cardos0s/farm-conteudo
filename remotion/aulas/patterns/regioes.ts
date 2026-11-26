import type { Pagina, Tela } from "../../lousa/Lousa";

// Onde cada parte do Reel fica no canvas: a abertura em cima, os 9 padrões numa grade 3x3
// (uma linha por categoria do Gang of Four) e, embaixo, a conexão com a IA e o fechamento.
// Cada região ocupa a área de cima da tela (a legenda fica embaixo).

export const TELA: Tela = { w: 1080, h: 1920 };

/** Retângulo da tela onde as regiões do canvas aparecem (acima da legenda). */
export const ALVO: Pagina = { x: 0, y: 150, w: 1080, h: 1080 };

/** Painel da legenda: centralizado, acima do texto do post. */
export const LEGENDA = { x: 110, y: 1262, w: 860, h: 322 };

const regiao = (x: number, y: number): Pagina => ({ x, y, w: 1080, h: 1080 });

export const R = {
  gancho: regiao(1200, -1300),
  contexto: regiao(1200, 0),
  // criacionais
  singleton: regiao(0, 1200),
  factory: regiao(1200, 1200),
  builder: regiao(2400, 1200),
  // estruturais
  adapter: regiao(0, 2400),
  decorator: regiao(1200, 2400),
  facade: regiao(2400, 2400),
  // comportamentais
  strategy: regiao(0, 3600),
  observer: regiao(1200, 3600),
  chain: regiao(2400, 3600),
  conexao: regiao(1200, 4800),
  final: regiao(1200, 6000),
} satisfies Record<string, Pagina>;

/** A grade dos 9 padrões (para a visão geral). */
export const GRADE: Pagina = { x: -40, y: 1160, w: 3560, h: 3560 };
