// Tipos e consultas sobre uma gravação feita com scripts/telas/gravar.mjs.
// Tempos em segundos desde o início do vídeo gravado; posições em px CSS da tela gravada.

export type Caixa = { x: number; y: number; w: number; h: number };

export type Evento =
  | { t: number; tipo: "mouse"; x: number; y: number }
  | { t: number; tipo: "clique"; x: number; y: number; caixa: Caixa | null }
  | { t: number; tipo: "digitar"; texto: string; caixa: Caixa | null }
  | { t: number; tipo: "digitado" }
  | { t: number; tipo: "rolar"; dy: number }
  | { t: number; tipo: "marca"; nome: string }
  | { t: number; tipo: "foco"; nome: string; caixa: Caixa }
  | { t: number; tipo: "recorte"; nome: string; caixa: Caixa };

export interface Gravacao {
  cena: string;
  largura: number;
  altura: number;
  escala: number;
  fps: number;
  duracao: number;
  eventos: Evento[];
}

type Ponto = { t: number; x: number; y: number };
const cacheMouse = new WeakMap<Gravacao, Ponto[]>();

function trilha(g: Gravacao): Ponto[] {
  let p = cacheMouse.get(g);
  if (!p) {
    p = g.eventos.filter((e): e is Extract<Evento, { tipo: "mouse" }> => e.tipo === "mouse").map(({ t, x, y }) => ({ t, x, y }));
    cacheMouse.set(g, p);
  }
  return p;
}

/** Posição do mouse no instante t (interpolada entre as amostras gravadas). */
export function mouseEm(g: Gravacao, t: number): { x: number; y: number } {
  const p = trilha(g);
  if (!p.length) return { x: g.largura / 2, y: g.altura / 2 };
  if (t <= p[0].t) return p[0];
  let lo = 0;
  let hi = p.length - 1;
  if (t >= p[hi].t) return p[hi];
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p[m].t <= t) lo = m;
    else hi = m;
  }
  const k = (t - p[lo].t) / (p[hi].t - p[lo].t || 1);
  return { x: p[lo].x + (p[hi].x - p[lo].x) * k, y: p[lo].y + (p[hi].y - p[lo].y) * k };
}

export const cliques = (g: Gravacao) => g.eventos.filter((e): e is Extract<Evento, { tipo: "clique" }> => e.tipo === "clique");

/** Instante de uma marca nomeada (g.marca("nome") na cena). */
export function marca(g: Gravacao, nome: string): number {
  const e = g.eventos.find((x) => x.tipo === "marca" && x.nome === nome);
  if (!e) throw new Error(`Marca "${nome}" não existe na gravação ${g.cena}`);
  return e.t;
}

/** Caixa de um foco nomeado (g.foco(alvo, "nome") na cena). */
export function foco(g: Gravacao, nome: string): Caixa {
  const e = g.eventos.find((x) => x.tipo === "foco" && x.nome === nome);
  if (!e || e.tipo !== "foco") throw new Error(`Foco "${nome}" não existe na gravação ${g.cena}`);
  return e.caixa;
}

/** Instante de um foco nomeado. */
export function tempoFoco(g: Gravacao, nome: string): number {
  const e = g.eventos.find((x) => x.tipo === "foco" && x.nome === nome);
  if (!e) throw new Error(`Foco "${nome}" não existe na gravação ${g.cena}`);
  return e.t;
}

/** Um recorte marcado na cena (g.recorte): quando e onde o elemento está na gravação. */
export function recorte(g: Gravacao, nome: string): { t: number; caixa: Caixa } {
  const e = g.eventos.find((x) => x.tipo === "recorte" && x.nome === nome);
  if (!e || e.tipo !== "recorte") throw new Error(`Recorte "${nome}" não existe na gravação ${g.cena}`);
  return { t: e.t, caixa: e.caixa };
}
