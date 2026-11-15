import { Easing } from "remotion";
import voz from "./voz.json";

// Reel "Bora pesar o gado sem balança?" (1080x1920, primeira pessoa, em cima do cavalo).
// A narração (voz Davi, ElevenLabs) é gerada por scripts/rebanho/narrar.py; os tempos das
// animações saem do alinhamento palavra a palavra em voz.json.

export const FPS = 30;
export const DURACAO = 27;
export const TOTAL_QUADROS = FPS * DURACAO;
export const L = 1080;
export const A = 1920;

type Fala = { arquivo: string; texto: string; duracao: number; palavras: { p: string; i: number; f: number }[] };
export const falas = voz as Fala[];

/** Início de cada fala no vídeo (s): porteira, foto, próximos, fecho. */
export const INICIO_FALA = [0.4, 3.2, 14.2, 20.5];

/** Instante do vídeo em que começa a k-ésima palavra que inicia com `inicio` na fala `n`. */
export function quando(n: number, inicio: string, k = 0): number {
  const achadas = falas[n]!.palavras.filter((w) => w.p.toLowerCase().startsWith(inicio.toLowerCase()));
  const w = achadas[k];
  if (!w) throw new Error(`Palavra "${inicio}" (${k}) não está na fala ${n + 1}`);
  return INICIO_FALA[n]! + w.i;
}

export const T = {
  vem: quando(0, "vem"),
  chuta: quando(1, "chuta"),
  abro: quando(1, "abro"),
  enquadro: quando(1, "enquadro"),
  foto: quando(1, "foto"),
  peso1: quando(1, "quinhentos"),
  quilos: quando(1, "quilos"),
  tronco: quando(1, "tronco"),
  balanca: quando(1, "balança"),
  estresse: quando(1, "estresse"),
  proximo: quando(2, "bora"),
  esse2: quando(2, "esse", 0),
  peso2: quando(2, "quatrocentos"),
  esse3: quando(2, "esse", 1),
  peso3: quando(2, "quinhentos"),
  quarenta: quando(2, "quarenta"),
  assim: quando(3, "é"),
  segue: quando(3, "segue"),
};

/** Os três bois pesados: posição no curral (m), direção em que a câmera olha e momentos da foto. */
export const CAM_PARADA = { x: 0, z: 6 };
const DIST = 5.5;
const grau = Math.PI / 180;
const alvo = (g: number) => ({ x: CAM_PARADA.x + DIST * Math.sin(g * grau), z: CAM_PARADA.z + DIST * Math.cos(g * grau) });

export const PESAGENS = [
  { ...alvo(0), guinada: 0, peso: 512, giro: -1, trava: T.enquadro, clique: T.foto, mostra: T.peso1, conta: T.quilos - T.peso1, pelagem: "branco", vira: false },
  { ...alvo(50), guinada: 50, peso: 480, giro: T.proximo + 0.15, trava: T.esse2 - 0.1, clique: T.peso2 - 0.3, mostra: T.peso2, conta: 0.55, pelagem: "caramelo", vira: true },
  { ...alvo(100), guinada: 100, peso: 540, giro: T.esse3 - 0.45, trava: T.esse3 + 0.1, clique: T.peso3 - 0.22, mostra: T.peso3, conta: 0.5, pelagem: "cinza", vira: false },
] as const;
export const DUR_GIRO = 0.55;
export const MEDIA = Math.round(PESAGENS.reduce((s, p) => s + p.peso, 0) / PESAGENS.length);

export const T_CEL_SOBE = T.abro - 0.15;
export const T_LOTE = T.assim - 0.9;
export const T_CEL_DESCE = T.segue - 0.1;

export const suave = Easing.bezier(0.45, 0, 0.25, 1);
export const fora = Easing.out(Easing.cubic);
export const mola = Easing.out(Easing.back(1.7));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export function prog(t: number, de: number, dur: number, curva: (x: number) => number = suave): number {
  return curva(limitar((t - de) / dur));
}

/** Índice do boi em foco no instante t. */
export function boiAtual(t: number): number {
  return t < PESAGENS[1].giro ? 0 : t < PESAGENS[2].giro ? 1 : 2;
}

export type Camera = { x: number; y: number; z: number; guinada: number; hor: number; rolo: number; vel: number; dist: number; giroVel: number };

const ALTURA_OLHO = 2.3;
/** Onde está e para onde olha quem está montado, no instante t. */
export function camera(t: number): Camera {
  // trote até a porteira (3 m/s), depois freia até parar no meio do curral
  let z: number, vel: number;
  if (t <= 3) { z = -8 + 3 * t; vel = 3; }
  else {
    const tau = Math.min(t - 3, 10 / 3);
    z = 1 + 3 * tau - 0.45 * tau * tau; vel = 3 - 0.9 * tau;
  }
  const dist = z + 8;
  const amp = limitar(vel / 1.5);
  const passo = dist * ((2 * Math.PI) / 1.5);
  const g = (i: 1 | 2) => prog(t, PESAGENS[i].giro, DUR_GIRO, Easing.inOut(Easing.cubic));
  const guinadaGraus = 50 * g(1) + 50 * g(2) - 22 * prog(t, T_CEL_DESCE, 1.6) + 0.5 * Math.sin(t * 0.9) * (1 - amp);
  const dt = 1 / 60;
  const giroVel = t > 0.1 ? (50 * (g(1) + g(2)) - 50 * (prog(t - dt, PESAGENS[1].giro, DUR_GIRO, Easing.inOut(Easing.cubic)) + prog(t - dt, PESAGENS[2].giro, DUR_GIRO, Easing.inOut(Easing.cubic)))) / dt : 0;
  const hor = lerp(lerp(800, 400, prog(t, T_CEL_SOBE - 0.5, 1.0)), 760, prog(t, T_CEL_DESCE, 1.2));
  return {
    x: 0.05 * Math.sin(passo / 2) * amp,
    y: ALTURA_OLHO + 0.05 * Math.sin(passo) * amp + 0.006 * Math.sin(t * 1.6),
    z,
    guinada: guinadaGraus * grau,
    hor: hor + 7 * Math.sin(passo + 0.8) * amp,
    rolo: 0.7 * Math.sin(passo / 2 + 0.4) * amp,
    vel,
    dist,
    giroVel,
  };
}
