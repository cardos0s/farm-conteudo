// Renderiza HTML em PDF ou PNG com o Chromium do Playwright.
// uso: node render.cjs <modo> <entrada.html> <saida>
//   modo = corpo  → PDF com rodapé numerado e sumário de marcadores
//          capa   → PDF de página única, sem rodapé
//          png    → imagem da capa (para o EPUB)
const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

(async () => {
const [modo, entrada, saida] = process.argv.slice(2);
const navegador = await chromium.launch();
const contexto = await navegador.newContext(
  modo === "png"
    ? { viewport: { width: 672, height: 960 }, deviceScaleFactor: 2.5 }
    : {});
const pagina = await contexto.newPage();
await pagina.goto(pathToFileURL(path.resolve(entrada)).href,
  { waitUntil: "networkidle" });
await pagina.evaluate(() => document.fonts.ready);

if (modo === "png") {
  await pagina.screenshot({ path: saida, fullPage: false });
} else {
  const rodape = `
    <div style="width:100%; padding:0 17mm; box-sizing:border-box;
      display:flex; justify-content:space-between;
      font-family:'DejaVu Sans Mono',monospace; font-size:7px;
      color:#4f5a6e; letter-spacing:0.04em;">
      <span>Engenharia de Inferência</span>
      <span class="pageNumber"></span>
    </div>`;
  await pagina.pdf({
    path: saida,
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: modo === "corpo",
    headerTemplate: "<span></span>",
    footerTemplate: modo === "corpo" ? rodape : "<span></span>",
    outline: modo === "corpo",
    tagged: true,
  });
}
await navegador.close();
})();
