// Capítulo 5 — Latência média × utilização num servidor com fila (modelo M/M/1): T = S / (1 − ρ), com S = 10 ms.
export default (d) => {
  d.tela(720, 440).titulo(
    "Latência explode perto de 100% de utilização",
    "Gráfico em escala da latência média de um servidor com fila, em que cada requisição exige 10 ms de trabalho, conforme a utilização sobe. Com 50% de utilização, a latência média é 20 ms; com 80%, 50 ms; com 90%, 100 ms; com 95%, 200 ms. Perto de 100%, a fila cresce sem limite e a curva dispara.",
  );

  const X0 = 80;
  const X1 = 600;
  const Y0 = 372;
  const Y1 = 60;
  const TMAX = 240; // ms
  const S = 10; // ms de trabalho por requisição
  const px = (rho) => X0 + rho * (X1 - X0);
  const py = (t) => Y0 - (t / TMAX) * (Y0 - Y1);
  const lat = (rho) => S / (1 - rho);

  // eixos
  d.seta([X0, Y0], [X0, Y1 - 18], { espessura: 1.6, aspereza: 0.6 });
  d.seta([X0, Y0], [X1 + 40, Y0], { espessura: 1.6, aspereza: 0.6 });
  d.texto(X0 + 12, Y1 - 12, "latência média", { tam: 16 });
  d.texto((X0 + X1) / 2, 428, "utilização do servidor", { ancora: "middle", tam: 16 });
  for (const r of [0, 0.25, 0.5, 0.75, 1]) {
    d.linha([[px(r), Y0], [px(r), Y0 + 6]], { espessura: 1.4, aspereza: 0.3 });
    d.texto(px(r), Y0 + 24, `${Math.round(r * 100)}%`, { ancora: "middle", tam: 16, cor: "cinza" });
  }
  for (const t of [50, 100, 150, 200]) {
    d.linha([[X0 - 6, py(t)], [X0, py(t)]], { espessura: 1.4, aspereza: 0.3 });
    d.texto(X0 - 12, py(t) + 6, `${t} ms`, { ancora: "end", tam: 16, cor: "cinza" });
  }

  // 100%: a fila cresce sem parar
  d.linha([[px(1), Y0], [px(1), Y1]], { cor: "vermelho", tracejado: "5 6", espessura: 1.4, aspereza: 0.3 });
  d.texto(px(1) + 8, Y1 + 14, "fila\nsem fim", { tam: 16, cor: "vermelho" });

  d.texto(X0 + 16, Y1 + 32, "cada requisição: 10 ms de trabalho", { tam: 16, cor: "cinza" });

  // a curva, cortada no topo do gráfico
  const rhoMax = 1 - S / TMAX;
  const rhos = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.84, 0.87, 0.9, 0.92, 0.94, 0.95, rhoMax];
  d.curva(rhos.map((r) => [px(r), py(lat(r))]), { cor: "azul", espessura: 2.8, aspereza: 0.25, arco: 0.3 });

  // pontos marcados
  for (const [r, yTxt] of [[0.5, -16], [0.8, -10], [0.9, -6], [0.95, 4]]) {
    const x = px(r);
    const y = py(lat(r));
    d.circulo(x, y, 9, "", { tom: "azul", hachura: "solid", aspereza: 0.4 });
    d.texto(x - 12, y + yTxt, `${Math.round(r * 100)}%: ${Math.round(lat(r))} ms`, { ancora: "end", tam: 16 });
  }
};
