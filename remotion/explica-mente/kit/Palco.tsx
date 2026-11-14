import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import type { PerspectiveCamera } from "three";
import { Sala } from "../Cenario";
import type { V3 } from "../anim";
import { ALTURA, LARGURA } from "../roteiro";

export type Cam = { pos: V3; alvo: V3; fov: number };

const Camera: React.FC<{ cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.near = 0.1;
    camera.far = 40;
    camera.lookAt(...cam.alvo);
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Cena 3D padrão dos episódios: câmera, luzes e (se quiser) a sala. */
export const Palco: React.FC<{ cam: Cam; largura?: number; altura?: number; sala?: V3 | false; children?: React.ReactNode }> = ({ cam, largura = LARGURA, altura = ALTURA, sala = [0, 0, 0], children }) => (
  <ThreeCanvas width={largura} height={altura} shadows flat camera={{ fov: cam.fov, position: cam.pos }} style={{ backgroundColor: "#FFF0DA" }}>
    <Camera cam={cam} />
    <color attach="background" args={["#FFF0DA"]} />
    <hemisphereLight args={["#FFFFFF", "#F3D9B5", 1.55]} />
    <directionalLight
      position={[-2.2, 4.2, 3.4]}
      intensity={1.75}
      color="#FFF6E8"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-3}
      shadow-camera-right={3}
      shadow-camera-top={3}
      shadow-camera-bottom={-3}
      shadow-camera-near={0.5}
      shadow-camera-far={12}
      shadow-bias={-0.0006}
      shadow-normalBias={0.02}
    />
    <directionalLight position={[3, 1.5, 2.5]} intensity={0.35} color="#E6DCFF" />
    {sala && (
      <group position={sala}>
        <Sala />
      </group>
    )}
    {children}
  </ThreeCanvas>
);

/** Onde um ponto do mundo aparece na tela (em pixels), para colocar rótulos 2D sobre a cena. */
export const projetar = (cam: Cam, ponto: V3, largura = LARGURA, altura = ALTURA): { x: number; y: number } => {
  const f = [cam.alvo[0] - cam.pos[0], cam.alvo[1] - cam.pos[1], cam.alvo[2] - cam.pos[2]];
  const fl = Math.hypot(f[0], f[1], f[2]);
  const fw = f.map((v) => v / fl);
  const r = [-fw[2], 0, fw[0]];
  const rl = Math.hypot(r[0], r[2]) || 1;
  const rt = [r[0] / rl, 0, r[2] / rl];
  const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const d = [ponto[0] - cam.pos[0], ponto[1] - cam.pos[1], ponto[2] - cam.pos[2]];
  const z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
  const x = d[0] * rt[0] + d[2] * rt[2];
  const y = d[0] * up[0] + d[1] * up[1] + d[2] * up[2];
  const escala = altura / 2 / Math.tan((cam.fov * Math.PI) / 360) / z;
  return { x: largura / 2 + x * escala, y: altura / 2 - y * escala };
};
