// Renderiza alguns quadros de uma composição (um bundle só) para conferir a montagem.
// Uso: node scripts/telas/quadros.mjs <Composicao> <pasta-saida> <seg1> <seg2> ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [id, saida, ...segs] = process.argv.slice(2);
fs.mkdirSync(saida, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts") });
const browserExecutable = process.env.REMOTION_CHROME || "/opt/pw-browsers/chromium";
const comp = await selectComposition({ serveUrl, id, browserExecutable });
console.log(`${id}: ${(comp.durationInFrames / comp.fps).toFixed(2)} s · ${comp.durationInFrames} quadros`);
for (const s of segs) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(Number(s) * comp.fps));
  const arq = path.join(saida, `${id}-${String(s).padStart(5, "0")}.png`);
  await renderStill({ serveUrl, composition: comp, frame, output: arq, browserExecutable, scale: 0.5 });
  console.log("quadro", s, "→", arq);
}
