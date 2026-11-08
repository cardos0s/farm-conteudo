import { ret, elipse, linha, curva, caminho, seta, txt, check, xis, passo, celular, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 3, cena "É igual quando a luz volta": em cima, a comparação (a luz volta, todo mundo liga
// tudo de uma vez e o transformador estoura de novo); no meio, o celular que espera 1 s, não dá,
// espera 2 s, 4 s e conecta; embaixo, a mensagem que primeiro vai para a gaveta trancada e só
// depois ganha o primeiro tiquinho.

const E = 3.1; // espessura das formas principais
const TELHADO = 70; // altura do telhado das casas

/** Casinha: telhado, parede, janela (apagada) e porta. x = canto esquerdo da parede. */
function casa(x, yBase, w, h, telhado) {
  const yTopo = yBase - h;
  let s = caminho(`M${x - 12},${yTopo} L${x + w / 2},${yTopo - TELHADO} L${x + w + 12},${yTopo} Z`, { preench: telhado, gap: 9, espessura: E });
  s += ret(x, yTopo, w, h, { preench: "#ffffff", hachura: "solid", espessura: E });
  s += ret(x + w - 42, yBase - 60, 28, 60, { preench: claro.laranja, hachura: "solid", espessura: 2.6 });
  s += janela(x + 14, yTopo + 20, cor.cinza);
  return s;
}

/** Janela 40x36 com a cruz de madeira. */
function janela(x, y, preench) {
  return (
    ret(x, y, 40, 36, { preench, hachura: "solid", espessura: 2.8 }) +
    linha([[x + 20, y + 2], [x + 20, y + 34]], { espessura: 2.2 }) +
    linha([[x + 2, y + 18], [x + 38, y + 18]], { espessura: 2.2 })
  );
}

/** Raio de faísca em zigue-zague, de (x, y) na direção do ângulo (graus). */
function faisca(x, y, ang, comp = 46) {
  const a = (ang * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const px = -uy, py = ux;
  const pts = [0, 0.33, 0.66, 1].map((t, i) => {
    const off = i === 0 || i === 3 ? 0 : i === 1 ? 9 : -9;
    return [x + ux * comp * t + px * off, y + uy * comp * t + py * off];
  });
  return linha(pts, { cor: cor.vermelho, espessura: 3.4 });
}

/** Celular pequeno (70x118). */
function fone(x, y) {
  let s = ret(x, y, 78, 128, { preench: "#ffffff", hachura: "solid", espessura: E });
  s += linha([[x + 28, y + 13], [x + 50, y + 13]], { espessura: 2.6 });
  s += ret(x + 10, y + 28, 42, 20, { preench: claro.cinza, hachura: "solid", espessura: 2 });
  s += ret(x + 26, y + 58, 42, 20, { preench: claro.verde, hachura: "solid", espessura: 2 });
  s += elipse(x + 39, y + 106, 16, 16, { espessura: 2.2 });
  return s;
}

/** Ampulheta de altura h com a base em (cx, yBase); a areia já caiu quase toda. */
function ampulheta(cx, yBase, h) {
  const w = h * 0.62;
  const yt = yBase - h;
  const ym = yBase - h / 2;
  const mg = 7; // folga entre a moldura e o vidro
  let s = "";
  // areia: pouquinha em cima, montinho embaixo
  s += caminho(`M${cx - w * 0.17},${ym - h * 0.11} L${cx + w * 0.17},${ym - h * 0.11} L${cx},${ym - 2} Z`, {
    preench: claro.laranja, hachura: "solid", cor: cor.laranja, espessura: 1.6,
  });
  s += caminho(`M${cx - w / 2 + 6},${yBase - mg - 2} L${cx + w / 2 - 6},${yBase - mg - 2} L${cx},${yBase - mg - h * 0.24} Z`, {
    preench: claro.laranja, hachura: "solid", cor: cor.laranja, espessura: 1.6,
  });
  s += linha([[cx, ym], [cx, yBase - mg - h * 0.22]], { cor: cor.laranja, espessura: 2 });
  // vidro
  s += caminho(
    `M${cx - w / 2},${yt + mg} L${cx + w / 2},${yt + mg} L${cx + 4},${ym} L${cx + w / 2},${yBase - mg} L${cx - w / 2},${yBase - mg} L${cx - 4},${ym} Z`,
    { espessura: E },
  );
  // moldura de madeira
  s += linha([[cx - w / 2 - 8, yt + 2], [cx + w / 2 + 8, yt + 2]], { espessura: 5.2 });
  s += linha([[cx - w / 2 - 8, yBase - 2], [cx + w / 2 + 8, yBase - 2]], { espessura: 5.2 });
  return s;
}

/** Servidor: caixa com gavetas e luzinhas. */
function servidor(x, y, w, h) {
  const n = 3;
  let s = ret(x, y, w, h, { preench: claro.azul, gap: 9, espessura: E });
  const m = 9;
  const gh = (h - m * (n + 1)) / n;
  for (let i = 0; i < n; i++) {
    const gy = y + m + i * (gh + m);
    s += ret(x + m, gy, w - 2 * m, gh, { preench: "#ffffff", hachura: "solid", espessura: 2.5 });
    const cy = gy + gh / 2;
    s += elipse(x + m + 15, cy, 12, 12, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.6 });
    s += elipse(x + m + 35, cy, 12, 12, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.6 });
    s += linha([[x + m + 52, cy], [x + w - m - 10, cy]], { espessura: 2.2 });
  }
  return s;
}

/** Balão de mensagem verde com rabinho à direita. */
function balao(x, y, w, h) {
  return (
    caminho(`M${x + w - 26},${y + h - 2} L${x + w + 14},${y + h + 16} L${x + w - 4},${y + h - 22}`, {
      preench: claro.verde, hachura: "solid", espessura: 2.8,
    }) + ret(x, y, w, h, { preench: claro.verde, hachura: "solid", espessura: E })
  );
}

/** Reloginho (mensagem ainda não saiu do celular). */
function relogio(cx, cy, d) {
  return (
    elipse(cx, cy, d, d, { cor: cor.cinza, espessura: 2.6 }) +
    linha([[cx, cy - d * 0.3], [cx, cy], [cx + d * 0.24, cy + d * 0.12]], { cor: cor.cinza, espessura: 2.6 })
  );
}

/** Bolinha numerada grande. */
function numero(cx, cy, n, c = cor.azul) {
  return elipse(cx, cy, 46, 46, { preench: c, hachura: "solid", cor: c, espessura: 2 }) + txt(cx, cy + 2, n, { tam: 30, cor: "#ffffff" });
}

/** Xis e certinho mais grossos que os do diagramas.mjs. */
const xisG = (x, y, t, c = cor.vermelho, e = 5.5) =>
  linha([[x - t / 2, y - t / 2], [x + t / 2, y + t / 2]], { cor: c, espessura: e }) +
  linha([[x + t / 2, y - t / 2], [x - t / 2, y + t / 2]], { cor: c, espessura: e });
const checkG = (x, y, t, c = cor.verde, e = 5) =>
  linha([[x - t * 0.5, y], [x - t * 0.1, y + t * 0.4], [x + t * 0.6, y - t * 0.5]], { cor: c, espessura: e });

export function luz() {
  semear("luz");
  let s = "";

  const CASAS = [30, 164, 298, 432]; // x de cada casa
  const WC = 104; // largura da parede
  const YCH = 252; // chão
  const HC = 104; // altura da parede
  const POSTE = 690; // x do poste
  const YM = 418; // base das ampulhetas / do celular (faixa do meio)

  // ---------------------------------------------------------------- 0: a luz volta (casas apagadas, poste aceso)
  {
    let c = "";
    c += linha([[24, YCH], [944, YCH]], { cor: cor.cinza, espessura: 2.4 });
    const telhados = [claro.vermelho, claro.laranja, claro.vermelho, claro.laranja];
    CASAS.forEach((x, i) => (c += casa(x, YCH, WC, HC, telhados[i])));
    // poste com a cruzeta e o transformador
    c += ret(POSTE - 8, 40, 16, YCH - 40, { preench: claro.laranja, gap: 8, espessura: E });
    c += ret(POSTE - 44, 58, 88, 12, { preench: cor.tinta, hachura: "solid", espessura: 2.4 });
    c += ret(POSTE + 14, 96, 60, 74, { preench: claro.cinza, hachura: "solid", espessura: E });
    c += linha([[POSTE + 8, 112], [POSTE + 14, 112]], { espessura: 3 });
    c += linha([[POSTE + 24, 118], [POSTE + 64, 118]], { espessura: 2.2 });
    c += linha([[POSTE + 24, 134], [POSTE + 64, 134]], { espessura: 2.2 });
    c += linha([[POSTE + 24, 150], [POSTE + 64, 150]], { espessura: 2.2 });
    // fio de casa em casa até o poste
    const topo = YCH - HC - TELHADO;
    const pts = [];
    CASAS.forEach((x, i) => {
      pts.push([x + WC / 2, topo]);
      if (i < CASAS.length - 1) pts.push([x + WC / 2 + 67, topo + 14]);
    });
    pts.push([560, topo + 10], [POSTE - 40, 64]);
    c += curva(pts, { espessura: 2.4 });
    // luminária acesa no braço do poste
    c += curva([[POSTE - 8, 190], [POSTE - 46, 174], [POSTE - 84, 180]], { espessura: 3 });
    c += caminho(`M${POSTE - 104},${182} L${POSTE - 64},${182} L${POSTE - 56},${198} L${POSTE - 112},${198} Z`, {
      preench: cor.tinta, hachura: "solid", espessura: 2.2,
    });
    c += elipse(POSTE - 84, 210, 34, 24, { preench: claro.amarelo, hachura: "solid", cor: cor.laranja, espessura: 2.6 });
    for (const g of [-200, -160, -125, -55, -20]) {
      const a = (-g * Math.PI) / 180;
      c += linha(
        [[POSTE - 84 + 26 * Math.cos(a), 212 + 20 * Math.sin(a)], [POSTE - 84 + 44 * Math.cos(a), 212 + 34 * Math.sin(a)]],
        { cor: cor.laranja, espessura: 3 },
      );
    }
    s += etapa(0, c);
  }

  // ---------------------------------------------------------------- 1: todo mundo liga tudo de uma vez → estoura
  {
    let c = "";
    const yJ = YCH - HC + 20;
    CASAS.forEach((x) => {
      c += janela(x + 14, yJ, claro.amarelo);
      c += linha([[x + 8, yJ - 4], [x - 2, yJ - 13]], { cor: cor.laranja, espessura: 3 });
      c += linha([[x + 34, yJ - 6], [x + 34, yJ - 17]], { cor: cor.laranja, espessura: 3 });
      c += linha([[x + 60, yJ - 4], [x + 70, yJ - 13]], { cor: cor.laranja, espessura: 3 });
    });
    // o transformador estoura
    const tx = POSTE + 44, ty = 133;
    c += faisca(tx + 36, ty - 30, -40);
    c += faisca(tx + 38, ty + 4, 0, 50);
    c += faisca(tx + 34, ty + 34, 30, 38);
    c += faisca(tx + 14, ty - 42, -70, 34);
    c += xisG(tx, ty, 46, cor.vermelho, 6);
    c += txt(POSTE + 168, 220, "cai de\nnovo!", { tam: 38, cor: cor.vermelho });
    s += etapa(1, c);
  }

  // ---------------------------------------------------------------- 2: cada celular espera um pouquinho
  {
    let c = "";
    c += linha([[30, 272], [938, 272]], { cor: cor.cinza, espessura: 1.6, tracejado: true });
    c += fone(30, YM - 128);
    c += seta(122, YM - 56, 172, YM - 56, { espessura: E, ponta: 16 });
    c += ampulheta(214, YM, 70);
    c += txt(214, YM + 26, "1 s", { tam: 34 });
    c += servidor(804, YM - 128, 120, 128);
    s += etapa(2, c);
  }

  // ---------------------------------------------------------------- 3: e se não der (tentou e não conectou)
  {
    let c = "";
    c += seta(258, YM - 56, 340, YM - 56, { espessura: E, ponta: 16 });
    c += xisG(299, YM - 104, 36);
    s += etapa(3, c);
  }

  // ---------------------------------------------------------------- 4: espera um pouco mais (2 s, 4 s) e conecta
  {
    let c = "";
    c += ampulheta(392, YM, 98);
    c += txt(392, YM + 26, "2 s", { tam: 34 });
    c += seta(446, YM - 56, 526, YM - 56, { espessura: E, ponta: 16 });
    c += xisG(486, YM - 104, 36);
    c += ampulheta(590, YM, 126);
    c += txt(590, YM + 26, "4 s", { tam: 34 });
    c += seta(652, YM - 56, 794, YM - 56, { espessura: 3.4, ponta: 18, cor: cor.verde });
    c += checkG(722, YM - 104, 40);
    s += etapa(4, c);
  }

  // ---------------------------------------------------------------- 5: nenhuma mensagem se perde (vai para a gaveta)
  const YB = 540; // centro dos balões (faixa de baixo)
  const YN = 644; // números e rótulos de baixo
  {
    let c = "";
    c += linha([[30, 474], [938, 474]], { cor: cor.cinza, espessura: 1.6, tracejado: true });
    c += balao(30, YB - 38, 152, 76);
    c += txt(82, YB, "oi", { tam: 42 });
    c += relogio(146, YB + 2, 30);
    c += seta(206, YB, 284, YB, { espessura: E, ponta: 16 });
    // carta entrando na gaveta
    c += ret(344, 492, 92, 60, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
    c += linha([[344, 492], [390, 524], [436, 492]], { espessura: 2.6 });
    c += ret(300, 528, 180, 88, { preench: claro.violeta, hachura: "solid", espessura: E });
    c += ret(346, 560, 76, 18, { preench: "#ffffff", hachura: "solid", espessura: 2.6 });
    c += numero(318, YN, "1");
    s += etapa(5, c);
  }

  // ---------------------------------------------------------------- 6: o primeiro tiquinho (só depois)
  {
    let c = "";
    c += seta(496, YB + 20, 640, YB + 20, { espessura: E, ponta: 16 });
    c += balao(660, YB - 38, 200, 76);
    c += txt(716, YB, "oi", { tam: 42 });
    c += checkG(808, YB - 2, 40, cor.cinza, 5.5);
    c += numero(690, YN, "2");
    c += txt(724, YN, "só depois", { tam: 36, ancora: "start" });
    s += etapa(6, c);
  }

  // ---------------------------------------------------------------- 7: depois que a mensagem foi guardada (cadeado)
  {
    let c = "";
    const lx = 452, ly = 590;
    c += caminho(`M${lx - 12},${ly - 14} L${lx - 12},${ly - 28} A12,12 0 0 1 ${lx + 12},${ly - 28} L${lx + 12},${ly - 14}`, { espessura: 4 });
    c += ret(lx - 22, ly - 16, 44, 36, { preench: claro.amarelo, hachura: "solid", cor: cor.tinta, espessura: 3 });
    c += elipse(lx, ly + 1, 9, 9, { preench: cor.tinta, hachura: "solid", espessura: 1.4 });
    c += txt(350, YN, "guardada", { tam: 36, cor: cor.verde, ancora: "start" });
    s += etapa(7, c);
  }

  return svg(968, 690, s);
}
