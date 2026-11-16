import { type BoiP, type CenaPasto, type Cerca } from "../comum/Pasto";
import { type Chave, criarCamera, criarMovimento, montarFalas, seguir } from "../comum/tempo";
import { aleatorio } from "../pesagem/Mundo";
import voz from "./voz.json";

// Reel "Cria, recria e engorda": as três fases do boi, com o peso de cada marco, e a curva de peso no app.

export const R = montarFalas(voz);
const { F, quando } = R;
export const T = {
  vem: quando(0, "vem"),
  cria: quando(1, "cria"), nasce: quando(1, "trinta"), mamando: quando(1, "mamando"), pastar: quando(1, "aprendendo"),
  meses: quando(2, "sete"), desmama: quando(2, "desmama"), duzentos: quando(2, "duzentos"),
  recria: quando(3, "recria"), partes: ["osso", "músculo", "carcaça"].map((p) => quando(3, p)), pasto: quando(3, "pasto"),
  longa: quando(4, "longa"), garrote: quando(4, "garrote"), demora: quando(4, "demora"),
  trezentos: quando(5, "trezentos"), engorda: quando(5, "engorda"), rapido: quando(5, "ganhar"), gordura: quando(5, "acabamento"),
  quinhentos: quando(6, "quinhentos"), abate: quando(6, "pronto"), trintaMeses: quando(6, "antes"),
  app: F(7) + 0.3, cadaFase: quando(7, "cada"), atrasado: quando(7, "atrasado"), segue: quando(7, "segue"),
};
/** Marcos da vida do boi: idade (meses) e peso (kg). */
export const MARCOS = [{ mes: 0, kg: 35, nome: "nasce" }, { mes: 8, kg: 200, nome: "desmama" }, { mes: 20, kg: 380, nome: "entra na engorda" }, { mes: 27, kg: 540, nome: "abate" }];
const POSICAO: Chave[] = [
  { t: T.nasce + 0.6, dur: T.desmama - T.nasce, v: 8 },
  { t: T.recria, dur: T.demora + 1.2 - T.recria, v: 19 },
  { t: T.trezentos - 0.2, dur: 0.6, v: 20 },
  { t: T.rapido - 0.3, dur: T.quinhentos + 0.4 - T.rapido, v: 27 },
];
/** Idade (meses) em que a marcação da linha do tempo está no instante t. */
export const idadeEm = (t: number) => seguir(t, 0, POSICAO);

export const mov = criarMovimento(-6, 1.15, [[F(7) - 1.4, F(7), -1]]);
export const CARIMBOS = [T.cria, T.duzentos, T.recria, T.engorda, T.quinhentos];
export const camera = criarCamera({
  mov,
  guinadas: [
    { t: F(1) - 0.2, dur: 1.1, v: -40 }, // vacas e bezerros, à esquerda
    { t: F(3) - 0.3, dur: 1.2, v: 40 }, // os garrotes da recria, à direita
    { t: F(5) - 0.3, dur: 1.2, v: -34 }, // os bois na engorda, à esquerda
    { t: F(6) + 2.6, dur: 1.4, v: -8 },
  ],
  horizontes: [{ t: F(1), dur: 1, v: 770 }],
  carimbos: CARIMBOS,
});

const EST = 2.5, Z_ENG = 44;
const cercas: Cerca[] = [];
for (const s of [-1, 1]) cercas.push({ a: [s * EST, -40], b: [s * EST, 120], tipo: "arame" });
cercas.push({ a: [-EST, Z_ENG], b: [-52, Z_ENG], tipo: "tabua" }, { a: [-EST, 100], b: [-52, 100], tipo: "arame" });
const r = aleatorio(23);
const bois: BoiP[] = [];
// cria: vaca com o bezerro ao pé
for (let i = 0; i < 9; i++) {
  const x = -(6 + r() * 30), z = -4 + r() * 42, vira = r() < 0.5, lado = vira ? -1 : 1;
  bois.push({ x, z, pelagem: r() < 0.75 ? "branco" : "cinza", vira, esc: 0.96 + r() * 0.08, semente: r() * 9, pasta: r() < 0.6 ? 1 : 0 });
  const mama = r() < 0.4;
  bois.push({ x: x - lado * (mama ? 0.5 : 1.5 + r()), z: z + (mama ? -0.25 : 0.6 - r()), pelagem: r() < 0.5 ? "caramelo" : "branco", vira: mama ? !vira : vira, esc: 0.46 + r() * 0.08, semente: r() * 9, pasta: mama ? 0.35 : r() < 0.5 ? 1 : 0 });
}
// recria: garrotes crescendo no pasto
for (let i = 0; i < 14; i++) {
  const anda = r() < 0.25 ? 0.3 : 0, vira = r() < 0.5, x0 = 6 + r() * 34;
  bois.push({ x: anda ? (t) => x0 + anda * t * (vira ? -1 : 1) : x0, z: 14 + r() * 62, pelagem: r() < 0.7 ? "branco" : r() < 0.5 ? "cinza" : "caramelo", vira, esc: 0.74 + r() * 0.08, semente: r() * 9, pasta: anda ? 0 : r() < 0.7 ? 1 : 0, passo: anda ? (t) => t * 11 * anda + i : undefined });
}
// engorda: bois grandes no cocho
const COCHOS = [{ x: -10, z: 58 }, { x: -22, z: 66 }, { x: -9, z: 78 }, { x: -30, z: 84 }];
for (const c of COCHOS) for (const s of [-1, 1]) for (let j = 0; j < 2; j++) bois.push({ x: c.x + s * (2.5 + j * 0.2), z: c.z + (j ? 0.5 : -0.4), pelagem: r() < 0.8 ? "branco" : "cinza", vira: s > 0, esc: 1.1 + r() * 0.06, semente: r() * 9, pasta: r() < 0.75 ? 0.75 : 0 });
for (let i = 0; i < 5; i++) bois.push({ x: -(8 + r() * 38), z: 50 + r() * 44, vira: r() < 0.5, esc: 1.1, semente: r() * 9 });
export const cena: CenaPasto = {
  piquetes: [
    { x0: -52, x1: -EST, z0: -40, z1: Z_ENG, capim: 0.22 }, { x0: EST, x1: 52, z0: -40, z1: 120, capim: 0.26 },
    { x0: -52, x1: -EST, z0: Z_ENG, z1: 100, capim: 0.08 }, { x0: -52, x1: -EST, z0: 100, z1: 160, capim: 0.2 },
  ],
  cercas,
  bois,
  objetos: [
    { x: -4.4, z: 3, tipo: "placa", texto: "CRIA" }, { x: 4.4, z: 20, tipo: "placa", texto: "RECRIA" }, { x: -4.4, z: Z_ENG + 1, tipo: "placa", texto: "ENGORDA" },
    ...COCHOS.map((c) => ({ ...c, tipo: "cochoCoberto" as const })),
    { x: -16, z: 20, tipo: "bebedouro" }, { x: 12, z: 40, tipo: "bebedouro" }, { x: 9, z: 58, tipo: "cocho" }, { x: -18, z: 52, tipo: "bebedouro" },
    { x: -30, z: 10, tipo: "arvore", esc: 1.5 }, { x: 28, z: 56, tipo: "arvore", variante: 1 }, { x: -44, z: 70, tipo: "arvore", variante: 2 }, { x: 40, z: 8, tipo: "arvore", variante: 0 },
  ],
  estrada: { x0: -EST, x1: EST, z0: -50, z1: 200 },
};
