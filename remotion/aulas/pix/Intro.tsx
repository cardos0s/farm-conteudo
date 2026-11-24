import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ui } from "../../lousa/Janelas";
import { progresso, useT } from "../../lousa/tempo";
import { FPS, INTRO } from "./roteiro";

// Intro com cortes rápidos da viagem (Black Friday no Paraguai) e texto grande no ritmo dos cortes.
// Os vídeos ficam em public/aulas/pix/paraguai/ (fora do git; ver scripts/aulas/preparar_intro.sh).

type Corte = { clipe: "placas" | "impressora" | "bateria"; de: number; dur: number };

/** Ordem dos cortes: `de` é o segundo do clipe original em que o corte começa. */
export const CORTES: Corte[] = [
  { clipe: "bateria", de: 0.3, dur: 0.55 }, // placa "Tá chovendo" e a multidão
  { clipe: "placas", de: 0.2, dur: 0.45 }, // processadores na vitrine
  { clipe: "impressora", de: 0.3, dur: 0.45 }, // impressora 3D
  { clipe: "placas", de: 2.3, dur: 0.45 }, // placas de vídeo com etiqueta de oferta
  { clipe: "bateria", de: 2.5, dur: 0.5 }, // bateria e bumbo
  { clipe: "placas", de: 4.3, dur: 0.45 }, // prateleira de RTX
  { clipe: "impressora", de: 2.7, dur: 0.5 }, // movimento na loja
  { clipe: "placas", de: 7.2, dur: 0.6 }, // gente passando com sacola
  { clipe: "bateria", de: 1.6, dur: 1.05 }, // fecha na multidão
];

const inicios = CORTES.reduce<number[]>((acc, c, i) => [...acc, i === 0 ? 0 : acc[i - 1] + CORTES[i - 1].dur], []);

const pop = Easing.out(Easing.back(2.2));
const SOMBRA = "0 6px 0 rgba(0,0,0,0.35), 0 14px 40px rgba(0,0,0,0.55)";

/** Um corte: vídeo em tela cheia com "punch-in" (zoom que assenta) e um flash curto na entrada. */
function Trecho({ corte, i }: { corte: Corte; i: number }) {
  const f = useCurrentFrame();
  const total = Math.round(corte.dur * FPS);
  const p = progresso(f / FPS, 0, 0.3, Easing.out(Easing.cubic));
  const zoom = (i % 2 === 0 ? 1.14 : 1.09) - (i % 2 === 0 ? 0.1 : 0.06) * p;
  const giro = (i % 2 === 0 ? -1 : 1) * 1.2 * (1 - p);
  const flash = i === 0 ? 0 : Math.max(0, 0.55 - f * 0.2);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) rotate(${giro}deg)` }}>
        <OffthreadVideo
          src={staticFile(`aulas/pix/paraguai/${corte.clipe}.mp4`)}
          trimBefore={Math.round(corte.de * FPS)}
          // som ambiente com fade curtinho nas bordas do corte (sem estalos)
          volume={(q) => 0.75 * Math.min(1, q / 2, (total - q) / 2)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
}

/** Palavra que "pula" na tela no instante `de` e sai em `ate`. */
function Palavra({ de, ate, children, style }: { de: number; ate: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const t = useT();
  if (t < de || t >= ate) return null;
  const p = progresso(t, de, 0.28, pop);
  return (
    <div
      style={{
        transform: `scale(${0.55 + 0.45 * p}) translateY(${(1 - p) * 30}px)`,
        opacity: Math.min(1, (t - de) / 0.06),
        textShadow: SOMBRA,
        color: "#fff",
        lineHeight: 0.95,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const grande: React.CSSProperties = { fontFamily: "'Archivo Black'", textTransform: "uppercase", letterSpacing: -2 };
const pequeno: React.CSSProperties = { fontFamily: "Inter", fontWeight: 700, fontSize: 64, marginBottom: 10 };

/** Faixa com as cores da bandeira do Paraguai, que se estende embaixo da palavra. */
function Faixa({ de }: { de: number }) {
  const t = useT();
  const p = progresso(t, de, 0.3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, width: 640 * p, margin: "18px auto 0", borderRadius: 6, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      <div style={{ height: 14, background: "#d52b1e" }} />
      <div style={{ height: 14, background: "#ffffff" }} />
      <div style={{ height: 14, background: "#0038a8" }} />
    </div>
  );
}

export function IntroParaguai() {
  const t = useT();
  const c = inicios; // início de cada corte (s)
  // saída: o último corte cresce e desfoca até virar branco, e o canvas entra
  const saindo = progresso(t, INTRO - 0.4, 0.4, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.35 * saindo})`, filter: saindo > 0 ? `blur(${saindo * 14}px)` : undefined }}>
        {CORTES.map((corte, i) => (
          <Sequence key={i} from={Math.round(c[i] * FPS)} durationInFrames={Math.round(corte.dur * FPS)} layout="none">
            <Trecho corte={corte} i={i} />
          </Sequence>
        ))}
        {/* escurece o meio da tela para o texto ler bem em qualquer corte */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 45% at 50% 50%, rgba(0,0,0,0.45), rgba(0,0,0,0) 75%)" }} />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 80 }}>
          <Palavra de={0.1} ate={c[4]} style={pequeno}>
            aproveitei a
          </Palavra>
          <Palavra de={c[1]} ate={c[4]} style={{ ...grande, fontSize: 200, color: "#ffd43b" }}>
            black
          </Palavra>
          <Palavra de={c[2]} ate={c[4]} style={{ ...grande, fontSize: 168 }}>
            friday
          </Palavra>
          <Palavra de={c[4]} ate={c[7]} style={pequeno}>
            no
          </Palavra>
          <Palavra de={c[4] + 0.15} ate={c[7]} style={{ ...grande, fontSize: 150 }}>
            paraguai
            <Faixa de={c[4] + 0.3} />
          </Palavra>
          <Palavra de={c[7]} ate={INTRO} style={{ ...grande, fontSize: 120 }}>
            e isso
          </Palavra>
          <Palavra de={c[8]} ate={INTRO} style={{ ...grande, fontSize: 124, color: ui.rosa, textShadow: `${SOMBRA}, 0 0 2px #fff` }}>
            aconteceu…
          </Palavra>
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fdfdfc", opacity: saindo }} />
    </AbsoluteFill>
  );
}
