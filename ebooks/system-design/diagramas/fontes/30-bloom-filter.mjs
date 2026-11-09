// Capítulo 30 — Bloom filter: inserir liga 3 bits; consultar responde "com certeza não" ou "talvez".
export default (d) => {
  d.tela(720, 448).titulo(
    "Bloom filter com 16 bits e três funções de hash",
    "Um array de 16 bits começa zerado. Inserir ana passa o nome pelas funções h1, h2 e h3 e liga os bits 1, 4 e 7; inserir bia liga os bits 9, 12 e 14. Consultar caio aponta para os bits 1, 4 e 6: o bit 6 está zerado, então caio com certeza não está no conjunto. Consultar davi aponta para os bits 7, 9 e 14: todos estão ligados, então a resposta é talvez. Como davi nunca foi inserido, é um falso positivo.",
  );

  const ligados = [1, 4, 7, 9, 12, 14];
  const bits = d.celulas(56, 196, Array.from({ length: 16 }, (_, i) => (ligados.includes(i) ? "1" : "0")), {
    lado: 38,
    destacadas: ligados,
    tom: "amarelo",
  });
  const em = (i) => bits.celula(i);

  // inserções
  const ana = d.etiqueta(196, 62, "inserir ana", { tom: "verde" });
  ["h1", "h2", "h3"].forEach((h, j) => {
    d.seta(ana.base, em([1, 4, 7][j]).topo, { rotulo: h, posRotulo: 0.55, tamRotulo: 16 });
  });
  const bia = d.etiqueta(540, 62, "inserir bia", { tom: "verde" });
  for (const i of [9, 12, 14]) d.seta(bia.base, em(i).topo, { cor: "cinza" });

  // consultas
  const caio = d.etiqueta(196, 330, "consultar caio", { tom: "cinza" });
  d.seta(caio.topo, em(1).base, { cor: "cinza" });
  d.seta(caio.topo, em(4).base, { cor: "cinza" });
  d.seta(caio.topo, em(6).base, { cor: "vermelho", espessura: 2.6 });
  d.caixa(em(6).x - 3, em(6).y - 3, 44, 44, "", { cor: "vermelho", preench: "none", redondo: false, espessura: 2.4 });
  d.texto(196, 390, "um dos bits é 0:\ncom certeza não está", { ancora: "middle", cor: "vermelho", tam: 17 });

  const davi = d.etiqueta(540, 330, "consultar davi", { tom: "cinza" });
  for (const i of [7, 9, 14]) d.seta(davi.topo, em(i).base, { cor: "laranja" });
  d.texto(540, 390, "todos são 1: talvez está\n(falso positivo: ninguém inseriu davi)", { ancora: "middle", cor: "laranja", tam: 17 });
};
