import React from "react";
import { Easing } from "remotion";
import { Elipse, Linha } from "../../lousa/Esboco";
import { FONTE_UI, ui } from "../../lousa/Janelas";
import { tinta } from "../../lousa/paleta";
import { progresso, saida, useT } from "../../lousa/tempo";

// Peças próprias do Reel do Pix: o relógio e as pílulas de status.

const entrar = Easing.out(Easing.back(1.5));

/** Relógio desenhado à mão cujos ponteiros giram enquanto o tempo "passa". */
export function Relogio({ cx, cy, r = 80, de, gira }: { cx: number; cy: number; r?: number; de: number; gira: [number, number] }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, gira[0], gira[1] - gira[0], (x) => x);
  const minuto = -Math.PI / 2 + p * Math.PI * 2 * 3;
  const hora = -Math.PI / 2 + p * Math.PI;
  const ponteiro = (ang: number, comp: number, esp: number, cor: string) => (
    <line x1={cx} y1={cy} x2={cx + Math.cos(ang) * comp} y2={cy + Math.sin(ang) * comp} stroke={cor} strokeWidth={esp} strokeLinecap="round" />
  );
  const marcas = progresso(t, de + 0.4, 0.3);
  return (
    <>
      <Elipse cx={cx} cy={cy} w={r * 2} h={r * 2} espessura={4} preench="#fff5f5" hachura="solid" de={de} dur={0.5} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return <Linha key={i} pts={[[cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78], [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92]]} espessura={3} de={de + 0.35 + i * 0.05} dur={0.1} />;
      })}
      <g opacity={marcas}>
        {ponteiro(hora, r * 0.45, 7, tinta)}
        {ponteiro(minuto, r * 0.7, 5, ui.vermelho)}
        <circle cx={cx} cy={cy} r={7} fill={tinta} />
      </g>
    </>
  );
}

/** Pílula de status (ex.: "paga", "expirada"). (x, y) é o canto esquerdo da linha de base. */
export function Status({ x, y, texto, cor, fundo, de, ate, tam = 22 }: { x: number; y: number; texto: string; cor: string; fundo: string; de: number; ate?: number; tam?: number }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.3, entrar);
  const alfa = Math.min(1, (t - de) / 0.15) * saida(t, ate, 0.25);
  if (alfa <= 0) return null;
  const w = [...texto].length * tam * 0.6 + tam * 1.2;
  const h = tam * 1.6;
  return (
    <g opacity={alfa} transform={`translate(${x + w / 2} ${y - tam * 0.36}) scale(${0.8 + 0.2 * p}) translate(${-(x + w / 2)} ${-(y - tam * 0.36)})`}>
      <rect x={x} y={y - tam * 0.36 - h / 2} width={w} height={h} rx={h / 2} fill={fundo} />
      <text x={x + w / 2} y={y} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={tam} fill={cor}>
        {texto}
      </text>
    </g>
  );
}

export const PAGA = { cor: ui.verde, fundo: "#ebfbee" };
export const EXPIRADA = { cor: ui.vermelho, fundo: "#fff5f5" };
export const PENDENTE = { cor: ui.laranja, fundo: "#fff4e6" };
