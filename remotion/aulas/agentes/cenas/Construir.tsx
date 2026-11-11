import React from "react";
import { Terminal, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";
import { s } from "../roteiro";

// "Você pode construir tudo isso com Python, LangGraph, a SDK de agentes da OpenAI ou o Claude Code."
const OPCOES = [
  { titulo: "Python", de: 134.52, linhas: [["python orquestrador.py"]] },
  { titulo: "LangGraph", de: 134.99, linhas: [["pip install langgraph"]] },
  { titulo: "OpenAI Agents SDK", de: 136.03, linhas: [["pip install openai-agents"]] },
  { titulo: "Claude Code", de: 139.5, linhas: [["claude"], ["/agents", "> "]] },
];

export function CenaConstruir() {
  return (
    <NaPagina p={R.construir}>
      <Texto x={64} y={96} tam={60} de={s(133.1)} dur={0.7}>
        como construir
      </Texto>
      {OPCOES.map((o, i) => (
        <Terminal
          key={o.titulo}
          x={60}
          y={140 + i * 172}
          w={960}
          h={150}
          titulo={o.titulo}
          status={ui.violeta}
          de={s(o.de)}
          tam={26}
          topo={42}
          entre={1.5}
          linhas={o.linhas.map(([cmd, prefixo], k) => ({
            de: s(o.de) + 0.25 + k * 0.45,
            partes: [
              [prefixo ?? "❯ ", prefixo ? ui.apagado : ui.violeta],
              [cmd, prefixo ? ui.violeta : undefined],
            ],
          }))}
        />
      ))}
    </NaPagina>
  );
}
