import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Renderiza o Reel do Rebanho "Bora pesar o gado sem balança?" (1080x1920, com a narração).
// A voz fica em public/rebanho/pesagem/ (gerada por scripts/rebanho/narrar.py).
// Uso: npm run render:pesagem -- [saida.mp4]

const destino = process.argv[2] ?? "saida/rebanho/reel-pesagem-sem-balanca.mp4";
const navegador = process.env.REMOTION_CHROME || null;

await mkdir(path.dirname(destino), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public"), symlinkPublicDir: true });
const composition = await selectComposition({ serveUrl, id: "ReelPesagem", browserExecutable: navegador });

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
