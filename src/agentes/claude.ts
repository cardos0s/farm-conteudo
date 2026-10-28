import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

let cliente: Anthropic | null = null;
const claude = () => (cliente ??= new Anthropic());

export const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

type Esforco = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * Uma chamada ao Claude com saída estruturada e validada pelo schema Zod.
 * Se o modelo recusar por política, a API refaz a chamada no modelo de reserva (`fallbacks: "default"`).
 */
export async function pedir<S extends z.ZodType>(opcoes: {
  sistema: string;
  usuario: string;
  schema: S;
  esforco?: Esforco;
}): Promise<z.infer<S>> {
  const resposta = await claude().beta.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opcoes.sistema,
    messages: [{ role: "user", content: opcoes.usuario }],
    output_config: { effort: opcoes.esforco ?? "high", format: betaZodOutputFormat(opcoes.schema) },
  });
  if (resposta.stop_reason === "refusal") {
    throw new Error(`Claude recusou o pedido (${resposta.stop_details?.category ?? "sem categoria"})`);
  }
  if (resposta.stop_reason === "max_tokens") throw new Error("Resposta do Claude cortada por max_tokens");
  if (!resposta.parsed_output) throw new Error("Resposta do Claude fora do formato esperado");
  return resposta.parsed_output as z.infer<S>;
}
