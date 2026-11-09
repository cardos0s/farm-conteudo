import type { Caixa } from "./gravacao";

// Enquadramento da tela gravada: zoom suave para onde a ação acontece e volta ao plano geral.
// Tudo em px CSS da tela gravada; `Tela.tsx` converte para o quadro do vídeo.

export type Plano = {
  /** Instante (s, no tempo da cena) em que o movimento até este plano começa. */
  t: number;
  /** Zoom em relação ao plano geral (1 = janela inteira). Se omitido e houver caixa, ajusta à caixa. */
  zoom?: number;
  /** Centro do enquadramento. Se omitido, usa o centro da caixa ou o centro da tela. */
  x?: number;
  y?: number;
  caixa?: Caixa;
  /** Folga em volta da caixa, em px CSS (padrão 140). */
  folga?: number;
  /** Duração do movimento (s, padrão 0,9). */
  dur?: number;
};

export type Enquadre = { zoom: number; x: number; y: number };

const suave = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const prender = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function resolver(p: Plano, tela: { w: number; h: number }, zoomMax = 2.2): Enquadre {
  const c = p.caixa;
  let zoom = p.zoom;
  if (zoom === undefined) {
    if (c) {
      const folga = p.folga ?? 140;
      zoom = Math.min(tela.w / (c.w + folga * 2), tela.h / (c.h + folga * 2));
    } else zoom = 1;
  }
  zoom = prender(zoom, 1, zoomMax);
  const x = p.x ?? (c ? c.x + c.w / 2 : tela.w / 2);
  const y = p.y ?? (c ? c.y + c.h / 2 : tela.h / 2);
  return { zoom, x, y };
}

/** Enquadramento no instante t, interpolando do plano anterior para o atual. */
export function enquadreEm(planos: Plano[], t: number, tela: { w: number; h: number }): Enquadre {
  if (!planos.length) return { zoom: 1, x: tela.w / 2, y: tela.h / 2 };
  let i = 0;
  while (i + 1 < planos.length && planos[i + 1].t <= t) i++;
  const atual = resolver(planos[i], tela);
  if (i === 0 && t < planos[0].t) return atual;
  const anterior = i === 0 ? atual : resolver(planos[i - 1], tela);
  const dur = planos[i].dur ?? 0.9;
  const k = suave(prender((t - planos[i].t) / dur, 0, 1));
  // O zoom interpola em escala logarítmica: aproximar e afastar ficam com a mesma sensação de velocidade.
  const zoom = Math.exp(Math.log(anterior.zoom) + (Math.log(atual.zoom) - Math.log(anterior.zoom)) * k);
  return { zoom, x: anterior.x + (atual.x - anterior.x) * k, y: anterior.y + (atual.y - anterior.y) * k };
}

/** Planos automáticos: aproxima em cada clique e volta ao geral quando a ação para por um tempo. */
export function planosDosCliques(
  cliques: { t: number; x: number; y: number; caixa: Caixa | null }[],
  { zoom = 1.6, antes = 0.5, pausa = 2.4 }: { zoom?: number; antes?: number; pausa?: number } = {},
): Plano[] {
  const planos: Plano[] = [{ t: 0, zoom: 1 }];
  let ultimo = -Infinity;
  for (const c of cliques) {
    if (c.t - ultimo > pausa && planos.length > 1) planos.push({ t: ultimo + 0.8, zoom: 1, dur: 1 });
    planos.push({ t: Math.max(0, c.t - antes), zoom, x: c.x, y: c.y });
    ultimo = c.t;
  }
  planos.push({ t: ultimo + 1.2, zoom: 1, dur: 1 });
  return planos;
}
