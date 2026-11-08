import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as D from "../../../materiais/whatsapp/diagramas.mjs";
import "../../lousa/fontes";
import { FONTE_LOUSA } from "../../lousa/fontes";
import { DiagramaAnimado, analisar } from "./Desenho";
import {
  FPS,
  atraso,
  falas,
  intros,
  legendas,
  legendasIntro,
  linhaDoTempo,
  total,
  type Bloco,
  type CenaTempo,
  type Foco,
  type Intro,
  type Item,
  type Visual,
} from "./roteiro";

// Reels narrados da série "System Design do WhatsApp" (1080x1920). A narração dita o ritmo:
// cada cena entra na frase em que começa, os itens aparecem quando são falados e a legenda
// destaca a palavra que está sendo dita. O topo (~230 px) e a base (~420 px) ficam livres para
// os botões e a legenda do Instagram.

if (typeof document !== "undefined") {
  const espera = delayRender("Carregando Inter 600/800");
  Promise.all(["600 1em Inter", "800 1em Inter"].map((f) => document.fonts.load(f, "Aáçõ1")))
    .catch((e) => console.error(e))
    .finally(() => continueRender(espera));
}

export const PERFIL = "@juliacardoso.dev";
const COR = { tinta: "#1e1e1e", suave: "#495057", cinza: "#868e96", acento: "#0b7a6b", amarelo: "#ffec99", fundo: "#fbfbf8", vermelho: "#e03131" };
const LADO = 56;
const LARG = 1080 - LADO * 2;
const AREA = { comTitulo: { top: 560, h: 690 }, semTitulo: { top: 330, h: 920 } };
const LEGENDA_TOPO = 1280;
const TRANSICAO = 0.3;

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

/* ------------------------------------------------------------------ visuais */

function Gancho({ v, t }: { v: Extract<Visual, { tipo: "gancho" }>; t: number }) {
  // palavras com o destaque preservado; pontuação logo depois de um destaque fica grudada
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
      {v.apoio && <div style={{ fontFamily: FONTE_LOUSA, fontSize: 58, color: COR.acento, opacity: prog(t, 0.05, 0.3), marginBottom: 24 }}>{v.apoio}</div>}
      <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 124, lineHeight: 1.04, letterSpacing: "-0.04em" }}>
        {palavras.map((partes, i) => {
          const p = prog(t, 0.25 + i * 0.12, 0.3);
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 40}px)`, marginRight: 28 }}>
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

function Icone({ icone = "check", p }: { icone?: string; p: number }) {
  if (icone === "check" || icone === "x") {
    const c = icone === "check" ? COR.acento : COR.vermelho;
    return (
      <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
        <circle cx={32} cy={32} r={28} fill={icone === "check" ? "#e6f4f1" : "#fff0f0"} stroke={c} strokeWidth={4} opacity={Math.min(1, p * 2)} />
        {icone === "check" ? (
          <path d="M18 33 L28 43 L47 22" fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} />
        ) : (
          <path d="M21 21 L43 43 M43 21 L21 43" fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
        )}
      </svg>
    );
  }
  return <span style={{ fontSize: 56, width: 64, textAlign: "center", flexShrink: 0, transform: `scale(${0.6 + 0.4 * p})` }}>{icone}</span>;
}

function Itens({ itens, tempos, t, tam = 50 }: { itens: Item[]; tempos: number[]; t: number; tam?: number }) {
  return (
    <>
      {itens.map((it, i) => {
        const p = prog(t, tempos[i], 0.45);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              opacity: Math.min(1, p * 1.5),
              transform: `translateX(${(1 - p) * -30}px)`,
              background: it.destaque ? COR.amarelo : "transparent",
              border: it.destaque ? `4px solid ${COR.tinta}` : "4px solid transparent",
              borderRadius: 22,
              padding: "10px 18px",
            }}
          >
            <Icone icone={it.icone} p={p} />
            <span style={{ fontSize: tam, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{it.texto}</span>
          </div>
        );
      })}
    </>
  );
}

function Lista({ v, t, cena }: { v: Extract<Visual, { tipo: "lista" }>; t: number; cena: CenaTempo }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
      <Itens itens={v.itens} tempos={cena.tempos.map((x) => x - cena.inicio)} t={t} />
    </div>
  );
}

function Comparacao({ v, t, cena }: { v: Extract<Visual, { tipo: "comparacao" }>; t: number; cena: CenaTempo }) {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: t * fps, fps, config: { damping: 12, stiffness: 150 } });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 18 }}>
        <span style={{ fontSize: 150, lineHeight: 1, transform: `scale(${pop}) rotate(${(1 - pop) * -12}deg)`, flexShrink: 0 }}>{v.emoji}</span>
        <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, opacity: prog(t, 0.15, 0.35) }}>
          <Marcado texto={v.frase} p={prog(t, 0.5, 0.5)} />
        </span>
      </div>
      <Itens itens={v.itens} tempos={cena.tempos.map((x) => x - cena.inicio)} t={t} tam={46} />
    </div>
  );
}

function Linhas({ v, t, cena }: { v: Extract<Visual, { tipo: "linhas" }>; t: number; cena: CenaTempo }) {
  const tempos = cena.tempos.map((x) => x - cena.inicio);
  const ativa = tempos.reduce((a, de, i) => (t >= de ? i : a), -1);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: v.curta ? 26 : 22 }}>
      {v.itens.map((it, i) => {
        const p = prog(t, tempos[i], 0.4);
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
              padding: v.curta ? "26px 34px" : "20px 32px",
              opacity: p,
              transform: `translateY(${(1 - p) * 30}px) scale(${foco ? 1.03 : 1})`,
              boxShadow: foco ? "0 14px 30px rgba(11,122,107,.18)" : "none",
            }}
          >
            <span style={{ fontSize: 76, fontWeight: 800, letterSpacing: "-0.03em", minWidth: v.curta ? 150 : 330, color: it.cor ?? COR.tinta }}>{it.grande}</span>
            <span style={{ fontSize: 38, color: COR.suave, lineHeight: 1.22 }}>
              <b style={{ color: COR.tinta, fontSize: v.curta ? 46 : 40 }}>{titulo}</b>
              <br />
              {resto.join(" ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Diagrama({ v, t, cena, h }: { v: Extract<Visual, { tipo: "diagrama" }>; t: number; cena: CenaTempo; h: number }) {
  const svg = useMemo(() => D[v.nome](), [v.nome]);
  const { largura, altura } = useMemo(() => analisar(svg), [svg]);
  const enquadrar = (f: Foco | null | undefined) => {
    const r = f ?? { x: 0, y: 0, w: largura, h: altura };
    const s = Math.min(LARG / r.w, h / r.h);
    return { s, x: LARG / 2 - (r.x + r.w / 2) * s, y: h / 2 - (r.y + r.h / 2) * s };
  };
  // câmera: cada frase pode enquadrar uma parte do diagrama; a troca leva 0,7 s
  let atual = enquadrar(v.focoInicial);
  for (const f of cena.focosT) {
    const de = f.de - cena.inicio;
    if (t < de) break;
    const alvo = enquadrar(f.foco);
    const p = prog(t, de, 0.7);
    atual = { s: atual.s + (alvo.s - atual.s) * p, x: atual.x + (alvo.x - atual.x) * p, y: atual.y + (alvo.y - atual.y) * p };
  }
  return (
    <div style={{ position: "relative", width: LARG, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${atual.x}px, ${atual.y}px) scale(${atual.s})` }}>
        <DiagramaAnimado svg={svg} t={v.semDesenho ? 1e6 : t} de={0.15} dur={2.6} />
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
      <div style={{ transform: `scale(${preco})`, position: "relative", zIndex: 2 }}>
        <span style={{ display: "inline-block", fontSize: 120, fontWeight: 800, letterSpacing: "-0.04em", background: COR.amarelo, padding: "0 30px", borderRadius: 20, border: `4px solid ${COR.tinta}` }}>
          R$ 15
        </span>
      </div>
      <div style={{ fontFamily: FONTE_LOUSA, fontSize: 76, color: COR.acento, marginTop: 14, opacity: prog(t, 1.9, 0.4) }}>link na bio</div>
    </div>
  );
}

/* ------------------------------------------------------------------ legenda */

/** Legenda da narração: o bloco atual, com a palavra falada destacada. */
function Legenda({ blocos, t }: { blocos: Bloco[]; t: number }) {
  const { fps } = useVideoConfig();
  const b = blocos.find((x) => t >= x.de && t < x.ate);
  if (!b) return null;
  const s = spring({ frame: Math.max(0, (t - b.de) * fps), fps, config: { damping: 18, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: LADO, right: LADO, top: LEGENDA_TOPO, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: "#fff",
          border: `4px solid ${COR.tinta}`,
          borderRadius: 28,
          padding: "20px 30px",
          fontSize: 50,
          fontWeight: 800,
          lineHeight: 1.22,
          letterSpacing: "-0.02em",
          textAlign: "center",
          boxShadow: "8px 8px 0 #1e1e1e",
          opacity: s,
          transform: `translateY(${(1 - s) * 18}px)`,
        }}
      >
        {b.palavras.map((p, i) => {
          const falando = t >= p.s && t < (b.palavras[i + 1]?.s ?? p.e + 0.15);
          const dita = t >= p.s;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  color: dita ? COR.tinta : "#adb5bd",
                  background: falando ? COR.amarelo : "transparent",
                  borderRadius: 10,
                  padding: "0 6px",
                  margin: "0 -6px",
                }}
              >
                {p.w}
              </span>
              {i < b.palavras.length - 1 ? " " : ""}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ som */

// Trilha e efeitos gerados por materiais/whatsapp/sons.py (sintetizados, sem direitos de terceiros).
const SOM = (nome: string) => staticFile(`materiais/whatsapp/sons/${nome}.wav`);
type Efeito = { em: number; nome: string; volume: number };
/** Ajuste geral dos efeitos em relação à voz. */
const GANHO_EFEITOS = 0.8;

/** Efeitos presos aos acontecimentos do vídeo: troca de cena, itens, ✓/✗, desenho, câmera, preço. */
function efeitos(cenas: CenaTempo[]): Efeito[] {
  const lista: Efeito[] = [];
  cenas.forEach((c, i) => {
    const v = c.visual;
    if (i > 0) lista.push({ em: c.inicio - 0.12, nome: "whoosh", volume: 0.3 });
    if (v.tipo === "gancho") lista.push({ em: c.inicio + 0.05, nome: "impacto", volume: 0.55 });
    if (v.tipo === "comparacao") lista.push({ em: c.inicio + 0.08, nome: "pop", volume: 0.35 });
    if (v.tipo === "lista" || v.tipo === "comparacao") {
      v.itens.forEach((it, k) => {
        const nome = it.icone === "x" ? "erro" : it.icone === "check" || it.destaque ? "plim" : "pop";
        lista.push({ em: c.tempos[k], nome, volume: nome === "erro" ? 0.22 : nome === "plim" ? 0.26 : 0.4 });
      });
    }
    if (v.tipo === "linhas") c.tempos.forEach((tt, k) => lista.push({ em: tt, nome: v.itens[k].destaque ? "plim" : "pop", volume: v.itens[k].destaque ? 0.26 : 0.4 }));
    if (v.tipo === "diagrama") {
      if (!v.semDesenho) lista.push({ em: c.inicio + 0.15, nome: "lapis", volume: 0.22 });
      c.focosT.forEach((f) => lista.push({ em: f.de, nome: "whoosh", volume: 0.14 }));
    }
    if (v.tipo === "cta") {
      [0, 1, 2, 3].forEach((k) => lista.push({ em: c.inicio + 0.15 + k * 0.28, nome: "pop", volume: 0.28 }));
      lista.push({ em: c.inicio + 1.5, nome: "kaching", volume: 0.5 });
    }
  });
  return lista.filter((e) => e.em >= 0);
}

/** Volume da trilha quadro a quadro: baixa sob a voz, sobe nas pausas, entra e sai em fade. */
function volumesTrilha(parte: 1 | 2 | 3, quadros: number): number[] {
  const ps = falas(parte);
  const alvo = Array.from({ length: quadros }, (_, f) => {
    const t = f / FPS;
    const falando = ps.some((p) => t >= p.s - 0.25 && t <= p.e + 0.35);
    return falando ? 0.055 : 0.15;
  });
  // suaviza (~0,4 s) para a trilha não "pular"
  const janela = 12;
  return alvo.map((_, f) => {
    let soma = 0;
    let n = 0;
    for (let k = Math.max(0, f - janela); k <= Math.min(quadros - 1, f + janela); k++) {
      soma += alvo[k];
      n++;
    }
    const t = f / FPS;
    const fade = Math.min(1, t / 1.0, (quadros / FPS - t) / 1.5);
    return Math.max(0, (soma / n) * fade);
  });
}

function Trilha({ parte }: { parte: 1 | 2 | 3 }) {
  const { durationInFrames } = useVideoConfig();
  const vols = useMemo(() => volumesTrilha(parte, durationInFrames), [parte, durationInFrames]);
  return (
    <Html5Audio
      src={SOM("trilha")}
      loop
      // o Remotion pode pedir quadros fracionários: arredonda e limita ao vetor
      volume={(f) => vols[Math.min(vols.length - 1, Math.max(0, Math.round(Number.isFinite(f) ? f : 0)))] ?? 0}
    />
  );
}

function Efeitos({ lista }: { lista: Efeito[] }) {
  return (
    <>
      {lista.map((e, i) => (
        <Sequence key={i} from={Math.round(e.em * FPS)} durationInFrames={Math.round(2 * FPS)}>
          <Html5Audio src={SOM(e.nome)} volume={e.volume * GANHO_EFEITOS} />
        </Sequence>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ cena */

function CenaView({ cena, ultima, numero }: { cena: CenaTempo; ultima: boolean; numero: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const dur = cena.fim - cena.inicio;
  const entra = prog(t, 0, TRANSICAO);
  const sai = ultima ? 1 : 1 - prog(t, dur - TRANSICAO, TRANSICAO);
  const area = cena.titulo ? AREA.comTitulo : AREA.semTitulo;
  const v = cena.visual;
  return (
    <AbsoluteFill style={{ opacity: entra * sai, transform: `translateY(${(1 - entra) * 26 + (1 - sai) * -26}px)` }}>
      <div style={{ position: "absolute", left: LADO, top: 252, fontFamily: FONTE_LOUSA, fontSize: 40, color: COR.acento }}>system design · parte {numero}/3</div>
      {cena.titulo && (
        <div style={{ position: "absolute", left: LADO, right: LADO, top: 318, fontFamily: "Inter", fontWeight: 800, fontSize: 88, lineHeight: 1.03, letterSpacing: "-0.035em" }}>
          <Marcado texto={cena.titulo} p={prog(t, 0.35, 0.5)} />
        </div>
      )}
      <div style={{ position: "absolute", left: LADO, width: LARG, top: area.top, height: area.h }}>
        {v.tipo === "gancho" && <Gancho v={v} t={t} />}
        {v.tipo === "linhas" && <Linhas v={v} t={t} cena={cena} />}
        {v.tipo === "lista" && <Lista v={v} t={t} cena={cena} />}
        {v.tipo === "comparacao" && <Comparacao v={v} t={t} cena={cena} />}
        {v.tipo === "diagrama" && <Diagrama v={v} t={t} cena={cena} h={area.h} />}
        {v.tipo === "cta" && <Cta t={t} />}
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ intro gravada */

const INTRO = (parte: number, arq: string) => staticFile(`materiais/whatsapp/intro/parte${parte}/${arq}`);

type Adesivo = { de: number; x: number; y: number; giro: number; grande: string; texto?: string; balao?: boolean };
// Cartões que entram atrás da Julia junto com "o WhatsApp comigo". Ficam nas faixas livres ao lado
// dela (medidas no recorte), para nenhum número ser coberto: um "175" meio escondido viraria "75".
const ADESIVOS: Adesivo[] = [
  { de: 1.75, x: 22, y: 688, giro: -6, grande: "5 bi", texto: "mensagens por dia" },
  { de: 1.95, x: 22, y: 900, giro: 4, grande: "175 mil", texto: "por segundo" },
  { de: 2.15, x: 868, y: 905, giro: -3, grande: "oi! ✓✓", balao: true },
  { de: 2.35, x: 862, y: 688, giro: 5, grande: "1.024", texto: "por grupo" },
];

function CartaoIntro({ a, t }: { a: Adesivo; t: number }) {
  const { fps } = useVideoConfig();
  if (t < a.de) return null;
  const s = spring({ frame: (t - a.de) * fps, fps, config: { damping: 12, stiffness: 170 } });
  return (
    <div
      style={{
        position: "absolute",
        left: a.x,
        top: a.y,
        transform: `rotate(${a.giro}deg) scale(${s})`,
        background: a.balao ? "#d3f9d8" : "#fff",
        border: `4px solid ${COR.tinta}`,
        borderRadius: a.balao ? "26px 26px 26px 6px" : 22,
        padding: a.balao ? "10px 20px" : "10px 18px",
        boxShadow: "6px 6px 0 #1e1e1e",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontSize: a.balao ? 46 : 52, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
        {a.balao ? (
          <>
            oi! <span style={{ color: "#1971c2" }}>✓✓</span>
          </>
        ) : (
          a.grande
        )}
      </div>
      {a.texto && <div style={{ fontSize: 24, fontWeight: 600, color: COR.suave }}>{a.texto}</div>}
    </div>
  );
}

/** A intro gravada: a Julia na frente, os gráficos atrás dela e o quarto desfocado ao fundo. Quando a
 *  mão cruza a tela, a intro sai "arrastada" da esquerda para a direita e revela o Reel narrado. */
function IntroGravada({ parte, intro }: { parte: 1 | 2 | 3; intro: Intro }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const rabiscos = useMemo(() => D.introRabiscos(), []);
  const blocos = useMemo(() => legendasIntro(parte), [parte]);
  const [m0] = intro.mao;
  // a borda acompanha a mão: entra pela esquerda junto com ela e sai pela direita
  const borda = interpolate(t, [m0, intro.duracao], [-180, 1180], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.3, 0, 0.7, 1) });
  const arrastando = t >= m0;
  const quadro = Math.min(intro.quadros - 1, Math.max(0, Math.floor(frame)));
  const titulo = prog(t, 0.21, 0.35);
  const whats = prog(t, 1.6, 0.4);
  return (
    <AbsoluteFill style={{ filter: arrastando ? "drop-shadow(-16px 0 24px rgba(0,0,0,.35))" : undefined }}>
      <AbsoluteFill style={{ clipPath: arrastando ? `polygon(${borda + 70}px 0, 1400px 0, 1400px 1920px, ${borda - 70}px 1920px)` : undefined, overflow: "hidden" }}>
        {/* quarto desfocado: dá profundidade e deixa os gráficos legíveis */}
        <AbsoluteFill style={{ transform: "scale(1.02)", filter: "blur(5px) saturate(0.95)" }}>
          <OffthreadVideo src={INTRO(parte, "fundo.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "rgba(251,251,248,0.30)" }} />
        {/* atrás dela: título, rabiscos e cartões */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 310,
            textAlign: "center",
            fontWeight: 800,
            fontSize: 112,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            opacity: titulo,
            transform: `scale(${0.85 + 0.15 * titulo})`,
            textShadow: "0 4px 28px rgba(255,255,255,.7)",
          }}
        >
          SYSTEM DESIGN
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 416,
            textAlign: "center",
            fontWeight: 800,
            fontSize: 208,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            opacity: whats,
            transform: `translateY(${(1 - whats) * 70}px)`,
            textShadow: "0 4px 28px rgba(255,255,255,.6)",
          }}
        >
          <Marcado texto="*WhatsApp*" p={prog(t, 1.85, 0.45)} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <DiagramaAnimado svg={rabiscos} t={t} de={0.44} dur={1.3} />
        </div>
        {ADESIVOS.map((a, i) => (
          <CartaoIntro key={i} a={a} t={t} />
        ))}
        {/* a Julia, recortada, na frente de tudo */}
        <Img src={INTRO(parte, `frente/${String(quadro).padStart(4, "0")}.webp`)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
        <div style={{ position: "absolute", left: LADO, top: 252, fontFamily: FONTE_LOUSA, fontSize: 40, color: COR.acento, textShadow: "0 2px 12px rgba(255,255,255,.8)" }}>
          system design · parte {parte}/3
        </div>
        <Legenda blocos={blocos} t={t} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Sons da intro, em tempo absoluto (fora da sequência visual, para nada ser cortado no fim dela). */
function SonsIntro({ parte, intro }: { parte: 1 | 2 | 3; intro: Intro }) {
  const lista: Efeito[] = [
    { em: 0.21, nome: "pop", volume: 0.35 },
    { em: 0.44, nome: "lapis", volume: 0.24 },
    { em: 1.6, nome: "pop", volume: 0.45 },
    ...ADESIVOS.map((a) => ({ em: a.de, nome: a.balao ? "plim" : "pop", volume: a.balao ? 0.26 : 0.38 })),
    { em: intro.mao[0] - 0.06, nome: "whoosh", volume: 0.6 },
  ];
  return (
    <>
      <Html5Audio src={INTRO(parte, "voz.wav")} />
      <Efeitos lista={lista} />
    </>
  );
}

/* ------------------------------------------------------------------ vídeo */

/** O Reel narrado (cenas, narração, efeitos e legenda), em tempo relativo ao seu próprio começo. */
function Corpo({ parte, cenas }: { parte: 1 | 2 | 3; cenas: CenaTempo[] }) {
  const frame = useCurrentFrame();
  const blocos = useMemo(() => legendas(parte), [parte]);
  const lista = useMemo(() => efeitos(cenas), [cenas]);
  return (
    <AbsoluteFill>
      <Html5Audio src={staticFile(`materiais/whatsapp/narracao/parte${parte}.mp3`)} />
      <Efeitos lista={lista} />
      {cenas.map((c, i) => (
        <Sequence key={i} from={Math.round(c.inicio * FPS)} durationInFrames={Math.max(1, Math.round((c.fim - c.inicio) * FPS))}>
          <CenaView cena={c} ultima={i === cenas.length - 1} numero={parte} />
        </Sequence>
      ))}
      <Legenda blocos={blocos} t={frame / FPS} />
    </AbsoluteFill>
  );
}

export type PropsReelWhatsApp = { parte: 1 | 2 | 3 };

export const ReelWhatsApp: React.FC<PropsReelWhatsApp> = ({ parte }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cenas = useMemo(() => linhaDoTempo(parte), [parte]);
  const intro = intros[parte];
  const fim = total(parte);
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
      <Trilha parte={parte} />
      <Sequence from={Math.round(atraso(parte) * FPS)}>
        <Corpo parte={parte} cenas={cenas} />
      </Sequence>
      {intro && (
        <>
          <SonsIntro parte={parte} intro={intro} />
          <Sequence durationInFrames={Math.round(intro.duracao * FPS)}>
            <IntroGravada parte={parte} intro={intro} />
          </Sequence>
        </>
      )}
      {/* progresso da parte */}
      <div style={{ position: "absolute", left: LADO, right: LADO, top: 222, height: 8, borderRadius: 4, background: "#e9ecef" }}>
        <div style={{ width: `${Math.min(100, (t / fim) * 100)}%`, height: "100%", borderRadius: 4, background: COR.acento }} />
      </div>
      <div style={{ position: "absolute", right: LADO, top: 258, fontSize: 30, color: COR.cinza, fontWeight: 600 }}>{PERFIL}</div>
    </AbsoluteFill>
  );
};
