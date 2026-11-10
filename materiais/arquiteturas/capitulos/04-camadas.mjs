// Capítulo 4 — Arquitetura em camadas (layered / n-tier lógico).
// Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, linha, navegador, quadro, semear, seta, txt, xis } from "../desenho.mjs";

function pilha() {
  semear("camadas-1");
  let s = "";
  const x = 200, w = 360, h = 76;
  const camadas = [
    [24, "Apresentação", "rotas, controllers, telas", claro.azul, "como entra\ne sai?"],
    [134, "Negócio (aplicação)", "services: regras e casos de uso", claro.amarelo, "o que é\npermitido?"],
    [244, "Persistência", "repositories, ORM, SQL", claro.violeta, "como guardo\ne busco?"],
  ];
  for (const [y, nome, sub, c, pergunta] of camadas) {
    s += bloco(x, y, w, h, "", { preench: c });
    s += txt(x + w / 2, y + 27, nome, { tam: 19 });
    s += txt(x + w / 2, y + 54, sub, { tam: 15, cor: cor.cinza });
    s += txt(672, y + h / 2, pergunta, { tam: 15, cor: cor.cinza });
  }
  s += banco(310, 354, 140, 80, "banco de dados", { preench: claro.cinza, tam: 15 });
  // setas entre as camadas: desce chamando, sobe devolvendo
  for (const y of [100, 210, 320]) {
    s += seta(330, y + 3, 330, y + 32, { cor: cor.azul, espessura: 2 });
    s += seta(430, y + 32, 430, y + 3, { cor: cor.cinza, espessura: 1.6, tracejado: true });
  }
  s += txt(318, 118, "chama", { tam: 15, cor: cor.azul, ancora: "end" });
  s += txt(442, 118, "devolve", { tam: 15, cor: cor.cinza, ancora: "start" });
  // quem chama o sistema
  s += navegador(30, 26, 124, 72, "cliente");
  s += seta(156, 62, 197, 62, { cor: cor.azul, espessura: 2 });
  s += txt(95, 250, "cada camada só\nconversa com\na de baixo", { tam: 16, cor: cor.vermelho });
  s += txt(612, 396, "+ infraestrutura:\ne-mail, filas, logs", { tam: 15, cor: cor.cinza });
  return quadro(760, 446, s);
}

function fechadaAberta() {
  semear("camadas-2");
  let s = "";
  const nomes = ["Apresentação", "Negócio", "Persistência"];
  const ys = [62, 162, 262];
  const h = 58, w = 200;
  // painel da esquerda: todas fechadas
  const xa = 90;
  s += txt(190, 24, "camadas fechadas (strict)", { tam: 17, cor: cor.azul });
  ys.forEach((y, i) => (s += bloco(xa, y, w, h, nomes[i], { preench: [claro.azul, claro.amarelo, claro.violeta][i], tam: 17 })));
  s += seta(190, 122, 190, 160, { cor: cor.azul, espessura: 2 });
  s += seta(190, 222, 190, 260, { cor: cor.azul, espessura: 2 });
  // atalho proibido
  s += linha([[xa, 91], [50, 91], [50, 291]], { cor: cor.vermelho, espessura: 1.6, tracejado: true });
  s += seta(50, 291, xa - 2, 291, { cor: cor.vermelho, espessura: 1.6 });
  s += xis(50, 191, 18);
  s += txt(190, 352, "toda requisição passa por todas;", { tam: 15 });
  s += txt(190, 376, "pular camada é proibido", { tam: 15, cor: cor.vermelho });
  // divisória
  s += linha([[380, 20], [380, 380]], { cor: cor.cinza, espessura: 1.2, tracejado: true });
  // painel da direita: Negócio aberta
  const xb = 440;
  s += txt(560, 24, "camada aberta (relaxed)", { tam: 17, cor: cor.laranja });
  s += bloco(xb, ys[0], w, h, nomes[0], { preench: claro.azul, tam: 17 });
  s += bloco(xb, ys[1], w, h, "", { preench: claro.amarelo, tracejado: true });
  s += txt(xb + w / 2, ys[1] + 21, "Negócio", { tam: 17 });
  s += txt(xb + w / 2, ys[1] + 42, "(aberta)", { tam: 15, cor: cor.laranja });
  s += bloco(xb, ys[2], w, h, nomes[2], { preench: claro.violeta, tam: 17 });
  s += seta(510, 122, 510, 160, { cor: cor.azul, espessura: 2 });
  s += seta(510, 222, 510, 260, { cor: cor.azul, espessura: 2 });
  // atalho permitido
  s += linha([[xb + w, 91], [700, 91], [700, 291]], { cor: cor.verde, espessura: 2 });
  s += seta(700, 291, xb + w + 2, 291, { cor: cor.verde, espessura: 2 });
  s += txt(560, 352, "leitura simples pode pular", { tam: 15 });
  s += txt(560, 376, "direto para a persistência", { tam: 15, cor: cor.verde });
  return quadro(760, 396, s);
}

export default `
${resumo(
  "O código é dividido em <b>camadas empilhadas</b>, cada uma com um trabalho (mostrar, decidir, guardar), e cada camada só conversa com a que está logo abaixo.",
  "Num restaurante, o garçom anota o pedido, a cozinha prepara e o estoquista busca os ingredientes na despensa. O cliente não entra na despensa e o garçom não cozinha. Cada um faz uma coisa e só fala com o vizinho.",
)}

<p>É a arquitetura mais comum em aplicações corporativas e, muitas vezes, a que você já usa sem saber o nome: quem
escreveu um controller que chama um service que chama um repository já trabalhou em camadas. A ideia de empilhar
níveis, em que cada um só usa o de baixo, é antiga e aparece até em redes (o modelo OSI e a pilha TCP/IP são camadas).
Martin Fowler, no livro <i>Patterns of Enterprise Application Architecture</i>, chama as três camadas principais
de apresentação, domínio e fonte de dados. No dia a dia, a gente diz apresentação, negócio e persistência.</p>

${fig(pilha(), "A requisição desce pela pilha e a resposta sobe pelo mesmo caminho. Cada camada responde a uma pergunta diferente.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Apresentação</b>: recebe a entrada e devolve a saída. Numa API são as rotas e os controllers; num app, as telas.
Valida o <i>formato</i> (o campo veio? é número?), chama o negócio e escolhe o status HTTP. Não decide regra.</li>
<li><b>Negócio</b> (ou aplicação): onde moram as regras. "Pedido sem itens não vale", "frete grátis acima de R$ 200".
Em código, costumam ser os <b>services</b>, e é neles que a transação do banco começa e termina. Alguns times dividem
em <b>aplicação</b> (orquestra o caso de uso) e <b>domínio</b> (as regras puras), como no DDD (<i>Domain-Driven Design</i>, o design guiado pelo domínio) de Eric Evans.</li>
<li><b>Persistência</b>: guarda e busca dados. Repositories, ORM, SQL. Sabe <i>como</i> salvar, não <i>por quê</i>.</li>
<li><b>Banco e infraestrutura</b>: o banco em si e o que é técnico e compartilhado (e-mail, filas, logs, configuração).</li>
<li><b>A regra</b>: cada camada só chama a de baixo, nunca a de cima. O repository não conhece o controller; o service não
sabe se a chamada veio de HTTP, de uma fila ou de um teste.</li>
</ul>

<h4>Camadas fechadas e abertas</h4>
<p>Uma camada <b>fechada</b> não pode ser pulada: o controller é obrigado a passar pelo service para chegar ao
repository. Quando todas são fechadas, o desenho é <b>estrito</b> (<i>strict layering</i>). Isso cria o que Mark Richards,
no livro <i>Software Architecture Patterns</i>, chama de <b>camadas de isolamento</b>: se você troca o ORM, só a
persistência muda, porque ninguém acima dela fala com o ORM.</p>
<p>Uma camada <b>aberta</b> pode ser pulada por quem está acima; um desenho com camadas abertas é <b>relaxado</b>
(<i>relaxed layering</i>). Isso é útil quando a camada não tem nada a dizer para certo tipo de chamada, como uma tela que
só lista produtos. O preço: menos isolamento, porque a apresentação passa a conhecer a persistência.</p>

${fig(fechadaAberta(), "À esquerda, o atalho é proibido. À direita, a camada de negócio foi aberta de propósito e as leituras simples podem pular direto para a persistência.")}

<h4>O anti-padrão sumidouro (sinkhole)</h4>
<p>Acontece quando a requisição atravessa camadas que não fazem nada além de repassar. O controller chama
<code>produtoService.buscar(id)</code>, que só faz <code>return this.repo.buscar(id)</code>. Richards sugere a regra
80-20: tudo bem se uns 20% das requisições só passam direto; se a maioria é assim, as camadas viraram burocracia. A saída é
abrir camadas de propósito para as leituras simples ou organizar por fatias verticais (capítulo 8).</p>

${quando(
  [
    "CRUDs (criar, ler, atualizar e apagar registros) com regras moderadas: painel administrativo, backoffice, RH.",
    "Time iniciante ou misto: todo mundo conhece controller, service e repository, e NestJS e Spring já sugerem essa divisão.",
    "Apps corporativos em que o mais importante é cada pessoa saber onde mexer.",
    "Primeira versão de um produto, quando ainda não se sabe onde vai estar a complexidade.",
  ],
  [
    "Regra de negócio rica, que muda muito e precisa ficar livre do banco e do framework: veja os capítulos 6 e 7.",
    "Vários times no mesmo código: prefira fatias (capítulo 8) ou módulos (12).",
    "Quase toda requisição só repassa dados (sumidouro).",
    "O trabalho é um fluxo de dados ou de eventos: veja os capítulos 10 e 20.",
  ],
)}

${medidor({ complexidade: 1, escala: 2, operacao: 1, aprendizado: 1, time: "do dev solo a um time; com vários times, organize por funcionalidade" })}

<h3>Como usar na prática</h3>
<p>Há dois jeitos de montar as pastas. O primeiro é o que quase todo tutorial mostra: uma pasta por camada.</p>

${pastas(
  `
src/
├── controllers/    # pedido.controller.ts, produto.controller.ts
├── services/       # pedido.service.ts, produto.service.ts
├── repositories/   # pedido.repository.ts, produto.repository.ts
└── main.ts
`,
  "por camada (o começo clássico)",
)}

<p>Funciona enquanto o projeto é pequeno. Quando cresce, mexer em "pedidos" exige abrir três pastas distantes, e
<code>services/</code> acumula dezenas de arquivos sem relação entre si. O segundo jeito mantém as camadas, só que
<b>dentro de cada funcionalidade</b>:</p>

${pastas(
  `
src/
├── pedidos/
│   ├── pedido.controller.ts   # apresentação
│   ├── pedido.service.ts      # negócio
│   └── pedido.repository.ts   # persistência
├── produtos/                  # mesma divisão em três arquivos
├── compartilhado/db.ts        # pool de conexões (infraestrutura)
└── main.ts                    # liga as camadas
`,
  "por funcionalidade, com camadas dentro (recomendado)",
)}

<p>Um exemplo com Express, de baixo para cima. Primeiro a persistência: só SQL, nenhuma regra.</p>

${codigo(
  `
// persistência: sabe salvar, não sabe por quê
import { Pool } from "pg";
export class PedidoRepository {
  constructor(private db: Pool) {}
  async inserir(clienteId: string, totalCentavos: number) {
    const sql = "insert into pedidos (cliente_id, total_centavos) values ($1, $2) returning id";
    const { rows } = await this.db.query<{ id: string }>(sql, [clienteId, totalCentavos]);
    return rows[0];
  }
}`,
  "src/pedidos/pedido.repository.ts",
)}

${codigo(
  `
// negócio: as regras moram aqui
import { PedidoRepository } from "./pedido.repository"; // a seta desce
import { ProdutoRepository } from "../produtos/produto.repository";
export class ErroDeNegocio extends Error {}

export class PedidoService {
  constructor(private pedidos: PedidoRepository, private produtos: ProdutoRepository) {}
  async criar(clienteId: string, itens: { produtoId: string; qtd: number }[]) {
    if (itens.length === 0) throw new ErroDeNegocio("Pedido sem itens");
    let subtotal = 0;
    for (const item of itens) {
      if (item.qtd <= 0) throw new ErroDeNegocio("Quantidade inválida");
      const produto = await this.produtos.buscarPorId(item.produtoId);
      if (!produto) throw new ErroDeNegocio(\`Produto \${item.produtoId} não existe\`);
      subtotal += produto.precoCentavos * item.qtd;
    }
    const frete = subtotal > 20000 ? 0 : 1990; // frete grátis acima de R$ 200
    return this.pedidos.inserir(clienteId, subtotal + frete);
  }
}`,
  "src/pedidos/pedido.service.ts",
)}

${codigo(
  `
// apresentação: traduz HTTP, não decide nada
import { Router } from "express";
import { PedidoService, ErroDeNegocio } from "./pedido.service";

export function rotasDePedidos(service: PedidoService) {
  const router = Router();
  router.post("/pedidos", async (req, res, next) => {
    if (typeof req.body?.clienteId !== "string" || !Array.isArray(req.body?.itens)) {
      res.status(400).json({ erro: "envie clienteId (texto) e itens (lista)" });
      return;
    }
    try {
      const pedido = await service.criar(req.body.clienteId, req.body.itens);
      res.status(201).json(pedido);
    } catch (e) {
      if (e instanceof ErroDeNegocio) res.status(422).json({ erro: e.message });
      else next(e);
    }
  });
  return router;
}`,
  "src/pedidos/pedido.controller.ts",
)}

<p>Falta ligar tudo no <code>main.ts</code>: <code>const service = new PedidoService(new PedidoRepository(pool),
new ProdutoRepository(pool))</code> e <code>app.use(express.json(), rotasDePedidos(service))</code>. Se o pedido também
chegar por uma fila, o consumidor chama o mesmo <code>service.criar()</code> e nenhuma regra é copiada.</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Escreva no README o trabalho de cada camada: controller traduz, service decide, repository guarda.",
  "Escolha as pastas: por camada num projeto pequeno; por funcionalidade, com camadas dentro, quando passar de meia dúzia de entidades.",
  "Comece pelo service: escreva a regra e um teste unitário com dublês (<i>mocks</i>) dos repositories, sem subir banco.",
  "Deixe os controllers finos: validam o formato, chamam o service e montam a resposta. Nada de <code>req</code> ou <code>res</code> dentro do service.",
  "Decida quais camadas são abertas (por exemplo, listagens simples podem ir do controller direto ao repository) e registre a decisão num ADR (registro de decisão de arquitetura, capítulo 32).",
  "Automatize a regra: com <code>no-restricted-imports</code> do ESLint ou com o dependency-cruiser, impeça que um repository importe um service ou que um service importe algo de HTTP.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Fácil de entender: qualquer dev sabe onde procurar cada coisa", "Um campo novo atravessa todas as camadas (tela, service, repository, tabela)"],
    ["Trocar a tela ou o ORM mexe em uma camada só", "O negócio depende da persistência, a não ser que você inverta essa dependência"],
    ["Frameworks e tutoriais seguem o padrão: quem chega ao time se adapta rápido", "Tendência ao sumidouro: camadas que só repassam"],
    ["Regra concentrada nos services, num lugar só", "Com pastas por camada, cresce mal e vários times esbarram nas mesmas pastas"],
    ["Ótimo ponto de partida: evolui para hexagonal, Clean ou módulos", "Não diz nada sobre deploy e escala: tudo costuma ir para o ar junto"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Controller gordo</b>: o controller calcula desconto, consulta o banco e manda e-mail. Quando a mesma regra precisar
rodar numa tarefa agendada, vai ser copiada. Regra vai no service; e se um service passar de mil linhas, quebre por caso de
uso (<code>CriarPedido</code>, <code>CancelarPedido</code>).</li>
<li><b>Atalho "só dessa vez"</b>: o controller chama o repository direto sem ninguém ter decidido que a camada é aberta.
Em poucos meses, metade das rotas pula o service e a regra se espalha. Abra camadas de propósito, não por pressa.</li>
<li><b>Dependência para cima</b>: o service recebe <code>req</code> do Express, ou o repository chama um service. A seta
passa a apontar para os dois lados e as camadas deixam de existir na prática.</li>
<li><b>Vazar o modelo do banco até a resposta</b>: devolver a entidade do ORM direto no JSON expõe campos que não deviam
sair (como o hash da senha) e amarra a API ao formato da tabela. Monte o objeto de resposta na apresentação.</li>
</ul>

${pratica(
  "No mundo real (cenário de exemplo)",
  "<p>Imagine uma rede de academias que precisa de um sistema interno: alunos, planos, cobranças e check-in na catraca. O time tem quatro devs, dois deles juniores. Camadas com Express, uma pasta por camada, são a escolha certa: em uma semana todo mundo sabe onde fica cada coisa, e o sistema vai para o ar rápido.</p><p>Dois anos depois, a pasta <code>services/</code> tem sessenta arquivos e as regras de check-in estão espalhadas por cinco deles. O time não joga nada fora: reorganiza as pastas por funcionalidade (<code>alunos/</code>, <code>cobrancas/</code>, <code>checkin/</code>), cada uma com suas camadas dentro. É o primeiro passo rumo a um monólito modular (capítulo 12).</p>",
)}

${dica(
  "Layer não é tier",
  "<p>Camada <b>lógica</b> (layer) é organização de código; camada <b>física</b> (tier) é outro processo ou máquina, com a rede no meio. As três camadas deste capítulo costumam rodar num único processo Node. Tiers são o assunto do capítulo 18.</p>",
)}

${dica(
  "Camadas, hexagonal e Clean: para onde aponta a seta",
  "<p>Nas camadas clássicas, a dependência desce até o banco: o service importa a classe do repository. Na hexagonal (capítulo 6) e na Clean (capítulo 7), o negócio define uma interface e a persistência a implementa, então a seta aponta para o negócio. Dá para migrar aos poucos, um service por vez.</p>",
)}

${alerta(
  "Não confunda com MVC",
  "<p>O MVC (capítulo 5) organiza a camada de <b>apresentação</b> por dentro. O \"Model\" do MVC não é a mesma coisa que a camada de persistência: um sistema pode ter MVC na apresentação e, embaixo dela, um service e um repository.</p>",
)}

${combina([
  [5, "MVC, MVP e MVVM", "organizam a camada de apresentação por dentro"],
  [6, "Hexagonal", "o próximo passo: inverter a dependência do banco"],
  [7, "Clean Architecture e Onion", "camadas com a dependência invertida"],
  [8, "Vertical Slice", "quando as camadas viram burocracia"],
  [12, "Monólito modular", "camadas dentro de cada módulo"],
  [18, "Cliente-servidor e N camadas físicas", "em que máquina cada parte roda"],
])}

${lembre([
  "Cada camada tem um trabalho (mostrar, decidir, guardar) e só chama a de baixo, nunca a de cima.",
  "Camadas fechadas isolam mudanças; abra uma camada de propósito quando ela só repassa (sumidouro).",
  "É uma ótima escolha para CRUDs e times começando; quando o sistema cresce, organize por funcionalidade e, se a regra ficar rica, inverta as dependências (capítulos 6 e 7).",
])}
`;
