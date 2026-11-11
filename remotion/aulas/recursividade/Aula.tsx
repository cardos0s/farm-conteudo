import React from "react";
import { AbsoluteFill } from "remotion";
import "../../lousa/fontes";
import { Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { Camera, type ChaveModo, type FonteAula } from "../comum/Camera";
import { Abertura } from "./cenas/Abertura";
import { BigO } from "./cenas/BigO";
import { Fatorial } from "./cenas/Fatorial";
import { Encerramento, Fechamento, Sobreposicoes } from "./cenas/Fechamento";
import { Fibonacci } from "./cenas/Fibonacci";
import rostos from "./edicao/rostos.json";
import { P, todas } from "./paginas";
import { FPS, S, pausas, segmentos } from "./roteiro";

// Aula 2 de Algoritmos e Estruturas de Dados: recursividade e complexidade de algoritmos.

const aula: FonteAula = { fps: FPS, segmentos, rostos: rostos as unknown as FonteAula["rostos"], pasta: "aulas/recursividade" };
const c81 = (t: number) => S("3581", t);

/** Enquadramento da câmera ao longo do vídeo. */
export const chaves: ChaveModo[] = [
  { t: 0, modo: "surge" },
  { t: c81(1.3) - 0.08, modo: "cartao", dur: 0.35 },
  { t: c81(4.0), modo: "dividida", dur: 0.7 },
  { t: pausas[1].de - 0.2, modo: "pip", dur: 0.7 },
  { t: S("3583", 253.0), modo: "cheia", dur: 0.6 },
  { t: pausas[5].de + 0.1, modo: "oculta", dur: 0.4 },
];

/** Qual página da lousa está na tela ao longo do vídeo. */
export const quadros: Enquadre[] = [
  { t: 0, pagina: P.abertura },
  { t: c81(4.0), pagina: P.chamadas, metade: true },
  { t: c81(17.5), pagina: P.parar, metade: true },
  { t: pausas[1].de + 0.3, pagina: P.fatorial },
  { t: S("3582", 39.9), pagina: P.conceitos },
  { t: pausas[2].de + 0.3, pagina: P.sequencia },
  { t: S("3583", 52.6), pagina: P.arvore },
  { t: pausas[3].de + 0.3, pagina: P.bigo },
  { t: S("3583", 173.3), pagina: P.custo },
  { t: S("3583", 195.5), pagina: P.grafico },
  { t: pausas[4].de + 0.3, pagina: P.recap },
  { t: pausas[5].de, geral: todas },
];

export function AulaRecursividade() {
  const t = useT();
  const vista = vistaEm(t, quadros);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vista}>
        <Abertura />
        <Fatorial />
        <Fibonacci />
        <BigO />
        <Fechamento />
      </Lousa>
      <Camera chaves={chaves} aula={aula} />
      <Sobreposicoes />
      <Encerramento />
    </AbsoluteFill>
  );
}
