// Capítulo 51 — Zero Trust: o perímetro "castelo e fosso" contra a verificação a cada acesso.
export default (d) => {
  d.tela(720, 458).titulo(
    "Perímetro tradicional vs. Zero Trust",
    "Dois quadros. Em cima, o modelo de perímetro, o castelo e fosso: um firewall separa a internet da rede interna. Um invasor de fora é barrado no firewall, mas um notebook invadido que já está dentro da rede alcança livremente o serviço de pagamentos e o banco, porque dentro da rede tudo é confiável. Embaixo, o Zero Trust: dentro da mesma rede interna, um ponto de verificação na frente do serviço de pagamentos confere identidade, dispositivo e contexto a cada acesso. O serviço de pedidos, que se apresenta com mTLS, passa. O notebook invadido é barrado, mesmo estando dentro da rede. Cada serviço tem o seu ponto de verificação.",
  );

  // ── Perímetro ──────────────────────────────────────────
  d.texto(24, 36, "Perímetro (castelo e fosso): dentro da rede, tudo é confiável", { tam: 18 });
  d.grupo(160, 52, 544, 160, "rede interna");

  d.pessoa(64, 118, 46, { cor: "vermelho", rotulo: "de fora", corTexto: "vermelho" });
  d.seta([92, 114], [136, 114], { cor: "vermelho" });
  d.linha([[150, 56], [150, 208]], { espessura: 6 });
  d.xis(150, 114, 22);
  d.texto(150, 232, "firewall", { ancora: "middle", tam: 16, cor: "cinza" });

  const nb1 = d.caixa(192, 104, 130, 60, "notebook\ninvadido", { tom: "vermelho", tam: 17 });
  const pag1 = d.caixa(504, 72, 150, 48, "pagamentos", { tom: "azul", tam: 17 });
  const banco1 = d.cilindro(504, 136, 150, 64, "banco", { tom: "azul", tam: 17 });
  d.seta(nb1.naDir(0.25), pag1.esq, { cor: "vermelho" });
  d.seta(nb1.naDir(0.75), banco1.naEsq(0.6), { cor: "vermelho" });
  d.texto(414, 141, "acesso livre", { ancora: "middle", tam: 16, cor: "vermelho" });

  // ── Zero Trust ─────────────────────────────────────────
  d.texto(24, 274, "Zero Trust: cada acesso é verificado, mesmo dentro da rede", { tam: 18 });
  d.grupo(160, 290, 544, 156, "rede interna");

  const ped = d.caixa(192, 322, 122, 44, "pedidos", { tom: "azul", tam: 17 });
  const nb2 = d.caixa(192, 382, 122, 52, "notebook\ninvadido", { tom: "vermelho", tam: 16 });
  const guarda = d.caixa(384, 316, 134, 118, "verifica\nidentidade,\ndispositivo\ne contexto", { tom: "violeta", tam: 16 });
  const pag2 = d.caixa(584, 344, 110, 46, "pagamentos", { tom: "azul", tam: 16 });

  d.seta(ped.dir, [guarda.x, ped.cy], { rotulo: "mTLS", desloc: 13, tamRotulo: 16 });
  d.seta(nb2.dir, [guarda.x - 22, nb2.cy], { cor: "vermelho" });
  d.xis(guarda.x - 12, nb2.cy, 16);
  d.seta([guarda.x + guarda.w, pag2.cy], pag2.esq, { cor: "verde" });
  d.certo(guarda.x + guarda.w + 32, pag2.cy - 18, 18);
  d.texto(pag2.cx, 413, "cada serviço\ntem o seu", { ancora: "middle", tam: 16, cor: "cinza" });
};
