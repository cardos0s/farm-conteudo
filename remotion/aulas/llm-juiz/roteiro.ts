import tempos from "./narracao/tempos.json";

// A lousa desta aula segue a narração (narracao/tempos.json).
// - Antes da gravação, tempos.json vem de scripts/aulas/narrar.py (voz sintética só para medir o tempo).
// - Depois da gravação, vem de scripts/aulas/alinhar.py (o áudio real alinhado com o Whisper, palavra por palavra).
// F("g2") é o segundo em que a fala g2 começa; F("g2", 0.5), a metade dela; W("g2", "ligação"),
// o instante em que a palavra é dita. Os desenhos ficam presos às falas, não ao relógio.

type Fala = { de: number; ate: number; texto: string; palavras?: [string, number][] };
const falas = tempos.falas as Record<string, Fala>;

export const FPS = 30;
export const FIM: number = tempos.total;
export const TOTAL_QUADROS = Math.ceil(FIM * FPS);

function fala(id: string): Fala {
  const f = falas[id];
  if (!f) throw new Error(`Fala desconhecida: ${id}`);
  return f;
}

export function F(id: string, frac = 0): number {
  const f = fala(id);
  return f.de + (f.ate - f.de) * frac;
}

export const FIM_DE = (id: string) => fala(id).ate;

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9% ]/g, " ")
    .trim();

export function W(id: string, palavra: string): number {
  const f = fala(id);
  const i = f.texto.toLowerCase().indexOf(palavra.toLowerCase());
  if (i < 0) throw new Error(`"${palavra}" não está na fala ${id}`);
  // com o áudio alinhado: o instante real da palavra (a ocorrência que corresponde à posição no texto)
  if (f.palavras?.length) {
    const alvo = normalizar(palavra).split(/\s+/)[0];
    const antes = normalizar(f.texto.slice(0, i)).split(/\s+/).filter(Boolean).length;
    const achadas = f.palavras.map(([p, t], k) => ({ p, t, k })).filter((x) => x.p === alvo);
    if (achadas.length) {
      const melhor = achadas.reduce((a, b) => (Math.abs(b.k - antes) < Math.abs(a.k - antes) ? b : a));
      return Math.max(f.de, melhor.t - 0.08);
    }
  }
  // sem alinhamento: proporcional à posição da palavra no texto, um pouco antes dela
  return Math.max(f.de, f.de + (f.ate - f.de) * (i / f.texto.length) - 0.12);
}
