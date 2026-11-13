import React from "react";
import "../lousa/fontes";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Filme3D } from "./Filme3D";
import { Final, Legenda, MARCA, Nota, Replay } from "./Legendas";
import { estado } from "./coreografia";
import { FINAL } from "./roteiro";

/** "Explica, Mente!" · episódio do tênis (terapia ocupacional), 1080×1920, 40 s. */
export const ExplicaMenteTenis: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: MARCA.creme }}>
      {f < FINAL.de + 14 && <Filme3D e={estado(f)} />}
      <Replay f={f} />
      <Nota f={f} />
      <Legenda f={f} />
      <Final f={f} />
    </AbsoluteFill>
  );
};
