import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { Pose } from "../Boneco";
import { girar, k, limitar, linear, mix, mixV, norm, piscar, prog, sair, soma, sub, esc, type V3 } from "../anim";
import { ALT_CAB_LIA, olhar } from "../coreografia";
import { CABO_NA_MAO, CONCHA, PEGA_Z, caminhoDoSinal, dedo } from "./Objetos";
import { CORTES, FALAS } from "./roteiro";

export type Luz = { pos: V3; r: number; cor: string; forca: number };
export type EstadoMesa = {
  cam: { pos: V3; alvo: V3; fov: number };
  mao: { pos: V3; rot: V3; fecha: number } | null;
  colher: { pos: V3; rot: V3; comida: number };
  tigela: boolean;
  manchas: { pos: V3; tamanho: number }[];
  gota: V3 | null;
  lia: Pose | null;
  luzes: Luz[];
};

// ---------- rotações ----------
const quat = (r: V3) => new Quaternion().setFromEuler(new Euler(r[0], r[1], r[2], "YXZ"));
const compor = (a: V3, b: V3): V3 => {
  const e = new Euler().setFromQuaternion(quat(a).multiply(quat(b)), "YXZ");
  return [e.x, e.y, e.z];
};
/** A colher deitada na palma: o cabo atravessa a mão e a concha sai pelo lado do polegar. */
const COLHER_NA_MAO: V3 = (() => {
  const e = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0)), "YXZ");
  return [e.x, e.y, e.z];
})();
/** Rotação que aponta a colher numa direção, com `rola` girando em torno do próprio cabo. */
const apontar = (d: V3, rola = 0): V3 => {
  const u = norm(d);
  return [-Math.asin(limitar(u[1], -1, 1)), Math.atan2(u[0], u[2]), rola];
};
const noCaminho = (pts: V3[], t: number): V3 => {
  const x = limitar(t) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x));
  return mixV(pts[i], pts[i + 1], x - i);
};

const vazio = { tigela: false, manchas: [], gota: null, lia: null, luzes: [] as Luz[] };

// ---------- a mão segurando a colher ----------
const ROT_MAO: V3 = [-0.9, -0.2, 0.08];
const POS_MAO: V3 = [-0.03, 0.24, 0];

/** `escorrega` 0 = firme, 1 = quase caindo. `aperto` fecha mais os dedos. */
const segurando = (escorrega: number, aperto: number, comida: number) => {
  const fecha = 0.97 + 0.13 * aperto - 0.06 * Math.min(1, escorrega);
  const rot = compor(compor(ROT_MAO, COLHER_NA_MAO), [0.42 * escorrega, 0, 0]);
  const pega = soma(POS_MAO, girar(CABO_NA_MAO, ROT_MAO));
  const pos = sub(pega, girar([0, 0, PEGA_Z - 0.042 * escorrega], rot));
  return { mao: { pos: POS_MAO, rot: ROT_MAO, fecha }, colher: { pos, rot, comida } };
};

/** Um ciclo completo: escorrega, o tato avisa, o sinal sobe, a resposta desce, a mão aperta. */
const ciclo = (p: number) => ({
  escorrega: k(p, [[0, 0.08], [0.3, 0.85], [0.78, 0.85], [0.92, 0.05], [1, 0.08]]),
  toque: k(p, [[0.1, 0], [0.24, 1], [0.52, 1], [0.62, 0]]),
  sobe: (p - 0.24) / 0.32,
  desce: (p - 0.56) / 0.24,
  aperto: k(p, [[0.76, 0], [0.88, 1], [1, 0.25]]),
});

const luzesDoCiclo = (c: ReturnType<typeof ciclo>, fecha: number, f: number): Luz[] => {
  const luzes: Luz[] = [];
  const mundo = (p: V3) => soma(POS_MAO, girar(p, ROT_MAO));
  for (let i = 0; i < 4; i++) {
    const caminho = caminhoDoSinal(i, fecha);
    if (c.toque > 0.02) luzes.push({ pos: mundo(dedo(i, fecha)[3]), r: 0.0058 + 0.0015 * Math.sin(f * 0.6 + i), cor: "#FFD23F", forca: c.toque });
    for (const atraso of [0, 0.22]) {
      const s = c.sobe - i * 0.05 - atraso;
      if (s > 0 && s < 1) luzes.push({ pos: mundo(noCaminho(caminho, s)), r: 0.005, cor: "#FFD23F", forca: Math.min(1, s * 8, (1 - s) * 6) });
    }
    const d = c.desce - i * 0.04;
    if (d > 0 && d < 1) luzes.push({ pos: mundo(noCaminho(caminho, 1 - d)), r: 0.005, cor: "#6FF2E2", forca: Math.min(1, d * 8, (1 - d) * 6) });
  }
  return luzes;
};

// ---------- Lia comendo à mesa ----------
const BACIA_LIA: V3 = [0, -0.14, -0.3];
const BOCA: V3 = [0, 0.218, -0.1];
const DESCANSO = { mao: [-0.14, 0.075, -0.06] as V3, dir: [0.5, -0.1, 0.85] as V3 };

/** Posição da mão para a concha ficar num ponto, com a colher apontada em `dir`. */
const maoPara = (concha: V3, dir: V3): V3 => sub(concha, esc(norm(dir), CONCHA[2] - PEGA_Z));

/** Um bocado: pegar a comida na tigela e levar à boca. `u` de 0 a 150; `vira` 0..1 entorna a colher no caminho. */
const comer = (f: number, u: number, vira = 0, parada = false) => {
  const dirBoca: V3 = [0.93, 0.06, -0.36];
  const chaves: [number, V3][] = [
    [0, DESCANSO.mao],
    [25, [-0.1, 0.115, -0.05]],
    [40, [-0.085, 0.086, -0.04]],
    [55, [-0.1, 0.135, -0.06]],
    [100, maoPara(soma(BOCA, [0, 0, 0.03]), dirBoca)],
    [112, maoPara(BOCA, dirBoca)],
    [126, maoPara(soma(BOCA, [0, 0, 0.04]), dirBoca)],
    [150, DESCANSO.mao],
  ];
  const dirs: [number, V3][] = [
    [0, DESCANSO.dir],
    [25, [0.75, -0.45, 0.5]],
    [40, [0.8, -0.56, 0.25]],
    [55, [0.9, -0.04, 0.42]],
    [100, dirBoca],
    [126, dirBoca],
    [150, DESCANSO.dir],
  ];
  const interp = (ch: [number, V3][]): V3 => {
    for (let i = 1; i < ch.length; i++) if (u <= ch[i][0]) return mixV(ch[i - 1][1], ch[i][1], prog(u, ch[i - 1][0], ch[i][0]));
    return ch[ch.length - 1][1];
  };
  const mao = interp(chaves);
  const rot = apontar(interp(dirs), 1.95 * vira);
  const pos = sub(mao, girar([0, 0, PEGA_Z], rot));
  const concha = soma(pos, girar(CONCHA, rot));
  const comida = vira > 0.35 ? 0 : k(u, [[44, 0], [52, 1], [108, 1], [114, 0]]);
  const lia: Pose = {
    pos: BACIA_LIA,
    yaw: 0,
    inclina: 0.12 + 0.05 * k(u, [[90, 0], [108, 1], [126, 0]]),
    tomba: 0,
    giroTorso: 0,
    cabeca: [0, 0, 0],
    maoE: [0.17, 0.04, -0.1],
    maoD: mao,
    peE: [0.07, -0.57, -0.2],
    peD: [-0.07, -0.57, -0.2],
    peEInc: 0,
    peDInc: 0,
    boca: parada ? 0.55 : k(u, [[92, 0], [102, 0.95], [112, 0.95], [118, 0], [150, 0]]) + (u > 118 && u < 146 ? 0.25 * Math.abs(Math.sin(f * 0.5)) : 0),
    sorriso: parada ? -0.3 : 0.7,
    olhos: piscar(f, 3),
    sobr: parada ? 0.7 : 0,
  };
  lia.cabeca = olhar(lia, parada ? [concha[0], 0, concha[2]] : concha, ALT_CAB_LIA, 0.75);
  return { lia, colher: { pos, rot, comida }, concha };
};

/** Lia entorna a colher perto da boca. `t` em quadros desde o começo do bocado. */
const U_VIRA = 86;
const comerEVirar = (f: number, t: number, vel: number) => {
  const u = Math.min(t * vel, 96);
  const vira = prog(u, U_VIRA, U_VIRA + 7);
  const c = comer(f, u, vira, u > U_VIRA + 2);
  const origem = comer(f, U_VIRA + 3, 0.5).concha;
  const queda = (u - (U_VIRA + 3)) / 9;
  const noChao: V3 = [origem[0], 0, origem[2]];
  return {
    ...c,
    gota: queda > 0 && queda < 1 ? ([origem[0], origem[1] * (1 - queda * queda), origem[2]] as V3) : null,
    manchas: queda >= 1 ? [{ pos: noChao, tamanho: 0.75 + 0.25 * prog(queda, 1, 1.5, sair) }] : [],
    mancha: noChao,
  };
};

const CAM_MESA = (t: number) => ({ pos: mixV([0.05, 0.6, 1.72], [0, 0.58, 1.6], t), alvo: [0, 0.14, -0.1] as V3, fov: 34 });

// ---------- os três quadros (segurar, pegar, levar) ----------
const fala = (i: number) => FALAS[i - 1];

export const quadro1 = (f: number): EstadoMesa => {
  const cam = { pos: [0.06, 0.46, 1.0] as V3, alvo: [0.06, 0.17, 0.03] as V3, fov: 24 };
  const t0 = fala(8).de + 6;
  const fim = fala(11).de;
  if (f >= t0 && f < fim) {
    const escorrega = prog(f, t0, t0 + 22) * 1.6;
    const solta = (f - (t0 + 22)) / 13;
    const s = segurando(Math.min(escorrega, 1.6), 0, 1);
    if (solta <= 0) return { ...vazio, ...s, cam };
    const q = limitar(solta);
    const repouso: V3 = [0.1, 0.0125, 0.12];
    const pos = mixV(s.colher.pos, repouso, q);
    pos[1] = mix(s.colher.pos[1], repouso[1], q * q) + 0.02 * Math.sin(Math.PI * limitar((solta - 1) / 0.5));
    return {
      ...vazio,
      mao: { ...s.mao, fecha: 0.97 - 0.3 * prog(solta, 0, 0.6) },
      colher: { pos, rot: mixV(s.colher.rot, [0, 1.25, 0], q), comida: solta < 0.8 ? 1 : 0 },
      gota: null,
      manchas: solta >= 0.8 ? [{ pos: [0.2, 0, 0.17], tamanho: 0.7 + 0.3 * prog(solta, 0.8, 1.4, sair) }] : [],
      cam,
    };
  }
  const c = ciclo(((f + 20) % 76) / 76);
  return { ...vazio, ...segurando(c.escorrega * 0.25, c.aperto * 0.5, 1), cam };
};

export const quadro2 = (f: number): EstadoMesa => {
  const x = (f % 96) / 96;
  const u = mix(14, 66, x < 0.5 ? x * 2 : 2 - x * 2);
  const c = comer(f, u);
  return { ...vazio, tigela: true, lia: c.lia, colher: { ...c.colher, comida: x > 0.5 ? 0 : c.colher.comida }, mao: null, cam: { pos: [0, 0.44, 0.66], alvo: [-0.02, 0.06, -0.01], fov: 15 } };
};

export const quadro3 = (f: number): EstadoMesa => {
  const cam = { pos: [-0.22, 0.3, 0.72] as V3, alvo: [-0.07, 0.165, -0.1] as V3, fov: 18 };
  const t0 = fala(9).de + 4;
  const fim = fala(11).de;
  if (f >= t0 && f < fim) {
    const c = comerEVirar(f, f - t0 + 58 / 0.55, 0.55);
    return { ...vazio, tigela: true, lia: c.lia, colher: c.colher, gota: c.gota, manchas: c.manchas, mao: null, cam };
  }
  const c = comer(f, 58 + ((f * 0.8) % 78));
  return { ...vazio, tigela: true, lia: c.lia, colher: c.colher, mao: null, cam };
};

// ---------- tela cheia ----------
export const estado = (f: number): EstadoMesa => {
  const C = CORTES;
  // 0–5 s · a colher na mesa, a mão pega
  if (f < C.segura) {
    const queda = k(f, [[0, 0.16], [9, 0], [13, 0.025], [17, 0]], sair);
    const rotC: V3 = [0, -0.63, 0];
    const rotM: V3 = [Math.PI / 2, -2.2, 0];
    const sobe = 0.07 * prog(f, 102, 120);
    const pos: V3 = [0.07, 0.0125 + queda + sobe, 0.03];
    const pega = soma(pos, girar([0, 0, PEGA_Z], rotC));
    const naColher = sub(pega, girar(CABO_NA_MAO, rotM));
    const chega = prog(f, 54, 90);
    return {
      ...vazio,
      mao: { pos: soma(naColher, esc([0.34, 0.24, 0.3], 1 - chega)), rot: rotM, fecha: mix(0.3, 1.0, prog(f, 86, 101)) },
      colher: { pos, rot: rotC, comida: 0 },
      cam: { pos: mixV([0.14, 0.56, 0.62], [0.1, 0.5, 0.56], prog(f, 0, C.segura, linear)), alvo: [0.02, 0.03, 0.06], fov: 30 },
    };
  }
  // a colher começa a escorregar e a mão corrige, várias vezes
  if (f < C.dedos) {
    const c = ciclo(((f - C.segura) % 52) / 52);
    return {
      ...vazio,
      ...segurando(c.escorrega * 0.75, c.aperto, 0),
      cam: { pos: mixV([0.1, 0.64, 0.76], [0.07, 0.6, 0.68], prog(f, C.segura, C.dedos, linear)), alvo: [0.0, 0.265, 0.01], fov: 28 },
    };
  }
  // 5–19 s · close nos dedos: o sinal sobe, a resposta desce, a mão aperta
  if (f < C.quadros) {
    const p = f < 588 ? (f - 290) / 292 : f < 706 ? ((f - 588) % 59) / 59 : (f - 712) / 68;
    const c = ciclo(limitar(p));
    const s = segurando(c.escorrega, c.aperto, 0);
    return {
      ...vazio,
      ...s,
      luzes: luzesDoCiclo(c, s.mao.fecha, f),
      cam: { pos: mixV([0.03, 0.54, 0.5], [0.0, 0.5, 0.44], prog(f, C.dedos, C.quadros, linear)), alvo: [-0.02, 0.262, 0.02], fov: 30 },
    };
  }
  // os três quadros são desenhados à parte; aqui fica só o fundo
  if (f < C.casa) return { ...vazio, tigela: true, mao: null, colher: { pos: [0.2, 0.0125, 0.1], rot: [0, 1, 0], comida: 0 }, cam: CAM_MESA(0) };

  // 34–47 s · em casa: em que momento a comida cai?
  const t = prog(f, C.casa, C.fim, linear);
  const cai = comerEVirar(f, Math.max(0, f - fala(12).de), 150 / 170);
  const mancha = [{ pos: cai.mancha, tamanho: 1 }];
  if (f < fala(14).de - 4) return { ...vazio, tigela: true, mao: null, lia: cai.lia, colher: cai.colher, gota: cai.gota, manchas: cai.manchas, cam: CAM_MESA(t) };
  const u = f < C.cartao ? ((f - fala(14).de) / (fala(14).ate - fala(14).de)) * 138 : ((f - C.cartao) * 0.85) % 150;
  const c = comer(f, limitar(u, 0, 150));
  return { ...vazio, tigela: true, mao: null, lia: c.lia, colher: c.colher, manchas: mancha, cam: CAM_MESA(t) };
};
