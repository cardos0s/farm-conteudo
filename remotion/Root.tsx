import React from "react";
import "./marca/fontes";
import { Composition } from "remotion";
import { FPS, duracaoTotal, type PropsReel } from "../src/core/roteiro";
import { AulaComplexidade } from "./aulas/complexidade/Aula";
import { FPS as FPS_AULA, TOTAL_QUADROS } from "./aulas/complexidade/roteiro";
import { exemplos } from "./exemplos";
import { Reel } from "./Reel";
import { ReelWhatsApp, type PropsReelWhatsApp } from "./reels/whatsapp/ReelWhatsApp";
import { FPS as FPS_WPP, quadros as quadrosWpp } from "./reels/whatsapp/roteiro";

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
      id="ReelWhatsApp"
      component={ReelWhatsApp}
      width={1080}
      height={1920}
      fps={FPS_WPP}
      durationInFrames={quadrosWpp(1)}
      defaultProps={{ parte: 1 } as PropsReelWhatsApp}
      calculateMetadata={({ props }: { props: PropsReelWhatsApp }) => ({ durationInFrames: quadrosWpp(props.parte) })}
    />
  </>
);
