// Diagramas do PDF desenhados à mão com roughjs (o mesmo motor da lousa das aulas).
// Cada função devolve um <svg> pronto para colar no HTML. As sementes são fixas, então o
// traço sai igual a cada geração.

import rough from "roughjs/bundled/rough.esm.js";

const gen = rough.generator();

export const cor = {
  tinta: "#1e1e1e",
  cinza: "#868e96",
  vermelho: "#e03131",
  verde: "#2f9e44",
  azul: "#1971c2",
  laranja: "#e8590c",
  violeta: "#6741d9",
  ciano: "#0c8599",
};
export const claro = {
  vermelho: "#ffc9c9",
  verde: "#b2f2bb",
  azul: "#a5d8ff",
  amarelo: "#ffec99",
  violeta: "#d0bfff",
  ciano: "#99e9f2",
  cinza: "#e9ecef",
  laranja: "#ffd8a8",
};

let semente = 7;
/** Cada diagrama começa de uma semente fixa (derivada do nome), para o traço sair igual não importa
 *  em que ordem os desenhos são gerados (o render do vídeo usa várias abas em paralelo). */
function semear(nome) {
  let h = 2166136261;
  for (const c of nome) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  semente = (Math.abs(h) % 100000) + 1;
}
const base = (o = {}) => ({
  roughness: 1.1,
  bowing: 1,
  stroke: o.cor ?? cor.tinta,
  strokeWidth: o.espessura ?? 1.7,
  fill: o.preench,
  fillStyle: o.hachura ?? "hachure",
  hachureGap: o.gap ?? 5,
  fillWeight: 1.1,
  strokeLineDash: o.tracejado ? [7, 6] : undefined,
  seed: semente++,
});

function paths(d) {
  return gen
    .toPaths(d)
    .map(
      (p) =>
        `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill ?? "none"}"${
          d.options.strokeLineDash && p.fill === "none" ? ` stroke-dasharray="${d.options.strokeLineDash.join(" ")}"` : ""
        } stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Texto manuscrito. Quebras de linha com \n. */
export function txt(x, y, s, o = {}) {
  semear("txt");
  const tam = o.tam ?? 19;
  const linhas = String(s).split("\n");
  const y0 = y - ((linhas.length - 1) * tam * 1.15) / 2;
  return linhas
    .map(
      (l, i) =>
        `<text x="${x}" y="${y0 + i * tam * 1.15}" font-family="Excali" font-size="${tam}" fill="${o.cor ?? cor.tinta}" text-anchor="${
          o.ancora ?? "middle"
        }" dominant-baseline="middle"${o.peso ? ` font-weight="${o.peso}"` : ""}>${esc(l)}</text>`,
    )
    .join("");
}

export const ret = (x, y, w, h, o = {}) => paths(gen.rectangle(x, y, w, h, base(o)));
export const elipse = (cx, cy, w, h, o = {}) => paths(gen.ellipse(cx, cy, w, h, base(o)));
export const linha = (pts, o = {}) => paths(gen.linearPath(pts, base(o)));
export const curva = (pts, o = {}) => paths(gen.curve(pts, base(o)));
export const caminho = (d, o = {}) => paths(gen.path(d, base(o)));

/** Caixa com rótulo centralizado (e uma legenda menor opcional embaixo). */
export function caixa(x, y, w, h, rotulo, o = {}) {
  semear("caixa");
  const sub = o.sub ? txt(x + w / 2, y + h / 2 + 15, o.sub, { tam: 14, cor: cor.cinza }) : "";
  return (
    ret(x, y, w, h, { preench: o.preench, cor: o.cor, hachura: o.hachura, tracejado: o.tracejado }) +
    txt(x + w / 2, y + h / 2 - (o.sub ? 8 : 0), rotulo, { tam: o.tam ?? 18, cor: o.corTexto })
  );
}

/** Banco de dados (cilindro em pé). */
export function banco(x, y, w, h, rotulo, o = {}) {
  semear("banco");
  const ry = 9;
  return (
    paths(
      gen.path(
        `M${x},${y + ry} L${x},${y + h - ry} A${w / 2},${ry} 0 0 0 ${x + w},${y + h - ry} L${x + w},${y + ry}`,
        base({ preench: o.preench }),
      ),
    ) +
    elipse(x + w / 2, y + ry, w, ry * 2, { preench: "#ffffff", hachura: "solid" }) +
    txt(x + w / 2, y + h / 2 + 6, rotulo, { tam: o.tam ?? 16 })
  );
}

/** Fila (cilindro deitado com divisórias). */
export function fila(x, y, w, h, rotulo, o = {}) {
  semear("fila");
  let s = ret(x, y, w, h, { preench: o.preench ?? claro.laranja });
  for (let i = 1; i < 5; i++) s += linha([[x + (w * i) / 5, y + 4], [x + (w * i) / 5, y + h - 4]], { espessura: 1.1 });
  return s + txt(x + w / 2, y + h + 16, rotulo, { tam: 16 });
}

/** Seta reta com ponta; rótulo opcional perto do meio. */
export function seta(x1, y1, x2, y2, o = {}) {
  semear("seta");
  const a = Math.atan2(y2 - y1, x2 - x1);
  const k = o.ponta ?? 13;
  const p1 = [x2 - k * Math.cos(a - 0.45), y2 - k * Math.sin(a - 0.45)];
  const p2 = [x2 - k * Math.cos(a + 0.45), y2 - k * Math.sin(a + 0.45)];
  const st = { cor: o.cor, espessura: o.espessura ?? 1.7, tracejado: o.tracejado };
  let s = linha([[x1, y1], [x2, y2]], st) + linha([p1, [x2, y2], p2], { ...st, tracejado: false });
  if (o.duplo) {
    const q1 = [x1 + k * Math.cos(a - 0.45), y1 + k * Math.sin(a - 0.45)];
    const q2 = [x1 + k * Math.cos(a + 0.45), y1 + k * Math.sin(a + 0.45)];
    s += linha([q1, [x1, y1], q2], { ...st, tracejado: false });
  }
  if (o.rotulo) {
    const mx = (x1 + x2) / 2 + (o.dx ?? 0);
    const my = (y1 + y2) / 2 + (o.dy ?? -14);
    s += txt(mx, my, o.rotulo, { tam: o.tam ?? 15, cor: o.corRotulo ?? o.cor ?? cor.tinta, ancora: o.ancora });
  }
  return s;
}

/** Número numa bolinha (passos de um fluxo). */
export const passo = (x, y, n, c = cor.azul) =>
  elipse(x, y, 26, 26, { preench: c, hachura: "solid", cor: c }) + txt(x, y + 1, n, { tam: 15, cor: "#fff" });

export const check = (x, y, s = 18, c = cor.verde) =>
  linha([[x - s * 0.5, y], [x - s * 0.1, y + s * 0.4], [x + s * 0.6, y - s * 0.5]], { cor: c, espessura: 2.6 });
export const xis = (x, y, s = 16, c = cor.vermelho) =>
  linha([[x - s / 2, y - s / 2], [x + s / 2, y + s / 2]], { cor: c, espessura: 2.6 }) +
  linha([[x + s / 2, y - s / 2], [x - s / 2, y + s / 2]], { cor: c, espessura: 2.6 });

/** Celular estilizado com balões. */
function celular(x, y, nome, baloes = []) {
  let s = ret(x, y, 90, 160, { preench: "#ffffff", hachura: "solid" });
  s += linha([[x + 32, y + 12], [x + 58, y + 12]], { espessura: 2 });
  baloes.forEach((b, i) => {
    const by = y + 32 + i * 34;
    const bx = b.lado === "d" ? x + 30 : x + 8;
    s += ret(bx, by, 52, 24, { preench: b.lado === "d" ? claro.verde : claro.cinza, hachura: "solid" });
    if (b.tique) s += txt(bx + 40, by + 13, b.tique, { tam: 11, cor: b.azul ? cor.azul : cor.cinza });
  });
  return s + txt(x + 45, y + 185, nome, { tam: 18 });
}

const svg = (w, h, corpo) =>
  `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="diagrama">${corpo}</svg>`;

/* ------------------------------------------------------------------ diagramas */

export function capa() {
  semear("capa");
  let s = celular(30, 40, "A", [{ lado: "d", tique: "✓✓", azul: true }, { lado: "e" }, { lado: "d", tique: "✓" }]);
  s += celular(480, 40, "B", [{ lado: "e" }, { lado: "d", tique: "✓✓" }, { lado: "e" }]);
  s += caixa(225, 70, 150, 56, "servidor\nde chat", { preench: claro.azul });
  s += banco(258, 160, 84, 70, "mensagens", { preench: claro.violeta });
  s += seta(122, 98, 222, 98, { cor: cor.verde, duplo: true });
  s += seta(378, 98, 478, 98, { cor: cor.verde, duplo: true });
  s += linha([[300, 126], [300, 158]], { tracejado: true });
  return svg(600, 250, s);
}

export function tempoReal() {
  semear("tempoReal");
  let s = "";
  const col = (x, titulo) =>
    txt(x + 95, 22, titulo, { tam: 21 }) +
    txt(x + 10, 52, "app", { tam: 15, cor: cor.cinza }) +
    txt(x + 180, 52, "servidor", { tam: 15, cor: cor.cinza }) +
    linha([[x + 10, 66], [x + 10, 330]], { cor: cor.cinza, espessura: 1.2 }) +
    linha([[x + 180, 66], [x + 180, 330]], { cor: cor.cinza, espessura: 1.2 });
  // polling
  s += col(0, "polling");
  for (let i = 0; i < 5; i++) {
    const y = 80 + i * 50;
    s += seta(10, y, 180, y + 12, { espessura: 1.3, ponta: 9 });
    s += seta(180, y + 20, 10, y + 32, { espessura: 1.3, ponta: 9, cor: i === 3 ? cor.verde : cor.cinza });
    s += i === 3 ? check(100, y + 40, 14) : txt(100, y + 41, "nada", { tam: 12, cor: cor.cinza });
  }
  // long polling
  s += col(230, "long polling");
  s += seta(240, 80, 410, 92, { espessura: 1.3, ponta: 9 });
  s += linha([[410, 96], [410, 190]], { cor: cor.laranja, espessura: 3, tracejado: true });
  s += txt(440, 145, "segura", { tam: 13, cor: cor.laranja, ancora: "start" });
  s += seta(410, 195, 240, 207, { espessura: 1.3, ponta: 9, cor: cor.verde });
  s += seta(240, 222, 410, 234, { espessura: 1.3, ponta: 9 });
  s += linha([[410, 238], [410, 310]], { cor: cor.laranja, espessura: 3, tracejado: true });
  s += txt(325, 262, "abre de novo", { tam: 12, cor: cor.cinza });
  // websocket
  s += col(460, "WebSocket");
  s += seta(470, 80, 640, 92, { espessura: 1.3, ponta: 9, rotulo: "upgrade", tam: 12, dy: -10 });
  s += ret(470, 108, 170, 214, { preench: claro.verde, gap: 9 });
  [[0, 1], [1, 0], [1, 0], [0, 1], [1, 0]].forEach(([de], i) => {
    const y = 135 + i * 40;
    s += de ? seta(640, y, 470, y + 8, { ponta: 9, espessura: 1.4 }) : seta(470, y, 640, y + 8, { ponta: 9, espessura: 1.4 });
  });
  s += txt(555, 345, "uma conexão, dois sentidos", { tam: 14, cor: cor.verde });
  return svg(660, 360, s);
}

export function arquitetura() {
  semear("arquitetura");
  let s = "";
  // cliente e entrada
  s += celular(10, 150, "app", [{ lado: "d", tique: "✓✓" }, { lado: "e" }]);
  s += caixa(150, 195, 120, 64, "balancea-\ndor", { preench: claro.cinza });
  s += seta(102, 227, 148, 227, {});
  // servidores de chat
  for (let i = 0; i < 3; i++) s += ret(320 + i * 8, 150 + i * 8, 140, 64, { preench: "#fff", hachura: "solid" });
  s += ret(336, 166, 140, 64, { preench: claro.azul });
  s += txt(406, 198, "servidores\nde chat", { tam: 17 });
  s += txt(406, 252, "WebSocket, com estado", { tam: 13, cor: cor.cinza });
  s += seta(272, 222, 318, 205, {});
  // api
  s += caixa(320, 300, 156, 58, "servidores de API", { preench: claro.cinza, sub: "REST, sem estado", tam: 16 });
  s += seta(272, 240, 318, 318, {});
  // cache
  s += caixa(330, 30, 150, 64, "cache de\nconexões", { preench: claro.vermelho, tam: 17 });
  s += txt(405, 110, "Redis", { tam: 13, cor: cor.cinza });
  s += linha([[406, 96], [406, 148]], { tracejado: true });
  // fila e armazenamento
  s += fila(540, 175, 120, 40, "fila (Kafka)");
  s += seta(480, 196, 538, 196, {});
  s += caixa(710, 166, 120, 58, "armazena-\nmento", { preench: claro.violeta, tam: 16 });
  s += seta(662, 196, 708, 196, {});
  s += banco(870, 160, 90, 78, "Cassandra", { preench: claro.violeta, tam: 15 });
  s += seta(832, 196, 868, 196, {});
  // notificação
  s += caixa(540, 40, 130, 56, "notificação", { preench: claro.amarelo, tam: 16 });
  s += seta(600, 172, 600, 98, {});
  s += caixa(720, 40, 110, 56, "FCM / APNs", { tam: 15 });
  s += seta(672, 68, 718, 68, {});
  s += curva([[780, 38], [600, 10], [80, 40], [55, 145]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  s += txt(210, 48, "push no celular", { tam: 13, cor: cor.cinza });
  // grupos
  s += caixa(540, 300, 130, 56, "grupos", { preench: claro.ciano, tam: 16 });
  s += seta(478, 328, 538, 328, {});
  s += banco(720, 290, 100, 74, "PostgreSQL", { preench: claro.ciano, tam: 14 });
  s += seta(672, 328, 718, 328, {});
  // mídia
  s += caixa(320, 420, 156, 56, "mídia", { preench: claro.verde, tam: 16, sub: "URL de upload" });
  s += seta(80, 340, 318, 440, { rotulo: "1. pede URL", dy: 12, dx: -20, tam: 13 });
  s += banco(560, 405, 100, 80, "objetos\n(S3)", { preench: claro.verde, tam: 14 });
  s += seta(478, 448, 558, 448, {});
  s += curva([[60, 345], [150, 520], [450, 525], [556, 470]], { cor: cor.verde, espessura: 1.5 });
  s += txt(300, 540, "2. envia o arquivo direto", { tam: 13, cor: cor.verde });
  s += elipse(780, 445, 130, 70, { preench: claro.amarelo, gap: 8 });
  s += txt(780, 445, "CDN", { tam: 18 });
  s += seta(662, 445, 713, 445, {});
  s += txt(780, 500, "download perto de quem recebe", { tam: 13, cor: cor.cinza });
  return svg(970, 560, s);
}

export function caminhoMensagem(L = {}) {
  semear("caminhoMensagem");
  let s = "";
  const xs = { A: 75, SA: 262, Q: 450, C: 620, SB: 790, B: 970 };
  const nomes = { A: "A", SA: "servidor A", Q: "fila", C: "cache", SB: "servidor B", B: "B", ...L.nomes };
  const fill = { A: claro.verde, SA: claro.azul, Q: claro.laranja, C: claro.vermelho, SB: claro.azul, B: claro.verde };
  for (const k of Object.keys(xs)) {
    s += caixa(xs[k] - 66, 6, 132, 52, nomes[k], { preench: fill[k], tam: nomes[k].includes("\n") ? 15 : 16 });
    s += linha([[xs[k], 56], [xs[k], 560]], { cor: cor.cinza, espessura: 1, tracejado: true });
  }
  const msg = (n, de, para, y, rotulo, o = {}) => {
    const x1 = xs[de], x2 = xs[para];
    return seta(x1, y, x2, y, { rotulo, tam: 14, ...o }) + passo(x1 + (x1 < x2 ? 20 : -20), y - 17, n);
  };
  s += msg(1, "A", "SA", 100, L.m1 ?? "\"oi\" (id do cliente)");
  s += msg(2, "SA", "Q", 150, L.m2 ?? "grava");
  s += seta(xs.Q, 180, xs.SA, 180, { rotulo: L.ok ?? "ok, gravado", tam: 13, cor: cor.cinza });
  s += msg(3, "SA", "A", 220, L.m3 ?? "✓ enviada", { cor: cor.verde });
  s += msg(4, "SA", "C", 270, L.m4 ?? "onde está o B?");
  s += seta(xs.C, 300, xs.SA, 300, { rotulo: L.resp ?? "servidor B", tam: 13, cor: cor.cinza });
  s += msg(5, "SA", "SB", 350, L.m5 ?? "repassa");
  s += msg(6, "SB", "B", 400, L.m6 ?? "entrega");
  s += msg(7, "B", "SB", 450, L.m7 ?? "recebi");
  s += seta(xs.SB, 480, xs.SA, 480, { rotulo: L.volta ?? "entregue", tam: 13 });
  s += msg(8, "SA", "A", 520, "✓✓ entregue", { cor: cor.verde });
  if (L.nota !== null) s += txt(xs.Q, 540, L.nota ?? "(o status também vai para a fila)", { tam: 12, cor: cor.cinza });
  return svg(1045, 570, s);
}

export function tiques() {
  semear("tiques");
  let s = "";
  const est = [
    ["relógio", "pendente", claro.cinza, "só no celular de A"],
    ["✓", "enviada", claro.amarelo, "o servidor gravou"],
    ["✓✓", "entregue", claro.verde, "chegou no celular de B"],
    ["✓✓", "lida", claro.azul, "B abriu a conversa"],
  ];
  est.forEach(([ic, nome, f, sub], i) => {
    const x = 10 + i * 205;
    s += caixa(x, 30, 160, 70, nome, { preench: f, tam: 20 });
    s += txt(x + 80, 125, sub, { tam: 14, cor: cor.cinza });
    s += txt(x + 80, 14, ic, { tam: 16, cor: i === 3 ? cor.azul : cor.cinza });
    if (i < 3) s += seta(x + 162, 65, x + 203, 65, {});
  });
  s += txt(420, 165, "o status só anda para a frente: um \"entregue\" atrasado não desfaz um \"lida\"", { tam: 14, cor: cor.vermelho });
  return svg(830, 180, s);
}

export function presenca() {
  semear("presenca");
  let s = "";
  s += linha([[30, 90], [780, 90]], { cor: cor.cinza });
  for (let i = 0; i < 6; i++) {
    const x = 50 + i * 90;
    s += linha([[x, 70], [x, 110]], { cor: cor.verde, espessura: 2.4 });
    s += txt(x, 130, `${i * 30}s`, { tam: 13, cor: cor.cinza });
  }
  s += txt(275, 40, "heartbeat a cada 30 s: online", { tam: 16, cor: cor.verde });
  s += xis(545, 90, 18);
  s += txt(545, 50, "conexão caiu", { tam: 14, cor: cor.vermelho });
  s += ret(545, 150, 180, 40, { preench: claro.cinza });
  s += txt(635, 170, "visto por último 10:42", { tam: 14 });
  s += seta(545, 100, 600, 148, {});
  s += txt(200, 175, "sem heartbeat por ~60 s também vira offline", { tam: 14, cor: cor.cinza });
  return svg(800, 205, s);
}

export function grupos(L = {}) {
  semear("grupos");
  let s = "";
  s += caixa(20, 120, 100, 56, "A", { preench: claro.verde, tam: 20 });
  s += caixa(170, 120, 120, 56, "servidor A", { preench: claro.azul, tam: 16 });
  s += seta(122, 148, 168, 148, {});
  s += caixa(170, 10, 120, 50, "grupos", { preench: claro.ciano, tam: 16 });
  s += seta(230, 118, 230, 62, { rotulo: L.membros ?? "membros?", dx: 42, dy: 0, tam: 13, duplo: true });
  for (let i = 0; i < 7; i++) {
    const y = 20 + i * 42;
    const on = i !== 2 && i !== 5;
    s += elipse(520, y + 12, 26, 26, { preench: on ? claro.verde : claro.cinza, hachura: "solid" });
    s += seta(292, 148, 504, y + 12, { espessura: 1.2, ponta: 9, cor: on ? cor.tinta : cor.cinza, tracejado: !on });
    s += txt(545, y + 13, on ? (L.on ?? "online: entrega") : (L.off ?? "offline: push + pendente"), { tam: 13, ancora: "start", cor: on ? cor.tinta : cor.cinza });
  }
  s += txt(370, 325, L.rodape ?? "1 mensagem → N entregas (fan-out)", { tam: 17, cor: cor.vermelho });
  return svg(720, 340, s);
}

export function midia() {
  semear("midia");
  let s = "";
  s += celular(10, 40, "A", [{ lado: "d" }]);
  s += caixa(220, 20, 140, 52, "serviço\nde mídia", { preench: claro.verde, tam: 15 });
  s += seta(102, 70, 218, 46, { rotulo: "1. quero enviar (hash, tamanho)", tam: 12, dy: -16 });
  s += seta(218, 62, 102, 86, { rotulo: "2. URL de upload", tam: 12, dy: 14, cor: cor.cinza });
  s += banco(430, 110, 110, 86, "objetos", { preench: claro.verde, tam: 16 });
  s += seta(102, 140, 428, 150, { rotulo: "3. sobe o arquivo cifrado", tam: 13, cor: cor.verde });
  s += caixa(220, 230, 140, 52, "servidor\nde chat", { preench: claro.azul, tam: 15 });
  s += seta(102, 200, 218, 250, { rotulo: "4. mensagem com o link", tam: 12, dy: 20, dx: -20 });
  s += elipse(690, 152, 120, 64, { preench: claro.amarelo, gap: 8 });
  s += txt(690, 152, "CDN", { tam: 18 });
  s += seta(542, 152, 628, 152, {});
  s += celular(790, 70, "B", [{ lado: "e" }]);
  s += seta(752, 152, 788, 152, { rotulo: "5. baixa", tam: 12 });
  s += seta(362, 256, 788, 200, { rotulo: "link chega pelo WebSocket", tam: 12, cor: cor.cinza, dy: 14 });
  return svg(900, 300, s);
}

export function snowflake() {
  semear("snowflake");
  let s = "";
  const blocos = [
    [1, "", claro.cinza],
    [41, "tempo em ms (41 bits)", claro.azul],
    [10, "máquina (10)", claro.verde],
    [12, "sequência (12)", claro.laranja],
  ];
  let x = 10;
  const u = 12;
  for (const [n, rotulo, f] of blocos) {
    s += ret(x, 30, n * u, 50, { preench: f, gap: 6 });
    if (rotulo) s += txt(x + (n * u) / 2, 105, rotulo, { tam: 15 });
    x += n * u;
  }
  s += txt(16, 18, "sinal", { tam: 11, cor: cor.cinza });
  s += txt(268, 140, "~69 anos", { tam: 13, cor: cor.cinza });
  s += txt(568, 140, "1.024 máquinas", { tam: 13, cor: cor.cinza });
  s += txt(712, 140, "4.096 por ms", { tam: 13, cor: cor.cinza });
  return svg(790, 155, s);
}

export function particoes(L = {}) {
  semear("particoes");
  let s = "";
  s += txt(200, 18, L.certo ?? "partição = conversa", { tam: 18, cor: cor.verde });
  s += check(320, 18, 16);
  for (let i = 0; i < 3; i++) {
    const x = 20 + i * 125;
    s += banco(x, 40, 105, 150, "", { preench: claro.violeta });
    const cores = [claro.verde, claro.amarelo, claro.azul][i];
    for (let k = 0; k < 4; k++) s += ret(x + 15, 70 + k * 26, 75, 18, { preench: cores, hachura: "solid" });
    s += txt(x + 52, 210, ["conversa 1", "conversa 2", "conversa 3"][i], { tam: 13, cor: cor.cinza });
  }
  s += txt(610, 18, L.errado ?? "partição = id da mensagem", { tam: 18, cor: cor.vermelho });
  s += xis(770, 18, 14);
  const mix = [claro.verde, claro.amarelo, claro.azul];
  for (let i = 0; i < 3; i++) {
    const x = 450 + i * 125;
    s += banco(x, 40, 105, 150, "", { preench: claro.violeta });
    for (let k = 0; k < 4; k++) s += ret(x + 15, 70 + k * 26, 75, 18, { preench: mix[(i + k) % 3], hachura: "solid" });
  }
  s += txt(640, 210, L.custo ?? "abrir 1 conversa = perguntar a todos", { tam: 13, cor: cor.cinza });
  return svg(840, 225, s);
}

export function reconexao(L = {}) {
  semear("reconexao");
  let s = "";
  for (let i = 0; i < 3; i++) {
    const x = 30 + i * 170;
    s += caixa(x, 20, 130, 54, `servidor ${i + 1}`, { preench: i === 1 ? claro.vermelho : claro.azul, tam: 16 });
  }
  s += xis(265, 47, 40);
  for (let k = 0; k < 4; k++) {
    const x = 220 + k * 30;
    s += elipse(x, 150, 20, 20, { preench: claro.verde, hachura: "solid" });
    s += curva([[x, 138], [x + (k < 2 ? -60 : 60), 110], [k < 2 ? 95 : 435, 78]], { espessura: 1.2, cor: cor.cinza });
  }
  s += txt(265, 190, "reconectam em outros servidores", { tam: 14, cor: cor.cinza });
  const esperas = ["1 s", "2 s", "4 s", "8 s", "16 s"];
  esperas.forEach((e, i) => {
    s += ret(580 + i * 38, 160 - i * 26, 36, 26 + i * 26, { preench: claro.amarelo, gap: 6 });
    s += txt(598 + i * 38, 200, e, { tam: 12 });
  });
  s += txt(670, 30, L.espera ?? "espera crescente\n+ um pouco de sorteio", { tam: 15 });
  return svg(790, 215, s);
}

/* ------------------------------------------------------------ versões para leigos (Reels) */

export const caminhoLeigo = () =>
  caminhoMensagem({
    nomes: { A: "Ana", SA: "servidor\nda Ana", Q: "lugar\nseguro", C: "recepção", SB: "servidor\ndo Bruno", B: "Bruno" },
    m1: "\"oi\"",
    m2: "anota",
    ok: "anotado",
    m3: "✓ guardei",
    m4: "onde está o Bruno?",
    resp: "sala 40",
    m5: "passa a mensagem",
    m6: "entrega",
    m7: "chegou",
    volta: "chegou",
    nota: null,
  });
export const gruposLeigo = () =>
  grupos({ membros: "quem está?", on: "app aberto: recebe na hora", off: "fechado: notificação", rodape: "1 mensagem → 1 cópia para cada pessoa" });
export const particoesLeigo = () => particoes({ certo: "uma gaveta por conversa", errado: "mensagens soltas", custo: "procura em todas as gavetas" });
export const reconexaoLeigo = () => reconexao({ espera: "espera um pouquinho,\ndepois um pouco mais" });

/* ------------------------------------------------------------ intro gravada (tela cheia 1080x1920) */

/** Rabiscos que se desenham atrás da Julia na intro: o banco de mensagens à direita, a seta que sai
 *  de trás dela e o fluxo tracejado. Coordenadas da tela do Reel (1080x1920). */
export function introRabiscos() {
  semear("introRabiscos");
  const e = 3.4; // traço mais grosso: o desenho ocupa a tela inteira
  const o = (x = {}) => ({ espessura: e, gap: 11, ...x });
  let s = "";
  // banco de mensagens embaixo à direita
  const bx = 884, by = 1030, bw = 170, bh = 140, ry = 18;
  s += paths(gen.path(`M${bx},${by + ry} L${bx},${by + bh - ry} A${bw / 2},${ry} 0 0 0 ${bx + bw},${by + bh - ry} L${bx + bw},${by + ry}`, base(o({ preench: claro.violeta }))));
  s += elipse(bx + bw / 2, by + ry, bw, ry * 2, o({ preench: "#ffffff", hachura: "solid" }));
  s += txt(bx + bw / 2, by + bh + 30, "mensagens", { tam: 32 });
  // seta que sai de trás dela e chega no banco
  s += seta(650, 1000, 876, 1080, { espessura: e, ponta: 22, cor: cor.tinta });
  // fluxo tracejado por trás, de um lado ao outro
  s += curva([[150, 1060], [420, 1010], [700, 960], [960, 1000]], { espessura: 2.6, cor: cor.cinza, tracejado: true });
  return svg(1080, 1920, s);
}
