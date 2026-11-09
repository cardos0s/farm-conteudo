// Capítulo 41 — Cache: as camadas entre o usuário e o banco; cada miss desce uma camada.
export default (d) => {
  d.tela(720, 440).titulo(
    "Camadas de cache entre o usuário e o banco",
    "Uma leitura atravessa cinco camadas, de cima para baixo: o cache do navegador, no próprio aparelho; a CDN, com servidores de borda perto do usuário; o cache em processo, na memória da aplicação; o cache distribuído, como Redis ou Memcached, compartilhado pelos servidores; e o banco de dados, a fonte da verdade. A requisição só desce para a camada seguinte quando dá miss. Quanto mais perto do usuário, mais rápida a camada; quanto mais perto do dado, mais fácil de invalidar.",
  );

  d.pessoa(80, 56, 56, { rotulo: "usuário" });

  const x = 196;
  const w = 200;
  const camadas = [
    ["navegador", "no aparelho: nem usa a rede"],
    ["CDN", "servidor de borda perto do usuário"],
    ["cache em processo", "memória da própria aplicação"],
    ["Redis / Memcached", "compartilhado pelos servidores"],
  ].map(([nome, onde], i) => {
    const c = d.caixa(x, 26 + i * 80, w, 48, nome, { tom: "amarelo" });
    d.texto(x + w + 20, c.cy + 6, onde, { tam: 16, cor: "cinza" });
    return c;
  });
  const banco = d.cilindro(x, 344, w, 76, "banco de dados", { tom: "azul" });
  d.texto(x + w + 20, banco.cy + 12, "a fonte da verdade", { tam: 16, cor: "cinza" });

  d.seta([112, 48], camadas[0].esq);
  [...camadas, banco].forEach((c, i, todas) => {
    if (i < todas.length - 1) d.seta(c.base, todas[i + 1].topo, { rotulo: "miss", desloc: 26, tamRotulo: 16, corRotulo: "vermelho" });
  });

  // a régua: rapidez de um lado, facilidade de invalidar do outro
  d.texto(97, 150, "perto do usuário:\nmais rápido", { ancora: "middle", tam: 16, cor: "violeta" });
  d.seta([97, 182], [97, 322], { duasPontas: true, cor: "violeta" });
  d.texto(97, 346, "perto do dado:\nfácil de invalidar", { ancora: "middle", tam: 16, cor: "violeta" });
};
