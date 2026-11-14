import React from "react";
import { Caixa, Cilindro, Esfera, Seg } from "../Pecas";
import { limitar, mixV, type V3 } from "../anim";

export const CORES = { cabo: "#2EC4B6", metal: "#DDE0EA", metalEscuro: "#B4B8CA", comida: "#F6A93B", tigela: "#6C4BD8", pele: "#B5734A", manga: "#FFC53D" };

/** Onde a mão segura o cabo, medido ao longo da colher (origem no meio do cabo, concha em +z). */
export const PEGA_Z = -0.01;
/** Centro da concha, em coordenadas da colher. */
export const CONCHA: V3 = [0, 0.004, 0.112];

/** Colher infantil: cabo grosso colorido e concha de metal. `comida` 0..1 enche a concha. */
export const Colher: React.FC<{ comida?: number }> = ({ comida = 0 }) => (
  <group>
    <Seg a={[0, 0, -0.075]} b={[0, 0, 0.05]} r={0.0115} r2={0.0095} cor={CORES.cabo} />
    <Seg a={[0, 0, 0.05]} b={[0, 0.001, 0.082]} r={0.005} r2={0.0055} cor={CORES.metal} rug={0.3} />
    <Esfera r={1} escala={[0.026, 0.0085, 0.036]} pos={[0, -0.001, 0.112]} cor={CORES.metal} rug={0.3} />
    <Esfera r={1} escala={[0.0215, 0.004, 0.031]} pos={[0, 0.0052, 0.112]} cor={CORES.metalEscuro} rug={0.35} sombra={false} />
    {comida > 0.02 && <Esfera r={1} escala={[0.021 * comida, 0.013 * comida, 0.03 * comida]} pos={[0, 0.011, 0.112]} cor={CORES.comida} rug={0.8} />}
  </group>
);

export const Tigela: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <Cilindro r={0.082} r2={0.052} h={0.05} pos={[0, 0.025, 0]} cor={CORES.tigela} />
    <Cilindro r={0.073} h={0.006} pos={[0, 0.049, 0]} cor={CORES.comida} rug={0.85} sombra={false} />
  </group>
);

/** Comida que caiu na mesa. */
export const Mancha: React.FC<{ pos: V3; tamanho?: number }> = ({ pos, tamanho = 1 }) => (
  <group position={pos} scale={tamanho}>
    <Esfera r={1} escala={[0.036, 0.005, 0.03]} pos={[0, 0.002, 0]} cor={CORES.comida} rug={0.8} sombra={false} />
    <Esfera r={1} escala={[0.012, 0.004, 0.011]} pos={[0.044, 0.002, 0.012]} cor={CORES.comida} rug={0.8} sombra={false} />
    <Esfera r={1} escala={[0.009, 0.003, 0.009]} pos={[-0.03, 0.002, 0.03]} cor={CORES.comida} rug={0.8} sombra={false} />
  </group>
);

export const Mesa: React.FC = () => (
  <>
    <Caixa t={[1.7, 0.05, 1.0]} raio={0.02} pos={[0, -0.025, 0.2]} cor="#FFF6E6" rug={0.8} />
    <Caixa t={[1.66, 0.9, 0.04]} raio={0.015} pos={[0, -0.47, 0.67]} cor="#F3E2C8" rug={0.85} />
    <Caixa t={[0.56, 0.006, 0.36]} raio={0.002} pos={[0, 0.002, 0.03]} cor="#C9F0EA" rug={0.9} sombra={false} />
  </>
);

// ---------- mão com dedos ----------
const FALANGES = [0.03, 0.024, 0.02];
/** Centro do cabo dentro da mão fechada, em coordenadas da mão. */
export const CABO_NA_MAO: V3 = [0, 0.037, 0.03];

/**
 * Pontos de um dedo (base, duas juntas e ponta) em coordenadas da mão.
 * Mão: +y aponta para os dedos, +z é a palma, +x é o lado do polegar. `fecha` 0 = aberta, 1 = punho.
 */
export const dedo = (i: number, fecha: number): V3[] => {
  const x = -0.027 + i * 0.018;
  const pts: V3[] = [[x, 0.036 - Math.abs(i - 1.5) * 0.003, 0.004]];
  for (let j = 0; j < 3; j++) {
    const a = fecha * 0.9 * (j + 1);
    const p = pts[j];
    pts.push([x, p[1] + FALANGES[j] * Math.cos(a), p[2] + FALANGES[j] * Math.sin(a)]);
  }
  return pts;
};

const polegar = (fecha: number): V3[] => {
  const t = limitar(fecha);
  const base: V3 = [0.034, -0.014, 0.006];
  const d1 = mixV([0.8, 0.55, 0.2], [0.45, 0.6, 0.72], t);
  const d2 = mixV([0.75, 0.65, 0.1], [-0.72, 0.3, 0.6], t);
  const p1: V3 = [base[0] + d1[0] * 0.03, base[1] + d1[1] * 0.03, base[2] + d1[2] * 0.03];
  return [base, p1, [p1[0] + d2[0] * 0.026, p1[1] + d2[1] * 0.026, p1[2] + d2[2] * 0.026]];
};

/** Caminho do sinal: da ponta de um dedo até o antebraço (coordenadas da mão). */
export const caminhoDoSinal = (i: number, fecha: number): V3[] => [...dedo(i, fecha).reverse(), [0, 0, 0.004], [0, -0.05, 0], [0, -0.16, 0], [0, -0.34, 0]];

export const Mao: React.FC<{ fecha: number }> = ({ fecha }) => {
  const pg = polegar(fecha);
  return (
    <group>
      <Caixa t={[0.078, 0.08, 0.03]} raio={0.014} cor={CORES.pele} />
      {[0, 1, 2, 3].map((i) => {
        const p = dedo(i, fecha);
        const r = i === 3 ? 0.0078 : 0.0088;
        return (
          <group key={i}>
            <Seg a={p[0]} b={p[1]} r={r} cor={CORES.pele} />
            <Seg a={p[1]} b={p[2]} r={r * 0.95} cor={CORES.pele} />
            <Seg a={p[2]} b={p[3]} r={r * 0.9} cor={CORES.pele} />
          </group>
        );
      })}
      <Seg a={pg[0]} b={pg[1]} r={0.011} cor={CORES.pele} />
      <Seg a={pg[1]} b={pg[2]} r={0.0098} cor={CORES.pele} />
      {/* pulso, antebraço e manga */}
      <Seg a={[0, -0.03, 0]} b={[0, -0.2, 0]} r={0.027} r2={0.031} cor={CORES.pele} />
      <Seg a={[0, -0.2, 0]} b={[0, -0.6, 0]} r={0.036} r2={0.04} cor={CORES.manga} />
    </group>
  );
};

/** Ponto de luz que atravessa a mão (desenhado por cima de tudo). */
export const Luz: React.FC<{ pos: V3; r: number; cor: string; forca: number }> = ({ pos, r, cor, forca }) => (
  <group position={pos}>
    <mesh renderOrder={10}>
      <sphereGeometry args={[r * 2.6, 20, 14]} />
      <meshBasicMaterial color={cor} transparent opacity={0.35 * forca} depthTest={false} depthWrite={false} />
    </mesh>
    <mesh renderOrder={11}>
      <sphereGeometry args={[r, 20, 14]} />
      <meshBasicMaterial color={cor} transparent opacity={0.95 * forca} depthTest={false} depthWrite={false} />
    </mesh>
  </group>
);
