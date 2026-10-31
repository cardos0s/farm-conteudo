import "dotenv/config";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { exemploUgc } from "../../remotion/exemplos";
import { FFMPEG, rodar } from "../ugc/midia";
import { renderizarUgc } from "../video/render";

// Renderiza um UGC de teste com vídeo e áudio sintéticos (ffmpeg), sem chamar nenhuma API paga.
// Serve para conferir legenda, headline, zoom e o servidor de mídia antes de gastar com geração.

const pasta = "saida/exemplos/ugc";
await mkdir(pasta, { recursive: true });
const cores = ["0x3a5a40", "0x4a4e69", "0x9a031e"];
const blocos = [];
for (const [i, b] of exemploUgc.blocos.entries()) {
  const video = `clipe-${i}.mp4`;
  const audio = `fala-${i}.mp3`;
  await rodar(FFMPEG, ["-y", "-f", "lavfi", "-i", `color=c=${cores[i % cores.length]}:s=1080x1920:d=3,drawgrid=w=120:h=120:t=2:c=white@0.2`, "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(pasta, video)]);
  await rodar(FFMPEG, ["-y", "-f", "lavfi", "-i", `sine=frequency=${220 + i * 110}:duration=2.8`, "-af", "volume=0.2", path.join(pasta, audio)]);
  blocos.push({ ...b, video, videoDuracaoSeg: 3, audio, imagem: undefined });
}
const destino = path.join(pasta, "exemplo-ugc.mp4");
const { base: _base, ...props } = { ...exemploUgc, blocos };
await renderizarUgc(props, pasta, destino);
console.log(`ok: ${destino}`);
process.exit();
