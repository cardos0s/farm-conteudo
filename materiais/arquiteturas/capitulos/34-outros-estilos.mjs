// Apêndice A: Outros estilos que você vai encontrar. Formato compacto, sem a estrutura completa dos capítulos de
// arquitetura: abertura (resumo + para que serve) → uma ficha por estilo (o que é, como funciona com um exemplo,
// use quando / evite quando, capítulos parentes) → mesmo estilo, outro nome → tabela-resumo → para lembrar.
// A ficha 1 (baseada em serviços) é a mais longa: dois diagramas e um medidor coerente com os capítulos 12 e 14.

import { alerta, codigo, dica, fig, lembre, medidor, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, elipse, engrenagem, etiqueta, linha, navegador, pessoa, quadro, ret, semear, servidor, seta, txt } from "../desenho.mjs";

/* ------------------------------------------------------------------ diagramas */

/** Ficha 1: uma interface, poucos serviços grossos com deploy próprio e um banco só, dividido por dono. */
function baseadaEmServicos() {
  semear("outros-estilos-1");
  let s = "";
  // a interface
  s += navegador(290, 8, 180, 76, "interface\n(um front só)");
  s += txt(150, 34, "uma interface", { tam: 16, cor: cor.azul });
  s += txt(150, 56, "(ou poucas)", { tam: 15, cor: cor.cinza });
  s += txt(612, 34, "4 a 12 serviços grossos", { tam: 16, cor: cor.violeta });
  s += txt(612, 56, "cada um com deploy próprio", { tam: 15, cor: cor.cinza });
  s += seta(380, 86, 380, 104, { espessura: 2 });
  // gateway opcional
  s += bloco(40, 106, 680, 34, "API gateway ou proxy (opcional)", { preench: claro.cinza, tracejado: true, tam: 15, espessura: 1.6 });
  // os serviços de domínio, cada um com camadas por dentro
  const servs = [
    [30, "Clientes", claro.azul],
    [215, "Pedidos", claro.amarelo],
    [400, "Pagamentos", claro.ciano],
    [585, "Entregas", claro.laranja],
  ];
  for (const [x, nome, c] of servs) {
    s += seta(x + 72, 142, x + 72, 166, { espessura: 1.8 });
    s += bloco(x, 168, 145, 128, "", { preench: c, gap: 8 });
    s += txt(x + 72, 188, nome, { tam: 17 });
    ["API", "regras", "dados"].forEach((camada, i) => {
      s += ret(x + 14, 204 + i * 29, 117, 24, { preench: "#ffffff", hachura: "solid", espessura: 1.3 });
      s += txt(x + 72, 216 + i * 29, camada, { tam: 15 });
    });
    s += seta(x + 72, 298, x + 72, 340, { espessura: 1.8 });
  }
  // o banco: um só, dividido por dono
  s += ret(16, 328, 728, 110, { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  for (const [x, nome, c] of servs) s += banco(x + 17, 342, 110, 62, nome.toLowerCase(), { preench: c, tam: 15 });
  s += txt(380, 424, "um banco só, um schema por serviço; o que é comum fica num schema à parte", { tam: 15, cor: cor.cinza });
  return quadro(760, 446, s);
}

/** Ficha 1: monólito modular x baseada em serviços x microsserviços (deploys, bancos e transação). */
function espectro() {
  semear("outros-estilos-2");
  let s = "";
  const cores = [claro.azul, claro.amarelo, claro.ciano, claro.laranja];
  const linhas = [
    [4, "monólito\nmodular", "cap. 12", "1 deploy\n1 banco\ntransação local"],
    [98, "baseada em\nserviços", "ficha 1", "4 a 12 deploys\n1 banco (ou poucos)\ntransação local"],
    [190, "microsserviços", "cap. 14", "dezenas de deploys\n1 banco por serviço\nsagas entre serviços"],
  ];
  linhas.forEach(([y0, nome, cap, notas], i) => {
    s += txt(84, y0 + 26, nome, { tam: 17, cor: i === 1 ? cor.laranja : cor.tinta });
    s += txt(84, y0 + 66, cap, { tam: 15, cor: cor.cinza });
    s += txt(652, y0 + 42, notas, { tam: 15 });
  });
  // destaque na linha do meio
  s += ret(6, 95, 748, 92, { tracejado: true, cor: cor.laranja, espessura: 1.6 });
  // 1. monólito modular: quatro módulos dentro de um deploy, um banco
  s += ret(190, 4, 352, 38, { tracejado: true, cor: cor.cinza, espessura: 1.5 });
  cores.forEach((c, j) => (s += bloco(200 + j * 84, 10, 76, 26, "", { preench: c, hachura: "solid", espessura: 1.4 })));
  s += seta(366, 42, 366, 50, { espessura: 1.6, ponta: 8 });
  s += banco(321, 50, 90, 42, "banco", { preench: claro.cinza, tam: 15 });
  // 2. baseada em serviços: quatro deploys separados, um banco
  cores.forEach((c, j) => {
    const x = 200 + j * 86;
    s += bloco(x, 102, 76, 32, "", { preench: c, hachura: "solid", espessura: 2.2 });
    s += seta(x + 38, 136, 345 + j * 14, 144, { espessura: 1.4, ponta: 8 });
  });
  s += banco(321, 144, 90, 40, "banco", { preench: claro.cinza, tam: 15 });
  // 3. microsserviços: muitos serviços, cada um com o seu banco
  for (let j = 0; j < 10; j++) {
    const x = 190 + j * 36;
    s += bloco(x, 196, 30, 26, "", { preench: cores[j % 4], hachura: "solid", espessura: 1.4 });
    s += linha([[x + 15, 224], [x + 15, 234]], { espessura: 1.2 });
    s += banco(x + 2, 236, 26, 30, "", { preench: cores[j % 4] });
  }
  return quadro(760, 272, s);
}

/** Ficha 2: o cliente pede ao broker, que sabe onde cada servidor está. */
function broker() {
  semear("outros-estilos-3");
  let s = "";
  // cliente com o proxy local
  s += bloco(14, 96, 170, 110, "", { preench: claro.azul });
  s += txt(99, 118, "cliente", { tam: 17 });
  s += bloco(30, 140, 138, 48, "proxy local", { preench: "#ffffff", hachura: "solid", tam: 15 });
  // broker com o registro
  s += bloco(280, 60, 230, 180, "", { preench: claro.laranja });
  s += txt(395, 84, "broker", { tam: 18 });
  s += ret(296, 104, 198, 118, { preench: "#ffffff", hachura: "solid", espessura: 1.3 });
  s += txt(395, 126, "registro", { tam: 15, cor: cor.cinza });
  s += txt(395, 158, "frete: 10.0.0.9", { tam: 15 });
  s += txt(395, 190, "pagamentos: 10.0.0.7", { tam: 15 });
  // servidores
  s += servidor(640, 18, 62, 76, "frete");
  s += servidor(640, 158, 62, 76, "pagamentos");
  // 0. os servidores se registram
  s += seta(636, 58, 514, 100, { cor: cor.cinza, tracejado: true, espessura: 1.6, rotulo: "0. registra", corRotulo: cor.cinza });
  // 1. chamada, 2. repasse, 3. resposta
  s += seta(188, 150, 276, 150, { cor: cor.azul, espessura: 2.2, rotulo: "1. pagar()" });
  s += seta(514, 200, 634, 196, { cor: cor.azul, espessura: 2.2, rotulo: "2. repassa" });
  s += seta(276, 184, 188, 184, { cor: cor.verde, espessura: 2.2, tracejado: true, rotulo: "3. resposta", dy: 18 });
  return quadro(760, 262, s);
}

/** Ficha 3: escritas no primário, leituras nas réplicas, log copiado com atraso. */
function primarioReplica() {
  semear("outros-estilos-4");
  let s = "";
  s += bloco(14, 106, 140, 66, "app", { preench: claro.azul });
  s += banco(300, 20, 130, 100, "primário", { preench: claro.amarelo, tam: 16 });
  s += banco(590, 6, 120, 80, "réplica 1", { preench: claro.ciano, tam: 15 });
  s += banco(590, 150, 120, 80, "réplica 2", { preench: claro.ciano, tam: 15 });
  s += seta(156, 124, 296, 76, { cor: cor.azul, espessura: 2.2, rotulo: "escreve", dy: -16 });
  s += seta(156, 160, 586, 198, { cor: cor.verde, espessura: 2.2, rotulo: "lê", dy: 18 });
  s += seta(434, 60, 586, 44, { cor: cor.violeta, espessura: 1.8, tracejado: true, rotulo: "copia o log", dy: -16 });
  s += seta(434, 100, 586, 176, { cor: cor.violeta, espessura: 1.8, tracejado: true });
  s += txt(650, 252, "pode estar atrasada", { tam: 15, cor: cor.cinza });
  return quadro(760, 266, s);
}

/** Ficha 4: especialistas em volta de um quadro comum; o controlador escolhe quem age. */
function blackboard() {
  semear("outros-estilos-5");
  let s = "";
  s += bloco(270, 6, 220, 46, "controlador", { preench: claro.laranja, tam: 17 });
  s += bloco(255, 88, 250, 166, "", { preench: claro.verde, gap: 9 });
  s += txt(380, 108, "quadro (estado comum)", { tam: 16 });
  s += etiqueta(380, 144, "renda: R$ 8 mil", { tam: 15, preench: "#ffffff" });
  s += etiqueta(380, 180, "risco: médio", { tam: 15, preench: "#ffffff" });
  s += etiqueta(380, 216, "fraude: ainda não", { tam: 15, preench: "#ffffff" });
  const esp = [
    [16, 80, "leitor de\ndocumentos", true],
    [16, 194, "analista\nde risco", true],
    [584, 80, "detector\nde fraude", false],
    [584, 194, "redator\ndo parecer", false],
  ];
  for (const [x, y, nome, esq] of esp) {
    s += bloco(x, y, 160, 56, nome, { preench: claro.azul, tam: 16 });
    s += seta(esq ? x + 162 : x - 2, y + 28, esq ? 253 : 507, y < 150 ? 140 : 204, { duplo: true, espessura: 1.8 });
  }
  s += seta(268, 28, 98, 76, { cor: cor.laranja, tracejado: true, espessura: 1.8, rotulo: "sua vez", corRotulo: cor.laranja });
  s += seta(380, 54, 380, 86, { cor: cor.laranja, tracejado: true, espessura: 1.8 });
  s += txt(392, 70, "observa", { tam: 15, cor: cor.laranja, ancora: "start" });
  return quadro(760, 262, s);
}

/** Ficha 7: as quatro propriedades do Reactive Manifesto, do meio (embaixo) ao objetivo (em cima). */
function reativa() {
  semear("outros-estilos-6");
  let s = "";
  const prop = (x, y, w, h, titulo, sub, c) =>
    bloco(x, y, w, h, "", { preench: c, hachura: "solid" }) +
    txt(x + w / 2, y + 22, titulo, { tam: 18 }) +
    txt(x + w / 2, y + h / 2 + (sub.includes("\n") ? 16 : 12), sub, { tam: 15, cor: cor.cinza });
  s += prop(10, 50, 214, 84, "orientada a\nmensagens", "assíncrona, com filas\ne backpressure", claro.laranja);
  s += prop(276, 6, 250, 62, "resiliente", "a falha fica contida", claro.verde);
  s += prop(276, 112, 250, 62, "elástica", "cresce e encolhe com a carga", claro.azul);
  s += prop(580, 50, 170, 84, "responsiva", "responde a tempo,\nsempre", claro.amarelo);
  s += seta(226, 74, 272, 42, { espessura: 2 });
  s += seta(226, 110, 272, 142, { espessura: 2 });
  s += seta(528, 42, 576, 74, { espessura: 2 });
  s += seta(528, 142, 576, 110, { espessura: 2 });
  return quadro(760, 182, s);
}

/** Ficha 8: build gera o HTML, a CDN guarda cópias perto do usuário, só o dinâmico vai às APIs. */
function edge() {
  semear("outros-estilos-7");
  let s = "";
  // build
  s += engrenagem(58, 46, 22);
  s += txt(58, 92, "build", { tam: 16 });
  s += txt(58, 112, "gera o HTML", { tam: 15, cor: cor.cinza });
  s += seta(92, 46, 178, 46, { espessura: 2, rotulo: "publica" });
  // CDN
  s += ret(180, 6, 380, 150, { tracejado: true, cor: cor.ciano, espessura: 1.8 });
  s += txt(370, 24, "CDN: cópias perto de quem acessa", { tam: 16, cor: cor.ciano });
  for (const [x, nome] of [[218, "São Paulo"], [340, "Lisboa"], [462, "Tóquio"]]) s += servidor(x, 38, 58, 62, nome);
  s += txt(370, 140, "HTML pronto + funções na borda", { tam: 15 });
  // APIs e banco, num lugar só
  s += banco(626, 18, 96, 74, "banco", { preench: claro.violeta, tam: 15 });
  s += bloco(600, 170, 146, 50, "APIs", { preench: claro.violeta });
  s += seta(673, 168, 673, 96, { espessura: 1.8, cor: cor.violeta });
  // a usuária
  s += pessoa(96, 168, { rotulo: "usuária em SP" });
  s += seta(112, 158, 214, 80, { cor: cor.azul, espessura: 2.2, rotulo: "1. página", dx: 4, dy: 52 });
  s += seta(126, 196, 596, 196, { cor: cor.violeta, espessura: 2, tracejado: true, rotulo: "2. só o dinâmico: preço, carrinho, login", dy: -16 });
  return quadro(760, 234, s);
}

/** Ficha 9: silo, pool e bridge, com três clientes (tenants) A, B e C. */
function multiTenant() {
  semear("outros-estilos-8");
  let s = "";
  const cores = [claro.azul, claro.amarelo, claro.verde];
  const paineis = [
    [10, "silo", "tudo separado", "isolado, mas caro"],
    [262, "pool", "tudo junto, com tenant_id", "barato; vizinho barulhento"],
    [514, "bridge", "misto", "o grande fica à parte"],
  ];
  for (const [x0, nome, sub, rodape] of paineis) {
    s += txt(x0 + 118, 18, nome, { tam: 19 });
    s += txt(x0 + 118, 40, sub, { tam: 15, cor: cor.cinza });
    s += txt(x0 + 118, 248, rodape, { tam: 15, cor: cor.vermelho });
    ["A", "B", "C"].forEach((t, i) => {
      const cx = x0 + 48 + i * 70;
      s += elipse(cx, 76, 34, 34, { preench: cores[i], hachura: "solid" }) + txt(cx, 77, t, { tam: 16 });
    });
  }
  s += linha([[258, 8], [258, 256]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  s += linha([[510, 8], [510, 256]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  // silo: uma pilha por tenant
  cores.forEach((c, i) => {
    const cx = 58 + i * 70;
    s += seta(cx, 95, cx, 112, { espessura: 1.5, ponta: 9 });
    s += bloco(cx - 28, 114, 56, 34, "app", { preench: c, hachura: "solid", tam: 15 });
    s += seta(cx, 150, cx, 166, { espessura: 1.5, ponta: 9 });
    s += banco(cx - 26, 168, 52, 56, "", { preench: c });
  });
  // pool: tudo compartilhado
  [310, 380, 450].forEach((cx) => (s += seta(cx, 95, 380 + (cx - 380) * 0.4, 112, { espessura: 1.5, ponta: 9 })));
  s += bloco(290, 114, 180, 34, "app", { preench: claro.cinza, hachura: "solid", tam: 15 });
  s += seta(380, 150, 380, 166, { espessura: 1.5, ponta: 9 });
  s += banco(326, 168, 108, 58, "tenant_id", { preench: claro.cinza, tam: 15 });
  // bridge: app compartilhada; A e B no pool, C no silo
  [562, 632, 702].forEach((cx) => (s += seta(cx, 95, cx, 112, { espessura: 1.5, ponta: 9 })));
  s += bloco(536, 114, 196, 34, "app", { preench: claro.cinza, hachura: "solid", tam: 15 });
  s += seta(598, 150, 598, 166, { espessura: 1.5, ponta: 9 });
  s += seta(702, 150, 702, 166, { espessura: 1.5, ponta: 9 });
  s += banco(548, 168, 100, 58, "A + B", { preench: claro.cinza, tam: 15 });
  s += banco(674, 168, 56, 58, "C", { preench: claro.verde, tam: 15 });
  return quadro(760, 262, s);
}

/* ------------------------------------------------------------------ texto */

export default `
${resumo(
  "Nove estilos e padrões que aparecem em livros, listas da internet e entrevistas, mas não ganharam capítulo próprio. Cada um numa <b>ficha curta</b>: o que é, quando usar e com qual capítulo do livro ele conversa.",
  "Num guia de viagem, as cidades grandes ganham capítulo; as pequenas do caminho ganham meia página. É o suficiente para reconhecer o nome na placa e decidir se vale parar.",
)}

<p>Os capítulos 4 a 26 cobrem os grandes estilos. Mas basta abrir uma lista de "tipos de arquitetura", um livro clássico
ou uma entrevista de <i>system design</i> para aparecerem nomes que não estão no sumário. Alguns são estilos completos, como
a arquitetura baseada em serviços. Outros são padrões que vivem dentro de um estilo maior: primário-réplica diz como um
banco se copia, não como o sistema se divide. No fim, uma tabela junta tudo. Diante de qualquer nome novo, faça a
pergunta do capítulo 3: ele organiza o
<b>código por dentro</b>, divide o <b>sistema por fora</b> ou decide como as partes <b>conversam e guardam dados</b>?</p>

<h3>1. Arquitetura baseada em serviços</h3>
<p>Descrita por Mark Richards e Neal Ford no livro <i>Fundamentals of Software Architecture</i>, ela é o meio-termo
pragmático entre o monólito modular (capítulo 12) e os microsserviços (capítulo 14). O sistema é dividido em poucos
<b>serviços de domínio</b> "grossos" (de 4 a 12, segundo os autores), cada um com deploy próprio, mas em geral todos usando
<b>o mesmo banco</b> e atendidos por <b>uma interface</b> só.</p>

${fig(baseadaEmServicos(), "Uma interface, quatro serviços grossos com deploy próprio e um banco só, dividido por dono. O gateway no meio é opcional.")}

<ul>
<li><b>Serviço grosso é um domínio inteiro.</b> O serviço de Pedidos cuida de tudo o que é pedido: criar, alterar,
cancelar, devolver. Por dentro, costuma ter camadas (capítulo 4) ou hexagonal (6): é quase um pequeno monólito.</li>
<li><b>Deploy separado, mas poucos deploys.</b> Mudar a regra de devolução sobe só Pedidos. São 4 a 12 pipelines, não 80;
o serviço que precisa de mais fôlego ganha várias cópias atrás de um balanceador.</li>
<li><b>Um banco, com dono por pedaço.</b> Os autores sugerem dividir o banco logicamente, por domínio. Na prática, cada
serviço é dono do seu schema (como os módulos do capítulo 12), e as poucas tabelas que todos usam ficam num schema comum,
que só muda com combinação entre os donos. Se um domínio precisar de isolamento, ele pode ganhar banco próprio.</li>
<li><b>Transação local, sem saga.</b> Como o serviço é grosso, um fluxo como "fechar pedido" costuma caber inteiro nele, numa
transação comum do banco. É a maior vantagem sobre os microsserviços, que precisam de sagas (capítulo 23).</li>
<li><b>A interface chama os serviços</b> pela rede, em geral por HTTP. Serviço chamando serviço deve ser exceção: se Pedidos
chama Entregas em toda requisição, talvez os dois sejam um serviço só.</li>
</ul>

${fig(espectro(), "O que muda de um estilo para o outro: quantas peças vão para o ar, quantos bancos existem e se um fluxo cabe numa transação local.")}

${quando(
  [
    "Quer deploy separado por área do negócio, sem time para operar dezenas de serviços.",
    "Os fluxos importantes cabem num domínio só e você quer cada um numa transação.",
    "Está saindo de um monólito e quer um passo intermediário, sem dividir o banco.",
  ],
  [
    "Um time só e um sistema que cabe num deploy: fique no monólito modular (cap. 12).",
    "Uma parte tem carga muito maior que as outras e o banco compartilhado vira gargalo.",
    "Muitos times precisam mudar seus dados sem combinar: aí são microsserviços (cap. 14).",
  ],
)}

${medidor({ complexidade: 3, escala: 4, operacao: 3, aprendizado: 3, time: "de um a alguns times; cada serviço com um dono" })}

<p>As notas ficam entre as do capítulo 12 (2, 4, 1 e 3) e as do 14 (5, 5, 5 e 4). A escala empata com a do monólito
modular: dá para pôr mais cópias do serviço mais usado, mas o banco compartilhado continua sendo o teto. E não confunda com
a SOA (capítulo 13), em que os serviços são corporativos, reaproveitados por vários sistemas e ligados por um barramento.</p>

${alerta(
  "Banco compartilhado não era erro?",
  "<p>No capítulo 14, dois serviços lendo as mesmas tabelas são o caminho do monólito distribuído, porque microsserviços prometem que cada time muda seus dados sozinho. A baseada em serviços não promete isso: são poucos serviços, cada um dono de um pedaço do banco, e mudar uma tabela comum é combinado de propósito. O erro não é compartilhar o banco; é compartilhar e fingir que não.</p>",
)}

${pratica(
  "Exemplo",
  "<p>Imagine uma rede de autopeças com loja online e 12 devs em dois times. O monólito vira cinco serviços (Catálogo, Vendas, Logística, Clientes e Fiscal), cada um com pipeline próprio e todos no mesmo Postgres, um schema por serviço. Na Black Friday, sobem mais cópias de Catálogo e Vendas. Fechar uma venda (carrinho, pedido e pagamento) acontece dentro de Vendas, numa transação só; a Logística é avisada depois.</p>",
)}
<p><b>Parentes no livro:</b> monólito modular (capítulo 12), microsserviços (14) e SOA (13).</p>

<h3>2. Broker (corretor)</h3>
<p>Um dos padrões do livro <i>Pattern-Oriented Software Architecture</i> (1996), de Frank Buschmann e coautores. O cliente
quer chamar uma operação ("pagar este pedido") sem saber em que máquina ela roda. Ele fala com um <b>intermediário</b>, o
broker, que sabe onde cada servidor está, repassa o pedido e devolve a resposta. Os servidores se registram no broker ao
subir. No cliente, um <b>proxy</b> (um objeto local com os mesmos métodos do remoto) esconde a rede: o código chama
<code>pagamentos.pagar(pedido)</code> como se fosse uma função comum.</p>

${fig(broker(), "O cliente sabe <b>o que</b> quer; o broker sabe <b>onde</b> está. Se o servidor de pagamentos mudar de máquina, o cliente nem fica sabendo.", "baixa")}

<p>Foi a ideia do CORBA (o "B" de ORB, <i>Object Request Broker</i>) e do Java RMI, com seu registro de objetos. Hoje ela
aparece espalhada: a <b>descoberta de serviço</b> (Consul, Eureka, o DNS do Kubernetes; capítulo 14) é o registro, o
<b>API gateway</b> localiza e repassa, e os clientes que o gRPC gera a partir do contrato são o proxy. Ou o broker fica no
caminho e repassa tudo (como um gateway), ou só informa o endereço e sai da frente (como um registro de descoberta).</p>
<p><b>Mesma palavra, outra ideia.</b> Na arquitetura orientada a eventos (capítulo 20), o broker de mensagens (Kafka,
RabbitMQ) entrega <b>fatos</b> a quem se interessar; quem publica nem sabe quem ouve, e não espera resposta. No padrão
broker, o cliente quer um serviço específico e espera a resposta: o intermediário esconde <b>onde</b>, não <b>quem</b>. Já
o ESB da SOA (capítulo 13) é um broker que ganhou cérebro: além de localizar e repassar, transforma formatos, orquestra e
guarda regras. O broker clássico é só o carteiro.</p>

${quando(
  [
    "Os servidores mudam de endereço o tempo todo (autoescala, deploy).",
    "Você quer um ponto para localizar, balancear e autenticar as chamadas.",
  ],
  [
    "Dois ou três serviços de endereço fixo: uma variável de ambiente resolve.",
    "Não dá para deixar o broker redundante: ele vira ponto único de falha.",
  ],
)}
<p><b>Parentes no livro:</b> cliente-servidor (capítulo 18) e a descoberta de serviço dos microsserviços (14).</p>

<h3>3. Primário-réplica (líder e seguidores)</h3>
<p>Várias cópias dos mesmos dados, mas só uma aceita escrita: o <b>primário</b> (ou líder). Ele registra cada mudança num log
(o WAL no Postgres, o binlog no MySQL) e as <b>réplicas</b> (seguidores) aplicam esse log, na mesma ordem. O nome antigo
era <i>master-slave</i>; muitos bancos e ferramentas trocaram para primário-réplica ou líder-seguidor. Não é coisa só de
banco relacional: o replica set do MongoDB funciona assim, e cada partição do Kafka tem um líder e seguidores.</p>

${fig(primarioReplica(), "Escritas vão para o primário; leituras podem ir para as réplicas, que recebem o log com algum atraso. Se o primário cai, uma réplica é eleita para assumir (<i>failover</i>).", "baixa")}

<p>Ela resolve dois problemas. <b>Ler mais</b>: relatórios e telas de consulta vão para as réplicas, e o primário fica livre
para as escritas (é a réplica de leitura do capítulo 11). <b>Não perder o banco</b>: se o primário cai, uma réplica é
promovida (<i>failover</i>). Duas escolhas pesam:</p>
<ul>
<li><b>Síncrona ou assíncrona.</b> Na síncrona, o primário só confirma a escrita depois que pelo menos uma réplica
confirmou: se essa réplica assumir, nada confirmado se perde, mas cada escrita fica mais lenta. Na assíncrona, ele confirma na hora e a réplica
pode ficar para trás (o <i>replication lag</i>). Daí o bug clássico: a pessoa salva o endereço novo e a tela, lendo da
réplica, mostra o antigo. Logo depois de escrever, leia do primário.</li>
<li><b>Quem decide o failover.</b> Se dois nós acham que são o primário ao mesmo tempo (<i>split brain</i>), os dois aceitam
escritas e os dados divergem. Por isso a troca é decidida por maioria: algoritmos de consenso como o <b>Raft</b> (usado pelo
etcd, onde o Kubernetes guarda o estado do cluster) só elegem um líder com os votos da maioria. Com 3 nós, o grupo aguenta
perder 1; com 5, aguenta perder 2. Bancos gerenciados na nuvem fazem o failover por você.</li>
</ul>
<p>Há também replicação com <b>vários primários</b> e <b>sem líder</b> (como no Cassandra): mais de um nó aceita escrita,
mas duas escritas no mesmo dado podem entrar em conflito, e alguém precisa decidir qual vence.</p>

${quando(
  [
    "Leituras muito mais numerosas que escritas (catálogo, feed, relatórios).",
    "O banco não pode parar quando uma máquina cai.",
  ],
  [
    "O gargalo é a escrita: réplica não ajuda; particione os dados (<i>sharding</i>).",
    "A tela precisa ler na hora o que gravou e a réplica é assíncrona: leia do primário.",
  ],
)}
<p><b>Parentes no livro:</b> monólito (capítulo 11, réplicas para escalar), N camadas físicas (18, a camada de dados) e CQRS
(21: réplica muda o volume de leitura, não o formato).</p>

<h3>4. Blackboard (quadro-negro)</h3>
<p>Também está no catálogo do <i>Pattern-Oriented Software Architecture</i>. Serve para problemas sem um algoritmo conhecido
de ponta a ponta, em que vários <b>especialistas</b> contribuem com pedaços da solução. São três peças: o <b>quadro</b>, um
estado compartilhado com as soluções parciais; os <b>especialistas</b> (<i>knowledge sources</i>), que leem o quadro e
escrevem nele sem falar uns com os outros; e o <b>controlador</b>, que decide quem age a seguir. A origem está no
Hearsay-II, um sistema de reconhecimento de fala dos anos 1970, da Universidade Carnegie Mellon: um especialista achava
sílabas no som, outro montava palavras, outro frases.</p>

${fig(blackboard(), "Os especialistas não falam entre si: cada um lê o quadro e escreve o que sabe; o controlador escolhe o próximo.", "baixa")}

<p>O estilo voltou com os <b>sistemas de vários agentes de IA</b>. Imagine a análise de um pedido de crédito: um agente lê os
documentos e anota a renda, outro calcula o risco, outro procura sinais de fraude, outro escreve o parecer. Todos trabalham
sobre o mesmo estado e um orquestrador decide quem age conforme o que já se sabe: se a fraude aparece cedo, o risco nem
precisa ser calculado. Num pipeline (capítulo 10), ao contrário, a ordem é fixa.</p>

${quando(
  [
    "Não há sequência fixa: o próximo passo depende do que já se descobriu.",
    "Vários especialistas (regras, modelos, agentes de IA) contribuem com partes.",
  ],
  [
    "O fluxo é conhecido: um pipeline (cap. 10) ou um orquestrador (cap. 23) basta.",
    "O resultado precisa ser previsível e fácil de testar: aqui a ordem muda a cada caso.",
  ],
)}
<p><b>Parentes no livro:</b> pipes and filters (capítulo 10, a ordem fixa), a topologia mediador dos eventos (20, alguém
coordena) e o modelo de atores (25, o oposto: nada compartilhado, só mensagens).</p>

<h3>5. Interpretador e DSL</h3>
<p>Algumas regras mudam mais rápido que o ciclo de deploy: tabela de frete, política de desconto, quem recebe qual
promoção. Em vez de escrevê-las no código, você cria uma pequena <b>linguagem do domínio</b> (DSL, <i>domain-specific
language</i>) e um <b>interpretador</b> que a executa. A regra vira dado: fica no banco ou num arquivo, é editada num painel
e passa a valer sem publicar o sistema. Você já usa várias: SQL, fórmulas de planilha, expressões regulares e os motores
de regras, como o Drools. Uma DSL <b>interna</b> é uma API fluente na própria linguagem (um <i>query builder</i>, por
exemplo), que só dev escreve; uma <b>externa</b> tem formato próprio, em texto ou JSON, como neste interpretador mínimo:</p>

${codigo(
  `
// regras-de-frete.ts: a regra é DADO (vem do banco ou de um painel); o código só interpreta
type Pedido = { uf: string; pesoKg: number; total: number }; // total em centavos
type Condicao =
  | { campo: "uf"; igual: string }
  | { campo: "pesoKg" | "total"; maiorQue: number };
type Regra = { nome: string; se: Condicao[]; frete: number }; // frete em centavos

const vale = (c: Condicao, p: Pedido) =>
  "igual" in c ? p[c.campo] === c.igual : p[c.campo] > c.maiorQue;

// a primeira regra cujas condições valem decide o frete
export function calcularFrete(regras: Regra[], p: Pedido) {
  const regra = regras.find((r) => r.se.every((c) => vale(c, p)));
  if (!regra) throw new Error("nenhuma regra de frete se aplica");
  return { frete: regra.frete, regra: regra.nome }; // guarde qual regra decidiu
}

// o que o time de operações edita no painel (salvo como JSON no banco)
const regras: Regra[] = [
  { nome: "grátis acima de R$ 300", se: [{ campo: "total", maiorQue: 30000 }], frete: 0 },
  { nome: "pesado", se: [{ campo: "pesoKg", maiorQue: 10 }], frete: 4900 },
  { nome: "estado de SP", se: [{ campo: "uf", igual: "SP" }], frete: 1500 },
  { nome: "padrão", se: [], frete: 2900 },
];`,
  "src/frete/regras-de-frete.ts",
)}

<p>O interpretador não muda; cada loja ou região ganha suas regras como dados. É o microkernel (capítulo 9) levado ao
extremo: plugins feitos de regras, não de código. Trate as regras como código: valide ao salvar, teste antes de publicar,
guarde as versões e nunca rode texto do painel com <code>eval</code> (o interpretador só faz o que você permitiu).</p>

${quando(
  [
    "As regras mudam toda semana e quem decide não é dev.",
    "Cada cliente, loja ou região tem a sua variação da mesma regra.",
  ],
  [
    "A regra muda duas vezes por ano: um <code>if</code> tipado e versionado basta.",
    "A DSL pede variáveis e laços: é uma linguagem reinventada, pior (<i>inner-platform effect</i>).",
  ],
)}
<p><b>Parentes no livro:</b> microkernel (capítulo 9). Num pipeline (10), cada filtro também pode ser configurado por regras.</p>

<h3>6. REST como estilo de arquitetura</h3>
<p>REST (<i>Representational State Transfer</i>) foi definido por Roy Fielding na sua tese de doutorado, em 2000, para
explicar por que a Web escala tão bem (Fielding também é um dos autores da especificação do HTTP). REST não é "usar JSON": é
um <b>estilo de arquitetura</b>, um conjunto de restrições. Quem aceita as restrições ganha as propriedades:</p>

${tabela(
  ["Restrição", "O que pede", "O que você ganha"],
  [
    ["<b>Cliente-servidor</b>", "Interface separada dos dados e das regras", "Cada lado evolui sozinho (capítulo 18)"],
    ["<b>Sem estado</b>", "Cada requisição traz tudo o que precisa (token, parâmetros)", "Qualquer cópia atende; escalar é pôr mais cópias"],
    ["<b>Cache</b>", "Cada resposta diz se pode ser guardada, e por quanto tempo", "Navegador e CDN respondem sem chegar ao servidor"],
    ["<b>Interface uniforme</b>", "Recursos com URL, os mesmos verbos para tudo, mensagens autodescritivas e links (hipermídia)", "Qualquer cliente conversa com qualquer servidor"],
    ["<b>Sistema em camadas</b>", "O cliente não sabe se fala com o servidor final ou com um intermediário", "Proxies, gateways e CDNs entram sem mudar o cliente"],
    ["<b>Código sob demanda</b> (opcional)", "O servidor pode mandar código para o cliente rodar", "O JavaScript das páginas web"],
  ],
  "compacta",
)}

<p>No dia a dia, "API REST" quase sempre quer dizer HTTP com JSON, URLs com substantivos (<code>/pedidos/42</code>) e os
verbos do HTTP (<code>GET</code>, <code>POST</code>, <code>DELETE</code>). Quase sempre falta a hipermídia (o
<b>HATEOAS</b>: a resposta traz links para o que dá para fazer a seguir, como <code>"cancelar": "/pedidos/42/cancelamento"</code>),
e o próprio Fielding já escreveu que, sem ela, a API não é REST. O modelo de maturidade de Richardson dá nome aos degraus:
nível 0 (um endereço só, tudo POST), 1 (recursos), 2 (verbos e status do HTTP) e 3 (hipermídia). Quase todas param no 2, e
tudo bem, desde que você saiba o custo: sem links, o cliente precisa conhecer as URLs e as regras de antemão.</p>

${quando(
  [
    "API pública ou para parceiros, usada por muitos clientes diferentes.",
    "Dados que viram recursos (pedidos, produtos) e ganham com o cache do HTTP.",
  ],
  [
    "Alto volume entre serviços internos: gRPC costuma render mais (cap. 14).",
    "Telas que juntam muitos recursos (GraphQL, BFF) ou tempo real (WebSocket).",
  ],
)}
<p><b>Parentes no livro:</b> cliente-servidor e N camadas (capítulo 18), de onde vêm o "sem estado", o cache e a CDN.</p>

<h3>7. Arquitetura reativa</h3>
<p>O <i>Reactive Manifesto</i>, na versão de 2014 (escrita por Jonas Bonér, criador do Akka, e colegas), resume em quatro
propriedades o que um sistema precisa para aguentar carga que varia e falhas inevitáveis. O objetivo é ser
<b>responsivo</b>: responder a tempo, sempre. Para isso, precisa ser <b>resiliente</b> (a falha fica contida numa parte e não
derruba o todo) e <b>elástico</b> (cresce e encolhe com a carga). O meio para chegar lá é ser <b>orientado a mensagens</b>:
as partes conversam por mensagens assíncronas, o que as isola e permite <b>backpressure</b> (o consumidor lento avisa o
produtor para segurar; capítulo 10).</p>

${fig(reativa(), "Da esquerda para a direita: o meio (mensagens assíncronas), como o sistema se comporta (resiliente e elástico) e o objetivo (responder sempre).")}

<p>Não é uma topologia, e sim qualidades que você monta com peças que já viu: atores e supervisão (capítulo 25), filas
(20), circuit breakers e autoescala (14 e 15). Num app de delivery na sexta à noite, um sistema reativo enfileira o excesso
de pedidos, sobe mais cópias, desliga a recomendação que travou e avisa "alta demanda", em vez de deixar o app girando.
E não confunda com <b>programação reativa</b> (RxJS, Project Reactor): ela é uma técnica para fluxos assíncronos dentro de
um processo; a arquitetura reativa é uma propriedade do sistema inteiro.</p>

${quando(
  [
    "Picos imprevisíveis e muitos usuários ao mesmo tempo (delivery, ingressos, jogos).",
    "Uma falha parcial não pode virar indisponibilidade total.",
  ],
  [
    "Sistema interno com carga estável: a complexidade não se paga.",
    "O time ainda não consegue seguir uma mensagem de ponta a ponta (tracing).",
  ],
)}

<p><b>Parentes no livro:</b> modelo de atores (capítulo 25), orientada a eventos (20) e o backpressure de pipes and filters
(10).</p>

<h3>8. Edge e Jamstack</h3>
<p>A ideia é fazer o máximo de trabalho <b>antes</b> do pedido e o mais <b>perto</b> do usuário possível. No Jamstack
(JavaScript, APIs e Markup), as páginas são geradas no build e publicadas numa CDN, que guarda cópias em servidores
espalhados pelo mundo: a <b>borda</b> (<i>edge</i>). Quem abre a página recebe HTML pronto do servidor mais próximo. O que é
dinâmico (preço, carrinho, login) vem de <b>APIs</b> chamadas pelo JavaScript da página. E as <b>funções na borda</b>
(Cloudflare Workers, Lambda@Edge e as da Vercel e da Netlify) rodam código curto nesses servidores: redirecionar por país,
testar duas versões de uma página, conferir um token.</p>

${fig(edge(), "A página sai pronta da borda mais próxima; só o que é dinâmico vai até as APIs, perto do banco.")}

<p>Uma variação comum são as <b>ilhas</b> (<i>islands</i>, popularizadas por frameworks como o Astro): a página é HTML
estático e só os pedaços interativos, como o carrinho, carregam JavaScript. Cuidado com os dados: uma função na borda de
Tóquio que consulta um banco em São Paulo devolve a latência que você queria tirar. E com milhares de páginas, regerar
tudo a cada mudança demora: use a geração incremental do framework.</p>

${quando(
  [
    "Conteúdo muito lido e pouco alterado: blog, documentação, catálogo.",
    "Público espalhado, em que o tempo de carregamento pesa nas vendas.",
  ],
  [
    "Páginas que mudam a cada pedido e leem muitos dados (painel, extrato).",
    "Lógica pesada: funções na borda têm limites curtos de CPU e memória, e nem toda biblioteca do Node roda nelas.",
  ],
)}
<p><b>Parentes no livro:</b> serverless (capítulo 15: funções na borda são funções serverless), micro-frontends (16:
fragmentos de cada time juntados na CDN) e a CDN das N camadas (18).</p>

<h3>9. Modelos multi-tenant (SaaS)</h3>
<p>Um SaaS atende muitas empresas clientes, os <b>tenants</b> (inquilinos), com o mesmo produto. A pergunta é quanto eles
compartilham. Os guias de SaaS da AWS usam três nomes, que viraram vocabulário comum:</p>

${fig(multiTenant(), "Três clientes (A, B e C) em cada modelo. No silo, cada um tem a sua pilha; no pool, tudo é compartilhado e separado por <code>tenant_id</code>; na ponte, o cliente grande (C) ganha banco próprio.", "baixa")}

${tabela(
  ["Modelo", "Bom para", "Cuidado"],
  [
    ["<b>Silo</b>: pilha ou banco por tenant", "Poucos clientes grandes; contrato que exige isolamento (saúde, bancos)", "Custo por cliente; N cópias para atualizar e monitorar"],
    ["<b>Pool</b>: tudo com <code>tenant_id</code>", "Muitos clientes pequenos, plano gratuito, produto no começo", "Um <code>where</code> esquecido vaza dados; vizinho barulhento"],
    ["<b>Bridge</b> (ponte): parte junta, parte separada (por camada ou por cliente)", "Planos diferentes, com isolamento vendido como recurso", "Dois jeitos de operar; rotear cada tenant para o lugar certo"],
  ],
  "compacta",
)}

<p>Em qualquer modelo, cada requisição descobre primeiro de qual tenant é (pelo subdomínio ou por um campo do token) e
leva essa informação até o banco, as filas e os logs. No pool, o <i>Row-Level Security</i> do Postgres faz o próprio banco filtrar as linhas pelo tenant, mesmo que alguém
esqueça o <code>where</code> (desde que a aplicação não conecte como superusuário nem como dona das tabelas). Contra o
<b>vizinho barulhento</b>, limite requisições por tenant, separe as filas pesadas e mova o cliente grande para um silo.</p>
<p><b>Parentes no livro:</b> células (capítulo 17: cada célula é um pool com uma fatia dos clientes) e o SaaS de clínicas
do capítulo 28.</p>

${dica(
  "E o DDD? E o event bus?",
  "<p>O <b>DDD</b> (<i>Domain-Driven Design</i>, do livro de Eric Evans de 2003) aparece em muita lista de \"arquiteturas\", mas não é uma: é um jeito de <b>modelar o negócio</b> e achar fronteiras, com o <b>contexto delimitado</b> (uma parte do negócio onde cada palavra tem um sentido só) e a <b>linguagem ubíqua</b> (o mesmo vocabulário na conversa e no código). Essas fronteiras viram módulos (capítulo 12), serviços (14 e a ficha 1) ou fatias (8), com núcleo hexagonal ou clean (6 e 7). E o <b>event bus em memória</b> está no capítulo 12: eventos entre módulos do mesmo processo.</p>",
)}

${dica(
  "Mesmo estilo, outro nome",
  "<p><i>Layered</i> ou <i>n-layer</i>: camadas lógicas (capítulo 4). <i>N-tier</i>: camadas físicas (18). <i>Ports and adapters</i>: hexagonal (6). <i>Plugin architecture</i>: microkernel (9). <i>Pipeline</i>: pipes and filters (10). <i>Modulith</i>: monólito modular (12). FaaS: as funções do serverless (15). <i>Cell-based</i>: células (17). <i>Pub/sub</i> e EDA: orientada a eventos (20). <i>Master-slave</i> e <i>leader-follower</i>: primário-réplica (ficha 3). <i>Hub-and-spoke</i>: um broker ou ESB no centro (ficha 2 e capítulo 13).</p>",
)}

<h3>Todas as fichas numa tabela</h3>
${tabela(
  ["Estilo", "Em uma linha", "Use quando", "Caps."],
  [
    ["<b>Baseada em serviços</b>", "Poucos serviços grossos, um banco dividido por dono.", "Deploy por domínio, sem dezenas de serviços.", "12, 14"],
    ["<b>Broker</b>", "Intermediário que acha o servidor e repassa.", "Servidores mudam de endereço.", "18, 14"],
    ["<b>Primário-réplica</b>", "Uma cópia escreve; as outras copiam o log.", "Muita leitura; banco que não pode cair.", "11, 18, 21"],
    ["<b>Blackboard</b>", "Especialistas num quadro comum; um controlador.", "Sem ordem fixa; vários agentes de IA.", "10, 25"],
    ["<b>Interpretador e DSL</b>", "Regras como dados, rodadas por um interpretador.", "Regras mudam mais rápido que o deploy.", "9"],
    ["<b>REST</b>", "Sem estado, cache, interface uniforme, camadas.", "API pública, recursos, cache do HTTP.", "18"],
    ["<b>Reativa</b>", "Responsiva, resiliente, elástica, por mensagens.", "Picos imprevisíveis e falha contida.", "20, 25, 10"],
    ["<b>Edge e Jamstack</b>", "HTML pronto na CDN, APIs e funções na borda.", "Conteúdo muito lido, público espalhado.", "15, 16, 18"],
    ["<b>Multi-tenant</b>", "Silo, pool ou ponte: quanto se compartilha.", "Todo SaaS (escolha um ou misture).", "17, 28"],
  ],
  "compacta",
)}

${lembre([
  "Muitos nomes, poucas ideias: quase tudo aqui é variação de um capítulo do livro. Diante de um nome novo, pergunte se ele organiza o código, divide o sistema ou decide como as partes conversam (capítulo 3).",
  "A baseada em serviços é o meio-termo mais útil da lista: poucos serviços grossos, deploy separado, um banco dividido por dono e transações locais.",
  "Mesma palavra, ideias diferentes: \"broker\" pode ser o padrão, um broker de mensagens (capítulo 20) ou um ESB (13); \"REST\" pode ser o estilo de Fielding ou só HTTP com JSON. Pergunte qual.",
])}
`;
