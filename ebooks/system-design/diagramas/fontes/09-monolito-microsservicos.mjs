// Capítulo 9 — Monólito (um bloco, um deploy, um banco) vs. microsserviços (serviços com banco próprio, ligados pela rede).
export default (d) => {
  d.tela(720, 420).titulo(
    "Monólito vs. microsserviços",
    "À esquerda, um monólito: os módulos Pedidos, Estoque e Usuários vivem dentro de uma única aplicação, com um único deploy, e todos usam o mesmo banco de dados. À direita, microsserviços: Pedidos, Estoque e Usuários são serviços separados, cada um com o próprio banco, e conversam entre si pela rede, por HTTP, gRPC ou filas de mensagens.",
  );

  d.linha([[344, 22], [344, 398]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // ── Monólito ──
  d.texto(172, 36, "Monólito", { ancora: "middle", tam: 20 });
  const app = d.grupo(36, 60, 272, 232, "1 aplicação, 1 deploy", { cor: "azul", tam: 17 });
  ["Pedidos", "Estoque", "Usuários"].forEach((nome, i) => d.caixa(64, 102 + i * 52, 216, 42, nome, { tom: "azul", tam: 17 }));
  d.texto(172, 278, "chamadas em memória", { ancora: "middle", tam: 16, cor: "azul" });
  const banco = d.cilindro(92, 324, 160, 76, "um banco\npara tudo", { tom: "verde", tam: 17 });
  d.seta(app.base, banco.topo);

  // ── Microsserviços ──
  d.texto(532, 36, "Microsserviços", { ancora: "middle", tam: 20 });
  d.linha([[366, 100], [700, 100]], { cor: "cinza", tracejado: true, espessura: 2 });
  d.texto(532, 86, "rede: HTTP, gRPC, filas", { ancora: "middle", tam: 16, cor: "cinza" });

  ["Pedidos", "Estoque", "Usuários"].forEach((nome, i) => {
    const x = 366 + i * 116;
    const s = d.caixa(x, 150, 100, 52, nome, { tom: "azul", tam: 17 });
    d.seta([s.cx, 104], s.topo, { duasPontas: true });
    const b = d.cilindro(x + 10, 252, 80, 62, "", { tom: "verde" });
    d.seta(s.base, b.topo);
  });
  d.textoCentro(532, 360, "cada serviço com deploy,\nescala e banco próprios", { tam: 16 });
};
