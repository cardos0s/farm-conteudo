import React from "react";
import { Caminho, Check, Elipse, Linha, Ret } from "../../../lousa/Esboco";
import { Chip, Janela, SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { TextoUI } from "../../pix/cenas/comum";
import { PAGA, Status } from "../../pix/pecas";
import { Cabecalho, CATEGORIA, CodigoUI } from "../pecas";
import { R } from "../regioes";

// Padrões criacionais: Singleton, Factory Method e Builder.

const azul = CATEGORIA.criacional.cor;

/** Cadeado simples (thread-safe). (x, y) é o canto de cima à esquerda do corpo. */
function Cadeado({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x + 8} ${y} V${y - 10} a12 12 0 0 1 24 0 V${y}`} stroke={azul} strokeWidth={4} fill="none" />
      <rect x={x} y={y} width={40} height={30} rx={6} fill={azul} />
    </g>
  );
}

export function CenaSingleton() {
  const reqs = [420, 520, 620, 720];
  return (
    <NaPagina p={R.singleton}>
      <Cabecalho categoria="criacional" nome="Singleton" de={29.2} deNome={33.0} />
      <Texto x={60} y={262} tam={38} cor={cor.cinza} de={29.6} dur={0.7}>
        criação e instanciação de objetos
      </Texto>
      {reqs.map((y, i) => (
        <React.Fragment key={y}>
          <Chip x={170} y={y} texto={`requisição ${i + 1}`} tam={24} de={34.0 + i * 0.25} />
          <SetaTracejada desde={[268, y]} para={[552, 570]} via={[430, (y + 570) / 2]} cor={azul} de={34.4 + i * 0.25} dur={0.5} fluxo={[35.6, 42]} />
        </React.Fragment>
      ))}
      <Janela x={560} y={470} w={470} h={210} titulo="ClienteIA" status={azul} de={35.0} ativo={[[35.6, 41.5]]} corAtivo={azul}>
        <Cadeado x={30} y={62} />
        <TextoUI x={92} y={86} tam={28} negrito de={35.3}>
          uma única instância
        </TextoUI>
        <Status x={30} y={140} texto="thread-safe" {...PAGA} tam={26} de={35.8} />
      </Janela>
      <CodigoUI
        x={60}
        y={800}
        w={960}
        h={170}
        titulo="cliente.py"
        status={azul}
        de={36.6}
        linhas={[
          { de: 37.0, txt: "cliente = ClienteIA.instancia()" },
          { de: 38.4, txt: "ClienteIA.instancia() is cliente  # True" },
        ]}
      />
    </NaPagina>
  );
}

const PRODUTOS = [
  { nome: "Claude", x: 40, de: 44.8 },
  { nome: "GPT", x: 390, de: 45.1 },
  { nome: "modelo local", x: 740, de: 45.4 },
];

export function CenaFactory() {
  return (
    <NaPagina p={R.factory}>
      <Cabecalho categoria="criacional" nome="Factory Method" de={42.0} deNome={42.2} tam={70} />
      <Janela x={40} y={250} w={300} h={140} titulo="aplicação" status={ui.apagado} de={42.8}>
        <TextoUI x={28} y={60} tam={22} cor={ui.apagado} de={43.0}>
          precisa de um modelo
        </TextoUI>
      </Janela>
      <SetaTracejada desde={[346, 320]} para={[414, 320]} cor={azul} de={43.3} dur={0.35} />
      <Janela x={420} y={250} w={620} h={140} titulo="FabricaDeModelos" status={azul} de={43.2} ativo={[[44.4, 45.9]]} corAtivo={azul}>
        <TextoUI x={28} y={62} tam={24} mono de={43.5}>
          {"criar(provedor) → Modelo"}
        </TextoUI>
      </Janela>
      <Etiqueta x={540} y={478} texto="interface Modelo" tam={30} preench={claro.cinza} hachura="solid" de={44.2} />
      {PRODUTOS.map((p, i) => (
        <React.Fragment key={p.nome}>
          <SetaTracejada desde={[730, 398]} para={[p.x + 150, 552]} via={[(730 + p.x + 150) / 2, 430]} cor={azul} de={44.5 + i * 0.3} dur={0.45} carga={i === 0 ? { texto: "cria", de: 44.6, dur: 0.6, cor: azul } : undefined} />
          <Janela x={p.x} y={560} w={300} h={150} titulo={p.nome} status={azul} de={p.de}>
            <TextoUI x={28} y={64} tam={22} mono cor={ui.apagado} de={p.de + 0.2}>
              gerar(prompt)
            </TextoUI>
          </Janela>
        </React.Fragment>
      ))}
      <CodigoUI
        x={40}
        y={780}
        w={1000}
        h={170}
        titulo="main.py"
        status={azul}
        de={46.4}
        linhas={[
          { de: 46.8, txt: 'modelo = FabricaDeModelos.criar("claude")' },
          { de: 48.0, txt: "resposta = modelo.gerar(prompt)" },
        ]}
      />
      <Texto x={540} y={1030} tam={36} cor={cor.cinza} ancora="middle" de={48.8} dur={0.6}>
        a aplicação não conhece a classe concreta
      </Texto>
    </NaPagina>
  );
}

/** Linhas do Builder e a peça do agente que cada uma monta. */
const BUILDER = [
  { de: 50.6, txt: "agente = (ConstrutorDeAgente()" },
  { de: 51.4, txt: '    .modelo("claude")' },
  { de: 52.2, txt: "    .ferramentas([busca, calculadora])" },
  { de: 53.0, txt: '    .instrucoes("Você é um analista...")' },
  { de: 53.8, txt: "    .memoria(janela=20)" },
  { de: 54.6, txt: '    .seguranca(politica="estrita")' },
  { de: 55.6, txt: "    .construir())" },
];

export function CenaBuilder() {
  const cx = 540;
  return (
    <NaPagina p={R.builder}>
      <Cabecalho categoria="criacional" nome="Builder" de={50.0} deNome={50.2} />
      <CodigoUI x={40} y={220} w={1000} h={390} titulo="agente.py" status={azul} de={50.3} tam={25} linhas={BUILDER} />
      {/* o agente sendo montado */}
      <Ret x={cx - 80} y={670} w={160} h={115} preench={claro.azul} hachura="solid" espessura={3.4} de={51.5} dur={0.4} />
      <Elipse cx={cx - 35} cy={725} w={24} h={24} preench={cor.tinta} hachura="solid" espessura={2} de={51.8} dur={0.15} />
      <Elipse cx={cx + 35} cy={725} w={24} h={24} preench={cor.tinta} hachura="solid" espessura={2} de={51.9} dur={0.15} />
      <Chip x={300} y={705} texto="modelo" fundo="#e7f5ff" cor={azul} tam={26} de={51.6} />
      <Ret x={cx - 115} y={800} w={230} h={190} preench={claro.cinza} hachura="hachure" vaoHachura={14} espessura={3.4} de={52.3} dur={0.45} />
      <Linha pts={[[cx - 115, 840], [cx - 190, 920]]} espessura={4} de={52.5} dur={0.2} />
      <Linha pts={[[cx + 115, 840], [cx + 190, 920]]} espessura={4} de={52.6} dur={0.2} />
      <Chip x={800} y={705} texto="ferramentas" fundo="#e7f5ff" cor={azul} tam={26} de={52.4} />
      <Chip x={250} y={850} texto="instruções" fundo="#e7f5ff" cor={azul} tam={26} de={53.1} />
      <Chip x={835} y={850} texto="memória" fundo="#e7f5ff" cor={azul} tam={26} de={53.9} />
      {/* escudo no peito: segurança */}
      <Caminho d={`M${cx} 845 L${cx + 42} 860 L${cx + 36} 915 Q${cx} 950 ${cx} 950 Q${cx} 950 ${cx - 36} 915 L${cx - 42} 860 Z`} cor={cor.verde} preench={claro.verde} hachura="solid" espessura={3.4} de={54.7} dur={0.4} />
      <Chip x={265} y={990} texto="segurança" fundo="#ebfbee" cor={cor.verde} tam={26} de={54.7} />
      {/* antena: pronto */}
      <Linha pts={[[cx, 670], [cx, 635]]} espessura={4} de={55.7} dur={0.15} />
      <Elipse cx={cx} cy={626} w={20} h={20} preench={cor.vermelho} hachura="solid" espessura={2} de={55.8} dur={0.15} />
      <Check x={760} y={995} s={44} de={55.9} />
      <Texto x={820} y={1005} tam={44} cor={cor.verde} de={56.0} dur={0.4}>
        pronto
      </Texto>
    </NaPagina>
  );
}
