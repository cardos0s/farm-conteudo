// Abre a Selloop com a Nova Rota (servidor de demonstração) e salva um print.
// Uso: node pacotes/selloop/demo/ver.mjs <caminho> <saida.png> [--usuario diogo] [--acoes "<js com page e demo>"]
// Ex.:  node pacotes/selloop/demo/ver.mjs /atendimento /tmp/caixa.png --usuario diogo

import { createRequire } from "node:module";
import { instalarDemo } from "./servidor.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const opc = { usuario: "patricia", acoes: "" };
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--usuario") opc.usuario = args[++i];
  else if (args[i] === "--acoes") opc.acoes = args[++i];
  else pos.push(args[i]);
}
const [caminho = "/atendimento", saida = "demo.png"] = pos;

const browser = await chromium.launch({
  headless: true,
  args: ["--lang=pt-BR"],
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.warn("[página] erro:", e.message));
const demo = await instalarDemo(page, { usuario: opc.usuario, agora: new Date("2026-11-10T10:32:00-03:00") });
await page.goto(`https://app.selloop.com.br${caminho}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
if (opc.acoes) {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction("page", "demo", opc.acoes)(page, demo);
}
await page.screenshot({ path: saida });
console.log(`print: ${saida} · url: ${page.url()} · rotas sem resposta: ${[...new Set(demo.estado.log)].join(", ") || "nenhuma"}`);
await browser.close();
