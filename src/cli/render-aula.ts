import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rename } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Renderiza uma aula da comunidade (1920x1080) e junta com a voz já tratada.
// - complexidade: os vídeos 1440p dos clipes precisam estar em public/aulas/complexidade/ (ver scripts/aulas/README.md).
// - llm-juiz: a voz vem de scripts/aulas/alinhar.py (gravação alinhada). Sem voz, sai só o vídeo.
// Uso: npm run render:aula -- [aula] [voz.wav] [saida.mp4]

const AULAS: Record<string, { id: string; voz: string; destino: string }> = {
  complexidade: { id: "AulaComplexidade", voz: "saida/aulas/complexidade/voz.wav", destino: "saida/aulas/complexidade/aula-1-complexidade.mp4" },
  "llm-juiz": { id: "AulaLlmJuiz", voz: "saida/aulas/llm-juiz/voz.wav", destino: "saida/aulas/llm-juiz/aula-2-llm-juiz.mp4" },
};
const args = process.argv.slice(2);
const aula = AULAS[args[0]] ? AULAS[args.shift()!] : AULAS.complexidade;
const voz = args[0] ?? aula.voz;
const destino = args[1] ?? aula.destino;
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

if (!existsSync(voz)) {
  await rename(soVideo, destino);
  console.log(`ok (sem voz: ${voz} não existe): ${destino}`);
} else {
  // apad: se a voz terminar antes do vídeo (visão geral final), completa com silêncio em vez de cortar
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-y", "-i", soVideo, "-i", voz, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", "apad", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", destino],
    { stdio: "inherit" },
  );
  console.log(`ok: ${destino}`);
}
