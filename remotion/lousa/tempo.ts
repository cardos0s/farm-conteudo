import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

// Os elementos da lousa usam segundos do vídeo final (tempo absoluto), não quadros.

export function useT(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
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
