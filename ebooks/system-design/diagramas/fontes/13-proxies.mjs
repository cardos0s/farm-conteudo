// Capítulo 13 — Proxy direto (lado dos clientes) vs. proxy reverso (lado dos servidores).
export default (d) => {
  d.tela(720, 350).titulo(
    "Proxy direto e proxy reverso",
    "À esquerda, a rede de uma empresa: os computadores dos funcionários só saem para a internet pelo proxy direto, que fala em nome deles; o site de destino vê o IP do proxy. No meio, a internet. À direita, o datacenter de um site: o proxy reverso recebe todas as requisições e as repassa aos servidores de aplicação app 1 e app 2; o cliente só enxerga o proxy.",
  );

  // lado dos clientes
  d.grupo(16, 16, 240, 318, "rede da empresa");
  const p1 = d.pessoa(58, 108, 54);
  const p2 = d.pessoa(58, 214, 54);
  const direto = d.caixa(116, 126, 126, 72, "proxy\ndireto", { tom: "violeta" });
  d.seta([p1.x + p1.w + 6, 104], direto.naEsq(0.3));
  d.seta([p2.x + p2.w + 6, 218], direto.naEsq(0.7));
  d.textoCentro(136, 290, "fala pelos clientes:\no site vê o IP do proxy", { tam: 16, cor: "violeta" });

  // a internet no meio
  const net = d.nuvem(360, 166, 150, 100, "Internet", { tom: "cinza" });

  // lado dos servidores
  d.grupo(464, 16, 240, 318, "datacenter do site");
  const reverso = d.caixa(478, 126, 126, 72, "proxy\nreverso", { tom: "violeta" });
  const app1 = d.caixa(626, 72, 66, 56, "app 1", { tom: "azul" });
  const app2 = d.caixa(626, 196, 66, 56, "app 2", { tom: "azul" });
  d.textoCentro(584, 290, "fala pelos servidores:\no cliente só vê o proxy", { tam: 16, cor: "violeta" });

  d.seta(direto.dir, [net.x + 10, 162]);
  d.seta([net.x + net.w - 8, 162], reverso.esq);
  d.seta(reverso.naDir(0.3), app1.naEsq(0.6));
  d.seta(reverso.naDir(0.7), app2.naEsq(0.4));
};
