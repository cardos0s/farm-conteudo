// Gera um PNG de conferência com um ou mais diagramas já renderizados, na largura real
// (720 px) e na largura em que aparecem num celular, para checar sobreposições e legibilidade.
//
//   node ebooks/system-design/diagramas/previa.mjs /caminho/saida.png 02-cap 03-pacelc
//   node ebooks/system-design/diagramas/previa.mjs /caminho/saida.png 02-cap --escuro

import { readFileSync, existsSync, writeFileSync } from "node:fs";
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

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../../..");
const [saida, ...resto] = process.argv.slice(2);
const escuro = resto.includes("--escuro");
const nomes = resto.filter((a) => !a.startsWith("--")).map((n) => n.replace(/\.(mjs|svg)$/, ""));
if (!saida || !nomes.length) {
  console.error("uso: node previa.mjs saida.png nome1 [nome2 ...] [--escuro]");
  process.exit(1);
}

const fonte = (f) => pathToFileURL(path.join(raiz, "public/fontes", f)).href;
const figuras = nomes
  .map((nome) => {
    const arq = path.join(aqui, `${nome}.svg`);
    if (!existsSync(arq)) throw new Error(`não achei ${arq} — rode renderizar.mjs antes`);
    const svg = readFileSync(arq, "utf8").replace(/ width="\d+" height="\d+"/, "");
    return `<section><h2>${nome}</h2><div class="real">${svg}</div></section>`;
  })
  .join("\n");

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Excalifont;src:url(${fonte("Excalifont-Regular.woff2")})}
@font-face{font-family:Virgil;src:url(${fonte("Virgil-Regular.woff2")})}
body{margin:0;padding:16px;background:${escuro ? "#121212" : "#f1f3f5"};font:14px system-ui}
h2{font:600 13px system-ui;color:#868e96;margin:18px 0 6px}
.real{width:720px;box-shadow:0 0 0 1px #ced4da}
.real svg{display:block;width:100%;height:auto}
${escuro ? ".real svg{filter:invert(.93) hue-rotate(180deg)}" : ""}
</style><body>${figuras}</body>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 760, height: 400 }, deviceScaleFactor: 1 });
const temp = `${saida}.html`;
writeFileSync(temp, html);
await pagina.goto(pathToFileURL(temp).href, { waitUntil: "load" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: saida, fullPage: true });
await navegador.close();
console.log(`prévia salva em ${saida}`);
