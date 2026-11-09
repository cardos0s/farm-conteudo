// Capítulo 40 — Two-Phase Commit: as duas fases e o ponto em que os participantes travam.
export default (d) => {
  d.tela(720, 452).titulo(
    "Two-Phase Commit e o ponto de bloqueio",
    "Fase 1: o coordenador manda prepare para os participantes A e B, e os dois votam sim. A partir do voto, A e B ficam em dúvida e seguram os locks. O coordenador grava a decisão de commit no log. Se ele cair nesse ponto, A e B ficam travados, sem poder confirmar nem desfazer. Fase 2: o coordenador manda commit, os participantes respondem ok e liberam os locks.",
  );

  const xa = 200;
  const xc = 410;
  const xb = 620;
  d.caixa(130, 16, 140, 46, "Participante A", { tom: "azul", tam: 17 });
  d.caixa(340, 16, 140, 46, "Coordenador", { tom: "violeta", tam: 17 });
  d.caixa(550, 16, 140, 46, "Participante B", { tom: "azul", tam: 17 });
  for (const x of [xa, xc, xb]) d.linha([[x, 62], [x, 398]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // fase 1: votação
  d.texto(16, 112, "Fase 1\nvotação", { tam: 17, cor: "violeta" });
  d.seta([xc, 86], [xa, 106], { rotulo: "prepare?", desloc: -20 });
  d.seta([xc, 86], [xb, 106], { rotulo: "prepare?", desloc: 20 });
  d.seta([xa, 128], [xc, 148], { rotulo: "voto: sim", desloc: 20, cor: "verde", corRotulo: "verde" });
  d.seta([xb, 128], [xc, 148], { rotulo: "voto: sim", desloc: -20, cor: "verde", corRotulo: "verde" });

  // janela de dúvida: votaram sim e esperam a decisão, segurando locks
  for (const x of [xa, xb]) d.caixa(x - 7, 132, 14, 204, "", { tom: "vermelho", hachura: "solid", redondo: false, espessura: 1.4 });
  d.texto(16, 206, "A e B votaram\nsim e ficam em\ndúvida, com\nlocks presos", { tam: 16, cor: "vermelho" });

  // o coordenador decide e grava no log
  d.caixa(340, 166, 140, 50, "todos sim:\ngrava COMMIT", { tom: "violeta", tam: 16 });
  d.xis(xc, 240, 18);
  d.texto(430, 234, "se o coordenador\ncair aqui, A e B\nficam travados", { tam: 16, cor: "vermelho" });

  // fase 2: decisão
  d.texto(16, 344, "Fase 2\ndecisão", { tam: 17, cor: "violeta" });
  d.seta([xc, 316], [xa, 336], { rotulo: "commit", desloc: -20 });
  d.seta([xc, 316], [xb, 336], { rotulo: "commit", desloc: 20 });
  d.seta([xa, 360], [xc, 380], { rotulo: "ok", desloc: 20, cor: "cinza" });
  d.seta([xb, 360], [xc, 380], { rotulo: "ok", desloc: -20, cor: "cinza" });

  d.textoCentro(xc, 424, "depois do commit, cada participante libera os locks", { tam: 16, cor: "cinza" });
};
