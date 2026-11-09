// Capítulo 22 — Gossip em rodadas: a novidade se espalha de par em par até todos saberem.
export default (d) => {
  d.tela(720, 352).titulo(
    "Protocolo gossip em rodadas",
    "Três quadros com os mesmos oito nós, de A a H. No início, só o nó A sabe a novidade. Na rodada 1, A conta para dois nós sorteados, B e C: três nós sabem. Na rodada 2, cada um dos três conta para dois nós sorteados: A conta para E e para C, que já sabia (uma conversa repetida); B conta para D e F; C conta para G e H. Ao fim da rodada 2, os oito nós sabem.",
  );

  // posições dos nós dentro de um quadro (relativas ao canto do quadro)
  const pos = {
    A: [56, 74],
    B: [150, 66],
    C: [38, 152],
    D: [190, 112],
    E: [110, 122],
    F: [172, 204],
    G: [62, 226],
    H: [124, 190],
  };
  const R = 16;

  const quadro = (x0, rotulo, sabem, conversas, legenda) => {
    d.grupo(x0, 16, 218, 290, rotulo, { tam: 18, corTexto: "tinta" });
    const p = (n) => [x0 + pos[n][0], 16 + pos[n][1]];
    // setas primeiro, de borda a borda
    for (const [de, ate, repetida] of conversas) {
      const [x1, y1] = p(de);
      const [x2, y2] = p(ate);
      const l = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / l;
      const uy = (y2 - y1) / l;
      d.seta([x1 + ux * (R + 3), y1 + uy * (R + 3)], [x2 - ux * (R + 4), y2 - uy * (R + 4)], {
        cor: repetida ? "cinza" : "tinta",
        tracejado: repetida,
        ponta: 10,
      });
    }
    for (const n of Object.keys(pos)) {
      const [cx, cy] = p(n);
      if (sabem.includes(n)) d.circulo(cx, cy, R * 2, n, { tom: "verde", tam: 16 });
      else d.circulo(cx, cy, R * 2, n, { cor: "cinza", preench: "none", tam: 16, corTexto: "cinza" });
    }
    d.texto(x0 + 109, 16 + 272, legenda, { ancora: "middle", tam: 17 });
  };

  quadro(16, "início", ["A"], [], "só A sabe");
  quadro(251, "rodada 1", ["A", "B", "C"], [["A", "B"], ["A", "C"]], "3 sabem");
  quadro(
    486,
    "rodada 2",
    ["A", "B", "C", "D", "E", "F", "G", "H"],
    [["A", "E"], ["A", "C", true], ["B", "D"], ["B", "F"], ["C", "G"], ["C", "H"]],
    "todos os 8 sabem",
  );

  // legenda
  d.circulo(150, 330, 22, "", { tom: "verde" });
  d.texto(168, 336, "sabe a novidade", { tam: 16 });
  d.seta([360, 330], [404, 330], { cor: "cinza", tracejado: true, ponta: 10 });
  d.texto(416, 336, "conversa com quem já sabia", { tam: 16, cor: "cinza" });
};
