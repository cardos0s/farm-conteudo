import React, { useLayoutEffect } from "react";
import "../../lousa/fontes";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { PerspectiveCamera } from "three";
import { Boneco, LIA } from "../Boneco";
import { ALTURA_BANCO_ALTO, Anel, BancoAlto, Sala } from "../Cenario";
import { Final, Legenda, MARCA, Nota } from "../Legendas";
import { Esfera, Seg } from "../Pecas";
import { TenisCadarco } from "../Tenis";
import { ALTURA, LARGURA } from "../roteiro";
import { estado, type EstadoTarefa } from "./coreografia";
import { FALAS, FINAL, NOTA } from "./roteiro";

const Camera: React.FC<{ cam: EstadoTarefa["cam"] }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.near = 0.2;
    camera.far = 30;
    camera.lookAt(...cam.alvo);
    camera.updateProjectionMatrix();
  });
  return null;
};

const Cena: React.FC<{ e: EstadoTarefa }> = ({ e }) => (
  <ThreeCanvas width={LARGURA} height={ALTURA} shadows flat camera={{ fov: e.cam.fov, position: e.cam.pos }} style={{ backgroundColor: "#FFF0DA" }}>
    <Camera cam={e.cam} />
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
    <Sala />
    <group scale={[1, e.banco / ALTURA_BANCO_ALTO, 1]}>
      <BancoAlto pos={[0, 0, 0]} />
    </group>
    <Boneco m={LIA} p={e.lia} />
    <group position={e.tenis.pos} rotation={[e.tenis.rot[0], e.tenis.rot[1], e.tenis.rot[2], "YXZ"]}>
      <TenisCadarco lingua={e.tenis.lingua} pontaE={e.tenis.pontaE} pontaD={e.tenis.pontaD} firme={e.tenis.firme} />
    </group>
    {e.maos.map((m, i) => (
      <group key={i}>
        <Seg a={m.de} b={m.pos} r={0.036} r2={0.03} cor={LIA.cores.pele} />
        <Esfera r={0.04} pos={m.pos} cor={LIA.cores.pele} />
      </group>
    ))}
    {e.anel && e.anel.forca > 0.01 && <Anel {...e.anel} />}
  </ThreeCanvas>
);

/** "Explica, Mente!" · o que calçar um tênis tem a ver com terapia ocupacional (1080×1920, 38 s). */
export const ExplicaMenteTarefa: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: MARCA.creme }}>
      {f < FINAL.de + 14 && <Cena e={estado(f)} />}
      <Nota f={f} nota={NOTA} />
      <Legenda f={f} falas={FALAS} />
      <Final f={f} final={FINAL} />
    </AbsoluteFill>
  );
};
