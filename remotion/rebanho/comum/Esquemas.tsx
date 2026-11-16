import React from "react";
import { Marca } from "../pesagem/Celular";
import { fora, lerp, limitar, mola, prog } from "../pesagem/roteiro";
import { Adesivo, Confete, Letra } from "../pesagem/Sobreposicoes";
import { type Fala, A, L } from "./tempo";

// Peças dos esquemas explicativos: etapa numerada, painel, seta, título falado, tela cheia do app e fecho.

export { Adesivo, Confete, Letra, Marca };
export const VERDE = "#2F5D3A", VERDE_ESC = "#16301D", CREME = "#FFF8EA", LARANJA = "#B5651D", AMARELO = "#FFD166", AZUL = "#2E7FB8", SUAVE = "#6B6F5E", TEXTO = "#1F2A1F";
export const TITULO = "'Roboto Slab', Georgia, serif", CORPO = "Inter, Arial, sans-serif";

/** Aparece em `de` com um pulinho e some em `ate`: e = escala, o = opacidade. */
export const vida = (t: number, de: number, ate: number) => ({ e: prog(t, de, 0.38, mola), o: limitar((t - de) / 0.12) * (1 - prog(t, ate, 0.25)) });
export const pulo = (t: number, de: number) => prog(t, de, 0.36, mola);
export const carimbo = (t: number, de: number) => lerp(2.4, 1, prog(t, de, 0.2, fora));

/** Vinheta e sombra no topo, para os letreiros lerem bem sobre o céu. */
export const Fundo: React.FC<{ flash?: number }> = ({ flash = 0 }) => (
  <svg width={L} height={A} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="eq-vinheta" cx="0.5" cy="0.45" r="0.75"><stop offset="0.62" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#1A1206" stopOpacity={0.42} /></radialGradient>
      <linearGradient id="eq-topo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10230F" stopOpacity={0.5} /><stop offset="1" stopColor="#10230F" stopOpacity={0} /></linearGradient>
    </defs>
    <rect width={L} height={A} fill="url(#eq-vinheta)" />
    <rect width={L} height={640} fill="url(#eq-topo)" />
    <rect width={L} height={A} fill="#fff" opacity={flash * 0.4} />
  </svg>
);

/** Etiqueta da etapa no alto: "2 · ALTURA DO CAPIM". */
export const Etapa: React.FC<{ t: number; de: number; ate: number; children: string }> = ({ t, de, ate, children }) => {
  const v = vida(t, de, ate);
  return v.o > 0 ? <g opacity={v.o}><Adesivo x={540} y={225} tam={48} giro={-2} escala={v.e} fundo={VERDE}>{children}</Adesivo></g> : null;
};

/** Cartão creme para esquemas; o conteúdo usa coordenadas a partir do centro. */
export const Painel: React.FC<{ t: number; de: number; ate: number; y: number; w?: number; h: number; children: React.ReactNode }> = ({ t, de, ate, y, w = 960, h, children }) => {
  const v = vida(t, de, ate);
  if (v.o <= 0) return null;
  return (
    <g transform={`translate(540 ${y}) scale(${v.e})`} opacity={v.o}>
      <rect x={-w / 2} y={-h / 2 + 10} width={w} height={h} rx={40} fill="#000" opacity={0.2} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={40} fill={CREME} stroke={VERDE} strokeWidth={7} />
      {children}
    </g>
  );
};

export const Seta: React.FC<{ x: number; y: number; cor: string; giro?: number; e: number; r?: number }> = ({ x, y, cor, giro = 0, e, r = 33 }) => (
  <g transform={`translate(${x} ${y}) scale(${(e * r) / 33}) rotate(${giro})`}>
    <circle r={40} fill="#fff" /><circle r={33} fill={cor} />
    <path d="M -15,0 L 13,0 M 2,-12 L 14,0 L 2,12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Texto simples dentro de painel. */
export const Tx: React.FC<{ x: number; y: number; tam: number; cor?: string; peso?: number; ancora?: "start" | "middle" | "end"; titulo?: boolean; children: React.ReactNode; o?: number }> = ({ x, y, tam, cor = VERDE, peso = 800, ancora = "middle", titulo = true, children, o = 1 }) => (
  <text x={x} y={y} textAnchor={ancora} fontFamily={titulo ? TITULO : CORPO} fontWeight={peso} fontSize={tam} fill={cor} opacity={o}>{children}</text>
);

/** Título de abertura que entra palavra por palavra com a fala; `linhas` reparte as primeiras palavras da fala 1. */
export const Abertura: React.FC<{ t: number; fala: Fala; inicio: number; ate: number; linhas: { n: number; tam: number; cor?: string }[]; adesivo?: { texto: string; em: number } }> = ({ t, fala, inicio, ate, linhas, adesivo }) => {
  const sai = 1 - prog(t, ate, 0.3);
  if (sai <= 0) return null;
  let i = 0, y = 170;
  const vem = adesivo ? prog(t, adesivo.em - 0.05, 0.4, mola) : 0;
  const salto = adesivo && t > adesivo.em ? Math.abs(Math.sin((t - adesivo.em) * 6.5)) * 46 * Math.exp(-(t - adesivo.em) * 1.1) : 0;
  return (
    <g opacity={sai} transform={`translate(0 ${-(1 - sai) * 80})`}>
      {linhas.map((l, k) => {
        const ws = fala.palavras.slice(i, i + l.n); i += l.n; y += l.tam * 1.08;
        return (
          <g key={k} transform={`translate(540 ${y}) rotate(-2)`}>
            <Letra x={0} y={0} tam={l.tam} cor={l.cor ?? CREME} borda={l.cor ? 0.16 : 0.2}>
              {ws.map((w, j) => { const e = limitar((t - inicio - w.i + 0.08) / 0.12); return <tspan key={j} fillOpacity={e} strokeOpacity={e}>{j ? " " : ""}{w.p}</tspan>; })}
            </Letra>
          </g>
        );
      })}
      {adesivo && <Adesivo x={540} y={y + 150 - salto} tam={80} giro={-5 + 3 * Math.sin(t * 7)} escala={vem} opacidade={limitar(vem * 2)}>{adesivo.texto}</Adesivo>}
    </g>
  );
};

/** O app do Rebanho em tela cheia: abre a partir de `de` e fecha em `ate`. Conteúdo em 1080 de largura, abaixo do cabeçalho (y > 330). */
export const TelaCheia: React.FC<{ t: number; de: number; ate: number; titulo: string; sub: string; children: React.ReactNode }> = ({ t, de, ate, titulo, sub, children }) => {
  const e = prog(t, de, 0.5, fora) * (1 - prog(t, ate, 0.4));
  if (e <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "620px 1500px", transform: `scale(${lerp(0.3, 1, e)})`, opacity: limitar(e * 2.5), borderRadius: (1 - e) * 120, overflow: "hidden", background: "#F4EFE6", fontFamily: CORPO, color: TEXTO }}>
      <div style={{ background: VERDE, padding: "150px 56px 44px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <Marca tamanho={92} />
          <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 74 }}>{titulo}</div>
        </div>
        <div style={{ fontSize: 38, marginTop: 14, opacity: 0.9 }}>{sub}</div>
      </div>
      {children}
    </div>
  );
};
/** Cartão branco do app, posicionado em pixels da tela. */
export const Cartao: React.FC<{ x?: number; y: number; w?: number; h: number; e?: number; fundo?: string; children: React.ReactNode }> = ({ x = 50, y, w = 980, h, e = 1, fundo = "#fff", children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 44, background: fundo, boxShadow: "0 6px 20px rgba(60,40,10,0.1)", opacity: limitar(e * 2), transform: `scale(${lerp(0.9, 1, e)})`, boxSizing: "border-box", overflow: "hidden" }}>{children}</div>
);

/** Encerramento: escurece a cena, nome do app e chamada para seguir. */
export const Fecho: React.FC<{ t: number; de: number }> = ({ t, de }) => {
  const f = prog(t, de + 0.15, 0.6), nome = prog(t, de + 0.25, 0.55, mola), segue = prog(t, de + 0.7, 0.45, mola);
  if (f <= 0) return null;
  const pulsa = t > de + 1.2 ? 1 + 0.04 * Math.sin((t - de - 1.2) * 6) : 1;
  return (
    <>
      <svg width={L} height={A} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="eq-fecho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16301D" stopOpacity={0.85} /><stop offset="0.62" stopColor="#16301D" stopOpacity={0.55} /><stop offset="1" stopColor="#16301D" stopOpacity={0.2} /></linearGradient></defs>
        <rect width={L} height={A} fill="url(#eq-fecho)" opacity={f} />
        <g transform={`translate(540 760) scale(${nome})`} opacity={limitar(nome * 2)}><Letra x={0} y={0} tam={210} borda={0.1}>Rebanho</Letra></g>
        <Adesivo x={540} y={930} tam={72} giro={-3} escala={segue * pulsa} opacidade={limitar(segue * 2)}>Segue pra ver mais!</Adesivo>
        <Confete t={t} de={de + 0.6} semente={29} x={540} y={700} />
      </svg>
      <div style={{ position: "absolute", left: 540 - 95, top: 330, opacity: limitar(nome * 2), transform: `scale(${nome})`, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.35))" }}><Marca tamanho={190} /></div>
    </>
  );
};
