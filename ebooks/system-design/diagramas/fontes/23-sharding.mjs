// Capítulo 23 — Sharding: a chave de shard passa por uma função que escolhe o shard.
// À esquerda, hash espalha as escritas; à direita, faixa de datas cria um hot spot.
export default (d) => {
  d.tela(720, 448).titulo(
    "Sharding por hash e por faixa de datas",
    "Dois painéis. À esquerda, a chave de shard é o id do pedido e a função é hash(id) mod 3: as escritas se dividem por igual, cerca de 33% para cada um dos três shards. À direita, a chave é a data do pedido e há um shard por mês: os shards de janeiro e fevereiro quase não recebem escritas, e o shard de março, o mês atual, recebe 95% delas. É um hot spot.",
  );

  // ── por hash ──
  d.grupo(16, 16, 336, 416, "por hash");
  const k1 = d.etiqueta(184, 82, "chave = id do pedido", { tom: "cinza" });
  const f1 = d.caixa(84, 134, 200, 54, "hash(id) mod 3", { tom: "azul" });
  d.seta(k1.base, f1.topo);
  [34, 141, 248].forEach((x, i) => {
    const s = d.cilindro(x, 256, 86, 80, `S${i + 1}`, { tom: "verde" });
    d.seta(f1.emBaixo(0.25 + 0.25 * i), s.topo);
    d.texto(x + 43, 362, "33%", { ancora: "middle" });
  });
  d.texto(184, 404, "escritas bem distribuídas", { ancora: "middle", cor: "verde", tam: 17 });

  // ── por faixa de datas ──
  d.grupo(368, 16, 336, 416, "por faixa de datas");
  const k2 = d.etiqueta(536, 82, "chave = data do pedido", { tom: "cinza" });
  const f2 = d.caixa(436, 134, 200, 54, "um shard por mês", { tom: "azul" });
  d.seta(k2.base, f2.topo);
  const pct = ["2%", "3%", "95%"];
  ["jan", "fev", "mar"].forEach((mes, i) => {
    const x = 386 + 107 * i;
    const quente = i === 2;
    const s = d.cilindro(x, 256, 86, 80, mes, { tom: quente ? "vermelho" : "cinza" });
    d.seta(f2.emBaixo(0.25 + 0.25 * i), s.topo, quente ? { cor: "vermelho", espessura: 4 } : { cor: "cinza", tracejado: true });
    d.texto(x + 43, 362, pct[i], { ancora: "middle", cor: quente ? "vermelho" : "tinta" });
  });
  d.texto(536, 396, "hot spot: todo pedido novo\ncai no shard do mês atual", { ancora: "middle", cor: "vermelho", tam: 17 });
};
