// Renderiza os diagramas em PNG (2x) e a capa, para o EPUB: leitores de ebook nem sempre
// carregam a fonte dos SVGs, e PNG funciona em todos (inclusive Kindle).
//
//   node ebooks/system-design/build/imagens.mjs     # depois de montar.py (a capa vem do HTML de impressão)

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Precisa do Playwright com Chromium: npm i -g playwright && npx playwright install chromium");
  process.exit(1);
}

const BUILD = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.dirname(BUILD);
const REPO = path.resolve(RAIZ, "../..");
const DIAGRAMAS = path.join(RAIZ, "diagramas");
const SAIDA = path.join(BUILD, ".tmp", "imagens");
mkdirSync(SAIDA, { recursive: true });

const fonte = pathToFileURL(path.join(REPO, "public/fontes/Excalifont-Regular.woff2")).href;
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ deviceScaleFactor: 2 });

const nomes = readdirSync(DIAGRAMAS).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4)).sort();
for (const nome of nomes) {
  const svg = readFileSync(path.join(DIAGRAMAS, `${nome}.svg`), "utf8");
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const temp = path.join(SAIDA, `_${nome}.html`);
  writeFileSync(temp, `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Excalifont;src:url(${fonte})}html,body{margin:0;background:#fdfdfc}svg{display:block}</style>${svg}`);
  await pagina.setViewportSize({ width: Math.ceil(+w), height: Math.ceil(+h) });
  await pagina.goto(pathToFileURL(temp).href, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.locator("svg").first().screenshot({ path: path.join(SAIDA, `${nome}.png`) });
}

// capa do EPUB: a mesma capa do PDF, em 1600 px de largura
const capa = await navegador.newPage({ viewport: { width: 642, height: 907 }, deviceScaleFactor: 2.5 });
await capa.goto(pathToFileURL(path.join(BUILD, ".tmp", "impressao.html")).href, { waitUntil: "load" });
await capa.evaluate(() => document.fonts.ready);
await capa.locator(".capa").screenshot({ path: path.join(SAIDA, "capa-livro.png") });

await navegador.close();
for (const f of readdirSync(SAIDA)) if (f.startsWith("_")) await import("node:fs").then((fs) => fs.rmSync(path.join(SAIDA, f)));
console.log(`imagens: ${nomes.length} diagramas + capa em ${path.relative(RAIZ, SAIDA)}`);
