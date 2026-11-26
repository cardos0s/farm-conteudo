import React from "react";
import { Check, Curva, Elipse, Ret } from "../../../lousa/Esboco";
import { FONTE_LOUSA } from "../../../lousa/fontes";
import { Chip, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { progresso, useT } from "../../../lousa/tempo";
import { Texto } from "../../../lousa/Texto";
import { CATEGORIA, type Categoria } from "../pecas";
import { R } from "../regioes";

// Gancho no canvas ("ainda fazem sentido na era da IA? sim.") e o contexto do Gang of Four.

const NOMES: [string, Categoria, number, number][] = [
  ["Singleton", "criacional", 200, 150],
  ["Factory", "criacional", 560, 115],
  ["Strategy", "comportamental", 880, 175],
  ["Observer", "comportamental", 170, 305],
  ["Adapter", "estrutural", 480, 285],
  ["Decorator", "estrutural", 820, 325],
  ["Builder", "criacional", 250, 455],
  ["Facade", "estrutural", 590, 445],
  ["Chain of Resp.", "comportamental", 880, 475],
];

export function CenaGancho() {
  return (
    <NaPagina p={R.gancho}>
      {NOMES.map(([nome, cat, x, y], i) => (
        <Chip key={nome} x={x} y={y} texto={nome} fundo={CATEGORIA[cat].fundo} cor={CATEGORIA[cat].cor} tam={34} de={0.3 + i * 0.38} />
      ))}
      <Texto x={540} y={650} tam={70} ancora="middle" de={4.0} dur={0.8}>
        ainda fazem sentido
      </Texto>
      <Texto x={540} y={770} tam={96} cor={ui.rosa} ancora="middle" de={5.2} dur={0.8}>
        na era da IA?
      </Texto>
      <Curva pts={[[290, 800], [540, 815], [800, 795]]} cor={ui.rosa} espessura={5} aspereza={0.8} de={6.0} dur={0.4} />
      <Texto x={240} y={990} tam={150} cor={cor.verde} ancora="middle" de={8.0} dur={0.5}>
        sim.
      </Texto>
      <Check x={400} y={940} s={70} de={8.5} />
      <Texto x={560} y={920} tam={50} destaque={ui.rosa} de={9.6} dur={0.9}>
        {"e você vai usar\n*{ainda mais}"}
      </Texto>
    </NaPagina>
  );
}

/** Número manuscrito que conta de 1 até `ate` entre `de` e `de + dur`. */
function Contador({ x, y, tam, ate, de, dur = 0.9, corTexto = tinta }: { x: number; y: number; tam: number; ate: number; de: number; dur?: number; corTexto?: string }) {
  const t = useT();
  if (t < de) return null;
  const n = Math.max(1, Math.round(ate * progresso(t, de, dur, (p) => p)));
  return (
    <text x={x} y={y} fontFamily={FONTE_LOUSA} fontSize={tam} fill={corTexto} textAnchor="end">
      {n}
    </text>
  );
}
const tinta = "#1e1e1e";

const GRUPOS: { cat: Categoria; nome: string; n: number; x: number; de: number; claro: string }[] = [
  { cat: "criacional", nome: "criacionais", n: 5, x: 30, de: 20.2, claro: claro.azul },
  { cat: "estrutural", nome: "estruturais", n: 7, x: 380, de: 20.8, claro: claro.verde },
  { cat: "comportamental", nome: "comportamentais", n: 11, x: 730, de: 21.5, claro: claro.violeta },
];

export function CenaContexto() {
  return (
    <NaPagina p={R.contexto}>
      {/* o livro */}
      <Ret x={90} y={110} w={340} h={460} preench={claro.amarelo} hachura="hachure" vaoHachura={14} espessura={3.6} de={13.2} dur={0.7} />
      <Texto x={260} y={240} tam={60} ancora="middle" de={13.7} dur={0.6}>
        {"Design\nPatterns"}
      </Texto>
      {[0, 1, 2, 3].map((i) => (
        <Elipse key={i} cx={170 + i * 60} cy={480} w={42} h={42} espessura={3} de={14.2 + i * 0.12} dur={0.2} />
      ))}
      <Texto x={260} y={650} tam={46} ancora="middle" de={14.6} dur={0.6}>
        Gang of Four
      </Texto>
      <Texto x={760} y={260} tam={140} cor={ui.rosa} ancora="middle" de={13.3} dur={0.6}>
        1994
      </Texto>
      <Curva pts={[[600, 295], [760, 308], [920, 290]]} cor={ui.rosa} espessura={5} aspereza={0.8} de={13.9} dur={0.35} />

      {/* 23 padrões */}
      <Contador x={720} y={470} tam={130} ate={23} de={17.0} corTexto={tinta} />
      <Texto x={740} y={460} tam={56} de={17.6} dur={0.5}>
        padrões
      </Texto>

      {/* três categorias */}
      {GRUPOS.map((g) => (
        <React.Fragment key={g.nome}>
          <Ret x={g.x} y={720} w={320} h={230} preench={g.claro} hachura="solid" cor={CATEGORIA[g.cat].cor} espessura={3.4} de={g.de} dur={0.45} />
          <Texto x={g.x + 160} y={790} tam={g.nome.length > 12 ? 28 : 38} cor={CATEGORIA[g.cat].cor} ancora="middle" de={g.de + 0.25} dur={0.4}>
            {g.nome}
          </Texto>
          <Contador x={g.x + 195} y={905} tam={96} ate={g.n} de={g.de + 0.4} dur={0.5} corTexto={CATEGORIA[g.cat].cor} />
        </React.Fragment>
      ))}
    </NaPagina>
  );
}
