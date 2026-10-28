import { z } from "zod";

// Formato do roteiro que o redator escreve e o Remotion renderiza.
// Este arquivo é importado pelos dois lados, então não pode depender de Node.

export const FPS = 30;

const base = { duracaoSeg: z.number().describe("Duração da cena em segundos, entre 2 e 8") };

export const CenaSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.enum(["abertura"]),
    chamada: z.string().describe("Gancho de até 8 palavras que prende nos 2 primeiros segundos"),
    subtitulo: z.string().nullable(),
    ...base,
  }),
  z.object({
    tipo: z.enum(["noticia"]),
    titulo: z.string(),
    texto: z.string().describe("No máximo 2 frases curtas"),
    fonte: z.string().describe("Nome do veículo ou da base de dados"),
    ...base,
  }),
  z.object({
    tipo: z.enum(["grafico"]),
    titulo: z.string(),
    unidade: z.string().describe("Ex.: R$/@, pts, h, %"),
    pontos: z.array(z.object({ rotulo: z.string(), valor: z.number() })).describe("De 2 a 8 pontos"),
    ...base,
  }),
  z.object({
    tipo: z.enum(["ranking"]),
    titulo: z.string(),
    itens: z
      .array(z.object({ nome: z.string(), valor: z.string() }))
      .describe("De 3 a 5 itens, do primeiro ao último colocado"),
    ...base,
  }),
  z.object({
    tipo: z.enum(["contagem"]),
    titulo: z.string(),
    dias: z.number().describe("Dias que faltam"),
    rotulo: z.string().describe("O que acontece no fim da contagem"),
    ...base,
  }),
  z.object({
    tipo: z.enum(["encerramento"]),
    cta: z.string().describe("Chamada curta para a newsletter ou o app"),
    ...base,
  }),
]);

export const RoteiroSchema = z.object({
  cenas: z.array(CenaSchema).describe("Começa com abertura, termina com encerramento, de 4 a 7 cenas"),
});

export type Cena = z.infer<typeof CenaSchema>;
export type Roteiro = z.infer<typeof RoteiroSchema>;

export type ElementoMarca = "zebra" | "pomodoro" | "cerca";

export interface Marca {
  nomeApp: string;
  arroba: string;
  cores: { fundo: string; superficie: string; primaria: string; secundaria: string; texto: string; suave: string };
  fonteTitulo: string;
  fonteTexto: string;
  elemento: ElementoMarca;
}

export interface PropsReel {
  marca: Marca;
  roteiro: Roteiro;
  [chave: string]: unknown;
}

export const limitarDuracao = (s: number) => Math.min(8, Math.max(2, s));

export function quadrosDaCena(c: Cena): number {
  return Math.round(limitarDuracao(c.duracaoSeg) * FPS);
}

export function duracaoTotal(r: Roteiro): number {
  return r.cenas.reduce((t, c) => t + quadrosDaCena(c), 0);
}

/** Corrige o que o modelo pode errar sem invalidar o roteiro: ordem das pontas e tamanho de listas. */
export function normalizarRoteiro(r: Roteiro): Roteiro {
  const meio = r.cenas.filter((c) => c.tipo !== "abertura" && c.tipo !== "encerramento");
  const abertura = r.cenas.find((c) => c.tipo === "abertura");
  const encerramento = r.cenas.find((c) => c.tipo === "encerramento");
  const cenas: Cena[] = [];
  if (abertura) cenas.push(abertura);
  for (const c of meio.slice(0, 5)) {
    if (c.tipo === "grafico") cenas.push({ ...c, pontos: c.pontos.slice(0, 8) });
    else if (c.tipo === "ranking") cenas.push({ ...c, itens: c.itens.slice(0, 5) });
    else cenas.push(c);
  }
  if (encerramento) cenas.push(encerramento);
  return { cenas: cenas.map((c) => ({ ...c, duracaoSeg: limitarDuracao(c.duracaoSeg) })) };
}
