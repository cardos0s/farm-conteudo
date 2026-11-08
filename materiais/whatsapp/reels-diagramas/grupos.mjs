import { ret, elipse, linha, curva, caminho, seta, txt, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 3, cena "Grupos": você manda um "oi" num grupo; o servidor guarda a mensagem uma vez só
// (caderno), olha a lista do grupo (bonequinhos coloridos) e manda uma cópia para cada pessoa.
// Quem está com o app aberto recebe na hora (✓ + raio); quem não está recebe o sininho e a
// mensagem fica esperando (relógio).

const E = 3.2; // espessura das formas principais

// cores das 6 pessoas do grupo (a mesma cor na lista e na fileira da direita)
const PESSOAS = [
  [claro.verde, cor.verde],
  [claro.azul, cor.azul],
  [claro.laranja, cor.laranja],
  [claro.violeta, cor.violeta],
  [claro.ciano, cor.ciano],
  [claro.vermelho, cor.vermelho],
];
const FORA = new Set([2, 5]); // quem está com o app fechado
const YP = (i) => 74 + i * 108; // centro de cada fileira da direita

/** Bonequinho: cabeça e ombros (cx, cy = centro). */
function boneco(cx, cy, r, [fundo, traco]) {
  return (
    caminho(`M${cx - r * 1.5},${cy + r * 1.75} Q${cx - r * 1.5},${cy + r * 0.25} ${cx},${cy + r * 0.25} Q${cx + r * 1.5},${cy + r * 0.25} ${cx + r * 1.5},${cy + r * 1.75} Z`, {
      preench: fundo,
      hachura: "solid",
      cor: traco,
      espessura: 2.8,
    }) + elipse(cx, cy - r * 0.9, r * 2, r * 2, { preench: fundo, hachura: "solid", cor: traco, espessura: 2.8 })
  );
}

/** Carta (envelope). */
function carta(x, y, w, h) {
  return (
    ret(x, y, w, h, { preench: claro.amarelo, hachura: "solid", espessura: 2.8 }) +
    linha([[x, y], [x + w / 2, y + h * 0.58], [x + w, y]], { espessura: 2.6 })
  );
}

/** Balão de mensagem com rabicho. */
function balao(x, y, w, h, esp = 2.8) {
  return (
    ret(x, y, w, h, { preench: claro.verde, hachura: "solid", espessura: esp }) +
    linha([[x + w - 22, y + h], [x + w - 6, y + h + 14], [x + w - 8, y + h]], { espessura: esp - 0.4 })
  );
}

/** Visto grosso. */
function certo(x, y, t, c) {
  return linha([[x - t * 0.5, y], [x - t * 0.1, y + t * 0.4], [x + t * 0.6, y - t * 0.5]], { cor: c, espessura: 4.4 });
}

/** Raio (na hora). */
function raio(cx, cy) {
  return caminho(
    `M${cx + 8},${cy - 30} L${cx - 14},${cy + 4} L${cx + 1},${cy + 4} L${cx - 8},${cy + 30} L${cx + 16},${cy - 6} L${cx + 1},${cy - 6} Z`,
    { preench: claro.amarelo, hachura: "solid", cor: cor.laranja, espessura: 2.8 },
  );
}

/** Sininho tocando. */
function sino(cx, cy) {
  return (
    caminho(`M${cx - 22},${cy + 14} Q${cx - 16},${cy + 6} ${cx - 16},${cy - 6} Q${cx - 16},${cy - 26} ${cx},${cy - 26} Q${cx + 16},${cy - 26} ${cx + 16},${cy - 6} Q${cx + 16},${cy + 6} ${cx + 22},${cy + 14} Z`, {
      preench: claro.laranja,
      hachura: "solid",
      cor: cor.laranja,
      espessura: 3,
    }) +
    elipse(cx, cy + 21, 12, 12, { preench: cor.laranja, hachura: "solid", cor: cor.laranja }) +
    linha([[cx, cy - 26], [cx, cy - 33]], { cor: cor.laranja, espessura: 3 }) +
    curva([[cx - 30, cy - 20], [cx - 35, cy - 6], [cx - 31, cy + 8]], { cor: cor.laranja, espessura: 2.8 }) +
    curva([[cx + 30, cy - 20], [cx + 35, cy - 6], [cx + 31, cy + 8]], { cor: cor.laranja, espessura: 2.8 })
  );
}

/** Relógio. */
function relogio(cx, cy, d) {
  let s = elipse(cx, cy, d, d, { preench: "#ffffff", hachura: "solid", espessura: E });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    s += linha([[cx + Math.cos(a) * d * 0.36, cy + Math.sin(a) * d * 0.36], [cx + Math.cos(a) * d * 0.44, cy + Math.sin(a) * d * 0.44]], { espessura: 2.4 });
  }
  s += linha([[cx, cy - d * 0.3], [cx, cy], [cx + d * 0.22, cy + d * 0.08]], { espessura: 3.2, cor: cor.laranja });
  return s;
}

export function grupos() {
  semear("grupos");
  let s = "";

  // você (bonequinho + celular), servidor grande e as 6 pessoas do grupo
  const FV = { x: 22, y: 246, w: 136, h: 318 };
  const SV = { x: 222, y: 66, w: 232, h: 600 };
  const CA = { x: 244, y: 146, w: 188, h: 186 }; // caderno
  const LI = { x: 244, y: 378, w: 188, h: 266 }; // lista do grupo
  const XB = 620; // bonequinhos da direita
  const XF = 670; // celulares da direita
  const FW = 64, FH = 96;
  const XS1 = 790, XS2 = 896; // ícones de situação
  const X0 = SV.x + SV.w + 8, X1 = XB - 40; // começo e fim das setas de cópia

  let cena =
    // você
    boneco(FV.x + FV.w / 2, 162, 30, [claro.amarelo, cor.tinta]) +
    ret(FV.x, FV.y, FV.w, FV.h, { preench: "#ffffff", hachura: "solid", espessura: E }) +
    linha([[FV.x + FV.w / 2 - 22, FV.y + 22], [FV.x + FV.w / 2 + 22, FV.y + 22]], { espessura: E }) +
    elipse(FV.x + FV.w / 2, FV.y + FV.h - 26, 24, 24, { espessura: 2.6 }) +
    balao(FV.x + 14, FV.y + 50, 104, 68) +
    txt(FV.x + 62, FV.y + 85, "oi", { tam: 42 }) +
    txt(FV.x + FV.w / 2, FV.y + FV.h + 38, "você", { tam: 38 }) +
    // servidor
    txt(SV.x + SV.w / 2, 36, "servidor", { tam: 32, cor: cor.cinza }) +
    ret(SV.x, SV.y, SV.w, SV.h, { preench: claro.azul, gap: 11, espessura: E }) +
    elipse(SV.x + 26, SV.y + 28, 15, 15, { preench: cor.verde, hachura: "solid", cor: cor.verde }) +
    elipse(SV.x + 50, SV.y + 28, 15, 15, { preench: cor.verde, hachura: "solid", cor: cor.verde }) +
    linha([[SV.x + SV.w - 80, SV.y + 28], [SV.x + SV.w - 24, SV.y + 28]], { espessura: 2.8 }) +
    linha([[SV.x, SV.y + 56], [SV.x + SV.w, SV.y + 56]], { espessura: 2.6 });
  // as pessoas do grupo, cada uma com seu celular
  PESSOAS.forEach((p, i) => {
    const y = YP(i);
    cena += boneco(XB, y - 4, 20, p);
    cena += ret(XF, y - FH / 2, FW, FH, { preench: "#ffffff", hachura: "solid", espessura: 2.8 });
    cena += linha([[XF + FW / 2 - 12, y - FH / 2 + 12], [XF + FW / 2 + 12, y - FH / 2 + 12]], { espessura: 2.4 });
  });
  s += etapa(0, cena);

  // 1. "guarda sua mensagem": a carta vai do celular para o caderno do servidor
  let aneis = "";
  for (let k = 0; k < 6; k++) aneis += elipse(CA.x + 22 + k * 29, CA.y, 14, 14, { preench: "#ffffff", hachura: "solid", espessura: 2.4 });
  s += etapa(
    1,
    carta(166, 214, 46, 32) +
      seta(FV.x + FV.w + 6, 302, CA.x - 4, 252, { espessura: E, ponta: 16 }) +
      ret(CA.x, CA.y, CA.w, CA.h, { preench: "#ffffff", hachura: "solid", espessura: E }) +
      aneis +
      balao(CA.x + 28, CA.y + 30, 112, 64) +
      txt(CA.x + 76, CA.y + 63, "oi", { tam: 40 }),
  );

  // 2. "uma vez só": só 1 vez, sublinhado em vermelho
  s += etapa(
    2,
    txt(CA.x + CA.w / 2, CA.y + 136, "só 1 vez", { tam: 40, cor: cor.vermelho }) +
      curva([[CA.x + 26, CA.y + 162], [CA.x + 94, CA.y + 168], [CA.x + 162, CA.y + 160]], { cor: cor.vermelho, espessura: 3.2 }),
  );

  // 3. "a lista de": a prancheta com quem está no grupo
  let lista =
    ret(LI.x, LI.y, LI.w, LI.h, { preench: "#ffffff", hachura: "solid", espessura: E }) +
    ret(LI.x + LI.w / 2 - 36, LI.y - 12, 72, 24, { preench: cor.tinta, hachura: "solid", espessura: 2.4 }) +
    txt(LI.x + LI.w / 2, LI.y + 40, "grupo", { tam: 32 });
  PESSOAS.forEach((p, i) => {
    const cx = LI.x + 50 + (i % 2) * 88;
    const cy = LI.y + 100 + Math.floor(i / 2) * 58;
    lista += boneco(cx, cy, 13, p);
  });
  s += etapa(3, lista);

  // 4. "uma cópia para": uma seta com uma carta para cada pessoa
  let copias = "";
  const y0 = (y) => 350 + (y - 350) * 0.5;
  PESSOAS.forEach((_, i) => {
    const y = YP(i);
    copias += seta(X0, y0(y), X1, y, { espessura: 3, ponta: 15 });
  });
  PESSOAS.forEach((_, i) => {
    const y = YP(i);
    copias += carta((X0 + X1) / 2 - 22, (y0(y) + y) / 2 - 15, 44, 30);
  });
  s += etapa(4, copias);

  // 5. "o app aberto": a mensagem aparece no celular, ✓ e raio (chegou na hora)
  let agora = "";
  PESSOAS.forEach((_, i) => {
    if (FORA.has(i)) return;
    const y = YP(i);
    agora += balao(XF + 8, y - 14, 44, 28, 2.4);
    agora += certo(XS1, y + 2, 50, cor.verde);
    agora += raio(XS2, y);
  });
  s += etapa(5, agora);

  // 6. "recebe uma notificação": app fechado → tela apagada e sininho
  let aviso = "";
  for (const i of FORA) {
    const y = YP(i);
    aviso += ret(XF + 9, y - 24, FW - 18, FH - 42, { preench: cor.cinza, hachura: "cross-hatch", gap: 8, cor: cor.cinza, espessura: 2 });
    aviso += sino(XS1, y + 2);
  }
  s += etapa(6, aviso);

  // 7. "a mensagem fica" (esperando): o relógio ao lado do sininho
  let espera = "";
  for (const i of FORA) espera += relogio(XS2, YP(i) + 2, 64);
  s += etapa(7, espera);

  return svg(968, 690, s);
}
