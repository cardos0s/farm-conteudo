import React from "react";
import { Curva } from "../../../lousa/Esboco";
import { Chip, Janela, Nota, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { Texto } from "../../../lousa/Texto";
import { EXPIRADA, PAGA, PENDENTE, Relogio, Status } from "../pecas";
import { R } from "../regioes";
import { TextoUI } from "./comum";

/** Abertura: o título e o pedido com as duas cobranças, uma de cada cor, e o pedido sem saber o que fazer. */
export function CenaAbertura() {
  return (
    <NaPagina p={R.abertura}>
      <Texto x={540} y={190} tam={104} ancora="middle" de={0.1} dur={0.5}>
        um Pix,
      </Texto>
      <Texto x={540} y={320} tam={128} cor={ui.rosa} ancora="middle" de={0.55} dur={0.65}>
        30 minutos
      </Texto>
      <Curva pts={[[230, 358], [540, 372], [850, 354]]} cor={ui.rosa} espessura={5} aspereza={0.8} de={1.1} dur={0.4} />
      <Texto x={540} y={450} tam={58} ancora="middle" de={1.2} dur={0.9}>
        {"e uma falha que poderia\nter sido evitada"}
      </Texto>
      <Relogio cx={960} cy={110} r={64} de={0.9} gira={[1.3, 5.8]} />
      <Janela x={170} y={650} w={740} h={300} titulo="pedido #4821" status={ui.laranja} de={2.0}>
        <TextoUI x={36} y={66} tam={28} de={2.3}>cobrança 1</TextoUI>
        <Status x={440} y={66} texto="expirada" {...EXPIRADA} tam={26} de={2.6} />
        <TextoUI x={36} y={136} tam={28} de={2.9}>cobrança 2</TextoUI>
        <Status x={440} y={136} texto="paga" {...PAGA} tam={26} de={3.2} />
        <line x1={30} y1={170} x2={710} y2={170} stroke={ui.linha} strokeWidth={1.5} />
        <TextoUI x={36} y={216} tam={28} negrito de={3.6}>pedido</TextoUI>
        <Status x={440} y={216} texto="???" {...PENDENTE} tam={26} de={3.9} />
      </Janela>
    </NaPagina>
  );
}

const RESUMO = ["máquina de estados", "reconciliação", "observabilidade", "contingência"];

/** Fechamento: a frase do post e as quatro ideias. */
export function CenaFinal() {
  return (
    <NaPagina p={R.final}>
      <Nota x={90} y={90} w={900} h={470} de={82.2} girar={-1.5}>
        <Texto x={150} y={220} tam={62} de={82.4} dur={0.7}>
          o básico bem feito
        </Texto>
        <Texto x={150} y={315} tam={62} de={83.1} dur={0.6}>
          é um sistema que sabe
        </Texto>
        <Texto x={150} y={455} tam={104} cor={ui.rosa} de={83.8} dur={0.8}>
          se recuperar
        </Texto>
      </Nota>
      {RESUMO.map((r, i) => (
        <Chip key={r} x={i % 2 === 0 ? 300 : 780} y={680 + Math.floor(i / 2) * 90} texto={r} fundo="#f3f0ff" cor={ui.violeta} tam={30} de={84.8 + i * 0.3} />
      ))}
      <Texto x={540} y={950} tam={50} ancora="middle" de={86.6} dur={0.9}>
        e você, já passou por isso?
      </Texto>
    </NaPagina>
  );
}
