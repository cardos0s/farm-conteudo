// Capítulo 39 — SAGA de um pedido: passos locais e compensações em ordem inversa.
export default (d) => {
  d.tela(720, 420).titulo(
    "SAGA de um pedido com compensação",
    "O pedido passa por três transações locais, em ordem: 1, reservar estoque; 2, cobrar o pagamento; 3, agendar a entrega. Os dois primeiros passos dão certo, mas o agendamento da entrega falha. A falha dispara as compensações em ordem inversa: 4, estornar o pagamento, que desfaz o passo 2; depois 5, liberar o estoque, que desfaz o passo 1.",
  );

  d.texto(30, 34, "transações locais, em ordem", { tam: 16, cor: "cinza" });
  const t1 = d.caixa(30, 50, 190, 84, "1. Reservar\nestoque", { tom: "verde" });
  const t2 = d.caixa(265, 50, 190, 84, "2. Cobrar\npagamento", { tom: "verde" });
  const t3 = d.caixa(500, 50, 190, 84, "3. Agendar\nentrega", { tom: "vermelho" });
  d.certo(201, 70, 16);
  d.certo(436, 70, 16);
  d.xis(671, 70, 16);
  d.seta(t1.dir, t2.esq);
  d.seta(t2.dir, t3.esq);

  const c2 = d.caixa(265, 266, 190, 84, "4. Estornar\npagamento", { tom: "laranja" });
  const c1 = d.caixa(30, 266, 190, 84, "5. Liberar\nestoque", { tom: "laranja" });
  d.texto(30, 382, "compensações, em ordem inversa", { tam: 16, cor: "cinza" });

  // a falha dispara as compensações
  d.seta(t3.emBaixo(0.3), c2.naDir(0.4), { rotulo: "a falha dispara\nas compensações", desloc: 86, tamRotulo: 16, cor: "vermelho" });
  d.seta(c2.esq, c1.dir);

  // cada compensação desfaz um passo já confirmado
  d.seta(c2.topo, t2.base, { tracejado: true, cor: "cinza", rotulo: "desfaz o 2", desloc: 56, tamRotulo: 16, corRotulo: "tinta" });
  d.seta(c1.topo, t1.base, { tracejado: true, cor: "cinza", rotulo: "desfaz o 1", desloc: 54, tamRotulo: 16, corRotulo: "tinta" });
};
