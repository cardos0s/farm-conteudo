import { ret, elipse, linha, caminho as traco, seta, txt, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Parte 2, cenas "Agora a Ana manda" e "Depois o servidor da Ana": o caminho do "oi" da Ana até o
// Bruno, desenhado em duas cenas. Cena 1 (etapas 1-6): sai do celular, chega no servidor, o servidor
// anota no caderno com cadeado, só depois avisa "recebi" e aparece o primeiro tiquinho. Cena 2
// (etapas 7-13): o servidor olha a lista da recepção (Bruno = sala 40), passa ao servidor do Bruno,
// que entrega no celular dele; o "chegou" volta pelo mesmo caminho e aparecem os dois tiquinhos.

const E = 3.2; // espessura das formas principais

// colunas: celular da Ana | servidor da Ana | servidor do Bruno | celular do Bruno
const FA = { x: 22, y: 100, w: 118, h: 360 };
const FB = { x: 828, y: 100, w: 118, h: 360 };
const SA = { x: 296, y: 110, w: 100 };
const SB = { x: 572, y: 110, w: 100 };
const SH = 184; // altura do servidor (3 gavetas)
// faixas das setas
const Y_IDA = 146; // a mensagem indo
const Y_RECEBI = 222; // o "recebi" do servidor da Ana
const Y_VOLTA = 280; // o "chegou" voltando
// balão da conversa (embaixo da tela, como no WhatsApp)
const BY = 344, BH = 70;
// tiquinhos da Ana (centro do primeiro)
const TX = FA.x + 70, TY = BY + 46;
// tiquinhos grandes, embaixo do celular da Ana
const GX = 62, GY = 512;

/** Celular grande: contorno, alto-falante, barra do WhatsApp e botão. */
function fone(f) {
  return (
    ret(f.x, f.y, f.w, f.h, { preench: "#ffffff", hachura: "solid", espessura: E }) +
    linha([[f.x + f.w / 2 - 20, f.y + 16], [f.x + f.w / 2 + 20, f.y + 16]], { espessura: E }) +
    ret(f.x + 10, f.y + 30, f.w - 20, 30, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 2 }) +
    elipse(f.x + 28, f.y + 45, 16, 16, { preench: "#ffffff", hachura: "solid", cor: "#ffffff", espessura: 1.4 }) +
    elipse(f.x + f.w / 2, f.y + f.h - 22, 20, 20, { espessura: 2.6 })
  );
}

/** Servidor: três gavetas com luzinhas. */
function servidor(x, y, w) {
  let s = "";
  for (let k = 0; k < 3; k++) {
    const yy = y + k * 64;
    s += ret(x, yy, w, 56, { preench: claro.azul, gap: 9, espessura: E });
    s += elipse(x + 20, yy + 28, 13, 13, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.6 });
    s += elipse(x + 40, yy + 28, 13, 13, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 1.6 });
    s += linha([[x + 58, yy + 28], [x + w - 14, yy + 28]], { espessura: 2.8 });
  }
  return s;
}

/** Número do passo numa bolinha grande. */
const num = (x, y, n, c = cor.azul) =>
  elipse(x, y, 42, 42, { preench: c, hachura: "solid", cor: c, espessura: 2 }) + txt(x, y + 1, n, { tam: 28, cor: "#ffffff" });

/** Mensagem "oi" viajando em cima da seta. */
const bolha = (cx, cy) =>
  ret(cx - 29, cy - 21, 58, 42, { preench: claro.verde, hachura: "solid", espessura: 2.8 }) + txt(cx, cy, "oi", { tam: 30 });

/** Tiquinho. */
const tique = (x, y, t, c, e = 4.4) =>
  linha([[x - t * 0.5, y], [x - t * 0.1, y + t * 0.4], [x + t * 0.6, y - t * 0.5]], { cor: c, espessura: e });

/** Cadeado. */
function cadeado(cx, cy) {
  return (
    traco(`M${cx - 15},${cy - 4} L${cx - 15},${cy - 20} Q${cx - 15},${cy - 38} ${cx},${cy - 38} Q${cx + 15},${cy - 38} ${cx + 15},${cy - 20} L${cx + 15},${cy - 4}`, {
      espessura: 4,
    }) +
    ret(cx - 26, cy - 6, 52, 42, { preench: claro.amarelo, hachura: "solid", espessura: E }) +
    elipse(cx, cy + 10, 10, 10, { preench: cor.tinta, hachura: "solid", espessura: 1.4 }) +
    linha([[cx, cy + 12], [cx, cy + 24]], { espessura: 3 })
  );
}

export function caminho() {
  semear("caminho");
  let s = "";

  // ---------------------------------------------------------------- 0: os quatro personagens
  {
    let c = "";
    c += fone(FA) + txt(FA.x + FA.w / 2, 56, "Ana", { tam: 42, cor: cor.violeta });
    c += fone(FB) + txt(FB.x + FB.w / 2, 56, "Bruno", { tam: 42, cor: cor.laranja });
    c += servidor(SA.x, SA.y, SA.w);
    c += txt(SA.x + SA.w / 2, 40, "servidor", { tam: 28 }) + txt(SA.x + SA.w / 2, 74, "da Ana", { tam: 28, cor: cor.violeta });
    c += servidor(SB.x, SB.y, SB.w);
    c += txt(SB.x + SB.w / 2, 40, "servidor", { tam: 28 }) + txt(SB.x + SB.w / 2, 74, "do Bruno", { tam: 28, cor: cor.laranja });
    s += etapa(0, c);
  }

  // ---------------------------------------------------------------- 1: "oi pro Bruno" (a Ana escreve)
  s += etapa(
    1,
    ret(FA.x + 10, BY, FA.w - 20, BH, { preench: claro.verde, hachura: "solid", espessura: 2.8 }) + txt(FA.x + 32, BY + 30, "oi", { tam: 40 }),
  );

  // ---------------------------------------------------------------- 2: "sai do celular" e vai pro servidor
  {
    const x1 = FA.x + FA.w + 8, x2 = SA.x - 8;
    s += etapa(2, seta(x1, Y_IDA, x2, Y_IDA, { espessura: E, ponta: 18 }) + bolha(x1 + 50, Y_IDA) + num(x1 + 18, Y_IDA - 46, "1"));
  }

  // ---------------------------------------------------------------- 3: "anotar essa mensagem" num caderno
  {
    let c = "";
    const ax = SA.x + 40;
    c += seta(ax, SA.y + SH + 10, ax, 452, { espessura: E, ponta: 18 });
    c += num(ax - 36, SA.y + SH + 42, "2");
    c += txt(ax - 20, 404, "anota", { tam: 34, ancora: "end" });
    // caderno de espiral
    const CX = 214, CY = 462, CW = 240, CH = 196;
    c += ret(CX, CY, CW, CH, { preench: "#ffffff", hachura: "solid", espessura: E });
    c += ret(CX, CY, 30, CH, { preench: claro.violeta, gap: 8, espessura: E });
    for (let k = 0; k < 5; k++) c += elipse(CX + 30, CY + 24 + k * 37, 18, 12, { espessura: 2.4 });
    for (let k = 0; k < 3; k++) c += linha([[CX + 50, CY + 76 + k * 42], [CX + CW - 16, CY + 76 + k * 42]], { cor: cor.cinza, espessura: 1.8 });
    c += txt(CX + 64, CY + 46, "\"oi\"", { tam: 42, ancora: "start" });
    s += etapa(3, c);
  }

  // ---------------------------------------------------------------- 4: "num lugar seguro" (cadeado)
  s += etapa(4, cadeado(404, 608));

  // ---------------------------------------------------------------- 5: "ele avisa o celular": recebi!
  {
    const x1 = SA.x - 8, x2 = FA.x + FA.w + 8;
    s += etapa(
      5,
      seta(x1, Y_RECEBI, x2, Y_RECEBI, { espessura: E, ponta: 18, cor: cor.verde }) +
        num(x1 - 18, Y_RECEBI - 34, "3", cor.verde) +
        txt((x1 + x2) / 2 - 6, Y_RECEBI + 27, "recebi!", { tam: 34, cor: cor.verde }),
    );
  }

  // ---------------------------------------------------------------- 6: "o primeiro tiquinho"
  s += etapa(6, tique(TX, TY, 26, cor.cinza) + tique(GX, GY, 54, cor.cinza, 6.5));

  // ---------------------------------------------------------------- 7: "olha a lista" da recepção
  {
    let c = "";
    const x1 = SA.x + SA.w - 4, y1 = SA.y + SH + 10, x2 = 516, y2 = 488;
    c += seta(x1, y1, x2, y2, { espessura: E, ponta: 18, cor: cor.laranja });
    c += num(x1 + 46, y1 + 12, "4");
    c += txt(476, 392, "Bruno?", { tam: 34, ancora: "start", cor: cor.laranja });
    // prancheta com a lista
    const PX = 524, PY = 476, PW = 250, PH = 182;
    c += ret(PX, PY, PW, PH, { preench: claro.amarelo, gap: 10, espessura: E });
    c += ret(PX + 14, PY + 22, PW - 28, PH - 34, { preench: "#ffffff", hachura: "solid", espessura: 2.4 });
    c += ret(PX + PW / 2 - 36, PY - 14, 72, 30, { preench: cor.cinza, hachura: "solid", espessura: 2.6 });
    c += txt(PX + 28, PY + 64, "Ana", { tam: 34, ancora: "start", cor: cor.cinza });
    c += seta(PX + 128, PY + 64, PX + 162, PY + 64, { espessura: 2.6, ponta: 11, cor: cor.cinza });
    c += txt(PX + 198, PY + 64, "12", { tam: 36, cor: cor.cinza });
    c += linha([[PX + 30, PY + 92], [PX + PW - 30, PY + 92]], { cor: cor.cinza, espessura: 1.8 });
    c += linha([[PX + 30, PY + 148], [PX + PW - 30, PY + 148]], { cor: cor.cinza, espessura: 1.8 });
    // recepcionista atrás do balcão
    const rx = 866;
    c += elipse(rx, 518, 40, 40, { preench: "#ffffff", hachura: "solid", espessura: E });
    c += traco(`M${rx - 40},${592} Q${rx - 38},${546} ${rx},${546} Q${rx + 38},${546} ${rx + 40},${592}`, { espessura: E });
    c += ret(788, 592, 158, 66, { preench: claro.laranja, gap: 10, espessura: E });
    c += txt(867, 625, "recepção", { tam: 32, halo: 7 });
    s += etapa(7, c);
  }

  // ---------------------------------------------------------------- 8: "Na sala 40"
  {
    let c = "";
    c += txt(544, 596, "Bruno", { tam: 34, ancora: "start", cor: cor.laranja });
    c += seta(652, 596, 686, 596, { espessura: 2.8, ponta: 11, cor: cor.laranja });
    c += txt(722, 596, "40", { tam: 38, cor: cor.laranja });
    c += elipse(722, 596, 62, 50, { cor: cor.laranja, espessura: 3 });
    c += txt(SB.x + SB.w / 2, SB.y + SH + 36, "sala 40", { tam: 36, cor: cor.laranja });
    s += etapa(8, c);
  }

  // ---------------------------------------------------------------- 9: "passa a mensagem" ao servidor do Bruno
  {
    const x1 = SA.x + SA.w + 8, x2 = SB.x - 8;
    s += etapa(9, seta(x1, Y_IDA, x2, Y_IDA, { espessura: E, ponta: 18 }) + bolha((x1 + x2) / 2 + 12, Y_IDA) + num(x1 + 20, Y_IDA - 46, "5"));
  }

  // ---------------------------------------------------------------- 10: "entrega no celular" do Bruno
  {
    const x1 = SB.x + SB.w + 8, x2 = FB.x - 8;
    s += etapa(
      10,
      seta(x1, Y_IDA, x2, Y_IDA, { espessura: E, ponta: 18 }) +
        bolha(x1 + 58, Y_IDA) +
        num(x1 + 30, Y_IDA - 44, "6") +
        ret(FB.x + 10, BY, FB.w - 34, BH, { preench: claro.cinza, hachura: "solid", espessura: 2.8 }) +
        txt(FB.x + 46, BY + 34, "oi", { tam: 40 }),
    );
  }

  // ---------------------------------------------------------------- 11: "responde chegou"
  {
    const x1 = FB.x - 8, x2 = SB.x + SB.w + 8;
    s += etapa(
      11,
      seta(x1, Y_VOLTA, x2, Y_VOLTA, { espessura: E, ponta: 18, cor: cor.verde }) +
        num(x1 - 18, Y_VOLTA - 34, "7", cor.verde) +
        txt((x1 + x2) / 2 + 4, Y_VOLTA + 28, "chegou!", { tam: 34, cor: cor.verde }),
    );
  }

  // ---------------------------------------------------------------- 12: "caminho de volta" até a Ana
  {
    let c = "";
    c += seta(SB.x - 8, Y_VOLTA, SA.x + SA.w + 8, Y_VOLTA, { espessura: E, ponta: 18, cor: cor.verde });
    c += num(SB.x - 26, Y_VOLTA - 34, "8", cor.verde);
    c += seta(SA.x - 8, Y_VOLTA, FA.x + FA.w + 8, Y_VOLTA, { espessura: E, ponta: 18, cor: cor.verde });
    s += etapa(12, c);
  }

  // ---------------------------------------------------------------- 13: "os dois tiquinhos": entregue
  s += etapa(
    13,
    tique(TX + 16, TY, 26, cor.cinza) +
      tique(GX + 34, GY, 54, cor.cinza, 6.5) +
      txt(100, 590, "entregue!", { tam: 40, cor: cor.verde }),
  );

  return svg(968, 690, s);
}
