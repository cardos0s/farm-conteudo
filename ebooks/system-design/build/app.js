(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $(".app");
  const raiz = document.documentElement;

  // armazenamento local: só conveniências (tema, progresso, flashcards); a página funciona sem ele
  const guardar = (k, v) => { try { localStorage.setItem("sd50:" + k, JSON.stringify(v)); } catch (e) {} };
  const ler = (k, padrao) => { try { const v = localStorage.getItem("sd50:" + k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ───────── tema ─────────
  const temaHost = raiz.getAttribute("data-theme");
  const escuroAgora = () => raiz.getAttribute("data-theme") === "dark" || (raiz.getAttribute("data-theme") !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  function aplicarTema(t) {
    if (t === "claro") raiz.setAttribute("data-theme", "light");
    else if (t === "escuro") raiz.setAttribute("data-theme", "dark");
    else if (temaHost) raiz.setAttribute("data-theme", temaHost);
    else raiz.removeAttribute("data-theme");
    $$("[data-tema]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tema === t)));
  }
  let tema = ler("tema", "sistema");
  aplicarTema(tema);
  $$("[data-tema]").forEach((b) => b.addEventListener("click", () => { tema = b.dataset.tema; guardar("tema", tema); aplicarTema(tema); }));
  const botaoTema = $("#botao-tema-barra");
  if (botaoTema) botaoTema.addEventListener("click", () => { tema = escuroAgora() ? "claro" : "escuro"; guardar("tema", tema); aplicarTema(tema); });

  // ───────── tamanho do texto ─────────
  const tamanhos = [0.9375, 1, 1.0625, 1.125, 1.1875, 1.25, 1.3125];
  let fonte = ler("fonte", null);
  const aplicarFonte = () => { if (fonte !== null) app.style.setProperty("--tam", tamanhos[fonte] + "rem"); };
  aplicarFonte();
  $$("[data-fonte]").forEach((b) => b.addEventListener("click", () => {
    const atual = fonte === null ? (innerWidth < 640 ? 2 : 3) : fonte;
    fonte = Math.max(0, Math.min(tamanhos.length - 1, atual + Number(b.dataset.fonte)));
    guardar("fonte", fonte);
    aplicarFonte();
  }));

  // ───────── índice (gaveta no celular) ─────────
  const indice = $("#indice");
  const veu = $("#veu");
  const botaoMenu = $("#botao-menu");
  const largo = () => matchMedia("(min-width: 70rem)").matches;
  function abrirIndice(abrir) {
    indice.classList.toggle("aberto", abrir);
    veu.hidden = !abrir;
    botaoMenu.setAttribute("aria-expanded", String(abrir));
    if (abrir) { const atual = $(".indice-nav a.atual"); if (atual) atual.scrollIntoView({ block: "center" }); }
  }
  botaoMenu.addEventListener("click", () => abrirIndice(!indice.classList.contains("aberto")));
  veu.addEventListener("click", () => abrirIndice(false));
  indice.addEventListener("click", (e) => { if (e.target.closest("a") && !largo()) abrirIndice(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { abrirIndice(false); fecharLupa(); } });

  // ───────── onde estou + barra de progresso ─────────
  const alvos = $$(".livro > section[id], .livro > article[id]");
  const linksNav = new Map($$(".indice-nav a[href^='#']").map((a) => [a.getAttribute("href").slice(1), a]));
  const barraAtual = $("#barra-atual");
  const barraProgresso = $("#progresso-barra");
  let atualId = null;
  let agendado = false;
  function atualizarPosicao() {
    agendado = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    barraProgresso.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + "%";
    let atual = alvos[0];
    for (const el of alvos) { if (el.getBoundingClientRect().top <= 140) atual = el; else break; }
    if (!atual || atual.id === atualId) return;
    atualId = atual.id;
    linksNav.forEach((a) => a.classList.remove("atual"));
    const link = linksNav.get(atualId);
    if (link) {
      link.classList.add("atual");
      if (largo()) { const nav = $("#indice-nav"); const r = link.getBoundingClientRect(); const rn = nav.getBoundingClientRect(); if (r.top < rn.top || r.bottom > rn.bottom) link.scrollIntoView({ block: "center" }); }
    }
    const titulo = atual.querySelector(".cap-titulo, h1");
    const num = atual.dataset.cap;
    barraAtual.textContent = titulo ? (num ? num + " · " : "") + titulo.textContent.trim() : "System Design";
    if (num) guardar("ultimo", atual.id);
  }
  addEventListener("scroll", () => { if (!agendado) { agendado = true; requestAnimationFrame(atualizarPosicao); } }, { passive: true });
  addEventListener("resize", atualizarPosicao);
  atualizarPosicao();

  // continuar de onde parou
  const ultimo = ler("ultimo", null);
  const continuar = $("#capa-continuar");
  const ultimoEl = ultimo && document.getElementById(ultimo);
  if (continuar && ultimoEl && ultimo !== "cap-01") {
    const t = ultimoEl.querySelector(".cap-titulo");
    continuar.innerHTML = 'Continuar de onde parou: <a href="#' + esc(ultimo) + '">capítulo ' + esc(ultimoEl.dataset.cap) + " · " + esc(t ? t.textContent : "") + "</a>";
    continuar.hidden = false;
  }

  // ───────── capítulos estudados ─────────
  const total = $$("article.capitulo").length;
  let estudados = new Set(ler("estudados", []));
  function pintarEstudados() {
    $$("button.estudado").forEach((b) => {
      const feito = estudados.has(Number(b.dataset.cap));
      b.setAttribute("aria-pressed", String(feito));
      b.querySelector("span").textContent = feito ? "Estudado" : "Marcar como estudado";
    });
    $$(".indice-nav a[data-cap]").forEach((a) => a.classList.toggle("feito", estudados.has(Number(a.dataset.cap))));
    $("#estudados-n").textContent = estudados.size;
    $("#estudados-barra").style.width = (total ? (estudados.size / total) * 100 : 0) + "%";
  }
  $$("button.estudado").forEach((b) => b.addEventListener("click", () => {
    const n = Number(b.dataset.cap);
    if (estudados.has(n)) estudados.delete(n); else estudados.add(n);
    guardar("estudados", Array.from(estudados));
    pintarEstudados();
  }));
  pintarEstudados();

  // ───────── busca ─────────
  const normalizar = (s) => Array.from(s, (c) => (c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() || " ")[0]).join("");
  let indiceBusca = null;
  function montarIndiceBusca() {
    indiceBusca = $$(".livro > article.capitulo, .livro > section.pagina").map((el) => {
      const titulo = (el.querySelector(".cap-titulo, h1") || {}).textContent || "";
      const texto = el.textContent.replace(/\s+/g, " ").trim();
      return { id: el.id, cap: el.dataset.cap, titulo: titulo.trim(), tituloN: normalizar(titulo), texto, textoN: normalizar(texto) };
    });
  }
  const busca = $("#busca");
  const resultados = $("#resultados");
  const nav = $("#indice-nav");
  let esperaBusca;
  busca.addEventListener("input", () => { clearTimeout(esperaBusca); esperaBusca = setTimeout(buscar, 120); });
  function buscar() {
    const q = normalizar(busca.value.trim());
    const termos = q.split(/\s+/).filter((t) => t.length >= 2);
    if (!termos.length) { resultados.hidden = true; nav.hidden = false; return; }
    if (!indiceBusca) montarIndiceBusca();
    const achados = [];
    for (const item of indiceBusca) {
      if (!termos.every((t) => item.textoN.includes(t))) continue;
      const noTitulo = termos.every((t) => item.tituloN.includes(t));
      let vezes = 0;
      for (const t of termos) { let i = -1; while ((i = item.textoN.indexOf(t, i + 1)) !== -1 && vezes < 50) vezes++; }
      achados.push({ item, pontos: (noTitulo ? 1000 : 0) + vezes });
    }
    achados.sort((a, b) => b.pontos - a.pontos);
    resultados.innerHTML = achados.length
      ? achados.slice(0, 30).map(({ item }) => {
          const i = item.textoN.indexOf(termos[0]);
          const ini = Math.max(0, i - 50);
          const trecho = item.texto.slice(ini, i + 110);
          let html = esc(trecho);
          const trechoN = normalizar(trecho);
          const marcas = [];
          termos.forEach((t) => { let j = -1; while ((j = trechoN.indexOf(t, j + 1)) !== -1) marcas.push([j, j + t.length]); });
          if (marcas.length) {
            marcas.sort((a, b) => a[0] - b[0]);
            let out = ""; let pos = 0;
            for (const [a, b] of marcas) { if (a < pos) continue; out += esc(trecho.slice(pos, a)) + "<mark>" + esc(trecho.slice(a, b)) + "</mark>"; pos = b; }
            html = out + esc(trecho.slice(pos));
          }
          return '<a class="resultado" href="#' + esc(item.id) + '"><strong>' + (item.cap ? item.cap + " · " : "") + esc(item.titulo) + "</strong><span>" + (ini > 0 ? "…" : "") + html + "…</span></a>";
        }).join("")
      : '<p class="sem-resultado">Nada encontrado para “' + esc(busca.value.trim()) + "”.</p>";
    resultados.hidden = false;
    nav.hidden = true;
  }
  resultados.addEventListener("click", (e) => { if (e.target.closest("a") && !largo()) abrirIndice(false); });

  // ───────── lupa dos diagramas ─────────
  const lupa = $("#lupa");
  let focoAntes = null;
  function fecharLupa() { if (!lupa.hidden) { lupa.hidden = true; $("#lupa-conteudo").innerHTML = ""; document.body.style.overflow = ""; if (focoAntes) focoAntes.focus(); } }
  $$(".lousa-quadro").forEach((q) => {
    q.setAttribute("tabindex", "0");
    q.setAttribute("role", "button");
    q.setAttribute("aria-label", "Ampliar diagrama");
    const abrir = () => {
      focoAntes = q;
      const svg = q.querySelector("svg");
      if (!svg) return;
      $("#lupa-conteudo").appendChild(svg.cloneNode(true));
      const leg = q.closest("figure") && q.closest("figure").querySelector("figcaption");
      $("#lupa-legenda").textContent = leg ? leg.textContent : "";
      lupa.hidden = false;
      document.body.style.overflow = "hidden";
      $("#lupa-fechar").focus();
    };
    q.addEventListener("click", abrir);
    q.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
  });
  $("#lupa-fechar").addEventListener("click", fecharLupa);

  // ───────── flashcards ─────────
  const fcDados = (() => { try { return JSON.parse($("#fc-dados").textContent); } catch (e) { return []; } })();
  if (fcDados.length) {
    const chave = (c) => c.c + ":" + c.q.replace(/<[^>]+>/g, "").slice(0, 60);
    let caixas = ler("fc", {});
    let filtro = 0;
    let atual = null;
    let anterior = null;
    const cartao = $("#fc-cartao");
    const frente = $("#fc-frente");
    const verso = $("#fc-verso");
    const caixa = (c) => caixas[chave(c)] || 0;
    const visiveis = () => fcDados.filter((c) => !filtro || c.p === filtro);
    function proximo() {
      const lista = visiveis();
      const menor = Math.min(...lista.map(caixa));
      let candidatos = lista.filter((c) => caixa(c) === menor && c !== anterior);
      if (!candidatos.length) candidatos = lista;
      atual = candidatos[Math.floor(Math.random() * candidatos.length)];
      mostrar();
    }
    function mostrar() {
      $("#fc-q").innerHTML = atual.q;
      $("#fc-r").innerHTML = atual.r;
      const link = $("#fc-cap");
      link.textContent = "capítulo " + atual.c;
      link.href = "#cap-" + String(atual.c).padStart(2, "0");
      frente.hidden = false;
      verso.hidden = true;
      const lista = visiveis();
      const dominados = lista.filter((c) => caixa(c) >= 3).length;
      const revisar = lista.filter((c) => caixas[chave(c)] === 0).length;
      $("#fc-status").textContent = dominados + " de " + lista.length + " cartões dominados" + (revisar ? " · " + revisar + " para revisar" : "");
    }
    const virar = () => { frente.hidden = !frente.hidden; verso.hidden = !verso.hidden; };
    cartao.addEventListener("click", (e) => { if (!e.target.closest("a")) virar(); });
    cartao.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); virar(); } });
    const responder = (sabia) => {
      const k = chave(atual);
      caixas[k] = sabia ? Math.min(4, (caixas[k] || 0) + 1) : 0;
      guardar("fc", caixas);
      anterior = atual;
      proximo();
    };
    $("#fc-sim").addEventListener("click", () => responder(true));
    $("#fc-nao").addEventListener("click", () => responder(false));
    $$(".fc-filtros .chip").forEach((b) => b.addEventListener("click", () => {
      filtro = Number(b.dataset.parte);
      $$(".fc-filtros .chip").forEach((x) => x.classList.toggle("ativo", x === b));
      anterior = null;
      proximo();
    }));
    $("#fc-zerar").addEventListener("click", () => { caixas = {}; guardar("fc", caixas); proximo(); });
    proximo();
  }

  // ───────── simulado ─────────
  const sim = $("#sim");
  if (sim) {
    const titulosPartes = $$(".in-parte .in-pt").map((e) => e.textContent.trim());
    const resultado = $("#sim-resultado");
    sim.addEventListener("submit", (e) => {
      e.preventDefault();
      const porParte = {};
      const revisar = new Set();
      let acertos = 0;
      const qs = $$(".sim-q", sim);
      qs.forEach((q) => {
        const correta = Number(q.dataset.correta);
        const marcada = q.querySelector("input:checked");
        const valor = marcada ? Number(marcada.value) : -1;
        const alts = $$(".sim-alt", q);
        alts.forEach((a, i) => { a.classList.toggle("certa", i === correta); a.classList.toggle("errada", i === valor && valor !== correta); });
        q.querySelector(".sim-explica").hidden = false;
        const p = Number(q.dataset.parte) || 0;
        porParte[p] = porParte[p] || [0, 0];
        porParte[p][1]++;
        if (valor === correta) { acertos++; porParte[p][0]++; } else (q.dataset.caps || "").split(",").filter(Boolean).forEach((c) => revisar.add(Number(c)));
      });
      const pct = Math.round((acertos / qs.length) * 100);
      const linhas = Object.keys(porParte).filter((p) => p !== "0").sort().map((p) => {
        const [a, t] = porParte[p];
        return '<li><span>Parte ' + p + (titulosPartes[p - 1] ? " · " + esc(titulosPartes[p - 1]) : "") + '</span><span class="medidor"><span style="width:' + Math.round((a / t) * 100) + '%"></span></span><span>' + a + "/" + t + "</span></li>";
      }).join("");
      const caps = Array.from(revisar).sort((a, b) => a - b).map((c) => '<a href="#cap-' + String(c).padStart(2, "0") + '">' + c + "</a>").join(", ");
      resultado.innerHTML = '<p class="rotulo">Resultado</p><p class="sim-nota">' + acertos + "/" + qs.length + "<small>" + pct + "%</small></p>" +
        '<ul class="sim-partes">' + linhas + "</ul>" +
        (caps ? '<p class="sim-revisar">Releia os capítulos ' + caps + ".</p>" : '<p class="sim-revisar">Gabaritou. Agora tente explicar cada resposta sem olhar.</p>');
      resultado.hidden = false;
      guardar("simulado", { acertos, total: qs.length, quando: Date.now() });
      resultado.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("#sim-recomecar").addEventListener("click", () => {
      sim.reset();
      $$(".sim-alt", sim).forEach((a) => a.classList.remove("certa", "errada"));
      $$(".sim-explica", sim).forEach((x) => (x.hidden = true));
      resultado.hidden = true;
      document.getElementById("simulado").scrollIntoView({ behavior: "smooth" });
    });
  }
})();
