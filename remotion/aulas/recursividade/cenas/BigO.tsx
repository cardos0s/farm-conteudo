import React from "react";
import { Check, Curva, Elipse, Linha, Seta } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Capitulo, Etiqueta, Marca } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S, pausas } from "../roteiro";

const s = (t: number) => S("3583", t);

function PaginaBigO() {
  const arvore: [number, number][] = [
    [1140, 705],
    [1060, 765],
    [1220, 765],
    [1020, 825],
    [1100, 825],
    [1180, 825],
    [1260, 825],
  ];
  const ligacoes: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ];
  return (
    <NaPagina p={P.bigo}>
      <Capitulo n={3} titulo="Big O" de={pausas[3].de + 0.3} />
      <Texto x={790} y={150} tam={88} ancora="middle" destaque={cor.azul} de={s(111.5)} dur={0.6}>
        {"*{Big O}"}
      </Texto>
      <Caixa x={160} y={220} w={560} h={110} texto="fatorial" tam={48} preench={claro.azul} de={s(117.9)} dur={0.45} />
      <Check x={650} y={292} s={44} de={s(118.5)} dur={0.3} />
      <Caixa x={860} y={220} w={560} h={110} texto="fibonacci" tam={48} preench={claro.verde} de={s(119.4)} dur={0.45} />
      <Check x={1350} y={292} s={44} de={s(120.0)} dur={0.3} />
      <Texto x={790} y={420} tam={50} cor={cor.laranja} ancora="middle" de={s(123.0)} dur={0.8}>
        são igualmente eficientes?
      </Texto>
      <Texto x={790} y={500} tam={38} ancora="middle" destaque={cor.azul} de={s(129.0)} dur={1.6}>
        {"*{Big O}: um limite para o crescimento do custo\nconforme a entrada aumenta"}
      </Texto>
      {/* fatorial: uma chamada por nível */}
      <Texto x={440} y={650} tam={36} ancora="middle" de={s(136.2)} dur={0.7}>
        1 chamada por nível
      </Texto>
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Caixa x={190 + i * 135} y={690} w={95} h={56} texto={`f(${4 - i})`} tam={28} preench={claro.azul} hachura="solid" de={s(137.3) + i * 0.15} dur={0.2} atrasoTexto={0.05} />
          {i < 3 && <Seta desde={[288 + i * 135, 718]} para={[322 + i * 135, 718]} de={s(137.4) + i * 0.15} dur={0.15} ponta={12} espessura={2.5} />}
        </React.Fragment>
      ))}
      <Texto x={440} y={800} tam={32} cor={cor.cinza} ancora="middle" de={s(140.9)} dur={0.8}>
        cresce na mesma proporção da entrada
      </Texto>
      <Etiqueta x={440} y={890} texto="O(n) · linear" tam={46} preench={claro.azul} de={s(144.6)} dur={0.45} />
      {/* fibonacci: cada chamada gera outras duas */}
      <Texto x={1140} y={650} tam={36} ancora="middle" de={s(150.9)} dur={0.8}>
        cada chamada gera outras 2
      </Texto>
      {ligacoes.map(([p, f], i) => (
        <Linha key={i} pts={[arvore[p], arvore[f]]} cor={cor.cinza} espessura={2.4} de={s(152.5) + i * 0.08} dur={0.15} />
      ))}
      {arvore.map(([x, y], i) => (
        <Elipse key={i} cx={x} cy={y} w={34} h={34} preench={claro.vermelho} hachura="solid" cor={cor.vermelho} de={s(152.4) + i * 0.07} dur={0.15} />
      ))}
      <Etiqueta x={1140} y={910} texto="O(2^{n}) · exponencial" tam={46} preench={claro.vermelho} de={s(157.1)} dur={0.45} />
      <Texto x={1140} y={990} tam={28} cor={cor.cinza} ancora="middle" de={s(159.4)} dur={0.9}>
        {"limite superior (na prática, perto de 1,6^{n})"}
      </Texto>
    </NaPagina>
  );
}

function PaginaCusto() {
  const linhas: [string, string, string, number, boolean][] = [
    ["10", "10", "177", 178.6, false],
    ["20", "20", "21.891", 179.7, false],
    ["30", "30", "2.692.537", 181.0, true],
    ["40", "40", "331.160.281", 182.0, true],
  ];
  const colunas = [330, 690, 1090];
  return (
    <NaPagina p={P.custo}>
      <Texto x={790} y={140} tam={62} ancora="middle" de={s(173.6)} dur={1.0}>
        funciona... mas quanto custa?
      </Texto>
      {["n", "fatorial(n)", "fibonacci(n)"].map((h, i) => (
        <Texto key={h} x={colunas[i]} y={260} tam={40} cor={cor.cinza} ancora="middle" de={s(174.6) + i * 0.15}>
          {h}
        </Texto>
      ))}
      <Linha pts={[[200, 290], [1300, 290]]} cor={cor.cinza} espessura={2.4} de={s(175.0)} dur={0.4} />
      {linhas.map(([n, f, b, t, grande], i) => {
        const y = 370 + i * 88;
        return (
          <React.Fragment key={n}>
            <Texto x={colunas[0]} y={y} tam={44} ancora="middle" de={s(t)}>
              {n}
            </Texto>
            <Texto x={colunas[1]} y={y} tam={44} cor={cor.azul} ancora="middle" de={s(t) + 0.1}>
              {f}
            </Texto>
            <Texto x={colunas[2]} y={y} tam={44} cor={grande ? cor.vermelho : cor.tinta} ancora="middle" de={s(t) + 0.2}>
              {b}
            </Texto>
          </React.Fragment>
        );
      })}
      <Texto x={750} y={700} tam={30} cor={cor.cinza} ancora="middle" de={s(183.4)} dur={0.8}>
        número de chamadas recursivas para calcular cada valor
      </Texto>
      <Marca x={280} y={812} w={960} h={104} de={s(189.0)} dur={0.6} />
      <Texto x={760} y={850} tam={42} ancora="middle" de={s(186.8)} dur={1.4}>
        {"não basta encontrar a resposta:\né preciso entender quanto custa encontrá-la"}
      </Texto>
    </NaPagina>
  );
}

function PaginaGrafico() {
  const X = (n: number) => 200 + n * 110;
  const Y = (v: number) => 940 - v * 0.65;
  const contagem = [199.8, 200.1, 200.4, 200.7, 201.0];
  const exponencial: [number, number][] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [X(n), Y(2 ** n)]);
  return (
    <NaPagina p={P.grafico}>
      <Texto x={760} y={130} tam={60} ancora="middle" de={s(195.8)} dur={0.9}>
        como o trabalho cresce
      </Texto>
      <Seta desde={[200, 940]} para={[1340, 940]} cor={cor.cinza} espessura={2.6} de={s(196.4)} dur={0.4} />
      <Seta desde={[200, 940]} para={[200, 220]} cor={cor.cinza} espessura={2.6} de={s(196.5)} dur={0.4} />
      {[0, 300, 600, 900].map((v) => (
        <React.Fragment key={v}>
          <Linha pts={[[192, Y(v)], [208, Y(v)]]} cor={cor.cinza} espessura={2} de={s(196.7)} dur={0.1} />
          <Texto x={180} y={Y(v) + 10} tam={28} cor={cor.cinza} ancora="end" de={s(196.8)}>
            {String(v)}
          </Texto>
        </React.Fragment>
      ))}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <Texto key={n} x={X(n)} y={985} tam={28} cor={cor.cinza} ancora="middle" de={s(196.9)}>
          {String(n)}
        </Texto>
      ))}
      <Texto x={1345} y={985} tam={30} cor={cor.cinza} de={s(196.9)}>
        n
      </Texto>
      {/* O(n): a mesma quantidade a cada passo */}
      <Linha pts={[[X(1), Y(1)], [X(10), Y(10)]]} cor={cor.azul} espessura={5} de={s(198.6)} dur={0.6} />
      {contagem.map((t, i) => (
        <Elipse key={i} cx={X(i + 1)} cy={Y(i + 1)} w={20} h={20} preench={cor.azul} hachura="solid" cor={cor.azul} de={s(t)} dur={0.12} />
      ))}
      <Texto x={1320} y={905} tam={38} cor={cor.azul} ancora="end" de={s(198.9)} dur={0.5}>
        O(n) · linear
      </Texto>
      {/* O(2^n): a curva dispara */}
      <Curva pts={exponencial} cor={cor.vermelho} espessura={5} aspereza={0.7} de={s(202.0)} dur={1.2} />
      <Texto x={1180} y={300} tam={38} cor={cor.vermelho} ancora="end" de={s(202.6)} dur={0.6}>
        {"O(2^{n}) · exponencial"}
      </Texto>
      <Texto x={760} y={1040} tam={26} cor={cor.cinza} ancora="middle" de={s(203.4)} dur={0.6}>
        {"curvas ilustrativas: n e 2^{n} (não são medições de tempo)"}
      </Texto>
    </NaPagina>
  );
}

export function BigO() {
  return (
    <>
      <PaginaBigO />
      <PaginaCusto />
      <PaginaGrafico />
    </>
  );
}
