import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { quadrosDaCena, type PropsReel } from "../src/core/roteiro";
import { RenderCena } from "./cenas/Cenas";
import { ElementoMarca } from "./marca/Elemento";

export const Reel: React.FC<PropsReel> = ({ marca, roteiro }) => (
  <AbsoluteFill style={{ background: marca.cores.fundo }}>
    <Series>
      {roteiro.cenas.map((cena, i) => (
        <Series.Sequence key={i} durationInFrames={quadrosDaCena(cena)}>
          <RenderCena cena={cena} marca={marca} />
        </Series.Sequence>
      ))}
    </Series>
    <ElementoMarca marca={marca} />
  </AbsoluteFill>
);
