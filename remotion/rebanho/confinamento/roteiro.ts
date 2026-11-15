import { Easing } from "remotion";
import { type Camera, batida, fora, lerp, limitar, prog, ruido } from "../pesagem/roteiro";
import voz from "./voz.json";

// Reel "Confinamento por dentro" (1080x1920, primeira pessoa, em cima do cavalo).
// 1. chegada · 2. lotes por peso · 3. adaptação da dieta · 4. leitura de cocho · 5. trato e água
// 6. evolução do lote no app · 7. fecho. Narração por scripts/rebanho/narrar.py confinamento.

export const FPS = 30;
export const L = 1080;
export const A = 1920;

type Fala = { arquivo: string; texto: string; duracao: number; palavras: { p: string; i: number; f: number }[] };
export const falas = voz as Fala[];

/** Cada fala começa um respiro depois da anterior. */
const PAUSA = 0.45;
export const INICIO_FALA: number[] = [];
falas.forEach((f, i) => INICIO_FALA.push(i === 0 ? 0.3 : INICIO_FALA[i - 1]! + falas[i - 1]!.duracao + PAUSA));
const F = INICIO_FALA as [number, number, number, number, number, number, number];
export const DURACAO = Math.ceil(F[6] + falas[6]!.duracao + 2.2);
export const TOTAL_QUADROS = FPS * DURACAO;

export function quando(n: number, inicio: string, k = 0): number {
  const w = falas[n]!.palavras.filter((x) => x.p.toLowerCase().startsWith(inicio.toLowerCase()))[k];
  if (!w) throw new Error(`Palavra "${inicio}" (${k}) não está na fala ${n + 1}`);
  return INICIO_FALA[n]! + w.i;
}

export const T = {
  titulo: ["já", "viu", "um", "confinamento", "por", "dentro"].map((p) => quando(0, p)),
  vem: quando(0, "vem"),
  chega: F[1],
  trezentos: quando(1, "trezentos"),
  lotes: quando(1, "lotes"),
  adaptacao: F[2],
  quinze: quando(2, "quinze"),
  dieta: quando(2, "dieta"),
  concentrado: quando(2, "concentrado"),
  leitura: quando(3, "leitura"),
  sobrou: quando(3, "sobrou"),
  diminui: quando(3, "diminui"),
  raspou: quando(3, "raspou"),
  aumenta: quando(3, "aumenta"),
  trato: F[4],
  silagem: quando(4, "silagem"),
  milho: quando(4, "milho"),
  farelo: quando(4, "farelo"),
  nucleo: quando(4, "núcleo"),
  agua: quando(4, "água"),
  evolucao: F[5],
  foto: quando(5, "foto"),
  olha: quando(5, "olha"),
  de380: quando(5, "trezentos"),
  para540: quando(5, "quinhentos"),
  cem: quando(5, "cem"),
  gmd: quando(5, "um", 1),
  seiscentos: quando(5, "seiscentos"),
  fecho: F[6],
  segue: quando(6, "segue"),
};

// ── Celular ──
export const T_CEL_SOBE = T.evolucao + 0.5;
export const T_TRAVA = T.foto - 0.6;
export const T_CLIQUE = T.foto + 0.2;
export const T_PESO = T_CLIQUE + 0.45;
export const T_EVOL = T.olha - 0.05;
export const T_CEL_DESCE = T.segue - 0.1;
export const T_GMD = T.seiscentos + 0.35;

// ── Números do lote ──
export const ENTRADA = 380;
export const SAIDA = 540;
export const DIAS = 100;
export const GMD = (SAIDA - ENTRADA) / DIAS;
/** Pesagens por foto: dia e peso. */
export const FOTOS = [0, 30, 60, 100].map((dia) => ({ dia, peso: Math.round(ENTRADA + GMD * dia) }));

// ── Movimento ──
const VEL = 1.5; // passo do cavalo (m/s)
const Z0 = -3.5;
/** Integral de uma rampa suave que vai de 0 a 1 entre a e b. */
function rampa(t: number, a: number, b: number): number {
  if (t <= a) return 0;
  if (t >= b) return (b - a) / 2 + (t - b);
  const u = (t - a) / (b - a);
  return (b - a) * (u * u * u - (u * u * u * u) / 2);
}
const degrau = (t: number, a: number, b: number) => { const u = limitar((t - a) / (b - a)); return u * u * (3 - 2 * u); };
// anda, para na leitura de cocho, segue o vagão no trato e para de novo para a foto
const PARA_1: [number, number] = [F[3] - 1.0, F[3] + 0.4];
const SEGUE: [number, number] = [F[4] + 0.3, F[4] + 1.5];
const PARA_2: [number, number] = [F[5] - 1.4, F[5]];
export const velEm = (t: number) => VEL * (1 - degrau(t, ...PARA_1) + degrau(t, ...SEGUE) - degrau(t, ...PARA_2));
export const zEm = (t: number) => Z0 + VEL * (t - rampa(t, ...PARA_1) + rampa(t, ...SEGUE) - rampa(t, ...PARA_2));

export const X_CAM = 0.5;
export const Z_LEITURA = zEm(F[3] + 1);
export const Z_PARADA = zEm(F[5] + 0.2);
/** O vagão espera à frente e sai distribuindo o trato no cocho da esquerda. */
export const X_VAGAO = -1.35;
const Z_VAGAO0 = Z_LEITURA + 9;
const SAI_VAGAO: [number, number] = [F[4] + 0.1, F[4] + 1.2];
export const vagaoVel = (t: number) => 1.75 * degrau(t, ...SAI_VAGAO);
export const vagaoZ = (t: number) => Z_VAGAO0 + 1.75 * rampa(t, ...SAI_VAGAO);
/** Até onde o cocho da esquerda já recebeu trato. */
export const tratoAte = (t: number) => vagaoZ(t) - 2.4;
export const TRATO_DESDE = Z_VAGAO0 - 2.4;

const grau = Math.PI / 180;
export const GUINADA_BOI = 70;
const DIST_BOI = 8;
export const BOI_FOTO = { x: X_CAM + DIST_BOI * Math.sin(GUINADA_BOI * grau), z: Z_PARADA + DIST_BOI * Math.cos(GUINADA_BOI * grau) };
export const BEBEDOURO = { x: 7.1, z: zEm(T.agua + 0.2) + 7.4 };

type Chave = { t: number; dur: number; v: number };
const seguir = (t: number, inicial: number, chaves: Chave[]) => chaves.reduce((v, c) => lerp(v, c.v, prog(t, c.t, c.dur, Easing.inOut(Easing.cubic))), inicial);
const GUINADAS: Chave[] = [
  { t: F[1] + 0.2, dur: 0.9, v: 27 }, // os lotes, à direita
  { t: F[2] - 0.1, dur: 1.0, v: -24 }, // o gado no cocho, à esquerda
  { t: F[3] - 0.4, dur: 1.0, v: -52 }, // de frente para o cocho
  { t: F[4] - 0.2, dur: 0.9, v: -9 }, // o vagão saindo
  { t: T.agua - 0.5, dur: 0.7, v: 42 }, // o bebedouro
  { t: F[5] - 0.15, dur: 0.8, v: GUINADA_BOI }, // o boi da foto
  { t: T_CEL_DESCE, dur: 1.6, v: 24 },
];
const HORIZONTES: Chave[] = [
  { t: F[3] - 0.4, dur: 1.0, v: 520 },
  { t: F[4] - 0.2, dur: 0.9, v: 800 },
  { t: T_CEL_SOBE - 0.5, dur: 1.0, v: 400 },
  { t: T_CEL_DESCE, dur: 1.2, v: 760 },
];
const sino = (t: number, de: number, ate: number) => (t <= de || t >= ate ? 0 : Math.sin((Math.PI * (t - de)) / (ate - de)) ** 2);
const guinadaGraus = (t: number) => seguir(t, 0, GUINADAS) - 7 * sino(t, 0.4, 2.0) + 6 * sino(t, 2.0, 3.6) + 1.1 * ruido(t, 1);

/** Instantes em que um adesivo "carimba" a tela (dão um tranquinho na câmera e um som). */
export const CARIMBOS = [T.trezentos, T.quinze - 0.1, T.leitura - 0.1, T.aumenta, T.trato + 0.3];

export function camera(t: number): Camera {
  const vel = velEm(t), z = zEm(t), dist = z - Z0;
  const amp = limitar(vel / VEL);
  const passo = dist * ((2 * Math.PI) / 1.5);
  const dt = 1 / 60;
  const giroVel = t > 0.1 ? (guinadaGraus(t) - guinadaGraus(t - dt)) / dt : 0;
  const carimbo = CARIMBOS.reduce((s, c) => s + batida(t, c, 11) * Math.sin((t - c) * 70), 0);
  return {
    x: X_CAM + 0.06 * Math.sin(passo / 2) * amp,
    y: 2.3 + 0.06 * Math.sin(passo) * amp + 0.012 * Math.sin(t * 1.5),
    z,
    guinada: guinadaGraus(t) * grau,
    hor: seguir(t, 800, HORIZONTES) + 12 * Math.sin(passo + 0.8) * amp + 9 * ruido(t, 4),
    rolo: 1.0 * Math.sin(passo / 2 + 0.4) * amp + 0.45 * ruido(t, 7),
    vel,
    dist,
    giroVel,
    zoom: 1 + 0.012 * batida(t, T_CLIQUE, 9) + 0.05 * batida(t, T_GMD, 3) + 0.05 * prog(t, T_CEL_DESCE + 0.4, 3.6, fora),
    tremor: [6 * carimbo, 4 * carimbo * Math.cos(t * 40)],
  };
}
