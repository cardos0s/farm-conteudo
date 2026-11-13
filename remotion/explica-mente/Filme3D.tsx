import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import type { PerspectiveCamera } from "three";
import { Boneco, LIA, TERA } from "./Boneco";
import { Anel, BancoAlto, Banquinho, Caneta, Prancheta, Sala } from "./Cenario";
import { Tenis } from "./Tenis";
import type { Estado } from "./coreografia";
import { ALTURA, LARGURA } from "./roteiro";

const Camera: React.FC<{ cam: Estado["cam"] }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.near = 0.3;
    camera.far = 30;
    camera.lookAt(...cam.alvo);
    camera.updateProjectionMatrix();
  });
  return null;
};

export const Filme3D: React.FC<{ e: Estado }> = ({ e }) => (
  <ThreeCanvas
    width={LARGURA}
    height={ALTURA}
    shadows
    flat
    camera={{ fov: e.cam.fov, position: e.cam.pos }}
    style={{ backgroundColor: "#FFF0DA" }}
  >
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
      shadow-radius={5}
    />
    <directionalLight position={[3, 1.5, 2.5]} intensity={0.35} color="#E6DCFF" />

    <Sala />
    <BancoAlto pos={[0, 0, 0]} />
    {e.banquinho && <Banquinho pos={e.banquinho} />}

    <Boneco m={LIA} p={e.lia} calcadoD={e.liaCalcada} tenisAberto={e.tenisNoPe} />
    {e.tera && <Boneco m={TERA} p={e.tera} />}

    {e.tenisA && (
      <group position={e.tenisA.pos} rotation={[e.tenisA.rot[0], e.tenisA.rot[1], e.tenisA.rot[2], "YXZ"]}>
        <Tenis aberto={e.tenisA.aberto} />
      </group>
    )}
    <group position={e.tenisB.pos} rotation={[e.tenisB.rot[0], e.tenisB.rot[1], e.tenisB.rot[2], "YXZ"]}>
      <Tenis aberto={e.tenisB.aberto} />
    </group>

    {e.anel && e.anel.forca > 0.01 && <Anel {...e.anel} />}
    {e.prancheta && <Prancheta {...e.prancheta} />}
    {e.caneta && <Caneta {...e.caneta} />}
  </ThreeCanvas>
);
