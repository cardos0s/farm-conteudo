import React from "react";
import { Caixa, Cilindro, Esfera, Mat, Seg } from "./Pecas";
import type { V3 } from "./anim";

export const ALTURA_BANCO_ALTO = 0.6;
export const ALTURA_BANQUINHO = 0.27;

export const BancoAlto: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <Cilindro r={0.175} h={0.045} pos={[0, ALTURA_BANCO_ALTO - 0.0225, 0]} cor="#F2A93B" />
    {[
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].map(([x, z], i) => (
      <Seg key={i} a={[x * 0.1, ALTURA_BANCO_ALTO - 0.04, z * 0.1]} b={[x * 0.165, 0.012, z * 0.165]} r={0.017} cor="#FFFFFF" rug={0.5} />
    ))}
  </group>
);

export const Banquinho: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <Cilindro r={0.19} h={0.06} pos={[0, ALTURA_BANQUINHO - 0.03, 0]} cor="#2EC4B6" />
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      return <Seg key={i} a={[Math.cos(a) * 0.1, ALTURA_BANQUINHO - 0.05, Math.sin(a) * 0.1]} b={[Math.cos(a) * 0.15, 0.025, Math.sin(a) * 0.15]} r={0.028} cor="#F0C78F" />;
    })}
  </group>
);

export const Prancheta: React.FC<{ pos: V3; rot: V3 }> = ({ pos, rot }) => (
  <group position={pos} rotation={[rot[0], rot[1], rot[2], "YXZ"]}>
    <Caixa t={[0.24, 0.32, 0.014]} raio={0.006} cor="#B8793F" />
    <Caixa t={[0.21, 0.27, 0.004]} raio={0.001} pos={[0, -0.012, 0.009]} cor="#FFFFFF" sombra={false} />
    <Caixa t={[0.09, 0.03, 0.02]} raio={0.008} pos={[0, 0.145, 0.012]} cor="#8B8FA8" rug={0.3} />
    {[0.07, 0.035, 0, -0.035].map((y, i) => (
      <Caixa key={i} t={[i === 3 ? 0.09 : 0.16, 0.007, 0.002]} raio={0.0005} pos={[i === 3 ? -0.035 : 0, y, 0.0125]} cor="#6C4BD8" sombra={false} />
    ))}
  </group>
);

export const Caneta: React.FC<{ pos: V3; rot: V3 }> = ({ pos, rot }) => (
  <group position={pos} rotation={[rot[0], rot[1], rot[2], "YXZ"]}>
    <Cilindro r={0.008} h={0.13} pos={[0, 0.05, 0]} cor="#FF5A4E" />
    <Cilindro r={0.001} r2={0.008} h={0.02} pos={[0, -0.025, 0]} cor="#2B2F55" />
  </group>
);

/** Anel que marca o pé apoiado no chão. */
export const Anel: React.FC<{ pos: V3; raio: number; forca: number }> = ({ pos, raio, forca }) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[raio * 0.8, raio, 48]} />
    <meshBasicMaterial color="#6C4BD8" transparent opacity={forca} depthWrite={false} />
  </mesh>
);

export const Sala: React.FC = () => (
  <>
    {/* chão */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <Mat cor="#EFCFA6" rug={0.85} />
    </mesh>
    {/* tapete */}
    <Cilindro r={1.25} h={0.012} pos={[0.45, 0.006, 0.35]} cor="#D6C8FA" rug={0.95} sombra={false} />
    <Cilindro r={1.02} h={0.014} pos={[0.45, 0.007, 0.35]} cor="#E6DCFF" rug={0.95} sombra={false} />
    {/* parede do fundo e rodapé */}
    <mesh position={[0, 4, -1.7]} receiveShadow>
      <planeGeometry args={[30, 8]} />
      <Mat cor="#FFF0DA" rug={0.95} />
    </mesh>
    <Caixa t={[30, 0.12, 0.04]} raio={0.01} pos={[0, 0.06, -1.68]} cor="#FFFFFF" />
    {/* janela */}
    <group position={[-0.62, 1.72, -1.68]}>
      <Caixa t={[0.86, 1.0, 0.05]} raio={0.02} cor="#FFFFFF" />
      <Caixa t={[0.74, 0.88, 0.052]} raio={0.01} cor="#BFE6FF" emissivo="#BFE6FF" brilho={0.55} sombra={false} />
      <Caixa t={[0.035, 0.88, 0.06]} raio={0.005} cor="#FFFFFF" />
      <Caixa t={[0.74, 0.035, 0.06]} raio={0.005} cor="#FFFFFF" />
      <Esfera r={0.13} escala={[1, 0.6, 0.1]} pos={[-0.18, 0.2, 0.03]} cor="#FFFFFF" emissivo="#FFFFFF" brilho={0.5} sombra={false} />
      <Esfera r={0.1} escala={[1, 0.6, 0.1]} pos={[-0.06, 0.16, 0.03]} cor="#FFFFFF" emissivo="#FFFFFF" brilho={0.5} sombra={false} />
    </group>
    {/* prateleira com brinquedos */}
    <group position={[0.92, 1.32, -1.58]}>
      <Caixa t={[0.9, 0.035, 0.22]} raio={0.01} cor="#D99B5B" />
      <Caixa t={[0.14, 0.14, 0.14]} raio={0.02} pos={[-0.3, 0.088, 0]} cor="#FF5A4E" />
      <Caixa t={[0.12, 0.12, 0.12]} raio={0.02} pos={[-0.15, 0.078, 0.01]} rot={[0, 0.4, 0]} cor="#2EC4B6" />
      <Caixa t={[0.11, 0.11, 0.11]} raio={0.02} pos={[-0.24, 0.213, 0]} rot={[0, 0.25, 0]} cor="#FFC53D" />
      <Esfera r={0.085} pos={[0.08, 0.103, 0]} cor="#6C4BD8" />
      <Cilindro r={0.05} r2={0.07} h={0.13} pos={[0.3, 0.083, 0]} cor="#FFFFFF" />
      <Esfera r={0.075} pos={[0.3, 0.2, 0]} cor="#3FAE6A" rug={0.9} />
      <Esfera r={0.055} pos={[0.345, 0.25, 0.01]} cor="#3FAE6A" rug={0.9} />
    </group>
    {/* quadro */}
    <group position={[0.75, 2.05, -1.68]}>
      <Caixa t={[0.5, 0.62, 0.04]} raio={0.015} cor="#FFFFFF" />
      <Caixa t={[0.42, 0.54, 0.042]} raio={0.008} cor="#FFE3A8" sombra={false} />
      <Esfera r={0.1} escala={[1, 1, 0.1]} pos={[-0.05, 0.08, 0.022]} cor="#FF5A4E" sombra={false} />
      <Caixa t={[0.16, 0.16, 0.01]} raio={0.004} pos={[0.07, -0.1, 0.022]} rot={[0, 0, 0.3]} cor="#6C4BD8" sombra={false} />
    </group>
    {/* bola de terapia */}
    <Esfera r={0.34} pos={[-1.0, 0.34, -1.0]} cor="#2EC4B6" rug={0.45} />
    {/* caixa de brinquedos */}
    <Caixa t={[0.5, 0.32, 0.36]} raio={0.03} pos={[1.75, 0.16, -1.2]} cor="#FFC53D" />
  </>
);
