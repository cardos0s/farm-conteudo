// Grava a tela de um site no Chromium (screencast do DevTools em alta resolução) e registra cada
// movimento do mouse, clique e digitação, para a montagem no Remotion desenhar o cursor e a câmera.
//
// Uso:
//   node scripts/telas/gravar.mjs <cena.mjs> [--saida pasta] [--cdp http://127.0.0.1:9222]
//        [--largura 1600] [--altura 900] [--escala 2] [--fps 60] [--perfil pasta] [--manter-quadros]
//
// Sem --cdp, abre um Chromium próprio com o perfil em --perfil (padrão ~/.cache/telas-perfil),
// então o login feito uma vez fica salvo. Com --cdp, usa um Chromium que já está aberto; para gravar
// em 2x, esse Chromium precisa ter sido aberto com --force-device-scale-factor=2.
//
// A cena é um módulo ES:
//   export default {
//     nome: "campanhas-publico",
//     url: "https://app.selloop.com.br/atendimento",   // aberta antes de começar a gravar
//     antes: async (page) => {},                        // opcional, antes de abrir a página
//     preparar: async (page) => {},                     // opcional, fora da gravação
//     gravar: async (g, page) => {                      // tudo aqui é gravado
//       await g.clicar("button:has-text('Campanhas')");
//       await g.digitar("input[placeholder*='Pesquisar']", "Promoção");
//     },
//   };
//
// Saída em <saida>/<nome>/: tela.mp4 (fps fixo) e eventos.json (tempos em segundos, posições em px CSS).

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { caixaDe } from "./caixa.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

function argumentos(argv) {
  const a = { cena: null, saida: "saida/telas", largura: 1600, altura: 900, escala: 2, fps: 60, cdp: null, manter: false };
  a.perfil = path.join(os.homedir(), ".cache", "telas-perfil");
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    const prox = () => argv[++i];
    if (v === "--saida") a.saida = prox();
    else if (v === "--largura") a.largura = Number(prox());
    else if (v === "--altura") a.altura = Number(prox());
    else if (v === "--escala") a.escala = Number(prox());
    else if (v === "--fps") a.fps = Number(prox());
    else if (v === "--cdp") a.cdp = prox();
    else if (v === "--perfil") a.perfil = prox();
    else if (v === "--manter-quadros") a.manter = true;
    else if (!a.cena) a.cena = v;
  }
  if (!a.cena) {
    console.error("Uso: node scripts/telas/gravar.mjs <cena.mjs> [--saida pasta] [--cdp url] [--largura 1600] [--altura 900] [--escala 2] [--fps 60]");
    process.exit(1);
  }
  return a;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const suave = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const prender = (v, a, b) => Math.min(b, Math.max(a, v));

async function abrirNavegador(a) {
  if (a.cdp) {
    const browser = await chromium.connectOverCDP(a.cdp);
    const ctx = browser.contexts()[0];
    const page = await ctx.newPage();
    return { page, ctx, fechar: () => page.close() };
  }
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const ctx = await chromium.launchPersistentContext(a.perfil, {
    headless: true,
    viewport: { width: a.largura, height: a.altura },
    deviceScaleFactor: a.escala,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    proxy,
    // Idioma do sistema em português: campos de data nativos aparecem como dd/mm/aaaa.
    env: { ...process.env, LANG: "pt_BR.UTF-8", LANGUAGE: "pt_BR:pt", LC_ALL: "pt_BR.UTF-8" },
    // Sem este flag o screencast do Chromium headless entrega os quadros em 1x, mesmo com escala 2.
    args: ["--hide-scrollbars", "--lang=pt-BR", `--force-device-scale-factor=${a.escala}`],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  return { page, ctx, fechar: () => ctx.close() };
}

async function principal() {
  const a = argumentos(process.argv.slice(2));
  const cena = (await import(pathToFileURL(path.resolve(a.cena)).href)).default;
  const pasta = path.resolve(a.saida, cena.nome);
  const pastaQuadros = path.join(pasta, "quadros");
  fs.rmSync(pastaQuadros, { recursive: true, force: true });
  fs.mkdirSync(pastaQuadros, { recursive: true });

  const { page, ctx, fechar } = await abrirNavegador(a);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: a.largura, height: a.altura, deviceScaleFactor: a.escala, mobile: false });
  await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/Sao_Paulo" }).catch(() => {});

  // `antes` roda antes de abrir a página (ex.: instalar um servidor de demonstração).
  if (cena.antes) await cena.antes(page);
  if (cena.url) await page.goto(cena.url, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => console.warn("Aviso:", e.message));
  if (cena.preparar) await cena.preparar(page);
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await dormir(800);

  // Cursor começa fora do centro, como alguém que acabou de pegar o mouse.
  const mouse = { x: Math.round(a.largura * 0.62), y: Math.round(a.altura * 0.58) };
  await page.mouse.move(mouse.x, mouse.y);

  // ── Gravação ────────────────────────────────────────────────────────────────
  const quadros = [];
  const gravacoes = [];
  let n = 0;
  let t0 = null;
  cdp.on("Page.screencastFrame", (f) => {
    const agora = Date.now() / 1000;
    if (t0 === null) t0 = agora;
    const nome = `q${String(++n).padStart(6, "0")}.jpg`;
    quadros.push({ nome, t: (f.metadata?.timestamp ?? agora) });
    gravacoes.push(fs.promises.writeFile(path.join(pastaQuadros, nome), Buffer.from(f.data, "base64")));
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const inicio = Date.now() / 1000;
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: a.largura * a.escala,
    maxHeight: a.altura * a.escala,
    everyNthFrame: 1,
  });
  const rel = () => Date.now() / 1000 - inicio;
  const eventos = [{ t: 0, tipo: "mouse", x: mouse.x, y: mouse.y }];

  async function ponto(alvo) {
    if (alvo && typeof alvo === "object" && "x" in alvo && "y" in alvo && !alvo.locator) return { x: alvo.x, y: alvo.y, caixa: null };
    const loc = typeof alvo === "string" ? page.locator(alvo).first() : alvo;
    await loc.waitFor({ state: "visible", timeout: 15000 });
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Sem posição na tela: ${alvo}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, caixa: { x: b.x, y: b.y, w: b.width, h: b.height } };
  }

  const g = {
    page,
    rel,
    /** Move o mouse em curva suave até o alvo (seletor, locator ou {x, y}). */
    async mover(alvo, { dur } = {}) {
      const p = await ponto(alvo);
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      const duracao = dur ?? prender(0.35 + dist / 1700, 0.35, 1.1);
      if (dist > 1) {
        // ponto de controle deslocado para o lado: o caminho faz um arco leve, como uma mão
        const cx = mouse.x + dx / 2 - dy * 0.08;
        const cy = mouse.y + dy / 2 + dx * 0.08;
        const passos = Math.max(8, Math.round(duracao * 60));
        const comeco = Date.now();
        const [x0, y0] = [mouse.x, mouse.y];
        for (let i = 1; i <= passos; i++) {
          const k = suave(i / passos);
          const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * p.x;
          const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cy + k * k * p.y;
          await page.mouse.move(x, y);
          eventos.push({ t: rel(), tipo: "mouse", x: +x.toFixed(1), y: +y.toFixed(1) });
          const falta = comeco + (duracao * 1000 * i) / passos - Date.now();
          if (falta > 0) await dormir(falta);
        }
      }
      mouse.x = p.x;
      mouse.y = p.y;
      return p;
    },
    /** Move e clica. `depois` é a pausa após o clique (ms). */
    async clicar(alvo, { dur, depois = 450 } = {}) {
      const p = await g.mover(alvo, { dur });
      await dormir(90);
      eventos.push({ t: rel(), tipo: "clique", x: p.x, y: p.y, caixa: p.caixa });
      await page.mouse.down();
      await dormir(70);
      await page.mouse.up();
      await dormir(depois);
      return p;
    },
    /**
     * Escolhe uma opção de um <select> nativo. O cursor vai até ele e o clique fica registrado, mas a
     * lista nativa (que não sai na gravação e prende o teclado) não abre: a opção é aplicada direto.
     */
    async escolher(alvo, opcao, { depois = 500 } = {}) {
      const p = await g.mover(alvo);
      await dormir(90);
      eventos.push({ t: rel(), tipo: "clique", x: p.x, y: p.y, caixa: p.caixa });
      const loc = typeof alvo === "string" ? page.locator(alvo).first() : alvo;
      await loc.selectOption(opcao);
      await dormir(depois);
      return p;
    },
    /** Clica no campo (se houver alvo) e digita no ritmo de uma pessoa. */
    async digitar(alvo, texto, { cps = 16 } = {}) {
      let caixa = null;
      if (alvo) caixa = (await g.clicar(alvo, { depois: 200 })).caixa;
      eventos.push({ t: rel(), tipo: "digitar", texto, caixa });
      for (const ch of texto) {
        await page.keyboard.type(ch);
        await dormir((1000 / cps) * (0.6 + Math.random() * 0.8));
      }
      eventos.push({ t: rel(), tipo: "digitado" });
      await dormir(250);
    },
    /** Rola a página (ou o elemento sob o mouse) suavemente. */
    async rolar(dy, { dur = 0.9 } = {}) {
      const passos = Math.max(6, Math.round(dur * 30));
      eventos.push({ t: rel(), tipo: "rolar", dy });
      for (let i = 0; i < passos; i++) {
        await page.mouse.wheel(0, dy / passos);
        await dormir((dur * 1000) / passos);
      }
      await dormir(200);
    },
    async esperar(ms) {
      await dormir(ms);
    },
    /** Marca um instante com nome (para sincronizar locução e sobreposições). */
    marca(nome) {
      eventos.push({ t: rel(), tipo: "marca", nome });
    },
    /** Registra a caixa de um elemento como sugestão de enquadramento, sem mexer o mouse. */
    async foco(alvo, nome) {
      const p = await ponto(alvo);
      eventos.push({ t: rel(), tipo: "foco", nome, caixa: p.caixa });
      return p;
    },
    /**
     * Marca um elemento (ou vários, pela caixa que envolve todos) que a montagem pode destacar da tela.
     * Aqui só registra quando e onde ele está; a imagem em alta resolução sai de scripts/telas/recortar.mjs.
     */
    async recorte(alvo, nome, { margem = 0, dentro = null } = {}) {
      const caixa = await caixaDe(page, alvo, margem, dentro);
      eventos.push({ t: rel(), tipo: "recorte", nome, caixa });
      return caixa;
    },
  };

  let erro = null;
  try {
    await dormir(500);
    await cena.gravar(g, page);
    await dormir(700);
  } catch (e) {
    erro = e;
    console.error("Erro durante a gravação:", e.message);
  }
  const fim = rel();
  await cdp.send("Page.stopScreencast").catch(() => {});
  await dormir(300);
  await Promise.all(gravacoes);
  await fechar();

  if (!quadros.length) throw new Error("Nenhum quadro gravado.");
  // Tempos dos quadros no mesmo relógio dos eventos.
  for (const q of quadros) q.t = Math.max(0, q.t - inicio);

  // ── Vídeo com fps fixo ──────────────────────────────────────────────────────
  const lista = [];
  for (let i = 0; i < quadros.length; i++) {
    const prox = i + 1 < quadros.length ? quadros[i + 1].t : fim;
    const dur = Math.max(1 / a.fps, prox - quadros[i].t);
    lista.push(`file 'quadros/${quadros[i].nome}'`, `duration ${dur.toFixed(4)}`);
  }
  lista.push(`file 'quadros/${quadros.at(-1).nome}'`);
  fs.writeFileSync(path.join(pasta, "quadros.txt"), lista.join("\n"));
  // O primeiro quadro chega alguns ms depois do início: o vídeo começa nele.
  const desloc = quadros[0].t;
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "quadros.txt", "-vf", `fps=${a.fps},format=yuv420p`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-movflags", "+faststart", "tela.mp4"],
    { cwd: pasta, stdio: "inherit" },
  );
  if (r.status !== 0) throw new Error("ffmpeg falhou ao montar o vídeo.");

  const saidaEventos = {
    cena: cena.nome,
    largura: a.largura,
    altura: a.altura,
    escala: a.escala,
    fps: a.fps,
    duracao: +(fim - desloc).toFixed(3),
    eventos: eventos.map((e) => ({ ...e, t: +Math.max(0, e.t - desloc).toFixed(3) })),
  };
  fs.writeFileSync(path.join(pasta, "eventos.json"), JSON.stringify(saidaEventos, null, 1));
  if (!a.manter) fs.rmSync(pastaQuadros, { recursive: true, force: true });
  fs.rmSync(path.join(pasta, "quadros.txt"), { force: true });

  const cliques = eventos.filter((e) => e.tipo === "clique").length;
  console.log(`Gravado: ${path.join(pasta, "tela.mp4")} · ${saidaEventos.duracao.toFixed(1)} s · ${quadros.length} quadros · ${cliques} cliques`);
  if (erro) process.exitCode = 1;
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
