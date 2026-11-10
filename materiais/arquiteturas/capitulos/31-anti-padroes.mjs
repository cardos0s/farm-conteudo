// Capítulo 31 — Anti-padrões. Capítulo da parte V (não é de uma arquitetura): os 13 anti-padrões mais comuns,
// em três grupos (no código, na divisão do sistema, nas decisões). Cada um tem o mesmo formato: definição +
// teste rápido + tabela "como reconhecer / por que dói / como sair".

import { alerta, codigo, combina, dica, fig, lembre, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, check, claro, cor, etiqueta, fila, linha, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

/* ------------------------------------------------------------------ diagramas */

/** Ponto na borda do retângulo r, na direção do ponto alvo (com uma folga). */
function naBorda(r, alvo, folga = 5) {
  const cx = r.x + r.w / 2,
    cy = r.y + r.h / 2;
  const dx = alvo[0] - cx,
    dy = alvo[1] - cy;
  const t = Math.min((r.w / 2 + folga) / Math.abs(dx || 1e-9), (r.h / 2 + folga) / Math.abs(dy || 1e-9));
  return [cx + dx * t, cy + dy * t];
}

/** Seta de borda a borda entre dois retângulos. */
function ligar(a, b, o = {}) {
  const ca = [a.x + a.w / 2, a.y + a.h / 2],
    cb = [b.x + b.w / 2, b.y + b.h / 2];
  const p1 = naBorda(a, cb),
    p2 = naBorda(b, ca);
  return seta(p1[0], p1[1], p2[0], p2[1], o);
}

/** Diagrama 1: os mesmos pedaços como bola de lama (tudo depende de tudo) e como módulos com API. */
function bolaDeLama() {
  semear("anti-padroes-1");
  let s = "";

  // lado esquerdo: bola de lama
  s += txt(180, 22, "bola de lama", { tam: 19, cor: cor.vermelho });
  const P = { x: 35, y: 62, w: 110, h: 44, nome: "Pedidos" };
  const C = { x: 215, y: 52, w: 110, h: 44, nome: "Clientes" };
  const U = { x: 125, y: 155, w: 110, h: 44, nome: "utils" };
  const E = { x: 20, y: 250, w: 110, h: 44, nome: "Estoque" };
  const F = { x: 225, y: 240, w: 110, h: 44, nome: "Frete" };
  const G = { x: 120, y: 325, w: 110, h: 44, nome: "Pagamento" };
  const fina = { cor: cor.cinza, espessura: 1.5, ponta: 10 };
  for (const [a, b] of [
    [P, U],
    [U, E],
    [E, P],
    [F, U],
    [U, C],
    [G, E],
    [G, F],
    [C, F],
    [E, F],
    [U, G],
  ])
    s += ligar(a, b, fina);
  s += ligar(P, C, { cor: cor.vermelho, espessura: 2, duplo: true, ponta: 11 });
  s += txt(180, 62, "ciclo", { tam: 15, cor: cor.vermelho });
  for (const b of [P, C, U, E, F, G]) s += bloco(b.x, b.y, b.w, b.h, b.nome, { preench: b === U ? claro.laranja : claro.cinza, hachura: "solid", tam: 16 });
  s += xis(102, 396, 14);
  s += txt(195, 396, "tudo importa tudo", { tam: 16, cor: cor.vermelho });

  s += linha([[380, 14], [380, 404]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });

  // lado direito: módulos com fronteira
  s += txt(570, 22, "módulos com fronteira", { tam: 19, cor: cor.verde });
  const PM = { x: 400, y: 125, w: 125, h: 150 };
  const EM = { x: 600, y: 52, w: 140, h: 112 };
  const GM = { x: 600, y: 228, w: 140, h: 112 };
  for (const [m, nome] of [
    [PM, "Pedidos"],
    [EM, "Estoque"],
    [GM, "Pagamento"],
  ]) {
    s += bloco(m.x, m.y, m.w, m.h, nome, { preench: claro.verde, topo: true, tam: 17 });
    s += txt(m.x + m.w / 2, m.y + m.h / 2 + 14, "interno\nprivado", { tam: 15, cor: cor.cinza });
  }
  // portas (API pública) na borda esquerda de Estoque e Pagamento
  const porta = (x, y) => bloco(x - 9, y - 9, 18, 18, "", { preench: cor.verde, hachura: "solid" });
  s += porta(600, 118) + txt(586, 98, "API", { tam: 15, cor: cor.verde, ancora: "end" });
  s += porta(600, 294) + txt(586, 318, "API", { tam: 15, cor: cor.verde, ancora: "end" });
  s += seta(527, 165, 588, 120, { cor: cor.verde, espessura: 2 });
  s += seta(527, 238, 588, 292, { cor: cor.verde, espessura: 2 });
  // atalho proibido entre módulos
  s += seta(700, 168, 700, 224, { cor: cor.vermelho, tracejado: true, espessura: 1.8, ponta: 10 });
  s += xis(700, 196, 14);
  s += txt(684, 187, "import direto:", { tam: 15, cor: cor.vermelho, ancora: "end" });
  s += txt(684, 206, "barrado no CI", { tam: 15, cor: cor.vermelho, ancora: "end" });
  s += check(476, 394, 18);
  s += txt(584, 396, "só se entra pela API", { tam: 16, cor: cor.verde });
  return quadro(760, 412, s);
}

/** Diagrama 2: monólito distribuído (em cima) x microsserviços de verdade (embaixo). */
function distribuido() {
  semear("anti-padroes-2");
  let s = "";

  // em cima: monólito distribuído
  s += txt(20, 22, "monólito distribuído", { tam: 19, cor: cor.vermelho, ancora: "start" });
  s += ret(30, 48, 680, 82, { tracejado: true, cor: cor.vermelho, espessura: 1.5 });
  s += etiqueta(610, 48, "deploy junto", { preench: claro.vermelho, tam: 15 });
  s += bloco(55, 68, 140, 48, "Pedidos", { preench: claro.cinza, hachura: "solid" });
  s += bloco(300, 68, 140, 48, "Estoque", { preench: claro.cinza, hachura: "solid" });
  s += bloco(545, 68, 140, 48, "Pagamento", { preench: claro.cinza, hachura: "solid" });
  s += seta(198, 92, 296, 92, { cor: cor.vermelho, espessura: 2, rotulo: "espera", dy: -12 });
  s += seta(443, 92, 541, 92, { cor: cor.vermelho, espessura: 2, rotulo: "espera", dy: -12 });
  s += banco(315, 158, 110, 74, "banco único", { preench: claro.vermelho, tam: 15 });
  s += seta(125, 120, 310, 190, { espessura: 1.6 });
  s += seta(370, 120, 370, 154, { espessura: 1.6 });
  s += seta(615, 120, 430, 190, { espessura: 1.6 });
  s += xis(42, 196, 14);
  s += txt(58, 186, "mudar uma coluna", { tam: 15, ancora: "start" });
  s += txt(58, 206, "= avisar 3 times", { tam: 15, ancora: "start" });
  s += xis(478, 212, 14);
  s += txt(494, 212, "um cai, todos caem", { tam: 15, ancora: "start" });

  s += linha([[20, 252], [740, 252]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });

  // embaixo: microsserviços de verdade
  s += txt(20, 278, "microsserviços de verdade", { tam: 19, cor: cor.verde, ancora: "start" });
  s += bloco(40, 318, 130, 48, "Pedidos", { preench: claro.verde, hachura: "solid" });
  s += linha([[105, 368], [105, 382]], { espessura: 1.5 });
  s += banco(72, 382, 66, 54, "dados", { preench: claro.verde, tam: 15 });
  s += txt(325, 300, "evento PedidoCriado", { tam: 15 });
  s += fila(245, 326, 160, 32, "");
  s += txt(325, 378, "assíncrono", { tam: 15, cor: cor.cinza });
  s += seta(173, 342, 241, 342, { espessura: 2 });
  s += bloco(495, 290, 130, 46, "Estoque", { preench: claro.verde, hachura: "solid" });
  s += bloco(495, 362, 130, 46, "Pagamento", { preench: claro.verde, hachura: "solid" });
  s += linha([[627, 313], [650, 313]], { espessura: 1.5 });
  s += linha([[627, 385], [650, 385]], { espessura: 1.5 });
  s += banco(650, 286, 66, 54, "dados", { preench: claro.verde, tam: 15 });
  s += banco(650, 358, 66, 54, "dados", { preench: claro.verde, tam: 15 });
  s += seta(409, 338, 491, 314, { tracejado: true, espessura: 1.8 });
  s += seta(409, 348, 491, 384, { tracejado: true, espessura: 1.8 });
  s += check(190, 430, 18);
  s += txt(208, 432, "cada um com seus dados: implanta e falha sozinho", { tam: 16, cor: cor.verde, ancora: "start" });
  return quadro(760, 450, s);
}


/* ------------------------------------------------------------------ formato de cada anti-padrão */

/** Células da tabela: frases curtas em sequência (mais compacto que lista com marcadores). */
const lista = (xs) => xs.join(" ");

/** Um anti-padrão: título, o que é, teste rápido e a tabela sinais / dor / saída. */
const anti = (n, nome, oQueE, teste, sinais, dor, saida) => `
<h3>${n}. ${nome}</h3>
<p>${oQueE} <b>Teste rápido:</b> <i>${teste}</i></p>
${tabela(["Como reconhecer", "Por que dói", "Como sair"], [[lista(sinais), lista(dor), lista(saida)]])}`;

/* ------------------------------------------------------------------ texto */

export default `
${resumo(
  "Anti-padrão é uma solução que parece boa, aparece em muitos projetos e, no fim, cria mais problemas do que resolve. Reconhecer os sinais cedo economiza meses (às vezes anos) de retrabalho.",
  "Pense na reforma da moda: derrubar a parede para integrar a cozinha à sala. Em muitas casas fica ótimo. Em outras, a parede era de sustentação. Quase todo anti-padrão é uma boa ideia no lugar errado ou na dose errada.",
)}

<p>O nome é o avesso de "padrão de projeto": em vez de uma solução que funciona e se repete, uma armadilha que se repete.
Um dos textos mais famosos sobre o tema é <i>Big Ball of Mud</i>, de Brian Foote e Joseph Yoder (1997). Eles notaram que,
apesar de todo o estudo sobre arquiteturas elegantes, a estrutura mais comum nos sistemas reais era a falta de estrutura:
código que cresceu sem plano, remendo sobre remendo, até virar uma bola de lama.</p>

<p>A seguir estão 13 anti-padrões clássicos, em três grupos: <b>no código</b>, <b>na divisão do sistema</b> e
<b>nas decisões</b>. Cada um tem o mesmo formato: o que é, uma pergunta para o seu time (o <b>teste rápido</b>) e uma tabela
com <b>como reconhecer</b>, <b>por que dói</b> e <b>como sair</b>.</p>

${fig(bolaDeLama(), "Os mesmos pedaços, duas organizações. À esquerda, qualquer arquivo importa qualquer outro. À direita, cada módulo esconde o que é interno e os outros só entram pela API pública.")}

<h4>Grupo 1 · No código</h4>
<p>Os quatro primeiros acontecem <b>dentro</b> de uma aplicação, seja ela um monólito ou um microsserviço.</p>

${anti(
  1,
  "Bola de lama (big ball of mud)",
  "Código sem estrutura reconhecível: qualquer parte usa qualquer outra e ninguém sabe onde termina uma responsabilidade. Quase nunca é escolhida: vai se formando, um atalho de cada vez.",
  "chega uma regra nova de frete: o time concorda sobre onde ela entra, ou cada um aponta para um arquivo diferente?",
  ["Dependências circulares e uma pasta <code>utils</code> que todo mundo importa.", "Mudança pequena quebra algo longe dali; \"só o fulano entende isso\"."],
  ["Cada mudança custa mais que a anterior.", "Para testar uma parte, é preciso subir tudo."],
  [
    "Não reescreva do zero: mapeie as dependências (com ferramentas como dependency-cruiser e madge) e desenhe fronteiras pelo negócio.",
    "Transforme cada fronteira em módulo com API pública (capítulo 12), protegido por checagem no CI. Migre um pedaço de cada vez (capítulo 30).",
  ],
)}

${anti(
  2,
  "Sinkhole (camadas que só repassam)",
  "A requisição atravessa camadas que só passam o dado adiante: o controller chama o serviço, que chama o repositório, sem regra nenhuma no caminho. Mark Richards descreve esse anti-padrão (\"sumidouro\") no livro <i>Software Architecture Patterns</i>.",
  "quantos métodos dos seus serviços têm uma linha só, que chama o repositório?",
  ["<code>PedidoService.buscar(id)</code> só faz <code>return repo.buscar(id)</code>.", "Um campo novo na tela mexe em cinco arquivos que só copiam dados."],
  ["Mais arquivos, testes e revisão, sem valor nenhum.", "Esconde onde está a regra de verdade."],
  [
    "Richards sugere a regra 80-20: ter uns 20% das requisições só de passagem é normal; a maioria, não.",
    "Deixe leituras simples irem direto ao repositório (camada aberta, capítulo 4) ou use fatias verticais (capítulo 8).",
  ],
)}

${anti(
  3,
  "Arquitetura lasanha (camadas demais)",
  "Prima do sinkhole, mas o problema aqui é a quantidade: controller, facade, service, manager, handler, repository, DAO, mapper, cada um com interface e DTO próprios. Costuma nascer de um \"e se um dia precisarmos trocar?\".",
  "quantos arquivos você abre para seguir uma requisição do começo ao fim?",
  ["Interfaces com uma implementação só, que nem os testes usam.", "Um DTO por camada e mappers que só copiam campos."],
  ["Uma feature simples vira mudança em dez arquivos.", "Abstração feita \"para o futuro\" raramente acerta o futuro."],
  ["Três camadas costumam bastar (capítulo 4): junte as que só repassam.", "Crie a abstração quando a segunda necessidade aparecer, não antes."],
)}

${anti(
  4,
  "Domínio anêmico",
  "As entidades viram sacos de dados (só getters e setters) e as regras moram em serviços enormes. Qualquer parte do código faz <code>pedido.status = \"cancelado\"</code> sem checar nada. O nome ficou conhecido por um texto de Martin Fowler.",
  "suas entidades têm algum método que não seja get ou set?",
  ["Serviços com milhares de linhas cheias de <code>if (pedido.status === ...)</code>.", "A mesma validação copiada em vários lugares."],
  ["Nada protege as regras: surgem estados impossíveis, como pedido cancelado e enviado.", "Cada cópia da regra diverge e vira um bug diferente."],
  ["Leve o comportamento para a entidade (<code>pedido.cancelar()</code>) e feche os setters.", "Num CRUD sem regra, modelo simples é aceitável."],
)}

${codigo(
  `
type Status = "aberto" | "pago" | "cancelado";

// ANTES: só dados; qualquer código muda o status sem checar nada
class PedidoAnemico { status: Status = "aberto"; }
const anemico = new PedidoAnemico();
anemico.status = "cancelado"; // e se já estava pago? ninguém checou

// DEPOIS: a entidade protege as próprias regras
class Pedido {
  private _status: Status = "aberto";
  get status() { return this._status; }
  cancelar() {
    if (this._status === "pago") throw new Error("Pedido pago: faça um estorno");
    this._status = "cancelado";
  }
}`,
  "pedido.ts: de saco de dados a entidade com comportamento",
)}

<h4>Grupo 2 · Na divisão do sistema</h4>
<p>Os seis seguintes aparecem quando o sistema é dividido em partes que rodam separadas. A armadilha de fundo é quase sempre a mesma: dividir o deploy sem dividir o acoplamento.</p>

${fig(distribuido(), "Em cima, serviços separados que dependem do mesmo banco e esperam a resposta uns dos outros, e por isso vão para o ar juntos. Embaixo, cada serviço é dono dos seus dados e avisa os outros por eventos.", "grande")}

${anti(
  5,
  "Microsserviços prematuros",
  "Começar com microsserviços antes de conhecer o domínio, ou sem time e operação para cuidar deles. Em <i>Monolith First</i> (2015), Martin Fowler notou que quase todas as histórias de sucesso com microsserviços começaram com um monólito que cresceu demais e foi dividido, e que quase todo sistema que nasceu em microsserviços teve problemas sérios.",
  "o time tem mais serviços do que pessoas?",
  ["Quatro pessoas cuidando de quinze serviços.", "Fronteiras que mudam todo mês; mais tempo com cluster e pipeline do que com produto."],
  ["Fronteira errada entre serviços custa muito mais para corrigir do que entre pastas.", "Você paga o preço do distribuído sem ter o problema que ele resolve."],
  ["Comece (ou volte) com um monólito modular (capítulo 12).", "Extraia um serviço só com motivo concreto: escala, time ou ritmo de deploy diferentes (capítulo 14)."],
)}

${anti(
  6,
  "Monólito distribuído",
  "Serviços que, na prática, só funcionam e só vão para o ar juntos. Somam o custo do sistema distribuído (rede, latência, falha parcial) ao acoplamento do monólito. É onde costuma parar quem sai da bola de lama mudando só a forma de fazer deploy.",
  "dá para implantar um serviço sozinho, numa terça à tarde, sem avisar outro time?",
  ["Deploy coordenado: \"sobe o A, depois o B, depois o C\".", "Cadeias de chamadas síncronas, banco compartilhado e uma biblioteca com as entidades de todos."],
  ["Um serviço lento derruba o fluxo inteiro.", "Nenhuma das vantagens prometidas: nem deploy independente, nem times autônomos."],
  [
    "Se os serviços sempre mudam juntos, junte-os de novo. É uma saída honesta.",
    "Senão: dados com um só dono, eventos no lugar de cadeias síncronas (capítulo 20), fronteiras por capacidade de negócio.",
  ],
)}

${anti(
  7,
  "Nanosserviços",
  "Serviços pequenos demais: um por tabela, um por função, um \"serviço de validar CPF\". O custo fixo de cada um (pipeline, monitoramento, alertas, plantão) passa do valor da lógica que ele carrega.",
  "este serviço faria sentido como uma função numa biblioteca?",
  ["Uma ação simples do usuário passa por seis ou sete serviços.", "Serviços que nunca são chamados sozinhos."],
  ["O custo de operar se multiplica pelo número de serviços.", "Cada salto na rede soma latência e um ponto de falha."],
  ["Junte por capacidade de negócio (pedidos, estoque, pagamento), não por entidade.", "Lógica estável e sem estado vira biblioteca."],
)}

${anti(
  8,
  "Banco compartilhado entre serviços",
  "Vários serviços leem e escrevem nas mesmas tabelas. A tabela vira o contrato entre eles, só que sem versão, sem dono e sem documentação.",
  "você consegue renomear uma coluna sem perguntar a outro time?",
  ["Ninguém sabe quem escreve em cada tabela.", "Migração de banco exige reunião entre times."],
  ["Acoplamento invisível: está no banco, não no código.", "Um serviço pula as regras do dono; uma consulta pesada deixa todos lentos."],
  [
    "Um dono por tabela; os outros usam API ou eventos. Basta um schema por serviço, mesmo no mesmo servidor.",
    "Escrita em dados de vários donos vira saga (capítulo 23); relatório que cruza tudo usa uma base analítica (capítulo 26).",
  ],
)}

${anti(
  9,
  "Serviços tagarelas (chatty)",
  "Serviços que trocam dezenas de chamadas entre si para responder uma única requisição. É o velho problema N+1 do banco de dados (uma consulta para a lista e mais uma para cada item), só que pela rede.",
  "quantas chamadas de rede acontecem para montar uma tela?",
  ["Laços <code>for</code> com uma chamada HTTP por item.", "Tela lenta, embora cada serviço, sozinho, responda rápido."],
  [
    "A latência soma: 50 chamadas de 20 ms são 1 segundo só de rede.",
    "A disponibilidade multiplica: 5 serviços de 99,9% em cadeia ficam em cerca de 99,5% (de 8,8 para quase 44 horas fora por ano).",
  ],
  ["APIs em lote e cópia local dos dados mais lidos, atualizada por eventos.", "Se dois serviços conversam o tempo todo, talvez sejam um só."],
)}

${codigo(
  `
// ANTES: uma viagem pela rede por item (carrinho com 50 itens = 50 chamadas)
for (const item of carrinho.itens) {
  item.preco = await catalogo.buscarPreco(item.produtoId);
}

// Promise.all em paralelo reduz a espera, mas continua com 50 chamadas e 50 chances de falha

// DEPOIS: uma chamada em lote, um mapa de preços na volta
const ids = carrinho.itens.map((item) => item.produtoId);
const precos: Record<string, number> = await catalogo.buscarPrecos(ids);
for (const item of carrinho.itens) item.preco = precos[item.produtoId];`,
  "carrinho.ts: de tagarela a lote",
)}

${anti(
  10,
  "ESB \"deus\"",
  "Na SOA (capítulo 13), o barramento (ESB, <i>enterprise service bus</i>) deveria rotear e traduzir mensagens entre sistemas. Aos poucos ele ganha regras de negócio e orquestração, até virar o lugar onde a lógica da empresa mora.",
  "mudar uma regra de negócio exige o time do barramento?",
  ["Fila de pedidos para o \"time de integração\" a cada feature.", "Regras escritas em configuração do barramento, sem testes."],
  ["Gargalo de pessoas e ponto único de falha.", "Lógica difícil de testar e de versionar."],
  [
    "Pontas inteligentes, canos burros (<i>smart endpoints and dumb pipes</i>, do artigo de James Lewis e Martin Fowler, 2014): a regra volta para os serviços.",
    "Tire uma integração de cada vez do barramento, em vez de trocar tudo de uma vez (capítulo 30).",
  ],
)}

<h4>Grupo 3 · Nas decisões</h4>
<p>Os três últimos não são uma forma de código nem de deploy. São jeitos errados de escolher, e costumam gerar os outros dez.</p>

${anti(
  11,
  "Arquitetura de currículo",
  "Escolher tecnologia ou arquitetura porque está em alta ou fica bonita no currículo, e não porque resolve um problema do sistema. Em inglês, <i>resume-driven development</i>.",
  "que problema concreto essa tecnologia resolve, e o que acontece se não a usarmos?",
  ["Kubernetes, Kafka e GraphQL num sistema interno com 50 usuários.", "Mais tecnologias na stack do que pessoas no time."],
  ["Cada tecnologia nova traz custo de operação, de aprendizado e de plantão.", "Quem escolheu sai da empresa; quem fica herda a complexidade."],
  ["Exija um ADR (registro de decisão de arquitetura, capítulo 32) com o problema, as alternativas e o custo.", "Tecnologia conhecida por padrão; novidade só onde dá vantagem real. Para aprender, use protótipos."],
)}

${anti(
  12,
  "CQRS e event sourcing em tudo",
  "CQRS (capítulo 21) e event sourcing (capítulo 22) resolvem problemas reais, como auditoria e leitura pesada. No sistema todo, até no cadastro de categorias, viram um imposto em cada feature. Martin Fowler avisa que, na maioria dos sistemas, CQRS traz complexidade arriscada e deve ficar em partes específicas.",
  "este módulo precisa mesmo de histórico de eventos ou de um modelo de leitura separado?",
  ["Salvou e a tela mostra o dado antigo: consistência eventual que ninguém pediu.", "Mais tempo com projeções e versões de evento do que com regra de negócio."],
  ["Complexidade em módulos que não precisavam dela.", "Bugs difíceis: projeção atrasada, evento antigo que o código novo não entende."],
  ["Use só onde o ganho é claro (financeiro, auditoria); o resto é CRUD.", "Para tirar event sourcing de um módulo: gere o estado atual a partir dos eventos, grave em tabelas comuns e passe a escrever nelas (os eventos antigos ficam como histórico)."],
)}

${anti(
  13,
  "Martelo de ouro",
  "\"Para quem só tem martelo, todo problema parece prego.\" O time usa a mesma solução para tudo porque é a que conhece ou a que deu certo da última vez: microsserviços em todo projeto novo, Kafka para qualquer comunicação. Vale também para as arquiteturas deste livro: hexagonal num script de 50 linhas é martelo de ouro.",
  "quando foi a última vez que o time comparou duas alternativas antes de decidir?",
  ["\"Aqui a gente sempre usa X\", antes de ouvir o problema.", "Gambiarras para encaixar o problema na ferramenta."],
  ["Custo demais onde não precisa, força de menos onde precisa."],
  ["Decida pelos critérios do capítulo 2 e pela árvore do capítulo 28.", "Registre pelo menos duas alternativas em cada ADR."],
)}

<h3>Como fazer um diagnóstico no seu sistema</h3>
${passos([
  "Liste com o time o que mais dói hoje (deploy demorado, medo de mexer, tela lenta) e passe os <b>testes rápidos</b> deste capítulo. Em geral, dois ou três anti-padrões explicam quase todas as dores.",
  "Meça antes de mudar: quantos arquivos (ou serviços) uma feature típica toca, quanto tempo leva um deploy, quantas chamadas de rede uma tela faz.",
  "Escolha uma saída pequena, que caiba em semanas, não em trimestres. Reescrever tudo do zero quase nunca é a saída.",
  "Proteja o ganho com algo automático (regra de dependência no CI, teste de contrato, alerta de latência) e registre a decisão num ADR (capítulo 32).",
])}

${pratica(
  "No mundo real",
  "<p>A <b>Shopify</b> contou no blog de engenharia que, em vez de quebrar seu grande monólito Rails em microsserviços, preferiu organizá-lo em componentes com fronteiras claras dentro do mesmo código. Para proteger essas fronteiras, criou o <b>Packwerk</b>, ferramenta de código aberto que aponta dependências proibidas entre componentes. É a saída da bola de lama sem cair no monólito distribuído.</p><p>O <b>Stack Overflow</b> é o contraexemplo dos microsserviços prematuros: por anos atendeu milhões de pessoas com uma aplicação monolítica em poucos servidores, como a própria equipe detalhou publicamente. Escala, sozinha, não é motivo para distribuir.</p>",
)}

${alerta(
  "Não troque um anti-padrão por outro",
  "<p>A fuga mais comum da bola de lama é partir direto para microsserviços. Sem fronteiras claras, o resultado é uma bola de lama distribuída, agora com rede no meio: o monólito distribuído do item 6. Simon Brown resume bem a ideia: se o time não consegue construir um monólito bem estruturado, microsserviços não vão ser a resposta. Primeiro as fronteiras (capítulo 12), depois a distribuição (capítulo 14).</p>",
)}

${dica(
  "Anti-padrão depende de contexto",
  "<p>Banco compartilhado é normal dentro de um monólito. Modelo simples, sem comportamento, serve num CRUD. Um pouco de sinkhole é esperado em qualquer sistema em camadas. Separar dados de funções puras, no estilo funcional, também não é domínio anêmico, desde que as regras fiquem num lugar só e os tipos impeçam estados inválidos. A pergunta certa não é \"isso tem nome de anti-padrão?\", e sim <b>\"quanto isso está custando, aqui, agora?\"</b></p>",
)}

${combina([
  [12, "Monólito modular", "a saída mais comum da bola de lama"],
  [14, "Microsserviços", "como dividir do jeito certo"],
  [30, "Como migrar sem parar o sistema", "sair de um anti-padrão aos poucos"],
  [32, "ADRs e revisão", "decidir com motivo e registrar"],
  [2, "Os critérios que decidem a escolha", "a cura do martelo de ouro"],
  [28, "Árvore de decisão", "escolher pela necessidade, não pela moda"],
])}

${lembre([
  "Quase todo anti-padrão é uma boa ideia no lugar errado ou na dose errada. Reconheça pelos sinais, não pelo nome.",
  "Distribuir não conserta acoplamento: sem fronteiras e dados com dono, microsserviços viram um monólito distribuído.",
  "Saia aos poucos: meça, crie fronteiras, proteja-as com checagens automáticas e registre o porquê das decisões.",
])}
`;
