import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONTE_CODIGO, FONTE_LOUSA } from "../../lousa/fontes";
import { progresso, useT } from "../../lousa/tempo";
import { FPS, INTRO } from "./roteiro";

// Intro com cortes da viagem (Black Friday no Paraguai), sem som, e um jogo de fontes por cima:
// manuscrita (Excalifont), pesada (Archivo Black), contorno, serifada (Roboto Slab),
// monoespaçada de terminal (Cascadia) e geométrica (Poppins), cada uma com a sua animação.
// Os vídeos ficam em public/aulas/pix/paraguai/ (fora do git; ver scripts/aulas/preparar_intro.sh).

type Corte = { clipe: "placas" | "impressora" | "bateria"; de: number; dur: number };

/** Ordem dos cortes: `de` é o segundo do clipe original em que o corte começa. */
export const CORTES: Corte[] = [
  { clipe: "bateria", de: 0.2, dur: 1.1 }, // placa "Tá chovendo" e a multidão
  { clipe: "placas", de: 2.0, dur: 1.1 }, // placas de vídeo com etiqueta de oferta
  { clipe: "impressora", de: 0.3, dur: 1.1 }, // impressora 3D
  { clipe: "placas", de: 4.2, dur: 1.1 }, // prateleira de RTX
  { clipe: "placas", de: 7.0, dur: 1.0 }, // gente passando com sacola
  { clipe: "bateria", de: 1.4, dur: 1.6 }, // fecha na multidão
];

const inicios = CORTES.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + CORTES[i - 1].dur], []);
/** Começo de cada frase: 1ª nos cortes 1–2, 2ª nos cortes 3–4, 3ª nos cortes 5–6. */
const F1 = 0;
const F2 = inicios[2];
const F3 = inicios[4];

const pop = Easing.out(Easing.back(1.9));
const sai = Easing.out(Easing.cubic);
const SOMBRA = "0 5px 0 rgba(0,0,0,0.28), 0 12px 36px rgba(0,0,0,0.55)";
const ROSA = "#ff6fa5";
const AMARELO = "#ffd43b";

/** Um corte: vídeo mudo em tela cheia, com um zoom lento que assenta e um flash leve na entrada. */
function Trecho({ corte, i }: { corte: Corte; i: number }) {
  const f = useCurrentFrame();
  const p = progresso(f / FPS, 0, corte.dur, (x) => x);
  const zoom = i % 2 === 0 ? 1.08 - 0.06 * p : 1.02 + 0.06 * p;
  const flash = i === 0 ? 0 : Math.max(0, 0.35 - f * 0.09);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src={staticFile(`aulas/pix/paraguai/${corte.clipe}.mp4`)}
          trimBefore={Math.round(corte.de * FPS)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
}

/** Peça de texto visível entre `de` e `ate`, posicionada pelo centro (x, y) na tela. */
function Peca({ de, ate, x = 540, y, girar = 0, children }: { de: number; ate: number; x?: number; y: number; girar?: number; children: (t: number) => React.ReactNode }) {
  const t = useT();
  if (t < de || t >= ate) return null;
  const fora = progresso(t, ate - 0.18, 0.18);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${girar}deg)`, opacity: 1 - fora, whiteSpace: "nowrap" }}>
      {children(t - de)}
    </div>
  );
}

/** Revela da esquerda para a direita, como se fosse escrito à mão. */
const escrito = (dt: number, dur: number): React.CSSProperties => ({ clipPath: `inset(-20% ${100 - 100 * progresso(dt, 0, dur, sai)}% -20% -5%)` });

/** Sublinhado à mão que se desenha. */
function Rabisco({ dt, largura, cor }: { dt: number; largura: number; cor: string }) {
  const p = progresso(dt, 0, 0.4, sai);
  return (
    <svg width={largura} height={40} style={{ display: "block", margin: "-8px auto 0", overflow: "visible" }}>
      <path
        d={`M6 26 C ${largura * 0.25} 12, ${largura * 0.55} 34, ${largura - 6} 14`}
        stroke={cor}
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${p} 2`}
        style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))" }}
      />
    </svg>
  );
}

function Frase1() {
  const fim = F2;
  return (
    <>
      {/* manuscrita, inclinada */}
      <Peca de={F1 + 0.15} ate={fim} y={690} girar={-5}>
        {(dt) => <div style={{ fontFamily: FONTE_LOUSA, fontSize: 96, color: "#fff", textShadow: SOMBRA, ...escrito(dt, 0.55) }}>aproveitei a</div>}
      </Peca>
      {/* pesada, amarela, pula */}
      <Peca de={F1 + 0.6} ate={fim} y={880}>
        {(dt) => {
          const p = progresso(dt, 0, 0.35, pop);
          return (
            <div style={{ fontFamily: "'Archivo Black'", fontSize: 250, letterSpacing: -6, color: AMARELO, textShadow: SOMBRA, transform: `scale(${0.5 + 0.5 * p})`, lineHeight: 1 }}>
              BLACK
            </div>
          );
        }}
      </Peca>
      {/* contorno que desliza e depois se preenche */}
      <Peca de={F1 + 1.0} ate={fim} y={1085}>
        {(dt) => {
          const p = progresso(dt, 0, 0.4, sai);
          const cheio = progresso(dt, 0.55, 0.3);
          return (
            <div
              style={{
                fontFamily: "'Archivo Black'",
                fontSize: 200,
                letterSpacing: 6,
                lineHeight: 1,
                color: `rgba(255,255,255,${cheio})`,
                WebkitTextStroke: "5px #fff",
                textShadow: cheio > 0.5 ? SOMBRA : undefined,
                transform: `translateX(${(1 - p) * 260}px)`,
                opacity: p,
              }}
            >
              FRIDAY
            </div>
          );
        }}
      </Peca>
    </>
  );
}

function Frase2() {
  const fim = F3;
  const comando = "> direto do";
  return (
    <>
      {/* terminal: digitado, com cursor */}
      <Peca de={F2 + 0.1} ate={fim} y={760}>
        {(dt) => {
          const n = Math.min(comando.length, Math.floor(dt / 0.045) + 1);
          const cursor = Math.floor(dt * 3) % 2 === 0;
          return (
            <div style={{ fontFamily: FONTE_CODIGO, fontSize: 60, color: "#e9ecef", background: "rgba(17,17,17,0.88)", padding: "14px 30px", borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}>
              <span style={{ color: "#69db7c" }}>{comando.slice(0, Math.min(n, 2))}</span>
              {comando.slice(2, n)}
              <span style={{ opacity: cursor ? 1 : 0, color: "#69db7c" }}>▍</span>
            </div>
          );
        }}
      </Peca>
      {/* serifada, sobe de dentro de uma máscara */}
      <Peca de={F2 + 0.7} ate={fim} y={960}>
        {(dt) => {
          const p = progresso(dt, 0, 0.45, sai);
          return (
            <div style={{ overflow: "hidden", padding: "0 20px" }}>
              <div style={{ fontFamily: "'Roboto Slab'", fontWeight: 800, fontSize: 176, color: "#fff", textShadow: SOMBRA, lineHeight: 1.12, transform: `translateY(${(1 - p) * 110}%)` }}>
                Paraguai
              </div>
            </div>
          );
        }}
      </Peca>
      {/* faixa com as cores da bandeira */}
      <Peca de={F2 + 1.1} ate={fim} y={1080}>
        {(dt) => {
          const p = progresso(dt, 0, 0.4, sai);
          return (
            <div style={{ width: 700 * p, borderRadius: 7, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <div style={{ height: 15, background: "#d52b1e" }} />
              <div style={{ height: 15, background: "#ffffff" }} />
              <div style={{ height: 15, background: "#0038a8" }} />
            </div>
          );
        }}
      </Peca>
    </>
  );
}

function Frase3() {
  const fim = INTRO;
  const palavra = "e isso";
  return (
    <>
      {/* geométrica: letra a letra, subindo */}
      <Peca de={F3 + 0.1} ate={fim} y={760}>
        {(dt) => (
          <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 156, color: "#fff", textShadow: SOMBRA, lineHeight: 1 }}>
            {[...palavra].map((c, i) => {
              const p = progresso(dt, i * 0.05, 0.3, pop);
              return (
                <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `translateY(${(1 - p) * 50}px)`, opacity: Math.min(1, p * 2) }}>
                  {c}
                </span>
              );
            })}
          </div>
        )}
      </Peca>
      {/* manuscrita grande, rosa, escrita à mão e sublinhada */}
      <Peca de={F3 + 0.7} ate={fim} y={975} girar={-3}>
        {(dt) => (
          <div>
            <div style={{ fontFamily: FONTE_LOUSA, fontSize: 150, color: ROSA, textShadow: SOMBRA, lineHeight: 1, ...escrito(dt, 0.7) }}>
              aconteceu
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ opacity: dt > 1.0 + i * 0.22 ? 1 : 0 }}>
                  .
                </span>
              ))}
            </div>
            {dt > 0.75 && <Rabisco dt={dt - 0.75} largura={620} cor={AMARELO} />}
          </div>
        )}
      </Peca>
    </>
  );
}

export function IntroParaguai() {
  const t = useT();
  // saída: o último corte cresce e desfoca até virar branco, e o canvas entra
  const saindo = progresso(t, INTRO - 0.45, 0.45, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.3 * saindo})`, filter: saindo > 0 ? `blur(${saindo * 14}px)` : undefined }}>
        {CORTES.map((corte, i) => (
          <Sequence key={i} from={Math.round(inicios[i] * FPS)} durationInFrames={Math.round(corte.dur * FPS)} layout="none">
            <Trecho corte={corte} i={i} />
          </Sequence>
        ))}
        {/* escurece o meio da tela para o texto ler bem em qualquer corte */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 38% at 50% 48%, rgba(0,0,0,0.62), rgba(0,0,0,0) 82%)" }} />
        <Frase1 />
        <Frase2 />
        <Frase3 />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fdfdfc", opacity: saindo }} />
    </AbsoluteFill>
  );
}
