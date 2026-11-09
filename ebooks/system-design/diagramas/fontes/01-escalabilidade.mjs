// Capítulo 1 — Escalabilidade vertical (a mesma máquina cresce) vs. horizontal (mais máquinas).
export default (d) => {
  d.tela(720, 420).titulo(
    "Escalar na vertical vs. escalar na horizontal",
    "À esquerda, escala vertical: a mesma máquina passa de 2 para 8 e depois 64 CPUs, até encostar numa linha vermelha que marca o limite do hardware. À direita, escala horizontal: um load balancer distribui as requisições entre várias máquinas pequenas e iguais, que guardam os dados num armazenamento compartilhado; para crescer, adiciona-se mais uma máquina, desenhada tracejada.",
  );

  // divisória entre os dois lados
  d.linha([[360, 22], [360, 398]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // ── Vertical: uma máquina que cresce até o teto ──
  d.texto(182, 42, "Vertical (scale up)", { ancora: "middle", tam: 20 });
  d.linha([[26, 128], [338, 128]], { cor: "vermelho", tracejado: true, espessura: 2.2 });
  d.texto(182, 114, "limite do hardware", { ancora: "middle", cor: "vermelho", tam: 17 });

  d.caixa(28, 290, 70, 60, "2 CPU\n4 GB", { tom: "azul", tam: 16 });
  d.caixa(118, 226, 86, 124, "8 CPU\n32 GB", { tom: "azul", tam: 16 });
  d.caixa(226, 152, 110, 198, "64 CPU\n512 GB", { tom: "azul", tam: 16 });
  d.seta([36, 382], [330, 382], { rotulo: "a mesma máquina, maior", tamRotulo: 16 });

  // ── Horizontal: load balancer + máquinas iguais + dados compartilhados ──
  d.texto(540, 42, "Horizontal (scale out)", { ancora: "middle", tam: 20 });
  const lb = d.caixa(440, 74, 200, 50, "load balancer", { tom: "violeta" });

  const xs = [376, 456, 536, 616];
  const maquinas = xs.map((x, i) =>
    i < 3
      ? d.caixa(x, 186, 72, 60, "2 CPU\n4 GB", { tom: "azul", tam: 16 })
      : d.caixa(x, 186, 72, 60, "+1", { cor: "azul", preench: "none", tracejado: true }),
  );
  maquinas.forEach((m, i) => d.seta(lb.emBaixo(0.14 + i * 0.24), m.topo, { tracejado: i === 3, cor: i === 3 ? "cinza" : undefined }));

  const dados = d.cilindro(392, 306, 296, 66, "dados compartilhados", { tom: "verde" });
  maquinas.forEach((m, i) => d.linha([m.base, [m.cx, dados.y + 8]], { cor: "cinza", tracejado: i === 3 }));
};
