import { readFile, writeFile } from "node:fs/promises";
import { enviarParaPublico } from "../publicacao/armazenamento";
import { esperar, tipoMime } from "./midia";

// Clientes mínimos das APIs de geração. Cada função grava o resultado em `destino`;
// o cache (não pagar duas vezes pela mesma coisa) fica em produzir.ts.

async function json<T = any>(r: Response, quem: string): Promise<T> {
  const texto = await r.text();
  if (!r.ok) throw new Error(`${quem} ${r.status}: ${texto.slice(0, 500)}`);
  return JSON.parse(texto) as T;
}

async function baixar(url: string, destino: string, headers: Record<string, string> = {}) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(300_000) });
  if (!r.ok) throw new Error(`Download ${r.status}: ${url}`);
  await writeFile(destino, Buffer.from(await r.arrayBuffer()));
}

const dataUrl = async (arquivo: string) => `data:${tipoMime(arquivo)};base64,${(await readFile(arquivo)).toString("base64")}`;

// ── ElevenLabs: voz e efeitos sonoros ──────────────────────────────

const ELEVEN = "https://api.elevenlabs.io/v1";
const chaveEleven = () => {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("Configure ELEVENLABS_API_KEY no .env");
  return k;
};

export interface Alinhamento {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ConfigVoz {
  vozId: string;
  /** stability, similarity_boost, style, speed... repassados como estão. */
  ajustes?: Record<string, number | boolean>;
}

/** Narração com o tempo de cada caractere, que vira a legenda palavra a palavra. */
export async function falar(texto: string, voz: ConfigVoz, destino: string): Promise<Alinhamento | null> {
  const r = await fetch(`${ELEVEN}/text-to-speech/${voz.vozId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": chaveEleven(), "Content-Type": "application/json" },
    body: JSON.stringify({
      text: texto,
      model_id: process.env.ELEVENLABS_MODELO || "eleven_v4",
      language_code: "pt",
      ...(voz.ajustes ? { voice_settings: voz.ajustes } : {}),
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const j = await json<{ audio_base64: string; alignment?: Alinhamento | null; normalized_alignment?: Alinhamento | null }>(r, "ElevenLabs TTS");
  await writeFile(destino, Buffer.from(j.audio_base64, "base64"));
  return j.alignment ?? j.normalized_alignment ?? null;
}

export async function gerarSfx(descricao: string, destino: string, duracaoSeg = 1.2) {
  const r = await fetch(`${ELEVEN}/sound-generation`, {
    method: "POST",
    headers: { "xi-api-key": chaveEleven(), "Content-Type": "application/json" },
    body: JSON.stringify({ text: descricao, duration_seconds: duracaoSeg, prompt_influence: 0.6 }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) throw new Error(`ElevenLabs SFX ${r.status}: ${(await r.text()).slice(0, 300)}`);
  await writeFile(destino, Buffer.from(await r.arrayBuffer()));
}

/** Transcrição com tempo por palavra (usada na decupagem). */
export async function transcrever(arquivo: string): Promise<{ text: string; words: { text: string; start: number; end: number; type?: string }[] }> {
  const form = new FormData();
  form.set("model_id", process.env.ELEVENLABS_STT_MODELO || "scribe_v1");
  form.set("timestamps_granularity", "word");
  form.set("file", new Blob([await readFile(arquivo)], { type: tipoMime(arquivo) }), arquivo.split("/").pop());
  const r = await fetch(`${ELEVEN}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": chaveEleven() },
    body: form,
    signal: AbortSignal.timeout(300_000),
  });
  return json(r, "ElevenLabs STT");
}

// ── OpenRouter: imagem (quadro inicial) e vídeo (Kling) ─────────────

const OPENROUTER = "https://openrouter.ai/api/v1";
const cabecalhoOpenRouter = () => {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error("Configure OPENROUTER_API_KEY no .env");
  return { Authorization: `Bearer ${k}`, "Content-Type": "application/json" };
};

/**
 * Gera uma imagem 9:16 a partir de um texto e de imagens de referência (a folha da personagem).
 * Usa um modelo de imagem pelo endpoint de chat do OpenRouter.
 */
export async function gerarImagem(prompt: string, referencias: string[], destino: string) {
  const conteudo = [
    { type: "text", text: prompt },
    ...(await Promise.all(referencias.map(async (r) => ({ type: "image_url", image_url: { url: await dataUrl(r) } })))),
  ];
  const r = await fetch(`${OPENROUTER}/chat/completions`, {
    method: "POST",
    headers: cabecalhoOpenRouter(),
    body: JSON.stringify({
      model: process.env.OPENROUTER_IMAGEM_MODELO || "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "9:16" },
      messages: [{ role: "user", content: conteudo }],
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const j = await json<any>(r, "OpenRouter imagem");
  const url: string | undefined = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error(`OpenRouter não devolveu imagem: ${JSON.stringify(j).slice(0, 300)}`);
  if (url.startsWith("data:")) await writeFile(destino, Buffer.from(url.split(",")[1], "base64"));
  else await baixar(url, destino);
}

/** Kling (ou outro modelo de vídeo) pelo OpenRouter, a partir do quadro inicial. Gera, espera e baixa. */
export async function gerarVideo(opcoes: { prompt: string; quadroInicial: string; duracaoSeg: number; destino: string }) {
  const r = await fetch(`${OPENROUTER}/videos`, {
    method: "POST",
    headers: cabecalhoOpenRouter(),
    body: JSON.stringify({
      model: process.env.OPENROUTER_VIDEO_MODELO || "kwaivgi/kling-v3.0-std",
      prompt: opcoes.prompt,
      duration: opcoes.duracaoSeg,
      aspect_ratio: "9:16",
      resolution: process.env.OPENROUTER_VIDEO_RESOLUCAO || "1080p",
      frame_images: [{ type: "image_url", image_url: { url: await dataUrl(opcoes.quadroInicial) }, frame_type: "first_frame" }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const job = await json<{ id: string; polling_url?: string; status: string }>(r, "OpenRouter vídeo");
  const status = new URL(job.polling_url || `/api/v1/videos/${job.id}`, "https://openrouter.ai").toString();

  const limite = Date.now() + 30 * 60_000;
  for (let estado = job.status; ; ) {
    if (estado === "completed") break;
    if (["failed", "cancelled", "expired"].includes(estado)) throw new Error(`Vídeo ${job.id} terminou como ${estado}`);
    if (Date.now() > limite) throw new Error(`Vídeo ${job.id} passou de 30 minutos`);
    await esperar(15_000);
    const s = await json<{ status: string; error?: string }>(await fetch(status, { headers: cabecalhoOpenRouter() }), "OpenRouter status");
    estado = s.status;
    if (s.error && estado === "failed") throw new Error(`Vídeo ${job.id}: ${s.error}`);
  }
  await baixar(`${OPENROUTER}/videos/${job.id}/content`, opcoes.destino, { Authorization: cabecalhoOpenRouter().Authorization });
}

// ── fal.ai: sincronia labial ───────────────────────────────────────

export const lipsyncConfigurado = () => !!process.env.FAL_KEY;

/** Faz a boca do vídeo acompanhar o áudio. Vídeo e áudio sobem para o bucket público para a fal buscar. */
export async function sincronizarLabios(video: string, audio: string, destino: string, pasta: string) {
  const [videoUrl, audioUrl] = await Promise.all([enviarParaPublico(video, pasta), enviarParaPublico(audio, pasta)]);
  const modelo = process.env.FAL_LIPSYNC_MODELO || "fal-ai/kling-video/lipsync/audio-to-video";
  const cabecalho = { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
  const r = await fetch(`https://queue.fal.run/${modelo}`, {
    method: "POST",
    headers: cabecalho,
    body: JSON.stringify({ video_url: videoUrl, audio_url: audioUrl }),
  });
  const job = await json<{ status_url: string; response_url: string }>(r, "fal lipsync");
  const limite = Date.now() + 20 * 60_000;
  for (;;) {
    const s = await json<{ status: string }>(await fetch(job.status_url, { headers: cabecalho }), "fal status");
    if (s.status === "COMPLETED") break;
    if (Date.now() > limite) throw new Error("Lipsync passou de 20 minutos");
    await esperar(10_000);
  }
  const res = await json<{ video?: { url: string } }>(await fetch(job.response_url, { headers: cabecalho }), "fal resultado");
  if (!res.video?.url) throw new Error(`fal não devolveu vídeo: ${JSON.stringify(res).slice(0, 300)}`);
  await baixar(res.video.url, destino);
}
