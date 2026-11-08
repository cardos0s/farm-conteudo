// Parte 2, cena "Os tiquinhos": o Bruno abre a conversa, o celular dele manda mais um aviso
// (que volta pelo servidor até a Ana) e os tiquinhos dela ficam azuis.
// Embaixo, a linha do tempo dos tiquinhos: ✓ guardado → ✓✓ entregue → ✓✓ lido.
import { ret, elipse, linha, caminho, seta, txt, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

const E = 3.2; // espessura das formas principais

/** Um ou dois tiquinhos desenhados (x,y = centro do primeiro). */
function tiques(x, y, s, c, n = 2, esp = 3.6) {
  let r = "";
  for (let i = 0; i < n; i++) {
    const cx = x + i * s * 0.62;
    r += linha([[cx - s * 0.5, y], [cx - s * 0.1, y + s * 0.4], [cx + s * 0.6, y - s * 0.5]], { cor: c, espessura: esp });
  }
  return r;
}

/** Celular grande (contorno, alto-falante e botão). */
function fone(x, y, w, h) {
  return (
    ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: E }) +
    linha([[x + w / 2 - 22, y + 20], [x + w / 2 + 22, y + 20]], { espessura: E }) +
    elipse(x + w / 2, y + h - 24, 22, 22, { espessura: 2.6 })
  );
}

/** Servidor: caixas empilhadas com luzinhas. */
function servidor(x, y, w) {
  let s = "";
  for (let k = 0; k < 3; k++) {
    const yy = y + k * 52;
    s += ret(x, yy, w, 46, { preench: claro.azul, hachura: "hachure", gap: 9, espessura: E });
    s += elipse(x + 24, yy + 23, 13, 13, { preench: cor.verde, hachura: "solid", cor: cor.verde });
    s += elipse(x + 46, yy + 23, 13, 13, { preench: cor.verde, hachura: "solid", cor: cor.verde });
    s += linha([[x + w - 60, yy + 23], [x + w - 18, yy + 23]], { espessura: 2.8 });
  }
  return s;
}

/** Carta (envelope) pequena. */
function carta(x, y, w, h) {
  return (
    ret(x, y, w, h, { preench: claro.amarelo, hachura: "solid", espessura: 2.8 }) +
    linha([[x, y], [x + w / 2, y + h * 0.58], [x + w, y]], { espessura: 2.8 })
  );
}

/** Olho. */
function olho(cx, cy, w) {
  const h = w * 0.62;
  return (
    caminho(`M${cx - w / 2},${cy} Q${cx},${cy - h} ${cx + w / 2},${cy} Q${cx},${cy + h} ${cx - w / 2},${cy} Z`, {
      preench: "#ffffff",
      hachura: "solid",
      espessura: E,
    }) +
    elipse(cx, cy, w * 0.34, w * 0.34, { preench: cor.azul, hachura: "solid", cor: cor.azul }) +
    elipse(cx, cy, w * 0.12, w * 0.12, { preench: cor.tinta, hachura: "solid", cor: cor.tinta }) +
    linha([[cx - w * 0.28, cy - h * 0.42 - 6], [cx - w * 0.36, cy - h * 0.42 - 26]], { espessura: 2.8 }) +
    linha([[cx, cy - h / 2 - 8], [cx, cy - h / 2 - 30]], { espessura: 2.8 }) +
    linha([[cx + w * 0.28, cy - h * 0.42 - 6], [cx + w * 0.36, cy - h * 0.42 - 26]], { espessura: 2.8 })
  );
}

export function tiquinhos() {
  semear("tiquinhos");
  let s = "";

  // celulares e servidor
  const FA = { x: 36, y: 28, w: 196, h: 330 }; // Ana
  const FB = { x: 736, y: 28, w: 196, h: 330 }; // Bruno
  const SV = { x: 409, y: 118, w: 150 };
  const yB = 150; // altura dos balões
  // cartões da linha do tempo
  const CW = 268, CH = 196, CY = 452;
  const cx = [36, 350, 664];

  s += etapa(
    0,
    // Ana: balão verde "oi" com ✓✓ cinza
    fone(FA.x, FA.y, FA.w, FA.h) +
      ret(FA.x + 20, yB, 162, 88, { preench: claro.verde, hachura: "solid", espessura: 2.8 }) +
      txt(FA.x + 60, yB + 44, "oi", { tam: 46 }) +
      tiques(FA.x + 110, yB + 48, 38, cor.cinza, 2, 4.2) +
      txt(FA.x + FA.w / 2, 392, "Ana", { tam: 36 }) +
      // servidor no meio
      servidor(SV.x, SV.y, SV.w) +
      txt(SV.x + SV.w / 2, 300, "servidor", { tam: 32, cor: cor.cinza }) +
      // Bruno: balão cinza "oi" (chegou)
      fone(FB.x, FB.y, FB.w, FB.h) +
      ret(FB.x + 16, yB, 132, 88, { preench: claro.cinza, hachura: "solid", espessura: 2.8 }) +
      txt(FB.x + 60, yB + 44, "oi", { tam: 46 }) +
      txt(FB.x + FB.w / 2, 392, "Bruno", { tam: 36 }) +
      // linha do tempo: ✓ guardado → ✓✓ entregue → ?
      ret(cx[0], CY, CW, CH, { espessura: E }) +
      tiques(cx[0] + CW / 2 - 6, CY + 66, 46, cor.cinza, 1, 4.2) +
      txt(cx[0] + CW / 2, CY + 146, "guardado", { tam: 38 }) +
      seta(cx[0] + CW + 8, CY + CH / 2, cx[1] - 8, CY + CH / 2, { espessura: E, ponta: 16 }) +
      ret(cx[1], CY, CW, CH, { espessura: E }) +
      tiques(cx[1] + CW / 2 - 14, CY + 66, 46, cor.cinza, 2, 4.2) +
      txt(cx[1] + CW / 2, CY + 146, "entregue", { tam: 38 }) +
      seta(cx[1] + CW + 8, CY + CH / 2, cx[2] - 8, CY + CH / 2, { espessura: E, ponta: 16 }) +
      txt(cx[2] + CW / 2, CY + CH / 2, "?", { tam: 80, cor: cor.cinza }),
  );

  // 1. "abre a conversa": o Bruno abre e vê
  s += etapa(1, olho(648, 94, 118) + txt(648, 160, "abriu", { tam: 34, cor: cor.azul }));

  // 2. "o celular dele": o aviso sai do celular do Bruno até o servidor
  s += etapa(
    2,
    seta(FB.x - 10, 214, SV.x + SV.w + 12, 214, { espessura: E, ponta: 18, cor: cor.azul }) +
      carta(600, 238, 64, 44) +
      txt(676, 262, "li!", { tam: 32, cor: cor.azul, ancora: "start" }),
  );

  // 3. "mais um aviso": o aviso volta até a Ana
  s += etapa(
    3,
    seta(SV.x - 12, 214, FA.x + FA.w + 10, 214, { espessura: E, ponta: 18, cor: cor.azul }) +
      carta(266, 238, 64, 44) +
      txt(342, 262, "li!", { tam: 32, cor: cor.azul, ancora: "start" }),
  );

  // 4. "os tiquinhos": os tiquinhos da Ana ficam azuis e a linha do tempo ganha o "lido"
  s += etapa(
    4,
    ret(FA.x + 88, yB + 22, 86, 50, { preench: claro.verde, hachura: "solid", cor: claro.verde, espessura: 1 }) +
      tiques(FA.x + 110, yB + 48, 38, cor.azul, 2, 4.6) +
      linha([[FA.x + 124, yB - 10], [FA.x + 120, yB - 32]], { cor: cor.azul, espessura: 3 }) +
      linha([[FA.x + 148, yB - 12], [FA.x + 156, yB - 34]], { cor: cor.azul, espessura: 3 }) +
      linha([[FA.x + 170, yB - 8], [FA.x + 184, yB - 24]], { cor: cor.azul, espessura: 3 }) +
      ret(cx[2], CY, CW, CH, { preench: claro.azul, hachura: "solid", espessura: E, cor: cor.azul }) +
      tiques(cx[2] + CW / 2 - 14, CY + 66, 46, cor.azul, 2, 4.4) +
      txt(cx[2] + CW / 2, CY + 146, "lido", { tam: 40, cor: cor.azul }),
  );

  return svg(968, 690, s);
}
