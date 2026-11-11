import React from "react";
import { Check, Linha, Seta, Xis } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta, Marca } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Balao, Boneco, Envelope, Lupa, Papel, Robo } from "./desenhos";

// Parte 1 (continuação): o que é um agente, o experimento da nota, subjetiva × estruturada e o Enem.

function AgenteDef() {
  return (
    <NaPagina p={P.agenteDef}>
      <Texto x={960} y={115} tam={64} ancora="middle" de={F("ag1")} dur={0.8}>
        {"e o que é um *{agente}?"}
      </Texto>
      <Etiqueta x={260} y={320} texto="LLM" tam={60} preench={claro.violeta} de={W("ag2", "LLM")} />
      <Texto x={440} y={340} tam={70} ancora="middle" de={W("ag2", "tarefa") - 0.2}>
        +
      </Texto>
      <Etiqueta x={640} y={320} texto="tarefa" tam={60} preench={claro.amarelo} de={W("ag2", "tarefa")} />
      <Texto x={850} y={340} tam={70} ancora="middle" de={W("ag2", "ferramentas") - 0.2}>
        +
      </Texto>
      <Etiqueta x={1110} y={320} texto="ferramentas" tam={60} preench={claro.azul} de={W("ag2", "ferramentas")} />
      <Texto x={1380} y={340} tam={70} ancora="middle" de={FIM_DE("ag2") - 0.2}>
        =
      </Texto>
      <Robo x={1600} y={300} s={170} de={FIM_DE("ag2")} />
      <Texto x={1600} y={500} tam={40} ancora="middle" de={FIM_DE("ag2") + 0.4}>
        agente
      </Texto>
      {/* ferramentas */}
      <Papel x={920} y={430} w={90} h={115} linhas={3} de={W("ag3", "arquivos")} />
      <Lupa x={1100} y={480} s={70} de={W("ag3", "buscar")} />
      <Envelope x={1210} y={445} w={130} h={85} de={W("ag3", "e-mail")} />
      <Texto x={1600} y={560} tam={36} cor={cor.verde} ancora="middle" de={W("ag3", "executa")}>
        executa um trabalho
      </Texto>

      {/* o nosso agente */}
      <Texto x={130} y={680} tam={40} cor={cor.cinza} de={F("ag4")}>
        o nosso:
      </Texto>
      <Papel x={130} y={710} w={150} h={190} linhas={5} de={F("ag4") + 0.2} />
      <Seta desde={[300, 805]} para={[400, 805]} de={W("ag4", "devolve")} dur={0.35} />
      <Papel x={420} y={700} w={190} h={210} linhas={3} titulo="Resumo" corLinhas={cor.azul} de={W("ag4", "devolve") + 0.2} />
      <Texto x={370} y={960} tam={32} cor={cor.cinza} ancora="middle" de={W("ag4", "próximas")}>
        + próximas ações
      </Texto>

      {/* o estrago */}
      <Texto x={960} y={680} tam={44} cor={cor.vermelho} de={F("ag5")}>
        o estrago:
      </Texto>
      <Caixa x={960} y={720} w={420} h={160} texto={"proposta:\n*{15%} de desconto"} tam={42} preench={claro.vermelho} de={W("ag6", "proposta")} />
      <Seta desde={[1400, 800]} para={[1530, 800]} de={W("ag6", "cliente")} dur={0.35} />
      <Boneco x={1620} y={730} s={56} roupa={claro.verde} de={W("ag6", "cliente")} />
      <Texto x={1170} y={940} tam={34} cor={cor.cinza} ancora="middle" de={W("ag6", "ofereceu dez")}>
        (ela ofereceu 10%)
      </Texto>
      <Texto x={1300} y={1030} tam={44} cor={cor.vermelho} ancora="middle" de={F("ag7")} dur={1.0}>
        {"5 pontos de erro, num texto *{bem escrito}"}
      </Texto>
    </NaPagina>
  );
}

const RESUMO_INCOMPLETO =
  "Roberto tem três padarias e controla o estoque\nem planilha. Marina apresentou o sistema, que\nmostra o estoque das lojas num painel só. O plano\npara até cinco lojas custa R$ 890 por mês.\n\nPróximas ações:\n1. Marina envia a proposta por e-mail.";

function Nota() {
  return (
    <NaPagina p={P.nota}>
      <Texto x={960} y={105} tam={58} ancora="middle" de={F("nt1")}>
        {"um *{experimento}"}
      </Texto>
      <Texto x={110} y={190} tam={34} cor={cor.cinza} de={F("nt2")}>
        resumo escrito pelo agente:
      </Texto>
      <Papel x={100} y={215} w={900} h={420} linhas={0} de={F("nt2")} />
      <Marca x={135} y={520} w={600} h={48} de={W("nt6", "só cita uma")} />
      <Texto x={140} y={285} tam={34} de={F("nt2") + 0.4} dur={1.6} alturaLinha={1.32}>
        {RESUMO_INCOMPLETO}
      </Texto>

      <Texto x={1450} y={430} tam={190} cor={cor.laranja} ancora="middle" de={W("nt3", "nota")} ate={F("nt5")}>
        ?/10
      </Texto>
      <Texto x={1450} y={530} tam={40} ancora="middle" de={W("nt3", "Pausa")} ate={F("nt5")}>
        pausa o vídeo e dê uma nota
      </Texto>

      {/* a mesma pessoa, dois critérios */}
      <Boneco x={1450} y={250} s={60} roupa={claro.amarelo} de={F("nt4") + 0.6} />
      <Texto x={1450} y={490} tam={34} cor={cor.cinza} ancora="middle" de={F("nt4") + 0.8}>
        eu
      </Texto>
      <Etiqueta x={500} y={735} texto={"critério: texto claro,\nsem erro"} tam={38} preench={claro.azul} de={W("nt5", "olhar")} />
      <Seta desde={[500, 800]} para={[500, 860]} de={W("nt5", "sete") - 0.3} dur={0.3} />
      <Texto x={500} y={990} tam={130} cor={cor.verde} ancora="middle" de={W("nt5", "sete")} dur={0.3}>
        7
      </Texto>
      <Etiqueta x={1420} y={735} texto={"critério: pegou as\n3 tarefas?"} tam={38} preench={claro.amarelo} de={W("nt6", "lembrar")} />
      <Seta desde={[1420, 800]} para={[1420, 860]} de={W("nt6", "quatro") - 0.3} dur={0.3} />
      <Texto x={1420} y={990} tam={130} cor={cor.vermelho} ancora="middle" de={W("nt6", "quatro")} dur={0.3}>
        4
      </Texto>
      <Texto x={960} y={920} tam={44} ancora="middle" de={F("nt7")} dur={1.0}>
        {"mesmo resumo\nmesma pessoa"}
      </Texto>
      <Texto x={960} y={1050} tam={40} cor={cor.vermelho} ancora="middle" de={W("nt8", "critério não")}>
        o critério não estava escrito
      </Texto>
    </NaPagina>
  );
}

function LlmNota() {
  const notas = ["7", "8", "6"];
  return (
    <NaPagina p={P.llmNota}>
      <Texto x={960} y={110} tam={56} ancora="middle" de={F("ln1")} dur={1.0}>
        {"e se quem dá a nota for um *{LLM}?"}
      </Texto>
      {notas.map((n, i) => (
        <React.Fragment key={i}>
          <Robo x={420 + i * 540} y={420} s={150} preench={[claro.azul, claro.violeta, claro.verde][i]} de={F("ln3") + i * 0.25} />
          <Balao x={470 + i * 540} y={180} texto={`nota: ${n}`} tam={46} ponta={[440 + i * 540, 330]} de={W("ln3", "notas diferentes") + i * 0.2} />
        </React.Fragment>
      ))}
      <Texto x={960} y={650} tam={30} cor={cor.cinza} ancora="middle" de={W("ln3", "notas diferentes") + 0.8}>
        (ilustrativo)
      </Texto>
      <Texto x={960} y={710} tam={40} cor={cor.laranja} ancora="middle" de={W("ln3", "critério")}>
        o critério é implícito
      </Texto>

      <Texto x={560} y={990} tam={200} ancora="middle" de={W("ln4", "sete")} dur={0.3}>
        7
      </Texto>
      <Lupa x={340} y={870} s={110} de={W("ln4", "auditar")} />
      <Texto x={760} y={880} tam={60} cor={cor.vermelho} de={W("ln5", "Sete por quê")}>
        por quê?
      </Texto>
      <Texto x={760} y={970} tam={52} cor={cor.vermelho} de={W("ln5", "tirou")}>
        o que tirou os 3 pontos?
      </Texto>
    </NaPagina>
  );
}

function Subjetiva() {
  const esq: [string, string][] = [
    ["critérios implícitos", "implícitos"],
    ["difícil de auditar", "auditar"],
    ["pouco comparável", "comparar"],
  ];
  const dir: [string, string][] = [
    ["checks verificáveis", "verificáveis"],
    ["rastreável: cada decisão tem prova", "rastreável"],
    ["cálculo reproduzível", "reproduzível"],
  ];
  return (
    <NaPagina p={P.subjetiva}>
      <Texto x={960} y={100} tam={54} ancora="middle" de={F("sb1")}>
        dois jeitos de avaliar
      </Texto>
      <Linha pts={[[960, 170], [962, 1000]]} cor={cor.cinza} espessura={2.5} de={F("sb1") + 0.5} dur={0.5} />
      <Caixa x={110} y={170} w={760} h={120} texto="avaliação subjetiva" tam={52} preench={claro.vermelho} de={F("sb2")} />
      <Texto x={490} y={370} tam={40} ancora="middle" de={W("sb2", "dê uma nota")}>
        "dê uma nota de 0 a 10"
      </Texto>
      {esq.map(([txt, p], i) => (
        <React.Fragment key={txt}>
          <Xis x={160} y={470 + i * 95} s={34} de={W("sb3", p)} />
          <Texto x={210} y={484 + i * 95} tam={42} de={W("sb3", p)}>
            {txt}
          </Texto>
        </React.Fragment>
      ))}
      <Caixa x={1050} y={170} w={760} h={120} texto="avaliação estruturada" tam={52} preench={claro.verde} de={F("sb4")} />
      <Texto x={1430} y={370} tam={36} ancora="middle" de={W("sb4", "verifique")}>
        "verifique cada requisito e mostre a prova"
      </Texto>
      {dir.map(([txt, p], i) => (
        <React.Fragment key={txt}>
          <Check x={1080} y={478 + i * 95} s={36} de={W("sb5", p)} />
          <Texto x={1140} y={484 + i * 95} tam={42} de={W("sb5", p)}>
            {txt}
          </Texto>
        </React.Fragment>
      ))}
      <Etiqueta x={490} y={880} texto="opinião" tam={70} preench={claro.cinza} hachura="solid" de={W("sb6", "opinião")} />
      <Etiqueta x={1430} y={880} texto="verificação" tam={70} preench={claro.amarelo} de={W("sb6", "verificação")} />
    </NaPagina>
  );
}

function Enem() {
  const t3 = W("en3", "terceiro");
  return (
    <NaPagina p={P.enem}>
      <Texto x={960} y={100} tam={56} ancora="middle" de={F("en1")}>
        {"a redação do *{Enem}"}
      </Texto>
      <Papel x={100} y={170} w={330} h={430} linhas={8} titulo="Redação" de={F("en1") + 0.4} />
      <Texto x={500} y={210} tam={36} cor={cor.cinza} de={W("en2", "grade")}>
        grade de competências
      </Texto>
      {[1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          <Caixa x={500} y={235 + (i - 1) * 74} w={330} h={62} texto={`competência ${i}`} tam={32} preench={claro.azul} de={W("en2", "grade") + i * 0.15} dur={0.3} atrasoTexto={0.1} />
        </React.Fragment>
      ))}
      <Texto x={665} y={640} tam={32} cor={cor.verde} ancora="middle" de={W("en2", "critérios escritos")}>
        cada uma com critérios escritos
      </Texto>

      {/* corretores */}
      <Boneco x={1080} y={230} s={58} roupa={claro.verde} de={W("en3", "dois corretores")} />
      <Boneco x={1380} y={230} s={58} roupa={claro.violeta} de={W("en3", "dois corretores") + 0.2} />
      <Texto x={1080} y={470} tam={30} ancora="middle" de={W("en3", "dois corretores") + 0.3}>
        corretor 1
      </Texto>
      <Texto x={1380} y={470} tam={30} ancora="middle" de={W("en3", "dois corretores") + 0.5}>
        corretor 2
      </Texto>
      <Seta desde={[1120, 520]} para={[1340, 520]} dupla cor={cor.vermelho} de={W("en3", "distantes")} dur={0.4} />
      <Texto x={1230} y={570} tam={30} cor={cor.vermelho} ancora="middle" de={W("en3", "distantes")}>
        muito distantes?
      </Texto>
      <Boneco x={1720} y={230} s={58} roupa={claro.amarelo} de={t3} />
      <Texto x={1720} y={470} tam={30} ancora="middle" de={t3 + 0.3}>
        corretor 3
      </Texto>
      <Seta desde={[1470, 380]} para={[1640, 380]} de={t3} dur={0.35} />

      <Texto x={1400} y={680} tam={38} ancora="middle" de={W("en4", "discordar")} dur={1.0}>
        {"humanos *{discordam}: o Enem mede e resolve"}
      </Texto>
      <Texto x={1400} y={750} tam={38} cor={cor.verde} ancora="middle" de={F("en5")} dur={1.0}>
        é o que vamos construir para o juiz de IA
      </Texto>
      <Caixa x={160} y={850} w={1600} h={170} texto={'não pergunte "está bom?"\npergunte "cumpre isto?" e peça a *{prova}'} tam={50} preench={claro.amarelo} de={F("en6")} dur={0.7} />
    </NaPagina>
  );
}

export function Problema() {
  return (
    <>
      <AgenteDef />
      <Nota />
      <LlmNota />
      <Subjetiva />
      <Enem />
    </>
  );
}
