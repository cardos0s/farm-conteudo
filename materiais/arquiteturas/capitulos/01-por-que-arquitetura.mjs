// Capítulo 1: Por que arquitetura importa. Capítulo de abertura (não segue a estrutura dos capítulos de
// arquitetura): o que é arquitetura, arquitetura x design, a curva do custo de mudar, exemplos de decisões,
// "depende" bem respondido, arquitetura evolutiva, quem decide e como usar este livro.

import { alerta, dica, fig, lembre, medidor, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, curva, elipse, fila, linha, navegador, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Diagrama 1: o mesmo sistema em dois níveis de zoom (arquitetura x design de código). */
function doisZooms() {
  semear("por-que-arquitetura-1");
  let s = "";
  // títulos dos dois lados
  s += txt(215, 22, "arquitetura", { tam: 21, cor: cor.azul });
  s += txt(215, 48, "as partes e como elas se ligam", { tam: 15, cor: cor.cinza });
  s += txt(600, 22, "design de código", { tam: 21, cor: cor.violeta });
  s += txt(600, 48, "o que tem dentro de cada parte", { tam: 15, cor: cor.cinza });

  // lado esquerdo: visão de longe
  s += navegador(12, 134, 104, 72, "app");
  s += seta(118, 170, 158, 170, { espessura: 2 });
  s += ret(160, 70, 230, 198, { tracejado: true, espessura: 1.6 });
  s += txt(275, 89, "sistema de delivery", { tam: 15, cor: cor.cinza });
  s += bloco(180, 104, 190, 42, "Pedidos", { preench: claro.amarelo, tam: 16 });
  s += bloco(180, 156, 190, 42, "Pagamentos", { preench: claro.azul, tam: 16 });
  s += bloco(180, 208, 190, 42, "Entregas", { preench: claro.azul, tam: 16 });
  s += seta(225, 270, 225, 290, { espessura: 1.8 });
  s += banco(185, 292, 80, 64, "Postgres", { preench: claro.violeta, tam: 15 });
  s += seta(330, 270, 330, 300, { espessura: 1.8 });
  s += fila(292, 302, 76, 30, "fila");
  s += txt(66, 318, "caro de\nmudar", { tam: 18, cor: cor.vermelho });

  // a lupa: linhas do módulo Pedidos até o painel da direita
  s += linha([[370, 104], [455, 70]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += linha([[370, 146], [455, 352]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });

  // lado direito: visão de perto (dentro de Pedidos)
  s += ret(455, 70, 290, 282, { preench: "#ffffff", hachura: "solid", espessura: 2 });
  s += txt(600, 92, "dentro de Pedidos", { tam: 15, cor: cor.cinza });
  s += bloco(475, 110, 118, 44, "CriarPedido", { preench: claro.amarelo, tam: 15 });
  s += bloco(622, 110, 104, 44, "Pedido", { preench: claro.amarelo, tam: 15 });
  s += seta(595, 132, 620, 132, { espessura: 1.6 });
  s += seta(534, 156, 534, 178, { espessura: 1.6 });
  s += bloco(475, 180, 251, 42, "calcularFrete(itens, cep)", { preench: claro.verde, tam: 15 });
  s += seta(534, 224, 534, 246, { espessura: 1.6 });
  s += bloco(475, 248, 251, 42, "RepositorioDePedidos", { preench: claro.violeta, tam: 15 });
  s += txt(600, 320, "barato de mudar", { tam: 18, cor: cor.verde });
  return quadro(760, 366, s);
}

/** Diagrama 2: a curva do custo de mudar ao longo do tempo. */
function curvaDoCusto() {
  semear("por-que-arquitetura-2");
  let s = "";
  // eixos
  s += seta(80, 244, 555, 244, { espessura: 2 });
  s += seta(80, 244, 80, 26, { espessura: 2 });
  s += txt(94, 22, "custo para mudar a decisão", { tam: 15, ancora: "start" });
  s += txt(555, 290, "tempo de vida do sistema", { tam: 15, ancora: "end" });
  const marcas = [
    [125, "semana 1"],
    [240, "mês 6"],
    [370, "ano 2"],
    [500, "ano 5"],
  ];
  for (const [x, rot] of marcas) {
    s += linha([[x, 238], [x, 250]], { espessura: 1.6 });
    s += txt(x, 266, rot, { tam: 15, cor: cor.cinza });
  }
  // as duas curvas
  s += curva([[86, 232], [180, 228], [300, 206], [420, 146], [535, 50]], { cor: cor.vermelho, espessura: 3.2 });
  s += curva([[86, 230], [250, 227], [400, 222], [535, 217]], { cor: cor.verde, espessura: 3.2 });
  // rótulos das curvas, à direita do fim de cada uma
  s += txt(565, 46, "arquitetura", { tam: 18, cor: cor.vermelho, ancora: "start" });
  s += txt(565, 72, "ex.: trocar o banco", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += txt(565, 202, "design de código", { tam: 18, cor: cor.verde, ancora: "start" });
  s += txt(565, 228, "ex.: renomear função", { tam: 15, cor: cor.cinza, ancora: "start" });
  // anotações
  s += txt(150, 160, "no começo,\nerrar é barato", { tam: 15, cor: cor.cinza });
  s += seta(150, 184, 128, 220, { cor: cor.cinza, espessura: 1.4, ponta: 10 });
  s += txt(330, 96, "ano 5: a mesma troca\nvira meses de migração", { tam: 15, cor: cor.vermelho });
  s += seta(422, 104, 476, 104, { cor: cor.vermelho, espessura: 1.4, ponta: 10 });
  return quadro(760, 300, s);
}

/** Diagrama 3: o último momento responsável. */
function ultimoMomento() {
  semear("por-que-arquitetura-3");
  let s = "";
  // as duas curvas: o que você sabe sobe, as opções abertas descem
  s += curva([[60, 172], [220, 150], [380, 108], [540, 66], [690, 48]], { cor: cor.azul, espessura: 3 });
  s += curva([[60, 44], [220, 66], [380, 108], [540, 150], [690, 172]], { cor: cor.violeta, espessura: 3 });
  s += txt(60, 20, "opções ainda abertas", { tam: 16, cor: cor.violeta, ancora: "start" });
  s += txt(690, 22, "o que você sabe do problema", { tam: 16, cor: cor.azul, ancora: "end" });
  // linha do tempo
  s += linha([[380, 108], [380, 196]], { tracejado: true, cor: cor.verde, espessura: 2 });
  s += seta(30, 206, 690, 206, { espessura: 2.2 });
  s += txt(698, 206, "tempo", { tam: 15, cor: cor.cinza, ancora: "start" });
  // três momentos
  const momento = (x, titulo, l1, l2, c) =>
    elipse(x, 206, 18, 18, { preench: c, hachura: "solid", cor: c }) +
    txt(x, 240, titulo, { tam: 17, cor: c }) +
    txt(x, 264, l1, { tam: 15 }) +
    txt(x, 284, l2, { tam: 15 });
  s += momento(130, "cedo demais", "decide no chute,", "sabendo pouco", cor.laranja);
  s += momento(380, "último momento responsável", "já sabe o bastante", "e ainda pode escolher", cor.verde);
  s += momento(620, "tarde demais", "a decisão foi tomada", "por omissão", cor.vermelho);
  return quadro(760, 300, s);
}

export default `
${resumo(
  "Arquitetura de software é como o sistema é dividido, como as partes conversam e quais regras o time segue. Na prática, são as <b>decisões caras de mudar</b> depois que o sistema cresce.",
  "Numa casa, trocar o sofá ou a cor da parede se faz num fim de semana. Mudar o banheiro de lugar exige quebrar piso e refazer o encanamento. Arquitetura é a planta e o encanamento; o design de código é a decoração de cada cômodo.",
)}

<p>Todo sistema tem uma arquitetura, mesmo que ninguém tenha escolhido uma. Quando ninguém escolhe, ela aparece sozinha,
um atalho de cada vez, até virar o que Brian Foote e Joseph Yoder batizaram em 1997 de <b>Big Ball of Mud</b> (grande bola
de lama): tudo depende de tudo, e mexer num canto quebra outro bem longe dali (capítulo 31). O erro oposto também
existe: arquitetura demais (microsserviços para três devs, cinco camadas para um cadastro simples) cobra o custo de um
sistema grande sem trazer os ganhos. Este livro existe para você escolher a arquitetura de
propósito, sabendo o que cada opção entrega e o que ela cobra.</p>

${fig(doisZooms(), "O mesmo sistema em dois níveis de zoom. De longe, as partes e as ligações entre elas (arquitetura). De perto, as classes e funções de uma das partes (design de código).", "grande")}

<h3>O que é arquitetura de software</h3>
<p>Não existe definição única, mas as boas giram em torno de três ingredientes:</p>
<ul>
<li><b>Estrutura</b>: quais são as partes grandes do sistema (módulos, serviços, bancos de dados, filas, apps) e como
elas se ligam. É o famoso desenho de caixas e setas.</li>
<li><b>Decisões caras de mudar</b>: escolhas que, depois de meses de código e de dados em cima delas, levam semanas ou
meses para desfazer. Por exemplo: um banco de dados para o sistema todo ou um para cada serviço.</li>
<li><b>Princípios</b>: regras que o time segue para a estrutura não se desmanchar com o tempo. Por exemplo: "um módulo
nunca lê a tabela de outro" ou "regra de negócio não importa framework" (capítulo 6).</li>
</ul>
<p>Mark Richards e Neal Ford (<i>Fundamentals of Software Architecture</i>) acrescentam um quarto ingrediente: as <b>características</b> que o
sistema precisa ter (desempenho, disponibilidade, segurança...), assunto do capítulo 2.</p>

<h3>Arquitetura x design de código</h3>
<p>A fronteira entre os dois não é uma linha exata, mas existe um bom teste: <b>quanto custa mudar de ideia?</b> Se dá
para mudar numa tarde, em poucos arquivos, sem avisar ninguém, é design de código. Se exige mexer em muitos lugares,
migrar dados ou combinar com outros times, é arquitetura.</p>

${tabela(
  ["", "Arquitetura", "Design de código"],
  [
    ["<b>Pergunta típica</b>", "Monólito ou serviços? Qual banco? Síncrono ou assíncrono?", "Que classes criar? Que nome dar? Qual padrão usar aqui?"],
    ["<b>Alcance</b>", "O sistema todo, às vezes vários times", "Um módulo, um arquivo, uma função"],
    ["<b>Custo de mudar depois</b>", "Semanas ou meses, às vezes com migração de dados", "Minutos ou horas: uma refatoração"],
    ["<b>Quem sente um erro</b>", "Todo mundo, por anos", "Quem mexe naquele trecho"],
  ],
)}

<p>As duas importam. Os capítulos da parte II (camadas, hexagonal, clean...) ficam na fronteira: organizam o código por
dentro, mas viram regra para o time todo e custam caro para trocar depois de dois anos.</p>


<h3>A curva do custo de mudar</h3>
<p>Toda decisão fica mais cara de mudar com o tempo, porque mais código, mais dados e mais pessoas passam a depender
dela. O que muda de uma decisão para outra é a inclinação da curva.</p>

${fig(curvaDoCusto(), "No começo, as duas custam pouco. Com o tempo, a decisão de arquitetura dispara; a de design quase não sai do lugar.")}

<p>Na primeira semana, trocar MongoDB por PostgreSQL é uma tarde de trabalho: quase não há dados nem código. Dois anos
depois, com milhões de registros, relatórios e integrações em cima, a mesma troca vira um projeto de meses, com migração
de dados e risco de perder informação. Já renomear uma função custa quase o mesmo no primeiro dia e no quinto ano: o
editor faz isso por você.</p>
<p>A lição: gaste a sua atenção onde a curva é íngreme. Nas decisões baratas, não marque reunião.</p>

<h3>Exemplos de decisões arquiteturais</h3>
<p>Estas perguntas aparecem em quase todo projeto. Cada uma tem várias respostas boas, e o livro dedica capítulos a elas:</p>
${tabela(
  ["A decisão", "Opções comuns", "Onde ver"],
  [
    ["<b>Quantas partes</b>", "um monólito, um monólito modular ou vários serviços", "caps. 11 a 14"],
    ["<b>Organização do código</b>", "camadas, MVC, hexagonal, clean, vertical slice", "caps. 4 a 8"],
    ["<b>Dados</b>", "um banco para tudo ou um por serviço; relacional ou de documentos", "caps. 14, 21, 22 e 26"],
    ["<b>Comunicação</b>", "síncrona (chama e espera, como HTTP) ou assíncrona (envia e segue, como uma fila)", "caps. 18 e 20"],
    ["<b>Onde roda</b>", "servidores próprios, nuvem, contêineres ou funções serverless (sem servidor para administrar)", "caps. 15, 17 e 18"],
    ["<b>Consistência</b>", "uma transação só, sagas ou consistência eventual (os dados se acertam depois de alguns instantes)", "cap. 23"],
  ],
)}

${pratica(
  "Regra de bolso: isso é decisão de arquitetura?",
  "<p>Faça três perguntas. Desfazer isso daqui a um ano levaria mais de uma semana? Afeta mais de um módulo ou mais de um time? Mexe em dados guardados ou em contratos com outros sistemas (APIs, eventos)? Se alguma resposta for sim, trate como arquitetura: converse, compare opções e registre o porquê (capítulo 32). Se todas forem não, decida rápido e siga em frente.</p>",
)}

<h3>Por que a resposta honesta é "depende"</h3>
<p>Pergunte a uma pessoa experiente se microsserviços são melhores que um monólito e a resposta vai ser "depende". Não é
fuga: cada arquitetura compra uma coisa e paga com outra. Microsserviços compram <b>deploy</b> independente (cada time
coloca a sua versão nova no ar sem esperar os outros) e escala por parte; pagam com chamadas pela rede, mais coisas para
monitorar e dados espalhados. O monólito compra simplicidade e transações fáceis; paga quando dezenas de pessoas disputam o mesmo deploy.
Essa troca tem nome: <b>trade-off</b> (o que se ganha e o que se perde numa escolha). Para Richards e Ford, essa é a
primeira lei da arquitetura de software: tudo em arquitetura é um trade-off. Se parece que uma opção só tem vantagens,
é porque o custo dela ainda não apareceu.</p>

${pratica(
  "No mundo real",
  "<p>O Stack Overflow, um dos sites mais usados por devs no mundo, roda como um monólito em poucos servidores. A Shopify mantém um monólito Rails grande, dividido em módulos, com as fronteiras entre eles checadas pela ferramenta Packwerk. A Netflix é um dos exemplos mais citados de microsserviços. As três contaram essas escolhas em blogs e palestras de engenharia. Cada uma faz sentido no contexto da sua empresa, e dificilmente serviria para as outras duas.</p>",
)}

<p>Mas "depende" sozinho é resposta preguiçosa. A resposta boa diz <b>do que</b> depende e termina com uma escolha. Um
roteiro que funciona em reunião, em entrevista e em revisão de projeto:</p>
${passos([
  "<b>Contexto</b>: tamanho do time, carga esperada, prazo, o que não pode falhar.",
  "<b>Opções</b>: duas ou três alternativas reais, não só a da moda.",
  "<b>Trade-offs</b>: o que cada opção ganha e o que paga, em termos concretos (\"um deploy a mais por serviço\", e não \"é mais complexo\").",
  "<b>Escolha</b>: diga qual e por quê.",
  "<b>Gatilho de revisão</b>: o que faria você mudar de ideia.",
])}

${pratica(
  "Exemplo de resposta bem dada",
  "<p><i>\"Para o nosso app de delivery, com cinco devs e alguns milhares de pedidos por dia, eu começaria com um monólito modular (capítulo 12): um deploy, um banco, transações simples. Abrimos mão de escalar partes separadas, mas a carga de hoje não pede isso. Se virarmos três times disputando o mesmo deploy, ou se o rastreio de entregadores precisar escalar sozinho, separamos o módulo que estiver doendo num serviço.\"</i> Repare: contexto, trade-off, escolha e gatilho de revisão, tudo em poucas frases.</p>",
)}

<h3>Arquitetura evolutiva: decidir no último momento responsável</h3>
<p>Se as decisões grandes são caras de mudar, a tentação é decidir tudo no começo, num documento enorme. O problema: o
começo é quando você menos sabe. Ainda não sabe quantos usuários virão, quais partes vão mudar toda semana, onde vai doer.</p>
<p>A <b>arquitetura evolutiva</b> propõe outro caminho: a arquitetura muda junto com o sistema, em passos pequenos, e as
decisões caras são tomadas no <b>último momento responsável</b> (<i>last responsible moment</i>), o ponto em que você já
sabe o bastante para escolher bem e adiar mais começaria a sair caro.</p>

<p>Até esse momento chegar, o trabalho é manter as opções abertas:</p>
<ul>
<li><b>Esconda a decisão atrás de uma interface.</b> Se o banco ainda pode mudar, o resto do código fala com um
repositório, e não com o driver do banco (capítulo 6).</li>
<li><b>Separe em módulos antes de separar em serviços.</b> Módulos bem cortados viram serviços depois com bem menos dor
(capítulos 12 e 30).</li>
<li><b>Na dúvida, prefira o que é fácil de desfazer</b>: um deploy só, um banco gerenciado comum, uma fila a menos.</li>
<li><b>Proteja as decisões com checagens automáticas</b>: um teste na integração contínua (CI) que falha quando um
módulo importa o que não devia. A arquitetura evolutiva chama isso de <i>fitness function</i> (função de aptidão).</li>
<li><b>Registre o porquê</b> de cada decisão grande num ADR (registro de decisão de arquitetura, capítulo 32). Quando o
contexto mudar, você sabe o que revisar. Richards e Ford têm uma segunda lei para isso: o porquê é mais importante que o como.</li>
</ul>

${fig(ultimoMomento(), "Com o tempo você sabe mais, mas as opções se fecham. A decisão cara fica melhor perto do cruzamento.")}


${alerta(
  "Último momento responsável não é procrastinação",
  "<p>Adiar sem prazo também é decidir, só que por omissão. Se o time cresce e ninguém decide como dividir o sistema, ele se divide sozinho, do pior jeito. Combine <b>quando</b> a decisão precisa sair e o que vocês precisam descobrir até lá.</p>",
)}

<h3>Quem decide</h3>
<p>Muitas empresas têm alguém com o cargo de arquiteto ou arquiteta de software. Mas a arquitetura real é decidida por todo
mundo que escreve código: cada vez que alguém faz um módulo ler a tabela de outro "só dessa vez", a arquitetura mudou,
mesmo que nenhum diagrama mostre isso.</p>
<ul>
<li><b>Devs iniciantes e plenos</b>: seguem os princípios e são os primeiros a sentir quando eles atrapalham. Muita
decisão de arquitetura começa com um "isso aqui está doendo".</li>
<li><b>Tech leads e devs sêniores</b>: levantam as opções, puxam a discussão e registram a decisão.</li>
<li><b>Arquitetos, quando existem</b>: cuidam do que cruza vários times e mantêm o conjunto coerente.</li>
<li><b>Produto e negócio</b>: dizem o que importa (prazo, custo, o que pode ficar fora do ar). Sem isso, todo trade-off é chute.</li>
</ul>

${dica(
  "Lei de Conway",
  "<p>Em 1968, Melvin Conway observou que as organizações tendem a criar sistemas que copiam a sua própria estrutura de comunicação. Arquitetura e organização dos times andam juntas: se dois times precisam conversar toda hora para entregar qualquer coisa, a fronteira entre as partes deles provavelmente está no lugar errado. Há empresas que fazem o caminho inverso e montam os times no formato da arquitetura que querem (a <b>manobra inversa de Conway</b>, capítulos 2 e 14).</p>",
)}

<h3>Como usar este livro</h3>
<p>O livro tem cinco partes. As três do meio apresentam as arquiteturas, cada uma respondendo a uma pergunta diferente:</p>

${tabela(
  ["Parte", "A pergunta que ela responde", "Capítulos"],
  [
    ["<b>I</b> · Antes de escolher", "O que é arquitetura, quais critérios pesam e qual é o mapa geral?", "1 a 3"],
    ["<b>II</b> · O código por dentro", "Como organizar o código de uma aplicação?", "4 a 10"],
    ["<b>III</b> · O sistema por fora", "Em quantas partes dividir e como cada uma vai para o ar?", "11 a 17"],
    ["<b>IV</b> · Comunicação e dados", "Como as partes conversam e guardam dados?", "18 a 26"],
    ["<b>V</b> · Escolher, combinar e evoluir", "Qual usar, como combinar, como migrar e como registrar?", "27 a 33"],
  ],
)}

<p>As partes II, III e IV não competem entre si: um mesmo sistema tem uma resposta para cada uma. Um app de delivery pode
ser um monólito modular (parte III), com arquitetura hexagonal dentro de cada módulo (parte II), em que os módulos avisam
uns aos outros por eventos (parte IV). A parte V mostra como montar essas combinações.</p>

<h4>A estrutura de cada capítulo</h4>
<p>Do capítulo 4 ao 26, cada arquitetura aparece sempre na mesma ordem. Assim você vai direto ao que precisa:</p>
${passos([
  "<b>Em uma frase</b> e <b>pense assim</b>: a ideia central, uma analogia do dia a dia e, quando a origem é conhecida, de onde ela veio.",
  "<b>Diagrama</b> e <b>como funciona</b>: as peças e como elas se ligam.",
  "<b>Use quando</b> x <b>evite quando</b>, lado a lado, e o <b>medidor</b> de 1 a 5.",
  "<b>Como usar na prática</b>: estrutura de pastas, código em TypeScript e passo a passo.",
  "<b>Vantagens e custos</b>, <b>erros comuns</b>, um caso do <b>mundo real</b> e caixas com variações e confusões frequentes.",
  "<b>Combina com</b> (arquiteturas que andam junto) e <b>para lembrar</b> (os três pontos principais).",
])}

<h4>O medidor de 1 a 5</h4>
<p>Cada arquitetura recebe quatro notas de 1 a 5 e uma faixa de tamanho de time. As notas comparam as arquiteturas
entre si e são uma avaliação, não uma medição: 5 quer dizer "mais", não "melhor". Em escala, mais é bom; nas outras três,
mais pesa. E quem decide é o contexto: nota alta em escala não ajuda se você tem três devs e dois mil usuários. Este é o
medidor da hexagonal (capítulo 6):</p>

${medidor({ complexidade: 3, escala: 4, operacao: 1, aprendizado: 3, time: "qualquer tamanho; brilha a partir de 3 a 4 devs" })}

<ul>
<li><b>Complexidade para começar</b>: quanto custa montar o básico. Hexagonal: 3 (interfaces desde o dia 1).</li>
<li><b>Até onde escala</b>: quanto aguenta crescer em carga, em código e em gente. Hexagonal: 4.</li>
<li><b>Custo de operar</b>: servidores, deploys, monitoramento, plantão. Hexagonal: 1 (nada a mais no ar).</li>
<li><b>Curva de aprendizado</b>: quanto estudar até usar bem. Hexagonal: 3 (injeção de dependência).</li>
</ul>

<h4>As caixas</h4>
<p>Você já viu as três neste capítulo. A <b>azul</b> traz o mundo real (casos públicos com a fonte, ou um cenário
apresentado como exemplo), regras de bolso e frases prontas. A <b>verde</b> é a dica: atalhos e variações. A
<b>vermelha</b> é o alerta: armadilhas que custam caro.</p>

<h4>Por onde começar</h4>
<ul>
<li><b>Está começando?</b> Parte I, depois os capítulos 4 (camadas), 11 (monólito) e 12 (monólito modular).</li>
<li><b>Tem uma decisão para tomar?</b> Capítulo 28 (árvore de decisão) e, de lá, as arquiteturas candidatas.</li>
<li><b>Vai mudar um sistema que já existe?</b> Capítulos 30 (como migrar) e 31 (anti-padrões).</li>
<li><b>Quer revisar antes de uma entrevista?</b> Capítulo 33, a cola final.</li>
</ul>

${lembre([
  "Arquitetura é a estrutura do sistema, as decisões caras de mudar e os princípios que mantêm tudo de pé.",
  "Toda escolha é um trade-off: responda \"depende\" dizendo do que depende, o que você escolhe e o que faria você mudar de ideia.",
  "Decida o que é caro no último momento responsável e mantenha as opções abertas até lá; o que é barato, decida rápido.",
])}
`;
