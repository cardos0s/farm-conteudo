// Capítulo 35 — Retries com backoff exponencial e o efeito do jitter.
export default (d) => {
  d.tela(720, 440).titulo(
    "Backoff exponencial com e sem jitter",
    "Em cima, um cliente: a primeira chamada falha no instante 0 e as novas tentativas esperam 1, 2, 4 e 8 segundos, nos instantes 1, 3, 7 e 15 s, quando dá certo. No meio, cinco clientes sem jitter: todos tentam de novo nos mesmos instantes e formam picos. Embaixo, os mesmos cinco clientes com jitter: cada um sorteia a espera entre zero e o teto, e as tentativas se espalham no tempo.",
  );

  const x = (t) => 70 + t * 38; // escala: 38 px por segundo
  const eixo = 116;

  // ── um cliente ──
  d.texto(16, 30, "um cliente: a espera dobra a cada falha", { tam: 17 });
  d.seta([52, eixo], [704, eixo], { cor: "cinza", espessura: 1.4, ponta: 10 });
  const tentativas = [0, 1, 3, 7, 15];
  tentativas.forEach((t, i) => {
    if (i < 4) d.xis(x(t), eixo, 14);
    else d.certo(x(t), eixo, 18);
    d.texto(x(t), eixo + 26, `${t} s`, { tam: 16, ancora: "middle", cor: "cinza" });
  });
  const esperas = [1, 2, 4, 8];
  const curvas = [12, 18, 26, 40];
  esperas.forEach((e, i) => {
    const a = tentativas[i];
    const b = tentativas[i + 1];
    d.seta([x(a) + 7, eixo - 9], [x(b) - 7, eixo - 9], {
      semPonta: true,
      curva: curvas[i],
      cor: "azul",
      rotulo: `+${e} s`,
      desloc: 13,
      tamRotulo: 16,
      corRotulo: "azul",
    });
  });
  d.texto(x(15) + 2, eixo - 22, "ok", { tam: 16, cor: "verde", ancora: "middle" });

  // ── cinco clientes sem jitter: todos juntos ──
  d.texto(16, 196, "sem jitter: os 5 clientes batem juntos", { tam: 17, cor: "vermelho" });
  const linhasSem = [222, 238, 254, 270, 286];
  for (const t of [1, 3, 7, 15]) {
    d.marca(x(t) - 11, 210, 22, 88, "vermelho");
    for (const y of linhasSem) d.circulo(x(t), y, 10, "", { tom: "vermelho", hachura: "solid", espessura: 1.2 });
  }

  // ── os mesmos cinco clientes com jitter: espera sorteada entre 0 e o teto ──
  d.texto(16, 326, "com jitter: cada um sorteia a espera", { tam: 17, cor: "verde" });
  const linhasCom = [350, 366, 382, 398, 414];
  // instantes de cada nova tentativa (espera = sorteio entre 0 e 1, 2, 4, 8 s)
  const sorteados = [
    [0.7, 2.3, 5.4, 10.4],
    [0.3, 1.4, 3.4, 10.6],
    [0.9, 1.7, 5.4, 8.0],
    [0.5, 2.4, 3.6, 9.9],
    [0.1, 1.5, 4.3, 8.4],
  ];
  sorteados.forEach((ts, i) => {
    for (const t of ts) d.circulo(x(t), linhasCom[i], 10, "", { tom: "verde", hachura: "solid", espessura: 1.2 });
  });
};
