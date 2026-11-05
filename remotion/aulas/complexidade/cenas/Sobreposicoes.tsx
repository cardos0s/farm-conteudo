import React from "react";
import { AbsoluteFill } from "remotion";
import { Caminho, Ret, Seta } from "../../../lousa/Esboco";
import { claro, cor } from "../../../lousa/paleta";
import { Etiqueta } from "../../../lousa/Pecas";
import { progresso, useT } from "../../../lousa/tempo";
import { largura, Texto } from "../../../lousa/Texto";
import { FIM, pausas, S } from "../roteiro";

const s = (t: number) => S("3227", t);

function Brilho({ cx, cy, r, de, ate }: { cx: number; cy: number; r: number; de: number; ate: number }) {
  const d = `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;
  return <Caminho d={d} cor={cor.laranja} preench={claro.amarelo} hachura="solid" espessura={3} de={de} dur={0.3} ate={ate} />;
}

/** Anotações desenhadas por cima da câmera quando ela está em tela cheia. */
export function Sobreposicoes() {
  const fimTema = s(19.6);
  const fimApostila = s(86.9);
  const fimFund = s(94.6);
  const fimTitulo = s(101.2);
  const fimAnimado = s(126.4);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {/* tema da aula */}
        <Ret x={60} y={845} w={largura("Algoritmos e Estruturas de Dados", 50) + 80} h={175} preench="#ffffff" hachura="solid" de={s(14.85)} dur={0.45} ate={fimTema} />
        <Texto x={95} y={918} tam={50} de={s(14.95)} dur={0.7} ate={fimTema}>
          Algoritmos e Estruturas de Dados
        </Texto>
        <Texto x={95} y={980} tam={36} cor={cor.azul} de={s(15.5)} dur={0.7} ate={fimTema}>
          aula 1 · complexidade de algoritmos
        </Texto>
        {/* a apostila */}
        <Etiqueta x={700} y={115} texto="a apostila" tam={52} preench="#ffffff" hachura="solid" de={s(85.1)} dur={0.4} ate={fimApostila} />
        <Seta desde={[600, 170]} via={[500, 220]} para={[400, 320]} cor={cor.vermelho} espessura={5} de={s(85.3)} dur={0.4} ate={fimApostila} />
        {/* fundamentos */}
        <Etiqueta x={1600} y={110} texto="fundamentos" tam={46} preench={claro.amarelo} hachura="solid" de={s(89.6)} dur={0.4} ate={fimFund} />
        <Etiqueta x={1600} y={215} texto="arquitetura" tam={40} preench="#ffffff" hachura="solid" de={s(91.0)} dur={0.35} ate={fimFund} />
        <Etiqueta x={1600} y={305} texto="system design" tam={40} preench="#ffffff" hachura="solid" de={s(91.8)} dur={0.35} ate={fimFund} />
        {/* o tema, de fato */}
        <Ret x={70} y={55} w={largura("complexidade de algoritmos", 66) + 90} h={150} preench="#ffffff" hachura="solid" de={s(98.3)} dur={0.45} ate={fimTitulo} />
        <Texto x={110} y={152} tam={66} destaque={cor.azul} de={s(98.5)} dur={0.8} ate={fimTitulo}>
          {"complexidade de *{algoritmos}"}
        </Texto>
        {/* "vocês vão ver tudo animado" */}
        <Brilho cx={1480} cy={300} r={46} de={s(125.0)} ate={fimAnimado} />
        <Brilho cx={1650} cy={420} r={30} de={s(125.2)} ate={fimAnimado} />
        <Brilho cx={1430} cy={500} r={24} de={s(125.35)} ate={fimAnimado} />
        <Etiqueta x={1560} y={610} texto="animado!" tam={60} corTexto={cor.violeta} preench="#ffffff" hachura="solid" de={s(125.25)} dur={0.35} ate={fimAnimado} />
      </svg>
    </AbsoluteFill>
  );
}

/** Fechamento: depois da visão geral da lousa, o recado final e um fade para branco. */
export function Encerramento() {
  const t = useT();
  const de = pausas[5].de + 0.9;
  const branco = progresso(t, FIM - 0.55, 0.55);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Etiqueta x={960} y={500} texto="até a próxima aula!" tam={92} pad={34} preench={claro.amarelo} hachura="solid" de={de} dur={0.55} />
        <Etiqueta x={960} y={650} texto="Algoritmos e Estruturas de Dados · aula 1" tam={40} corTexto={cor.cinza} preench="#ffffff" hachura="solid" de={de + 0.45} dur={0.5} />
      </svg>
      {branco > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: branco }} />}
    </AbsoluteFill>
  );
}
