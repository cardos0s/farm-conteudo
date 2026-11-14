import type { Medidas, Pose } from "../Boneco";
import { limitar, local, piscar, sub, type V3 } from "../anim";

/** Altura do tornozelo com o pé no chão. */
const tornozelo = (m: Medidas) => (m.estilo === "lia" ? 0.062 : 0.085);

/** Personagem em pé. `pos` é o ponto do chão entre os pés. */
export const emPe = (m: Medidas, pos: V3, yaw: number, f: number, semente = 0): Pose => {
  const y = m.perna[0] + m.perna[1] + tornozelo(m) - 0.015;
  const bacia: V3 = [pos[0], y + 0.004 * Math.sin(f * 0.08 + semente), pos[2]];
  const L = local(bacia, yaw);
  const braco = (m.braco[0] + m.braco[1]) * 0.96;
  return {
    pos: bacia,
    yaw,
    inclina: 0.03,
    tomba: 0,
    giroTorso: 0,
    cabeca: [0, 0, 0],
    maoE: L(m.ombro + 0.045, y + m.alturaOmbro - braco, 0.03),
    maoD: L(-m.ombro - 0.045, y + m.alturaOmbro - braco, 0.03),
    peE: L(m.quadril * 1.15, tornozelo(m), 0),
    peD: L(-m.quadril * 1.15, tornozelo(m), 0),
    peEInc: 0,
    peDInc: 0,
    boca: 0,
    sorriso: 0.6,
    olhos: piscar(f, semente),
    sobr: 0,
  };
};

/** Centro da cabeça no mundo (aproximado, sem contar o giro do tronco). */
export const cabecaDe = (m: Medidas, p: Pose): V3 => {
  const h = m.torso + m.cabeca * 1.02;
  return [p.pos[0] + Math.sin(p.yaw) * Math.sin(p.inclina) * h, p.pos[1] + Math.cos(p.inclina) * h, p.pos[2] + Math.cos(p.yaw) * Math.sin(p.inclina) * h];
};

/** Vira a cabeça para um ponto do mundo. */
export const olharPara = (m: Medidas, p: Pose, alvo: V3, peso = 1): V3 => {
  const d = sub(alvo, cabecaDe(m, p));
  let giro = Math.atan2(d[0], d[2]) - p.yaw - p.giroTorso;
  while (giro > Math.PI) giro -= 2 * Math.PI;
  while (giro < -Math.PI) giro += 2 * Math.PI;
  const baixar = -Math.atan2(d[1], Math.hypot(d[0], d[2])) - p.inclina * 0.75;
  return [limitar(baixar, -0.6, 0.7) * peso, limitar(giro, -1.15, 1.15) * peso, 0];
};

/** Onde ficam as mãos para tapar os ouvidos. */
export const nosOuvidos = (m: Medidas, p: Pose): { maoE: V3; maoD: V3 } => {
  const c = cabecaDe(m, p);
  const L = local(c, p.yaw);
  return { maoE: L(m.cabeca * 1.08, c[1] - 0.01, 0.02), maoD: L(-m.cabeca * 1.08, c[1] - 0.01, 0.02) };
};

/** Personagem andando de `de` até `ate` (pontos do chão); `t` 0..1 é o quanto do caminho já andou. */
export const andando = (m: Medidas, de: V3, ate: V3, t: number, f: number): Pose => {
  const d = sub(ate, de);
  const dist = Math.hypot(d[0], d[2]);
  const yaw = Math.atan2(d[0], d[2]);
  const x = limitar(t);
  const pos: V3 = [de[0] + d[0] * x, 0, de[2] + d[2] * x];
  const p = emPe(m, pos, yaw, f);
  const mexe = x > 0 && x < 1 ? 1 : 0;
  const passo = (m.perna[0] + m.perna[1]) * 0.42;
  const fase = (x * dist) / passo * Math.PI;
  const L = local(p.pos, yaw);
  const pe = (lado: 1 | -1) => {
    const s = Math.sin(fase + (lado === 1 ? 0 : Math.PI)) * mexe;
    const c = Math.max(0, Math.cos(fase + (lado === 1 ? 0 : Math.PI))) * mexe;
    return L(lado * m.quadril * 1.15, tornozelo(m) + passo * 0.22 * c, passo * 0.45 * s);
  };
  const braco = (lado: 1 | -1): V3 => {
    const s = Math.sin(fase + (lado === 1 ? Math.PI : 0)) * mexe;
    const q = lado === 1 ? p.maoE : p.maoD;
    const frente = L(0, 0, passo * 0.4 * s);
    return [q[0] + frente[0] - p.pos[0], q[1] + 0.02 * Math.abs(s), q[2] + frente[2] - p.pos[2]];
  };
  return { ...p, pos: [p.pos[0], p.pos[1] - 0.012 * Math.abs(Math.sin(fase)) * mexe, p.pos[2]], peE: pe(1), peD: pe(-1), maoE: braco(1), maoD: braco(-1), inclina: 0.03 + 0.05 * mexe };
};

/** Personagem sentado num assento de altura `assento`, pés no chão. `pos` é o ponto do assento. */
export const sentado = (m: Medidas, pos: V3, yaw: number, assento: number, f: number, semente = 0): Pose => {
  const bacia: V3 = [pos[0], assento + m.raioTorso * 0.7, pos[2]];
  const L = local(bacia, yaw);
  const frente = Math.min(m.perna[0] * 0.95, Math.sqrt(Math.max(0.01, (m.perna[0] + m.perna[1]) ** 2 * 0.86 - (bacia[1] - tornozelo(m)) ** 2)));
  return {
    pos: bacia,
    yaw,
    inclina: 0.06,
    tomba: 0,
    giroTorso: 0,
    cabeca: [0, 0, 0],
    maoE: L(m.quadril + 0.03, bacia[1] + 0.08, m.perna[0] * 0.6),
    maoD: L(-m.quadril - 0.03, bacia[1] + 0.08, m.perna[0] * 0.6),
    peE: L(m.quadril * 1.2, tornozelo(m), frente),
    peD: L(-m.quadril * 1.2, tornozelo(m), frente),
    peEInc: 0,
    peDInc: 0,
    boca: 0,
    sorriso: 0.6,
    olhos: piscar(f, semente),
    sobr: 0,
  };
};

/**
 * Buscar um objeto no chão e levar até um destino. `x` 0..1: anda até o objeto, abaixa, pega,
 * anda até o destino e solta. Devolve a pose e onde o objeto está.
 */
export const buscarELevar = (m: Medidas, f: number, x: number, c: { inicio: V3; objeto: V3; juntoDoObjeto: V3; juntoDoDestino: V3; destino: V3 }): { pose: Pose; objeto: V3 } => {
  const alt = (m.perna[0] + m.perna[1]) * 0.95;
  if (x < 0.14) return { pose: andando(m, c.inicio, c.juntoDoObjeto, x / 0.14, f), objeto: c.objeto };
  const yawObj = Math.atan2(c.objeto[0] - c.juntoDoObjeto[0], c.objeto[2] - c.juntoDoObjeto[2]);
  const naMao = (p: Pose): V3 => [p.pos[0] + Math.sin(p.yaw) * 0.16, alt, p.pos[2] + Math.cos(p.yaw) * 0.16];
  if (x < 0.4) {
    const desce = x < 0.24 ? limitar((x - 0.14) / 0.1) : x < 0.3 ? 1 : 1 - limitar((x - 0.3) / 0.1);
    const p = emPe(m, c.juntoDoObjeto, yawObj, f);
    const pose: Pose = { ...p, pos: [p.pos[0], p.pos[1] - alt * 0.42 * desce, p.pos[2]], inclina: 0.03 + 0.75 * desce, cabeca: [0.2 * desce, 0, 0] };
    const alvo: V3 = [c.objeto[0], c.objeto[1] + 0.08, c.objeto[2]];
    const pegou = x > 0.27;
    const mao = pegou ? ([alvo[0] + (naMao(p)[0] - alvo[0]) * limitar((x - 0.3) / 0.1), alvo[1] + (naMao(p)[1] - alvo[1]) * limitar((x - 0.3) / 0.1), alvo[2] + (naMao(p)[2] - alvo[2]) * limitar((x - 0.3) / 0.1)] as V3) : ([p.maoD[0] + (alvo[0] - p.maoD[0]) * desce, p.maoD[1] + (alvo[1] - p.maoD[1]) * desce, p.maoD[2] + (alvo[2] - p.maoD[2]) * desce] as V3);
    return { pose: { ...pose, maoD: mao }, objeto: pegou ? [mao[0], mao[1] - 0.08, mao[2]] : c.objeto };
  }
  if (x < 0.82) {
    const p = andando(m, c.juntoDoObjeto, c.juntoDoDestino, (x - 0.4) / 0.42, f);
    const mao = naMao(p);
    return { pose: { ...p, maoD: mao }, objeto: [mao[0], mao[1] - 0.08, mao[2]] };
  }
  const solta = limitar((x - 0.82) / 0.12);
  const yawDest = Math.atan2(c.destino[0] - c.juntoDoDestino[0], c.destino[2] - c.juntoDoDestino[2]);
  const p = emPe(m, c.juntoDoDestino, yawDest, f);
  const segura = naMao(p);
  const sobre: V3 = [c.destino[0], c.destino[1] + 0.2, c.destino[2]];
  const mao: V3 = [segura[0] + (sobre[0] - segura[0]) * solta, segura[1] + (sobre[1] - segura[1]) * solta, segura[2] + (sobre[2] - segura[2]) * solta];
  const cai = limitar((x - 0.92) / 0.06);
  return { pose: { ...p, inclina: 0.03 + 0.3 * solta, maoD: mao }, objeto: [mao[0], mao[1] - 0.08 - (mao[1] - 0.08 - c.destino[1]) * cai, mao[2]] };
};

/** Lia sentada à mesa do episódio da colher (tampo em y = 0), mãos sobre a mesa. */
export const naMesa = (f: number): Pose => ({
  pos: [0, -0.14, -0.3],
  yaw: 0,
  inclina: 0.12,
  tomba: 0,
  giroTorso: 0,
  cabeca: [0.15, 0, 0],
  maoE: [0.17, 0.04, -0.1],
  maoD: [-0.17, 0.04, -0.1],
  peE: [0.07, -0.57, -0.2],
  peD: [-0.07, -0.57, -0.2],
  peEInc: 0,
  peDInc: 0,
  boca: 0,
  sorriso: 0.6,
  olhos: piscar(f, 3),
  sobr: 0,
});
