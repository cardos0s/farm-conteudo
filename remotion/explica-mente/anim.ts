import { Euler, Vector3 } from "three";

export type V3 = [number, number, number];

export const limitar = (t: number, a = 0, b = 1) => Math.min(b, Math.max(a, t));
export const suave = (t: number) => t * t * (3 - 2 * t);
export const linear = (t: number) => t;
export const sair = (t: number) => 1 - (1 - t) * (1 - t);
export const entrar = (t: number) => t * t;
/** Passa um pouco do alvo e volta (para encaixes e "pops"). */
export const elastico = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixV = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
export const soma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const esc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const comp = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const c = comp(a) || 1;
  return [a[0] / c, a[1] / c, a[2] / c];
};
export const ponto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Progresso 0..1 entre dois quadros. */
export const prog = (f: number, a: number, b: number, ease = suave) => ease(limitar((f - a) / (b - a)));

/** Quadros-chave numéricos: [[quadro, valor], ...]. */
export const k = (f: number, pts: [number, number][], ease = suave): number => {
  if (f <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (f <= pts[i][0]) return mix(pts[i - 1][1], pts[i][1], ease((f - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])));
  }
  return pts[pts.length - 1][1];
};

/** Quadros-chave de vetor. */
export const kv = (f: number, pts: [number, V3][], ease = suave): V3 => {
  if (f <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (f <= pts[i][0]) return mixV(pts[i - 1][1], pts[i][1], ease((f - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])));
  }
  return pts[pts.length - 1][1];
};

/** Gira um vetor por (inclinação, giro, tombo) na ordem YXZ, a mesma usada nos grupos da cena. */
const _v = new Vector3();
const _e = new Euler();
export const girar = (v: V3, rot: V3): V3 => {
  _e.set(rot[0], rot[1], rot[2], "YXZ");
  _v.set(v[0], v[1], v[2]).applyEuler(_e);
  return [_v.x, _v.y, _v.z];
};

/** Converte (esquerda, altura, frente) de um personagem para o mundo. */
export const local = (raiz: V3, giro: number) => (esq: number, y: number, frente: number): V3 => [
  raiz[0] + esq * Math.cos(giro) + frente * Math.sin(giro),
  y,
  raiz[2] - esq * Math.sin(giro) + frente * Math.cos(giro),
];

/** Cinemática inversa de dois ossos: devolve a articulação do meio e a ponta (limitada ao alcance). */
export const ik = (raiz: V3, alvo: V3, l1: number, l2: number, polo: V3): { meio: V3; fim: V3 } => {
  let d = sub(alvo, raiz);
  let dist = comp(d);
  const max = (l1 + l2) * 0.999;
  const min = Math.abs(l1 - l2) + 0.001;
  const dir = norm(d);
  dist = limitar(dist, min, max);
  d = esc(dir, dist);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp = norm(sub(polo, esc(dir, ponto(polo, dir))));
  return { meio: soma(soma(raiz, esc(dir, a)), esc(perp, h)), fim: soma(raiz, d) };
};

/** Abertura de boca de quem está falando: irregular, mas determinística. */
export const fala = (f: number, semente = 0) =>
  limitar(0.15 + 0.85 * Math.abs(Math.sin(f * 0.83 + semente) * 0.6 + Math.sin(f * 1.9 + semente * 2) * 0.4));

/** Piscada: 1 = aberto. */
export const piscar = (f: number, semente = 0) => {
  const t = (f + semente * 37) % 95;
  return t < 5 ? Math.abs(t - 2.5) / 2.5 : 1;
};
