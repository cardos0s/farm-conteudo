import React from "react";
import { Celular, Chip, SetaTracejada, Terminal, ui, type LinhaTerminal } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";
import { s } from "../roteiro";

// Um app, três agentes, o problema da coordenação e a orquestração (com o fluxo animado).

const v = ui.violeta;
const ok = ui.verde;
const erro = ui.vermelho;
const aviso = ui.laranja;
const papel = ui.apagado;

/** Quando a parte do "problema" sai de cena para o orquestrador entrar. */
const LIMPA = () => s(47.2);

export const AGENTES = { y: 560, h: 280, w: 310, x: [40, 385, 730] };
const centro = (i: number) => AGENTES.x[i] + AGENTES.w / 2;

function Agente({ i, titulo, de, linhas, ativo }: { i: number; titulo: string; de: number; linhas: LinhaTerminal[]; ativo?: [number, number][] }) {
  return (
    <Terminal
      x={AGENTES.x[i]}
      y={AGENTES.y}
      w={AGENTES.w}
      h={AGENTES.h}
      titulo={titulo}
      status={ui.violeta}
      de={de}
      tam={26}
      entre={1.45}
      topo={42}
      ativo={ativo}
      linhas={linhas}
    />
  );
}

export function CenaEquipe() {
  const limpa = LIMPA();
  return (
    <NaPagina p={R.equipe}>
      {/* o problema */}
      <Texto x={64} y={96} tam={58} de={s(22.3)} dur={0.8} ate={limpa}>
        um app, 3 agentes
      </Texto>
      <Celular x={78} y={140} w={196} de={s(23.0)} ate={limpa} />
      <Texto x={330} y={250} tam={46} cor={ui.vermelho} de={s(31.75)} dur={0.7} ate={limpa}>
        mas existe um problema…
      </Texto>
      <Texto x={330} y={332} tam={42} de={s(33.0)} dur={1.2} ate={limpa}>
        {"eles precisam trabalhar\nde forma *{coordenada}"}
      </Texto>

      {/* os agentes (ficam até o fim) */}
      <Agente
        i={0}
        titulo="arquiteto"
        de={s(25.29)}
        ativo={[[s(59.35), s(61.3)]]}
        linhas={[
          { de: s(25.53), partes: [["planeja a", papel]] },
          { de: s(26.3), partes: [["arquitetura", papel]] },
          { de: s(59.9), pos: 3, gira: true, partes: "⠋ projetando", troca: { t: s(60.9), partes: [["✓ arquitetura.md", ok]] } },
        ]}
      />
      <Agente
        i={1}
        titulo="programador"
        de={s(28.05)}
        ativo={[
          [s(61.9), s(65.4)],
          [s(70.5), s(72.8)],
        ]}
        linhas={[
          { de: s(28.3), partes: [["escreve o", papel]] },
          { de: s(29.0), partes: [["código", papel]] },
          { de: s(37.61), pos: 3, partes: [["⚠ qual", aviso]], ate: limpa },
          { de: s(38.1), pos: 4, partes: [["  arquitetura?", aviso]], ate: limpa },
          { de: s(63.08), pos: 3, gira: true, partes: "⠋ implementando", troca: { t: s(65.24), partes: [["✓ código pronto", ok]] } },
          { de: s(71.15), pos: 4, gira: true, partes: "⠋ corrigindo", troca: { t: s(72.6), partes: [["✓ corrigido", ok]] } },
        ]}
      />
      <Agente
        i={2}
        titulo="segurança"
        de={s(29.75)}
        ativo={[
          [s(66.1), s(69.3)],
          [s(72.7), s(73.7)],
        ]}
        linhas={[
          { de: s(30.0), partes: [["revisa a", papel]] },
          { de: s(30.6), partes: [["segurança", papel]] },
          { de: s(43.96), pos: 3, partes: [["⚠ que código?", aviso]], ate: limpa },
          { de: s(66.44), pos: 3, gira: true, partes: "⠋ revisando", troca: { t: s(68.71), partes: [["✗ senha sem hash", erro]] } },
          { de: s(72.9), pos: 4, partes: [["✓ aprovado", ok]] },
        ]}
      />

      {/* a orquestração */}
      <Texto x={64} y={100} tam={64} cor={ui.rosa} de={s(48.0)} dur={0.8}>
        orquestração
      </Texto>
      <Chip x={640} y={84} texto="Claude Code" de={s(81.61)} />
      <Chip x={850} y={84} texto="Codex" de={s(82.44)} />
      <Terminal
        x={150}
        y={140}
        w={780}
        h={280}
        titulo="orquestrador"
        status={ui.violeta}
        de={s(48.24)}
        tam={26}
        entre={1.5}
        topo={44}
        ativo={[[s(59.35), s(73.4)]]}
        linhas={[
          { de: s(50.44), partes: [["◆ ", v], ["controla o fluxo"]] },
          { de: s(52.22), partes: [["◆ ", v], ["define as tarefas"]] },
          { de: s(54.98), partes: [["◆ ", v], ["encaminha informações"]] },
          { de: s(56.9), partes: [["◆ ", v], ["acompanha resultados"]] },
        ]}
      />
      <SetaTracejada desde={[300, 430]} para={[centro(0), AGENTES.y - 8]} via={[215, 470]} cor={v} de={s(59.35)} carga={{ texto: "tarefa", de: s(59.5), dur: 0.8 }} fluxo={[s(127.3), s(133.2)]} />
      <SetaTracejada desde={[540, 430]} para={[centro(1), AGENTES.y - 8]} cor={v} de={s(61.8)} carga={{ texto: "arquitetura.md", de: s(61.95), dur: 1.0 }} fluxo={[s(127.3), s(133.2)]} />
      <SetaTracejada desde={[780, 430]} para={[centro(2), AGENTES.y - 8]} via={[865, 470]} cor={v} de={s(66.03)} carga={{ texto: "código", de: s(66.15), dur: 0.8 }} fluxo={[s(127.3), s(133.2)]} />
      <SetaTracejada
        desde={[centro(2), AGENTES.y + AGENTES.h + 10]}
        para={[centro(1) + 20, AGENTES.y + AGENTES.h + 10]}
        via={[712, 968]}
        cor={erro}
        de={s(69.87)}
        dur={0.7}
        carga={{ texto: "corrigir", de: s(70.1), dur: 1.0, fundo: "#fff5f5", cor: erro }}
        fluxo={[s(127.3), s(133.2)]}
      />
    </NaPagina>
  );
}
