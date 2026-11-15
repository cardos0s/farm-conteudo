import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// O "redator" do Flagra: recebe o que a pessoa contou (e um quadro da mídia, se houver)
// e devolve manchete, legenda e hashtags no tom de tabloide do app.

export const Legenda = z.object({
  manchete: z.string().describe("Manchete de tabloide, até 90 caracteres, sem a palavra FLAGRA (o app já mostra o selo)"),
  legenda: z.string().describe("Legenda do post em primeira pessoa de quem filmou, 1 ou 2 frases, até 180 caracteres"),
  hashtags: z.array(z.string()).describe("3 a 5 hashtags curtas, sem o #, em minúsculas e sem espaços"),
});
export type Legenda = z.infer<typeof Legenda>;

export type PedidoLegenda = {
  descricao: string;
  local?: string;
  imagem?: { tipo: "image/jpeg" | "image/png" | "image/webp"; base64: string };
};

const SISTEMA = `Você escreve os posts do Flagra, um feed vertical de momentos absurdos da vida real
(bicho onde não devia, perseguição em carrinho de golfe, gente resolvendo a vida do jeito mais inesperado).

Tom: manchete de tabloide sensacionalista, mas engraçada e carinhosa, nunca cruel.
- Português do Brasil, frases curtas, verbo forte no presente.
- Use só o que a descrição e a imagem mostram. Não invente nomes de pessoas, números exatos ou fatos.
- Nada de humilhar quem aparece no vídeo, nem piadas sobre aparência, origem ou tragédia.
- Emoji: no máximo um, só na legenda.`;

let cliente: Anthropic | null = null;
const claude = () => (cliente ??= new Anthropic());

export const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export async function gerarLegenda(pedido: PedidoLegenda): Promise<Legenda> {
  const descricao = pedido.descricao.trim().slice(0, 800);
  if (!descricao && !pedido.imagem) throw new Error("Conte o que aconteceu ou envie uma imagem");

  const texto = [
    descricao ? `O que aconteceu, nas palavras de quem filmou: ${descricao}` : "Quem filmou não escreveu nada; descreva pelo que aparece na imagem.",
    pedido.local ? `Local: ${pedido.local}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const conteudo: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (pedido.imagem) {
    conteudo.push({ type: "image", source: { type: "base64", media_type: pedido.imagem.tipo, data: pedido.imagem.base64 } });
  }
  conteudo.push({ type: "text", text: texto });

  const resposta = await claude().beta.messages.parse({
    model: MODELO,
    max_tokens: 4000,
    // Se o modelo recusar por política, a API refaz o pedido no modelo de reserva.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SISTEMA,
    messages: [{ role: "user", content: conteudo }],
    output_config: { effort: "low", format: betaZodOutputFormat(Legenda) },
  });

  if (resposta.stop_reason === "refusal") throw new Error("A IA preferiu não escrever esse post");
  if (resposta.stop_reason === "max_tokens") throw new Error("Resposta da IA cortada");
  if (!resposta.parsed_output) throw new Error("Resposta da IA fora do formato");
  const saida = resposta.parsed_output as Legenda;
  return {
    ...saida,
    hashtags: saida.hashtags.map((h) => h.replace(/^#/, "").replace(/\s+/g, "").toLowerCase()).filter(Boolean).slice(0, 5),
  };
}
