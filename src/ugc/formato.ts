import { z } from "zod";
import { FPS, type Marca } from "../core/roteiro";

// Formatos do vídeo UGC: o guia de estilo (saída da skill de decupagem), o roteiro que o
// redator escreve e as props que o Remotion recebe. Importado pelos dois lados: sem Node aqui.

// ── Guia de estilo ─────────────────────────────────────────────────

export const FONTES_UGC = ["Poppins", "Inter", "Archivo Black", "Roboto Slab"] as const;

const Texto = z.object({
  fonte: z.enum(FONTES_UGC),
  tamanho: z.number().describe("Em px, num quadro de 1080x1920"),
  cor: z.string(),
  /** Cor da palavra falada no momento (legendas) ou do fundo (headline). */
  destaque: z.string(),
  contorno: z.boolean(),
  caixaAlta: z.boolean(),
  posicao: z.enum(["superior", "centro", "inferior"]),
});

export const EstiloSchema = z.object({
  nome: z.string(),
  referencia: z.string().describe("De onde o estilo foi tirado: perfil e quantos vídeos foram decupados"),
  resumo: z.string().describe("O formato em 3 a 5 frases"),
  duracaoSeg: z.object({ min: z.number(), max: z.number() }),
  ritmo: z.object({
    tomadaMediaSeg: z.number().describe("Duração média de cada tomada entre cortes"),
    palavrasPorMinuto: z.number(),
    pausas: z.string().describe("Se corta respiros e silêncios, e quanto"),
  }),
  gancho: z.object({
    padroes: z.array(z.string()).describe("Como os primeiros 2 segundos prendem, um padrão por item"),
    visual: z.string().describe("O que aparece na tela no primeiro quadro"),
  }),
  estrutura: z.array(z.string()).describe("Os blocos do vídeo em ordem, com o papel de cada um"),
  camera: z.object({
    enquadramentos: z.array(z.string()),
    movimento: z.string(),
    ambiente: z.string(),
    luz: z.string(),
  }),
  fala: z.string().describe("Como fala: registro, energia, vícios de linguagem do formato (não frases da criadora)"),
  legendas: Texto.extend({
    usa: z.boolean(),
    modo: z.enum(["palavra", "frase"]).describe("palavra = karaokê, uma ou poucas palavras por vez"),
    palavrasPorVez: z.number(),
  }),
  headline: Texto.extend({ usa: z.boolean(), quando: z.string() }),
  imagens: z.object({ quando: z.string(), tipos: z.array(z.string()) }),
  zoom: z.object({ usa: z.boolean(), quando: z.string(), intensidade: z.number().describe("1.0 a 1.3") }),
  sfx: z.array(
    z.object({
      nome: z.string().regex(/^[a-z0-9-]+$/),
      descricao: z.string().describe("Descrição do som, usada para gerar o efeito"),
      quando: z.string(),
      volume: z.number().describe("0 a 1"),
    }),
  ),
  cor: z.object({
    gradacao: z.string(),
    filtroCss: z.string().describe("Filtro CSS aplicado sobre as tomadas, ex.: contrast(1.05) saturate(1.1)"),
    paleta: z.array(z.string()),
  }),
  cta: z.string(),
  evitar: z.array(z.string()),
});

export type Estilo = z.infer<typeof EstiloSchema>;

// ── Roteiro UGC ────────────────────────────────────────────────────

export const VisualSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.enum(["persona"]),
    falandoParaCamera: z.boolean().describe("true = boca precisa sincronizar com a fala"),
    enquadramento: z.string().describe("Ex.: selfie de perto segurando o celular, plano médio sentada na mesa"),
    cena: z.string().describe("Onde está, o que faz, roupa e luz, em uma frase concreta"),
    movimento: z.string().describe("Movimento de câmera e gesto durante a tomada"),
  }),
  z.object({
    tipo: z.enum(["tela"]),
    tela: z.string().describe("Nome de uma das telas do app listadas no pedido"),
  }),
  z.object({
    tipo: z.enum(["broll"]),
    cena: z.string().describe("Plano de apoio sem a personagem, em uma frase concreta"),
  }),
]);

export const BlocoSchema = z.object({
  papel: z.string().describe("Papel do bloco na estrutura (gancho, contexto, demonstração, CTA...)"),
  fala: z.string().describe("O que a personagem fala neste bloco, de 4 a 30 palavras"),
  visual: VisualSchema,
  headline: z.string().nullable().describe("Texto fixo na tela, até 7 palavras, ou null"),
  sfx: z.string().nullable().describe("Nome de um efeito do guia de estilo, tocado no início do bloco, ou null"),
  zoom: z.boolean().describe("Punch-in de zoom neste bloco"),
});

export const RoteiroUgcSchema = z.object({
  blocos: z.array(BlocoSchema).describe("De 4 a 10 blocos"),
});

export type Bloco = z.infer<typeof BlocoSchema>;
export type RoteiroUgc = z.infer<typeof RoteiroUgcSchema>;

// ── Props do Remotion ──────────────────────────────────────────────

export interface Palavra {
  texto: string;
  /** Segundos desde o início do bloco. */
  inicio: number;
  fim: number;
}

export interface BlocoRender {
  /** Caminhos relativos à pasta servida durante o render. */
  video?: string;
  /** Duração real do clipe; se for menor que o bloco, ele desacelera para cobrir. */
  videoDuracaoSeg?: number;
  imagem?: string;
  audio: string;
  sfx?: string;
  sfxVolume?: number;
  duracaoSeg: number;
  palavras: Palavra[];
  headline: string | null;
  zoom: boolean;
}

export interface PropsUgc {
  marca: Marca;
  estilo: Pick<Estilo, "legendas" | "headline" | "zoom" | "cor">;
  blocos: BlocoRender[];
  /** Endereço base de onde o Remotion busca as mídias. */
  base: string;
  rotuloIa: string;
  [chave: string]: unknown;
}

/** Folga depois da fala, para o corte não comer a última sílaba. */
export const FOLGA_SEG = 0.15;

export const quadrosDoBloco = (b: Pick<BlocoRender, "duracaoSeg">) => Math.max(1, Math.round(b.duracaoSeg * FPS));

export const duracaoUgc = (blocos: Pick<BlocoRender, "duracaoSeg">[]) => blocos.reduce((t, b) => t + quadrosDoBloco(b), 0);

/** Agrupa as palavras em telas de legenda, sem atravessar pausas longas. */
export function agruparPalavras(palavras: Palavra[], porVez: number): Palavra[][] {
  const grupos: Palavra[][] = [];
  let atual: Palavra[] = [];
  for (const p of palavras) {
    const anterior = atual.at(-1);
    const pausa = anterior ? p.inicio - anterior.fim > 0.35 : false;
    if (atual.length >= Math.max(1, porVez) || pausa) {
      grupos.push(atual);
      atual = [];
    }
    atual.push(p);
  }
  if (atual.length) grupos.push(atual);
  return grupos;
}

/**
 * Converte o alinhamento por caractere do ElevenLabs em palavras com tempo.
 * Pontuação fica grudada na palavra; espaços e quebras separam.
 */
export function palavrasDoAlinhamento(a: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }): Palavra[] {
  const palavras: Palavra[] = [];
  let texto = "";
  let inicio = 0;
  let fim = 0;
  a.characters.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (texto) palavras.push({ texto, inicio, fim });
      texto = "";
      return;
    }
    if (!texto) inicio = a.character_start_times_seconds[i];
    texto += c;
    fim = a.character_end_times_seconds[i];
  });
  if (texto) palavras.push({ texto, inicio, fim });
  return palavras;
}

/** Sem alinhamento, distribui as palavras pela duração proporcionalmente ao tamanho de cada uma. */
export function palavrasEstimadas(fala: string, duracaoSeg: number): Palavra[] {
  const ps = fala.split(/\s+/).filter(Boolean);
  const total = ps.reduce((t, p) => t + p.length + 1, 0) || 1;
  let t = 0;
  return ps.map((p) => {
    const d = ((p.length + 1) / total) * duracaoSeg;
    const w = { texto: p, inicio: t, fim: t + d };
    t += d;
    return w;
  });
}
