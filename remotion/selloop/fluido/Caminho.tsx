import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cor, fonte } from "../marca";
import { prender, RW, ZONA } from "../reel/base";

// O caminho de um momento, logo abaixo do título: os cliques que levam até ali, em ordem
// ("Anexos › Produtos › Enviar"). Os passos aparecem apagados desde o começo e cada um acende no
// instante em que o cursor clica nele na tela.

export type TrilhaDeCliques = {
  de: number;
  ate: number;
  /** Cada passo acende em `em` (s do vídeo). */
  passos: { rotulo: string; em: number }[];
};

/** Altura da faixa do caminho (px): o título sobe isso para dar lugar a ela. */
export const ALTURA_DO_CAMINHO = 74;

const Seta: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 30 30" style={{ overflow: "visible" }}>
    <path d="M5 3 L5 24.5 L10.6 19.3 L14.3 27.6 L18 26 L14.4 17.9 L21.8 17.9 Z" fill="#ffffff" />
  </svg>
);

export const Caminho: React.FC<{ trilha: TrilhaDeCliques }> = ({ trilha }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < trilha.de || t > trilha.ate) return null;
  const entra = spring({ frame: frame - Math.round(trilha.de * fps), fps, config: { damping: 200 } });
  const some = 1 - prender((t - (trilha.ate - 0.2)) / 0.2);
  // passos longos encolhem a letra para a faixa caber na largura
  const letras = trilha.passos.reduce((n, p) => n + p.rotulo.length, 0);
  const corpo = prender(Math.floor((RW - 250 - trilha.passos.length * 96) / Math.max(1, letras) / 0.58), 22, 31);
  const atual = trilha.passos.reduce((k, p, i) => (t >= p.em ? i : k), -1);
  const z = ZONA.titulo;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: RW,
        top: z.y + z.h - ALTURA_DO_CAMINHO + 12,
        height: ALTURA_DO_CAMINHO - 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: Math.min(entra, some),
        transform: `translateY(${(1 - entra) * 14}px)`,
        fontFamily: fonte,
      }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.14)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}>
        <Seta />
      </div>
      {trilha.passos.map((p, i) => {
        const aceso = t >= p.em;
        const s = spring({ frame: frame - Math.round(p.em * fps), fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
        const eAtual = i === atual;
        // o anel que se abre no instante do clique
        const anel = prender((t - p.em) / 0.5);
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <svg width={18} height={26} viewBox="0 0 18 26" style={{ opacity: aceso ? 0.95 : 0.4 }}>
                <path d="M5 4 L13 13 L5 22" fill="none" stroke="#ffffff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div style={{ position: "relative" }}>
              {aceso && anel < 1 && <div style={{ position: "absolute", inset: -6 - 14 * anel, borderRadius: 999, border: "3px solid rgba(127,216,255,0.9)", opacity: 1 - anel }} />}
              <div
                style={{
                  height: 52,
                  padding: "0 20px",
                  borderRadius: 26,
                  display: "flex",
                  alignItems: "center",
                  fontSize: corpo,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  color: aceso ? (eAtual ? "#ffffff" : cor.marinho) : "rgba(255,255,255,0.62)",
                  background: aceso ? (eAtual ? cor.royal : "#ffffff") : "rgba(255,255,255,0.07)",
                  border: aceso ? "2px solid transparent" : "2px solid rgba(255,255,255,0.3)",
                  boxShadow: aceso ? "0 10px 26px rgba(0,4,45,0.45)" : undefined,
                  transform: `scale(${aceso ? 0.82 + 0.18 * s : 1})`,
                }}
              >
                {p.rotulo}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
