// Tempo das aulas: o vídeo final é a sequência de segmentos do EDL (scripts/aulas/montar_edl.py).
// As animações são marcadas no tempo do arquivo original: S("3229", 9.5) devolve o segundo do
// vídeo final em que aquele instante do clipe IMG_3229 aparece. Se o corte mudar, os desenhos
// continuam presos à fala.

export type Segmento = { clip: string; inF: number; outF: number; startF: number; endF: number };
export type EdlAula = { fps: number; totalF: number; segmentos: Segmento[] };

export function criarRoteiro(edl: EdlAula) {
  const FPS = edl.fps;
  const TOTAL_QUADROS = edl.totalF;
  const FIM = TOTAL_QUADROS / FPS;
  const segmentos = edl.segmentos;

  function S(clip: string, t: number): number {
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
  const pausas = segmentos.filter((s) => s.clip === "pausa").map((s) => ({ de: s.startF / FPS, ate: s.endF / FPS }));
  /** Fim (em segundos do vídeo final) do último trecho mantido de um clipe. */
  const fimDo = (clip: string) => S(clip, 1e6);

  return { FPS, TOTAL_QUADROS, FIM, segmentos, S, pausas, fimDo };
}
