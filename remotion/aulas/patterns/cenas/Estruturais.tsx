import React from "react";
import { Ret } from "../../../lousa/Esboco";
import { Chip, Janela, SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { TextoUI } from "../../pix/cenas/comum";
import { Cabecalho, CATEGORIA, CodigoUI } from "../pecas";
import { R } from "../regioes";

// Padrões estruturais: Adapter, Decorator e Facade.

const verde = CATEGORIA.estrutural.cor;

const PROVEDORES = [
  { titulo: "provedor A", api: "messages.create(...)", x: 20, de: 62.6 },
  { titulo: "provedor B", api: "chat.completions(...)", x: 380, de: 63.0 },
  { titulo: "provedor C", api: "generate_content(...)", x: 740, de: 63.4 },
];

export function CenaAdapter() {
  return (
    <NaPagina p={R.adapter}>
      <Cabecalho categoria="estrutural" nome="Adapter" de={58.2} deNome={62.0} />
      <Texto x={60} y={262} tam={36} cor={cor.cinza} de={58.6} dur={0.7}>
        composição e integração entre componentes
      </Texto>
      {PROVEDORES.map((p, i) => {
        const cx = p.x + 160;
        return (
          <React.Fragment key={p.titulo}>
            <Janela x={p.x} y={310} w={320} h={150} titulo={p.titulo} status={ui.apagado} de={p.de}>
              <TextoUI x={22} y={62} tam={19} mono cor={[cor.vermelho, cor.laranja, cor.violeta][i]} de={p.de + 0.2}>
                {p.api}
              </TextoUI>
            </Janela>
            <SetaTracejada desde={[cx, 468]} para={[cx, 540]} cor={verde} de={64.0 + i * 0.2} dur={0.3} />
            <Etiqueta x={cx} y={575} texto={`Adapter${"ABC"[i]}`} tam={28} preench={claro.verde} hachura="solid" cor={verde} de={64.2 + i * 0.2} />
            <SetaTracejada desde={[cx, 612]} para={[540, 692]} via={[(cx + 540) / 2, 640]} cor={verde} de={65.0 + i * 0.15} dur={0.4} fluxo={[66.0, 71]} />
          </React.Fragment>
        );
      })}
      <Janela x={220} y={700} w={640} h={150} titulo="interface Modelo" status={verde} de={65.4} ativo={[[66.0, 70.5]]} corAtivo={verde}>
        <TextoUI x={30} y={64} tam={26} mono de={65.7}>
          {"gerar(prompt) → texto"}
        </TextoUI>
      </Janela>
      <SetaTracejada desde={[540, 858]} para={[540, 925]} cor={verde} de={66.7} dur={0.3} />
      <Chip x={540} y={960} texto="sua aplicação" tam={28} de={66.9} />
      <Texto x={540} y={1050} tam={34} cor={cor.cinza} ancora="middle" de={67.6} dur={0.6}>
        troca o modelo sem mexer no resto
      </Texto>
    </NaPagina>
  );
}

/** Camadas do Decorator, de dentro para fora, na ordem em que são faladas. */
const CAMADAS = [
  { nome: "observabilidade", cor: cor.azul, m: 60, de: 72.4 },
  { nome: "cache", cor: cor.verde, m: 120, de: 73.3 },
  { nome: "contagem de tokens", cor: cor.laranja, m: 180, de: 74.2 },
  { nome: "validação", cor: cor.violeta, m: 240, de: 75.1 },
];

export function CenaDecorator() {
  const nucleo = { x: 390, y: 500, w: 300, h: 120 };
  return (
    <NaPagina p={R.decorator}>
      <Cabecalho categoria="estrutural" nome="Decorator" de={71.0} deNome={71.2} />
      <Ret {...nucleo} preench={claro.cinza} hachura="solid" espessura={3.4} de={71.6} dur={0.4} />
      <Texto x={540} y={572} tam={34} ancora="middle" de={71.8} dur={0.4}>
        modelo.gerar()
      </Texto>
      {CAMADAS.map((c) => (
        <React.Fragment key={c.nome}>
          <Ret x={nucleo.x - c.m} y={nucleo.y - c.m} w={nucleo.w + 2 * c.m} h={nucleo.h + 2 * c.m} cor={c.cor} espessura={3.6} de={c.de} dur={0.5} />
          <Texto x={nucleo.x - c.m + 20} y={nucleo.y - c.m + 38} tam={26} cor={c.cor} de={c.de + 0.2} dur={0.4}>
            {c.nome}
          </Texto>
        </React.Fragment>
      ))}
      <CodigoUI
        x={40}
        y={900}
        w={1000}
        h={130}
        titulo="decoradores.py"
        status={verde}
        de={75.8}
        tam={22}
        linhas={[{ de: 76.1, txt: "modelo = Validacao(Tokens(Cache(Observavel(Claude()))))" }]}
      />
    </NaPagina>
  );
}

/** A complexidade escondida: agentes, memória e ferramentas ligados entre si. */
const PARTES_MULTIAGENTE = [
  { nome: "planejador", x: 30, y: 250 },
  { nome: "pesquisador", x: 290, y: 225 },
  { nome: "redator", x: 560, y: 250 },
  { nome: "revisor", x: 830, y: 225 },
  { nome: "memória", x: 160, y: 395 },
  { nome: "ferramentas", x: 690, y: 395 },
];
const LIGACOES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [1, 5],
  [3, 5],
  [4, 2],
  [5, 0],
];

export function CenaFacade() {
  const centro = (i: number): [number, number] => [PARTES_MULTIAGENTE[i].x + 100, PARTES_MULTIAGENTE[i].y + 45];
  return (
    <NaPagina p={R.facade}>
      <Cabecalho categoria="estrutural" nome="Facade" de={78.0} deNome={78.2} />
      {LIGACOES.map(([a, b], i) => (
        <SetaTracejada key={i} desde={centro(a)} para={centro(b)} via={[(centro(a)[0] + centro(b)[0]) / 2, (centro(a)[1] + centro(b)[1]) / 2 + (i % 2 ? 40 : -40)]} cor="#c9c9c2" espessura={3} ponta={12} de={79.3 + i * 0.12} dur={0.4} fluxo={[80.5, 86]} />
      ))}
      {PARTES_MULTIAGENTE.map((p, i) => (
        <Janela key={p.nome} x={p.x} y={p.y} w={200} h={90} titulo={p.nome} status={ui.apagado} de={78.8 + i * 0.15} />
      ))}
      <Janela x={140} y={570} w={800} h={190} titulo="Assistente" status={verde} chip={{ texto: "fachada", fundo: "#ebfbee", cor: verde, de: 81.8 }} de={81.6} ativo={[[83.4, 86]]} corAtivo={verde}>
        <TextoUI x={30} y={72} tam={30} mono de={81.9}>
          assistente.responder(pergunta)
        </TextoUI>
        <TextoUI x={30} y={120} tam={22} cor={ui.apagado} de={82.3}>
          uma chamada só; o resto fica por trás
        </TextoUI>
      </Janela>
      <SetaTracejada desde={[540, 562]} para={[540, 500]} cor={verde} de={82.4} dur={0.3} fluxo={[82.8, 86]} />
      <Chip x={540} y={900} texto="aplicação" tam={28} de={83.0} />
      <SetaTracejada desde={[540, 870]} para={[540, 768]} cor={verde} de={83.2} dur={0.35} carga={{ texto: "pergunta", de: 83.3, dur: 0.6, cor: verde }} />
      <Texto x={540} y={1020} tam={40} cor={cor.cinza} ancora="middle" de={84.0} dur={0.6}>
        esconde a complexidade
      </Texto>
    </NaPagina>
  );
}
