// Capítulo 37 — Heartbeat: sinais periódicos, o silêncio e o timeout antes do failover.
export default (d) => {
  d.tela(720, 260).titulo(
    "Heartbeat e timeout",
    "O nó manda um heartbeat por segundo para o monitor. Depois do quinto sinal, o nó morre. O monitor não percebe na hora: ele espera o timeout de 5 segundos sem nenhum sinal e só então declara a falha e dispara o failover.",
  );

  const x = (t) => 100 + t * 46; // escala: 46 px por segundo
  const yNo = 72;
  const yMon = 192;

  d.texto(16, yNo + 6, "nó", { tam: 17 });
  d.texto(16, yMon + 6, "monitor", { tam: 17 });

  // janela do timeout (desenhada antes da linha do monitor)
  d.marca(x(4) + 12, yMon - 11, x(9) - x(4) - 12, 22, "vermelho");

  d.linha([[96, yNo], [x(4.5), yNo]], { cor: "cinza", espessura: 1.4 });
  d.linha([[x(4.5), yNo], [704, yNo]], { cor: "cinza", espessura: 1.2, tracejado: true });
  d.linha([[96, yMon], [x(9), yMon]], { cor: "cinza", espessura: 1.4 });

  // um heartbeat por segundo
  d.texto(x(0), 44, "1 heartbeat por segundo", { tam: 16, cor: "verde" });
  for (let t = 0; t <= 4; t++) d.seta([x(t), yNo + 2], [x(t) + 12, yMon - 2], { cor: "verde", ponta: 10 });

  // o nó morre
  d.xis(x(4.5), yNo, 16);
  d.texto(x(4.5) + 15, yNo - 10, "o nó morre", { tam: 16, cor: "vermelho" });

  // o monitor espera o timeout inteiro
  d.textoCentro((x(4) + 12 + x(9)) / 2, yMon + 38, "timeout: 5 s sem nenhum sinal", { tam: 16, cor: "vermelho" });
  d.caixa(530, yMon - 27, 174, 54, "declara a falha\ne faz failover", { tom: "vermelho", tam: 16 });
};
