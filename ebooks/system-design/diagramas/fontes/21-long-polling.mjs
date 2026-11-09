// Capítulo 21 — Polling curto vs. long polling, no mesmo eixo de tempo.
export default (d) => {
  d.tela(720, 432).titulo(
    "Polling curto vs. long polling",
    "Dois diagramas de sequência com o mesmo eixo de tempo, correndo para baixo. À esquerda, o polling curto: o cliente pergunta 'novidade?' cinco vezes em intervalos fixos; quatro respostas vêm vazias. Uma mensagem chega ao servidor entre a segunda e a terceira pergunta e só é entregue na terceira resposta, com atraso. À direita, o long polling: o cliente pergunta uma vez e o servidor segura a requisição; quando a mensagem chega, ele responde na hora; o cliente reabre a requisição imediatamente; o servidor segura de novo até o timeout, responde vazio, e o cliente pergunta de novo.",
  );

  const vida = (x) => d.linha([[x, 84], [x, 400]], { cor: "cinza", tracejado: true, espessura: 1.4 });
  const resposta = (cli, srv, y, rotulo, cor) => {
    d.seta([srv, y], [cli, y + 8], { cor });
    d.texto(cli - 8, y + 13, rotulo, { ancora: "end", tam: 16, cor });
  };
  const chega = (srv, y) => {
    d.circulo(srv, y, 11, "", { tom: "verde", hachura: "solid", espessura: 1.4 });
    d.texto(srv - 12, y - 9, "msg chega", { ancora: "end", tam: 16, cor: "verde" });
  };

  // ── polling curto ────────────────────────────────────
  d.grupo(16, 16, 340, 400, "polling curto", { tam: 18, corTexto: "tinta" });
  const c1 = 100;
  const s1 = 300;
  d.etiqueta(c1, 66, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(s1, 66, "servidor", { tom: "azul", tam: 16 });
  vida(c1);
  vida(s1);
  chega(s1, 212);
  [104, 168, 232, 296, 360].forEach((y, i) => {
    d.seta([c1, y], [s1, y + 6], i === 0 ? { rotulo: "novidade?", desloc: 16, tamRotulo: 16 } : {});
    if (i === 2) resposta(c1, s1, y + 12, "1 msg", "verde");
    else resposta(c1, s1, y + 12, "nada", "cinza");
  });

  // ── long polling ─────────────────────────────────────
  d.grupo(364, 16, 340, 400, "long polling", { tam: 18, corTexto: "tinta" });
  const c2 = 448;
  const s2 = 648;
  d.etiqueta(c2, 66, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(s2, 66, "servidor", { tom: "azul", tam: 16 });
  vida(c2);
  vida(s2);
  // o servidor segura a requisição (barras sobre a linha do servidor)
  d.caixa(s2 - 5, 110, 10, 102, "", { tom: "laranja", hachura: "solid", raio: 3, espessura: 1.4 });
  d.caixa(s2 - 5, 234, 10, 126, "", { tom: "laranja", hachura: "solid", raio: 3, espessura: 1.4 });

  d.seta([c2, 104], [s2, 110], { rotulo: "novidade?", desloc: 16, tamRotulo: 16 });
  d.textoCentro((c2 + s2) / 2, 152, "o servidor segura\na requisição", { tam: 16, cor: "laranja" });
  chega(s2, 212);
  resposta(c2, s2, 212, "1 msg", "verde");
  d.seta([c2, 228], [s2, 234], { rotulo: "reabre na hora", desloc: -16, tamRotulo: 16 });
  d.textoCentro((c2 + s2) / 2, 302, "segura até o\ntimeout (ex.: 30 s)", { tam: 16, cor: "laranja" });
  resposta(c2, s2, 360, "vazio", "cinza");
  d.seta([c2, 376], [s2, 382]);
};
