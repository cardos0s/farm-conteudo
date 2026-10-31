import { z } from "zod";
import type { Coleta, Dado, Noticia } from "../coleta";
import { RoteiroSchema } from "../core/roteiro";
import type { Vertical } from "../core/vertical";
import { pedir } from "./claude";

const hoje = () => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function contextoMarca(v: Vertical): string {
  return `Você trabalha na fábrica de conteúdo do app ${v.app.nome}.
O app: ${v.app.descricao}
Nicho: ${v.nicho}
Público: ${v.publico}
Tom de voz: ${v.tom}
Newsletter gratuita da marca: "${v.newsletter.nome}" (${v.newsletter.descricao})

Regras da marca, que nunca podem ser quebradas:
${v.regras.map((r) => `- ${r}`).join("\n")}

O conteúdo existe para atrair o público para a newsletter e, por ela, para o app. Ele precisa valer por si só: informação útil e verdadeira primeiro, chamada para o app só no fim.
Hoje é ${hoje()}. Escreva em português do Brasil.`;
}

// ── Editor: escolhe as pautas do dia ───────────────────────────────

const PautasSchema = z.object({
  pautas: z.array(
    z.object({
      noticias: z.array(z.number()).describe("Índices das notícias usadas, podendo ser vazio"),
      dados: z.array(z.string()).describe("IDs dos dados usados, podendo ser vazio"),
      angulo: z.string().describe("O ângulo do vídeo em uma frase"),
      porque: z.string().describe("Por que isso interessa ao público hoje"),
    }),
  ),
});

export interface Pauta {
  noticias: Noticia[];
  dados: Dado[];
  angulo: string;
}

export async function escolherPautas(v: Vertical, coleta: Coleta, recentes: string[]): Promise<Pauta[]> {
  if (!coleta.noticias.length && !coleta.dados.length) return [];
  const lista = coleta.noticias.map((n, i) => `[${i}] ${n.fonte} · ${n.publicadaEm.slice(0, 10)} · ${n.titulo}\n${n.resumo}`).join("\n\n");
  const dados = coleta.dados.map((d) => `[${d.id}] ${d.titulo}\n${d.texto}`).join("\n\n");
  const { pautas } = await pedir({
    sistema: `${contextoMarca(v)}\n\nSeu papel é o de editor-chefe: escolher as pautas dos Reels de hoje.`,
    usuario: `Escolha exatamente ${v.volume.videosPorDia} pauta(s) para Reels de 20 a 40 segundos.

Prefira o que for novo, relevante e que renda números ou uma história clara. Dados estruturados são ótimos porque não envelhecem e podem virar gráfico, ranking ou contagem. Uma pauta pode combinar notícias e dados.
Evite repetir estes temas publicados recentemente:
${recentes.length ? recentes.map((t) => `- ${t}`).join("\n") : "(nenhum)"}

NOTÍCIAS
${lista || "(nenhuma)"}

DADOS
${dados || "(nenhum)"}`,
    schema: PautasSchema,
    esforco: "medium",
  });
  return pautas.slice(0, v.volume.videosPorDia).map((p) => ({
    noticias: p.noticias.map((i) => coleta.noticias[i]).filter(Boolean),
    dados: p.dados.map((id) => coleta.dados.find((d) => d.id === id)).filter((d): d is Dado => !!d),
    angulo: p.angulo,
  }));
}

// ── Redator: roteiro, legenda e bloco da newsletter ────────────────

const RascunhoSchema = z.object({
  titulo: z.string().describe("Título interno da peça, até 80 caracteres"),
  roteiro: RoteiroSchema,
  legenda: z.string().describe("Legenda do Instagram: gancho na 1ª linha, 3 a 6 linhas, chamada para a newsletter (link na bio), sem hashtags"),
  blocoNewsletter: z.string().describe("Parágrafo de 60 a 120 palavras para a newsletter semanal, com a fonte citada"),
});

export type Rascunho = z.infer<typeof RascunhoSchema>;

export function materialDaPauta(p: Pauta, textos: Record<string, string>): string {
  const n = p.noticias
    .map((x) => `NOTÍCIA · ${x.fonte} · ${x.url}\n${x.titulo}\n${textos[x.url] || x.resumo}`)
    .join("\n\n");
  const d = p.dados.map((x) => `DADO · ${x.fonte}\n${x.titulo}\n${x.texto}`).join("\n\n");
  return [n, d].filter(Boolean).join("\n\n");
}

export async function escreverPeca(v: Vertical, p: Pauta, material: string, correcoes?: string[]): Promise<Rascunho> {
  return pedir({
    sistema: `${contextoMarca(v)}\n\nSeu papel é o de redator e roteirista de Reels com motion graphics.`,
    usuario: `Ângulo: ${p.angulo}

Escreva o roteiro do Reel em cenas. Tipos de cena disponíveis:
- abertura: gancho forte (sempre a primeira)
- noticia: título + até 2 frases, com a fonte
- grafico: barras com 2 a 8 valores numéricos de mesma unidade
- ranking: 3 a 5 itens em ordem
- contagem: número grande de dias até um evento
- encerramento: chamada curta para a newsletter "${v.newsletter.nome}" ou para o ${v.app.nome} (sempre a última)

Use de 4 a 7 cenas e 20 a 40 segundos no total. Textos curtos: a pessoa lê no celular, sem som.
Use só fatos e números que estão no material abaixo. Se o material não tiver um número, não invente; troque o tipo de cena.
${correcoes?.length ? `\nO revisor apontou estes problemas na versão anterior. Corrija todos:\n${correcoes.map((c) => `- ${c}`).join("\n")}\n` : ""}
MATERIAL
${material}`,
    schema: RascunhoSchema,
    esforco: "high",
  });
}

// ── Revisor: confere cada afirmação contra o material ──────────────

const RevisaoSchema = z.object({
  aprovado: z.boolean(),
  problemas: z.array(z.string()).describe("Cada problema com a frase exata e o que está errado; vazio se aprovado"),
});

export async function revisar(v: Vertical, material: string, r: Rascunho): Promise<z.infer<typeof RevisaoSchema>> {
  return pedir({
    sistema: `${contextoMarca(v)}\n\nSeu papel é o de revisor e checador de fatos. Você é rigoroso: um erro publicado custa a confiança do público.`,
    usuario: `Confira a peça abaixo contra o material de origem.

Reprove se houver qualquer um destes:
- número, nome, data ou afirmação que não está no material ou que o contradiz
- rumor apresentado como fato
- regra da marca quebrada
- erro de português
- roteiro que começa sem abertura ou termina sem encerramento

Não reprove por questão de gosto ou estilo.

MATERIAL
${material}

PEÇA
${JSON.stringify(r, null, 2)}`,
    schema: RevisaoSchema,
    esforco: "high",
  });
}

// ── Newsletter semanal ─────────────────────────────────────────────

const EdicaoSchema = z.object({
  assunto: z.string().describe("Assunto do e-mail, até 60 caracteres"),
  subtitulo: z.string().describe("Pré-cabeçalho, até 100 caracteres"),
  abertura: z.string().describe("Parágrafo de abertura, 40 a 80 palavras"),
  secoes: z.array(z.object({ titulo: z.string(), texto: z.string(), fonteUrl: z.string() })),
  blocoApp: z.string().describe("Parágrafo apresentando o app de forma útil, sem exagero, 40 a 70 palavras"),
  despedida: z.string(),
});

export type Edicao = z.infer<typeof EdicaoSchema>;

export async function escreverNewsletter(
  v: Vertical,
  blocos: { titulo: string; texto: string; fonteUrl: string }[],
): Promise<Edicao> {
  return pedir({
    sistema: `${contextoMarca(v)}\n\nSeu papel é o de editor da newsletter semanal "${v.newsletter.nome}".`,
    usuario: `Monte a edição desta semana a partir dos blocos já revisados abaixo. Reordene do mais importante ao menos importante, melhore a transição entre eles e mantenha os fatos exatamente como estão. Não acrescente informação nova.

${blocos.map((b, i) => `BLOCO ${i + 1}: ${b.titulo}\nFonte: ${b.fonteUrl}\n${b.texto}`).join("\n\n")}`,
    schema: EdicaoSchema,
    esforco: "high",
  });
}

