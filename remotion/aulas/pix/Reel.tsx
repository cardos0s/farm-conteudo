import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import "../../lousa/fontes";
import { enquadrar, Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { CenaContingencia } from "./cenas/Contingencia";
import { CenaEscala } from "./cenas/Escala";
import { CenaEstados } from "./cenas/Estados";
import { CenaAbertura, CenaFinal } from "./cenas/Final";
import { CenaHistoria } from "./cenas/Historia";
import { CenaObservabilidade } from "./cenas/Observabilidade";
import { CenaProblema } from "./cenas/Problema";
import { CenaReconciliacao } from "./cenas/Reconciliacao";
import { ALVO, R, TELA, TUDO } from "./regioes";
import { IntroParaguai } from "./Intro";
import { FPS, INTRO, PARTES } from "./roteiro";
import { Sobreposicoes } from "./Sobreposicoes";

// Reel (1080x1920): "Um Pix, 30 minutos e uma falha que poderia ter sido evitada".
// Abre com cortes rápidos da viagem; depois, a história (desenhada) e as quatro soluções acontecem
// no canvas pontilhado e o texto do post entra como legenda no painel de baixo.

const v = (r: typeof TUDO) => enquadrar(r, ALVO);
const quando = (rotulo: string) => PARTES.find((p) => p.rotulo === rotulo)!.t;

/** Que parte do canvas aparece ao longo do vídeo. */
export const quadros: Enquadre[] = [
  { t: 0, vista: v(R.abertura) },
  { t: quando("a história"), vista: v(R.historia), dur: 1.2 },
  { t: quando("o problema"), vista: v(R.problema) },
  { t: quando("1/4 · máquina de estados"), vista: v(R.estados) },
  { t: quando("2/4 · reconciliação"), vista: v(R.reconciliacao) },
  { t: quando("3/4 · observabilidade"), vista: v(R.observabilidade) },
  { t: quando("4/4 · contingência"), vista: v(R.contingencia) },
  // "Agora imagina centenas de pessoas…": a visão geral do canvas
  { t: quando("em escala"), vista: v(TUDO), dur: 1.6 },
  { t: quando("o básico bem feito"), vista: v(R.final), dur: 1.2 },
];

export function ReelPix() {
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Sequence durationInFrames={INTRO * FPS}>
        <IntroParaguai />
      </Sequence>
      {/* dentro da Sequence, o tempo do canvas recomeça do zero */}
      <Sequence from={INTRO * FPS}>
        <Canvas />
      </Sequence>
    </AbsoluteFill>
  );
}

function Canvas() {
  const t = useT();
  const vista = vistaEm(t, quadros, TELA);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vista} tela={TELA}>
        <CenaAbertura />
        <CenaHistoria />
        <CenaProblema />
        <CenaEstados />
        <CenaReconciliacao />
        <CenaObservabilidade />
        <CenaContingencia />
        <CenaEscala />
        <CenaFinal />
      </Lousa>
      <Sobreposicoes />
    </AbsoluteFill>
  );
}
