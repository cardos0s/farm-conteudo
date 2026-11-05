import React from "react";
import larguras from "./larguras.json";
import { FONTE_LOUSA } from "./fontes";
import { tinta } from "./paleta";
import { saida, useT } from "./tempo";

// Texto manuscrito (Excalifont) que aparece letra a letra, como quem digita na lousa do Excalidraw.
// Marcação: ^{2} sobrescrito, _{i} subscrito, *{palavra} destaque na cor `destaque`.

type Pedaco = { txt: string; sup?: boolean; sub?: boolean; forte?: boolean };

const L = larguras as Record<string, number>;

export function analisar(s: string): Pedaco[] {
  const out: Pedaco[] = [];
  const re = /([\^_*])\{([^}]*)\}/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > ultimo) out.push({ txt: s.slice(ultimo, m.index) });
    out.push({ txt: m[2], sup: m[1] === "^", sub: m[1] === "_", forte: m[1] === "*" });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) out.push({ txt: s.slice(ultimo) });
  return out;
}

/** Largura aproximada (px) de um texto na fonte da lousa. */
export function largura(s: string, tam: number): number {
  return analisar(s).reduce((acc, p) => {
    const k = p.sup || p.sub ? 0.66 : 1;
    return acc + [...p.txt].reduce((a, c) => a + (L[c] ?? 0.55), 0) * tam * k;
  }, 0);
}

export type TextoProps = {
  x: number;
  y: number;
  /** tamanho da fonte em px */
  tam?: number;
  cor?: string;
  destaque?: string;
  ancora?: "start" | "middle" | "end";
  de: number;
  dur?: number;
  ate?: number;
  opacidade?: number;
  alturaLinha?: number;
  girar?: number;
  children: string;
};

export function Texto({
  x,
  y,
  tam = 48,
  cor = tinta,
  destaque = "#e03131",
  ancora = "start",
  de,
  dur,
  ate,
  opacidade = 1,
  alturaLinha = 1.22,
  girar = 0,
  children,
}: TextoProps) {
  const t = useT();
  if (t < de) return null;
  const linhas = children.split("\n").map(analisar);
  const total = linhas.reduce((a, l) => a + l.reduce((b, p) => b + [...p.txt].length, 0), 0);
  const d = dur ?? Math.min(1.5, Math.max(0.25, total * 0.04));
  const revelado = Math.min(1, (t - de) / d) * total;
  const alfa = opacidade * saida(t, ate);
  if (alfa <= 0) return null;
  const comum = { fontFamily: FONTE_LOUSA, fontSize: tam, fill: cor, textAnchor: ancora, style: { whiteSpace: "pre" as const } };
  const g = (filhos: React.ReactNode) => (
    <g opacity={alfa < 1 ? alfa : undefined} transform={girar ? `rotate(${girar} ${x} ${y})` : undefined}>
      {filhos}
    </g>
  );
  if (revelado >= total) {
    // texto completo: um <tspan> por trecho de marcação, não por letra
    return g(
      linhas.map((pedacos, li) => {
        let deslocado = 0;
        return (
          <text key={li} x={x} y={y + li * tam * alturaLinha} {...comum}>
            {pedacos.map((p, pi) => {
              const alvo = p.sup ? -tam * 0.42 : p.sub ? tam * 0.22 : 0;
              const dy = alvo - deslocado;
              deslocado = alvo;
              return (
                <tspan key={pi} dy={dy || undefined} fontSize={p.sup || p.sub ? tam * 0.66 : undefined} fill={p.forte ? destaque : undefined}>
                  {p.txt}
                </tspan>
              );
            })}
          </text>
        );
      }),
    );
  }
  let indice = 0;
  return g(
    <>
      {linhas.map((pedacos, li) => {
        let deslocado = 0;
        const tspans: React.ReactNode[] = [];
        pedacos.forEach((p, pi) => {
          const pequeno = p.sup || p.sub;
          const alvo = p.sup ? -tam * 0.42 : p.sub ? tam * 0.22 : 0;
          [...p.txt].forEach((c, ci) => {
            const dy = ci === 0 ? alvo - deslocado : 0;
            if (ci === 0) deslocado = alvo;
            const a = Math.min(1, Math.max(0, revelado - indice));
            indice++;
            tspans.push(
              <tspan
                key={`${pi}-${ci}`}
                dy={dy || undefined}
                fontSize={pequeno ? tam * 0.66 : undefined}
                fill={p.forte ? destaque : undefined}
                fillOpacity={a}
              >
                {c}
              </tspan>,
            );
          });
        });
        return (
          <text key={li} x={x} y={y + li * tam * alturaLinha} {...comum}>
            {tspans}
          </text>
        );
      })}
    </>,
  );
}
