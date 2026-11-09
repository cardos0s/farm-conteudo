// Gera o PDF a partir de build/.tmp/impressao.html (rode montar.py antes).
//
//   node ebooks/system-design/build/pdf.mjs
//
// Duas passadas: a primeira descobre em que página caiu cada capítulo (pelos destinos do PDF);
// a segunda preenche os números do sumário e grava dist/system-design-50-conceitos.pdf.
// Usa o Playwright com o Chromium (npx playwright install chromium, se não tiver).

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
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
const html = path.join(BUILD, ".tmp", "impressao.html");
const rascunho = path.join(BUILD, ".tmp", "passo1.pdf");
const saida = path.join(RAIZ, "dist", "system-design-50-conceitos.pdf");

if (!existsSync(html)) {
  console.error("Rode antes: python3 ebooks/system-design/build/montar.py");
  process.exit(1);
}

const opcoes = { preferCSSPageSize: true, printBackground: true, outline: true, tagged: true };
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.emulateMedia({ media: "print", colorScheme: "light" });
await pagina.goto(pathToFileURL(html).href, { waitUntil: "load" });
await pagina.evaluate(async () => {
  await document.fonts.ready;
  document.querySelectorAll("details").forEach((d) => (d.open = true));
});

await pagina.pdf({ ...opcoes, path: rascunho });
const numeros = JSON.parse(execFileSync("python3", [path.join(BUILD, "paginas.py"), rascunho], { encoding: "utf8" }));
const faltando = await pagina.evaluate((numeros) => {
  const sem = [];
  document.querySelectorAll("[data-pagina-de]").forEach((el) => {
    const n = numeros[el.dataset.paginaDe];
    if (n) el.textContent = String(n);
    else { el.textContent = ""; sem.push(el.dataset.paginaDe); }
  });
  return sem;
}, numeros);
if (faltando.length) console.warn("sem número de página:", faltando.join(", "));

await pagina.pdf({ ...opcoes, path: saida });
await navegador.close();
execFileSync("python3", [path.join(BUILD, "paginas.py"), saida, "--metadados"]);
rmSync(rascunho, { force: true });

const total = JSON.parse(execFileSync("python3", ["-c", "import sys,json; from pypdf import PdfReader; print(len(PdfReader(sys.argv[1]).pages))", saida], { encoding: "utf8" }));
console.log(`PDF: ${path.relative(RAIZ, saida)} (${total} páginas)`);
