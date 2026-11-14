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
      em: (i, j = i) => f >= FALAS[i].de - 4 && f < (FALAS[j + 1]?.de ?? Infinity) - 4,
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
