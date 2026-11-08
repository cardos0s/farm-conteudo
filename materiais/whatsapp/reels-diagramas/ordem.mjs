// Parte 2, cena "Por que nessa ordem?": comparação lado a lado.
// Esquerda (errado): o servidor avisa ✓ primeiro, dá pane antes de anotar e a mensagem some sem ninguém saber.
// Direita (certo): primeiro anota no caderno, depois manda o ✓; ✓ = guardada (com cadeado), mas ainda não
// chegou no celular do Bruno.
import { ret, elipse, linha, caminho, seta, txt, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

const E = 3.2; // espessura das formas principais
const COLS = [20, 504]; // x inicial de cada coluna (largura 444)

/** Tiquinho desenhado (x,y = centro). */
const tique = (x, y, s, c, esp = 4) =>
  linha([[x - s * 0.5, y], [x - s * 0.1, y + s * 0.4], [x + s * 0.6, y - s * 0.5]], { cor: c, espessura: esp });

/** Xis desenhado. */
const xisG = (x, y, s, c = cor.vermelho, esp = 4.2) =>
  linha([[x - s / 2, y - s / 2], [x + s / 2, y + s / 2]], { cor: c, espessura: esp }) +
  linha([[x + s / 2, y - s / 2], [x - s / 2, y + s / 2]], { cor: c, espessura: esp });

/** Número numa bolinha (maior que o passo() padrão). */
const bola = (x, y, n, c = cor.azul) =>
  elipse(x, y, 44, 44, { preench: c, hachura: "solid", cor: c, espessura: 2.6 }) + txt(x, y + 2, n, { tam: 30, cor: "#ffffff" });

/** Servidor: duas caixas empilhadas com luzinhas. */
function servidor(x, y, w, luz = cor.verde) {
  let s = "";
  for (let k = 0; k < 2; k++) {
    const yy = y + k * 52;
    s += ret(x, yy, w, 46, { preench: claro.azul, hachura: "hachure", gap: 9, espessura: E });
    s += elipse(x + 24, yy + 23, 14, 14, { preench: luz, hachura: "solid", cor: luz });
    s += elipse(x + 46, yy + 23, 14, 14, { preench: luz, hachura: "solid", cor: luz });
    s += linha([[x + w - 62, yy + 23], [x + w - 18, yy + 23]], { espessura: 2.8 });
  }
  return s;
}

/** Celular grande (contorno, alto-falante e botão). */
const fone = (x, y, w, h) =>
  ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: E }) +
  linha([[x + w / 2 - 22, y + 20], [x + w / 2 + 22, y + 20]], { espessura: E }) +
  elipse(x + w / 2, y + h - 22, 20, 20, { espessura: 2.6 });

/** Caderno com espiral, margem vermelha e pautas. */
function caderno(x, y, w, h) {
  let s = ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: E });
  s += linha([[x + 30, y + 14], [x + 30, y + h - 8]], { cor: cor.vermelho, espessura: 2 });
  for (let k = 0; k < 3; k++) {
    const yy = y + 50 + k * 30;
    s += linha([[x + 14, yy], [x + w - 14, yy]], { cor: cor.cinza, espessura: 2 });
  }
  for (let i = 0; i < 6; i++) s += elipse(x + 18 + i * 23, y, 11, 24, { espessura: 2.6 });
  return s;
}

/** Carta (envelope). */
const carta = (x, y, w, h, o = {}) =>
  ret(x, y, w, h, { preench: o.preench, hachura: "solid", espessura: o.espessura ?? 2.8, cor: o.cor, tracejado: o.tracejado }) +
  linha([[x, y], [x + w / 2, y + h * 0.58], [x + w, y]], { espessura: o.espessura ?? 2.8, cor: o.cor, tracejado: o.tracejado });

/** Raio (pane) apontando para baixo-esquerda; (x,y) = canto de cima, k = escala. */
const raio = (x, y, k = 1) => {
  const p = [[0, 0], [-60, 66], [-28, 66], [-88, 136], [10, 46], [-24, 46], [28, 0]].map(([a, b]) => `${x + a * k},${y + b * k}`);
  return caminho(`M${p.join(" L")} Z`, { preench: claro.amarelo, hachura: "solid", cor: cor.laranja, espessura: E });
};

/** Cadeado (cx = centro, y = topo do corpo). */
const cadeado = (cx, y, w = 50, h = 42) =>
  caminho(`M${cx - w * 0.3},${y} L${cx - w * 0.3},${y - 14} Q${cx},${y - 44} ${cx + w * 0.3},${y - 14} L${cx + w * 0.3},${y}`, {
    espessura: 3.6,
    cor: cor.tinta,
  }) +
  ret(cx - w / 2, y, w, h, { preench: claro.laranja, hachura: "solid", espessura: E }) +
  elipse(cx, y + h * 0.42, 9, 9, { preench: cor.tinta, hachura: "solid" }) +
  linha([[cx, y + h * 0.5], [cx, y + h * 0.78]], { espessura: 3 });

/** Relógio. */
const relogio = (cx, cy, r) =>
  elipse(cx, cy, r * 2, r * 2, { preench: claro.amarelo, hachura: "solid", espessura: E }) +
  linha([[cx, cy], [cx, cy - r * 0.65]], { espessura: 3.2 }) +
  linha([[cx, cy], [cx + r * 0.5, cy + r * 0.2]], { espessura: 3.2 });

// posições dentro de cada coluna (relativas ao x inicial)
const SV = { x: 150, y: 88, w: 160 }; // servidor
const FA = { x: 12, y: 292, w: 176, h: 320 }; // celular da Ana
const BAL = { x: 28, y: 362, w: 144, h: 84 }; // balão "oi"
const CD = { x: 238, y: 306, w: 186, h: 150 }; // caderno
const SETA_OK = [172, 198, 112, 282]; // servidor → Ana
const SETA_ANOTA = [282, 198, 330, 288]; // servidor → caderno
const YSOB = 484; // texto embaixo do caderno

/** Cenário de uma coluna: título, servidor, caderno vazio e a Ana com o "oi" ainda sem tiquinho. */
function cenario(cx, titulo) {
  return (
    txt(cx + 246, 46, titulo, { tam: 42 }) +
    servidor(cx + SV.x, SV.y, SV.w) +
    txt(cx + 140, 140, "servidor", { tam: 30, cor: cor.cinza, ancora: "end" }) +
    caderno(cx + CD.x, CD.y, CD.w, CD.h) +
    fone(cx + FA.x, FA.y, FA.w, FA.h) +
    ret(cx + BAL.x, BAL.y, BAL.w, BAL.h, { preench: claro.verde, hachura: "solid", espessura: 2.8 }) +
    txt(cx + BAL.x + 42, BAL.y + 42, "oi", { tam: 50 }) +
    txt(cx + FA.x + FA.w / 2, 646, "Ana", { tam: 36 })
  );
}

/** Seta servidor → Ana com o ✓ aparecendo no balão. */
const avisa = (cx) =>
  seta(cx + SETA_OK[0], SETA_OK[1], cx + SETA_OK[2], SETA_OK[3], { espessura: E, ponta: 18 }) +
  tique(cx + BAL.x + 106, BAL.y + 44, 36, cor.cinza, 4.4);

export function ordem() {
  semear("ordem");
  let s = "";
  const [L, R] = COLS;
  const luzVermelha = (x, y) => elipse(x, y, 14, 14, { preench: cor.vermelho, hachura: "solid", cor: cor.vermelho });

  // 0. as duas colunas com o mesmo cenário
  s += etapa(
    0,
    linha([[484, 24], [484, 666]], { cor: cor.cinza, espessura: 2.2, tracejado: true }) +
      cenario(L, "avisa antes") +
      cenario(R, "anota antes"),
  );

  // 1. "o servidor avisasse": à esquerda, o ✓ vai para a Ana antes de anotar
  s += etapa(1, avisa(L) + bola(L + 100, 222, "1"));

  // 2. "desse um problema": um raio derruba o servidor (luzes vermelhas)
  s += etapa(
    2,
    raio(L + 389, 66, 0.92) +
      luzVermelha(L + SV.x + 24, SV.y + 23) +
      luzVermelha(L + SV.x + 46, SV.y + 23) +
      luzVermelha(L + SV.x + 24, SV.y + 75) +
      luzVermelha(L + SV.x + 46, SV.y + 75) +
      bola(L + 416, 206, "2") +
      txt(L + 222, 230, "pane!", { tam: 34, cor: cor.vermelho }),
  );

  // 3. "a mensagem sumia": a mensagem nunca chega ao caderno; ninguém sabe
  s += etapa(
    3,
    linha([[L + SETA_ANOTA[0], SETA_ANOTA[1]], [L + 296, 226]], { espessura: 2.8, cor: cor.cinza, tracejado: true }) +
      carta(L + 280, 230, 66, 44, { cor: cor.cinza, tracejado: true }) +
      xisG(L + 313, 252, 56) +
      txt(L + CD.x + CD.w / 2, YSOB, "sumiu", { tam: 38, cor: cor.vermelho }) +
      txt(L + 331, 548, "? ? ?", { tam: 58, cor: cor.vermelho }) +
      txt(L + 331, 614, "ninguém sabe", { tam: 34 }) +
      xisG(L + 82, 46, 38),
  );

  // 4. "o primeiro tiquinho": à direita, primeiro anota (1), depois o ✓ (2)
  s += etapa(
    4,
    seta(R + SETA_ANOTA[0], SETA_ANOTA[1], R + SETA_ANOTA[2], SETA_ANOTA[3], { espessura: E, ponta: 18 }) +
      bola(R + 356, 230, "1") +
      txt(R + CD.x + 92, CD.y + 52, "oi", { tam: 50, cor: cor.azul }) +
      avisa(R) +
      bola(R + 100, 222, "2"),
  );

  // 5. "WhatsApp guardou": ✓ = guardada
  s += etapa(5, txt(R + CD.x + CD.w / 2 - 4, YSOB, "✓ = guardada", { tam: 34, cor: cor.verde }));

  // 6. "está segura": cadeado no caderno e o certo
  s += etapa(6, cadeado(R + CD.x + CD.w - 14, 372, 56, 46) + linha([[R + 62, 46], [R + 76, 62], [R + 104, 26]], { cor: cor.verde, espessura: 4.6 }));

  // 7. "ainda não chegou": o celular do Bruno ainda vazio, esperando
  s += etapa(
    7,
    fone(R + 332, 518, 100, 118) +
      relogio(R + 382, 571, 22) +
      txt(R + 382, 655, "Bruno", { tam: 28 }) +
      txt(R + 264, 577, "ainda\nnão", { tam: 36, cor: cor.laranja }),
  );

  return svg(968, 690, s);
}
