import React from "react";
import { AbsoluteFill } from "remotion";
import "../../lousa/fontes";
import { enquadrar, Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { CameraVertical, type ChaveV, type FonteVertical } from "./CameraVertical";
import { CenaAgente, CenaChat } from "./cenas/Agente";
import { CenaConstruir } from "./cenas/Construir";
import { CenaEquipe } from "./cenas/Equipe";
import { CenaAbertura, CenaChamada } from "./cenas/Final";
import { CenaConfig, CenaSubagentes } from "./cenas/Subagentes";
import rostos from "./edicao/rostos.json";
import { ALVO, R, TELA, TUDO } from "./regioes";
import { FPS, segmentos, s } from "./roteiro";
import { Sobreposicoes, ZoomPilula } from "./Sobreposicoes";

// Reel (1080x1920): orquestração de agentes de IA. A aula acontece no canvas pontilhado (terminais,
// notas e setas tracejadas); a câmera fica numa janelinha pequena, como mais um painel do canvas.

const aula: FonteVertical = { fps: FPS, segmentos, rostos: rostos as unknown as FonteVertical["rostos"], pasta: "aulas/agentes" };

/** Enquadramento da câmera ao longo do vídeo. */
export const chaves: ChaveV[] = [{ t: 0, modo: "pip" }];

const v = (r: typeof TUDO) => enquadrar(r, ALVO);

/** Que parte do canvas aparece ao longo do vídeo. */
export const quadros: Enquadre[] = [
  { t: 0, vista: v(R.abertura) },
  { t: s(5.7), vista: v(R.chat) },
  { t: s(10.45), vista: v(R.agente) },
  { t: s(21.75), vista: v(R.equipe) },
  { t: s(85.6), vista: v(R.subagentes) },
  { t: s(110.5), vista: v(R.config) },
  // "E a orquestração é o que faz esses agentes trabalharem juntos": a visão geral do canvas
  { t: s(127.9), vista: v(TUDO), dur: 1.4 },
  { t: s(133.0), vista: v(R.construir), dur: 1.1 },
  // "Na comunidade, a gente vai construir essa arquitetura do zero na prática."
  { t: s(142.3), vista: v(R.chamada) },
];

export function ReelAgentes() {
  const t = useT();
  const vista = vistaEm(t, quadros, TELA);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vista} tela={TELA}>
        <CenaAbertura />
        <CenaChat />
        <CenaAgente />
        <CenaEquipe />
        <CenaSubagentes />
        <CenaConfig />
        <CenaConstruir />
        <CenaChamada />
      </Lousa>
      <ZoomPilula z={vista.z} />
      <CameraVertical chaves={chaves} aula={aula} />
      <Sobreposicoes />
    </AbsoluteFill>
  );
}
