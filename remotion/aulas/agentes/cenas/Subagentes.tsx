import React from "react";
import { Curva, Ret } from "../../../lousa/Esboco";
import { AVANCO_CODIGO } from "../../../lousa/fontes";
import { BARRA, Chip, Nota, SetaTracejada, Terminal, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";
import { s } from "../roteiro";

const v = ui.violeta;
const ok = ui.verde;
const papel = ui.apagado;

const SUB = { y: 520, h: 280, w: 310, x: [40, 385, 730] };
const centro = (i: number) => SUB.x[i] + SUB.w / 2;
const PRINCIPAL = { x: 200, y: 140, w: 680, h: 210 };

/** Cada subagente: nome, modelo (com as cores do chip) e o que ele faz. */
const SUBAGENTES = [
  { titulo: "explorador", de: () => s(89.6), modelo: "Haiku", fundo: "#d3f9d8", cor: "#2b8a3e", t: () => s(96.06), linhas: () => [["analisa arquivos", s(96.74)], ["e tarefas simples", s(97.78)]] },
  { titulo: "programador", de: () => s(89.9), modelo: "Sonnet", fundo: "#d0ebff", cor: "#1971c2", t: () => s(99.18), linhas: () => [["implementa", s(99.76)], ["funcionalidades", s(100.38)]] },
  { titulo: "arquiteto", de: () => s(90.2), modelo: "Opus", fundo: "#e5dbff", cor: "#6741d9", t: () => s(101.72), linhas: () => [["revisa decisões", s(102.3)], ["de arquitetura", s(103.1)]] },
] as const;

export function CenaSubagentes() {
  const visaoGeral: [number, number] = [s(127.3), s(133.2)];
  return (
    <NaPagina p={R.subagentes}>
      <Texto x={64} y={96} tam={62} cor={ui.rosa} de={s(89.16)} dur={0.7}>
        subagentes
      </Texto>
      <Curva pts={[[400, 70], [440, 40], [470, 80], [500, 44], [530, 84], [560, 50]]} cor="#4dabf7" espessura={5} aspereza={0.6} de={s(89.9)} dur={0.5} />
      <Terminal
        {...PRINCIPAL}
        titulo="agente principal"
        status={ui.violeta}
        de={s(86.0)}
        tam={26}
        topo={44}
        ativo={[[s(106.18), s(109.7)]]}
        linhas={[
          { de: s(106.18), partes: [["→ ", v], ["delega tarefas"]] },
          { de: s(108.38), partes: [["← ", ok], ["recebe resultados"]] },
        ]}
      />
      {SUBAGENTES.map((a, i) => (
        <React.Fragment key={a.titulo}>
          <Terminal
            x={SUB.x[i]}
            y={SUB.y}
            w={SUB.w}
            h={SUB.h}
            titulo={a.titulo}
            status={a.cor}
            de={a.de()}
            tam={26}
            entre={1.45}
            topo={42}
            ativo={[[a.t(), a.t() + 2.2]]}
            corAtivo={a.cor}
            linhas={a.linhas().map(([txt, de]) => ({ de: Number(de), partes: [[String(txt), papel]] }))}
          />
          {/* "escolher modelos diferentes para cada um": primeiro a dúvida, depois o nome */}
          <Chip x={centro(i)} y={SUB.y + SUB.h + 48} texto="modelo?" fundo="#f1f3f5" cor={ui.apagado} de={s(91.9) + i * 0.15} ate={a.t() - 0.05} />
          <Chip x={centro(i)} y={SUB.y + SUB.h + 48} texto={a.modelo} fundo={a.fundo} cor={a.cor} tam={28} de={a.t()} />
          {/* delega (desce) e recebe o resultado (sobe) */}
          <SetaTracejada
            desde={[PRINCIPAL.x + 130 + i * 210, PRINCIPAL.y + PRINCIPAL.h + 10]}
            para={[centro(i) - 24, SUB.y - 10]}
            cor={v}
            de={s(106.18) + i * 0.15}
            dur={0.5}
            fluxo={[s(106.5), s(108.3)]}
            carga={{ texto: "tarefa", de: s(106.4) + i * 0.15, dur: 0.8 }}
          />
          <SetaTracejada
            desde={[centro(i) + 24, SUB.y - 10]}
            para={[PRINCIPAL.x + 180 + i * 210, PRINCIPAL.y + PRINCIPAL.h + 10]}
            cor={ok}
            de={s(108.38) + i * 0.15}
            dur={0.5}
            fluxo={visaoGeral}
            carga={{ texto: "resultado", de: s(108.6) + i * 0.15, dur: 0.8, cor: ok }}
          />
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

// Arquivo de um subagente (formato do Claude Code: .claude/agents/<nome>.md)
const EDITOR = { x: 60, y: 120, w: 960, h: 430 };
const TAM = 25;
const ENTRE = 1.45;
const TOPO = 44;
const CODIGO: [string, string?][][] = [
  [["---", papel]],
  [["name", v], [": arquiteto"]],
  [["description", v], [": revisa a arquitetura"]],
  [["tools", v], [": Read, Grep, Glob"]],
  [["model", v], [": opus"]],
  [["---", papel]],
  [["Você revisa a arquitetura do"]],
  [["projeto e aponta os riscos."]],
];
/** y (no canvas da região) da linha de base da linha `i` do editor. */
const yLinha = (i: number) => EDITOR.y + BARRA + TOPO + i * TAM * ENTRE;
const xCol = (c: number) => EDITOR.x + 26 + c * TAM * AVANCO_CODIGO;

/** Moldura à mão em volta das linhas a..b do editor, com o rótulo à direita. */
function Destaque({ a, b, colunas, rotulo, cor, de }: { a: number; b: number; colunas: number; rotulo: string; cor: string; de: number }) {
  const y0 = yLinha(a) - TAM * 0.95;
  const y1 = yLinha(b) + TAM * 0.42;
  const x1 = xCol(colunas) + 10;
  return (
    <>
      <Ret x={EDITOR.x + 14} y={y0} w={x1 - EDITOR.x - 14} h={y1 - y0} cor={cor} espessura={3.5} de={de} dur={0.4} />
      <Texto x={x1 + 26} y={(y0 + y1) / 2 + 14} tam={40} cor={cor} de={de + 0.15} dur={0.5}>
        {rotulo}
      </Texto>
    </>
  );
}

export function CenaConfig() {
  const inicio = s(110.3);
  return (
    <NaPagina p={R.config}>
      <Terminal
        {...EDITOR}
        titulo="arquiteto.md"
        status={ui.violeta}
        de={s(110.16)}
        tam={TAM}
        entre={ENTRE}
        topo={TOPO}
        cursor={false}
        linhas={CODIGO.map((partes, i) => ({ de: inicio + i * 0.16, partes, ritmo: 0.006 }))}
      />
      <Texto x={EDITOR.x + EDITOR.w} y={EDITOR.y - 22} tam={36} cor={ui.apagado} ancora="end" de={s(110.4)} dur={0.6}>
        .claude/agents/
      </Texto>
      <Destaque a={6} b={7} colunas={28} rotulo="instrução" cor={ui.violeta} de={s(112.23)} />
      <Destaque a={3} b={3} colunas={23} rotulo="ferramentas" cor={ui.verde} de={s(113.02)} />
      <Ret x={EDITOR.x - 16} y={EDITOR.y - 16} w={EDITOR.w + 32} h={EDITOR.h + 32} cor={ui.laranja} espessura={3} aspereza={1.4} de={s(113.76)} dur={0.6} />
      <Texto x={EDITOR.x + EDITOR.w} y={EDITOR.y + EDITOR.h + 66} tam={40} cor={ui.laranja} ancora="end" de={s(114.0)} dur={0.6}>
        contexto próprio
      </Texto>
      <Nota x={110} y={636} w={860} h={308} de={s(117.49)} girar={-1.2}>
        <Texto x={150} y={716} tam={68} cor={ui.rosa} de={s(117.6)} dur={0.7}>
          agente ≠ modelo
        </Texto>
        <Texto x={150} y={790} tam={44} de={s(120.59)} dur={0.9}>
          {"*{modelo}: a inteligência"}
        </Texto>
        <Texto x={150} y={852} tam={44} destaque={ui.violeta} de={s(124.71)} dur={1.0}>
          {"*{agente}: modelo + instrução"}
        </Texto>
        <Texto x={150} y={908} tam={44} de={s(125.4)} dur={0.9}>
          + ferramentas + contexto
        </Texto>
      </Nota>
    </NaPagina>
  );
}
