import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Renderiza uma aula (1920x1080) e junta com a voz já tratada.
// Os vídeos 1440p dos clipes precisam estar em public/aulas/<aula>/ (ver scripts/aulas/README.md).
// Uso: npm run render:aula -- [aula] [voz.wav] [saida.mp4]     (aula: complexidade | recursividade | agentes)

const AULAS: Record<string, { id: string; arquivo: string }> = {
  complexidade: { id: "AulaComplexidade", arquivo: "aula-1-complexidade.mp4" },
  recursividade: { id: "AulaRecursividade", arquivo: "aula-2-recursividade.mp4" },
  agentes: { id: "ReelAgentes", arquivo: "reel-orquestracao-de-agentes.mp4" },
};
const nome = process.argv[2] ?? "complexidade";
const aula = AULAS[nome];
if (!aula) throw new Error(`Aula desconhecida: "${nome}". Opções: ${Object.keys(AULAS).join(", ")}`);
const voz = process.argv[3] ?? `saida/aulas/${nome}/voz.wav`;
const destino = process.argv[4] ?? `saida/aulas/${nome}/${aula.arquivo}`;
const soVideo = destino.replace(/\.mp4$/, "-sem-audio.mp4");
const navegador = process.env.REMOTION_CHROME || null;

await mkdir(path.dirname(destino), { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.resolve("remotion/index.ts"),
  publicDir: path.resolve("public"),
  // os vídeos somam alguns GB: link simbólico em vez de copiar a pasta public a cada render
  symlinkPublicDir: true,
});
const composition = await selectComposition({ serveUrl, id: aula.id, browserExecutable: navegador });

const inicio = Date.now();
let ultimo = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: soVideo,
  muted: true,
  crf: 17,
  x264Preset: "medium",
  imageFormat: "jpeg",
  jpegQuality: 92,
  concurrency: os.cpus().length,
  browserExecutable: navegador,
  // Sem "swangle": nesta composição (SVG grande + vídeo) o modo padrão do Chrome é ~3x mais rápido.
  onProgress: ({ progress, renderedFrames }) => {
    const p = Math.floor(progress * 100);
    if (p !== ultimo && p % 5 === 0) {
      ultimo = p;
      const min = ((Date.now() - inicio) / 60000).toFixed(1);
      console.log(`${p}% (${renderedFrames} quadros, ${min} min)`);
    }
  },
});

execFileSync(
  "ffmpeg",
  ["-v", "error", "-y", "-i", soVideo, "-i", voz, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", destino],
  { stdio: "inherit" },
);
console.log(`ok: ${destino}`);
