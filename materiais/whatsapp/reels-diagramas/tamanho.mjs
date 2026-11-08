import { ret, elipse, linha, curva, caminho, seta, txt, check, xis, passo, celular, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 3, cena "Agora pensa no tamanho": à esquerda, a montanha de mensagens (≈ 2 PB por ano, só
// texto); em cima, um computador sozinho transbordando (não cabe); embaixo, a montanha dividida
// entre muitos computadores, que viram as gavetas de um arquivo gigante; e a dúvida: como dividir?

const E = 3.2; // espessura das formas principais

/** Ponto (dx, dy) girado `ang` graus em volta de (cx, cy). */
function gira(cx, cy, ang, dx, dy) {
  const a = (ang * Math.PI) / 180;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

/** Balão de mensagem girado, com duas linhas de "texto" dentro. Centro em (cx, cy). */
function balao(cx, cy, ang, preench, w = 78, h = 50) {
  const p = (dx, dy) => gira(cx, cy, ang, dx, dy);
  const pts = [p(-w / 2, -h / 2), p(w / 2, -h / 2), p(w / 2, h / 2), p(-w / 2, h / 2)];
  const d = `M${pts.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" L")} Z`;
  let s = caminho(d, { preench, hachura: "solid", espessura: 2.6 });
  s += linha([p(-w / 2 + 10, h / 2), p(-w / 2 + 6, h / 2 + 13), p(-w / 2 + 25, h / 2)], { espessura: 2.4 });
  s += linha([p(-w / 2 + 12, -8), p(w / 2 - 12, -8)], { espessura: 2.4, cor: cor.cinza });
  s += linha([p(-w / 2 + 12, 9), p(w / 2 - 28, 9)], { espessura: 2.4, cor: cor.cinza });
  return s;
}

const CORES = [claro.verde, "#ffffff", claro.azul, claro.verde, claro.cinza, "#ffffff"];

/** Servidor: caixa com três gavetinhas, cada uma com duas luzinhas verdes e uma fenda. */
function servidor(x, y, w, h, o = {}) {
  const esp = o.espessura ?? E;
  let s = ret(x, y, w, h, { preench: claro.azul, gap: o.gap ?? 9, espessura: esp });
  const n = o.n ?? 3;
  const m = o.margem ?? 12;
  const hs = o.fenda ?? (h - m * (n + 1)) / n;
  const dl = o.luz ?? 12;
  for (let k = 0; k < n; k++) {
    const sy = y + m + k * (hs + m);
    s += ret(x + m, sy, w - 2 * m, hs, { preench: "#ffffff", hachura: "solid", espessura: esp * 0.8 });
    s += elipse(x + m + dl, sy + hs / 2, dl, dl, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.8 });
    s += elipse(x + m + dl * 2.4, sy + hs / 2, dl, dl, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.8 });
    s += linha([[x + m + dl * 3.8, sy + hs / 2], [x + w - m - 10, sy + hs / 2]], { espessura: 2.4, cor: cor.cinza });
  }
  return s;
}

/** Calendarinho (argolas, faixa vermelha e quadradinhos). */
function calendario(x, y, w = 50, h = 46) {
  let s = ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
  s += ret(x, y, w, 13, { preench: cor.vermelho, hachura: "solid", espessura: 2.4 });
  s += linha([[x + 13, y - 7], [x + 13, y + 6]], { espessura: 2.8 });
  s += linha([[x + w - 13, y - 7], [x + w - 13, y + 6]], { espessura: 2.8 });
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 3; c++) s += ret(x + 8 + c * 13, y + 20 + r * 12, 7, 6, { preench: cor.tinta, hachura: "solid", espessura: 1.4 });
  return s;
}

/** Ponto de interrogação desenhado (gancho + pingo), com altura h e topo em (cx, y). */
function interrogacao(cx, y, h, c = cor.laranja) {
  const r = h * 0.27;
  const d = `M${cx - r},${y + r} C${cx - r},${y - r * 0.15} ${cx + r},${y - r * 0.15} ${cx + r},${y + r} C${cx + r},${y + r * 1.9} ${cx},${y + r * 1.7} ${cx},${y + h * 0.7}`;
  return caminho(d, { cor: c, espessura: 9 }) + elipse(cx, y + h * 0.9, 18, 18, { preench: c, hachura: "solid", cor: c, espessura: 2.4 });
}

/** X vermelho grosso. */
function xisGrosso(x, y, t) {
  return (
    linha([[x - t / 2, y - t / 2], [x + t / 2, y + t / 2]], { cor: cor.vermelho, espessura: 6 }) +
    linha([[x + t / 2, y - t / 2], [x - t / 2, y + t / 2]], { cor: cor.vermelho, espessura: 6 })
  );
}

// montanha de mensagens: fileiras de baixo para cima, centradas em x = MX
const MX = 184;
const FILEIRAS = [4, 4, 4, 3, 3, 2, 2, 1];
const Y_BASE = 620; // centro da fileira de baixo
const PASSO_Y = 58;
const BW = 86, BH = 54; // balão da montanha

export function tamanho() {
  semear("tamanho");
  let s = "";

  // ---------------------------------------------------------------- 0: a montanha de mensagens
  let e0 = "";
  let i = 0;
  FILEIRAS.forEach((n, f) => {
    const cy = Y_BASE - f * PASSO_Y;
    for (let k = 0; k < n; k++) {
      const cx = MX + (k - (n - 1) / 2) * 72 + ((i * 7) % 11) - 5;
      const ang = [-9, 6, -4, 11, -12, 4, 8, -7][i % 8];
      e0 += balao(cx, cy + ((i * 5) % 9) - 4, ang, CORES[i % CORES.length], BW, BH);
      i++;
    }
  });
  s += etapa(0, e0);

  // ---------------------------------------------------------------- 1: "quase dois petabytes por ano"
  s += etapa(
    1,
    txt(MX, 56, "≈ 2 PB", { tam: 44, cor: cor.vermelho }) +
      calendario(MX - 96, 104) +
      txt(MX + 30, 128, "por ano", { tam: 34 }),
  );

  // ---------------------------------------------------------------- 2: "não cabe num computador"
  const SX = 450, SY = 160, SW = 176, SH = 140;
  let e2 = "";
  e2 += seta(278, 236, 432, 210, { espessura: E, ponta: 18 });
  e2 += servidor(SX, SY, SW, SH);
  // mensagens transbordando por cima e caindo dos lados
  e2 += balao(SX + 30, SY - 22, -10, claro.verde, 70, 44);
  e2 += balao(SX + 92, SY - 26, 6, "#ffffff", 70, 44);
  e2 += balao(SX + 154, SY - 18, 14, claro.azul, 70, 44);
  e2 += balao(SX + 56, SY - 70, 9, claro.cinza, 70, 44);
  e2 += balao(SX + 122, SY - 74, -8, claro.verde, 70, 44);
  e2 += balao(SX + 90, SY - 110, 4, "#ffffff", 70, 44);
  e2 += balao(SX + 226, SY + 78, 38, claro.verde, 66, 42);
  e2 += linha([[SX + 208, SY + 22], [SX + 218, SY + 42]], { espessura: 2.6, cor: cor.cinza });
  e2 += linha([[SX + 232, SY + 16], [SX + 244, SY + 36]], { espessura: 2.6, cor: cor.cinza });
  e2 += balao(SX - 56, SY + 124, -34, claro.azul, 66, 42);
  e2 += linha([[SX - 26, SY + 66], [SX - 34, SY + 86]], { espessura: 2.6, cor: cor.cinza });
  // o "1 computador" e o veredito
  e2 += txt(820, 64, "1 computador", { tam: 34 });
  e2 += xisGrosso(820, 160, 84);
  e2 += txt(820, 254, "não cabe", { tam: 40, cor: cor.vermelho });
  s += etapa(2, e2);

  // ---------------------------------------------------------------- 3: "precisa ser dividido em muitos"
  const AX = 432, AY = 398; // canto do arquivo (a grade de computadores)
  const GW = 98, GH = 62, GAP = 14;
  const caixa = (c, r) => [AX + GAP + c * (GW + GAP), AY + GAP + r * (GH + GAP)];
  let e3 = "";
  for (const y of [436, 512, 588]) e3 += seta(360, 548, AX - 12, y, { espessura: E, ponta: 16 });
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const [x, y] = caixa(c, r);
      e3 += servidor(x, y, GW, GH, { n: 1, margem: 9, fenda: 28, luz: 10, espessura: 2.8, gap: 8 });
    }
  e3 += txt(AX + 175, 346, "muitos computadores", { tam: 34 });
  s += etapa(3, e3);

  // ---------------------------------------------------------------- 4: "arquivo gigante ... muitas gavetas"
  const AW = 3 * GW + 4 * GAP, AH = 3 * GH + 4 * GAP;
  let e4 = "";
  e4 += ret(AX, AY, AW, AH, { espessura: 3.6 });
  e4 += ret(AX - 10, AY - 14, AW + 20, 12, { preench: cor.tinta, hachura: "solid", espessura: 2.6 });
  e4 += ret(AX + 18, AY + AH, 40, 14, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
  e4 += ret(AX + AW - 58, AY + AH, 40, 14, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const [x, y] = caixa(c, r);
      e4 += ret(x + GW / 2 - 22, y + 43, 44, 10, { preench: cor.tinta, hachura: "solid", espessura: 2.2 });
    }
  s += etapa(4, e4);

  // ---------------------------------------------------------------- 5: "a pergunta é, como dividir?"
  s += etapa(5, interrogacao(872, 384, 180) + txt(872, 616, "como\ndividir?", { tam: 36, cor: cor.laranja }));

  return svg(968, 690, s);
}
