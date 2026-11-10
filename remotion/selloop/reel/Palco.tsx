import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cliques, mouseEm, type Gravacao } from "../gravacao";
import { fonte } from "../marca";
import { cameraNoTrecho, transformar, VISOR, ZONA, type Alvo } from "./base";

// O palco do formato vertical: uma janela de navegador fixa no meio do quadro. O que muda é o que
// passa dentro dela (a tela gravada, com a câmera seguindo a ação).

const Cadeado: React.FC = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Cursor de seta, preto com contorno branco, num tamanho que se enxerga no celular. */
export const Seta: React.FC<{ escala: number }> = ({ escala }) => (
  <svg width={30} height={30} viewBox="0 0 30 30" style={{ transform: `scale(${escala})`, transformOrigin: "3px 3px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.4))", overflow: "visible" }}>
    <path d="M3 3 L3 24.5 L8.6 19.3 L12.3 27.6 L16 26 L12.4 17.9 L19.8 17.9 Z" fill="#101828" stroke="#ffffff" strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

/**
 * A moldura da janela. `presenca` (0 a 1) faz a janela entrar e sair; `escuro` (0 a 1) apaga um pouco
 * a tela quando um elemento salta para a frente dela.
 */
export const Moldura: React.FC<{ url: string; presenca: number; escuro?: number; children?: React.ReactNode }> = ({ url, presenca, escuro = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (presenca <= 0.001) return null;
  const p = ZONA.palco;
  // respiração leve: a janela nunca fica parada
  const giroY = Math.sin(t * 0.55) * 1.6;
  const giroX = Math.cos(t * 0.43) * 0.9;
  const recuo = 1 - 0.035 * escuro;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 2400, perspectiveOrigin: "50% 48%", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: p.x,
          top: p.y,
          width: p.w,
          height: p.h,
          borderRadius: p.raio,
          overflow: "hidden",
          background: "#f7f8fb",
          opacity: Math.min(1, presenca * 1.4),
          transform: `translateY(${(1 - presenca) * 90}px) rotateX(${giroX + (1 - presenca) * 14}deg) rotateY(${giroY}deg) scale(${(0.9 + 0.1 * presenca) * recuo})`,
          boxShadow: "0 60px 120px rgba(0, 4, 45, 0.6), 0 0 0 1.5px rgba(255,255,255,0.16)",
        }}
      >
        <div style={{ position: "relative", height: p.barra, background: "#eef1f6", borderBottom: "1px solid #dfe3ea" }}>
          <div style={{ display: "flex", gap: 9, position: "absolute", left: 22, top: (p.barra - 13) / 2 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 6,
              transform: "translateX(-50%)",
              height: p.barra - 12,
              minWidth: 430,
              padding: "0 20px",
              borderRadius: 10,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: fonte,
              fontSize: 17,
              fontWeight: 500,
              color: "#475467",
            }}
          >
            <Cadeado />
            {url}
          </div>
        </div>
        <div style={{ position: "relative", width: VISOR.w, height: VISOR.h, overflow: "hidden" }}>
          {children}
          <div style={{ position: "absolute", inset: 0, background: "#00042d", opacity: 0.5 * escuro, pointerEvents: "none" }} />
        </div>
      </div>
    </div>
  );
};

/**
 * Um trecho da tela gravada dentro da janela. A câmera é função do tempo da gravação, então dois
 * trechos seguidos da mesma gravação continuam o mesmo movimento.
 */
export const TelaNoPalco: React.FC<{
  gravacao: Gravacao;
  /** Caminho do vídeo em public/. */
  video: string;
  alvos: Alvo[];
  /** Segundo da gravação em que este trecho começa. */
  inicio: number;
  velocidade: number;
  /** Entrada e saída do conteúdo dentro da janela (0 a 1) e o lado do deslize. */
  presenca?: number;
  desliza?: number;
}> = ({ gravacao, video, alvos, inicio, velocidade, presenca = 1, desliza = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = inicio + (frame / fps) * velocidade;
  const tela = { w: gravacao.largura, h: gravacao.altura };
  /** px do vídeo por px CSS da tela gravada. */
  const K = gravacao.escala;
  const { z, tx, ty } = transformar(cameraNoTrecho(alvos, t, velocidade), tela);
  const m = mouseEm(gravacao, t);
  const cs = cliques(gravacao);
  // o clique dura pouco na gravação; no vídeo, a onda dura o mesmo tempo qualquer que seja a velocidade
  const durOnda = 0.5 * velocidade;
  const apertado = cs.some((c) => t >= c.t && t < c.t + 0.14 * velocidade);
  const ondas = cs.filter((c) => t >= c.t && t < c.t + durOnda);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: presenca, transform: `translateX(${desliza}px)` }}>
      {/* a câmera é uma transformação sobre o vídeo no tamanho original: desliza e aproxima em
          frações de pixel, sem os degraus de 1 px de uma posição ou de um tamanho arredondados */}
      <div style={{ position: "absolute", left: 0, top: 0, width: tela.w * K, height: tela.h * K, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z / K})` }}>
        <OffthreadVideo
          src={staticFile(video)}
          trimBefore={Math.round(inicio * fps)}
          playbackRate={velocidade}
          muted
          style={{ position: "absolute", left: 0, top: 0, width: tela.w * K, height: tela.h * K }}
        />
      </div>
      {ondas.map((c, i) => {
        const k = (t - c.t) / durOnda;
        const r = 34 + 62 * k;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${tx + c.x * z - r}px, ${ty + c.y * z - r}px)`,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "rgba(40, 73, 219, 0.2)",
              border: "4px solid rgba(40, 73, 219, 0.8)",
              opacity: 1 - k,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${tx + m.x * z - 5}px, ${ty + m.y * z - 5}px)` }}>
        <Seta escala={apertado ? 1.5 : 1.75} />
      </div>
    </div>
  );
};
