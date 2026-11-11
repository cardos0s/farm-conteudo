import React from "react";
import { Elipse, Linha, Ret, Seta } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta, Marca } from "../../../lousa/Pecas";
import { largura, Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Brilho, Celular, Lupa } from "./desenhos";

// 01:13–02:17 · a frase da aula, o que é um LLM e a previsão da próxima palavra.

function Frase() {
  const t = F("f3");
  return (
    <NaPagina p={P.frase}>
      <Texto x={960} y={190} tam={46} cor={cor.cinza} ancora="middle" de={F("f1")}>
        a frase da aula
      </Texto>
      <Texto x={960} y={420} tam={130} ancora="middle" de={F("f2")} dur={0.9}>
        parecer certo
      </Texto>
      <Brilho x={480} y={310} s={30} de={F("f2") + 0.7} />
      <Brilho x={1450} y={340} s={22} de={F("f2") + 0.8} />
      {/* sinal de diferente, bem grande */}
      <Linha pts={[[880, 540], [1040, 540]]} cor={cor.vermelho} espessura={9} de={t} dur={0.25} />
      <Linha pts={[[880, 590], [1040, 590]]} cor={cor.vermelho} espessura={9} de={t + 0.2} dur={0.25} />
      <Linha pts={[[1000, 490], [920, 640]]} cor={cor.vermelho} espessura={9} de={t + 0.45} dur={0.25} />
      <Marca x={620} y={680} w={680} h={130} de={W("f3", "estar") + 0.2} dur={0.6} />
      <Texto x={960} y={780} tam={130} ancora="middle" de={W("f3", "estar")} dur={0.8}>
        estar certo
      </Texto>
      <Lupa x={1450} y={720} s={100} de={FIM_DE("f3")} />
    </NaPagina>
  );
}

function Llm() {
  const letras: [string, string, string, number][] = [
    ["L", "Large", "grande", W("l3", "grande")],
    ["L", "Language", "linguagem", W("l3", "linguagem")],
    ["M", "Model", "modelo", W("l3", "modelo")],
  ];
  const livros: [string, string][] = [
    ["livros", claro.vermelho],
    ["sites", claro.azul],
    ["documentos", claro.verde],
    ["conversas", claro.amarelo],
  ];
  // rede neural dentro do modelo: 3 colunas de nós
  const colunas = [3, 4, 3].map((n, c) => Array.from({ length: n }, (_, i) => [810 + c * 120, 845 - ((n - 1) * 60) / 2 + i * 60] as [number, number]));
  const tRede = FIM_DE("l5") - 0.8;
  return (
    <NaPagina p={P.llm}>
      <Texto x={960} y={110} tam={54} ancora="middle" de={F("l1")} dur={1.2}>
        {"antes de avaliar: o que é um *{LLM}?"}
      </Texto>
      {letras.map(([l, en, pt, t], i) => (
        <React.Fragment key={i}>
          <Texto x={560 + i * 400} y={320} tam={170} ancora="middle" cor={cor.azul} de={F("l3") + 0.1 + i * 0.2} dur={0.3}>
            {l}
          </Texto>
          <Texto x={560 + i * 400} y={385} tam={40} ancora="middle" cor={cor.cinza} de={F("l3") + 0.6 + i * 0.2}>
            {en}
          </Texto>
          <Texto x={560 + i * 400} y={450} tam={54} ancora="middle" de={t}>
            {pt}
          </Texto>
        </React.Fragment>
      ))}
      <Texto x={960} y={545} tam={40} cor={cor.cinza} ancora="middle" de={F("l4")} dur={1.4}>
        o programa por trás dos assistentes de IA que você já usa
      </Texto>

      {/* treino: muito texto → modelo → próxima palavra */}
      {livros.map(([nome, preench], i) => (
        <Caixa
          key={nome}
          x={130 + (i % 2) * 24}
          y={930 - i * 72}
          w={330}
          h={62}
          texto={nome}
          tam={34}
          preench={preench}
          de={i === 0 ? F("l5", 0.35) : W("l5", nome) - 0.1}
          dur={0.35}
          atrasoTexto={0.15}
        />
      ))}
      <Texto x={295} y={690} tam={36} cor={cor.cinza} ancora="middle" de={W("l5", "quantidade")}>
        muito texto
      </Texto>
      <Seta desde={[500, 845]} para={[660, 845]} de={tRede - 0.3} dur={0.4} />
      <Texto x={580} y={825} tam={30} cor={cor.cinza} ancora="middle" de={tRede - 0.1}>
        treino
      </Texto>
      <Ret x={680} y={690} w={500} h={310} preench={claro.violeta} de={tRede} dur={0.6} />
      {colunas[0].flatMap((a, i) =>
        colunas[1].map((b, j) => <Linha key={`a${i}${j}`} pts={[a, b]} cor={cor.cinza} espessura={1.6} de={tRede + 0.7 + (i + j) * 0.03} dur={0.15} />),
      )}
      {colunas[1].flatMap((a, i) =>
        colunas[2].map((b, j) => <Linha key={`b${i}${j}`} pts={[a, b]} cor={cor.cinza} espessura={1.6} de={tRede + 0.9 + (i + j) * 0.03} dur={0.15} />),
      )}
      {colunas.flat().map(([x, y], i) => (
        <Elipse key={i} cx={x} cy={y} w={34} h={34} preench="#ffffff" hachura="solid" espessura={2.5} de={tRede + 0.5 + i * 0.04} dur={0.2} />
      ))}
      <Texto x={930} y={1050} tam={36} ancora="middle" de={tRede + 0.6}>
        modelo
      </Texto>
      <Seta desde={[1200, 845]} para={[1330, 845]} de={F("l7")} dur={0.4} />
      <Caixa x={1350} y={725} w={480} h={240} texto={"prevê a\n*{próxima palavra}"} tam={54} preench={claro.amarelo} de={W("l7", "próxima")} dur={0.6} />
    </NaPagina>
  );
}

function Proxima() {
  const frase = "O plano anual tem 10% de";
  const xBranco = 150 + largura(frase, 76) + 30;
  const barras: [string, number][] = [
    ["desconto", 0.71],
    ["carência", 0.11],
    ["juros", 0.08],
    ["multa", 0.05],
  ];
  const tBarras = FIM_DE("x2") + 0.1;
  const tPalavra = W("x3", "desconto");
  // corrente de palavras, uma após a outra
  const palavras = ["O", "plano", "anual", "tem", "10%", "de", "desconto", "no", "plano", "anual"];
  let cursor = 150;
  const corrente = palavras.flatMap((p, i) => {
    const w = largura(p, 36) + 40;
    const x = cursor;
    cursor += w + 18;
    return x + w > 1390 ? [] : [{ p, x: x + w / 2, i }];
  });
  return (
    <NaPagina p={P.proxima}>
      <Texto x={150} y={120} tam={44} cor={cor.cinza} de={F("x1")}>
        por exemplo:
      </Texto>
      <Texto x={150} y={240} tam={76} de={F("x2")} dur={1.6}>
        {frase}
      </Texto>
      <Linha pts={[[xBranco, 252], [xBranco + 330, 250]]} cor={cor.laranja} espessura={5} de={FIM_DE("x2") - 0.1} dur={0.3} />
      <Texto x={xBranco + 165} y={232} tam={76} cor={cor.laranja} ancora="middle" de={FIM_DE("x2") + 0.2} ate={tPalavra}>
        ?
      </Texto>
      <Texto x={xBranco + 165} y={240} tam={76} cor={cor.verde} ancora="middle" de={tPalavra + 0.15} dur={0.5}>
        desconto
      </Texto>

      {barras.map(([p, v], i) => (
        <React.Fragment key={p}>
          <Texto x={420} y={395 + i * 92} tam={46} ancora="end" de={tBarras + i * 0.18}>
            {p}
          </Texto>
          <Ret x={450} y={355 + i * 92} w={Math.max(30, v * 900)} h={58} redondo={false} preench={i === 0 ? claro.verde : claro.cinza} cor={i === 0 ? cor.verde : cor.tinta} de={tBarras + i * 0.18} dur={0.4} />
          <Texto x={470 + Math.max(30, v * 900)} y={395 + i * 92} tam={38} cor={cor.cinza} de={tBarras + i * 0.18 + 0.3}>
            {`${Math.round(v * 100)}%`}
          </Texto>
        </React.Fragment>
      ))}
      <Ret x={150} y={340} w={1060} h={88} cor={cor.verde} espessura={4} de={tPalavra} dur={0.4} />
      <Texto x={450} y={735} tam={26} cor={cor.cinza} de={tBarras + 0.8}>
        (probabilidades ilustrativas)
      </Texto>

      <Texto x={150} y={860} tam={40} de={F("x5")} dur={1.0}>
        {"palavra por palavra → *{um texto inteiro}"}
      </Texto>
      {corrente.map(({ p, x, i }) => (
        <Etiqueta
          key={i}
          x={x}
          y={950}
          texto={p}
          tam={36}
          pad={20}
          preench={p === "desconto" ? claro.verde : "#ffffff"}
          hachura="solid"
          espessura={2.4}
          de={F("x4") + i * 0.32}
          dur={0.25}
        />
      ))}
      <Texto x={cursor > 1390 ? 1400 : cursor} y={965} tam={44} cor={cor.cinza} de={F("x4") + corrente.length * 0.32}>
        ...
      </Texto>

      {/* autocompletar do celular */}
      <Celular x={1490} y={280} w={300} h={520} tela="#ffffff" de={F("x6")} />
      <Texto x={1515} y={360} tam={28} de={F("x6") + 0.4}>
        o plano anual tem
      </Texto>
      {["desconto", "preço", "juros"].map((s, i) => (
        <React.Fragment key={s}>
          <Ret x={1505 + i * 90} y={560} w={88} h={50} redondo={false} preench={i === 0 ? claro.verde : claro.cinza} hachura="solid" espessura={1.6} de={F("x6") + 0.6 + i * 0.1} dur={0.2} />
          <Texto x={1549 + i * 90} y={593} tam={i === 0 ? 20 : 22} ancora="middle" de={F("x6") + 0.7 + i * 0.1}>
            {s}
          </Texto>
        </React.Fragment>
      ))}
      {[0, 1, 2].map((r) =>
        Array.from({ length: 6 - (r === 2 ? 1 : 0) }, (_, c) => (
          <Ret key={`${r}${c}`} x={1512 + c * 44 + (r === 2 ? 22 : 0)} y={630 + r * 46} w={36} h={38} redondo={false} espessura={1.4} de={F("x6") + 0.9 + (r * 6 + c) * 0.02} dur={0.1} />
        )),
      )}
      <Texto x={1640} y={850} tam={36} ancora="middle" de={W("x6", "celular")}>
        autocompletar
      </Texto>
      <Texto x={1640} y={905} tam={40} cor={cor.laranja} ancora="middle" de={W("x6", "gigantesco")}>
        só que gigantesco
      </Texto>
    </NaPagina>
  );
}

export function OQueELlm() {
  return (
    <>
      <Frase />
      <Llm />
      <Proxima />
    </>
  );
}
