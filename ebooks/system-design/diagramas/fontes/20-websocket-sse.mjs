// Capítulo 20 — WebSocket (canal nos dois sentidos depois do upgrade) vs. SSE (servidor → cliente sobre HTTP).
export default (d) => {
  d.tela(720, 420).titulo(
    "WebSocket vs. Server-Sent Events",
    "Dois diagramas de sequência, com o tempo correndo para baixo. À esquerda, o WebSocket: o cliente envia um GET com o cabeçalho Upgrade: websocket, o servidor responde 101 Switching Protocols e, a partir daí, o canal fica aberto nos dois sentidos: o cliente e o servidor enviam mensagens quando quiserem. À direita, o SSE: o cliente faz um GET /eventos, o servidor responde 200 com Content-Type text/event-stream e não fecha a resposta; vai enviando eventos (data: 1 x 0, data: 2 x 0, data: 2 x 1) só do servidor para o cliente. Para mandar algo ao servidor, o cliente faz outra requisição HTTP comum, um POST.",
  );

  const vida = (x) => d.linha([[x, 84], [x, 388]], { cor: "cinza", tracejado: true, espessura: 1.4 });
  const sequencia = (cli, srv) => ({
    dir: (y, rotulo, o = {}) => d.seta([cli, y], [srv, y + 8], { rotulo, desloc: 18, tamRotulo: 16, ...o }),
    esq: (y, rotulo, o = {}) => d.seta([srv, y], [cli, y + 8], { rotulo, desloc: -18, tamRotulo: 16, ...o }),
  });

  // ── WebSocket ────────────────────────────────────────
  d.grupo(16, 16, 340, 388, "WebSocket: dois sentidos", { tam: 18, corTexto: "tinta" });
  const c1 = 70;
  const s1 = 300;
  d.etiqueta(c1, 66, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(s1, 66, "servidor", { tom: "azul", tam: 16 });
  vida(c1);
  vida(s1);
  const ws = sequencia(c1, s1);
  ws.dir(108, "GET + Upgrade");
  ws.esq(144, "101 Switching Protocols");
  d.textoCentro((c1 + s1) / 2, 177, "canal aberto\nnos dois sentidos", { tam: 16, cor: "violeta" });
  ws.dir(232, "msg do cliente", { cor: "azul" });
  ws.esq(268, "msg do servidor", { cor: "violeta" });
  ws.esq(304, "msg do servidor", { cor: "violeta" });
  ws.dir(340, "msg do cliente", { cor: "azul" });

  // ── SSE ──────────────────────────────────────────────
  d.grupo(364, 16, 340, 388, "SSE: um sentido só", { tam: 18, corTexto: "tinta" });
  const c2 = 418;
  const s2 = 648;
  d.etiqueta(c2, 66, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(s2, 66, "servidor", { tom: "azul", tam: 16 });
  vida(c2);
  vida(s2);
  // a resposta que não termina: uma barra sobre a linha do servidor
  d.caixa(s2 - 5, 150, 10, 172, "", { tom: "laranja", hachura: "solid", raio: 3, espessura: 1.4 });
  const sse = sequencia(c2, s2);
  sse.dir(108, "GET /eventos");
  sse.esq(144, "200 text/event-stream");
  d.textoCentro((c2 + s2) / 2, 177, "a resposta HTTP\nfica aberta", { tam: 16, cor: "laranja" });
  sse.esq(232, "data: 1 x 0", { cor: "violeta" });
  sse.esq(268, "data: 2 x 0", { cor: "violeta" });
  sse.esq(304, "data: 2 x 1", { cor: "violeta" });
  sse.dir(354, "POST: outra requisição", { cor: "cinza", tracejado: true });
};
