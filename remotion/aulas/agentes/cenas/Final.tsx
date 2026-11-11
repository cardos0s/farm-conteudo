import React from "react";
import { Curva, Elipse } from "../../../lousa/Esboco";
import { Chip, Nota, SetaTracejada, Terminal, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { tinta } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";
import { s } from "../roteiro";

/** Carinha desenhada à mão. */
function Carinha({ cx, cy, de }: { cx: number; cy: number; de: number }) {
  return (
    <>
      <Elipse cx={cx} cy={cy} w={74} h={70} espessura={3} de={de} dur={0.4} />
      <Elipse cx={cx - 13} cy={cy - 9} w={7} h={9} preench={tinta} hachura="solid" espessura={2} de={de + 0.35} dur={0.1} />
      <Elipse cx={cx + 13} cy={cy - 9} w={7} h={9} preench={tinta} hachura="solid" espessura={2} de={de + 0.4} dur={0.1} />
      <Curva pts={[[cx - 18, cy + 9], [cx, cy + 22], [cx + 18, cy + 9]]} espessura={3} de={de + 0.45} dur={0.25} />
    </>
  );
}

const MINI = { y: 470, h: 170, w: 290, x: [50, 395, 740] };

/** Abertura no canvas: o tema e três agentes "pensando", ligados por uma seta que circula. */
export function CenaAbertura() {
  return (
    <NaPagina p={R.abertura}>
      <Texto x={540} y={250} tam={124} cor={ui.rosa} ancora="middle" de={0.05} dur={0.75}>
        orquestração
      </Texto>
      <Curva pts={[[220, 292], [540, 304], [860, 288]]} cor={ui.rosa} espessura={5} aspereza={0.8} de={0.8} dur={0.4} />
      <Texto x={540} y={382} tam={74} ancora="middle" de={0.55} dur={0.65}>
        de agentes de IA
      </Texto>
      <Carinha cx={985} cy={110} de={1.0} />
      {MINI.x.map((x, i) => (
        <Terminal
          key={i}
          x={x}
          y={MINI.y}
          w={MINI.w}
          h={MINI.h}
          titulo={`agente ${i + 1}`}
          status={[ui.verde, ui.azul, ui.violeta][i]}
          de={0.9 + i * 0.18}
          tam={26}
          topo={44}
          cursor={false}
          linhas={[{ de: 1.15 + i * 0.18, gira: true, partes: "⠋ pensando…", ritmo: 0.03 }]}
        />
      ))}
      <SetaTracejada
        desde={[MINI.x[2] + MINI.w / 2, MINI.y + MINI.h + 12]}
        para={[MINI.x[0] + MINI.w / 2, MINI.y + MINI.h + 12]}
        via={[540, 770]}
        cor={ui.violeta}
        de={1.7}
        dur={0.7}
        fluxo={[2.4, s(6.0)]}
      />
      <Nota x={230} y={786} w={620} h={160} texto="o que é um agente de IA?" tam={46} de={s(3.19)} durTexto={0.9} girar={1.2} />
    </NaPagina>
  );
}

/** Chamada final para a comunidade. */
export function CenaChamada() {
  const v = ui.violeta;
  return (
    <NaPagina p={R.chamada}>
      <Nota x={90} y={110} w={900} h={440} de={s(141.9)} girar={-1.5}>
        <Texto x={150} y={230} tam={64} de={s(142.05)} dur={0.7}>
          na comunidade,
        </Texto>
        <Texto x={150} y={322} tam={64} de={s(142.72)} dur={0.9}>
          a gente constrói isso
        </Texto>
        <Texto x={150} y={430} tam={74} cor={ui.rosa} de={s(144.4)} dur={0.8}>
          do zero, na prática
        </Texto>
      </Nota>
      <Chip x={540} y={640} texto="publico.dev.br" fundo="#f3f0ff" cor={v} tam={36} de={s(145.0)} />
      <Terminal
        x={140}
        y={720}
        w={800}
        h={200}
        titulo="comunidade"
        status={v}
        de={s(143.4)}
        tam={28}
        topo={46}
        linhas={[
          { de: s(143.8), partes: [["❯ ", v], ["construir do zero"]] },
          { de: s(144.9), partes: [["✓ ", ui.verde], ["na prática", ui.verde]] },
        ]}
      />
    </NaPagina>
  );
}
