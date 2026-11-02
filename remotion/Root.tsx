import React from "react";
import "./marca/fontes";
import { Composition, Still } from "remotion";
import { ALTURA_SLIDE, LARGURA_SLIDE } from "../src/core/carrossel";
import { FPS, duracaoTotal, type PropsReel } from "../src/core/roteiro";
import { Slide } from "./carrossel/Slide";
import { exemplos, exemplosCarrossel } from "./exemplos";
import { Reel } from "./Reel";

const capaExemplo = exemplosCarrossel.focca;

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
    {/* Um slide de carrossel por vez; o render chama esta composição uma vez para cada slide. */}
    <Still
      id="Slide"
      component={Slide}
      width={LARGURA_SLIDE}
      height={ALTURA_SLIDE}
      defaultProps={{ marca: capaExemplo.marca, slide: capaExemplo.carrossel.slides[0], indice: 0, total: capaExemplo.carrossel.slides.length }}
    />
  </>
);
