// Capítulo 42 — Estratégias de cache: cache-aside, write-through e write-back, passo a passo.
export default (d) => {
  d.tela(720, 460).titulo(
    "Cache-aside, write-through e write-back",
    "Três fluxos entre aplicação, cache e banco, com os passos numerados. Cache-aside, numa leitura: 1, a aplicação pede ao cache e não acha o dado (miss); 2, lê do banco; 3, grava o valor no cache. Write-through, numa escrita: 1, a aplicação grava no cache; 2, o cache grava no banco; 3, só então confirma para a aplicação. Write-back, numa escrita: 1, a aplicação grava no cache; 2, o cache confirma na hora; 3, grava no banco mais tarde, em lote. Se o cache cair antes do passo 3, a escrita se perde.",
  );

  // uma faixa por estratégia: aplicação, cache e banco sempre nas mesmas posições
  const faixa = (y, nome) => {
    d.grupo(16, y, 688, 134, "");
    const cy = y + 76;
    d.textoCentro(72, cy, nome, { tam: 19, cor: "violeta" });
    const app = d.caixa(122, cy - 23, 116, 46, "aplicação", { tom: "azul" });
    const cache = d.caixa(378, cy - 23, 92, 46, "cache", { tom: "amarelo" });
    const banco = d.cilindro(588, cy - 31, 100, 62, "banco", { tom: "verde" });
    return { y, cy, app, cache, banco };
  };

  const num = { destaque: "violeta", tamRotulo: 16 };
  const xa = (f) => f.app.x + f.app.w;
  // aplicação ↔ cache: seta de cima e seta de baixo
  const cima = (f, rotulo) => d.seta([xa(f), f.cy - 12], [f.cache.x, f.cy - 12], { rotulo, desloc: 14, ...num });
  const baixoIda = (f, rotulo) => d.seta([xa(f), f.cy + 12], [f.cache.x, f.cy + 12], { rotulo, desloc: -14, ...num });
  const baixoVolta = (f, rotulo) => d.seta([f.cache.x, f.cy + 12], [xa(f), f.cy + 12], { rotulo, desloc: 14, ...num });

  // cache-aside (leitura): a aplicação fala com os dois
  const a = faixa(16, "cache-\naside");
  cima(a, "*{1} get (miss)");
  const xi = a.app.x + 34;
  const ponte = a.y + 24;
  d.linha([[xi, a.app.y], [xi, ponte]]);
  d.seta([xi, ponte], [a.banco.cx, ponte], { semPonta: true, rotulo: "*{2} lê do banco", ...num });
  d.seta([a.banco.cx, ponte], [a.banco.cx, a.banco.y + 2]);
  baixoIda(a, "*{3} set");

  // write-through (escrita): confirma só depois do banco
  const t = faixa(162, "write-\nthrough");
  cima(t, "*{1} grava");
  d.seta(t.cache.dir, [t.banco.x, t.cy], { rotulo: "*{2} grava", desloc: 14, ...num });
  baixoVolta(t, "*{3} ok");

  // write-back (escrita): confirma antes do banco
  const b = faixa(308, "write-\nback");
  cima(b, "*{1} grava");
  baixoVolta(b, "*{2} ok");
  d.seta(b.cache.dir, [b.banco.x, b.cy], { rotulo: "*{3} depois,\nem lote", desloc: -27, tracejado: true, ...num });
  d.texto(b.cache.cx + 40, b.y + 26, "se o cache cair antes do 3, a escrita se perde", { ancora: "middle", cor: "vermelho", tam: 16 });
};
