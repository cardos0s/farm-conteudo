import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { cor } from "../marca";
import { RH, RW } from "./base";

// Fundos do formato vertical: o gradiente da marca em movimento e o céu da noite (vídeo 3).

const acaso = (i: number, n: number) => {
  const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Gradiente da marca com brilhos que se movem, uma malha de pontos e o ∞ girando devagar. */
export const FundoReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(168deg, ${cor.noite} 0%, #06116e 46%, #0a55c8 86%, #0a7fe0 100%)`, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          left: 240,
          top: -560,
          // por transformação, o movimento lento não anda em degraus de 1 px
          transform: `translate(${Math.sin(t * 0.27) * 110}px, ${Math.cos(t * 0.21) * 70}px)`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,173,255,0.42) 0%, rgba(0,173,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          left: -820,
          top: 760,
          transform: `translate(${Math.cos(t * 0.24) * 90}px, ${Math.sin(t * 0.19) * 110}px)`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(40,73,219,0.6) 0%, rgba(40,73,219,0) 60%)",
        }}
      />
      {/* malha de pontos que desce bem devagar */}
      <div style={{ position: "absolute", inset: 0, WebkitMaskImage: "radial-gradient(ellipse 75% 60% at 50% 46%, #000 30%, transparent 100%)" }}>
        <div
          style={{
            position: "absolute",
            inset: -108,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.13) 1.6px, transparent 1.6px)",
            backgroundSize: "54px 54px",
            transform: `translate(${(t * 5) % 54}px, ${(t * 9) % 54}px)`,
          }}
        />
      </div>
      <svg width={RW} height={RH} viewBox={`0 0 ${RW} ${RH}`} style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
        <path
          d="M540 960 C 760 620, 1220 620, 1220 960 C 1220 1300, 760 1300, 540 960 C 320 620, -140 620, -140 960 C -140 1300, 320 1300, 540 960 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth={3}
          transform={`rotate(${-62 + Math.sin(t * 0.16) * 4} 540 960) scale(${1.05 + 0.03 * Math.sin(t * 0.3)})`}
          style={{ transformOrigin: "540px 960px" }}
        />
      </svg>
      {/* topo e base mais escuros: os textos e os botões do Instagram ficam legíveis por cima */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 420, background: "linear-gradient(180deg, rgba(0,4,45,0.55), rgba(0,4,45,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, background: "linear-gradient(0deg, rgba(0,4,45,0.6), rgba(0,4,45,0))" }} />
    </AbsoluteFill>
  );
};

/** Céu de madrugada: azul quase preto, o brilho da lua e estrelas piscando. */
export const CeuNoiteReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const estrelas = React.useMemo(
    () => Array.from({ length: 120 }, (_, i) => ({ x: acaso(i, 1) * RW, y: acaso(i, 2) * RH, tam: 1.4 + acaso(i, 3) * 2.6, fase: acaso(i, 4) * 6.28, vel: 0.6 + acaso(i, 5) * 1.4 })),
    [],
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(172deg, #01030f 0%, #040a2a 50%, #0a1858 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -360, top: -420, width: 1300, height: 1300, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,150,255,0.22) 0%, rgba(120,150,255,0) 62%)" }} />
      <div style={{ position: "absolute", right: -520, bottom: -480, width: 1500, height: 1500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,173,255,0.2) 0%, rgba(0,173,255,0) 60%)" }} />
      {estrelas.map((e, i) => (
        <div key={i} style={{ position: "absolute", left: e.x, top: e.y, width: e.tam, height: e.tam, borderRadius: "50%", background: "#dfe7ff", opacity: 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * e.vel + e.fase)) }} />
      ))}
    </AbsoluteFill>
  );
};
