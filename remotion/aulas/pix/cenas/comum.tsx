import React from "react";
import { FONTE_CODIGO } from "../../../lousa/fontes";
import { FONTE_UI, ui } from "../../../lousa/Janelas";
import { progresso, saida, useT } from "../../../lousa/tempo";

/** Texto de interface (Inter ou monoespaçado) que aparece com um fade rápido. */
export function TextoUI({
  x,
  y,
  de,
  ate,
  tam = 24,
  cor = ui.texto,
  negrito = false,
  mono = false,
  ancora = "start",
  children,
}: {
  x: number;
  y: number;
  de: number;
  ate?: number;
  tam?: number;
  cor?: string;
  negrito?: boolean;
  mono?: boolean;
  ancora?: "start" | "middle" | "end";
  children: string;
}) {
  const t = useT();
  if (t < de) return null;
  const alfa = progresso(t, de, 0.25) * saida(t, ate, 0.25);
  if (alfa <= 0) return null;
  return (
    <text
      x={x}
      y={y + (1 - progresso(t, de, 0.3)) * 10}
      opacity={alfa}
      textAnchor={ancora}
      fontFamily={mono ? FONTE_CODIGO : FONTE_UI}
      fontWeight={negrito ? 700 : 400}
      fontSize={tam}
      fill={cor}
      style={{ whiteSpace: "pre" }}
    >
      {children}
    </text>
  );
}

/** Texto de interface digitado letra a letra. */
export function Digitado({ x, y, texto, de, ritmo = 0.05, tam = 28, cor = ui.texto }: { x: number; y: number; texto: string; de: number; ritmo?: number; tam?: number; cor?: string }) {
  const t = useT();
  if (t < de) return null;
  const n = Math.min(texto.length, Math.floor((t - de) / ritmo) + 1);
  const cursor = Math.floor(t * 2) % 2 === 0;
  return (
    <text x={x} y={y} fontFamily={FONTE_UI} fontSize={tam} fill={cor} style={{ whiteSpace: "pre" }}>
      {texto.slice(0, n)}
      {cursor && <tspan fill={ui.violeta}>|</tspan>}
    </text>
  );
}
