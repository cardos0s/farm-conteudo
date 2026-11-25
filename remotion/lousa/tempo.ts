import { createContext, createElement, useContext, type ReactNode } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

// Os elementos da lousa usam segundos do vídeo final (tempo absoluto), não quadros.
// Um MapaDeTempo pode remapear esse tempo (ex.: para as animações seguirem uma narração gravada
// depois): os desenhos continuam marcados no tempo "de projeto" e o mapa diz qual instante de
// projeto aparece em cada segundo do vídeo.

const MapaContexto = createContext<((t: number) => number) | null>(null);

export function MapaDeTempo({ mapa, children }: { mapa: (t: number) => number; children: ReactNode }) {
  return createElement(MapaContexto.Provider, { value: mapa }, children);
}

export function useT(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mapa = useContext(MapaContexto);
  return mapa ? mapa(frame / fps) : frame / fps;
}

export const suave = Easing.bezier(0.45, 0, 0.25, 1);

/** Progresso 0..1 de uma animação que começa em `de` e dura `dur` segundos. */
export function progresso(t: number, de: number, dur: number, curva: (x: number) => number = suave): number {
  if (dur <= 0) return t >= de ? 1 : 0;
  const x = Math.min(1, Math.max(0, (t - de) / dur));
  return curva(x);
}

/** Opacidade de saída: 1 até `ate`, some em `dur` segundos. */
export function saida(t: number, ate: number | undefined, dur = 0.35): number {
  if (ate === undefined) return 1;
  return 1 - progresso(t, ate, dur);
}

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
