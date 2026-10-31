import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Series, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { agruparPalavras, quadrosDoBloco, type BlocoRender, type Estilo, type PropsUgc } from "../src/ugc/formato";

// Vídeo UGC: tomadas da personagem (ou telas do app) com a voz, legenda palavra a palavra,
// headline, zoom e efeitos sonoros, tudo seguindo o guia de estilo.

const familia: Record<Estilo["legendas"]["fonte"], string> = {
  Poppins: "'Poppins', sans-serif",
  Inter: "'Inter', sans-serif",
  "Archivo Black": "'Archivo Black', sans-serif",
  "Roboto Slab": "'Roboto Slab', serif",
};

const peso = (f: Estilo["legendas"]["fonte"]) => (f === "Inter" ? 700 : f === "Archivo Black" ? 400 : 800);

const posicao = (p: "superior" | "centro" | "inferior"): React.CSSProperties =>
  p === "superior" ? { top: 260 } : p === "centro" ? { top: 0, bottom: 0, display: "flex", alignItems: "center" } : { bottom: 380 };

function contorno(ativo: boolean): React.CSSProperties {
  return ativo ? { WebkitTextStroke: "10px #000", paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,0.45)" } : { textShadow: "0 4px 16px rgba(0,0,0,0.55)" };
}

const Visual: React.FC<{ b: BlocoRender; base: string; estilo: PropsUgc["estilo"] }> = ({ b, base, estilo }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const punch = b.zoom && estilo.zoom.usa ? 1 + (estilo.zoom.intensidade - 1) * spring({ frame, fps, config: { damping: 18, stiffness: 180 } }) : 1;
  const filtro = estilo.cor.filtroCss || undefined;

  if (b.video) {
    const taxa = b.videoDuracaoSeg ? Math.min(1, b.videoDuracaoSeg / b.duracaoSeg) : 1;
    return (
      <AbsoluteFill style={{ transform: `scale(${punch})`, filter: filtro }}>
        <OffthreadVideo src={base + b.video} muted playbackRate={taxa} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }
  if (b.imagem) {
    // Tela do app: inteira no centro, com a própria imagem desfocada de fundo.
    const lento = interpolate(frame, [0, durationInFrames], [1, 1.06]);
    return (
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <Img src={base + b.imagem} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.6)", transform: "scale(1.2)" }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${lento})` }}>
          <Img src={base + b.imagem} style={{ maxWidth: "82%", maxHeight: "70%", borderRadius: 36, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return null;
};

const Legenda: React.FC<{ b: BlocoRender; estilo: PropsUgc["estilo"] }> = ({ b, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = estilo.legendas;
  if (!l.usa || !b.palavras.length) return null;
  const t = frame / fps;
  const grupos = agruparPalavras(b.palavras, l.modo === "palavra" ? l.palavrasPorVez : Math.max(l.palavrasPorVez, 6));
  const idx = grupos.findIndex((g, i) => t >= g[0].inicio && (i === grupos.length - 1 || t < grupos[i + 1][0].inicio));
  if (idx < 0) return null;
  const grupo = grupos[idx];
  if (t > grupo.at(-1)!.fim + 0.4) return null;
  // Só uma palavra acesa: a última que já começou.
  const atual = grupo.reduce((a, p, i) => (t >= p.inicio ? i : a), 0);
  const entrada = spring({ frame: frame - Math.round(grupo[0].inicio * fps), fps, config: { damping: 14, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, justifyContent: "center", ...posicao(l.posicao) }}>
      <div
        style={{
          width: "100%",
          textAlign: "center",
          fontFamily: familia[l.fonte],
          fontWeight: peso(l.fonte),
          fontSize: l.tamanho,
          lineHeight: 1.12,
          color: l.cor,
          textTransform: l.caixaAlta ? "uppercase" : "none",
          transform: `scale(${0.85 + 0.15 * entrada})`,
          ...contorno(l.contorno),
        }}
      >
        {grupo.map((p, i) => (
          <span key={i} style={{ color: l.modo === "palavra" && i === atual ? l.destaque : l.cor }}>
            {p.texto}
            {i < grupo.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

const Headline: React.FC<{ texto: string; estilo: PropsUgc["estilo"] }> = ({ texto, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = estilo.headline;
  const s = spring({ frame, fps, config: { damping: 200 } });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, display: "flex", justifyContent: "center", ...posicao(h.posicao) }}>
      <div
        style={{
          opacity: s,
          transform: `translateY(${(1 - s) * -40}px)`,
          background: h.destaque,
          color: h.cor,
          fontFamily: familia[h.fonte],
          fontWeight: peso(h.fonte),
          fontSize: h.tamanho,
          textTransform: h.caixaAlta ? "uppercase" : "none",
          lineHeight: 1.1,
          padding: "18px 30px",
          borderRadius: 18,
          textAlign: "center",
          ...(h.contorno ? contorno(true) : {}),
        }}
      >
        {texto}
      </div>
    </div>
  );
};

const Bloco: React.FC<{ b: BlocoRender; props: PropsUgc }> = ({ b, props }) => (
  <AbsoluteFill>
    <Visual b={b} base={props.base} estilo={props.estilo} />
    {b.audio && <Audio src={props.base + b.audio} />}
    {b.sfx && <Audio src={props.base + b.sfx} volume={b.sfxVolume ?? 0.6} />}
    {b.headline && props.estilo.headline.usa && <Headline texto={b.headline} estilo={props.estilo} />}
    <Legenda b={b} estilo={props.estilo} />
  </AbsoluteFill>
);

export const Ugc: React.FC<PropsUgc> = (props) => (
  <AbsoluteFill style={{ background: props.marca.cores.fundo }}>
    <Series>
      {props.blocos.map((b, i) => (
        <Series.Sequence key={i} durationInFrames={quadrosDoBloco(b)}>
          <Bloco b={b} props={props} />
        </Series.Sequence>
      ))}
    </Series>
    {props.rotuloIa && (
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 60,
          padding: "8px 18px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.45)",
          color: "rgba(255,255,255,0.9)",
          fontFamily: familia.Inter,
          fontWeight: 700,
          fontSize: 26,
        }}
      >
        {props.rotuloIa}
      </div>
    )}
  </AbsoluteFill>
);
