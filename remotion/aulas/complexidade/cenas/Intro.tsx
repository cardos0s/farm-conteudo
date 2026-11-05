import React from "react";
import { Caminho, Check, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S } from "../roteiro";

const s = (t: number) => S("3227", t);

export function Abertura() {
  return (
    <NaPagina p={P.abertura}>
      <Texto x={960} y={330} tam={46} cor={cor.cinza} ancora="middle" de={0.12} dur={0.6}>
        Algoritmos e Estruturas de Dados
      </Texto>
      <Texto x={960} y={505} tam={124} ancora="middle" de={0.3} dur={1.0}>
        Complexidade de Algoritmos
      </Texto>
      <Linha pts={[[470, 552], [960, 546], [1450, 556]]} cor={cor.azul} espessura={5} de={1.15} dur={0.4} />
      <Etiqueta x={960} y={675} texto="aula 1" tam={46} preench={claro.amarelo} de={1.3} dur={0.4} />
      {/* rabiscos de canto */}
      {[0, 1, 2, 3].map((i) => (
        <Ret key={i} x={150 + i * 74} y={860} w={74} h={74} redondo={false} de={0.5 + i * 0.07} dur={0.3} />
      ))}
      {["7", "3", "9", "1"].map((v, i) => (
        <Texto key={v} x={187 + i * 74} y={910} tam={40} ancora="middle" de={0.75 + i * 0.07}>
          {v}
        </Texto>
      ))}
      <Seta desde={[1500, 960]} para={[1800, 960]} de={0.55} dur={0.35} cor={cor.cinza} espessura={2.5} />
      <Seta desde={[1500, 960]} para={[1500, 760]} de={0.6} dur={0.35} cor={cor.cinza} espessura={2.5} />
      <Linha pts={[[1505, 950], [1600, 930], [1690, 880], [1770, 780]]} cor={cor.vermelho} espessura={4} de={0.9} dur={0.5} />
    </NaPagina>
  );
}

function PaginaIA() {
  return (
    <NaPagina p={P.ia}>
      <Texto x={480} y={120} tam={54} ancora="middle" de={s(20.1)} dur={0.9}>
        Hoje todo mundo programa
      </Texto>
      <Texto x={480} y={192} tam={54} ancora="middle" de={s(22.0)} dur={0.6}>
        {"usando *{IA}"}
      </Texto>
      {/* robô */}
      <Linha pts={[[250, 300], [250, 252]]} de={s(22.3)} dur={0.2} />
      <Elipse cx={250} cy={240} w={30} h={30} preench={claro.vermelho} hachura="solid" de={s(22.4)} dur={0.25} />
      <Ret x={110} y={300} w={280} h={220} preench={claro.azul} de={s(22.4)} dur={0.7} />
      <Elipse cx={195} cy={385} w={48} h={48} preench={cor.tinta} hachura="solid" de={s(22.9)} dur={0.25} />
      <Elipse cx={305} cy={385} w={48} h={48} preench={cor.tinta} hachura="solid" de={s(23.0)} dur={0.25} />
      <Linha pts={[[200, 462], [250, 475], [300, 462]]} de={s(23.1)} dur={0.25} />
      <Texto x={250} y={590} tam={54} ancora="middle" de={s(23.0)}>
        IA
      </Texto>
      {/* janela de código */}
      <Ret x={540} y={300} w={340} h={240} preench="#ffffff" hachura="solid" de={s(26.5)} dur={0.6} />
      <Linha pts={[[540, 345], [880, 345]]} de={s(26.9)} dur={0.25} />
      {[0, 1, 2].map((i) => (
        <Elipse key={i} cx={566 + i * 26} cy={323} w={14} h={14} de={s(26.9) + i * 0.05} dur={0.15} />
      ))}
      <Linha pts={[[570, 392], [770, 392]]} cor={cor.violeta} espessura={5} de={s(27.4)} dur={0.3} />
      <Linha pts={[[600, 432], [840, 432]]} cor={cor.azul} espessura={5} de={s(27.8)} dur={0.3} />
      <Linha pts={[[600, 472], [730, 472]]} cor={cor.verde} espessura={5} de={s(28.2)} dur={0.3} />
      <Linha pts={[[570, 512], [690, 512]]} cor={cor.violeta} espessura={5} de={s(28.6)} dur={0.3} />
      <Seta desde={[405, 410]} para={[525, 410]} de={s(27.9)} dur={0.45} />
      <Texto x={710} y={605} tam={38} ancora="middle" de={s(27.4)} dur={1.1}>
        {"um dos melhores\nescritores de código"}
      </Texto>
      <Check x={300} y={790} s={52} de={s(24.9)} dur={0.35} />
      <Texto x={370} y={808} tam={50} cor={cor.verde} de={s(24.9)} dur={0.7}>
        não é errado
      </Texto>
    </NaPagina>
  );
}

function PaginaFerrari() {
  return (
    <NaPagina p={P.ferrari}>
      <Texto x={480} y={110} tam={50} ancora="middle" de={s(30.8)} dur={1.0}>
        {"não adianta ter uma *{Ferrari}..."}
      </Texto>
      {/* carro esportivo */}
      <Linha pts={[[110, 330], [170, 330]]} cor={cor.cinza} espessura={2.5} de={s(33.2)} dur={0.2} />
      <Linha pts={[[90, 360], [160, 360]]} cor={cor.cinza} espessura={2.5} de={s(33.3)} dur={0.2} />
      <Caminho
        d="M200 395 L220 340 Q300 312 380 305 L455 255 Q530 236 610 252 L700 300 Q775 306 790 345 L795 395 Z"
        cor={cor.vermelho}
        preench={claro.vermelho}
        de={s(32.4)}
        dur={1.0}
      />
      <Caminho d="M470 268 L600 268 L660 304 L445 304 Z" preench={claro.azul} cor={cor.tinta} espessura={2.5} de={s(32.9)} dur={0.5} />
      <Elipse cx={315} cy={398} w={96} h={96} preench="#495057" hachura="solid" de={s(33.0)} dur={0.35} />
      <Elipse cx={680} cy={398} w={96} h={96} preench="#495057" hachura="solid" de={s(33.1)} dur={0.35} />
      <Texto x={520} y={370} tam={46} ancora="middle" de={s(33.3)}>
        IA
      </Texto>
      <Texto x={480} y={545} tam={46} ancora="middle" de={s(33.6)} dur={0.9}>
        ...e não saber dirigir
      </Texto>
      {/* carteira de motorista */}
      <Ret x={80} y={640} w={340} h={210} preench={claro.verde} de={s(36.5)} dur={0.6} />
      <Ret x={105} y={690} w={86} h={110} redondo={false} de={s(36.6)} dur={0.3} />
      <Texto x={300} y={705} tam={44} ancora="middle" de={s(36.6)}>
        CNH
      </Texto>
      <Linha pts={[[220, 745], [385, 745]]} espessura={2.5} de={s(36.7)} dur={0.2} />
      <Linha pts={[[220, 785], [350, 785]]} espessura={2.5} de={s(36.8)} dur={0.2} />
      <Xis x={250} y={745} s={170} espessura={8} de={s(36.9)} dur={0.45} />
      {/* consequências */}
      {[
        [39.9, "não vai utilizar"],
        [41.1, "fica parada"],
        [42.1, "sem manutenção"],
        [43.5, "não aproveita"],
      ].map(([t, txt], i) => (
        <React.Fragment key={i}>
          <Xis x={500} y={670 + i * 72} s={26} espessura={4} de={s(t as number)} dur={0.25} />
          <Texto x={535} y={683 + i * 72} tam={40} de={s(t as number)} dur={0.5}>
            {txt as string}
          </Texto>
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

function PaginaQuestionar() {
  return (
    <NaPagina p={P.questionar}>
      <Texto x={480} y={125} tam={56} ancora="middle" de={s(54.0)} dur={0.8}>
        {"usar IA é *{inevitável}"}
      </Texto>
      <Caixa x={160} y={220} w={640} h={130} texto="usar IA para criar código" tam={42} preench={claro.azul} de={s(57.2)} dur={0.6} />
      <Seta desde={[480, 362]} para={[480, 440]} de={s(59.6)} dur={0.4} />
      <Caixa x={160} y={450} w={640} h={140} texto={"entender o que\nela está fazendo"} tam={42} preench={claro.amarelo} de={s(60.5)} dur={0.6} />
      <Seta desde={[480, 602]} para={[480, 680]} de={s(62.6)} dur={0.4} />
      <Caixa x={160} y={690} w={640} h={130} texto="questionar a IA" tam={48} preench={claro.verde} de={s(63.5)} dur={0.6} />
      <Texto x={850} y={810} tam={120} cor={cor.laranja} ancora="middle" de={s(64.1)} dur={0.3}>
        ?
      </Texto>
    </NaPagina>
  );
}

function PaginaFundamentos() {
  const fila = [0, 1, 2, 3];
  const arr = ["7", "3", "9", "1", "5"];
  return (
    <NaPagina p={P.fundamentos}>
      <Texto x={480} y={110} tam={56} ancora="middle" de={s(66.9)} dur={0.9}>
        {"a base: *{fundamentos}"}
      </Texto>
      {/* fila */}
      <Texto x={250} y={215} tam={46} cor={cor.laranja} ancora="middle" de={s(79.1)} dur={0.5}>
        fila?
      </Texto>
      {fila.map((i) => (
        <Ret key={i} x={110 + i * 74} y={250} w={66} h={66} preench={claro.laranja} redondo={false} de={s(79.3) + i * 0.08} dur={0.3} />
      ))}
      <Seta desde={[470, 283]} para={[412, 283]} de={s(79.7)} dur={0.3} ponta={16} />
      <Seta desde={[104, 283]} para={[44, 283]} de={s(79.9)} dur={0.3} ponta={16} />
      {/* array */}
      <Texto x={720} y={215} tam={46} cor={cor.azul} ancora="middle" de={s(82.3)} dur={0.5}>
        array?
      </Texto>
      {arr.map((v, i) => (
        <React.Fragment key={i}>
          <Ret x={540 + i * 76} y={250} w={70} h={66} redondo={false} de={s(82.5) + i * 0.06} dur={0.25} />
          <Texto x={575 + i * 76} y={296} tam={36} ancora="middle" de={s(82.7) + i * 0.06}>
            {v}
          </Texto>
          <Texto x={575 + i * 76} y={350} tam={26} cor={cor.cinza} ancora="middle" de={s(82.9) + i * 0.06}>
            {String(i)}
          </Texto>
        </React.Fragment>
      ))}
      {/* pirâmide */}
      <Caixa x={380} y={440} w={200} h={90} texto="IA" tam={42} preench={claro.violeta} de={s(67.0)} dur={0.4} />
      <Caixa x={250} y={540} w={460} h={100} texto="seu código" tam={42} preench={claro.azul} de={s(67.2)} dur={0.45} />
      <Ret x={90} y={650} w={780} h={230} preench={claro.amarelo} de={s(67.4)} dur={0.6} />
      <Texto x={480} y={712} tam={46} ancora="middle" de={s(67.7)}>
        fundamentos
      </Texto>
      <Caixa x={120} y={750} w={350} h={96} texto={"estruturas\nde dados"} tam={34} preench={claro.verde} hachura="solid" de={s(74.5)} dur={0.45} />
      <Caixa x={490} y={750} w={350} h={96} texto="algoritmos" tam={40} preench={claro.verde} hachura="solid" de={s(75.8)} dur={0.45} />
      <Texto x={480} y={950} tam={40} cor={cor.vermelho} ancora="middle" de={s(72.3)} dur={0.8}>
        o que mais falta no mercado!
      </Texto>
    </NaPagina>
  );
}

function PaginaBaseML() {
  const camadas = [
    { x: 260, ys: [220, 330, 440] },
    { x: 480, ys: [190, 290, 390, 490] },
    { x: 700, ys: [280, 400] },
  ];
  const ligacoes: [number, number, number, number][] = [];
  for (let c = 0; c < 2; c++)
    for (const y1 of camadas[c].ys) for (const y2 of camadas[c + 1].ys) ligacoes.push([camadas[c].x, y1, camadas[c + 1].x, y2]);
  const celulas = [0, 1, 2, 3, 4, 5];
  return (
    <NaPagina p={P.baseMl}>
      <Texto x={480} y={115} tam={48} ancora="middle" de={s(102.6)} dur={1.0}>
        machine learning, redes neurais...
      </Texto>
      {ligacoes.map(([x1, y1, x2, y2], i) => (
        <Linha key={i} pts={[[x1, y1], [x2, y2]]} cor={cor.cinza} espessura={1.8} aspereza={0.6} de={s(103.9) + i * 0.025} dur={0.25} />
      ))}
      {camadas.flatMap((c, ci) =>
        c.ys.map((y, i) => (
          <Elipse key={`${ci}-${i}`} cx={c.x} cy={y} w={58} h={58} preench={claro.violeta} hachura="solid" cor={cor.violeta} de={s(103.0) + (ci * 4 + i) * 0.06} dur={0.3} />
        )),
      )}
      <Seta desde={[480, 640]} para={[480, 548]} de={s(106.0)} dur={0.35} />
      <Caixa x={170} y={650} w={620} h={100} texto="a base: fundamentos" tam={42} preench={claro.amarelo} de={s(105.8)} dur={0.5} />
      <Texto x={110} y={830} tam={44} de={s(108.9)} dur={0.4}>
        memória
      </Texto>
      {celulas.map((i) => (
        <React.Fragment key={i}>
          <Ret
            x={110 + i * 125}
            y={860}
            w={116}
            h={80}
            redondo={false}
            preench={i === 2 || i === 3 ? claro.azul : undefined}
            de={i === 2 || i === 3 ? s(110.4) : s(109.0) + i * 0.06}
            dur={0.35}
          />
          <Texto x={168 + i * 125} y={980} tam={24} cor={cor.cinza} ancora="middle" de={s(109.2) + i * 0.06}>
            {`0x0${i}`}
          </Texto>
        </React.Fragment>
      ))}
      <Texto x={625} y={820} tam={40} cor={cor.azul} de={s(110.4)} dur={0.4}>
        alocação
      </Texto>
      <Seta desde={[600, 815]} para={[500, 855]} via={[560, 800]} cor={cor.azul} de={s(110.6)} dur={0.35} ponta={16} />
    </NaPagina>
  );
}

export function Intro() {
  return (
    <>
      <Abertura />
      <PaginaIA />
      <PaginaFerrari />
      <PaginaQuestionar />
      <PaginaFundamentos />
      <PaginaBaseML />
    </>
  );
}
