import React from "react";
import { Check, Curva, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Balao, Boneco, Brilho, Celular, Martelo, Papel, Robo } from "./desenhos";

// 00:00–01:13 · abertura, o agente de resumos, a pergunta e o que a aula entrega.

function Abertura() {
  return (
    <NaPagina p={P.abertura}>
      <Etiqueta x={960} y={250} texto="aula 2" tam={44} preench={claro.amarelo} hachura="solid" de={0.2} dur={0.4} />
      <Texto x={960} y={470} tam={140} ancora="middle" de={0.5} dur={1.1}>
        LLM as a Judge
      </Texto>
      <Linha pts={[[520, 512], [960, 506], [1400, 516]]} cor={cor.azul} espessura={5} de={1.5} dur={0.4} />
      <Texto x={960} y={590} tam={46} cor={cor.cinza} ancora="middle" de={W("a2", "juiz")}>
        (LLM como juiz)
      </Texto>
      <Texto x={960} y={700} tam={58} ancora="middle" de={F("a3")} dur={1.8}>
        {"como avaliar agentes de IA com *{evidências} e *{métricas}"}
      </Texto>
      <Martelo x={250} y={830} s={0.8} de={F("a2")} />
      {/* checklist no canto */}
      <Ret x={1510} y={790} w={290} h={220} preench="#ffffff" hachura="solid" de={F("a3", 0.3)} dur={0.5} />
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Ret x={1540} y={815 + i * 64} w={40} h={40} redondo={false} espessura={2.5} de={F("a3", 0.4) + i * 0.15} dur={0.2} />
          <Linha pts={[[1600, 838 + i * 64], [1760 - i * 30, 838 + i * 64]]} cor={cor.cinza} espessura={3} de={F("a3", 0.45) + i * 0.15} dur={0.2} />
        </React.Fragment>
      ))}
      <Check x={1544} y={835} s={34} de={F("a3", 0.7)} dur={0.2} />
      <Check x={1544} y={899} s={34} de={F("a3", 0.75)} dur={0.2} />
      <Xis x={1560} y={963} s={28} de={F("a3", 0.8)} dur={0.25} />
    </NaPagina>
  );
}

function Agente() {
  const legenda = (x: number, txt: string, de: number) => (
    <Texto x={x} y={615} tam={36} cor={cor.cinza} ancora="middle" de={de}>
      {txt}
    </Texto>
  );
  return (
    <NaPagina p={P.agente}>
      <Texto x={960} y={120} tam={64} ancora="middle" de={F("g1")} dur={1.0}>
        {"o seu *{agente} de IA"}
      </Texto>

      {/* ligação → transcrição → agente → resumo → time */}
      <Celular x={120} y={310} de={F("g2")} />
      <Curva pts={[[258, 360], [272, 395], [258, 430]]} cor={cor.cinza} espessura={2.5} de={F("g2") + 0.4} dur={0.2} />
      <Curva pts={[[278, 340], [298, 395], [278, 450]]} cor={cor.cinza} espessura={2.5} de={F("g2") + 0.5} dur={0.2} />
      {legenda(180, "ligação de vendas", F("g2") + 0.3)}
      <Seta desde={[312, 415]} para={[372, 415]} de={W("g2", "ligação")} dur={0.4} />
      <Papel x={385} y={300} w={190} h={235} linhas={5} de={W("g2", "ligação") + 0.2} />
      {legenda(480, "transcrição", W("g2", "ligação") + 0.5)}
      <Seta desde={[592, 415]} para={[660, 415]} de={W("g2", "lê tudo")} dur={0.4} />
      <Robo x={790} y={380} s={180} de={W("g2", "lê tudo")} />
      {legenda(790, "agente", W("g2", "lê tudo") + 0.6)}
      <Seta desde={[905, 415]} para={[985, 415]} de={W("g2", "escreve")} dur={0.4} />
      <Papel x={1000} y={290} w={235} h={255} linhas={4} titulo="Resumo" corLinhas={cor.azul} de={W("g2", "escreve") + 0.2} />
      <Seta desde={[1255, 415]} para={[1335, 415]} de={W("g2", "time")} dur={0.4} />
      {[claro.verde, claro.azul, claro.violeta].map((roupa, i) => (
        <Boneco key={i} x={1430 + i * 115} y={345} s={52} roupa={roupa} de={W("g2", "time") + 0.15 + i * 0.12} />
      ))}
      {legenda(1545, "time comercial", W("g2", "time") + 0.5)}

      {/* testes manuais */}
      <Texto x={120} y={735} tam={44} de={F("g3")} dur={0.8}>
        {"testou com *{3} ligações"}
      </Texto>
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Papel x={130 + i * 215} y={775} w={175} h={200} linhas={4} titulo="Resumo" corLinhas={cor.azul} de={F("g3", 0.4) + i * 0.25} />
          <Check x={250 + i * 215} y={985} s={44} de={W("g4", "organizados") + i * 0.15} />
        </React.Fragment>
      ))}
      <Brilho x={110} y={780} s={26} de={W("g4", "lindos")} />
      <Brilho x={560} y={760} s={34} de={W("g4", "lindos") + 0.1} />
      <Brilho x={790} y={890} s={24} de={W("g4", "lindos") + 0.2} />
      <Texto x={850} y={830} tam={44} cor={cor.verde} de={W("g4", "lindos")}>
        lindos!
      </Texto>

      {/* o chefe */}
      <Boneco x={1400} y={790} s={70} roupa={claro.cinza} gravata bracos="cima" de={F("g5")} />
      <Balao x={1490} y={655} texto="Adorei!" tam={50} ponta={[1445, 760]} de={W("g5", "adora")} />
      <Texto x={1400} y={1055} tam={36} cor={cor.cinza} ancora="middle" de={F("g5") + 0.4}>
        o chefe
      </Texto>
      <Brilho x={1730} y={665} s={22} cor={cor.rosa} de={W("g5", "adora") + 0.4} />
      <Brilho x={1700} y={790} s={16} cor={cor.rosa} de={W("g5", "adora") + 0.5} />
    </NaPagina>
  );
}

function Pergunta() {
  const cartoes: [string, string, string][] = [
    ["p5", "pegou TODAS as tarefas combinadas?", claro.azul],
    ["p6", "inventou algum desconto?", claro.vermelho],
    ["p7", "mudei o prompt (as instruções):\nmelhorou ou piorou?", claro.verde],
  ];
  return (
    <NaPagina p={P.pergunta}>
      <Texto x={960} y={105} tam={44} cor={cor.cinza} ancora="middle" de={F("p1")}>
        a pergunta:
      </Texto>
      <Texto x={960} y={215} tam={76} ancora="middle" de={F("p2")} dur={1.8}>
        {"Como você *{prova} que o agente\nfaz o que deveria?"}
      </Texto>

      {/* "eu li e achei bom" não vale */}
      <Boneco x={250} y={640} s={60} roupa={claro.amarelo} de={W("p3", "eu li") - 0.3} />
      <Balao x={120} y={440} texto={"eu li e\nachei bom"} tam={50} ponta={[245, 590]} de={W("p3", "eu li")} />
      <Xis x={265} y={515} s={190} espessura={9} de={FIM_DE("p3") - 0.2} dur={0.45} />
      <Texto x={450} y={720} tam={54} cor={cor.vermelho} de={FIM_DE("p3") + 0.1} girar={-6}>
        não vale!
      </Texto>

      {/* perguntas concretas */}
      {cartoes.map(([id, txt, preench], i) => (
        <React.Fragment key={id}>
          <Elipse cx={760} cy={480 + i * 185} w={74} h={74} preench="#ffffff" hachura="solid" de={F(id)} dur={0.3} />
          <Texto x={760} y={497 + i * 185} tam={44} ancora="middle" de={F(id) + 0.15}>
            {String(i + 1)}
          </Texto>
          <Caixa x={830} y={410 + i * 185} w={980} h={140} texto={txt} tam={46} preench={preench} de={F(id) + 0.1} dur={0.55} />
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

function Promessa() {
  return (
    <NaPagina p={P.promessa}>
      <Texto x={960} y={130} tam={58} ancora="middle" de={F("r1")} dur={1.2}>
        {"nesta aula você constrói:"}
      </Texto>
      <Papel x={130} y={380} w={210} h={250} linhas={5} titulo="Resumo" corLinhas={cor.azul} de={W("r2", "avaliador") - 0.4} />
      <Seta desde={[360, 505]} para={[590, 505]} de={W("r2", "avaliador")} dur={0.45} />
      <Caixa x={610} y={360} w={540} h={290} texto={"avaliador\nem Python"} tam={64} preench={claro.violeta} de={W("r2", "avaliador") + 0.2} dur={0.7} />
      <Texto x={880} y={700} tam={34} cor={cor.cinza} ancora="middle" de={W("r2", "Python") + 0.3}>
        {"{ checks · evidências · score }"}
      </Texto>

      <Seta desde={[1170, 450]} para={[1390, 335]} de={F("r3")} dur={0.45} />
      <Ret x={1410} y={225} w={420} h={200} preench={claro.verde} de={W("r3", "prova") - 0.2} dur={0.5} />
      <Check x={1440} y={290} s={40} de={W("r3", "prova")} />
      <Texto x={1500} y={305} tam={56} de={W("r3", "prova")}>
        prova
      </Texto>
      <Texto x={1440} y={360} tam={30} cor={cor.tinta} de={W("r3", "prova") + 0.4}>
        "consigo 10% de desconto"
      </Texto>
      <Texto x={1440} y={400} tam={28} cor={cor.cinza} de={W("r3", "prova") + 0.7}>
        conversa, linha 9
      </Texto>

      <Seta desde={[1170, 560]} para={[1390, 680]} de={F("r4")} dur={0.45} />
      <Ret x={1410} y={590} w={420} h={200} preench={claro.amarelo} de={F("r4") + 0.2} dur={0.5} />
      <Texto x={1620} y={705} tam={100} ancora="middle" de={W("r4", "número")} dur={0.5}>
        0,67
      </Texto>
      <Texto x={1620} y={765} tam={32} cor={cor.cinza} ancora="middle" de={W("r4", "número") + 0.4}>
        número
      </Texto>
    </NaPagina>
  );
}

export function Gancho() {
  return (
    <>
      <Abertura />
      <Agente />
      <Pergunta />
      <Promessa />
    </>
  );
}
