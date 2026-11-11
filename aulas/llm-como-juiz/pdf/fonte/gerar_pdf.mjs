// Converte apostila.html e roteiro.html em PDF com o Chromium (Playwright), com número de página no rodapé.
// Uso, a partir da raiz do repositório: node aulas/llm-como-juiz/pdf/fonte/gerar_pdf.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// o Playwright pode estar instalado globalmente (fora do projeto): o require do CommonJS o encontra
const { chromium } = createRequire(import.meta.url)("playwright");

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saidas = [
  ["apostila.html", "../LLM-as-a-Judge-apostila.pdf", "LLM as a Judge · apostila"],
  ["roteiro.html", "../LLM-as-a-Judge-roteiro-de-gravacao.pdf", "LLM as a Judge · roteiro de gravação"],
];
const navegador = await chromium.launch();
for (const [html, pdf, titulo] of saidas) {
  const pagina = await navegador.newPage();
  await pagina.goto("file://" + path.join(aqui, html), { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({
    path: path.join(aqui, pdf),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font-size:8px;color:#868e96;padding:0 17mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>${titulo}</span><span class="pageNumber"></span></div>`,
  });
  console.log("ok:", path.resolve(aqui, pdf));
}
await navegador.close();
