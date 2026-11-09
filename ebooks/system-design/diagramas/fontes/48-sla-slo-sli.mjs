// Capítulo 48 — SLA vs. SLO vs. SLI numa mesma régua, com o orçamento de erro ampliado.
export default (d) => {
  d.tela(720, 352).titulo(
    "SLA, SLO e SLI numa régua de disponibilidade",
    "Uma régua de disponibilidade mensal, de 99,4% a 100%. O SLA do contrato fica em 99,5%: abaixo dele, o contrato foi violado e há multa ou créditos. O SLO interno fica em 99,9%: entre 99,5% e 99,9% o contrato está cumprido, mas a meta interna foi furada e a equipe congela deploys. Acima de 99,9%, o SLO está cumprido. O SLI medido no mês é 99,95%. A faixa entre 99,9% e 100% é o orçamento de erro: 0,1% de 30 dias, ou seja, 0,1% de 43.200 minutos, igual a 43,2 minutos fora do ar. Ampliada, ela mostra que o SLI de 99,95% gastou 21,6 minutos e ainda sobram 21,6.",
  );

  const x = (p) => 60 + (p - 99.4) * 950; // 99,4% em x = 60; 100% em x = 630
  const TOPO = 100;
  const BASE = 150;

  // marcadores com rótulo
  d.texto(x(99.5), 36, "SLA: 99,5%\ncontrato", { ancora: "middle", tam: 17, cor: "vermelho" });
  d.linha([[x(99.5), 68], [x(99.5), BASE + 8]], { cor: "vermelho", espessura: 2.6 });
  d.texto(x(99.9) - 8, 36, "SLO: 99,9%\nmeta interna", { ancora: "end", tam: 17, cor: "azul" });
  d.linha([[x(99.9), 68], [x(99.9), BASE + 8]], { cor: "azul", espessura: 2.6 });
  d.texto(x(99.95) + 10, 36, "SLI medido\n99,95%", { tam: 17, cor: "verde" });
  d.seta([x(99.95), 52], [x(99.95), TOPO - 2], { cor: "verde", espessura: 2.6 });

  // faixas da régua
  d.caixa(x(99.4), TOPO, x(99.5) - x(99.4), BASE - TOPO, "SLA\nfurado", { tom: "vermelho", hachura: "solid", redondo: false, tam: 16 });
  d.caixa(x(99.5), TOPO, x(99.9) - x(99.5), BASE - TOPO, "SLA ok, SLO furado:\ncongela deploys", { tom: "amarelo", hachura: "solid", redondo: false, tam: 16 });
  d.caixa(x(99.9), TOPO, x(100) - x(99.9), BASE - TOPO, "SLO\ncumprido", { tom: "verde", hachura: "solid", redondo: false, tam: 16 });

  // escala
  for (const p of [99.4, 99.5, 99.6, 99.7, 99.8, 99.9, 100]) {
    d.linha([[x(p), BASE], [x(p), BASE + 8]], { cor: "cinza", espessura: 1.4 });
    d.texto(x(p), BASE + 26, `${String(p).replace(".", ",")}%`, { ancora: "middle", tam: 16, cor: "cinza" });
  }

  // a faixa verde, ampliada: o orçamento de erro
  const zx = 316;
  const zw = 320;
  const zy = 246;
  const zh = 52;
  d.linha([[x(99.9), BASE + 36], [x(99.9), BASE + 42], [x(100), BASE + 42], [x(100), BASE + 36]], { cor: "cinza", espessura: 1.4 });
  d.linha([[x(99.9), BASE + 42], [zx, zy - 4]], { cor: "cinza", tracejado: true, espessura: 1.2 });
  d.linha([[x(100), BASE + 42], [zx + zw, zy - 4]], { cor: "cinza", tracejado: true, espessura: 1.2 });
  d.caixa(zx, zy, zw / 2, zh, "sobram\n21,6 min", { tom: "verde", hachura: "solid", redondo: false, tam: 16 });
  d.caixa(zx + zw / 2, zy, zw / 2, zh, "gastos\n21,6 min", { tom: "laranja", hachura: "solid", redondo: false, tam: 16 });
  d.texto(zx + zw / 2, zy + zh + 24, "o SLI de 99,95% já gastou metade", { ancora: "middle", tam: 16, cor: "cinza" });

  d.texto(24, 236, "orçamento de erro\n100% − 99,9% = 0,1%\n0,1% de 30 dias\n(43.200 min)\n= *{43,2 min fora do ar}", { tam: 17, destaque: "violeta" });
};
