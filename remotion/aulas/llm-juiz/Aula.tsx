import React from "react";
import { AbsoluteFill } from "remotion";
import "../../lousa/fontes";
import { Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { ConfiancaEAlucinacao } from "./cenas/Confianca";
import { Gancho } from "./cenas/Gancho";
import { OQueELlm } from "./cenas/Llm";
import { P, todas } from "./paginas";
import { F, FIM_DE } from "./roteiro";

// Aula 2: LLM as a Judge. Trecho inicial (os 3 primeiros minutos do roteiro), só lousa e narração.

/** Qual página da lousa está na tela ao longo do vídeo. */
export const quadros: Enquadre[] = [
  { t: 0, pagina: P.abertura },
  { t: F("g1"), pagina: P.agente },
  { t: F("p1"), pagina: P.pergunta },
  { t: F("r1"), pagina: P.promessa },
  { t: F("f1"), pagina: P.frase },
  { t: F("l1"), pagina: P.llm },
  { t: F("x1"), pagina: P.proxima },
  { t: F("c1"), pagina: P.confianca },
  { t: F("h1"), pagina: P.alucinacao },
  { t: F("k1"), pagina: P.colega },
  { t: FIM_DE("k6") + 0.8, geral: todas },
];

export function AulaLlmJuiz() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vistaEm(t, quadros)}>
        <Gancho />
        <OQueELlm />
        <ConfiancaEAlucinacao />
      </Lousa>
    </AbsoluteFill>
  );
}
