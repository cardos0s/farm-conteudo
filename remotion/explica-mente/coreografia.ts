import type { Pose } from "./Boneco";
import { LIA, TERA } from "./Boneco";
import { TORNOZELO_NO_TENIS } from "./Tenis";
import { elastico, esc, fala, girar, k, kv, limitar, linear, local, mix, mixV, piscar, prog, sair, soma, sub, type V3 } from "./anim";
import { falando } from "./roteiro";

export type TenisEstado = { pos: V3; rot: V3; aberto: number };
export type Estado = {
  cam: { pos: V3; alvo: V3; fov: number };
  lia: Pose;
  liaCalcada: boolean;
  tenisNoPe: number;
  tera: Pose | null;
  /** O tênis que foge (null quando está no pé). */
  tenisA: TenisEstado | null;
  /** O outro tênis, esperando no chão. */
  tenisB: TenisEstado;
  banquinho: V3 | null;
  anel: { pos: V3; raio: number; forca: number } | null;
  prancheta: { pos: V3; rot: V3 } | null;
  caneta: { pos: V3; rot: V3 } | null;
};

// ---------- marcações do palco ----------
const GIRO_ALTO = 0.7;
const BACIA_ALTO: V3 = [0, 0.67, 0.03];
const LA = local(BACIA_ALTO, GIRO_ALTO);

const GIRO_BAIXO = 0.25;
export const BANQUINHO_FINAL: V3 = [0.36, 0, 0.46];
const BACIA_BAIXO: V3 = [0.36, 0.34, 0.48];
const LB = local(BACIA_BAIXO, GIRO_BAIXO);

const TENIS_A_CHAO: TenisEstado = { pos: [0.98, 0, 0.72], rot: [0, 1.9, 0], aberto: 0 };
const TENIS_B_CHAO: TenisEstado = { pos: [-0.06, 0, 0.97], rot: [0, 2.3, 0], aberto: 0 };

// ---------- utilidades de pose ----------
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  ...(t < 0.5 ? a : b),
  pos: mixV(a.pos, b.pos, t),
  yaw: mix(a.yaw, b.yaw, t),
  inclina: mix(a.inclina, b.inclina, t),
  tomba: mix(a.tomba, b.tomba, t),
  giroTorso: mix(a.giroTorso, b.giroTorso, t),
  cabeca: mixV(a.cabeca, b.cabeca, t),
  maoE: mixV(a.maoE, b.maoE, t),
  maoD: mixV(a.maoD, b.maoD, t),
  peE: mixV(a.peE, b.peE, t),
  peD: mixV(a.peD, b.peD, t),
  peEInc: mix(a.peEInc, b.peEInc, t),
  peDInc: mix(a.peDInc, b.peDInc, t),
  boca: mix(a.boca, b.boca, t),
  sorriso: mix(a.sorriso, b.sorriso, t),
  olhos: mix(a.olhos, b.olhos, t),
  sobr: mix(a.sobr, b.sobr, t),
});

/** Vira a cabeça para um ponto do mundo. */
const olhar = (p: Pose, alvo: V3, altCabeca: number, peso = 1): V3 => {
  const cab: V3 = [p.pos[0], p.pos[1] + altCabeca * Math.cos(p.inclina), p.pos[2]];
  const d = sub(alvo, cab);
  let giro = Math.atan2(d[0], d[2]) - p.yaw - p.giroTorso;
  while (giro > Math.PI) giro -= 2 * Math.PI;
  while (giro < -Math.PI) giro += 2 * Math.PI;
  const baixar = -Math.atan2(d[1], Math.hypot(d[0], d[2])) - p.inclina * 0.75;
  return [limitar(baixar, -0.6, 0.7) * peso, limitar(giro, -1.15, 1.15) * peso, 0];
};
const ALT_CAB_LIA = LIA.torso + LIA.cabeca;
const ALT_CAB_TERA = TERA.torso + TERA.cabeca;

/** Boca de quem fala (segue a lista de falas do roteiro). */
const boca = (f: number, quem: "lia" | "tera") => (falando(f, quem) ? fala(f, quem === "lia" ? 0 : 2) : 0);

// ---------- Lia ----------
/** Sentada no banco alto, pés balançando no ar. */
const liaAlto = (f: number, vel = 1, amp = 1): Pose => {
  const b1 = Math.sin(f * 0.21 * vel);
  const b2 = Math.sin(f * 0.21 * vel + 2.2);
  return {
    pos: BACIA_ALTO,
    yaw: GIRO_ALTO,
    inclina: 0.06,
    tomba: 0,
    giroTorso: 0,
    cabeca: [0, 0, 0],
    maoE: LA(0.15, 0.665, 0.1),
    maoD: LA(-0.15, 0.665, 0.1),
    peE: LA(0.075, 0.45 + 0.025 * amp * b1, 0.245 + 0.075 * amp * b1),
    peD: LA(-0.075, 0.45 + 0.025 * amp * b2, 0.245 + 0.075 * amp * b2),
    peEInc: 0.3 - 0.3 * amp * b1,
    peDInc: 0.3 - 0.3 * amp * b2,
    boca: 0,
    sorriso: 0.6,
    olhos: piscar(f),
    sobr: 0,
  };
};

/** Pé direito tentando entrar no tênis seguro pelas duas mãos. `folga` 0 = calçado, 1 = só a ponta do pé. */
const tentar = (tornozeloBase: V3, giro: number, inc: number, folga: number, empurra: number) => {
  const rot: V3 = [inc, giro, 0];
  const tornozelo = soma(tornozeloBase, girar([0, 0, 0.035 * empurra], rot));
  const calcado = sub(tornozelo, girar(TORNOZELO_NO_TENIS, rot));
  const pos = soma(calcado, girar([0, -0.035 * folga, 0.085 * folga], rot));
  return {
    peD: tornozelo,
    tenis: { pos, rot },
    maoE: soma(pos, girar([0.066, 0.05, -0.02], rot)),
    maoD: soma(pos, girar([-0.066, 0.05, -0.02], rot)),
  };
};

const liaTentaAlto = (f: number, folga: number, empurra: number, vel = 1) => {
  const inc = 0.55;
  const t = tentar(LA(-0.07, 0.6, 0.27), GIRO_ALTO, inc, folga, empurra);
  const pose: Pose = {
    ...liaAlto(f, vel),
    inclina: 0.82 + 0.07 * empurra,
    cabeca: [0.1, 0, 0],
    maoE: t.maoE,
    maoD: t.maoD,
    peD: t.peD,
    peDInc: inc,
    sorriso: -0.5,
    sobr: -0.55,
  };
  return { pose, tenis: { ...t.tenis, aberto: 0.25 } as TenisEstado };
};

/** Sentada no banquinho: pé esquerdo firme no chão, pé direito erguido perto das mãos. */
const PE_E_CHAO = LB(0.1, 0.062, 0.27);
const TORNOZELO_BAIXO = LB(-0.075, 0.33, 0.24);
const CAM_BAIXO = { pos: [0.88, 0.55, 2.36] as V3, alvo: [0.44, 0.22, 0.6] as V3, fov: 42 };
const INC_BAIXO = 0.42;
const liaBaixo = (f: number, folga: number, empurra = 0): { pose: Pose; tenis: TenisEstado } => {
  const t = tentar(TORNOZELO_BAIXO, GIRO_BAIXO, INC_BAIXO, folga, empurra);
  const pose: Pose = {
    pos: BACIA_BAIXO,
    yaw: GIRO_BAIXO,
    inclina: 0.5,
    tomba: 0,
    giroTorso: 0,
    cabeca: [-0.12, 0, 0],
    maoE: t.maoE,
    maoD: t.maoD,
    peE: PE_E_CHAO,
    peD: t.peD,
    peEInc: 0,
    peDInc: INC_BAIXO,
    boca: 0,
    sorriso: 0.75,
    olhos: piscar(f, 1),
    sobr: 0,
  };
  return { pose, tenis: { ...t.tenis, aberto: 0 } };
};

// ---------- Terapeuta ----------
/** Ajoelhada na altura da Lia. `frente` diz qual perna fica com o joelho erguido (1 = esquerda). */
const teraAjoelhada = (f: number, pos: V3, yaw: number, frente: 1 | -1 = -1): Pose => {
  const L = local(pos, yaw);
  const peFrente = L(frente * 0.11, 0.085, 0.3);
  const peTras = L(-frente * 0.11, 0.1, -0.42);
  const maoJoelho = L(frente * 0.13, 0.66, 0.34);
  const maoColo = L(-frente * 0.15, 0.5, 0.2);
  return {
    pos,
    yaw,
    inclina: 0.14,
    tomba: 0,
    giroTorso: 0,
    cabeca: [0, 0, 0],
    maoE: frente === 1 ? maoJoelho : maoColo,
    maoD: frente === 1 ? maoColo : maoJoelho,
    peE: frente === 1 ? peFrente : peTras,
    peD: frente === 1 ? peTras : peFrente,
    peEInc: frente === 1 ? 0 : 1.35,
    peDInc: frente === 1 ? 1.35 : 0,
    poloPeE: frente === 1 ? undefined : [0.1, -0.7, 1],
    poloPeD: frente === 1 ? [-0.1, -0.7, 1] : undefined,
    boca: 0,
    sorriso: 0.8,
    olhos: piscar(f, 2),
    sobr: 0,
  };
};

const base = (f: number): Omit<Estado, "cam" | "lia"> => ({
  liaCalcada: false,
  tenisNoPe: 0,
  tera: null,
  tenisA: TENIS_A_CHAO,
  tenisB: TENIS_B_CHAO,
  banquinho: null,
  anel: null,
  prancheta: null,
  caneta: null,
});

// ---------- 0–4 s · o gancho ----------
const folga1 = (f: number) => k(f, [[0, 0.9], [7, 0.9], [12, 0.58], [16, 0.98], [20, 0.98], [25, 0.52], [29, 1.05], [32, 0.72], [35, 1.2]]);
const empurra1 = (f: number) => k(f, [[0, 0], [7, 0], [12, 1], [16, 0], [20, 0], [25, 1], [29, 0], [32, 1], [35, 1]]);
const tenta1 = (f: number) => liaTentaAlto(f, folga1(f), empurra1(f));

const fuga = (f: number): TenisEstado => {
  const p0 = tenta1(35).tenis;
  const P1: V3 = [0.58, 0, 0.68];
  const P2: V3 = [0.72, 0, 0.71];
  const giro = k(f, [[35, GIRO_ALTO], [47, 1.05], [84, 1.9]], sair);
  if (f < 47) {
    const t = (f - 35) / 12;
    const p = mixV(p0.pos, P1, t);
    return { pos: [p[0], p[1] + 0.1 * 4 * t * (1 - t), p[2]], rot: [mix(0.55, -0.1, t), giro, 0.5 * Math.sin(t * Math.PI)], aberto: 0.25 };
  }
  if (f < 54) {
    const t = (f - 47) / 7;
    const p = mixV(P1, P2, t);
    return { pos: [p[0], 0.04 * 4 * t * (1 - t), p[2]], rot: [-0.1 * (1 - t), giro, 0], aberto: 0.25 };
  }
  return { pos: mixV(P2, TENIS_A_CHAO.pos, prog(f, 54, 84, sair)), rot: [0, giro, 0], aberto: mix(0.25, 0, prog(f, 54, 84)) };
};

const TERA_EM_PE: V3 = [1.35, 1.45, 0.75];

const cena1 = (f: number): Estado => {
  const solto = f >= 35;
  const t = tenta1(Math.min(f, 35));
  let lia = t.pose;
  if (solto) {
    const susto: Pose = { ...t.pose, maoE: soma(t.pose.maoE, [0.05, 0.07, -0.02]), maoD: soma(t.pose.maoD, [-0.05, 0.07, 0.02]), inclina: 0.7 };
    lia = mixPose(susto, liaAlto(f), prog(f, 48, 70));
  }
  const tenisA = solto ? fuga(f) : t.tenis;
  if (solto) {
    const alvo = f < 60 ? soma(tenisA.pos, [0, 0.05, 0]) : TERA_EM_PE;
    const cabA = olhar(lia, soma(fuga(60).pos, [0, 0.05, 0]), ALT_CAB_LIA);
    const cabB = olhar(lia, TERA_EM_PE, ALT_CAB_LIA);
    lia.cabeca = f < 60 ? olhar(lia, alvo, ALT_CAB_LIA, prog(f, 35, 42)) : mixV(cabA, cabB, prog(f, 60, 72));
    lia.sobr = k(f, [[35, 0.8], [56, 0.8], [66, 0.35]]);
    lia.sorriso = k(f, [[35, -0.6], [60, -0.3], [70, 0.05]]);
    lia.boca = f < 46 ? k(f, [[35, 0], [38, 0.9], [46, 0.6]]) : boca(f, "lia");
  }
  const cam =
    f < 52
      ? {
          pos: kv(f, [[0, [-0.22, 0.56, 1.3]], [30, [-0.5, 0.72, 1.95]], [52, [-0.3, 0.5, 2.2]]]),
          alvo: mixV(kv(f, [[0, [0.2, 0.6, 0.38]], [30, [0.17, 0.74, 0.3]]]), soma(tenisA.pos, [-0.1, 0.12, 0]), prog(f, 35, 46)),
          fov: 34,
        }
      : { pos: mixV([0.52, 0.8, 2.9], [0.47, 0.8, 2.62], prog(f, 52, 120, linear)), alvo: [0.12, 0.63, 0.1] as V3, fov: 34 };
  return { ...base(f), cam, lia, tenisA };
};

// ---------- 4–12 s · a descoberta ----------
const BACIA_TERA: V3 = [0.82, 0.44, 0.3];
const GIRO_TERA = -1.15;

const cena2 = (f: number): Estado => {
  const e = base(f);
  // 2a · a terapeuta pega o tênis
  if (f < 160) {
    const desce = k(f, [[120, 0.25], [133, 1], [138, 1], [158, 0]]);
    const pos: V3 = [1.27, mix(0.46, 0.33, desce), 0.4];
    const yaw = -1.2;
    const L = local(pos, yaw);
    const mao = kv(f, [[120, [1.05, 0.5, 0.75]], [133, [0.985, 0.115, 0.725]], [138, [0.985, 0.115, 0.725]], [158, [0.93, 0.5, 0.7]]]);
    const tera: Pose = {
      pos,
      yaw,
      inclina: mix(0.35, 0.95, desce),
      tomba: 0,
      giroTorso: 0.2 * desce,
      cabeca: [0.1, 0, 0],
      maoE: mao,
      maoD: L(-0.15, 0.5, 0.28),
      peE: L(0.13, 0.085, 0.14),
      peD: L(-0.13, 0.085, 0.14),
      peEInc: 0,
      peDInc: 0,
      boca: 0,
      sorriso: 0.8,
      olhos: piscar(f, 2),
      sobr: 0,
    };
    tera.cabeca = olhar(tera, f < 140 ? TENIS_A_CHAO.pos : [0, 1.0, 0.03], ALT_CAB_TERA);
    const pegou = f >= 136;
    const tenisA: TenisEstado = pegou
      ? { pos: soma(mao, [0, -0.115 + 0.03 * prog(f, 136, 158), 0]), rot: [0.2 * prog(f, 136, 158), mix(1.9, 2.3, prog(f, 136, 158)), 0], aberto: 0 }
      : TENIS_A_CHAO;
    const lia = liaAlto(f);
    lia.cabeca = olhar(lia, [1.2, 0.8, 0.5], ALT_CAB_LIA);
    return {
      ...e,
      lia,
      tera,
      tenisA,
      cam: { pos: mixV([0.42, 0.42, 2.75], [0.5, 0.5, 2.6], prog(f, 120, 160, linear)), alvo: [1.03, 0.42, 0.55], fov: 38 },
    };
  }

  const tera = teraAjoelhada(f, BACIA_TERA, GIRO_TERA, -1);
  const lia = liaAlto(f);
  const cabLia: V3 = [0, 1.08, 0.03];
  const cabTera: V3 = [BACIA_TERA[0], 1.02, BACIA_TERA[2]];

  // 2d · o banquinho chega
  if (f >= 286 && f < 322) {
    const t = prog(f, 288, 314, sair);
    const banquinho = mixV([1.12, 0, 1.02], BANQUINHO_FINAL, t);
    const pos = mixV([1.02, 0.44, 0.52], [0.86, 0.44, 0.34], t);
    const tr = teraAjoelhada(f, pos, GIRO_TERA, -1);
    tr.inclina = 0.72;
    tr.maoE = soma(banquinho, [0.06, 0.3, 0.07]);
    const maoD = local(pos, GIRO_TERA)(-0.12, 0.62, 0.3);
    tr.maoD = maoD;
    tr.cabeca = olhar(tr, cabLia, ALT_CAB_TERA);
    lia.cabeca = olhar(lia, soma(banquinho, [0, 0.3, 0]), ALT_CAB_LIA);
    lia.sobr = 0.4;
    lia.sorriso = 0.4;
    return {
      ...e,
      lia,
      tera: tr,
      banquinho,
      tenisA: { pos: soma(maoD, [0, 0.03, 0]), rot: [0.1, -1.4, 0], aberto: 0 },
      cam: { pos: mixV([0.42, 0.62, 3.7], [0.45, 0.6, 3.5], prog(f, 286, 322, linear)), alvo: [0.5, 0.42, 0.3], fov: 36 },
    };
  }

  // 2e · Lia no banquinho, pé firme no chão, recebe o tênis
  if (f >= 322) {
    const b = liaBaixo(f, 1);
    const pose = b.pose;
    const desce = prog(f, 322, 334);
    pose.peE = mixV(soma(PE_E_CHAO, [0, 0.1, -0.03]), PE_E_CHAO, desce);
    pose.peEInc = mix(0.4, 0, desce);
    const entrega = prog(f, 332, 348);
    const maoTera = mixV([0.95, 0.5, 0.95], soma(b.tenis.pos, [0.1, 0.03, 0.02]), entrega);
    const solta = prog(f, 348, 358);
    const tenisA: TenisEstado = { pos: mixV(soma(maoTera, [-0.08, -0.02, 0]), b.tenis.pos, entrega), rot: [mix(0.1, b.tenis.rot[0], entrega), mix(-1.0, b.tenis.rot[1], entrega), 0], aberto: 0 };
    const espera = { ...pose, maoE: LB(0.12, 0.44, 0.3), maoD: LB(-0.12, 0.44, 0.3), inclina: 0.3 };
    const liaP = mixPose(espera, pose, prog(f, 336, 348));
    liaP.cabeca = olhar(liaP, tenisA.pos, ALT_CAB_LIA);
    liaP.sorriso = 0.9;
    const tPos: V3 = [1.12, 0.44, 0.62];
    const tr = teraAjoelhada(f, tPos, -1.25, -1);
    tr.inclina = 0.45;
    tr.maoE = mixV(maoTera, [0.92, 0.52, 0.9], solta);
    tr.cabeca = olhar(tr, [0.36, 0.85, 0.5], ALT_CAB_TERA);
    return {
      ...e,
      lia: liaP,
      tera: tr,
      banquinho: BANQUINHO_FINAL,
      tenisA,
      anel: { pos: [PE_E_CHAO[0], 0.016, PE_E_CHAO[2] + 0.04], raio: mix(0.08, 0.2, prog(f, 333, 352, sair)), forca: 0.8 * (1 - prog(f, 336, 354)) * prog(f, 332, 334) },
      cam: { ...CAM_BAIXO, pos: mixV([0.92, 0.57, 2.5], CAM_BAIXO.pos, prog(f, 322, 360, linear)) },
    };
  }

  // 2b e 2c · a conversa
  const maoTenis: V3 = [0.5, 0.62, 0.6];
  tera.maoE = soma(maoTenis, [0, 0.012 * Math.sin(f * 0.12), 0]);
  tera.boca = boca(f, "tera");
  tera.inclina = 0.2 + 0.04 * Math.sin(f * 0.1);
  tera.cabeca = soma(olhar(tera, cabLia, ALT_CAB_TERA), [0.05 * Math.sin(f * 0.3) * (tera.boca > 0 ? 1 : 0), 0, 0.08]);
  const tenisA: TenisEstado = { pos: soma(tera.maoE, [0, 0.04, 0]), rot: [0.12, -1.35, 0], aberto: 0 };

  lia.cabeca = olhar(lia, cabTera, ALT_CAB_LIA);
  lia.boca = boca(f, "lia");
  if (f >= 222) {
    // "quando eu empurro o pé" (chute) "ele foge!" (mãos para o alto)
    const chute = k(f, [[232, 0], [240, 1], [246, 0.2], [250, 1], [258, 0]]);
    lia.peD = soma(lia.peD, girar([0, 0.1 * chute, 0.12 * chute], [0, GIRO_ALTO, 0]));
    lia.peDInc = mix(lia.peDInc, 0.6, chute);
    const foge = k(f, [[256, 0], [264, 1], [278, 1], [286, 0.3]], elastico);
    lia.maoE = mixV(lia.maoE, LA(0.3, 1.0, 0.16), foge);
    lia.maoD = mixV(lia.maoD, LA(-0.3, 1.0, 0.16), foge);
    lia.sobr = 0.6;
    lia.sorriso = 0;
    lia.inclina = 0.06 + 0.1 * chute;
  }
  const dois = { pos: mixV([0.46, 0.8, 4.05], [0.44, 0.8, 3.85], prog(f, 160, 222, linear)), alvo: [0.4, 0.6, 0.2] as V3, fov: 34 };
  const perto = { pos: mixV([0.82, 0.92, 2.25], [0.76, 0.92, 2.1], prog(f, 222, 286, linear)), alvo: [0.1, 0.72, 0.1] as V3, fov: 34 };
  return { ...e, lia, tera, tenisA, cam: f < 222 ? dois : perto };
};

// ---------- 12–27 s · a explicação (a cena de novo, rapidinho) ----------
const cena3 = (f: number): Estado => {
  const e = base(f);
  if (f < 596) {
    // de novo no banco alto: pés no ar, o tênis escorrega
    const g = (f - 360) * 1.5;
    const ciclo = g % 44;
    const folga = k(ciclo, [[0, 0.95], [10, 0.95], [17, 0.55], [23, 1.1], [44, 0.95]]);
    const emp = k(ciclo, [[0, 0], [10, 0], [17, 1], [23, 0], [44, 0]]);
    const t = liaTentaAlto(g, folga, emp);
    // primeiro só os pés balançando, com o tênis no colo; depois a tentativa
    const colo: TenisEstado = { pos: LA(0, 0.735, 0.17), rot: [0.1, GIRO_ALTO + Math.PI / 2, 0], aberto: 0.25 };
    const solta: Pose = {
      ...liaAlto(g, 1.2, 1.7),
      inclina: 0.3,
      cabeca: [0.35, 0, 0.08 * Math.sin(f * 0.1)],
      maoE: soma(colo.pos, girar([0, 0.05, 0.09], colo.rot)),
      maoD: soma(colo.pos, girar([0, 0.05, -0.09], colo.rot)),
      sorriso: -0.25,
      sobr: 0.45,
    };
    const tenta = prog(f, 470, 488);
    const orbita = prog(f, 360, 596, linear);
    return {
      ...e,
      lia: mixPose(solta, t.pose, tenta),
      tenisA: { pos: mixV(colo.pos, t.tenis.pos, tenta), rot: mixV(colo.rot, t.tenis.rot, tenta), aberto: 0.25 },
      cam: { pos: mixV([-0.62, 0.3, 1.55], [-0.25, 0.44, 1.95], orbita), alvo: mixV([0.16, 0.42, 0.28], [0.17, 0.56, 0.3], orbita), fov: 38 },
    };
  }
  // no banquinho: um pé firme no chão, as mãos livres abrem o tênis
  const abre = k(f, [[650, 0], [676, 1], [700, 1], [716, 0.15], [736, 1]]);
  const b = liaBaixo(f, 1);
  const pose = b.pose;
  const rot = b.tenis.rot;
  // a mão esquerda puxa a tira, a direita segura o calcanhar
  pose.maoE = soma(b.tenis.pos, girar([0.066 - 0.03 * abre, 0.05 + 0.075 * abre, 0.0], rot));
  pose.cabeca = [-0.1, 0, 0.06 * Math.sin(f * 0.07)];
  pose.sorriso = mix(0.5, 0.95, prog(f, 670, 690));
  const pulso = (Math.sin((f - 600) * 0.16) + 1) / 2;
  const subida = prog(f, 640, 716);
  return {
    ...e,
    lia: pose,
    banquinho: BANQUINHO_FINAL,
    tenisA: { ...b.tenis, aberto: abre },
    anel: { pos: [PE_E_CHAO[0], 0.016, PE_E_CHAO[2] + 0.04], raio: 0.13 + 0.03 * pulso, forca: (0.45 + 0.4 * pulso) * prog(f, 600, 612) * (1 - prog(f, 700, 730)) },
    cam: { pos: mixV([1.05, 0.28, 1.9], CAM_BAIXO.pos, subida), alvo: mixV([0.47, 0.02, 0.72], CAM_BAIXO.alvo, subida), fov: mix(34, CAM_BAIXO.fov, subida) },
  };
};

// ---------- 27–32 s · a piada final ----------
const cena4 = (f: number): Estado => {
  const e = base(f);
  const folga = k(f, [[810, 1], [816, 1], [838, 0]]);
  const emp = k(f, [[816, 0], [830, 1], [838, 0.4], [846, 0]]);
  const b = liaBaixo(f, folga, emp);
  const calcada = f >= 838;
  const aberto = k(f, [[810, 1], [840, 1], [850, 0]], elastico);
  let pose = b.pose;
  // a mão esquerda fecha a tira
  pose.maoE = soma(b.tenis.pos, girar([0.066 - 0.03 * aberto, 0.05 + 0.075 * aberto, 0], b.tenis.rot));
  // pé calçado desce para o chão
  const PE_D_CHAO = LB(-0.1, 0.084, 0.28);
  const desce = prog(f, 852, 868);
  const sentada: Pose = { ...pose, peD: PE_D_CHAO, peDInc: 0, inclina: 0.16, maoE: LB(0.14, 0.4, 0.14), maoD: LB(-0.14, 0.4, 0.14), cabeca: [0, 0, 0] };
  pose = mixPose(pose, sentada, desce);
  // comemora um instante
  const festa = k(f, [[854, 0], [862, 1], [872, 1], [882, 0]], elastico);
  pose.maoE = mixV(pose.maoE, LB(0.26, 0.86, 0.1), festa);
  pose.maoD = mixV(pose.maoD, LB(-0.26, 0.86, 0.1), festa);
  pose.sorriso = 1;

  // o outro tênis tenta sair de fininho e congela quando é apontado
  const escapa = k(f, [[866, 0], [870, 0.35], [874, 0.35], [878, 0.7], [882, 0.7], [886, 1]], sair);
  const pulo = k(f, [[888, 0], [891, 1], [895, 0]]);
  const treme = f > 895 && f < 925 ? 0.05 * Math.sin(f * 1.9) * (1 - prog(f, 895, 925)) : 0;
  const tenisB: TenisEstado = {
    pos: soma(TENIS_B_CHAO.pos, [-0.1 * escapa, 0.045 * pulo, 0.035 * escapa]),
    rot: [0, TENIS_B_CHAO.rot[1] + 0.25 * escapa + treme, 0.12 * pulo],
    aberto: 0,
  };

  if (f >= 872) {
    const aponta = prog(f, 882, 890, elastico);
    const vira = prog(f, 874, 884);
    pose.giroTorso = -0.4 * vira;
    pose.cabeca = mixV([0, 0, 0], olhar({ ...pose, giroTorso: -0.4 }, soma(tenisB.pos, [0, 0.05, 0]), ALT_CAB_LIA), vira);
    pose.maoD = mixV(pose.maoD, soma(tenisB.pos, [0, 0.07, 0]), aponta);
    if (aponta > 0.5) pose.aponta = "D";
    pose.sobr = -0.7 * vira;
    pose.sorriso = mix(1, 0.25, vira);
    pose.boca = boca(f, "lia");
    pose.inclina = 0.16 + 0.12 * aponta;
  }
  const cam =
    f < 872
      ? { ...CAM_BAIXO, pos: mixV(CAM_BAIXO.pos, [0.84, 0.55, 2.25], prog(f, 810, 872, linear)) }
      : { pos: mixV([-0.25, 0.98, 3.3], [-0.2, 0.95, 3.1], prog(f, 872, 960, linear)), alvo: [0.14, 0.14, 0.66] as V3, fov: 36 };
  return { ...e, lia: pose, liaCalcada: calcada, tenisNoPe: aberto, tenisA: calcada ? null : { ...b.tenis, aberto }, tenisB, banquinho: BANQUINHO_FINAL, cam };
};

// ---------- 32–40 s · fechamento ----------
const cena5 = (f: number): Estado => {
  const e = base(f);
  const pos: V3 = [1.0, 0.44, 0.15];
  const yaw = 0.2;
  const L = local(pos, yaw);
  const tera = teraAjoelhada(f, pos, yaw, 1);
  const rotP: V3 = [-1.05, yaw + 0.25, 0];
  const pranchetaPos = L(-0.02, 0.6, 0.4);
  // a caneta percorre as linhas da anotação
  const g = limitar((f - 966) / 66);
  const linha = Math.min(3, Math.floor(g * 4));
  const naLinha = (g * 4) % 1;
  const escreve = f < 1032 ? 1 : 0;
  const ponta = soma(pranchetaPos, girar([-0.07 + 0.14 * naLinha, 0.07 - 0.035 * linha + 0.006 * Math.sin(f * 2.1) * escreve, 0.02], rotP));
  tera.maoE = soma(pranchetaPos, girar([0.13, -0.06, -0.01], rotP));
  tera.maoD = soma(ponta, [-0.02, 0.085, 0.03]);
  tera.inclina = 0.22;
  const olha = prog(f, 1036, 1050);
  tera.cabeca = mixV([0.42, -0.1, 0.05], olhar(tera, [0.36, 0.8, 0.5], ALT_CAB_TERA), olha);
  tera.sorriso = 0.9;

  // ao fundo, Lia já calçada balança os pés no banquinho
  const b = liaBaixo(f, 0);
  const lia: Pose = { ...b.pose, peD: LB(-0.1, 0.084, 0.28), peDInc: 0, inclina: 0.14, maoE: LB(0.14, 0.4, 0.14), maoD: LB(-0.14, 0.4, 0.14), cabeca: [0, 0.5, 0], sorriso: 1 };
  return {
    ...e,
    lia,
    liaCalcada: true,
    tera,
    tenisA: null,
    banquinho: BANQUINHO_FINAL,
    prancheta: { pos: pranchetaPos, rot: rotP },
    caneta: { pos: ponta, rot: [0.5, yaw, -0.35] },
    cam: { pos: mixV([1.38, 0.98, 2.5], [1.3, 0.96, 2.3], prog(f, 960, 1104, linear)), alvo: [1.0, 0.7, 0.2], fov: 34 },
  };
};

export const estado = (f: number): Estado => {
  if (f < 120) return cena1(f);
  if (f < 360) return cena2(f);
  if (f < 810) return cena3(f);
  if (f < 960) return cena4(f);
  return cena5(f);
};
