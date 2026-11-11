import React from "react";
import { Elipse, Linha, Ret } from "./Esboco";
import { AVANCO_CODIGO, FONTE_CODIGO, FONTE_LOUSA } from "./fontes";
import { cor, tinta } from "./paleta";
import { saida, useT } from "./tempo";

// Bloco de código na lousa: uma "janela" desenhada à mão com o código em Cascadia Code e realce
// simples de Python. As linhas aparecem como se fossem digitadas.

type Token = { t: string; c?: string };

const PALAVRAS = new Set(["def", "if", "elif", "else", "return", "for", "while", "in", "and", "or", "not", "None", "True", "False"]);

export function tokenizar(linha: string): Token[] {
  const out: Token[] = [];
  const re = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(linha))) {
    if (m[1]) out.push({ t: m[1], c: cor.cinza });
    else if (m[2]) out.push({ t: m[2], c: cor.verde });
    else if (m[3]) out.push({ t: m[3], c: cor.laranja });
    else if (m[4]) {
      const depois = linha.slice(re.lastIndex).trimStart();
      if (PALAVRAS.has(m[4])) out.push({ t: m[4], c: cor.violeta });
      else if (depois.startsWith("(")) out.push({ t: m[4], c: cor.azul });
      else out.push({ t: m[4] });
    } else out.push({ t: m[0] });
  }
  return out;
}

export type CodigoProps = {
  x: number;
  y: number;
  linhas: string[];
  /** tamanho da fonte do código */
  tam?: number;
  /** nome do arquivo na barra da janela */
  arquivo?: string;
  largura?: number;
  de: number;
  /** segundos por caractere digitado */
  ritmo?: number;
  ate?: number;
};

/** Altura de cada linha e posição (y da linha de base) da linha i, para alinhar marcações. */
export const linhaCodigo = (y: number, tam: number, i: number) => y + 74 + tam * 1.05 + i * tam * 1.5;
/** x do caractere `col` de uma linha (fonte monoespaçada). */
export const colunaCodigo = (x: number, tam: number, col: number) => x + 34 + col * tam * AVANCO_CODIGO;

export function Codigo({ x, y, linhas, tam = 34, arquivo, largura, de, ritmo = 0.022, ate }: CodigoProps) {
  const t = useT();
  if (t < de) return null;
  const alfa = saida(t, ate);
  if (alfa <= 0) return null;
  const maior = Math.max(...linhas.map((l) => l.length));
  const w = largura ?? Math.max(360, 68 + maior * tam * AVANCO_CODIGO);
  const h = 74 + linhas.length * tam * 1.5 + tam * 0.75;
  const inicioTexto = de + 0.45;
  const reveladoTotal = Math.max(0, (t - inicioTexto) / ritmo);
  let antes = 0;
  return (
    <g opacity={alfa < 1 ? alfa : undefined}>
      <Ret x={x} y={y} w={w} h={h} preench="#ffffff" hachura="solid" de={de} dur={0.45} />
      <Linha pts={[[x, y + 50], [x + w, y + 50]]} espessura={2.4} de={de + 0.2} dur={0.2} />
      {[0, 1, 2].map((i) => (
        <Elipse key={i} cx={x + 26 + i * 24} cy={y + 26} w={13} h={13} espessura={2.2} de={de + 0.25 + i * 0.04} dur={0.12} />
      ))}
      {arquivo && (
        <text x={x + w - 20} y={y + 33} fontFamily={FONTE_LOUSA} fontSize={24} fill={cor.cinza} textAnchor="end" opacity={t > de + 0.3 ? 1 : 0}>
          {arquivo}
        </text>
      )}
      {linhas.map((linha, i) => {
        const visiveis = Math.min(linha.length, Math.max(0, Math.floor(reveladoTotal - antes)));
        antes += linha.length + 4; // pequena pausa no fim de cada linha
        if (visiveis <= 0 && linha.length > 0) return null;
        let restante = visiveis;
        return (
          <text key={i} x={colunaCodigo(x, tam, 0)} y={linhaCodigo(y, tam, i)} fontFamily={FONTE_CODIGO} fontSize={tam} fill={tinta} style={{ whiteSpace: "pre" }}>
            {tokenizar(linha).map((tk, k) => {
              if (restante <= 0) return null;
              const parte = tk.t.slice(0, restante);
              restante -= parte.length;
              return (
                <tspan key={k} fill={tk.c}>
                  {parte}
                </tspan>
              );
            })}
          </text>
        );
      })}
    </g>
  );
}
