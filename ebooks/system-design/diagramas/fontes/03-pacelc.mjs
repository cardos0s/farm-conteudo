// Capítulo 3 — PACELC como árvore de decisão: com partição, A ou C; sem partição (Else), L ou C.
export default (d) => {
  d.tela(720, 446).titulo(
    "PACELC como árvore de decisão",
    "A primeira pergunta é se há uma partição de rede. Se sim (P), o sistema escolhe entre disponibilidade, respondendo com o que tem (PA), ou consistência, recusando ou esperando a rede voltar (PC). Se não (E, de else), escolhe entre latência, respondendo na hora sem coordenar as réplicas (EL), ou consistência, coordenando as réplicas antes de responder, o que é mais lento (EC). Na classificação de Daniel Abadi, Dynamo, Cassandra e Riak são PA/EL; VoltDB e Megastore são PC/EC.",
  );

  const raiz = d.elipse(360, 48, 250, 70, "há partição\nde rede?", { tom: "cinza" });

  const p = d.caixa(82, 150, 200, 56, "partição: A ou C?", { tom: "azul" });
  const e = d.caixa(438, 150, 200, 56, "rede ok: L ou C?", { tom: "azul" });

  d.seta([290, 84], p.topo);
  d.seta([430, 84], e.topo);
  d.texto(226, 120, "sim (P)", { ancora: "end", tam: 17 });
  d.texto(494, 120, "não (E, de else)", { tam: 17 });

  // folhas: laranja = responde já (pode estar velho); violeta = garante consistência
  const y = 262;
  const w = 158;
  const pa = d.caixa(16, y, w, 92, "*{PA}\nresponde com\no que tem", { tom: "laranja", tam: 17, destaque: "laranja" });
  const pc = d.caixa(190, y, w, 92, "*{PC}\nrecusa ou\nespera a rede", { tom: "violeta", tam: 17, destaque: "violeta" });
  const el = d.caixa(372, y, w, 92, "*{EL}\nresponde já,\ntalvez velho", { tom: "laranja", tam: 17, destaque: "laranja" });
  const ec = d.caixa(546, y, w, 92, "*{EC}\ncoordena antes,\nmais lento", { tom: "violeta", tam: 17, destaque: "violeta" });

  d.seta(p.emBaixo(0.3), pa.topo);
  d.seta(p.emBaixo(0.7), pc.topo);
  d.seta(e.emBaixo(0.3), el.topo);
  d.seta(e.emBaixo(0.7), ec.topo);
  d.texto(104, 244, "A", { ancora: "end", cor: "laranja", tam: 18 });
  d.texto(259, 244, "C", { cor: "violeta", tam: 18 });
  d.texto(460, 244, "L", { ancora: "end", cor: "laranja", tam: 18 });
  d.texto(615, 244, "C", { cor: "violeta", tam: 18 });

  // exemplos da classificação original de Abadi (configurações padrão)
  d.texto(360, 386, "exemplos na classificação de Abadi:", { ancora: "middle", cor: "cinza", tam: 16 });
  d.etiqueta(190, 412, "PA/EL: Dynamo, Cassandra, Riak", { tom: "laranja", tam: 16, pad: 12 });
  d.etiqueta(530, 412, "PC/EC: VoltDB, Megastore", { tom: "violeta", tam: 16, pad: 12 });
};
