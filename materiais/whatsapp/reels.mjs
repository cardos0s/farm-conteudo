// Telas verticais (1080x1920) para a série de Reels do ebook, com os diagramas do PDF.
//
//   npm run pdf:whatsapp && npm run reels:whatsapp
//
// Saída: saida/materiais/reels/*.png em 2160x3840 (proporção 9:16; os nomes batem com a coluna
// "Tela" de REELS.md).
// O topo (~230 px) e a base (~420 px) ficam livres para os botões e a legenda do Instagram.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as D from "./diagramas.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PERFIL = process.env.PERFIL ?? "@juliacardoso.dev";
const PRECO = process.env.PRECO ?? "R$ 15";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");
const saida = path.join(raiz, "saida/materiais/reels");
fs.mkdirSync(saida, { recursive: true });
const fonte = pathToFileURL(path.join(raiz, "public/fontes/Excalifont-Regular.woff2")).href;

// Capa do ebook para a tela de chamada.
const pdf = path.join(raiz, "saida/materiais/system-design-whatsapp.pdf");
if (!fs.existsSync(pdf)) throw new Error("Gere o PDF antes: npm run pdf:whatsapp");
const capaBase = path.join(saida, ".capa");
execFileSync("pdftoppm", ["-r", "110", "-png", "-singlefile", "-f", "1", "-l", "1", pdf, capaBase], { stdio: "ignore" });
const capaPng = pathToFileURL(`${capaBase}.png`).href;

const css = `
@font-face { font-family: "Excali"; src: url("${fonte}") format("woff2"); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1080px; height: 1920px; }
body { font-family: "Inter", sans-serif; color: #1e1e1e; background: #fbfbf8;
  background-image: radial-gradient(#d9d9d2 2px, transparent 2px); background-size: 36px 36px; }
.tela { position: absolute; left: 0; right: 0; top: 230px; bottom: 420px; padding: 0 56px; display: flex; flex-direction: column; }
.rotulo { font-family: "Excali"; font-size: 40px; color: #0b7a6b; }
h1 { font-size: 84px; line-height: 1.02; letter-spacing: -0.035em; margin: 14px 0 0; }
h1 em { font-style: normal; background: linear-gradient(transparent 60%, #ffec99 60%); }
.meio { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.meio svg { width: 100%; height: auto; }
.nota { font-size: 38px; line-height: 1.3; color: #343a40; }
.nota b { color: #1e1e1e; }
.perfil { font-size: 30px; color: #868e96; text-align: right; }
.linhas { display: flex; flex-direction: column; gap: 22px; }
.linha { display: flex; align-items: baseline; gap: 26px; background: #fff; border: 3px solid #1e1e1e; border-radius: 22px; padding: 22px 30px; }
.linha .g { font-size: 70px; font-weight: 800; letter-spacing: -0.03em; min-width: 380px; }
.linha .p { font-size: 34px; color: #495057; line-height: 1.2; }
.linha .p b { color: #1e1e1e; }
.linha.destaque { background: #ffec99; }
.linhas.curta .g { min-width: 150px; }
.linhas.curta .linha { align-items: center; }
.passo { display: flex; align-items: center; gap: 26px; padding: 18px 0; border-bottom: 3px dashed #ced4da; }
.passo .n { font-family: "Excali"; font-size: 64px; color: #0b7a6b; width: 70px; }
.passo .t { flex: 1; font-size: 46px; font-weight: 650; letter-spacing: -0.02em; }
.passo .m { font-size: 36px; color: #868e96; }
.cta { text-align: center; align-items: center; }
.cta img { width: 560px; border-radius: 12px; box-shadow: 0 30px 60px rgba(0,0,0,.18); transform: rotate(-3deg); margin: 30px 0 46px; border: 2px solid #1e1e1e; }
.cta .preco { display: inline-block; font-size: 96px; font-weight: 800; letter-spacing: -0.03em; background: #ffec99; padding: 0 26px; border-radius: 16px; }
.cta .link { font-family: "Excali"; font-size: 64px; color: #0b7a6b; margin-top: 18px; }
.cta .itens { font-size: 34px; color: #495057; margin-top: 26px; line-height: 1.4; }
`;

const tela = (rotulo, titulo, meio, nota = "") => `
<div class="tela">
  <div class="rotulo">${rotulo}</div>
  <h1>${titulo}</h1>
  <div class="meio">${meio}</div>
  ${nota ? `<p class="nota">${nota}</p>` : ""}
  <p class="perfil">${PERFIL}</p>
</div>`;

const parte = (n) => `system design do WhatsApp · parte ${n}/3`;

const telas = {
  "p1-1-roteiro": tela(
    parte(1),
    "O roteiro de <em>45 minutos</em>",
    [
      ["Requisitos", "5 min"],
      ["Estimativas", "5 min"],
      ["API e protocolo", "5 min"],
      ["Arquitetura", "10 min"],
      ["Aprofundar", "15 min"],
      ["Gargalos e falhas", "5 min"],
    ]
      .map(([t, m], i) => `<div class="passo"><span class="n">${i + 1}</span><span class="t">${t}</span><span class="m">${m}</span></div>`)
      .join(""),
    "Primeiro passo: <b>pergunte antes de desenhar.</b>",
  ),
  "p1-2-contas": tela(
    parte(1),
    "As <em>contas</em>",
    `<div class="linhas">
      <div class="linha"><span class="g">5 bi</span><span class="p">mensagens por dia<br>(500 mi pessoas × 10)</span></div>
      <div class="linha"><span class="g">58 mil/s</span><span class="p">em média<br>(÷ 86.400 s)</span></div>
      <div class="linha destaque"><span class="g">175 mil/s</span><span class="p">no pico<br>(× 3)</span></div>
      <div class="linha"><span class="g">5 TB/dia</span><span class="p">≈ 1,8 PB por ano<br>(1 KB por mensagem)</span></div>
      <div class="linha"><span class="g">500</span><span class="p">servidores para<br>50 mi conexões</span></div>
    </div>`,
    "Decisão: <b>banco dividido</b> e uma <b>fila</b> para aguentar o pico.",
  ),
  "p1-3-websocket": tela(parte(1), "Como a mensagem <em>chega</em>?", D.tempoReal(), "WebSocket: <b>uma conexão aberta</b>, e o servidor manda na hora."),
  "p2-1-arquitetura": tela(parte(2), "A <em>arquitetura</em>", D.arquitetura(), "O <b>cache</b> sabe em qual servidor cada pessoa está."),
  "p2-2-caminho": tela(parte(2), "O caminho de <em>uma mensagem</em>", D.caminhoMensagem(), "O ✓ só aparece <b>depois que o servidor grava.</b>"),
  "p2-3-tiques": tela(
    parte(2),
    "O que cada <em>tique</em> quer dizer",
    `<div class="linhas curta">
      <div class="linha"><span class="g" style="color:#868e96">🕓</span><span class="p"><b>pendente</b><br>ainda só no seu celular</span></div>
      <div class="linha"><span class="g" style="color:#868e96">✓</span><span class="p"><b>enviada</b><br>o servidor gravou</span></div>
      <div class="linha"><span class="g" style="color:#868e96">✓✓</span><span class="p"><b>entregue</b><br>chegou no celular da pessoa</span></div>
      <div class="linha destaque"><span class="g" style="color:#1971c2">✓✓</span><span class="p"><b>lida</b><br>ela abriu a conversa</span></div>
    </div>`,
    "Offline? A mensagem fica <b>pendente</b> e vai um push.<br><b>Push é aviso, não é entrega.</b>",
  ),
  "p3-1-grupos": tela(parte(3), "1 mensagem, <em>1.024 entregas</em>", D.grupos(), "Fan-out: é por isso que <b>todo grupo tem limite.</b>"),
  "p3-2-banco": tela(
    parte(3),
    "Como guardar <em>petabytes</em>",
    `${D.particoes()}<div style="height:70px"></div>${D.snowflake()}`,
    "Divida <b>pela conversa</b>. O id começa <b>pelo horário.</b>",
  ),
  "p3-3-falhas": tela(parte(3), "E se um servidor <em>cair</em>?", D.reconexao(), "Reconecta em outro, com <b>espera crescente + sorteio.</b>"),
  cta: `<div class="tela cta"><div class="meio">
    <div class="rotulo">guia completo</div>
    <img src="${capaPng}">
    <div><span class="preco">${PRECO}</span></div>
    <div class="link">link na bio</div>
    <div class="itens">20 páginas · todos os diagramas · contas prontas<br>erros que reprovam · perguntas com resposta</div>
  </div><p class="perfil">${PERFIL}</p></div>`,
};

const navegador = await chromium.launch();
// Escala 2x (2160x3840): dá para dar zoom nos diagramas na edição sem perder nitidez.
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
const tmp = path.join(saida, ".tela.html");
for (const [nome, corpo] of Object.entries(telas)) {
  fs.writeFileSync(tmp, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css}</style></head><body>${corpo}</body></html>`);
  await pagina.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: path.join(saida, `${nome}.png`) });
}
await navegador.close();
fs.rmSync(tmp);
console.log(`${Object.keys(telas).length} telas em ${path.relative(raiz, saida)}/`);
