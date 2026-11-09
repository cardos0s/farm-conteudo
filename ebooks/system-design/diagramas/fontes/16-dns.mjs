// Capítulo 16 — DNS: resolução de www.loja.com.br e o cache que encurta as próximas consultas.
export default (d) => {
  d.tela(720, 420).titulo(
    "Resolução DNS de um domínio .com.br",
    "O navegador pergunta o IP de www.loja.com.br ao resolvedor recursivo (passo 1). Sem nada em cache, o resolvedor pergunta ao servidor raiz, que manda procurar os servidores do .br (passo 2); pergunta ao servidor do TLD .br, que indica os servidores de nomes da loja (passo 3); e pergunta ao servidor autoritativo de loja.com.br, que responde 203.0.113.10 (passo 4). O resolvedor guarda a resposta em cache por 300 segundos, o TTL: nas consultas seguintes dentro desse prazo, só o passo 1 acontece.",
  );

  const nav = d.caixa(16, 176, 180, 68, "navegador e SO\nwww.loja.com.br?", { tom: "cinza", tam: 17 });
  const res = d.caixa(262, 176, 180, 68, "resolvedor\nrecursivo", { tom: "azul" });
  const cache = d.caixa(262, 318, 180, 86, "cache\n203.0.113.10\nvale 300 s", { tom: "amarelo", tam: 17 });

  const raiz = d.caixa(516, 24, 188, 68, "servidor raiz\n“vá ao .br”", { tom: "azul", tam: 17 });
  const tld = d.caixa(516, 176, 188, 68, "TLD .br\n“vá ao ns da loja”", { tom: "azul", tam: 17 });
  const aut = d.caixa(516, 328, 188, 68, "autoritativo\n“203.0.113.10”", { tom: "verde", tam: 17 });

  d.seta(nav.dir, res.esq, { duasPontas: true, rotulo: "1", desloc: 16 });
  d.seta(res.naDir(0.15), raiz.naEsq(0.6), { duasPontas: true, rotulo: "2", desloc: 16 });
  d.seta(res.dir, tld.esq, { duasPontas: true, rotulo: "3", desloc: 16 });
  d.seta(res.naDir(0.85), aut.naEsq(0.4), { duasPontas: true, rotulo: "4", desloc: -16 });
  d.seta(res.base, cache.topo, { duasPontas: true, cor: "laranja" });

  d.textoCentro(106, 352, "1ª vez: passos 1 a 4\nnos 300 s seguintes:\nsó o passo 1", { tam: 16, cor: "laranja" });
};
