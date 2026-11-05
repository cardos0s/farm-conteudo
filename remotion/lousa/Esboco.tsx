import React, { useMemo } from "react";
import rough from "roughjs";
import type { Drawable, Options, OpSet } from "roughjs/bin/core";
import type { RoughGenerator } from "roughjs/bin/generator";
import { tinta } from "./paleta";
import { saida, useT } from "./tempo";

// Formas desenhadas à mão no estilo Excalidraw (roughjs, o mesmo motor do Excalidraw).
// Cada forma se "desenha" no tempo: primeiro o contorno (cada passada do traço em sequência),
// depois a hachura. Tudo é determinístico (semente fixa), então cada quadro renderiza igual.

const gerador = rough.generator();

type Tipo = OpSet["type"];
type Sub = { d: string; peso: number };
type Conjunto = { tipo: Tipo; subs: Sub[]; cor: string; largura: number };

export type Estilo = {
  cor?: string;
  espessura?: number;
  preench?: string;
  hachura?: "hachure" | "solid" | "cross-hatch" | "zigzag" | "dots";
  aspereza?: number;
  arco?: number;
  semente?: number;
  vaoHachura?: number;
  pesoHachura?: number;
  anguloHachura?: number;
};

export type Tempo = {
  /** segundo (do vídeo final) em que a forma começa a ser desenhada */
  de: number;
  /** duração do desenho em segundos */
  dur?: number;
  /** a forma some a partir deste segundo */
  ate?: number;
  opacidade?: number;
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h) % 2147483647 || 7;
}

function comprimento(d: string): number {
  const n = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let total = 0;
  for (let i = 2; i + 1 < n.length; i += 2) total += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
  return Math.max(total, 1);
}

function dividir(d: string): Sub[] {
  return d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .map((s) => ({ d: s, peso: comprimento(s) }));
}

function opcoes(e: Estilo, semente: number): Options {
  return {
    seed: e.semente ?? semente,
    stroke: e.cor ?? tinta,
    strokeWidth: e.espessura ?? 3.2,
    roughness: e.aspereza ?? 1.1,
    bowing: e.arco ?? 1,
    fill: e.preench,
    fillStyle: e.hachura ?? "hachure",
    hachureGap: e.vaoHachura ?? 10,
    fillWeight: e.pesoHachura ?? 2.4,
    hachureAngle: e.anguloHachura ?? -41,
    preserveVertices: true,
  };
}

export type Fabrica = (g: RoughGenerator, o: Options) => Drawable;

function useConjuntos(chave: string, fabrica: Fabrica, estilo: Estilo): Conjunto[] {
  return useMemo(() => {
    const o = opcoes(estilo, hash(chave));
    const desenho = fabrica(gerador, o);
    return desenho.sets.map((set) => {
      const d = gerador.opsToPath(set, 2);
      const tipo = set.type;
      if (tipo === "fillSketch") return { tipo, subs: dividir(d), cor: o.fill ?? tinta, largura: o.fillWeight ?? 2 };
      if (tipo === "fillPath") return { tipo, subs: [{ d, peso: 1 }], cor: o.fill ?? tinta, largura: 0 };
      return { tipo, subs: dividir(d), cor: o.stroke ?? tinta, largura: o.strokeWidth ?? 3 };
    });
    // a chave descreve geometria + estilo; recriar a cada quadro mudaria a aspereza
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
}

/** Desenha os subcaminhos em sequência, distribuindo o progresso pelo comprimento de cada um. */
function Sequencia({ subs, p, cor, largura }: { subs: Sub[]; p: number; cor: string; largura: number }) {
  if (p <= 0) return null;
  if (p >= 1) {
    // traço concluído: um único <path> com todos os subcaminhos (bem mais leve para o navegador)
    return (
      <path d={subs.map((s) => s.d).join(" ")} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round" strokeLinejoin="round" />
    );
  }
  const total = subs.reduce((s, x) => s + x.peso, 0);
  let acumulado = 0;
  return (
    <>
      {subs.map((s, i) => {
        const ini = acumulado / total;
        acumulado += s.peso;
        const fim = acumulado / total;
        const q = Math.min(1, Math.max(0, (p - ini) / Math.max(1e-6, fim - ini)));
        if (q <= 0) return null;
        return (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={cor}
            strokeWidth={largura}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...(q < 1 ? { pathLength: 1, strokeDasharray: `${q} 2` } : {})}
          />
        );
      })}
    </>
  );
}

export function Desenho({ conjuntos, p, opacidade = 1 }: { conjuntos: Conjunto[]; p: number; opacidade?: number }) {
  if (p <= 0 || opacidade <= 0) return null;
  const temPreench = conjuntos.some((c) => c.tipo !== "path");
  const fimContorno = temPreench ? 0.62 : 1;
  const pc = Math.min(1, p / fimContorno);
  const pf = Math.min(1, Math.max(0, (p - 0.4) / 0.6));
  return (
    <g opacity={opacidade}>
      {conjuntos.map((c, i) => {
        if (c.tipo === "fillPath")
          return <path key={i} d={c.subs[0].d} fill={c.cor} stroke="none" opacity={Math.min(1, pf * 1.6)} />;
        if (c.tipo === "fillSketch") return <Sequencia key={i} subs={c.subs} p={pf} cor={c.cor} largura={c.largura} />;
        return null;
      })}
      {conjuntos.map((c, i) =>
        c.tipo === "path" ? <Sequencia key={`c${i}`} subs={c.subs} p={pc} cor={c.cor} largura={c.largura} /> : null,
      )}
    </g>
  );
}

const durPadrao = (subs: number) => Math.min(1.1, 0.35 + subs * 0.02);

type FormaProps = Estilo & Tempo & { chave: string; fabrica: Fabrica };

/** Forma genérica: recebe uma fábrica do roughjs e anima o desenho entre `de` e `de + dur`. */
export function Forma({ chave, fabrica, de, dur, ate, opacidade = 1, ...estilo }: FormaProps) {
  const t = useT();
  const conjuntos = useConjuntos(chave + JSON.stringify(estilo), fabrica, estilo);
  if (t < de) return null;
  const d = dur ?? durPadrao(conjuntos.reduce((s, c) => s + c.subs.length, 0));
  const p = Math.min(1, (t - de) / d);
  const facil = p < 1 ? 1 - Math.pow(1 - p, 1.6) : 1;
  return <Desenho conjuntos={conjuntos} p={facil} opacidade={opacidade * saida(t, ate)} />;
}

type Ponto = [number, number];
type Base = Estilo & Tempo;

function caminhoArredondado(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y}`;
}

export function Ret({ x, y, w, h, redondo = true, ...p }: Base & { x: number; y: number; w: number; h: number; redondo?: boolean }) {
  const r = redondo ? Math.min(26, Math.min(w, h) * 0.22) : 0;
  return (
    <Forma
      chave={`ret${x},${y},${w},${h},${r}`}
      fabrica={(g, o) => (r > 0 ? g.path(caminhoArredondado(x, y, w, h, r), o) : g.rectangle(x, y, w, h, o))}
      {...p}
    />
  );
}

export function Elipse({ cx, cy, w, h, ...p }: Base & { cx: number; cy: number; w: number; h: number }) {
  return <Forma chave={`eli${cx},${cy},${w},${h}`} fabrica={(g, o) => g.ellipse(cx, cy, w, h, o)} {...p} />;
}

export function Linha({ pts, ...p }: Base & { pts: Ponto[] }) {
  return <Forma chave={`lin${pts.join(";")}`} fabrica={(g, o) => g.linearPath(pts, o)} {...p} />;
}

export function Curva({ pts, ...p }: Base & { pts: Ponto[] }) {
  return <Forma chave={`cur${pts.join(";")}`} fabrica={(g, o) => g.curve(pts, o)} {...p} />;
}

export function Caminho({ d, ...p }: Base & { d: string }) {
  return <Forma chave={`cam${d}`} fabrica={(g, o) => g.path(d, o)} {...p} />;
}

/** Seta com haste reta ou curva (passando por `via`) e ponta em "V", como no Excalidraw. */
export function Seta({
  desde,
  para,
  via,
  ponta = 22,
  dupla = false,
  de,
  dur = 0.55,
  ...resto
}: Base & { desde: Ponto; para: Ponto; via?: Ponto; ponta?: number; dupla?: boolean }) {
  const t = useT();
  const haste = via ? (
    <Curva pts={[desde, via, para]} {...resto} de={de} dur={dur * 0.72} />
  ) : (
    <Linha pts={[desde, para]} {...resto} de={de} dur={dur * 0.72} />
  );
  const cabeca = (alvo: Ponto, origem: Ponto, k: string) => {
    const ang = Math.atan2(alvo[1] - origem[1], alvo[0] - origem[0]);
    const a1: Ponto = [alvo[0] - ponta * Math.cos(ang - 0.45), alvo[1] - ponta * Math.sin(ang - 0.45)];
    const a2: Ponto = [alvo[0] - ponta * Math.cos(ang + 0.45), alvo[1] - ponta * Math.sin(ang + 0.45)];
    return <Linha key={k} pts={[a1, alvo, a2]} {...resto} de={de + dur * 0.72} dur={dur * 0.28} />;
  };
  if (t < de) return null;
  return (
    <>
      {haste}
      {cabeca(para, via ?? desde, "f")}
      {dupla && cabeca(desde, via ?? para, "i")}
    </>
  );
}

export function Check({ x, y, s = 40, ...p }: Base & { x: number; y: number; s?: number }) {
  return (
    <Linha
      pts={[
        [x, y],
        [x + s * 0.38, y + s * 0.4],
        [x + s, y - s * 0.55],
      ]}
      cor={p.cor ?? "#2f9e44"}
      espessura={p.espessura ?? 5}
      {...p}
    />
  );
}

export function Xis({ x, y, s = 40, ...p }: Base & { x: number; y: number; s?: number }) {
  const d = p.dur ?? 0.4;
  return (
    <>
      <Linha pts={[[x - s / 2, y - s / 2], [x + s / 2, y + s / 2]]} cor={p.cor ?? "#e03131"} espessura={p.espessura ?? 5} {...p} dur={d / 2} />
      <Linha pts={[[x + s / 2, y - s / 2], [x - s / 2, y + s / 2]]} cor={p.cor ?? "#e03131"} espessura={p.espessura ?? 5} {...p} de={p.de + d / 2} dur={d / 2} />
    </>
  );
}
