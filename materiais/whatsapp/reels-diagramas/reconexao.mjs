import { ret, elipse, linha, curva, caminho, seta, txt, check, xis, passo, celular, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 3, cena "E se um servidor quebrar": três servidores com celulares ligados; o do meio quebra,
// os celulares dele perdem a conexão e se conectam sozinhos nos outros dois. Embaixo, o cuidado: se
// todo mundo tentar ao mesmo tempo, a multidão derruba o próximo servidor.

const E = 3.1; // espessura das formas principais

/** Servidor desenhado: caixa com gavetas, luzinhas e frestas. */
function servidor(x, y, w, h, o = {}) {
  const n = o.gavetas ?? 3;
  const esp = o.espessura ?? E;
  let s = ret(x, y, w, h, { preench: o.preench ?? claro.azul, gap: o.gap ?? 9, cor: o.cor, espessura: esp });
  const m = Math.max(6, w * 0.07);
  const gh = (h - m * (n + 1)) / n;
  const luz = Math.max(8, Math.min(15, gh * 0.3));
  for (let i = 0; i < n; i++) {
    const gy = y + m + i * (gh + m);
    s += ret(x + m, gy, w - 2 * m, gh, { preench: "#ffffff", hachura: "solid", cor: o.cor, espessura: esp * 0.8 });
    const cy = gy + gh / 2;
    const lc = o.luz ?? cor.verde;
    s += elipse(x + m + luz * 1.3, cy, luz, luz, { preench: lc, hachura: "solid", cor: lc, espessura: 1.6 });
    s += elipse(x + m + luz * 3.0, cy, luz, luz, { preench: lc, hachura: "solid", cor: lc, espessura: 1.6 });
    const fx = x + m + luz * 4.5;
    s += linha([[fx, cy], [x + w - m * 2.2, cy]], { espessura: esp * 0.6, cor: o.cor });
  }
  return s;
}

/** Luzinhas de um servidor desenhado por servidor() trocadas de cor (servidor quebrado = luz vermelha). */
function luzes(x, y, w, h, c = cor.vermelho, n = 3) {
  const m = Math.max(6, w * 0.07);
  const gh = (h - m * (n + 1)) / n;
  const luz = Math.max(8, Math.min(15, gh * 0.3));
  let s = "";
  for (let i = 0; i < n; i++) {
    const cy = y + m + i * (gh + m) + gh / 2;
    for (const k of [1.3, 3.0]) s += elipse(x + m + luz * k, cy, luz + 3, luz + 3, { preench: c, hachura: "solid", cor: c, espessura: 1.6 });
  }
  return s;
}

/** Celular: corpo branco, tela verde clarinha e botão. */
function fone(cx, cy, w = 50, h = 80) {
  let s = ret(cx - w / 2, cy - h / 2, w, h, { preench: "#ffffff", hachura: "solid", espessura: 2.9 });
  s += ret(cx - w / 2 + 7, cy - h / 2 + 12, w - 14, h * 0.45, { preench: claro.verde, hachura: "solid", espessura: 1.8 });
  s += linha([[cx - 7, cy + h / 2 - 11], [cx + 7, cy + h / 2 - 11]], { espessura: 2.4 });
  return s;
}

/** Xis e certinho mais grossos que os do diagramas.mjs. */
const xisG = (x, y, t, c = cor.vermelho, e = 6) =>
  linha([[x - t / 2, y - t / 2], [x + t / 2, y + t / 2]], { cor: c, espessura: e }) +
  linha([[x + t / 2, y - t / 2], [x - t / 2, y + t / 2]], { cor: c, espessura: e });
const checkG = (x, y, t, c = cor.verde, e = 5) =>
  linha([[x - t * 0.5, y], [x - t * 0.1, y + t * 0.4], [x + t * 0.6, y - t * 0.5]], { cor: c, espessura: e });

/** Fumaça: nuvenzinhas cinza subindo. */
function fumaca(pts) {
  return pts.map(([x, y, r]) => elipse(x, y, r * 1.5, r, { preench: claro.cinza, hachura: "solid", cor: cor.cinza, espessura: 2.4 })).join("");
}

/** Raio vermelho (zigue-zague cheio). */
function raio(x, y, k = 1) {
  const P = (dx, dy) => `${(x + dx * k).toFixed(1)},${(y + dy * k).toFixed(1)}`;
  return caminho(`M${P(8, -40)} L${P(-14, 2)} L${P(2, 2)} L${P(-10, 40)} L${P(16, -8)} L${P(0, -8)} L${P(12, -40)} Z`, {
    preench: cor.vermelho,
    hachura: "solid",
    cor: cor.vermelho,
    espessura: 2.4,
  });
}

/** Relógio: círculo com ponteiros. */
function relogio(cx, cy, r) {
  let s = elipse(cx, cy, 2 * r, 2 * r, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
  s += linha([[cx, cy - r * 0.7], [cx, cy], [cx + r * 0.55, cy + r * 0.2]], { espessura: 2.8 });
  return s;
}

// ------------------------------------------------------------------ geometria
const SY = 72, SW = 180, SH = 118; // servidores de cima
const SX = [50, 394, 738];
const CX = SX.map((x) => x + SW / 2); // 140, 484, 828
const FY = 326, FH = 80; // celulares de cima (centro)
const FONES = CX.map((c) => [c - 45, c + 45]);

export function reconexao() {
  semear("reconexao");
  let s = "";

  // ---------------------------------------------------------------- 0: três servidores, cada um com seus celulares
  {
    let c = "";
    // o do meio sai primeiro: ele quebra logo no começo da fala ("E se um servidor quebrar?")
    [1, 0, 2].forEach((i) => (c += servidor(SX[i], SY, SW, SH)));
    FONES.forEach((par) =>
      par.forEach((fx) => {
        c += linha([[fx, SY + SH + 4], [fx, FY - FH / 2 - 4]], { cor: cor.verde, espessura: 3 });
        c += fone(fx, FY);
      }),
    );
    s += etapa(0, c);
  }

  // ---------------------------------------------------------------- 1: um servidor quebra
  {
    let c = "";
    c += luzes(SX[1], SY, SW, SH);
    c += fumaca([[450, 60, 30], [484, 52, 36], [520, 60, 30], [466, 36, 26], [502, 35, 26]]);
    c += xisG(CX[1], SY + SH / 2, 120, cor.vermelho, 8);
    c += raio(CX[1] - 128, SY + SH / 2, 1.1);
    c += raio(CX[1] + 128, SY + SH / 2, 1.1);
    s += etapa(1, c);
  }

  // ---------------------------------------------------------------- 2: quem estava nele perde a conexão
  {
    let c = "";
    FONES[1].forEach((fx) => (c += xisG(fx, (SY + SH + FY - FH / 2) / 2, 30, cor.vermelho, 5)));
    c += txt(CX[1], 392, "sem conexão", { tam: 32, cor: cor.vermelho });
    s += etapa(2, c);
  }

  // ---------------------------------------------------------------- 3: e se conecta sozinho em outro
  {
    let c = "";
    const [fe, fd] = FONES[1];
    c += seta(fe - 30, FY - 6, SX[0] + SW - 14, SY + SH + 12, { cor: cor.verde, espessura: 3.4, ponta: 20, tracejado: true });
    c += seta(fd + 30, FY - 6, SX[2] + 14, SY + SH + 12, { cor: cor.verde, espessura: 3.4, ponta: 20, tracejado: true });
    c += checkG(266, 196, 42);
    c += checkG(690, 196, 42);
    s += etapa(3, c);
  }

  // ---------------------------------------------------------------- 4: mas tem um cuidado
  {
    let c = "";
    c += linha([[34, 420], [934, 420]], { cor: cor.cinza, espessura: 2.2, tracejado: true });
    c += caminho("M110,452 L40,578 L180,578 Z", { preench: claro.amarelo, hachura: "solid", cor: cor.laranja, espessura: 3.6 });
    c += linha([[110, 490], [110, 540]], { espessura: 7 });
    c += elipse(110, 560, 10, 10, { preench: cor.tinta, hachura: "solid", espessura: 2 });
    c += txt(110, 624, "cuidado", { tam: 38, cor: cor.laranja });
    s += etapa(4, c);
  }

  // ---------------------------------------------------------------- 5: se todo mundo tentar ao mesmo tempo
  {
    let c = "";
    const alvo = [730, 530];
    // o servidor sai primeiro, para já estar inteiro quando a etapa 6 o derrubar
    c += servidor(736, 452, 160, 160, { espessura: 2.9 });
    // multidão de celulares (de trás para a frente)
    for (let r = 0; r < 3; r++)
      for (let q = 0; q < 4; q++) c += fone(246 + q * 54 + (r % 2) * 27, 480 + r * 70, 40, 64);
    // todos tentando entrar no mesmo servidor
    const ys = [480, 508, 536, 564, 592, 620];
    ys.forEach((y, i) => {
      c += seta(470, y, alvo[0] - 6, 488 + i * 21, { espessura: 2.8, ponta: 16 });
    });
    c += relogio(474, 448, 20);
    c += txt(504, 448, "todos juntos", { tam: 32, ancora: "start" });
    s += etapa(5, c);
  }

  // ---------------------------------------------------------------- 6: derruba o próximo servidor
  {
    let c = "";
    c += luzes(736, 452, 160, 160);
    c += xisG(816, 532, 120, cor.vermelho, 8);
    c += raio(926, 512, 1);
    c += txt(816, 648, "caiu também", { tam: 34, cor: cor.vermelho });
    s += etapa(6, c);
  }

  return svg(968, 690, s);
}
