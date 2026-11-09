// Capítulo 6 — Lei de Amdahl em escala: aceleração = 1 / (s + (1 − s) / N), para s = 5%, 20% e 50%.
export default (d) => {
  d.tela(720, 440).titulo(
    "Lei de Amdahl: aceleração por número de máquinas",
    "Gráfico em escala da aceleração obtida com N máquinas, de 1 a 64, para três frações sequenciais. Com 5% sequencial, a curva chega a cerca de 15 vezes com 64 máquinas e tende a um teto de 20 vezes. Com 20% sequencial, chega a 4 vezes com 16 máquinas e a 4,7 com 64, perto do teto de 5 vezes. Com 50% sequencial, a curva fica quase plana logo no começo, perto do teto de 2 vezes. Uma linha tracejada cinza mostra o ideal, sem parte sequencial, em que N máquinas dariam N vezes.",
  );

  // área do gráfico
  const X0 = 78;
  const X1 = 590;
  const Y0 = 376;
  const Y1 = 52;
  const NMAX = 64;
  const SMAX = 22;
  const px = (n) => X0 + (n / NMAX) * (X1 - X0);
  const py = (s) => Y0 - (s / SMAX) * (Y0 - Y1);
  const amdahl = (seq, n) => 1 / (seq + (1 - seq) / n);

  // eixos
  d.seta([X0, Y0], [X0, Y1 - 16], { espessura: 1.6, aspereza: 0.6 });
  d.seta([X0, Y0], [X1 + 22, Y0], { espessura: 1.6, aspereza: 0.6 });
  d.texto(X0 + 12, Y1 - 10, "aceleração", { tam: 16 });
  d.texto((X0 + X1) / 2, 428, "número de máquinas (N)", { ancora: "middle", tam: 16 });

  for (const n of [1, 16, 32, 48, 64]) {
    d.linha([[px(n), Y0], [px(n), Y0 + 6]], { espessura: 1.4, aspereza: 0.3 });
    d.texto(px(n), Y0 + 24, String(n), { ancora: "middle", tam: 16, cor: "cinza" });
  }
  for (const s of [0, 5, 10, 15, 20]) {
    d.linha([[X0 - 6, py(s)], [X0, py(s)]], { espessura: 1.4, aspereza: 0.3 });
    d.texto(X0 - 12, py(s) + 6, `${s}×`, { ancora: "end", tam: 16, cor: "cinza" });
  }

  // ideal (nada sequencial): N máquinas = N vezes mais rápido
  d.linha([[px(1), py(1)], [px(SMAX), py(SMAX)]], { cor: "cinza", tracejado: true, espessura: 1.6, aspereza: 0.4 });
  d.texto(px(SMAX) + 10, py(SMAX) + 14, "ideal (0% sequencial)", { tam: 16, cor: "cinza" });

  // as três curvas, cada uma com o seu teto 1/s
  const ns = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64];
  const series = [
    { seq: 0.05, tom: "verde", rotulo: "5% sequencial", yRotulo: 128 },
    { seq: 0.2, tom: "laranja", rotulo: "20% sequencial", yRotulo: 288 },
    { seq: 0.5, tom: "vermelho", rotulo: "50% sequencial", yRotulo: 336 },
  ];
  for (const { seq, tom, rotulo, yRotulo } of series) {
    const teto = 1 / seq;
    d.linha([[X0, py(teto)], [X1, py(teto)]], { cor: tom, tracejado: "5 6", espessura: 1.4, aspereza: 0.3 });
    d.texto(X1 + 10, py(teto) + 6, `teto ${Math.round(teto)}×`, { tam: 17, cor: tom });
    d.curva(ns.map((n) => [px(n), py(amdahl(seq, n))]), { cor: tom, espessura: 2.6, aspereza: 0.25, arco: 0.3 });
    d.texto(452, yRotulo, rotulo, { ancora: "middle", tam: 16, cor: tom });
  }
};
