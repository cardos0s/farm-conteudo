import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Renderiza o episódio animado em 3D do "Explica, Mente!" (1080x1920, 40 s).
// Se existir uma locução, ela entra no arquivo final; sem ela, o vídeo sai mudo, só com as legendas.
// Uso: npm run render:explica -- <episodio> [locucao.wav] [saida.mp4]

const nome = process.argv[2] ?? "tenis";
// o id da composição segue o nome do episódio: tenis -> ExplicaMenteTenis
const idComposicao = `ExplicaMente${nome[0].toUpperCase()}${nome.slice(1)}`;
const voz = process.argv[3] ?? `saida/explica-mente/${nome}/locucao.wav`;
const destino = process.argv[4] ?? `saida/explica-mente/explica-mente-${nome}.mp4`;
const temVoz = existsSync(voz);
const soVideo = temVoz ? destino.replace(/\.mp4$/, "-sem-audio.mp4") : destino;
const navegador = process.env.REMOTION_CHROME || null;
// Cena em WebGL: "swangle" desenha por software e funciona em servidor sem placa de vídeo.
const chromiumOptions = { gl: (process.env.REMOTION_GL ?? "swangle") as "swangle" | "angle" };

await mkdir(path.dirname(destino), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public"), symlinkPublicDir: true });
const composition = await selectComposition({ serveUrl, id: idComposicao, browserExecutable: navegador, chromiumOptions });

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
  jpegQuality: 94,
  concurrency: os.cpus().length,
  browserExecutable: navegador,
  chromiumOptions,
  onProgress: ({ progress, renderedFrames }) => {
    const p = Math.floor(progress * 100);
    if (p !== ultimo && p % 5 === 0) {
      ultimo = p;
      console.log(`${p}% (${renderedFrames} quadros, ${((Date.now() - inicio) / 60000).toFixed(1)} min)`);
    }
  },
});

if (temVoz) {
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-y", "-i", soVideo, "-i", voz, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", destino],
    { stdio: "inherit" },
  );
}
console.log(`ok: ${destino}${temVoz ? "" : " (sem locução)"}`);
