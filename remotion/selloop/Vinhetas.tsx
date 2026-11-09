import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cor, fonte, marca } from "./marca";
import { Fundo } from "./Pecas";

// Abertura e encerramento dos vídeos do pack, na identidade da Selloop.

const suave = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const prender = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Linha central do ∞ do logo, em px do PNG (1920×667): o "oo" ocupa x 914–1560 e y 230–548,
// com traço de ~74 px e cruzamento em (1237, 389).
const LOGO = { w: 1920, h: 667 };
const CX = 1237;
const CY = 389;
const C = 286; // meia largura da linha central
const B = 163; // alcance vertical dos pontos de controle (topo da curva = 0,75·B)
const A = 110;
const CAMINHO_LOOP =
  `M${CX} ${CY} C${CX + A} ${CY - B} ${CX + C} ${CY - B} ${CX + C} ${CY} ` +
  `C${CX + C} ${CY + B} ${CX + A} ${CY + B} ${CX} ${CY} ` +
  `C${CX - A} ${CY - B} ${CX - C} ${CY - B} ${CX - C} ${CY} ` +
  `C${CX - C} ${CY + B} ${CX - A} ${CY + B} ${CX} ${CY}`;

/** Abertura de ~1,8 s: o ∞ do logo se desenha no lugar exato e as letras aparecem em volta. */
export const Abertura: React.FC<{ largura?: number }> = ({ largura = 640 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const desenho = suave(prender(t / 0.9));
  const letras = spring({ frame: frame - Math.round(0.72 * fps), fps, config: { damping: 200 }, durationInFrames: Math.round(0.5 * fps) });
  const traco = 1 - prender((t - 1.05) / 0.25);
  const brilho = prender((t - 1.1) / 0.7);
  const escala = 0.94 + 0.06 * suave(prender(t / 1.6));
  const altura = (largura * LOGO.h) / LOGO.w;
  return (
    <AbsoluteFill>
      <Fundo />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: largura, height: altura, transform: `scale(${escala})` }}>
          <Img src={marca.logoBranco} style={{ position: "absolute", inset: 0, width: largura, height: altura, opacity: letras }} />
          <svg width={largura} height={altura} viewBox={`0 0 ${LOGO.w} ${LOGO.h}`} style={{ position: "absolute", inset: 0, opacity: traco, overflow: "visible" }}>
            <path d={CAMINHO_LOOP} fill="none" stroke="#ffffff" strokeWidth={74} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenho} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent ${brilho * 140 - 40}%, rgba(0,173,255,0.9) ${brilho * 140 - 25}%, transparent ${brilho * 140 - 10}%)`,
              WebkitMaskImage: `url(${marca.logoBranco})`,
              WebkitMaskSize: "100% 100%",
              opacity: letras,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Encerramento: logo, a frase do vídeo e a chamada para a demonstração. */
export const Encerramento: React.FC<{ frase: string }> = ({ frase }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = (atraso: number) => spring({ frame: frame - Math.round(atraso * fps), fps, config: { damping: 200 } });
  const subir = (atraso: number) => ({ opacity: ent(atraso), transform: `translateY(${(1 - ent(atraso)) * 30}px)` });
  const t = frame / fps;
  const pulso = 1 + 0.025 * Math.sin(prender((t - 1.2) / 2.4) * Math.PI * 2);
  return (
    <AbsoluteFill>
      <Fundo />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={subir(0)}>
          <Img src={marca.logoBranco} style={{ width: 460 }} />
        </div>
        <div style={{ ...subir(0.25), marginTop: 44, fontFamily: fonte, fontWeight: 600, fontSize: 58, color: "#ffffff", letterSpacing: -0.5 }}>{frase}</div>
        <div
          style={{
            ...subir(0.55),
            marginTop: 56,
            transform: `${subir(0.55).transform} scale(${pulso})`,
            padding: "22px 46px",
            borderRadius: 999,
            background: "#ffffff",
            color: cor.marinho,
            fontFamily: fonte,
            fontWeight: 700,
            fontSize: 36,
            boxShadow: "0 20px 50px rgba(0,4,45,0.4)",
          }}
        >
          Agende uma demonstração
        </div>
        <div style={{ ...subir(0.75), marginTop: 30, fontFamily: fonte, fontWeight: 500, fontSize: 32, color: "rgba(255,255,255,0.85)" }}>selloop.com.br</div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          opacity: interpolate(t, [0, 0.25], [0.35, 0], { extrapolateRight: "clamp" }),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
