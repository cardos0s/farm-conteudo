import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { canais, cor, fonte, type Canal } from "./marca";

// Peças visuais do pack: fundo da marca, balões flutuantes e legenda.

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, fps, frame };
};

/** Fundo no gradiente do site, com brilhos lentos e o ∞ da marca bem discreto. */
export const Fundo: React.FC = () => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${cor.noite} 0%, #071a8a 58%, #0a7fe0 100%)`, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          left: 980 + Math.sin(t * 0.25) * 60,
          top: -620 + Math.cos(t * 0.2) * 40,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,173,255,0.42) 0%, rgba(0,173,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          left: -520 + Math.cos(t * 0.22) * 50,
          top: 380 + Math.sin(t * 0.18) * 40,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(40,73,219,0.5) 0%, rgba(40,73,219,0) 60%)",
        }}
      />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.07 }}>
        <path
          d="M960 540 C 1180 260, 1580 260, 1580 540 C 1580 820, 1180 820, 960 540 C 740 260, 340 260, 340 540 C 340 820, 740 820, 960 540 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          transform={`rotate(${-8 + Math.sin(t * 0.15) * 2} 960 540)`}
        />
      </svg>
    </AbsoluteFill>
  );
};

type Aparicao = { de: number; ate?: number };

/** Entrada com mola, flutuação leve e saída suave, no tempo da composição (s). */
function useAparicao({ de, ate }: Aparicao, atrasoSaida = 0.35) {
  const { t, fps, frame } = useT();
  const entrada = spring({ frame: frame - Math.round(de * fps), fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
  const saida = ate === undefined ? 1 : interpolate(t, [ate - atrasoSaida, ate], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = Math.min(entrada, saida);
  const flutua = Math.sin((t - de) * ((2 * Math.PI) / 3.4)) * 7;
  return { vis, flutua, ativo: t >= de && (ate === undefined || t <= ate) };
}

/** Balão com a logo oficial de um canal (WhatsApp, Instagram, Messenger), sem alterar a logo. */
export const BalaoCanal: React.FC<Aparicao & { canal: Canal; x: number; y: number; tamanho?: number; comNome?: boolean }> = ({
  canal,
  x,
  y,
  tamanho = 112,
  comNome = false,
  ...ap
}) => {
  const { vis, flutua, ativo } = useAparicao(ap);
  if (!ativo && vis <= 0.001) return null;
  const c = canais[canal];
  const logo = tamanho * 0.58;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + flutua,
        transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * vis})`,
        opacity: vis,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: comNome ? `${tamanho * 0.12}px ${tamanho * 0.32}px ${tamanho * 0.12}px ${tamanho * 0.12}px` : 0,
        borderRadius: tamanho,
        background: comNome ? "#ffffff" : "transparent",
        boxShadow: comNome ? "0 18px 40px rgba(0, 4, 45, 0.35)" : undefined,
      }}
    >
      <div
        style={{
          width: comNome ? tamanho * 0.76 : tamanho,
          height: comNome ? tamanho * 0.76 : tamanho,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: comNome ? undefined : "0 18px 40px rgba(0, 4, 45, 0.35)",
        }}
      >
        <Img src={c.src} style={{ width: comNome ? logo * 0.8 : logo, height: comNome ? logo * 0.8 : logo, objectFit: "contain" }} />
      </div>
      {comNome && (
        <span style={{ fontFamily: fonte, fontWeight: 600, fontSize: tamanho * 0.27, color: cor.tinta, whiteSpace: "nowrap" }}>{c.nome}</span>
      )}
    </div>
  );
};

/** Chip com o nome de um recurso (e um ícone opcional), para marcar o que acabou de acontecer na tela. */
export const Chip: React.FC<Aparicao & { x: number; y: number; texto: string; icone?: React.ReactNode; destaque?: boolean; tamanho?: number }> = ({
  x,
  y,
  texto,
  icone,
  destaque = false,
  tamanho = 30,
  ...ap
}) => {
  const { vis, flutua, ativo } = useAparicao(ap);
  if (!ativo && vis <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + flutua * 0.6,
        transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * vis})`,
        opacity: vis,
        display: "flex",
        alignItems: "center",
        gap: tamanho * 0.45,
        padding: `${tamanho * 0.5}px ${tamanho * 0.95}px`,
        borderRadius: tamanho * 2,
        background: destaque ? cor.royal : "#ffffff",
        color: destaque ? "#ffffff" : cor.tinta,
        boxShadow: "0 18px 44px rgba(0, 4, 45, 0.35)",
        fontFamily: fonte,
        fontWeight: 600,
        fontSize: tamanho,
        whiteSpace: "nowrap",
      }}
    >
      {icone && <span style={{ display: "flex", color: destaque ? "#ffffff" : cor.royal }}>{icone}</span>}
      {texto}
    </div>
  );
};

export type Fala = { de: number; ate: number; texto: string };

/** Legenda da locução: uma frase por vez, embaixo, legível sem som. */
export const Legenda: React.FC<{ falas: Fala[] }> = ({ falas }) => {
  const { t } = useT();
  const f = falas.find((x) => t >= x.de && t < x.ate);
  if (!f) return null;
  const o = Math.min(interpolate(t, [f.de, f.de + 0.18], [0, 1], { extrapolateRight: "clamp" }), interpolate(t, [f.ate - 0.18, f.ate], [1, 0], { extrapolateLeft: "clamp" }));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          maxWidth: 1380,
          padding: "14px 30px",
          borderRadius: 18,
          background: "rgba(0, 4, 45, 0.78)",
          color: "#ffffff",
          fontFamily: fonte,
          fontWeight: 500,
          fontSize: 34,
          lineHeight: 1.3,
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        {f.texto}
      </div>
    </div>
  );
};

/** Uma folha (ex.: o PDF gerado pela plataforma) que entra deslizando, levemente inclinada, com sombra. */
export const Folha: React.FC<Aparicao & { src: string; x: number; y: number; largura: number; rotacao?: number; rotulo?: string }> = ({
  src,
  x,
  y,
  largura,
  rotacao = -3,
  rotulo,
  ...ap
}) => {
  const { t, fps, frame } = useT();
  const entrada = spring({ frame: frame - Math.round(ap.de * fps), fps, config: { damping: 16, stiffness: 110, mass: 0.8 } });
  const saida = ap.ate === undefined ? 1 : interpolate(t, [ap.ate - 0.35, ap.ate], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = Math.min(entrada, saida);
  if (t < ap.de || vis <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + (1 - entrada) * 260,
        width: largura,
        transform: `translate(-50%, 0) rotate(${rotacao * entrada}deg)`,
        opacity: vis,
        filter: "drop-shadow(0 30px 50px rgba(0, 4, 45, 0.45))",
      }}
    >
      <Img src={src} style={{ width: "100%", display: "block", borderRadius: 6 }} />
      {rotulo && (
        <div style={{ position: "absolute", left: "50%", top: -26, transform: "translate(-50%, -100%)", padding: "12px 24px", borderRadius: 999, background: cor.royal, color: "#fff", fontFamily: fonte, fontWeight: 600, fontSize: 28, whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,4,45,0.35)" }}>
          {rotulo}
        </div>
      )}
    </div>
  );
};
