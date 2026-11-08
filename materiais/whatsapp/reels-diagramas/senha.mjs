import { ret, elipse, linha, caminho, seta, txt, check, etapa, svg, semear, cor, claro } from "../diagramas.mjs";

// Cena "como o sistema sabe a ordem": cada mensagem ganha uma senha com o relógio impresso; pôr as
// senhas em ordem já põe a conversa em ordem; e a senha leva o número do servidor que a criou, para
// dois servidores no mesmo instante nunca darem a mesma senha.
export function senha() {
  semear("senha");
  const E = 3; // espessura das formas principais
  const o = (x = {}) => ({ espessura: E, gap: 9, ...x });

  // balão de conversa com o rabinho embaixo à esquerda e duas linhas de "texto"
  const balao = (x, y, w, h, f) =>
    ret(x, y, w, h, o({ preench: f, hachura: "solid" })) +
    caminho(`M${x + 24},${y + h - 1} L${x - 8},${y + h + 13} L${x + 8},${y + h - 16}`, o({ preench: f, hachura: "solid" })) +
    linha([[x + 18, y + h * 0.36], [x + w - 20, y + h * 0.36]], { cor: cor.cinza, espessura: 2.6 }) +
    linha([[x + 18, y + h * 0.66], [x + w - 46, y + h * 0.66]], { cor: cor.cinza, espessura: 2.6 });
  // senha pendurada no balão (com o barbante e o furinho)
  const etiqueta = (x, y, w, h, hora, bx) =>
    linha([[bx, y + h / 2], [x, y + h / 2]], { espessura: 2.4 }) +
    ret(x, y, w, h, o({ preench: claro.amarelo, hachura: "solid" })) +
    txt(x + w / 2, y + h / 2 + 1, hora, { tam: 30 });
  // servidor: caixa com prateleiras e luzinhas; o nome vai na primeira prateleira
  const servidor = (x, y, nome) => {
    let s = ret(x, y, 110, 112, o({ preench: claro.cinza, hachura: "solid" }));
    s += linha([[x + 4, y + 40], [x + 106, y + 40]], { espessura: 2.6 });
    s += linha([[x + 4, y + 76], [x + 106, y + 76]], { espessura: 2.6 });
    s += txt(x + 55, y + 21, nome, { tam: 34 });
    for (const yy of [y + 58, y + 94]) {
      s += linha([[x + 16, yy], [x + 60, yy]], { espessura: 2.6 });
      s += elipse(x + 86, yy, 14, 14, { preench: cor.verde, hachura: "solid", cor: cor.verde, espessura: 2 });
    }
    return s;
  };
  // senha pequena: hora (amarela) + pedaço do servidor (violeta)
  const senhaPequena = (x, y, nome) =>
    ret(x, y, 200, 70, o({ preench: claro.amarelo, hachura: "solid" })) +
    txt(x + 100, y + 36, "14:05:32", { tam: 36 }) +
    caminho(`M${x + 200},${y} L${x + 280},${y} L${x + 280},${y + 70} L${x + 200},${y + 70}`, o({ preench: claro.violeta })) +
    txt(x + 240, y + 36, nome, { tam: 36, cor: cor.violeta });

  // pilha bagunçada: [x do balão, y, cor, hora]
  const pilha = [
    [95, 36, claro.laranja, "14:05:32"],
    [32, 128, claro.verde, "14:05:30"],
    [75, 220, claro.ciano, "14:05:31"],
  ];

  let s = "";

  // 0 — as mensagens chegam bagunçadas: qual vem primeiro?
  s += etapa(
    0,
    pilha.map(([x, y, f]) => balao(x, y, 150, 62, f)).join("") + txt(452, 256, "?", { tam: 100, cor: cor.laranja }),
  );

  // 1 — "ganha um número": cada mensagem ganha a sua senha
  s += etapa(1, pilha.map(([x, y, , hora]) => etiqueta(x + 165, y + 7, 152, 48, hora, x + 150)).join(""));

  // 2 — "senha de atendimento": a senha de cima, vista de perto
  s += etapa(
    2,
    linha([[412, 43], [498, 40]], { cor: cor.cinza, espessura: 2.2, tracejado: true }) +
      linha([[412, 91], [498, 228]], { cor: cor.cinza, espessura: 2.2, tracejado: true }) +
      ret(500, 40, 300, 190, o({ espessura: 3.4, preench: claro.amarelo, gap: 11 })) +
      txt(650, 74, "SENHA", { tam: 34 }) +
      linha([[522, 102], [778, 102]], { espessura: 2.4, tracejado: true }) +
      txt(682, 164, "14:05:32", { tam: 46 }),
  );

  // 3 — "relógio impresso": o número é o horário
  s += etapa(
    3,
    elipse(548, 164, 58, 58, o({ preench: "#ffffff", hachura: "solid" })) +
      linha([[548, 164], [548, 145]], { espessura: 3 }) +
      linha([[548, 164], [562, 172]], { espessura: 3 }),
  );

  // 4 — "colocar os números em ordem": a conversa no celular fica na ordem das senhas
  let cel = seta(222, 296, 222, 388, { espessura: E, ponta: 18, rotulo: "em ordem", dx: 18, dy: -2, tam: 30, ancora: "start", cor: cor.verde });
  cel += ret(30, 396, 400, 272, o({ espessura: 3.4, preench: "#ffffff", hachura: "solid" }));
  cel += linha([[195, 414], [265, 414]], { espessura: 3 });
  const ordem = [
    [claro.verde, "14:05:30"],
    [claro.ciano, "14:05:31"],
    [claro.laranja, "14:05:32"],
  ];
  ordem.forEach(([f, hora], i) => {
    const y = 434 + i * 72;
    cel += balao(58, y, 128, 52, f);
    cel += etiqueta(198, y + 3, 150, 46, hora, 186);
  });
  cel += seta(388, 440, 388, 628, { espessura: E, ponta: 18, cor: cor.verde });
  cel += check(392, 652, 26);
  s += etapa(4, cel);

  // 5 — "identificação do servidor": a senha ganha o pedaço do servidor 7
  s += etapa(
    5,
    caminho("M800,40 L940,40 L940,230 L800,230", o({ espessura: 3.4, preench: claro.violeta })) +
      ret(835, 62, 70, 66, o({ preench: "#ffffff", hachura: "solid", espessura: 2.6 })) +
      linha([[838, 84], [902, 84]], { espessura: 2.2 }) +
      linha([[838, 106], [902, 106]], { espessura: 2.2 }) +
      elipse(890, 73, 9, 9, { preench: cor.verde, hachura: "solid", cor: cor.verde }) +
      elipse(890, 95, 9, 9, { preench: cor.verde, hachura: "solid", cor: cor.verde }) +
      elipse(890, 117, 9, 9, { preench: cor.verde, hachura: "solid", cor: cor.verde }) +
      txt(870, 176, "S7", { tam: 48, cor: cor.violeta }) +
      txt(870, 262, "servidor 7", { tam: 30, cor: cor.violeta }),
  );

  // 6 — "dois servidores nunca": mesmo instante, senhas diferentes
  s += etapa(
    6,
    servidor(500, 310, "S3") +
      seta(616, 366, 654, 366, { espessura: E, ponta: 14 }) +
      senhaPequena(660, 331, "S3") +
      servidor(500, 486, "S7") +
      seta(616, 542, 654, 542, { espessura: E, ponta: 14 }) +
      senhaPequena(660, 507, "S7") +
      txt(760, 454, "= mesma hora", { tam: 30, cor: cor.cinza }) +
      txt(900, 454, "≠", { tam: 60, cor: cor.verde }) +
      txt(735, 630, "números diferentes", { tam: 30, cor: cor.verde }) +
      check(920, 628, 30),
  );

  return svg(968, 690, s);
}
