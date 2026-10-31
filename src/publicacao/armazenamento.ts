import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { tipoMime } from "../ugc/midia";

// O Instagram busca o vídeo por URL, então o MP4 precisa estar num endereço público.
// O mesmo bucket serve áudio e vídeo para a sincronia labial dos vídeos UGC.
// Funciona com qualquer bucket compatível com S3 (Cloudflare R2, AWS S3, Backblaze B2).

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

export async function enviarParaPublico(arquivo: string, pasta: string): Promise<string> {
  const { S3_BUCKET, S3_PUBLIC_URL } = process.env;
  if (!S3_BUCKET || !S3_PUBLIC_URL) throw new Error("Configure S3_BUCKET e S3_PUBLIC_URL no .env");
  const chave = `${pasta}/${path.basename(arquivo)}`;
  await s3().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: chave,
      Body: await readFile(arquivo),
      ContentType: tipoMime(arquivo),
    }),
  );
  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${chave}`;
}
