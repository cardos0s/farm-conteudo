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
import { ReelPesagem } from "./rebanho/pesagem/Reel";
import { FPS as FPS_PESAGEM, TOTAL_QUADROS as TOTAL_PESAGEM } from "./rebanho/pesagem/roteiro";
import { ReelConfinamento } from "./rebanho/confinamento/Reel";
import { FPS as FPS_CONF, TOTAL_QUADROS as TOTAL_CONF } from "./rebanho/confinamento/roteiro";
import { ReelRotacionado } from "./rebanho/rotacionado/Reel";
import { R as R_ROT } from "./rebanho/rotacionado/roteiro";
import { ReelArroba } from "./rebanho/arroba/Reel";
import { R as R_ARR } from "./rebanho/arroba/roteiro";
import { ReelFases } from "./rebanho/fases/Reel";
import { R as R_FAS } from "./rebanho/fases/roteiro";
import { ReelSeca } from "./rebanho/seca/Reel";
import { R as R_SEC } from "./rebanho/seca/roteiro";
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
      id="ReelPesagem"
      component={ReelPesagem}
      width={1080}
      height={1920}
      fps={FPS_PESAGEM}
      durationInFrames={TOTAL_PESAGEM}
    />
    <Composition
      id="ReelConfinamento"
      component={ReelConfinamento}
      width={1080}
      height={1920}
      fps={FPS_CONF}
      durationInFrames={TOTAL_CONF}
    />
    <Composition id="ReelRotacionado" component={ReelRotacionado} width={1080} height={1920} fps={30} durationInFrames={R_ROT.quadros} />
    <Composition id="ReelArroba" component={ReelArroba} width={1080} height={1920} fps={30} durationInFrames={R_ARR.quadros} />
    <Composition id="ReelFases" component={ReelFases} width={1080} height={1920} fps={30} durationInFrames={R_FAS.quadros} />
    <Composition id="ReelSeca" component={ReelSeca} width={1080} height={1920} fps={30} durationInFrames={R_SEC.quadros} />
  </>
);
