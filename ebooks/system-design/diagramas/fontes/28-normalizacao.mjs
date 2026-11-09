// Capítulo 28 — Normalização vs. desnormalização: o nome do autor numa tabela própria (JOIN) ou copiado em cada post.
export default (d) => {
  d.tela(720, 420).titulo(
    "Posts normalizados e desnormalizados",
    "À esquerda, normalizado: a tabela usuarios guarda id e nome (7 Ana, 9 Bia) e a tabela posts guarda só o autor_id; para mostrar o nome, a leitura faz um JOIN. À direita, desnormalizado: a tabela posts guarda também autor_nome, copiado em cada linha; a leitura não precisa de JOIN, mas se Ana mudar de nome, as duas linhas com Ana precisam ser atualizadas.",
  );

  // desenha uma tabela; devolve a geometria de cada célula: cel(linha, coluna), linha 0 = cabeçalho
  const tabela = (x, y, larguras, linhas, o = {}) => {
    const alt = 34;
    const xs = larguras.reduce((acc, w, i) => [...acc, acc[i] + w], [x]);
    const cel = (l, c) => ({ x: xs[c], y: y + l * alt, w: larguras[c], h: alt, cx: xs[c] + larguras[c] / 2, cy: y + l * alt + alt / 2 });
    linhas.forEach((linha, l) =>
      linha.forEach((txt, c) => {
        const k = cel(l, c);
        const quente = (o.quentes ?? []).some(([a, b]) => a === l && b === c);
        d.caixa(k.x, k.y, k.w, k.h, txt, {
          redondo: false,
          tam: 16,
          espessura: 1.4,
          tom: l === 0 ? "cinza" : quente ? "laranja" : undefined,
          preench: l === 0 || quente ? undefined : "none",
          hachura: "solid",
        });
      }),
    );
    if (o.nome) d.texto(x, y - 10, o.nome, { tam: 16, cor: "cinza" });
    return cel;
  };

  d.linha([[360, 24], [360, 400]], { cor: "cinza", tracejado: true, espessura: 1.2 });

  // ── normalizado ──
  d.texto(188, 44, "normalizado", { ancora: "middle", tam: 20, cor: "azul" });
  const u = tabela(32, 96, [40, 80], [["id", "nome"], ["7", "Ana"], ["9", "Bia"]], { nome: "usuarios" });
  d.texto(180, 140, "cada nome fica\nem um só lugar", { tam: 17, cor: "verde" });
  const p = tabela(32, 268, [40, 84, 90], [["id", "autor_id", "texto"], ["1", "7", "oi"], ["2", "7", "bom dia"], ["3", "9", "olá"]], { nome: "posts" });
  const de = p(0, 1);
  const ate = u(2, 0);
  d.seta([de.cx, de.y - 8], [ate.cx, ate.y + ate.h + 6], { cor: "azul", espessura: 2.2 });
  d.texto(136, 238, "JOIN a cada leitura", { tam: 17, cor: "azul" });

  // ── desnormalizado ──
  d.texto(540, 44, "desnormalizado", { ancora: "middle", tam: 20, cor: "laranja" });
  tabela(380, 124, [36, 80, 104, 84], [["id", "autor_id", "autor_nome", "texto"], ["1", "7", "Ana", "oi"], ["2", "7", "Ana", "bom dia"], ["3", "9", "Bia", "olá"]], {
    nome: "posts",
    quentes: [[1, 2], [2, 2], [3, 2]],
  });
  d.texto(540, 308, "leitura: uma tabela, sem JOIN", { ancora: "middle", tam: 17, cor: "verde" });
  d.texto(540, 350, "Ana muda de nome? Atualize\ntodas as linhas com a cópia", { ancora: "middle", tam: 17, cor: "vermelho" });
};
