import React from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mistura, prender, type Ret } from "./base";

// O elemento que "salta" da tela: um recorte da plataforma (a mensagem, o cartão, o botão) sai do
// lugar onde está na janela, cresce para a frente e fica flutuando, com sombra e um brilho passando.

export type DestinoRecorte = {
  /** Centro e largura do recorte em repouso (px do quadro). */
  cx: number;
  cy: number;
  w: number;
};

const Faisca: React.FC<{ x: number; y: number; tam: number; k: number; cor: string; giro: number }> = ({ x, y, tam, k, cor, giro }) => {
  // nasce, cresce e some
  const escala = Math.sin(prender(k) * Math.PI);
  if (escala <= 0.01) return null;
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" style={{ position: "absolute", left: x - tam / 2, top: y - tam / 2, transform: `scale(${escala}) rotate(${giro * k}deg)`, overflow: "visible" }}>
      <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill={cor} />
    </svg>
  );
};

export const Recorte: React.FC<{
  /** Imagem do recorte (URL já resolvida com staticFile). */
  src: string;
  /** Onde o elemento está na janela no instante em que salta (px do quadro). */
  origem: Ret;
  destino: DestinoRecorte;
  /** Altura ÷ largura do que aparece (da imagem inteira ou da parte em `corte`). */
  proporcao: number;
  /** Só uma parte da imagem, em frações dela (0 a 1). */
  corte?: { x: number; y: number; w: number; h: number };
  de: number;
  ate: number;
  /** Raio do canto em repouso (px do quadro). */
  raio?: number;
  /** Inclinação em repouso (graus). */
  rot?: number;
  /** Moldura branca em volta, como um adesivo (padrão: sim). */
  moldura?: boolean;
  faiscas?: boolean;
  children?: React.ReactNode;
}> = ({ src, origem, destino, proporcao, corte, de, ate, raio = 26, rot = -2, moldura = true, faiscas = true, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < de || t > ate) return null;
  const e = spring({ frame: frame - Math.round(de * fps), fps, config: { damping: 14, stiffness: 115, mass: 0.85 } });
  const sai = prender((t - (ate - 0.24)) / 0.24);
  const idade = t - de;

  const w = mistura(origem.w, destino.w, e) * (1 - 0.1 * sai);
  const h = w * proporcao;
  const flutua = Math.sin(idade * 1.7) * 6 * prender(idade / 0.6);
  const cx = mistura(origem.x + origem.w / 2, destino.cx, e);
  const cy = mistura(origem.y + origem.h / 2, destino.cy, e) + flutua - 46 * sai;
  const giro = rot * prender(e) + Math.sin(idade * 1.25) * 0.5;
  const borda = moldura ? Math.max(0, 7 * prender(e)) : 0;
  const k = prender(e);
  const brilho = prender((idade - 0.12) / 0.55);

  // de onde saiu: um contorno que se abre e some
  const anel = prender(idade / 0.45);
  const cores = ["#ffffff", "#7fd8ff", "#ffffff", "#7fd8ff", "#ffffff", "#ffd166"];
  const cantos = [
    [-0.5, -0.5, 54, 0.05, 120],
    [0.5, -0.5, 40, 0.12, -90],
    [0.52, 0.2, 30, 0.2, 140],
    [-0.52, 0.3, 34, 0.16, -120],
    [0.3, 0.52, 44, 0.24, 100],
    [-0.3, -0.56, 26, 0.3, 80],
  ] as const;

  return (
    <>
      {anel < 1 && (
        <div
          style={{
            position: "absolute",
            left: origem.x - 6 - 18 * anel,
            top: origem.y - 6 - 18 * anel,
            width: origem.w + 12 + 36 * anel,
            height: origem.h + 12 + 36 * anel,
            borderRadius: 18 + 10 * anel,
            border: "4px solid rgba(127,216,255,0.95)",
            opacity: 1 - anel,
          }}
        />
      )}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 1800, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: cx - w / 2 - borda,
            top: cy - h / 2 - borda,
            width: w + borda * 2,
            height: h + borda * 2,
            borderRadius: raio * k + borda + 4 * (1 - k),
            background: "#ffffff",
            opacity: 1 - sai,
            transform: `rotate(${giro}deg) rotateX(${(1 - k) * 16}deg) rotateY(${Math.sin(idade * 0.9) * 2.2 * k}deg)`,
            boxShadow: `0 ${24 + 46 * k}px ${50 + 70 * k}px rgba(0, 4, 45, ${0.3 + 0.3 * k}), 0 0 ${60 * k}px rgba(0, 173, 255, ${0.25 * k})`,
          }}
        >
          <div style={{ position: "absolute", left: borda, top: borda, width: w, height: h, borderRadius: raio * k + 4 * (1 - k), overflow: "hidden" }}>
            {corte ? (
              <Img src={src} style={{ position: "absolute", left: (-corte.x * w) / corte.w, top: (-corte.y * h) / corte.h, width: w / corte.w, height: h / corte.h, maxWidth: "none" }} />
            ) : (
              <Img src={src} style={{ width: w, height: h, display: "block" }} />
            )}
            {brilho < 1 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(112deg, transparent ${brilho * 150 - 45}%, rgba(255,255,255,0.75) ${brilho * 150 - 28}%, transparent ${brilho * 150 - 11}%)`,
                }}
              />
            )}
            {children}
          </div>
        </div>
      </div>
      {faiscas &&
        cantos.map(([dx, dy, tam, atraso, g], i) => (
          <Faisca key={i} x={destino.cx + dx * (destino.w + 60)} y={destino.cy + dy * (destino.w * proporcao + 60)} tam={tam} k={(idade - 0.18 - atraso) / 0.55} cor={cores[i]} giro={g} />
        ))}
    </>
  );
};
