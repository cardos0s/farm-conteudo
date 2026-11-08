import { ret, elipse, linha, curva, caminho, seta, txt, check, xis, passo, celular, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 2, cena "Quando você abre o WhatsApp": o celular se conecta a um servidor, a conexão fica
// aberta como uma ligação que não desliga, e existem centenas de servidores porque um só não aguenta.

const E = 3.1; // espessura das formas principais

/** Servidor desenhado: caixa com gavetas, luzinhas e frestas. */
function servidor(x, y, w, h, o = {}) {
  const n = o.gavetas ?? 3;
  const esp = o.espessura ?? E;
  let s = ret(x, y, w, h, { preench: o.preench ?? claro.azul, gap: o.gap ?? 9, cor: o.cor, espessura: esp });
  const m = Math.max(6, w * 0.08);
  const gh = (h - m * (n + 1)) / n;
  const luz = Math.max(8, Math.min(16, gh * 0.28));
  for (let i = 0; i < n; i++) {
    const gy = y + m + i * (gh + m);
    s += ret(x + m, gy, w - 2 * m, gh, { preench: "#ffffff", hachura: "solid", cor: o.cor, espessura: esp * 0.8 });
    const cy = gy + gh / 2;
    s += elipse(x + m + luz * 1.3, cy, luz, luz, { preench: o.luz ?? cor.verde, hachura: "solid", cor: o.luz ?? cor.verde, espessura: 1.6 });
    if (w > 110) s += elipse(x + m + luz * 3.1, cy, luz, luz, { preench: o.luz ?? cor.verde, hachura: "solid", cor: o.luz ?? cor.verde, espessura: 1.6 });
    const fx = x + m + luz * (w > 110 ? 4.6 : 2.6);
    s += linha([[fx, cy - gh * 0.16], [x + w - m * 2, cy - gh * 0.16]], { espessura: esp * 0.6, cor: o.cor });
    if (gh > 30) s += linha([[fx, cy + gh * 0.16], [x + w - m * 2, cy + gh * 0.16]], { espessura: esp * 0.6, cor: o.cor });
  }
  return s;
}

/** Celularzinho (para a multidão). */
function mini(cx, cy) {
  let s = ret(cx - 19, cy - 30, 38, 60, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
  s += ret(cx - 12, cy - 18, 24, 14, { preench: claro.verde, hachura: "solid", espessura: 1.8 });
  s += linha([[cx - 6, cy + 20], [cx + 6, cy + 20]], { espessura: 2.2 });
  return s;
}

/** Fio de telefone enrolado (cicloide com laços), de (x1, y) a (x2, y). */
function fio(x1, x2, y, o = {}) {
  const lacos = o.lacos ?? 9;
  const a = o.a ?? 16; // tamanho do laço
  const b = o.b ?? 34; // altura do fio
  const ini = x1 + 18, fim = x2 - 18;
  const k = (fim - ini) / (2 * Math.PI * lacos);
  const pts = [[x1, y]];
  const N = lacos * 14;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * 2 * Math.PI * lacos;
    pts.push([ini + k * t - a * Math.sin(t), y + (b / 2) * Math.cos(t)]);
  }
  pts.push([x2, y]);
  return curva(pts, { cor: o.cor ?? cor.verde, espessura: o.espessura ?? E });
}

/** Xis e certinho mais grossos que os do diagramas.mjs. */
const xisG = (x, y, t, c = cor.vermelho, e = 6) =>
  linha([[x - t / 2, y - t / 2], [x + t / 2, y + t / 2]], { cor: c, espessura: e }) +
  linha([[x + t / 2, y - t / 2], [x - t / 2, y + t / 2]], { cor: c, espessura: e });
const checkG = (x, y, t, c = cor.verde, e = 5) =>
  linha([[x - t * 0.5, y], [x - t * 0.1, y + t * 0.4], [x + t * 0.6, y - t * 0.5]], { cor: c, espessura: e });

export function conexao() {
  semear("conexao");
  let s = "";

  // ---------------------------------------------------------------- 0: você abre o WhatsApp
  {
    let c = "";
    const px = 40, py = 40, pw = 150, ph = 280;
    c += ret(px, py, pw, ph, { preench: "#ffffff", hachura: "solid", espessura: 3.4 });
    c += linha([[px + 55, py + 16], [px + 95, py + 16]], { espessura: 3 });
    // tela do WhatsApp: barra verde e balões
    c += ret(px + 12, py + 32, pw - 24, 30, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 2 });
    c += ret(px + 20, py + 80, 84, 32, { preench: claro.cinza, hachura: "solid", espessura: 2.4 });
    c += ret(px + 46, py + 128, 84, 32, { preench: claro.verde, hachura: "solid", espessura: 2.4 });
    c += check(px + 104, py + 145, 11, cor.azul) + check(px + 114, py + 145, 11, cor.azul);
    c += ret(px + 20, py + 176, 70, 32, { preench: claro.cinza, hachura: "solid", espessura: 2.4 });
    c += elipse(px + pw / 2, py + ph - 26, 24, 24, { espessura: 2.4 });
    c += txt(px + pw / 2, 356, "você", { tam: 38 });
    s += etapa(0, c);
  }

  // ---------------------------------------------------------------- 1: o celular se conecta (sinal)
  {
    let c = "";
    const cx = 210, cy = 112;
    c += elipse(cx, cy, 12, 12, { preench: cor.azul, hachura: "solid", cor: cor.azul, espessura: 1.6 });
    for (const r of [24, 44, 64]) {
      const a0 = -0.85, a1 = 0.85;
      c += caminho(
        `M${(cx + r * Math.cos(a0)).toFixed(1)},${(cy + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(cx + r * Math.cos(a1)).toFixed(1)},${(cy + r * Math.sin(a1)).toFixed(1)}`,
        { cor: cor.azul, espessura: 3.2 },
      );
    }
    s += etapa(1, c);
  }

  // ---------------------------------------------------------------- 2: computador da empresa
  {
    let c = "";
    c += servidor(710, 92, 190, 226);
    c += linha([[730, 318], [730, 334]], { espessura: E }) + linha([[880, 318], [880, 334]], { espessura: E });
    // selo verde da empresa (balãozinho do app)
    c += caminho("M780,74 L770,92 L796,80 Z", { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 2.4 });
    c += elipse(805, 54, 74, 54, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 2.4 });
    c += elipse(789, 54, 8, 8, { preench: "#ffffff", hachura: "solid", cor: "#ffffff", espessura: 1 });
    c += elipse(805, 54, 8, 8, { preench: "#ffffff", hachura: "solid", cor: "#ffffff", espessura: 1 });
    c += elipse(821, 54, 8, 8, { preench: "#ffffff", hachura: "solid", cor: "#ffffff", espessura: 1 });
    s += etapa(2, c);
  }

  // ---------------------------------------------------------------- 3: que a gente chama de servidor
  s += etapa(3, txt(805, 364, "servidor", { tam: 42, cor: cor.azul }) + curva([[722, 392], [800, 386], [888, 392]], { cor: cor.azul, espessura: 2.8 }));

  // ---------------------------------------------------------------- 4: a conexão fica aberta (fio)
  {
    let c = "";
    c += fio(192, 708, 236, { lacos: 10, a: 17, b: 40 });
    c += elipse(192, 236, 16, 16, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.8 });
    c += elipse(708, 236, 16, 16, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.8 });
    c += txt(450, 300, "conexão aberta", { tam: 36, cor: cor.verde });
    s += etapa(4, c);
  }

  // ---------------------------------------------------------------- 5: como uma ligação que não desliga
  {
    let c = "";
    // fone de telefone antigo
    const hx = 392, hy = 132, k = 1.35;
    const P = (dx, dy) => `${(hx + dx * k).toFixed(1)},${(hy + dy * k).toFixed(1)}`;
    c += caminho(
      `M${P(-46, -4)} C${P(-30, -36)} ${P(30, -36)} ${P(46, -4)} L${P(34, 8)} C${P(18, -12)} ${P(-18, -12)} ${P(-34, 8)} Z`,
      { preench: cor.tinta, hachura: "solid", espessura: 2.6 },
    );
    c += ret(hx - 58 * k, hy - 4 * k, 28 * k, 18 * k, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
    c += ret(hx + 30 * k, hy - 4 * k, 28 * k, 18 * k, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
    // ondinhas de som
    c += curva([[hx - 26, hy - 64], [hx, hy - 74], [hx + 26, hy - 64]], { cor: cor.verde, espessura: 3 });
    c += curva([[hx - 42, hy - 84], [hx, hy - 98], [hx + 42, hy - 84]], { cor: cor.verde, espessura: 3 });
    c += txt(482, 136, "não desliga", { tam: 38, ancora: "start" });
    s += etapa(5, c);
  }

  // ---------------------------------------------------------------- 6: existem centenas desses servidores
  {
    let c = "";
    const x0 = 512, y0 = 434, w = 64, h = 80, gx = 18, gy = 16;
    for (let r = 0; r < 2; r++)
      for (let q = 0; q < 5; q++) c += servidor(x0 + q * (w + gx), y0 + r * (h + gy), w, h, { gavetas: 2, espessura: 2.6, gap: 8 });
    c += txt(x0 + 5 * (w + gx) - 8, y0 + h + gy / 2 + 2, "…", { tam: 44, ancora: "start" });
    c += txt(694, 646, "centenas", { tam: 42, cor: cor.azul });
    c += checkG(812, 646, 34);
    s += etapa(6, c);
  }

  // ---------------------------------------------------------------- 7: um só não aguenta todo mundo
  {
    let c = "";
    const sx = 245, sy = 556;
    c += linha([[484, 430], [484, 668]], { cor: cor.cinza, espessura: 2.2, tracejado: true });
    // celulares em volta, todos ligados no mesmo servidor
    const pos = [[130, 468], [56, 522], [130, 568], [56, 624], [158, 640], [360, 468], [434, 522], [360, 568], [434, 624], [332, 640]];
    for (const [px, py] of pos) {
      const esq = px < sx;
      const x1 = esq ? px + 19 : px - 19;
      const x2 = esq ? sx - 48 : sx + 48;
      const y2 = Math.min(sy + 56, Math.max(sy - 50, sy + (py - sy) * 0.55));
      c += linha([[x1, py], [x2, y2]], { cor: cor.tinta, espessura: 2.4 });
    }
    c += servidor(sx - 48, sy - 64, 96, 128, { preench: claro.vermelho, luz: cor.vermelho, gavetas: 3, espessura: 2.8 });
    for (const [px, py] of pos) c += mini(px, py);
    // tremendo de tanto peso
    c += linha([[sx - 30, sy - 92], [sx - 38, sy - 76]], { cor: cor.vermelho, espessura: 3 });
    c += linha([[sx, sy - 98], [sx, sy - 78]], { cor: cor.vermelho, espessura: 3 });
    c += linha([[sx + 30, sy - 92], [sx + 38, sy - 76]], { cor: cor.vermelho, espessura: 3 });
    c += xisG(sx, sy, 110, cor.vermelho, 7);
    c += txt(sx, 410, "1 só", { tam: 42, cor: cor.vermelho });
    s += etapa(7, c);
  }

  return svg(968, 690, s);
}
