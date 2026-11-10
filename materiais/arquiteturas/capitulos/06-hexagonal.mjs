// Capítulo 6 — Hexagonal (portas e adaptadores). Serve de MODELO para os outros capítulos:
// abertura (resumo) → diagrama → como funciona → quando usar → medidor → na prática (pastas + código)
// → vantagens e custos → erros comuns → exemplo real → combina com → para lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, caminho, claro, cor, navegador, pessoa, semear, servidor, seta, quadro, txt, banco, envelope } from "../desenho.mjs";

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
  const porta = (x, y, rot) => bloco(x - 9, y - 9, 18, 18, "", { preench: cor.verde, hachura: "solid" }) + txt(x, y - 22, rot, { tam: 14, cor: cor.verde });
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
  s += bloco(250, 30, 260, 70, "CriarPedido (núcleo)", { preench: claro.amarelo });
  s += bloco(310, 130, 140, 50, "RepositorioDePedidos", { preench: claro.verde, tam: 14 });
  s += txt(380, 196, "porta (interface)", { tam: 14, cor: cor.verde });
  s += seta(380, 100, 380, 128, { espessura: 2 });
  const adapt = [
    [60, "Postgres", claro.violeta, "produção"],
    [300, "Em memória", claro.cinza, "testes"],
    [540, "DynamoDB", claro.violeta, "amanhã"],
  ];
  for (const [x, nome, c, rot] of adapt) {
    s += bloco(x, 250, 160, 56, nome, { preench: c, tam: 16 });
    s += txt(x + 80, 324, rot, { tam: 14, cor: cor.cinza });
    s += seta(x + 80, 248, 380, 182, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  }
  s += txt(380, 352, "trocar o banco = escrever outro adaptador; o núcleo não muda", { tam: 15, cor: cor.vermelho });
  return quadro(760, 370, s);
}

export default `
${resumo(
  "O coração do sistema (as regras de negócio) não conhece banco, tela nem framework. Ele declara <b>portas</b> (interfaces) e o mundo de fora se encaixa nelas por <b>adaptadores</b>.",
  "Seu notebook tem uma entrada USB-C. Em cada país você troca só o adaptador da tomada, não o notebook. O núcleo é o notebook; Postgres, HTTP e e-mail são as tomadas.",
)}

<p>A arquitetura hexagonal foi proposta por Alistair Cockburn em 2005 com o nome de <b>Ports and Adapters</b> (portas e
adaptadores). O hexágono não tem nada de especial: é só um desenho com vários lados, para mostrar que o sistema pode ter
muitas "entradas" e "saídas", e não só uma pilha de cima para baixo como nas camadas (capítulo 4).</p>

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
${pastas(`
src/
├── pedidos/
│   ├── nucleo/                    # não importa nada de fora
│   │   ├── pedido.ts              # entidade + regras
│   │   ├── criar-pedido.ts        # caso de uso (porta de entrada)
│   │   └── portas.ts              # portas de saída (interfaces)
│   └── adaptadores/
│       ├── http/pedidos-rotas.ts  # entrada: Express/Fastify
│       ├── postgres/repositorio.ts# saída: implementa a porta
│       └── memoria/repositorio.ts # saída: para testes
└── main.ts                        # liga tudo (composition root)
`)}

${codigo(
  `
// nucleo/portas.ts — o núcleo diz o que precisa, sem dizer como
export interface RepositorioDePedidos {
  salvar(pedido: Pedido): Promise<void>;
  buscar(id: string): Promise<Pedido | null>;
}

// nucleo/criar-pedido.ts — caso de uso: só regra de negócio
export class CriarPedido {
  constructor(private pedidos: RepositorioDePedidos) {}

  async executar(dados: { clienteId: string; itens: Item[] }) {
    if (dados.itens.length === 0) throw new Error("Pedido vazio");
    const pedido = Pedido.novo(dados.clienteId, dados.itens);
    await this.pedidos.salvar(pedido);
    return pedido.id;
  }
}`,
  "src/pedidos/nucleo",
)}

${codigo(
  `
// adaptadores/postgres/repositorio.ts — saída: implementa a porta
export class RepositorioPostgres implements RepositorioDePedidos {
  constructor(private db: Pool) {}
  async salvar(p: Pedido) {
    await this.db.query("insert into pedidos (id, cliente_id, total) values ($1, $2, $3)", [p.id, p.clienteId, p.total]);
  }
  async buscar(id: string) { /* ... */ return null; }
}

// adaptadores/http/pedidos-rotas.ts — entrada: traduz HTTP para o caso de uso
app.post("/pedidos", async (req, res) => {
  const id = await criarPedido.executar(req.body);
  res.status(201).json({ id });
});

// main.ts — o único lugar que conhece todas as peças
const criarPedido = new CriarPedido(new RepositorioPostgres(pool));`,
  "src/pedidos/adaptadores e src/main.ts",
)}

${codigo(
  `
// teste do núcleo: sem banco, sem servidor, roda em milissegundos
test("não aceita pedido vazio", async () => {
  const casoDeUso = new CriarPedido(new RepositorioEmMemoria());
  await expect(casoDeUso.executar({ clienteId: "c1", itens: [] })).rejects.toThrow("Pedido vazio");
});`,
  "pedidos.test.ts",
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

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Regras de negócio testáveis em milissegundos, sem infraestrutura", "Mais arquivos e interfaces do que num CRUD direto"],
    ["Trocar banco, fila ou provedor sem mexer no núcleo", "Mapear dados entre entidade e tabela (às vezes repetitivo)"],
    ["Várias entradas (API, fila, CLI) usando os mesmos casos de uso", "Time precisa entender injeção de dependência"],
    ["Framework vira detalhe: dá para atualizar ou trocar com menos medo", "Risco de \"interface para tudo\" virar burocracia"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Porta que vaza tecnologia</b>: <code>buscar(): Promise&lt;PrismaPedido&gt;</code> amarra o núcleo ao ORM. A porta deve
devolver tipos do núcleo.</li>
<li><b>Regra de negócio no adaptador</b>: o controller decide desconto, o repositório calcula frete. O adaptador só traduz.</li>
<li><b>Interface para tudo</b>: criar portas para coisas que nunca vão mudar nem precisam de dublê em teste (uma função
de formatar data, por exemplo).</li>
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
  "O núcleo define interfaces (portas); a tecnologia se encaixa por adaptadores.",
  "Dependências sempre para dentro: o núcleo não importa nada de framework, banco ou HTTP.",
  "Vale a pena quando a regra de negócio é rica e muda muito; num CRUD simples, é cerimônia.",
])}
`;
