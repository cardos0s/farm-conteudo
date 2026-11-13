import React from "react";
import { AbsoluteFill } from "remotion";
import { FONTE_LOUSA } from "../lousa/fontes";
import { elastico, limitar, prog, sair } from "./anim";
import { FALAS, FINAL, NOTA, REPLAY, type Fala } from "./roteiro";

export const MARCA = { roxo: "#4B2BBF", coral: "#FF5A4E", sol: "#FFC53D", menta: "#2EC4B6", creme: "#FFF4E4", tinta: "#241A4A" };
const POPPINS = "Poppins, sans-serif";

const QUEM: Record<Fala["quem"], { nome: string; cor: string } | null> = {
  lia: { nome: "Lia", cor: MARCA.coral },
  tera: { nome: "Terapeuta", cor: MARCA.roxo },
  narracao: null,
};

/** Legenda da fala ou da narração do momento, acima da faixa de botões do Instagram. */
export const Legenda: React.FC<{ f: number }> = ({ f }) => {
  const fl = FALAS.find((x) => f >= x.de && f < x.ate);
  if (!fl) return null;
  const entra = prog(f, fl.de, fl.de + 7, sair);
  const sai = 1 - prog(f, fl.ate - 5, fl.ate);
  const quem = QUEM[fl.quem];
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 380, paddingLeft: 70, paddingRight: 70 }}>
      <div style={{ opacity: entra * sai, transform: `translateY(${(1 - entra) * 26}px)`, display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: 900 }}>
        {quem && (
          <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 34, color: "#FFFFFF", background: quem.cor, padding: "6px 24px 4px", borderRadius: "18px 18px 0 0", marginLeft: 26, letterSpacing: 0.5 }}>
            {quem.nome}
          </div>
        )}
        <div
          style={{
            fontFamily: POPPINS,
            fontWeight: 700,
            fontSize: quem ? 56 : 52,
            lineHeight: 1.2,
            color: quem ? MARCA.tinta : "#FFFFFF",
            background: quem ? "#FFFFFF" : "rgba(36,26,74,0.88)",
            padding: "24px 36px 22px",
            borderRadius: 30,
            textAlign: quem ? "left" : "center",
            boxShadow: "0 14px 40px rgba(36,26,74,0.22)",
            textWrap: "balance",
          }}
        >
          {fl.texto}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Moldura e selo de "replay" enquanto a cena se repete. */
export const Replay: React.FC<{ f: number }> = ({ f }) => {
  if (f < REPLAY.de - 8 || f >= REPLAY.ate + 8) return null;
  const dentro = prog(f, REPLAY.de, REPLAY.de + 10) * (1 - prog(f, REPLAY.ate - 8, REPLAY.ate));
  const clarao = Math.max(1 - Math.abs(f - REPLAY.de) / 8, 1 - Math.abs(f - REPLAY.ate) / 8, f >= 592 && f <= 600 ? 1 - Math.abs(f - 596) / 4 : 0);
  const pisca = 0.65 + 0.35 * Math.sin(f * 0.35);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ border: `${18 * dentro}px solid ${MARCA.roxo}`, borderRadius: 64 * dentro, boxShadow: `inset 0 0 160px rgba(75,43,191,${0.28 * dentro})` }} />
      <div style={{ position: "absolute", top: 250, left: 64, opacity: dentro, transform: `scale(${0.6 + 0.4 * dentro})`, transformOrigin: "left top", background: MARCA.roxo, borderRadius: 999, padding: "16px 30px", display: "flex", gap: 6, alignItems: "center" }}>
        {[0, 1].map((i) => (
          <svg key={i} width="40" height="44" viewBox="0 0 40 44" style={{ opacity: pisca }}>
            <path d="M36 4 L6 22 L36 40 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: limitar(clarao) * 0.9 }} />
    </AbsoluteFill>
  );
};

/** A anotação da terapeuta, escrita à mão. */
export const Nota: React.FC<{ f: number }> = ({ f }) => {
  if (f < NOTA.de || f >= NOTA.ate + 10) return null;
  const entra = prog(f, NOTA.de, NOTA.de + 12, elastico);
  const sai = prog(f, NOTA.ate, NOTA.ate + 10);
  const n = Math.round(limitar((f - NOTA.de - 8) / (NOTA.escreveAte - NOTA.de - 8)) * NOTA.texto.length);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 930,
          width: 860,
          minHeight: 400,
          padding: "88px 60px 50px",
          boxSizing: "border-box",
          background: "#FFFDF6",
          borderRadius: 22,
          boxShadow: "0 24px 60px rgba(36,26,74,0.28)",
          transform: `translateY(${(1 - entra) * 500 + sai * 700}px) rotate(${-2 + (1 - entra) * 5}deg)`,
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 85px, rgba(75,43,191,0.16) 85px 88px)",
          backgroundPosition: "0 70px",
        }}
      >
        <div style={{ position: "absolute", top: -26, left: "50%", marginLeft: -110, width: 220, height: 62, borderRadius: 16, background: "#8B8FA8", boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.15)" }} />
        <div style={{ fontFamily: FONTE_LOUSA, fontSize: 62, lineHeight: "88px", color: MARCA.tinta }}>
          {NOTA.texto.slice(0, n)}
          <span style={{ color: "transparent" }}>{NOTA.texto.slice(n)}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Tela final: marca e as duas linhas. */
export const Final: React.FC<{ f: number }> = ({ f }) => {
  if (f < FINAL.de) return null;
  const fundo = prog(f, FINAL.de, FINAL.de + 12);
  const p1 = prog(f, FINAL.de + 8, FINAL.de + 24, elastico);
  const p2 = prog(f, FINAL.de + 14, FINAL.de + 30, elastico);
  const balao = prog(f, FINAL.de + 4, FINAL.de + 20, elastico);
  const l1 = prog(f, FINAL.de + 34, FINAL.de + 46, sair);
  const l2 = prog(f, FINAL.de + 46, FINAL.de + 58, sair);
  return (
    <AbsoluteFill style={{ background: MARCA.creme, opacity: fundo, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: -260, right: -260, width: 760, height: 760, borderRadius: "50%", background: MARCA.sol, opacity: 0.55 }} />
      <div style={{ position: "absolute", bottom: -300, left: -240, width: 820, height: 820, borderRadius: "50%", background: MARCA.menta, opacity: 0.35 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -120 }}>
        {/* marca provisória: balão de fala + nome */}
        <div style={{ position: "relative", transform: `scale(${balao})`, background: MARCA.roxo, borderRadius: 90, padding: "70px 80px 60px", boxShadow: "0 30px 70px rgba(75,43,191,0.3)" }}>
          <div style={{ position: "absolute", bottom: -58, left: 110, width: 0, height: 0, borderLeft: "20px solid transparent", borderRight: "90px solid transparent", borderTop: `70px solid ${MARCA.roxo}` }} />
          <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 150, lineHeight: 1.02, color: "#FFFFFF", transform: `scale(${p1})`, transformOrigin: "left center", letterSpacing: -3 }}>{FINAL.marca[0]}</div>
          <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 150, lineHeight: 1.02, color: MARCA.sol, transform: `scale(${p2})`, transformOrigin: "left center", letterSpacing: -3 }}>{FINAL.marca[1]}</div>
        </div>
        <div style={{ marginTop: 150, fontFamily: POPPINS, fontWeight: 800, fontSize: 64, color: MARCA.tinta, opacity: l1, transform: `translateY(${(1 - l1) * 30}px)` }}>{FINAL.linhas[0]}</div>
        <div style={{ marginTop: 34, fontFamily: POPPINS, fontWeight: 700, fontSize: 46, color: "#FFFFFF", background: MARCA.coral, padding: "18px 40px 14px", borderRadius: 999, opacity: l2, transform: `translateY(${(1 - l2) * 30}px)` }}>
          {FINAL.linhas[1]}
        </div>
      </div>
    </AbsoluteFill>
  );
};
