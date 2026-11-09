// Capítulo 17 — TCP vs. UDP: handshake, ACK e retransmissão de um lado; datagramas soltos do outro.
export default (d) => {
  d.tela(720, 460).titulo(
    "TCP vs. UDP",
    "Dois diagramas de sequência, com o tempo correndo para baixo. À esquerda, o TCP: cliente e servidor trocam SYN, SYN-ACK e ACK (o handshake); o cliente envia o segmento de dados 1 e recebe um ACK; o segmento 2 se perde, o ACK não vem, o timer estoura e o cliente reenvia o segmento 2, que agora é confirmado. À direita, o UDP: sem handshake, o cliente dispara os datagramas 1, 2, 3 e 4; o datagrama 3 se perde e ninguém o reenvia.",
  );

  const vida = (x) => d.linha([[x, 84], [x, 428]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // ── TCP ──────────────────────────────────────────────
  d.grupo(16, 16, 410, 428, "TCP: com conexão", { tam: 18, corTexto: "tinta" });
  const cli = 92;
  const srv = 300;
  d.etiqueta(cli, 66, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(srv, 66, "servidor", { tom: "azul", tam: 16 });
  vida(cli);
  vida(srv);

  const dir = (y, rotulo, o = {}) => d.seta([cli, y], [srv, y + 8], { rotulo, desloc: 18, tamRotulo: 16, ...o });
  const esq = (y, rotulo, o = {}) => d.seta([srv, y], [cli, y + 8], { rotulo, desloc: -18, tamRotulo: 16, ...o });

  // handshake
  dir(108, "SYN");
  esq(144, "SYN-ACK");
  dir(180, "ACK");
  d.linha([[306, 108], [313, 108], [313, 188], [306, 188]], { cor: "cinza", espessura: 1.4 });
  d.texto(367, 154, "handshake", { ancora: "middle", tam: 16, cor: "cinza" });

  // dados confirmados
  dir(224, "dados 1", { cor: "azul" });
  esq(260, "ACK", { cor: "verde" });

  // segmento perdido, timeout e retransmissão
  d.seta([cli, 300], [194, 305], { cor: "azul", semPonta: true, rotulo: "dados 2", desloc: 18, tamRotulo: 16 });
  d.xis(201, 307, 18);
  d.texto(196, 336, "sem ACK: timeout", { ancora: "middle", tam: 16, cor: "laranja" });
  dir(368, "dados 2 de novo", { cor: "azul" });
  esq(404, "ACK", { cor: "verde" });

  // ── UDP ──────────────────────────────────────────────
  d.grupo(438, 16, 266, 428, "UDP: sem conexão", { tam: 18, corTexto: "tinta" });
  const c2 = 486;
  const s2 = 650;
  d.etiqueta(c2, 66, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(s2, 66, "servidor", { tom: "azul", tam: 16 });
  vida(c2);
  vida(s2);

  d.texto((c2 + s2) / 2, 112, "sem handshake", { ancora: "middle", tam: 16, cor: "cinza" });
  const dg = (y, rotulo) => d.seta([c2, y], [s2, y + 10], { rotulo, desloc: 20, tamRotulo: 16, cor: "azul" });
  dg(150, "datagrama 1");
  dg(200, "datagrama 2");
  d.seta([c2, 250], [600, 257], { cor: "azul", semPonta: true, rotulo: "datagrama 3", desloc: 20, tamRotulo: 16, posRotulo: 0.55 });
  d.xis(607, 258, 18);
  dg(300, "datagrama 4");
  d.textoCentro((c2 + s2) / 2, 376, "o 3 se perdeu e\nninguém reenvia", { tam: 17, cor: "vermelho" });
};
