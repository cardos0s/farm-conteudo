import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { quadros } from "../../remotion/aulas/llm-juiz/Aula";
import { P } from "../../remotion/aulas/llm-juiz/paginas";

// Uma imagem de cada página da lousa da Aula 2, já completa (um pouco antes da câmera sair dela).
// Usadas no roteiro de gravação em PDF (aulas/llm-como-juiz/pdf/).
// Uso: npm run miniaturas:aula -- [pasta]

const saida = path.resolve(process.argv[2] ?? "saida/aulas/llm-juiz/miniaturas");
await mkdir(saida, { recursive: true });
const nomes = new Map(Object.entries(P).map(([k, v]) => [v, k]));
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "AulaLlmJuiz" });
for (let i = 0; i < quadros.length; i++) {
  const q = quadros[i];
  if (!q.pagina) continue;
  const fim = quadros[i + 1]?.t ?? composition.durationInFrames / composition.fps;
  const t = Math.max(q.t + 1, fim - 0.75);
  await renderStill({ composition, serveUrl, frame: Math.round(t * composition.fps), output: path.join(saida, `${nomes.get(q.pagina)}.jpeg`), imageFormat: "jpeg", jpegQuality: 85, scale: 0.5 });
}
console.log(`ok: ${saida}`);
