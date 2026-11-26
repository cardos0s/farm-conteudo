import React from "react";
import { AVANCO_CODIGO, FONTE_CODIGO } from "../../lousa/fontes";
import { Chip, Janela, ui, type JanelaProps } from "../../lousa/Janelas";
import { cor } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { Texto } from "../../lousa/Texto";

// Peças do Reel de design patterns: janela de código (Python, com realce) e o cabeçalho de cada padrão.

/** Cor de cada categoria do Gang of Four. */
export const CATEGORIA = {
  criacional: { nome: "padrão criacional", cor: "#1971c2", fundo: "#e7f5ff" },
  estrutural: { nome: "padrão estrutural", cor: "#2b8a3e", fundo: "#ebfbee" },
  comportamental: { nome: "padrão comportamental", cor: "#7048e8", fundo: "#f3f0ff" },
} as const;
export type Categoria = keyof typeof CATEGORIA;

const PALAVRAS = new Set(["class", "def", "return", "if", "else", "elif", "for", "in", "is", "not", "and", "or", "with", "None", "True", "False", "self", "cls", "import", "from", "lambda", "raise", "yield"]);

type Token = { t: string; c?: string };

function tokenizar(linha: string): Token[] {
  const out: Token[] = [];
  const re = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+\b)|(@\w+)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(linha))) {
    if (m[1]) out.push({ t: m[1], c: cor.cinza });
    else if (m[2]) out.push({ t: m[2], c: cor.verde });
    else if (m[3]) out.push({ t: m[3], c: cor.laranja });
    else if (m[4]) out.push({ t: m[4], c: cor.rosa });
    else if (m[5]) {
      const depois = linha.slice(re.lastIndex).trimStart();
      if (PALAVRAS.has(m[5])) out.push({ t: m[5], c: cor.violeta });
      else if (depois.startsWith("(")) out.push({ t: m[5], c: cor.azul });
      else if (/^[A-Z]/.test(m[5])) out.push({ t: m[5], c: cor.ciano });
      else out.push({ t: m[5] });
    } else out.push({ t: m[0] });
  }
  return out;
}

export type LinhaCodigo = { de: number; txt: string };

/**
 * Janela de código: cada linha é digitada a partir do seu `de` (segundos por caractere: `ritmo`).
 * Linhas com o mesmo recuo do Python, em Cascadia Code.
 */
export function CodigoUI({
  linhas,
  tam = 24,
  ritmo = 0.022,
  entre = 1.55,
  topo,
  ...janela
}: Omit<JanelaProps, "children"> & { linhas: LinhaCodigo[]; tam?: number; ritmo?: number; entre?: number; topo?: number }) {
  const t = useT();
  const y0 = topo ?? 26 + tam;
  let cursor: { x: number; y: number } | null = null;
  const conteudo = linhas.map((l, i) => {
    if (t < l.de) return null;
    const n = Math.min(l.txt.length, Math.floor((t - l.de) / ritmo) + 1);
    const y = y0 + i * tam * entre;
    if (n < l.txt.length || t < l.de + l.txt.length * ritmo + 0.6) cursor = { x: 26 + n * tam * AVANCO_CODIGO, y };
    let resto = n;
    const tspans: React.ReactNode[] = [];
    tokenizar(l.txt).forEach((tk, k) => {
      if (resto <= 0) return;
      tspans.push(
        <tspan key={k} fill={tk.c ?? ui.texto}>
          {tk.t.slice(0, resto)}
        </tspan>,
      );
      resto -= tk.t.length;
    });
    return (
      <text key={i} x={26} y={y} fontFamily={FONTE_CODIGO} fontSize={tam} style={{ whiteSpace: "pre" }}>
        {tspans}
      </text>
    );
  });
  const c = cursor as { x: number; y: number } | null;
  return (
    <Janela {...janela}>
      {conteudo}
      {c && Math.floor(t * 2) % 2 === 0 && <rect x={c.x + 2} y={c.y - tam * 0.82} width={tam * 0.52} height={tam * 1.02} fill={ui.violeta} opacity={0.7} />}
    </Janela>
  );
}

/** Cabeçalho de um padrão: a categoria numa pílula e o nome escrito à mão. */
export function Cabecalho({ categoria, nome, de, deNome, tam = 78 }: { categoria: Categoria; nome: string; de: number; deNome?: number; tam?: number }) {
  const c = CATEGORIA[categoria];
  const w = c.nome.length * 26 * 0.6 + 26 * 1.4;
  return (
    <>
      <Chip x={60 + w / 2} y={70} texto={c.nome} fundo={c.fundo} cor={c.cor} tam={26} de={de} />
      <Texto x={60} y={178} tam={tam} cor={ui.rosa} de={deNome ?? de + 0.3} dur={0.6}>
        {nome}
      </Texto>
    </>
  );
}
