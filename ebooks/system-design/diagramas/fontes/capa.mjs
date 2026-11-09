// Capa: o rascunho clássico de uma entrevista de system design, com anotações a pincel.
export default (d) => {
  d.tela(680, 470).titulo(
    "Rascunho de arquitetura numa lousa",
    "Um usuário passa por DNS e CDN até um load balancer, que distribui para três servidores de aplicação. Eles usam um cache, um banco de dados e uma fila. Anotações à mão perguntam sobre health check, TTL, sharding e réplicas, e estimam um milhão de requisições por dia como cerca de 12 por segundo.",
  );

  const voce = d.pessoa(62, 92, 64, { rotulo: "você" });
  const borda = d.nuvem(222, 88, 176, 104, "DNS + CDN", { tom: "azul" });
  const lb = d.caixa(400, 52, 200, 66, "load balancer", { tom: "violeta" });

  d.seta([96, 92], borda.esq, { espessura: 1.8 });
  d.seta(borda.dir, lb.esq, { espessura: 1.8 });

  const apps = [395, 500, 605].map((cx) => d.caixa(cx - 45, 182, 90, 56, "app", { tom: "cinza", hachura: "solid" }));
  apps.forEach((a, i) => d.seta(lb.emBaixo([0.2, 0.5, 0.8][i]), a.topo, { espessura: 1.6 }));

  const cache = d.caixa(300, 318, 120, 60, "cache", { tom: "laranja" });
  const banco = d.cilindro(450, 300, 120, 100, "banco", { tom: "verde" });
  const fila = d.caixa(588, 318, 78, 60, "fila", { tom: "amarelo" });
  d.seta(apps[0].base, cache.emCima(0.6), { espessura: 1.6 });
  d.seta(apps[1].base, banco.topo, { espessura: 1.6 });
  d.seta(apps[2].base, fila.emCima(0.55), { espessura: 1.6 });

  // anotações de quem está pensando em voz alta
  d.texto(608, 40, "health check?", { cor: "violeta", tam: 16, ancora: "end", girar: -3 });
  d.texto(292, 425, "TTL? cache-aside?", { cor: "laranja", tam: 16, girar: -2 });
  d.texto(450, 438, "sharding? réplicas?", { cor: "verde", tam: 16, girar: -2 });
  d.texto(620, 412, "DLQ", { cor: "vermelho", tam: 16, ancora: "middle", girar: -4 });

  // a conta de padaria no canto da lousa
  d.caixa(26, 268, 210, 112, "", { cor: "cinza", tracejado: true, preench: "none", raio: 10, espessura: 1.4 });
  d.texto(42, 300, "1 mi req/dia", { tam: 19 });
  d.texto(42, 330, "÷ 86.400 s", { tam: 19, cor: "cinza" });
  d.texto(42, 362, "≈ *{12 req/s}", { tam: 19, destaque: "vermelho" });
};
