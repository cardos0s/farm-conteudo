import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { exemplos } from "../../remotion/exemplos";
import { renderizarReel } from "../video/render";

// Renderiza os vídeos de exemplo das três verticais em saida/exemplos/.
// Uso: npm run render:exemplo [cockpit|rebanho|focca]

const filtro = process.argv[2];
await mkdir("saida/exemplos", { recursive: true });
for (const [id, props] of Object.entries(exemplos)) {
  if (filtro && id !== filtro) continue;
  const destino = `saida/exemplos/${id}.mp4`;
  console.log(`Renderizando ${id}...`);
  await renderizarReel(props, destino);
  console.log(`  ok: ${destino}`);
}
