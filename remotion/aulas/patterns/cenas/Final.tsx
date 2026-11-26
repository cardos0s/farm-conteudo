import React from "react";
import { Curva, Linha } from "../../../lousa/Esboco";
import { Chip, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { CATEGORIA, type Categoria } from "../pecas";
import { R } from "../regioes";

// A ponte com a IA (padrões de hoje feitos de padrões clássicos) e o fechamento.

const PONTES: { novo: string; classicos: [string, Categoria][]; y: number; de: number }[] = [
  { novo: "roteador de modelos", classicos: [["Strategy", "comportamental"], ["Factory", "criacional"]], y: 270, de: 120.0 },
  { novo: "guardrails", classicos: [["Chain of Responsibility", "comportamental"]], y: 440, de: 121.5 },
  { novo: "tracing de agentes", classicos: [["Decorator", "estrutural"], ["Observer", "comportamental"]], y: 610, de: 123.0 },
  { novo: "SDK multi-provedor", classicos: [["Adapter", "estrutural"], ["Factory", "criacional"]], y: 780, de: 124.5 },
];

export function CenaConexao() {
  return (
    <NaPagina p={R.conexao}>
      <Texto x={60} y={120} tam={54} de={119.4} dur={0.8} destaque={ui.rosa}>
        {"o novo é feito com o *{clássico}"}
      </Texto>
      {PONTES.map((p) => (
        <React.Fragment key={p.novo}>
          <Etiqueta x={220} y={p.y} texto={p.novo} tam={32} preench={claro.amarelo} hachura="solid" de={p.de} />
          <Texto x={460} y={p.y + 18} tam={60} ancora="middle" de={p.de + 0.3} dur={0.2}>
            =
          </Texto>
          {p.classicos.length === 1 ? (
            <Chip x={760} y={p.y} texto={p.classicos[0][0]} fundo={CATEGORIA[p.classicos[0][1]].fundo} cor={CATEGORIA[p.classicos[0][1]].cor} tam={28} de={p.de + 0.5} />
          ) : (
            <>
              <Chip x={640} y={p.y} texto={p.classicos[0][0]} fundo={CATEGORIA[p.classicos[0][1]].fundo} cor={CATEGORIA[p.classicos[0][1]].cor} tam={28} de={p.de + 0.5} />
              <Texto x={780} y={p.y + 14} tam={44} ancora="middle" de={p.de + 0.7} dur={0.15}>
                +
              </Texto>
              <Chip x={910} y={p.y} texto={p.classicos[1][0]} fundo={CATEGORIA[p.classicos[1][1]].fundo} cor={CATEGORIA[p.classicos[1][1]].cor} tam={28} de={p.de + 0.8} />
            </>
          )}
        </React.Fragment>
      ))}
      <Texto x={540} y={980} tam={46} cor={cor.cinza} ancora="middle" de={125.8} dur={0.7}>
        conceitos que a gente já conhece
      </Texto>
    </NaPagina>
  );
}

const MODA: [string, number, number][] = [
  ["multiagentes", 230, 150],
  ["RAG", 520, 115],
  ["frameworks de IA", 800, 165],
  ["o hype do mês", 430, 265],
];
const PRINCIPIOS: [string, number][] = [
  ["extensível", 213],
  ["desacoplado", 464],
  ["seguro", 679],
  ["escalável", 876],
];

export function CenaFinal() {
  return (
    <NaPagina p={R.final}>
      {MODA.map(([m, x, y], i) => (
        <Chip key={m} x={x} y={y} texto={m} fundo="#fff4e6" cor={ui.laranja} tam={30} de={127.3 + i * 0.6} />
      ))}
      <Texto x={60} y={430} tam={64} de={131.6} dur={0.5}>
        estude os
      </Texto>
      <Texto x={60} y={560} tam={116} cor={ui.rosa} de={132.2} dur={0.8}>
        fundamentos
      </Texto>
      <Curva pts={[[60, 595], [340, 612], [660, 590]]} cor={ui.rosa} espessura={5} aspereza={0.8} de={133.0} dur={0.4} />
      <Texto x={60} y={690} tam={52} cor={cor.cinza} de={137.0} dur={0.5}>
        modelos mudam.
      </Texto>
      <Linha pts={[[55, 674], [420, 672]]} cor={cor.cinza} espessura={4} de={137.7} dur={0.3} />
      <Texto x={60} y={770} tam={52} cor={cor.cinza} de={138.2} dur={0.6}>
        frameworks mudam.
      </Texto>
      <Linha pts={[[55, 754], [490, 752]]} cor={cor.cinza} espessura={4} de={138.9} dur={0.3} />
      <Texto x={60} y={880} tam={60} de={140.2} dur={0.6} destaque={ui.rosa}>
        {"os *{princípios} ficam:"}
      </Texto>
      {PRINCIPIOS.map(([p, x], i) => (
        <Chip key={p} x={x} y={970} texto={p} fundo="#f3f0ff" cor={ui.violeta} tam={30} de={141.2 + i * 0.5} />
      ))}
    </NaPagina>
  );
}
