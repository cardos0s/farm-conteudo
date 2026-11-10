// Gera o ebook "Arquitetura de Software: o guia completo" (A4).
//
//   npm run pdf:arquiteturas
//
// Capa sem rodapé + miolo com número de página; o sumário é preenchido numa segunda passada.
// Saída: saida/materiais/arquitetura-de-software.pdf

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { bloco, claro, cor, elipse, evento, linha, nuvem, quadro, semear, servidor, seta, txt, caminho, banco } from "./desenho.mjs";
import { css } from "./estilo.mjs";
import { AUTORA, PERFIL, carregar, corpoHtml, fonte, imprimir, raiz } from "./montar.mjs";
import { capitulos, subtitulo, titulo } from "./plano.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const saidaDir = path.join(raiz, "saida/materiais");
const trabalho = path.join(saidaDir, ".trabalho-arquiteturas");
fs.mkdirSync(trabalho, { recursive: true });

/** Desenho da capa: um monólito que vira módulos, um hexágono, serviços e eventos. */
function desenhoCapa() {
  semear("capa-arquiteturas");
  let s = "";
  // monólito
  s += bloco(20, 60, 120, 200, "", { preench: claro.cinza, gap: 9 });
  s += txt(80, 280, "monólito", { tam: 18 });
  s += seta(150, 160, 205, 160, { espessura: 2.2 });
  // monólito modular
  s += bloco(215, 60, 120, 200, "", { preench: "#fff", hachura: "solid" });
  ["pedidos", "pagam.", "estoque"].forEach((m, i) => (s += bloco(227, 72 + i * 62, 96, 52, m, { preench: [claro.amarelo, claro.verde, claro.azul][i], tam: 15 })));
  s += txt(275, 280, "módulos", { tam: 18 });
  s += seta(345, 160, 400, 160, { espessura: 2.2 });
  // hexágono
  const cx = 470, cy = 160, r = 62;
  const pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((Math.PI / 3) * i), cy + r * Math.sin((Math.PI / 3) * i)]);
  s += caminho(`M${pts.map((p) => p.join(",")).join(" L")} Z`, { preench: claro.amarelo, espessura: 2.4, gap: 8 });
  s += txt(cx, cy, "núcleo", { tam: 16 });
  s += txt(cx, 280, "hexagonal", { tam: 18 });
  s += seta(540, 160, 590, 160, { espessura: 2.2 });
  // microsserviços + eventos
  const sv = [[610, 60], [690, 60], [610, 190], [690, 190]];
  sv.forEach(([x, y], i) => (s += servidor(x, y, 56, 72, "", { preench: [claro.verde, claro.azul, claro.violeta, claro.laranja][i] })));
  s += evento(676, 150, 30);
  s += txt(678, 290, "serviços + eventos", { tam: 18 });
  s += nuvem(560, -10, 120, 60, "", { preench: claro.ciano });
  return quadro(760, 300, s);
}

const capaHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css(fonte)}
body { margin: 0; }
.capa { width: 210mm; height: 297mm; padding: 24mm 20mm 18mm; display: flex; flex-direction: column; background: #fbfbf8;
  background-image: radial-gradient(#d9d9d2 1.1px, transparent 1.1px); background-size: 9mm 9mm; }
.capa .rotulo { font-family: "Excali"; font-size: 17pt; color: var(--acento); }
.capa h1 { font-size: 52pt; line-height: 1; letter-spacing: -0.04em; margin: 6mm 0 6mm; }
.capa h1 span { background: linear-gradient(transparent 62%, #ffec99 62%); }
.capa .sub { font-size: 15pt; color: var(--suave); max-width: 155mm; line-height: 1.4; }
.capa figure { margin: auto 0; }
.capa figure svg { max-height: 80mm; }
.capa .rodape { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10pt; color: var(--suave); border-top: 1pt solid var(--tinta); padding-top: 5mm; }
.capa .rodape b { color: var(--tinta); }
.capa .autora { text-align: right; line-height: 1.35; }
.capa .autora span { display: block; font-family: "Excali"; font-size: 13pt; color: var(--acento); }
.capa .autora b { display: block; font-size: 15pt; letter-spacing: -0.01em; }
</style></head><body><div class="capa">
<div class="rotulo">o guia completo · do monólito aos microsserviços</div>
<h1>${titulo.replace("Software", "<span>Software</span>")}</h1>
<div class="sub">${subtitulo}.</div>
<figure>${desenhoCapa()}</figure>
<div class="rodape"><div><b>${capitulos.length} capítulos em 5 partes</b><br>camadas, hexagonal, clean, monólito modular,<br>microsserviços, serverless, eventos, CQRS e mais</div><div class="autora"><span>por</span><b>${AUTORA}</b>${PERFIL}</div></div>
</div></body></html>`;

const caps = await carregar();
const faltam = caps.filter((c) => c.falta);
if (faltam.length) console.warn(`atenção: ${faltam.length} capítulo(s) ainda sem arquivo: ${faltam.map((c) => c.n).join(", ")}`);

const navegador = await chromium.launch();
const capaPdf = path.join(trabalho, "capa.pdf");
const corpoPdf = path.join(trabalho, "corpo.pdf");
await imprimir(navegador, capaHtml, capaPdf, false);

// 1ª passada: descobre a página de cada capítulo pelas marcas invisíveis
await imprimir(navegador, corpoHtml(caps, { marcas: true }), corpoPdf, true);
const texto = execFileSync("pdftotext", ["-raw", corpoPdf, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const paginas = {};
texto.split("\f").forEach((t, i) => {
  for (const m of t.matchAll(/QQCAP(\d+)QQ/g)) paginas[Number(m[1])] ??= i + 1;
});
// 2ª passada: sumário com os números certos
await imprimir(navegador, corpoHtml(caps, { paginas }), corpoPdf, true);
await navegador.close();

const destino = path.join(saidaDir, "arquitetura-de-software.pdf");
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
w.add_metadata({"/Title": sys.argv[4], "/Author": sys.argv[5], "/Subject": "Guia de arquiteturas de software"})
with open(sys.argv[3], "wb") as o:
    w.write(o)
`,
  capaPdf,
  corpoPdf,
  destino,
  `${titulo}: ${subtitulo}`,
  AUTORA,
]);
const total = texto.split("\f").filter((t) => t.trim()).length + 1;
console.log(`PDF pronto: ${path.relative(raiz, destino)} (${total} páginas)`);
for (const c of capitulos) console.log(`  ${String(c.n).padStart(2)}  p.${paginas[c.n] ?? "?"}  ${c.titulo}${caps.find((x) => x.n === c.n)?.falta ? "  [falta]" : ""}`);
