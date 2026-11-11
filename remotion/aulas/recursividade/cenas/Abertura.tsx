import React from "react";
import { Caminho, Curva, Elipse, Linha, Ret, Seta } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S } from "../roteiro";

const s = (t: number) => S("3581", t);

function PaginaAbertura() {
  const caixas = [
    [1500, 740, 300, 220],
    [1530, 770, 240, 160],
    [1558, 796, 184, 108],
    [1584, 818, 132, 64],
  ];
  return (
    <NaPagina p={P.abertura}>
      <Texto x={960} y={300} tam={44} cor={cor.cinza} ancora="middle" de={0.1} dur={0.6}>
        Algoritmos e Estruturas de Dados · aula 2
      </Texto>
      <Texto x={960} y={480} tam={150} ancora="middle" de={0.25} dur={0.85}>
        Recursividade
      </Texto>
      <Linha pts={[[560, 530], [960, 524], [1360, 534]]} cor={cor.azul} espessura={5} de={1.0} dur={0.35} />
      {caixas.map(([x, y, w, h], i) => (
        <Ret key={i} x={x} y={y} w={w} h={h} redondo={false} cor={i === 3 ? cor.azul : undefined} de={0.45 + i * 0.12} dur={0.3} />
      ))}
      <Texto x={150} y={900} tam={48} de={0.6} dur={0.7}>
        {"f( f( f( … ) ) )"}
      </Texto>
    </NaPagina>
  );
}

function PaginaChamadas() {
  return (
    <NaPagina p={P.chamadas}>
      <Caixa x={90} y={230} w={300} h={110} texto="função" tam={46} preench={claro.azul} de={s(4.2)} dur={0.5} />
      <Texto x={240} y={392} tam={32} cor={cor.cinza} ancora="middle" de={s(5.4)} dur={0.6}>
        executa uma tarefa
      </Texto>
      <Seta desde={[400, 285]} para={[520, 285]} de={s(7.7)} dur={0.4} />
      <Caixa x={530} y={230} w={340} h={110} texto="outra função" tam={44} preench={claro.cinza} de={s(8.1)} dur={0.5} />
      {/* a função que chama ela mesma */}
      <Caixa x={90} y={530} w={300} h={110} texto="função" tam={46} preench={claro.azul} de={s(10.6)} dur={0.5} />
      <Curva
        pts={[
          [392, 585],
          [470, 590],
          [520, 520],
          [470, 455],
          [330, 452],
          [250, 518],
        ]}
        cor={cor.vermelho}
        espessura={4.5}
        de={s(11.5)}
        dur={0.7}
      />
      <Linha pts={[[232, 497], [250, 520], [272, 501]]} cor={cor.vermelho} espessura={4.5} de={s(12.15)} dur={0.2} />
      <Texto x={560} y={598} tam={40} cor={cor.vermelho} de={s(12.0)} dur={0.6}>
        chama ela mesma
      </Texto>
      <Texto x={480} y={810} tam={86} cor={cor.azul} ancora="middle" de={s(13.7)} dur={0.7}>
        recursividade
      </Texto>
      <Linha pts={[[200, 840], [480, 834], [760, 844]]} cor={cor.azul} espessura={4} de={s(14.5)} dur={0.35} />
    </NaPagina>
  );
}

function PaginaParar() {
  const lado = 85;
  const octogono = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 8) * (2 * i + 1);
    return `${i ? "L" : "M"}${480 + lado * Math.cos(a)} ${285 + lado * Math.sin(a)}`;
  }).join(" ") + " Z";
  return (
    <NaPagina p={P.parar}>
      <Texto x={480} y={130} tam={54} ancora="middle" de={s(20.9)} dur={0.8}>
        quando ela precisa parar?
      </Texto>
      <Caminho d={octogono} cor={cor.vermelho} preench={claro.vermelho} hachura="solid" espessura={4} de={s(22.1)} dur={0.5} />
      <Texto x={480} y={302} tam={44} cor={cor.vermelho} ancora="middle" de={s(22.4)}>
        PARE
      </Texto>
      <Texto x={790} y={640} tam={30} cor={cor.cinza} ancora="middle" de={s(23.5)} dur={0.8}>
        {"sem condição\nde parada,\nas chamadas\nnão acabam"}
      </Texto>
      {Array.from({ length: 8 }, (_, k) => (
        <Caixa key={k} x={330} y={960 - (k + 1) * 58} w={300} h={52} texto="f( )" tam={30} preench={k > 5 ? claro.vermelho : claro.cinza} hachura="solid" de={s(25.2) + k * 0.24} dur={0.2} />
      ))}
      <Texto x={480} y={450} tam={46} cor={cor.vermelho} ancora="middle" de={s(27.3)} dur={0.5}>
        RecursionError!
      </Texto>
      <Elipse cx={480} cy={436} w={420} h={84} cor={cor.vermelho} espessura={3} de={s(28.2)} dur={0.45} />
    </NaPagina>
  );
}

export function Abertura() {
  return (
    <>
      <PaginaAbertura />
      <PaginaChamadas />
      <PaginaParar />
    </>
  );
}
