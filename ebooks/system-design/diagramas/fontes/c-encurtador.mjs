// Apêndice C — Estudo de caso: arquitetura de alto nível de um encurtador de links.
export default (d) => {
  d.tela(720, 440).titulo(
    "Arquitetura de um encurtador de links",
    "O usuário clica no link curto. O DNS aponta o domínio para a borda da CDN, que repassa a requisição ao load balancer. O load balancer escolhe uma instância do serviço de links, que primeiro procura o código no cache e, se não achar, lê do banco, dividido em três shards. O serviço responde 302 com a URL longa e publica o evento do clique numa fila, sem esperar; o serviço de analytics consome a fila e agrega os cliques.",
  );

  // linha 1: o caminho de entrada
  const usuario = d.pessoa(56, 64, 62, { rotulo: "usuário" });
  const borda = d.nuvem(205, 70, 170, 100, "DNS + CDN", { tom: "cinza" });
  const lb = d.caixa(320, 36, 140, 70, "load\nbalancer", { tom: "azul" });

  d.seta([usuario.x + usuario.w + 8, 66], [borda.x + 6, 68]);
  d.seta([borda.x + borda.w - 4, 70], lb.esq);

  // linha 2: fila ← serviço → cache
  const servico = d.caixa(290, 186, 190, 80, "serviço de links\n(stateless, ×N)", { tom: "azul" });
  const cache = d.caixa(586, 190, 118, 72, "cache\n(Redis)", { tom: "laranja" });
  const fila = d.caixa(24, 190, 160, 72, "fila /\npub-sub", { tom: "amarelo" });

  d.seta(lb.base, [lb.cx, servico.y]);
  d.seta(servico.dir, cache.esq, { rotulo: "1. busca" });
  d.seta(servico.esq, fila.dir, { rotulo: "clique", tracejado: true });

  // a resposta volta ao usuário (na prática, passando pelo load balancer e pela CDN)
  d.seta(servico.emCima(0.06), [90, 92], { cor: "verde", curva: 20, rotulo: "302 + URL longa" });

  // linha 3: banco shardeado e analytics
  const banco = d.grupo(240, 300, 290, 124, "banco shardeado");
  ["shard 1", "shard 2", "shard 3"].forEach((nome, i) => {
    d.cilindro(257 + i * 90, 338, 76, 72, nome, { tom: "verde", tam: 16 });
  });
  const analytics = d.caixa(24, 330, 160, 72, "analytics", { tom: "violeta" });

  d.seta([servico.cx, servico.y + servico.h], [servico.cx, banco.y], { rotulo: "2. se faltar", desloc: 72 });
  d.seta(fila.base, analytics.topo);
};
