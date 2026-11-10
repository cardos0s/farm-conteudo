// Monta o HTML do ebook de arquiteturas (usado pelo gerar.mjs e pela previa.mjs).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { css } from "./estilo.mjs";
import { arquivoDo, capitulos, partes, rotuloDo, titulo } from "./plano.mjs";

export const aqui = path.dirname(fileURLToPath(import.meta.url));
export const raiz = path.resolve(aqui, "../..");
export const fonte = pathToFileURL(path.join(raiz, "public/fontes/Excalifont-Regular.woff2")).href;
export const AUTORA = process.env.AUTORA ?? "Julia Cardoso";
export const PERFIL = process.env.PERFIL ?? "@juliacardoso.dev";

const dois = (n) => String(n).padStart(2, "0");

/** Carrega o HTML de cada capítulo (os que ainda não existem viram um aviso). */
export async function carregar(lista = capitulos) {
  const out = [];
  for (const c of lista) {
    const arq = path.join(aqui, arquivoDo(c));
    if (!fs.existsSync(arq)) {
      out.push({ ...c, html: `<p class="lead">(capítulo ainda não escrito: ${arquivoDo(c)})</p>`, falta: true });
      continue;
    }
    const mod = await import(`${pathToFileURL(arq).href}?v=${fs.statSync(arq).mtimeMs}`);
    out.push({ ...c, html: mod.default });
  }
  return out;
}

const cabecalho = (c, marcas) =>
  `<h2 class="cap" data-cap="${c.n}">${marcas ? `<span class="marca">QQCAP${c.n}QQ</span>` : ""}<span class="num">${c.apendice ? "apêndice" : `capítulo ${dois(c.n)}`} <span class="pt">· parte ${c.parte}</span></span>${c.titulo}</h2>`;

const aberturaParte = (p, caps) =>
  `<section class="parte"><div class="pn">parte ${p.id}</div><h2>${p.titulo}</h2><p>${p.descricao}</p><ol>${caps
    .map((c) => `<li><span>${rotuloDo(c)}</span>${c.titulo}</li>`)
    .join("")}</ol></section>`;

/** HTML do miolo. `paginas` = número da página de cada capítulo (para o sumário); `sumario`/`partes` ligam e desligam essas páginas. */
export function corpoHtml(caps, { paginas = {}, marcas = false, sumario = true, comPartes = true } = {}) {
  let html = "";
  if (sumario) {
    html += `<section class="sumario"><h2>Sumário</h2>`;
    for (const p of partes) {
      const doP = capitulos.filter((c) => c.parte === p.id);
      html += `<div class="sp-parte">parte ${p.id} · ${p.titulo}</div><ol>${doP
        .map((c) => `<li><span class="sn">${rotuloDo(c)}</span><span class="st">${c.titulo}</span><span class="spg">${paginas[c.n] ?? "00"}</span></li>`)
        .join("")}</ol>`;
    }
    html += `</section>`;
  }
  let parteAtual = null;
  for (const c of caps) {
    if (comPartes && c.parte !== parteAtual) {
      parteAtual = c.parte;
      html += aberturaParte(
        partes.find((p) => p.id === c.parte),
        capitulos.filter((x) => x.parte === c.parte),
      );
    }
    html += `<section class="capitulo">${cabecalho(c, marcas)}${c.html}</section>`;
  }
  if (sumario)
    html += `<div class="fim"><div class="grande">agora é com você!</div><p class="frase">Comece simples, escolha pelo contexto, registre o porquê e evolua aos poucos.</p><p><b>${AUTORA}</b> · ${PERFIL}</p></div>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title><style>${css(fonte)}</style></head><body>${html}</body></html>`;
}

export const rodape = `<div style="font-family: Inter, sans-serif; font-size: 7.5pt; color: #868e96; width: 100%; padding: 0 17mm; display: flex; justify-content: space-between;">
<span>${titulo} · ${AUTORA}</span><span>${PERFIL} · <span class="pageNumber"></span></span></div>`;

export async function imprimir(navegador, html, arquivo, comRodape) {
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
