import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

// Tira quadros soltos do vídeo para conferir poses e enquadramentos sem renderizar tudo.
// Uso: npx tsx scripts/explica-mente/quadros.ts <pasta> <escala> <quadro> [quadro...]
const [pasta = "saida/explica-mente/quadros", escala = "0.5", ...quadros] = process.argv.slice(2);
const navegador = process.env.REMOTION_CHROME || null;
await mkdir(pasta, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: process.env.VIDEO ?? "ExplicaMenteTenis", browserExecutable: navegador, chromiumOptions: { gl: "swangle" } });
for (const q of quadros) {
  const saida = path.join(pasta, `q${q.padStart(4, "0")}.jpg`);
  await renderStill({ composition, serveUrl, frame: Number(q), output: saida, imageFormat: "jpeg", jpegQuality: 88, scale: Number(escala), browserExecutable: navegador, chromiumOptions: { gl: "swangle" } });
  console.log(saida);
}
