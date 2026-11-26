import React from "react";
import "./marca/fontes";
import { Composition } from "remotion";
import { FPS, duracaoTotal, type PropsReel } from "../src/core/roteiro";
import { AulaComplexidade } from "./aulas/complexidade/Aula";
import { FPS as FPS_AULA, TOTAL_QUADROS } from "./aulas/complexidade/roteiro";
import { AulaRecursividade } from "./aulas/recursividade/Aula";
import { FPS as FPS_AULA2, TOTAL_QUADROS as TOTAL_AULA2 } from "./aulas/recursividade/roteiro";
import { ReelAgentes } from "./aulas/agentes/Reel";
import { FPS as FPS_AGENTES, TOTAL_QUADROS as TOTAL_AGENTES } from "./aulas/agentes/roteiro";
import { ReelPix } from "./aulas/pix/Reel";
import { FPS as FPS_PIX, TOTAL_QUADROS as TOTAL_PIX } from "./aulas/pix/roteiro";
import { ReelPatterns } from "./aulas/patterns/Reel";
import { FPS as FPS_PATTERNS, TOTAL_QUADROS as TOTAL_PATTERNS } from "./aulas/patterns/roteiro";
import { exemplos } from "./exemplos";
import { Reel } from "./Reel";

export const Root: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={duracaoTotal(exemplos.focca.roteiro)}
      defaultProps={exemplos.focca}
      calculateMetadata={({ props }: { props: PropsReel }) => ({ durationInFrames: duracaoTotal(props.roteiro) })}
    />
    <Composition
      id="AulaComplexidade"
      component={AulaComplexidade}
      width={1920}
      height={1080}
      fps={FPS_AULA}
      durationInFrames={TOTAL_QUADROS}
    />
    <Composition
      id="AulaRecursividade"
      component={AulaRecursividade}
      width={1920}
      height={1080}
      fps={FPS_AULA2}
      durationInFrames={TOTAL_AULA2}
    />
    <Composition
      id="ReelAgentes"
      component={ReelAgentes}
      width={1080}
      height={1920}
      fps={FPS_AGENTES}
      durationInFrames={TOTAL_AGENTES}
    />
    <Composition
      id="ReelPix"
      component={ReelPix}
      width={1080}
      height={1920}
      fps={FPS_PIX}
      durationInFrames={TOTAL_PIX}
    />
    <Composition
      id="ReelPatterns"
      component={ReelPatterns}
      width={1080}
      height={1920}
      fps={FPS_PATTERNS}
      durationInFrames={TOTAL_PATTERNS}
    />
  </>
);
