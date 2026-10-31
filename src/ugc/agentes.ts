import { z } from "zod";
import { contextoMarca } from "../agentes";
import { pedir } from "../agentes/claude";
import type { Vertical } from "../core/vertical";
import { RoteiroUgcSchema, type Estilo } from "./formato";
import type { Persona } from "./persona";

// Redator e revisor dos vídeos UGC. A personagem é fictícia, então o roteiro pode
// apresentar e demonstrar o app, mas não pode inventar experiência pessoal nem número.

const REGRAS_PERSONAGEM = [
  "A personagem é fictícia e gerada por IA. Ela apresenta, explica e demonstra o app; não conta história pessoal como se fosse real (\"eu passei no concurso\", \"minha filha\", \"faturei\").",
  "Nenhum depoimento, resultado ou número que não esteja nos FATOS. Sem fato, sem número.",
  "Nada de prometer resultado garantido.",
  "Não imitar falas, bordões ou a identidade de criadores reais: do guia de estilo vem só a técnica (ritmo, enquadramento, legenda, cortes).",
];

export const RascunhoUgcSchema = z.object({
  titulo: z.string().describe("Título interno, até 80 caracteres"),
  roteiro: RoteiroUgcSchema,
  legenda: z.string().describe("Legenda do Instagram: gancho na 1ª linha, 3 a 6 linhas, chamada no fim, sem hashtags"),
});

export type RascunhoUgc = z.infer<typeof RascunhoUgcSchema>;

function contexto(v: Vertical, persona: Persona, estilo: Estilo): string {
  return `${contextoMarca(v)}

Neste formato, o vídeo é UGC: a personagem ${persona.nome} fala direto para a câmera, como se gravasse com o celular. A chamada final pode levar direto para o app.

PERSONAGEM
${persona.nome}. ${persona.personalidade}
Aparência (fixa): ${persona.aparencia}

Regras do formato UGC, que nunca podem ser quebradas:
${REGRAS_PERSONAGEM.map((r) => `- ${r}`).join("\n")}

GUIA DE ESTILO "${estilo.nome}" (${estilo.referencia})
${JSON.stringify(estilo, null, 1)}`;
}

function pedido(v: Vertical, briefing: string): string {
  const u = v.ugc!;
  return `BRIEFING
${briefing}

FATOS que podem ser citados (e nada além disso):
${u.fatos.length ? u.fatos.map((f) => `- ${f}`).join("\n") : "- (nenhum: não cite números)"}

TELAS do app disponíveis para blocos do tipo "tela":
${u.telas.length ? u.telas.map((t) => `- ${t.nome}: ${t.descricao}`).join("\n") : "- (nenhuma: não use blocos do tipo tela)"}`;
}

export async function escreverUgc(v: Vertical, persona: Persona, estilo: Estilo, briefing: string, correcoes?: string[]): Promise<RascunhoUgc> {
  return pedir({
    sistema: `${contexto(v, persona, estilo)}\n\nSeu papel é o de roteirista de vídeos UGC curtos.`,
    usuario: `Escreva o roteiro seguindo o guia de estilo à risca: duração, estrutura, ritmo de fala, ganchos, quando usar headline, imagens, zoom e efeitos sonoros.

Como escrever cada bloco:
- "fala" é o texto que a voz vai ler: português falado, frases curtas, sem emoji, sem abreviação, números por extenso quando soar melhor. Até 30 palavras por bloco.
- O vídeo inteiro deve ficar entre ${estilo.duracaoSeg.min} e ${estilo.duracaoSeg.max} segundos, a cerca de ${estilo.ritmo.palavrasPorMinuto} palavras por minuto.
- "visual": "persona" para a personagem na câmera (descreva enquadramento, cena e movimento de forma concreta e coerente entre os blocos: mesmo lugar e mesma roupa, salvo se o estilo trocar de cenário); "tela" para mostrar uma tela do app enquanto ela fala; "broll" para um plano de apoio sem a personagem.
- O primeiro bloco é o gancho e mostra a personagem.
- "sfx" só com nomes do guia: ${estilo.sfx.map((s) => s.nome).join(", ") || "(nenhum)"}.
${correcoes?.length ? `\nO revisor apontou estes problemas na versão anterior. Corrija todos:\n${correcoes.map((c) => `- ${c}`).join("\n")}\n` : ""}
${pedido(v, briefing)}`,
    schema: RascunhoUgcSchema,
    esforco: "high",
  });
}

const RevisaoSchema = z.object({
  aprovado: z.boolean(),
  problemas: z.array(z.string()).describe("Cada problema com a frase exata e o que está errado; vazio se aprovado"),
});

export async function revisarUgc(v: Vertical, persona: Persona, estilo: Estilo, briefing: string, r: RascunhoUgc) {
  return pedir({
    sistema: `${contexto(v, persona, estilo)}\n\nSeu papel é o de revisor. Você é rigoroso: um depoimento falso ou um número inventado custa a confiança do público e pode ser propaganda enganosa.`,
    usuario: `Confira o roteiro abaixo.

Reprove se houver qualquer um destes:
- número, resultado, recurso do app ou afirmação que não está nos FATOS, na descrição do app ou no briefing
- a personagem contando experiência pessoal como se fosse real, ou depoimento inventado
- regra da marca ou do formato UGC quebrada
- tela citada que não está na lista de telas, ou sfx fora do guia
- erro de português na fala ou na legenda
- fala difícil de ler em voz alta (sigla sem explicação, número escrito de forma que a voz vai ler errado)

Não reprove por questão de gosto.

${pedido(v, briefing)}

ROTEIRO
${JSON.stringify(r, null, 2)}`,
    schema: RevisaoSchema,
    esforco: "high",
  });
}
