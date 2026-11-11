import React from "react";
import { Caminho, Check, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { Capitulo, Codigo, Terminal } from "../../../lousa/Codigo";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta, Marca } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Envelope, Lupa, Pontos } from "./desenhos";

// Parte 5: três execuções do mesmo resumo, a leitura do relatório, a investigação, a v2 do baseline,
// a prova falsa pega pelos gates e por que a média não basta.

const l = (txt: string, de: number) => ({ txt, de });

function TresVezes() {
  const t = F("bm2") + 1.0;
  const linhas = [
    l("{c:$} python avaliar.py --caso incompleto --execucoes 3 --gravado", F("bm2")),
    l("Execução 1   C01 ✓  C02 ✗  C03 ✓   score {a:0.6667}", t),
    l("Execução 2   C01 ✓  C02 ✗  C03 ✓   score {a:0.6667}", t + 0.5),
    l("Execução 3   C01 ✓  C02 ✓  C03 ✓   score {v:1.0000}", t + 1.0),
    l("", t + 1.2),
    l("{b:Benchmark}", t + 1.4),
    l("  Run 1  {a:█████████████}░░░░░░░  0.6667", t + 1.6),
    l("  Run 2  {a:█████████████}░░░░░░░  0.6667", t + 1.8),
    l("  Run 3  {v:████████████████████}  1.0000", t + 2.0),
  ];
  const alt = 30 * 1.4;
  return (
    <NaPagina p={P.tresVezes}>
      <Texto x={70} y={110} tam={46} de={F("bm1")}>
        {"o mesmo resumo, *{três vezes}"}
      </Texto>
      <Terminal x={60} y={170} w={1300} linhas={linhas} tam={30} de={F("bm2")} />
      <Etiqueta x={1640} y={260} texto={"ilustrativo:\nrespostas preparadas\npara a aula"} tam={34} preench={claro.laranja} de={W("bm3", "aviso")} />
      <Texto x={1640} y={420} tam={30} cor={cor.cinza} ancora="middle" de={W("bm3", "acontece de verdade")} dur={0.8}>
        {"o comportamento\nacontece de verdade"}
      </Texto>
      <Ret x={50} y={170 + 50 + 3 * alt - 4} w={1320} h={alt + 4} redondo={false} cor={cor.verde} espessura={4} de={W("bm4", "terceira")} dur={0.4} />
      <Texto x={1400} y={170 + 50 + 3 * alt + 30} tam={40} cor={cor.verde} de={W("bm4", "nota máxima")}>
        ← nota máxima?!
      </Texto>
      <Texto x={960} y={820} tam={44} ancora="middle" de={W("bm4", "Mesmo resumo")} dur={1.2}>
        mesmo resumo · mesmo baseline · mesmo juiz
      </Texto>
    </NaPagina>
  );
}

function Detetive() {
  const votos: [string, boolean[]][] = [
    ["C01", [true, true, true]],
    ["C02", [false, false, true]],
    ["C03", [true, true, true]],
  ];
  return (
    <NaPagina p={P.detetive}>
      <Texto x={70} y={100} tam={50} de={F("dt1")}>
        {"lendo o relatório como *{detetive}"}
      </Texto>
      <Lupa x={1780} y={90} s={90} de={F("dt1")} />
      <Pontos x={240} y={480} w={780} valores={[0.6667, 0.6667, 1.0]} media={0.7778} de={F("dt2")} />
      <Texto x={630} y={640} tam={36} cor={cor.vermelho} ancora="middle" de={W("dt2", "nenhuma execução")}>
        nenhuma execução deu 0,78!
      </Texto>
      <Texto x={630} y={720} tam={36} ancora="middle" de={F("dt3")} dur={1.0}>
        {"desvio 0,16: o quanto as notas *{se espalham}"}
      </Texto>
      <Texto x={1280} y={210} tam={40} de={F("dt4")}>
        concordância por check
      </Texto>
      {votos.map(([c, v], i) => (
        <React.Fragment key={c}>
          <Texto x={1280} y={320 + i * 120} tam={46} de={W("dt4", ["C zero um", "C zero dois", "C zero três"][i])}>
            {c}
          </Texto>
          {v.map((ok, k) =>
            ok ? (
              <Check key={k} x={1430 + k * 70} y={308 + i * 120} s={40} de={W("dt4", ["C zero um", "C zero dois", "C zero três"][i]) + k * 0.15} />
            ) : (
              <Xis key={k} x={1450 + k * 70} y={306 + i * 120} s={36} de={W("dt4", ["C zero um", "C zero dois", "C zero três"][i]) + k * 0.15} />
            ),
          )}
          <Texto x={1680} y={320 + i * 120} tam={42} cor={i === 1 ? cor.vermelho : cor.verde} de={W("dt4", i === 1 ? "sessenta e sete" : "cem por cento")}>
            {i === 1 ? "67%" : "100%"}
          </Texto>
        </React.Fragment>
      ))}
      <Elipse cx={1500} cy={428} w={560} h={120} cor={cor.vermelho} espessura={4} de={F("dt5")} dur={0.5} />
      <Etiqueta x={1500} y={620} texto="o problema tem endereço: C02" tam={42} preench={claro.vermelho} de={W("dt5", "endereço")} />
      <Texto x={960} y={960} tam={40} cor={cor.cinza} ancora="middle" de={W("dt2", "esconde")}>
        a média esconde o que aconteceu
      </Texto>
    </NaPagina>
  );
}

function Raciocinio() {
  const execs: [string, string, boolean][] = [
    ["rc2", "Execução 1 · C02 não passou: \"traz só o envio da proposta. Faltam o\nretorno sobre o desconto e a demonstração.\"", false],
    ["rc3", "Execução 2 · C02 não passou: \"só menciona a proposta; a demonstração\ne o retorno ficaram de fora.\"", false],
    ["rc4", "Execução 3 · C02 passou: \"identifica a ação acordada de enviar a\nproposta por e-mail.\"", true],
  ];
  return (
    <NaPagina p={P.raciocinio}>
      <Texto x={70} y={95} tam={46} de={F("rc1")}>
        {"o *{raciocínio} do juiz no C02"}
      </Texto>
      {execs.map(([id, txt, ok], i) => (
        <Caixa key={id} x={60} y={140 + i * 150} w={1300} h={130} texto={txt} tam={30} preench={ok ? claro.laranja : "#ffffff"} de={F(id)} />
      ))}
      <Texto x={1640} y={250} tam={40} ancora="middle" de={F("rc5")}>
        quem está certo?
      </Texto>
      <Marca x={850} y={600} w={300} h={70} de={W("rc6", "Identifica uma")} />
      <Texto x={960} y={650} tam={60} ancora="middle" de={W("rc5", "identifica as ações")}>
        "identifica as ações acordadas"
      </Texto>
      <Etiqueta x={620} y={780} texto="algumas?" tam={48} preench={claro.laranja} de={W("rc6", "Identifica uma")} />
      <Etiqueta x={1300} y={780} texto="todas?" tam={48} preench={claro.verde} de={W("rc6", "identifica todas")} />
      {/* a régua torta */}
      <Caminho d="M300 930 Q960 860 1620 960 L1615 1010 Q960 910 305 980 Z" preench={claro.amarelo} de={W("rc7", "régua")} dur={0.6} />
      {Array.from({ length: 12 }, (_, k) => {
        const x = 360 + k * 110;
        const y = 935 + Math.pow((x - 960) / 660, 2) * 40 - 20;
        return <Linha key={k} pts={[[x, y], [x, y + 22]]} espessura={2} de={W("rc7", "régua") + 0.3 + k * 0.03} dur={0.1} />;
      })}
      <Texto x={960} y={1060} tam={44} cor={cor.vermelho} ancora="middle" de={W("rc7", "torta")}>
        a régua estava torta
      </Texto>
    </NaPagina>
  );
}

function Investigacao() {
  const qs: [string, string, string][] = [
    ["iv2", "qual check variou?", "C02 (concordância)"],
    ["iv3", "o que o juiz disse em cada execução?", "duas leituras de \"as ações\""],
    ["iv4", "as evidências são válidas?", "sim: nenhum alerta dos gates"],
    ["iv5", "a causa está no critério, no caso ou no prompt?", "no critério"],
  ];
  return (
    <NaPagina p={P.investigacao}>
      <Texto x={960} y={100} tam={56} ancora="middle" de={F("iv1")}>
        {"a *{investigação}"}
      </Texto>
      {qs.map(([id, q, r], i) => (
        <React.Fragment key={id}>
          <Elipse cx={130} cy={240 + i * 200} w={70} h={70} preench="#ffffff" hachura="solid" de={F(id)} dur={0.25} />
          <Texto x={130} y={256 + i * 200} tam={42} ancora="middle" de={F(id) + 0.1}>
            {String(i + 1)}
          </Texto>
          <Caixa x={200} y={180 + i * 200} w={980} h={120} texto={q} tam={38} preench="#ffffff" de={F(id)} />
          <Seta desde={[1200, 240 + i * 200]} para={[1270, 240 + i * 200]} de={F(id) + 0.8} dur={0.3} />
          <Texto x={1290} y={254 + i * 200} tam={38} cor={i === 3 ? cor.vermelho : cor.verde} de={F(id) + 1.0}>
            {r}
          </Texto>
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

function V2() {
  const tRodar = F("v2e");
  return (
    <NaPagina p={P.v2}>
      <Texto x={70} y={95} tam={46} de={F("v2a")}>
        {"consertando a *{régua}"}
      </Texto>
      <Codigo
        x={60}
        y={160}
        linhas={['v1: "O resumo identifica as ações acordadas na conversa."']}
        lang="texto"
        tam={26}
        de={F("v2a") + 0.3}
        marcas={[{ l: 0, de: F("v2a") + 0.6, cor: claro.vermelho }]}
      />
      <Codigo
        x={60}
        y={290}
        linhas={[
          'v2: "Primeiro liste todas as ações combinadas na conversa.',
          "     O check só passa se CADA uma delas aparecer no resumo.",
          '     Se faltar uma única ação, o check falha."',
        ]}
        lang="texto"
        tam={26}
        de={F("v2b")}
        marcas={[
          { l: 0, de: W("v2b", "listar"), cor: claro.verde },
          { l: 1, de: W("v2b", "cada uma"), cor: claro.verde },
          { l: 2, de: W("v2b", "o que reprova"), cor: claro.amarelo },
        ]}
      />
      <Etiqueta x={1520} y={360} texto={"um bom check diz\no que *{reprova}"} tam={42} preench={claro.amarelo} de={F("v2c")} />
      <Envelope x={120} y={520} w={240} h={150} lacre="v1" de={W("v2d", "não editei")} />
      <Texto x={240} y={720} tam={32} cor={cor.cinza} ancora="middle" de={W("v2d", "não editei")}>
        intocada
      </Texto>
      <Seta desde={[390, 595]} para={[520, 595]} de={W("v2d", "Criei")} dur={0.3} />
      <Envelope x={540} y={520} w={240} h={150} lacre="v2" de={W("v2d", "Criei")} />
      <Texto x={850} y={570} tam={32} de={W("v2d", "um campo")}>
        "mudancas": o que mudou e por quê
      </Texto>
      <Texto x={850} y={640} tam={32} cor={cor.vermelho} de={W("v2d", "incomparáveis")}>
        editar a v1 = resultados antigos incomparáveis
      </Texto>
      <Terminal
        x={60}
        y={790}
        w={1300}
        tam={28}
        titulo="baseline v2 · 3 execuções"
        linhas={[
          l("concordância  C01 {v:100%}  C02 {v:100%}  C03 {v:100%}", tRodar + 0.3),
          l("{v:nenhum check instável}", tRodar + 0.8),
        ]}
        de={tRodar}
      />
      <Texto x={1620} y={880} tam={34} cor={cor.cinza} ancora="middle" de={F("v2f")} dur={1.0}>
        {"3 execuções: bom sinal,\nnão prova. No desafio: 5"}
      </Texto>
    </NaPagina>
  );
}

function ProvaFalsa() {
  const t = F("pf2");
  const linhas = [
    l("Execução 2   C01 ✓  C02 ✗  C03 ✗   score {v:0.1667}  {c:(o juiz sozinho daria 0.6667)}", t),
    l("    {a:! C03: rebaixado: o juiz aprovou sem evidência válida da conversa}", W("pf3", "não existe")),
    l('      não existe na conversa: {r:"consigo 15% de desconto no plano anual"}', W("pf3", "não existe") + 0.4),
    l("corrigidos pelos gates: {a:Run 2 C03}", F("pf5")),
  ];
  return (
    <NaPagina p={P.provaFalsa}>
      <Texto x={70} y={95} tam={46} de={F("pf1")}>
        {"a *{prova falsa}"}
      </Texto>
      <Terminal x={60} y={140} w={1800} linhas={linhas} tam={28} de={F("pf1") + 0.5} />
      <Etiqueta x={500} y={500} texto={'juiz citou:\n"consigo 15% de desconto"'} tam={38} preench={claro.vermelho} de={W("pf3", "citou")} />
      <Xis x={820} y={470} s={60} de={W("pf3", "não existe")} />
      <Etiqueta x={1400} y={500} texto={'conversa, linha 9:\n"consigo 10% de desconto"'} tam={38} preench={claro.verde} de={W("pf3", "disse dez")} />
      <Texto x={960} y={660} tam={44} cor={cor.vermelho} ancora="middle" de={W("pf3", "alucinou")}>
        o juiz alucinou a própria prova
      </Texto>
      <Texto x={560} y={830} tam={90} cor={cor.cinza} ancora="middle" de={W("pf4", "Sem o gate")}>
        0,67
      </Texto>
      <Texto x={560} y={890} tam={34} cor={cor.cinza} ancora="middle" de={W("pf4", "Sem o gate")}>
        sem o gate
      </Texto>
      <Seta desde={[760, 800]} para={[1120, 800]} cor={cor.verde} espessura={4} de={W("pf4", "Com o gate")} dur={0.4} />
      <Texto x={1340} y={830} tam={90} cor={cor.verde} ancora="middle" de={W("pf4", "Com o gate")}>
        0,17
      </Texto>
      <Texto x={1340} y={890} tam={34} cor={cor.verde} ancora="middle" de={W("pf4", "Com o gate")}>
        com o gate (o certo)
      </Texto>
      <Texto x={960} y={1020} tam={38} ancora="middle" de={W("pf5", "escondesse")} dur={1.0}>
        {"o erro do juiz também é *{instabilidade}: o relatório não esconde"}
      </Texto>
    </NaPagina>
  );
}

function Media() {
  const itens: [string, string][] = [
    ["concordância entre execuções, por check", "concordância"],
    ["quais checks estão instáveis", "instáveis"],
    ["quantas vezes os gates corrigiram o juiz", "corrigir"],
  ];
  return (
    <NaPagina p={P.media}>
      <Texto x={960} y={100} tam={54} ancora="middle" de={F("md1")}>
        {"a média é útil, mas *{não basta}"}
      </Texto>
      <Pontos x={420} y={420} w={900} valores={[0.7778, 0.7778, 0.7778]} media={0.7778} rotulo="agente A" corPonto={cor.verde} de={W("md2", "agente A")} />
      <Pontos x={420} y={760} w={900} valores={[0.6667, 0.6667, 1.0]} media={0.7778} rotulo="agente B" corPonto={cor.laranja} de={W("md2", "agente B")} />
      <Texto x={1640} y={340} tam={36} cor={cor.verde} ancora="middle" de={W("md3", "concorda")}>
        {"sempre igual"}
      </Texto>
      <Texto x={1640} y={680} tam={36} cor={cor.laranja} ancora="middle" de={W("md3", "oscilando")}>
        {"oscilando"}
      </Texto>
      <Texto x={1640} y={250} tam={34} cor={cor.cinza} ancora="middle" de={W("md3", "Mesma média")}>
        mesma média
      </Texto>
      <Texto x={110} y={960} tam={40} de={F("md4")}>
        além da média, acompanhe:
      </Texto>
      {itens.map(([txt, p], i) => (
        <React.Fragment key={txt}>
          <Check x={1000} y={880 + i * 62} s={32} de={W("md4", p)} />
          <Texto x={1050} y={894 + i * 62} tam={34} de={W("md4", p)}>
            {txt}
          </Texto>
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

export function Benchmark() {
  return (
    <>
      <NaPagina p={P.cap5}>
        <Capitulo n="5" titulo="Benchmark com três execuções" sub="comparar, achar a variação e descobrir por quê" de={F("t5")} />
      </NaPagina>
      <TresVezes />
      <Detetive />
      <Raciocinio />
      <Investigacao />
      <V2 />
      <ProvaFalsa />
      <Media />
    </>
  );
}
