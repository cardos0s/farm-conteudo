import React from "react";
import { Check, Curva, Elipse, Linha, Ret, Seta } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta, Marca } from "../../../lousa/Pecas";
import { largura, Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S, pausas } from "../roteiro";
import { Capitulo } from "./Eficiencia";

const a = (t: number) => S("3231", t);
const s = (t: number) => S("3232", t);

function PaginaOperacoes() {
  const cartoes: [number, number, string, string, string][] = [
    [a(3.6), 140, "ler / gravar\nna memória", claro.verde, cor.verde],
    [a(6.3), 720, "aritmética\n+   −   ×   ÷", claro.azul, cor.azul],
    [a(7.9), 1300, "booleanas\nAND  OR  NOT", claro.violeta, cor.violeta],
  ];
  return (
    <NaPagina p={P.ramIntro}>
      <Capitulo n={2} titulo="modelo RAM" de={pausas[2].de + 0.3} />
      <Texto x={960} y={185} tam={56} ancora="middle" de={a(0.8)} dur={1.0}>
        operações básicas
      </Texto>
      {cartoes.map(([t, x, txt, p], i) => (
        <React.Fragment key={i}>
          <Caixa x={x} y={240} w={480} h={180} texto={txt} tam={44} preench={p} de={t} dur={0.55} />
          <Texto x={x + 240} y={500} tam={42} ancora="middle" de={a(10.2) + i * 0.3} dur={0.6}>
            {"= *{1} unidade de tempo"}
          </Texto>
        </React.Fragment>
      ))}
      <Linha pts={[[140, 590], [1780, 590]]} cor={cor.cinza} espessura={2} aspereza={1.6} de={s(2.6)} dur={0.5} />
      <Texto x={140} y={705} tam={84} destaque={cor.azul} de={s(2.85)} dur={0.6}>
        {"modelo *{RAM}"}
      </Texto>
      <Texto x={140 + largura("modelo RAM", 84) + 30} y={705} tam={36} cor={cor.cinza} de={s(3.4)} dur={0.7}>
        (Random Access Machine)
      </Texto>
      <Texto x={140} y={830} tam={54} de={s(4.6)} dur={0.9}>
        tempo de execução
      </Texto>
      <Texto x={140 + largura("tempo de execução ", 54)} y={830} tam={54} destaque={cor.azul} de={s(6.6)} dur={0.8}>
        {"= *{Σ} etapas"}
      </Texto>
      <Texto x={140} y={920} tam={38} cor={cor.cinza} de={s(11.3)} dur={0.7}>
        para um conjunto de dados (a entrada)
      </Texto>
    </NaPagina>
  );
}

function IconeLaco({ cx, cy, de }: { cx: number; cy: number; de: number }) {
  return (
    <>
      <Curva
        pts={[
          [cx + 60, cy],
          [cx + 30, cy - 50],
          [cx - 30, cy - 50],
          [cx - 60, cy],
          [cx - 30, cy + 50],
          [cx + 30, cy + 50],
          [cx + 55, cy + 15],
        ]}
        cor={cor.laranja}
        espessura={4}
        de={de}
        dur={0.6}
      />
      <Linha pts={[[cx + 38, cy + 30], [cx + 57, cy + 12], [cx + 72, cy + 38]]} cor={cor.laranja} espessura={4} de={de + 0.55} dur={0.2} />
    </>
  );
}

function PaginaPrincipios() {
  const chips: [number, string][] = [
    [18.6, "+"],
    [19.5, "x^{n}"],
    [20.5, "="],
    [21.0, "if"],
    [21.6, "else"],
  ];
  return (
    <NaPagina p={P.principios}>
      <Texto x={960} y={115} tam={62} ancora="middle" de={s(13.4)} dur={1.0}>
        princípios do modelo RAM
      </Texto>
      {/* 1. operações simples */}
      <Elipse cx={330} cy={268} w={440} h={150} cor={cor.vermelho} espessura={3} de={s(43.5)} dur={0.6} />
      <Ret x={100} y={180} w={460} h={460} cor={cor.azul} de={s(15.4)} dur={0.7} />
      <Texto x={330} y={255} tam={46} cor={cor.azul} ancora="middle" de={s(15.5)} dur={0.6}>
        {"1. operações\nsimples"}
      </Texto>
      <Texto x={330} y={385} tam={34} ancora="middle" de={s(16.2)} dur={0.8}>
        lógicas e aritméticas
      </Texto>
      {chips.map(([t, txt], i) => (
        <Etiqueta key={i} x={150 + i * 90} y={460} texto={txt} tam={34} pad={12} preench={claro.amarelo} hachura="solid" de={s(t)} dur={0.3} />
      ))}
      <Texto x={330} y={585} tam={36} cor={cor.azul} ancora="middle" de={s(24.5)} dur={0.6}>
        1 unidade de tempo
      </Texto>
      {/* 2. loops */}
      <Elipse cx={960} cy={268} w={440} h={150} cor={cor.vermelho} espessura={3} de={s(42.0)} dur={0.6} />
      <Ret x={730} y={180} w={460} h={460} cor={cor.laranja} de={s(27.1)} dur={0.7} />
      <Texto x={960} y={255} tam={46} cor={cor.laranja} ancora="middle" de={s(27.2)} dur={0.6}>
        {"2. loops e\nsub-rotinas"}
      </Texto>
      <IconeLaco cx={960} cy={430} de={s(28.4)} />
      <Texto x={960} y={565} tam={36} cor={cor.laranja} ancora="middle" de={s(30.9)} dur={0.7}>
        {"várias unidades\nde tempo"}
      </Texto>
      {/* 3. memória */}
      <Elipse cx={1590} cy={268} w={440} h={150} cor={cor.vermelho} espessura={3} de={s(41.1)} dur={0.6} />
      <Ret x={1360} y={180} w={460} h={460} cor={cor.verde} de={s(33.3)} dur={0.7} />
      <Texto x={1590} y={255} tam={46} cor={cor.verde} ancora="middle" de={s(34.2)} dur={0.6}>
        {"3. acesso à\nmemória"}
      </Texto>
      {[0, 1, 2, 3].map((i) => (
        <Ret key={i} x={1450 + i * 72} y={395} w={66} h={66} redondo={false} preench={i === 1 ? claro.verde : undefined} hachura="solid" de={s(34.7) + i * 0.08} dur={0.25} />
      ))}
      <Texto x={1590} y={585} tam={36} cor={cor.verde} ancora="middle" de={s(36.6)} dur={0.6}>
        1 unidade de tempo
      </Texto>
      <Texto x={700} y={760} tam={46} ancora="middle" de={s(38.6)} dur={1.0}>
        {"o RAM opera nesses *{3} princípios"}
      </Texto>
    </NaPagina>
  );
}

function PaginaCPU() {
  const instrucoes: [number, string, string][] = [
    [52.8, "LOAD", claro.verde],
    [53.1, "STORE", claro.verde],
    [53.9, "READ", claro.verde],
    [54.4, "WRITE", claro.verde],
    [55.1, "ADD", claro.azul],
    [56.0, "SUBTRACT", claro.azul],
    [56.8, "MULTIPLY", claro.azul],
    [57.5, "DIVIDE", claro.azul],
    [58.2, "TEST", claro.laranja],
    [58.6, "JUMP", claro.laranja],
    [59.0, "HALT", claro.laranja],
  ];
  const pinos = [0, 1, 2, 3];
  return (
    <NaPagina p={P.cpu}>
      <Texto x={960} y={115} tam={64} ancora="middle" destaque={cor.azul} de={s(48.2)} dur={1.0}>
        {"na prática: a *{CPU}"}
      </Texto>
      {/* chip */}
      {pinos.map((i) => (
        <React.Fragment key={i}>
          <Linha pts={[[290 + i * 72, 330], [290 + i * 72, 290]]} espessura={3} de={s(50.9) + i * 0.03} dur={0.12} />
          <Linha pts={[[290 + i * 72, 630], [290 + i * 72, 670]]} espessura={3} de={s(51.0) + i * 0.03} dur={0.12} />
          <Linha pts={[[250, 370 + i * 72], [210, 370 + i * 72]]} espessura={3} de={s(51.1) + i * 0.03} dur={0.12} />
          <Linha pts={[[550, 370 + i * 72], [590, 370 + i * 72]]} espessura={3} de={s(51.2) + i * 0.03} dur={0.12} />
        </React.Fragment>
      ))}
      <Ret x={250} y={330} w={300} h={300} preench={claro.cinza} de={s(50.3)} dur={0.6} />
      <Ret x={315} y={395} w={170} h={170} de={s(50.6)} dur={0.35} />
      <Texto x={400} y={498} tam={52} ancora="middle" de={s(50.6)}>
        CPU
      </Texto>
      <Seta desde={[615, 480]} para={[720, 480]} de={s(51.9)} dur={0.4} />
      {instrucoes.map(([t, txt, p], i) => {
        const col = i < 6 ? 0 : 1;
        const lin = i < 6 ? i : i - 6;
        return <Etiqueta key={txt} x={890 + col * 330} y={235 + lin * 78} texto={txt} tam={38} pad={16} preench={p} hachura="solid" de={s(t)} dur={0.3} />;
      })}
      <Texto x={1000} y={760} tam={48} ancora="middle" destaque={cor.verde} de={s(59.7)} dur={0.9}>
        {"todas em *{tempo constante}"}
      </Texto>
      {/* intervalos iguais */}
      <Linha pts={[[120, 860], [660, 860]]} espessura={3} de={s(62.9)} dur={0.5} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Linha key={i} pts={[[120 + i * 108, 840], [120 + i * 108, 880]]} espessura={3} de={s(63.3) + i * 0.08} dur={0.12} />
      ))}
      <Texto x={390} y={950} tam={36} ancora="middle" de={s(64.0)} dur={1.0}>
        {"mesmo intervalo, fixo\ne pré-determinado"}
      </Texto>
    </NaPagina>
  );
}

function PaginaAtribuicoes() {
  const linhas: [number, string][] = [
    [79.0, "x = 5"],
    [79.6, "y = x + 1"],
    [80.2, "soma = 0"],
  ];
  return (
    <NaPagina p={P.atribuicoes}>
      <Texto x={960} y={115} tam={60} ancora="middle" destaque={cor.azul} de={s(67.3)} dur={1.0}>
        {"o RAM é ótimo para calcular *{complexidade}"}
      </Texto>
      <Check x={1640} y={95} s={46} de={s(68.4)} dur={0.3} />
      {/* análise assintótica */}
      <Seta desde={[150, 640]} para={[150, 270]} cor={cor.cinza} espessura={2.5} de={s(71.3)} dur={0.35} />
      <Seta desde={[150, 640]} para={[640, 640]} cor={cor.cinza} espessura={2.5} de={s(71.4)} dur={0.35} />
      <Curva pts={[[160, 625], [320, 590], [470, 480], [600, 300]]} cor={cor.azul} espessura={4.5} de={s(71.8)} dur={0.7} />
      <Texto x={650} y={680} tam={34} cor={cor.cinza} de={s(71.6)}>
        n
      </Texto>
      <Texto x={395} y={740} tam={44} ancora="middle" de={s(72.1)} dur={0.8}>
        análise assintótica
      </Texto>
      <Texto x={395} y={795} tam={32} cor={cor.cinza} ancora="middle" de={s(72.5)} dur={0.8}>
        (o que acontece quando n cresce)
      </Texto>
      {/* contar atribuições */}
      <Texto x={1150} y={265} tam={46} ancora="middle" destaque={cor.vermelho} de={s(76.7)} dur={1.0}>
        {"objetivo: contar as *{atribuições}"}
      </Texto>
      <Ret x={880} y={320} w={540} h={250} preench="#ffffff" hachura="solid" de={s(77.9)} dur={0.5} />
      {linhas.map(([t, txt], i) => (
        <React.Fragment key={i}>
          <Texto x={930} y={390 + i * 70} tam={44} de={s(t)} dur={0.4}>
            {txt}
          </Texto>
          <Texto x={1370} y={390 + i * 70} tam={44} cor={cor.vermelho} ancora="end" de={s(t) + 0.3}>
            {String(i + 1)}
          </Texto>
        </React.Fragment>
      ))}
      <Texto x={1100} y={660} tam={46} ancora="middle" destaque={cor.verde} de={s(82.4)} dur={0.8}>
        {"= nº de *{acessos à memória}"}
      </Texto>
    </NaPagina>
  );
}

function PaginaHipoteses() {
  return (
    <NaPagina p={P.hipoteses}>
      <Texto x={960} y={115} tam={66} ancora="middle" de={s(89.4)} dur={0.7}>
        hipóteses
      </Texto>
      <Texto x={110} y={235} tam={44} de={s(90.8)} dur={1.4}>
        {"1. cada atribuição leva\n*{tempo constante}"}
      </Texto>
      <Elipse cx={330} cy={425} w={250} h={140} cor={cor.verde} espessura={4} de={s(98.6)} dur={0.5} />
      <Texto x={330} y={448} tam={72} cor={cor.verde} ancora="middle" de={s(98.8)} dur={0.4}>
        O(1)
      </Texto>
      <Texto x={110} y={600} tam={42} de={s(100.6)} dur={2.0}>
        {"2. *{T(n)} = nº de atribuições\npara uma entrada de\ntamanho n"}
      </Texto>
      {/* exemplo */}
      <Texto x={880} y={225} tam={34} cor={cor.cinza} de={s(101.6)}>
        exemplo:
      </Texto>
      <Ret x={860} y={250} w={580} h={300} preench="#ffffff" hachura="solid" de={s(101.6)} dur={0.5} />
      <Texto x={895} y={330} tam={42} de={s(102.0)} dur={0.4}>
        soma = 0
      </Texto>
      <Texto x={895} y={405} tam={42} de={s(102.4)} dur={0.6}>
        para i de 1 até n:
      </Texto>
      <Texto x={945} y={480} tam={42} de={s(102.9)} dur={0.6}>
        soma = soma + v[i]
      </Texto>
      <Texto x={1405} y={330} tam={46} cor={cor.vermelho} ancora="end" de={s(103.4)}>
        1
      </Texto>
      <Texto x={1405} y={405} tam={46} cor={cor.vermelho} ancora="end" de={s(104.5)}>
        n
      </Texto>
      <Texto x={1405} y={480} tam={46} cor={cor.vermelho} ancora="end" de={s(105.0)}>
        n
      </Texto>
      <Marca x={960} y={595} w={340} h={78} de={s(108.4)} dur={0.5} />
      <Texto x={1130} y={650} tam={60} ancora="middle" de={s(108.0)} dur={0.7}>
        T(n) = 2n + 1
      </Texto>
    </NaPagina>
  );
}

export function ModeloRAM() {
  return (
    <>
      <PaginaOperacoes />
      <PaginaPrincipios />
      <PaginaCPU />
      <PaginaAtribuicoes />
      <PaginaHipoteses />
    </>
  );
}
