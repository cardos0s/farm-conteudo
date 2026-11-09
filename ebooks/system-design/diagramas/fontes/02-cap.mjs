// Capítulo 2 — Teorema CAP: o que o nó B faz durante uma partição.
export default (d) => {
  d.tela(720, 400).titulo(
    "Teorema CAP durante uma partição de rede",
    "Dois nós replicam um saldo. A rede entre eles cai. O cliente 1 grava saldo = 50 no nó A; o cliente 2 lê do nó B, que ainda tem saldo = 100. Num sistema CP, o nó B recusa ou espera; num sistema AP, responde 100, um valor possivelmente desatualizado.",
  );

  const c1 = d.pessoa(135, 52, 58, { rotulo: "Cliente 1" });
  const c2 = d.pessoa(585, 52, 58, { rotulo: "Cliente 2" });

  const a = d.caixa(40, 140, 190, 76, "Nó A\nsaldo = *{50}", { tom: "azul", destaque: "azul" });
  const b = d.caixa(490, 140, 190, 76, "Nó B\nsaldo = 100", { tom: "azul" });

  d.seta([135, 108], a.topo, { rotulo: "grava 50", desloc: -42 });
  d.seta([585, 108], b.topo, { rotulo: "lê o saldo", desloc: 46 });

  // a rede entre os nós caiu
  d.linha([a.dir, b.esq], { cor: "cinza", tracejado: true });
  d.xis(360, 178, 22);
  d.texto(360, 160, "partição de rede", { ancora: "middle", cor: "vermelho", tam: 17 });

  const cp = d.caixa(40, 292, 290, 92, "recusa ou espera\n“não consigo garantir”", { tom: "violeta" });
  const ap = d.caixa(390, 292, 290, 92, "responde saldo = 100\n(pode estar desatualizado)", { tom: "laranja" });

  d.seta(b.emBaixo(0.25), cp.emCima(0.6), { curva: -18, rotulo: "se for CP", tamRotulo: 17 });
  d.seta(b.emBaixo(0.6), ap.emCima(0.62), { rotulo: "se for AP", tamRotulo: 17, desloc: -48 });
};
