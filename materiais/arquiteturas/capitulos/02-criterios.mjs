// Capítulo 2: Os critérios que decidem a escolha. Capítulo conceitual da parte I (não segue o molde
// "quando usar / medidor" dos capítulos de arquitetura): atributos de qualidade, restrições, Lei de Conway,
// carga cognitiva, YAGNI e um método para priorizar com exemplo preenchido.

import { alerta, codigo, combina, dica, fig, lembre, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { bloco, caminho, check, claro, cor, linha, ret, semear, seta, servidor, quadro, txt, xis, banco } from "../desenho.mjs";

const f1 = (n) => n.toFixed(1);

/** Teia (radar) de atributos: o que importa num banco digital x num MVP de startup. */
function teia() {
  semear("criterios-1");
  let s = "";
  const cx = 380, cy = 182, R = 120;
  const eixos = ["escalabilidade", "disponibilidade", "desempenho", "segurança", "observabilidade", "custo baixo", "time-to-market", "manutenibilidade"];
  const ang = (i) => -Math.PI / 2 + (i * Math.PI * 2) / eixos.length;
  const pt = (i, v) => [cx + (Math.cos(ang(i)) * R * v) / 5, cy + (Math.sin(ang(i)) * R * v) / 5];
  const poligono = (vals) => `M${vals.map((v, i) => pt(i, v).map(f1).join(",")).join(" L")} Z`;
  // anéis (1 a 5) e eixos
  for (let k = 1; k <= 5; k++) s += caminho(poligono(eixos.map(() => k)), { cor: "#ced4da", espessura: k === 5 ? 1.4 : 1 });
  eixos.forEach((_, i) => (s += linha([[cx, cy], pt(i, 5)], { cor: "#ced4da", espessura: 1 })));
  // os dois sistemas (nota de 1 a 5 em cada eixo)
  const bancoDigital = [4, 5, 4, 5, 5, 2, 2, 4];
  const mvp = [1, 2, 2, 3, 2, 5, 5, 2];
  s += caminho(poligono(bancoDigital), { preench: claro.azul, cor: cor.azul, espessura: 2.6, gap: 9 });
  s += caminho(poligono(mvp), { preench: claro.laranja, cor: cor.laranja, espessura: 2.6, gap: 7 });
  // rótulos dos eixos
  eixos.forEach((e, i) => {
    const a = ang(i);
    const c = Math.cos(a);
    const x = cx + c * (R + 20);
    const y = cy + Math.sin(a) * (R + 20);
    const reto = Math.abs(c) < 0.2;
    s += txt(x, reto ? y + (Math.sin(a) < 0 ? -6 : 8) : y, e, { tam: 16, ancora: reto ? "middle" : c > 0 ? "start" : "end" });
  });
  // legenda e leitura
  s += ret(22, 20, 26, 18, { preench: claro.azul, cor: cor.azul, espessura: 2, gap: 5 });
  s += txt(58, 30, "banco digital", { tam: 16, ancora: "start" });
  s += ret(22, 52, 26, 18, { preench: claro.laranja, cor: cor.laranja, espessura: 2, gap: 5 });
  s += txt(58, 62, "MVP de startup", { tam: 16, ancora: "start" });
  s += txt(740, 28, "centro: importa pouco", { tam: 15, cor: cor.cinza, ancora: "end" });
  s += txt(740, 50, "borda: importa muito", { tam: 15, cor: cor.cinza, ancora: "end" });
  s += txt(740, 318, "formatos diferentes,\narquiteturas diferentes", { tam: 16, cor: cor.vermelho, ancora: "end" });
  return quadro(760, 348, s);
}

/** Escala vertical (máquina maior) x horizontal (mais máquinas iguais). */
function escalas() {
  semear("criterios-2");
  let s = "";
  s += linha([[380, 14], [380, 344]], { cor: "#ced4da", tracejado: true, espessura: 1.4 });
  // vertical
  s += txt(190, 24, "vertical (scale up)", { tam: 19, cor: cor.azul });
  s += txt(190, 50, "trocar por uma máquina maior", { tam: 15, cor: cor.cinza });
  s += servidor(60, 172, 56, 72, "hoje");
  s += seta(126, 208, 190, 208, { cor: cor.azul, espessura: 2.2 });
  s += servidor(204, 98, 112, 146, "amanhã", { luz: cor.azul });
  s += linha([[196, 82], [326, 82]], { cor: cor.vermelho, tracejado: true, espessura: 2 });
  s += txt(186, 82, "teto", { tam: 15, cor: cor.vermelho, ancora: "end" });
  s += check(40, 294) + txt(60, 294, "o código não muda", { tam: 15, ancora: "start" });
  s += xis(40, 318) + txt(60, 318, "tem teto e fica caro no topo", { tam: 15, ancora: "start" });
  s += xis(40, 342) + txt(60, 342, "se ela cair, cai tudo", { tam: 15, ancora: "start" });
  // horizontal
  s += txt(570, 24, "horizontal (scale out)", { tam: 19, cor: cor.violeta });
  s += txt(570, 50, "somar máquinas iguais", { tam: 15, cor: cor.cinza });
  s += bloco(495, 68, 150, 38, "balanceador", { preench: claro.violeta, tam: 16 });
  const xs = [430, 510, 590, 670];
  for (const x of xs) {
    s += seta(570, 108, x, 136, { cor: cor.violeta, espessura: 1.6, ponta: 10 });
    s += servidor(x - 24, 138, 48, 60, "", { luz: cor.violeta });
    s += linha([[x, 200], [550, 226]], { cor: cor.cinza, espessura: 1.2 });
  }
  s += banco(510, 220, 80, 52, "banco", { preench: claro.cinza, tam: 15 });
  s += txt(604, 246, "o banco vira\no próximo gargalo", { tam: 15, cor: cor.vermelho, ancora: "start" });
  s += check(420, 294) + txt(440, 294, "quase sem teto", { tam: 15, ancora: "start" });
  s += check(420, 318) + txt(440, 318, "uma cai, as outras seguem", { tam: 15, ancora: "start" });
  s += xis(420, 342) + txt(440, 342, "exige app sem estado (stateless)", { tam: 15, ancora: "start" });
  return quadro(760, 356, s);
}

/** Lei de Conway: times por tecnologia viram camadas; times por produto viram fatias. */
function conway() {
  semear("criterios-3");
  let s = "";
  s += linha([[384, 14], [384, 306]], { cor: "#ced4da", tracejado: true, espessura: 1.4 });
  // esquerda: times por tecnologia
  s += txt(190, 24, "times por tecnologia", { tam: 18 });
  const camadas = [
    ["time de front", "frontend"],
    ["time de back", "backend"],
    ["time de banco", "banco de dados"],
  ];
  camadas.forEach(([time, camada], i) => {
    const y = 58 + i * 74;
    s += bloco(14, y, 124, 50, time, { preench: claro.amarelo, tam: 15 });
    s += seta(140, y + 25, 172, y + 25, { espessura: 1.8 });
    s += bloco(176, y, 164, 50, "", { preench: claro.azul });
    s += txt(258, y + 25, camada, { tam: 16 });
  });
  s += seta(362, 46, 362, 270, { cor: cor.vermelho, espessura: 2.4, tracejado: true });
  s += txt(190, 292, "cada feature passa pelos 3 times", { tam: 15, cor: cor.vermelho });
  // direita: times por produto
  s += txt(575, 24, "times por produto", { tam: 18 });
  const fatias = ["Pedidos", "Pagamentos", "Catálogo"];
  fatias.forEach((nome, i) => {
    const x = 404 + i * 118;
    s += bloco(x, 46, 106, 42, nome, { preench: claro.amarelo, tam: 15 });
    s += seta(x + 53, 90, x + 53, 116, { espessura: 1.8 });
    s += ret(x, 120, 106, 152, { preench: claro.azul, espessura: 2, gap: 6 });
    ["tela", "API", "dados"].forEach((parte, j) => {
      const py = 128 + j * 47;
      s += bloco(x + 10, py, 86, 38, parte, { preench: "#ffffff", hachura: "solid", tam: 15, espessura: 1.4 });
    });
  });
  s += txt(575, 292, "cada time entrega sozinho", { tam: 15, cor: cor.verde });
  s += txt(380, 336, "o desenho do sistema copia o jeito como os times conversam", { tam: 16, cor: cor.vermelho });
  return quadro(760, 352, s);
}

export default `
${resumo(
  "Não existe arquitetura melhor. Existe a que entrega os <b>atributos de qualidade</b> que mais importam para o seu sistema, dentro das <b>restrições</b> que você tem: time, prazo, dinheiro, leis e sistemas antigos.",
  "Van, carro esportivo e compacto são todos bons carros. O certo depende de quantas pessoas você leva, quanto pode gastar e por onde vai rodar. Ninguém compra uma van \"porque é o melhor carro\".",
)}

<p>Todo sistema tem dois tipos de requisito. Os <b>funcionais</b> dizem <i>o que</i> ele faz: "o cliente faz um pedido".
Os <b>atributos de qualidade</b> (também chamados de requisitos não funcionais) dizem <i>quão bem</i> ele faz: "o pedido é
confirmado em menos de um segundo, mesmo na Black Friday". Quase qualquer arquitetura entrega os funcionais; quem decide a
arquitetura são os atributos de qualidade. Por trás disso está o que Mark Richards e Neal Ford chamam de primeira lei da arquitetura de software:
<b>tudo é uma troca</b> (<i style="white-space:nowrap">trade-off</i>). Ganhar em um atributo quase sempre custa algo em outro.</p>

${fig(teia(), "O que importa num banco digital (azul) e num MVP de startup (laranja): dois bons sistemas, dois desenhos diferentes.")}

<h3>Os atributos de qualidade</h3>
<p>A lista muda de livro para livro, mas estes dez aparecem em quase toda decisão real.</p>

<h4>Escalabilidade: aguentar mais carga</h4>
<p>É atender mais usuários, pedidos ou dados somando recursos, sem o desempenho despencar. Pense numa loja na Black Friday,
com muitas vezes o tráfego de um dia comum. Não confunda com desempenho: um sistema pode responder rápido para cem usuários
e travar com dez mil. Desempenho é quão rápido; escalabilidade é continuar rápido quando a carga cresce. Há dois caminhos, e
uma variação:</p>
<ul>
<li><b>Vertical</b> (<i>scale up</i>): uma máquina maior, com mais CPU e memória. O código não muda, mas há um teto, o preço
dispara perto do topo e continua sendo uma máquina só.</li>
<li><b>Horizontal</b> (<i>scale out</i>): mais máquinas iguais atrás de um balanceador de carga. Quase não tem teto e aguenta a
queda de uma delas. Em troca, a aplicação precisa ser <b>sem estado</b> (<i>stateless</i>): sessão, carrinho e arquivos saem da
memória da máquina e vão para um banco, um cache (como o Redis) ou um armazenamento compartilhado. E o banco vira o próximo
gargalo: réplicas de leitura ajudam; dividir as escritas (<i>sharding</i>) é bem mais difícil.</li>
<li><b>Elasticidade</b>: crescer e encolher sozinho conforme a demanda (escala automática, serverless). Serve para picos fortes, como
um app de delivery cheio no almoço e quase parado de madrugada.</li>
</ul>

${fig(escalas(), "Vertical é o caminho mais simples até bater no teto. Horizontal quase não tem teto, mas cobra uma aplicação sem estado.")}

${dica(
  "Comece pelo vertical",
  "<p>Uma máquina grande aguenta muito mais do que parece. O Stack Overflow ficou conhecido por atender um tráfego enorme com um monólito em poucos servidores (capítulo 11). E escalar na horizontal não exige microsserviços: um monólito sem estado também roda em várias cópias atrás de um balanceador.</p>",
)}

<h4>Disponibilidade: estar no ar quando precisam</h4>
<p>É a porcentagem do tempo em que o sistema funciona, dita em "noves". De 99% para 99,9% parece pouco, mas é a diferença
entre três dias e meio e nove horas fora do ar por ano.</p>

${tabela(
  ["Disponibilidade", "Fora do ar por ano", "Por mês", "O que costuma exigir"],
  [
    ["<b>99%</b>", "≈ 3,65 dias", "≈ 7,3 horas", "Um servidor; deploy com janela de manutenção"],
    ["<b>99,9%</b>", "≈ 8,8 horas", "≈ 44 minutos", "Duas instâncias, banco com réplica, deploy sem parar"],
    ["<b>99,99%</b>", "≈ 53 minutos", "≈ 4,4 minutos", "Várias zonas, troca automática em falha, plantão"],
    ["<b>99,999%</b>", "≈ 5,3 minutos", "≈ 26 segundos", "Várias regiões, isolamento por células, muita automação"],
  ],
)}

<p>Cada nove a mais custa bem mais que o anterior: com 99,99%, um deploy ruim que leve uma hora para ser revertido estoura
o ano. E disponibilidade <b>se multiplica</b>: três serviços em sequência, cada um com 99,9%, dão cerca de 99,7%
(0,999 × 0,999 × 0,999), umas 26 horas fora por ano. Dividir em serviços só ajuda se uma parte puder falhar sem derrubar as
outras. Três siglas: o <b>SLI</b> (indicador de nível de serviço) é o número medido (a porcentagem de requisições com sucesso, por exemplo); o <b>SLO</b> (objetivo
de nível de serviço), a meta interna do time; o <b>SLA</b> (acordo de nível de serviço), a meta prometida em contrato, em geral mais folgada que o SLO
e com multa se descumprida.</p>

<h4>Desempenho: latência e vazão</h4>
<p><b>Latência</b> é quanto uma resposta demora; <b>vazão</b> (<i>throughput</i>), quantas respostas saem por segundo. Meça
latência em <b>percentis</b>, não em média: o <b>p95</b> é o tempo dentro do qual 95% das requisições terminam. Uma média de
200 ms pode esconder um cliente em cada dez esperando 1,5 segundo no checkout: o p95 mostra isso; a média, não. Em fluxos
críticos, acompanhe também o p99. Na arquitetura, o vilão é o salto de rede: uma
chamada de função leva nanossegundos; uma chamada a outro serviço, mesmo no mesmo data center, de frações de milissegundo a
vários milissegundos. Serviços que conversam demais (capítulo 14) deixam tudo lento; cache e CQRS (separar leitura de
escrita, capítulo 21) ajudam quando a leitura domina.</p>

<h4>Os outros sete</h4>
<ul>
<li><b>Manutenibilidade</b> (dá para mudar sem quebrar outra coisa?): mudar a regra do frete grátis deveria mexer em um lugar,
não em 14 arquivos. Pede módulos com fronteiras claras (capítulos 4 a 8 e 12).</li>
<li><b>Testabilidade</b> (dá para testar a regra sem subir o mundo?): testar os juros de um empréstimo sem banco de dados nem API externa. Pede regra isolada da infraestrutura (capítulos 6 e 7).</li>
<li><b>Implantação independente</b> (dá para subir uma parte sem subir tudo?): o time de pagamentos publica uma correção às 15h
sem esperar a próxima versão do catálogo (capítulos 14 e 16).</li>
<li><b>Segurança</b> (quem pode ver e mexer em quê?): num app de saúde, vazar exames é dano real e problema legal. Pede pouca
superfície exposta, dados sensíveis isolados e permissão mínima.</li>
<li><b>Custo</b> (quanto custa construir e manter?): cada serviço a mais traz pipeline, monitoramento e plantão;
serverless sai barato com pouco tráfego e pode sair caro com tráfego alto e constante (capítulo 15).</li>
<li><b>Time-to-market</b> (quanto tempo até o usuário ver?): a startup precisa testar a ideia antes de o dinheiro acabar.
Favorece o simples e o que o time já domina (capítulo 11).</li>
<li><b>Observabilidade</b> (dá para entender o que aconteceu olhando de fora?): "o pedido 4821 levou 9 segundos: onde?". Num
monólito, logs e métricas costumam bastar; com 15 serviços, é preciso rastreamento distribuído (<i>tracing</i>).</li>
</ul>

<h4>Eles brigam entre si</h4>
${tabela(
  ["Se você puxa...", "...costuma pagar em"],
  [
    ["Disponibilidade (mais noves)", "Custo e trabalho de operação"],
    ["Implantação independente (muitos serviços)", "Observabilidade, latência de rede e custo"],
    ["Desempenho (cache, dados duplicados)", "Manutenibilidade e consistência dos dados"],
    ["Time-to-market (atalhos)", "Manutenibilidade depois (dívida técnica)"],
    ["Segurança (mais controles e etapas)", "Time-to-market e, às vezes, experiência de uso"],
  ],
)}

<h3>Restrições: o que você não escolhe</h3>
<p>Atributos são o que você quer; restrições são o que você tem. Elas cortam opções antes de qualquer debate técnico.</p>
<ul>
<li><b>Tamanho e experiência do time</b>: cinco devs não sustentam 30 serviços, e tecnologia que ninguém operou em produção,
com prazo curto, é risco dobrado. Time pequeno pede monólito ou monólito modular (capítulos 11 e 12).</li>
<li><b>Prazo e orçamento</b>: pouco tempo favorece o simples e o gerenciado pelo provedor (serverless, plataformas prontas); cada parte
implantável a mais tem custo fixo, de nuvem e de gente.</li>
<li><b>Regulação</b>: LGPD, regras do Banco Central para instituições financeiras e o padrão PCI DSS para dados de cartão. Pedem dados
sensíveis isolados, trilha de auditoria e controle de onde o dado fica.</li>
<li><b>Sistemas legados</b>: um ERP que só aceita arquivo à noite empurra para integração em lote. Isole o legado atrás de um
adaptador (capítulo 6) e migre aos poucos (capítulo 30).</li>
</ul>

<h3>Lei de Conway: o organograma vira arquitetura</h3>
<p>Em 1968, Melvin Conway escreveu a observação que ficou conhecida como Lei de Conway. Em tradução livre:
<i>"organizações que projetam sistemas acabam produzindo desenhos que copiam a estrutura de comunicação dessas
organizações"</i>.
Duas partes do sistema só se encaixam se as pessoas que as constroem conversarem: onde os times conversam muito, o código
acopla; onde quase não conversam, nasce uma fronteira (uma API, um contrato).</p>

${fig(conway(), "Times por tecnologia viram camadas; times por produto viram fatias que cada time entrega sozinho.")}

<p>Numa loja com times de front, back e banco, um "cupom de desconto" vira três tarefas em três filas; com times por
produto, fica inteiro com o time de Pedidos. A <b>manobra inversa de Conway</b> usa a lei a seu favor: primeiro decida a
arquitetura, depois monte os times nesse formato. Quer um serviço de pagamentos independente? Crie um time dono de pagamentos
de ponta a ponta: tela, API, dados, deploy e plantão.</p>

${alerta(
  "Serviços novos, times velhos",
  "<p>Dividir o sistema em dez microsserviços e manter os mesmos três times por tecnologia dá o pior dos mundos: todo deploy exige coordenar vários serviços. É o monólito distribuído (capítulos 14 e 31). Se não dá para mudar os times, a divisão provavelmente também não vai funcionar.</p>",
)}

<h4>Carga cognitiva dos times</h4>
<p>É quanto um time precisa manter na cabeça para trabalhar bem: o negócio, os serviços que são dele, as ferramentas, o
deploy, os alertas do plantão (em software, a ideia ficou popular com o livro <i>Team Topologies</i>, de Matthew
Skelton e Manuel Pais).
Sinais de excesso: medo de mexer no próprio código e alertas que ninguém entende. Regra de bolso: cada time deve ser dono de uma parte que consegue entender por inteiro. Se cinco pessoas
cuidam de doze serviços, junte serviços, divida o domínio entre mais times ou tire delas o que é ferramenta (deploy,
monitoramento) com uma plataforma interna.</p>

<h3>YAGNI e o custo da complexidade antecipada</h3>
<p><b>YAGNI</b> (<i>You Aren't Gonna Need It</i>, "você não vai precisar disso") é um princípio do Extreme Programming (XP):
não construa hoje o que você só acha que vai precisar amanhã. Em arquitetura, vale ainda mais, porque complexidade estrutural
cobra quatro contas: <b>construir</b> (semanas montando cluster, fila e oito serviços antes do primeiro cliente),
<b>carregar</b> (toda feature passa por mais peças, deploys e contratos, todo dia), <b>atrasar</b> (o que deixou de ser
entregue enquanto se preparava uma escala que não veio) e <b>errar a previsão</b> (o crescimento vem por outro lado e a
estrutura antecipada atrapalha).</p>
<p>Imagine quatro devs que começam um app de agendamento para salões com doze microsserviços, Kafka e Kubernetes. Meses depois, há poucas centenas de clientes, metade do time cuida de infraestrutura e mudar uma
tela exige alterar quatro serviços.</p>

${dica(
  "YAGNI não é desculpa para bagunça",
  "<p>Módulos com fronteiras claras e testes custam pouco e deixam portas abertas. É a ideia do <i>Monolith First</i> (\"primeiro o monólito\"), de Martin Fowler (2015): começar com um monólito e só dividir quando as fronteiras estiverem claras (capítulo 12). Guarde o cuidado extra para o que é difícil de desfazer (o banco principal, um formato de dados público, a divisão em serviços) e decida rápido o resto.</p>",
)}

<h3>Como priorizar: três atributos e o que você sacrifica</h3>
<p>Se tudo é prioridade, nada é. O método cabe numa reunião de uma hora:</p>
${passos([
  "Escreva o contexto: o que o sistema faz, quem usa, carga esperada, time, prazo e orçamento.",
  "Para cada atributo, pergunte: <i>se isso falhar, o que acontece com o negócio?</i> Escolha os <b>três</b> que mais importam. Só três: é isso que força a conversa sobre trocas.",
  "Marque os <b>pisos obrigatórios</b>: fora do top 3, mas com mínimo exigido (LGPD, por exemplo).",
  "Escreva o que vai <b>sacrificar</b> e até quando: é o que evita briga depois.",
  "Transforme cada prioridade numa meta medível (\"tem que ser rápido\" não é meta; o cenário abaixo é), escolha a arquitetura mais simples que atende as três e registre num ADR (capítulo 32).",
])}

${codigo(
  `
Situação:   sexta à noite, pico de pedidos
Ação:       cliente toca em "finalizar pedido"
Resposta:   pedido confirmado e pagamento autorizado
Medida:     p95 abaixo de 2 segundos, já contando o cartão`,
  "cenário de qualidade (desempenho): o formato que deixa a meta testável",
  { realce: false },
)}

<p>Melhor ainda se a meta virar um teste de carga no pipeline, que falha se o p95 passar do limite. É um exemplo de
<b>função de aptidão</b> (<i>fitness function</i>) do livro <i>Building Evolutionary Architectures</i>, de Neal Ford, Rebecca Parsons e
Patrick Kua.</p>

<p><b>Exemplo preenchido.</b> Imagine um app de delivery para uma rede regional de restaurantes: seis devs, quatro meses para
lançar, pico forte no almoço e no jantar, pagamento com cartão.</p>
${tabela(
  ["Atributo", "Decisão", "Meta ou motivo"],
  [
    ["Time-to-market", "<b>Top 1</b>", "No ar em quatro meses, ou o contrato com a rede fica em risco."],
    ["Disponibilidade", "<b>Top 2</b>", "99,9% no almoço e no jantar: fora do ar é pedido perdido."],
    ["Desempenho", "<b>Top 3</b>", "Checkout com p95 abaixo de 2 segundos no pico, já contando o cartão."],
    ["Segurança", "Piso", "Cartão só pelo gateway de pagamento; dados conforme a LGPD."],
    ["Escalabilidade", "Sacrifica", "Duas instâncias dão conta de uma rede; revisar se outras entrarem."],
    ["Implantação independente", "Sacrifica", "Um deploy do sistema inteiro basta para um time só."],
    ["Observabilidade", "Parcial", "Logs e métricas agora; <i>tracing</i> só se surgirem serviços separados."],
  ],
)}
<p>Resultado: um monólito modular (capítulo 12) com módulos de pedidos, cardápio, pagamentos e entregas, banco gerenciado com réplica
e duas instâncias atrás de um balanceador. Gatilho para revisar: um segundo time no projeto ou outras redes entrando.</p>

<h3>Erros comuns</h3>
<ul>
<li><b>Escolher pela moda</b>: copiar uma big tech, com outros atributos e outras restrições.</li>
<li><b>Lista de desejos sem números</b>: com "rápido, seguro e escalável", qualquer arquitetura parece servir.</li>
<li><b>Decidir e nunca revisar</b>: anote junto da decisão o que faria você revê-la.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>A Shopify contou no blog de engenharia que, em vez de quebrar seu grande monólito Rails em microsserviços, organizou-o por dentro em módulos com fronteiras claras e criou a ferramenta Packwerk para vigiar essas fronteiras. Priorizaram a produtividade do time e o código fácil de mudar, sem pagar a conta de operar um sistema distribuído: atributos acima da moda (capítulo 12).</p>",
)}

${combina([
  [3, "O mapa das arquiteturas", "os tipos lado a lado"],
  [27, "Comparativo geral", "notas por atributo"],
  [28, "Árvore de decisão", "critérios viram perguntas"],
  [32, "ADRs", "registrar as trocas"],
  [12, "Monólito modular", "começa simples"],
  [17, "Arquitetura em células", "para muitos noves"],
])}

${lembre([
  "Arquitetura é escolher trocas: os atributos de qualidade brigam entre si, e as restrições (time, prazo, dinheiro, leis, legado) cortam opções.",
  "Escolha os três atributos que mais importam, transforme cada um em meta medível e escreva o que você vai sacrificar.",
  "O sistema copia a forma dos times (Conway): desenhe times e arquitetura juntos, e não construa hoje a escala que você só imagina ter amanhã.",
])}
`;
