// Gera o PDF "System Design do WhatsApp" (A4) a partir de conteudo.mjs.
//
//   npm run pdf:whatsapp
//
// O HTML é impresso pelo Chromium (Playwright). A capa sai sem rodapé e o miolo com número de
// página; o sumário é preenchido numa segunda passada, depois de descobrir em que página caiu
// cada capítulo. Saída: saida/materiais/system-design-whatsapp.pdf

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { capitulos, cola, subtitulo, titulo } from "./conteudo.mjs";
import * as D from "./diagramas.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// Preencha para aparecer na capa e no fim (ex.: "por @seuperfil").
const AUTOR = process.env.AUTOR ?? "";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");
const saidaDir = path.join(raiz, "saida/materiais");
const trabalho = path.join(saidaDir, ".trabalho");
fs.mkdirSync(trabalho, { recursive: true });
const fonte = pathToFileURL(path.join(raiz, "public/fontes/Excalifont-Regular.woff2")).href;

const css = `
@font-face { font-family: "Excali"; src: url("${fonte}") format("woff2"); }
:root {
  --tinta: #1e1e1e; --suave: #495057; --cinza: #868e96; --linha: #dee2e6;
  --acento: #0b7a6b; --acento-claro: #e6f4f1; --alerta: #c92a2a; --alerta-claro: #fff0f0;
  --amarelo: #fff7d6;
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: "Inter", sans-serif; font-size: 10pt; line-height: 1.5; color: var(--tinta); }
p { margin: 0 0 7pt; }
.lead { font-size: 12.5pt; line-height: 1.5; color: var(--suave); }
h2 { font-size: 23pt; line-height: 1.15; margin: 0 0 16pt; letter-spacing: -0.02em; break-before: page; break-after: avoid; position: relative; }
h2 .num { display: block; font-family: "Excali"; font-size: 15pt; color: var(--acento); font-weight: 400; letter-spacing: 0; margin-bottom: 2pt; }
h3 { font-size: 12.5pt; margin: 13pt 0 5pt; break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10pt 0 4pt; color: var(--acento); text-transform: uppercase; letter-spacing: 0.04em; }
ul, ol { margin: 0 0 9pt; padding-left: 18pt; }
li { margin-bottom: 3pt; }
b { font-weight: 650; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 8.6pt; background: #f1f3f5; padding: 0 3pt; border-radius: 3pt; }
pre { background: #1f2428; color: #e9ecef; border-radius: 8pt; padding: 11pt 13pt; font-size: 8.3pt; line-height: 1.5; margin: 6pt 0 12pt; white-space: pre-wrap; break-inside: avoid; }
pre code { background: none; padding: 0; font-size: inherit; color: inherit; }
pre .c { color: #8ce99a; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 12pt; font-size: 9.4pt; break-inside: avoid; }
th { text-align: left; font-weight: 650; border-bottom: 1.5pt solid var(--tinta); padding: 3pt 6pt; }
td { border-bottom: 0.6pt solid var(--linha); padding: 3pt 6pt; vertical-align: top; }
td.n { text-align: right; font-weight: 650; white-space: nowrap; }
table.contas td:nth-child(2) { color: var(--suave); font-family: "DejaVu Sans Mono", monospace; font-size: 8.6pt; }
table.api td:first-child { width: 48%; }
figure { margin: 8pt 0 14pt; break-inside: avoid; text-align: center; }
figure svg { width: 100%; height: auto; max-height: 80mm; }
figure.larga svg { max-height: 112mm; }
figure.media svg { max-height: 76mm; }
figure.tr svg { max-height: 64mm; }
figure.baixa svg { max-height: 58mm; }
figcaption { font-size: 8.6pt; color: var(--cinza); margin-top: 4pt; }
.caixa { display: block; border-radius: 8pt; padding: 9pt 12pt 9pt 13pt; margin: 8pt 0 10pt; font-size: 9.5pt; break-inside: avoid; border-left: 4pt solid; }
.caixa b:first-child { display: block; margin-bottom: 2pt; font-size: 9.8pt; }
.dica { background: var(--acento-claro); border-color: var(--acento); }
.dica b:first-child { color: var(--acento); }
.alerta { background: var(--alerta-claro); border-color: var(--alerta); }
.alerta b:first-child { color: var(--alerta); }
.alerta b:first-child::before { content: "⚠  "; }
.frase { background: var(--amarelo); border-color: #f0b400; font-style: italic; }
.frase b:first-child { font-style: normal; color: #9c6b00; }
.duas { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
ul.checks { list-style: none; padding-left: 0; }
ul.checks li::before { content: "✓"; color: var(--acento); font-weight: 700; margin-right: 6pt; }
ol.passos { counter-reset: p; list-style: none; padding-left: 0; }
ol.passos li { counter-increment: p; position: relative; padding-left: 24pt; margin-bottom: 5pt; }
ol.passos li::before { content: counter(p); position: absolute; left: 0; top: 1pt; width: 16pt; height: 16pt; border-radius: 50%; background: #1971c2; color: #fff; font-size: 8.5pt; font-weight: 700; text-align: center; line-height: 16pt; }
ol.erros li { margin-bottom: 4pt; }
dl.qa dt { font-weight: 650; margin-top: 8pt; break-after: avoid; }
dl.qa dd { margin: 2pt 0 0; color: var(--suave); }
.nota { font-size: 8.4pt; color: var(--cinza); margin-top: 16pt; border-top: 0.6pt solid var(--linha); padding-top: 6pt; }
.nova-pagina { break-before: page; }
.marca { position: absolute; right: 0; top: 0; font-size: 7pt; color: #ffffff; font-family: "DejaVu Sans Mono", monospace; }

/* sumário */
.sumario h2 { break-before: auto; }
.sumario ol { list-style: none; padding: 0; margin: 0; }
.sumario li { display: flex; align-items: baseline; gap: 8pt; padding: 6.5pt 0; border-bottom: 0.6pt solid var(--linha); font-size: 11pt; margin: 0; }
.sumario .sn { font-family: "Excali"; color: var(--acento); width: 22pt; font-size: 13pt; }
.sumario .st { flex: 1; }
.sumario .sp { color: var(--cinza); font-variant-numeric: tabular-nums; }
.sumario .intro { margin-top: 18pt; font-size: 9.6pt; color: var(--suave); }

/* cola */
.cola { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt; }
.mini { font-size: 8.6pt; }
table.mini td { padding: 2.5pt 4pt; }
table.mini td:first-child { font-weight: 650; width: 42%; }
ol.mini, ul.mini { padding-left: 14pt; }
ol.mini li, ul.mini li { margin-bottom: 1.5pt; }
.cola-fig { margin-top: 6pt; }
.cola-fig svg { max-height: 82mm; }

.fim { margin-top: 24pt; text-align: center; color: var(--suave); }
.fim .grande { font-family: "Excali"; font-size: 20pt; color: var(--acento); }
`;

const capaHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css}
body { margin: 0; }
.capa { width: 210mm; height: 297mm; padding: 24mm 20mm 18mm; display: flex; flex-direction: column; background: #fbfbf8;
  background-image: radial-gradient(#d9d9d2 1.1px, transparent 1.1px); background-size: 9mm 9mm; }
.capa .rotulo { font-family: "Excali"; font-size: 17pt; color: var(--acento); }
.capa h1 { font-size: 46pt; line-height: 1.02; letter-spacing: -0.035em; margin: 6mm 0 6mm; }
.capa h1 span { background: linear-gradient(transparent 62%, #ffec99 62%); }
.capa .sub { font-size: 14pt; color: var(--suave); max-width: 150mm; line-height: 1.45; }
.capa figure { margin: auto 0; }
.capa figure svg { max-height: 95mm; }
.capa .rodape { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10pt; color: var(--suave); border-top: 1pt solid var(--tinta); padding-top: 5mm; }
.capa .rodape b { color: var(--tinta); }
</style></head><body><div class="capa">
<div class="rotulo">guia de estudo · entrevista de system design</div>
<h1>System Design<br>do <span>WhatsApp</span></h1>
<div class="sub">${subtitulo}.</div>
<figure>${D.capa()}</figure>
<div class="rodape"><div><b>14 capítulos + cola de uma página</b><br>requisitos, contas, arquitetura, entrega, tiques,<br>grupos, mídia, banco, falhas e o WhatsApp real</div><div>${AUTOR}</div></div>
</div></body></html>`;

const nomesCap = [...capitulos, cola]
  .join("")
  .matchAll(/<h2 data-cap="(\d+)"><span class="num">[^<]*<\/span>([^<]+)<\/h2>/g);
const indice = [...nomesCap].map((m) => ({ n: Number(m[1]), t: m[2] }));

function corpoHtml(paginas, comMarcas) {
  const sumario = `<section class="sumario"><h2>Sumário</h2><ol>${indice
    .map(
      (c) =>
        `<li><span class="sn">${c.n === 15 ? "★" : String(c.n).padStart(2, "0")}</span><span class="st">${c.t}</span><span class="sp">${
          paginas[c.n] ?? "00"
        }</span></li>`,
    )
    .join("")}</ol>
<p class="intro">Os diagramas foram desenhados à mão, no estilo de um quadro branco, para você reproduzir na entrevista. As caixas verdes são dicas, as vermelhas são erros comuns e as amarelas são frases prontas para falar.</p></section>`;
  let corpo = [...capitulos, cola].join("\n");
  if (comMarcas) corpo = corpo.replace(/<h2 data-cap="(\d+)">/g, (m, n) => `${m}<span class="marca">QQCAP${n}QQ</span>`);
  const fim = `<div class="fim"><div class="grande">bons estudos!</div>${AUTOR ? `<p>${AUTOR}</p>` : ""}</div>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title><style>${css}</style></head><body>${sumario}${corpo}${fim}</body></html>`;
}

const rodape = `<div style="font-family: Inter, sans-serif; font-size: 7.5pt; color: #868e96; width: 100%; padding: 0 17mm; display: flex; justify-content: space-between;">
<span>${titulo}</span><span class="pageNumber"></span></div>`;

async function imprimir(navegador, html, arquivo, comRodape) {
  const htmlArq = arquivo.replace(/\.pdf$/, ".html");
  fs.writeFileSync(htmlArq, html);
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(htmlArq).href, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({
    path: arquivo,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: comRodape,
    headerTemplate: "<div></div>",
    footerTemplate: comRodape ? rodape : "<div></div>",
    margin: comRodape ? { top: "16mm", bottom: "17mm", left: "17mm", right: "17mm" } : { top: 0, bottom: 0, left: 0, right: 0 },
  });
  await pagina.close();
}

const navegador = await chromium.launch();
const capaPdf = path.join(trabalho, "capa.pdf");
const corpoPdf = path.join(trabalho, "corpo.pdf");
await imprimir(navegador, capaHtml, capaPdf, false);

// 1ª passada: descobre a página de cada capítulo pelas marcas invisíveis.
await imprimir(navegador, corpoHtml({}, true), corpoPdf, true);
const texto = execFileSync("pdftotext", ["-raw", corpoPdf, "-"], { encoding: "utf8" });
const paginas = {};
texto.split("\f").forEach((t, i) => {
  for (const m of t.matchAll(/QQCAP(\d+)QQ/g)) paginas[Number(m[1])] ??= i + 1;
});
const faltando = indice.filter((c) => !paginas[c.n]);
if (faltando.length) throw new Error(`Capítulos sem página: ${faltando.map((c) => c.n).join(", ")}`);

// 2ª passada: sumário com os números certos e sem as marcas.
await imprimir(navegador, corpoHtml(paginas, false), corpoPdf, true);
await navegador.close();

const destino = path.join(saidaDir, "system-design-whatsapp.pdf");
execFileSync("python3", [
  "-I",
  "-c",
  `
import sys
from pypdf import PdfReader, PdfWriter
w = PdfWriter()
for f in sys.argv[1:3]:
    for p in PdfReader(f).pages:
        w.add_page(p)
w.add_metadata({"/Title": sys.argv[4], "/Author": sys.argv[5], "/Subject": "Guia de estudo de system design"})
with open(sys.argv[3], "wb") as o:
    w.write(o)
`,
  capaPdf,
  corpoPdf,
  destino,
  titulo,
  AUTOR || titulo,
]);
const total = texto.split("\f").filter((t) => t.trim()).length + 1;
console.log(`PDF pronto: ${path.relative(raiz, destino)} (${total} páginas)`);
console.log(indice.map((c) => `  ${String(c.n).padStart(2)}  p.${paginas[c.n]}  ${c.t}`).join("\n"));
