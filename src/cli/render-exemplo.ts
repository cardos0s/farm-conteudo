import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { exemplos, exemplosCarrossel } from "../../remotion/exemplos";
import { renderizarCarrossel, renderizarReel } from "../video/render";

// Renderiza os Reels e os carrosséis de exemplo das três verticais em saida/exemplos/.
// Uso: npm run render:exemplo [cockpit|rebanho|focca]

const filtro = process.argv[2];
await mkdir("saida/exemplos", { recursive: true });
for (const [id, props] of Object.entries(exemplos)) {
  if (filtro && id !== filtro) continue;
  const destino = `saida/exemplos/${id}.mp4`;
  console.log(`Renderizando Reel ${id}...`);
  await renderizarReel(props, destino);
  console.log(`  ok: ${destino}`);
}
for (const [id, { marca, carrossel }] of Object.entries(exemplosCarrossel)) {
  if (filtro && id !== filtro) continue;
  console.log(`Renderizando carrossel ${id}...`);
  const arquivos = await renderizarCarrossel(marca, carrossel, "saida/exemplos", `${id}-carrossel`);
  console.log(`  ok: ${arquivos.length} slides em saida/exemplos/`);
}
