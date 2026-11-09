import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { enquadreEm, type Plano } from "./camera";
import { cliques, mouseEm, type Gravacao } from "./gravacao";
import { fonte, H, W } from "./marca";

// A tela gravada dentro de uma janela de navegador, com a câmera e o cursor por cima.
// No plano geral a tela (1600×900 px CSS) aparece 1:1 no quadro de 1920×1080; o vídeo gravado em 2x
// segura o zoom até ~2,2 sem perder nitidez.

export const BARRA = 46;
const RAIO = 16;

export function layoutGeral(tela: { w: number; h: number }) {
  const sx = (W - tela.w) / 2;
  const sy = (H - tela.h - BARRA) / 2 + BARRA;
  return { sx, sy, sw: tela.w, sh: tela.h };
}

const prender = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Transformação do conjunto janela+tela para o enquadramento pedido, sem mostrar fundo onde não deve. */
export function transformacao(enq: { zoom: number; x: number; y: number }, tela: { w: number; h: number }) {
  const { sx, sy, sw, sh } = layoutGeral(tela);
  const z = enq.zoom;
  const px = sx + enq.x * (sw / tela.w);
  const py = sy + enq.y * (sh / tela.h);
  let tx = W / 2 - px * z;
  let ty = H / 2 - py * z;
  // Na horizontal: a margem visível encolhe até sumir quando a tela cobre o quadro inteiro.
  const zcH = W / sw;
  const mH = sx * Math.max(0, 1 - (z - 1) / (zcH - 1));
  const loX = W - mH - (sx + sw) * z;
  const hiX = mH - sx * z;
  tx = loX > hiX ? (loX + hiX) / 2 : prender(tx, loX, hiX);
  // Na vertical, a janela inclui a barra do navegador.
  const topo = sy - BARRA;
  const alt = sh + BARRA;
  const zcV = H / alt;
  const mV = topo * Math.max(0, 1 - (z - 1) / (zcV - 1));
  const loY = H - mV - (topo + alt) * z;
  const hiY = mV - topo * z;
  ty = loY > hiY ? (loY + hiY) / 2 : prender(ty, loY, hiY);
  return { tx, ty, z };
}

const Bolinhas: React.FC = () => (
  <div style={{ display: "flex", gap: 9, position: "absolute", left: 20, top: (BARRA - 13) / 2 }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
    ))}
  </div>
);

const Cadeado: React.FC = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const BarraNavegador: React.FC<{ url: string }> = ({ url }) => (
  <div style={{ position: "relative", height: BARRA, background: "#eef1f6", borderBottom: "1px solid #dfe3ea" }}>
    <Bolinhas />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 8,
        transform: "translateX(-50%)",
        height: BARRA - 16,
        minWidth: 420,
        padding: "0 18px",
        borderRadius: 9,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: fonte,
        fontSize: 15,
        fontWeight: 500,
        color: "#475467",
      }}
    >
      <Cadeado />
      {url}
    </div>
  </div>
);

/** Cursor de seta clássico, preto com contorno branco. */
const Seta: React.FC<{ escala: number }> = ({ escala }) => (
  <svg width={30} height={30} viewBox="0 0 30 30" style={{ transform: `scale(${escala})`, transformOrigin: "3px 3px", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}>
    <path d="M3 3 L3 24.5 L8.6 19.3 L12.3 27.6 L16 26 L12.4 17.9 L19.8 17.9 Z" fill="#101828" stroke="#ffffff" strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

export const Tela: React.FC<{
  gravacao: Gravacao;
  /** Caminho do vídeo em public/, ex.: "selloop/telas/atendimento/tela.mp4". */
  video: string;
  url: string;
  planos: Plano[];
  /** Segundo da gravação em que esta cena começa. */
  inicio?: number;
  cursor?: boolean;
  children?: React.ReactNode;
}> = ({ gravacao, video, url, planos, inicio = 0, cursor = true, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = inicio + frame / fps;
  const tela = { w: gravacao.largura, h: gravacao.altura };
  const { sx, sy, sw, sh } = layoutGeral(tela);
  const { tx, ty, z } = transformacao(enquadreEm(planos, t, tela), tela);
  const m = mouseEm(gravacao, t);
  const cs = cliques(gravacao);
  const apertado = cs.some((c) => t >= c.t && t < c.t + 0.14);
  const ondas = cs.filter((c) => t >= c.t && t < c.t + 0.6);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: "0 0" }}>
      <div
        style={{
          position: "absolute",
          left: sx,
          top: sy - BARRA,
          width: sw,
          height: sh + BARRA,
          borderRadius: RAIO,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 50px 110px rgba(0, 4, 45, 0.55), 0 0 0 1px rgba(255,255,255,0.12)",
        }}
      >
        <BarraNavegador url={url} />
        <div style={{ position: "relative", width: sw, height: sh, overflow: "hidden" }}>
          <OffthreadVideo
            src={staticFile(video)}
            trimBefore={Math.round(inicio * fps)}
            muted
            style={{ position: "absolute", left: 0, top: 0, width: sw, height: sh }}
          />
          {children}
          {ondas.map((c, i) => {
            const k = (t - c.t) / 0.6;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: c.x * (sw / tela.w),
                  top: c.y * (sh / tela.h),
                  width: 0,
                  height: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -34 * (0.35 + k),
                    top: -34 * (0.35 + k),
                    width: 68 * (0.35 + k),
                    height: 68 * (0.35 + k),
                    borderRadius: "50%",
                    background: "rgba(40, 73, 219, 0.22)",
                    border: "3px solid rgba(40, 73, 219, 0.75)",
                    opacity: 1 - k,
                  }}
                />
              </div>
            );
          })}
          {cursor && (
            <div style={{ position: "absolute", left: m.x * (sw / tela.w) - 3, top: m.y * (sh / tela.h) - 3 }}>
              <Seta escala={apertado ? 0.86 : 1} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
