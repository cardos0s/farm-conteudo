// Capítulo 7: Clean Architecture e Onion. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs):
// abertura → anéis → como funciona (regra de dependência, inversão, fluxo controller → caso de uso → presenter)
// → comparação com Onion, hexagonal e camadas → quando usar → na prática → custos → exagero → erros → fechamento.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, elipse, linha, navegador, passo, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Os quatro anéis da Clean, com a regra de dependência. */
function aneis() {
  semear("clean-onion-1");
  let s = "";
  const cx = 380, cy = 194;
  const camadas = [
    [740, 368, claro.azul],
    [570, 276, claro.verde],
    [400, 184, claro.vermelho],
    [220, 92, claro.amarelo],
  ];
  for (const [w, h, c] of camadas) {
    s += elipse(cx, cy, w, h, { preench: "#ffffff", hachura: "solid", cor: "#ffffff", espessura: 1 });
    s += elipse(cx, cy, w, h, { preench: c, gap: 8, espessura: 2.2 });
  }
  const nome = (y, t, tam = 17) => txt(cx, y, t, { tam, halo: 6 });
  const ex = (y, t) => txt(cx, y, t, { tam: 15, cor: cor.cinza, halo: 6 });
  s += nome(33, "Frameworks e drivers");
  s += nome(79, "Adaptadores de interface");
  s += nome(125, "Casos de uso");
  s += nome(183, "Entidades", 19);
  s += ex(207, "Pedido, Cliente");
  s += ex(263, "ex.: CriarPedido");
  s += ex(309, "controllers, presenters");
  s += ex(355, "Express, Postgres, React");
  // a regra de dependência: de fora para dentro
  s += seta(24, cy, 264, cy, { cor: cor.vermelho, espessura: 2.6, ponta: 15 });
  s += seta(736, cy, 496, cy, { cor: cor.vermelho, espessura: 2.6, ponta: 15 });
  s += txt(cx, 400, "o código só pode depender de quem está mais para dentro", { tam: 16, cor: cor.vermelho });
  return quadro(760, 414, s);
}

/** O caminho de uma requisição: controller → input port → interactor → output port → presenter. */
function fluxo() {
  semear("clean-onion-2");
  let s = "";
  // os três anéis envolvidos, lado a lado, com as fronteiras tracejadas
  s += txt(85, 22, "frameworks", { tam: 16, cor: cor.azul });
  s += txt(295, 22, "adaptadores", { tam: 16, cor: cor.verde });
  s += txt(590, 22, "casos de uso", { tam: 16, cor: cor.vermelho });
  s += linha([[175, 40], [175, 310]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += linha([[420, 40], [420, 310]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  // interface = caixa branca tracejada
  const interfaceBox = (x, y, w, h, nome) =>
    ret(x, y, w, h, { preench: "#ffffff", hachura: "solid", tracejado: true, espessura: 2 }) + txt(x + w / 2, y + h / 2, nome, { tam: 16 });
  // linha de cima: a requisição entra
  s += navegador(20, 56, 130, 70, "POST /pedidos");
  s += bloco(200, 64, 190, 52, "Controller", { preench: claro.verde });
  s += txt(590, 50, "(interface)", { tam: 15, cor: cor.cinza });
  s += interfaceBox(450, 64, 280, 52, "CriarPedidoInputPort");
  // meio: o caso de uso
  s += bloco(450, 150, 280, 52, "CriarPedido (interactor)", { preench: claro.vermelho, tam: 16 });
  // linha de baixo: a resposta sai
  s += navegador(20, 232, 130, 70, "JSON");
  s += bloco(200, 240, 190, 52, "Presenter", { preench: claro.verde });
  s += txt(590, 226, "(interface)", { tam: 15, cor: cor.cinza });
  s += interfaceBox(450, 240, 280, 52, "CriarPedidoOutputPort");
  // dependências: todas para a direita (para dentro)
  s += seta(152, 90, 198, 90, { espessura: 2 });
  s += seta(392, 90, 448, 90, { espessura: 2 });
  s += seta(520, 148, 520, 119, { espessura: 2, tracejado: true });
  s += seta(660, 204, 660, 237, { espessura: 2 });
  s += seta(152, 266, 198, 266, { espessura: 2 });
  s += seta(392, 266, 448, 266, { espessura: 2, tracejado: true });
  // ordem da requisição
  s += passo(175, 66, "1");
  s += passo(420, 66, "2");
  s += passo(420, 292, "3");
  s += passo(175, 292, "4");
  // legenda
  s += seta(20, 342, 70, 342, { espessura: 2 });
  s += txt(80, 343, "chama / usa", { tam: 15, ancora: "start" });
  s += seta(220, 342, 270, 342, { espessura: 2, tracejado: true });
  s += txt(280, 343, "implementa", { tam: 15, ancora: "start" });
  s += passo(420, 342, "1");
  s += txt(440, 343, "ordem da requisição (vai e volta)", { tam: 15, ancora: "start" });
  s += txt(380, 376, "toda seta que cruza uma fronteira aponta para dentro", { tam: 16, cor: cor.vermelho });
  return quadro(760, 392, s);
}

/** Camadas x Clean/Onion: a seta entre negócio e dados vira de lado. */
function inversao() {
  semear("clean-onion-3");
  let s = "";
  s += linha([[380, 10], [380, 290]], { tracejado: true, cor: cor.cinza, espessura: 1.3 });
  // esquerda: camadas tradicionais
  s += txt(180, 18, "Camadas (capítulo 4)", { tam: 17 });
  s += bloco(70, 36, 220, 38, "Apresentação", { preench: claro.azul });
  s += bloco(70, 94, 220, 68, "Negócio", { preench: claro.amarelo, topo: true });
  s += txt(180, 142, "chama o PedidoDAO", { tam: 15, cor: cor.cinza, halo: 5 });
  s += bloco(70, 190, 220, 38, "PedidoDAO", { preench: claro.violeta, tam: 16 });
  s += banco(135, 244, 90, 44, "Postgres", { preench: claro.violeta, tam: 15 });
  s += seta(180, 76, 180, 92, { espessura: 2 });
  s += seta(180, 164, 180, 188, { espessura: 2.4, cor: cor.vermelho });
  s += txt(240, 176, "depende", { tam: 15, cor: cor.vermelho });
  s += seta(180, 230, 180, 242, { espessura: 1.8, ponta: 9 });
  s += txt(180, 310, "o negócio depende do banco", { tam: 16, cor: cor.vermelho });
  // direita: Clean e Onion
  s += txt(580, 18, "Clean e Onion", { tam: 17 });
  s += bloco(470, 36, 220, 38, "Apresentação", { preench: claro.azul });
  s += bloco(470, 94, 220, 68, "Negócio", { preench: claro.amarelo, topo: true });
  s += ret(492, 126, 176, 28, { preench: "#ffffff", hachura: "solid", tracejado: true, espessura: 1.6 });
  s += txt(580, 140, "RepositorioDePedidos", { tam: 15 });
  s += bloco(470, 190, 220, 38, "RepositorioPostgres", { preench: claro.violeta, tam: 16 });
  s += banco(535, 244, 90, 44, "Postgres", { preench: claro.violeta, tam: 15 });
  s += seta(580, 76, 580, 92, { espessura: 2 });
  s += seta(580, 188, 580, 157, { espessura: 2.4, cor: cor.verde, tracejado: true });
  s += txt(650, 174, "implementa", { tam: 15, cor: cor.verde });
  s += seta(580, 230, 580, 242, { espessura: 1.8, ponta: 9 });
  s += txt(580, 310, "o código do banco depende do negócio", { tam: 16, cor: cor.verde });
  return quadro(760, 326, s);
}

export default `
${resumo(
  "O sistema é desenhado em <b>anéis</b>: no centro ficam as regras de negócio; na borda, banco, web e frameworks. Uma regra manda em tudo: o código só pode depender de quem está <b>mais para dentro</b>.",
  "Num restaurante, a receita fica no centro. Garçom e app de delivery levam pedidos e trazem pratos; o fogão é só equipamento. Dá para trocar o fogão ou o app sem mexer na receita, e a receita nunca diz \"use o fogão da marca X\".",
)}

<p>A <b>Onion Architecture</b> (arquitetura cebola) foi descrita por Jeffrey Palermo em 2008. A <b>Clean Architecture</b>
(arquitetura limpa) é de Robert C. Martin, o "Uncle Bob": apareceu num post de 2012 e virou livro em 2017. No post, o
próprio Martin diz que a Clean tenta juntar numa ideia só várias arquiteturas parecidas, entre elas a hexagonal
(capítulo 6) e a Onion. Por isso estão juntas aqui: é o mesmo princípio, com nomes diferentes para os anéis.</p>

${fig(aneis(), "Os quatro anéis da Clean Architecture. Quanto mais para dentro, mais perto do negócio e mais estável; quanto mais para fora, mais técnico e mais sujeito a troca.")}

<h3>Como funciona</h3>
<p>Os anéis da Clean, de dentro para fora:</p>
<ul>
<li><b>Entidades</b>: as regras do negócio que valeriam mesmo sem o sistema ("um pedido não pode ter total negativo",
"um empréstimo não passa do limite do cliente"). Podem ser classes com métodos ou funções com estruturas de dados.</li>
<li><b>Casos de uso</b>: as regras da aplicação. Cada caso de uso é uma ação do usuário (criar pedido, cancelar assinatura)
e orquestra as entidades para cumpri-la. A classe que executa o caso de uso se chama <b>interactor</b>.</li>
<li><b>Adaptadores de interface</b>: convertem dados entre o formato bom para os casos de uso e o formato bom para o
mundo de fora. Aqui moram <b>controllers</b>, <b>presenters</b> e <b>gateways</b> (como os repositórios). Todo SQL fica
deste anel para fora, e o MVC de uma tela (capítulo 5) mora inteiro aqui.</li>
<li><b>Frameworks e drivers</b>: Express, React, o driver do Postgres, o SDK de um provedor de nuvem. Você escreve
pouco código aqui, quase só a "cola".</li>
</ul>
<p>A <b>regra de dependência</b>: no código-fonte, as dependências só apontam para dentro. Nada num anel interno pode
citar o nome de algo de um anel externo: nem classe, nem função, nem tipo, nem formato de dado (a linha da tabela, o
<code>req</code> do Express). E o número de anéis não é sagrado: Martin diz que os quatro círculos são um esquema e que
você pode precisar de mais. O que não muda é a regra.</p>

<h4>Inversão de dependência: o centro usa o banco sem conhecê-lo</h4>
<p>O caso de uso precisa salvar o pedido, mas não pode importar o Postgres. A saída é a <b>inversão de dependência</b>
(o "D" do SOLID): módulos de alto nível não dependem de módulos de baixo nível; os dois dependem de abstrações. Na
prática, o caso de uso declara uma interface (<code>RepositorioDePedidos</code>) e o adaptador do Postgres a implementa.
Na hora de rodar, a chamada vai de dentro para fora; no código, o <code>import</code> vai de fora para dentro.</p>

<h4>O caminho de uma requisição</h4>
<p>A Clean também detalha como uma chamada atravessa os anéis. O controller recebe a requisição e chama o caso de uso
por uma <b>input port</b> (porta de entrada). O caso de uso faz o trabalho e entrega o resultado numa <b>output port</b>
(porta de saída), sem saber quem está do outro lado. Do outro lado está o <b>presenter</b>, que implementa essa porta e
formata a resposta para a tela ou para o JSON.</p>

${fig(fluxo(), "O fluxo vai do controller ao caso de uso e volta pelo presenter, mas as setas de dependência só apontam para dentro. O truque está nas duas interfaces do anel de casos de uso.")}

<p>Entre os anéis só passam <b>dados simples</b> (DTOs, do inglês <i>data transfer objects</i>): o caso de uso não recebe o
<code>req</code> do Express nem devolve a entidade ou a linha do banco. Assim, mudar a tabela não quebra a API, e mudar
a API não mexe na regra.</p>

<h3>Onion, hexagonal e camadas: o que muda</h3>
<p>A <b>Onion</b> desenha os mesmos anéis com outros nomes. Do centro para fora:</p>
<ul>
<li><b>Modelo de domínio</b>: as entidades e suas regras (equivale às entidades da Clean).</li>
<li><b>Serviços de domínio</b>: regras que envolvem várias entidades e, em geral, as interfaces de repositório.</li>
<li><b>Serviços de aplicação</b>: os casos de uso.</li>
<li><b>Casca externa</b>: interface do usuário, infraestrutura (banco, e-mail, filas) e testes. Equivale aos dois anéis
de fora da Clean.</li>
</ul>
<p>As regras de Palermo são as mesmas da Clean: anéis internos definem interfaces e os externos as implementam; o
acoplamento aponta para o centro (um anel pode usar qualquer anel mais interno, não só o vizinho); e o núcleo compila e
roda sem a infraestrutura.</p>

${fig(inversao(), "A diferença essencial para as camadas tradicionais: a seta entre o negócio e os dados muda de sentido. Quem define a interface é o negócio; o código do banco se adapta a ela.")}

${tabela(
  ["", "Onde fica o banco", "O que ela destaca"],
  [
    ["<b>Camadas</b> (cap. 4)", "embaixo; o negócio depende dele", "separar por papel técnico, numa pilha"],
    ["<b>Hexagonal</b> (cap. 6)", "fora, atrás de uma porta", "entradas e saídas; não divide o núcleo"],
    ["<b>Onion</b>", "na casca externa", "o modelo de domínio no centro, em anéis"],
    ["<b>Clean</b>", "na borda, atrás de gateways", "casos de uso explícitos, presenter e DTOs nas fronteiras"],
  ],  "compacta",
)}

<p>Em uma linha: Clean e Onion são a hexagonal com o núcleo dividido em anéis com nome, e as três são as camadas com a
dependência do banco invertida.</p>

${quando(
  [
    "Sistema de vida longa (anos) com regras de negócio ricas: banco, seguros, saúde, logística, ERP.",
    "Vários canais usam as mesmas regras: API, app, site, filas, tarefas agendadas.",
    "Você quer testar a regra sem infraestrutura e atualizar ou trocar framework e banco com menos medo.",
    "Time médio ou grande, que precisa de um trilho claro sobre onde cada coisa mora.",
  ],
  [
    "CRUD e painel administrativo: formulário e tabela, quase sem regra.",
    "MVP, protótipo ou prova de conceito que pode ser jogada fora.",
    "Time pequeno, com prazo curto, que ainda não domina interfaces e injeção de dependência: comece com camadas bem separadas (capítulo 4).",
    "Sistema em que o framework é o produto, como um site de conteúdo feito num CMS.",
  ],
)}

${medidor({ complexidade: 4, escala: 4, operacao: 1, aprendizado: 4, time: "3 ou mais devs; brilha em sistemas de vida longa" })}

<h3>Como usar na prática</h3>
<p>O exemplo é o mesmo do capítulo 6 (criar um pedido numa loja), agora com o vocabulário completo da Clean. As pastas
seguem os anéis, dentro de cada módulo do negócio.</p>

${pastas(`
src/
├── pedidos/                            # um módulo do negócio
│   ├── dominio/                        # entidades: não importa nada
│   │   └── pedido.ts
│   ├── aplicacao/                      # casos de uso: só importa dominio/
│   │   └── criar-pedido/
│   │       ├── portas.ts               # DTOs, input/output ports, gateways
│   │       └── criar-pedido.ts         # interactor
│   └── adaptadores/                    # controllers, presenters, gateways
│       ├── http/
│       │   ├── criar-pedido.controller.ts
│       │   └── criar-pedido.presenter.ts
│       └── postgres/
│           ├── pedidos-pg.ts           # implementa RepositorioDePedidos
│           └── catalogo-pg.ts          # implementa CatalogoDePrecos
├── pagamentos/                         # outro módulo, os mesmos anéis
├── infra/                              # frameworks e drivers: Express, pool do banco
└── main.ts                             # composition root: liga os anéis
`)}

${codigo(
  `
import { Pedido } from "../../dominio/pedido";

// DTOs: dados simples que cruzam a fronteira
export type ItemDoPedido = { produtoId: string; qtd: number };
export interface CriarPedidoEntrada { clienteId: string; itens: ItemDoPedido[] }
export interface CriarPedidoSaida { pedidoId: string; totalEmCentavos: number }

// input port: o que o caso de uso oferece (o controller chama)
export interface CriarPedidoInputPort { executar(entrada: CriarPedidoEntrada): Promise<void> }

// output port: como ele entrega o resultado (o presenter implementa)
export interface CriarPedidoOutputPort {
  pedidoCriado(saida: CriarPedidoSaida): void;
  pedidoRecusado(motivo: string): void;
}

// gateways: o que ele precisa de fora (os adaptadores implementam)
export interface RepositorioDePedidos { salvar(pedido: Pedido): Promise<void> }
export interface CatalogoDePrecos { precoEmCentavos(produtoId: string): Promise<number | null> }`,
  "src/pedidos/aplicacao/criar-pedido/portas.ts (tudo o que o caso de uso troca com o mundo)",
)}

${codigo(
  `
import { Pedido } from "../../dominio/pedido";             // anel de dentro: pode
import { CatalogoDePrecos, CriarPedidoEntrada, CriarPedidoInputPort,
         CriarPedidoOutputPort, RepositorioDePedidos } from "./portas"; // mesmo anel: pode
// import { Pool } from "pg";                               // proibido: o pg mora na borda

export class CriarPedido implements CriarPedidoInputPort {
  constructor(private pedidos: RepositorioDePedidos, private catalogo: CatalogoDePrecos,
              private saida: CriarPedidoOutputPort) {}

  async executar({ clienteId, itens }: CriarPedidoEntrada): Promise<void> {
    if (itens.length === 0) return this.saida.pedidoRecusado("Pedido sem itens");
    const pedido = Pedido.novo(clienteId);
    for (const item of itens) {
      const preco = await this.catalogo.precoEmCentavos(item.produtoId);
      if (preco === null) return this.saida.pedidoRecusado("Produto não encontrado");
      pedido.adicionar(item.produtoId, item.qtd, preco); // a regra do item mora na entidade
    }
    await this.pedidos.salvar(pedido);
    this.saida.pedidoCriado({ pedidoId: pedido.id, totalEmCentavos: pedido.totalEmCentavos });
  }
}`,
  "src/pedidos/aplicacao/criar-pedido/criar-pedido.ts (o interactor)",
)}

<p>Repare nos <code>import</code>: o interactor só enxerga <code>portas.ts</code> e <code>dominio/</code>. Ele não sabe
se o resultado vai virar JSON, HTML ou mensagem de WhatsApp. Agora a borda:</p>

${codigo(
  `
// presenter: transforma a saída do caso de uso em resposta HTTP
const reais = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export class CriarPedidoPresenterHttp implements CriarPedidoOutputPort {
  resposta: { status: number; corpo: unknown } = { status: 500, corpo: null };
  pedidoCriado(s: CriarPedidoSaida) {
    this.resposta = { status: 201, corpo: { id: s.pedidoId, total: reais(s.totalEmCentavos) } };
  }
  pedidoRecusado(motivo: string) { this.resposta = { status: 422, corpo: { erro: motivo } }; }
}

// controller: copia da requisição só o que o caso de uso precisa (não importa o Express)
export class CriarPedidoController {
  constructor(private criar: (saida: CriarPedidoOutputPort) => CriarPedidoInputPort) {}
  async receber(corpo: CriarPedidoEntrada) {
    const presenter = new CriarPedidoPresenterHttp(); // guarda a resposta: um por requisição
    await this.criar(presenter).executar({ clienteId: corpo.clienteId, itens: corpo.itens });
    return presenter.resposta;
  }
}

// main.ts: o único lugar que conhece todos os anéis; o Express fica na borda
const pedidos = new PedidosPg(pool), catalogo = new CatalogoPg(pool);
const novoCaso = (saida: CriarPedidoOutputPort) => new CriarPedido(pedidos, catalogo, saida);
const controller = new CriarPedidoController(novoCaso);
app.post("/pedidos", async (req, res) => {
  const { status, corpo } = await controller.receber(req.body); // valide o body antes (ex.: zod)
  res.status(status).json(corpo);
});`,
  "src/pedidos/adaptadores/http e src/main.ts",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Comece pelo centro: entidades com as regras que valem em qualquer canal (<code>pedido.adicionar()</code> recusa quantidade zero), sem framework nem ORM.",
  "Para cada ação do usuário, crie um caso de uso com DTO de entrada, DTO de saída e as interfaces do que ele precisa de fora (gateways), com nomes do negócio.",
  "Escreva os adaptadores: o controller traduz a requisição em DTO, o presenter traduz o resultado em resposta e o gateway implementa o repositório com ORM ou SQL.",
  "Deixe frameworks e drivers na borda e ligue tudo no <code>main.ts</code> (o <i>composition root</i>) ou num container de injeção de dependência.",
  "Teste o interactor com dublês: um repositório em memória e um presenter falso que só guarda o que recebeu.",
  "Automatize a regra: <code>dominio/</code> e <code>aplicacao/</code> não podem importar <code>adaptadores/</code>, <code>infra/</code> nem bibliotecas como <code>express</code> e <code>pg</code> (dependency-cruiser ou regras de lint resolvem).",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Regras testáveis sem banco, servidor ou framework", "Mais arquivos: DTOs, interfaces, presenters, mapeadores"],
    ["Framework e banco viram detalhes, atualizáveis com menos medo", "Mapear o mesmo dado entre entidade, DTO, tabela e JSON"],
    ["Casos de uso explícitos, reaproveitados por vários canais (API, app, fila)", "O primeiro endpoint demora mais para sair"],
    ["Vocabulário comum (entidade, caso de uso, presenter) para times grandes", "Time precisa dominar interfaces e injeção de dependência"],
  ],
)}

<h3>Quando é exagero</h3>
<p>A crítica mais comum à Clean é a cerimônia: camadas e mapeamentos demais para pouca regra. Ela é justa em parte,
e cada queixa tem resposta:</p>
<ul>
<li><b>"Camada demais para pouca coisa."</b> Num CRUD, cada anel só repassa dados. Use anéis só onde há regra; o resto
pode ser CRUD direto (fatias verticais, capítulo 8).</li>
<li><b>"Passo o dia mapeando objeto."</b> Entidade, DTO, tabela e JSON são quatro formatos do mesmo dado. Mapeie só onde
os formatos diferem; telas de leitura podem consultar o banco direto (CQRS, capítulo 21).</li>
<li><b>"Interface com uma implementação só."</b> Input ports quase nunca ganham uma segunda: o controller pode chamar o
caso de uso direto. Guarde as interfaces para os gateways, onde há troca e dublê de teste.</li>
<li><b>"Ninguém troca de banco."</b> É verdade, é raro. O ganho real é testar a regra sem infraestrutura e atualizar o
framework sem medo.</li>
</ul>

<h3>Erros comuns</h3>
<ul>
<li><b>Entidade com cara de tabela</b>: decorators do ORM (<code>@Entity()</code>, <code>@Column()</code>) na classe de
domínio prendem o centro a um framework. Deixe o modelo de persistência no adaptador (ou registre o atalho num ADR,
capítulo 32).</li>
<li><b>Entidade atravessando a fronteira</b>: devolver o objeto <code>Pedido</code> direto no JSON expõe campos internos
e amarra o contrato da API ao modelo. Use o DTO de saída.</li>
<li><b>Transação no lugar errado</b>: abrir <code>BEGIN</code> com o cliente do <code>pg</code> dentro do caso de uso traz
o banco para o centro. Se o caso de uso grava várias coisas juntas, declare uma porta (ex.: <code>UnidadeDeTrabalho</code>)
e deixe o adaptador abrir e fechar a transação.</li>
<li><b>Template pronto</b>: copiar um repositório "clean" com oito projetos e quarenta pastas para um sistema de três
telas. Comece com poucos anéis e acrescente quando doer.</li>
<li><b>Pastas que não contam o que o sistema faz</b>: só <code>dominio/</code>, <code>aplicacao/</code> e
<code>infra/</code> no topo. Martin defende que a estrutura "grite" o domínio (<i>Screaming Architecture</i>):
<code>pedidos/</code> e <code>pagamentos/</code> no topo, os anéis dentro de cada um.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine uma fintech de empréstimo pessoal. A regra de crédito (juros, limite, parcelas) é o coração do negócio e muda com frequência: ela mora em entidades e casos de uso, testados em milissegundos. O mesmo <code>SimularEmprestimo</code> atende app, site e WhatsApp, cada canal com seu presenter. Trocar o fornecedor de consulta de score muda um gateway e nada no centro. Já o painel interno onde o time cadastra agências e feriados é só formulário e tabela, e foi feito como CRUD direto, sem anéis. Mesma empresa, duas decisões, as duas certas.</p>",
)}

${dica(
  "Precisa mesmo de output port e presenter?",
  "<p>Nem sempre. Muitos times fazem o caso de uso devolver o DTO de saída com <code>return</code> e deixam o controller formatar: é mais simples e funciona bem quando há um canal só. A output port com presenter compensa quando o mesmo caso de uso responde de jeitos diferentes (JSON, HTML, mensagem de WhatsApp, linha de comando) ou quando há vários desfechos e você quer um método para cada um.</p>",
)}

${alerta(
  "Clean Architecture não é Clean Code",
  "<p>São dois livros do mesmo autor. <i>Clean Code</i> fala do código linha a linha (nomes, funções, testes); <i>Clean Architecture</i> fala da estrutura do sistema (anéis, fronteiras, dependências). Dá para ter um sem o outro, e uma vaga que pede \"Clean\" pode estar falando de qualquer um dos dois.</p>",
)}

${combina([
  [6, "Hexagonal", "a mesma regra de dependência, sem anéis com nome"],
  [4, "Camadas", "o ponto de partida; Clean é camadas com a dependência invertida"],
  [8, "Vertical Slice", "anéis só nas fatias que têm regra"],
  [12, "Monólito modular", "um conjunto de anéis por módulo"],
  [21, "CQRS", "anéis na escrita, leitura direta do banco"],
  [5, "MVC, MVP e MVVM", "moram no anel de adaptadores"],
])}

${lembre([
  "Anéis do mais estável (entidades) ao mais técnico (frameworks); o código só depende de anéis mais internos.",
  "O centro declara interfaces e a borda as implementa: o fluxo vai e volta, a dependência só entra.",
  "Clean, Onion e hexagonal são a mesma ideia; use tantos anéis quanto a regra de negócio justificar.",
])}
`;
