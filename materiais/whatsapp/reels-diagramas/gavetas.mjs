import { ret, elipse, linha, curva, caminho, seta, txt, check, xis, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Errado x certo com gaveteiros: separar mensagem por mensagem espalha a conversa (verde) por todas as
// gavetas e o sistema precisa procurar em todas (lento); separar por conversa deixa cada conversa
// inteira numa gaveta, já em ordem, e ao abrir está tudo ali.

const E = 3.2; // espessura das formas principais
const Y0 = 88; // topo dos gaveteiros
const LARG = 260;
const ALT = 468;
const GAV = (x, k) => ({ x: x + 13, y: Y0 + 14 + k * 150, w: LARG - 26, h: 136 });

const COR = { v: claro.verde, a: claro.amarelo, z: claro.azul };

/** Gaveteiro vazio: móvel hachurado, três gavetas brancas com puxador e pezinhos. */
function gaveteiro(x) {
  let s = ret(x, Y0, LARG, ALT, { preench: claro.cinza, gap: 10, espessura: E });
  for (let k = 0; k < 3; k++) {
    const g = GAV(x, k);
    s += ret(g.x, g.y, g.w, g.h, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
    s += ret(g.x + g.w / 2 - 36, g.y + 100, 72, 17, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
  }
  s += ret(x + 20, Y0 + ALT, 36, 14, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
  s += ret(x + LARG - 56, Y0 + ALT, 36, 14, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
  return s;
}

/** Balão de mensagem (cartãozinho com rabicho). Os verdes são da "sua conversa" e levam número. */
function balao(x, y, c, n, w = 64, h = 52) {
  const verde = c === "v";
  let s = ret(x, y, w, h, { preench: COR[c], hachura: "solid", cor: verde ? cor.verde : cor.tinta, espessura: verde ? 3.2 : 2.4 });
  s += linha([[x + 10, y + h], [x + 7, y + h + 13], [x + 24, y + h]], { cor: verde ? cor.verde : cor.tinta, espessura: verde ? 3 : 2.2 });
  if (n) s += txt(x + w / 2, y + h / 2 + 2, n, { tam: 34, cor: cor.verde });
  return s;
}

/** Os três balões de uma gaveta: [[cor, número], ...]. */
function conteudo(x, k, itens) {
  const g = GAV(x, k);
  return itens.map(([c, n], j) => balao(g.x + 10 + j * 75, g.y + 16, c, n)).join("");
}

export function gavetas() {
  semear("gavetas");
  const XE = 36; // gaveteiro da esquerda (errado)
  const XD = 516; // gaveteiro da direita (certo)
  let s = "";

  // 0: o gaveteiro de "por mensagem", ainda vazio
  s += etapa(0, txt(XE + LARG / 2, 44, "por mensagem", { tam: 40 }) + gaveteiro(XE));

  // 1: "espalhada em várias gavetas" — a conversa verde fica um pedaço em cada gaveta, fora de ordem
  s += etapa(
    1,
    conteudo(XE, 0, [["a"], ["v", "3"], ["z"]]) +
      conteudo(XE, 1, [["v", "1"], ["z"], ["a"]]) +
      conteudo(XE, 2, [["z"], ["a"], ["v", "2"]]) +
      balao(XE, 598, "v", "", 48, 38) +
      txt(XE + 62, 616, "sua conversa", { tam: 32, cor: cor.verde, ancora: "start" }),
  );

  // 2: "procurar em todas" — a lupa olha gaveta por gaveta
  const lx = 392, ly = 236;
  s += etapa(
    2,
    linha([[lx + 34, ly + 34], [lx + 72, ly + 80]], { espessura: 8 }) +
      elipse(lx, ly, 96, 96, { preench: claro.azul, gap: 9, espessura: 3.4 }) +
      seta(lx - 48, ly - 14, XE + LARG + 12, Y0 + 82, { cor: cor.azul, espessura: 3, ponta: 16, tracejado: true }) +
      seta(lx - 48, ly + 12, XE + LARG + 12, Y0 + 232, { cor: cor.azul, espessura: 3, ponta: 16, tracejado: true }) +
      seta(lx - 30, ly + 40, XE + LARG + 12, Y0 + 382, { cor: cor.azul, espessura: 3, ponta: 16, tracejado: true }) +
      txt(lx + 62, ly - 62, "?", { tam: 44, cor: cor.azul }) +
      txt(lx - 2, ly - 78, "?", { tam: 36, cor: cor.azul }),
  );

  // 3: "fica lento" — caracol + lento, e o X no título
  const cx = 390, cy = 606;
  s += etapa(
    3,
    xis(XE + LARG + 46, 44, 36) +
      txt(cx + 2, 512, "lento", { tam: 42, cor: cor.vermelho }) +
      caminho(
        `M${cx - 70},${cy + 46} C${cx - 30},${cy + 52} ${cx + 40},${cy + 52} ${cx + 62},${cy + 44} C${cx + 74},${cy + 38} ${cx + 74},${cy + 20} ${cx + 66},${cy + 6} C${cx + 60},${cy - 4} ${cx + 50},${cy - 2} ${cx + 48},${cy + 10} L${cx + 42},${cy + 30} C${cx + 10},${cy + 34} ${cx - 40},${cy + 38} ${cx - 70},${cy + 46} Z`,
        { preench: claro.amarelo, hachura: "solid", espessura: 3 },
      ) +
      elipse(cx - 8, cy, 84, 80, { preench: claro.laranja, gap: 9, espessura: 3.2 }) +
      curva(
        [[cx - 6, cy + 2], [cx + 4, cy - 4], [cx + 2, cy - 14], [cx - 12, cy - 16], [cx - 24, cy - 4], [cx - 20, cy + 16], [cx, cy + 22], [cx + 18, cy + 8], [cx + 20, cy - 14]],
        { espessura: 2.6, cor: cor.laranja },
      ) +
      linha([[cx + 56, cy + 2], [cx + 48, cy - 30]], { espessura: 2.6 }) +
      linha([[cx + 64, cy + 4], [cx + 74, cy - 26]], { espessura: 2.6 }) +
      elipse(cx + 48, cy - 32, 9, 9, { preench: cor.tinta, hachura: "solid", espessura: 2 }) +
      elipse(cx + 74, cy - 28, 9, 9, { preench: cor.tinta, hachura: "solid", espessura: 2 }),
  );

  // 4: "separar por conversa" — o outro jeito: um gaveteiro novo, o certo
  s += etapa(
    4,
    linha([[484, 26], [484, 664]], { cor: cor.cinza, espessura: 2.4, tracejado: true }) +
      txt(XD + LARG / 2, 44, "por conversa", { tam: 40 }) +
      check(XD + LARG + 42, 42, 40) +
      gaveteiro(XD),
  );

  // 5: "numa gaveta só" — cada conversa inteira numa gaveta, já em ordem 1-2-3
  s += etapa(
    5,
    conteudo(XD, 1, [["a"], ["a"], ["a"]]) +
      conteudo(XD, 2, [["z"], ["z"], ["z"]]) +
      conteudo(XD, 0, [["v", "1"], ["v", "2"], ["v", "3"]]),
  );

  // 6: "abriu a conversa" — puxou uma gaveta só e a conversa aparece inteira no celular
  const px = 806, py = 232, pw = 128, ph = 236;
  let tela = ret(px, py, pw, ph, { preench: "#ffffff", hachura: "solid", espessura: E });
  tela += linha([[px + 46, py + 16], [px + 82, py + 16]], { espessura: 3 });
  [["e", "1"], ["d", "2"], ["e", "3"]].forEach(([lado, n], i) => {
    tela += balao(lado === "d" ? px + 52 : px + 12, py + 34 + i * 64, "v", n, 64, 46);
  });
  s += etapa(
    6,
    curva([[XD + LARG + 4, Y0 + 70], [842, 122], [870, 172], [870, py - 8]], { cor: cor.verde, espessura: 3.2 }) +
      linha([[858, py - 24], [870, py - 6], [884, py - 24]], { cor: cor.verde, espessura: 3.2 }) +
      tela +
      check(866, 516, 48) +
      txt(866, 590, "tudo ali!", { tam: 36, cor: cor.verde }),
  );

  return svg(968, 690, s);
}
