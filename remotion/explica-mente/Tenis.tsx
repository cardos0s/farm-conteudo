import React from "react";
import { Caixa, Cilindro, Esfera } from "./Pecas";
import type { V3 } from "./anim";

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
