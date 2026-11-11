import React from "react";
import { Check, Elipse, Linha, Seta, Xis } from "../../../lousa/Esboco";
import { Capitulo } from "../../../lousa/Codigo";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Balao, Martelo, Papel, Robo } from "./desenhos";

// Parte 6: CI/CD, skills × subagentes, limites do LLM avaliador e encerramento.

function Ci() {
  return (
    <NaPagina p={P.ci}>
      <Texto x={960} y={100} tam={56} ancora="middle" de={F("ci1")}>
        {"CI/CD: o avaliador *{a cada mudança}"}
      </Texto>
      <Papel x={80} y={220} w={200} h={240} linhas={4} titulo="prompt" corLinhas={cor.violeta} de={W("ci1", "mudança")} />
      <Texto x={180} y={510} tam={32} cor={cor.cinza} ancora="middle" de={W("ci1", "mudança")}>
        mudança
      </Texto>
      <Seta desde={[300, 340]} para={[440, 340]} de={W("ci1", "robô")} dur={0.35} />
      <Robo x={560} y={320} s={150} preench={claro.cinza} de={W("ci1", "robô")} />
      <Texto x={560} y={500} tam={32} cor={cor.cinza} ancora="middle" de={W("ci1", "testes")}>
        roda os testes
      </Texto>
      <Seta desde={[680, 280]} para={[800, 230]} de={F("ci2")} dur={0.3} />
      <Check x={830} y={230} s={56} de={F("ci2")} />
      <Texto x={910} y={250} tam={38} cor={cor.verde} de={F("ci2")}>
        entra
      </Texto>
      <Seta desde={[680, 380]} para={[800, 430]} de={W("ci2", "X vermelho")} dur={0.3} />
      <Xis x={850} y={440} s={52} de={W("ci2", "X vermelho")} />
      <Texto x={910} y={455} tam={38} cor={cor.vermelho} de={W("ci2", "X vermelho")}>
        não entra
      </Texto>
      <Texto x={1150} y={300} tam={38} de={W("ci3", "prompt é código")} dur={0.8}>
        {"prompt *{é código}:\numa palavra trocada\npode piorar tudo"}
      </Texto>

      <Caixa x={80} y={600} w={850} h={190} texto={"1 · pytest: testa o avaliador\nsem API · grátis · < 1 s"} tam={40} preench={claro.azul} de={F("ci4")} />
      <Caixa x={990} y={600} w={850} h={190} texto={"2 · agente resume, juiz avalia 3×\nmédia < 0,9 → falha"} tam={40} preench={claro.verde} de={F("ci5")} />
      <Etiqueta x={500} y={920} texto="cuidado: custo (cada execução chama o modelo)" tam={34} preench={claro.amarelo} de={W("ci6", "Custo")} />
      <Etiqueta x={1420} y={920} texto="check crítico (C03): passa sempre" tam={34} preench={claro.vermelho} de={W("ci6", "check crítico")} />
    </NaPagina>
  );
}

function Skills() {
  return (
    <NaPagina p={P.skills}>
      <Texto x={960} y={100} tam={56} ancora="middle" de={F("sk1")}>
        {"skill *{ou} subagente?"}
      </Texto>
      <Linha pts={[[960, 160], [962, 740]]} cor={claro.cinza} espessura={3} de={F("sk1") + 0.4} dur={0.3} />
      {/* skill */}
      <Texto x={480} y={210} tam={50} ancora="middle" de={F("sk2")}>
        skill
      </Texto>
      <Robo x={480} y={380} s={160} de={F("sk2") + 0.2} />
      <Papel x={600} y={240} w={130} h={160} linhas={3} titulo="manual" de={W("sk2", "manual")} />
      <Texto x={480} y={620} tam={34} ancora="middle" de={W("sk2", "mesmo agente")} dur={0.9}>
        {"o mesmo agente,\ncom a mesma memória"}
      </Texto>
      {/* subagente */}
      <Texto x={1440} y={210} tam={50} ancora="middle" de={F("sk3")}>
        subagente
      </Texto>
      <Robo x={1270} y={380} s={130} de={F("sk3") + 0.2} />
      <Linha pts={[[1390, 260], [1392, 560]]} espessura={9} cor="#495057" de={W("sk3", "outro agente")} dur={0.3} />
      <Robo x={1560} y={380} s={130} preench={claro.violeta} de={W("sk3", "outro agente")} />
      <Texto x={1440} y={620} tam={34} ancora="middle" de={W("sk3", "contexto limpo")} dur={0.9}>
        {"outro agente,\ncontexto limpo"}
      </Texto>
      <Texto x={480} y={720} tam={34} cor={cor.vermelho} ancora="middle" de={W("sk4", "contaminação")}>
        juiz como skill do implementador: contaminação
      </Texto>
      <Texto x={1440} y={720} tam={34} cor={cor.verde} ancora="middle" de={W("sk4", "independência")}>
        juiz como subagente: independência
      </Texto>
      <Caixa x={260} y={820} w={1400} h={190} texto={"juiz = *{subagente} + uma *{skill} de avaliação\na skill garante o método · o subagente, a independência"} tam={44} preench={claro.amarelo} de={F("sk5")} dur={0.7} />
    </NaPagina>
  );
}

function Limites() {
  const itens: [string, string][] = [
    ["lm2", "o juiz também erra"],
    ["lm3", "existir não é sustentar"],
    ["lm4", "vieses: tamanho, ordem,\no próprio estilo"],
    ["lm5", "o baseline pode\nestar errado"],
    ["lm6", "calibre com humanos\n(20 a 50 casos)"],
    ["lm7", "métrica que vira meta\ndeixa de medir"],
  ];
  return (
    <NaPagina p={P.limites}>
      <Texto x={960} y={100} tam={56} ancora="middle" de={F("lm1")}>
        {"os *{limites} do juiz"}
      </Texto>
      {itens.map(([id, txt], i) => {
        const x = 90 + (i % 3) * 600;
        const y = 190 + Math.floor(i / 3) * 400;
        return (
          <React.Fragment key={id}>
            <Caixa x={x} y={y} w={540} h={330} texto={txt} tam={42} preench={[claro.vermelho, claro.amarelo, claro.violeta, claro.azul, claro.verde, claro.laranja][i]} de={F(id)} />
            <Elipse cx={x + 50} cy={y + 50} w={64} h={64} preench="#ffffff" hachura="solid" de={F(id) + 0.2} dur={0.2} />
            <Texto x={x + 50} y={y + 66} tam={40} ancora="middle" de={F(id) + 0.3}>
              {String(i + 1)}
            </Texto>
          </React.Fragment>
        );
      })}
    </NaPagina>
  );
}

function ResumoFinal() {
  const frases = [
    "não pergunte \"está bom?\": pergunte \"cumpre?\" e peça a prova",
    "requisito vira check binário, com peso, congelado e versionado",
    "se dá para verificar com código, verifique com código",
    "o juiz mostra a evidência, um programa confere, a nota é uma conta",
    "rode mais de uma vez e meça a concordância, não só a média",
  ];
  return (
    <NaPagina p={P.resumoFinal}>
      <Texto x={960} y={110} tam={58} ancora="middle" de={F("rf1")}>
        {"pra fechar: *{cinco frases}"}
      </Texto>
      {frases.map((f, i) => (
        <React.Fragment key={i}>
          <Elipse cx={130} cy={240 + i * 165} w={76} h={76} preench={claro.amarelo} hachura="solid" de={F(`rf${i + 2}`)} dur={0.25} />
          <Texto x={130} y={257 + i * 165} tam={44} ancora="middle" de={F(`rf${i + 2}`) + 0.1}>
            {String(i + 1)}
          </Texto>
          <Texto x={210} y={256 + i * 165} tam={46} de={F(`rf${i + 2}`) + 0.1} dur={1.2}>
            {f}
          </Texto>
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

function Desafio() {
  const itens = ["+2 critérios (1 de código, 1 do juiz)", "+1 caso de teste", "5 execuções com o modelo de verdade", "a tabela e a explicação: DESAFIO.md"];
  const tItem = (i: number) => (i < 3 ? W("ds1", ["dois critérios", "caso de teste", "cinco execuções"][i]) : F("ds1", 0.8));
  return (
    <NaPagina p={P.desafio}>
      <Texto x={960} y={130} tam={64} ancora="middle" de={F("ds1")}>
        {"o *{desafio}"}
      </Texto>
      <Papel x={410} y={220} w={1100} h={700} linhas={0} de={F("ds1") + 0.2} />
      {itens.map((t, i) => (
        <React.Fragment key={t}>
          <Check x={480} y={350 + i * 140} s={50} de={tItem(i)} />
          <Texto x={560} y={368 + i * 140} tam={46} de={tItem(i)} dur={0.8}>
            {t}
          </Texto>
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

function Fim() {
  return (
    <NaPagina p={P.fim}>
      <Texto x={960} y={260} tam={50} ancora="middle" de={F("fi1")} dur={1.4}>
        não basta construir agentes que executam tarefas.
      </Texto>
      <Texto x={960} y={420} tam={58} ancora="middle" de={F("fi2")} dur={2.4}>
        {"precisamos de sistemas que *{demonstrem}\nquando eles acertam, quando falham, e por quê"}
      </Texto>
      <Martelo x={420} y={760} s={0.8} de={F("fi3")} />
      <Texto x={960} y={820} tam={110} ancora="middle" de={F("fi3")} dur={0.8}>
        obrigado!
      </Texto>
      <Texto x={960} y={920} tam={40} cor={cor.cinza} ancora="middle" de={F("fi3") + 0.8}>
        LLM as a Judge · aula 2
      </Texto>
      <Check x={1480} y={790} s={80} de={F("fi3") + 0.5} />
    </NaPagina>
  );
}

export function Producao() {
  return (
    <>
      <NaPagina p={P.cap6}>
        <Capitulo n="6" titulo="Produção e encerramento" sub="CI/CD, skills × subagentes e os limites do juiz" de={F("t6")} />
      </NaPagina>
      <Ci />
      <Skills />
      <Limites />
      <ResumoFinal />
      <Desafio />
      <Fim />
    </>
  );
}
