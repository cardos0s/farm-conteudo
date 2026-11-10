// Capítulo 27: Comparativo geral. Capítulo da parte V, então a estrutura muda em relação aos capítulos de
// arquitetura: abertura → como ler → a grande tabela (uma parte por família, notas iguais às dos medidores
// dos capítulos 4 a 26) → o que a tabela mostra (dois diagramas) → as cinco dúvidas mais comuns lado a lado
// → erros ao comparar → como usar a tabela, com um exemplo → combina com → para lembrar.

import { alerta, combina, fig, lembre, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { caminho, claro, cor, elipse, etiqueta, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Mapa custo x escala: onde cada arquitetura do sistema por fora e de comunicação fica. */
function mapa() {
  semear("comparativo-1");
  let s = "";
  // zona boa (desenhada antes, para ficar atrás das etiquetas)
  s += elipse(266, 192, 240, 120, { preench: claro.verde, cor: cor.verde, tracejado: true, gap: 8 });
  s += txt(266, 120, "muita escala por pouco custo", { tam: 16, cor: cor.verde });
  // eixos
  s += seta(100, 380, 735, 380, { espessura: 2 });
  s += seta(100, 380, 100, 40, { espessura: 2 });
  s += txt(100, 22, "até onde escala", { tam: 16 });
  s += txt(55, 62, "muito", { tam: 15, cor: cor.cinza });
  s += txt(55, 358, "pouco", { tam: 15, cor: cor.cinza });
  s += txt(140, 402, "baixo", { tam: 15, cor: cor.cinza });
  s += txt(705, 402, "alto", { tam: 15, cor: cor.cinza });
  s += txt(420, 424, "custo para começar e operar (as duas notas somadas)", { tam: 16 });
  // legenda
  s += ret(120, 50, 18, 18, { preench: claro.azul, hachura: "solid", espessura: 1.4 });
  s += txt(148, 60, "sistema por fora (parte III)", { tam: 15, ancora: "start" });
  s += ret(120, 80, 18, 18, { preench: claro.violeta, hachura: "solid", espessura: 1.4 });
  s += txt(148, 90, "comunicação e dados (parte IV)", { tam: 15, ancora: "start" });
  // arquiteturas (posição aproximada a partir das notas da tabela)
  const fora = (x, y, nome) => etiqueta(x, y, nome, { tam: 15, preench: claro.azul });
  const dados = (x, y, nome) => etiqueta(x, y, nome, { tam: 15, preench: claro.violeta });
  s += fora(165, 285, "Monólito");
  s += fora(234, 172, "Monólito modular");
  s += fora(300, 212, "Serverless");
  s += dados(420, 212, "CQRS");
  s += fora(470, 172, "Micro-frontends");
  s += dados(545, 212, "Event Sourcing");
  s += dados(482, 85, "Eventos");
  s += fora(585, 55, "Células");
  s += dados(575, 116, "Space-based");
  s += fora(686, 86, "Microsserviços");
  s += fora(560, 290, "SOA");
  s += txt(560, 330, "custo alto, escala média", { tam: 15, cor: cor.vermelho });
  return quadro(760, 440, s);
}

/** A troca de dividir o sistema: o que cresce e o que encolhe da esquerda para a direita. */
function balanca() {
  semear("comparativo-2");
  let s = "";
  s += caminho("M70,162 L710,162 L710,40 Z", { preench: claro.verde, cor: cor.verde, espessura: 2, gap: 8 });
  s += caminho("M50,198 L690,198 L50,320 Z", { preench: claro.vermelho, cor: cor.vermelho, espessura: 2, gap: 8 });
  s += txt(600, 22, "o que você ganha", { tam: 17, cor: cor.verde });
  s += txt(600, 112, "deploy separado\nescala por parte\nfalha isolada", { tam: 16, cor: cor.verde, halo: 5 });
  s += txt(180, 250, "transação única\nteste de ponta a ponta\ndepurar num log só", { tam: 16, cor: cor.vermelho, halo: 5 });
  s += txt(180, 342, "o que você perde", { tam: 17, cor: cor.vermelho });
  s += seta(30, 180, 742, 180, { espessura: 2 });
  const p = (x, nome) => etiqueta(x, 180, nome, { tam: 15, preench: "#ffffff" });
  s += p(110, "Monólito");
  s += p(290, "Monólito modular");
  s += p(480, "Alguns serviços");
  s += p(650, "Microsserviços");
  return quadro(760, 360, s);
}

const CAB = ["Arquitetura", "Co", "Es", "Op", "Ap", "Te", "Time", "Deploy separado", "Consistência", "Brilha quando"];
/** Uma linha da grande tabela: nome (capítulo), quatro notas do medidor, testabilidade e o resto em texto. */
const L = (nome, cap, c, e, o, a, t, time, deploy, cons, brilha) => [`<b>${nome}</b> (${cap})`, c, e, o, a, t, time, deploy, cons, brilha];

const parte2 = [
  L("Camadas", 4, 1, 2, 1, 1, 3, "1 dev a 1 time", "não muda", "não muda", "CRUD e sistemas simples"),
  L("MVC, MVP e MVVM", 5, 1, 3, 1, 2, 3, "qualquer", "não muda", "não muda", "telas com estado e interação"),
  L("Hexagonal", 6, 3, 4, 1, 3, 5, "qualquer (brilha com 3+)", "não muda", "não muda", "regra rica, várias entradas"),
  L("Clean e Onion", 7, 4, 4, 1, 4, 5, "3 ou mais devs", "não muda", "não muda", "regra rica, vida longa, time grande"),
  L("Vertical Slice", 8, 2, 4, 1, 2, 4, "qualquer", "não muda", "não muda", "muitas features independentes"),
  L("Microkernel", 9, 3, 2, 2, 3, 4, "núcleo + terceiros", "plugins: sim", "não muda", "produto extensível (VS Code)"),
  L("Pipes and Filters", 10, 2, 4, 2, 2, 5, "qualquer", "etapas com fila: sim", "não muda", "dados em etapas (ETL, mídia)"),
];

const parte3 = [
  L("Monólito", 11, 1, 3, 1, 1, 4, "1 dev a poucos times", "não", "forte", "começo, produto mudando rápido"),
  L("Monólito modular", 12, 2, 4, 1, 3, 4, "1 a vários times", "não", "forte", "vários times, um deploy só"),
  L("SOA", 13, 4, 3, 4, 4, 2, "empresa grande", "parcial", "mista", "integrar legados e parceiros"),
  L("Microsserviços", 14, 5, 5, 5, 4, 3, "vários times", "sim", "eventual", "muitos times autônomos"),
  L("Serverless", 15, 2, 4, 2, 3, 3, "pequeno, sem infra", "sim, por função", "a do banco usado", "carga em picos, tarefas por evento"),
  L("Micro-frontends", 16, 4, 4, 3, 3, 3, "3 ou mais times no front", "sim, por pedaço da tela", "não se aplica", "front grande, vários times"),
  L("Células", 17, 4, 5, 5, 4, 3, "grande, com SRE", "célula a célula", "forte dentro da célula", "falha não pode atingir todos"),
];

const parte4 = [
  L("Cliente-servidor", 18, 2, 4, 2, 1, 4, "qualquer", "cliente e servidor", "forte (no servidor)", "quase todo app e site"),
  L("Peer-to-peer", 19, 4, 5, 3, 4, 2, "com gente de redes", "cada par no seu tempo", "eventual", "arquivos, chamadas diretas"),
  L("Orientada a eventos", 20, 3, 5, 4, 4, 3, "vários times", "sim", "eventual", "uma ação, muitas reações"),
  L("CQRS", 21, 3, 4, 3, 3, 4, "qualquer (nível 1)", "leitura à parte (nível 3)", "eventual no nível 3", "leitura e escrita muito diferentes"),
  L("Event Sourcing", 22, 4, 4, 4, 4, 4, "com alguém experiente", "não muda", "projeções eventuais", "histórico e auditoria"),
  L("Sagas", 23, 4, 4, 3, 4, 2, "já opera serviços", "sim", "eventual + compensação", "operação em vários serviços"),
  L("Space-based", 24, 5, 5, 4, 4, 2, "experiente", "parcial", "eventual com o banco", "picos extremos (ingressos)"),
  L("Modelo de atores", 25, 4, 5, 3, 4, 3, "pequeno já vai longe", "não muda", "forte dentro do ator", "milhões de entidades com estado"),
  L("Lambda", 26, 4, 5, 5, 4, 2, "time de dados", "não muda", "eventual (o lote corrige)", "tempo real + reprocesso em lote"),
  L("Kappa", 26, 4, 5, 4, 4, 3, "time de dados", "não muda", "eventual", "tudo como fluxo de eventos"),
  L("Lakehouse", 26, 3, 5, 3, 3, 3, "time de dados", "não muda", "transações por tabela", "BI e ciência de dados juntos"),
  L("Data Mesh", 26, 5, 5, 4, 4, 3, "muitos domínios", "sim, por domínio", "eventual entre domínios", "muitos domínios gerando dados"),
];

export default `
${resumo(
  "Nenhuma arquitetura ganha em tudo: cada uma <b>troca um custo por um benefício</b>. Este capítulo coloca todas na mesma régua, para você ver de uma vez o que cada uma entrega e o que cobra.",
  "Na loja, a etiqueta da geladeira mostra litros, consumo e preço lado a lado. A maior não serve para todo mundo: numa quitinete, ela nem passa pela porta. A tabela deste capítulo é essa etiqueta; quem decide é o seu contexto.",
)}

<p>Os capítulos 4 a 26 apresentaram cada arquitetura sozinha, com o seu medidor. Aqui todas entram na mesma tabela, com as
quatro notas do medidor e mais três critérios que aparecem em quase toda conversa de arquitetura: testabilidade, deploy
separado e consistência de dados. A tabela vem em três partes, uma por família (capítulo 3), porque só faz sentido comparar
dentro da mesma família: "hexagonal ou microsserviços?" não é uma escolha, já que uma organiza o código por dentro e a outra
divide o sistema por fora. Depois vêm o padrão por trás dos números e as cinco comparações que mais aparecem em revisão de
código, entrevista e reunião de arquitetura.</p>

<h3>Como ler a grande tabela</h3>
<ul>
<li><b>Co, Es, Op e Ap</b> (começar, escala, operar e aprender): as notas de 1 a 5 do medidor de cada capítulo; o capítulo 3
explica cada uma. <b>Te</b> (testar): quão fácil é cobrir a regra e o fluxo principal com testes automáticos rápidos. Essa nota não está nos
medidores; ela foi dada aqui, pelo que cada capítulo mostra sobre testes.</li>
<li><b>Deploy separado</b>: se uma parte do sistema vai para produção sem levar as outras junto.</li>
<li><b>Consistência</b>: <b>forte</b> quando todo mundo enxerga o dado novo logo depois de gravado; <b>eventual</b> quando as
partes podem ficar alguns instantes desencontradas e se acertam depois.</li>
<li><b>Não muda</b>: a arquitetura não mexe naquele critério, e vale o que o sistema por fora tiver. É o caso de quase toda a
parte II: organizar o código em hexágono não muda quantos deploys você tem.</li>
</ul>

${alerta(
  "Número alto nem sempre é bom",
  "<p>Em <b>Es</b> e <b>Te</b>, quanto maior, melhor. Em <b>Co</b>, <b>Op</b> e <b>Ap</b>, quanto maior, mais caro. Muitos 5 não fazem uma campeã: fazem a que mais aguenta e também a que mais cobra.</p>",
)}

<h4>Parte II: o código por dentro</h4>
${tabela(CAB, parte2, "compacta")}

<h4>Parte III: o sistema por fora</h4>
${tabela(CAB, parte3, "compacta")}

<h4>Parte IV: comunicação e dados</h4>
${tabela(CAB, parte4, "compacta")}

<p>As notas valem para um time típico, que ainda não rodou aquela arquitetura em produção: com experiência prévia, Op
cai um pouco e Ap cai bastante. As linhas do capítulo 26 aparecem separadas porque Lambda, Kappa, Lakehouse e Data Mesh resolvem problemas
diferentes; nelas, escala quer dizer volume de dados. O medidor daquele capítulo (4, 5, 4 e 4) vale para o caso típico, um
lakehouse com um pouco de streaming; aqui cada peça aparece sozinha.</p>

<h3>O que a tabela mostra</h3>
<p>Olhando as linhas juntas, aparecem cinco padrões. Eles valem mais do que qualquer nota isolada, porque explicam o porquê
das notas.</p>

${fig(mapa(), "Cada etiqueta fica na altura da nota de escala e, na horizontal, na soma das notas de começar e operar (posição aproximada). A SOA aparece embaixo porque o objetivo dela é integrar sistemas, não escalar.", "grande")}

<ol>
<li><b>Escala se compra com operação.</b> Nenhuma nota 5 em escala vem com operar abaixo de 3, e a maioria vem com 4 ou 5:
microsserviços, células, space-based, eventos, Lambda. Nas partes III e IV, as linhas com escala 4 e operar 1 ou 2
(monólito modular, serverless e cliente-servidor) são o melhor negócio para a maioria dos sistemas. No serverless, parte da operação foi para o provedor e volta na forma de fatura
e de limites da plataforma (capítulo 15).</li>
<li><b>A parte II quase não mexe na conta de operar.</b> Camadas, MVC, hexagonal, clean e vertical slice têm operar 1: não colocam
nada novo no ar. O preço delas está em começar e aprender, pago em código e convenção. As escolhas das partes III e IV são
pagas todo mês, em infraestrutura e plantão.</li>
<li><b>Deploy separado e consistência forte quase nunca andam juntos.</b> Consistência forte aparece onde há um banco só
(monólito, monólito modular, cliente-servidor) ou dentro de uma fronteira pequena (uma célula, um ator). Quando cada parte ganha o seu banco, a consistência entre elas vira eventual
e entram as sagas (capítulo 23). A figura abaixo mostra essa troca.</li>
<li><b>Testar fica mais difícil com a rede no meio.</b> As notas mais altas estão na parte II (hexagonal, clean, pipes and
filters). As mais baixas (2) estão em SOA, peer-to-peer, sagas e space-based, onde o resultado depende de mensagens, tempo e
falhas parciais, e na Lambda, que tem a mesma lógica escrita duas vezes (lote e tempo real). Cada serviço continua fácil de testar sozinho; o difícil é o conjunto.</li>
<li><b>Na parte III, quem decide é o tamanho do time.</b> A Lei de Conway (Melvin Conway, 1968) diz que o sistema tende a copiar a
estrutura de comunicação de quem o constrói. Microsserviços, micro-frontends e células só se pagam com vários times: com um
time só, você compra a divisão e não usa.</li>
</ol>

${fig(balanca(), "Dividir o sistema compra independência e cobra simplicidade. Por isso, na tabela, deploy separado e consistência forte quase nunca aparecem na mesma linha.")}

<h3>As cinco dúvidas mais comuns, lado a lado</h3>

<h4>1. Camadas x hexagonal x clean</h4>
<p>As três organizam o código de uma aplicação. A diferença está em <b>quem depende de quem</b> e em quantas regras o time
precisa seguir.</p>
${tabela(
  ["", "Camadas (4)", "Hexagonal (6)", "Clean e Onion (7)"],
  [
    ["<b>Desenho</b>", "pilha: tela, negócio, dados", "núcleo com portas e adaptadores", "anéis com nome em volta do domínio"],
    ["<b>Seta do banco</b>", "o negócio depende do banco", "o banco se adapta a uma porta do núcleo", "igual à hexagonal, anel por anel"],
    ["<b>Testar a regra</b>", "com dublês do repositório ou com banco", "em memória, sem infraestrutura", "em memória, sem infraestrutura"],
    ["<b>Custo extra</b>", "quase nenhum", "interfaces das portas e mapeamentos", "portas, DTOs, presenters e mais pastas"],
    ["<b>Começar / Aprender</b>", "1 / 1", "3 / 3", "4 / 4"],
    ["<b>Escolha quando</b>", "CRUD, pouca regra, time pequeno", "regra rica, várias entradas (API, fila, CLI)", "regra rica, time grande, sistema de vida longa"],
  ],
  "compacta",
)}
<p><b>Regra de bolso:</b> comece em camadas. Quando a regra crescer e os testes começarem a pedir banco, inverta a dependência
do banco (uma porta no núcleo, um adaptador por fora): é o primeiro passo da hexagonal. Dê nome aos anéis (Clean) quando muita gente precisar seguir a mesma convenção.</p>

<h4>2. Monólito modular x microsserviços</h4>
<p>É a dúvida mais cara do livro, porque a resposta errada custa caro para desfazer. As duas dividem o sistema por assunto do
negócio; a diferença é se a fronteira é uma regra no código ou a rede.</p>
${tabela(
  ["", "Monólito modular (12)", "Microsserviços (14)"],
  [
    ["<b>Deploy</b>", "um só, para todos os módulos", "um por serviço, cada time no seu ritmo"],
    ["<b>Fronteira</b>", "regra de import vigiada por ferramenta (como o Packwerk, da Shopify)", "a rede: só se fala por API ou evento"],
    ["<b>Chamada entre partes</b>", "função, no mesmo processo", "pela rede: pode falhar, demorar ou chegar duas vezes"],
    ["<b>Dados</b>", "um banco; cada módulo é dono das suas tabelas", "um banco por serviço"],
    ["<b>Gravar em várias partes</b>", "transação comum do banco", "saga com compensação (cap. 23)"],
    ["<b>Escala</b>", "o sistema inteiro junto, em várias cópias iguais", "cada serviço na medida dele"],
    ["<b>Começar / Escala / Operar</b>", "2 / 4 / 1", "5 / 5 / 5"],
    ["<b>Escolha quando</b>", "de um a alguns times; fronteiras ainda mudando", "muitos times travados na fila de deploy; partes com carga ou falhas que precisam ficar isoladas"],
  ],
  "compacta",
)}
<p><b>Regra de bolso:</b> um microsserviço é um módulo que ganhou um motivo concreto para sair (deploy, escala ou isolamento
de falha próprios). Sem motivo, ele fica módulo. É a lógica do <i>Monolith First</i>, de Martin Fowler (2015). E sair pela metade (serviços que dividem o mesmo banco ou
precisam subir juntos) dá o pior dos dois lados: o monólito distribuído (capítulo 31).</p>

<h4>3. SOA x microsserviços</h4>
<p>As duas usam serviços, por isso se confundem. A diferença está no objetivo: a SOA nasceu para <b>integrar e reusar</b>
sistemas da empresa; microsserviços, para dar <b>independência</b> a cada time. Mark Richards resume: a SOA tenta compartilhar
o máximo possível, e microsserviços, o mínimo.</p>
${tabela(
  ["", "SOA (13)", "Microsserviços (14)"],
  [
    ["<b>Objetivo</b>", "integração e reuso entre sistemas", "independência de cada time"],
    ["<b>Tamanho</b>", "uma capacidade da empresa inteira (Clientes)", "uma parte de um domínio, de um time só"],
    ["<b>No meio do caminho</b>", "ESB inteligente: roteia, transforma, orquestra", "canos burros (HTTP ou fila); a lógica fica nas pontas"],
    ["<b>Dados</b>", "muitas vezes compartilhados", "cada serviço com os seus"],
    ["<b>Governança</b>", "central, com contratos formais", "por time, com poucos padrões comuns"],
    ["<b>Escolha quando</b>", "integrar legados, ERPs e parceiros", "produto próprio, com muitos times"],
  ],
  "compacta",
)}
<p><b>Regra de bolso:</b> se o problema é fazer conversar sistemas que você não controla, pense em SOA (ou só numa camada de
integração). Se o problema é seus times esperarem uns pelos outros para publicar, pense em microsserviços.</p>

<h4>4. CQRS x Event Sourcing</h4>
<p>Aparecem juntos em tanta palestra que parecem uma coisa só. Não são: o CQRS separa <b>quem escreve de quem lê</b>; o
event sourcing muda <b>o que é guardado</b>.</p>
${tabela(
  ["", "CQRS (21)", "Event Sourcing (22)"],
  [
    ["<b>A ideia</b>", "um modelo para comandos, outro para consultas", "guardar cada evento; o estado atual é calculado a partir deles"],
    ["<b>Pergunta que resolve</b>", "leitura e escrita pedem formatos diferentes?", "preciso saber como e por que cheguei neste estado?"],
    ["<b>Banco</b>", "o mesmo (níveis 1 e 2) ou um só para leitura (nível 3)", "um event store, mais projeções para leitura"],
    ["<b>Consistência</b>", "forte no mesmo banco; eventual com banco de leitura separado", "escrita forte por agregado; projeções eventuais"],
    ["<b>Funciona sozinho?</b>", "sim, e é o uso mais comum", "quase nunca: para consultar, precisa de projeções (CQRS)"],
    ["<b>Começar / Operar / Aprender</b>", "3 / 3 / 3", "4 / 4 / 4"],
  ],
  "compacta",
)}
<p><b>Regra de bolso:</b> CQRS sem event sourcing é comum e pode ser barato. Event sourcing quase sempre traz CQRS junto.
A pergunta que decide é: preciso do histórico? Se não, fique só no CQRS (ou nem nele).</p>

<h4>5. Orquestração x coreografia</h4>
<p>São as duas formas de coordenar uma saga (capítulo 23), e a mesma escolha aparece em qualquer fluxo com eventos
(capítulo 20). Pense numa orquestra com maestro e numa roda de dança, em que cada um reage ao passo do outro.</p>
${tabela(
  ["", "Orquestração", "Coreografia"],
  [
    ["<b>Onde está o fluxo</b>", "num orquestrador (código ou máquina de estados)", "espalhado nas reações aos eventos"],
    ["<b>Quem conhece quem</b>", "o orquestrador conhece todos os serviços", "cada serviço só conhece eventos"],
    ["<b>Em que pé está o pedido?</b>", "pergunte ao orquestrador", "junte rastreamento e logs de vários serviços"],
    ["<b>Mudar o fluxo</b>", "num lugar só", "em vários serviços, coordenando times"],
    ["<b>Risco típico</b>", "o orquestrador acumular regra demais", "ciclos de eventos e ninguém saber o fluxo inteiro"],
    ["<b>Ferramentas</b>", "Temporal, AWS Step Functions, Camunda", "um broker (Kafka, RabbitMQ) e bons nomes de evento"],
    ["<b>Escolha quando</b>", "muitos passos, decisões no meio, prazos", "2 ou 3 passos simples, times independentes"],
  ],
  "compacta",
)}
<p><b>Regra de bolso:</b> use coreografia quando o fluxo cabe numa frase ("pedido pago avisa estoque e e-mail"). Quando
aparecerem decisões, prazos e compensações, passe para a orquestração. As topologias broker e mediador do capítulo 20 são
essa mesma escolha: no broker, cada consumidor reage e publica o próximo evento (coreografia); no mediador, um componente
central decide a ordem dos passos (orquestração). Muitos sistemas usam as duas: coreografia entre domínios e orquestração
dentro de um fluxo crítico, como o checkout.</p>

<h3>Erros ao comparar arquiteturas</h3>
<ul>
<li><b>Somar as notas como placar.</b> "A hexagonal fez 16 pontos e as camadas, 8." A soma mistura colunas em que número alto é bom
com colunas em que número alto é caro, e as colunas pesam diferente em cada contexto: numa startup, Começar pesa mais que Escala; num sistema de pagamentos, Consistência pesa mais que quase tudo.</li>
<li><b>Escolher pela coluna de escala.</b> Escala que você não vai usar é custo sem retorno (capítulo 2). Leia sempre Escala
junto com Operar e Time.</li>
<li><b>Comparar a versão ideal de uma com a versão real da outra.</b> O "monólito" da comparação costuma ser a bagunça que
você tem hoje; os "microsserviços", os da palestra. Compare monólito modular bem feito com microsserviços bem feitos.</li>
<li><b>Comparar famílias diferentes.</b> "Hexagonal ou eventos?" Elas não competem: um mesmo sistema usa uma resposta de cada
família (capítulo 29).</li>
</ul>

<h3>Como usar a tabela para decidir</h3>
${passos([
  "Escolha as três colunas que mais pesam no seu contexto. Exemplos: Começar, Operar e Consistência para uma startup de pagamentos; Escala, Deploy separado e Time para uma empresa com dez times no mesmo produto.",
  "Em cada família, risque as linhas que ficam de fora: nota de Operar acima do que o time consegue cuidar, ou faixa de Time maior do que o time que você tem.",
  "Entre as linhas que sobraram, fique com a mais simples. Se empatar, fique com a mais fácil de desfazer: sair de um monólito modular para serviços é um caminho conhecido, módulo por módulo (capítulo 30); juntar microsserviços de volta costuma sair bem mais caro.",
  "Confira o resultado com a árvore do capítulo 28 e registre num ADR (capítulo 32) quais colunas decidiram e por quê.",
])}

${pratica(
  "Exemplo: lendo a tabela para um app de delivery",
  `<p>Imagine um app de delivery de uma cidade média: oito devs em dois times, picos de pedidos no almoço e no jantar,
  pagamento com cartão. As colunas que pesam são Operar, Consistência e Time.</p>
  <ul>
  <li><b>Sistema por fora</b>: microsserviços pedem vários times e têm operar 5, então saem. O monólito modular (operar 1,
  escala 4) cobre os dois times, e funções serverless cuidam do que tem pico isolado, como gerar recibos.</li>
  <li><b>Código por dentro</b>: hexagonal nos módulos de pedidos e pagamentos, onde a regra é rica (Testar 5); camadas no
  cadastro de restaurantes, que é quase só ler e gravar.</li>
  <li><b>Comunicação e dados</b>: cliente-servidor entre o app e a API; eventos internos para "pedido pago" avisar a cozinha e
  o entregador. Como tudo está num banco só, o status do pedido e o registro do pagamento mudam na mesma transação, sem saga.
  A chamada à operadora do cartão fica fora dela e precisa ser idempotente (capítulo 23).</li>
  </ul>`,
)}

${combina([
  [28, "Árvore de decisão", "transforma a tabela em perguntas de sim ou não"],
  [3, "O mapa das arquiteturas", "as três famílias e como ler o medidor"],
  [2, "Os critérios que decidem a escolha", "o que cada coluna mede"],
  [29, "Combinações que funcionam", "uma linha de cada família, juntas"],
  [30, "Como migrar sem parar o sistema", "quando a escolha de hoje deixa de servir"],
  [32, "ADRs", "para registrar quais colunas decidiram"],
])}

${lembre([
  "Compare dentro da mesma família: código por dentro, sistema por fora e comunicação e dados respondem perguntas diferentes.",
  "Escala alta quase sempre vem com operação cara; para a maioria dos sistemas, o melhor negócio por fora está nas linhas com escala 4 e operar 1 ou 2 (monólito modular, serverless).",
  "Deploy separado e consistência forte raramente andam juntos: escolher um é aceitar o preço do outro.",
])}
`;
