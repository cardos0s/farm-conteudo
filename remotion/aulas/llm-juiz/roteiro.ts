import tempos from "./narracao/tempos.json";

// A lousa desta aula segue a narração (narracao/tempos.json, gerado por scripts/aulas/narrar.py).
// F("g2") é o segundo em que a fala g2 começa; F("g2", 0.5), a metade dela; W("g2", "ligação"),
// o instante aproximado em que a palavra é dita (proporcional à posição do texto na fala).
// Se a narração for regravada, os desenhos continuam presos às falas.

type Fala = { de: number; ate: number; texto: string };
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

export function W(id: string, palavra: string): number {
  const f = fala(id);
  const i = f.texto.toLowerCase().indexOf(palavra.toLowerCase());
  if (i < 0) throw new Error(`"${palavra}" não está na fala ${id}`);
  // um pouco antes da palavra: o desenho começa enquanto ela é dita
  return Math.max(f.de, f.de + (f.ate - f.de) * (i / f.texto.length) - 0.12);
}
