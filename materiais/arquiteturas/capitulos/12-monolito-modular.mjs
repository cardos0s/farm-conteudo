// Capítulo 12: Monólito modular. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, check, claro, cor, evento, linha, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

// Diagrama principal: três módulos num só deploy, cada um com API pública, internos e schema próprio.
function diagrama() {
  semear("monolito-modular-1");
  let s = "";
  // a aplicação inteira: um processo, um deploy
  s += ret(20, 36, 720, 260, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += txt(380, 18, "uma aplicação · um processo · um deploy", { tam: 17 });
  const modulos = [
    [45, "Pagamentos", claro.ciano],
    [295, "Pedidos", claro.amarelo],
    [545, "Catálogo", claro.laranja],
  ];
  for (const [x, nome, c] of modulos) {
    s += bloco(x, 60, 170, 216, "", { preench: c, gap: 8 });
    s += txt(x + 85, 82, nome, { tam: 19 });
    s += bloco(x + 15, 100, 140, 50, "API pública\n(index.ts)", { preench: claro.verde, hachura: "solid", tam: 15 });
    s += bloco(x + 15, 166, 140, 96, "", { preench: "#ffffff", hachura: "solid", espessura: 1.6 });
    s += txt(x + 85, 190, "internos", { tam: 16 });
    s += txt(x + 85, 214, "(privado)", { tam: 15, cor: cor.cinza });
    s += txt(x + 85, 238, "regras, tabelas", { tam: 15, cor: cor.cinza });
    // cada módulo só fala com o próprio schema
    s += seta(x + 85, 264, x + 85, 322, { espessura: 1.8 });
  }
  // pode: chamar a API pública de outro módulo
  s += seta(308, 196, 204, 136, { cor: cor.verde, espessura: 2.6 });
  s += check(262, 146, 20);
  // não pode: entrar nos internos de outro módulo
  s += seta(452, 214, 558, 214, { cor: cor.vermelho, espessura: 2.4 });
  s += xis(505, 214, 18);
  // dados: um schema por módulo, sem join entre eles
  s += ret(40, 312, 680, 112, { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += banco(70, 324, 120, 66, "schema\npagamentos", { preench: claro.ciano, tam: 15 });
  s += banco(320, 324, 120, 66, "schema\npedidos", { preench: claro.amarelo, tam: 15 });
  s += banco(570, 324, 120, 66, "schema\ncatálogo", { preench: claro.laranja, tam: 15 });
  s += seta(446, 360, 562, 360, { cor: cor.vermelho, espessura: 2, tracejado: true, duplo: true });
  s += xis(504, 360, 18);
  s += txt(504, 338, "join", { tam: 15, cor: cor.vermelho });
  s += txt(380, 408, "mesmo banco, um schema por módulo", { tam: 15, cor: cor.cinza });
  // legenda
  s += check(70, 446, 18);
  s += txt(88, 446, "pela API pública: pode", { tam: 15, cor: cor.verde, ancora: "start" });
  s += xis(382, 446, 16);
  s += txt(400, 446, "direto nos internos ou tabelas: não", { tam: 15, cor: cor.vermelho, ancora: "start" });
  return quadro(760, 462, s);
}

// Segundo diagrama: as duas formas de um módulo conversar com outro.
function conversa() {
  semear("monolito-modular-2");
  let s = "";
  s += linha([[380, 16], [380, 296]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  // 1. chamada síncrona pela API pública
  s += txt(190, 18, "1. chamar a API pública", { tam: 17, cor: cor.azul });
  s += bloco(95, 44, 190, 50, "Pedidos", { preench: claro.amarelo });
  s += bloco(95, 190, 190, 50, "Catálogo", { preench: claro.laranja });
  s += seta(150, 96, 150, 186, { espessura: 2, cor: cor.azul });
  s += txt(140, 142, "buscarProduto(id)", { tam: 15, ancora: "end", cor: cor.azul });
  s += seta(230, 186, 230, 96, { espessura: 1.8, tracejado: true });
  s += txt(240, 142, "preço, ativo", { tam: 15, ancora: "start" });
  s += txt(190, 270, "quem chama espera a resposta", { tam: 15, cor: cor.cinza });
  // 2. evento interno, em memória
  s += txt(570, 18, "2. publicar um evento", { tam: 17, cor: cor.laranja });
  s += bloco(495, 44, 150, 46, "Pagamentos", { preench: claro.ciano, tam: 16 });
  s += seta(570, 92, 570, 128, { espessura: 2, cor: cor.laranja });
  s += evento(546, 96, 24);
  s += txt(584, 111, "PagamentoAprovado", { tam: 15, ancora: "start", cor: cor.laranja });
  s += bloco(410, 130, 320, 38, "barramento em memória", { preench: claro.cinza, hachura: "solid", tam: 15 });
  s += seta(480, 170, 480, 204, { espessura: 1.8 });
  s += seta(660, 170, 660, 204, { espessura: 1.8 });
  s += bloco(410, 206, 140, 44, "Pedidos", { preench: claro.amarelo, tam: 16 });
  s += bloco(590, 206, 140, 44, "Notificações", { preench: claro.violeta, tam: 16 });
  s += txt(480, 266, "marca como pago", { tam: 15, cor: cor.cinza });
  s += txt(660, 266, "manda o e-mail", { tam: 15, cor: cor.cinza });
  s += txt(570, 294, "quem publica não sabe quem ouve", { tam: 15, cor: cor.cinza });
  return quadro(760, 310, s);
}

// Terceiro diagrama: extrair um módulo para um serviço sem mudar quem chama.
function extrair() {
  semear("monolito-modular-3");
  let s = "";
  // antes: tudo no mesmo deploy
  s += txt(20, 72, "antes", { tam: 18, ancora: "start" });
  s += ret(100, 16, 470, 106, { tracejado: true, cor: cor.cinza, espessura: 1.5 });
  s += txt(112, 32, "um deploy", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += bloco(115, 50, 120, 46, "Pedidos", { preench: claro.amarelo });
  s += seta(237, 73, 283, 73, { espessura: 2 });
  s += bloco(285, 38, 270, 76, "", { preench: claro.laranja, gap: 8 });
  s += bloco(297, 46, 246, 32, "buscarProduto(id): local", { preench: claro.verde, hachura: "solid", tam: 15 });
  s += txt(420, 97, "Catálogo (internos)", { tam: 15 });
  s += seta(557, 76, 608, 76, { espessura: 1.8 });
  s += banco(610, 44, 120, 64, "schema\ncatálogo", { preench: claro.laranja, tam: 15 });
  s += txt(670, 124, "mesmo banco", { tam: 15, cor: cor.cinza });
  // depois: o módulo virou serviço
  s += txt(20, 202, "depois", { tam: 18, ancora: "start" });
  s += ret(100, 148, 300, 106, { tracejado: true, cor: cor.cinza, espessura: 1.5 });
  s += txt(112, 164, "monólito", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += bloco(115, 180, 100, 46, "Pedidos", { preench: claro.amarelo });
  s += seta(217, 203, 233, 203, { espessura: 2, ponta: 9 });
  s += bloco(235, 172, 152, 62, "buscarProduto(id)\ncliente HTTP", { preench: claro.verde, hachura: "solid", tam: 15 });
  s += seta(389, 203, 452, 203, { espessura: 2.2, cor: cor.azul, rotulo: "rede", corRotulo: cor.azul });
  s += bloco(454, 176, 150, 54, "serviço\nCatálogo", { preench: claro.laranja, tam: 16 });
  s += seta(606, 203, 640, 203, { espessura: 1.8 });
  s += banco(642, 171, 100, 64, "banco\ncatálogo", { preench: claro.laranja, tam: 15 });
  s += txt(692, 252, "banco próprio", { tam: 15, cor: cor.cinza });
  s += txt(380, 284, "quem chama continua usando buscarProduto(id): só a implementação mudou", { tam: 15, cor: cor.vermelho });
  return quadro(760, 302, s);
}

export default `
${resumo(
  "Um sistema só, com um deploy só, mas dividido por dentro em <b>módulos</b> de fronteiras fortes: cada um expõe uma <b>API pública</b>, esconde o resto e cuida dos <b>próprios dados</b>.",
  "Um prédio de apartamentos: um endereço, uma portaria, um síndico. Mas cada apartamento tem porta e chave próprias. O vizinho toca a campainha (API pública); ele não entra pela janela para pegar açúcar no seu armário (tabelas internas).",
)}

<p>No capítulo 11 você viu o monólito: um sistema, um deploy. O que costuma dar errado nele não é rodar num processo só, é o
código virar uma teia em que tudo chama tudo. O monólito modular ataca exatamente esse ponto. Continua sendo um deploy só, mas o
código é dividido em módulos que se comportam quase como serviços separados. Em 2015, Martin Fowler defendeu no artigo
<i>Monolith First</i> que a maioria dos sistemas deveria começar como monólito e só se dividir depois, cuidando desde cedo da
modularidade, tanto nas APIs quanto na forma de guardar os dados. O monólito modular é essa recomendação levada a sério.</p>

${fig(diagrama(), "Três módulos no mesmo deploy. Cada um tem uma porta de entrada (API pública), internos que ninguém de fora toca e um schema só seu no banco.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Um deploy, um processo</b>: um build, um artefato no ar. Um módulo chama o outro com uma chamada de função comum, sem
rede no meio.</li>
<li><b>Módulos por área do negócio</b>, não por camada técnica: catálogo, pedidos, pagamentos. Cada módulo é um <b>contexto
delimitado</b> (<i>bounded context</i>, conceito do DDD, o <i>Domain-Driven Design</i>): uma parte do negócio com vocabulário
e regras próprios. "Produto" no catálogo tem foto e descrição; em entregas, tem peso e tamanho da caixa.</li>
<li><b>API pública e internos privados</b>: o <code>index.ts</code> de cada módulo exporta poucas funções e tipos.
Entidades, repositórios e regras ficam numa pasta interna que outro módulo não pode importar.</li>
<li><b>Dados por módulo</b>: cada módulo tem seu schema (ou um prefixo nas tabelas) e só ele lê e grava ali. Nada de join
nem chave estrangeira entre módulos. Precisa de um dado de outro? Peça pela API ou guarde uma cópia (o pedido guarda o preço
do produto no momento da compra).</li>
<li><b>Duas formas de conversar</b>: para uma resposta imediata, chame a API pública do outro módulo. Para avisar que algo
aconteceu ("pagamento aprovado"), publique um <b>evento interno</b>; quem se interessa reage.</li>
<li><b>Regras checadas por máquina</b>: a fronteira só existe de verdade se o build quebra quando alguém a atravessa.</li>
</ul>

${fig(conversa(), "À esquerda, uma chamada direta: Pedidos precisa do preço agora. À direita, um evento: Pagamentos avisa, e cada interessado reage do seu jeito.")}

${quando(
  [
    "O domínio está crescendo e já dá para ver áreas com regras próprias (catálogo, pedidos, pagamentos).",
    "Dois ou mais times mexem no mesmo código e começam a pisar no pé um do outro.",
    "Você quer a organização dos microsserviços sem pagar rede, vários deploys e monitoramento distribuído.",
    "As fronteiras ainda não estão claras e você quer poder mudá-las barato.",
  ],
  [
    "App pequeno ou CRUD simples: um monólito bem organizado (capítulo 11) basta.",
    "Uma parte precisa de escala ou tecnologia muito diferente (processar vídeo com GPU, por exemplo).",
    "Muitos times que precisam entregar cada um no seu ritmo, com stack própria, sem coordenar deploy.",
    "Uma falha numa parte não pode afetar as outras: no mesmo processo, um vazamento de memória derruba todos.",
  ],
)}

${medidor({ complexidade: 2, escala: 4, operacao: 2, aprendizado: 3, time: "de 1 a vários times; ponto ideal: times médios" })}

<h3>Como usar na prática</h3>
${pastas(`
src/
├── modulos/
│   ├── catalogo/
│   │   ├── index.ts                # API pública: só o que sai daqui
│   │   └── interno/                # privado: produto.ts, repositorio.ts...
│   ├── pedidos/
│   │   ├── index.ts
│   │   └── interno/                # criar-pedido.ts, ouvintes.ts...
│   └── pagamentos/
│       ├── index.ts                # funções + eventos que o módulo publica
│       └── interno/
├── compartilhado/barramento.ts     # eventos em memória (só infraestrutura)
└── main.ts                         # sobe o app e registra os módulos
`)}

${codigo(
  `
// modulos/catalogo/index.ts: a única porta de entrada do módulo
import { produtoPorId } from "./interno/repositorio";

export type ProdutoResumo = { id: string; nome: string; precoEmCentavos: number; ativo: boolean };

export async function buscarProduto(id: string): Promise<ProdutoResumo | null> {
  const p = await produtoPorId(id); // entidade interna: não sai do módulo
  return p && { id: p.id, nome: p.nome, precoEmCentavos: p.preco.centavos, ativo: p.ativo };
}

// modulos/pedidos/interno/criar-pedido.ts
import { buscarProduto } from "../../catalogo";                    // pode: API pública
// import { produtoPorId } from "../../catalogo/interno/repositorio"; // barrado no CI

export async function criarPedido(clienteId: string, itens: Item[]) {
  const linhas: Linha[] = [];
  for (const item of itens) {
    const produto = await buscarProduto(item.produtoId);
    if (!produto?.ativo) throw new Error(\`Produto indisponível: \${item.produtoId}\`);
    linhas.push({ ...item, precoEmCentavos: produto.precoEmCentavos }); // cópia, sem join
  }
  return pedidos.salvar(Pedido.novo(clienteId, linhas)); // grava no schema "pedidos"
}`,
  "src/modulos/catalogo e src/modulos/pedidos",
)}

${codigo(
  `
// compartilhado/barramento.ts: eventos entre módulos, dentro do mesmo processo
const ouvintes = new Map<string, ((dados: any) => Promise<void>)[]>();
export const barramento = {
  assinar<T>(evento: string, fn: (dados: T) => Promise<void>) {
    ouvintes.set(evento, [...(ouvintes.get(evento) ?? []), fn]);
  },
  async publicar<T>(evento: string, dados: T) {
    for (const fn of ouvintes.get(evento) ?? []) await fn(dados);
  },
};

// modulos/pagamentos/index.ts: o evento também faz parte da API pública
export const PAGAMENTO_APROVADO = "pagamentos.aprovado";
export type PagamentoAprovado = { pedidoId: string; valorEmCentavos: number };

// modulos/pagamentos/interno/aprovar.ts: grava e avisa, sem saber quem vai ouvir
export async function aprovar(p: PagamentoAprovado) {
  await pagamentos.marcarAprovado(p.pedidoId); // schema "pagamentos"
  await barramento.publicar(PAGAMENTO_APROVADO, p);
}

// modulos/pedidos/interno/ouvintes.ts: reage sem importar nada interno de pagamentos
barramento.assinar<PagamentoAprovado>(PAGAMENTO_APROVADO, (e) => marcarComoPago(e.pedidoId));`,
  "src/compartilhado/barramento.ts e os módulos",
)}

<h4>Como garantir as fronteiras</h4>
<p>Fronteira que depende só de boa vontade dura até a primeira entrega apertada. Ela precisa ser checada por máquina, no CI:</p>
<ul>
<li><b>Lint de dependências</b>: uma regra proíbe importar o <code>interno/</code> de outro módulo. Em TypeScript:
dependency-cruiser (abaixo), eslint-plugin-boundaries ou a regra de fronteiras do Nx. Em Java: ArchUnit ou Spring Modulith.
Em .NET: NetArchTest.</li>
<li><b>Pacotes separados</b>: cada módulo vira um pacote (workspace do npm, módulo do Maven, projeto do .NET). No Node, o
campo <code>exports</code> do <code>package.json</code> deixa visível só o <code>index</code>; em C#, o que é
<code>internal</code> não aparece para outro projeto.</li>
<li><b>Packwerk</b>: ferramenta de código aberto do Shopify para Rails. Cada pacote declara num <code>package.yml</code> de
quem depende, e uma análise estática aponta o que fura essas regras.</li>
</ul>

${codigo(
  `
// roda no CI com: npx depcruise src --config .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    {
      name: "so-pela-api-publica", // um módulo não entra no interno/ de outro
      severity: "error",
      from: { path: "^src/modulos/([^/]+)/" },
      to: { path: "^src/modulos/[^/]+/interno/", pathNot: "^src/modulos/$1/" },
    },
    { name: "sem-ciclos", severity: "error", from: {}, to: { circular: true } },
  ],
};`,
  ".dependency-cruiser.cjs",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Mapeie as áreas do negócio. Onde a mesma palavra muda de sentido (\"produto\" no catálogo e em entregas), provavelmente há uma fronteira.",
  "Crie uma pasta por módulo, com <code>index.ts</code> e <code>interno/</code>, e mova o código para dentro sem mudar comportamento.",
  "Ligue a checagem no CI. Num sistema que já existe, salve as violações atuais como linha de base (dependency-cruiser e Packwerk têm esse recurso) e barre só as novas.",
  "Pague as violações antigas aos poucos: imports de internos viram chamadas à API pública ou eventos.",
  "Separe os dados: um schema por módulo, sem joins nem chaves estrangeiras entre eles.",
])}

<h4>E se um dia precisar virar microsserviço?</h4>
<p>Se um módulo ganhar um motivo real para deploy próprio (escala muito diferente, um time que precisa de autonomia, outra
tecnologia), metade do trabalho já está feita. O schema vai para um banco próprio, o código vira um serviço, o
<code>index.ts</code> vira um cliente HTTP com a mesma assinatura e os eventos daquele módulo passam por uma fila de verdade.
O capítulo 30 mostra como fazer isso aos poucos, sem parar o sistema.</p>

${fig(extrair(), "Extrair um módulo bem isolado é trocar a implementação da API pública. Quem chama não muda o código, mas passa a lidar com latência e falhas de rede.")}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Operar como um monólito: um deploy, um processo", "Tudo sobe junto: um bug grave afeta o app inteiro"],
    ["Chamadas entre módulos sem rede: rápidas e fáceis de depurar", "Escala junto: não dá para escalar só um módulo"],
    ["Times em áreas separadas, com menos conflito", "Disciplina e ferramentas para manter as fronteiras"],
    ["Mover uma fronteira errada é refatorar, não migrar serviço", "Dados separados pedem cópias e eventos, não joins"],
    ["Caminho aberto para extrair serviços depois", "Um pipeline e uma stack para todos os times"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Módulos por camada técnica</b>: <code>controllers/</code> e <code>services/</code> são camadas (capítulo 4), não
módulos. Módulo é uma fatia do negócio, com as camadas dentro.</li>
<li><b>API pública que vaza os internos</b>: um <code>export * from "./interno"</code> no <code>index.ts</code> anula a
fronteira.</li>
<li><b>Join escondido</b>: a API está certinha, mas um relatório faz <code>select</code> juntando tabelas de dois módulos.
Na hora de extrair, é ele que quebra.</li>
<li><b>Ciclos entre módulos</b>: pedidos chama pagamentos, que chama pedidos. Quebre com um evento ou invertendo a
dependência (um módulo define a interface que precisa e o outro implementa, como as portas do capítulo 6).</li>
<li><b>Rede dentro do monólito</b>: módulos conversando por HTTP com o próprio servidor. É o custo dos microsserviços sem os
benefícios.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O Shopify mantém sua aplicação principal como um grande monólito Ruby on Rails. Em vez de quebrá-lo em microsserviços, o time de engenharia contou no blog (<i>Deconstructing the Monolith</i>, 2019) que reorganizou o código em componentes por área do negócio, cada um com uma interface pública, e passou a checar as fronteiras de forma automática. A ferramenta mais conhecida desse esforço é o Packwerk, que o Shopify publicou como código aberto.</p>",
)}

${alerta(
  "Evento em memória não é fila",
  "<p>Se o processo cair entre gravar o pagamento e avisar os ouvintes, o evento some. Para reações que não podem se perder (cobrança, estoque), grave o evento numa tabela na mesma transação e entregue depois (o padrão <i>outbox</i>), ou use uma fila de verdade. Veja os capítulos 20 e 23.</p>",
)}

${dica(
  "Monólito modular ou microsserviços?",
  "<p>Os dois dividem o sistema pelas mesmas fronteiras de negócio. A diferença é o que segura a fronteira: no monólito modular, uma regra de código checada no build; nos microsserviços (capítulo 14), a rede. Fronteira de código é barata de mover; fronteira de rede é cara. Quando ainda não se sabe onde cortar, comece pelo modular.</p>",
)}

${combina([
  [11, "Monólito", "o ponto de partida; o modular é a evolução"],
  [6, "Hexagonal", "cada módulo com seu núcleo e adaptadores"],
  [8, "Vertical Slice", "organizar cada módulo por funcionalidade"],
  [20, "Orientada a eventos", "eventos internos entre módulos"],
  [14, "Microsserviços", "quando um módulo precisar de deploy próprio"],
  [30, "Como migrar sem parar o sistema", "extrair módulos aos poucos"],
])}

${lembre([
  "Um deploy, vários módulos: cada um com API pública, internos privados e dados próprios (sem join entre módulos).",
  "Fronteira só existe se a máquina checa: lint de dependências, pacotes separados ou ferramentas como o Packwerk.",
  "É o ponto ideal para times médios com o domínio crescendo, e deixa a porta aberta para extrair serviços quando houver um motivo real.",
])}
`;
