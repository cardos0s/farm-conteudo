import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderFrames, renderMedia, selectComposition } from "@remotion/renderer";
import { FPS, GANCHO, INTRO, TOTAL_QUADROS } from "../../remotion/aulas/patterns/roteiro";

// Renderiza o Reel "Design patterns na era da IA" no formato da gravação do iPhone:
// 2160x3840, HEVC 10 bits, HDR HLG (BT.2020). O gancho entra com a resolução e a cor originais
// (sem tone mapping); a edição do gancho (cartão e título) é renderizada em PNG com transparência e
// composta por cima já em HLG, sem mexer no resto da imagem; o canvas é renderizado em 4K e
// convertido de SDR para HLG com o branco no nível de referência do HLG (75%, BT.2408), para não
// estourar ao lado da gravação.
// Antes: python3 scripts/aulas/musica_patterns.py && python3 scripts/aulas/baixar_sfx.py
// Uso: npm run render:patterns [-- saida.mp4] [--so-juntar]
//   --so-juntar: reaproveita o canvas 4K, a edição do gancho e o áudio já renderizados (refaz só a etapa final)

const args = process.argv.slice(2);
const soJuntar = args.includes("--so-juntar");
const destino = args.find((a) => !a.startsWith("--")) ?? "saida/aulas/patterns/reel-design-patterns-na-era-da-ia.mp4";
const pasta = path.dirname(destino);
const canvas = path.join(pasta, "canvas-sdr.mp4");
const trilha = path.join(pasta, "trilha.wav");
const edicaoGancho = path.join(pasta, "gancho-png");
const navegador = process.env.REMOTION_CHROME || null;
const inicioCanvas = Math.round(INTRO * FPS);

/**
 * SDR (BT.709) → HLG (BT.2020): branco do SDR em ~75% do sinal HLG (-2,30 stops na luz linear).
 * O Remotion grava o canvas em faixa completa e com etiquetas de cor incompletas (bt470bg,
 * "unknown"); setparams diz ao zscale o que o conteúdo realmente é: BT.709, faixa completa.
 */
const SDR_PARA_HLG =
  "setparams=range=pc:color_primaries=bt709:color_trc=bt709:colorspace=bt709," +
  "zscale=t=linear:npl=100,format=gbrpf32le,exposure=exposure=-2.3045," +
  "zscale=p=bt2020:t=arib-std-b67:m=bt2020nc:r=tv:npl=1000,format=yuv420p10le";

/**
 * O mesmo para os PNGs com transparência da edição do gancho: o zscale descarta o canal alfa,
 * então a cor é convertida à parte e o alfa volta com alphamerge.
 */
const PNG_PARA_HLG =
  "format=rgba,split[cor][alfa];[alfa]alphaextract,format=gray10le[a];" +
  "[cor]format=gbrp,setparams=range=pc:color_primaries=bt709:color_trc=bt709:colorspace=gbr," +
  "zscale=t=linear:npl=100,format=gbrpf32le,exposure=exposure=-2.3045," +
  "zscale=p=bt2020:t=arib-std-b67:m=bt2020nc:r=tv:npl=1000,format=yuv444p10le[c];[c][a]alphamerge";

await mkdir(pasta, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public"), symlinkPublicDir: true });
const composition = await selectComposition({ serveUrl, id: "ReelPatterns", browserExecutable: navegador });

// 1. canvas em 4K (sem o trecho do gancho, que vem da gravação original)
const inicio = Date.now();
let ultimo = -1;
if (!soJuntar) await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: canvas,
  muted: true,
  scale: 2,
  frameRange: [inicioCanvas, TOTAL_QUADROS - 1],
  crf: 14,
  x264Preset: "fast",
  imageFormat: "jpeg",
  jpegQuality: 95,
  concurrency: os.cpus().length,
  browserExecutable: navegador,
  onProgress: ({ progress, renderedFrames }) => {
    const p = Math.floor(progress * 100);
    if (p !== ultimo && p % 5 === 0) {
      ultimo = p;
      console.log(`canvas ${p}% (${renderedFrames} quadros, ${((Date.now() - inicio) / 60000).toFixed(1)} min)`);
    }
  },
});

// 2. edição do gancho (cartão e título), em PNG com transparência, em 4K
if (!soJuntar) {
  await rm(edicaoGancho, { recursive: true, force: true });
  await mkdir(edicaoGancho, { recursive: true });
  const gancho = await selectComposition({ serveUrl, id: "ReelPatternsGancho", browserExecutable: navegador });
  await renderFrames({
    composition: gancho,
    serveUrl,
    outputDir: edicaoGancho,
    imageFormat: "png",
    scale: 2,
    browserExecutable: navegador,
    inputProps: {},
    onStart: () => console.log("edição do gancho…"),
    onFrameUpdate: () => undefined,
  });
  // quadros totalmente opacos (o cartão) saem em PNG RGB, sem alfa; com formatos misturados o ffmpeg
  // reinicia os filtros no meio da sequência, então todos viram RGBA
  for (const f of (await readdir(edicaoGancho)).filter((n) => n.endsWith(".png"))) {
    const arq = path.join(edicaoGancho, f);
    const tmp = arq.replace(/\.png$/, ".rgba.png");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", arq, "-pix_fmt", "rgba", tmp]);
    await rename(tmp, arq);
  }
}
const pngs = (await readdir(edicaoGancho)).filter((f) => f.endsWith(".png")).length;
if (pngs !== inicioCanvas) throw new Error(`a edição do gancho tem ${pngs} quadros; esperado ${inicioCanvas}`);

// 3. áudio do vídeo inteiro (voz do gancho, música e efeitos), sem perdas
if (!soJuntar) await renderMedia({ composition, serveUrl, codec: "wav", outputLocation: trilha, browserExecutable: navegador });
const medida = spawnSync("ffmpeg", ["-hide_banner", "-i", trilha, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const integrada = Number(/\bI:\s+(-?[\d.]+) LUFS/.exec(medida)?.[1] ?? "-16");
const ganho = (-16 - integrada + 0.3).toFixed(2);
console.log(`áudio: ${integrada} LUFS → ganho de ${ganho} dB`);

// 4. gancho original (com a edição por cima) + canvas em HLG, HEVC 10 bits (o mesmo formato da gravação)
console.log("juntando e codificando em HEVC 10 bits HLG…");
execFileSync(
  "ffmpeg",
  [
    "-v", "error", "-stats", "-y",
    "-ss", String(GANCHO.de), "-t", INTRO.toFixed(3), "-i", path.resolve("public", GANCHO.arquivo),
    "-framerate", String(FPS), "-pattern_type", "glob", "-i", path.join(edicaoGancho, "*.png"),
    "-i", canvas,
    "-i", trilha,
    "-filter_complex",
    `[0:v]setpts=PTS-STARTPTS,fps=${FPS},format=yuv420p10le,setsar=1[g0];` +
      `[1:v]setpts=PTS-STARTPTS,${PNG_PARA_HLG}[e];` +
      `[g0][e]overlay=format=yuv420p10:alpha=straight:eof_action=pass,setsar=1[g];` +
      `[2:v]setpts=PTS-STARTPTS,${SDR_PARA_HLG},setsar=1[c];` +
      `[g][c]concat=n=2:v=1:a=0[v];` +
      `[3:a]aresample=48000,volume=${ganho}dB,alimiter=limit=0.75:attack=3:release=60:level=false[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx265", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p10le", "-tag:v", "hvc1",
    "-x265-params", "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error",
    "-color_primaries", "bt2020", "-color_trc", "arib-std-b67", "-colorspace", "bt2020nc", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
    destino,
  ],
  { stdio: "inherit" },
);
await rm(canvas);
await rm(trilha);
await rm(edicaoGancho, { recursive: true, force: true });
console.log(`ok: ${destino}`);
