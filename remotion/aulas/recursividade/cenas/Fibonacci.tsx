import React from "react";
import { Elipse, Linha, Ret, Seta } from "../../../lousa/Esboco";
import { Codigo, colunaCodigo, linhaCodigo } from "../../../lousa/Codigo";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Capitulo, Marca } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S, pausas } from "../roteiro";

const a = (t: number) => S("3582", t);
const s = (t: number) => S("3583", t);

export const CODIGO_FIBONACCI = ["def fibonacci(n):", "    if n <= 1:", "        return n", "    return fibonacci(n - 1) + fibonacci(n - 2)"];

function PaginaSequencia() {
  const valores: [string, number][] = [
    ["0", 17.2],
    ["1", 17.5],
    ["1", 18.2],
    ["2", 18.7],
    ["3", 19.5],
    ["5", 19.8],
    ["8", 20.7],
  ];
  const cx = (i: number) => 162 + i * 110;
  const cod = { x: 1000, y: 170, tam: 30 };
  return (
    <NaPagina p={P.sequencia}>
      <Capitulo n={2} titulo="fibonacci" de={pausas[2].de + 0.3} />
      <Texto x={80} y={185} tam={64} de={a(73.3)} dur={0.9}>
        {"o problema do *{Fibonacci}"}
      </Texto>
      {/* uma chamada x duas chamadas */}
      <Caixa x={110} y={250} w={170} h={70} texto="f(n)" tam={36} de={s(3.6)} dur={0.3} />
      <Seta desde={[195, 326]} para={[195, 372]} de={s(4.6)} dur={0.25} ponta={14} />
      <Caixa x={110} y={378} w={170} h={70} texto="f(n − 1)" tam={34} preench={claro.cinza} hachura="solid" de={s(4.8)} dur={0.3} />
      <Texto x={195} y={490} tam={30} cor={cor.cinza} ancora="middle" de={s(5.1)}>
        1 chamada
      </Texto>
      <Caixa x={540} y={250} w={170} h={70} texto="f(n)" tam={36} de={s(6.3)} dur={0.3} />
      <Seta desde={[600, 326]} para={[525, 372]} cor={cor.vermelho} de={s(6.6)} dur={0.25} ponta={14} />
      <Seta desde={[650, 326]} para={[725, 372]} cor={cor.vermelho} de={s(6.8)} dur={0.25} ponta={14} />
      <Caixa x={420} y={378} w={180} h={70} texto="f(n − 1)" tam={34} preench={claro.vermelho} hachura="solid" de={s(6.9)} dur={0.3} />
      <Caixa x={650} y={378} w={180} h={70} texto="f(n − 2)" tam={34} preench={claro.vermelho} hachura="solid" de={s(7.0)} dur={0.3} />
      <Texto x={625} y={490} tam={30} cor={cor.vermelho} ancora="middle" de={s(7.2)}>
        2 chamadas
      </Texto>
      {/* a sequência */}
      <Texto x={110} y={585} tam={36} cor={cor.cinza} de={s(13.2)} dur={1.0}>
        cada número = soma dos dois anteriores
      </Texto>
      {valores.map(([v, t], i) => (
        <React.Fragment key={i}>
          <Caixa x={cx(i) - 42} y={620} w={84} h={84} texto={v} tam={44} preench={i >= 4 ? claro.amarelo : undefined} hachura="solid" de={s(t)} dur={0.25} atrasoTexto={0.08} />
        </React.Fragment>
      ))}
      <Texto x={cx(6) + 70} y={676} tam={44} cor={cor.cinza} de={s(20.9)}>
        …
      </Texto>
      <Seta desde={[cx(4), 712]} via={[cx(5), 790]} para={[cx(6), 712]} cor={cor.laranja} de={s(24.1)} dur={0.5} ponta={16} />
      <Texto x={cx(5)} y={830} tam={32} cor={cor.laranja} ancora="middle" de={s(24.6)}>
        3 + 5 = 8
      </Texto>
      <Seta desde={[cx(2), 712]} via={[cx(3), 790]} para={[cx(4), 712]} cor={cor.verde} de={s(26.2)} dur={0.5} ponta={16} />
      <Texto x={cx(3)} y={830} tam={32} cor={cor.verde} ancora="middle" de={s(26.6)}>
        1 + 2 = 3
      </Texto>
      <Texto x={110} y={950} tam={54} de={s(30.8)} dur={1.0}>
        F(n) = F(n − 1) + F(n − 2)
      </Texto>
      {/* o código */}
      <Codigo x={cod.x} y={cod.y} tam={cod.tam} arquivo="fibonacci.py" linhas={CODIGO_FIBONACCI} de={s(33.4)} />
      <Texto x={1440} y={560} tam={42} cor={cor.vermelho} ancora="middle" de={s(38.9)} dur={0.8}>
        mas existe um problema...
      </Texto>
      {/* as duas chamadas recursivas, uma caixa para cada */}
      {[
        [11, 27, 50.2],
        [30, 46, 50.55],
      ].map(([c0, c1, t]) => {
        const x0 = colunaCodigo(cod.x, cod.tam, c0) - 8;
        const y0 = linhaCodigo(cod.y, cod.tam, 3) - cod.tam * 0.95;
        return (
          <Ret key={c0} x={x0} y={y0} w={colunaCodigo(cod.x, cod.tam, c1) - x0 + 8} h={cod.tam * 1.3} cor={cor.vermelho} espessura={3.5} de={s(t)} dur={0.35} />
        );
      })}
    </NaPagina>
  );
}

type No = { id: string; x: number; y: number; de: number; repetido?: boolean; pai?: string };

function PaginaArvore() {
  const nos: No[] = [
    { id: "f4", x: 820, y: 250, de: 58.1 },
    { id: "f3", x: 480, y: 425, de: 61.2, pai: "f4" },
    { id: "f2r", x: 1160, y: 425, de: 62.0, pai: "f4" },
    { id: "f2l", x: 300, y: 600, de: 68.3, pai: "f3" },
    { id: "f1a", x: 660, y: 600, de: 69.7, pai: "f3" },
    { id: "f1c", x: 180, y: 775, de: 72.3, pai: "f2l" },
    { id: "f0c", x: 420, y: 775, de: 73.0, pai: "f2l" },
    { id: "f1b", x: 1030, y: 600, de: 88.3, pai: "f2r", repetido: true },
    { id: "f0b", x: 1300, y: 600, de: 89.9, pai: "f2r", repetido: true },
  ];
  const rotulo: Record<string, string> = { f4: "f(4)", f3: "f(3)", f2r: "f(2)", f2l: "f(2)", f1a: "f(1)", f1b: "f(1)", f1c: "f(1)", f0b: "f(0)", f0c: "f(0)" };
  const por = Object.fromEntries(nos.map((n) => [n.id, n]));
  return (
    <NaPagina p={P.arvore}>
      <Texto x={960} y={125} tam={58} ancora="middle" de={s(53.6)} dur={1.0}>
        {"a árvore de chamadas de *{f(4)}"}
      </Texto>
      {nos.map((n) => {
        const pai = n.pai ? por[n.pai] : null;
        const tinta = n.repetido ? cor.cinza : cor.tinta;
        return (
          <React.Fragment key={n.id}>
            {pai && <Linha pts={[[pai.x, pai.y + 40], [n.x, n.y - 40]]} cor={tinta} espessura={2.8} de={s(n.de) - 0.25} dur={0.25} />}
            <Elipse cx={n.x} cy={n.y} w={150} h={80} cor={tinta} preench={n.repetido ? claro.cinza : n.id.startsWith("f2") ? claro.amarelo : claro.azul} hachura="solid" de={s(n.de)} dur={0.3} />
            <Texto x={n.x} y={n.y + 14} tam={40} cor={tinta} ancora="middle" de={s(n.de) + 0.1}>
              {rotulo[n.id]}
            </Texto>
          </React.Fragment>
        );
      })}
      {/* o mesmo f(2), calculado duas vezes */}
      <Elipse cx={300} cy={600} w={210} h={124} cor={cor.vermelho} espessura={4} de={s(75.4)} dur={0.45} />
      <Elipse cx={1160} cy={425} w={210} h={124} cor={cor.vermelho} espessura={4} de={s(79.5)} dur={0.45} />
      <Texto x={840} y={712} tam={38} cor={cor.vermelho} ancora="middle" de={s(81.3)} dur={0.8}>
        f(2) calculado 2 vezes!
      </Texto>
      <Texto x={840} y={772} tam={36} cor={cor.cinza} ancora="middle" de={s(92.4)} dur={0.7}>
        f(4) faz 9 chamadas
      </Texto>
      <Marca x={300} y={895} w={880} h={100} de={s(102.4)} dur={0.6} />
      <Texto x={740} y={930} tam={38} ancora="middle" destaque={cor.vermelho} de={s(99.9)} dur={1.2}>
        {"o problema não é a recursão em si:\né resolver o *{mesmo subproblema} várias vezes"}
      </Texto>
    </NaPagina>
  );
}

export function Fibonacci() {
  return (
    <>
      <PaginaSequencia />
      <PaginaArvore />
    </>
  );
}
