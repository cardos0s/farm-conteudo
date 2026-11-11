import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { FUNDO_LOUSA, PONTO_GRADE } from "./paleta";
import { lerp, progresso, suave } from "./tempo";

// Lousa infinita: as cenas ficam em "páginas" espalhadas num canvas grande e a câmera
// desliza (e dá um leve zoom out) de uma página para outra, como rolar o canvas do Excalidraw.

export const LARGURA = 1920;
export const ALTURA = 1080;

export type Pagina = { x: number; y: number; w: number; h: number };
export type Vista = { tx: number; ty: number; z: number };
/** Tamanho da tela em que a lousa é desenhada (as aulas usam 1920x1080; os Reels, 1080x1920). */
export type Tela = { w: number; h: number };
const TELA_PADRAO: Tela = { w: LARGURA, h: ALTURA };
/**
 * Página na tela cheia, na metade direita (tela dividida com a câmera), a visão geral
 * ou uma vista pronta (`vista`). `dur` muda a duração da troca.
 */
export type Enquadre = { t: number; pagina?: Pagina; metade?: boolean; geral?: Pagina[]; vista?: Vista; dur?: number };

/** Vista que encaixa a região `r` do canvas dentro do retângulo `alvo` da tela (com zoom). */
export function enquadrar(r: Pagina, alvo: Pagina): Vista {
  const z = Math.min(alvo.w / r.w, alvo.h / r.h);
  return { z, tx: alvo.x + (alvo.w - r.w * z) / 2 - r.x * z, ty: alvo.y + (alvo.h - r.h * z) / 2 - r.y * z };
}

export function vistaDe(e: Enquadre, tela: Tela = TELA_PADRAO): Vista {
  if (e.vista) return e.vista;
  const LARGURA = tela.w;
  const ALTURA = tela.h;
  if (e.geral) {
    const x0 = Math.min(...e.geral.map((p) => p.x));
    const y0 = Math.min(...e.geral.map((p) => p.y));
    const x1 = Math.max(...e.geral.map((p) => p.x + p.w));
    const y1 = Math.max(...e.geral.map((p) => p.y + p.h));
    const z = Math.min((LARGURA * 0.9) / (x1 - x0), (ALTURA * 0.82) / (y1 - y0));
    return { z, tx: LARGURA / 2 - ((x0 + x1) / 2) * z, ty: ALTURA * 0.53 - ((y0 + y1) / 2) * z };
  }
  const p = e.pagina!;
  return { z: 1, tx: (e.metade ? LARGURA / 2 : 0) - p.x, ty: -p.y };
}

/** Vista da câmera da lousa no tempo t. A troca de página dura ~1 s, centrada um pouco antes de `t`. */
const centro = (v: Vista, tela: Tela) => ({ x: (tela.w / 2 - v.tx) / v.z, y: (tela.h / 2 - v.ty) / v.z });

export function vistaEm(t: number, quadros: Enquadre[], tela: Tela = TELA_PADRAO): Vista {
  let atual = vistaDe(quadros[0], tela);
  for (let i = 1; i < quadros.length; i++) {
    const q = quadros[i];
    const dur = q.dur ?? (q.geral ? 1.6 : 1.0);
    const ini = q.t - (q.geral ? 0 : 0.6);
    if (t < ini) break;
    const alvo = vistaDe(q, tela);
    const p = progresso(t, ini, dur, suave);
    if (p >= 1) {
      atual = alvo;
      continue;
    }
    // interpola o ponto do canvas no centro da tela e o zoom (em escala log)
    const c0 = centro(atual, tela);
    const c1 = centro(alvo, tela);
    const distancia = Math.hypot(c1.x - c0.x, c1.y - c0.y);
    // em deslocamentos longos, um leve zoom out no meio do caminho ajuda a se localizar
    const bojo = q.geral ? 0 : Math.min(0.3, distancia / 9000) * Math.sin(Math.PI * p);
    const z = Math.exp(lerp(Math.log(atual.z), Math.log(alvo.z), p)) * (1 - bojo);
    const cx = lerp(c0.x, c1.x, p);
    const cy = lerp(c0.y, c1.y, p);
    return { z, tx: tela.w / 2 - cx * z, ty: tela.h / 2 - cy * z };
  }
  return atual;
}

const VistaContexto = createContext<Vista>({ tx: 0, ty: 0, z: 1 });
const TelaContexto = createContext<Tela>(TELA_PADRAO);

/** Agrupa os elementos de uma página; não renderiza nada se a página estiver fora da tela. */
export function NaPagina({ p, children }: { p: Pagina; children: React.ReactNode }) {
  const v = useContext(VistaContexto);
  const { w: LARGURA, h: ALTURA } = useContext(TelaContexto);
  const sx0 = p.x * v.z + v.tx;
  const sy0 = p.y * v.z + v.ty;
  const fora = sx0 > LARGURA + 40 || sy0 > ALTURA + 40 || sx0 + p.w * v.z < -40 || sy0 + p.h * v.z < -40;
  if (fora) return null;
  return <g transform={`translate(${p.x} ${p.y})`}>{children}</g>;
}

export function Lousa({ vista, children, tela = TELA_PADRAO }: { vista: Vista; children: React.ReactNode; tela?: Tela }) {
  const { w: LARGURA, h: ALTURA } = tela;
  const passo = 34 * vista.z;
  const alfaGrade = Math.min(1, Math.max(0, (vista.z - 0.35) / 0.4));
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      {alfaGrade > 0 && (
        // grade de pontos como fundo CSS (o navegador desenha em ladrilhos, bem mais barato que um <pattern>)
        <AbsoluteFill
          style={{
            opacity: alfaGrade,
            backgroundImage: `radial-gradient(circle, ${PONTO_GRADE} 1.6px, transparent 1.9px)`,
            backgroundSize: `${passo}px ${passo}px`,
            backgroundPosition: `${vista.tx % passo}px ${vista.ty % passo}px`,
          }}
        />
      )}
      <svg width={LARGURA} height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${vista.tx} ${vista.ty}) scale(${vista.z})`}>
          <TelaContexto.Provider value={tela}>
            <VistaContexto.Provider value={vista}>{children}</VistaContexto.Provider>
          </TelaContexto.Provider>
        </g>
      </svg>
    </AbsoluteFill>
  );
}
