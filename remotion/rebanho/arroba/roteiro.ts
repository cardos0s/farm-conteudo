import { type BoiP, type CenaPasto, type Cerca } from "../comum/Pasto";
import { criarCamera, criarMovimento, montarFalas } from "../comum/tempo";
import { batida, prog } from "../pesagem/roteiro";
import voz from "./voz.json";

// Reel "Do peso vivo à arroba": arroba = 15 kg de carcaça, rendimento, a conta passo a passo,
// o atalho de dividir por 30 e as arrobas do lote no app.

export const R = montarFalas(voz);
const { F, quando } = R;
export const PESO = 540, REND = 54, CARCACA = Math.round((PESO * REND) / 100), ARROBAS = "19,5", ATALHO = PESO / 30;
export const T = {
  vem: quando(0, "vem"),
  arroba: quando(1, "arroba"), quinze: quando(1, "quinze"), carcaca: quando(1, "carcaça"), nao: quando(1, "não"),
  sobra: quando(2, "sobra"), itens: ["couro", "cabeça", "patas", "vísceras"].map((p) => quando(2, p)), parte: quando(2, "parte"), rendimento: quando(2, "rendimento"),
  cinquenta: quando(3, "cinquenta"), fatores: ["raça", "acabamento", "jejum"].map((p) => quando(3, p)),
  pesa: quando(4, "quinhentos"), vezes: quando(4, "vezes"), da: quando(4, "duzentos"),
  dividindo: quando(5, "dividindo"), dezenove: quando(5, "dezenove"),
  atalho: quando(6, "atalho"), dividir: quando(6, "dividir"), trinta: quando(6, "trinta"), dezoito: quando(6, "dezoito"), so50: quando(6, "cinquenta"), rende: quando(6, "rende"),
  app: F(7) + 0.3, foto: quando(7, "foto"), arrobasLote: quando(7, "arrobas"), escolher: quando(7, "rendimento"), segue: quando(7, "segue"),
};
export const T_RESULTADO = T.dezenove + 0.9;

export const mov = criarMovimento(-7, 1.5, [[F(1) + 1.0, F(1) + 2.6, -1]]);
export const CARIMBOS = [T.quinze, T.rendimento, T.cinquenta, T.pesa, T.dezoito];
export const camera = criarCamera({
  mov,
  x: 0.2,
  guinadas: [{ t: F(1) + 1.2, dur: 1.2, v: 6 }, { t: F(6) - 0.2, dur: 1.2, v: 32 }, { t: T.rende - 1.0, dur: 1.2, v: 6 }],
  horizontes: [{ t: F(1) + 1.0, dur: 1.4, v: 760 }],
  carimbos: CARIMBOS,
  zoom: (t) => 1 + 0.05 * batida(t, T_RESULTADO, 3) + 0.06 * prog(t, F(1) + 2, 3),
});

const cercas: Cerca[] = [
  { a: [-14, 0], b: [-2.6, 0], tipo: "tabua" }, { a: [2.6, 0], b: [14, 0], tipo: "tabua" },
  { a: [14, 0], b: [14, 27], tipo: "tabua" }, { a: [14, 27], b: [-14, 27], tipo: "tabua" }, { a: [-14, 27], b: [-14, 0], tipo: "tabua" },
  { a: [-3.4, -40], b: [-3.4, 0], tipo: "arame" }, { a: [3.4, -40], b: [3.4, 0], tipo: "arame" },
];
/** O boi da conta: de lado, bem na frente. */
export const BOI = { x: 1.0, z: 12.6 };
const bois: BoiP[] = [
  { x: BOI.x, z: BOI.z, pelagem: "branco", esc: 1.1, semente: 2, brinco: "27", atento: (t) => prog(t, 4, 1.5) },
  { x: -6.5, z: 17, pelagem: "cinza", vira: true, esc: 0.98 }, { x: 7.5, z: 19.5, pelagem: "branco", esc: 1 }, { x: -9.5, z: 9.5, pelagem: "branco", esc: 0.96 },
  { x: 10, z: 11.5, pelagem: "caramelo", vira: true, esc: 1 }, { x: (t) => -11 + 0.35 * t, z: 23, pelagem: "branco", esc: 0.95, passo: (t) => t * 3.9 },
  { x: 5, z: 24.5, pelagem: "cinza", vira: true, esc: 0.97, pasta: 0.9 }, { x: 12, z: 5, pelagem: "branco", vira: true, esc: 1.02 },
  { x: -26, z: 40, pasta: 1 }, { x: 24, z: 46, vira: true, pasta: 1 }, { x: 32, z: 22, pasta: 1 }, { x: -34, z: 18, vira: true, pasta: 1 },
];
export const cena: CenaPasto = {
  piquetes: [
    { x0: -70, x1: -3.4, z0: -40, z1: 130, capim: 0.2 }, { x0: 3.4, x1: 70, z0: -40, z1: 130, capim: 0.2 }, { x0: -3.4, x1: 3.4, z0: 27, z1: 130, capim: 0.2 },
    { x0: -14, x1: 14, z0: 0, z1: 27, capim: 0, terra: true },
  ],
  cercas,
  bois,
  objetos: [
    { x: 0, z: 0, tipo: "porteira" }, { x: 5.2, z: -0.4, tipo: "placa", texto: "CURRAL" }, { x: 5.2, z: 25.6, tipo: "cocho" },
    { x: -19, z: 10, tipo: "arvore", esc: 1.5 }, { x: 22, z: 30, tipo: "arvore", variante: 1 }, { x: -30, z: 50, tipo: "arvore", variante: 2 },
  ],
  estrada: { x0: -2.4, x1: 2.4, z0: -50, z1: 0 },
};
