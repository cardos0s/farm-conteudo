// Capítulo 44 — Fila de mensagens ponto a ponto: produtores, fila e consumidores concorrentes.
export default (d) => {
  d.tela(720, 400).titulo(
    "Fila ponto a ponto com consumidores concorrentes",
    "Dois produtores enviam mensagens para a mesma fila, onde m4, m5 e m6 esperam a vez. Três consumidores disputam a fila: o consumidor 1 recebe m1, o 2 recebe m2 e o 3 recebe m3; nenhuma mensagem vai para dois consumidores. Quando o consumidor 1 termina, envia um ack, e só então m1 é apagada da fila.",
  );

  const p1 = d.caixa(16, 100, 140, 52, "produtor 1", { tom: "azul" });
  const p2 = d.caixa(16, 248, 140, 52, "produtor 2", { tom: "azul" });

  // a fila: um tubo com as mensagens que ainda esperam
  const tubo = d.caixa(232, 162, 188, 76, "", { cor: "laranja", preench: "none" });
  d.celulas(248, 174, ["m6", "m5", "m4"], { lado: 52, destacadas: [0, 1, 2], tom: "amarelo" });
  d.texto(tubo.cx, 148, "fila", { ancora: "middle", tam: 18, cor: "laranja" });

  d.seta(p1.dir, tubo.naEsq(0.32));
  d.seta(p2.dir, tubo.naEsq(0.68));

  const c1 = d.caixa(548, 44, 156, 56, "consumidor 1", { tom: "azul" });
  const c2 = d.caixa(548, 172, 156, 56, "consumidor 2", { tom: "azul" });
  const c3 = d.caixa(548, 300, 156, 56, "consumidor 3", { tom: "azul" });

  // cada mensagem vai para um só consumidor
  d.seta(tubo.naDir(0.25), c1.naEsq(0.7), { rotulo: "m1" });
  d.seta(tubo.dir, c2.esq, { rotulo: "m2" });
  d.seta(tubo.naDir(0.75), c3.naEsq(0.3), { rotulo: "m3" });

  // a confirmação: só depois dela a mensagem sai da fila
  d.seta(c1.naEsq(0.25), tubo.emCima(0.8), { curva: -34, tracejado: true, cor: "verde", rotulo: "ack: m1 sai da fila", corRotulo: "verde" });
  d.texto(tubo.cx - 4, 292, "m1, m2 e m3 ficam reservadas\naté o ack; sem ack, voltam", { ancora: "middle", tam: 16, cor: "cinza" });
};
