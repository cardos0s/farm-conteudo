import { type BoiP, type CenaPasto, type Cerca, type Objeto, type Piquete } from "../comum/Pasto";
import { criarCamera, criarMovimento, montarFalas } from "../comum/tempo";
import { aleatorio } from "../pesagem/Mundo";
import { lerp, prog } from "../pesagem/roteiro";
import voz from "./voz.json";

// Reel "Pasto rotacionado": contínuo x rotacionado, piquetes, altura de entrada e saída, descanso,
// água e sal, lotação e o controle de piquetes no app.

export const R = montarFalas(voz);
const { F, quando } = R;
export const T = {
  vem: quando(0, "vem"),
  rapa: quando(1, "rapa"), larga: quando(1, "larga"), falhando: quando(1, "falhando"),
  piquetes: quando(2, "piquetes"), cerca: quando(2, "cerca"), umPorVez: quando(2, "um"), descansam: quando(2, "descansam"),
  altura: quando(3, "altura"), trinta: quando(3, "trinta"), quinze: quando(3, "quinze"), nunca: quando(3, "nunca"),
  rebrotar: quando(4, "rebrotar"), descansa: quando(4, "descansa"), dias: quando(4, "dias"), seca: quando(4, "seca"),
  agua: quando(5, "água"), sal: quando(5, "sal"), praca: quando(5, "praça"),
  lotacao: quando(6, "lotação"), uma: quando(6, "uma"), tres: quando(6, "três"),
  app: F(7) + 0.3, piquete: quando(7, "piquete"), faltam: quando(7, "faltam"), peso: quando(7, "peso"), segue: quando(7, "segue"),
};
/** O capim do piquete em descanso cresce diante da câmera (15 → 30 cm) enquanto os dias passam. */
export const rebrota = (t: number) => prog(t, T.rebrotar - 0.4, T.dias + 1.0 - T.rebrotar + 0.4, (x) => x);

export const mov = criarMovimento(4, 1.5, [[F(3) - 1.3, F(3) + 0.3, -1], [F(5) - 0.3, F(5) + 0.9, 1], [F(7) - 1.3, F(7), -1]]);
export const CARIMBOS = [F(1) + 0.3, T.piquetes, T.altura, T.descansa, T.agua, T.lotacao];
export const camera = criarCamera({
  mov,
  guinadas: [
    { t: F(1) - 0.1, dur: 1.0, v: -36 }, // o pasto contínuo, à esquerda
    { t: F(2) - 0.2, dur: 1.0, v: 0 },
    { t: F(3) - 0.5, dur: 1.0, v: 46 }, // o lote pastando no piquete da direita
    { t: F(4) - 0.3, dur: 1.1, v: -48 }, // o piquete em descanso, à esquerda
    { t: F(5) - 0.3, dur: 1.0, v: 14 }, // água e sal mais à frente
    { t: F(6) - 0.2, dur: 1.0, v: -6 },
  ],
  horizontes: [{ t: F(3) - 0.5, dur: 1.0, v: 640 }, { t: F(5) - 0.3, dur: 1.0, v: 800 }],
  carimbos: CARIMBOS,
});

// ── A fazenda ──
const EST = 2.5, LARG = 50, Z_ROT = 38, FUNDO = 34;
const piquetes: Piquete[] = [
  { x0: -60, x1: -EST, z0: -30, z1: Z_ROT, capim: 0.06, falhado: true },
  { x0: EST, x1: 60, z0: -30, z1: Z_ROT, capim: 0.06, falhado: true },
];
const ALT_DIR = [0.3, 0.15, 0.3, 0.24], ALT_ESQ = [0.15, 0.22, 0.28, 0.18];
for (let i = 0; i < 4; i++) {
  const z0 = Z_ROT + i * FUNDO;
  piquetes.push({ x0: EST, x1: LARG, z0, z1: z0 + FUNDO, capim: ALT_DIR[i]! });
  piquetes.push({ x0: -LARG, x1: -EST, z0, z1: z0 + FUNDO, capim: i === 0 ? (t) => lerp(0.15, 0.31, rebrota(t)) : ALT_ESQ[i]! });
}
const cercas: Cerca[] = [];
for (const s of [-1, 1]) {
  cercas.push({ a: [s * EST, -30], b: [s * EST, Z_ROT + 4 * FUNDO], tipo: "arame" });
  for (let i = 0; i <= 4; i++) cercas.push({ a: [s * EST, Z_ROT + i * FUNDO], b: [s * LARG, Z_ROT + i * FUNDO], tipo: "arame" });
}
const r = aleatorio(4);
const cor = () => { const x = r(); return x < 0.7 ? "branco" : x < 0.88 ? "cinza" : "caramelo"; };
const bois: BoiP[] = [];
// contínuo: gado espalhado, catando o capim novo
for (let i = 0; i < 16; i++) {
  const lado = i % 2 ? 1 : -1, anda = r() < 0.3 ? 0.3 : 0, vira = r() < 0.5, x0 = lado * (6 + r() * 36);
  bois.push({ x: anda ? (t) => x0 + anda * t * (vira ? -1 : 1) : x0, z: -6 + r() * 40, pelagem: cor(), vira, esc: 0.9 + r() * 0.12, semente: r() * 9, pasta: anda ? 0 : 1, passo: anda ? (t) => t * 11 * anda + i : undefined });
}
// rotacionado: o lote inteiro junto, no piquete da vez
for (let i = 0; i < 16; i++) bois.push({ x: 6 + r() * 26, z: Z_ROT + 5 + r() * 24, pelagem: cor(), vira: r() < 0.5, esc: 0.94 + r() * 0.1, semente: r() * 9, pasta: r() < 0.8 ? 1 : 0 });
const objetos: Objeto[] = [
  { x: 0, z: Z_ROT, tipo: "porteira" },
  { x: 4.4, z: Z_ROT - 0.6, tipo: "placa", texto: "PIQUETE 1" },
  { x: -4.4, z: Z_ROT - 0.6, tipo: "placa", texto: "PIQUETE 2" },
  { x: 4.6, z: Z_ROT + FUNDO - 0.6, tipo: "placa", texto: "PIQUETE 3" },
  { x: 4.2, z: 62, tipo: "bebedouro" },
  { x: -4.6, z: 63, tipo: "cochoCoberto" },
  { x: 30, z: 20, tipo: "arvore", variante: 1 }, { x: -34, z: 28, tipo: "arvore", variante: 0 }, { x: 40, z: 96, tipo: "arvore", variante: 2 }, { x: -42, z: 120, tipo: "arvore", variante: 1 },
];
export const cena: CenaPasto = { piquetes, cercas, bois, objetos, estrada: { x0: -EST, x1: EST, z0: -40, z1: 220 } };
