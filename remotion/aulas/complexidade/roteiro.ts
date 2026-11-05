import edl from "./edicao/edl.json";

// O vídeo final é a sequência de segmentos do EDL (gerado por scripts/aulas/montar_edl.py).
// As animações são marcadas em tempo do arquivo original: S("3229", 9.5) devolve o segundo
// do vídeo final em que aquele instante do clipe IMG_3229 aparece. Assim, se o corte mudar,
// os desenhos continuam presos à fala.

export type Segmento = { clip: string; inF: number; outF: number; startF: number; endF: number };

export const FPS: number = edl.fps;
export const TOTAL_QUADROS: number = edl.totalF;
export const FIM = TOTAL_QUADROS / FPS;
export const segmentos = edl.segmentos as Segmento[];

export function S(clip: string, t: number): number {
  const f = t * FPS;
  const doClipe = segmentos.filter((s) => s.clip === clip);
  if (!doClipe.length) throw new Error(`Clipe fora do corte: ${clip}`);
  for (const s of doClipe) {
    if (f < s.inF) return s.startF / FPS; // instante removido: usa o próximo trecho mantido
    if (f < s.outF) return (s.startF + (f - s.inF)) / FPS;
  }
  return doClipe[doClipe.length - 1].endF / FPS;
}

/** Respiros entre capítulos (tom de sala), na ordem do vídeo. */
export const pausas = segmentos
  .filter((s) => s.clip === "pausa")
  .map((s) => ({ de: s.startF / FPS, ate: s.endF / FPS }));

/** Fim (em segundos do vídeo final) do último trecho mantido de um clipe. */
export const fimDo = (clip: string) => S(clip, 1e6);
