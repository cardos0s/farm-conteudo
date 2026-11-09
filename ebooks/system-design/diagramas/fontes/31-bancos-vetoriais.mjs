// Capítulo 31 — Bancos vetoriais: embeddings num plano 2D e os 3 vizinhos mais próximos de uma consulta.
export default (d) => {
  d.tela(720, 432).titulo(
    "Busca por vizinhos mais próximos num espaço de embeddings",
    "Um plano com palavras representadas como pontos (embeddings reduzidos a duas dimensões). Palavras parecidas ficam perto: um grupo de animais (cachorro, cão, gato, cavalo), um de comidas (pizza, coxinha, pão de queijo) e um de finanças (boleto, Pix, fatura). A consulta filhote cai perto dos animais, e o banco devolve os três vizinhos mais próximos: cão, cachorro e gato.",
  );

  // eixos
  d.seta([48, 392], [444, 392], { cor: "cinza", espessura: 1.4, ponta: 10 });
  d.seta([48, 392], [48, 36], { cor: "cinza", espessura: 1.4, ponta: 10 });
  d.texto(444, 416, "dimensão 1", { ancora: "end", cor: "cinza", tam: 16 });
  d.texto(32, 150, "dimensão 2", { ancora: "middle", cor: "cinza", tam: 16, girar: -90 });

  const q = [160, 204];
  const ponto = ([x, y], nome, o = {}) => {
    d.circulo(x, y, 12, "", { tom: o.tom ?? "azul", hachura: "solid" });
    d.texto(x + (o.esq ? -12 : 12), y + 6, nome, { tam: 17, ancora: o.esq ? "end" : "start", cor: o.cor });
  };

  // vizinhos mais próximos, ligados à consulta
  const vizinhos = [
    [[118, 136], "cachorro"],
    [[226, 170], "cão"],
    [[106, 264], "gato"],
  ];
  for (const [p] of vizinhos) d.linha([q, p], { cor: "violeta", tracejado: true, espessura: 1.6 });
  for (const [p, nome] of vizinhos) ponto(p, nome, { tom: "violeta", cor: "violeta" });

  ponto([232, 70], "cavalo");
  ponto([330, 62], "pizza", { tom: "laranja" });
  ponto([368, 100], "coxinha", { tom: "laranja" });
  ponto([296, 138], "pão de queijo", { tom: "laranja" });
  ponto([276, 300], "boleto", { tom: "verde" });
  ponto([356, 328], "Pix", { tom: "verde" });
  ponto([302, 362], "fatura", { tom: "verde" });

  // a consulta
  d.circulo(q[0], q[1], 20, "", { tom: "violeta", hachura: "solid", espessura: 2.4 });
  d.texto(q[0] + 18, q[1] + 26, "consulta: filhote", { tam: 17, cor: "violeta" });

  // passo a passo
  d.texto(482, 92, "1. a consulta vira um\nvetor (embedding)", { tam: 17 });
  d.texto(482, 174, "2. o banco acha os\nk = 3 mais próximos", { tam: 17 });
  d.texto(482, 256, "3. resposta: cão,\ncachorro e gato", { tam: 17, cor: "violeta" });
  d.texto(482, 336, "na prática, são centenas\nou milhares de dimensões,\nnão duas", { tam: 16, cor: "cinza" });
};
