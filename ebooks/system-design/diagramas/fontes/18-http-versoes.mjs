// Capítulo 18 — HTTP/1.1 vs. HTTP/2 vs. HTTP/3: conexões, streams e o que uma perda de pacote trava.
export default (d) => {
  d.tela(720, 450).titulo(
    "HTTP/1.1, HTTP/2 e HTTP/3",
    "Três faixas. HTTP/1.1: três conexões TCP separadas, cada uma levando uma única requisição (A, B e C); as requisições D, E e F esperam uma conexão livre. HTTP/2: uma única conexão TCP com frames dos streams A, B e C intercalados; o terceiro pacote se perde e todos os frames que vêm depois dele, de qualquer stream, ficam parados esperando a retransmissão. HTTP/3: uma conexão QUIC sobre UDP com os streams A, B e C em pistas independentes; um pacote do stream B se perde e só o stream B espera, enquanto A e C seguem.",
  );

  const cores = { A: "azul", B: "violeta", C: "ciano" };
  const frame = (x, y, s, o = {}) =>
    d.caixa(x, y, 30, 24, s, { tom: o.parado ? "cinza" : cores[s], tam: 16, raio: 5, espessura: 1.5 });
  const perdido = (x, y) => {
    d.caixa(x, y, 30, 24, "", { cor: "vermelho", preench: "none", tracejado: true, raio: 5, espessura: 1.5 });
    d.xis(x + 15, y + 12, 16);
  };
  const tubo = (x, y, w, h) => d.caixa(x, y, w, h, "", { cor: "cinza", preench: "none", raio: 12, espessura: 1.5 });
  const legenda = (y, s) => d.texto(136, y, s, { tam: 16, cor: "cinza" });

  // ── HTTP/1.1 ─────────────────────────────────────────
  d.caixa(16, 63, 100, 60, "HTTP/1.1", { tom: "azul" });
  legenda(34, "várias conexões TCP, uma requisição por vez em cada");
  [["A", 46, 270, "D"], ["B", 80, 340, "E"], ["C", 114, 410, "F"]].forEach(([s, y, x, fila]) => {
    tubo(180, y, 340, 30);
    frame(x, y + 3, s);
    d.caixa(136, y + 3, 30, 24, fila, { cor: "cinza", preench: "none", tracejado: true, tam: 16, raio: 5, espessura: 1.4, corTexto: "cinza" });
  });
  d.textoCentro(620, 93, "D, E e F esperam\numa conexão livre", { tam: 16, cor: "laranja" });

  // ── HTTP/2 ───────────────────────────────────────────
  d.caixa(16, 186, 100, 60, "HTTP/2", { tom: "azul" });
  legenda(178, "1 conexão TCP, streams intercalados");
  tubo(136, 192, 384, 48);
  ["A", "B", "C", "A", "B", "C", "A", "B"].forEach((s, i) => {
    const x = 150 + i * 44;
    if (i === 2) perdido(x, 204);
    else frame(x, 204, s, { parado: i > 2 });
  });
  d.textoCentro(620, 216, "perdeu 1 pacote:\ntodos os streams\nficam parados", { tam: 16, cor: "vermelho" });

  // ── HTTP/3 ───────────────────────────────────────────
  d.caixa(16, 330, 100, 60, "HTTP/3", { tom: "azul" });
  legenda(286, "QUIC sobre UDP: streams independentes");
  tubo(136, 296, 384, 128);
  ["A", "B", "C"].forEach((s, k) => {
    const y = 308 + k * 38;
    d.texto(150, y + 18, `stream ${s}`, { tam: 16, cor: "cinza" });
    for (let i = 0; i < 5; i++) {
      const x = 240 + i * 44;
      if (s === "B" && i === 1) perdido(x, y);
      else frame(x, y, s, { parado: s === "B" && i > 1 });
    }
  });
  d.certo(484, 320, 16);
  d.certo(484, 396, 16);
  d.textoCentro(620, 358, "perdeu 1 pacote:\nsó o stream B\nespera", { tam: 16, cor: "verde" });
};
