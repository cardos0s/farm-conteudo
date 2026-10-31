import React from "react";
import "./marca/fontes";
import { Composition } from "remotion";
import { FPS, duracaoTotal, type PropsReel } from "../src/core/roteiro";
import { duracaoUgc, type PropsUgc } from "../src/ugc/formato";
import { exemplos, exemploUgc } from "./exemplos";
import { Reel } from "./Reel";
import { Ugc } from "./Ugc";

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
      id="Ugc"
      component={Ugc}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={duracaoUgc(exemploUgc.blocos)}
      defaultProps={exemploUgc}
      calculateMetadata={({ props }: { props: PropsUgc }) => ({ durationInFrames: Math.max(1, duracaoUgc(props.blocos)) })}
    />
  </>
);
