// Gera o PDF de um e-book a partir do index.html da pasta dele.
// Uso: node scripts/ebook/gerar-pdf.mjs ebooks/os-4-craques-do-pasto
// Precisa do Playwright com o Chromium (sem mexer no package.json):
//   npm i --no-save playwright && npx playwright install chromium
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const pasta = process.argv[2];
if (!pasta) {
  console.error("Uso: node scripts/ebook/gerar-pdf.mjs <pasta-do-ebook>");
  process.exit(1);
}
const html = path.resolve(pasta, "index.html");
if (!fs.existsSync(html)) {
  console.error(`Não encontrei ${html}`);
  process.exit(1);
}
const saida = path.resolve(pasta, `${path.basename(path.resolve(pasta))}.pdf`);

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
  console.error("Playwright não encontrado. Instale com: npm i --no-save playwright && npx playwright install chromium");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: "print" });

// Cada página do e-book é um A4 fixo: avisa se algum conteúdo passou do espaço útil.
const estouradas = await page.evaluate(() =>
  [...document.querySelectorAll(".page")].flatMap((p, i) => {
    const cs = getComputedStyle(p);
    let soma = 0;
    let n = 0;
    for (const el of p.children) {
      if (getComputedStyle(el).position === "absolute") continue;
      soma += el.getBoundingClientRect().height;
      n++;
    }
    const usado = soma + Math.max(0, n - 1) * (parseFloat(cs.rowGap) || 0) + parseFloat(cs.paddingTop);
    const limite = p.getBoundingClientRect().height - parseFloat(cs.paddingBottom);
    return usado > limite + 1 ? [`página ${i + 1}: passou ${Math.round(usado - limite)} px`] : [];
  }),
);
if (estouradas.length) console.warn(`Atenção, conteúdo além do A4:\n  ${estouradas.join("\n  ")}`);

await page.pdf({ path: saida, preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`PDF gerado: ${path.relative(process.cwd(), saida)}`);
