import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// O Instagram busca vídeos e imagens por URL, então o arquivo precisa estar num endereço público.
// Funciona com qualquer bucket compatível com S3 (Cloudflare R2, AWS S3, Backblaze B2).

const TIPOS: Record<string, string> = { ".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

let cliente: S3Client | null = null;

function s3(): S3Client {
  cliente ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return cliente;
}

/** Se há um bucket configurado. Sem ele, só dá para postar Reels (com o login unificado). */
export const armazenamentoConfigurado = () =>
  ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"].every((k) => !!process.env[k]);

export async function enviarParaPublico(arquivo: string, pasta: string): Promise<string> {
  const { S3_BUCKET, S3_PUBLIC_URL } = process.env;
  if (!S3_BUCKET || !S3_PUBLIC_URL) throw new Error("Configure S3_BUCKET e S3_PUBLIC_URL no .env");
  const chave = `${pasta}/${path.basename(arquivo)}`;
  await s3().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: chave,
      Body: await readFile(arquivo),
      ContentType: TIPOS[path.extname(arquivo).toLowerCase()] ?? "application/octet-stream",
    }),
  );
  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${chave}`;
}
