import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { analisar } from "../../lousa/Texto";
import { FONTE_UI, ui } from "../../lousa/Janelas";
import { progresso, saida, useT } from "../../lousa/tempo";
import { Texto } from "../../lousa/Texto";
import { LEGENDA, TELA } from "./regioes";
import { FIM, LEGENDAS, PARTES } from "./roteiro";

// Por cima do canvas: o painel da legenda (o texto do post, frase a frase) e as notas grandes.

const entrar = Easing.out(Easing.back(1.4));
const TAM = 44;
const BARRA = 50;

/** Uma frase da legenda: as palavras entram em sequência, com um leve deslize para cima. */
function Frase({ texto, de, ate }: { texto: string; de: number; ate?: number }) {
  const t = useT();
  if (t < de) return null;
  const alfa = saida(t, ate, 0.2);
  if (alfa <= 0) return null;
  const linhas = texto.split("\n");
  const y0 = LEGENDA.y + BARRA + (LEGENDA.h - BARRA) / 2 - ((linhas.length - 1) * TAM * 1.3) / 2 + TAM * 0.36;
  let n = 0;
  return (
    <g opacity={alfa}>
      {linhas.map((linha, li) => (
        <text key={li} x={LEGENDA.x + LEGENDA.w / 2} y={y0 + li * TAM * 1.3} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={TAM} style={{ whiteSpace: "pre" }}>
          {analisar(linha).flatMap((p, pi) =>
            p.txt.split(/(?<= )/).map((palavra, wi) => {
              const q = progresso(t, de + n++ * 0.045, 0.22);
              return (
                <tspan key={`${pi}-${wi}`} fill={p.forte ? ui.rosa : ui.texto} fillOpacity={q}>
                  {palavra}
                </tspan>
              );
            }),
          )}
        </text>
      ))}
    </g>
  );
}

/** Painel fixo embaixo do canvas, com a parte atual na barra e uma barrinha de progresso. */
function PainelLegenda() {
  const t = useT();
  const { x, y, w, h } = LEGENDA;
  const e = progresso(t, 0, 0.4, entrar);
  const parte = [...PARTES].reverse().find((p) => t >= p.t) ?? PARTES[0];
  const trocou = progresso(t, parte.t, 0.3);
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${0.92 + 0.08 * e}) translate(${-cx} ${-cy})`} opacity={Math.min(1, t / 0.2)}>
      <rect x={x} y={y} width={w} height={h} rx={18} fill="#ffffff" stroke={ui.borda} strokeWidth={1.6} style={{ filter: "drop-shadow(0 12px 22px rgba(30, 30, 25, 0.14))" }} />
      <path d={`M${x + 1} ${y + BARRA} V${y + 18} Q${x + 1} ${y + 1} ${x + 18} ${y + 1} H${x + w - 18} Q${x + w - 1} ${y + 1} ${x + w - 1} ${y + 18} V${y + BARRA} Z`} fill={ui.barra} />
      <line x1={x} y1={y + BARRA} x2={x + w} y2={y + BARRA} stroke={ui.linha} strokeWidth={1.5} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 24 + i * 20} cy={y + BARRA / 2} r={6} fill="#dedfd8" />
      ))}
      <circle cx={x + 94} cy={y + BARRA / 2} r={7} fill={ui.rosa} />
      <text x={x + 110} y={y + BARRA / 2 + 8} fontFamily={FONTE_UI} fontWeight={700} fontSize={23} fill={ui.texto} opacity={trocou}>
        {parte.rotulo}
      </text>
      {/* progresso do vídeo */}
      <rect x={x + 24} y={y + h - 16} width={w - 48} height={5} rx={2.5} fill={ui.linha} />
      <rect x={x + 24} y={y + h - 16} width={(w - 48) * Math.min(1, t / FIM)} height={5} rx={2.5} fill={ui.rosa} />
    </g>
  );
}

/** Nota adesiva grande colada por cima do canvas, para destacar uma frase. */
function NotaTela({ x, y, w, h, de, ate, girar = -1.5, children }: { x: number; y: number; w: number; h: number; de: number; ate?: number; girar?: number; children: React.ReactNode }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.4, entrar);
  const alfa = Math.min(1, (t - de) / 0.2) * saida(t, ate, 0.3);
  if (alfa <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={alfa} transform={`rotate(${girar} ${cx} ${cy}) translate(${cx} ${cy}) scale(${0.88 + 0.12 * p}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#fff3bf" style={{ filter: "drop-shadow(0 18px 30px rgba(60, 50, 0, 0.22))" }} />
      <rect x={x} y={y} width={w} height={16} rx={6} fill="rgba(0,0,0,0.035)" />
      {children}
    </g>
  );
}

export function Sobreposicoes() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        {/* "O cliente virou parte do processo de suporte." */}
        <NotaTela x={110} y={500} w={860} h={330} de={29.3} ate={32.2} girar={-1.8}>
          <Texto x={540} y={620} tam={60} ancora="middle" de={29.45} dur={0.7}>
            o cliente virou
          </Texto>
          <Texto x={540} y={730} tam={72} cor={ui.rosa} ancora="middle" de={30.2} dur={0.8}>
            parte do suporte
          </Texto>
        </NotaTela>
        {/* "O gargalo deixa de ser tecnológico e vira operacional." */}
        <NotaTela x={130} y={470} w={820} h={360} de={78.2} ate={81.6} girar={1.6}>
          <Texto x={540} y={590} tam={58} ancora="middle" de={78.35} dur={0.6}>
            o gargalo vira
          </Texto>
          <Texto x={540} y={706} tam={80} cor={ui.rosa} ancora="middle" de={79.0} dur={0.8}>
            operacional
          </Texto>
        </NotaTela>
        <PainelLegenda />
        {LEGENDAS.map((l, i) => (
          <Frase key={i} texto={l.texto} de={l.de} ate={l.ate ?? LEGENDAS[i + 1]?.de ?? FIM + 1} />
        ))}
      </svg>
    </AbsoluteFill>
  );
}
