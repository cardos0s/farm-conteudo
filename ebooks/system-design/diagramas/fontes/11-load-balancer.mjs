// Capítulo 11 — Balanceamento de carga: o LB reparte o tráfego e tira da rotação quem falha no health check.
export default (d) => {
  d.tela(720, 384).titulo(
    "Load balancer com health check",
    "Três clientes mandam requisições para um único load balancer. Ele reparte o tráfego entre o servidor A e o servidor B, metade para cada um. O servidor C não respondeu ao health check (GET /health), foi tirado da rotação e não recebe tráfego; o balanceador continua apenas checando a saúde dele.",
  );

  // clientes
  d.texto(48, 58, "clientes", { cor: "cinza", tam: 17 });
  const pessoas = [200, 360, 520].map((cx) => d.pessoa(cx, 52, 54));

  // o balanceador
  const lb = d.caixa(240, 130, 240, 66, "load balancer\n(checa /health)", { tom: "azul" });
  pessoas.forEach((p, i) => d.seta([p.cx, p.base[1] + 6], lb.emCima(0.2 + i * 0.3)));

  // servidores
  const a = d.caixa(40, 292, 170, 70, "servidor A\nsaudável", { tom: "verde" });
  const b = d.caixa(275, 292, 170, 70, "servidor B\nsaudável", { tom: "verde" });
  const c = d.caixa(510, 292, 170, 70, "servidor C\nfora da rotação", { tom: "vermelho" });
  d.xis(c.x + c.w - 6, c.y + 2, 22);

  d.seta(lb.emBaixo(0.2), a.topo, { rotulo: "50%", desloc: -22 });
  d.seta(lb.emBaixo(0.5), b.topo, { rotulo: "50%", desloc: -24 });
  d.seta(lb.emBaixo(0.8), c.topo, { tracejado: true, cor: "cinza", rotulo: "GET /health\nsem resposta", corRotulo: "vermelho", desloc: 52, posRotulo: 0.6 });
};
