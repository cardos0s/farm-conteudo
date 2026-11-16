import { type BoiP, type CenaPasto, type Cerca } from "../comum/Pasto";
import { criarCamera, criarMovimento, montarFalas } from "../comum/tempo";
import { aleatorio } from "../pesagem/Mundo";
import { prog } from "../pesagem/roteiro";
import voz from "./voz.json";

// Reel "Suplementação na seca": por que o boi perde peso na seca, o boi sanfona, o proteinado no cocho,
// a conta do consumo, os cuidados e a comparação de ganho no app.

export const R = montarFalas(voz);
const { F, quando } = R;
export const T = {
  vem: quando(0, "vem"),
  verde: quando(1, "verde"), proteina: quando(1, "proteína"), energia: quando(1, "energia"), ganha: quando(1, "ganha"), sal: quando(1, "sal"),
  seca: F(2), despenca: quando(2, "despenca"), rumen: quando(2, "rúmen"), comeMenos: quando(2, "come"),
  sanfona: quando(3, "sanfona"), ganhaAguas: quando(3, "ganha"), perde: quando(3, "perde"), umAno: quando(3, "um"),
  proteinado: quando(4, "proteinado"), falta: quando(4, "falta"), aproveitar: quando(4, "aproveitar"),
  grama: quando(5, "grama"), boi400: quando(5, "quatrocentos"), g400: quando(5, "quatrocentos", 1),
  coberto: quando(6, "coberto"), espaco: quando(6, "espaço"), sobrando: quando(6, "capim"), naoSubstitui: quando(6, "suplemento"),
  segura: quando(7, "segura"), app: quando(7, "rebanho") - 0.4, aguas: quando(7, "águas"), daSeca: quando(7, "seca"), pagando: quando(7, "pagando"), segue: quando(7, "segue"),
};
/** 0 = águas (verde), 1 = seca: o pasto seca diante da câmera. */
export const secura = (t: number) => prog(t, T.seca + 0.2, 3.4);
/** Proteína bruta do capim (%), em números redondos de exemplo. */
export const PB_AGUAS = 11, PB_SECA = 4, PB_MINIMO = 7;

export const mov = criarMovimento(-5, 1.2, [[F(4) - 1.5, F(4) - 0.1, -1]]);
export const Z_PARADA = mov.zEm(F(4) + 1);
export const CARIMBOS = [F(1) + 0.3, T.despenca, T.sanfona, T.proteinado, T.grama, T.naoSubstitui];
export const camera = criarCamera({
  mov,
  guinadas: [
    { t: F(1) - 0.2, dur: 1.1, v: 30 },
    { t: F(2) - 0.2, dur: 1.2, v: -22 },
    { t: F(3) - 0.2, dur: 1.2, v: 6 },
    { t: F(4) - 0.6, dur: 1.2, v: -44 }, // o cocho coberto, com o gado no proteinado
    { t: F(7) - 0.2, dur: 1.4, v: -30 },
  ],
  horizontes: [{ t: F(4) - 0.6, dur: 1.2, v: 720 }],
  carimbos: CARIMBOS,
});

const EST = 2.5;
const cercas: Cerca[] = [];
for (const s of [-1, 1]) cercas.push({ a: [s * EST, -40], b: [s * EST, 130], tipo: "arame" });
cercas.push({ a: [EST, 52], b: [56, 52], tipo: "arame" }, { a: [-EST, 70], b: [-56, 70], tipo: "arame" });
const COCHO = { x: -6.8, z: Z_PARADA + 6.6 };
const r = aleatorio(31);
const bois: BoiP[] = [];
for (let i = 0; i < 22; i++) {
  const lado = i % 2 ? 1 : -1, anda = r() < 0.25 ? 0.28 : 0, vira = r() < 0.5, x0 = lado * (6.5 + r() * 34), z = -6 + r() * 70;
  if (Math.hypot(x0 - COCHO.x, z - COCHO.z) < 6 || (lado < 0 && z > COCHO.z - 9 && z < COCHO.z + 3 && x0 > -22)) continue;
  bois.push({ x: anda ? (t) => x0 + anda * t * (vira ? -1 : 1) : x0, z, pelagem: r() < 0.7 ? "branco" : r() < 0.6 ? "cinza" : "caramelo", vira, esc: 0.92 + r() * 0.12, semente: r() * 9, pasta: anda ? 0 : r() < 0.75 ? 1 : 0, passo: anda ? (t) => t * 11 * anda + i : undefined });
}
// no cocho coberto, comendo o proteinado
for (const s of [-1, 1]) for (let j = 0; j < 3; j++) bois.push({ x: COCHO.x + s * (2.5 + (j % 2) * 0.25), z: COCHO.z + (j - 1) * 0.55, pelagem: j === 1 ? "cinza" : "branco", vira: s > 0, esc: 1 + r() * 0.06, semente: r() * 9, pasta: (t) => 0.75 * prog(t, F(4) - 2 + j * 0.4, 1.2) });
export const cena: CenaPasto = {
  piquetes: [{ x0: -56, x1: -EST, z0: -40, z1: 70, capim: 0.26 }, { x0: EST, x1: 56, z0: -40, z1: 52, capim: 0.28 }, { x0: EST, x1: 56, z0: 52, z1: 130, capim: 0.2 }, { x0: -56, x1: -EST, z0: 70, z1: 130, capim: 0.22 }],
  cercas,
  bois,
  objetos: [
    { ...COCHO, tipo: "cochoCoberto", esc: 1.15 }, { x: 7.5, z: 10, tipo: "cocho" }, { x: 12, z: 30, tipo: "bebedouro" }, { x: -14, z: COCHO.z + 9, tipo: "bebedouro" },
    { x: 26, z: 18, tipo: "arvore", variante: 1 }, { x: -30, z: 14, tipo: "arvore", esc: 1.5 }, { x: 34, z: 60, tipo: "arvore", variante: 0 }, { x: -40, z: 60, tipo: "arvore", variante: 1 },
  ],
  estrada: { x0: -EST, x1: EST, z0: -50, z1: 200 },
  seco: secura,
};
