// Capítulo 12 — Algoritmos de balanceamento: para onde vai a próxima requisição em cada um.
export default (d) => {
  d.tela(720, 330).titulo(
    "Round robin, least connections e IP hash",
    "Três cenas lado a lado, cada uma com os servidores A, B e C. Round robin: as requisições 1, 2 e 3 foram para A, B e C, então a requisição 4 volta para A. Least connections: A tem 12 conexões ativas, B tem 3 e C tem 8, então a nova conexão vai para B. IP hash: os servidores têm índices 0, 1 e 2; o hash do IP 177.10.2.3 módulo 3 dá 2, então esse cliente cai sempre no servidor C.",
  );

  const cenas = [
    { titulo: "Round robin", regra: "ordem fixa, em ciclo", pedido: "req 4", embaixo: ["req 1", "req 2", "req 3"], historico: true, alvo: 0, nota: "ignora a carga atual" },
    { titulo: "Least connections", regra: "menos conexões ativas", pedido: "nova conexão", embaixo: ["12", "3", "8"], alvo: 1, nota: "conexões ativas agora" },
    { titulo: "IP hash", regra: "hash(IP) mod 3 = 2", pedido: "IP 177.10.2.3", embaixo: ["0", "1", "2"], alvo: 2, nota: "mesmo IP, mesmo servidor" },
  ];

  cenas.forEach((c, i) => {
    const x = 16 + i * 234;
    const cx = x + 110;
    d.grupo(x, 14, 220, 302);
    d.texto(cx, 50, c.titulo, { ancora: "middle", tam: 20 });
    d.texto(cx, 76, c.regra, { ancora: "middle", tam: 16, cor: "cinza" });

    const pedido = d.etiqueta(cx, 122, c.pedido, { tom: "violeta", tam: 17 });
    const servidores = ["A", "B", "C"].map((nome, k) =>
      d.caixa(cx - 98 + k * 70, 196, 56, 50, nome, k === c.alvo ? { tom: "verde", hachura: "solid" } : { tom: "cinza" }),
    );
    servidores.forEach((s, k) => {
      if (c.embaixo[k]) d.texto(s.cx, 272, c.embaixo[k], { ancora: "middle", tam: 16, cor: c.historico ? "cinza" : k === c.alvo ? "verde" : "tinta" });
    });
    d.seta([cx, pedido.y + pedido.h + 4], servidores[c.alvo].topo, { cor: "verde", espessura: 2.2 });
    d.texto(cx, 300, c.nota, { ancora: "middle", tam: 16, cor: "cinza" });
  });
};
