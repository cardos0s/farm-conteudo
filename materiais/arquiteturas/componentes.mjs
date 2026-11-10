// Peças de HTML do ebook de arquiteturas. Os capítulos usam só estas funções (e HTML simples: <p>, <h3>,
// <ul>, <ol>, <b>, <code>, <table>), para todo o livro ter o mesmo visual. O CSS está em estilo.mjs.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Abertura do capítulo: "em uma frase" + analogia do dia a dia. */
export const resumo = (frase, analogia) =>
  `<div class="resumo"><div class="r1"><span class="rot">em uma frase</span>${frase}</div>${
    analogia ? `<div class="r2"><span class="rot">pense assim</span>${analogia}</div>` : ""
  }</div>`;

/** Figura com um diagrama (string SVG) e legenda opcional. `tam`: "normal" | "grande" | "baixa". */
export const fig = (svg, legenda = "", tam = "normal") => `<figure class="${tam}">${svg}${legenda ? `<figcaption>${legenda}</figcaption>` : ""}</figure>`;

export const dica = (titulo, html) => `<aside class="caixa dica"><b>${titulo}</b>${html}</aside>`;
export const alerta = (titulo, html) => `<aside class="caixa alerta"><b>${titulo}</b>${html}</aside>`;
/** Caixa "na prática": exemplo real, frase de entrevista, regra de bolso. */
export const pratica = (titulo, html) => `<aside class="caixa pratica"><b>${titulo}</b>${html}</aside>`;

/** Quando usar x quando evitar, lado a lado. */
export const quando = (usar, evitar) =>
  `<div class="quando"><div class="sim"><h4>Use quando</h4><ul>${usar.map((x) => `<li>${x}</li>`).join("")}</ul></div><div class="nao"><h4>Evite quando</h4><ul>${evitar
    .map((x) => `<li>${x}</li>`)
    .join("")}</ul></div></div>`;

/** Medidor de 1 a 5. Ex.: medidor({ complexidade: 2, escala: 3, operacao: 1, aprendizado: 2, time: "1 a 15 pessoas" }) */
export function medidor({ complexidade, escala, operacao, aprendizado, time }) {
  const linha = (rot, v, dica) =>
    `<div class="m"><span class="mr">${rot}</span><span class="mb">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span><span class="md">${dica}</span></div>`;
  return `<div class="medidor">
${linha("Complexidade para começar", complexidade, ["", "baixa", "baixa", "média", "alta", "muito alta"][complexidade])}
${linha("Até onde escala", escala, ["", "pouco", "razoável", "bem", "muito", "quase sem limite"][escala])}
${linha("Custo de operar", operacao, ["", "mínimo", "baixo", "médio", "alto", "muito alto"][operacao])}
${linha("Curva de aprendizado", aprendizado, ["", "suave", "suave", "média", "íngreme", "muito íngreme"][aprendizado])}
${time ? `<div class="m"><span class="mr">Tamanho de time</span><span class="mt">${time}</span></div>` : ""}
</div>`;
}

const PALAVRAS =
  /\b(const|let|var|function|class|interface|type|enum|export|import|from|return|async|await|new|implements|extends|if|else|for|of|in|throw|try|catch|public|private|protected|readonly|static|void|null|undefined|true|false|this|default|switch|case|break|yield)\b/;

/** Realce simples de sintaxe (TS/JS e parecidos): comentários, textos, palavras-chave e números. */
function realcar(codigo) {
  const re = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([\s\S])/g;
  let s = "";
  for (const m of codigo.matchAll(re)) {
    if (m[1]) s += `<span class="c">${esc(m[1])}</span>`;
    else if (m[2]) s += `<span class="s">${esc(m[2])}</span>`;
    else if (m[3]) s += `<span class="n">${esc(m[3])}</span>`;
    else if (m[4]) s += PALAVRAS.test(m[4]) && m[4].match(PALAVRAS)[0] === m[4] ? `<span class="k">${m[4]}</span>` : m[4];
    else s += esc(m[5]);
  }
  return s;
}

/** Bloco de código com título opcional (ex.: "src/pedidos/criar-pedido.ts"). `realce: false` para texto puro. */
export const codigo = (texto, titulo = "", { realce = true } = {}) =>
  `<div class="codigo">${titulo ? `<div class="ct">${esc(titulo)}</div>` : ""}<pre><code>${realce ? realcar(texto.replace(/^\n/, "")) : esc(texto.replace(/^\n/, ""))}</code></pre></div>`;

/** Árvore de pastas (texto com ├── └──). Linhas com "#" ganham comentário cinza. */
export const pastas = (texto, titulo = "estrutura de pastas") =>
  `<div class="pastas"><div class="ct">${esc(titulo)}</div><pre>${esc(texto.replace(/^\n/, "")).replace(/(#[^\n]*)/g, '<span class="c">$1</span>')}</pre></div>`;

/** Tabela simples: cabeçalho (array) e linhas (array de arrays). Células aceitam HTML. */
export const tabela = (cab, linhas, classe = "") =>
  `<table class="${classe}"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${linhas
    .map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

/** "Combina com": lista de capítulos relacionados. Ex.: combina([[12, "Monólito modular", "para separar módulos"]]) */
export const combina = (itens) =>
  `<div class="combina"><h4>Combina com</h4><ul>${itens.map(([n, nome, por]) => `<li><span class="cn">cap. ${n}</span><b>${nome}</b>${por ? ` · ${por}` : ""}</li>`).join("")}</ul></div>`;

/** Passos numerados. */
export const passos = (itens) => `<ol class="passos">${itens.map((x) => `<li>${x}</li>`).join("")}</ol>`;

/** Fechamento do capítulo: os 3 pontos para lembrar. */
export const lembre = (itens) => `<div class="lembre"><h4>Para lembrar</h4><ol>${itens.map((x) => `<li>${x}</li>`).join("")}</ol></div>`;

export const novaPagina = () => `<div class="nova-pagina"></div>`;
