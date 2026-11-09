// Capítulo 15 — CDN: cada usuário vai ao nó de borda mais próximo; hit responde ali, miss busca na origem.
export default (d) => {
  d.tela(720, 410).titulo(
    "CDN: nós de borda e servidor de origem",
    "Um servidor de origem na Virgínia, nos EUA, e três nós de borda da CDN, em São Paulo, Lisboa e Tóquio. Cada usuário é atendido pelo nó da sua cidade. O nó de São Paulo já tem a cópia do arquivo e responde direto do cache (hit). O nó de Tóquio não tem (miss): busca o arquivo na origem, guarda uma cópia e responde.",
  );

  const origem = d.caixa(250, 24, 220, 72, "servidor de origem\n(Virgínia, EUA)", { tom: "azul" });

  const cidades = ["São Paulo", "Lisboa", "Tóquio"];
  const nos = cidades.map((c, i) => d.caixa(30 + i * 250, 200, 160, 64, `nó de borda\n${c}`, { tom: "laranja" }));
  nos.forEach((n, i) => {
    const p = d.pessoa(n.cx, 345, 50, { rotulo: `em ${cidades[i]}` });
    d.seta([n.cx, p.y - 10], n.base);
  });

  // São Paulo: hit
  const sp = nos[0];
  d.texto(sp.cx - 12, 184, "HIT: já tem a cópia", { ancora: "middle", tam: 16, cor: "verde" });
  d.certo(sp.cx + 82, 178, 18);

  // Tóquio: miss, busca na origem
  const tq = nos[2];
  d.linha([tq.topo, [tq.cx, origem.cy]], { cor: "laranja", tracejado: true });
  d.seta([tq.cx, origem.cy], origem.dir, { cor: "laranja", tracejado: true });
  d.textoCentro(tq.cx - 92, 138, "MISS: busca na origem\ne guarda uma cópia", { tam: 16, cor: "laranja" });
};
