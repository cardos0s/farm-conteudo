// Prévia de um diagrama dos Reels: desenha o estado final e cada etapa acumulada lado a lado num PNG.
//
//   node materiais/whatsapp/previa-diagrama.mjs <arquivo.mjs> <funcao> <saida.png>
//
// Ex.: node materiais/whatsapp/previa-diagrama.mjs materiais/whatsapp/reels-diagramas/recepcao.mjs recepcao /tmp/x.png
// O quadro tem o tamanho da área de diagrama do Reel (968x690 pontos = largura útil da tela vertical).

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [arquivo, funcao, saida] = process.argv.slice(2);
if (!arquivo || !funcao || !saida) {
  console.error("uso: node materiais/whatsapp/previa-diagrama.mjs <arquivo.mjs> <funcao> <saida.png>");
  process.exit(1);
}
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mod = await import(pathToFileURL(path.resolve(arquivo)).href);
if (typeof mod[funcao] !== "function") throw new Error(`${arquivo} não exporta a função ${funcao}`);
const svg = mod[funcao]();
const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100").split(/\s+/).map(Number);

// mesma leitura de etapas do vídeo (remotion/reels/whatsapp/Desenho.tsx)
const els = [];
const pilha = [0];
for (const m of svg.matchAll(/<g data-etapa="(\d+)">|<\/g>|<path[^>]*\/>|<text[^>]*>[\s\S]*?<\/text>/g)) {
  if (m[1] !== undefined) { pilha.push(Number(m[1])); continue; }
  if (m[0] === "</g>") { if (pilha.length > 1) pilha.pop(); continue; }
  els.push({ html: m[0], etapa: pilha[pilha.length - 1] });
}
const n = Math.max(0, ...els.map((e) => e.etapa));
const contagem = Array.from({ length: n + 1 }, (_, k) => els.filter((e) => e.etapa === k).length);
console.log(`${funcao}: viewBox ${vb.join(" ")}, ${els.length} elementos, etapas 0..${n}: ${contagem.join(" / ")}`);
// textos fora do quadro
for (const m of svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"[^>]*>([^<]*)<\/text>/g)) {
  const [x, y] = [Number(m[1]), Number(m[2])];
  if (x < 0 || y < 0 || x > vb[2] || y > vb[3]) console.log(`  aviso: texto fora do quadro em (${x}, ${y}): "${m[3]}"`);
}

const fonte = pathToFileURL(path.join(raiz, "public/fontes/Excalifont-Regular.woff2")).href;
const painel = (k, escala) => {
  const corpo = els.filter((e) => e.etapa <= k).map((e) => e.html).join("");
  return `<div class="p"><div class="r">${k === n ? "final" : `até a etapa ${k}`}</div><svg width="${vb[2] * escala}" height="${vb[3] * escala}" viewBox="0 0 ${vb[2]} ${vb[3]}">${corpo}</svg></div>`;
};
const paineis = Array.from({ length: n + 1 }, (_, k) => painel(k, n === 0 ? 1 : 0.5)).join("");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Excali"; src: url("${fonte}") format("woff2"); }
body { margin: 0; background: #fbfbf8; font-family: sans-serif; }
.g { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px; width: ${n === 0 ? vb[2] + 24 : 2 * (vb[2] * 0.5) + 36}px; }
.p { background: #fbfbf8; outline: 2px dashed #ced4da; }
.r { font: 14px sans-serif; color: #868e96; padding: 2px 6px; }
</style></head><body><div class="g">${paineis}</div></body></html>`;
const tmp = path.join(path.dirname(path.resolve(saida)), `.previa-${process.pid}.html`);
fs.writeFileSync(tmp, html);
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1200, height: 800 } });
await pag.goto(pathToFileURL(tmp).href);
await pag.evaluate(() => document.fonts.ready);
await pag.locator(".g").screenshot({ path: saida });
await nav.close();
fs.rmSync(tmp);
console.log(`prévia: ${saida}`);
