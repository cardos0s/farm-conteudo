import React from "react";
import { Check, Curva, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { Capitulo } from "../../../lousa/Codigo";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Balao, Boneco, Calculadora, Envelope, Martelo, Olho, Papel, Pilha, Robo } from "./desenhos";

// Parte 2: LLM as a Judge, as cinco caixas da arquitetura, os quatro conceitos e a honestidade técnica.

function Juiz() {
  const tResposta = F("j6");
  return (
    <NaPagina p={P.juiz}>
      <Texto x={960} y={105} tam={60} ancora="middle" de={F("j1")} dur={0.9}>
        {"LLM as a Judge = LLM como *{juiz}"}
      </Texto>
      <Robo x={420} y={330} s={170} preench={claro.violeta} de={W("j1", "modelo de linguagem")} />
      <Martelo x={600} y={380} s={0.45} de={W("j1", "avaliar")} />
      <Texto x={420} y={540} tam={36} ancora="middle" de={W("j1", "avaliar")}>
        juiz
      </Texto>
      <Seta desde={[700, 330]} para={[1110, 330]} de={W("j1", "avaliar")} dur={0.5} />
      <Texto x={905} y={305} tam={34} cor={cor.cinza} ancora="middle" de={W("j1", "avaliar") + 0.2}>
        avalia
      </Texto>
      <Papel x={1140} y={220} w={190} h={230} linhas={4} titulo="Resumo" corLinhas={cor.azul} de={W("j1", "saída")} />
      <Robo x={1560} y={330} s={150} de={W("j1", "outro sistema")} />
      <Texto x={1560} y={520} tam={32} cor={cor.cinza} ancora="middle" de={W("j1", "outro sistema") + 0.3}>
        o agente
      </Texto>

      {/* por que não um humano */}
      <Texto x={120} y={650} tam={40} de={F("j2")} ate={tResposta - 0.2}>
        por que não um humano?
      </Texto>
      <Boneco x={220} y={730} s={55} roupa={claro.cinza} de={F("j2") + 0.3} ate={tResposta - 0.2} />
      <Pilha x={340} y={780} w={150} h={180} n={7} de={W("j3", "mil ligações")} ate={tResposta - 0.2} />
      <Texto x={560} y={860} tam={40} de={W("j3", "mil ligações")} ate={tResposta - 0.2}>
        1.000 resumos/dia
      </Texto>
      <Texto x={560} y={930} tam={44} cor={cor.vermelho} de={W("j2", "não escala")} ate={tResposta - 0.2}>
        não escala
      </Texto>

      {/* quem vigia o juiz */}
      <Olho x={1400} y={720} s={160} de={F("j5")} ate={tResposta - 0.2} />
      <Texto x={1400} y={880} tam={58} cor={cor.laranja} ancora="middle" de={W("j5", "quem vigia")} ate={tResposta - 0.2}>
        quem vigia o juiz?
      </Texto>
      <Texto x={1400} y={950} tam={34} cor={cor.cinza} ancora="middle" de={W("j4", "confiança")} ate={tResposta - 0.2}>
        (ele também escreve com confiança quando erra)
      </Texto>

      {/* a resposta */}
      <Caixa x={260} y={680} w={1400} h={300} texto={"o juiz *{não decide sozinho}:\nregras + provas que um programa confere"} tam={56} preench={claro.verde} de={tResposta} dur={0.7} />
    </NaPagina>
  );
}

function Var() {
  return (
    <NaPagina p={P.var}>
      <Texto x={960} y={105} tam={60} ancora="middle" de={F("vr1")}>
        {"como o *{VAR}"}
      </Texto>
      {/* a tela do replay */}
      <Ret x={360} y={180} w={1000} h={600} preench="#343a40" hachura="solid" de={F("vr1") + 0.3} dur={0.6} />
      <Ret x={400} y={220} w={920} h={520} redondo={false} preench={claro.verde} hachura="hachure" cor={cor.verde} de={F("vr1") + 0.6} dur={0.5} />
      <Linha pts={[[860, 220], [860, 740]]} cor="#ffffff" espessura={4} de={F("vr1") + 0.9} dur={0.3} />
      <Elipse cx={860} cy={480} w={110} h={110} cor="#ffffff" espessura={4} de={F("vr1") + 1.0} dur={0.3} />
      <Boneco x={640} y={400} s={46} roupa={claro.azul} de={W("vr2", "lance")} />
      <Boneco x={1060} y={420} s={46} roupa={claro.vermelho} de={W("vr2", "lance") + 0.15} />
      <Elipse cx={760} cy={600} w={36} h={36} preench="#ffffff" hachura="solid" de={W("vr2", "lance") + 0.3} dur={0.2} />
      <Linha pts={[[700, 230], [690, 730]]} cor={cor.laranja} espessura={4} de={W("vr2", "replay") - 0.1} dur={0.4} />
      <Elipse cx={445} cy={265} w={22} h={22} preench={cor.vermelho} hachura="solid" cor={cor.vermelho} de={W("vr2", "replay")} dur={0.15} />
      <Texto x={470} y={278} tam={36} cor="#ffffff" de={W("vr2", "replay")}>
        REPLAY
      </Texto>
      {/* o árbitro */}
      <Boneco x={1600} y={420} s={60} roupa="#343a40" de={W("vr2", "árbitro")} />
      <Balao x={1480} y={220} texto="deixa eu ver..." tam={38} ponta={[1590, 360]} de={W("vr2", "mudar a decisão")} />
      <Texto x={960} y={920} tam={80} cor={cor.vermelho} ancora="middle" de={F("vr3")} dur={0.6}>
        sem replay, não vale
      </Texto>
    </NaPagina>
  );
}

// as cinco caixas, em cima; embaixo, o detalhe da caixa que está sendo explicada
const CAIXAS: [string, string][] = [
  ["PRD\nrequisitos", claro.amarelo],
  ["baseline\ncongelado", claro.azul],
  ["implementador\n(o agente)", claro.verde],
  ["juiz\nindependente", claro.violeta],
  ["score\nem Python", claro.laranja],
];
const XS = [50, 420, 790, 1160, 1560];

function Fluxo() {
  const passos = [F("fx2"), F("fx4"), F("fx7"), F("fx9"), F("fx11"), F("fx13")];
  const ate = (i: number) => (i + 1 < passos.length ? passos[i + 1] - 0.3 : undefined);
  const seta = (i: number, cx: number) => <Seta desde={[cx, 520]} para={[cx, 420]} cor={cor.vermelho} espessura={4} de={passos[i]} dur={0.35} ate={ate(i)} />;
  return (
    <NaPagina p={P.fluxo}>
      <Texto x={960} y={95} tam={52} ancora="middle" de={F("fx1")}>
        o sistema em cinco caixas
      </Texto>
      {CAIXAS.map(([txt, preench], i) => (
        <React.Fragment key={i}>
          <Caixa x={XS[i]} y={190} w={310} h={190} texto={txt} tam={40} preench={preench} de={(i === 0 ? F("fx1") + 0.8 : passos[i]) + (i === 0 ? 0 : 0)} dur={0.5} />
          <Texto x={XS[i] + 30} y={175} tam={34} cor={cor.cinza} de={i === 0 ? F("fx1") + 0.8 : passos[i]}>
            {String(i + 1)}
          </Texto>
          {i > 0 && <Seta desde={[XS[i - 1] + 315, 285]} para={[XS[i] - 8, 285]} de={passos[i] - 0.2} dur={0.3} />}
        </React.Fragment>
      ))}
      {/* o portão entre o juiz e a conta */}
      {[0, 1, 2].map((k) => (
        <Linha key={k} pts={[[1492 + k * 14, 230], [1492 + k * 14, 340]]} cor={cor.vermelho} espessura={4} de={passos[5] + k * 0.1} dur={0.2} />
      ))}
      <Linha pts={[[1484, 240], [1530, 240]]} cor={cor.vermelho} espessura={4} de={passos[5] + 0.3} dur={0.2} />
      <Texto x={1508} y={420} tam={34} cor={cor.vermelho} ancora="middle" de={passos[5] + 0.3}>
        gates
      </Texto>

      {/* 1 · PRD */}
      {seta(0, XS[0] + 155)}
      <Texto x={100} y={600} tam={44} de={passos[0]} ate={ate(0)}>
        {"o *{pedido}: o que o sistema precisa fazer"}
      </Texto>
      {["R1 · produzir um resumo", "R2 · identificar as próximas ações", "R3 · não inventar valores, datas ou compromissos"].map((r, i) => (
        <Texto key={r} x={160} y={720 + i * 90} tam={50} de={W("fx3", ["produzir", "identificar", "não inventar"][i])} ate={ate(0)}>
          {r}
        </Texto>
      ))}

      {/* 2 · baseline */}
      {seta(1, XS[1] + 155)}
      <Texto x={100} y={600} tam={44} de={passos[1]} ate={ate(1)}>
        {"cada requisito vira uma pergunta de *{sim ou não}: os checks"}
      </Texto>
      <Envelope x={180} y={680} w={330} h={210} lacre="v1" de={W("fx5", "congelar")} ate={ate(1)} />
      <Texto x={620} y={740} tam={44} de={W("fx5", "escrita e salva")} ate={ate(1)}>
        escrito e salvo antes de avaliar
      </Texto>
      <Texto x={620} y={820} tam={44} de={W("fx5", "Ninguém mexe")} ate={ate(1)}>
        {"ninguém mexe depois de ver o resultado"}
      </Texto>
      <Texto x={620} y={920} tam={44} cor={cor.verde} de={F("fx6")} ate={ate(1)}>
        = o gabarito lacrado antes da prova
      </Texto>

      {/* 3 · implementador */}
      {seta(2, XS[2] + 155)}
      <Robo x={350} y={720} s={180} de={passos[2]} ate={ate(2)} />
      <Seta desde={[480, 740]} para={[620, 740]} de={passos[2] + 0.6} dur={0.3} ate={ate(2)} />
      <Papel x={640} y={620} w={180} h={220} linhas={4} titulo="Resumo" corLinhas={cor.azul} de={passos[2] + 0.8} ate={ate(2)} />
      <Envelope x={1000} y={640} w={200} h={130} lacre="v1" de={W("fx8", "não vê")} ate={ate(2)} />
      <Xis x={1100} y={705} s={170} espessura={7} de={W("fx8", "não vê") + 0.4} ate={ate(2)} />
      <Texto x={1250} y={720} tam={42} de={W("fx8", "não vê")} ate={ate(2)}>
        não vê o baseline
      </Texto>
      <Texto x={1000} y={930} tam={46} cor={cor.verde} de={W("fx8", "aluno")} ate={ate(2)}>
        = o aluno fazendo a prova
      </Texto>

      {/* 4 · juiz */}
      {seta(3, XS[3] + 155)}
      {["baseline", "conversa", "resumo"].map((t, i) => (
        <React.Fragment key={t}>
          <Etiqueta x={230} y={600 + i * 110} texto={t} tam={40} preench="#ffffff" hachura="solid" de={W("fx9", ["baseline", "conversa original", "resumo"][i])} ate={ate(3)} />
          <Seta desde={[340, 600 + i * 110]} para={[520, 700]} de={W("fx9", ["baseline", "conversa original", "resumo"][i]) + 0.2} dur={0.3} ate={ate(3)} />
        </React.Fragment>
      ))}
      <Robo x={640} y={690} s={170} preench={claro.violeta} de={passos[3]} ate={ate(3)} />
      <Martelo x={800} y={760} s={0.4} de={passos[3] + 0.4} ate={ate(3)} />
      <Seta desde={[880, 700]} para={[1000, 700]} de={F("fx10")} dur={0.3} ate={ate(3)} />
      <Caixa x={1020} y={570} w={520} h={110} texto="C02: não + evidência" tam={40} preench="#ffffff" de={F("fx10") + 0.2} ate={ate(3)} />
      <Caixa x={1020} y={700} w={520} h={110} texto="C03: sim + evidência" tam={40} preench="#ffffff" de={F("fx10") + 0.5} ate={ate(3)} />
      <Texto x={1580} y={710} tam={44} cor={cor.vermelho} de={W("fx10", "não dá nota")} ate={ate(3)}>
        sem nota
      </Texto>
      <Texto x={1020} y={930} tam={44} cor={cor.verde} de={W("fx10", "corretor")} ate={ate(3)}>
        = o corretor que não conhece o aluno
      </Texto>

      {/* 5 · score */}
      {seta(4, XS[4] + 155)}
      <Calculadora x={260} y={560} s={1.4} visor="0,6667" de={passos[4]} ate={ate(4)} />
      <Texto x={700} y={700} tam={56} de={W("fx11", "pesos")} ate={ate(4)}>
        {"(1 + 0 + 3) ÷ 6 = *{0,6667}"}
      </Texto>
      <Texto x={700} y={820} tam={48} cor={cor.verde} de={F("fx12")} ate={ate(4)}>
        sem LLM: uma conta
      </Texto>

      {/* gates */}
      <Texto x={100} y={600} tam={46} de={W("fx14", "confere")} dur={1.0}>
        {"antes de virar ponto: *{as provas existem?}"}
      </Texto>
      <Etiqueta x={500} y={760} texto="existem → vale" tam={46} preench={claro.verde} de={W("fx14", "existem mesmo")} />
      <Etiqueta x={1300} y={760} texto="sem prova → não passou" tam={46} preench={claro.vermelho} de={W("fx15", "vira não passou")} />
      <Texto x={960} y={940} tam={56} cor={cor.vermelho} ancora="middle" de={W("fx15", "Sem replay")}>
        sem replay, não vale gol
      </Texto>
    </NaPagina>
  );
}

function Conceitos() {
  const Q = [
    [70, 150],
    [990, 150],
    [70, 610],
    [990, 610],
  ];
  const titulo = (i: number, txt: string, de: number) => (
    <>
      <Elipse cx={Q[i][0] + 36} cy={Q[i][1] + 36} w={64} h={64} preench="#ffffff" hachura="solid" de={de} dur={0.25} />
      <Texto x={Q[i][0] + 36} y={Q[i][1] + 52} tam={42} ancora="middle" de={de + 0.1}>
        {String(i + 1)}
      </Texto>
      <Texto x={Q[i][0] + 90} y={Q[i][1] + 54} tam={50} de={de + 0.1}>
        {txt}
      </Texto>
    </>
  );
  return (
    <NaPagina p={P.conceitos}>
      <Texto x={960} y={80} tam={46} cor={cor.cinza} ancora="middle" de={F("cc1")}>
        quatro conceitos que protegem a avaliação
      </Texto>
      <Linha pts={[[960, 140], [962, 1050]]} cor={claro.cinza} espessura={3} de={F("cc1") + 0.3} dur={0.4} />
      <Linha pts={[[60, 585], [1860, 588]]} cor={claro.cinza} espessura={3} de={F("cc1") + 0.4} dur={0.4} />

      {/* 1 determinismo */}
      {titulo(0, "determinismo", F("cc2"))}
      <Calculadora x={110} y={250} s={0.8} visor="0,67" de={W("cc2", "calculadora")} />
      <Texto x={310} y={300} tam={34} cor={cor.verde} de={W("cc2", "calculadora")}>
        mesma entrada → mesma saída
      </Texto>
      <Balao x={560} y={340} texto={"hmm... 7?\nou 8?"} tam={34} ponta={[520, 470]} de={W("cc2", "opinião")} />
      <Texto x={110} y={560} tam={30} cor={cor.cinza} de={F("cc3")} dur={1.2}>
        a conta · a conferência das provas · os checks de código
      </Texto>

      {/* 2 contaminação */}
      {titulo(1, "contaminação de contexto", F("cc4"))}
      <Robo x={1130} y={330} s={140} de={W("cc6", "mesmo agente")} />
      <Balao x={1240} y={210} texto={"eu escrevi isso,\nestá ótimo!"} tam={34} ponta={[1200, 290]} de={W("cc6", "tende a achar")} />
      <Texto x={1060} y={500} tam={34} de={W("cc5", "puxa")} dur={0.8}>
        algo no contexto puxa o julgamento
      </Texto>
      <Texto x={1060} y={555} tam={34} cor={cor.vermelho} de={W("cc6", "aluno corrigindo")}>
        = o aluno corrigindo a própria prova
      </Texto>

      {/* 3 independência */}
      {titulo(2, "independência", F("cc7"))}
      <Robo x={220} y={790} s={120} de={W("cc7", "Implementador")} />
      <Linha pts={[[340, 700], [342, 960]]} espessura={10} cor="#495057" de={W("cc7", "separados")} dur={0.3} />
      <Robo x={470} y={790} s={120} preench={claro.violeta} de={W("cc7", "separados") + 0.2} />
      <Texto x={600} y={760} tam={32} de={W("cc7", "não vê")} dur={0.9}>
        {"não vê as instruções,\no raciocínio, nem a autoria"}
      </Texto>
      <Texto x={110} y={1010} tam={30} cor={cor.verde} de={W("cc8", "modelo diferente")}>
        se puder: outro modelo para o juiz
      </Texto>

      {/* 4 estado limpo */}
      {titulo(3, "estado limpo", F("cc9"))}
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Papel x={1050 + i * 165} y={720} w={140} h={170} linhas={3} de={W("cc9", "chamada nova") + i * 0.25} />
          <Texto x={1120 + i * 165} y={930} tam={28} cor={cor.verde} ancora="middle" de={W("cc9", "do zero") + i * 0.25}>
            do zero
          </Texto>
        </React.Fragment>
      ))}
      <Texto x={1590} y={790} tam={28} de={W("cc10", "generoso")} dur={0.8}>
        {"nada de ficar\ngeneroso depois\nde 10 ruins"}
      </Texto>
      <Texto x={1060} y={1010} tam={30} cor={cor.verde} de={W("cc10", "como se fosse o primeiro")}>
        cada resumo, como se fosse o primeiro
      </Texto>
    </NaPagina>
  );
}

function Honestidade() {
  return (
    <NaPagina p={P.honestidade}>
      <Texto x={960} y={100} tam={54} ancora="middle" de={F("hn1")}>
        honestidade técnica
      </Texto>
      <Caixa x={120} y={190} w={760} h={110} texto="a conta" tam={50} preench={claro.verde} de={W("hn2", "harness")} />
      <Calculadora x={160} y={350} s={0.9} visor="0,6667" de={W("hn2", "pontuação")} />
      <Texto x={420} y={430} tam={40} de={W("hn2", "determinística")}>
        determinística
      </Texto>
      <Texto x={420} y={500} tam={34} cor={cor.cinza} de={W("hn2", "Mesmos")}>
        mesmos sins e nãos,
      </Texto>
      <Texto x={420} y={545} tam={34} cor={cor.cinza} de={W("hn2", "mesma nota")}>
        mesma nota, sempre
      </Texto>
      <Check x={420} y={620} s={50} de={W("hn2", "Sempre")} />

      <Caixa x={1040} y={190} w={760} h={110} texto="o julgamento do LLM" tam={50} preench={claro.laranja} de={F("hn3")} />
      <Curva pts={[[1100, 480], [1200, 400], [1300, 520], [1400, 420], [1500, 510], [1600, 430], [1720, 480]]} cor={cor.laranja} espessura={5} de={W("hn3", "pode variar")} dur={0.8} />
      <Texto x={1420} y={620} tam={40} ancora="middle" de={W("hn3", "pode variar")}>
        pode variar entre execuções
      </Texto>

      <Etiqueta x={560} y={850} texto={"*{reduzir}\ncom checks bem escritos"} tam={44} preench={claro.amarelo} de={W("hn4", "reduzir")} />
      <Texto x={960} y={865} tam={60} ancora="middle" de={W("hn4", "e medir")}>
        +
      </Texto>
      <Etiqueta x={1360} y={850} texto={"*{medir}\nrodando mais de uma vez"} tam={44} preench={claro.amarelo} de={W("hn4", "e medir")} />
      <Texto x={960} y={1030} tam={36} cor={cor.cinza} ancora="middle" de={W("hn4", "fingir")} ate={W("hn4", "reduzir")}>
        não é fingir que a variação some
      </Texto>
    </NaPagina>
  );
}

export function Arquitetura() {
  return (
    <>
      <NaPagina p={P.cap2}>
        <Capitulo n="2" titulo="LLM as a Judge e a arquitetura" sub="juiz, baseline congelado, gates, isolamento e evidências" de={F("j0")} />
      </NaPagina>
      <Juiz />
      <Var />
      <Fluxo />
      <Conceitos />
      <Honestidade />
    </>
  );
}
