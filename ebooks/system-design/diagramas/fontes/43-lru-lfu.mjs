// Capítulo 43 — Políticas de remoção: o LRU como lista por recência e o contraste com o LFU.
export default (d) => {
  d.tela(720, 440).titulo(
    "LRU e LFU num cache com três vagas",
    "Em cima, o LRU como uma lista que vai do item usado agora (frente) ao usado há mais tempo (fim). No início, a lista é C, B, A. Ler A move A para a frente: A, C, B. Inserir D com o cache cheio põe D na frente e remove B, o último da lista: D, A, C. Embaixo, o LFU no mesmo momento olha os contadores de acesso: A tem 4, C tem 1 e B tem 9. Ele remove C, o menos acessado, enquanto o LRU removeu B, o mais popular.",
  );

  const x0 = 214;
  const lado = 56;
  const meio = (y) => y + lado / 2 + 6;
  const passo = (y, s) => d.texto(40, meio(y), s, { tam: 17 });

  // ── LRU ──
  d.texto(24, 36, "LRU", { tam: 20, cor: "violeta" });
  d.texto(74, 36, "da frente (usado agora) ao fim (usado há mais tempo)", { tam: 16, cor: "cinza" });
  d.texto(x0 + lado / 2, 70, "frente", { ancora: "middle", tam: 16, cor: "cinza" });
  d.texto(x0 + 2.5 * lado, 70, "fim", { ancora: "middle", tam: 16, cor: "cinza" });

  const y1 = 80;
  passo(y1, "início");
  d.celulas(x0, y1, ["C", "B", "A"], { lado });

  const y2 = 148;
  passo(y2, "lê A");
  d.celulas(x0, y2, ["A", "C", "B"], { lado, destacadas: [0], tom: "amarelo" });
  d.texto(x0 + 3 * lado + 34, meio(y2), "A vai para a frente", { tam: 17 });

  const y3 = 216;
  passo(y3, "insere D (cheio)");
  d.celulas(x0, y3, ["D", "A", "C"], { lado, destacadas: [0], tom: "verde" });
  const fora = d.celulas(x0 + 3 * lado + 64, y3, ["B"], { lado, destacadas: [0], tom: "vermelho" });
  d.seta([x0 + 3 * lado + 8, y3 + lado / 2], [fora.x - 8, y3 + lado / 2]);
  d.texto(fora.x + lado + 18, meio(y3), "B sai pelo fim", { tam: 17, cor: "vermelho" });

  d.linha([[24, 296], [696, 296]], { cor: "cinza", tracejado: true });

  // ── LFU ──
  d.texto(24, 330, "LFU", { tam: 20, cor: "violeta" });
  d.texto(74, 330, "no mesmo momento, olhando os contadores de acesso", { tam: 16, cor: "cinza" });

  const y4 = 356;
  passo(y4, "insere D (cheio)");
  const lfu = d.celulas(x0, y4, ["A", "C", "B"], { lado, destacadas: [1], tom: "vermelho" });
  ["4", "1", "9"].forEach((n, i) => {
    const c = lfu.celula(i);
    d.circulo(c.cx, c.y, 26, n, { tom: "ciano", hachura: "solid", tam: 15 });
  });
  d.texto(x0 + 3 * lado + 34, meio(y4) - 10, "sai C (1 acesso)", { tam: 17, cor: "vermelho" });
  d.texto(x0 + 3 * lado + 34, meio(y4) + 14, "o LRU tirou B (9 acessos)", { tam: 16, cor: "cinza" });
};
