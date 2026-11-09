// Capítulo 33 — Circuit breaker: a máquina de três estados.
export default (d) => {
  d.tela(720, 420).titulo(
    "Os três estados de um circuit breaker",
    "O breaker começa fechado: as chamadas passam e as falhas são contadas. Se a taxa de falhas passa do limite, ele abre e passa a falhar na hora, sem chamar o serviço. Depois do tempo de espera, vai para meio-aberto e deixa passar poucas chamadas de teste. Se os testes dão certo, volta a fechado; se falham, volta a aberto.",
  );

  const fechado = d.caixa(30, 74, 220, 96, "Fechado\nchamadas passam;\nconta as falhas", { tom: "verde", tam: 17 });
  const aberto = d.caixa(470, 74, 220, 96, "Aberto\nfalha na hora,\nsem chamar o serviço", { tom: "vermelho", tam: 17 });
  const meio = d.caixa(250, 300, 220, 96, "Meio-aberto\ndeixa passar poucas\nchamadas de teste", { tom: "amarelo", tam: 17 });

  // começa fechado
  d.seta([96, 20], fechado.emCima(0.3), { rotulo: "início", desloc: -30, tamRotulo: 16 });

  // fechado -> aberto
  d.seta(fechado.naDir(0.35), aberto.naEsq(0.35), { rotulo: "taxa de falhas\npassou do limite", desloc: 30, tamRotulo: 16 });

  // aberto -> meio-aberto
  d.seta(aberto.emBaixo(0.22), meio.emCima(0.86), { rotulo: "passou o tempo\nde espera", desloc: -76, tamRotulo: 16 });

  // meio-aberto -> aberto (os testes falharam)
  d.seta(meio.naDir(0.4), aberto.emBaixo(0.78), { curva: -40, rotulo: "teste falhou", desloc: -66, tamRotulo: 16 });

  // meio-aberto -> fechado (os testes deram certo)
  d.seta(meio.emCima(0.14), fechado.emBaixo(0.6), { rotulo: "chamadas de\nteste ok", desloc: 66, tamRotulo: 16 });
};
