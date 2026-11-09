// Capítulo 45 — Pub/Sub: um publicador, um tópico e vários assinantes, cada um com a sua cópia.
export default (d) => {
  d.tela(720, 400).titulo(
    "Pub/sub: uma publicação, uma cópia para cada assinante",
    "O serviço de pedidos publica o evento uma única vez no tópico pedidos. O tópico entrega uma cópia a cada assinante: o serviço de e-mail manda a confirmação, o de analytics conta a venda e o de estoque reserva os itens. Um quarto assinante, o antifraude, entrou depois: criou a própria assinatura e passou a receber cópias sem nenhuma mudança no publicador.",
  );

  const pub = d.caixa(16, 162, 140, 76, "serviço de\npedidos", { tom: "azul" });
  const topico = d.caixa(236, 160, 140, 80, "tópico\n“pedidos”", { tom: "amarelo" });
  d.seta(pub.dir, topico.esq, { rotulo: "publica\n1 vez", desloc: 30 });

  const assinante = (y, nome, faz, o = {}) => {
    const c = d.caixa(500, y, 204, 64, "", { tom: "azul", ...o });
    d.textoCentro(c.cx, c.cy - 11, nome, { tam: 19 });
    d.textoCentro(c.cx, c.cy + 13, faz, { tam: 16 });
    return c;
  };
  const subs = [
    assinante(20, "e-mail", "manda a confirmação"),
    assinante(116, "analytics", "conta a venda"),
    assinante(220, "estoque", "reserva os itens"),
    assinante(316, "antifraude", "(entrou depois)", { tom: "violeta", tracejado: true }),
  ];

  subs.forEach((s, i) => {
    const novo = i === 3;
    d.seta(topico.naDir(0.2 + i * 0.2), s.esq, { rotulo: "cópia", posRotulo: 0.58, tracejado: novo, cor: novo ? "violeta" : undefined });
  });
};
