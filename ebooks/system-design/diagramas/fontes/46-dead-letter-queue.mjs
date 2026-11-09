// Capítulo 46 — Dead letter queue: a mensagem envenenada sai do caminho e volta depois da correção.
export default (d) => {
  d.tela(720, 420).titulo(
    "O caminho de uma mensagem até a DLQ e de volta",
    "A fila principal tem as mensagens 881 a 884; a 881 está envenenada. 1: a fila entrega a 881 ao consumidor. 2: o consumidor falha, não confirma, e a mensagem volta para a fila; isso se repete três vezes. 3: depois da terceira falha, a mensagem vai para a dead letter queue (DLQ), e a fila segue com as outras. 4: uma engenheira inspeciona a mensagem e corrige o bug. 5: ela faz o replay, devolvendo a 881 para a fila principal.",
  );

  // fila principal: a 881 (vermelha) é a mensagem envenenada
  const fila = d.caixa(60, 64, 236, 72, "", { cor: "laranja", preench: "none" });
  d.celulas(76, 74, ["884", "883", "882"], { lado: 52, destacadas: [0, 1, 2], tom: "amarelo" });
  const m881 = d.celulas(232, 74, ["881"], { lado: 52, destacadas: [0], tom: "vermelho" });
  d.texto(fila.cx, 52, "fila principal", { ancora: "middle", tam: 18, cor: "laranja" });

  const cons = d.caixa(500, 70, 190, 60, "consumidor", { tom: "azul" });

  const num = { destaque: "violeta", tamRotulo: 16 };
  d.seta([fila.x + fila.w, 88], [cons.x, 88], { rotulo: "*{1} entrega", desloc: 14, ...num });
  d.seta([cons.x, 114], [fila.x + fila.w, 114], { rotulo: "*{2} falha e volta\n(3 vezes)", desloc: 26, cor: "vermelho", ...num });

  // depois da terceira falha, a mensagem sai do caminho
  const dlq = d.caixa(190, 292, 136, 72, "", { cor: "vermelho", preench: "none" });
  d.celulas(dlq.cx - 26, 302, ["881"], { lado: 52, destacadas: [0], tom: "vermelho" });
  d.texto(dlq.cx, 390, "DLQ", { ancora: "middle", tam: 18, cor: "vermelho" });
  d.seta([m881.cx, fila.y + fila.h], dlq.topo, { rotulo: "*{3} vai para a DLQ", desloc: 82, cor: "vermelho", ...num });

  const eng = d.pessoa(600, 312, 70, { rotulo: "engenheira" });
  d.seta(dlq.dir, [eng.x - 12, 312], { rotulo: "*{4} inspeciona\ne corrige o bug", desloc: 30, ...num });

  // replay: a mensagem volta para a fila principal
  d.seta(dlq.emCima(0.14), [fila.x + 56, fila.y + fila.h + 2], { curva: 30, tracejado: true, cor: "verde", rotulo: "*{5} replay", corRotulo: "verde", ...num });
};
