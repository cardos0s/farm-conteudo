// Parte 3, cena "E um bônus": criptografia de ponta a ponta. O "oi" sai trancado do celular da Ana,
// passa pelo servidor do WhatsApp embaralhado (o olho riscado: nem o WhatsApp lê), chega ao Bruno e o
// cadeado abre; depois de entregue, a mensagem é apagada do servidor (lixeira) e a conversa fica
// guardada nos celulares.
import { ret, elipse, linha, caminho, seta, txt, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

const E = 3.1; // espessura das formas principais

/** Celular desenhado (moldura, alto-falante e tela). */
function fone(x, y, w, h) {
  let s = ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: E });
  s += linha([[x + w / 2 - 20, y + 15], [x + w / 2 + 20, y + 15]], { espessura: 2.8 });
  s += ret(x + 10, y + 30, w - 20, h - 52, { espessura: 2.2 });
  return s;
}

/** Balão com texto (ou com "linhas de texto" quando o texto é vazio). */
function balao(x, y, w, h, f, texto = "", tam = 34) {
  let s = ret(x, y, w, h, { preench: f, hachura: "solid", espessura: 2.8 });
  if (texto) s += txt(x + w / 2, y + h / 2 + 1, texto, { tam });
  else {
    s += linha([[x + 14, y + h * 0.36], [x + w - 14, y + h * 0.36]], { cor: cor.cinza, espessura: 2.4 });
    s += linha([[x + 14, y + h * 0.68], [x + w - 34, y + h * 0.68]], { cor: cor.cinza, espessura: 2.4 });
  }
  return s;
}

/** Cadeado: (cx, cy) = centro do corpo. Aberto = a alça sobe e solta de um lado. */
function cadeado(cx, cy, aberto = false, k = 1, f = claro.amarelo) {
  const w = 44 * k, h = 34 * k, r = 13 * k;
  const topo = cy - h / 2;
  let s = "";
  if (aberto) {
    // alça levantada: a perna direita ainda no corpo, a esquerda solta no ar
    s += caminho(`M${cx + r},${topo} L${cx + r},${topo - 22 * k} A${r},${r} 0 0 0 ${cx - r},${topo - 22 * k} L${cx - r},${topo - 12 * k}`, {
      espessura: 3.4,
    });
  } else {
    s += caminho(`M${cx - r},${topo} L${cx - r},${topo - 10 * k} A${r},${r} 0 0 1 ${cx + r},${topo - 10 * k} L${cx + r},${topo}`, {
      espessura: 3.4,
    });
  }
  s += ret(cx - w / 2, topo, w, h, { preench: f, hachura: "solid", espessura: 2.8 });
  s += elipse(cx, cy - 2 * k, 9 * k, 9 * k, { preench: cor.tinta, hachura: "solid" });
  s += linha([[cx, cy], [cx, cy + 9 * k]], { espessura: 3 });
  return s;
}

/** Olho riscado (ninguém lê). */
function olhoRiscado(cx, cy, w) {
  const h = w * 0.56;
  let s = caminho(`M${cx - w / 2},${cy} Q${cx},${cy - h} ${cx + w / 2},${cy} Q${cx},${cy + h} ${cx - w / 2},${cy} Z`, {
    preench: "#ffffff",
    hachura: "solid",
    espessura: E,
  });
  s += elipse(cx, cy, h * 0.78, h * 0.78, { preench: claro.azul, hachura: "solid", espessura: 2.6 });
  s += elipse(cx, cy, h * 0.3, h * 0.3, { preench: cor.tinta, hachura: "solid" });
  s += linha([[cx - w / 2 - 4, cy + h * 0.72], [cx + w / 2 + 4, cy - h * 0.72]], { cor: cor.vermelho, espessura: 5 });
  return s;
}

/** Lixeira com tampa; (cx, topo) = centro da tampa. */
function lixeira(cx, topo) {
  let s = ret(cx - 20, topo - 14, 40, 14, { espessura: 2.8 });
  s += ret(cx - 64, topo, 128, 18, { preench: claro.cinza, hachura: "solid", espessura: E });
  s += caminho(`M${cx - 52},${topo + 24} L${cx + 52},${topo + 24} L${cx + 42},${topo + 158} L${cx - 42},${topo + 158} Z`, {
    preench: claro.cinza,
    gap: 10,
    espessura: E,
  });
  for (const dx of [-22, 0, 22]) s += linha([[cx + dx, topo + 44], [cx + dx * 0.85, topo + 140]], { espessura: 2.6 });
  return s;
}

export function cripto() {
  semear("cripto");
  let s = "";

  // celulares: Ana à esquerda, Bruno à direita
  const A = { x: 28, y: 76, w: 200, h: 480 };
  const B = { x: 740, y: 76, w: 200, h: 480 };
  const yOi = 462; // balão do "oi" (o mais novo, embaixo na tela)
  // servidor do WhatsApp no meio
  const S = { x: 296, y: 76, w: 376, h: 368 };
  const yMsg = 336; // balão embaralhado dentro do servidor

  // ---------------------------------------------------------------- 0: Ana manda "oi", servidor, Bruno
  let e0 = "";
  e0 += txt(A.x + A.w / 2, 38, "Ana", { tam: 38 });
  e0 += fone(A.x, A.y, A.w, A.h);
  e0 += balao(112, yOi, 100, 60, claro.verde, "oi", 40);
  e0 += ret(S.x, S.y, S.w, S.h, { preench: claro.cinza, hachura: "hachure", gap: 11, espessura: E });
  e0 += linha([[S.x, S.y + 66], [S.x + S.w, S.y + 66]], { espessura: 2.8 });
  for (const lx of [326, 356, 386]) e0 += elipse(lx, S.y + 33, 18, 18, { preench: cor.verde, hachura: "solid", cor: cor.verde });
  e0 += txt(538, S.y + 34, "WhatsApp", { tam: 40, cor: cor.verde });
  e0 += txt(B.x + B.w / 2, 38, "Bruno", { tam: 38 });
  e0 += fone(B.x, B.y, B.w, B.h);
  s += etapa(0, e0);

  // ---------------------------------------------------------------- 1: tranca e embaralha (ponta a ponta)
  let e1 = "";
  e1 += cadeado(74, yOi + 36, false, 1.25);
  e1 += seta(242, yOi + 10, 290, yMsg + 46, { espessura: E, ponta: 18 });
  e1 += cadeado(350, yMsg + 46, false, 1.3);
  e1 += balao(396, yMsg, 240, 82, "#ffffff", "x#7!k", 52);
  s += etapa(1, e1);

  // ---------------------------------------------------------------- 2: nem o próprio WhatsApp lê
  let e2 = "";
  e2 += olhoRiscado(410, 238, 156);
  e2 += txt(592, 238, "não lê", { tam: 44, cor: cor.vermelho, halo: 10 });
  s += etapa(2, e2);

  // ---------------------------------------------------------------- 3: entregue — o cadeado abre no Bruno
  let e3 = "";
  e3 += seta(678, yMsg + 46, 727, yOi + 10, { espessura: E, ponta: 18 });
  e3 += balao(760, yOi, 100, 60, claro.cinza, "oi", 40);
  e3 += cadeado(896, yOi + 36, true, 1.15, claro.verde);
  s += etapa(3, e3);

  // ---------------------------------------------------------------- 4: apagada do servidor
  let e4 = "";
  // X grosso riscando o balão embaralhado inteiro
  e4 += linha([[410, yMsg + 8], [622, yMsg + 74]], { cor: cor.vermelho, espessura: 4.4 });
  e4 += linha([[622, yMsg + 8], [410, yMsg + 74]], { cor: cor.vermelho, espessura: 4.4 });
  e4 += seta(516, yMsg + 90, 516, 480, { espessura: E, ponta: 17, tracejado: true, cor: cor.vermelho });
  e4 += lixeira(516, 506);
  e4 += txt(436, 584, "apagada", { tam: 40, cor: cor.vermelho, ancora: "end" });
  s += etapa(4, e4);

  // ---------------------------------------------------------------- 5: a conversa toda nos celulares
  let e5 = "";
  const hist = (P, comecaDir) =>
    [126, 206, 286, 366]
      .map((y, i) => {
        const dir = (i % 2 === 1) === comecaDir;
        const bw = 128;
        return balao(dir ? P.x + P.w - 22 - bw : P.x + 22, y, bw, 58, dir ? claro.verde : claro.cinza);
      })
      .join("");
  e5 += hist(A, true);
  e5 += hist(B, false);
  s += etapa(5, e5);

  // ---------------------------------------------------------------- 6: fica guardada no seu celular
  let e6 = "";
  // "fica aqui" + check, com folga entre os dois e dentro da margem
  for (const [P, xt, xc] of [[A, 108, 222], [B, 812, 924]]) {
    e6 += ret(P.x - 8, P.y - 8, P.w + 16, P.h + 16, { cor: cor.verde, espessura: 3, tracejado: true });
    e6 += txt(xt, 614, "fica aqui", { tam: 38, cor: cor.verde });
    e6 += linha([[xc - 16, 612], [xc - 3, 626], [xc + 19, 598]], { cor: cor.verde, espessura: 3.6 });
  }
  s += etapa(6, e6);

  return svg(968, 690, s);
}
