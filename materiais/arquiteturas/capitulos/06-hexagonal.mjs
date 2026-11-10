// Capítulo 6 — Hexagonal (portas e adaptadores). Serve de MODELO para os outros capítulos:
// abertura (resumo) → diagrama → como funciona (portas de entrada x saída, caminho de uma requisição)
// → onde fica cada coisa → quando usar → medidor → na prática (pastas + código) → como testar
// → vantagens e custos → interface para tudo? → erros comuns → exemplo real → combina com → para lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, caminho, claro, cor, navegador, passo, pessoa, semear, seta, quadro, txt, banco, envelope } from "../desenho.mjs";

function diagrama() {
  semear("hexagonal");
  let s = "";
  // hexágono do núcleo
  const cx = 380, cy = 210, r = 150;
  const pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((Math.PI / 3) * i), cy + r * 0.82 * Math.sin((Math.PI / 3) * i)]);
  s += caminho(`M${pts.map((p) => p.join(",")).join(" L")} Z`, { preench: claro.amarelo, espessura: 2.6, gap: 9 });
  s += bloco(cx - 95, cy - 58, 190, 116, "", { preench: "#ffffff", hachura: "solid" });
  s += txt(cx, cy - 28, "núcleo", { tam: 20 });
  s += txt(cx, cy + 4, "regras de negócio", { tam: 15, cor: cor.cinza });
  s += txt(cx, cy + 28, "+ casos de uso", { tam: 15, cor: cor.cinza });
  // portas (nas bordas do hexágono)
  const porta = (x, y, rot) =>
    bloco(x - 9, y - 9, 18, 18, "", { preench: cor.verde, hachura: "solid" }) + txt(x, y - 22, rot, { tam: 15, cor: cor.verde, halo: 5 });
  s += porta(cx - r * 0.86, cy - 42, "porta");
  s += porta(cx - r * 0.86, cy + 50, "porta");
  s += porta(cx + r * 0.86, cy - 42, "porta");
  s += porta(cx + r * 0.86, cy + 50, "porta");
  // lado que USA o sistema (adaptadores primários)
  s += txt(95, 28, "quem chama o sistema", { tam: 16, cor: cor.azul });
  s += navegador(20, 90, 130, 80, "API HTTP");
  s += pessoa(85, 252, {});
  s += txt(85, 322, "teste / CLI", { tam: 15 });
  s += seta(152, 130, cx - r * 0.86 - 12, cy - 42, { cor: cor.azul, espessura: 2 });
  s += seta(115, 280, cx - r * 0.86 - 12, cy + 50, { cor: cor.azul, espessura: 2 });
  s += txt(95, 372, "adaptadores de entrada", { tam: 15, cor: cor.azul });
  // lado que o sistema USA (adaptadores secundários)
  s += txt(665, 28, "o que o sistema usa", { tam: 16, cor: cor.violeta });
  s += banco(640, 80, 90, 92, "Postgres", { preench: claro.violeta, tam: 15 });
  s += envelope(650, 255, 56, 40, claro.violeta);
  s += txt(678, 322, "e-mail", { tam: 15 });
  s += seta(640, 130, cx + r * 0.86 + 12, cy - 42, { cor: cor.violeta, espessura: 2 });
  s += seta(645, 275, cx + r * 0.86 + 12, cy + 50, { cor: cor.violeta, espessura: 2 });
  s += txt(678, 372, "adaptadores de saída", { tam: 15, cor: cor.violeta });
  s += txt(cx, 412, "todas as setas de dependência apontam para dentro", { tam: 16, cor: cor.vermelho });
  return quadro(760, 430, s);
}

function trocaAdaptador() {
  semear("hexagonal-troca");
  let s = "";
  s += bloco(250, 24, 260, 64, "CriarPedido (núcleo)", { preench: claro.amarelo });
  s += bloco(270, 124, 220, 52, "RepositorioDePedidos", { preench: claro.verde, tam: 16 });
  s += txt(506, 150, "porta (interface)", { tam: 15, cor: cor.verde, ancora: "start" });
  s += seta(380, 90, 380, 122, { espessura: 2 });
  const adapt = [
    [50, "Postgres", claro.violeta, "produção", 310],
    [300, "Em memória", claro.cinza, "testes", 380],
    [550, "DynamoDB", claro.violeta, "amanhã", 450],
  ];
  for (const [x, nome, c, rot, alvo] of adapt) {
    s += bloco(x, 250, 160, 56, nome, { preench: c, tam: 16 });
    s += txt(x + 80, 326, rot, { tam: 15, cor: cor.cinza });
    s += seta(x + 80, 248, alvo, 179, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  }
  s += txt(380, 360, "trocar o banco = escrever outro adaptador; o núcleo não muda", { tam: 15, cor: cor.vermelho });
  return quadro(760, 376, s);
}

/** O caminho de um POST /pedidos: entra por uma porta, sai por outra; cada borda traduz. */
function fluxo() {
  semear("hexagonal-fluxo");
  let s = "";
  const y = 132; // altura da linha da requisição
  s += txt(199, 26, "adaptador de entrada", { tam: 16, cor: cor.azul });
  s += txt(385, 26, "núcleo", { tam: 16, cor: cor.vermelho });
  s += txt(572, 26, "adaptador de saída", { tam: 16, cor: cor.violeta });
  // a zona do núcleo
  s += bloco(290, 50, 190, 200, "", { preench: claro.amarelo, gap: 9 });
  // as peças
  s += navegador(8, 100, 100, 64, "POST\n/pedidos");
  s += bloco(136, 100, 126, 64, "rota HTTP", { preench: claro.azul, tam: 16 });
  s += bloco(322, 104, 126, 56, "CriarPedido", { preench: "#ffffff", hachura: "solid", tam: 16 });
  s += bloco(345, 196, 80, 42, "Pedido", { preench: "#ffffff", hachura: "solid", tam: 16 });
  s += bloco(508, 100, 128, 64, "repositório\nPostgres", { preench: claro.violeta, tam: 16 });
  s += banco(662, 92, 88, 80, "Postgres", { preench: claro.violeta, tam: 15 });
  // o caminho da requisição
  s += seta(110, y, 134, y, { cor: cor.azul, espessura: 2 });
  s += seta(264, y, 320, y, { cor: cor.azul, espessura: 2 });
  s += seta(385, 162, 385, 194, { espessura: 2 });
  s += seta(450, y, 506, y, { cor: cor.violeta, espessura: 2 });
  s += seta(638, y, 660, y, { cor: cor.violeta, espessura: 2 });
  // as duas portas, na borda do núcleo
  const porta = (x, rot) =>
    bloco(x - 9, y - 9, 18, 18, "", { preench: cor.verde, hachura: "solid" }) + txt(x, 76, rot, { tam: 15, cor: cor.verde, halo: 6 });
  s += porta(290, "porta de\nentrada");
  s += porta(480, "porta de\nsaída");
  // o que cada parte faz
  const nota = (x, n, t, c) => passo(x, 282, n, c) + txt(x, 326, t, { tam: 15, cor: cor.cinza });
  s += nota(199, "1", "valida o formato\nmonta o comando\nformata a resposta", cor.azul);
  s += nota(385, "2", "aplica as regras\nnão vê JSON\nnem SQL", cor.vermelho);
  s += nota(572, "3", "converte Pedido\nem linhas\nfaz SQL e transação", cor.violeta);
  s += txt(380, 392, "cada borda traduz; só o núcleo decide", { tam: 16, cor: cor.vermelho });
  return quadro(760, 410, s);
}

export default `
${resumo(
  "O coração do sistema (as regras de negócio) não conhece banco, tela nem framework. Ele declara <b>portas</b> (interfaces) e o mundo de fora se encaixa nelas por <b>adaptadores</b>.",
  "Seu notebook tem uma entrada USB-C. Em cada país você troca só o adaptador da tomada, não o notebook. O núcleo é o notebook; Postgres, HTTP e e-mail são as tomadas.",
)}

<p>A arquitetura hexagonal foi proposta por Alistair Cockburn em 2005 com o nome de <b>Ports and Adapters</b> (portas e
adaptadores). A meta dele era que a aplicação pudesse ser usada do mesmo jeito por uma pessoa, por outro programa, por
um teste automatizado ou por um script, e que desse para desenvolvê-la e testá-la sem o banco e os serviços reais. O
hexágono não tem nada de especial: é só um desenho com vários lados, para mostrar que o sistema pode ter muitas
"entradas" e "saídas", e não só uma pilha de cima para baixo como nas camadas (capítulo 4).</p>

${fig(diagrama(), "O núcleo no meio; à esquerda, quem chama o sistema; à direita, o que o sistema usa. Tudo depende do núcleo, nunca o contrário.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Núcleo</b>: entidades e casos de uso (por exemplo, "criar pedido", "cancelar pedido"). É código puro: não importa
nada de Express, Prisma, AWS ou React.</li>
<li><b>Portas</b>: interfaces que o núcleo define. Há dois tipos:
  <ul>
  <li><b>portas de entrada</b> (ou primárias): o que o sistema oferece. Ex.: <code>CriarPedido.executar(dados)</code>.</li>
  <li><b>portas de saída</b> (ou secundárias): o que o sistema precisa de fora. Ex.: <code>RepositorioDePedidos</code>,
  <code>EnviadorDeEmail</code>, <code>GatewayDePagamento</code>.</li>
  </ul></li>
<li><b>Adaptadores</b>: o código que liga a porta a uma tecnologia. Um controller HTTP, um comando de terminal ou um teste
<b>chamam</b> as portas de entrada; um repositório Postgres ou um cliente de e-mail <b>implementam</b> as portas de saída.</li>
<li><b>Regra de ouro</b>: as dependências apontam sempre para dentro. O adaptador conhece o núcleo; o núcleo só conhece as
próprias interfaces.</li>
</ul>

${fig(trocaAdaptador(), "A mesma porta, três adaptadores. É isso que deixa o núcleo testável e a tecnologia trocável.")}

<h4>Portas de entrada e portas de saída</h4>
<p>A diferença entre os dois tipos está em <b>quem começa a conversa</b>. Cockburn chama o lado de entrada de
<i>driving</i> (quem dirige o sistema) e o de saída de <i>driven</i> (o que é dirigido por ele). Nos desenhos, a
entrada costuma ficar à esquerda e a saída, à direita.</p>

${tabela(
  ["", "Porta de entrada (primária, <i>driving</i>)", "Porta de saída (secundária, <i>driven</i>)"],
  [
    ["<b>Quem começa</b>", "o mundo de fora chama o núcleo", "o núcleo chama o mundo de fora"],
    ["<b>O adaptador</b>", "<b>chama</b> a porta", "<b>implementa</b> a porta"],
    ["<b>Exemplos de porta</b>", "<code>CriarPedido</code>, <code>CancelarPedido</code>", "<code>RepositorioDePedidos</code>, <code>GatewayDePagamento</code>"],
    ["<b>Exemplos de adaptador</b>", "rota HTTP, consumidor de fila, comando de terminal", "repositório Postgres, cliente do gateway, envio de e-mail"],
    ["<b>No teste</b>", "o próprio teste faz o papel do adaptador", "um dublê em memória fica no lugar do adaptador"],
  ],
  "compacta",
)}

<p>As duas portas são escritas pelo núcleo, com nomes do negócio; o que muda é o sentido da chamada. Na entrada,
chamada e dependência andam juntas: a rota importa e chama o caso de uso. Na saída, elas se separam: na hora de rodar,
o núcleo chama o Postgres; no código, é o adaptador do Postgres que importa a interface do núcleo. Isso é a
<b>inversão de dependência</b> (o "D" do SOLID, que o capítulo 7 detalha).</p>

<h4>O caminho de uma requisição</h4>
<p>Siga um <code>POST /pedidos</code> do começo ao fim. Ele entra por uma porta, sai por outra, e cada borda tem um
trabalho de tradução:</p>

${fig(fluxo(), "A requisição atravessa duas portas e a resposta volta pelo mesmo caminho. Os adaptadores só traduzem formatos; quem decide é o núcleo.")}

<h3>Onde fica cada coisa</h3>
<p>Na hora de escrever o código, as dúvidas são sempre as mesmas: onde valido? onde abro a transação? quem converte o
JSON no objeto de dados que o caso de uso recebe (o <b>DTO</b>, do inglês <i>data transfer object</i>)? A regra prática:
<b>tradução e tecnologia ficam no adaptador; decisão de negócio fica no núcleo</b>.</p>

${tabela(
  ["O quê", "Onde", "Exemplo"],
  [
    ["Validar o <b>formato</b>", "adaptador de entrada", "o campo veio? é número? (zod, por exemplo); se não, 400"],
    ["Validar a <b>regra</b>", "núcleo (entidade ou caso de uso)", "pedido sem itens, produto inexistente, limite de crédito"],
    ["Converter formatos (DTOs)", "adaptador de entrada", "JSON ou mensagem vira <code>CriarPedidoComando</code>; o resultado vira JSON 201"],
    ["Traduzir erros", "adaptador de entrada", "<code>ErroDeNegocio</code> vira 422 na API e fila de erros no consumidor"],
    ["Entidade e tabela", "adaptador de saída", "<code>Pedido</code> vira linhas em <code>pedidos</code> e <code>itens</code>, e volta"],
    ["Transação", "limite no caso de uso; <code>begin</code>/<code>commit</code> no adaptador", "pedido e itens gravados juntos, ou nada"],
    ["Autenticação e permissão", "token no adaptador; permissão no núcleo", "\"quem é você\" na rota; \"só o dono cancela\" no núcleo"],
  ],
  "compacta",
)}

<p><b>Validar nos dois lugares não é duplicação.</b> A rota recusa <code>qtd: "abc"</code> porque isso nem chega a ser
um pedido. O núcleo recusa <code>qtd: 0</code> porque é contra a regra, venha o pedido da API, da fila ou de um script.
Se a regra morar só na rota, o próximo canal vai esquecer dela.</p>
<p><b>Transação: o núcleo decide o quê, o adaptador decide como.</b> O normal é uma transação por caso de uso. Se ele
grava um conjunto que sempre anda junto (o pedido e seus itens, o que o DDD chama de <i>agregado</i>), o
<code>salvar()</code> do repositório abre e fecha a transação, como no código adiante. Se grava em vários
repositórios, crie uma porta como <code>UnidadeDeTrabalho</code>, que o adaptador implementa com <code>begin</code> e
<code>commit</code>. O que não pode é o núcleo importar o cliente do banco.</p>

${quando(
  [
    "As regras de negócio são o valor do produto e vão mudar muito (pagamentos, seguros, logística, saúde).",
    "Você quer testar a lógica sem subir banco, fila ou servidor.",
    "É provável trocar ou somar tecnologias: outro banco, outro provedor de pagamento, uma fila além da API.",
    "O sistema tem várias entradas: API, filas, tarefas agendadas, linha de comando.",
  ],
  [
    "É um CRUD simples, quase sem regra (cadastro que só lê e grava): as interfaces viram cerimônia.",
    "Protótipo ou MVP que pode ser jogado fora em semanas.",
    "O time ainda não domina injeção de dependência e interfaces: comece com camadas bem separadas.",
    "Scripts e tarefas pequenas, de um arquivo.",
  ],
)}

${medidor({ complexidade: 3, escala: 4, operacao: 1, aprendizado: 3, time: "qualquer tamanho; brilha a partir de 3 a 4 devs" })}

<h3>Como usar na prática</h3>
<p>O exemplo é uma loja que cria pedidos por uma API HTTP e também recebe pedidos de um marketplace por uma fila. As
pastas separam o núcleo dos adaptadores, e os adaptadores por lado.</p>

${pastas(`
src/
├── pedidos/
│   ├── nucleo/                              # não importa nada de fora
│   │   ├── pedido.ts                        # entidade + regras
│   │   ├── criar-pedido.ts                  # caso de uso (porta de entrada)
│   │   └── portas.ts                        # portas de saída (interfaces)
│   └── adaptadores/
│       ├── entrada/
│       │   ├── http/pedidos-rotas.ts        # Express/Fastify
│       │   └── fila/pedidos-consumidor.ts   # mensagens do marketplace
│       └── saida/
│           ├── postgres/repositorio.ts      # implementa a porta com SQL
│           └── memoria/repositorio.ts       # dublê para os testes
└── main.ts                                  # liga tudo (composition root)
`)}

${codigo(
  `
// nucleo/portas.ts: o núcleo diz o que precisa, sem dizer como
export interface RepositorioDePedidos {
  salvar(pedido: Pedido): Promise<void>;
  buscar(id: string): Promise<Pedido | null>;
}
export interface CatalogoDePrecos {
  precoEmCentavos(produtoId: string): Promise<number | null>;
}

// nucleo/criar-pedido.ts: a porta de entrada é o próprio caso de uso
export type ItemDoComando = { produtoId: string; qtd: number };
export type CriarPedidoComando = { clienteId: string; itens: ItemDoComando[] };
export class ErroDeNegocio extends Error {}

export class CriarPedido {
  constructor(private pedidos: RepositorioDePedidos, private catalogo: CatalogoDePrecos) {}

  async executar({ clienteId, itens }: CriarPedidoComando) {
    if (itens.length === 0) throw new ErroDeNegocio("Pedido sem itens");
    const pedido = Pedido.novo(clienteId);
    for (const item of itens) {
      const preco = await this.catalogo.precoEmCentavos(item.produtoId);
      if (preco === null) throw new ErroDeNegocio(\`Produto \${item.produtoId} não existe\`);
      pedido.adicionar(item.produtoId, item.qtd, preco); // a entidade recusa qtd <= 0
    }
    await this.pedidos.salvar(pedido);
    return { pedidoId: pedido.id, totalEmCentavos: pedido.totalEmCentavos };
  }
}`,
  "src/pedidos/nucleo",
)}

<p>Dois detalhes. O caso de uso devolve dados simples, não a entidade: assim a API não fica amarrada ao modelo interno.
E ele lança <code>ErroDeNegocio</code>, não um erro HTTP: quem escolhe o status é a rota. Agora as entradas:</p>

${codigo(
  `
// entrada/http/pedidos-rotas.ts: traduz HTTP para o caso de uso, e o resultado de volta
const Corpo = z.object({                                  // valida o FORMATO
  clienteId: z.string().min(1),
  itens: z.array(z.object({ produtoId: z.string(), qtd: z.number() })),
});

export function rotasDePedidos(app: Express, criarPedido: CriarPedido) {
  app.post("/pedidos", async (req, res, next) => {
    const corpo = Corpo.safeParse(req.body);
    if (!corpo.success) return res.status(400).json({ erro: "corpo inválido" });
    try {
      const r = await criarPedido.executar(corpo.data);   // JSON vira comando
      res.status(201).json({ id: r.pedidoId, total: r.totalEmCentavos / 100 });
    } catch (e) {
      if (e instanceof ErroDeNegocio) res.status(422).json({ erro: e.message });
      else next(e);                                       // erro técnico: 500
    }
  });
}

// entrada/fila/pedidos-consumidor.ts: outra entrada, o mesmo caso de uso
export function consumirMarketplace(fila: Fila, criarPedido: CriarPedido) {
  fila.consumir("marketplace.pedidos", async (msg) => {
    const m = JSON.parse(msg.corpo);                      // formato do marketplace...
    const itens = m.items.map((i: any) => ({ produtoId: i.sku, qtd: i.quantity }));
    try { await criarPedido.executar({ clienteId: m.buyer_id, itens }); } // ...vira comando
    catch (e) { if (e instanceof ErroDeNegocio) msg.rejeitar(e.message); else throw e; }
  }); // erro de regra não melhora com nova tentativa; erro técnico volta para a fila
}`,
  "src/pedidos/adaptadores/entrada",
)}

<p>As duas entradas fazem o mesmo trabalho com formatos diferentes. Um script de terminal que importa pedidos de uma
planilha seria um terceiro adaptador, sem nenhuma regra copiada. Do outro lado, a saída esconde o SQL e a transação:</p>

${codigo(
  `
// saida/postgres/repositorio.ts: implementa a porta e esconde o SQL
const SQL_PEDIDO = "insert into pedidos (id, cliente_id, total) values ($1, $2, $3)";
const SQL_ITEM = "insert into itens (pedido_id, produto_id, qtd, preco) values ($1,$2,$3,$4)";

export class RepositorioPostgres implements RepositorioDePedidos {
  constructor(private pool: Pool) {}

  async salvar(p: Pedido) {                               // entidade vira linhas
    const db = await this.pool.connect();
    try {
      await db.query("begin");                            // pedido e itens: tudo ou nada
      await db.query(SQL_PEDIDO, [p.id, p.clienteId, p.totalEmCentavos]);
      for (const i of p.itens) await db.query(SQL_ITEM, [p.id, i.produtoId, i.qtd, i.preco]);
      await db.query("commit");
    } catch (e) {
      await db.query("rollback");
      throw e;
    } finally {
      db.release();
    }
  }

  async buscar(id: string): Promise<Pedido | null> {
    /* select com join em itens; as linhas viram entidade com Pedido.reconstituir() */
    return null;
  }
}

// main.ts: o único lugar que conhece todas as peças
const criarPedido = new CriarPedido(new RepositorioPostgres(pool), new CatalogoPostgres(pool));
rotasDePedidos(app, criarPedido);
consumirMarketplace(fila, criarPedido);                   // um núcleo, duas entradas`,
  "src/pedidos/adaptadores/saida e src/main.ts",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Liste os casos de uso do módulo (verbos do negócio: criar, cancelar, aprovar...). Cada um vira uma classe ou função no núcleo.",
  "Para cada coisa de fora que o caso de uso precisa (banco, e-mail, pagamento), crie uma interface no núcleo, com nomes do negócio (<code>RepositorioDePedidos</code>, não <code>PostgresClient</code>).",
  "Escreva os adaptadores de saída implementando essas interfaces, e um adaptador em memória para os testes.",
  "Escreva os adaptadores de entrada (rotas, consumidores de fila) só traduzindo formato: validam a entrada, chamam o caso de uso e formatam a resposta.",
  "Junte tudo num único ponto (<code>main.ts</code>, o <i>composition root</i>) ou com um container de injeção de dependência.",
  "Proteja a regra com uma checagem automática: o núcleo não pode importar pastas de adaptadores (dá para usar ferramentas como dependency-cruiser ou regras de lint).",
])}

<p>Vindo de um projeto em camadas (capítulo 4)? Não precisa reescrever. Escolha um service, traga para dentro do núcleo
a interface do repository que ele usa e faça o repository implementá-la. Repita, um fluxo por vez.</p>

<h3>Como testar</h3>
<p>A testabilidade é o maior ganho da hexagonal, mas só aparece se cada tipo de teste mirar uma parte do hexágono:</p>
<ul>
<li><b>Núcleo, com dublês nas portas de saída</b> (muitos testes, milissegundos cada). Um dublê (<i>test double</i>) é
uma peça falsa no lugar da real. Prefira um <b>fake</b> (uma implementação simples em memória) a um <b>mock</b> que
confere cada chamada: teste o resultado ("o pedido foi salvo com total de R$ 50"), não o roteiro ("chamou
<code>salvar</code> uma vez").</li>
<li><b>Adaptadores de saída, com a tecnologia real</b> (poucos testes, segundos cada). O repositório Postgres é testado
contra um Postgres de verdade, num container (com Testcontainers ou docker compose). É aqui que aparecem o SQL errado,
a coluna esquecida e a transação que não volta atrás.</li>
<li><b>Contrato da porta</b>: a mesma bateria de testes roda contra o fake e contra o adaptador real. Se os dois
passam, o fake não mente para os testes do núcleo.</li>
<li><b>Adaptadores de entrada e ponta a ponta</b>: chame a rota (com supertest, por exemplo) ligada ao núcleo e aos
fakes para conferir status e validação sem banco. Testes com tudo real, só poucos, nos caminhos críticos.</li>
</ul>

${codigo(
  `
// dublê da porta de saída: um fake em memória, escrito uma vez e usado em todo teste
class RepositorioEmMemoria implements RepositorioDePedidos {
  private dados = new Map<string, Pedido>();
  async salvar(p: Pedido) { this.dados.set(p.id, p); }
  async buscar(id: string) { return this.dados.get(id) ?? null; }
}

// núcleo: sem banco, sem servidor, roda em milissegundos
test("calcula o total e salva o pedido", async () => {
  const repo = new RepositorioEmMemoria();
  const catalogo = { precoEmCentavos: async () => 2500 };   // todo produto custa R$ 25
  const criar = new CriarPedido(repo, catalogo);
  const r = await criar.executar({ clienteId: "c1", itens: [{ produtoId: "p1", qtd: 2 }] });
  expect(r.totalEmCentavos).toBe(5000);
  expect(await repo.buscar(r.pedidoId)).not.toBeNull();    // confere o estado, não as chamadas
});

// contrato da porta: a mesma bateria contra o fake e contra o Postgres real
describe.each([
  ["em memória", async () => new RepositorioEmMemoria()],
  ["Postgres", async () => new RepositorioPostgres(await postgresDeTeste())], // container
])("RepositorioDePedidos (%s)", (_nome, criarRepo) => {
  test("salva e busca o mesmo pedido", async () => {
    const repo = await criarRepo();
    const pedido = Pedido.novo("c1");
    pedido.adicionar("p1", 2, 2500);
    await repo.salvar(pedido);
    expect((await repo.buscar(pedido.id))?.totalEmCentavos).toBe(5000);
  });
});`,
  "pedidos.test.ts",
)}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Regras de negócio testáveis em milissegundos, sem infraestrutura", "Mais arquivos e interfaces do que num CRUD direto"],
    ["Trocar banco, fila ou provedor sem mexer no núcleo", "Mapear dados nas bordas (JSON e comando, entidade e tabela), às vezes de forma repetitiva"],
    ["Várias entradas (API, fila, CLI) usando os mesmos casos de uso", "Time precisa entender injeção de dependência"],
    ["Testes de integração focados: só os adaptadores precisam de banco real", "Manter um fake por porta, que se comporte como o adaptador real"],
    ["Framework vira detalhe: dá para atualizar ou trocar com menos medo", "Risco de \"interface para tudo\" virar burocracia"],
  ],
)}

<h3>Preciso de interface para tudo?</h3>
<p>Não. Interface é ferramenta, não enfeite. Nos casos duvidosos, comece sem ela: extrair uma depois, quando aparecer a
segunda implementação ou a necessidade de um dublê, é uma refatoração pequena. Uma regra de bolso por tipo de peça:</p>
<ul>
<li><b>Portas de saída: quase sempre sim.</b> Banco, e-mail, pagamento e outros serviços na rede são justamente o que
você quer isolar do núcleo e trocar por um dublê no teste.</li>
<li><b>Portas de entrada: quase sempre não.</b> A própria classe <code>CriarPedido</code> já é a porta, e a rota a chama
direto, como no código acima. Uma interface só se paga se houver mais de uma implementação ou se você quiser embrulhar
o caso de uso com log, métricas ou transação (um <i>decorator</i>, ou "embrulho").</li>
<li><b>Dentro do núcleo: não.</b> Entidades, cálculos e funções puras (formatar data, calcular frete) não precisam de
interface: o teste usa a peça real, que já é rápida.</li>
<li><b>Relógio e gerador de IDs: vale pensar.</b> Parecem bobos, mas uma porta <code>Relogio</code> deixa testar "o
pedido expira em 30 minutos" sem esperar 30 minutos.</li>
</ul>

<h3>Erros comuns</h3>
<ul>
<li><b>Porta que vaza tecnologia</b>: <code>buscar(): Promise&lt;PrismaPedido&gt;</code> amarra o núcleo ao ORM. A porta deve
devolver tipos do núcleo.</li>
<li><b>Regra de negócio no adaptador</b>: o controller decide desconto, o repositório calcula frete. O adaptador só traduz.</li>
<li><b>Núcleo que fala HTTP</b>: o caso de uso lança <code>HttpException(404)</code> ou devolve <code>{ status: 422 }</code>.
Status é assunto da rota; o núcleo lança erros de negócio e o adaptador os traduz.</li>
<li><b>Atalho pela borda</b>: a rota usa o <code>RepositorioPostgres</code> direto e pula o caso de uso. Numa listagem
simples pode ser uma escolha consciente (registre num ADR, capítulo 32); numa rota que grava, é regra fugindo do núcleo.</li>
<li><b>Porta gigante</b>: uma interface <code>BancoDeDados</code> com quarenta métodos, usada por todo mundo. Desenhe as
portas pelo que cada caso de uso precisa (<code>RepositorioDePedidos</code>, <code>CatalogoDePrecos</code>), não pelo
que o banco oferece.</li>
<li><b>Mock de tudo</b>: testes que conferem cada chamada quebram a cada refatoração e deixam bugs passar. Use fakes e
confira o resultado.</li>
<li><b>Núcleo anêmico</b>: entidades viram só "sacos de dados" e toda a regra vai para serviços gigantes. Coloque o
comportamento perto dos dados (<code>pedido.cancelar()</code>).</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O time de estúdio da Netflix contou num artigo do blog de engenharia (<i>Ready for changes with Hexagonal Architecture</i>, 2020) que adotou portas e adaptadores para poder trocar a origem dos dados (de um monólito para novos serviços) sem reescrever a lógica de negócio dos seus apps. É o caso de uso clássico: a tecnologia de fora muda, o núcleo fica.</p>",
)}

${dica(
  "Hexagonal, Clean ou Onion?",
  "<p>São primas: as três isolam o núcleo e fazem as dependências apontarem para dentro. A hexagonal fala de <b>portas e adaptadores</b> (entradas e saídas); a Clean e a Onion desenham <b>anéis</b> com nomes para cada camada. Na prática, um projeto bem feito em qualquer uma das três fica muito parecido. Veja o capítulo 7.</p>",
)}

${alerta(
  "Não confunda com microsserviços",
  "<p>Hexagonal é sobre como organizar o código <b>dentro</b> de uma aplicação. Ela funciona num monólito (capítulo 11), num monólito modular (12) ou dentro de cada microsserviço (14).</p>",
)}

${combina([
  [7, "Clean Architecture e Onion", "mesma ideia, com anéis nomeados"],
  [12, "Monólito modular", "cada módulo com seu próprio hexágono"],
  [14, "Microsserviços", "cada serviço por dentro"],
  [21, "CQRS", "portas separadas para escrita e leitura"],
  [20, "Orientada a eventos", "consumidores de fila como adaptadores de entrada"],
  [4, "Camadas", "o ponto de partida mais simples"],
])}

${lembre([
  "O núcleo define interfaces (portas); a tecnologia se encaixa por adaptadores. Na entrada, o adaptador chama a porta; na saída, ele a implementa.",
  "Dependências sempre para dentro: os adaptadores traduzem formatos (validação de formato, DTOs, SQL, transação) e só o núcleo decide regra.",
  "Vale a pena quando a regra de negócio é rica e muda muito; num CRUD simples, é cerimônia.",
])}
`;
