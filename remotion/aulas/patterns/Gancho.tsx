import React from "react";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/700-italic.css";
import { AbsoluteFill, continueRender, delayRender, Easing } from "remotion";
import { ui } from "../../lousa/Janelas";
import { FUNDO_LOUSA, PONTO_GRADE, tinta } from "../../lousa/paleta";
import { lerp, progresso, useT } from "../../lousa/tempo";
import { CARTAO, GANCHO } from "./roteiro";

// Edição do gancho, por cima da gravação (que não é alterada fora do que é desenhado aqui):
//  - "Quais são os": você, sem nada por cima;
//  - "principais design patterns": um cartão claro cobre a imagem (a mão passa na frente da lente
//    nesse trecho); "DESIGN" e "PATTERNS" entram junto com as palavras, e a voz continua;
//  - "na era da IA?": você de novo, com o título embaixo ("na era da" + "IA?" em itálico amarelo).
// Os tempos são da gravação original (palavras transcritas) e viram tempo do vídeo com g().
// No render final este componente sai em PNG com transparência e é composto sobre o HDR original.

if (typeof document !== "undefined") {
  const espera = delayRender("Carregando fontes do gancho");
  Promise.all(["700 1em 'Playfair Display'", "italic 700 1em 'Playfair Display'"].map((f) => document.fonts.load(f, "DESIGNPATTERNSIA")))
    .catch((e) => console.error("Falha ao carregar fontes do gancho", e))
    .finally(() => continueRender(espera));
}

/** Segundo da gravação original → segundo do vídeo. */
const g = (tGravacao: number) => tGravacao - GANCHO.de;

/** Palavras da gravação (s do arquivo original). */
const PALAVRA = { principais: 2.4, design: 3.0, patterns: 3.48, era: 4.3, ia: 4.72 };

const sai = Easing.out(Easing.cubic);
const pop = Easing.out(Easing.back(1.7));
const AMARELO = "#f4c64e";
const SOMBRA = "0 4px 22px rgba(0,0,0,0.5)";

/** Serifada alta que entra com o espaçamento se fechando. */
function Serifada({ dt, tam, cor = tinta, sombra, children }: { dt: number; tam: number; cor?: string; sombra?: string; children: string }) {
  // antes de entrar, ocupa o espaço sem aparecer (para as outras palavras não mudarem de lugar)
  const p = dt < 0 ? 0 : progresso(dt, 0, 0.45, sai);
  return (
    <div
      style={{
        fontFamily: "'Playfair Display'",
        fontWeight: 700,
        fontSize: tam,
        lineHeight: 1,
        color: cor,
        letterSpacing: lerp(30, 0, p),
        opacity: dt < 0 ? 0 : Math.min(1, dt / 0.12),
        filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
        transform: `scaleY(1.3) scale(${0.92 + 0.08 * progresso(dt, 0, 0.35, pop)})`,
        textShadow: sombra,
      }}
    >
      {children}
    </div>
  );
}

/** Cartão que cobre a imagem durante "principais design patterns". */
function Cartao() {
  const t = useT();
  const de = g(CARTAO.de);
  const ate = g(CARTAO.ate);
  if (t < de || t >= ate) return null;
  const zoom = 1.04 - 0.04 * progresso(t, de, ate - de, (x) => x);
  const sublinha = progresso(t, g(PALAVRA.patterns) + 0.25, 0.35, sai);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${PONTO_GRADE} 1.6px, transparent 1.9px)`,
          backgroundSize: "34px 34px",
          transform: `scale(${zoom})`,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${zoom})`, paddingBottom: 80 }}>
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 60, color: ui.apagado, opacity: progresso(t, de, 0.2), marginBottom: 40 }}>
          os principais
        </div>
        <Serifada dt={t - g(PALAVRA.design)} tam={196}>
          DESIGN
        </Serifada>
        <div style={{ height: 70 }} />
        <Serifada dt={t - g(PALAVRA.patterns)} tam={176} cor={ui.rosa}>
          PATTERNS
        </Serifada>
        <div style={{ marginTop: 56, width: 640 * sublinha, height: 10, borderRadius: 5, background: ui.rosa }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Título sobre a gravação, embaixo: "na era da" + "IA?" em itálico amarelo. */
function TituloFinal() {
  const t = useT();
  const de = g(CARTAO.ate);
  if (t < de) return null;
  const fundo = progresso(t, de, 0.3);
  const ia = t - g(PALAVRA.ia);
  const escrito = progresso(ia, 0, 0.5, Easing.inOut(Easing.quad));
  return (
    <>
      {/* sombra suave só na parte de baixo, para o título ler bem sobre a roupa */}
      <AbsoluteFill style={{ opacity: fundo, background: "radial-gradient(ellipse 70% 22% at 50% 74%, rgba(0,0,0,0.42), rgba(0,0,0,0) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1270 }}>
        <Serifada dt={t - g(PALAVRA.era) + 0.25} tam={112} cor="#ffffff" sombra={SOMBRA}>
          na era da
        </Serifada>
        {ia >= 0 && (
          <div
            style={{
              marginTop: 34,
              fontFamily: "'Playfair Display'",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 210,
              lineHeight: 1,
              color: AMARELO,
              textShadow: "0 4px 18px rgba(0,0,0,0.55)",
              clipPath: `inset(-30% ${100 - 100 * escrito}% -30% -10%)`,
              transform: `scale(${0.9 + 0.1 * progresso(ia, 0, 0.35, pop)})`,
              padding: "0 40px",
            }}
          >
            IA?
          </div>
        )}
      </AbsoluteFill>
    </>
  );
}

/** Tudo o que é desenhado por cima da gravação do gancho (fundo transparente). */
export function GanchoSobreposicao() {
  return (
    <AbsoluteFill>
      <Cartao />
      <TituloFinal />
    </AbsoluteFill>
  );
}

/** Instantes do gancho (s do vídeo) para os efeitos sonoros. */
export const MOMENTOS_GANCHO = {
  entraCartao: g(CARTAO.de),
  design: g(PALAVRA.design),
  patterns: g(PALAVRA.patterns),
  saiCartao: g(CARTAO.ate),
  ia: g(PALAVRA.ia),
};
