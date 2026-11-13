import type { Pose } from "../Boneco";
import { CADARCO_SOLTO, pontaDaLingua } from "../Tenis";
import { elastico, girar, k, limitar, linear, local, mix, mixV, piscar, prog, sair, soma, type V3 } from "../anim";
import { ALT_CAB_LIA, olhar } from "../coreografia";
import { CORTES } from "./roteiro";

export type Mao = { pos: V3; de: V3 };
export type EstadoTarefa = {
  cam: { pos: V3; alvo: V3; fov: number };
  lia: Pose;
  /** Altura do assento (o banco alto encolhe até virar o assento baixo). */
  banco: number;
  tenis: { pos: V3; rot: V3; lingua: number; pontaE: V3; pontaD: V3; firme: number };
  maos: Mao[];
  anel: { pos: V3; raio: number; forca: number } | null;
};

const GIRO = 0.7;
const FRENTE: V3 = [Math.sin(GIRO), 0, Math.cos(GIRO)];
const ALTO = 0.6;
const BAIXO = 0.27;
/** O tênis espera no chão, na frente da Lia. */
const TENIS: V3 = [0.5, 0, 0.72];
const ROT_TENIS: V3 = [0, GIRO, 0];
const noTenis = (p: V3, pos: V3 = TENIS, rot: V3 = ROT_TENIS): V3 => soma(pos, girar(p, rot));

const bacia = (h: number): V3 => [0, h + 0.07, 0.03];
const peNoChao = (lado: 1 | -1, h = BAIXO) => local(bacia(h), GIRO)(lado * 0.09, 0.062, 0.26);

/** Lia sentada num banco de altura `h`. `apoio` 0 = pés balançando no ar, 1 = pés firmes no chão. */
const lia = (f: number, h: number, apoio: number, bambo = 0): Pose => {
  const L = local(bacia(h), GIRO);
  const b1 = Math.sin(f * 0.24) * (1 - apoio);
  const b2 = Math.sin(f * 0.24 + 2.2) * (1 - apoio);
  const balanco = Math.sin(f * 0.42) * bambo;
  const pe = (lado: 1 | -1, b: number) => mixV(L(lado * 0.075, h - 0.15 + 0.035 * b, 0.245 + 0.11 * b), peNoChao(lado, h), apoio);
  const p: Pose = {
    pos: bacia(h),
    yaw: GIRO,
    inclina: 0.08 + 0.12 * apoio + 0.1 * bambo * Math.sin(f * 0.3),
    tomba: 0.16 * balanco,
    giroTorso: 0,
    cabeca: [0.2, 0, -0.1 * balanco],
    maoE: mixV(L(0.15, h + 0.065, 0.1), L(0.34, h + 0.36 - 0.12 * balanco, 0.12), bambo),
    maoD: mixV(L(-0.15, h + 0.065, 0.1), L(-0.34, h + 0.36 + 0.12 * balanco, 0.12), bambo),
    peE: pe(1, b1),
    peD: pe(-1, b2),
    peEInc: (0.3 - 0.4 * b1) * (1 - apoio),
    peDInc: (0.3 - 0.4 * b2) * (1 - apoio),
    boca: 0.5 * bambo,
    sorriso: mix(0.3, 0.9, apoio) * (1 - bambo),
    olhos: piscar(f),
    sobr: 0.7 * bambo,
  };
  if (bambo < 0.05) p.cabeca = olhar(p, soma(TENIS, [0, 0.05, 0]), ALT_CAB_LIA);
  return p;
};

const TENIS_PARADO = { pos: TENIS, rot: ROT_TENIS, lingua: 0, pontaE: CADARCO_SOLTO.E, pontaD: CADARCO_SOLTO.D, firme: 0 };

/** De onde vem o braço: de trás do tênis, do lado de quem calça. */
const braco = (mao: V3, lado: 1 | -1): V3 => soma(mao, girar([lado * 0.34, 0.5, -0.2], ROT_TENIS));

/** Uma mão puxa a língua do tênis, ela escapa e volta. `u` em quadros. */
const abrir = (u: number): Pick<EstadoTarefa, "tenis" | "maos"> => {
  const lingua = k(u, [[6, 0], [20, 0.8], [24, 0.88], [27, 0.05], [30, 0.3], [34, 0], [37, 0.1], [40, 0]]);
  const arrasta = k(u, [[8, 0], [24, 1], [27, 0.7], [40, 0.7]]);
  const pos = soma(TENIS, girar([0, 0, -0.03 * arrasta], ROT_TENIS));
  const rot: V3 = [-0.14 * lingua, GIRO + 0.12 * arrasta, 0];
  const naLingua = noTenis(soma(pontaDaLingua(lingua), [-0.02, 0.025, 0]), pos, rot);
  const fora = noTenis([-0.3, 0.4, -0.15]);
  const mao = u < 25 ? mixV(fora, naLingua, prog(u, -4, 6)) : mixV(noTenis([0.02, 0.26, -0.16], pos, rot), fora, prog(u, 27, 42));
  return { tenis: { ...TENIS_PARADO, pos, rot, lingua }, maos: [{ pos: mao, de: braco(mao, -1) }] };
};

/** Duas mãos levantam os cadarços, cruzam, e eles escorregam e caem. `u` em quadros. */
const laco = (u: number): Pick<EstadoTarefa, "tenis" | "maos"> => {
  const sobe = prog(u, 0, 10);
  const cruza = prog(u, 10, 24);
  const cai = prog(u, 33, 47, sair);
  const seguraE = mixV([0.085, 0.19, 0.02], [-0.055, 0.215, 0.04], cruza);
  const seguraD = mixV([-0.085, 0.19, 0.02], [0.055, 0.18, 0.015], cruza);
  const pontaE = u < 33 ? mixV(CADARCO_SOLTO.E, seguraE, sobe) : mixV(seguraE, CADARCO_SOLTO.E, cai);
  const pontaD = u < 33 ? mixV(CADARCO_SOLTO.D, seguraD, sobe) : mixV(seguraD, CADARCO_SOLTO.D, cai);
  const some = prog(u, 33, 50);
  const mao = (ponta: V3, segura: V3, lado: 1 | -1): Mao => {
    const naPonta = noTenis(soma(u < 33 ? ponta : segura, [lado * 0.012, 0.03, -0.02]));
    const fora = noTenis([lado * 0.32, 0.4, -0.1]);
    const pos = u < 33 ? mixV(fora, naPonta, prog(u, -8, 0)) : mixV(soma(naPonta, [0, 0.05 * limitar(some * 4), 0]), fora, some);
    return { pos, de: braco(pos, lado) };
  };
  return {
    tenis: { ...TENIS_PARADO, pontaE, pontaD, firme: u < 33 ? sobe : 1 - cai },
    maos: u > -8 && u < 50 ? [mao(pontaE, seguraE, cruza > 0.5 ? -1 : 1), mao(pontaD, seguraD, cruza > 0.5 ? 1 : -1)] : [],
  };
};

// câmeras
const camPe = (t: number) => ({ pos: mixV([-0.62, 0.3, 1.55], [-0.5, 0.36, 1.5], t), alvo: [0.16, 0.44, 0.28] as V3, fov: 38 });
const camAbrir = (t: number) => ({ pos: soma(TENIS, mixV(girar([0.6, 0.4, 0.22], ROT_TENIS), girar([0.54, 0.36, 0.2], ROT_TENIS), t)), alvo: soma(TENIS, [0, 0.0, 0]), fov: 34 });
const camLaco = (t: number) => ({ pos: soma(TENIS, mixV([-0.66, 0.46, -0.52], [-0.6, 0.43, -0.47], t)), alvo: soma(TENIS, [0, 0.02, 0]), fov: 36 });

export const estado = (f: number): EstadoTarefa => {
  const C = CORTES;
  const semMaos = { tenis: TENIS_PARADO, maos: [] as Mao[], anel: null };

  // 0–5 s · o tênis em close
  if (f < C.pe) {
    const a = mix(2.5, 1.75, prog(f, 0, C.pe, linear));
    const queda = k(f, [[0, 0.22], [9, 0], [13, 0.035], [17, 0]], sair);
    return {
      ...semMaos,
      lia: lia(f, ALTO, 0),
      banco: ALTO,
      tenis: { ...TENIS_PARADO, pos: soma(TENIS, [0, queda, 0]), rot: [0, GIRO + 0.5 * (1 - prog(f, 0, 14)), 0] },
      cam: { pos: soma(TENIS, [Math.sin(a) * 0.9, 0.26, Math.cos(a) * 0.9]), alvo: soma(TENIS, [0, 0.065, 0]), fov: 30 },
    };
  }
  // 5–18 s · as três dificuldades
  if (f < C.abrir) {
    const bambo = prog(f, 292, 304) ;
    return { ...semMaos, lia: lia(f, ALTO, 0, bambo), banco: ALTO, cam: camPe(prog(f, C.pe, C.abrir, linear)) };
  }
  if (f < C.laco) return { ...abrir(f - C.abrir), anel: null, lia: lia(f, ALTO, 0), banco: ALTO, cam: camAbrir(prog(f, C.abrir, C.laco, linear)) };
  if (f < C.pe2) return { ...laco(f - C.laco), anel: null, lia: lia(f, ALTO, 0), banco: ALTO, cam: camLaco(prog(f, C.laco, C.pe2, linear)) };
  if (f < C.abrir2) return { ...semMaos, lia: lia(f, ALTO, 0, 1), banco: ALTO, cam: camPe(1) };
  if (f < C.laco2) return { ...abrir(f - C.abrir2), anel: null, lia: lia(f, ALTO, 0), banco: ALTO, cam: camAbrir(1) };
  if (f < C.banco) return { ...laco(f - C.laco2 + 6), anel: null, lia: lia(f, ALTO, 0), banco: ALTO, cam: camLaco(1) };

  // 18–30 s · o que a TO faz com isso
  const peD = peNoChao(-1);
  const anelPos: V3 = [peD[0] + 0.03, 0.016, peD[2] + 0.04];
  if (f < C.peApoiado) {
    const h = mix(ALTO, BAIXO, prog(f, 556, 590));
    const apoio = prog(f, 578, 596);
    return {
      ...semMaos,
      lia: lia(f, h, apoio),
      banco: h,
      anel: { pos: anelPos, raio: mix(0.08, 0.2, prog(f, 594, 606, sair)), forca: 0.8 * prog(f, 593, 596) },
      cam: { pos: mixV([-0.35, 0.75, 3.3], [-0.3, 0.6, 3.0], prog(f, C.banco, C.peApoiado)), alvo: mixV([0.15, 0.55, 0.3], [0.15, 0.32, 0.3], prog(f, 556, 596)), fov: 36 },
    };
  }
  if (f < C.lacoDeNovo) {
    const pulso = (Math.sin((f - C.peApoiado) * 0.2) + 1) / 2;
    return {
      ...semMaos,
      lia: lia(f, BAIXO, 1),
      banco: BAIXO,
      anel: { pos: anelPos, raio: 0.14 + 0.03 * pulso, forca: 0.5 + 0.4 * pulso },
      cam: { pos: mixV([-0.75, 0.2, 1.5], [-0.68, 0.24, 1.42], prog(f, C.peApoiado, C.lacoDeNovo, linear)), alvo: [peD[0] + 0.05, 0.0, peD[2]], fov: 34 },
    };
  }
  if (f < C.observa) return { ...laco((f - C.lacoDeNovo) * 0.62 - 4), anel: null, lia: lia(f, BAIXO, 1), banco: BAIXO, cam: camLaco(prog(f, C.lacoDeNovo, C.observa, linear)) };

  // observar a tarefa inteira e, depois, a anotação
  const t = prog(f, C.observa, 1050, linear);
  const p = lia(f, BAIXO, 1);
  p.inclina = 0.3;
  p.cabeca = olhar(p, soma(TENIS, [0, 0.05, 0]), ALT_CAB_LIA);
  p.sorriso = 0.6;
  return {
    ...semMaos,
    lia: p,
    banco: BAIXO,
    cam: { pos: mixV([1.7, 1.0, 2.75], [1.45, 0.9, 2.45], t), alvo: mixV([0.4, 0.08, 0.58], [0.4, 0.06, 0.58], t), fov: 36 },
  };
};


