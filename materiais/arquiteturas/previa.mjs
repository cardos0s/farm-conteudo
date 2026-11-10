// Prévia de um ou mais capítulos do ebook de arquiteturas, do jeito que vão sair no PDF.
//
//   node materiais/arquiteturas/previa.mjs <n> [n2 ...] --saida <pasta>
//
// Gera <pasta>/cap-<n>.pdf e PNGs de cada página (<pasta>/cap-<n>-p01.png ...), mais um mosaico
// <pasta>/cap-<n>-mosaico.png com todas as páginas lado a lado, para conferir o layout com a ferramenta Read.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { capitulos } from "./plano.mjs";
import { carregar, corpoHtml, imprimir } from "./montar.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const iSaida = args.indexOf("--saida");
const saida = path.resolve(iSaida >= 0 ? args[iSaida + 1] : "saida/materiais/previa-arquiteturas");
const nums = args.filter((a, i) => i !== iSaida && i !== iSaida + 1).map(Number);
fs.mkdirSync(saida, { recursive: true });

const nav = await chromium.launch();
for (const n of nums) {
  const c = capitulos.find((x) => x.n === n);
  if (!c) throw new Error(`capítulo ${n} não existe no plano`);
  const [cap] = await carregar([c]);
  const pdf = path.join(saida, `cap-${n}.pdf`);
  await imprimir(nav, corpoHtml([cap], { sumario: false, comPartes: false }), pdf, true);
  for (const f of fs.readdirSync(saida)) if (f.startsWith(`cap-${n}-p`) && f.endsWith(".png")) fs.rmSync(path.join(saida, f));
  execFileSync("pdftoppm", ["-r", "70", "-png", pdf, path.join(saida, `cap-${n}-p`)], { stdio: "ignore" });
  const pngs = fs.readdirSync(saida).filter((f) => f.startsWith(`cap-${n}-p`) && f.endsWith(".png")).sort();
  const mosaico = path.join(saida, `cap-${n}-mosaico.png`);
  execFileSync("python3", [
    "-I",
    "-c",
    `
import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).convert("RGB") for f in fs]
w,h=ims[0].size; cols=min(4,len(ims)); rows=(len(ims)+cols-1)//cols
g=Image.new("RGB",(w*cols+8*(cols+1),h*rows+8*(rows+1)),(150,150,150))
for i,im in enumerate(ims): g.paste(im,(8+(i%cols)*(w+8),8+(i//cols)*(h+8)))
g.save(sys.argv[1])
`,
    mosaico,
    ...pngs.map((p) => path.join(saida, p)),
  ]);
  console.log(`cap. ${n} (${c.titulo}): ${pngs.length} página(s) -> ${mosaico}${cap.falta ? " [ARQUIVO AINDA NÃO EXISTE]" : ""}`);
}
await nav.close();
