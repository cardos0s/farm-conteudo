// Capítulo 47 — Tracing distribuído: a cascata de spans de um trace, desenhada em escala.
export default (d) => {
  d.tela(720, 408).titulo(
    "Cascata de spans de um trace de checkout",
    "Um trace de 1200 ms visto como cascata, no estilo do Jaeger ou do Tempo. Cada linha é um span, desenhado em escala sobre um eixo de 0 a 1200 ms. O gateway (POST /checkout) vai de 0 a 1200 ms. Dentro dele, o serviço de pedidos (criar pedido) vai de 40 a 1180 ms. Pedidos chama o estoque (reservar), de 60 a 130 ms, e depois pagamentos (cobrar cartão), de 140 a 1120 ms. Pagamentos consulta o banco (SELECT em cobranças) de 160 a 1060 ms. Esse span do banco, com 900 ms, está destacado em vermelho como o gargalo: sozinho, ocupa 75% do tempo total.",
  );

  const X0 = 230; // onde fica o instante 0 ms
  const ESC = 0.375; // px por ms: 1200 ms = 450 px
  const x = (ms) => X0 + ms * ESC;
  const Y0 = 86; // topo da primeira barra
  const PASSO = 50;
  const ALT = 30;

  // cabeçalho do trace e eixo do tempo
  d.texto(24, 32, "trace 4bf92f35…  ·  POST /checkout  ·  1200 ms", { tam: 17, cor: "cinza" });
  d.texto(24, 66, "serviço", { tam: 16, cor: "cinza" });
  for (const ms of [0, 300, 600, 900, 1200]) {
    d.texto(x(ms), 66, ms === 0 ? "0 ms" : String(ms), { tam: 16, cor: "cinza", ancora: "middle" });
  }
  for (const ms of [0, 300, 600, 900, 1200]) {
    d.linha([[x(ms), 74], [x(ms), 336]], { cor: "cinza", tracejado: "3 6", espessura: 1 });
  }

  const spans = [
    { svc: "gateway", op: "POST /checkout", ini: 0, fim: 1200, nivel: 0 },
    { svc: "pedidos", op: "criar pedido", ini: 40, fim: 1180, nivel: 1 },
    { svc: "estoque", op: "reservar", ini: 60, fim: 130, nivel: 2 },
    { svc: "pagamentos", op: "cobrar cartão", ini: 140, fim: 1120, nivel: 2 },
    { svc: "banco", op: "SELECT cobranças", ini: 160, fim: 1060, nivel: 3, gargalo: true },
  ];

  spans.forEach((s, i) => {
    const y = Y0 + i * PASSO;
    const dur = s.fim - s.ini;
    const tom = s.gargalo ? "vermelho" : "azul";
    d.texto(24 + s.nivel * 18, y + ALT / 2 + 6, s.svc, { tam: 17, cor: s.gargalo ? "vermelho" : "tinta" });
    const larg = x(s.fim) - x(s.ini);
    const rotulo = `${s.op} · ${dur} ms`;
    if (larg > 160) {
      d.caixa(x(s.ini), y, larg, ALT, rotulo, { tom, hachura: "solid", tam: 16, raio: 6 });
    } else {
      d.caixa(x(s.ini), y, larg, ALT, "", { tom, hachura: "solid", raio: 6 });
      d.texto(x(s.fim) + 10, y + ALT / 2 + 6, rotulo, { tam: 16 });
    }
  });

  // o gargalo
  const yb = Y0 + 4 * PASSO + ALT;
  d.seta([x(760), 368], [x(760), yb + 6], { cor: "vermelho" });
  d.texto(x(610), 390, "gargalo: 900 de 1200 ms (75%) numa só consulta", { tam: 17, cor: "vermelho", ancora: "middle" });
};
