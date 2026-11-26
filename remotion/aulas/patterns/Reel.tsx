import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import "../../lousa/fontes";
import { enquadrar, Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { MapaDeTempo, useT } from "../../lousa/tempo";
import { CenaContexto, CenaGancho } from "./cenas/Abertura";
import { CenaChain, CenaObserver, CenaStrategy } from "./cenas/Comportamentais";
import { CenaBuilder, CenaFactory, CenaSingleton } from "./cenas/Criacionais";
import { CenaAdapter, CenaDecorator, CenaFacade } from "./cenas/Estruturais";
import { CenaConexao, CenaFinal } from "./cenas/Final";
import { ALVO, GRADE, R, TELA } from "./regioes";
import { FPS, GANCHO, INTRO, PARTES, projeto } from "./roteiro";
import { Sobreposicoes } from "./Sobreposicoes";
import { Sons } from "./Sons";

// Reel (1080x1920 no Remotion; o render final sai em 2160x3840 HDR HLG, ver src/cli/render-patterns.ts):
// "Design patterns na era da IA". Abre com o gancho gravado e segue no canvas pontilhado com os 9
// padrões (código e diagramas), a ponte com a IA e o fechamento; o roteiro entra como legenda.
// No render final, o trecho do gancho é substituído pela gravação original, sem alteração de cor.

const v = (r: typeof GRADE) => enquadrar(r, ALVO);
const quando = (rotulo: string) => PARTES.find((p) => p.rotulo === rotulo)!.t;

/** Que parte do canvas aparece ao longo do vídeo (tempo de projeto). */
export const quadros: Enquadre[] = [
  { t: 0, vista: v(R.gancho) },
  { t: quando("1994 · Gang of Four"), vista: v(R.contexto), dur: 1.1 },
  { t: quando("criacionais · Singleton"), vista: v(R.singleton), dur: 1.1 },
  { t: quando("criacionais · Factory Method"), vista: v(R.factory) },
  { t: quando("criacionais · Builder"), vista: v(R.builder) },
  { t: quando("estruturais · Adapter"), vista: v(R.adapter), dur: 1.1 },
  { t: quando("estruturais · Decorator"), vista: v(R.decorator) },
  { t: quando("estruturais · Facade"), vista: v(R.facade) },
  { t: quando("comportamentais · Strategy"), vista: v(R.strategy), dur: 1.1 },
  { t: quando("comportamentais · Observer"), vista: v(R.observer) },
  { t: quando("comportamentais · Chain of Resp."), vista: v(R.chain) },
  // "vários padrões usados hoje…": a visão geral dos 9 padrões
  { t: quando("os padrões de hoje"), vista: v(GRADE), dur: 1.6 },
  { t: 119.2, vista: v(R.conexao), dur: 1.2 },
  { t: quando("fundamentos"), vista: v(R.final), dur: 1.1 },
];

export function ReelPatterns() {
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      {/* prévia do gancho (no render final entra a gravação original em HDR) */}
      <Sequence durationInFrames={Math.round(INTRO * FPS)}>
        <AbsoluteFill style={{ background: "#000" }}>
          <OffthreadVideo src={staticFile(GANCHO.arquivo)} trimBefore={Math.round(GANCHO.de * FPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={Math.round(INTRO * FPS)}>
        <MapaDeTempo mapa={projeto}>
          <Canvas />
        </MapaDeTempo>
      </Sequence>
      <Sons />
    </AbsoluteFill>
  );
}

function Canvas() {
  const t = useT();
  const vista = vistaEm(t, quadros, TELA);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vista} tela={TELA}>
        <CenaGancho />
        <CenaContexto />
        <CenaSingleton />
        <CenaFactory />
        <CenaBuilder />
        <CenaAdapter />
        <CenaDecorator />
        <CenaFacade />
        <CenaStrategy />
        <CenaObserver />
        <CenaChain />
        <CenaConexao />
        <CenaFinal />
      </Lousa>
      <Sobreposicoes />
    </AbsoluteFill>
  );
}
