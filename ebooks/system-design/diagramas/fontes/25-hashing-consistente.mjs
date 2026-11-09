// Capítulo 25 — Hashing consistente: o nó D entra no anel e só as chaves do trecho entre A e D mudam de dono.
export default (d) => {
  d.tela(720, 448).titulo(
    "Anel de hashing consistente com a entrada de um nó",
    "Um anel com os nós A, B e C e seis chaves, k1 a k6. Cada chave pertence ao primeiro nó encontrado andando no sentido horário. O nó D entra entre A e B. Só as chaves do trecho entre A e D, k2 e k3, passam de B para D. As chaves k1, k4, k5 e k6 continuam com o mesmo dono.",
  );

  const cx = 200;
  const cy = 236;
  const r = 150;
  const rad = (g) => (g * Math.PI) / 180;
  // ângulo em graus no sentido horário, a partir do topo do anel
  const pos = (g, rr = r) => [cx + rr * Math.sin(rad(g)), cy - rr * Math.cos(rad(g))];

  d.circulo(cx, cy, 2 * r, "", { cor: "cinza", preench: "none", espessura: 2 });

  // trecho que muda de dono: de A (20°) até D (95°)
  const [x1, y1] = pos(20);
  const [x2, y2] = pos(95);
  d.caminho(`M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`, { cor: "violeta", espessura: 6, preench: "none" });

  // sentido horário, no miolo do anel
  d.seta([cx - 46, cy - 6], [cx + 46, cy - 6], { curva: 30, cor: "cinza" });
  d.texto(cx, cy + 26, "sentido\nhorário", { ancora: "middle", cor: "cinza", tam: 16 });

  // chaves (pontos laranja), com o nome do lado de dentro do anel
  const chaves = [
    ["k1", 340],
    ["k2", 50],
    ["k3", 78],
    ["k4", 128],
    ["k5", 205],
    ["k6", 292],
  ];
  for (const [nome, g] of chaves) {
    const [x, y] = pos(g);
    const muda = nome === "k2" || nome === "k3";
    d.circulo(x, y, 14, "", { tom: muda ? "violeta" : "laranja", hachura: "solid" });
    const [tx, ty] = pos(g, r - 30);
    d.textoCentro(tx, ty, nome, { tam: 17, cor: muda ? "violeta" : "tinta" });
  }

  // nós
  for (const [nome, g, tom] of [["A", 20, "azul"], ["B", 150, "azul"], ["C", 262, "azul"], ["D", 95, "violeta"]]) {
    const [x, y] = pos(g);
    d.circulo(x, y, 44, nome, { tom, hachura: "solid", tam: 20 });
  }
  const [nx, ny] = pos(95, r + 44);
  d.textoCentro(nx + 4, ny, "novo", { tam: 17, cor: "violeta" });

  // tabela: dono de cada chave antes e depois
  const col = [470, 568, 660];
  d.texto(col[0], 72, "chave", { ancora: "middle", cor: "cinza", tam: 17 });
  d.texto(col[1], 72, "antes", { ancora: "middle", cor: "cinza", tam: 17 });
  d.texto(col[2], 72, "depois", { ancora: "middle", cor: "cinza", tam: 17 });
  d.linha([[430, 84], [700, 84]], { cor: "cinza", espessura: 1.2 });
  const donos = [
    ["k1", "A", "A"],
    ["k2", "B", "D"],
    ["k3", "B", "D"],
    ["k4", "B", "B"],
    ["k5", "C", "C"],
    ["k6", "A", "A"],
  ];
  donos.forEach(([k, antes, depois], i) => {
    const y = 114 + i * 34;
    const muda = antes !== depois;
    if (muda) d.marca(432, y - 22, 266, 30, "violeta");
    d.texto(col[0], y, k, { ancora: "middle" });
    d.texto(col[1], y, antes, { ancora: "middle" });
    d.texto(col[2], y, depois, { ancora: "middle", cor: muda ? "violeta" : "tinta" });
  });
  d.texto(565, 350, "só 2 de 6 chaves mudam:\nas do trecho entre A e D", { ancora: "middle", cor: "violeta", tam: 17 });
  d.texto(cx, 424, "posição no anel = hash(nome)", { ancora: "middle", cor: "cinza", tam: 16 });
};
