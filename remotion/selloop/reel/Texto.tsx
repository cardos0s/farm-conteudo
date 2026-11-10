import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cor, fonte, marca } from "../marca";
import { prender, RW, ZONA } from "./base";
import { Icone, type NomeIcone } from "./Icones";

// Os textos do formato vertical: a marca no topo, o título de cada momento (palavra por palavra) e a
// legenda da locução, que acompanha a fala.

function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
}

/** Logo no topo e, à direita, o assunto do vídeo. */
export const Marca: React.FC<{ assunto: string; icone: NomeIcone }> = ({ assunto, icone }) => {
  const { frame, fps } = useT();
  const s = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const z = ZONA.marca;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: z.y, height: z.h, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: s, transform: `translateY(${(1 - s) * -16}px)` }}>
      <Img src={marca.logoBranco} style={{ height: z.h + 6, width: "auto" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 20px 9px 16px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          border: "1.5px solid rgba(255,255,255,0.22)",
          color: "#ffffff",
          fontFamily: fonte,
          fontWeight: 600,
          fontSize: 25,
        }}
      >
        <Icone nome={icone} tamanho={25} traco={2.2} />
        {assunto}
      </div>
    </div>
  );
};

/** Corpo do título conforme o tamanho do texto (cabe em até duas linhas). */
function corpoDoTitulo(n: number) {
  if (n <= 15) return 84;
  if (n <= 21) return 74;
  if (n <= 34) return 66;
  if (n <= 46) return 58;
  return 52;
}

/**
 * Título do momento. As palavras sobem uma a uma; o trecho entre *asteriscos* ganha a cor da marca e
 * um marca-texto que se pinta atrás dele.
 */
export const Titulo: React.FC<{ texto: string; de: number; ate: number }> = ({ texto, de, ate }) => {
  const { frame, fps, t } = useT();
  if (t < de - 0.02 || t > ate) return null;
  const partes = texto.split("*");
  const palavras: { texto: string; destaque: boolean }[] = [];
  partes.forEach((p, i) => p.split(/\s+/).filter(Boolean).forEach((w) => palavras.push({ texto: w, destaque: i % 2 === 1 })));
  const corpo = corpoDoTitulo(texto.replace(/\*/g, "").length);
  const saida = interpolate(t, [ate - 0.22, ate], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const z = ZONA.titulo;
  const pintura = prender((t - de - 0.25 - palavras.length * 0.045) / 0.4);
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        width: RW - 112,
        top: z.y,
        height: z.h,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        opacity: saida,
        transform: `translateY(${(1 - saida) * -26}px)`,
      }}
    >
      <div style={{ fontFamily: fonte, fontWeight: 700, fontSize: corpo, lineHeight: 1.13, letterSpacing: -corpo * 0.018, color: "#ffffff", textAlign: "center", textWrap: "balance" as never, textShadow: "0 6px 26px rgba(0,4,45,0.45)" }}>
        {palavras.map((p, i) => {
          const s = spring({ frame: frame - Math.round((de + i * 0.045) * fps), fps, config: { damping: 13, stiffness: 170, mass: 0.6 } });
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: "inline-block",
                  opacity: prender(s * 1.3),
                  transform: `translateY(${(1 - s) * 48}px) rotate(${(1 - s) * 5}deg)`,
                  color: p.destaque ? "#7fd8ff" : "#ffffff",
                  backgroundImage: p.destaque ? "linear-gradient(rgba(0,173,255,0.34), rgba(0,173,255,0.34))" : undefined,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 88%",
                  backgroundSize: `${pintura * 100}% 30%`,
                  padding: p.destaque ? "0 0.06em" : undefined,
                }}
              >
                {p.texto}
              </span>{" "}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export type PalavraFalada = { texto: string; de: number; ate: number };

type Pagina = { de: number; ate: number; palavras: PalavraFalada[] };

/**
 * Quebra a fala em "páginas" curtas de legenda: muda de página no fim da frase, numa vírgula quando a
 * página já tem corpo, ou quando passaria do tamanho.
 */
export function paginasDaFala(palavras: PalavraFalada[], inicio: number, fimDaFala: number, max = 27): Pagina[] {
  const paginas: Pagina[] = [];
  let atual: PalavraFalada[] = [];
  let n = 0;
  const fechar = () => {
    if (atual.length) paginas.push({ de: atual[0].de, ate: atual[atual.length - 1].ate, palavras: atual });
    atual = [];
    n = 0;
  };
  for (const p of palavras) {
    const w = { texto: p.texto, de: inicio + p.de, ate: inicio + p.ate };
    if (n > 0 && n + 1 + w.texto.length > max) fechar();
    atual.push(w);
    n += (n ? 1 : 0) + w.texto.length;
    if (/[.!?…:]$/.test(w.texto) || (/[,;]$/.test(w.texto) && n >= 16)) fechar();
  }
  fechar();
  // cada página fica na tela até a próxima começar (ou um pouco depois do fim da fala)
  paginas.forEach((pg, i) => {
    pg.ate = i + 1 < paginas.length ? paginas[i + 1].de : Math.max(pg.ate + 0.3, inicio + fimDaFala + 0.25);
  });
  return paginas;
}

/** Legenda no ritmo da fala: a palavra do momento fica acesa, as que já passaram ficam brancas. */
export const LegendaReel: React.FC<{ paginas: Pagina[] }> = ({ paginas }) => {
  const { t } = useT();
  const pg = paginas.find((p) => t >= p.de - 0.06 && t < p.ate);
  if (!pg) return null;
  const entra = prender((t - (pg.de - 0.06)) / 0.12);
  const z = ZONA.legenda;
  return (
    <div style={{ position: "absolute", left: 96, width: RW - 192, top: z.y, height: z.h, display: "flex", alignItems: "center", justifyContent: "center", opacity: entra, transform: `translateY(${(1 - entra) * 14}px)` }}>
      <div style={{ fontFamily: fonte, fontWeight: 700, fontSize: 52, lineHeight: 1.3, textAlign: "center", textWrap: "balance" as never, textShadow: "0 3px 14px rgba(0,4,45,0.75), 0 0 2px rgba(0,4,45,0.6)" }}>
        {pg.palavras.map((p, i) => {
          const ativa = t >= p.de - 0.03 && t < p.ate + 0.04;
          const dita = t >= p.ate + 0.04;
          const k = ativa ? prender((t - (p.de - 0.03)) / 0.08) : 0;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: "inline-block",
                  padding: "0 9px",
                  margin: "0 -3px",
                  borderRadius: 14,
                  color: ativa || dita ? "#ffffff" : "rgba(255,255,255,0.58)",
                  background: ativa ? cor.royal : "transparent",
                  boxShadow: ativa ? "0 8px 22px rgba(0,4,45,0.45)" : undefined,
                  transform: `scale(${1 + 0.07 * k})`,
                }}
              >
                {p.texto}
              </span>{" "}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
