import React from "react";
import { AbsoluteFill } from "remotion";
import "../../lousa/fontes";
import { Lousa, vistaEm, type Enquadre } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { Arquitetura } from "./cenas/Arquitetura";
import { Benchmark } from "./cenas/Benchmark";
import { ChecksBinarios } from "./cenas/Checks";
import { ConfiancaEAlucinacao } from "./cenas/Confianca";
import { Gancho } from "./cenas/Gancho";
import { LiveCoding } from "./cenas/LiveCoding";
import { OQueELlm } from "./cenas/Llm";
import { Problema } from "./cenas/Problema";
import { Producao } from "./cenas/Producao";
import { P, PARTES, todas } from "./paginas";
import { F, FIM_DE } from "./roteiro";

// Aula 2: LLM as a Judge. Só a lousa: a voz entra depois (ElevenLabs), alinhada por scripts/aulas/alinhar.py.

/** Página → primeira fala dela. A câmera chega na página quando essa fala começa. */
const ROTEIRO: [string, string][][] = [
  [["abertura", "a1"], ["agente", "g1"], ["pergunta", "p1"], ["promessa", "r1"], ["frase", "f1"], ["llm", "l1"], ["proxima", "x1"], ["confianca", "c1"], ["alucinacao", "h1"], ["colega", "k1"], ["agenteDef", "ag1"], ["nota", "nt1"], ["llmNota", "ln1"], ["subjetiva", "sb1"], ["enem", "en1"]],
  [["cap2", "j0"], ["juiz", "j1"], ["var", "vr1"], ["fluxo", "fx1"], ["conceitos", "cc1"], ["honestidade", "hn1"]],
  [["cap3", "t3"], ["conversa", "cv1"], ["checks", "ck1"], ["estranho", "te1"], ["pesos", "ps1"], ["codigoJuiz", "cj1"], ["baseline", "bl1"], ["evidencia", "ev1"]],
  [["cap4", "t4"], ["pecas", "pc1"], ["formulario", "fm1"], ["prompt", "pr1"], ["julgar", "jg1"], ["localizar", "lz1"], ["repl", "rp1"], ["gates", "gt1"], ["existir", "ex1"], ["score", "sc1"], ["conta", "ct1"], ["rodar", "rd1"]],
  [["cap5", "t5"], ["tresVezes", "bm1"], ["detetive", "dt1"], ["raciocinio", "rc1"], ["investigacao", "iv1"], ["v2", "v2a"], ["provaFalsa", "pf1"], ["media", "md1"]],
  [["cap6", "t6"], ["ci", "ci1"], ["skills", "sk1"], ["limites", "lm1"], ["resumoFinal", "rf1"], ["desafio", "ds1"], ["fim", "fi1"]],
];
/** Última fala de cada parte: depois dela, a câmera se afasta e mostra a parte inteira. */
const FIM_PARTE = ["en6", "hn4", "ev5", "rd6", "md4"];

export const quadros: Enquadre[] = ROTEIRO.flatMap((parte, i) => [
  ...parte.map(([pagina, fala]): Enquadre => ({ t: i === 0 && pagina === "abertura" ? 0 : F(fala), pagina: P[pagina] })),
  ...(i < FIM_PARTE.length ? [{ t: FIM_DE(FIM_PARTE[i]) + 0.3, geral: PARTES[i] }] : []),
]).concat([{ t: FIM_DE("fi3") + 1.2, geral: todas }]);

export function AulaLlmJuiz() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vistaEm(t, quadros)}>
        <Gancho />
        <OQueELlm />
        <ConfiancaEAlucinacao />
        <Problema />
        <Arquitetura />
        <ChecksBinarios />
        <LiveCoding />
        <Benchmark />
        <Producao />
      </Lousa>
    </AbsoluteFill>
  );
}
