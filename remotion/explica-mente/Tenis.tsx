import React from "react";
import { Caixa, Cilindro, Esfera, Seg } from "./Pecas";
import { mixV, type V3 } from "./anim";

export const CORES_TENIS = { cabedal: "#FF5A4E", escuro: "#B7342C", sola: "#FFFFFF", tira: "#2EC4B6", detalhe: "#FFC53D" };

/** Onde fica o tornozelo, medido a partir da origem do tênis (centro da sola, no chão). */
export const TORNOZELO_NO_TENIS: V3 = [0, 0.082, -0.048];

/**
 * Tênis infantil de velcro. Origem no centro da sola, bico apontando para +z.
 * `aberto` (0..1) levanta a tira e puxa a língua para a frente.
 */
export const Tenis: React.FC<{ aberto?: number; escala?: number }> = ({ aberto = 0, escala = 1 }) => {
  const c = CORES_TENIS;
  return (
    <group scale={escala}>
      {/* sola */}
      <Caixa t={[0.09, 0.024, 0.214]} raio={0.011} pos={[0, 0.012, 0]} cor={c.sola} rug={0.5} />
      <Caixa t={[0.086, 0.012, 0.206]} raio={0.005} pos={[0, 0.028, 0]} cor={c.detalhe} />
      {/* calcanhar e cano */}
      <Caixa t={[0.088, 0.076, 0.118]} raio={0.03} pos={[0, 0.066, -0.046]} cor={c.cabedal} />
      {/* bico */}
      <Esfera r={1} escala={[0.044, 0.037, 0.078]} pos={[0, 0.05, 0.04]} cor={c.cabedal} />
      <Esfera r={1} escala={[0.0405, 0.03, 0.04]} pos={[0, 0.044, 0.078]} cor={c.sola} rug={0.5} />
      {/* boca do tênis */}
      <Cilindro r={0.03} h={0.006} escala={[1, 1, 1.3]} pos={[0, 0.102, -0.05]} cor={c.escuro} sombra={false} />
      <Caixa t={[0.02, 0.03, 0.008]} raio={0.003} pos={[0, 0.105, -0.107]} cor={c.tira} />
      {/* língua: dobra para a frente quando o tênis abre */}
      <group position={[0, 0.07, 0.03]} rotation={[-0.55 + aberto * 0.75, 0, 0]}>
        <Caixa t={[0.05, 0.012, 0.07]} raio={0.005} pos={[0, 0.004, -0.032]} cor={c.sola} rug={0.5} />
      </group>
      {/* tira de velcro: dobradiça no lado de fora */}
      <group position={[0.044, 0.078, 0.004]} rotation={[0, 0, -aberto * 1.9]}>
        <Caixa t={[0.094, 0.012, 0.036]} raio={0.005} pos={[-0.045, 0.012, 0]} rot={[0, 0, 0]} cor={c.tira} />
      </group>
      {/* estrela lateral */}
      <Esfera r={0.014} escala={[0.35, 1, 1]} pos={[-0.043, 0.062, -0.05]} cor={c.detalhe} />
      <Esfera r={0.014} escala={[0.35, 1, 1]} pos={[0.043, 0.062, -0.05]} cor={c.detalhe} />
    </group>
  );
};

/** Onde a ponta de cada cadarço descansa quando está solta (coordenadas do tênis). */
export const CADARCO_SOLTO = { E: [0.1, 0.007, 0.02] as V3, D: [-0.1, 0.007, 0.02] as V3 };
const ILHOS = { E: [0.02, 0.1, 0.004] as V3, D: [-0.02, 0.1, 0.004] as V3 };

const Fio: React.FC<{ de: V3; ate: V3; firme: number; lado: 1 | -1 }> = ({ de, ate, firme, lado }) => {
  // curva de Bézier: caída por cima do tênis quando solto, quase reta quando alguém segura a ponta
  const meio: V3 = [(de[0] + ate[0]) / 2, (de[1] + ate[1]) / 2, (de[2] + ate[2]) / 2];
  const ctrl = mixV([lado * 0.072, 0.118, 0.0], [meio[0], meio[1] - 0.012, meio[2] + 0.01], firme);
  const N = 12;
  const pts: V3[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;
    pts.push([a * de[0] + b * ctrl[0] + c * ate[0], Math.max(0.005, a * de[1] + b * ctrl[1] + c * ate[1]), a * de[2] + b * ctrl[2] + c * ate[2]]);
  }
  return (
    <>
      {pts.slice(1).map((p, i) => (
        <Seg key={i} a={pts[i]} b={p} r={0.0048} cor={i === N - 1 ? CORES_TENIS.detalhe : CORES_TENIS.tira} />
      ))}
    </>
  );
};

/**
 * Tênis de cadarço. `lingua` (0..1) puxa a língua para fora; `pontaE` e `pontaD` são as pontas
 * soltas dos cadarços (coordenadas do tênis) e `firme` diz o quanto estão esticadas.
 */
export const TenisCadarco: React.FC<{ lingua?: number; pontaE?: V3; pontaD?: V3; firme?: number }> = ({ lingua = 0, pontaE = CADARCO_SOLTO.E, pontaD = CADARCO_SOLTO.D, firme = 0 }) => {
  const c = CORES_TENIS;
  return (
    <group>
      <Caixa t={[0.09, 0.024, 0.214]} raio={0.011} pos={[0, 0.012, 0]} cor={c.sola} rug={0.5} />
      <Caixa t={[0.086, 0.012, 0.206]} raio={0.005} pos={[0, 0.028, 0]} cor={c.detalhe} />
      <Caixa t={[0.088, 0.076, 0.118]} raio={0.03} pos={[0, 0.066, -0.046]} cor={c.cabedal} />
      <Esfera r={1} escala={[0.044, 0.037, 0.078]} pos={[0, 0.05, 0.04]} cor={c.cabedal} />
      <Esfera r={1} escala={[0.0405, 0.03, 0.04]} pos={[0, 0.044, 0.078]} cor={c.sola} rug={0.5} />
      <Cilindro r={0.03} h={0.006} escala={[1, 1, 1.3]} pos={[0, 0.102, -0.05]} cor={c.escuro} sombra={false} />
      <Caixa t={[0.02, 0.03, 0.008]} raio={0.003} pos={[0, 0.105, -0.107]} cor={c.tira} />
      {/* língua */}
      <group position={[0, 0.076, 0.04]} rotation={[0.72 + lingua * 0.8, 0, 0]}>
        <Caixa t={[0.054, 0.013, 0.078]} raio={0.006} pos={[0, 0.004, -0.039]} cor={c.sola} rug={0.5} />
      </group>
      {/* cadarço trançado */}
      {[0, 1, 2].map((i) => {
        const z = 0.052 - i * 0.02;
        const y = 0.083 + i * 0.008;
        return (
          <group key={i}>
            <Seg a={[-0.024, y, z]} b={[0.024, y + 0.006, z - 0.016]} r={0.0045} cor={c.tira} />
            <Seg a={[0.024, y, z]} b={[-0.024, y + 0.006, z - 0.016]} r={0.0045} cor={c.tira} />
          </group>
        );
      })}
      <Fio de={ILHOS.E} ate={pontaE} firme={firme} lado={1} />
      <Fio de={ILHOS.D} ate={pontaD} firme={firme} lado={-1} />
      <Esfera r={0.014} escala={[0.35, 1, 1]} pos={[-0.045, 0.062, -0.05]} cor={c.detalhe} />
      <Esfera r={0.014} escala={[0.35, 1, 1]} pos={[0.045, 0.062, -0.05]} cor={c.detalhe} />
    </group>
  );
};

/** Ponta da língua do tênis de cadarço, para a mão saber onde segurar. */
export const pontaDaLingua = (lingua: number): V3 => {
  const a = 0.72 + lingua * 0.8;
  const y = 0.004;
  const z = -0.074;
  return [0, 0.076 + y * Math.cos(a) - z * Math.sin(a), 0.04 + y * Math.sin(a) + z * Math.cos(a)];
};
