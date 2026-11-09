// Capítulo 26 — B-Tree (páginas ordenadas, atualizadas no lugar) vs. LSM-Tree (memtable → SSTables imutáveis em níveis).
export default (d) => {
  d.tela(720, 448).titulo(
    "B-Tree e LSM-Tree",
    "À esquerda, uma B-Tree: uma página raiz com as chaves 30 e 60 aponta para três folhas ordenadas (5, 12, 21; 34, 47, 55; 63, 78, 91), ligadas entre si da esquerda para a direita. Buscar 47 lê a raiz e uma folha; escrever altera a página no lugar. À direita, uma LSM-Tree: as escritas entram numa memtable ordenada em memória; quando ela enche, vira um arquivo SSTable imutável no disco, no nível L0; a compaction junta os arquivos de L0 em arquivos maiores no nível L1 e descarta versões velhas.",
  );

  // divisória
  d.linha([[360, 28], [360, 420]], { cor: "cinza", tracejado: true, espessura: 1.2 });

  // ── B-Tree ──
  d.texto(188, 46, "B-Tree", { ancora: "middle", tam: 20, cor: "azul" });
  const raiz = d.celulas(148, 76, ["30", "60"], { lado: 40, tom: "azul", destacadas: [0, 1] });
  d.texto(244, 102, "raiz", { cor: "cinza", tam: 16 });
  const folhas = [
    [22, ["5", "12", "21"], []],
    [146, ["34", "47", "55"], [1]],
    [270, ["63", "78", "91"], []],
  ].map(([x, vals, dest]) => d.celulas(x, 196, vals, { lado: 30, tom: "verde", destacadas: dest }));
  d.seta(raiz.emBaixo(0), folhas[0].topo);
  d.seta(raiz.emBaixo(0.5), folhas[1].topo, { cor: "verde", espessura: 2.6 });
  d.seta(raiz.emBaixo(1), folhas[2].topo);
  d.seta(folhas[0].dir, folhas[1].esq, { ponta: 9 });
  d.seta(folhas[1].dir, folhas[2].esq, { ponta: 9 });
  d.texto(188, 262, "folhas ligadas em ordem →\nbom para intervalos", { ancora: "middle", tam: 16, cor: "cinza" });
  d.texto(188, 344, "busca 47: raiz → 1 folha\nescrita: altera a página no lugar", { ancora: "middle", tam: 17 });

  // ── LSM-Tree ──
  d.texto(538, 46, "LSM-Tree", { ancora: "middle", tam: 20, cor: "laranja" });
  const mem = d.caixa(424, 76, 228, 52, "memtable (ordenada)", { tom: "amarelo" });
  d.seta([384, 102], mem.esq, { rotulo: "escrita", posRotulo: 0.3, desloc: 16 });
  d.linha([[376, 160], [704, 160]], { cor: "cinza", tracejado: true, espessura: 1.2 });
  d.texto(700, 152, "memória", { ancora: "end", tam: 16, cor: "cinza" });
  d.texto(700, 178, "disco", { ancora: "end", tam: 16, cor: "cinza" });

  d.texto(384, 222, "L0", { tam: 18, cor: "cinza" });
  const s1 = d.caixa(424, 196, 104, 40, "SSTable", { tom: "laranja", redondo: false, tam: 17 });
  const s2 = d.caixa(548, 196, 104, 40, "SSTable", { tom: "laranja", redondo: false, tam: 17 });
  d.seta(mem.emBaixo(0.5), [538, 194], { rotulo: "flush", desloc: -30, posRotulo: 0.2 });

  d.texto(384, 312, "L1", { tam: 18, cor: "cinza" });
  d.caixa(424, 286, 228, 40, "SSTables maiores", { tom: "laranja", redondo: false, tam: 17 });
  d.seta(s1.base, [s1.cx, 284], { cor: "violeta" });
  d.seta(s2.base, [s2.cx, 284], { cor: "violeta" });
  d.texto(538, 266, "compaction", { ancora: "middle", tam: 16, cor: "violeta" });
  d.texto(538, 364, "escrita: só anexa (sequencial)\nleitura: memtable + vários arquivos", { ancora: "middle", tam: 17 });
};
