// Capítulo 36 — Idempotência: o retry com a mesma chave recebe a resposta guardada.
export default (d) => {
  d.tela(720, 440).titulo(
    "Retry seguro com chave de idempotência",
    "O app pede para pagar R$ 100 com a chave K. A API vê que K é nova, grava a chave e cobra. A resposta 201 se perde no caminho e o app estoura o timeout. O app repete a requisição com a mesma chave K. A API encontra K já gravada e devolve a resposta guardada, sem cobrar de novo.",
  );

  const xa = 120;
  const xs = 380;
  const xd = 630;
  d.caixa(60, 18, 120, 48, "App", { tom: "azul", tam: 17 });
  d.caixa(280, 18, 200, 48, "API de pagamentos", { tom: "azul", tam: 17 });
  d.cilindro(565, 10, 130, 62, "chaves", { tom: "amarelo", tam: 17 });
  for (const x of [xa, xs]) d.linha([[x, 66], [x, 404]], { cor: "cinza", tracejado: true, espessura: 1.4 });
  d.linha([[xd, 72], [xd, 404]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // 1ª tentativa
  d.seta([xa, 100], [xs, 116], { rotulo: "pagar R$ 100, chave K", desloc: 18 });
  d.seta([xs, 132], [xd, 146], { rotulo: "K é nova: grava", desloc: 18 });
  d.caixa(320, 162, 120, 38, "cobra R$ 100", { tom: "verde", tam: 16 });

  // a resposta se perde
  d.seta([xs, 222], [216, 232], { rotulo: "201 Created", desloc: -18, cor: "vermelho", tracejado: true });
  d.xis(203, 233, 16);
  d.textoCentro(205, 260, "a resposta se perde", { tam: 16, cor: "vermelho" });
  d.textoCentro(62, 262, "timeout", { tam: 16, cor: "cinza" });

  // retry com a mesma chave
  d.seta([xa, 302], [xs, 318], { rotulo: "retry com a mesma chave K", desloc: 18 });
  d.seta([xs, 334], [xd, 348], { rotulo: "K já existe", desloc: 18 });
  d.seta([xs, 364], [xa, 380], { rotulo: "201 guardado,\nsem cobrar de novo", desloc: 26, cor: "verde", corRotulo: "verde" });
};
