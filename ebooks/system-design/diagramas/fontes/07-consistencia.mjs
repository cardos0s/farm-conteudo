// Capítulo 7 — Linha do tempo: escrita no primário e leituras na réplica, com consistência forte e eventual.
export default (d) => {
  d.tela(720, 436).titulo(
    "Consistência forte vs. eventual numa linha do tempo",
    "Dois cenários com um primário e uma réplica, e o tempo correndo para a direita. Em ambos, um cliente grava x = 2 no primário, onde antes havia x = 1. Com consistência forte, o primário copia o valor para a réplica e só depois confirma a escrita; uma leitura na réplica em seguida devolve x = 2. Com consistência eventual, o primário confirma na hora e copia depois; uma leitura na réplica logo após a confirmação ainda devolve o valor velho, x = 1, e só uma leitura feita depois que a cópia chega devolve x = 2.",
  );

  const raia = (y, nome) => {
    d.linha([[128, y], [700, y]], { cor: "cinza", espessura: 1.4, aspereza: 0.4 });
    d.texto(24, y + 6, nome, { tam: 17 });
  };
  const le = (x, yRaia, texto, tom) => {
    d.seta([x, yRaia + 32], [x, yRaia + 4], { cor: tom });
    d.texto(x, yRaia + 52, texto, { ancora: "middle", tam: 16, cor: tom });
  };

  // ── Consistência forte ──
  {
    const P = 66;
    const R = 130;
    d.texto(24, 24, "Consistência forte", { tam: 19, cor: "azul" });
    raia(P, "Primário");
    raia(R, "Réplica");
    d.seta([290, 36], [290, P - 4]);
    d.texto(282, 46, "grava x = 2", { ancora: "end", tam: 16 });
    d.seta([294, P + 4], [356, R - 4]);
    d.seta([364, R - 4], [420, P + 4], { tracejado: true, cor: "cinza" });
    d.seta([428, P - 4], [428, 36], { cor: "verde" });
    d.texto(438, 46, "ok, só agora", { tam: 16, cor: "verde" });
    d.texto(358, R + 24, "cópia antes do ok", { ancora: "middle", tam: 16, cor: "cinza" });
    le(500, R, "lê: x = 2", "verde");
  }

  d.linha([[16, 204], [704, 204]], { cor: "cinza", tracejado: "3 7", espessura: 1.2, aspereza: 0.3 });

  // ── Consistência eventual ──
  {
    const P = 272;
    const R = 336;
    d.texto(24, 230, "Consistência eventual", { tam: 19, cor: "laranja" });
    raia(P, "Primário");
    raia(R, "Réplica");
    d.seta([290, 242], [290, P - 4]);
    d.texto(282, 252, "grava x = 2", { ancora: "end", tam: 16 });
    d.seta([304, P - 4], [304, 242], { cor: "verde" });
    d.texto(314, 252, "ok, na hora", { tam: 16, cor: "verde" });
    d.seta([298, P + 4], [590, R - 4], { tracejado: true });
    d.texto(452, P + 26, "cópia chega depois", { tam: 16, cor: "cinza" });
    le(430, R, "lê: x = 1 (velho)", "vermelho");
    le(650, R, "lê: x = 2", "verde");
  }

  d.seta([128, 418], [700, 418], { cor: "cinza", espessura: 1.4 });
  d.texto(24, 424, "tempo", { tam: 17, cor: "cinza" });
};
