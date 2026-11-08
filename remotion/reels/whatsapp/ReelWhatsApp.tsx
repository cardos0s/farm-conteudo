import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as D from "../../../materiais/whatsapp/diagramas.mjs";
import "../../lousa/fontes";
import { FONTE_LOUSA } from "../../lousa/fontes";
import { DiagramaAnimado, analisar } from "./Desenho";
import { FPS, TRANSICAO, partes, tempos, type CenaTempo, type Foco, type Visual } from "./roteiro";

// Reels da série "System Design do WhatsApp" (1080x1920), sem narração: legendas no ritmo de
// leitura, diagramas do ebook se desenhando e a chamada para o ebook no fim de cada parte.
// O topo (~230 px) e a base (~420 px) ficam livres para os botões e a legenda do Instagram.

if (typeof document !== "undefined") {
  const espera = delayRender("Carregando Inter 600/800");
  Promise.all(["600 1em Inter", "800 1em Inter"].map((f) => document.fonts.load(f, "Aáçõ1")))
    .catch((e) => console.error(e))
    .finally(() => continueRender(espera));
}

export const PERFIL = "@juliacardoso.dev";
const COR = { tinta: "#1e1e1e", suave: "#495057", cinza: "#868e96", acento: "#0b7a6b", amarelo: "#ffec99", fundo: "#fbfbf8" };
const LADO = 56;
const LARG = 1080 - LADO * 2;
const AREA = { comTitulo: { top: 560, h: 690 }, semTitulo: { top: 330, h: 920 } };
const LEGENDA_TOPO = 1275;

const ease = Easing.bezier(0.45, 0, 0.25, 1);
const prog = (t: number, de: number, dur: number) => interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** *palavra* vira destaque amarelo; p controla o "marca-texto" passando. */
function Marcado({ texto, p = 1 }: { texto: string; p?: number }) {
  const partes = texto.split(/\*(.+?)\*/g);
  return (
    <>
      {partes.map((s, i) =>
        i % 2 ? (
          <span
            key={i}
            style={{
              backgroundImage: `linear-gradient(${COR.amarelo}, ${COR.amarelo})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0 88%",
              backgroundSize: `${p * 100}% 42%`,
            }}
          >
            {s}
          </span>
        ) : (
          <React.Fragment key={i}>{s}</React.Fragment>
        ),
      )}
    </>
  );
}

const quebras = (s: string) => s.split("\n").map((l, i) => (i ? [<br key={i} />, l] : l));

/* ------------------------------------------------------------------ visuais */

function Gancho({ v, t }: { v: Extract<Visual, { tipo: "gancho" }>; t: number }) {
  // palavras com a marcação de destaque preservada (o destaque pode cobrir várias palavras);
  // pontuação logo depois de um destaque fica grudada na palavra anterior
  const palavras: { t: string; marca: boolean }[][] = [];
  const segs = v.texto.split(/\*(.+?)\*/g);
  segs.forEach((seg, i) => {
    const marca = i % 2 === 1;
    seg.split(/(\s+)/).forEach((pedaco, j) => {
      if (!pedaco || /^\s+$/.test(pedaco)) return;
      const colado = j === 0 && i > 0 && palavras.length > 0 && !/^\s/.test(seg) && !/\s$/.test(segs[i - 1]);
      if (colado) palavras[palavras.length - 1].push({ t: pedaco, marca });
      else palavras.push([{ t: pedaco, marca }]);
    });
  });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {v.apoio && (
        <div style={{ fontFamily: FONTE_LOUSA, fontSize: 58, color: COR.acento, opacity: prog(t, 0.05, 0.3), marginBottom: 24 }}>{v.apoio}</div>
      )}
      <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 132, lineHeight: 1.04, letterSpacing: "-0.04em" }}>
        {palavras.map((partes, i) => {
          const p = prog(t, 0.3 + i * 0.12, 0.3);
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 40}px)`, marginRight: 30 }}>
              {partes.map((x, k) => (
                <Marcado key={k} texto={x.marca ? `*${x.t}*` : x.t} p={prog(t, 0.9, 0.5)} />
              ))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Passos({ v, t }: { v: Extract<Visual, { tipo: "passos" }>; t: number }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {v.itens.map(([titulo, min], i) => {
        const p = prog(t, 0.3 + i * 0.3, 0.35);
        return (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 28, padding: "13px 0", borderBottom: "4px dashed #ced4da", opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}
          >
            <span style={{ fontFamily: FONTE_LOUSA, fontSize: 64, color: COR.acento, width: 70 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 50, fontWeight: 600, letterSpacing: "-0.02em" }}>{titulo}</span>
            <span style={{ fontSize: 40, color: COR.cinza }}>{min}</span>
          </div>
        );
      })}
    </div>
  );
}

function Linhas({ v, t, cena }: { v: Extract<Visual, { tipo: "linhas" }>; t: number; cena: CenaTempo }) {
  const ativa = cena.legendasT.findIndex((l) => t >= l.de && t < l.ate);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: v.curta ? 26 : 20 }}>
      {v.itens.map((it, i) => {
        const de = cena.legendasT[i]?.de ?? 0.3 + i * 0.3;
        const p = prog(t, de, 0.4);
        const foco = i === ativa;
        const [titulo, ...resto] = it.texto.split("\n");
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              background: it.destaque ? COR.amarelo : "#fff",
              border: `4px solid ${foco ? COR.acento : COR.tinta}`,
              borderRadius: 26,
              padding: v.curta ? "26px 34px" : "18px 32px",
              opacity: p,
              transform: `translateY(${(1 - p) * 30}px) scale(${foco ? 1.03 : 1})`,
              boxShadow: foco ? "0 14px 30px rgba(11,122,107,.18)" : "none",
            }}
          >
            <span style={{ fontSize: v.curta ? 76 : 74, fontWeight: 800, letterSpacing: "-0.03em", minWidth: v.curta ? 150 : 390, color: it.cor ?? COR.tinta }}>
              {it.grande}
            </span>
            <span style={{ fontSize: 36, color: COR.suave, lineHeight: 1.22 }}>
              {v.curta ? (
                <>
                  <b style={{ color: COR.tinta, fontSize: 44 }}>{titulo}</b>
                  <br />
                  {resto.join(" ")}
                </>
              ) : (
                quebras(it.texto)
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Check({ p }: { p: number }) {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx={32} cy={32} r={28} fill="#e6f4f1" stroke={COR.acento} strokeWidth={4} opacity={Math.min(1, p * 2)} />
      <path d="M18 33 L28 43 L47 22" fill="none" stroke={COR.acento} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} />
    </svg>
  );
}

function Lista({ v, t, cena }: { v: Extract<Visual, { tipo: "lista" }>; t: number; cena: CenaTempo }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 34 }}>
      {v.itens.map((it, i) => {
        const de = v.sincronizada ? (cena.legendasT[i]?.de ?? 0.4 + i * 0.5) : 0.4 + i * 0.5;
        const p = prog(t, de, 0.45);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -30}px)` }}>
            <Check p={p} />
            <span style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{it}</span>
          </div>
        );
      })}
    </div>
  );
}

function Diagrama({ v, t, cena, h }: { v: Extract<Visual, { tipo: "diagrama" }>; t: number; cena: CenaTempo; h: number }) {
  const svg = useMemo(() => D[v.nome](), [v.nome]);
  const { largura, altura } = useMemo(() => analisar(svg), [svg]);
  const total: Foco = { x: 0, y: 0, w: largura, h: altura };
  const enquadrar = (f: Foco | null | undefined) => {
    const r = f ?? total;
    const s = Math.min(LARG / r.w, h / r.h);
    return { s, x: LARG / 2 - (r.x + r.w / 2) * s, y: h / 2 - (r.y + r.h / 2) * s };
  };
  // câmera: cada legenda pode enquadrar uma parte do diagrama; a troca leva 0,7 s
  let atual = enquadrar(null);
  cena.legendasT.forEach((l, i) => {
    if (!v.focos || t < l.de) return;
    const alvo = enquadrar(v.focos[i]);
    const p = prog(t, l.de, 0.7);
    atual = { s: atual.s + (alvo.s - atual.s) * p, x: atual.x + (alvo.x - atual.x) * p, y: atual.y + (alvo.y - atual.y) * p };
  });
  const desenho = Math.min(3.2, Math.max(1.6, (cena.legendasT[0]?.ate ?? 3) - 0.8));
  return (
    <div style={{ position: "relative", width: LARG, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${atual.x}px, ${atual.y}px) scale(${atual.s})` }}>
        <DiagramaAnimado svg={svg} t={t} de={0.15} dur={desenho} />
      </div>
    </div>
  );
}

const PAGINAS = ["p-21.png", "p-11.png", "p-08.png", "p-01.png"];

function Cta({ t }: { t: number }) {
  const { fps } = useVideoConfig();
  const preco = spring({ frame: Math.max(0, (t - 1.5) * fps), fps, config: { damping: 11, stiffness: 140 } });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: FONTE_LOUSA, fontSize: 54, color: COR.acento, opacity: prog(t, 0, 0.3) }}>guia completo</div>
      <div style={{ position: "relative", width: 900, height: 560, marginTop: 24 }}>
        {PAGINAS.map((arq, i) => {
          const p = prog(t, 0.15 + i * 0.28, 0.5);
          const rot = [-11, 8, -5, -2][i];
          const dx = [-200, 200, -70, 30][i];
          return (
            <Img
              key={arq}
              src={staticFile(`materiais/whatsapp/paginas/${arq}`)}
              style={{
                position: "absolute",
                left: 450 - 180 + dx * p,
                top: 20 + (1 - p) * 240,
                width: 360,
                borderRadius: 10,
                border: `3px solid ${COR.tinta}`,
                boxShadow: "0 26px 50px rgba(0,0,0,.2)",
                opacity: p,
                transform: `rotate(${rot * p}deg)`,
              }}
            />
          );
        })}
      </div>
      <div style={{ transform: `scale(${preco})`, marginTop: 0, position: "relative", zIndex: 2 }}>
        <span style={{ display: "inline-block", fontSize: 120, fontWeight: 800, letterSpacing: "-0.04em", background: COR.amarelo, padding: "0 30px", borderRadius: 20, border: `4px solid ${COR.tinta}` }}>
          R$ 15
        </span>
      </div>
      <div style={{ fontFamily: FONTE_LOUSA, fontSize: 76, color: COR.acento, marginTop: 14, opacity: prog(t, 1.9, 0.4) }}>link na bio</div>
    </div>
  );
}

/* ------------------------------------------------------------------ cena */

function Legenda({ cena, t }: { cena: CenaTempo; t: number }) {
  const { fps } = useVideoConfig();
  const l = cena.legendasT.find((x) => t >= x.de && t < x.ate) ?? (t >= (cena.legendasT.at(-1)?.ate ?? 0) ? cena.legendasT.at(-1) : undefined);
  if (!l) return null;
  const s = spring({ frame: Math.max(0, (t - l.de) * fps), fps, config: { damping: 16, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: LADO, right: LADO, top: LEGENDA_TOPO, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: "#fff",
          border: `4px solid ${COR.tinta}`,
          borderRadius: 28,
          padding: "22px 32px",
          fontSize: 43,
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: "-0.015em",
          textAlign: "center",
          boxShadow: "8px 8px 0 #1e1e1e",
          opacity: s,
          transform: `translateY(${(1 - s) * 24}px) scale(${0.96 + s * 0.04})`,
        }}
      >
        <Marcado texto={l.texto} p={prog(t, l.de + 0.25, 0.45)} />
      </div>
    </div>
  );
}

function CenaView({ cena, ultima, numero }: { cena: CenaTempo; ultima: boolean; numero: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const entra = prog(t, 0, 0.3);
  const sai = ultima ? 1 : 1 - prog(t, cena.duracao - TRANSICAO, TRANSICAO);
  const area = cena.titulo ? AREA.comTitulo : AREA.semTitulo;
  const v = cena.visual;
  return (
    <AbsoluteFill style={{ opacity: entra * sai, transform: `translateY(${(1 - entra) * 30 + (1 - sai) * -30}px)` }}>
      <div style={{ position: "absolute", left: LADO, top: 252, fontFamily: FONTE_LOUSA, fontSize: 40, color: COR.acento }}>
        system design · parte {numero}/3
      </div>
      {cena.titulo && (
        <div style={{ position: "absolute", left: LADO, right: LADO, top: 318, fontFamily: "Inter", fontWeight: 800, fontSize: 92, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
          <Marcado texto={cena.titulo} p={prog(t, 0.35, 0.5)} />
        </div>
      )}
      <div style={{ position: "absolute", left: LADO, width: LARG, top: area.top, height: area.h }}>
        {v.tipo === "gancho" && <Gancho v={v} t={t} />}
        {v.tipo === "passos" && <Passos v={v} t={t} />}
        {v.tipo === "linhas" && <Linhas v={v} t={t} cena={cena} />}
        {v.tipo === "lista" && <Lista v={v} t={t} cena={cena} />}
        {v.tipo === "diagrama" && <Diagrama v={v} t={t} cena={cena} h={area.h} />}
        {v.tipo === "cta" && <Cta t={t} />}
      </div>
      <Legenda cena={cena} t={t} />
    </AbsoluteFill>
  );
}

export type PropsReelWhatsApp = { parte: 1 | 2 | 3 };

export const ReelWhatsApp: React.FC<PropsReelWhatsApp> = ({ parte }) => {
  const frame = useCurrentFrame();
  const { cenas, total } = useMemo(() => tempos(partes[parte]), [parte]);
  return (
    <AbsoluteFill
      style={{
        background: COR.fundo,
        backgroundImage: "radial-gradient(#d9d9d2 2.2px, transparent 2.2px)",
        backgroundSize: "38px 38px",
        fontFamily: "Inter, sans-serif",
        color: COR.tinta,
      }}
    >
      {cenas.map((c, i) => (
        <Sequence key={i} from={Math.round(c.inicio * FPS)} durationInFrames={Math.ceil(c.duracao * FPS)}>
          <CenaView cena={c} ultima={i === cenas.length - 1} numero={parte} />
        </Sequence>
      ))}
      {/* progresso da parte */}
      <div style={{ position: "absolute", left: LADO, right: LADO, top: 222, height: 8, borderRadius: 4, background: "#e9ecef" }}>
        <div style={{ width: `${Math.min(100, (frame / FPS / total) * 100)}%`, height: "100%", borderRadius: 4, background: COR.acento }} />
      </div>
      <div style={{ position: "absolute", right: LADO, top: 258, fontSize: 30, color: COR.cinza, fontWeight: 600 }}>{PERFIL}</div>
    </AbsoluteFill>
  );
};
