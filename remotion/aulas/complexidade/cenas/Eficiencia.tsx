import React from "react";
import { Caminho, Check, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Capitulo, Etiqueta, Marca } from "../../../lousa/Pecas";
import { largura, Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S } from "../roteiro";

const s = (t: number) => S("3229", t);

export { Capitulo };

function PaginaEficiencia() {
  return (
    <NaPagina p={P.eficiencia}>
      <Capitulo n={1} titulo="eficiência" de={S("3227", 126.6)} />
      {/* cartão de título enquanto a câmera vai para o canto */}
      <Texto x={960} y={430} tam={46} cor={cor.cinza} ancora="middle" de={S("3227", 126.5)} dur={0.4} ate={s(1.3)}>
        capítulo 1
      </Texto>
      <Texto x={960} y={560} tam={104} ancora="middle" destaque={cor.azul} de={S("3227", 126.7)} dur={0.8} ate={s(1.3)}>
        {"*{eficiência} de algoritmos"}
      </Texto>
      <Linha pts={[[470, 600], [960, 594], [1450, 604]]} cor={cor.azul} espessura={5} de={S("3227", 127.5)} dur={0.4} ate={s(1.3)} />
      <Texto x={960} y={190} tam={42} cor={cor.cinza} ancora="middle" de={s(1.5)} dur={1.0}>
        uma das perguntas mais famosas da computação:
      </Texto>
      <Texto x={960} y={300} tam={76} ancora="middle" de={s(4.2)} dur={1.2}>
        {"Como medir a *{eficiência}\nde um algoritmo?"}
      </Texto>
      <Caixa x={380} y={520} w={320} h={180} texto="A1" tam={84} preench={claro.azul} de={s(9.5)} dur={0.5} />
      <Caixa x={1080} y={520} w={320} h={180} texto="A2" tam={84} preench={claro.verde} de={s(10.1)} dur={0.5} />
      <Texto x={890} y={630} tam={60} cor={cor.cinza} ancora="middle" de={s(10.3)}>
        vs
      </Texto>
      <Texto x={890} y={830} tam={62} cor={cor.laranja} ancora="middle" de={s(11.6)} dur={0.9}>
        qual é mais eficiente?
      </Texto>
    </NaPagina>
  );
}

function Relogio({ cx, cy, r, de }: { cx: number; cy: number; r: number; de: number }) {
  return (
    <>
      <Ret x={cx - 32} y={cy - r - 52} w={64} h={40} de={de} dur={0.3} />
      <Linha pts={[[cx, cy - r - 12], [cx, cy - r]]} de={de + 0.2} dur={0.15} />
      <Elipse cx={cx} cy={cy} w={r * 2} h={r * 2} preench={claro.cinza} de={de + 0.1} dur={0.7} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return (
          <Linha
            key={i}
            pts={[
              [cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78],
              [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92],
            ]}
            de={de + 0.5 + i * 0.05}
            dur={0.15}
          />
        );
      })}
      <Seta desde={[cx, cy]} para={[cx, cy - r * 0.68]} ponta={16} de={de + 0.6} dur={0.3} />
      <Seta desde={[cx, cy]} para={[cx + r * 0.45, cy + r * 0.25]} ponta={16} de={de + 0.75} dur={0.3} />
    </>
  );
}

function PaginaQuantidades() {
  return (
    <NaPagina p={P.quantidades}>
      <Texto x={960} y={115} tam={64} ancora="middle" de={s(14.4)} dur={1.0}>
        {"duas quantidades"}
      </Texto>
      {/* tempo */}
      <Relogio cx={250} cy={300} r={70} de={s(22.0)} />
      <Caixa x={360} y={225} w={480} h={150} texto={"tempo de\nexecução"} tam={48} preench={claro.azul} de={s(22.3)} dur={0.5} />
      <Seta desde={[600, 390]} para={[600, 460]} de={s(26.4)} dur={0.35} />
      <Texto x={600} y={520} tam={50} ancora="middle" destaque={cor.azul} de={s(27.9)} dur={0.9}>
        {"complexidade de *{tempo}"}
      </Texto>
      <Marca x={410} y={612} w={330} h={110} de={s(51.6)} dur={0.5} />
      <Elipse cx={330} cy={650} w={70} h={70} de={s(50.0)} dur={0.35} />
      <Linha pts={[[355, 675], [392, 712]]} espessura={5} de={s(50.2)} dur={0.2} />
      <Texto x={420} y={650} tam={42} de={s(50.0)} dur={1.2}>
        {"análise formal\ne aprofundada"}
      </Texto>
      {/* espaço */}
      <Caixa x={1000} y={225} w={480} h={150} texto={"memória\nutilizada"} tam={48} preench={claro.verde} de={s(23.8)} dur={0.5} />
      <Seta desde={[1240, 390]} para={[1240, 460]} de={s(30.6)} dur={0.35} />
      <Texto x={1240} y={520} tam={50} ancora="middle" destaque={cor.verde} de={s(32.4)} dur={0.9}>
        {"complexidade de *{espaço}"}
      </Texto>
      <Texto x={1240} y={640} tam={42} ancora="middle" de={s(42.5)} dur={1.0}>
        {"depende das\nvariáveis alocadas"}
      </Texto>
      <Check x={1010} y={815} s={46} de={s(45.0)} dur={0.3} />
      <Texto x={1075} y={830} tam={42} cor={cor.verde} de={s(45.0)} dur={0.8}>
        simples de medir
      </Texto>
    </NaPagina>
  );
}

function PaginaCronometro() {
  const tags: [number, number, number, string, string][] = [
    [65.0, 1080, 330, "tempo de máquina", claro.amarelo],
    [65.8, 1250, 440, "hardware", claro.azul],
    [66.9, 1070, 550, "internet", claro.verde],
    [67.7, 1240, 660, "latência", claro.violeta],
  ];
  return (
    <NaPagina p={P.cronometro}>
      <Texto x={960} y={120} tam={66} ancora="middle" de={s(58.1)} dur={1.0}>
        {"por que não só *{cronometrar}?"}
      </Texto>
      <Relogio cx={520} cy={560} r={200} de={s(58.6)} />
      <Texto x={1170} y={250} tam={38} cor={cor.cinza} ancora="middle" de={s(62.2)} dur={0.9}>
        o tempo medido muda com:
      </Texto>
      {tags.map(([t, x, y, txt, p]) => (
        <Etiqueta key={txt} x={x} y={y} texto={txt} tam={42} preench={p} de={s(t)} dur={0.45} />
      ))}
      <Xis x={520} y={560} s={330} espessura={10} de={s(70.8)} dur={0.5} />
      <Texto x={520} y={880} tam={58} cor={cor.vermelho} ancora="middle" de={s(69.2)} dur={0.8}>
        não é eficaz
      </Texto>
    </NaPagina>
  );
}

function PaginaFatores() {
  return (
    <NaPagina p={P.fatores}>
      <Marca x={960 - largura("o tempo depende de fatores externos", 60) / 2 + largura("o tempo depende de ", 60)} y={68} w={largura("fatores externos", 60)} h={64} cor={claro.vermelho} de={s(98.6)} dur={0.6} />
      <Texto x={960} y={115} tam={60} ancora="middle" destaque={cor.vermelho} de={s(74.3)} dur={1.4}>
        {"o tempo depende de *{fatores externos}"}
      </Texto>
      {/* hardware */}
      <Caixa x={120} y={250} w={440} h={130} texto="hardware" tam={50} preench={claro.azul} de={s(81.0)} dur={0.5} />
      <Ret x={260} y={450} w={160} h={160} preench={claro.cinza} de={s(82.6)} dur={0.5} />
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Linha pts={[[295 + i * 45, 450], [295 + i * 45, 420]]} espessura={2.5} de={s(82.9) + i * 0.04} dur={0.12} />
          <Linha pts={[[295 + i * 45, 610], [295 + i * 45, 640]]} espessura={2.5} de={s(83.0) + i * 0.04} dur={0.12} />
          <Linha pts={[[260, 485 + i * 45], [230, 485 + i * 45]]} espessura={2.5} de={s(83.1) + i * 0.04} dur={0.12} />
          <Linha pts={[[420, 485 + i * 45], [450, 485 + i * 45]]} espessura={2.5} de={s(83.2) + i * 0.04} dur={0.12} />
        </React.Fragment>
      ))}
      <Texto x={340} y={705} tam={40} ancora="middle" de={s(82.7)}>
        processador
      </Texto>
      {/* linguagem */}
      <Caixa x={760} y={235} w={560} h={150} texto={"linguagem de\nprogramação"} tam={46} preench={claro.amarelo} de={s(84.6)} dur={0.5} />
      <Caixa x={1080} y={470} w={250} h={100} texto="alto nível" tam={38} preench={claro.vermelho} de={s(93.5)} dur={0.4} />
      <Caixa x={790} y={690} w={250} h={100} texto="baixo nível" tam={38} preench={claro.verde} de={s(92.6)} dur={0.4} />
      <Caixa x={760} y={900} w={600} h={110} texto="máquina" tam={46} preench={claro.cinza} de={s(91.3)} dur={0.5} />
      <Seta desde={[915, 795]} para={[915, 892]} cor={cor.verde} espessura={4} de={s(94.9)} dur={0.35} />
      <Seta desde={[1205, 575]} para={[1205, 892]} cor={cor.vermelho} espessura={4} de={s(93.8)} dur={0.5} />
      <Caminho d="M1062 612 L1040 650 L1060 650 L1036 694" cor={cor.laranja} espessura={4} de={s(95.6)} dur={0.3} />
      <Texto x={915} y={655} tam={38} cor={cor.verde} ancora="middle" de={s(95.6)} dur={0.5}>
        mais rápido!
      </Texto>
      <Texto x={560} y={840} tam={36} cor={cor.verde} ancora="middle" de={s(96.6)} dur={0.8}>
        {"fala direto\ncom a máquina"}
      </Texto>
      <Seta desde={[660, 845]} para={[780, 790]} via={[730, 840]} cor={cor.verde} ponta={16} de={s(97.2)} dur={0.35} />
    </NaPagina>
  );
}

export function Eficiencia() {
  return (
    <>
      <PaginaEficiencia />
      <PaginaQuantidades />
      <PaginaCronometro />
      <PaginaFatores />
    </>
  );
}
