import React from "react";
import "./marca/fontes";
import { Composition } from "remotion";
import { FPS, duracaoTotal, type PropsReel } from "../src/core/roteiro";
import { AulaComplexidade } from "./aulas/complexidade/Aula";
import { FPS as FPS_AULA, TOTAL_QUADROS } from "./aulas/complexidade/roteiro";
import { exemplos } from "./exemplos";
import { Reel } from "./Reel";
import { FPS as FPS_SELLOOP } from "./selloop/marca";
import { Abertura as SelloopAbertura, Encerramento as SelloopEncerramento } from "./selloop/Vinhetas";
import { DURACAO_TESTE, SelloopTeste } from "./selloop/Teste";
import { DURACAO_V1, SelloopAtendimento } from "./selloop/v1/Atendimento";
import { DURACAO_V2, SelloopCampanhas } from "./selloop/v2/Campanhas";
import { DURACAO_V3, SelloopAgente } from "./selloop/v3/Agente";
import { DURACAO_R1, SelloopReelAtendimento } from "./selloop/reel/R1Atendimento";
import { DURACAO_R2, SelloopReelCampanhas } from "./selloop/reel/R2Campanhas";
import { DURACAO_R3, SelloopReelAgente } from "./selloop/reel/R3Agente";

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
      id="SelloopTeste"
      component={SelloopTeste}
      width={1920}
      height={1080}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_TESTE * FPS_SELLOOP)}
    />
    <Composition
      id="SelloopAtendimento"
      component={SelloopAtendimento}
      width={1920}
      height={1080}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_V1 * FPS_SELLOOP)}
    />
    <Composition
      id="SelloopCampanhas"
      component={SelloopCampanhas}
      width={1920}
      height={1080}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_V2 * FPS_SELLOOP)}
    />
    <Composition
      id="SelloopAgente"
      component={SelloopAgente}
      width={1920}
      height={1080}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_V3 * FPS_SELLOOP)}
    />
    <Composition
      id="SelloopReelAtendimento"
      component={SelloopReelAtendimento}
      width={1080}
      height={1920}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_R1 * FPS_SELLOOP)}
    />
    <Composition
      id="SelloopReelCampanhas"
      component={SelloopReelCampanhas}
      width={1080}
      height={1920}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_R2 * FPS_SELLOOP)}
    />
    <Composition
      id="SelloopReelAgente"
      component={SelloopReelAgente}
      width={1080}
      height={1920}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(DURACAO_R3 * FPS_SELLOOP)}
    />
    <Composition id="SelloopAbertura" component={SelloopAbertura} width={1920} height={1080} fps={FPS_SELLOOP} durationInFrames={Math.round(2 * FPS_SELLOOP)} />
    <Composition
      id="SelloopEncerramento"
      component={SelloopEncerramento}
      width={1920}
      height={1080}
      fps={FPS_SELLOOP}
      durationInFrames={Math.round(4 * FPS_SELLOOP)}
      defaultProps={{ frase: "Atenda e venda sem trocar de tela." }}
    />
  </>
);
