import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../marca/fontes";
import { Cavalo } from "./Cavalo";
import { Celular } from "./Celular";
import { Mundo, type Vista } from "./Mundo";
import { A, FPS, INICIO_FALA, L, camera, falas } from "./roteiro";
import { Sobreposicoes } from "./Sobreposicoes";

// Reel do Rebanho (1080x1920): pesagem do gado por foto, visto em primeira pessoa de cima do cavalo.
// 1. a porteira abre e a gente entra no curral · 2. foto do boi e o peso · 3. mais dois bois · 4. lote do dia.

export function ReelPesagem() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100, cx: L / 2, hor: cam.hor, w: L, h: A };
  const borrao = Math.min(40, Math.abs(cam.giroVel) * 0.16);
  return (
    <AbsoluteFill style={{ background: "#8CC4EC", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="giro" x="-10%" width="120%">
          <feGaussianBlur stdDeviation={`${borrao.toFixed(1)} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `rotate(${cam.rolo.toFixed(3)}deg) scale(1.05)`, filter: borrao > 0.5 ? "url(#giro)" : undefined }}>
        <Mundo v={v} t={t} id="m" />
      </AbsoluteFill>
      <Cavalo cam={cam} t={t} />
      <Celular cam={cam} t={t} />
      <Sobreposicoes t={t} />
      {falas.map((f, i) => (
        <Sequence key={i} from={Math.round(INICIO_FALA[i]! * FPS)} layout="none">
          <Audio src={staticFile(f.arquivo)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
