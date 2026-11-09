// Capítulo 24 — Replicação: primário-réplica (com replication lag) vs. multi-primário (com conflito).
export default (d) => {
  d.tela(720, 448).titulo(
    "Primário-réplica e multi-primário",
    "Dois painéis. À esquerda, primário-réplica: o cliente grava só no primário, que replica as mudanças para duas réplicas com algum atraso (replication lag); as leituras vão para as réplicas. À direita, multi-primário: o cliente 1 grava saldo = 80 no primário A e, ao mesmo tempo, o cliente 2 grava saldo = 120 no primário B. Quando os dois sincronizam, há um conflito: qual valor vale?",
  );

  // ── primário-réplica ──
  d.grupo(16, 16, 336, 416, "primário-réplica");
  d.pessoa(68, 104, 54, { rotulo: "escritas" });
  const p = d.cilindro(160, 62, 150, 84, "Primário", { tom: "azul" });
  d.seta([100, 104], p.esq);
  const r1 = d.cilindro(34, 236, 130, 80, "Réplica 1", { tom: "ciano" });
  const r2 = d.cilindro(202, 236, 130, 80, "Réplica 2", { tom: "ciano" });
  d.seta(p.emBaixo(0.25), r1.topo, { tracejado: true, rotulo: "lag", corRotulo: "laranja" });
  d.seta(p.emBaixo(0.75), r2.topo, { tracejado: true, rotulo: "lag", corRotulo: "laranja" });
  const leitor = d.pessoa(184, 372, 54, { rotulo: "leituras" });
  d.seta([166, 344], r1.emBaixo(0.6));
  d.seta([202, 344], r2.emBaixo(0.4));

  // ── multi-primário ──
  d.grupo(368, 16, 336, 416, "multi-primário");
  d.pessoa(453, 74, 50, { rotulo: "cliente 1\ngrava 80" });
  d.pessoa(621, 74, 50, { rotulo: "cliente 2\ngrava 120" });
  const a = d.cilindro(388, 196, 130, 84, "Primário A\nsaldo = 80", { tom: "azul" });
  const b = d.cilindro(556, 196, 130, 84, "Primário B\nsaldo = 120", { tom: "azul" });
  d.seta([453, 146], a.topo);
  d.seta([621, 146], b.topo);
  d.seta(a.dir, b.esq, { duasPontas: true, tracejado: true });
  const c = d.caixa(424, 336, 226, 70, "conflito!\nvale 80 ou 120?", { tom: "vermelho" });
  d.seta([537, 246], c.topo, { cor: "vermelho", rotulo: "ao sincronizar", desloc: 66, posRotulo: 0.62, corRotulo: "vermelho" });
};
