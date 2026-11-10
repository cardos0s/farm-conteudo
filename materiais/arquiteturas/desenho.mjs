// Desenhos à mão (roughjs) do ebook de arquiteturas: as peças do guia do WhatsApp mais ícones comuns
// de arquitetura (servidor, pessoa, navegador, nuvem, evento...). Cada diagrama é uma função que devolve
// um <svg>; chame semear("nome") no começo para o traço sair sempre igual.
//
// Tamanho: use viewBox de 760 de largura (a página tem ~660 px úteis); textos com tam >= 15.

import { caixa, caminho, celular, check, claro, cor, curva, elipse, linha, passo, ret, semear, seta, svg, txt, xis, banco, fila } from "../whatsapp/diagramas.mjs";

export { caixa, caminho, celular, check, claro, cor, curva, elipse, linha, passo, ret, semear, seta, svg, txt, xis, banco, fila };

/** Bloco com título (mais grosso que caixa()): componente, módulo, serviço, camada. */
export function bloco(x, y, w, h, titulo, o = {}) {
  return (
    ret(x, y, w, h, { preench: o.preench ?? claro.azul, hachura: o.hachura, espessura: o.espessura ?? 2, gap: o.gap ?? 6, tracejado: o.tracejado, cor: o.cor }) +
    (titulo ? txt(x + w / 2, o.topo ? y + (o.tam ?? 17) + 4 : y + h / 2, titulo, { tam: o.tam ?? 17, cor: o.corTexto }) : "")
  );
}

/** Servidor/máquina: caixa com gavetas e luzinhas. */
export function servidor(x, y, w = 64, h = 84, rotulo = "", o = {}) {
  let s = ret(x, y, w, h, { preench: o.preench ?? "#ffffff", hachura: "solid", espessura: 2 });
  const gavetas = 3;
  for (let i = 0; i < gavetas; i++) {
    const gy = y + 8 + i * ((h - 16) / gavetas);
    s += ret(x + 6, gy, w - 12, (h - 16) / gavetas - 5, { espessura: 1.3 });
    s += elipse(x + 14, gy + ((h - 16) / gavetas - 5) / 2, 6, 6, { preench: o.luz ?? cor.verde, hachura: "solid", cor: o.luz ?? cor.verde });
  }
  if (rotulo) s += txt(x + w / 2, y + h + 16, rotulo, { tam: o.tam ?? 15 });
  return s;
}

/** Pessoa (bonequinho). */
export function pessoa(x, y, o = {}) {
  const c = o.cor ?? cor.tinta;
  let s = elipse(x, y, 20, 20, { preench: o.preench ?? claro.amarelo, hachura: "solid", cor: c, espessura: 1.8 });
  s += caminho(`M${x - 16},${y + 40} Q${x},${y + 8} ${x + 16},${y + 40}`, { preench: o.preench ?? claro.amarelo, hachura: "solid", cor: c, espessura: 1.8 });
  if (o.rotulo) s += txt(x, y + 56, o.rotulo, { tam: o.tam ?? 15 });
  return s;
}

/** Janela de navegador/app. */
export function navegador(x, y, w = 120, h = 90, rotulo = "", o = {}) {
  let s = ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", espessura: 2 });
  s += linha([[x, y + 16], [x + w, y + 16]], { espessura: 1.4 });
  for (let i = 0; i < 3; i++) s += elipse(x + 10 + i * 9, y + 8, 5, 5, { preench: [cor.vermelho, cor.laranja, cor.verde][i], hachura: "solid", cor: [cor.vermelho, cor.laranja, cor.verde][i] });
  if (rotulo) s += txt(x + w / 2, y + 16 + (h - 16) / 2, rotulo, { tam: o.tam ?? 15 });
  return s;
}

/** Nuvem (internet, provedor de nuvem). */
export function nuvem(x, y, w = 140, h = 80, rotulo = "", o = {}) {
  const d = `M${x + w * 0.2},${y + h} C${x - w * 0.05},${y + h} ${x - w * 0.05},${y + h * 0.45} ${x + w * 0.18},${y + h * 0.45}
    C${x + w * 0.2},${y + h * 0.05} ${x + w * 0.55},${y - h * 0.05} ${x + w * 0.62},${y + h * 0.3}
    C${x + w * 0.8},${y + h * 0.1} ${x + w * 1.05},${y + h * 0.35} ${x + w * 0.9},${y + h * 0.6}
    C${x + w * 1.1},${y + h * 0.7} ${x + w},${y + h} ${x + w * 0.82},${y + h} Z`;
  return caminho(d, { preench: o.preench ?? claro.ciano, espessura: 2, gap: 7 }) + (rotulo ? txt(x + w / 2, y + h * 0.66, rotulo, { tam: o.tam ?? 15 }) : "");
}

/** Raio (evento). */
export function evento(x, y, tam = 26, c = cor.laranja) {
  const k = tam / 26;
  return caminho(`M${x + 4 * k},${y} L${x - 8 * k},${y + 16 * k} L${x},${y + 16 * k} L${x - 4 * k},${y + 30 * k} L${x + 10 * k},${y + 12 * k} L${x + 2 * k},${y + 12 * k} Z`, {
    preench: c,
    hachura: "solid",
    cor: c,
    espessura: 1.5,
  });
}

/** Envelope (mensagem). */
export function envelope(x, y, w = 34, h = 24, c = claro.amarelo) {
  return ret(x, y, w, h, { preench: c, hachura: "solid", espessura: 1.6 }) + linha([[x, y], [x + w / 2, y + h * 0.55], [x + w, y]], { espessura: 1.4 });
}

/** Engrenagem simples (processamento, filtro, função). */
export function engrenagem(cx, cy, r = 18, o = {}) {
  let s = elipse(cx, cy, r * 2, r * 2, { preench: o.preench ?? claro.cinza, hachura: "solid", espessura: 1.8 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += linha([[cx + Math.cos(a) * r, cy + Math.sin(a) * r], [cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7)]], { espessura: 3 });
  }
  return s + elipse(cx, cy, r * 0.7, r * 0.7, { preench: "#ffffff", hachura: "solid", espessura: 1.4 });
}

/** Etiqueta pequena (rótulo com fundo). */
export function etiqueta(x, y, texto, o = {}) {
  const w = (o.w ?? texto.length * (o.tam ?? 14) * 0.55) + 16;
  return ret(x - w / 2, y - 13, w, 26, { preench: o.preench ?? claro.amarelo, hachura: "solid", espessura: 1.4 }) + txt(x, y, texto, { tam: o.tam ?? 14, cor: o.cor });
}

export { svg as quadro };
