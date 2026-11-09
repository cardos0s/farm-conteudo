// Capítulo 14 — API gateway: porta única entre os clientes e os serviços internos.
export default (d) => {
  d.tela(720, 400).titulo(
    "API gateway na frente dos microsserviços",
    "O app mobile e o site mandam todas as chamadas para um único API gateway. Dentro dele, cada requisição passa por autenticação, rate limit, roteamento e registro de logs e métricas. Depois o gateway a encaminha pelo caminho da URL: /pedidos para o serviço de pedidos, /catalogo para o de catálogo e /pagamentos para o de pagamentos. Token inválido volta com erro 401 e excesso de requisições volta com 429, sem chegar aos serviços.",
  );

  // clientes
  const mobile = d.caixa(16, 100, 120, 60, "app mobile", { tom: "cinza" });
  const web = d.caixa(16, 236, 120, 60, "site (web)", { tom: "cinza" });

  // o gateway e suas funções
  const gw = d.caixa(196, 20, 210, 360, "", { cor: "violeta", preench: "none", espessura: 2.2 });
  d.texto(gw.cx, 56, "API gateway", { ancora: "middle", tam: 20, cor: "violeta" });
  ["autenticação", "rate limit", "roteamento", "logs e métricas"].forEach((f, i) =>
    d.caixa(221, 76 + i * 56, 160, 42, f, { tom: "violeta", tam: 17 }),
  );
  d.textoCentro(gw.cx, 336, "token inválido: 401\nacima do limite: 429", { tam: 15, cor: "vermelho" });

  d.seta(mobile.dir, [gw.x, mobile.cy]);
  d.seta(web.dir, [gw.x, web.cy]);

  // serviços internos
  d.grupo(486, 20, 218, 360, "serviços internos");
  ["pedidos", "catálogo", "pagamentos"].forEach((nome, i) => {
    const s = d.caixa(526, 70 + i * 102, 164, 56, nome, { tom: "azul" });
    d.seta([gw.x + gw.w, s.cy], s.esq, { rotulo: ["/pedidos", "/catalogo", "/pagamentos"][i], tamRotulo: 15, desloc: 15 });
  });
};
