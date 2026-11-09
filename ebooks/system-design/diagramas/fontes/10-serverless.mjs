// Capítulo 10 — Serverless numa linha do tempo: cold start, reaproveitamento do ambiente, pico e escala a zero.
export default (d) => {
  d.tela(720, 340).titulo(
    "Ciclo de vida dos ambientes de uma função serverless",
    "Linha do tempo com eventos chegando de cima e dois ambientes de execução. O primeiro evento não encontra ambiente pronto: a plataforma cria o ambiente 1 e paga um cold start, em laranja, antes de executar a função, em verde. O segundo evento reaproveita o ambiente 1, já quente, e só executa. Depois chegam dois eventos ao mesmo tempo: o ambiente 1 atende um e a plataforma cria o ambiente 2, com novo cold start, para o outro. Sem tráfego, os ambientes são descartados e a escala volta a zero; o evento seguinte paga outro cold start.",
  );

  const L1 = 122;
  const L2 = 204;
  const barra = (x, y, w, tom, h = 26) => d.caixa(x, y - h / 2, w, h, "", { tom, hachura: "solid", raio: 6, aspereza: 0.6 });
  const vida = (x1, x2, y) => d.linha([[x1, y], [x2, y]], { cor: "cinza", espessura: 1.4, aspereza: 0.3 });

  // eventos que chegam
  d.texto(24, 58, "eventos", { tam: 17, cor: "cinza" });
  for (const x of [150, 274, 352, 612]) d.seta([x, 24], [x, 58], { cor: "cinza" });
  d.texto(360, 40, "×2", { tam: 16, cor: "cinza" });

  // ambiente 1: cold start, depois quente, depois o pico
  d.texto(24, L1 + 6, "ambiente 1", { tam: 17 });
  vida(150, 478, L1);
  barra(150, L1, 56, "laranja");
  barra(206, L1, 36, "verde");
  d.texto(178, L1 - 24, "cold start", { ancora: "middle", tam: 16, cor: "laranja" });
  barra(274, L1, 36, "verde");
  d.texto(292, L1 - 24, "quente", { ancora: "middle", tam: 16, cor: "verde" });
  barra(352, L1, 36, "verde");
  d.xis(486, L1, 14, { cor: "cinza", espessura: 2 });

  // ambiente 2: criado no pico
  d.texto(24, L2 + 6, "ambiente 2", { tam: 17 });
  vida(352, 504, L2);
  barra(352, L2, 56, "laranja");
  barra(408, L2, 36, "verde");
  d.texto(398, L2 + 38, "pico: mais um ambiente", { ancora: "middle", tam: 16 });
  d.xis(512, L2, 14, { cor: "cinza", espessura: 2 });

  // sem tráfego: escala a zero; o próximo evento paga outro cold start
  d.textoCentro(562, 163, "sem tráfego:\nescala a zero", { tam: 16, cor: "cinza" });
  vida(612, 700, L1);
  barra(612, L1, 56, "laranja");
  barra(668, L1, 32, "verde");
  d.texto(700, L1 - 24, "cold start de novo", { ancora: "end", tam: 16, cor: "laranja" });

  // legenda
  barra(150, 284, 30, "laranja", 20);
  d.texto(192, 290, "cold start: a plataforma cria o ambiente e inicializa", { tam: 16 });
  barra(150, 314, 30, "verde", 20);
  d.texto(192, 320, "execução da função", { tam: 16 });
};
