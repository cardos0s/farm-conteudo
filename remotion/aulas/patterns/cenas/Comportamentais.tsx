import React from "react";
import { Check, Xis } from "../../../lousa/Esboco";
import { Chip, Janela, SetaTracejada, Terminal, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { cor } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { TextoUI } from "../../pix/cenas/comum";
import { Cabecalho, CATEGORIA, CodigoUI } from "../pecas";
import { R } from "../regioes";

// Padrões comportamentais: Strategy, Observer e Chain of Responsibility.

const violeta = CATEGORIA.comportamental.cor;
const fundoVioleta = CATEGORIA.comportamental.fundo;

const ESTRATEGIAS = [
  { titulo: "modelo rápido", linha: "barato · 0,3 s", x: 20, de: 91.4 },
  { titulo: "modelo grande", linha: "preciso · 3 s", x: 380, de: 91.8 },
  { titulo: "modelo local", linha: "privado · sem custo", x: 740, de: 92.2 },
];
/** Tarefas que viajam até a estratégia escolhida. */
const TAREFAS = [
  { texto: "resumir e-mail", para: 0, de: 96.0 },
  { texto: "analisar contrato", para: 1, de: 96.7 },
  { texto: "dados sensíveis", para: 2, de: 97.4 },
];

export function CenaStrategy() {
  const saida = (i: number): [number, number] => [ESTRATEGIAS[i].x + 160, 712];
  return (
    <NaPagina p={R.strategy}>
      <Cabecalho categoria="comportamental" nome="Strategy" de={86.2} deNome={90.0} />
      <Texto x={60} y={262} tam={36} cor={cor.cinza} de={86.6} dur={0.7}>
        comunicação e responsabilidades
      </Texto>
      {["custo", "latência", "complexidade"].map((c, i) => (
        <Chip key={c} x={[330, 540, 760][i]} y={345} texto={c} fundo={fundoVioleta} cor={violeta} tam={26} de={94.6 + i * 0.4} />
      ))}
      <Janela x={240} y={390} w={600} h={150} titulo="escolher_estrategia(tarefa)" status={violeta} de={90.6} ativo={[[96.0, 98]]} corAtivo={violeta}>
        <TextoUI x={30} y={66} tam={24} cor={ui.apagado} de={90.9}>
          decide em tempo de execução
        </TextoUI>
      </Janela>
      {ESTRATEGIAS.map((e, i) => (
        <React.Fragment key={e.titulo}>
          <SetaTracejada desde={[540, 548]} para={saida(i)} via={[(540 + saida(i)[0]) / 2, 600]} cor="#c9c9c2" espessura={3} de={92.0 + i * 0.2} dur={0.4} />
          <Janela x={e.x} y={720} w={320} h={150} titulo={e.titulo} status={violeta} de={e.de} ativo={[[TAREFAS[i].de + 0.6, TAREFAS[i].de + 1.6]]} corAtivo={violeta}>
            <TextoUI x={26} y={64} tam={22} cor={ui.apagado} de={e.de + 0.2}>
              {e.linha}
            </TextoUI>
          </Janela>
        </React.Fragment>
      ))}
      {TAREFAS.map((t) => (
        <SetaTracejada key={t.texto} desde={[540, 548]} para={saida(t.para)} via={[(540 + saida(t.para)[0]) / 2, 600]} cor={violeta} espessura={3} de={t.de} dur={0.3} ate={t.de + 1.4} carga={{ texto: t.texto, de: t.de, dur: 0.7, cor: violeta }} />
      ))}
      <CodigoUI
        x={40}
        y={900}
        w={1000}
        h={140}
        titulo="roteador.py"
        status={violeta}
        de={92.6}
        tam={22}
        linhas={[
          { de: 93.0, txt: "estrategia = escolher_estrategia(tarefa)" },
          { de: 93.8, txt: "resposta = estrategia.executar(tarefa)" },
        ]}
      />
    </NaPagina>
  );
}

const OUVINTES = [
  { titulo: "logs", linha: "[12:01] tarefa concluída", x: 20, chega: 101.9 },
  { titulo: "interface", linha: "✓ resposta exibida", x: 380, chega: 102.5 },
  { titulo: "métricas", linha: "execuções: 128 → 129", x: 740, chega: 103.1 },
];

export function CenaObserver() {
  return (
    <NaPagina p={R.observer}>
      <Cabecalho categoria="comportamental" nome="Observer" de={98.0} deNome={98.2} />
      <Terminal
        x={240}
        y={250}
        w={600}
        h={220}
        titulo="agente"
        status={violeta}
        de={98.6}
        tam={26}
        topo={46}
        ativo={[[99.8, 101.2]]}
        corAtivo={violeta}
        linhas={[
          { de: 99.0, partes: [["❯ ", violeta], ["executar(tarefa)"]] },
          { de: 99.8, gira: true, partes: "⠋ trabalhando…", troca: { t: 101.0, partes: [["✓ concluída", ui.verde]] } },
          { de: 101.2, partes: [["→ notificando 3 observadores", ui.apagado]] },
        ]}
      />
      {OUVINTES.map((o, i) => {
        const cx = o.x + 160;
        return (
          <React.Fragment key={o.titulo}>
            <SetaTracejada desde={[540, 478]} para={[cx, 652]} via={[(540 + cx) / 2, 540]} cor={violeta} espessura={3} de={99.4 + i * 0.2} dur={0.4} carga={{ texto: "evento", de: o.chega - 0.6, dur: 0.6, cor: violeta, fundo: fundoVioleta }} />
            <Janela x={o.x} y={660} w={320} h={170} titulo={o.titulo} status={violeta} de={99.6 + i * 0.2} ativo={[[o.chega, o.chega + 1.0]]} corAtivo={violeta}>
              <TextoUI x={22} y={70} tam={20} mono cor={i === 1 ? ui.verde : ui.texto} de={o.chega}>
                {o.linha}
              </TextoUI>
            </Janela>
          </React.Fragment>
        );
      })}
      <Texto x={540} y={960} tam={38} cor={cor.cinza} ancora="middle" de={104.0} dur={0.7}>
        o agente não precisa saber quem escuta
      </Texto>
    </NaPagina>
  );
}

const HANDLERS = [
  { titulo: "segurança", linha: "injeção de prompt?", x: 20, de: 106.8 },
  { titulo: "validação", linha: "formato ok?", x: 390, de: 107.1 },
  { titulo: "processamento", linha: "chama o modelo", x: 760, de: 107.4 },
];

export function CenaChain() {
  return (
    <NaPagina p={R.chain}>
      <Cabecalho categoria="comportamental" nome="Chain of Responsibility" de={106.0} deNome={106.2} tam={58} />
      {HANDLERS.map((h, i) => (
        <Janela
          key={h.titulo}
          x={h.x}
          y={320}
          w={300}
          h={170}
          titulo={h.titulo}
          status={violeta}
          de={h.de}
          ativo={i === 0 ? [[108.5, 109.1], [112.2, 114.5]] : [[108.9 + i * 0.7, 109.6 + i * 0.7]]}
          corAtivo={i === 0 ? cor.vermelho : ui.verde}
        >
          <TextoUI x={24} y={66} tam={22} cor={ui.apagado} de={h.de + 0.2}>
            {h.linha}
          </TextoUI>
        </Janela>
      ))}
      <SetaTracejada desde={[328, 405]} para={[384, 405]} cor={violeta} espessura={3} de={107.6} dur={0.3} carga={{ texto: "ok", de: 109.0, dur: 0.5, cor: ui.verde }} />
      <SetaTracejada desde={[698, 405]} para={[754, 405]} cor={violeta} espessura={3} de={107.8} dur={0.3} carga={{ texto: "ok", de: 109.7, dur: 0.5, cor: ui.verde }} />

      {/* caminho 1: a requisição passa por todos */}
      <Chip x={170} y={590} texto="requisição" tam={26} de={108.0} />
      <SetaTracejada desde={[170, 562]} para={[170, 498]} cor={violeta} espessura={3} de={108.2} dur={0.3} />
      <Check x={858} y={590} s={40} de={110.4} />
      <Texto x={910} y={600} tam={40} cor={cor.verde} de={110.4} dur={0.4}>
        resposta
      </Texto>

      {/* caminho 2: o prompt malicioso para na segurança */}
      <Chip x={200} y={830} texto="prompt malicioso" fundo="#fff5f5" cor={cor.vermelho} tam={26} de={111.4} />
      <SetaTracejada desde={[90, 800]} para={[70, 498]} via={[40, 650]} cor={cor.vermelho} espessura={3} de={111.6} dur={0.5} />
      <Xis x={170} y={405} s={60} de={112.3} />
      <Texto x={420} y={840} tam={44} cor={cor.vermelho} de={112.5} dur={0.5}>
        interrompida na segurança
      </Texto>
    </NaPagina>
  );
}
