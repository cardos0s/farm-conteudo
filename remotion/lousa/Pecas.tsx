import React from "react";
import { Ret, type Estilo, type Tempo } from "./Esboco";
import { tinta } from "./paleta";
import { largura, Texto } from "./Texto";
import { useT } from "./tempo";

type Base = Estilo & Tempo;

/** Retângulo arredondado com texto centralizado (uma ou mais linhas). */
export function Caixa({
  x,
  y,
  w,
  h,
  texto,
  tam = 44,
  corTexto = tinta,
  atrasoTexto = 0.3,
  ...p
}: Base & { x: number; y: number; w: number; h: number; texto?: string; tam?: number; corTexto?: string; atrasoTexto?: number }) {
  const linhas = texto ? texto.split("\n").length : 0;
  const y0 = y + h / 2 - ((linhas - 1) * tam * 1.18) / 2 + tam * 0.34;
  return (
    <>
      <Ret x={x} y={y} w={w} h={h} {...p} />
      {texto && (
        <Texto x={x + w / 2} y={y0} tam={tam} cor={corTexto} ancora="middle" de={p.de + atrasoTexto} ate={p.ate} alturaLinha={1.18}>
          {texto}
        </Texto>
      )}
    </>
  );
}

/** Etiqueta: caixa ajustada ao texto. (x, y) é o centro. */
export function Etiqueta({
  x,
  y,
  texto,
  tam = 40,
  pad = 22,
  corTexto = tinta,
  ...p
}: Base & { x: number; y: number; texto: string; tam?: number; pad?: number; corTexto?: string }) {
  const linhas = texto.split("\n");
  const w = Math.max(...linhas.map((l) => largura(l, tam))) + pad * 2;
  const h = linhas.length * tam * 1.18 + pad * 1.1;
  return <Caixa x={x - w / 2} y={y - h / 2} w={w} h={h} texto={texto} tam={tam} corTexto={corTexto} atrasoTexto={0.18} {...p} />;
}

/** Marca-texto: faixa translúcida que passa da esquerda para a direita atrás de um texto. */
export function Marca({ x, y, w, h, cor = "#ffec99", de, dur = 0.45, ate }: { x: number; y: number; w: number; h: number; cor?: string; de: number; dur?: number; ate?: number }) {
  const t = useT();
  if (t < de) return null;
  const p = Math.min(1, (t - de) / dur);
  const alfa = ate !== undefined ? Math.max(0, 1 - (t - ate) / 0.35) : 1;
  return (
    <g opacity={0.75 * alfa}>
      <path
        d={`M${x} ${y + h * 0.08} L${x + w * p} ${y} L${x + w * p} ${y + h} L${x} ${y + h * 0.95} Z`}
        fill={cor}
        stroke="none"
      />
    </g>
  );
}
