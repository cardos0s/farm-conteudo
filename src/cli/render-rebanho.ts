import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Renderiza um Reel animado do Rebanho (1080x1920, com narração e trilha).
// A voz fica em public/rebanho/<video>/ (scripts/rebanho/narrar.py) e os sons em .../sons/ (scripts/rebanho/trilha.py).
// Uso: npm run render:pesagem | npm run render:confinamento   (ou: tsx src/cli/render-rebanho.ts <video> [saida.mp4])

const REELS: Record<string, { id: string; arquivo: string }> = {
  pesagem: { id: "ReelPesagem", arquivo: "reel-pesagem-sem-balanca.mp4" },
  confinamento: { id: "ReelConfinamento", arquivo: "reel-confinamento-por-dentro.mp4" },
};
const nome = process.argv[2] ?? "pesagem";
const reel = REELS[nome];
if (!reel) throw new Error(`Reel desconhecido: "${nome}". Opções: ${Object.keys(REELS).join(", ")}`);
const destino = process.argv[3] ?? `saida/rebanho/${reel.arquivo}`;
const navegador = process.env.REMOTION_CHROME || null;

await mkdir(path.dirname(destino), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public"), symlinkPublicDir: true });
const composition = await selectComposition({ serveUrl, id: reel.id, browserExecutable: navegador });

let ultimo = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  audioCodec: "aac",
  audioBitrate: "192k",
  outputLocation: destino,
  crf: 18,
  imageFormat: "jpeg",
  jpegQuality: 92,
  concurrency: os.cpus().length,
  browserExecutable: navegador,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 100);
    if (p !== ultimo && p % 10 === 0) {
      ultimo = p;
      console.log(`${p}%`);
    }
  },
});
console.log(`ok: ${destino}`);
