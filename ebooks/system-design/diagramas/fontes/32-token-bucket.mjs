// Capítulo 32 — Rate limiting: o algoritmo token bucket (balde de fichas).
export default (d) => {
  d.tela(720, 420).titulo(
    "Rate limiting com token bucket",
    "Um balde guarda no máximo 10 fichas e recebe 5 fichas novas por segundo; quando está cheio, a ficha nova se perde. Cada requisição do cliente gasta uma ficha e segue para a API. Se o balde está vazio, a requisição é recusada com 429 Too Many Requests.",
  );

  // reposição a taxa constante
  const repoe = d.caixa(245, 18, 190, 52, "repõe 5 fichas/s", { tom: "amarelo", tam: 17 });
  d.seta(repoe.base, [340, 128], { rotulo: "taxa constante", desloc: -70, tamRotulo: 16 });
  d.texto(452, 50, "balde cheio?\na ficha nova se perde", { tam: 16, cor: "cinza" });

  // o balde (aberto em cima) com as fichas
  d.linha(
    [
      [240, 140],
      [262, 318],
      [418, 318],
      [440, 140],
    ],
    { cor: "azul", espessura: 2.6 },
  );
  const fichas = [
    [290, 296],
    [325, 296],
    [360, 296],
    [395, 296],
    [307, 264],
    [342, 264],
    [377, 264],
  ];
  for (const [x, y] of fichas) d.circulo(x, y, 28, "", { tom: "amarelo", hachura: "solid" });
  d.textoCentro(340, 200, "7 fichas\nagora", { tam: 16, cor: "cinza" });
  d.textoCentro(340, 352, "capacidade: 10 fichas", { tam: 17 });
  d.textoCentro(340, 378, "(a maior rajada aceita)", { tam: 16, cor: "cinza" });

  // o cliente manda requisições
  d.pessoa(70, 214, 58, { rotulo: "Cliente" });
  d.seta([108, 228], [246, 228], { rotulo: "requisição", desloc: 16 });

  // saídas
  const api = d.caixa(514, 104, 190, 78, "tem ficha: gasta 1\ne segue para a API", { tom: "verde", tam: 17 });
  const recusa = d.caixa(514, 252, 190, 92, "sem ficha:\n429 Too Many\nRequests", { tom: "vermelho", tam: 17 });
  d.seta([442, 182], api.esq);
  d.seta([432, 268], recusa.esq);
};
