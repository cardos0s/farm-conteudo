// Capítulo 3: O mapa das arquiteturas. Capítulo conceitual da parte I (não segue o molde "quando usar /
// medidor" dos capítulos de arquitetura): as três famílias de decisão com o grande mapa, um sistema com
// uma escolha de cada família, o espectro monólito → serverless, a tabela de todas as arquiteturas
// (capítulos 4 a 26), como ler o medidor e um roteiro de leitura.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, caminho, claro, cor, engrenagem, etiqueta, fila, linha, nuvem, passo, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Hexágono achatado (o mesmo desenho do capítulo 6). */
function hexagono(cx, cy, r, o = {}) {
  const pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((Math.PI / 3) * i), cy + r * 0.82 * Math.sin((Math.PI / 3) * i)]);
  return caminho(`M${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L")} Z`, { preench: o.preench ?? claro.amarelo, hachura: o.hachura ?? "solid", espessura: o.espessura ?? 2 });
}

/** Diagrama 1: o mapa. As arquiteturas dos capítulos 4 a 26 em três colunas, uma por pergunta. */
function mapa() {
  semear("mapa-1");
  let s = "";
  const colunas = [
    {
      x: 8,
      forte: cor.azul,
      leve: claro.azul,
      titulo: "O código por dentro",
      pergunta: "como organizar o código?",
      itens: [
        [4, "Camadas"],
        [5, "MVC, MVP e MVVM"],
        [6, "Hexagonal"],
        [7, "Clean e Onion"],
        [8, "Vertical Slice"],
        [9, "Microkernel"],
        [10, "Pipes and Filters"],
      ],
    },
    {
      x: 264,
      forte: cor.verde,
      leve: claro.verde,
      titulo: "O sistema por fora",
      pergunta: "em quantas partes vai ao ar?",
      itens: [
        [11, "Monólito"],
        [12, "Monólito modular"],
        [13, "SOA"],
        [14, "Microsserviços"],
        [15, "Serverless"],
        [16, "Micro-frontends"],
        [17, "Células"],
      ],
    },
    {
      x: 520,
      forte: cor.laranja,
      leve: claro.laranja,
      titulo: "Comunicação e dados",
      pergunta: "como as partes conversam?",
      itens: [
        [18, "Cliente-servidor"],
        [19, "Peer-to-peer"],
        [20, "Orientada a eventos"],
        [21, "CQRS"],
        [22, "Event Sourcing"],
        [23, "Sagas"],
        [24, "Space-based"],
        [25, "Modelo de atores"],
        [26, "Arquiteturas de dados"],
      ],
    },
  ];
  const W = 228, topo = 82, fim = 418, h = 32;
  for (const c of colunas) {
    s += ret(c.x, 8, W, 62, { preench: c.leve, espessura: 2.2, gap: 6 });
    s += txt(c.x + W / 2, 29, c.titulo, { tam: 18, halo: 5 });
    s += txt(c.x + W / 2, 53, c.pergunta, { tam: 15, cor: cor.tinta, halo: 5 });
    const passoY = (fim - topo - h) / (c.itens.length - 1);
    c.itens.forEach(([n, nome], i) => {
      const y = topo + i * passoY;
      s += ret(c.x, y, W, h, { preench: "#ffffff", hachura: "solid", cor: c.forte, espessura: 1.6 });
      s += passo(c.x + 19, y + h / 2, String(n), c.forte);
      s += txt(c.x + 40, y + h / 2 + 1, nome, { tam: 16, ancora: "start" });
    });
  }
  // o "+" entre as famílias: elas se somam, não competem
  s += txt(250, 39, "+", { tam: 30, cor: cor.cinza });
  s += txt(506, 39, "+", { tam: 30, cor: cor.cinza });
  s += txt(380, 444, "um sistema real escolhe (pelo menos) uma resposta de cada coluna", { tam: 17, cor: cor.vermelho });
  return quadro(760, 460, s);
}

/** Diagrama 2: um app de delivery com uma escolha de cada família. */
function umDeCada() {
  semear("mapa-2");
  let s = "";
  const servicos = [
    ["Pedidos", 30],
    ["Pagamentos", 280],
    ["Entregas", 530],
  ];
  for (const [nome, x] of servicos) {
    s += bloco(x, 14, 200, 156, nome, { preench: claro.verde, hachura: "solid", topo: true, tam: 18 });
    s += hexagono(x + 72, 106, 52);
    s += txt(x + 72, 106, "núcleo", { tam: 16 });
    s += banco(x + 136, 80, 48, 54, "BD", { preench: claro.violeta, tam: 15 });
    s += linha([[x + 116, 106], [x + 136, 106]], { espessura: 1.6 });
  }
  // eventos pela fila: Pedidos publica, Pagamentos ouve e publica, Entregas ouve
  const y1 = 174, y2 = 230;
  s += seta(130, y1, 130, y2, { cor: cor.laranja, espessura: 2 });
  s += txt(142, 202, "PedidoCriado", { tam: 15, cor: cor.laranja, ancora: "start" });
  s += seta(345, y2, 345, y1, { cor: cor.laranja, espessura: 2 });
  s += seta(415, y1, 415, y2, { cor: cor.laranja, espessura: 2 });
  s += txt(427, 202, "PagamentoAprovado", { tam: 15, cor: cor.laranja, ancora: "start" });
  s += seta(640, y2, 640, y1, { cor: cor.laranja, espessura: 2 });
  s += fila(30, 232, 700, 34, "fila / broker de eventos");
  // legenda: cada cor é uma família
  s += etiqueta(130, 322, "por fora: microsserviços", { preench: claro.verde, tam: 15 });
  s += etiqueta(380, 322, "por dentro: hexagonal", { preench: claro.amarelo, tam: 15 });
  s += etiqueta(630, 322, "comunicação: eventos", { preench: claro.laranja, tam: 15 });
  return quadro(760, 342, s);
}

/** Diagrama 3: o espectro monólito → monólito modular → microsserviços → serverless. */
function espectro() {
  semear("mapa-3");
  let s = "";
  const cs = [190, 350, 510, 670];
  // destaque das duas primeiras posições
  s += ret(112, 30, 316, 222, { tracejado: true, cor: cor.azul, espessura: 1.6 });
  s += etiqueta(270, 16, "comece por aqui", { preench: claro.azul, tam: 15 });
  ["Monólito", "Monólito modular", "Microsserviços", "Serverless"].forEach((n, i) => (s += txt(cs[i], 48, n, { tam: 17 })));
  // 1. monólito: um bloco só
  s += bloco(cs[0] - 55, 64, 110, 100, "um app só", { preench: claro.azul, tam: 16 });
  // 2. monólito modular: o mesmo bloco, com módulos por dentro
  s += ret(cs[1] - 55, 64, 110, 100, { preench: claro.azul, espessura: 2, gap: 6 });
  ["pedidos", "pagamentos", "catálogo"].forEach((m, i) => {
    s += ret(cs[1] - 46, 71 + i * 30, 92, 25, { preench: "#ffffff", hachura: "solid", espessura: 1.3 });
    s += txt(cs[1], 84 + i * 30, m, { tam: 15 });
  });
  // 3. microsserviços: várias peças pequenas ligadas pela rede
  const mx = cs[2];
  const tr = { cor: cor.cinza, espessura: 1.4, tracejado: true };
  s += linha([[mx - 20, 84], [mx + 20, 84]], tr);
  s += linha([[mx - 20, 144], [mx + 20, 144]], tr);
  s += linha([[mx - 41, 102], [mx - 41, 126]], tr);
  s += linha([[mx + 41, 102], [mx + 41, 126]], tr);
  for (const [x, y] of [[mx - 62, 66], [mx + 20, 66], [mx - 62, 126], [mx + 20, 126]]) s += ret(x, y, 42, 36, { preench: claro.verde, hachura: "solid", espessura: 1.8 });
  // 4. serverless: funções dentro da nuvem do provedor
  s += nuvem(cs[3] - 78, 68, 156, 94, "");
  s += engrenagem(cs[3] - 38, 136, 10);
  s += engrenagem(cs[3], 112, 10);
  s += engrenagem(cs[3] + 38, 136, 10);
  // linhas de comparação
  const linhas = [
    ["deploys", ["1", "1", "1 por serviço", "1 por função"]],
    ["fronteiras", ["só convenção", "módulos vigiados", "rede (APIs)", "rede e eventos"]],
    ["servidores", ["seus", "seus", "seus, muitos", "do provedor"]],
  ];
  linhas.forEach(([rot, vals], i) => {
    const y = 188 + i * 24;
    s += txt(12, y, rot, { tam: 15, cor: cor.cinza, ancora: "start" });
    vals.forEach((v, j) => (s += txt(cs[j], y, v, { tam: 15 })));
  });
  // a troca, de ponta a ponta
  s += txt(122, 274, "menos peças: simples de operar", { tam: 16, cor: cor.azul, ancora: "start" });
  s += txt(740, 274, "deploy e escala por parte", { tam: 16, cor: cor.violeta, ancora: "end" });
  s += seta(122, 294, 740, 294, { duplo: true, espessura: 2 });
  return quadro(760, 308, s);
}

const D = "Por dentro", F = "Por fora", C = "Comunicação";

export default `
${resumo(
  "Existem dezenas de arquiteturas, mas elas respondem a só <b>três perguntas</b>: como organizar o código por dentro, em quantas partes o sistema vai para o ar e como essas partes conversam e guardam dados. Todo sistema real tem uma resposta para cada uma.",
  "Abrir um restaurante pede três decisões: como organizar a cozinha (estações de trabalho), quantas unidades abrir (uma casa grande ou várias filiais) e como os pedidos circulam (comanda de papel, tela na cozinha, entregador). Ninguém pergunta \"estações ou filiais?\": são perguntas diferentes, e todo restaurante responde as três.",
)}

<p>Listas na internet costumam colocar lado a lado "camadas, microsserviços, eventos, hexagonal, serverless", como se fossem
pratos do mesmo cardápio. Não são. Perguntar "hexagonal ou microsserviços?" é como perguntar "cozinha em estações ou três
filiais?": dá para ter as duas coisas, e muita empresa tem. Este capítulo junta tudo o que vem no livro num mapa só, para você
saber de qual pergunta cada arquitetura é resposta.</p>

${fig(mapa(), "As arquiteturas dos capítulos 4 a 26, agrupadas pela pergunta que respondem. O número na bolinha é o capítulo.", "grande")}

<h3>Três perguntas, três famílias</h3>
<p>Cada parte do meio do livro responde a uma pergunta. Elas mexem em coisas diferentes e são sentidas por pessoas
diferentes:</p>

${tabela(
  ["Família", "A pergunta", "O que muda quando você decide", "Caps."],
  [
    ["<b>O código por dentro</b><br>parte II", "Como organizar o código de uma aplicação?", "Pastas, imports, onde mora a regra de negócio, como testar. Quem sente primeiro: os devs.", "4 a 10"],
    ["<b>O sistema por fora</b><br>parte III", "Em quantas partes o sistema vai para o ar?", "Quantos deploys, servidores e bancos existem, e qual time é dono de cada parte. Quem sente: devs, operação e a conta da nuvem.", "11 a 17"],
    ["<b>Comunicação e dados</b><br>parte IV", "Como as partes conversam e guardam dados?", "Chamada direta ou mensagem, onde cada dado mora, quanto atraso é aceitável. Quem sente: o usuário (lentidão, dado desatualizado) e quem depura.", "18 a 26"],
  ],
)}

<p><b>Teste rápido para classificar uma decisão.</b> Se ela muda pastas e imports, mas o sistema continua indo para o ar do
mesmo jeito, é <b>por dentro</b>. Se muda quantas coisas vão para o ar separadas, é <b>por fora</b>. Se muda como uma
informação viaja de uma parte para outra, ou onde ela fica guardada, é <b>comunicação e dados</b>.</p>

${dica(
  "As fronteiras não são muros",
  "<p>Algumas arquiteturas aparecem em mais de uma família. Eventos ligam módulos dentro de um monólito ou serviços espalhados pela nuvem. CQRS pode ser só duas classes no mesmo código ou dois bancos separados. O livro coloca cada uma onde ela mais pesa, e o capítulo dela mostra as variações.</p>",
)}

<h3>Um sistema, uma resposta de cada família</h3>
<p>Pegue um app de delivery grande, com vários times. <b>Por fora</b>, ele é dividido em microsserviços: Pedidos, Pagamentos
e Entregas vão para o ar separados, cada um com seu banco. <b>Por dentro</b>, cada serviço usa hexagonal: as regras ficam no
núcleo, e banco e fila entram como adaptadores. <b>Entre eles</b>, a conversa é por eventos: Pedidos publica
<code>PedidoCriado</code>, Pagamentos reage e publica <code>PagamentoAprovado</code>, e Entregas reage a esse.</p>

${fig(umDeCada(), "Três decisões no mesmo desenho: microsserviços por fora, hexagonal dentro de cada serviço e eventos entre eles.")}

<p>Trocar uma das três não obriga a trocar as outras. O mesmo app poderia ser um monólito modular por fora, com hexagonal nos
módulos e eventos entre eles, só que dentro do mesmo processo. Outros exemplos:</p>

${tabela(
  ["Sistema (exemplo)", "Por dentro", "Por fora", "Comunicação e dados"],
  [
    ["App de agendamento para salões, 3 devs", "Camadas", "Monólito", "Cliente-servidor: o app chama uma API REST"],
    ["App de delivery regional, 6 devs (o do capítulo 2)", "Camadas no cardápio; hexagonal em pagamentos", "Monólito modular", "API REST para o app; eventos entre módulos"],
    ["Banco digital, dezenas de times", "Hexagonal ou clean em cada serviço", "Microsserviços", "Eventos, sagas e CQRS no extrato"],
    ["Relatórios gerados a partir de arquivos enviados", "Pipes and filters", "Serverless", "Eventos: arquivo novo dispara o fluxo"],
  ],
)}

<p>Repare em duas coisas. Primeiro, a resposta pode ser a mais simples: camadas, monólito e uma API REST é uma combinação
muito comum e atende bem a muitos sistemas. Segundo, dá para usar mais de uma resposta na mesma família: o cardápio, quase um
cadastro, fica em camadas; pagamentos, cheio de regra, ganha hexagonal. O capítulo 29 traz receitas completas.</p>

${pratica(
  "No mundo real",
  "<p>Casos públicos mostram combinações bem diferentes. A <b>Shopify</b> manteve seu grande monólito Rails e o organizou em módulos com fronteiras vigiadas pela ferramenta Packwerk: por fora, monólito modular (capítulo 12). A <b>Netflix</b> é conhecida pelos microsserviços, e o time de estúdio contou num artigo de 2020 que adotou hexagonal dentro dos seus apps: microsserviços por fora, hexagonal por dentro. E o <b>WhatsApp</b> é conhecido por usar Erlang, linguagem feita de processos isolados que só trocam mensagens, a ideia do modelo de atores (capítulo 25).</p>",
)}

<h3>O espectro: do monólito ao serverless</h3>
<p>Quatro arquiteturas da parte III formam uma linha contínua. O que muda de uma para a outra é o tamanho da peça que vai
para o ar sozinha, a <b>unidade de deploy</b>: o sistema inteiro; o sistema inteiro, mas com módulos separados por dentro; um
serviço por parte do negócio; uma função por tarefa.</p>

${fig(espectro(), "Para a direita, peças menores e mais independentes; para a esquerda, menos peças para cuidar.")}

<p>Andar para a direita compra <b>independência</b>: cada time publica a sua parte sem esperar os outros, e a parte mais
usada escala sozinha. O preço vem com a rede: chamadas que falham ou demoram, dados espalhados que precisam continuar
consistentes (capítulo 23) e erros que atravessam vários serviços. No serverless, o provedor cuida dos
servidores e da escala, mas você ganha limites de tempo de execução, a partida a frio (<i>cold start</i>: a demora extra
quando o provedor precisa ligar uma instância nova) e mais dependência do provedor (capítulo 15).</p>

<p>Não é uma escada que todo sistema precisa subir: dá para parar em qualquer ponto, misturar (um monólito com uma ou duas
funções serverless é comum) e até voltar uma casa. A maioria dos sistemas vive bem nas duas primeiras posições.</p>

${dica(
  "E SOA, micro-frontends e células?",
  "<p>As outras três da parte III não são pontos dessa linha. <b>SOA</b> (capítulo 13) é a antecessora dos microsserviços: serviços maiores, feitos para reuso entre sistemas da empresa e muitas vezes ligados por um barramento central (ESB). <b>Micro-frontends</b> (16) levam a divisão por times para a interface. <b>Células</b> (17) são cópias isoladas do conjunto inteiro, cada uma com uma parte dos clientes: se uma cai, as outras seguem.</p>",
)}

<h3>Todas as arquiteturas do livro</h3>
<p>O índice do mapa, para consultar quando um nome aparecer numa conversa ("Comunicação" = comunicação e dados).</p>

${tabela(
  ["Arquitetura", "Família", "O que é, em uma linha", "Cap."],
  [
    ["<b>Camadas</b>", D, "Código empilhado: tela, negócio e dados.", "4"],
    ["<b>MVC, MVP e MVVM</b>", D, "Separam tela, dados e a lógica que liga os dois.", "5"],
    ["<b>Hexagonal</b>", D, "Núcleo com portas; banco e HTTP viram adaptadores.", "6"],
    ["<b>Clean e Onion</b>", D, "Domínio no centro dos anéis; dependências para dentro.", "7"],
    ["<b>Vertical Slice</b>", D, "Código por funcionalidade, não por camada técnica.", "8"],
    ["<b>Microkernel</b>", D, "Núcleo pequeno; o resto entra como plugin (VS Code).", "9"],
    ["<b>Pipes and Filters</b>", D, "Dados passam por etapas, como no <code>|</code> do terminal.", "10"],
    ["<b>Monólito</b>", F, "Uma aplicação, um deploy e, em geral, um banco.", "11"],
    ["<b>Monólito modular</b>", F, "Um deploy só, com módulos de fronteiras vigiadas.", "12"],
    ["<b>SOA</b>", F, "Serviços da empresa para reuso, muitas vezes via ESB.", "13"],
    ["<b>Microsserviços</b>", F, "Serviços pequenos, com deploy e dados próprios.", "14"],
    ["<b>Serverless</b>", F, "Funções sob demanda; servidores e escala do provedor.", "15"],
    ["<b>Micro-frontends</b>", F, "Interface em pedaços que cada time publica sozinho.", "16"],
    ["<b>Células</b>", F, "Cópias isoladas do sistema; a falha fica numa célula.", "17"],
    ["<b>Cliente-servidor</b>", C, "Cliente pede, servidor responde; N camadas físicas.", "18"],
    ["<b>Peer-to-peer</b>", C, "Cada nó é cliente e servidor (como no BitTorrent).", "19"],
    ["<b>Orientada a eventos</b>", C, "Partes avisam \"isso aconteceu\"; quem quiser, reage.", "20"],
    ["<b>CQRS</b>", C, "Modelos separados para escrever e para ler.", "21"],
    ["<b>Event Sourcing</b>", C, "Guarda os eventos, não só o estado atual.", "22"],
    ["<b>Sagas</b>", C, "Operação entre serviços em passos, com compensação.", "23"],
    ["<b>Space-based</b>", C, "Dados em memória replicada, para picos extremos.", "24"],
    ["<b>Modelo de atores</b>", C, "Unidades isoladas que só se falam por mensagens.", "25"],
    ["<b>Arquiteturas de dados</b>", C, "Lambda, Kappa, Lakehouse, Data Mesh: grandes volumes.", "26"],
  ],
  "compacta",
)}

<h3>Como ler o medidor</h3>
<p>Você viu no capítulo 1 que cada arquitetura dos capítulos 4 a 26 ganha um medidor: quatro notas de 1 a 5 e uma faixa de
tamanho de time. Este é o do monólito modular (capítulo 12):</p>

${medidor({ complexidade: 2, escala: 4, operacao: 2, aprendizado: 3, time: "de 1 a vários times; ponto ideal: times médios" })}

<p>Lendo nota por nota: <b>complexidade 2</b>, porque dá para começar com uma pasta por módulo e uma regra de quem pode
importar quem; <b>escala 4</b>, porque aguenta muito código e vários times antes de pedir serviços separados; <b>operar 2</b>,
porque continua sendo um deploy e um banco; <b>aprendizado 3</b>, porque o difícil não é a ferramenta, é desenhar boas
fronteiras entre os módulos.</p>

${tabela(
  ["Nota", "1 quer dizer", "3 quer dizer", "5 quer dizer"],
  [
    ["<b>Complexidade para começar</b>", "Começa hoje, sem estrutura nova", "Pede convenções e interfaces desde o primeiro dia", "Pede infraestrutura e padrões antes da primeira funcionalidade"],
    ["<b>Até onde escala</b>", "Serve a sistemas pequenos ou a uma parte isolada", "Cresce em carga, código e gente, com cuidado", "O limite quase sempre está em outro lugar (banco, orçamento, times)"],
    ["<b>Custo de operar</b>", "Nada a mais no ar além da aplicação", "Algumas peças a mais para monitorar (fila, cache, réplicas)", "Muitas peças, plantão e um time de plataforma"],
    ["<b>Curva de aprendizado</b>", "Dá para entender lendo o código", "Pede conceitos novos (injeção de dependência, eventos)", "Pede experiência prática com sistemas distribuídos"],
  ],
  "compacta",
)}

<h4>Quatro regras de leitura</h4>
<ul>
<li><b>Leia o custo de operar junto com o tamanho de time.</b> Nota 4 ou 5 em operar com um time de cinco pessoas é sinal
vermelho: alguém vai cuidar mais da infraestrutura do que do produto.</li>
<li><b>Escala alta não é meta.</b> Se o seu sistema precisa de 2, a arquitetura nota 5 cobra o preço de 5 (em complexidade e
operação) e entrega uma folga que você não vai usar.</li>
<li><b>Numa combinação, as famílias pesam diferente.</b> As arquiteturas da parte II quase não mexem no custo de operar
(hexagonal, clean e vertical slice têm nota 1), porque não colocam nada novo no ar. Quem decide a conta de operação são as
escolhas das partes III e IV.</li>
<li><b>A curva depende do time.</b> As notas valem para um time típico. Quem já operou eventos em produção sente menos a curva
do capítulo 20; quem nunca operou, sente mais.</li>
</ul>

<h3>Confusões comuns</h3>
<ul>
<li><b>Comparar peças de famílias diferentes</b>: "hexagonal ou microsserviços?", "eventos ou monólito?". Elas não competem;
dá para ter as duas.</li>
<li><b>Achar que eventos exigem microsserviços</b>: módulos de um monólito podem publicar e ouvir eventos dentro do mesmo
processo (capítulos 12 e 20).</li>
<li><b>Achar que cada família pede algo sofisticado</b>: camadas (por dentro) e monólito (por fora) são respostas completas,
não etapas a superar.</li>
<li><b>Ler "serverless" como "sem servidor"</b>: o servidor existe; ele só é do provedor, que cuida dele e cobra pelo uso.</li>
</ul>

${alerta(
  "Camada não é camada",
  "<p>Em português, a mesma palavra serve para duas coisas. As <b>camadas lógicas</b> (em inglês, <i>layers</i>, capítulo 4) são divisões do código: apresentação, negócio e dados, que podem rodar todas no mesmo processo. As <b>camadas físicas</b> (<i>tiers</i>, capítulo 18) são máquinas ou processos separados: navegador, servidor de aplicação, servidor de banco. Um monólito web organizado em camadas lógicas costuma rodar em três camadas físicas.</p>",
)}

<h3>Roteiro de leitura</h3>
<p>Cada capítulo se lê sozinho, então o livro funciona como consulta. Se você prefere uma ordem, aqui vão dois caminhos.</p>

<h4>Se você está começando</h4>
${passos([
  "<b>Capítulos 1 a 3</b> (você está aqui): o vocabulário, os critérios e o mapa.",
  "<b>4 (camadas) e 5 (MVC)</b>: o que você provavelmente já usa no trabalho ou nos tutoriais, agora com nome e regras.",
  "<b>11 (monólito), 12 (monólito modular) e 18 (cliente-servidor)</b>: onde a maioria dos sistemas vive, e como front, API e banco conversam.",
  "<b>6 (hexagonal) e 8 (vertical slice)</b>: duas formas de organizar o código quando a regra de negócio cresce.",
  "<b>14 (microsserviços) e 20 (eventos)</b>: os temas mais falados no mercado e em entrevistas, com o preço de cada um.",
  "<b>28 (árvore de decisão) e 33 (cola final)</b>: para fechar. O resto (21 a 26, por exemplo) fica para quando um problema pedir.",
])}

<h4>Se você já trabalha com isso</h4>
${passos([
  "<b>2 (critérios) e este mapa</b>: alinhe o vocabulário de trocas que você vai usar para defender decisões.",
  "<b>27 (comparativo) e 28 (árvore de decisão)</b>: situe o sistema em que você trabalha hoje e veja se ele ainda faz sentido.",
  "<b>Os capítulos das peças que você já usa</b>: vá direto a \"vantagens e custos\" e \"erros comuns\", onde está o que os tutoriais não contam.",
  "<b>21 a 23 (CQRS, event sourcing e sagas)</b>: onde mais se erra quando o sistema fica distribuído.",
  "<b>29 a 32 (combinações, migração, anti-padrões e ADRs)</b>: para propor e registrar mudanças no sistema real sem parar a operação.",
])}

<h4>Por interesse</h4>
<ul>
<li><b>Front-end e mobile</b>: 5 (MVC, MVP e MVVM), 16 (micro-frontends) e 18 (cliente-servidor).</li>
<li><b>Dados e analytics</b>: 10 (pipes and filters), 20 (eventos) e 26 (arquiteturas de dados).</li>
<li><b>Alta escala e disponibilidade</b>: 17 (células), 24 (space-based) e 25 (modelo de atores).</li>
<li><b>Produtos com extensões e integrações</b>: 9 (microkernel) e 6 (hexagonal).</li>
</ul>

${pratica(
  "Exercício: o mapa do seu sistema",
  "<p>Pegue o sistema em que você trabalha (ou um projeto pessoal) e escreva uma linha por família, como no exemplo abaixo. Se uma linha ficar difícil de preencher, a resposta provavelmente é a mais simples, que só ainda não tinha nome. Guarde a ficha: ela vai servir nos capítulos 28 e 29.</p>",
)}

${codigo(
  `
Sistema:      app de delivery regional (6 devs)
Por dentro:   camadas no cardápio; hexagonal em pagamentos
Por fora:     monólito modular, um deploy por dia
Comunicação:  API REST para o app; eventos entre os módulos
Dados:        um Postgres, cada módulo dono das suas tabelas`,
  "o mapa do sistema em cinco linhas",
  { realce: false },
)}

${combina([
  [2, "Os critérios que decidem a escolha", "o que pesa em cada família"],
  [27, "Comparativo geral", "as notas lado a lado"],
  [28, "Árvore de decisão", "das perguntas à escolha"],
  [29, "Combinações que funcionam", "uma peça de cada família"],
  [11, "Monólito", "o ponto de partida do espectro"],
  [33, "Cola final", "o mapa numa página"],
])}

${lembre([
  "Três famílias, três perguntas: o código por dentro (parte II), o sistema por fora (parte III), comunicação e dados (parte IV). Peças de famílias diferentes não competem.",
  "Todo sistema real escolhe uma resposta de cada família, e a mais simples que resolve é uma resposta completa.",
  "No espectro do monólito ao serverless, cada passo para a direita compra independência e escala por parte, e paga em peças, rede e operação.",
])}
`;
