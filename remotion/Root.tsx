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
import { ExplicaMenteTenis } from "./explica-mente/Video";
import { FPS as FPS_EM, TOTAL_QUADROS as TOTAL_EM } from "./explica-mente/roteiro";
import { ExplicaMenteTarefa } from "./explica-mente/tarefa/Video";
import { TOTAL as TOTAL_EM2 } from "./explica-mente/tarefa/tempo";
import { ExplicaMenteColher } from "./explica-mente/colher/Video";
import { TOTAL as TOTAL_EM3 } from "./explica-mente/colher/tempo";
import { ExplicaMenteLiquidificador, TOTAL as TOTAL_LIQ } from "./explica-mente/liquidificador/Video";
import { ExplicaMenteInstrucoes, TOTAL as TOTAL_INS } from "./explica-mente/instrucoes/Video";
import { ExplicaMentePorta, TOTAL as TOTAL_POR } from "./explica-mente/porta/Video";
import { ExplicaMenteCaixa, TOTAL as TOTAL_CAI } from "./explica-mente/caixa/Video";
import { ExplicaMenteAntecipacao, TOTAL as TOTAL_ANT } from "./explica-mente/antecipacao/Video";
import { ExplicaMenteQuarto, TOTAL as TOTAL_QUA } from "./explica-mente/quarto/Video";
import { ExplicaMenteCoracao, TOTAL as TOTAL_COR } from "./explica-mente/coracao/Video";
import { ExplicaMenteMao, TOTAL as TOTAL_MAO } from "./explica-mente/mao/Video";
import { ExplicaMenteCamiseta, TOTAL as TOTAL_CAM } from "./explica-mente/camiseta/Video";
import { ExplicaMenteLicao, TOTAL as TOTAL_LIC } from "./explica-mente/licao/Video";
import { ExplicaMenteMapa, TOTAL as TOTAL_MAP } from "./explica-mente/mapa/Video";
import { ExplicaMentePote, TOTAL as TOTAL_POT } from "./explica-mente/pote/Video";
import { ExplicaMenteMaos, TOTAL as TOTAL_MAS } from "./explica-mente/maos/Video";
import { ExplicaMenteTroca, TOTAL as TOTAL_TRO } from "./explica-mente/troca/Video";
import { ExplicaMenteHobby, TOTAL as TOTAL_HOB } from "./explica-mente/hobby/Video";
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
    <Composition id="ExplicaMenteTenis" component={ExplicaMenteTenis} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_EM} />
    <Composition id="ExplicaMenteTarefa" component={ExplicaMenteTarefa} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_EM2} />
    <Composition id="ExplicaMenteColher" component={ExplicaMenteColher} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_EM3} />
    {/* episódios novos do Explica, Mente!: um por pauta */}
    <Composition id="ExplicaMenteLiquidificador" component={ExplicaMenteLiquidificador} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_LIQ} />
    <Composition id="ExplicaMenteInstrucoes" component={ExplicaMenteInstrucoes} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_INS} />
    <Composition id="ExplicaMentePorta" component={ExplicaMentePorta} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_POR} />
    <Composition id="ExplicaMenteCaixa" component={ExplicaMenteCaixa} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_CAI} />
    <Composition id="ExplicaMenteAntecipacao" component={ExplicaMenteAntecipacao} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_ANT} />
    <Composition id="ExplicaMenteQuarto" component={ExplicaMenteQuarto} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_QUA} />
    <Composition id="ExplicaMenteCoracao" component={ExplicaMenteCoracao} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_COR} />
    <Composition id="ExplicaMenteMao" component={ExplicaMenteMao} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_MAO} />
    <Composition id="ExplicaMenteCamiseta" component={ExplicaMenteCamiseta} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_CAM} />
    <Composition id="ExplicaMenteLicao" component={ExplicaMenteLicao} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_LIC} />
    <Composition id="ExplicaMenteMapa" component={ExplicaMenteMapa} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_MAP} />
    <Composition id="ExplicaMentePote" component={ExplicaMentePote} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_POT} />
    <Composition id="ExplicaMenteMaos" component={ExplicaMenteMaos} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_MAS} />
    <Composition id="ExplicaMenteTroca" component={ExplicaMenteTroca} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_TRO} />
    <Composition id="ExplicaMenteHobby" component={ExplicaMenteHobby} width={1080} height={1920} fps={FPS_EM} durationInFrames={TOTAL_HOB} />
  </>
);
