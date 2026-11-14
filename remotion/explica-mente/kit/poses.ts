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
