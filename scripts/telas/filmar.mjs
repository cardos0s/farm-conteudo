// Filma a tela de um site quadro a quadro, como um renderizador: o relógio da página anda exatamente
// 1/fps por quadro, as animações CSS andam junto e cada quadro é fotografado só depois de pronto.
// O resultado não depende da velocidade da máquina: todo quadro do vídeo é um instante diferente e
// igualmente espaçado da tela, sem os quadros repetidos de uma gravação em tempo real
// (scripts/telas/gravar.mjs, que continua valendo para as cenas antigas).
//
// Uso:
//   node scripts/telas/filmar.mjs <cena.mjs> [--saida pasta] [--largura 1600] [--altura 900] [--escala 2]
//        [--fps 60] [--perfil pasta] [--previa] [--ensaio] [--manter-quadros]
//
//   --previa   meia resolução e JPEG leve, para conferir o andamento da cena sem esperar a filmagem
//   --ensaio   não fotografa: só roda a cena no relógio do filme e escreve eventos.json
//
// A cena é o mesmo módulo do gravador (nome, url, antes, preparar, gravar). `antes(page, motor)` recebe
// o relógio do filme: motor.depois(ms, fn) agenda no tempo da página e motor.decorrido() diz quantos ms
// da página já passaram, para um servidor de demonstração responder no mesmo relógio.
//
// Como funciona:
//   - o relógio da página (Date, setTimeout, requestAnimationFrame, performance.now) é o do Playwright
//     (page.clock), parado; cada quadro chama clock.runFor(1000/fps);
//   - as animações e transições CSS ficam com a linha do tempo parada (Animation.setPlaybackRate 0) e
//     cada quadro avança o currentTime de todas elas no mesmo passo;
//   - o mouse anda um ponto por quadro; as rolagens (g.rolar e a ida até um alvo fora da vista), um
//     pedaço por quadro;
//   - a "bomba" de quadros roda sem parar enquanto a cena executa: esperar 300 ms é esperar 18 quadros.
//
// Saída em <saida>/<nome>/: tela.mp4 (um quadro do vídeo por quadro filmado) e eventos.json, no formato
// do gravador, mais `parados` (trechos em que a imagem não muda: bons lugares para cortar ou segurar).

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
  const a = { cena: null, saida: "saida/filme", largura: 1600, altura: 900, escala: 2, fps: 60, previa: false, ensaio: false, manter: false };
  a.perfil = path.join(os.homedir(), ".cache", "telas-perfil");
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    const prox = () => argv[++i];
    if (v === "--saida") a.saida = prox();
    else if (v === "--largura") a.largura = Number(prox());
    else if (v === "--altura") a.altura = Number(prox());
    else if (v === "--escala") a.escala = Number(prox());
    else if (v === "--fps") a.fps = Number(prox());
    else if (v === "--perfil") a.perfil = prox();
    else if (v === "--previa") a.previa = true;
    else if (v === "--ensaio") a.ensaio = true;
    else if (v === "--manter-quadros") a.manter = true;
    else if (!a.cena) a.cena = v;
  }
  if (!a.cena) {
    console.error("Uso: node scripts/telas/filmar.mjs <cena.mjs> [--saida pasta] [--previa] [--ensaio] [--largura 1600] [--altura 900] [--escala 2] [--fps 60]");
    process.exit(1);
  }
  if (a.previa) a.escala = 1;
  return a;
}

const prender = (v, a, b) => Math.min(b, Math.max(a, v));
/** Aceleração e freada naturais de uma mão (curva de menor solavanco). */
const mao = (k) => k * k * k * (10 - 15 * k + 6 * k * k);
/** Números "ao acaso" sempre iguais, para a digitação sair igual a cada filmagem. */
function acaso(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dentro da página: avança as animações CSS um passo (elas ficam com a linha do tempo parada).
const NA_PAGINA = `(() => {
  if (window.__filme) return;
  const vistas = new WeakSet();
  window.__filme = {
    passo(dt) {
      let n = 0;
      for (const a of document.getAnimations()) {
        try {
          // a primeira vez que aparece, a animação fica no começo: é o quadro em que ela nasce
          if (!vistas.has(a)) { vistas.add(a); continue; }
          if (a.playState !== "running") continue;
          const atual = typeof a.currentTime === "number" ? a.currentTime : 0;
          a.currentTime = atual + dt * (a.playbackRate || 1);
          n++;
        } catch {}
      }
      return n;
    },
  };
})();`;

// O cursor de texto pisca no relógio real do navegador, fora do nosso controle: some na filmagem.
const ESTILO = "*, *::before, *::after { caret-color: transparent !important; }";

/** O antecessor que rola (na vertical) de um elemento da página. */
async function painelQueRola(page, alvo) {
  const loc = typeof alvo === "string" ? page.locator(alvo).first() : alvo;
  await loc.waitFor({ state: "attached", timeout: 60000 });
  const h = await loc.evaluateHandle((el) => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const o = getComputedStyle(e).overflowY;
      if ((o === "auto" || o === "scroll") && e.scrollHeight > e.clientHeight + 1) return e;
    }
    return document.scrollingElement;
  });
  return h.asElement();
}

async function abrirNavegador(a) {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const ctx = await chromium.launchPersistentContext(a.perfil, {
    headless: true,
    viewport: { width: a.largura, height: a.altura },
    deviceScaleFactor: a.escala,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    proxy,
    env: { ...process.env, LANG: "pt_BR.UTF-8", LANGUAGE: "pt_BR:pt", LC_ALL: "pt_BR.UTF-8" },
    // rolagem sem animação própria do navegador: quem anima a rolagem é o filme, quadro a quadro
    args: ["--hide-scrollbars", "--lang=pt-BR", `--force-device-scale-factor=${a.escala}`, "--disable-smooth-scrolling"],
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
  await ctx.addInitScript(NA_PAGINA);

  // ── Relógio do filme ─────────────────────────────────────────────────────────
  const fps = a.fps;
  // 17 + 17 + 16 ms: a média é exatamente 1/60 s, em passos inteiros
  const passoMs = (q) => (fps === 60 ? [17, 17, 16][q % 3] : 1000 / fps);
  let quadro = 0; // quadros já filmados = índice do próximo
  let msFilmados = 0;
  let filmando = false;
  const abertura = Date.now();
  let msAteFilmar = null;
  const agendados = []; // { em (ms do filme), fn }
  const motor = {
    /** ms da página desde que a cena abriu. */
    decorrido: () => (msAteFilmar === null ? Date.now() - abertura : msAteFilmar + msFilmados),
    /** Agenda no relógio da página (antes da filmagem, no relógio real). */
    depois(ms, fn) {
      if (!filmando) return void setTimeout(fn, ms);
      agendados.push({ em: msFilmados + ms, fn });
    },
  };

  // `antes` roda antes de abrir a página (ex.: instalar um servidor de demonstração).
  if (cena.antes) await cena.antes(page, motor);
  if (cena.url) await page.goto(cena.url, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => console.warn("Aviso:", e.message));
  if (cena.preparar) await cena.preparar(page);
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(800);

  const mouse = { x: Math.round(a.largura * 0.62), y: Math.round(a.altura * 0.58) };
  await page.mouse.move(mouse.x, mouse.y);

  // ── Para o tempo: daqui em diante a página só anda quando o filme manda ──────
  await page.addStyleTag({ content: ESTILO }).catch(() => {});
  await page.evaluate(NA_PAGINA).catch(() => {});
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
  const agoraNaPagina = await page.evaluate(() => Date.now());
  try {
    await page.clock.pauseAt(agoraNaPagina + 20);
  } catch {
    // a cena não instalou o relógio: instala aqui, na hora atual
    await page.clock.install({ time: new Date(agoraNaPagina) });
    await page.clock.pauseAt(agoraNaPagina + 20);
  }
  msAteFilmar = Date.now() - abertura;
  filmando = true;

  const rel = () => quadro / fps;
  const eventos = [{ t: 0, tipo: "mouse", x: mouse.x, y: mouse.y }];
  const mudou = []; // por quadro: a imagem é diferente da anterior?
  const esperas = []; // { quadro, soltar }
  let trajeto = null; // { pontos, i, soltar }
  let rolagem = null; // { partes, i, soltar, painel } (painel: o elemento que rola; sem ele, a roda do mouse)
  let anterior = null;
  let gravando = Promise.resolve();
  let erroDaBomba = null;
  let acabou = false;
  const tempoReal = { passos: 0, ms: 0 };

  async function passo() {
    const ini = Date.now();
    const dt = passoMs(quadro);
    const soltar = [];
    // 1) o que a cena pediu para este quadro
    if (trajeto) {
      const p = trajeto.pontos[trajeto.i++];
      await page.mouse.move(p.x, p.y);
      eventos.push({ t: rel(), tipo: "mouse", x: +p.x.toFixed(1), y: +p.y.toFixed(1) });
      if (trajeto.i >= trajeto.pontos.length) {
        soltar.push(trajeto.soltar);
        trajeto = null;
      }
    }
    if (rolagem) {
      const parte = rolagem.partes[rolagem.i++];
      if (rolagem.painel) await rolagem.painel.evaluate((el, d) => (el.scrollTop += d), parte);
      else await page.mouse.wheel(0, parte);
      if (rolagem.i >= rolagem.partes.length) {
        soltar.push(rolagem.soltar);
        rolagem = null;
      }
    }
    for (let i = agendados.length - 1; i >= 0; i--) {
      if (agendados[i].em <= msFilmados) agendados.splice(i, 1)[0].fn();
    }
    // 2) a página anda um quadro: relógio (timers, requestAnimationFrame) e animações CSS
    await page.clock.runFor(dt);
    await cdp.send("Runtime.evaluate", { expression: `window.__filme ? window.__filme.passo(${dt}) : 0` }).catch(() => {});
    // 3) a foto do quadro
    if (!a.ensaio) {
      const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: a.previa ? 72 : 93, optimizeForSpeed: true });
      mudou.push(data !== anterior);
      anterior = data;
      const nome = `q${String(quadro + 1).padStart(6, "0")}.jpg`;
      const escrita = fs.promises.writeFile(path.join(pastaQuadros, nome), Buffer.from(data, "base64"));
      gravando = gravando.then(() => escrita);
      if (quadro % 30 === 0) await gravando;
    }
    quadro++;
    msFilmados += dt;
    for (let i = esperas.length - 1; i >= 0; i--) {
      if (esperas[i].quadro <= quadro) soltar.push(esperas.splice(i, 1)[0].soltar);
    }
    for (const s of soltar) s();
    tempoReal.passos++;
    tempoReal.ms += Date.now() - ini;
  }

  const bomba = (async () => {
    while (!acabou) {
      try {
        await passo();
      } catch (e) {
        erroDaBomba = e;
        break;
      }
    }
    // ninguém fica esperando um quadro que não vem
    for (const e of esperas.splice(0)) e.soltar();
    trajeto?.soltar();
    rolagem?.soltar();
  })();

  /** Espera passar `ms` de filme (em quadros inteiros). */
  const esperar = (ms) =>
    new Promise((soltar) => {
      if (erroDaBomba || acabou) return soltar();
      esperas.push({ quadro: quadro + Math.max(1, Math.round((ms / 1000) * fps)), soltar });
    });

  /** Rola um painel `dy` px com aceleração e freada, um pedaço por quadro (posições inteiras). */
  function rolarPainel(painel, dy, dur) {
    const n = Math.max(6, Math.round(dur * fps));
    const partes = [];
    let feito = 0;
    for (let i = 1; i <= n; i++) {
      const ate = Math.round(dy * mao(i / n));
      partes.push(ate - feito);
      feito = ate;
    }
    return new Promise((soltar) => {
      rolagem = { partes, i: 0, soltar, painel };
    });
  }

  async function ponto(alvo) {
    if (alvo && typeof alvo === "object" && "x" in alvo && "y" in alvo && !alvo.locator) return { x: alvo.x, y: alvo.y, caixa: null };
    const loc = typeof alvo === "string" ? page.locator(alvo).first() : alvo;
    await loc.waitFor({ state: "visible", timeout: 60000 });
    // fora da vista dentro de um painel que rola? rola até ele com suavidade, em vez de pular
    const falta = await loc
      .evaluate((el) => {
        let p = el.parentElement;
        for (; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowY;
          if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight + 1) break;
        }
        if (!p) return 0;
        const a = el.getBoundingClientRect();
        const b = p.getBoundingClientRect();
        const folga = Math.min(28, Math.max(0, (b.height - a.height) / 2));
        if (a.top < b.top + folga) return Math.max(a.top - b.top - folga, -p.scrollTop);
        if (a.bottom > b.bottom - folga) return Math.min(a.bottom - b.bottom + folga, p.scrollHeight - p.clientHeight - p.scrollTop);
        return 0;
      })
      .catch(() => 0);
    if (Math.abs(falta) > 2) {
      const painel = await painelQueRola(page, loc);
      console.log(`[filme] ${rel().toFixed(2)} s: rola ${Math.round(falta)} px até o alvo`);
      await rolarPainel(painel, Math.round(falta), prender(0.22 + Math.abs(falta) / 1800, 0.25, 0.6));
      await esperar(60);
    }
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Sem posição na tela: ${alvo}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, caixa: { x: b.x, y: b.y, w: b.width, h: b.height } };
  }

  const sorte = acaso(20261110);
  const g = {
    page,
    rel,
    /** Move o mouse em arco suave até o alvo (seletor, locator ou {x, y}), um ponto por quadro. */
    async mover(alvo, { dur } = {}) {
      const p = await ponto(alvo);
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      const duracao = dur ?? prender(0.26 + dist / 2600, 0.28, 0.72);
      if (dist > 1) {
        // ponto de controle deslocado para o lado: o caminho faz um arco leve, como uma mão
        const cx = mouse.x + dx / 2 - dy * 0.1;
        const cy = mouse.y + dy / 2 + dx * 0.1;
        const n = Math.max(6, Math.round(duracao * fps));
        const [x0, y0] = [mouse.x, mouse.y];
        const pontos = [];
        for (let i = 1; i <= n; i++) {
          const k = mao(i / n);
          pontos.push({ x: (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * p.x, y: (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cy + k * k * p.y });
        }
        // o trajeto inteiro (curva e tempos), para a montagem redesenhar o cursor mesmo cortando esperas:
        // em `t` o cursor está em `de`; em `ate`, em `para`
        const sai = (quadro - 1) / fps;
        eventos.push({ t: sai, tipo: "trajeto", ate: sai + n / fps, de: { x: +x0.toFixed(1), y: +y0.toFixed(1) }, c: { x: +cx.toFixed(1), y: +cy.toFixed(1) }, para: { x: +p.x.toFixed(1), y: +p.y.toFixed(1) } });
        await new Promise((soltar) => {
          trajeto = { pontos, i: 0, soltar };
        });
      }
      mouse.x = p.x;
      mouse.y = p.y;
      return p;
    },
    /** Move e clica. `depois` é a pausa após o clique (ms de filme). */
    async clicar(alvo, { dur, depois = 450 } = {}) {
      const p = await g.mover(alvo, { dur });
      await esperar(70);
      eventos.push({ t: rel(), tipo: "clique", x: p.x, y: p.y, caixa: p.caixa });
      await page.mouse.down();
      await esperar(66);
      await page.mouse.up();
      await esperar(depois);
      return p;
    },
    /** Escolhe uma opção de um <select> nativo (a lista nativa não abre: a opção é aplicada direto). */
    async escolher(alvo, opcao, { depois = 500 } = {}) {
      const p = await g.mover(alvo);
      await esperar(70);
      eventos.push({ t: rel(), tipo: "clique", x: p.x, y: p.y, caixa: p.caixa });
      const loc = typeof alvo === "string" ? page.locator(alvo).first() : alvo;
      await loc.selectOption(opcao);
      await esperar(depois);
      return p;
    },
    /** Clica no campo (se houver alvo) e digita no ritmo de uma pessoa. */
    async digitar(alvo, texto, { cps = 16 } = {}) {
      let caixa = null;
      if (alvo) caixa = (await g.clicar(alvo, { depois: 200 })).caixa;
      eventos.push({ t: rel(), tipo: "digitar", texto, caixa });
      for (const ch of texto) {
        await page.keyboard.type(ch);
        await esperar((1000 / cps) * (0.6 + sorte() * 0.8));
      }
      eventos.push({ t: rel(), tipo: "digitado" });
      await esperar(250);
    },
    /**
     * Rola com aceleração e freada, um pedaço por quadro. Sem `em`, é a roda do mouse onde o cursor
     * está. Com `em` (seletor ou locator de algo dentro do painel), rola o próprio painel: o cursor
     * pode ficar fora dele, e nada acende por baixo enquanto a página passa.
     */
    async rolar(dy, { dur = 0.9, em = null } = {}) {
      const painel = em ? await painelQueRola(page, em) : null;
      eventos.push({ t: rel(), tipo: "rolar", dy });
      if (painel) await rolarPainel(painel, dy, dur);
      else {
        const n = Math.max(6, Math.round(dur * fps));
        const partes = [];
        for (let i = 1; i <= n; i++) partes.push(dy * (mao(i / n) - mao((i - 1) / n)));
        await new Promise((soltar) => {
          rolagem = { partes, i: 0, soltar, painel: null };
        });
      }
      await esperar(200);
    },
    esperar,
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
    /** Marca um elemento que a montagem pode destacar da tela (a imagem sai de scripts/telas/recortar.mjs). */
    async recorte(alvo, nome, { margem = 0, dentro = null } = {}) {
      const caixa = await caixaDe(page, alvo, margem, dentro);
      eventos.push({ t: rel(), tipo: "recorte", nome, caixa });
      return caixa;
    },
  };

  let erro = null;
  const inicioReal = Date.now();
  try {
    await esperar(300);
    await cena.gravar(g, page);
    await esperar(500);
  } catch (e) {
    erro = e;
    console.error("Erro durante a filmagem:", e.message);
  }
  acabou = true;
  await bomba;
  await gravando;
  if (erroDaBomba) {
    erro = erro ?? erroDaBomba;
    console.error("Erro na bomba de quadros:", erroDaBomba.message);
  }
  await fechar();
  if (!quadro) throw new Error("Nenhum quadro filmado.");

  // trechos parados (a imagem não muda por pelo menos 3 quadros)
  const parados = [];
  let ini = null;
  for (let i = 1; i <= mudou.length; i++) {
    const igual = i < mudou.length && !mudou[i];
    if (igual && ini === null) ini = i - 1;
    if (!igual && ini !== null) {
      if (i - 1 - ini >= 3) parados.push([+(ini / fps).toFixed(4), +((i - 1) / fps).toFixed(4)]);
      ini = null;
    }
  }

  if (!a.ensaio) {
    // um quadro filmado = um quadro do vídeo; GOP curto, para a montagem pular e segurar quadros sem custo
    const r = spawnSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", "quadros/q%06d.jpg", "-vf", "format=yuv420p",
        "-c:v", "libx264", "-preset", a.previa ? "veryfast" : "medium", "-crf", a.previa ? "22" : "14", "-g", "30", "-movflags", "+faststart", "tela.mp4"],
      { cwd: pasta, stdio: "inherit" },
    );
    if (r.status !== 0) throw new Error("ffmpeg falhou ao montar o vídeo.");
  }

  const saida = {
    cena: cena.nome,
    largura: a.largura,
    altura: a.altura,
    escala: a.escala,
    fps,
    duracao: +(quadro / fps).toFixed(4),
    eventos: eventos.map((e) => ({ ...e, t: +Math.max(0, e.t).toFixed(4), ...(e.ate !== undefined ? { ate: +e.ate.toFixed(4) } : {}) })),
    parados,
  };
  fs.writeFileSync(path.join(pasta, "eventos.json"), JSON.stringify(saida, null, 1));
  if (!a.manter) fs.rmSync(pastaQuadros, { recursive: true, force: true });

  const cliques = eventos.filter((e) => e.tipo === "clique").length;
  const real = (Date.now() - inicioReal) / 1000;
  const novos = mudou.filter(Boolean).length;
  console.log(
    `${a.ensaio ? "Ensaiado" : "Filmado"}: ${cena.nome} · ${saida.duracao.toFixed(1)} s de filme · ${quadro} quadros (${novos} diferentes) · ${cliques} cliques · ` +
      `${real.toFixed(0)} s de relógio (${(tempoReal.ms / Math.max(1, tempoReal.passos)).toFixed(0)} ms por quadro)`,
  );
  if (erro) process.exitCode = 1;
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
