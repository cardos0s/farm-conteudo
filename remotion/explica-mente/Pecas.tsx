import React, { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { comp, sub, type V3 } from "./anim";

type MatProps = { cor: string; rug?: number; emissivo?: string; brilho?: number };

/** Material "massinha": fosco, com um leve brilho. */
export const Mat: React.FC<MatProps> = ({ cor, rug = 0.62, emissivo, brilho = 0 }) => (
  <meshStandardMaterial color={cor} roughness={rug} metalness={0} emissive={emissivo ?? "#000000"} emissiveIntensity={brilho} />
);

type PecaProps = {
  pos?: V3;
  rot?: V3 | [number, number, number, "YXZ"];
  escala?: V3 | number;
  cor: string;
  rug?: number;
  sombra?: boolean;
  recebe?: boolean;
  emissivo?: string;
  brilho?: number;
};

export const Esfera: React.FC<PecaProps & { r: number }> = ({ pos, rot, escala, r, sombra = true, recebe = true, ...mat }) => (
  <mesh position={pos} rotation={rot as never} scale={escala} castShadow={sombra} receiveShadow={recebe}>
    <sphereGeometry args={[r, 32, 24]} />
    <Mat {...mat} />
  </mesh>
);

export const Cilindro: React.FC<PecaProps & { r: number; r2?: number; h: number }> = ({ pos, rot, escala, r, r2, h, sombra = true, recebe = true, ...mat }) => (
  <mesh position={pos} rotation={rot as never} scale={escala} castShadow={sombra} receiveShadow={recebe}>
    <cylinderGeometry args={[r, r2 ?? r, h, 40]} />
    <Mat {...mat} />
  </mesh>
);

export const Caixa: React.FC<PecaProps & { t: V3; raio?: number }> = ({ pos, rot, escala, t, raio = 0.01, sombra = true, recebe = true, ...mat }) => {
  const geo = useMemo(() => new RoundedBoxGeometry(t[0], t[1], t[2], 4, Math.min(raio, Math.min(...t) / 2 - 0.0005)), [t[0], t[1], t[2], raio]);
  return (
    <mesh position={pos} rotation={rot as never} scale={escala} geometry={geo} castShadow={sombra} receiveShadow={recebe}>
      <Mat {...mat} />
    </mesh>
  );
};

const CIMA = new Vector3(0, 1, 0);

/** Segmento arredondado entre dois pontos do mundo (osso de braço, perna, pé de banco). */
export const Seg: React.FC<{ a: V3; b: V3; r: number; r2?: number; cor: string; pontas?: boolean; rug?: number }> = ({ a, b, r, r2, cor, pontas = true, rug }) => {
  const d = sub(b, a);
  const c = comp(d) || 0.0001;
  const q = new Quaternion().setFromUnitVectors(CIMA, new Vector3(d[0] / c, d[1] / c, d[2] / c));
  const rb = r2 ?? r;
  return (
    <>
      <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} scale={[1, c, 1]} castShadow receiveShadow>
        <cylinderGeometry args={[rb, r, 1, 24]} />
        <Mat cor={cor} rug={rug} />
      </mesh>
      {pontas && (
        <>
          <Esfera pos={a} r={r} cor={cor} rug={rug} />
          <Esfera pos={b} r={rb} cor={cor} rug={rug} />
        </>
      )}
    </>
  );
};
