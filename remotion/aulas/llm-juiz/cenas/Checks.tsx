import React from "react";
import { Check, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { Capitulo, Codigo } from "../../../lousa/Codigo";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Balao, Boneco, Lupa, Papel, Robo } from "./desenhos";

// Parte 3: o caso da aula, requisito → check binário, teste do estranho, pesos, código ou juiz, baseline e evidência.

export const CONVERSA = [
  "Marina: Bom dia, Roberto! Obrigada por separar esse tempo.",
  "Roberto: Bom dia. Pode falar, tenho uns vinte minutos.",
  "Marina: Pelo que entendi no seu e-mail, vocês têm três padarias e controlam o estoque em planilha.",
  "Roberto: Isso. E todo mês sobra farinha numa loja e falta na outra.",
  "Marina: O nosso sistema mostra o estoque das três lojas num painel só e avisa quando um item está acabando.",
  "Roberto: E quanto custa?",
  "Marina: O plano para até cinco lojas sai por R$ 890 por mês.",
  "Roberto: Está acima do que eu tinha pensado. Tem algum desconto?",
  "Marina: No plano anual eu consigo 10% de desconto. Acima disso, preciso falar com a minha gerente.",
  "Roberto: Então fala com ela, porque eu queria chegar perto de 15%.",
  "Marina: Combinado. Falo com ela e te dou um retorno até sexta-feira.",
  "Roberto: Outra coisa: a minha sócia, a Cláudia, precisa ver o sistema antes de a gente decidir.",
  "Marina: Posso fazer uma demonstração para vocês dois. Que tal terça que vem, às 10h?",
  "Roberto: Terça às 10h funciona.",
  "Marina: Ótimo. Ainda hoje eu te mando a proposta por e-mail com os valores que conversamos.",
  "Roberto: Manda, sim. E coloca o prazo de implantação, por favor.",
  "Marina: A implantação leva em média duas semanas. Vou deixar isso escrito na proposta.",
  "Roberto: Perfeito. Até terça, então.",
].map((l, i) => `${String(i + 1).padStart(2, "0")}  ${l}`);

function Conversa() {
  const acoes: [string, string, string][] = [
    ["cv5", "1 · Marina manda a proposta\npor e-mail, ainda hoje", claro.azul],
    ["cv6", "2 · Marina fala com a gerente\ne dá retorno até sexta", claro.amarelo],
    ["cv7", "3 · demonstração terça, 10h,\npara Roberto e Cláudia", claro.verde],
  ];
  return (
    <NaPagina p={P.conversa}>
      <Texto x={70} y={95} tam={46} de={F("cv1")}>
        {"o caso: uma ligação de *{vendas}"}
      </Texto>
      <Codigo
        x={60}
        y={130}
        linhas={CONVERSA}
        lang="texto"
        tam={18}
        w={1210}
        titulo="casos/conversa.txt"
        de={F("cv1") + 0.3}
        marcas={[
          { l: 6, de: F("cv2"), cor: claro.laranja },
          { l: [8, 9], de: F("cv3"), cor: claro.laranja },
          { l: 14, de: F("cv5"), cor: claro.azul },
          { l: 10, de: F("cv6") },
          { l: [12, 13], de: F("cv7"), cor: claro.verde },
        ]}
      />
      <Boneco x={1430} y={170} s={48} roupa={claro.violeta} de={W("cv1", "Marina")} />
      <Texto x={1430} y={350} tam={28} ancora="middle" de={W("cv1", "Marina")}>
        Marina (vendas)
      </Texto>
      <Boneco x={1720} y={170} s={48} roupa={claro.laranja} de={W("cv1", "Roberto")} />
      <Texto x={1720} y={350} tam={28} ancora="middle" de={W("cv1", "Roberto")}>
        Roberto (3 padarias)
      </Texto>
      <Texto x={1340} y={440} tam={38} de={F("cv2")}>
        {"*{R$ 890}/mês, até 5 lojas"}
      </Texto>
      <Texto x={1340} y={510} tam={38} de={F("cv3")}>
        {"anual: *{10%} de desconto"}
      </Texto>
      <Texto x={1340} y={570} tam={32} cor={cor.cinza} de={W("cv3", "quinze")}>
        quer ~15%: vai consultar a gerente
      </Texto>
      <Texto x={70} y={720} tam={40} de={F("cv4")}>
        {"*{3 ações} combinadas:"}
      </Texto>
      {acoes.map(([id, txt, preench], i) => (
        <Caixa key={id} x={60 + i * 610} y={750} w={580} h={170} texto={txt} tam={38} preench={preench} de={F(id)} />
      ))}
      <Texto x={960} y={1030} tam={44} cor={cor.verde} ancora="middle" de={F("cv8")}>
        guarde essas três: são o nosso gabarito
      </Texto>
    </NaPagina>
  );
}

function Checks() {
  return (
    <NaPagina p={P.checks}>
      <Texto x={110} y={100} tam={40} cor={cor.cinza} de={F("ck1")}>
        os requisitos do PRD
      </Texto>
      {["R1 · produzir um resumo", "R2 · identificar as próximas ações", "R3 · não inventar valores, datas ou compromissos"].map((r, i) => (
        <Texto key={r} x={130} y={170 + i * 62} tam={42} de={F("ck1") + 0.3 + i * 0.3}>
          {r}
        </Texto>
      ))}
      <Texto x={960} y={420} tam={64} ancora="middle" de={F("ck2")} dur={1.0}>
        {"check = pergunta de *{sim ou não}"}
      </Texto>
      <Etiqueta x={760} y={515} texto="sim" tam={46} preench={claro.verde} de={W("ck2", "Passou")} />
      <Etiqueta x={1160} y={515} texto="não" tam={46} preench={claro.vermelho} de={W("ck2", "não passou")} />
      <Texto x={480} y={640} tam={38} cor={cor.verde} ancora="middle" de={W("ck3", "tem ou não tem")}>
        fácil concordar: tem ou não tem
      </Texto>
      <Texto x={1440} y={640} tam={38} cor={cor.vermelho} ancora="middle" de={W("ck3", "sete ou é oito")}>
        difícil concordar: é 7 ou é 8?
      </Texto>
      <Caixa x={140} y={720} w={700} h={150} texto="o resumo é bom?" tam={50} preench={claro.vermelho} de={W("ck4", "o resumo é bom")} />
      <Caixa x={1000} y={720} w={780} h={150} texto={"o resumo cita a demonstração\nde terça às 10h?"} tam={44} preench={claro.verde} de={F("ck5")} />
      <Texto x={490} y={950} tam={42} cor={cor.vermelho} ancora="middle" de={W("ck6", "depende")}>
        depende de quem lê
      </Texto>
      <Texto x={1390} y={950} tam={42} cor={cor.verde} ancora="middle" de={W("ck6", "confere")}>
        você confere apontando
      </Texto>
      <Seta desde={[1690, 990]} para={[1640, 890]} cor={cor.verde} espessura={4} de={W("ck6", "apontando")} dur={0.3} />
    </NaPagina>
  );
}

function Estranho() {
  const checks: [string, string][] = [
    ["te4", "C01 · retorna um resumo não vazio"],
    ["te5", "C02 · identifica as ações acordadas"],
    ["te6", "C03 · não inventa informações"],
  ];
  return (
    <NaPagina p={P.estranho}>
      <Texto x={960} y={100} tam={58} ancora="middle" de={F("te1")}>
        {"o teste do *{estranho}"}
      </Texto>
      <Papel x={330} y={200} w={200} h={130} linhas={2} titulo="check" de={W("te2", "check")} />
      <Boneco x={170} y={420} s={56} roupa={claro.azul} de={W("te2", "duas pessoas")} />
      <Boneco x={690} y={420} s={56} roupa={claro.rosa} de={W("te2", "duas pessoas") + 0.2} />
      <Texto x={430} y={510} tam={34} cor={cor.cinza} ancora="middle" de={W("te2", "não se conhecem")}>
        não se conhecem
      </Texto>
      <Texto x={430} y={720} tam={42} ancora="middle" de={W("te2", "responder igual")}>
        responderiam igual?
      </Texto>
      <Etiqueta x={430} y={830} texto={'"depende" → mal escrito'} tam={40} preench={claro.vermelho} de={W("te2", "depende")} />
      <Linha pts={[[880, 170], [882, 1000]]} cor={claro.cinza} espessura={3} de={F("te3")} dur={0.3} />
      <Texto x={1000} y={210} tam={40} cor={cor.cinza} de={F("te3")}>
        os nossos três checks:
      </Texto>
      {checks.map(([id, txt], i) => (
        <Caixa key={id} x={960} y={250 + i * 190} w={880} h={150} texto={txt} tam={44} preench="#ffffff" de={F(id)} />
      ))}
      <Elipse cx={1400} cy={515} w={1000} h={250} cor={cor.laranja} espessura={4} de={F("te7")} dur={0.6} />
      <Texto x={1400} y={900} tam={44} cor={cor.laranja} ancora="middle" de={W("te7", "trabalho")}>
        este vai dar trabalho...
      </Texto>
    </NaPagina>
  );
}

function Pesos() {
  const linhas: [string, string, string, number][] = [
    ["ps2", "C01 · resumo não vazio", "faltar o resumo: todo mundo percebe", 1],
    ["ps3", "C02 · ações acordadas", "esquecer uma tarefa: alguém deixa de fazer", 2],
    ["ps4", "C03 · não inventa", "inventar um desconto: prejuízo, e ninguém desconfia", 3],
  ];
  return (
    <NaPagina p={P.pesos}>
      <Texto x={960} y={100} tam={58} ancora="middle" de={F("ps1")}>
        {"nem todo erro *{custa igual}"}
      </Texto>
      {linhas.map(([id, check, txt, peso], i) => (
        <React.Fragment key={id}>
          <Caixa x={80} y={190 + i * 210} w={480} h={140} texto={check} tam={38} preench="#ffffff" de={F(id)} />
          <Texto x={600} y={272 + i * 210} tam={34} de={F(id) + 0.3} dur={1.0}>
            {txt}
          </Texto>
          {Array.from({ length: peso }, (_, k) => (
            <Ret key={k} x={1560 + k * 85} y={225 + i * 210} w={72} h={90} redondo={false} preench={claro.laranja} de={W("ps5", ["vale um", "vale dois", "vale três"][i]) + k * 0.12} dur={0.25} />
          ))}
          <Texto x={1560} y={210 + i * 210} tam={32} de={W("ps5", ["vale um", "vale dois", "vale três"][i])}>
            {`peso ${peso}`}
          </Texto>
        </React.Fragment>
      ))}
      <Texto x={1720} y={890} tam={56} ancora="middle" de={W("ps5", "Total")}>
        {"total = *{6}"}
      </Texto>
      <Texto x={80} y={890} tam={40} cor={cor.verde} de={F("ps6")} dur={1.0}>
        decisão de negócio, tomada antes de ver qualquer resultado
      </Texto>
    </NaPagina>
  );
}

function CodigoJuiz() {
  const tOuro = F("cj3");
  return (
    <NaPagina p={P.codigoJuiz}>
      <Texto x={960} y={100} tam={58} ancora="middle" de={F("cj1")}>
        {"código ou *{juiz}?"}
      </Texto>
      <Etiqueta x={330} y={220} texto="C01 · resumo não vazio" tam={40} preench="#ffffff" hachura="solid" de={F("cj1")} />
      <Etiqueta x={700} y={220} texto="código" tam={36} preench={claro.azul} de={F("cj1") + 0.4} />
      <Codigo x={110} y={300} linhas={["len(resumo.strip()) > 0"]} tam={44} de={W("cj2", "Uma linha")} />
      {["de graça", "1 milissegundo", "sempre a mesma resposta"].map((t, i) => (
        <React.Fragment key={t}>
          <Check x={900} y={330 + i * 60} s={34} de={W("cj2", ["De graça", "milissegundo", "mesma resposta"][i])} />
          <Texto x={950} y={345 + i * 60} tam={38} de={W("cj2", ["De graça", "milissegundo", "mesma resposta"][i])}>
            {t}
          </Texto>
        </React.Fragment>
      ))}
      <Caixa x={110} y={530} w={1700} h={140} texto="se dá para verificar com código, verifique com código" tam={52} preench={claro.amarelo} de={tOuro} dur={0.6} />
      <Texto x={130} y={760} tam={40} cor={cor.azul} de={F("cj4")}>
        é código:
      </Texto>
      {["contar palavras", "campo obrigatório", "formato de data"].map((t, i) => (
        <React.Fragment key={t}>
          <Check x={140} y={830 + i * 70} s={32} de={W("cj4", ["Contar", "campo", "data"][i])} />
          <Texto x={190} y={845 + i * 70} tam={38} de={W("cj4", ["Contar", "campo", "data"][i])}>
            {t}
          </Texto>
        </React.Fragment>
      ))}
      <Texto x={900} y={760} tam={40} cor={cor.violeta} de={F("cj5")}>
        é juiz: o que exige entender texto
      </Texto>
      <Robo x={990} y={890} s={110} preench={claro.violeta} de={F("cj5") + 0.3} />
      <Balao x={1100} y={800} texto={"a ação aparece no resumo,\nmesmo com outras palavras?"} tam={36} ponta={[1050, 880]} de={W("cj5", "Por exemplo")} />
    </NaPagina>
  );
}

const BASELINE_JSON = [
  "{",
  '  "id": "resumo_comercial",',
  '  "versao": 1,',
  '  "congelado_em": "2026-11-10",',
  '  "checks": [',
  "    {",
  '      "id": "C02",',
  '      "description": "Identifica as ações acordadas",',
  '      "weight": 2,',
  '      "verified_by": "juiz",',
  '      "pass_condition": "O resumo identifica as ações...",',
  '      "evidence_required": ["conversa", "resumo"]',
  "    },",
  "    ...",
  "  ]",
  "}",
];

function Baseline() {
  const notas: [string, number, string, string][] = [
    ["bl2", 7, "nome curto · texto do relatório · peso", claro.azul],
    ["bl3", 9, "quem verifica: código ou juiz", claro.verde],
    ["bl4", 10, "a condição exata que o juiz confere", claro.amarelo],
    ["bl5", 11, "de onde tem que vir a prova", claro.rosa],
    ["bl6", 2, "versão + data: o envelope lacrado", claro.laranja],
  ];
  const alt = 28 * 1.42;
  const yl = (l: number) => 160 + 28 * 0.7 + l * alt + 20;
  return (
    <NaPagina p={P.baseline}>
      <Texto x={70} y={95} tam={46} de={F("bl1")}>
        {"o baseline, em *{JSON}"}
      </Texto>
      <Codigo
        x={60}
        y={160}
        linhas={BASELINE_JSON}
        lang="json"
        tam={28}
        titulo="baseline/resumo_comercial.v1.json"
        de={F("bl1") + 0.2}
        marcas={[
          { l: [6, 8], de: F("bl2"), ate: F("bl3") - 0.2, cor: claro.azul },
          { l: 9, de: F("bl3"), ate: F("bl4") - 0.2, cor: claro.verde },
          { l: 10, de: F("bl4"), ate: F("bl5") - 0.2 },
          { l: 11, de: F("bl5"), ate: F("bl6") - 0.2, cor: claro.rosa },
          { l: [1, 3], de: F("bl6"), cor: claro.laranja },
        ]}
      />
      {notas.map(([id, l, txt, preench]) => {
        const ySlot = { bl6: 240, bl2: 420, bl3: 560, bl4: 700, bl5: 840 }[id]!;
        return (
          <React.Fragment key={id}>
            <Seta desde={[1170, ySlot]} para={[1030, yl(l)]} de={F(id)} dur={0.3} />
            <Etiqueta x={1520} y={ySlot} texto={txt} tam={32} preench={preench} de={F(id) + 0.1} />
          </React.Fragment>
        );
      })}
    </NaPagina>
  );
}

function Evidencia() {
  return (
    <NaPagina p={P.evidencia}>
      <Texto x={960} y={100} tam={58} ancora="middle" de={F("ev1")}>
        {"o que é *{evidência}?"}
      </Texto>
      <Texto x={110} y={210} tam={36} cor={cor.cinza} de={F("ev2")}>
        avaliando código:
      </Texto>
      <Etiqueta x={330} y={290} texto="juiz.py, linha 42" tam={40} preench={claro.cinza} hachura="solid" de={W("ev2", "arquivo tal")} />
      <Texto x={110} y={430} tam={36} cor={cor.cinza} de={W("ev3", "texto")}>
        avaliando um texto: o trecho literal
      </Texto>
      <Caixa x={110} y={470} w={1040} h={120} texto={'conversa, linha 9: "No plano anual eu consigo 10% de desconto"'} tam={32} preench={claro.azul} de={W("ev3", "pedaço exato da conversa")} />
      <Seta desde={[630, 600]} para={[630, 680]} de={W("ev3", "pedaço exato do resumo") - 0.2} dur={0.3} />
      <Caixa x={110} y={690} w={1040} h={120} texto={'resumo: "No plano anual, Marina consegue 10% de desconto"'} tam={32} preench={claro.verde} de={W("ev3", "pedaço exato do resumo")} />
      <Texto x={1260} y={300} tam={48} de={W("ev4", "Literal")}>
        {"literal = *{letra por letra}"}
      </Texto>
      <Texto x={1260} y={420} tam={36} cor={cor.cinza} de={W("ev4", "Nada de")}>
        "ela disse algo parecido com..."
      </Texto>
      <Xis x={1520} y={408} s={80} espessura={6} de={W("ev4", "parecido") + 0.3} />
      <Lupa x={1400} y={680} s={140} de={W("ev5", "programa")} />
      <Texto x={1560} y={680} tam={40} de={W("ev5", "programa")} dur={0.8}>
        {"um programa\nconfere"}
      </Texto>
      <Texto x={1500} y={900} tam={56} cor={cor.verde} ancora="middle" de={W("ev5", "É o nosso")}>
        = o nosso replay
      </Texto>
    </NaPagina>
  );
}

export function ChecksBinarios() {
  return (
    <>
      <NaPagina p={P.cap3}>
        <Capitulo n="3" titulo="Critérios e checks binários" sub="requisito vago vira pergunta de sim ou não" de={F("t3")} />
      </NaPagina>
      <Conversa />
      <Checks />
      <Estranho />
      <Pesos />
      <CodigoJuiz />
      <Baseline />
      <Evidencia />
    </>
  );
}
