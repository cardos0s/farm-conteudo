import { readFile } from "node:fs/promises";
import path from "node:path";

// Cliente mínimo da Bot API do Telegram: envio das peças para aprovação, alertas e leitura dos botões.

const api = (metodo: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${metodo}`;
const chat = () => process.env.TELEGRAM_CHAT_ID!;

export const telegramConfigurado = () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

async function chamar<T = any>(metodo: string, corpo: Record<string, unknown> | FormData): Promise<T> {
  const ehForm = corpo instanceof FormData;
  const r = await fetch(api(metodo), {
    method: "POST",
    headers: ehForm ? undefined : { "Content-Type": "application/json" },
    body: ehForm ? corpo : JSON.stringify(corpo),
    signal: AbortSignal.timeout(metodo === "getUpdates" ? 70000 : 120000),
  });
  const j = (await r.json()) as { ok: boolean; result: T; description?: string };
  if (!j.ok) throw new Error(`Telegram ${metodo}: ${j.description}`);
  return j.result;
}

export const botoesAprovacao = (id: string) => ({
  inline_keyboard: [
    [
      { text: "✅ Aprovar", callback_data: `ok:${id}` },
      { text: "❌ Rejeitar", callback_data: `no:${id}` },
    ],
  ],
});

/** Legendas do Telegram têm limite de 1024 caracteres. */
const cortar = (s: string, n = 1000) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function enviarMensagem(texto: string, extra: Record<string, unknown> = {}) {
  if (!telegramConfigurado()) {
    console.log(`[telegram desativado] ${texto}`);
    return null;
  }
  return chamar("sendMessage", { chat_id: chat(), text: cortar(texto, 4000), ...extra });
}

export async function enviarVideo(arquivo: string, legenda: string, teclado?: object) {
  const form = new FormData();
  form.set("chat_id", chat());
  form.set("caption", cortar(legenda));
  form.set("supports_streaming", "true");
  if (teclado) form.set("reply_markup", JSON.stringify(teclado));
  form.set("video", new Blob([await readFile(arquivo)], { type: "video/mp4" }), path.basename(arquivo));
  return chamar<{ message_id: number }>("sendVideo", form);
}

export async function enviarDocumento(nome: string, conteudo: string, legenda: string, teclado?: object) {
  const form = new FormData();
  form.set("chat_id", chat());
  form.set("caption", cortar(legenda));
  if (teclado) form.set("reply_markup", JSON.stringify(teclado));
  form.set("document", new Blob([conteudo], { type: "text/html" }), nome);
  return chamar<{ message_id: number }>("sendDocument", form);
}

export async function alertar(erro: unknown, contexto: string) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  console.error(`[${contexto}]`, erro);
  try {
    await enviarMensagem(`⚠️ Fábrica de conteúdo: erro em ${contexto}\n\n${msg}`);
  } catch (e) {
    console.error("Falha ao enviar alerta para o Telegram", e);
  }
}

export interface Clique {
  callbackId: string;
  dados: string;
  mensagemId?: number;
  chatId?: number;
  texto?: string;
}

export async function receberAtualizacoes(offset: number): Promise<{ cliques: Clique[]; comandos: string[]; proximo: number }> {
  const atualizacoes = await chamar<any[]>("getUpdates", {
    offset,
    timeout: 50,
    allowed_updates: ["callback_query", "message"],
  });
  const cliques: Clique[] = [];
  const comandos: string[] = [];
  let proximo = offset;
  for (const u of atualizacoes) {
    proximo = Math.max(proximo, u.update_id + 1);
    // Só aceita comandos e cliques vindos do chat configurado.
    if (u.callback_query && String(u.callback_query.message?.chat?.id) === chat()) {
      cliques.push({
        callbackId: u.callback_query.id,
        dados: u.callback_query.data,
        mensagemId: u.callback_query.message?.message_id,
        chatId: u.callback_query.message?.chat?.id,
        texto: u.callback_query.message?.caption ?? u.callback_query.message?.text,
      });
    } else if (u.message?.text && String(u.message.chat.id) === chat()) {
      comandos.push(u.message.text.trim());
    }
  }
  return { cliques, comandos, proximo };
}

export async function responderClique(c: Clique, aviso: string, novoRodape?: string) {
  await chamar("answerCallbackQuery", { callback_query_id: c.callbackId, text: aviso });
  if (c.mensagemId && novoRodape) {
    // Remove os botões e marca o resultado na própria mensagem.
    await chamar("editMessageReplyMarkup", { chat_id: c.chatId, message_id: c.mensagemId, reply_markup: { inline_keyboard: [] } });
    await enviarMensagem(novoRodape, { reply_parameters: { message_id: c.mensagemId } });
  }
}
