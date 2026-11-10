// Tira, em alta resolução, o "recorte" de cada elemento que uma cena marca com g.recorte(alvo, nome):
// o cartão, a mensagem ou o botão que a montagem faz saltar da tela.
//
// Roda a mesma cena do gravador, sem gravar e com as pausas curtas, num Chromium em 3x; em cada
// g.recorte espera a tela assentar e salva <saida>/<cena>/recortes/<nome>.png. As caixas ficam em
// <saida>/<cena>/recortes.json (px CSS, as mesmas que o gravador registra em eventos.json).
//
// Uso:
//   node scripts/telas/recortar.mjs <cena.mjs> [--saida pasta] [--largura 1600] [--altura 900] [--escala 3]

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { caixaDe } from "./caixa.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

function argumentos(argv) {
  const a = { cena: null, saida: "saida/telas", largura: 1600, altura: 900, escala: 3 };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    const prox = () => argv[++i];
    if (v === "--saida") a.saida = prox();
    else if (v === "--largura") a.largura = Number(prox());
    else if (v === "--altura") a.altura = Number(prox());
    else if (v === "--escala") a.escala = Number(prox());
    else if (!a.cena) a.cena = v;
  }
  if (!a.cena) {
    console.error("Uso: node scripts/telas/recortar.mjs <cena.mjs> [--saida pasta] [--largura 1600] [--altura 900] [--escala 3]");
    process.exit(1);
  }
  return a;
}

const a = argumentos(process.argv.slice(2));
const cena = (await import(pathToFileURL(path.resolve(a.cena)).href)).default;
const pasta = path.resolve(a.saida, cena.nome);
const pastaRecortes = path.join(pasta, "recortes");
fs.rmSync(pastaRecortes, { recursive: true, force: true });
fs.mkdirSync(pastaRecortes, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--hide-scrollbars", "--lang=pt-BR"],
  env: { ...process.env, LANG: "pt_BR.UTF-8", LANGUAGE: "pt_BR:pt", LC_ALL: "pt_BR.UTF-8" },
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
});
const ctx = await browser.newContext({ viewport: { width: a.largura, height: a.altura }, deviceScaleFactor: a.escala, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.warn("[página] erro:", e.message));

const loc = (alvo) => (typeof alvo === "string" ? page.locator(alvo).first() : alvo);
const ehPonto = (alvo) => alvo && typeof alvo === "object" && "x" in alvo && "y" in alvo && !alvo.locator;
const recortes = {};

// As mesmas ações do gravador, só que diretas e com as pausas encurtadas.
const g = {
  page,
  rel: () => 0,
  async mover(alvo) {
    if (ehPonto(alvo)) return page.mouse.move(alvo.x, alvo.y);
    await loc(alvo).waitFor({ state: "visible", timeout: 15000 });
    await loc(alvo).hover();
  },
  async clicar(alvo, { depois = 450 } = {}) {
    if (ehPonto(alvo)) await page.mouse.click(alvo.x, alvo.y);
    else await loc(alvo).click({ timeout: 15000 });
    await page.waitForTimeout(Math.min(depois, 600));
  },
  async escolher(alvo, opcao) {
    await loc(alvo).selectOption(opcao);
    await page.waitForTimeout(200);
  },
  async digitar(alvo, texto) {
    if (alvo) await loc(alvo).click();
    await page.keyboard.type(texto, { delay: 15 });
    await page.waitForTimeout(150);
  },
  async rolar(dy, { em = null } = {}) {
    if (em) {
      // o painel que rola em volta do elemento (como no filme)
      await loc(em).evaluate((el, d) => {
        for (let e = el.parentElement; e; e = e.parentElement) {
          const o = getComputedStyle(e).overflowY;
          if ((o === "auto" || o === "scroll") && e.scrollHeight > e.clientHeight + 1) return void (e.scrollTop += d);
        }
        document.scrollingElement.scrollTop += d;
      }, dy);
    } else await page.mouse.wheel(0, dy);
    await page.waitForTimeout(450);
  },
  // esperas longas (reconexões, downloads) ficam como estão; as de ritmo encolhem
  async esperar(ms) {
    await page.waitForTimeout(ms >= 3000 ? ms : Math.min(ms, 350));
  },
  marca() {},
  async foco(alvo) {
    if (!ehPonto(alvo)) await loc(alvo).waitFor({ state: "visible", timeout: 15000 });
  },
  async recorte(alvo, nome, { margem = 0, semMouse = false, dentro = null } = {}) {
    // sem o mouse por cima, somem a dica (tooltip) e o realce de hover do elemento
    if (semMouse) await page.mouse.move(a.largura - 4, a.altura - 4);
    await page.waitForTimeout(650); // rolagem e animações de entrada terminam
    const caixa = await caixaDe(page, alvo, margem, dentro);
    const clip = { x: Math.max(0, caixa.x), y: Math.max(0, caixa.y), width: caixa.w, height: caixa.h };
    await page.screenshot({ path: path.join(pastaRecortes, `${nome}.png`), clip });
    recortes[nome] = { caixa };
    console.log(`recorte ${nome}: ${Math.round(caixa.w)}×${Math.round(caixa.h)} em ${Math.round(caixa.x)},${Math.round(caixa.y)}`);
    return caixa;
  },
};

let falhou = false;
try {
  if (cena.antes) await cena.antes(page);
  if (cena.url) await page.goto(cena.url, { waitUntil: "networkidle", timeout: 60000 });
  if (cena.preparar) await cena.preparar(page);
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(600);
  await cena.gravar(g, page);
} catch (e) {
  falhou = true;
  console.error("Erro na cena:", e.message.split("\n")[0]);
  await page.screenshot({ path: path.join(pasta, "recortes-erro.png") }).catch(() => {});
}
fs.writeFileSync(path.join(pasta, "recortes.json"), JSON.stringify({ cena: cena.nome, largura: a.largura, altura: a.altura, escala: a.escala, recortes }, null, 1));
console.log(`${Object.keys(recortes).length} recorte(s) em ${pastaRecortes}`);
await browser.close();
if (falhou) process.exit(1);
