// Capítulo 34 — Bulkhead: um pool compartilhado vs. um compartimento por funcionalidade.
export default (d) => {
  d.tela(720, 400).titulo(
    "Pool compartilhado vs. bulkhead",
    "Em cima, sem bulkhead: um único pool de 100 threads; a dependência de recomendações ficou lenta e prendeu todas, e o pedido de checkout é recusado. Embaixo, com bulkhead: 50 threads para checkout, 30 para busca e 20 para recomendações. As 20 de recomendações estão cheias e a próxima chamada é recusada na hora, mas o checkout continua atendendo.",
  );

  const L = 40; // cada quadrado = 10 threads

  // ── sem bulkhead ──
  d.texto(16, 32, "sem bulkhead: um pool só para tudo", { tam: 17, cor: "vermelho" });
  d.celulas(150, 52, Array(10).fill("R"), { lado: L, destacadas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], tom: "vermelho" });
  d.seta([28, 72], [118, 72], { rotulo: "checkout", desloc: 16, tamRotulo: 16 });
  d.xis(131, 72, 16);
  d.textoCentro(350, 130, "as 100 threads presas em recomendações:\nnão sobra nenhuma para o checkout", { tam: 16, cor: "vermelho" });

  d.linha([[16, 170], [704, 170]], { cor: "cinza", tracejado: true, espessura: 1.2 });

  // ── com bulkhead ──
  d.texto(16, 204, "com bulkhead: um compartimento por funcionalidade", { tam: 17, cor: "verde" });
  d.texto(250, 238, "checkout (50)", { tam: 16, ancora: "middle" });
  d.texto(450, 238, "busca (30)", { tam: 16, ancora: "middle" });
  d.texto(600, 238, "recomendações (20)", { tam: 16, ancora: "middle" });
  d.celulas(150, 250, ["", "", "", "", ""], { lado: L, destacadas: [0, 1], tom: "verde" });
  d.celulas(390, 250, ["", "", ""], { lado: L, destacadas: [0], tom: "verde" });
  d.celulas(560, 250, ["R", "R"], { lado: L, destacadas: [0, 1], tom: "vermelho" });
  d.seta([28, 270], [140, 270], { rotulo: "checkout", desloc: 16, tamRotulo: 16 });

  d.textoCentro(250, 322, "o checkout continua\natendendo normalmente", { tam: 16, cor: "verde" });
  d.textoCentro(600, 322, "cheio: a próxima\né recusada na hora", { tam: 16, cor: "vermelho" });
  d.texto(704, 362, "R = thread presa em recomendações\ncada quadrado = 10 threads", { tam: 16, cor: "cinza", ancora: "end" });
};
