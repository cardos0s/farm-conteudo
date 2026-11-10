import type { Caixa, Evento, Gravacao } from "../gravacao";

// Formato vertical (Reels e Stories, 9:16): medidas, zonas da tela e a câmera do palco.

export const RW = 1080;
export const RH = 1920;

/**
 * Zonas da tela. O Instagram cobre o topo (perfil) e a base (legenda, botões): tudo que é para ler
 * fica entre y = 250 e y = 1520.
 */
export const ZONA = {
  marca: { y: 250, h: 50 },
  /** Título do momento: o bloco de texto encosta na base desta faixa. */
  titulo: { y: 316, h: 196 },
  /** A janela da plataforma. `barra` é a faixa do navegador; a tela gravada aparece abaixo dela. */
  palco: { x: 40, y: 540, w: 1000, h: 800, barra: 42, raio: 30 },
  legenda: { y: 1366, h: 150 },
} as const;

/** Área onde a tela gravada aparece (abaixo da barra do navegador), em px do quadro. */
export const VISOR = { x: ZONA.palco.x, y: ZONA.palco.y + ZONA.palco.barra, w: ZONA.palco.w, h: ZONA.palco.h - ZONA.palco.barra };

export type Ret = { x: number; y: number; w: number; h: number };

export const prender = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const saidaForte = (k: number) => 1 - Math.pow(1 - prender(k), 3);
export const mistura = (a: number, b: number, k: number) => a + (b - a) * k;

// ── Câmera ────────────────────────────────────────────────────────────────────────────────────────
// A câmera olha para "alvos" da gravação (um clique, um campo, um recorte). Entre um alvo e o próximo
// ela desliza: o enquadramento em cada instante é a média dos alvos numa janela de tempo da gravação,
// então muitos cliques seguidos viram um movimento só, sem tranco.

export type Alvo = {
  /** Instante da gravação (s) a partir do qual a câmera olha para este alvo. */
  t: number;
  /** Centro do enquadramento (px CSS da tela gravada). */
  cx: number;
  cy: number;
  /** px do quadro por px CSS: 1 mostra 1000 px da tela na largura do palco. */
  zoom: number;
};

export type Enquadre = { cx: number; cy: number; zoom: number };

/** Zoom para a caixa caber no visor com folga (px CSS em volta), limitado a [min, max]. */
export function zoomDaCaixa(c: Caixa, folga: number, max = 2.2, min = 0.62): number {
  return prender(Math.min(VISOR.w / (c.w + folga * 2), VISOR.h / (c.h + folga * 2)), min, max);
}

export function alvoDaCaixa(t: number, c: Caixa, o: { folga?: number; zoomMax?: number; zoom?: number } = {}): Alvo {
  return { t, cx: c.x + c.w / 2, cy: c.y + c.h / 2, zoom: o.zoom ?? zoomDaCaixa(c, o.folga ?? 40, o.zoomMax ?? 2.2) };
}

/**
 * Enquadramento no instante t: média dos alvos em volta de t, pesada por uma janela de Hann.
 * A média é a integral exata da janela sobre cada alvo (não uma soma de amostras): a câmera muda um
 * pouco a cada quadro, sem degraus, e parte e chega com velocidade zero.
 */
export function cameraEm(alvos: Alvo[], t: number, o: { janela?: number; avanco?: number } = {}): Enquadre {
  if (!alvos.length) return { cx: 800, cy: 450, zoom: 0.84 };
  const janela = o.janela ?? 1.1;
  const centro = t + (o.avanco ?? 0.3);
  /** Peso acumulado da janela de 0 a u (a janela inteira soma 0,5). */
  const acumulado = (u: number) => 0.5 * u - Math.sin(2 * Math.PI * u) / (4 * Math.PI);
  /** Onde um instante cai dentro da janela (0 a 1). */
  const naJanela = (instante: number) => prender((instante - centro) / janela + 0.5);
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (let i = 0; i < alvos.length; i++) {
    // o alvo i vale do instante dele até o do próximo (o primeiro vale desde sempre)
    const u0 = i === 0 ? 0 : naJanela(alvos[i].t);
    const u1 = i + 1 < alvos.length ? naJanela(alvos[i + 1].t) : 1;
    if (u1 <= u0) continue;
    const peso = (acumulado(u1) - acumulado(u0)) / 0.5;
    sx += alvos[i].cx * peso;
    sy += alvos[i].cy * peso;
    sz += Math.log(alvos[i].zoom) * peso;
  }
  return { cx: sx, cy: sy, zoom: Math.exp(sz) };
}

/**
 * A câmera de um trecho tocado em `velocidade`: a janela da média acompanha a velocidade, então o
 * movimento leva o mesmo tempo no vídeo (~1,1 s) num trecho lento ou acelerado. Começa a se mover
 * ~0,85 s antes do instante do alvo e chega ~0,25 s depois.
 */
export function cameraNoTrecho(alvos: Alvo[], t: number, velocidade: number): Enquadre {
  const v = prender(velocidade, 0.3, 2);
  return cameraEm(alvos, t, { janela: 1.1 * v, avanco: 0.3 * v });
}

/**
 * Do enquadramento para a transformação da tela gravada dentro do visor: escala e deslocamento (px do
 * quadro, relativos ao canto do visor). A tela nunca deixa vazio no visor quando é maior que ele.
 */
export function transformar(e: Enquadre, tela: { w: number; h: number }): { z: number; tx: number; ty: number } {
  const z = e.zoom;
  const eixo = (centro: number, tam: number, visor: number) => {
    const total = tam * z;
    if (total <= visor) return (visor - total) / 2;
    return prender(visor / 2 - centro * z, visor - total, 0);
  };
  return { z, tx: eixo(e.cx, tela.w, VISOR.w), ty: eixo(e.cy, tela.h, VISOR.h) };
}

/** Onde uma caixa da tela gravada aparece no quadro, com a câmera neste enquadramento. */
export function projetar(c: Caixa, e: Enquadre, tela: { w: number; h: number }): Ret {
  const { z, tx, ty } = transformar(e, tela);
  return { x: VISOR.x + tx + c.x * z, y: VISOR.y + ty + c.y * z, w: c.w * z, h: c.h * z };
}

/**
 * Alvos automáticos de uma gravação: cada clique, cada campo digitado e cada recorte ou foco marcado
 * na cena. `zoomClique` é o zoom em volta do cursor; recortes e focos enquadram a caixa inteira.
 */
export function alvosDaGravacao(
  g: Gravacao,
  o: {
    zoomClique?: number;
    /** Zoom máximo ao enquadrar um recorte ou foco. */
    zoomRecorte?: number;
    folgaRecorte?: number;
    /**
     * Quanto antes do instante marcado a câmera já olha para o recorte (s). O recorte é marcado
     * depois que o elemento assentou na tela, então dá para chegar nele antes; mas nunca antes do
     * último clique que veio antes dele (o clique que o fez aparecer).
     */
    adiantaRecorte?: number;
    /** Deixa de fora eventos (ex.: um foco que só serve à versão horizontal). */
    ignorar?: (e: Evento) => boolean;
    /** Alvos escritos à mão; entram junto e valem pelo instante. */
    extras?: Alvo[];
  } = {},
): Alvo[] {
  const zc = o.zoomClique ?? 1.45;
  const alvos: Alvo[] = [];
  let ultimoClique = -Infinity;
  for (const e of g.eventos) {
    if (e.tipo === "clique") ultimoClique = e.t;
    if (o.ignorar?.(e)) continue;
    if (e.tipo === "clique") alvos.push({ t: e.t - 0.25, cx: e.x, cy: e.y, zoom: zc });
    else if (e.tipo === "digitar" && e.caixa) alvos.push({ t: e.t - 0.1, cx: e.caixa.x + Math.min(e.caixa.w / 2, 260), cy: e.caixa.y + e.caixa.h / 2, zoom: zc });
    else if (e.tipo === "recorte" || e.tipo === "foco") {
      const t = Math.max(e.t - (o.adiantaRecorte ?? 0.1), Math.min(e.t, ultimoClique + 0.15));
      alvos.push(alvoDaCaixa(t, e.caixa, { folga: o.folgaRecorte ?? 44, zoomMax: o.zoomRecorte ?? 1.9 }));
    }
  }
  alvos.push(...(o.extras ?? []));
  alvos.sort((a, b) => a.t - b.t);
  return alvos;
}
