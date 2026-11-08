// Cena "E se o Bruno estiver com o celular desligado?" (parte 2): a mensagem espera numa caixa de
// correio no servidor; a notificação é só um aviso (pode se perder); quando o Bruno liga o celular, o
// app pergunta "o que chegou pra mim?" e pega tudo; enquanto isso, a Ana vê um tiquinho só.
import { ret, elipse, linha, caminho, seta, txt, check, xis, svg, etapa, semear, cor, claro } from "../diagramas.mjs";

const E = 3.1; // espessura das formas principais

/** Celular desenhado (moldura, alto-falante e tela). */
function fone(x, y, w, h, tela = {}) {
  let s = ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: E });
  s += linha([[x + w / 2 - 18, y + 13], [x + w / 2 + 18, y + 13]], { espessura: 2.8 });
  s += ret(x + 10, y + 26, w - 20, h - 46, { espessura: 2.2, gap: 8, ...tela });
  return s;
}

/** Envelope (carta) centrado em (cx, cy). */
function carta(cx, cy, w = 46, h = 32, c = cor.tinta) {
  const x = cx - w / 2, y = cy - h / 2;
  return (
    ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: 2.6, cor: c }) +
    linha([[x, y], [cx, cy + 2], [x + w, y]], { espessura: 2.4, cor: c })
  );
}

export function offline() {
  semear("offline");
  let s = "";

  // ---------------------------------------------------------------- 0: Ana, servidor, Bruno desligado
  let e0 = "";
  // Ana e a mensagem dela
  e0 += txt(100, 38, "Ana", { tam: 34 });
  e0 += fone(30, 64, 140, 200);
  e0 += ret(66, 104, 88, 42, { preench: claro.verde, hachura: "solid", espessura: 2.6 });
  e0 += txt(96, 125, "oi", { tam: 30 });
  e0 += seta(178, 150, 230, 150, { espessura: E, ponta: 16 });
  // servidor: caixa com luzinhas
  e0 += ret(236, 24, 370, 306, { preench: claro.cinza, hachura: "hachure", gap: 11, espessura: E });
  e0 += linha([[236, 86], [606, 86]], { espessura: 2.8 });
  for (const lx of [268, 298, 328]) e0 += elipse(lx, 55, 18, 18, { preench: cor.verde, hachura: "solid", cor: cor.verde });
  e0 += txt(470, 55, "servidor", { tam: 36 });
  // Bruno com o celular desligado (tela escura, dormindo) — por último, junto com "celular desligado"
  e0 += txt(860, 38, "Bruno", { tam: 34 });
  e0 += fone(790, 64, 140, 200, { preench: cor.tinta, hachura: "cross-hatch", gap: 9 });
  e0 += txt(860, 150, "zZz", { tam: 44, halo: 9 });
  s += etapa(0, e0);

  // ---------------------------------------------------------------- 1: caixa de correio com a carta
  let e1 = "";
  e1 += caminho("M262,264 L262,160 A68,46 0 0 1 398,160 L398,264 Z", { preench: claro.amarelo, gap: 9, espessura: E });
  e1 += ret(289, 194, 82, 14, { preench: cor.tinta, hachura: "solid" });
  e1 += carta(330, 172, 62, 44);
  e1 += ret(317, 264, 26, 46, { preench: cor.tinta, hachura: "solid" });
  e1 += linha([[280, 312], [380, 312]], { espessura: 2.8 });
  // bandeirinha levantada: tem carta
  e1 += linha([[398, 226], [422, 226], [422, 140]], { espessura: 2.8 });
  e1 += ret(422, 140, 40, 28, { preench: cor.vermelho, hachura: "solid", cor: cor.vermelho });
  e1 += txt(514, 252, "esperando\no Bruno", { tam: 30, cor: cor.laranja });
  s += etapa(1, e1);

  // ---------------------------------------------------------------- 2: notificação (sininho)
  let e2 = "";
  const bx = 654, by = 96;
  e2 += caminho(`M${bx - 20},${by + 16} C${bx - 20},${by - 26} ${bx + 20},${by - 26} ${bx + 20},${by + 16} L${bx + 27},${by + 24} L${bx - 27},${by + 24} Z`, {
    preench: claro.amarelo,
    hachura: "solid",
    espessura: E,
  });
  e2 += elipse(bx, by + 31, 12, 12, { preench: cor.tinta, hachura: "solid" });
  e2 += linha([[bx, by - 22], [bx, by - 31]], { espessura: 2.8 });
  e2 += txt(bx, 36, "aviso", { tam: 30 });
  e2 += seta(690, 112, 782, 150, { espessura: 2.8, tracejado: true, ponta: 15 });
  s += etapa(2, e2);

  // ---------------------------------------------------------------- 3: o aviso pode se perder
  let e3 = "";
  e3 += xis(736, 131, 40);
  e3 += txt(698, 205, "pode se\nperder", { tam: 32, cor: cor.vermelho });
  s += etapa(3, e3);

  // ---------------------------------------------------------------- 4: Bruno liga o celular
  let e4 = "";
  e4 += seta(860, 276, 860, 390, { espessura: E, ponta: 16, cor: cor.verde });
  e4 += caminho("M902,318 A18,18 0 1 0 922,318", { espessura: 3.2, cor: cor.verde });
  e4 += linha([[912, 306], [912, 330]], { espessura: 3.2, cor: cor.verde });
  e4 += txt(820, 334, "liga", { tam: 30, cor: cor.verde });
  e4 += fone(790, 400, 140, 220, { preench: claro.amarelo, hachura: "hachure", gap: 10 });
  s += etapa(4, e4);

  // ---------------------------------------------------------------- 5: o app pergunta
  let e5 = "";
  e5 += seta(784, 440, 612, 300, { espessura: E, ponta: 16, cor: cor.azul });
  e5 += txt(728, 336, "?", { tam: 44, cor: cor.azul });
  e5 += caminho("M676,566 L784,548 L700,614 Z", { preench: "#ffffff", hachura: "solid", espessura: 2.8, cor: cor.azul });
  e5 += elipse(540, 600, 330, 118, { preench: "#ffffff", hachura: "solid", espessura: E, cor: cor.azul });
  e5 += txt(540, 600, "o que chegou\npra mim?", { tam: 32, cor: cor.azul });
  s += etapa(5, e5);

  // ---------------------------------------------------------------- 6: e pega tudo
  let e6 = "";
  e6 += seta(350, 338, 784, 520, { espessura: 3.4, ponta: 17, cor: cor.verde });
  for (const t of [0.3, 0.55, 0.8]) e6 += carta(350 + 434 * t, 338 + 182 * t, 46, 32, cor.verde);
  e6 += txt(468, 462, "pega tudo", { tam: 32, cor: cor.verde });
  // ✓ verde: isso sim garante a entrega (contraste com o ✗ do aviso)
  e6 += linha([[325, 462], [341, 480], [371, 440]], { espessura: 4.5, cor: cor.verde });
  for (let i = 0; i < 3; i++) {
    const y = 440 + i * 46;
    e6 += ret(808, y, 84, 34, { preench: "#ffffff", hachura: "solid", espessura: 2.4 });
    e6 += i === 0 ? txt(838, y + 17, "oi", { tam: 28 }) : linha([[820, y + 17], [876, y + 17]], { espessura: 2.2, cor: cor.cinza });
  }
  s += etapa(6, e6);

  // ---------------------------------------------------------------- 7: Ana vê um tiquinho só há horas
  let e7 = "";
  e7 += check(138, 127, 16, cor.cinza);
  e7 += ret(32, 338, 196, 84, { preench: claro.verde, hachura: "solid", espessura: E });
  e7 += txt(84, 380, "oi", { tam: 42 });
  e7 += linha([[146, 382], [166, 404], [204, 358]], { espessura: 5, cor: cor.cinza });
  e7 += elipse(92, 530, 104, 104, { preench: "#ffffff", hachura: "solid", espessura: E });
  e7 += linha([[92, 530], [92, 494]], { espessura: 3.2 });
  e7 += linha([[92, 530], [118, 544]], { espessura: 3.2 });
  e7 += txt(210, 530, "horas", { tam: 38 });
  e7 += txt(146, 636, "1 tique só", { tam: 34, cor: cor.cinza });
  s += etapa(7, e7);

  return svg(968, 690, s);
}
