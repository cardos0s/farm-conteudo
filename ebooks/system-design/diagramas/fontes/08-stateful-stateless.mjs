// Capítulo 8 — Stateful (sessão na memória do servidor 1) vs. stateless (sessão num armazenamento externo).
export default (d) => {
  d.tela(720, 424).titulo(
    "Stateful vs. stateless",
    "À esquerda, um serviço stateful: a sessão da usuária, com o carrinho, fica na memória do servidor 1, então o load balancer precisa mandá-la sempre para ele; o servidor 2 não conhece a sessão, e se o servidor 1 cair o carrinho se perde. À direita, um serviço stateless: o load balancer manda cada requisição para qualquer servidor, A ou B, e ambos leem e gravam a sessão num armazenamento externo, o Redis.",
  );

  d.linha([[360, 22], [360, 402]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // ── Stateful ──
  d.texto(180, 36, "Stateful", { ancora: "middle", tam: 20 });
  d.pessoa(180, 82, 50);
  const lb1 = d.caixa(102, 140, 156, 44, "load balancer", { tom: "violeta", tam: 17 });
  d.seta([180, 112], lb1.topo);

  const s1 = d.caixa(28, 236, 140, 122, "", { tom: "azul" });
  d.texto(s1.cx, 260, "Servidor 1", { ancora: "middle", tam: 17 });
  d.caixa(44, 274, 108, 66, "sessão:\ncarrinho", { tom: "amarelo", hachura: "solid", tam: 17 });

  const s2 = d.caixa(192, 236, 140, 122, "", { tom: "azul" });
  d.texto(s2.cx, 260, "Servidor 2", { ancora: "middle", tam: 17 });
  d.textoCentro(s2.cx, 306, "não conhece\na sessão", { tam: 16 });

  d.seta(lb1.emBaixo(0.25), s1.emCima(0.55), { espessura: 2.4 });
  d.texto(150, 218, "sempre o 1 (sticky)", { tam: 16 });
  d.texto(180, 392, "servidor 1 caiu? o carrinho some", { ancora: "middle", tam: 16, cor: "vermelho" });

  // ── Stateless ──
  d.texto(540, 36, "Stateless", { ancora: "middle", tam: 20 });
  d.pessoa(540, 82, 50);
  const lb2 = d.caixa(462, 140, 156, 44, "load balancer", { tom: "violeta", tam: 17 });
  d.seta([540, 112], lb2.topo);

  const a = d.caixa(388, 236, 130, 58, "Servidor A", { tom: "azul", tam: 17 });
  const b = d.caixa(562, 236, 130, 58, "Servidor B", { tom: "azul", tam: 17 });
  d.seta(lb2.emBaixo(0.25), a.topo);
  d.seta(lb2.emBaixo(0.75), b.topo);
  d.texto(540, 220, "qualquer um", { ancora: "middle", tam: 16, cor: "verde" });

  const redis = d.cilindro(462, 330, 156, 72, "Redis\n(sessões)", { tom: "laranja", tam: 17 });
  d.seta(a.base, redis.emCima(0.12), { duasPontas: true });
  d.seta(b.base, redis.emCima(0.88), { duasPontas: true });
};
