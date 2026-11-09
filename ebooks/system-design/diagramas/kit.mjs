// Kit de diagramas estáticos no estilo Excalidraw: o mesmo motor (roughjs), a mesma fonte
// manuscrita (Excalifont) e a mesma paleta (open-color) da lousa das aulas (remotion/lousa).
//
// Cada diagrama é um módulo em diagramas/fontes/<nome>.mjs que exporta uma função que recebe
// a lousa `d` e desenha com coordenadas em px do viewBox:
//
//   export default (d) => {
//     d.tela(720, 300).titulo("Título acessível", "Descrição do que o diagrama mostra.");
//     const a = d.caixa(40, 40, 180, 70, "Cliente", { tom: "azul" });
//     const b = d.cilindro(480, 30, 160, 90, "Banco", { tom: "verde" });
//     d.seta(a.dir, b.esq, { rotulo: "consulta" });
//   };
//
// Tudo é determinístico (semente derivada do nome do diagrama + ordem do elemento): renderizar
// de novo gera o mesmo SVG.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import rough from "roughjs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../../..");
const LARGURAS = JSON.parse(readFileSync(path.join(raiz, "remotion/lousa/larguras.json"), "utf8"));

export const FONTE = "Excalifont, Virgil, 'Comic Sans MS', cursive";
export const PAPEL = "#fdfdfc";
export const tinta = "#1e1e1e";

/** Cores de traço (fortes) — as mesmas de remotion/lousa/paleta.ts. */
export const cor = {
  tinta,
  cinza: "#868e96",
  vermelho: "#e03131",
  verde: "#2f9e44",
  azul: "#1971c2",
  laranja: "#f08c00",
  amarelo: "#f08c00",
  violeta: "#6741d9",
  rosa: "#c2255c",
  ciano: "#0c8599",
};

/** Cores de preenchimento (claras). */
export const claro = {
  vermelho: "#ffc9c9",
  verde: "#b2f2bb",
  azul: "#a5d8ff",
  amarelo: "#ffec99",
  violeta: "#d0bfff",
  rosa: "#fcc2d7",
  ciano: "#99e9f2",
  cinza: "#e9ecef",
  laranja: "#ffd8a8",
  tinta: "#e9ecef",
};

const gerador = rough.generator();

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (Math.abs(h) % 2147483646) + 1;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Nome de cor (azul, verde...) ou hex. */
function traco(c) {
  if (!c) return tinta;
  return cor[c] ?? c;
}
function preenchimento(c) {
  if (!c || c === "none") return undefined;
  return claro[c] ?? c;
}

// Marcação dentro dos textos (igual à lousa): *{destaque} ^{sobrescrito} _{subscrito}
function analisar(s) {
  const out = [];
  const re = /([\^_*])\{([^}]*)\}/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > ultimo) out.push({ txt: s.slice(ultimo, m.index) });
    out.push({ txt: m[2], sup: m[1] === "^", sub: m[1] === "_", forte: m[1] === "*" });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) out.push({ txt: s.slice(ultimo) });
  return out;
}

/** Largura aproximada (px) de uma linha de texto na Excalifont. */
export function largura(s, tam = 18) {
  return analisar(String(s)).reduce((acc, p) => {
    const k = p.sup || p.sub ? 0.66 : 1;
    return acc + [...p.txt].reduce((a, c) => a + (LARGURAS[c] ?? 0.58), 0) * tam * k;
  }, 0);
}

function arredondado(x, y, w, h, r) {
  return `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y}`;
}

/** Pontos de ancoragem de um retângulo, para ligar setas. */
function geo(x, y, w, h) {
  return {
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
    centro: [x + w / 2, y + h / 2],
    topo: [x + w / 2, y],
    base: [x + w / 2, y + h],
    esq: [x, y + h / 2],
    dir: [x + w, y + h / 2],
    /** ponto na borda superior a uma fração t (0 = esquerda, 1 = direita) */
    emCima: (t) => [x + w * t, y],
    emBaixo: (t) => [x + w * t, y + h],
    naEsq: (t) => [x, y + h * t],
    naDir: (t) => [x + w, y + h * t],
  };
}

export class Lousa {
  constructor(nome) {
    this.nome = nome;
    this.w = 720;
    this.h = 360;
    this.tit = nome;
    this.desc = "";
    this.els = [];
    this.n = 0;
  }

  /** Tamanho do quadro (viewBox). Mantenha a largura em até 720. */
  tela(w, h) {
    this.w = w;
    this.h = h;
    return this;
  }

  /** Título e descrição acessíveis (leitores de tela). */
  titulo(t, desc = "") {
    this.tit = t;
    this.desc = desc;
    return this;
  }

  _opcoes(o = {}) {
    const tom = o.tom;
    return {
      seed: o.semente ?? hash(`${this.nome}:${this.n++}`),
      stroke: traco(o.cor ?? (tom ? cor[tom] : tinta)),
      strokeWidth: o.espessura ?? 1.8,
      roughness: o.aspereza ?? 1,
      bowing: o.arco ?? 1,
      fill: o.preench === "none" ? undefined : preenchimento(o.preench ?? tom),
      fillStyle: o.hachura ?? "hachure",
      hachureGap: o.vaoHachura ?? 6,
      fillWeight: o.pesoHachura ?? 1.3,
      hachureAngle: o.anguloHachura ?? -41,
      preserveVertices: true,
      disableMultiStroke: !!o.tracejado,
    };
  }

  /** Desenha uma forma do roughjs e guarda os <path> resultantes. */
  _forma(fabrica, o = {}) {
    const op = this._opcoes(o);
    const desenho = fabrica(gerador, op);
    const dash = o.tracejado ? ` stroke-dasharray="${o.tracejado === true ? "7 6" : o.tracejado}"` : "";
    const opac = o.opacidade != null ? ` opacity="${o.opacidade}"` : "";
    const partes = [];
    for (const set of desenho.sets) {
      const d = gerador.opsToPath(set, 1);
      if (set.type === "fillPath") partes.push(`<path d="${d}" fill="${op.fill}" stroke="none"/>`);
      else if (set.type === "fillSketch")
        partes.push(`<path d="${d}" fill="none" stroke="${op.fill}" stroke-width="${op.fillWeight}" stroke-linecap="round" stroke-linejoin="round"/>`);
      else partes.push(`<path d="${d}" fill="none" stroke="${op.stroke}" stroke-width="${op.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
    }
    this.els.push(opac ? `<g${opac}>${partes.join("")}</g>` : partes.join(""));
  }

  // ───────────────────────── texto ─────────────────────────

  /**
   * Texto manuscrito. (x, y) é a linha de base da primeira linha. Quebre linhas com "\n".
   * Opções: tam (px, padrão 18), cor, destaque (cor do *{...}), ancora: start | middle | end,
   * alturaLinha (padrão 1.2), girar (graus).
   */
  texto(x, y, s, o = {}) {
    const tam = o.tam ?? 18;
    const anc = o.ancora ?? "start";
    const c = traco(o.cor ?? tinta);
    const destaque = traco(o.destaque ?? "vermelho");
    const lh = tam * (o.alturaLinha ?? 1.2);
    const rot = o.girar ? ` transform="rotate(${o.girar} ${x} ${y})"` : "";
    const linhas = String(s).split("\n");
    const out = linhas.map((linha, i) => {
      const spans = analisar(linha)
        .map((p) => {
          if (p.sup) return `<tspan baseline-shift="super" font-size="${(tam * 0.66).toFixed(1)}">${esc(p.txt)}</tspan>`;
          if (p.sub) return `<tspan baseline-shift="sub" font-size="${(tam * 0.66).toFixed(1)}">${esc(p.txt)}</tspan>`;
          if (p.forte) return `<tspan fill="${destaque}">${esc(p.txt)}</tspan>`;
          return esc(p.txt);
        })
        .join("");
      return `<text x="${r1(x)}" y="${r1(y + i * lh)}" font-size="${tam}" fill="${c}" text-anchor="${anc}"${rot}>${spans}</text>`;
    });
    this.els.push(out.join(""));
    const w = Math.max(...linhas.map((l) => largura(l, tam)));
    const x0 = anc === "middle" ? x - w / 2 : anc === "end" ? x - w : x;
    return geo(x0, y - tam * 0.8, w, (linhas.length - 1) * lh + tam);
  }

  /** Texto centralizado verticalmente num ponto (cx, cy). */
  textoCentro(cx, cy, s, o = {}) {
    const tam = o.tam ?? 18;
    const n = String(s).split("\n").length;
    const lh = tam * (o.alturaLinha ?? 1.2);
    return this.texto(cx, cy - ((n - 1) * lh) / 2 + tam * 0.34, s, { ancora: "middle", ...o, tam });
  }

  /** Faixa de marca-texto (desenhe ANTES do texto que ela destaca). */
  marca(x, y, w, h, c = "amarelo") {
    const fill = claro[c] ?? c;
    this.els.push(`<path d="M${r1(x)} ${r1(y + h * 0.08)} L${r1(x + w)} ${r1(y)} L${r1(x + w)} ${r1(y + h)} L${r1(x)} ${r1(y + h * 0.95)} Z" fill="${fill}" opacity="0.8"/>`);
    return geo(x, y, w, h);
  }

  // ───────────────────────── formas ─────────────────────────

  /**
   * Retângulo arredondado com texto centralizado. Opções: tom (cor do traço + preenchimento),
   * cor, preench ("none" para vazio), hachura (hachure | solid | cross-hatch | dots | zigzag),
   * tam (fonte), corTexto, redondo (false = cantos retos), tracejado, espessura.
   */
  caixa(x, y, w, h, texto = "", o = {}) {
    const r = o.redondo === false ? 0 : Math.min(o.raio ?? 14, Math.min(w, h) * 0.22);
    this._forma((g, op) => (r > 0 ? g.path(arredondado(x, y, w, h, r), op) : g.rectangle(x, y, w, h, op)), o);
    if (texto) this.textoCentro(x + w / 2, y + h / 2, texto, { tam: o.tam, cor: o.corTexto, destaque: o.destaque });
    return geo(x, y, w, h);
  }

  /** Caixa que se ajusta ao texto. (cx, cy) é o centro. Opções da caixa + pad. */
  etiqueta(cx, cy, texto, o = {}) {
    const tam = o.tam ?? 18;
    const pad = o.pad ?? 14;
    const linhas = String(texto).split("\n");
    const w = Math.max(...linhas.map((l) => largura(l, tam))) + pad * 2;
    const h = linhas.length * tam * 1.2 + pad * 1.1;
    return this.caixa(cx - w / 2, cy - h / 2, w, h, texto, o);
  }

  /** Elipse com texto. (cx, cy) é o centro; w e h são os diâmetros. */
  elipse(cx, cy, w, h, texto = "", o = {}) {
    this._forma((g, op) => g.ellipse(cx, cy, w, h, op), o);
    if (texto) this.textoCentro(cx, cy, texto, { tam: o.tam, cor: o.corTexto, destaque: o.destaque });
    return geo(cx - w / 2, cy - h / 2, w, h);
  }

  /** Círculo (diam = diâmetro), com texto opcional. */
  circulo(cx, cy, diam, texto = "", o = {}) {
    this._forma((g, op) => g.circle(cx, cy, diam, op), o);
    if (texto) this.textoCentro(cx, cy, texto, { tam: o.tam, cor: o.corTexto, destaque: o.destaque });
    return geo(cx - diam / 2, cy - diam / 2, diam, diam);
  }

  /** Cilindro (banco de dados). */
  cilindro(x, y, w, h, texto = "", o = {}) {
    const ry = Math.min(o.tampa ?? 12, h * 0.18);
    const rx = w / 2;
    const corpo = `M${x} ${y + ry} L${x} ${y + h - ry} A${rx} ${ry} 0 0 0 ${x + w} ${y + h - ry} L${x + w} ${y + ry}`;
    this._forma((g, op) => g.path(`${corpo} A${rx} ${ry} 0 0 1 ${x} ${y + ry} Z`, op), o);
    this._forma((g, op) => g.ellipse(x + w / 2, y + ry, w, ry * 2, op), { ...o });
    if (texto) this.textoCentro(x + w / 2, y + ry + (h - ry) / 2, texto, { tam: o.tam, cor: o.corTexto, destaque: o.destaque });
    return geo(x, y, w, h);
  }

  /** Nuvem (internet, provedor de nuvem). (cx, cy) é o centro. */
  nuvem(cx, cy, w, h, texto = "", o = {}) {
    const x = cx - w / 2;
    const y = cy - h / 2;
    const P = (u, v) => `${r1(x + u * w)} ${r1(y + v * h)}`;
    const A = (r, u, v) => `A${r1(r * w)} ${r1(r * h)} 0 0 1 ${P(u, v)}`;
    const d = `M${P(0.2, 0.92)} ${A(0.19, 0.1, 0.48)} ${A(0.22, 0.38, 0.14)} ${A(0.22, 0.74, 0.18)} ${A(0.2, 0.9, 0.58)} ${A(0.17, 0.78, 0.92)} Z`;
    this._forma((g, op) => g.path(d, op), o);
    if (texto) this.textoCentro(cx, cy + h * 0.06, texto, { tam: o.tam, cor: o.corTexto, destaque: o.destaque });
    return geo(x, y, w, h);
  }

  /** Bonequinho (usuário/cliente). (cx, cy) é o centro; tam é a altura. Opção rotulo (texto embaixo). */
  pessoa(cx, cy, tam = 56, o = {}) {
    const cab = tam * 0.3;
    const topo = cy - tam / 2;
    const pescoco = topo + cab;
    const quadril = topo + tam * 0.68;
    const base = topo + tam;
    const oo = { ...o, preench: o.preench ?? "none" };
    this._forma((g, op) => g.circle(cx, topo + cab / 2, cab, op), oo);
    this._forma((g, op) => g.line(cx, pescoco, cx, quadril, op), oo);
    this._forma((g, op) => g.linearPath([[cx - tam * 0.26, pescoco + tam * 0.2], [cx, pescoco + tam * 0.1], [cx + tam * 0.26, pescoco + tam * 0.2]], op), oo);
    this._forma((g, op) => g.linearPath([[cx - tam * 0.2, base], [cx, quadril], [cx + tam * 0.2, base]], op), oo);
    if (o.rotulo) this.texto(cx, base + (o.tam ?? 16) + 4, o.rotulo, { ancora: "middle", tam: o.tamRotulo ?? 16, cor: o.corTexto });
    return geo(cx - tam * 0.3, topo, tam * 0.6, tam);
  }

  /** Região tracejada com rótulo no canto (datacenter, serviço, rede...). */
  grupo(x, y, w, h, rotulo = "", o = {}) {
    this.caixa(x, y, w, h, "", { tracejado: true, cor: o.cor ?? "cinza", preench: o.preench ?? "none", hachura: o.hachura, raio: o.raio ?? 18, espessura: o.espessura ?? 1.5 });
    if (rotulo) this.texto(x + 14, y + 24, rotulo, { tam: o.tam ?? 16, cor: o.corTexto ?? o.cor ?? "cinza" });
    return geo(x, y, w, h);
  }

  /** Linha de células (bits, slots, posições de um array). valores: array de textos. */
  celulas(x, y, valores, o = {}) {
    const lado = o.lado ?? 36;
    const destacadas = new Set(o.destacadas ?? []);
    valores.forEach((v, i) => {
      const destacada = destacadas.has(i);
      this.caixa(x + i * lado, y, lado, lado, String(v ?? ""), {
        redondo: false,
        tom: destacada ? o.tom ?? "amarelo" : undefined,
        preench: destacada ? undefined : o.preench ?? "none",
        hachura: o.hachura ?? "solid",
        tam: o.tam ?? 17,
        espessura: o.espessura ?? 1.5,
      });
    });
    const g = geo(x, y, lado * valores.length, lado);
    g.celula = (i) => geo(x + i * lado, y, lado, lado);
    return g;
  }

  // ───────────────────────── traços ─────────────────────────

  linha(pts, o = {}) {
    this._forma((g, op) => g.linearPath(pts, op), { ...o, preench: "none" });
  }

  curva(pts, o = {}) {
    this._forma((g, op) => g.curve(pts, op), { ...o, preench: "none" });
  }

  caminho(d, o = {}) {
    this._forma((g, op) => g.path(d, op), o);
  }

  /** Um "X" (falha, bloqueio). */
  xis(cx, cy, tam = 18, o = {}) {
    const h = tam / 2;
    const oo = { cor: "vermelho", espessura: 2.6, ...o, preench: "none" };
    this._forma((g, op) => g.line(cx - h, cy - h, cx + h, cy + h, op), oo);
    this._forma((g, op) => g.line(cx + h, cy - h, cx - h, cy + h, op), oo);
  }

  /** Um "certo" (sucesso). */
  certo(cx, cy, tam = 18, o = {}) {
    const oo = { cor: "verde", espessura: 2.6, ...o, preench: "none" };
    this._forma((g, op) => g.linearPath([[cx - tam * 0.5, cy], [cx - tam * 0.12, cy + tam * 0.4], [cx + tam * 0.55, cy - tam * 0.45]], op), oo);
  }

  /**
   * Seta de `de` até `ate` (pontos [x, y]). Opções: cor, espessura, tracejado, curva (desvio em px
   * para o lado esquerdo do sentido da seta; negativo curva para o outro lado), duasPontas,
   * semPonta, rotulo, tamRotulo, posRotulo (0..1, padrão 0.5), desloc (px perpendicular ao traço),
   * fundoRotulo (padrão true: um retângulo da cor do papel atrás do rótulo).
   */
  seta(de, ate, o = {}) {
    const [x1, y1] = de;
    const [x2, y2] = ate;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dy / len;
    const ny = -dx / len;
    const oo = { ...o, preench: "none" };
    let meio = [(x1 + x2) / 2, (y1 + y2) / 2];
    let fimDe = de;
    let iniAte = ate;
    if (o.curva) {
      meio = [meio[0] + nx * o.curva, meio[1] + ny * o.curva];
      this._forma((g, op) => g.curve([de, meio, ate], op), oo);
      fimDe = meio;
      iniAte = meio;
    } else {
      this._forma((g, op) => g.line(x1, y1, x2, y2, op), oo);
    }
    const ponta = o.ponta ?? 12;
    const cabeca = (de0, a0) => {
      const ux = a0[0] - de0[0];
      const uy = a0[1] - de0[1];
      const l = Math.hypot(ux, uy) || 1;
      const ex = ux / l;
      const ey = uy / l;
      const ang = (27 * Math.PI) / 180;
      const p = (s) => [a0[0] - ponta * (ex * Math.cos(ang) - s * ey * Math.sin(ang)), a0[1] - ponta * (ey * Math.cos(ang) + s * ex * Math.sin(ang))];
      this._forma((g, op) => g.linearPath([p(1), a0, p(-1)], op), { ...oo, tracejado: false });
    };
    if (!o.semPonta) cabeca(fimDe, ate);
    if (o.duasPontas) cabeca(iniAte, de);
    if (o.rotulo) {
      const t = o.posRotulo ?? 0.5;
      let px;
      let py;
      if (o.curva) {
        // ponto na curva quadrática aproximada que passa por `meio`
        const cx = 2 * meio[0] - (x1 + x2) / 2;
        const cy = 2 * meio[1] - (y1 + y2) / 2;
        px = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        py = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2;
      } else {
        px = x1 + dx * t;
        py = y1 + dy * t;
      }
      const desloc = o.desloc ?? 0;
      px += nx * desloc;
      py += ny * desloc;
      const tam = o.tamRotulo ?? 16;
      const linhas = String(o.rotulo).split("\n");
      const w = Math.max(...linhas.map((l) => largura(l, tam))) + 10;
      const h = linhas.length * tam * 1.2 + 4;
      if (o.fundoRotulo !== false)
        this.els.push(`<rect x="${r1(px - w / 2)}" y="${r1(py - h / 2)}" width="${r1(w)}" height="${r1(h)}" rx="4" fill="${PAPEL}"/>`);
      this.textoCentro(px, py, o.rotulo, { tam, cor: o.corRotulo ?? o.cor, destaque: o.destaque });
    }
  }

  // ───────────────────────── saída ─────────────────────────

  toString() {
    const id = `lousa-${this.nome}`;
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${esc(FONTE)}" class="lousa">`,
      `<title id="${id}-t">${esc(this.tit)}</title>`,
      `<desc id="${id}-d">${esc(this.desc)}</desc>`,
      `<rect width="${this.w}" height="${this.h}" fill="${PAPEL}"/>`,
      ...this.els,
      `</svg>`,
      "",
    ].join("\n");
  }
}

function r1(n) {
  return Math.round(n * 10) / 10;
}
