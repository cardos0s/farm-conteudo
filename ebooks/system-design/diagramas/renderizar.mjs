// Renderiza diagramas/fontes/<nome>.mjs em diagramas/<nome>.svg.
//
//   node ebooks/system-design/diagramas/renderizar.mjs            # todos
//   node ebooks/system-design/diagramas/renderizar.mjs 02-cap      # só alguns

import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Lousa } from "./kit.mjs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const fontes = path.join(aqui, "fontes");

const pedidos = process.argv.slice(2).map((n) => n.replace(/\.(mjs|svg)$/, ""));
const nomes = pedidos.length
  ? pedidos
  : readdirSync(fontes)
      .filter((f) => f.endsWith(".mjs"))
      .map((f) => f.slice(0, -4))
      .sort();

let falhas = 0;
for (const nome of nomes) {
  try {
    const mod = await import(pathToFileURL(path.join(fontes, `${nome}.mjs`)).href);
    const d = new Lousa(nome);
    mod.default(d);
    writeFileSync(path.join(aqui, `${nome}.svg`), d.toString());
    console.log(`ok  ${nome}.svg  (${d.w}x${d.h})`);
  } catch (e) {
    falhas++;
    console.error(`ERRO  ${nome}: ${e.stack ?? e}`);
  }
}
process.exit(falhas ? 1 : 0);
