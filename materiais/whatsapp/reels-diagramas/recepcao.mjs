import { ret, elipse, linha, curva, caminho, seta, txt, check, xis, passo, celular, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 2, cena "Então o WhatsApp precisa": a lista que diz em qual servidor cada pessoa está
// conectada agora, como a recepção de um prédio. Os servidores viram as salas do prédio, a lista
// fica na recepção, a Ana entra na sala 12 e o Bruno na sala 40.

const E = 3.1; // espessura das formas principais

// salas (servidores) da torre: 2 por andar, andar de cima (40) e andar de baixo (10)
const SX = [394, 670]; // x de cada coluna
const SW = 248; // largura da sala
const SH = 146; // altura da sala
const Y40 = 80; // andar 4
const Y10 = 304; // andar 1
const sala = (col, y) => ({ x: SX[col], y });
const S12 = sala(1, Y10);
const S40 = sala(0, Y40);

/** Sala-servidor: caixa com o número da sala e luzinhas verdes. */
function salaServidor(x, y, numero) {
  let s = ret(x, y, SW, SH, { preench: claro.azul, gap: 10, espessura: E });
  s += txt(x + 58, y + 58, numero, { tam: 54 });
  for (let i = 0; i < 3; i++) {
    s += elipse(x + 30 + i * 28, y + 116, 18, 18, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.8 });
  }
  return s;
}

/** Bonequinho (palitinho) com o nome em cima, dentro de uma sala. */
function boneco(cx, topo, nome, c, f, vestido) {
  let s = txt(cx, topo + 26, nome, { tam: 34, cor: c, halo: 7 });
  const hy = topo + 61; // centro da cabeça
  const ombro = hy + 18, cintura = hy + 52, pe = hy + 72;
  s += elipse(cx, hy, 36, 36, { preench: "#ffffff", hachura: "solid", cor: c, espessura: E });
  if (vestido) {
    // cabelo comprido
    s += curva([[cx - 18, hy + 6], [cx - 21, hy - 12], [cx, hy - 21], [cx + 21, hy - 12], [cx + 18, hy + 8]], { cor: c, espessura: E });
    s += caminho(`M${cx},${ombro} L${cx - 26},${cintura} L${cx + 26},${cintura} Z`, { preench: f, hachura: "solid", cor: c, espessura: E });
    s += linha([[cx - 10, cintura], [cx - 12, pe]], { cor: c, espessura: E });
    s += linha([[cx + 10, cintura], [cx + 12, pe]], { cor: c, espessura: E });
  } else {
    s += ret(cx - 17, ombro, 34, cintura - ombro, { preench: f, hachura: "solid", cor: c, espessura: E });
    s += linha([[cx - 9, cintura], [cx - 14, pe]], { cor: c, espessura: E });
    s += linha([[cx + 9, cintura], [cx + 14, pe]], { cor: c, espessura: E });
  }
  // braços para cima: "estou aqui!"
  s += linha([[cx - 36, hy - 12], [cx - 10, ombro + 8]], { cor: c, espessura: E });
  s += linha([[cx + 36, hy - 12], [cx + 10, ombro + 8]], { cor: c, espessura: E });
  return s;
}

/** Bonequinho só de cabeça e ombros (ícone de "pessoa"). */
const pessoaIcone = (cx, cy, c = cor.tinta) =>
  elipse(cx, cy - 12, 28, 28, { cor: c, espessura: 2.8 }) +
  caminho(`M${cx - 22},${cy + 22} Q${cx},${cy - 6} ${cx + 22},${cy + 22}`, { cor: c, espessura: 2.8 });

/** Servidorzinho (ícone): caixa com duas luzinhas. */
const servidorIcone = (cx, cy) =>
  ret(cx - 27, cy - 25, 54, 50, { preench: claro.azul, hachura: "solid", espessura: 2.8 }) +
  elipse(cx - 13, cy - 10, 11, 11, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.4 }) +
  elipse(cx - 13, cy + 10, 11, 11, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.4 }) +
  linha([[cx, cy - 10], [cx + 17, cy - 10]], { espessura: 2.2 }) +
  linha([[cx, cy + 10], [cx + 17, cy + 10]], { espessura: 2.2 });

// prancheta (a lista)
const PX = 56, PY = 92, PW = 290, PH = 392;
const LX = PX + 16, LW = PW - 32; // papel
const LINHA_ANA = 302, LINHA_BRUNO = 366;

export function recepcao() {
  semear("recepcao");
  let s = "";

  // ---------------------------------------------------------------- 0: muitos servidores
  {
    let c = "";
    ["40", "41"].forEach((n, i) => (c += salaServidor(SX[i], Y40, n)));
    ["11", "12"].forEach((n, i) => (c += salaServidor(SX[i], Y10, n)));
    // "e muitos outros" entre os dois andares
    for (let i = 0; i < 2; i++) {
      const cx = SX[i] + SW / 2;
      for (let k = 0; k < 3; k++) c += elipse(cx, Y40 + SH + 22 + k * 18, 9, 9, { preench: cor.cinza, hachura: "solid", cor: cor.cinza, espessura: 1.4 });
    }
    s += etapa(0, c);
  }

  // ---------------------------------------------------------------- 1: "uma lista"
  {
    let c = "";
    c += ret(PX, PY, PW, PH, { preench: claro.amarelo, gap: 10, espessura: E });
    c += ret(LX, PY + 26, LW, PH - 42, { preench: "#ffffff", hachura: "solid", espessura: 2.4 });
    // prendedor
    c += ret(PX + PW / 2 - 40, PY - 16, 80, 34, { preench: cor.cinza, hachura: "solid", espessura: 2.8 });
    // linhas vazias da lista
    for (const y of [LINHA_ANA + 26, LINHA_BRUNO + 26, 420, 452]) c += linha([[LX + 14, y], [LX + LW - 14, y]], { cor: cor.cinza, espessura: 1.6 });
    s += etapa(1, c);
  }

  // ---------------------------------------------------------------- 2: "em qual servidor" cada pessoa
  {
    let c = "";
    const y = 236;
    c += pessoaIcone(LX + 62, y);
    c += seta(LX + 140, y, LX + 182, y, { espessura: 2.8, ponta: 12 });
    c += servidorIcone(LX + 218, y);
    c += linha([[LX + 10, y + 34], [LX + LW - 10, y + 34]], { espessura: 2.4 });
    s += etapa(2, c);
  }

  // ---------------------------------------------------------------- 3: conectada "agora"
  {
    let c = "";
    const cx = LX + 50, cy = 168;
    c += elipse(cx, cy, 44, 44, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
    c += linha([[cx, cy - 13], [cx, cy], [cx + 10, cy + 6]], { espessura: 2.6 });
    c += txt(cx + 34, cy + 2, "agora", { tam: 38, ancora: "start", cor: cor.verde });
    s += etapa(3, c);
  }

  // ---------------------------------------------------------------- 4: "pensa na recepção"
  {
    let c = "";
    const bx = 200; // recepcionista
    c += elipse(bx, 526, 40, 40, { preench: "#ffffff", hachura: "solid", espessura: E });
    c += linha([[bx - 34, 584], [bx - 26, 558], [bx + 26, 558], [bx + 34, 584]], { espessura: E });
    // balcão
    c += ret(52, 584, 300, 74, { preench: claro.laranja, gap: 10, espessura: E });
    c += txt(202, 621, "recepção", { tam: 36, halo: 7 });
    // campainha
    c += caminho("M306,584 Q306,560 322,560 Q338,560 338,584 Z", { preench: cor.cinza, hachura: "solid", espessura: 2.4 });
    c += elipse(322, 556, 8, 8, { preench: cor.cinza, hachura: "solid", espessura: 1.6 });
    s += etapa(4, c);
  }

  // ---------------------------------------------------------------- 5: "um prédio"
  {
    let c = "";
    // telhado e paredes
    c += ret(26, 24, 922, 28, { preench: claro.cinza, hachura: "solid", espessura: E });
    c += linha([[36, 52], [36, 664], [938, 664], [938, 52]], { espessura: 3.4 });
    // pisos da torre
    c += linha([[372, Y10 + SH + 16], [938, Y10 + SH + 16]], { espessura: 2.6 });
    c += linha([[372, 52], [372, Y10 + SH + 16]], { espessura: 2.6 });
    // porta de entrada
    const dx = 600, dy = 520;
    c += ret(dx, dy, 120, 144, { preench: claro.verde, gap: 10, espessura: E });
    c += linha([[dx + 60, dy + 4], [dx + 60, 662]], { espessura: 2.4 });
    c += elipse(dx + 46, dy + 82, 9, 9, { preench: cor.tinta, hachura: "solid", espessura: 1.4 });
    c += elipse(dx + 74, dy + 82, 9, 9, { preench: cor.tinta, hachura: "solid", espessura: 1.4 });
    // janelas do térreo
    for (const wx of [420, 780]) {
      c += ret(wx, 510, 110, 86, { preench: "#ffffff", hachura: "solid", espessura: 2.6 });
      c += linha([[wx + 55, 512], [wx + 55, 594]], { espessura: 2 });
      c += linha([[wx + 2, 553], [wx + 108, 553]], { espessura: 2 });
    }
    s += etapa(5, c);
  }

  // ---------------------------------------------------------------- 6: "A Ana está na" sala 12
  {
    let c = "";
    c += ret(S12.x - 7, S12.y - 7, SW + 14, SH + 14, { cor: cor.violeta, espessura: 3.6 });
    c += boneco(S12.x + 178, S12.y, "Ana", cor.violeta, claro.violeta, true);
    c += txt(LX + 14, LINHA_ANA, "Ana", { tam: 38, ancora: "start", cor: cor.violeta });
    c += seta(LX + 140, LINHA_ANA, LX + 182, LINHA_ANA, { espessura: 2.8, ponta: 12, cor: cor.violeta });
    c += txt(LX + 218, LINHA_ANA, "12", { tam: 44, cor: cor.violeta });
    s += etapa(6, c);
  }

  // ---------------------------------------------------------------- 7: "o Bruno está na" sala 40
  {
    let c = "";
    c += ret(S40.x - 7, S40.y - 7, SW + 14, SH + 14, { cor: cor.laranja, espessura: 3.6 });
    c += boneco(S40.x + 178, S40.y, "Bruno", cor.laranja, claro.laranja, false);
    c += txt(LX + 14, LINHA_BRUNO, "Bruno", { tam: 38, ancora: "start", cor: cor.laranja });
    c += seta(LX + 140, LINHA_BRUNO, LX + 182, LINHA_BRUNO, { espessura: 2.8, ponta: 12, cor: cor.laranja });
    c += txt(LX + 218, LINHA_BRUNO, "40", { tam: 44, cor: cor.laranja });
    s += etapa(7, c);
  }

  return svg(968, 690, s);
}
