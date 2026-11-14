import React from "react";
import "../../lousa/fontes";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONTE_LOUSA } from "../../lousa/fontes";
import { Final, Legenda, MARCA } from "../Legendas";
import { elastico, limitar, prog, sair } from "../anim";
import type { Fala } from "../roteiro";
import { criarTempo } from "../tempo";
import { estimar } from "./roteiro";

export const POPPINS = "Poppins, sans-serif";

/** O que cada episódio recebe para desenhar um quadro. */
export type Quadro = {
  /** Quadro no tempo do roteiro (já ajustado à locução). */
  f: number;
  F: Fala[];
  /** Progresso 0..1 da fala `i` até o fim da fala `j` (por padrão, a mesma). */
  p: (i: number, j?: number) => number;
  /** A narração está entre a fala `i` e a `j`? */
  em: (i: number, j?: number) => boolean;
};

/** Cartão com o exemplo de registro que fecha o episódio. */
const Registro: React.FC<{ f: number; de: number; ate: number; texto: string }> = ({ f, de, ate, texto }) => {
  if (f < de || f >= ate + 12) return null;
  const entra = prog(f, de, de + 12, elastico);
  const sai = prog(f, ate, ate + 12);
  const n = Math.round(limitar((f - de - 10) / Math.min(60, texto.length * 1.1)) * texto.length);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 760, width: 880, minHeight: 430, boxSizing: "border-box", padding: "96px 60px 50px", background: "#FFFDF6", borderRadius: 26, boxShadow: "0 24px 60px rgba(36,26,74,0.28)", transform: `translateY(${(1 - entra) * 600 + sai * 900}px) rotate(${-1.5 + (1 - entra) * 5}deg)` }}>
        <div style={{ position: "absolute", top: -26, left: "50%", marginLeft: -110, width: 220, height: 62, borderRadius: 16, background: "#8B8FA8", boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.15)" }} />
        <div style={{ position: "absolute", top: 44, left: 60, fontFamily: POPPINS, fontWeight: 700, fontSize: 26, letterSpacing: 1.5, textTransform: "uppercase", color: MARCA.roxo, opacity: 0.75 }}>Exemplo de registro</div>
        <div style={{ fontFamily: FONTE_LOUSA, fontSize: 66, lineHeight: 1.22, color: MARCA.tinta }}>
          {texto.slice(0, n)}
          <span style={{ color: "transparent" }}>{texto.slice(n)}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Etiqueta com o nome do conceito do episódio. */
export const Conceito: React.FC<{ f: number; de: number; ate: number; texto: string; topo?: number }> = ({ f, de, ate, texto, topo = 250 }) => {
  if (f < de || f >= ate) return null;
  const p = prog(f, de, de + 12, elastico) * (1 - prog(f, ate - 8, ate));
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: topo, transform: `scale(${p})`, background: MARCA.sol, color: MARCA.tinta, fontFamily: POPPINS, fontWeight: 800, fontSize: texto.length > 22 ? 58 : 72, padding: "24px 50px 18px", borderRadius: 40, boxShadow: "0 18px 44px rgba(36,26,74,0.25)", whiteSpace: "nowrap" }}>{texto}</div>
    </AbsoluteFill>
  );
};

/** Fileira de etiquetas numeradas; `aceso` diz qual está em destaque (-1 = nenhuma). */
export const Etapas: React.FC<{ itens: string[]; aceso: number; opacidade?: number; topo?: number; emColuna?: boolean }> = ({ itens, aceso, opacidade = 1, topo = 236, emColuna }) => (
  <div style={{ position: "absolute", top: topo, left: 0, right: 0, display: "flex", flexDirection: emColuna ? "column" : "row", alignItems: "center", justifyContent: "center", gap: 14, opacity: opacidade }}>
    {itens.map((t, i) => {
      const on = i === aceso;
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: on ? MARCA.roxo : "#FFFFFF", color: on ? "#FFFFFF" : MARCA.tinta, borderRadius: 999, padding: emColuna ? "12px 30px 10px 12px" : "8px 20px 6px 8px", fontFamily: POPPINS, fontWeight: 700, fontSize: emColuna ? 40 : 27, boxShadow: "0 8px 22px rgba(36,26,74,0.18)", whiteSpace: "nowrap", transform: `scale(${on ? 1.06 : 1})` }}>
          <span style={{ width: emColuna ? 54 : 38, height: emColuna ? 54 : 38, borderRadius: "50%", background: on ? MARCA.sol : MARCA.roxo, color: on ? MARCA.tinta : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{i + 1}</span>
          {t}
        </div>
      );
    })}
  </div>
);

/**
 * Monta um episódio: legenda, ajuste ao tempo da voz, cartão de registro e logo no fim.
 * `desenhar` devolve a cena 3D e o que mais for por cima dela.
 */
export const criarEpisodio = (cfg: {
  textos: string[];
  tempos: { total: number; falas: number[][] };
  /** Texto do exemplo de registro e em qual fala ele entra (por padrão, a última). */
  registro: string;
  registroNa?: number;
  desenhar: (q: Quadro) => React.ReactNode;
}) => {
  const { FALAS, TOTAL_QUADROS } = estimar(cfg.textos);
  const { TOTAL, noRoteiro } = criarTempo(FALAS, TOTAL_QUADROS, cfg.tempos);
  const fimDaFala = FALAS[FALAS.length - 1].ate;
  const final = { de: fimDaFala + 8, marca: ["Explica,", "Mente!"], linhas: ["", "Em breve · app para clínicas"] };
  const registroDe = FALAS[cfg.registroNa ?? FALAS.length - 1].de;
  const Componente: React.FC = () => {
    const f = noRoteiro(useCurrentFrame());
    const q: Quadro = {
      f,
      F: FALAS,
      p: (i, j = i) => limitar((f - FALAS[i].de) / (FALAS[j].ate - FALAS[i].de)),
      // a primeira fala vale desde o quadro zero, para o vídeo não abrir com a cena errada
      em: (i, j = i) => (i === 0 || f >= FALAS[i].de - 4) && f < (FALAS[j + 1]?.de ?? Infinity) - 4,
    };
    return (
      <AbsoluteFill style={{ background: MARCA.creme }}>
        {f < final.de + 14 && cfg.desenhar(q)}
        <Registro f={f} de={registroDe} ate={final.de - 2} texto={cfg.registro} />
        <Legenda f={f} falas={FALAS} />
        <Final f={f} final={final} />
      </AbsoluteFill>
    );
  };
  return { Componente, TOTAL, FALAS };
};

export { sair };

/** Balão com texto (pedido de um adulto, pensamento). */
export const Balao: React.FC<{ texto: string; p: number; topo: number; esquerda?: number; cor?: string; corTexto?: string; tamanho?: number }> = ({ texto, p, topo, esquerda, cor = "#FFFFFF", corTexto = MARCA.tinta, tamanho = 50 }) =>
  p < 0.01 ? null : (
  <div style={{ position: "absolute", top: topo, left: esquerda ?? 0, right: esquerda === undefined ? 0 : undefined, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
    <div style={{ transform: `scale(${Math.max(0.001, p)})`, background: cor, color: corTexto, fontFamily: POPPINS, fontWeight: 800, fontSize: tamanho, lineHeight: 1.15, padding: "24px 44px 20px", borderRadius: 44, boxShadow: "0 14px 36px rgba(36,26,74,0.22)", textAlign: "center", maxWidth: 880 }}>{texto}</div>
  </div>
  );

/** Ciclo desenhado em roda: etapas ligadas por setas, com uma em destaque. */
export const Roda: React.FC<{ itens: string[]; aceso: number; visiveis: number; cores?: string[]; cy?: number; raio?: number }> = ({ itens, aceso, visiveis, cores = [], cy = 760, raio = 300 }) => {
  const n = itens.length;
  const cx = 540;
  const passo = (2 * Math.PI) / n;
  const folga = n === 3 ? 0.5 : 0.42;
  return (
    <>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <circle cx={cx} cy={cy} r={raio} fill="none" stroke={MARCA.roxo} strokeOpacity="0.25" strokeWidth="14" strokeDasharray="2 26" strokeLinecap="round" />
        {itens.map((_, i) => {
          const a0 = i * passo + folga;
          const a1 = (i + 1) * passo - folga;
          const p0 = { x: cx + raio * Math.sin(a0), y: cy - raio * Math.cos(a0) };
          const p1 = { x: cx + raio * Math.sin(a1), y: cy - raio * Math.cos(a1) };
          return (
            <g key={i} opacity={i + 1 < visiveis || visiveis > n ? 1 : 0}>
              <path d={`M${p0.x} ${p0.y} A${raio} ${raio} 0 0 1 ${p1.x} ${p1.y}`} fill="none" stroke={MARCA.roxo} strokeWidth="12" strokeLinecap="round" />
              <circle cx={p1.x} cy={p1.y} r="18" fill={MARCA.roxo} />
            </g>
          );
        })}
      </svg>
      {itens.map((t, i) => {
        const x = cx + raio * Math.sin(i * passo);
        const y = cy - raio * Math.cos(i * passo);
        const on = i === aceso;
        return (
          <div key={i} style={{ position: "absolute", left: x - 200, top: y - 66, width: 400, height: 132, borderRadius: 66, background: on ? (cores[i] ?? MARCA.roxo) : "#FFFFFF", color: on ? "#FFFFFF" : MARCA.tinta, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.08, fontFamily: POPPINS, fontWeight: 800, fontSize: t.length > 16 ? 38 : 46, boxShadow: "0 12px 30px rgba(36,26,74,0.2)", transform: `scale(${(i < visiveis ? 1 : 0) * (on ? 1.08 : 1)})` }}>
            {t}
          </div>
        );
      })}
    </>
  );
};

/** Três quadros empilhados (três cenas ao mesmo tempo), com etiqueta e destaque. `aceso` = índices em destaque, ou null para todos. */
export const TresQuadros: React.FC<{ f: number; de: number; rotulos: string[]; aceso: number[] | null; cenas: (largura: number, altura: number) => React.ReactNode[] }> = ({ f, de, rotulos, aceso, cenas }) => {
  const L = 980;
  const A = 364;
  return (
    <AbsoluteFill style={{ background: MARCA.creme }}>
      {cenas(L, A).map((cena, i) => {
        const entra = prog(f, de + 2 + i * 12, de + 18 + i * 12, elastico);
        const on = !aceso || aceso.includes(i);
        return (
          <div key={i} style={{ position: "absolute", left: 50, top: 196 + i * (A + 18), width: L, height: A, borderRadius: 36, overflow: "hidden", transform: `scale(${Math.max(0.001, entra)})`, opacity: on ? 1 : 0.38, outline: `${aceso && on ? 10 : 0}px solid ${MARCA.roxo}`, outlineOffset: -10, boxShadow: "0 12px 30px rgba(36,26,74,0.18)" }}>
            {cena}
            <div style={{ position: "absolute", left: 22, top: 20, display: "flex", alignItems: "center", gap: 12, background: aceso && on ? MARCA.roxo : "#FFFFFF", color: aceso && on ? "#FFFFFF" : MARCA.tinta, borderRadius: 999, padding: "10px 26px 8px 10px", fontFamily: POPPINS, fontWeight: 700, fontSize: 34, boxShadow: "0 8px 22px rgba(36,26,74,0.18)" }}>
              <span style={{ width: 46, height: 46, borderRadius: "50%", background: aceso && on ? MARCA.sol : MARCA.roxo, color: aceso && on ? MARCA.tinta : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{i + 1}</span>
              {rotulos[i]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
