import React from "react";
import "@fontsource/playfair-display/700.css";
import "@fontsource/great-vibes/400.css";
import { AbsoluteFill, continueRender, delayRender, Easing, OffthreadVideo, Sequence, staticFile } from "remotion";
import { lerp, progresso, useT } from "../../lousa/tempo";
import { FPS, INTRO } from "./roteiro";

// Intro no estilo "vlog de cinema" (vídeos mudos, tomadas lentas e cor quente de filme):
//  1. tela preta; uma faixa do vídeo abre no meio e depois toma a tela inteira;
//  2. a tela se divide em três faixas com cortes diferentes e o título entra na do meio:
//     "BLACK" em serifada alta e "friday" manuscrito em amarelo por cima, "no Paraguai" embaixo;
//  3. um vazamento de luz laranja leva a uma tomada cheia com "E ISSO / aconteceu…";
//  4. zoom e desfoque até o branco do canvas.
// Tomadas: multidão (bateria), placas de vídeo e impressora 3D; fecha na impressora.
// Os vídeos ficam em public/aulas/pix/paraguai/ (fora do git; ver scripts/aulas/preparar_intro.sh).

if (typeof document !== "undefined") {
  const espera = delayRender("Carregando fontes da intro");
  Promise.all(["700 1em 'Playfair Display'", "400 1em 'Great Vibes'"].map((f) => document.fonts.load(f, "BLACKfriday")))
    .catch((e) => console.error("Falha ao carregar fontes da intro", e))
    .finally(() => continueRender(espera));
}

const W = 1080;
const H = 1920;
const sai = Easing.out(Easing.cubic);
const suave = Easing.bezier(0.65, 0, 0.35, 1);

/** Faixas da tela dividida (y de cima e de baixo), com um fio claro entre elas. */
const FIO = 9;
const FAIXA = (H - 2 * FIO) / 3;
const TOPO = { y0: 0, y1: FAIXA };
const MEIO = { y0: FAIXA + FIO, y1: 2 * FAIXA + FIO };
const BASE = { y0: 2 * FAIXA + 2 * FIO, y1: H };

/** Momentos da intro (s). */
const M = {
  abreFaixa: 0.25,
  telaCheia: 1.7,
  divide: 2.7,
  titulo: 3.2,
  luz: 5.0,
  final: 5.2,
  sai: INTRO - 0.45,
};

/** Cor de filme: menos saturação, um toque de sépia e contraste. */
const GRADE = "contrast(1.08) saturate(0.82) sepia(0.2) brightness(0.97)";

type Clipe = "placas" | "impressora" | "bateria";

/**
 * Vídeo em tela cheia recortado por um retângulo (y0..y1). `foco` é a altura do quadro (0..1)
 * que fica no centro do recorte; `dx` desloca tudo na horizontal (para as faixas que deslizam).
 */
function Recorte({ clipe, de, velocidade, y0, y1, foco = 0.5, dx = 0, zoom = 1 }: { clipe: Clipe; de: number; velocidade: number; y0: number; y1: number; foco?: number; dx?: number; zoom?: number }) {
  const centro = (y0 + y1) / 2;
  const dy = y1 - y0 >= H - 1 ? 0 : centro - foco * H;
  return (
    <AbsoluteFill style={{ clipPath: `inset(${y0}px 0 ${H - y1}px 0)`, transform: `translateX(${dx}px)` }}>
      <AbsoluteFill style={{ transform: `translateY(${dy}px) scale(${zoom})`, transformOrigin: `50% ${foco * 100}%` }}>
        <OffthreadVideo
          src={staticFile(`aulas/pix/paraguai/${clipe}.mp4`)}
          trimBefore={Math.round(de * FPS)}
          playbackRate={velocidade}
          muted
          style={{ width: W, height: H, objectFit: "cover", filter: GRADE }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Vazamento de luz laranja que atravessa a tela. */
function Luz({ de, dur }: { de: number; dur: number }) {
  const t = useT();
  if (t < de || t > de + dur) return null;
  const p = (t - de) / dur;
  const x = lerp(15, 85, p);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        opacity: Math.sin(Math.PI * p),
        background: `radial-gradient(ellipse 85% 60% at ${x}% 42%, rgba(255,196,120,1), rgba(255,126,48,0.85) 38%, rgba(255,80,20,0) 75%)`,
      }}
    />
  );
}

const SOMBRA = "0 4px 22px rgba(0,0,0,0.45)";
const AMARELO = "#f4c64e";

/** Serifada alta (Playfair esticada na vertical) que entra com o espaçamento se fechando. */
function Serifada({ dt, tam, children }: { dt: number; tam: number; children: string }) {
  const p = progresso(dt, 0, 0.9, sai);
  return (
    <div
      style={{
        fontFamily: "'Playfair Display'",
        fontWeight: 700,
        fontSize: tam,
        lineHeight: 1,
        color: "#fff",
        letterSpacing: lerp(36, 2, p),
        opacity: Math.min(1, dt / 0.35),
        filter: `blur(${(1 - p) * 8}px)`,
        transform: "scaleY(1.32)",
        textShadow: SOMBRA,
      }}
    >
      {children}
    </div>
  );
}

/** Manuscrita amarela, revelada da esquerda para a direita, por cima da serifada. */
function Manuscrita({ dt, tam, children }: { dt: number; tam: number; children: string }) {
  const p = progresso(dt, 0, 0.85, Easing.inOut(Easing.quad));
  return (
    <div
      style={{
        fontFamily: "'Great Vibes'",
        fontSize: tam,
        lineHeight: 1,
        color: AMARELO,
        textShadow: "0 3px 14px rgba(0,0,0,0.5)",
        clipPath: `inset(-30% ${100 - 100 * p}% -30% -10%)`,
        padding: "0 30px",
      }}
    >
      {children}
    </div>
  );
}

/** Bloco de título centralizado em (540, y), visível entre `de` e `ate`. */
function Titulo({ y, de, ate, children }: { y: number; de: number; ate: number; children: (dt: number) => React.ReactNode }) {
  const t = useT();
  if (t < de || t >= ate) return null;
  const fora = progresso(t, ate - 0.25, 0.25);
  const fundo = progresso(t, de, 0.6) * (1 - fora);
  return (
    <>
      {/* sombra suave atrás do título, para ler em cima de fundo claro ou cheio de detalhe */}
      <div style={{ position: "absolute", left: 0, top: y - 260, width: W, height: 520, opacity: fundo, background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(0,0,0,0.5), rgba(0,0,0,0) 100%)" }} />
      <div style={{ position: "absolute", left: W / 2, top: y, transform: "translate(-50%, -50%)", opacity: 1 - fora, display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
        {children(t - de)}
      </div>
    </>
  );
}

export function IntroParaguai() {
  const t = useT();

  // 1ª tomada (a multidão): faixa que abre no meio → tela cheia → faixa do meio da tela dividida
  const abre = progresso(t, M.abreFaixa, 0.8, suave);
  const enche = progresso(t, M.telaCheia, 0.6, suave);
  const divide = progresso(t, M.divide, 0.55, suave);
  const meia = 310 * abre;
  let y0 = lerp(H / 2 - meia, 0, enche);
  let y1 = lerp(H / 2 + meia, H, enche);
  y0 = lerp(y0, MEIO.y0, divide);
  y1 = lerp(y1, MEIO.y1, divide);
  const fundo = t >= M.divide ? "#ead9c6" : "#000";

  // faixas de cima e de baixo deslizam dos lados
  const entraTopo = progresso(t, M.divide + 0.05, 0.6, sai);
  const entraBase = progresso(t, M.divide + 0.15, 0.6, sai);
  const zoomLento = (de: number) => 1.04 + 0.05 * progresso(t, de, 3, (x) => x);

  const saindo = progresso(t, M.sai, 0.45, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ background: fundo, transform: `scale(${1 + 0.25 * saindo})`, filter: saindo > 0 ? `blur(${saindo * 14}px)` : undefined }}>
        <Sequence durationInFrames={Math.round(M.final * FPS)} layout="none">
          <Recorte clipe="bateria" de={0.2} velocidade={0.7} y0={y0} y1={y1} foco={0.4} zoom={zoomLento(0)} />
        </Sequence>
        <Sequence from={Math.round(M.divide * FPS)} durationInFrames={Math.round((M.final - M.divide) * FPS)} layout="none">
          <Recorte clipe="placas" de={2.0} velocidade={0.7} y0={TOPO.y0} y1={TOPO.y1} foco={0.45} dx={-(1 - entraTopo) * W} zoom={zoomLento(M.divide)} />
          <Recorte clipe="impressora" de={0.3} velocidade={0.7} y0={BASE.y0} y1={BASE.y1} foco={0.55} dx={(1 - entraBase) * W} zoom={zoomLento(M.divide)} />
        </Sequence>
        <Sequence from={Math.round(M.final * FPS)} layout="none">
          <Recorte clipe="impressora" de={2.0} velocidade={0.5} y0={0} y1={H} foco={0.5} zoom={zoomLento(M.final)} />
        </Sequence>

        {/* tom quente e vinheta, como filme */}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,150,60,0.10), rgba(255,120,40,0.06))", mixBlendMode: "soft-light" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35))" }} />

        {/* título na faixa do meio */}
        <Titulo y={(MEIO.y0 + MEIO.y1) / 2 - 20} de={M.titulo} ate={M.final}>
          {(dt) => (
            <>
              <Serifada dt={dt} tam={164}>
                BLACK
              </Serifada>
              <div style={{ marginTop: -86, marginLeft: 120 }}>
                <Manuscrita dt={dt - 0.45} tam={150}>
                  friday
                </Manuscrita>
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: 12,
                  color: "rgba(255,255,255,0.9)",
                  textShadow: SOMBRA,
                  opacity: progresso(dt, 1.0, 0.5),
                }}
              >
                NO PARAGUAI
              </div>
            </>
          )}
        </Titulo>

        {/* tomada final */}
        <Titulo y={900} de={M.final + 0.25} ate={INTRO}>
          {(dt) => (
            <>
              <Serifada dt={dt} tam={150}>
                E ISSO
              </Serifada>
              <div style={{ marginTop: -30, marginLeft: 60 }}>
                <Manuscrita dt={dt - 0.5} tam={170}>
                  aconteceu…
                </Manuscrita>
              </div>
            </>
          )}
        </Titulo>

        <Luz de={M.luz - 0.15} dur={0.6} />
      </AbsoluteFill>
      {/* saída: luz quente que estoura no branco do canvas */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #fdfdfc ${saindo * 70}%, rgba(255,190,120,${saindo}) 100%)`, opacity: saindo }} />
    </AbsoluteFill>
  );
}
