import { z } from "zod";
import type { Marca } from "./roteiro";

// Formato do carrossel que o redator escreve e o Remotion transforma em imagens 1080x1350 (4:5).
// Assim como roteiro.ts, este arquivo é importado pelos dois lados e não pode depender de Node.

export const LARGURA_SLIDE = 1080;
export const ALTURA_SLIDE = 1350;
/** O Instagram aceita até 10 imagens por carrossel pela API. */
export const MAX_SLIDES = 10;
export const MIN_SLIDES = 3;

const fonte = z.string().nullable().describe("Veículo ou base de dados de onde veio a informação; null se não se aplica");

export const SlideSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.enum(["capa"]),
    titulo: z.string().describe("Gancho de até 10 palavras que faz a pessoa arrastar"),
    subtitulo: z.string().nullable(),
  }),
  z.object({
    tipo: z.enum(["texto"]),
    titulo: z.string().describe("Até 8 palavras"),
    texto: z.string().describe("No máximo 45 palavras"),
    fonte,
  }),
  z.object({
    tipo: z.enum(["lista"]),
    titulo: z.string().describe("Até 8 palavras"),
    itens: z.array(z.string()).describe("De 3 a 5 itens, cada um com até 12 palavras"),
    fonte,
  }),
  z.object({
    tipo: z.enum(["numero"]),
    valor: z.string().describe("O número em destaque, curto. Ex.: 11 dias, R$ 312, 42%"),
    legenda: z.string().describe("O que o número significa, até 20 palavras"),
    fonte,
  }),
  z.object({
    tipo: z.enum(["grafico"]),
    titulo: z.string(),
    unidade: z.string().describe("Ex.: R$/@, pts, h, %"),
    pontos: z.array(z.object({ rotulo: z.string(), valor: z.number() })).describe("De 2 a 8 pontos"),
    fonte,
  }),
  z.object({
    tipo: z.enum(["ranking"]),
    titulo: z.string(),
    itens: z.array(z.object({ nome: z.string(), valor: z.string() })).describe("De 3 a 5 itens, do primeiro ao último colocado"),
    fonte,
  }),
  z.object({
    tipo: z.enum(["fechamento"]),
    titulo: z.string().describe("Frase curta que amarra o carrossel, até 10 palavras"),
    cta: z.string().describe("Chamada curta para a newsletter ou o app"),
  }),
]);

export const CarrosselSchema = z.object({
  slides: z.array(SlideSchema).describe("Começa com capa, termina com fechamento, de 5 a 8 slides no total"),
});

export type Slide = z.infer<typeof SlideSchema>;
export type Carrossel = z.infer<typeof CarrosselSchema>;

export interface PropsSlide {
  marca: Marca;
  slide: Slide;
  /** Posição do slide, começando em 0. */
  indice: number;
  total: number;
  [chave: string]: unknown;
}

/** Corrige o que o modelo pode errar sem invalidar o carrossel: ordem das pontas, quantidade de slides e tamanho de listas. */
export function normalizarCarrossel(c: Carrossel): Carrossel {
  const capa = c.slides.find((s) => s.tipo === "capa");
  const fechamento = c.slides.find((s) => s.tipo === "fechamento");
  const meio = c.slides.filter((s) => s.tipo !== "capa" && s.tipo !== "fechamento");
  const slides: Slide[] = [];
  if (capa) slides.push(capa);
  for (const s of meio.slice(0, MAX_SLIDES - 2)) {
    if (s.tipo === "grafico") slides.push({ ...s, pontos: s.pontos.slice(0, 8) });
    else if (s.tipo === "ranking") slides.push({ ...s, itens: s.itens.slice(0, 5) });
    else if (s.tipo === "lista") slides.push({ ...s, itens: s.itens.slice(0, 5) });
    else slides.push(s);
  }
  if (fechamento) slides.push(fechamento);
  return { slides };
}
