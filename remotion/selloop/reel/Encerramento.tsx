import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cor, fonte, marca } from "../marca";
import { prender, RW } from "./base";
import { FundoReel } from "./Fundo";

// Encerramento vertical: o logo entra com anéis de luz, a frase sobe palavra por palavra e o botão
// "Agende uma demonstração" pulsa.

const LOGO = { w: 1920, h: 667 };

export const EncerramentoReel: React.FC<{ frase: string }> = ({ frase }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const mola = (atraso: number, c: { damping?: number; stiffness?: number; mass?: number } = {}) => spring({ frame: frame - Math.round(atraso * fps), fps, config: { damping: 13, stiffness: 130, mass: 0.8, ...c } });
  const logo = mola(0.05);
  const largura = 640;
  const altura = (largura * LOGO.h) / LOGO.w;
  const brilho = prender((t - 0.45) / 0.8);
  const palavras = frase.split(/\s+/);
  const botao = mola(0.75 + palavras.length * 0.05, { damping: 10 });
  const pulso = 1 + 0.028 * Math.sin(Math.max(0, t - 1.6) * 3.2);
  const endereco = mola(1.05 + palavras.length * 0.05, { damping: 200 });
  return (
    <AbsoluteFill>
      <FundoReel />
      {/* anéis que se abrem atrás do logo */}
      {[0, 1, 2].map((i) => {
        const k = prender((t - 0.1 - i * 0.22) / 1.5);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: RW / 2 - 200 - 520 * k,
              top: 700 - 200 - 520 * k,
              width: 400 + 1040 * k,
              height: 400 + 1040 * k,
              borderRadius: "50%",
              border: "3px solid rgba(127,216,255,0.6)",
              opacity: (1 - k) * 0.7,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ position: "relative", width: largura, height: altura, transform: `scale(${0.55 + 0.45 * logo})`, opacity: prender(logo * 1.5) }}>
          <Img src={marca.logoBranco} style={{ position: "absolute", inset: 0, width: largura, height: altura }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent ${brilho * 150 - 45}%, rgba(127,216,255,0.95) ${brilho * 150 - 28}%, transparent ${brilho * 150 - 11}%)`,
              WebkitMaskImage: `url(${marca.logoBranco})`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        </div>
        <div style={{ marginTop: 70, padding: "0 70px", fontFamily: fonte, fontWeight: 700, fontSize: 66, lineHeight: 1.16, letterSpacing: -1.2, color: "#ffffff", textWrap: "balance" as never, textShadow: "0 6px 26px rgba(0,4,45,0.5)" }}>
          {palavras.map((p, i) => {
            const s = mola(0.4 + i * 0.05, { damping: 13, stiffness: 170, mass: 0.6 });
            return (
              <React.Fragment key={i}>
                <span style={{ display: "inline-block", opacity: prender(s * 1.3), transform: `translateY(${(1 - s) * 46}px) rotate(${(1 - s) * 5}deg)` }}>{p}</span>{" "}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 84,
            transform: `scale(${(0.5 + 0.5 * botao) * pulso})`,
            opacity: prender(botao * 1.4),
            padding: "30px 62px",
            borderRadius: 999,
            background: "#ffffff",
            color: cor.marinho,
            fontFamily: fonte,
            fontWeight: 700,
            fontSize: 46,
            boxShadow: "0 30px 70px rgba(0,4,45,0.5), 0 0 0 10px rgba(255,255,255,0.14)",
          }}
        >
          Agende uma demonstração
        </div>
        <div style={{ marginTop: 44, opacity: endereco, transform: `translateY(${(1 - endereco) * 20}px)`, fontFamily: fonte, fontWeight: 600, fontSize: 42, color: "rgba(255,255,255,0.9)" }}>selloop.com.br</div>
      </div>
    </AbsoluteFill>
  );
};
