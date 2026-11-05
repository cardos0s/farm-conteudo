import React from "react";
import { Check, Curva, Elipse, Linha, Ret, Seta } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { useT, progresso } from "../../../lousa/tempo";
import { P } from "../paginas";
import { S, pausas } from "../roteiro";
import { Capitulo } from "./Eficiencia";

const b = (t: number) => S("3233", t);
const c = (t: number) => S("3234", t);

type Pt = [number, number];

function PaginaBigO() {
  return (
    <NaPagina p={P.bigo}>
      <Capitulo n={3} titulo="notação Big O" de={pausas[3].de + 0.35} />
      <Texto x={960} y={140} tam={80} ancora="middle" destaque={cor.azul} de={b(1.6)} dur={0.8}>
        {"notação *{Big O}"}
      </Texto>
      {/* gráfico */}
      <Seta desde={[150, 900]} para={[1000, 900]} cor={cor.cinza} espessura={2.8} de={b(6.4)} dur={0.45} />
      <Seta desde={[150, 900]} para={[150, 230]} cor={cor.cinza} espessura={2.8} de={b(6.6)} dur={0.45} />
      <Texto x={575} y={965} tam={36} cor={cor.cinza} ancora="middle" de={b(7.3)} dur={0.7}>
        n (tamanho da entrada)
      </Texto>
      <Texto x={170} y={240} tam={36} cor={cor.cinza} de={b(7.3)}>
        tempo
      </Texto>
      <Curva pts={[[160, 880], [400, 800], [650, 620], [900, 390]]} cor={cor.azul} espessura={5} de={b(8.9)} dur={1.0} />
      <Texto x={925} y={450} tam={46} cor={cor.azul} de={b(9.5)}>
        T(n)
      </Texto>
      <Seta desde={[905, 385]} para={[985, 268]} cor={cor.azul} espessura={4} de={b(13.7)} dur={0.5} />
      <Texto x={260} y={330} tam={40} cor={cor.cinza} de={b(14.3)} dur={0.8}>
        {"e quando n fica\nmuito grande?"}
      </Texto>
      <Curva pts={[[160, 860], [400, 760], [650, 560], [880, 300]]} cor={cor.vermelho} espessura={3.2} aspereza={1.4} de={b(17.1)} dur={0.9} />
      <Texto x={560} y={520} tam={40} cor={cor.vermelho} ancora="end" de={b(17.8)} dur={1.1}>
        {"limite superior\nmais justo possível"}
      </Texto>
      {/* computador 2x mais rápido */}
      <Ret x={1130} y={250} w={300} h={200} preench={claro.azul} de={b(21.4)} dur={0.5} />
      <Linha pts={[[1280, 450], [1280, 505]]} de={b(21.7)} dur={0.15} />
      <Linha pts={[[1205, 505], [1355, 505]]} de={b(21.8)} dur={0.15} />
      <Texto x={1280} y={585} tam={46} cor={cor.laranja} ancora="middle" de={b(21.9)} dur={0.6}>
        2× mais rápido
      </Texto>
      <Texto x={1280} y={670} tam={40} ancora="middle" de={b(23.2)} dur={1.0}>
        {"a complexidade\ncontinua a *{mesma}"}
      </Texto>
      <Check x={1050} y={720} s={46} de={b(25.0)} dur={0.3} />
    </NaPagina>
  );
}

// gráfico das classes de complexidade
const X0 = 150;
const Y0 = 960;
const LG = 670;
const AL = 770;
const log2 = Math.log2;
const funcoes: { nome: string; f: (u: number) => number; cor: string; claro: string; de: number }[] = [
  { nome: "O(1)", f: () => 0.08, cor: cor.verde, claro: claro.verde, de: c(7.0) },
  { nome: "O(n)", f: (u) => 0.08 + 0.45 * u, cor: cor.azul, claro: claro.azul, de: c(12.2) },
  { nome: "O(n^{2})", f: (u) => 0.08 + 1.4 * u * u, cor: cor.vermelho, claro: claro.vermelho, de: c(15.6) },
  { nome: "O(log n)", f: (u) => 0.08 + (0.16 * log2(1 + 7 * u)) / 3, cor: cor.ciano, claro: claro.ciano, de: c(20.2) },
  { nome: "O(n log n)", f: (u) => 0.08 + (0.62 * u * log2(1 + 7 * u)) / 3, cor: cor.laranja, claro: claro.laranja, de: c(30.8) },
  { nome: "O(n!)", f: (u) => 0.08 + 0.92 * Math.pow(u / 0.45, 5), cor: cor.violeta, claro: claro.violeta, de: c(36.7) },
];

function pontos(f: (u: number) => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const v = f(u);
    if (v > 1.0) {
      out.push([X0 + LG * u, Y0 - AL * 1.0]);
      break;
    }
    if (i % 4 === 0 || f((i + 1) / 40) > 0.6) out.push([X0 + LG * u, Y0 - AL * v]);
  }
  return out;
}

function Nota({ de, ate, titulo, nome, texto, corForte, corClara, extra }: { de: number; ate?: number; titulo: string; nome: string; texto: string; corForte: string; corClara: string; extra?: React.ReactNode }) {
  return (
    <>
      <Ret x={1040} y={180} w={400} h={470} cor={corForte} preench={corClara} vaoHachura={22} pesoHachura={1.6} de={de} dur={0.5} ate={ate} />
      <Texto x={1240} y={275} tam={66} cor={corForte} ancora="middle" de={de + 0.15} dur={0.4} ate={ate}>
        {titulo}
      </Texto>
      <Texto x={1240} y={345} tam={40} ancora="middle" de={de + 0.35} dur={0.5} ate={ate}>
        {nome}
      </Texto>
      <Texto x={1240} y={435} tam={36} ancora="middle" de={de + 0.6} dur={0.9} ate={ate}>
        {texto}
      </Texto>
      {extra}
    </>
  );
}

function PaginaClasses() {
  const fim = c(45.3);
  return (
    <NaPagina p={P.classes}>
      <Capitulo n={4} titulo="classes de complexidade" de={pausas[4].de + 0.3} />
      <Texto x={960} y={128} tam={56} ancora="middle" destaque={cor.azul} de={c(4.6)} dur={1.0}>
        {"as notações *{Big O} mais importantes"}
      </Texto>
      <Seta desde={[X0, Y0]} para={[X0 + LG + 40, Y0]} cor={cor.cinza} espessura={2.8} de={pausas[4].ate - 0.1} dur={0.4} />
      <Seta desde={[X0, Y0]} para={[X0, Y0 - AL - 30]} cor={cor.cinza} espessura={2.8} de={pausas[4].ate} dur={0.4} />
      <Texto x={X0 + LG + 40} y={Y0 + 50} tam={34} cor={cor.cinza} ancora="middle" de={c(6.0)}>
        n
      </Texto>
      <Texto x={X0 + 18} y={Y0 - AL - 8} tam={32} cor={cor.cinza} de={c(6.0)}>
        operações
      </Texto>
      {funcoes.map((fn) => {
        const pts = pontos(fn.f);
        const fimPt = pts[pts.length - 1];
        const topo = fimPt[1] <= Y0 - AL + 1;
        const rotX = fimPt[0] + 16;
        const rotY = topo ? fimPt[1] + 26 : fimPt[1] + 14;
        return (
          <React.Fragment key={fn.nome}>
            <Curva pts={pts} cor={fn.cor} espessura={5} aspereza={0.8} de={fn.de} dur={0.9} />
            <Texto x={rotX} y={rotY} tam={36} cor={fn.cor} de={fn.de + 0.6}>
              {fn.nome}
            </Texto>
          </React.Fragment>
        );
      })}
      <Nota de={c(7.1)} ate={c(12.0)} titulo="O(1)" nome="constante" texto={"não muda com o\ntamanho da entrada"} corForte={cor.verde} corClara={claro.verde} />
      <Nota de={c(12.2)} ate={c(15.4)} titulo="O(n)" nome="linear" texto={"passa por todos\numa vez"} corForte={cor.azul} corClara={claro.azul} />
      <Nota
        de={c(15.6)}
        ate={c(20.0)}
        titulo="O(n^{2})"
        nome="quadrático"
        texto={"um laço dentro\ndo outro"}
        corForte={cor.vermelho}
        corClara={claro.vermelho}
        extra={
          <Texto x={1110} y={560} tam={34} de={c(18.3)} dur={0.6} ate={c(20.0)}>
            {"para i...\n   para j..."}
          </Texto>
        }
      />
      <Nota
        de={c(20.2)}
        ate={c(30.6)}
        titulo="O(log n)"
        nome="logarítmico"
        texto={"corta a busca\npela metade"}
        corForte={cor.ciano}
        corClara={claro.ciano}
        extra={
          <>
            {[0, 1, 2, 3].map((i) => (
              <Linha key={i} pts={[[1090, 535 + i * 22], [1090 + 300 / Math.pow(2, i), 535 + i * 22]]} cor={cor.ciano} espessura={7} aspereza={0.5} de={c(24.6) + i * 0.3} dur={0.25} ate={c(30.6)} />
            ))}
            <Texto x={1240} y={630} tam={34} cor={cor.ciano} ancora="middle" de={c(28.3)} dur={0.6} ate={c(30.6)}>
              busca binária
            </Texto>
          </>
        }
      />
      <Nota de={c(30.8)} ate={c(36.5)} titulo="O(n log n)" nome="ordenação eficiente" texto={"merge sort\nquicksort"} corForte={cor.laranja} corClara={claro.laranja} />
      <Nota
        de={c(36.7)}
        ate={fim + 1}
        titulo="O(n!)"
        nome="fatorial"
        texto={"testa todas as\nordens possíveis"}
        corForte={cor.violeta}
        corClara={claro.violeta}
        extra={
          <Texto x={1240} y={590} tam={32} cor={cor.cinza} ancora="middle" de={c(42.4)} dur={0.8} ate={fim + 1}>
            {"(busca exaustiva)"}
          </Texto>
        }
      />
    </NaPagina>
  );
}

/** Ponteiro que percorre as células do array, uma por uma. */
function Ponteiro({ x0, passo, n, y, de, dur }: { x0: number; passo: number; n: number; y: number; de: number; dur: number }) {
  const t = useT();
  const p = progresso(t, de + 0.3, dur, (x) => x);
  const i = Math.min(n - 1, Math.floor(p * n));
  return (
    <g transform={`translate(${i * passo} 0)`}>
      <Seta desde={[x0, y + 70]} para={[x0, y]} cor={cor.vermelho} espessura={4} ponta={18} de={de} dur={0.3} />
    </g>
  );
}

function PaginaEstruturas() {
  const valores = ["7", "3", "9", "1", "5", "8"];
  return (
    <NaPagina p={P.estruturas}>
      <Texto x={960} y={110} tam={60} ancora="middle" de={c(45.6)} dur={0.9}>
        as estruturas mais comuns
      </Texto>
      {/* array */}
      <Texto x={110} y={285} tam={50} cor={cor.azul} de={c(47.0)} dur={0.5}>
        list / array
      </Texto>
      {valores.map((v, i) => (
        <React.Fragment key={i}>
          <Ret x={460 + i * 104} y={215} w={98} h={98} redondo={false} de={c(47.4) + i * 0.07} dur={0.25} />
          <Texto x={509 + i * 104} y={280} tam={46} ancora="middle" de={c(47.6) + i * 0.07}>
            {v}
          </Texto>
        </React.Fragment>
      ))}
      <Ponteiro x0={509} passo={104} n={6} y={325} de={c(49.9)} dur={1.6} />
      <Etiqueta x={1250} y={265} texto="O(n) · linear" tam={44} preench={claro.azul} de={c(51.4)} dur={0.45} />
      {/* hash map */}
      <Texto x={110} y={545} tam={50} cor={cor.verde} de={c(62.5)} dur={0.5}>
        hash map
      </Texto>
      <Texto x={110} y={595} tam={32} cor={cor.cinza} de={c(61.7)} dur={0.5}>
        (dicionário)
      </Texto>
      <Etiqueta x={540} y={540} texto="chave" tam={40} preench={claro.amarelo} de={c(64.6)} dur={0.4} />
      <Seta desde={[615, 540]} para={[700, 540]} de={c(64.9)} dur={0.3} />
      <Caixa x={710} y={490} w={190} h={100} texto="hash( )" tam={40} preench={claro.violeta} de={c(65.0)} dur={0.4} />
      <Seta desde={[905, 540]} para={[985, 520]} de={c(65.6)} dur={0.3} />
      {[0, 1, 2, 3].map((i) => (
        <Ret key={i} x={995} y={440 + i * 46} w={110} h={42} redondo={false} preench={i === 1 ? claro.verde : undefined} hachura="solid" de={c(65.3) + i * 0.06} dur={0.2} />
      ))}
      <Etiqueta x={1305} y={540} texto="O(1) · constante" tam={40} preench={claro.verde} de={c(68.3)} dur={0.45} />
      {/* hash set */}
      <Texto x={110} y={820} tam={50} cor={cor.violeta} de={c(72.5)} dur={0.5}>
        hash set
      </Texto>
      <Elipse cx={600} cy={810} w={290} h={170} cor={cor.violeta} de={c(73.2)} dur={0.5} />
      {[
        ["3", 545, 790],
        ["7", 625, 855],
        ["9", 670, 790],
      ].map(([v, x, y], i) => (
        <Texto key={v as string} x={x as number} y={y as number} tam={46} ancora="middle" de={c(73.5) + i * 0.12}>
          {v as string}
        </Texto>
      ))}
      <Texto x={790} y={790} tam={40} de={c(75.3)} dur={0.7}>
        existe? sim / não
      </Texto>
      <Texto x={790} y={855} tam={40} cor={cor.cinza} de={c(76.3)} dur={0.6}>
        sem repetidos
      </Texto>
      <Etiqueta x={1290} y={815} texto="O(1)" tam={46} preench={claro.verde} de={c(78.7)} dur={0.4} />
    </NaPagina>
  );
}

export function BigO() {
  return (
    <>
      <PaginaBigO />
      <PaginaClasses />
      <PaginaEstruturas />
    </>
  );
}
