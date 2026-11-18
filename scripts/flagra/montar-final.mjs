// Monta o Reel final do Flagra no formato da abertura gravada (HEVC 10 bits, BT.2020 HLG, 29,97 fps).
//
// A abertura (public/flagra/trailer.mp4) entra sem nenhum filtro: mesma cor, mesmo enquadramento,
// mesmo som. O resto (explicação + app + fecho) é renderizado pelo Remotion em SDR e convertido para
// HLG com o branco calibrado no nível da abertura. O volume do resto desce para casar com o da abertura.
//
// Uso: node scripts/flagra/montar-final.mjs     → saida/reel-flagra.mp4
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const ABERTURA = "public/flagra/trailer.mp4";
const RESTO = "saida/reel-flagra-resto.mp4";
const FINAL = "saida/reel-flagra.mp4";
const BRANCO_HLG = 250; // npl de saída que põe o branco da lousa no nível da parede da abertura (~0,78 do sinal)
const AJUSTE_VOLUME_DB = -3.3; // narração está a −14 LUFS; a abertura, a −17,3

mkdirSync("saida", { recursive: true });
const sondar = (args) => execFileSync("ffprobe", ["-v", "error", ...args]).toString().trim();
const quadrosAbertura = Number(sondar(["-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", ABERTURA]));
const fpsAbertura = sondar(["-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", ABERTURA]);
console.log(`abertura: ${quadrosAbertura} quadros a ${fpsAbertura}`);

const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts") });
const comp = await selectComposition({ serveUrl, id: "ReelFlagra" });
const inicio = Math.round(5.1 * comp.fps); // PARTES.trailer
let ult = -1;
await renderMedia({
  serveUrl,
  composition: comp,
  codec: "h264",
  crf: 14,
  audioBitrate: "320k",
  frameRange: [inicio, comp.durationInFrames - 1],
  outputLocation: RESTO,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 10);
    if (p !== ult) console.log("resto", (ult = p) * 10 + "%");
  },
});

const filtro = [
  `[0:v]setpts=PTS-STARTPTS,setsar=1[v0]`,
  `[1:v]fps=${fpsAbertura},zscale=tin=709:min=709:pin=709:rin=tv:t=linear:npl=100,format=gbrpf32le,` +
    `zscale=p=2020:t=arib-std-b67:m=2020_ncl:r=tv:npl=${BRANCO_HLG},format=yuv420p10le,setsar=1,setpts=PTS-STARTPTS[v1]`,
  `[0:a]aresample=48000,asetpts=PTS-STARTPTS[a0]`,
  `[1:a]aresample=48000,volume=${AJUSTE_VOLUME_DB}dB,asetpts=PTS-STARTPTS[a1]`,
  `[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]`,
].join(";");
execFileSync(
  "ffmpeg",
  [
    "-loglevel", "error", "-stats", "-y",
    "-i", ABERTURA, "-i", RESTO,
    "-filter_complex", filtro,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx265", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p10le", "-profile:v", "main10",
    "-x265-params", "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error",
    "-color_primaries", "bt2020", "-color_trc", "arib-std-b67", "-colorspace", "bt2020nc", "-color_range", "tv",
    "-tag:v", "hvc1",
    "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
    "-movflags", "+faststart",
    FINAL,
  ],
  { stdio: "inherit" },
);
console.log("pronto:", FINAL);
