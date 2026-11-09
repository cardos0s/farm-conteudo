// Capítulo 38 — Eleição de líder no Raft: os três estados de um nó e as transições.
export default (d) => {
  d.tela(720, 460).titulo(
    "Estados de um nó no Raft",
    "Todo nó começa como seguidor. Se o tempo de eleição acaba sem notícia do líder, ele vira candidato, vota em si e pede votos. Com votos da maioria, por exemplo 3 de 5, vira líder e passa a mandar heartbeats. Em caso de empate, o candidato espera um novo timeout e tenta outra eleição. O candidato volta a seguidor se descobre o líder atual ou um termo maior, e o líder volta a seguidor se descobre um termo maior.",
  );

  const seguidor = d.caixa(30, 270, 200, 88, "Seguidor\nobedece ao líder", { tom: "azul", tam: 17 });
  const candidato = d.caixa(260, 122, 200, 88, "Candidato\nvota em si e\npede votos", { tom: "amarelo", tam: 17 });
  const lider = d.caixa(490, 270, 200, 88, "Líder\nmanda heartbeats\ne ordena as escritas", { tom: "verde", tam: 17 });

  d.texto(704, 36, "termo = nº do mandato;\n1 voto por nó por termo", { tam: 16, cor: "cinza", ancora: "end" });

  // início
  d.seta([66, 200], seguidor.emCima(0.18), { rotulo: "início", desloc: 30, tamRotulo: 16 });

  // seguidor -> candidato
  d.seta(seguidor.emCima(0.72), candidato.naEsq(0.62), { rotulo: "timeout de eleição\nsem ouvir o líder", desloc: 78, tamRotulo: 16 });

  // candidato -> candidato (empate)
  d.curva([
    [318, 122],
    [306, 92],
    [334, 66],
    [386, 66],
    [414, 92],
    [404, 116],
  ]);
  d.seta([410, 102], [403, 121], { ponta: 11 });
  d.texto(360, 52, "empate: nova eleição", { tam: 16, ancora: "middle" });

  // candidato -> líder
  d.seta(candidato.naDir(0.62), lider.emCima(0.28), { rotulo: "recebe votos da\nmaioria (3 de 5)", desloc: 76, tamRotulo: 16 });

  // candidato -> seguidor
  d.seta(candidato.emBaixo(0.2), seguidor.naDir(0.3), { rotulo: "descobre o líder\nou um termo maior", desloc: 70, tamRotulo: 16 });

  // líder -> seguidor
  d.seta(lider.emBaixo(0.5), seguidor.emBaixo(0.5), { curva: 52, rotulo: "descobre um termo maior", desloc: -34, tamRotulo: 16 });
};
