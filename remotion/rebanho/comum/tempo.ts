import { Easing } from "remotion";
import { type Camera, batida, lerp, limitar, prog, ruido } from "../pesagem/roteiro";

// Base dos Reels explicativos do Rebanho: linha do tempo tirada da narração e câmera de quem está montado.

export const FPS = 30;
export const L = 1080;
export const A = 1920;

export type Fala = { arquivo: string; texto: string; duracao: number; palavras: { p: string; i: number; f: number }[] };

/** Encadeia as falas (uma pausa entre elas) e devolve o relógio do vídeo. */
export function montarFalas(voz: unknown, pausa = 0.5, primeira = 0.3, cauda = 2.6) {
  const falas = voz as Fala[];
  const inicio: number[] = [];
  falas.forEach((_, i) => inicio.push(i === 0 ? primeira : inicio[i - 1]! + falas[i - 1]!.duracao + pausa));
  const ultima = falas.length - 1;
  const duracao = Math.ceil(inicio[ultima]! + falas[ultima]!.duracao + cauda);
  /** Instante em que começa a k-ésima palavra iniciada por `ini` na fala n (contando de 0). */
  const quando = (n: number, ini: string, k = 0): number => {
    const w = falas[n]!.palavras.filter((x) => x.p.toLowerCase().startsWith(ini.toLowerCase()))[k];
    if (!w) throw new Error(`Palavra "${ini}" (${k}) não está na fala ${n + 1}`);
    return inicio[n]! + w.i;
  };
  const F = (n: number) => inicio[n]!;
  const fim = (n: number) => inicio[n]! + falas[n]!.duracao;
  return { falas, inicio, duracao, quadros: duracao * FPS, quando, F, fim };
}

/** Integral de uma rampa suave que vai de 0 a 1 entre a e b. */
function rampa(t: number, a: number, b: number): number {
  if (t <= a) return 0;
  if (t >= b) return (b - a) / 2 + (t - b);
  const u = (t - a) / (b - a);
  return (b - a) * (u * u * u - (u * u * u * u) / 2);
}
const degrau = (t: number, a: number, b: number) => { const u = limitar((t - a) / (b - a)); return u * u * (3 - 2 * u); };

/** Passo do cavalo: começa andando; cada trecho [a, b, s] freia (s = -1) ou volta a andar (s = +1) entre a e b. */
export function criarMovimento(z0: number, vel: number, trechos: [number, number, 1 | -1][]) {
  const velEm = (t: number) => vel * (1 + trechos.reduce((s, [a, b, d]) => s + d * degrau(t, a, b), 0));
  const zEm = (t: number) => z0 + vel * (t + trechos.reduce((s, [a, b, d]) => s + d * rampa(t, a, b), 0));
  return { velEm, zEm, z0, vel };
}

export type Chave = { t: number; dur: number; v: number };
export const seguir = (t: number, inicial: number, chaves: Chave[]) => chaves.reduce((v, c) => lerp(v, c.v, prog(t, c.t, c.dur, Easing.inOut(Easing.cubic))), inicial);
const sino = (t: number, de: number, ate: number) => (t <= de || t >= ate ? 0 : Math.sin((Math.PI * (t - de)) / (ate - de)) ** 2);

export function criarCamera(o: {
  mov: ReturnType<typeof criarMovimento>;
  x?: number;
  guinadas: Chave[];
  horizontes: Chave[];
  /** instantes em que um letreiro carimba a tela (tranquinho) */
  carimbos?: number[];
  zoom?: (t: number) => number;
}) {
  const grau = Math.PI / 180;
  const guinada = (t: number) => seguir(t, 0, o.guinadas) - 6 * sino(t, 0.4, 2.0) + 5 * sino(t, 2.0, 3.6) + 1.1 * ruido(t, 1);
  return (t: number): Camera => {
    const vel = o.mov.velEm(t), z = o.mov.zEm(t), dist = z - o.mov.z0;
    const amp = limitar(vel / o.mov.vel);
    const passo = dist * ((2 * Math.PI) / 1.5);
    const dt = 1 / 60;
    const giroVel = t > 0.1 ? (guinada(t) - guinada(t - dt)) / dt : 0;
    const car = (o.carimbos ?? []).reduce((s, c) => s + batida(t, c, 11) * Math.sin((t - c) * 70), 0);
    return {
      x: (o.x ?? 0) + 0.06 * Math.sin(passo / 2) * amp,
      y: 2.3 + 0.06 * Math.sin(passo) * amp + 0.012 * Math.sin(t * 1.5),
      z,
      guinada: guinada(t) * grau,
      hor: seguir(t, 800, o.horizontes) + 12 * Math.sin(passo + 0.8) * amp + 9 * ruido(t, 4),
      rolo: 1.0 * Math.sin(passo / 2 + 0.4) * amp + 0.45 * ruido(t, 7),
      vel,
      dist,
      giroVel,
      zoom: o.zoom ? o.zoom(t) : 1,
      tremor: [6 * car, 4 * car * Math.cos(t * 40)],
    };
  };
}
