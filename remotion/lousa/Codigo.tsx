import React from "react";
import { Check, Ret, Xis } from "./Esboco";
import { AVANCO_CODIGO, FONTE_CODIGO } from "./fontes";
import { claro, cor, tinta } from "./paleta";
import { Texto } from "./Texto";
import { saida, useT } from "./tempo";

// Código e terminal na lousa, com a fonte de código do Excalidraw (monoespaçada).
// Como cada caractere ocupa a mesma largura, dá para posicionar marcações e desenhos
// (✓, ✗, barras) exatamente sobre a coluna do texto.

type Token = { txt: string; cor: string };

const PALAVRAS_PY = new Set([
  "def", "return", "class", "for", "in", "if", "else", "elif", "not", "and", "or", "import", "from", "as",
  "with", "None", "True", "False", "lambda", "raise", "is", "continue", "yield",
]);

/** Separa uma linha em pedaços coloridos (Python ou JSON, o suficiente para a aula). */
export function colorir(linha: string, lang: "py" | "json" | "texto"): Token[] {
  if (lang === "texto") return [{ txt: linha, cor: tinta }];
  const out: Token[] = [];
  const re =
    lang === "py"
      ? /(#.*$)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z_0-9]*\b)|(\s+)|(.)/g
      : /()("[^"]*")(\s*:)?|(\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let anterior = "";
  while ((m = re.exec(linha))) {
    if (lang === "py") {
      const [, comentario, texto, numero, nome, espaco, outro] = m;
      if (comentario) out.push({ txt: comentario, cor: cor.cinza });
      else if (texto) out.push({ txt: texto, cor: cor.verde });
      else if (numero) out.push({ txt: numero, cor: cor.laranja });
      else if (nome) {
        const c = PALAVRAS_PY.has(nome) ? cor.violeta : anterior === "def" || anterior === "class" ? cor.azul : tinta;
        out.push({ txt: nome, cor: c });
        anterior = nome;
      } else out.push({ txt: espaco ?? outro, cor: tinta });
    } else {
      const [, , texto, doisPontos, literal, espaco, outro] = m;
      if (texto) {
        out.push({ txt: texto, cor: doisPontos ? cor.azul : cor.verde });
        if (doisPontos) out.push({ txt: doisPontos, cor: tinta });
      } else if (literal) out.push({ txt: literal, cor: cor.laranja });
      else out.push({ txt: espaco ?? outro, cor: tinta });
    }
  }
  return out;
}

/** Pedaços até o caractere n (para "digitar" a linha). */
function cortar(tokens: Token[], n: number): Token[] {
  const out: Token[] = [];
  let resto = n;
  for (const t of tokens) {
    if (resto <= 0) break;
    out.push(t.txt.length <= resto ? t : { ...t, txt: t.txt.slice(0, resto) });
    resto -= t.txt.length;
  }
  return out;
}

const durLinha = (n: number) => Math.min(0.7, 0.08 + n * 0.012);

/** Instante em que cada linha começa a ser digitada. `blocos`: [linha, segundo] em que um trecho começa. */
function inicios(linhas: string[], de: number, blocos: [number, number][] = []): number[] {
  const marcos = new Map(blocos);
  const out: number[] = [];
  let t = de;
  linhas.forEach((l, i) => {
    if (marcos.has(i)) t = Math.max(t, marcos.get(i)!);
    out.push(t);
    t += l.trim() ? durLinha(l.length) + 0.04 : 0.02;
  });
  return out;
}

export type MarcaLinha = { l: number | [number, number]; de: number; ate?: number; cor?: string };

/**
 * Bloco de código digitado linha a linha.
 * `blocos` faz um trecho começar num instante (ex.: quando a fala chega nele);
 * `marcas` passa marca-texto atrás de linhas.
 */
export function Codigo({
  x,
  y,
  linhas,
  de,
  ate,
  tam = 30,
  lang = "py",
  w,
  titulo,
  blocos,
  marcas = [],
  pad = 30,
}: {
  x: number;
  y: number;
  linhas: string[];
  de: number;
  ate?: number;
  tam?: number;
  lang?: "py" | "json" | "texto";
  w?: number;
  titulo?: string;
  blocos?: [number, number][];
  marcas?: MarcaLinha[];
  pad?: number;
}) {
  const t = useT();
  if (t < de) return null;
  const alt = tam * 1.42;
  const larg = w ?? Math.max(...linhas.map((l) => l.length)) * tam * AVANCO_CODIGO + pad * 2;
  const h = linhas.length * alt + pad * 1.4;
  const ini = inicios(linhas, de + 0.45, blocos);
  const alfa = saida(t, ate);
  const yLinha = (i: number) => y + pad * 0.7 + i * alt;
  return (
    <g opacity={alfa < 1 ? alfa : undefined}>
      <Ret x={x} y={y} w={larg} h={h} preench="#ffffff" hachura="solid" de={de} dur={0.45} ate={ate} />
      {titulo && (
        <>
          <Ret x={x + 18} y={y - tam * 1.3} w={titulo.length * tam * 0.8 * AVANCO_CODIGO + 40} h={tam * 1.3 + 4} redondo={false} preench={claro.cinza} hachura="solid" espessura={2} de={de} dur={0.3} ate={ate} />
          <text x={x + 36} y={y - tam * 0.38} fontFamily={FONTE_CODIGO} fontSize={tam * 0.8} fill={cor.cinza} style={{ whiteSpace: "pre" }}>
            {titulo}
          </text>
        </>
      )}
      {marcas.map((m, k) => {
        const [a, b] = typeof m.l === "number" ? [m.l, m.l] : m.l;
        if (t < m.de) return null;
        const p = Math.min(1, (t - m.de) / 0.4);
        const sai = m.ate !== undefined ? Math.max(0, 1 - (t - m.ate) / 0.35) : 1;
        return (
          <rect
            key={k}
            x={x + 10}
            y={yLinha(a) - 2}
            width={(larg - 20) * p}
            height={(b - a + 1) * alt + 2}
            rx={6}
            fill={m.cor ?? claro.amarelo}
            opacity={0.8 * sai}
          />
        );
      })}
      {linhas.map((linha, i) => {
        if (t < ini[i] || !linha) return null;
        const n = Math.min(linha.length, Math.floor(((t - ini[i]) / durLinha(linha.length)) * linha.length + 1));
        return (
          <text key={i} x={x + pad} y={yLinha(i) + tam * 1.05} fontFamily={FONTE_CODIGO} fontSize={tam} style={{ whiteSpace: "pre" }}>
            {cortar(colorir(linha, lang), n).map((tk, j) => (
              <tspan key={j} fill={tk.cor}>
                {tk.txt}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
}

export type LinhaTerminal = { txt: string; de: number };

const CORES_TERMINAL: Record<string, string> = { v: "#8ce99a", r: "#ff8787", c: "#adb5bd", a: "#ffd43b", b: "#74c0fc", w: "#ffffff" };

/** Pedaços de uma linha de terminal: {v:verde} {r:vermelho} {c:cinza} {a:amarelo} {b:azul}. */
function pedacosTerminal(s: string): Token[] {
  const out: Token[] = [];
  const re = /\{([vrcabw]):([^}]*)\}/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > ultimo) out.push({ txt: s.slice(ultimo, m.index), cor: "#e9ecef" });
    out.push({ txt: m[2], cor: CORES_TERMINAL[m[1]] });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) out.push({ txt: s.slice(ultimo), cor: "#e9ecef" });
  return out;
}

/**
 * Terminal escuro. Cada linha aparece no seu instante. Os símbolos ✓ ✗ █ ░ não existem na fonte
 * de código: viram desenhos na coluna exata do caractere.
 */
export function Terminal({
  x,
  y,
  w,
  linhas,
  de,
  ate,
  tam = 28,
  titulo = "terminal",
  minLinhas = 0,
}: {
  x: number;
  y: number;
  w: number;
  linhas: LinhaTerminal[];
  de: number;
  ate?: number;
  tam?: number;
  titulo?: string;
  minLinhas?: number;
}) {
  const t = useT();
  if (t < de) return null;
  const alt = tam * 1.4;
  const topo = 50;
  const h = topo + Math.max(linhas.length, minLinhas) * alt + 30;
  const av = tam * AVANCO_CODIGO;
  const alfa = saida(t, ate);
  return (
    <g opacity={alfa < 1 ? alfa : undefined}>
      <Ret x={x} y={y} w={w} h={h} preench="#212529" hachura="solid" de={de} dur={0.45} ate={ate} />
      {[cor.vermelho, cor.laranja, cor.verde].map((c, i) => (
        <circle key={i} cx={x + 30 + i * 26} cy={y + 26} r={8} fill={c} opacity={Math.min(1, (t - de) / 0.4)} />
      ))}
      <text x={x + w / 2} y={y + 33} textAnchor="middle" fontFamily={FONTE_CODIGO} fontSize={20} fill="#868e96">
        {titulo}
      </text>
      {linhas.map((l, i) => {
        if (t < l.de) return null;
        const yl = y + topo + i * alt + tam;
        const pedacos = pedacosTerminal(l.txt);
        const desenhos: React.ReactNode[] = [];
        let col = 0;
        const texto = pedacos.map((p, j) => {
          const chars = [...p.txt].map((c, k) => {
            const cx = x + 24 + (col + k) * av;
            if (c === "✓") desenhos.push(<Check key={`c${j}-${k}`} x={cx} y={yl - tam * 0.3} s={tam * 0.6} cor={CORES_TERMINAL.v} espessura={3.2} de={l.de} dur={0.12} />);
            if (c === "✗") desenhos.push(<Xis key={`x${j}-${k}`} x={cx + av / 2} y={yl - tam * 0.32} s={tam * 0.5} cor={CORES_TERMINAL.r} espessura={3.2} de={l.de} dur={0.12} />);
            if (c === "█") desenhos.push(<rect key={`b${j}-${k}`} x={cx} y={yl - tam * 0.78} width={av + 0.5} height={tam * 0.9} fill={p.cor} />);
            if (c === "░") desenhos.push(<rect key={`o${j}-${k}`} x={cx} y={yl - tam * 0.78} width={av + 0.5} height={tam * 0.9} fill="#495057" />);
            return "✓✗█░".includes(c) ? " " : c;
          });
          col += chars.length;
          return (
            <tspan key={j} fill={p.cor}>
              {chars.join("")}
            </tspan>
          );
        });
        return (
          <g key={i}>
            <text x={x + 24} y={yl} fontFamily={FONTE_CODIGO} fontSize={tam} style={{ whiteSpace: "pre" }}>
              {texto}
            </text>
            {desenhos}
          </g>
        );
      })}
    </g>
  );
}

/** Capa de capítulo: número grande, título e uma linha à mão. */
export function Capitulo({ n, titulo, sub, de }: { n: string; titulo: string; sub?: string; de: number }) {
  return (
    <>
      <Texto x={960} y={430} tam={210} cor={cor.azul} ancora="middle" de={de} dur={0.4}>
        {n}
      </Texto>
      <Texto x={960} y={600} tam={84} ancora="middle" de={de + 0.3} dur={0.9}>
        {titulo}
      </Texto>
      {sub && (
        <Texto x={960} y={690} tam={44} cor={cor.cinza} ancora="middle" de={de + 0.9} dur={0.8}>
          {sub}
        </Texto>
      )}
    </>
  );
}
