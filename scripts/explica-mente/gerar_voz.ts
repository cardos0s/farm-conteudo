import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as tenis from "../../remotion/explica-mente/roteiro";
import * as tarefa from "../../remotion/explica-mente/tarefa/roteiro";

// Gera a voz de cada fala no ElevenLabs (um mp3 por fala, na ordem do roteiro).
// Precisa de ELEVENLABS_API_KEY. Não refaz os arquivos que já existem: apague um mp3 para gerar de novo.
// Uso: npx tsx scripts/explica-mente/gerar_voz.ts [tenis|tarefa] [id-da-voz] [velocidade]

const nome = process.argv[2] ?? "tarefa";
const roteiro = { tenis, tarefa }[nome];
if (!roteiro) throw new Error(`Vídeo desconhecido: "${nome}". Opções: tenis, tarefa`);
const voz = process.argv[3] ?? "ORgG8rwdAiMYRug8RJwR"; // Ana Alice (pt-BR)
const velocidade = Number(process.argv[4] ?? 1.08);
const chave = process.env.ELEVENLABS_API_KEY;
if (!chave) throw new Error("Falta ELEVENLABS_API_KEY no ambiente");

const pasta = `saida/explica-mente/${nome}/vozes`;
await mkdir(pasta, { recursive: true });
const falas = roteiro.FALAS;
for (let i = 0; i < falas.length; i++) {
  const arquivo = path.join(pasta, `${String(i + 1).padStart(2, "0")}.mp3`);
  if (existsSync(arquivo)) continue;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": chave, "content-type": "application/json" },
    body: JSON.stringify({
      text: falas[i].texto,
      model_id: "eleven_multilingual_v2",
      language_code: undefined,
      previous_text: falas[i - 1]?.texto,
      next_text: falas[i + 1]?.texto,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, speed: velocidade },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  await writeFile(arquivo, Buffer.from(await r.arrayBuffer()));
  console.log(arquivo);
}
