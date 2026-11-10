// Capítulo 28: Árvore de decisão (qual usar). Capítulo da parte V, então a estrutura muda um pouco em relação
// aos capítulos de arquitetura: abertura → árvore do sistema por fora → árvore do código por dentro → perguntas por
// família → como usar com o time → seis cenários resolvidos → sinais de que está na hora de mudar.

import { alerta, combina, dica, fig, lembre, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { bloco, claro, cor, curva, linha, quadro, semear, seta, txt } from "../desenho.mjs";

/** Caixa de pergunta (amarela, fundo liso para o texto ler bem). */
const pergunta = (x, y, w, h, texto) => bloco(x, y, w, h, "", { preench: claro.amarelo, hachura: "solid", espessura: 2 }) + txt(x + w / 2, y + h / 2, texto, { tam: 15 });

/** Caixa de resposta: nome da arquitetura + capítulo. */
function folha(x, y, w, h, nome, cap, preench) {
  const duas = nome.includes("\n");
  return (
    bloco(x, y, w, h, "", { preench, espessura: 2.2 }) +
    txt(x + w / 2, y + (duas ? 26 : 27), nome, { tam: 16, halo: 4 }) +
    txt(x + w / 2, y + (duas ? 58 : 52), cap, { tam: 15, cor: cor.cinza, halo: 4 })
  );
}

/** Rótulo "sim"/"não" perto do começo de uma seta. */
const rot = (x, y, sim) => txt(x, y, sim ? "sim" : "não", { tam: 15, cor: sim ? cor.verde : cor.vermelho, halo: 5 });

function arvoreFora() {
  semear("decisao-1");
  let s = "";
  const sim = { cor: cor.verde, espessura: 1.9 };
  const nao = { cor: cor.vermelho, espessura: 1.9 };
  // perguntas
  s += pergunta(235, 12, 290, 60, "Vários times precisam fazer deploy\nsem esperar uns pelos outros?");
  s += pergunta(35, 120, 230, 62, "A carga vem em picos e fica\nociosa boa parte do tempo?");
  s += pergunta(485, 120, 240, 62, "Os módulos já têm fronteiras\nclaras e dados próprios?");
  s += pergunta(175, 230, 230, 62, "Já tem vários assuntos\ngrandes (pedidos, estoque)?");
  s += pergunta(507, 230, 245, 62, "Escala muito grande e uma\nfalha não pode atingir todos?");
  // setas
  s += seta(272, 72, 172, 118, nao) + rot(204, 84, false);
  s += seta(488, 72, 588, 118, sim) + rot(558, 84, true);
  s += seta(75, 182, 73, 356, sim) + rot(98, 206, true);
  s += seta(215, 182, 266, 228, nao) + rot(263, 196, false);
  s += seta(520, 182, 420, 356, nao) + rot(484, 206, false);
  s += seta(680, 182, 662, 228, sim) + rot(696, 204, true);
  s += seta(220, 292, 227, 356, nao) + rot(203, 318, false);
  s += seta(360, 292, 385, 356, sim) + rot(392, 314, true);
  s += seta(560, 292, 544, 356, nao) + rot(532, 318, false);
  s += seta(700, 292, 694, 356, sim) + rot(718, 318, true);
  // respostas
  s += folha(8, 358, 130, 72, "Serverless", "cap. 15", claro.ciano);
  s += folha(158, 358, 138, 72, "Monólito", "cap. 11", claro.cinza);
  s += folha(316, 358, 138, 72, "Monólito\nmodular", "cap. 12", claro.verde);
  s += folha(474, 358, 140, 72, "Microsserviços", "cap. 14", claro.azul);
  s += folha(634, 358, 118, 72, "Células", "cap. 17", claro.violeta);
  s += txt(380, 448, "na dúvida, comece com menos partes: separar depois costuma sair mais barato que juntar", { tam: 15, cor: cor.vermelho });
  return quadro(760, 460, s);
}

function arvoreDentro() {
  semear("decisao-2");
  let s = "";
  const sim = { cor: cor.verde, espessura: 1.9 };
  const nao = { cor: cor.vermelho, espessura: 1.9 };
  s += pergunta(30, 6, 220, 56, "É código de interface\n(tela web, app, desktop)?");
  s += pergunta(450, 6, 220, 56, "A regra de negócio é rica\ne muda com frequência?");
  s += pergunta(190, 100, 220, 56, "Muitas features que mudam\ncada uma no seu ritmo?");
  s += pergunta(505, 100, 235, 56, "Time grande, que precisa de\nregras explícitas por anel?");
  s += seta(252, 34, 446, 34, nao) + rot(349, 19, false);
  s += seta(72, 62, 73, 189, sim) + rot(94, 86, true);
  s += seta(490, 62, 362, 98, nao) + rot(416, 66, false);
  s += seta(630, 62, 640, 98, sim) + rot(656, 80, true);
  s += seta(245, 156, 228, 189, nao) + rot(214, 171, false);
  s += seta(355, 156, 382, 189, sim) + rot(390, 170, true);
  s += seta(560, 156, 544, 189, nao) + rot(530, 171, false);
  s += seta(690, 156, 694, 189, sim) + rot(713, 171, true);
  s += folha(8, 192, 130, 70, "MVC, MVP\nou MVVM", "cap. 5", claro.laranja);
  s += folha(158, 192, 138, 70, "Camadas", "cap. 4", claro.cinza);
  s += folha(316, 192, 138, 70, "Vertical\nSlice", "cap. 8", claro.verde);
  s += folha(474, 192, 140, 70, "Hexagonal", "cap. 6", claro.azul);
  s += folha(634, 192, 118, 70, "Clean ou\nOnion", "cap. 7", claro.violeta);
  s += txt(380, 284, "responda para cada módulo: partes diferentes podem ter respostas diferentes", { tam: 15, cor: cor.vermelho });
  return quadro(760, 298, s);
}

function evolucao() {
  semear("decisao-3");
  let s = "";
  const degraus = [
    ["Monólito", "cap. 11", claro.cinza, ""],
    ["Monólito\nmodular", "cap. 12", claro.verde, "assuntos\nembolados"],
    ["Modular +\nserviços", "caps. 12 e 14", claro.amarelo, "uma parte escala\nou muda diferente"],
    ["Microsserviços", "cap. 14", claro.azul, "muitos times,\ndeploy em fila"],
    ["Células", "cap. 17", claro.violeta, "uma falha\natinge todos"],
  ];
  const w = 130, gap = 26, h = 72;
  degraus.forEach(([nome, cap, c, sinal], i) => {
    const x = 3 + i * (w + gap), y = 200 - i * 42;
    s += folha(x, y, w, h, nome, cap, c);
    if (sinal) s += txt(x + w / 2, y + h + 26, sinal, { tam: 15, cor: cor.laranja });
    if (i < degraus.length - 1) s += seta(x + w + 3, y + h / 2, x + w + gap - 3, y + h / 2 - 42, { cor: cor.verde, espessura: 2.2, ponta: 11 });
  });
  // o caminho tem volta
  s += curva([[505, 70], [440, 26], [340, 30], [268, 150]], { cor: cor.vermelho, espessura: 1.8, tracejado: true });
  s += seta(275, 136, 267, 154, { cor: cor.vermelho, espessura: 1.8, ponta: 11 });
  s += txt(180, 62, "custo de operar\nmaior que o ganho?\njunte de volta", { tam: 15, cor: cor.vermelho });
  s += txt(480, 292, "em laranja: o sinal que justifica subir o degrau; sem ele, é só custo", { tam: 15, cor: cor.laranja });
  return quadro(760, 310, s);
}

export default `
${resumo(
  "Escolher arquitetura é responder poucas perguntas, na ordem certa: primeiro <b>o sistema por fora</b> (em quantas partes ele vai para o ar), depois <b>o código por dentro</b> (como cada parte se organiza). Na dúvida, a resposta é a mais simples que resolve.",
  "Para escolher um carro, você pergunta primeiro quantas pessoas vão nele e por onde ele vai rodar (cidade, estrada, terra). Só depois pensa na cor e no som. Em arquitetura, times, carga e riscos são as pessoas e a estrada.",
)}

<p>Os capítulos anteriores mostraram cada arquitetura sozinha, e o capítulo 27 colocou todas lado a lado. Este capítulo
transforma isso num roteiro: duas árvores de perguntas de sim ou não, um quadro de perguntas por família, seis cenários
resolvidos e os sinais de que a escolha de hoje já não serve. As perguntas vêm dos critérios do capítulo 2: a forma dos
times, os atributos de qualidade que mais pesam (escala, disponibilidade, facilidade de mudar) e as restrições que você não
escolhe. Responda pensando no sistema de hoje e no que é provável para o próximo ano, não no cenário dos sonhos: arquitetura
escolhida para um tráfego que não existe é custo pago adiantado.</p>

<h3>Árvore 1: o sistema por fora</h3>
<p>A primeira decisão é física: quantas <b>unidades de deploy</b> (partes que vão para produção separadas) o sistema vai ter.
Ela vem primeiro porque é a mais cara de desfazer.</p>

${fig(arvoreFora(), "Leia de cima para baixo. As caixas coloridas são o ponto de partida recomendado, com o capítulo que explica cada um. Repare que o monólito modular aparece por dois caminhos.", "grande")}

<h4>As perguntas, uma a uma</h4>
<ul>
<li><b>Vários times precisam fazer deploy sem esperar uns pelos outros?</b> É a pergunta que mais separa monólito de
serviços. Microsserviços resolvem antes de tudo um problema de <b>organização</b>: deixar times publicarem sem fila. Com um
único time, a resposta quase sempre é não.</li>
<li><b>A carga vem em picos e fica ociosa boa parte do tempo?</b> Pense num sistema de inscrições que lota dois dias por
mês, ou num processamento disparado por upload de arquivo. Serverless escala sozinho e cobra pelo uso, então brilha aqui. Com
carga alta e constante, máquinas ou containers sempre ligados costumam sair mais baratos e previsíveis.</li>
<li><b>Já tem vários assuntos grandes?</b> Se o produto tem pedidos, pagamentos, estoque e entregas, separe isso em módulos
com fronteiras desde cedo. Se é um produto de um assunto só, um monólito bem organizado basta.</li>
<li><b>Os módulos já têm fronteiras claras e dados próprios?</b> Se não têm, virar serviços só troca chamada de função por
chamada de rede, e nasce o <b>monólito distribuído</b> (capítulo 31). Arrume as fronteiras dentro do monólito modular
primeiro; extraia depois.</li>
<li><b>Escala muito grande e uma falha não pode atingir todos?</b> Quando um deploy ruim ou um cliente gigante pode
derrubar todo mundo, o sistema inteiro é copiado em <b>células</b> isoladas, cada uma atendendo uma fatia do tráfego. A AWS
fala publicamente desse modelo, e o Slack contou em 2023 sua migração para ele. As células aparecem depois dos
microsserviços porque é ali que costumam surgir, mas dentro de cada célula pode rodar até um monólito. Vale para poucos: para
a maioria, boas práticas de resiliência bastam.</li>
</ul>

${dica(
  "Serverless não é o oposto de monólito",
  "<p>Serverless fala de <b>como</b> as partes vão para o ar, não de <b>quantas</b> são: dá para rodar um monólito num container serverless ou montar microsserviços com funções. Na árvore ele responde ao padrão de carga, o fator que mais pesa nessa escolha.</p>",
)}

<h3>Árvore 2: o código por dentro</h3>
<p>Decidido o lado de fora, cada parte (o monólito inteiro, cada módulo ou cada serviço) escolhe como organizar o código. Essa
decisão é mais barata de mudar e pode variar dentro do mesmo sistema: o módulo de relatórios pode ser em camadas e o de
pagamentos, hexagonal.</p>

${fig(arvoreDentro(), "Misturar é normal: vertical slice na organização geral e um núcleo hexagonal nas fatias com regra rica.", "grande")}

<h4>As perguntas, uma a uma</h4>
<ul>
<li><b>É código de interface?</b> Telas têm um problema próprio: separar o que se mostra do estado e das ações do usuário.
Para isso existem MVC, MVP e MVVM (capítulo 5); em apps Android e iOS atuais, o MVVM é muito usado. No back-end, o "MVC" dos
frameworks web cuida da entrada HTTP, mas a regra de negócio ainda precisa de um lugar, e aí valem as outras perguntas.</li>
<li><b>A regra de negócio é rica e muda com frequência?</b> "Rica" quer dizer cálculos, estados e exceções que valem
dinheiro: frete, juros, aprovação de crédito, cobertura de plano de saúde. Se o sistema é quase só ler e gravar (cadastros,
painéis administrativos), isolar o núcleo vira cerimônia.</li>
<li><b>Muitas features que mudam cada uma no seu ritmo?</b> Quando cada mudança atravessa controller, serviço e repositório
em pastas diferentes, organizar por fatia (uma pasta por caso de uso) reduz o vai e vem. Com poucos casos de uso, camadas
resolvem com menos regras.</li>
<li><b>Time grande, que precisa de regras explícitas por anel?</b> Hexagonal e Clean isolam o núcleo do mesmo jeito. A Clean
dá nome e responsabilidade a cada anel (entidades, casos de uso, adaptadores, frameworks), o que ajuda quando muita gente
precisa seguir a mesma convenção. Com um time menor, a hexagonal entrega o mesmo isolamento com menos estrutura.</li>
<li><b>Fora da árvore</b>: dois estilos resolvem problemas mais específicos. Se terceiros precisam acrescentar funções sem
mexer no núcleo, pense em microkernel (capítulo 9), como as extensões do VS Code. Se o trabalho é processar dados em etapas
encadeadas (importar, validar, transformar), pense em pipes and filters (capítulo 10).</li>
</ul>

<h3>Perguntas-chave por família</h3>
<p>As árvores decidem a forma do sistema. As perguntas abaixo cobrem o resto: como as partes conversam, como guardam dados
e alguns casos especiais. Elas são independentes das árvores: um monólito pode publicar eventos, e microsserviços podem ser
quase todos síncronos. Só adote o padrão quando a resposta for um "sim" claro.</p>

<h4>Comunicação e dados</h4>
${tabela(
  ["Família", "Pergunta-chave", "Se a resposta for sim"],
  [
    ["Comunicação", "Quem chama precisa da resposta agora para continuar?", "Chamada síncrona (HTTP, gRPC), no modelo cliente-servidor (cap. 18)"],
    ["Comunicação", "Uma ação dispara reações que não são da conta de quem agiu (e-mail, nota fiscal, pontos)?", "Eventos (cap. 20): quem publica não conhece quem consome"],
    ["Comunicação", "Os participantes trocam dados direto entre si (arquivos grandes, chamada entre poucas pessoas)?", "Peer-to-peer (cap. 19), quase sempre com um servidor para os pares se encontrarem"],
    ["Dados", "Leitura e escrita têm formatos ou volumes muito diferentes?", "CQRS (cap. 21). Antes, tente índices e réplica de leitura"],
    ["Dados", "Você precisa do histórico completo e de por que cada valor mudou?", "Event Sourcing (cap. 22), só nas partes que pedem isso"],
    ["Dados", "Uma operação grava em vários serviços, cada um com seu banco?", "Saga com compensação (cap. 23). Se cabe num banco só, use uma transação comum"],
    ["Dados", "Os dados servem para análise e vêm de vários sistemas?", "Warehouse gerenciado para começar (cap. 26); lakehouse, streaming ou Data Mesh só quando volume, prazo ou times pedirem"],
  ],
  "compacta",
)}

<h4>Casos especiais</h4>
${tabela(
  ["Família", "Pergunta-chave", "Se a resposta for sim"],
  [
    ["Escala extrema", "O banco é gargalo mesmo com cache e fila (ingressos, leilões)?", "Space-based (cap. 24): dados em memória replicada"],
    ["Escala extrema", "Milhões de entidades pequenas com estado, cada uma recebendo mensagens?", "Modelo de atores (cap. 25): Erlang/OTP, Akka, Orleans"],
    ["Front-end", "Vários times mexem no mesmo front-end grande e brigam pelo deploy?", "Micro-frontends (cap. 16). Com um time só, um front-end bem modularizado basta"],
    ["Integração", "A empresa precisa integrar muitos sistemas existentes (ERP, legados) com contratos padronizados?", "SOA (cap. 13), sem deixar a regra de negócio migrar para o barramento"],
  ],
  "compacta",
)}

<h3>Como usar as árvores com o time</h3>
${passos([
  "Escreva o contexto em meia página: pessoas e times, carga esperada (e se tem picos), regras de negócio críticas, exigências legais e prazo. Sem isso, cada pessoa responde pensando num sistema diferente.",
  "Percorra a árvore 1 com fatos, não com desejos. \"Um dia vamos ter milhões de usuários\" não conta; \"o Natal dobra os pedidos\" conta, se os dados mostram isso.",
  "Percorra a árvore 2 para cada parte que saiu da árvore 1. Partes diferentes podem ter respostas diferentes.",
  "Passe pelas tabelas de perguntas por família e marque só os \"sim\" claros. Cada padrão a mais (fila, CQRS, saga) é uma peça a mais para operar.",
  "Registre a decisão num ADR (capítulo 32): o contexto, a escolha, as alternativas descartadas e o motivo.",
  "Anote os sinais que fariam o time revisar a escolha (veja o fim deste capítulo). Assim a mudança vira um combinado, não uma briga.",
])}

${alerta(
  "A árvore não decide por você",
  "<p>Ela aponta o ponto de partida mais comum para cada situação. Restrições reais podem mudar a resposta: o time já domina uma plataforma, a empresa já opera Kubernetes, um contrato exige que os dados fiquem num país. Sair da árvore é normal; só escreva o motivo.</p>",
)}

<h3>Seis cenários resolvidos</h3>
<p>Os cenários abaixo são exemplos montados para treinar o raciocínio, não empresas reais. Repare que nenhum deles usa uma
arquitetura só.</p>

<h4>1. Startup com 3 devs</h4>
<p>Imagine um app de agendamento para salões de beleza. Três devs, primeiro cliente pagante em dois meses, e o produto muda
toda semana.</p>
<ul>
<li><b>Escolha</b>: monólito (capítulo 11) numa hospedagem gerenciada, com um banco relacional. Por dentro, pastas por
assunto (agenda, clientes, pagamentos), em camadas simples ou vertical slice (capítulos 4 e 8).</li>
<li><b>Por quê</b>: nessa fase o maior risco é construir a coisa errada, não faltar escala. Um deploy, um banco e um
repositório deixam três pessoas mudarem tudo no mesmo dia. É o conselho do <i>Monolith First</i>, de Martin Fowler (2015).</li>
<li><b>Evite</b>: microsserviços, Kubernetes e event sourcing "para já nascer escalável". Com três pessoas, cada peça de
infraestrutura sai do tempo de produto.</li>
</ul>

<h4>2. SaaS B2B crescendo</h4>
<p>Imagine um sistema de gestão para clínicas, vendido por assinatura. Começou como monólito, hoje são quatro times, e o
deploy virou fila: um time espera o outro terminar para publicar.</p>
<ul>
<li><b>Escolha</b>: monólito modular (capítulo 12), com um módulo por domínio (agenda, faturamento, prontuário, relatórios),
cada um dono das próprias tabelas e com uma API interna. Hexagonal ou Clean nos módulos de regra rica, como faturamento;
camadas nos cadastros. Vira serviço só o módulo que tiver um motivo concreto, como relatórios pesados que precisam escalar
separado.</li>
<li><b>Por quê</b>: os times ganham autonomia e fronteiras sem pagar ainda o custo de rede, de vários deploys e de
monitoramento distribuído. A Shopify fala publicamente desse caminho: um grande monólito Rails dividido em componentes, com a
ferramenta Packwerk vigiando as fronteiras.</li>
<li><b>Evite</b>: dividir serviços por camada técnica (um "serviço de banco", um "serviço de validação") ou separar
serviços que continuam lendo as mesmas tabelas. Os dois criam um monólito distribuído. E, por ser B2B, garanta que todo
acesso a dados filtre pela empresa cliente (o <i>tenant</i>).</li>
</ul>

<h4>3. E-commerce na Black Friday</h4>
<p>Imagine uma loja online estável o ano todo que, em poucos dias de novembro, recebe muitas vezes o tráfego normal. A maior
parte das visitas é navegação; só uma fração vira compra.</p>
<ul>
<li><b>Escolha</b>: manter o núcleo como está (monólito modular ou poucos serviços) e separar o que tem carga diferente.
Vitrine e catálogo servidos por CDN e cache, com um índice de busca próprio (leitura separada da escrita, a ideia do CQRS,
capítulo 21). O checkout faz na hora só o essencial (reservar estoque e autorizar o pagamento) e publica o pedido numa fila
(capítulo 20); nota fiscal, e-mail e transportadora vêm depois, no ritmo que esses sistemas aguentam. Se estoque, pagamento e
entrega forem serviços separados, a compra vira uma saga (capítulo 23). Por dentro, o checkout concentra a regra que vale
dinheiro (preço, cupom, estoque) e merece um núcleo isolado, como na hexagonal (capítulo 6).</li>
<li><b>Por quê</b>: o pico é previsível e quase todo de leitura. O cache absorve a leitura e a fila absorve a escrita, então
o banco de pedidos não precisa aguentar o pico inteiro de uma vez.</li>
<li><b>Evite</b>: escalar tudo junto, até o que não está no pico; checkout que chama pagamento, estoque, frete e e-mail em
cadeia síncrona, em que um serviço lento trava a venda; descobrir os limites no dia. Faça teste de carga antes e tenha
como desligar recursos secundários (recomendações, avaliações) se precisar. Space-based (capítulo 24) só entra se o banco
continuar sendo o gargalo mesmo com cache e fila.</li>
</ul>

<h4>4. Fintech regulada</h4>
<p>Imagine uma conta digital com cartão, Pix e transferências. Há auditoria, regras do regulador e a obrigação de explicar
cada centavo do saldo.</p>
<ul>
<li><b>Escolha</b>: por fora, monólito modular ou poucos serviços alinhados ao negócio (contas, cartões, pagamentos,
antifraude). A parte que toca dados de cartão fica isolada, o que reduz o pedaço do sistema que entra no escopo da
certificação PCI DSS. Por dentro, hexagonal ou Clean nas regras de dinheiro. O razão contábil (<i>ledger</i>, o livro de
lançamentos) já é uma lista de fatos que não se apagam (erro se corrige com estorno), e Event Sourcing (capítulo 22) cabe bem
ali. Operações entre serviços viram sagas com compensação.</li>
<li><b>Por quê</b>: aqui pesam correção e rastreabilidade, mais que velocidade de entrega. O núcleo testável prova as
regras, o histórico imutável responde à auditoria e os ADRs (capítulo 32) mostram por que o sistema é como é.</li>
<li><b>Evite</b>: consistência eventual onde o cliente vê saldo errado sem explicação; consumir mensagens sem idempotência
(a mesma mensagem processada duas vezes vira cobrança dupla); event sourcing no sistema inteiro, até em cadastros que não
precisam disso.</li>
</ul>

<h4>5. App mobile com picos</h4>
<p>Imagine um app de cupons de desconto. Fora das campanhas o uso é baixo; quando sai uma notificação para todos os usuários
ou o app aparece na TV, chega uma multidão no mesmo minuto.</p>
<ul>
<li><b>Escolha</b>: no app, MVVM (capítulo 5) com cache local, para abrir mesmo com rede ruim. No back-end, serverless
(capítulo 15) nas rotas de pico, fila para o que pode esperar e CDN para imagens e listas de cupons. Uma API feita para o app
(BFF, <i>backend for frontend</i>) devolve só o que cada tela precisa.</li>
<li><b>Por quê</b>: picos curtos e imprevisíveis, com ociosidade no resto do tempo, são o caso típico do serverless: escala
sozinho e cobra pelo uso.</li>
<li><b>Evite</b>: mandar a notificação para todos de uma vez (envie em lotes, para não criar o próprio pico); milhares de
funções abrindo conexão direto num banco relacional (use um proxy de conexões ou um banco que aguente esse padrão); mudar a
API sem manter compatibilidade, porque muita gente demora a atualizar o app. Meça o <i>cold start</i> (a demora extra quando o
provedor sobe uma instância nova da função) nas rotas sensíveis à latência e confira antes da campanha o limite de execuções simultâneas da sua
conta no provedor: serverless escala sozinho, mas não sem teto.</li>
</ul>

<h4>6. Plataforma de dados</h4>
<p>Imagine uma rede de farmácias que quer painéis de vendas, previsão de estoque e recomendações, com dados do e-commerce,
das lojas físicas e do app.</p>
<ul>
<li><b>Escolha</b>: um lakehouse (capítulo 26) como destino central, alimentado por pipelines em etapas (pipes and filters,
capítulo 10): extrair, limpar, juntar, publicar. Para tirar dados dos sistemas de origem sem pesar neles, eventos de domínio
ou CDC (<i>change data capture</i>, que lê as mudanças direto do log do banco). Se alguma parte precisa de tempo real
(estoque, fraude), um fluxo de streaming só para ela.</li>
<li><b>Por quê</b>: previsão de estoque e recomendações pedem ciência de dados sobre os mesmos dados dos painéis, o caso
do lakehouse; se fossem só painéis, um warehouse gerenciado bastaria. Painéis e previsões costumam aceitar dados de horas
atrás, e processar em lote é mais simples e barato de operar. Tempo real só onde o negócio perde dinheiro esperando.</li>
<li><b>Evite</b>: relatórios pesados rodando no banco de produção; Lambda architecture (a mesma conta escrita duas vezes, em
lote e em tempo real) sem necessidade real; Data Mesh com um único time de dados. O Data Mesh resolve um gargalo de
organização: muitos times de domínio esperando uma equipe central.</li>
</ul>

<h4>Os seis lado a lado</h4>
${tabela(
  ["Cenário", "Por fora", "Por dentro", "Comunicação e dados"],
  [
    ["Startup com 3 devs", "Monólito", "Camadas ou vertical slice", "Banco único, chamadas diretas"],
    ["SaaS B2B crescendo", "Monólito modular", "Hexagonal nos módulos ricos, camadas no resto", "API interna entre módulos, dados por <i>tenant</i>"],
    ["E-commerce na Black Friday", "Núcleo como está + vitrine e busca separadas", "Hexagonal no checkout", "CDN, cache, fila; saga se houver serviços"],
    ["Fintech regulada", "Modular ou poucos serviços", "Hexagonal ou Clean", "Event sourcing no ledger, sagas, idempotência"],
    ["App mobile com picos", "Serverless + CDN", "MVVM no app", "Fila, BFF, API compatível"],
    ["Plataforma de dados", "Lakehouse + pipelines", "Pipes and filters", "CDC ou eventos; streaming só onde precisa"],
  ],
  "compacta",
)}

${pratica(
  "Na entrevista",
  "<p>Se perguntarem \"monólito ou microsserviços?\", não escolha de primeira. Uma boa resposta começa com perguntas: quantos times, qual a carga, o que acontece se uma parte cair. Depois escolha, e diga o que faria você mudar de ideia. É exatamente o que as árvores deste capítulo fazem.</p>",
)}

<h3>Sinais de que está na hora de mudar</h3>
<p>A arquitetura certa hoje pode ficar errada daqui a dois anos: o time cresce, a carga muda, o negócio muda. A Lei de
Conway (Melvin Conway, 1968, vista no capítulo 2) lembra que o sistema tende a copiar a forma como a organização se comunica, então mudanças de
times costumam pedir mudanças de arquitetura. Em vez de esperar a dor virar crise, combine com o time quais sinais disparam
uma revisão.</p>

${fig(evolucao(), "Cada passo para a direita tem um gatilho. Sem ele, o passo só adiciona custo. E o caminho tem volta.", "normal")}

${tabela(
  ["Sinal", "O que costuma indicar", "Para onde olhar"],
  [
    ["Deploy virou fila: times esperam uns pelos outros para publicar", "Muitos times numa só unidade de deploy", "Módulos (cap. 12), depois serviços (cap. 14)"],
    ["Uma mudança pequena mexe em muitos arquivos e quebra coisas longe dali", "Fronteiras fracas, código embolado", "Monólito modular (cap. 12) ou vertical slice (cap. 8)"],
    ["Testes lentos e frágeis, porque toda regra precisa de banco e HTTP", "Regra misturada com infraestrutura", "Hexagonal ou Clean (caps. 6 e 7)"],
    ["Uma parte precisa de muito mais máquina que o resto (busca, vídeo, relatórios)", "Perfis de carga diferentes no mesmo deploy", "Extrair só essa parte (caps. 14 ou 15)"],
    ["Relatórios deixam as telas de venda lentas", "Leitura e escrita brigando pelo mesmo banco", "Réplica de leitura, depois CQRS (cap. 21)"],
    ["Um incidente ou um cliente grande derruba todos", "Falta de isolamento", "Filas, limites por cliente; em escala enorme, células (cap. 17)"],
    ["Serviços que sempre mudam e sobem juntos; cadeias longas de chamadas", "Monólito distribuído", "Juntar serviços de volta (caps. 12 e 31)"],
    ["O time gasta mais tempo com infraestrutura do que com produto", "Arquitetura maior que o problema", "Simplificar: menos partes, plataforma gerenciada"],
  ],
  "compacta",
)}

${alerta(
  "Maus motivos para mudar",
  "<ul><li>\"A empresa X usa.\" Ela tem outros times, outra carga e outro problema.</li><li>\"O código está feio.\" Isso pede refatoração, não outra arquitetura.</li><li>\"Quero aprender essa tecnologia.\" Aprenda num projeto paralelo, não em produção.</li><li>\"Reescrever do zero vai ser mais rápido.\" Raramente é; prefira migrar aos poucos (capítulo 30).</li></ul>",
)}

${pratica(
  "Regra de bolso",
  "<p>Mude quando o sinal aparecer <b>de forma repetida</b> e der para medir: tempo de deploy, tempo dos testes, incidentes, custo. Um incidente isolado pede correção; o mesmo incidente todo mês pede arquitetura.</p>",
)}

${combina([
  [2, "Os critérios que decidem a escolha", "de onde vêm as perguntas"],
  [27, "Comparativo geral", "todas as arquiteturas lado a lado"],
  [29, "Combinações que funcionam", "o passo seguinte à escolha"],
  [30, "Como migrar sem parar o sistema", "quando um sinal aparecer"],
  [31, "Anti-padrões", "o que acontece quando se pula a árvore"],
  [32, "Registrando decisões: ADRs", "para a escolha não se perder"],
])}

${lembre([
  "Decida primeiro o sistema por fora (quantas partes vão para o ar) e depois o código por dentro de cada parte.",
  "Times e padrão de carga pesam mais que moda: na dúvida, comece com menos partes e fronteiras bem feitas.",
  "Combine com o time os sinais que disparam uma revisão e registre cada escolha num ADR.",
])}
`;
