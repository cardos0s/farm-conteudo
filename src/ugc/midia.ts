import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

export const FFMPEG = process.env.FFMPEG || "ffmpeg";
export const FFPROBE = process.env.FFPROBE || "ffprobe";

export async function rodar(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    return await exec(cmd, args, { maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    const err = e as Error & { stderr?: string };
    throw new Error(`${cmd} falhou: ${(err.stderr || err.message).slice(-800)}`);
  }
}

export async function duracaoMidia(arquivo: string): Promise<number> {
  const { stdout } = await rodar(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", arquivo]);
  const d = Number(stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`Não consegui ler a duração de ${arquivo}`);
  return d;
}

/** Normaliza o volume para o padrão das redes (-14 LUFS) sem tocar no vídeo. */
export async function normalizarAudio(entrada: string, saida: string) {
  await rodar(FFMPEG, ["-y", "-i", entrada, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", saida]);
}

export const existe = (arquivo: string) =>
  access(arquivo).then(
    () => true,
    () => false,
  );

/** Chave curta e estável para o cache: o mesmo pedido não é pago duas vezes. */
export const hash = (...partes: unknown[]) => createHash("sha256").update(JSON.stringify(partes)).digest("hex").slice(0, 16);

export const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function tipoMime(arquivo: string): string {
  const ext = arquivo.split(".").pop()?.toLowerCase();
  return (
    { mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" }[ext ?? ""] ??
    "application/octet-stream"
  );
}
