import React from "react";
import { AbsoluteFill } from "remotion";
import { Ret } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Etiqueta } from "../../../lousa/Pecas";
import { progresso, useT } from "../../../lousa/tempo";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { FIM, S, pausas } from "../roteiro";

const s = (t: number) => S("3583", t);

function PaginaRecap() {
  const itens: [string, number][] = [
    ["1. recursão: uma função chama a si mesma\n    para resolver problemas menores", 216.5],
    ["2. o *{caso-base} garante que as chamadas terminem", 222.8],
    ["3. o jeito de organizar as chamadas muda\n    drasticamente a eficiência", 226.6],
  ];
  const checklist: [string, number][] = [
    ["onde está o caso-base?", 241.6],
    ["onde está o passo recursivo?", 243.0],
    ["qual é a complexidade de tempo?", 244.2],
  ];
  return (
    <NaPagina p={P.recap}>
      <Texto x={110} y={150} tam={66} de={s(213.9)} dur={0.8}>
        recapitulando
      </Texto>
      {itens.map(([txt, t], i) => (
        <Texto key={i} x={110} y={250 + i * 105} tam={38} destaque={cor.verde} de={s(t)} dur={1.2}>
          {txt}
        </Texto>
      ))}
      <Caixa x={1200} y={210} w={620} h={220} texto={"próxima aula:\nmemoization e\nprogramação dinâmica"} tam={42} preench={claro.violeta} de={s(246.2)} dur={0.5} />
      {/* exercício */}
      <Ret x={110} y={600} w={1260} h={420} preench={claro.amarelo} vaoHachura={20} pesoHachura={1.6} de={s(231.5)} dur={0.6} />
      <Texto x={150} y={672} tam={50} cor={cor.laranja} de={s(231.8)} dur={0.5}>
        exercício
      </Texto>
      <Texto x={150} y={745} tam={36} de={s(233.2)} dur={1.6}>
        {"crie uma função recursiva que calcule o fatorial\nde um número inteiro não negativo. Depois, responda:"}
      </Texto>
      {checklist.map(([txt, t], i) => (
        <React.Fragment key={i}>
          <Ret x={160} y={858 + i * 52} w={30} h={30} redondo={false} de={s(t)} dur={0.2} />
          <Texto x={210} y={884 + i * 52} tam={34} de={s(t) + 0.1} dur={0.6}>
            {txt}
          </Texto>
        </React.Fragment>
      ))}
    </NaPagina>
  );
}

export function Fechamento() {
  return <PaginaRecap />;
}

/** Chamada para os comentários enquanto ela fala direto para a câmera, no fim. */
export function Sobreposicoes() {
  const de = s(253.6);
  const ate = pausas[5].de;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Etiqueta x={430} y={960} texto="poste sua solução nos comentários" tam={46} pad={26} preench="#ffffff" hachura="solid" de={de} dur={0.45} ate={ate} />
      </svg>
    </AbsoluteFill>
  );
}

/** Fechamento: visão geral da lousa, o recado final e um fade para branco. */
export function Encerramento() {
  const t = useT();
  const de = pausas[5].de + 0.9;
  const branco = progresso(t, FIM - 0.55, 0.55);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Etiqueta x={960} y={500} texto="até a próxima aula!" tam={92} pad={34} preench={claro.amarelo} hachura="solid" de={de} dur={0.55} />
        <Etiqueta x={960} y={650} texto="Algoritmos e Estruturas de Dados · aula 2" tam={40} corTexto={cor.cinza} preench="#ffffff" hachura="solid" de={de + 0.45} dur={0.5} />
      </svg>
      {branco > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: branco }} />}
    </AbsoluteFill>
  );
}
