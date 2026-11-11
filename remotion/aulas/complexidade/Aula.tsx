import React from "react";
import { AbsoluteFill } from "remotion";
import "../../lousa/fontes";
import { Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { Camera, type ChaveModo, type FonteAula } from "../comum/Camera";
import { BigO } from "./cenas/BigO";
import { Eficiencia } from "./cenas/Eficiencia";
import { Intro } from "./cenas/Intro";
import { ModeloRAM } from "./cenas/ModeloRAM";
import { Encerramento, Sobreposicoes } from "./cenas/Sobreposicoes";
import { P, todas } from "./paginas";
import rostos from "./edicao/rostos.json";
import { FPS, S, pausas, segmentos } from "./roteiro";

// Aula 1 de Algoritmos e Estruturas de Dados: complexidade de algoritmos.
// Vídeo 16:9 com a lousa no estilo Excalidraw e a câmera em tela cheia, dividida ou no canto.

const c27 = (t: number) => S("3227", t);

const aula: FonteAula = { fps: FPS, segmentos, rostos: rostos as unknown as FonteAula["rostos"], pasta: "aulas/complexidade" };

/** Enquadramento da câmera ao longo do vídeo. */
export const chaves: ChaveModo[] = [
  { t: 0, modo: "surge" },
  { t: c27(2.2) - 0.08, modo: "cartao", dur: 0.35 },
  { t: c27(4.4), modo: "cheia", dur: 0.7 },
  { t: c27(19.95), modo: "dividida" },
  { t: c27(44.85), modo: "cheia" },
  { t: c27(53.8), modo: "dividida" },
  { t: c27(84.15), modo: "cheia" },
  { t: c27(101.25), modo: "dividida" },
  { t: c27(111.55), modo: "cheia" },
  { t: c27(126.2), modo: "pip", dur: 0.8 },
  { t: pausas[1].de + 0.05, modo: "oculta", dur: 0.3 },
  { t: pausas[1].ate - 0.35, modo: "pip", dur: 0.35 },
  { t: pausas[2].de + 0.02, modo: "oculta", dur: 0.25 },
  { t: pausas[2].ate - 0.3, modo: "pip", dur: 0.3 },
  { t: pausas[3].de + 0.02, modo: "oculta", dur: 0.25 },
  { t: pausas[3].ate - 0.3, modo: "pip", dur: 0.3 },
  { t: pausas[4].de + 0.02, modo: "oculta", dur: 0.2 },
  { t: pausas[4].ate - 0.25, modo: "pip", dur: 0.25 },
  { t: pausas[5].de + 0.1, modo: "oculta", dur: 0.4 },
];

/** Qual página da lousa está na tela ao longo do vídeo. */
export const quadros: Enquadre[] = [
  { t: 0, pagina: P.abertura },
  { t: c27(20.0), pagina: P.ia, metade: true },
  { t: c27(30.6), pagina: P.ferrari, metade: true },
  { t: c27(53.9), pagina: P.questionar, metade: true },
  { t: c27(66.75), pagina: P.fundamentos, metade: true },
  { t: c27(101.3), pagina: P.baseMl, metade: true },
  { t: c27(126.2), pagina: P.eficiencia },
  { t: S("3229", 13.9), pagina: P.quantidades },
  { t: S("3229", 58.0), pagina: P.cronometro },
  { t: S("3229", 74.1), pagina: P.fatores },
  { t: pausas[2].de + 0.45, pagina: P.ramIntro },
  { t: S("3232", 13.0), pagina: P.principios },
  { t: S("3232", 47.6), pagina: P.cpu },
  { t: S("3232", 66.7), pagina: P.atribuicoes },
  { t: S("3232", 86.3), pagina: P.hipoteses },
  { t: pausas[3].de + 0.5, pagina: P.bigo },
  { t: pausas[4].de + 0.4, pagina: P.classes },
  { t: S("3234", 45.4), pagina: P.estruturas },
  { t: pausas[5].de, geral: todas },
];

export function AulaComplexidade() {
  const t = useT();
  const vista = vistaEm(t, quadros);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vista}>
        <Intro />
        <Eficiencia />
        <ModeloRAM />
        <BigO />
      </Lousa>
      <Camera chaves={chaves} aula={aula} />
      <Sobreposicoes />
      <Encerramento />
    </AbsoluteFill>
  );
}
