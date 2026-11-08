// Cena "É como mandar a mesma carta para mil endereços" (parte 3): uma carta vira uma cópia para cada
// casa (× 1.000); num gráfico, quanto maior o grupo, maior a pilha de cartas (trabalho); uma barreira
// limita o tamanho do grupo (10.000 não pode) e a placa diz o máximo do WhatsApp: 1.024 pessoas.
import { ret, elipse, linha, caminho, seta, txt, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

const E = 3.1; // espessura das formas principais

/** Coraçãozinho (lacre da carta) centrado em (x, y). */
function coracao(x, y, t, c = cor.vermelho) {
  return caminho(
    `M${x},${y + t * 0.42} C${x - t * 0.95},${y - t * 0.2} ${x - t * 0.42},${y - t * 0.9} ${x},${y - t * 0.32} C${x + t * 0.42},${y - t * 0.9} ${x + t * 0.95},${y - t * 0.2} ${x},${y + t * 0.42} Z`,
    { preench: c, hachura: "solid", cor: c, espessura: 2 },
  );
}

/** Envelope (verso, com a aba em V) centrado em (cx, cy). */
function envelope(cx, cy, w, h, o = {}) {
  const x = cx - w / 2, y = cy - h / 2;
  const esp = o.espessura ?? 2.6;
  let s = ret(x, y, w, h, { preench: o.preench ?? "#ffffff", hachura: "solid", espessura: esp, cor: o.cor, tracejado: o.tracejado });
  s += linha([[x, y], [cx, cy + h * 0.12], [x + w, y]], { espessura: esp * 0.85, cor: o.cor, tracejado: o.tracejado });
  if (o.dobras) {
    s += linha([[x, y + h], [cx - w * 0.12, cy + h * 0.02]], { espessura: 2.2, cor: cor.cinza });
    s += linha([[x + w, y + h], [cx + w * 0.12, cy + h * 0.02]], { espessura: 2.2, cor: cor.cinza });
  }
  if (o.lacre) s += coracao(cx, cy + h * 0.12, o.lacre);
  return s;
}

/** Casinha (telhado, parede) com a cópia da carta na porta. `y` = linha do beiral. */
function casa(cx, y) {
  let s = caminho(`M${cx - 45},${y} L${cx},${y - 38} L${cx + 45},${y} Z`, { preench: claro.vermelho, gap: 8, espessura: 2.9 });
  s += ret(cx - 35, y, 70, 62, { preench: claro.amarelo, gap: 9, espessura: 2.9 });
  s += envelope(cx, y + 32, 44, 28, { espessura: 2.4, lacre: 11 });
  return s;
}

export function cartas() {
  semear("cartas");
  let s = "";

  // ---------------------------------------------------------------- 0: uma carta só
  s += etapa(0, txt(118, 50, "1 carta", { tam: 40 }) + envelope(118, 166, 184, 124, { espessura: E, dobras: true, lacre: 34 }));

  // ---------------------------------------------------------------- 1: uma cópia em cada casa, × 1.000
  let e1 = "";
  e1 += seta(222, 146, 312, 98, { espessura: E, ponta: 17 });
  e1 += seta(222, 186, 312, 236, { espessura: E, ponta: 17 });
  const cols = [366, 462, 558, 654];
  for (const cx of cols) e1 += casa(cx, 74);
  for (const cx of cols) e1 += casa(cx, 214);
  for (const y of [105, 245]) for (const dx of [0, 16, 32]) e1 += elipse(718 + dx, y, 8, 8, { preench: cor.tinta, hachura: "solid", espessura: 1.6 });
  e1 += txt(946, 172, "× 1.000", { tam: 48, cor: cor.laranja, ancora: "end" });
  s += etapa(1, e1);

  // ---------------------------------------------------------------- gráfico: grupo (x) e trabalho (y)
  const X0 = 70, Y0 = 622; // origem dos eixos
  const bar = [
    [152, "10", 1],
    [262, "100", 3],
    [372, "1.000", 6],
  ];

  // 2: "maior o grupo" — o eixo do tamanho do grupo
  let e2 = "";
  e2 += seta(X0, Y0, 604, Y0, { espessura: E, ponta: 17 });
  for (const [cx, n] of bar) e2 += txt(cx, Y0 + 30, n, { tam: 32 });
  e2 += txt(614, Y0, "grupo", { tam: 30, ancora: "start", cor: cor.azul });
  s += etapa(2, e2);

  // 3: "mais trabalho" — pilhas de cartas crescendo, e o eixo do trabalho
  let e3 = "";
  e3 += seta(X0, Y0, X0, 352, { espessura: E, ponta: 17 });
  e3 += txt(X0 + 18, 352, "trabalho", { tam: 32, ancora: "start", cor: cor.laranja });
  for (const [cx, , k] of bar) {
    for (let i = 0; i < k; i++) e3 += envelope(cx, Y0 - 22 - i * 37, 86, 32, { espessura: 2.5, preench: "#ffffff" });
  }
  s += etapa(3, e3);

  // 4: "limita o tamanho" — barreira listrada; grupo maior que isso não pode
  let e4 = "";
  e4 += ret(440, 384, 26, Y0 - 384, { preench: cor.vermelho, gap: 9, cor: cor.vermelho, espessura: E });
  e4 += txt(446, 352, "limite", { tam: 32, cor: cor.vermelho });
  // pilha fantasma de um grupo de 10.000: bem mais alta (mais trabalho) e riscada
  for (let i = 0; i < 8; i++) e4 += envelope(548, Y0 - 22 - i * 37, 72, 30, { espessura: 2.3, cor: cor.cinza, tracejado: true });
  e4 += txt(548, Y0 + 30, "10.000", { tam: 30, cor: cor.cinza });
  e4 += linha([[506, 424], [590, 516]], { cor: cor.vermelho, espessura: 4.4 });
  e4 += linha([[590, 424], [506, 516]], { cor: cor.vermelho, espessura: 4.4 });
  s += etapa(4, e4);

  // 5: "No WhatsApp" — a placa de limite (ainda sem o número)
  const PX = 818, PY = 468;
  let e5 = "";
  e5 += ret(808, PY + 108, 20, 642 - PY - 108, { preench: claro.cinza, hachura: "solid", espessura: 2.8 });
  e5 += linha([[770, 644], [866, 644]], { espessura: E });
  e5 += elipse(PX, PY, 236, 236, { preench: cor.vermelho, hachura: "solid", cor: cor.vermelho, espessura: E });
  e5 += elipse(PX, PY, 188, 188, { preench: "#ffffff", hachura: "solid", espessura: 2.6 });
  // balãozinho verde do app no canto da placa
  e5 += caminho("M664,378 L650,412 L686,388 Z", { preench: claro.verde, hachura: "solid", cor: cor.verde, espessura: 2.6 });
  e5 += elipse(678, 360, 76, 58, { preench: claro.verde, hachura: "solid", cor: cor.verde, espessura: 2.8 });
  for (const dx of [-18, 0, 18]) e5 += elipse(678 + dx, 360, 9, 9, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.6 });
  s += etapa(5, e5);

  // 6: "1.024 pessoas" — o número na placa
  let e6 = "";
  e6 += txt(PX, PY - 56, "máx.", { tam: 32 });
  e6 += txt(PX, PY + 2, "1.024", { tam: 60 });
  e6 += txt(PX, PY + 56, "pessoas", { tam: 30 });
  s += etapa(6, e6);

  return svg(968, 690, s);
}
