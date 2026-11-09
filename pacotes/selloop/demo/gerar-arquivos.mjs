// Gera os arquivos estáticos da demo: fotos dos produtos (de produtos.html).
// Uso: node pacotes/selloop/demo/gerar-arquivos.mjs

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(AQUI, "arquivos", "produtos");
fs.mkdirSync(saida, { recursive: true });

const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
await page.goto("file://" + path.join(AQUI, "produtos.html"));
await page.evaluate(() => document.fonts.ready);
for (const id of await page.$$eval("section", (s) => s.map((x) => x.id))) {
  await page.locator(`#${id}`).screenshot({ path: path.join(saida, `${id}.png`) });
  console.log("produto:", id);
}
await browser.close();

// Nota fiscal fictícia em PDF (Notas e pedidos).
{
  const docs = path.join(AQUI, "arquivos", "documentos");
  fs.mkdirSync(docs, { recursive: true });
  const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  const p = await b.newPage();
  await p.goto("file://" + path.join(AQUI, "nota.html"));
  for (const nome of ["nfe-4521", "nfe-4388", "pedido-1187", "pedido-1102"]) {
    await p.pdf({ path: path.join(docs, `${nome}.pdf`), format: "A4", printBackground: true });
    console.log("documento:", nome);
  }
  await b.close();
}

// Banners dos modelos de campanha (cabeçalho com imagem).
{
  const dir = path.join(AQUI, "arquivos", "banners");
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  const p = await b.newPage({ viewport: { width: 1200, height: 628 } });
  await p.goto("file://" + path.join(AQUI, "banners.html"));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  for (const id of await p.$$eval("section", (s) => s.map((x) => x.id))) {
    await p.locator(`#${id}`).screenshot({ path: path.join(dir, `${id}.png`) });
    console.log("banner:", id);
  }
  await b.close();
}
