// Capítulo 8: Vertical Slice. Mesma estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, check, claro, cor, linha, navegador, quadro, semear, seta, txt, xis } from "../desenho.mjs";

/** Diagrama principal: a mesma mudança organizada por camada e por fatia. */
function camadasXFatias() {
  semear("vertical-slice-1");
  let s = "";
  s += txt(190, 22, "por camada", { tam: 20, cor: cor.azul });
  s += txt(190, 48, "pastas pelo tipo de código", { tam: 15, cor: cor.cinza });
  s += txt(565, 22, "por fatia", { tam: 20, cor: cor.verde });
  s += txt(565, 48, "pastas pelo que o usuário faz", { tam: 15, cor: cor.cinza });
  s += linha([[383, 70], [383, 396]], { cor: cor.cinza, espessura: 1.2, tracejado: true });

  // lado esquerdo: faixas horizontais (camadas), cada uma com código de todas as features
  const faixas = [
    [72, "controllers"],
    [152, "services"],
    [232, "repositories"],
  ];
  for (const [y, nome] of faixas) {
    s += bloco(14, y, 352, 62, "", { preench: claro.azul });
    s += txt(26, y + 31, nome, { tam: 16, ancora: "start" });
    ["Pedido", "Cliente", "Cupom"].forEach((n, i) => {
      const muda = n === "Pedido";
      s += bloco(150 + i * 72, y + 14, 64, 34, n, {
        preench: muda ? claro.amarelo : "#ffffff",
        hachura: "solid",
        tam: 15,
        cor: muda ? cor.laranja : undefined,
        espessura: muda ? 2.6 : 1.6,
      });
    });
  }

  // lado direito: colunas verticais (fatias), cada uma com um pouco de cada camada
  const fatias = [
    ["criar\npedido", false],
    ["listar\npedidos", true],
    ["cancelar\npedido", false],
    ["pagar\npedido", false],
  ];
  fatias.forEach(([nome, muda], i) => {
    const x = 400 + i * 86;
    s += bloco(x, 72, 72, 222, "", {
      preench: muda ? claro.amarelo : claro.verde,
      hachura: muda ? "solid" : undefined,
      cor: muda ? cor.laranja : undefined,
      espessura: muda ? 2.6 : 2,
    });
    s += linha([[x + 8, 143], [x + 64, 143]], { espessura: 1, cor: cor.cinza });
    s += linha([[x + 8, 223], [x + 64, 223]], { espessura: 1, cor: cor.cinza });
    const c = muda ? cor.tinta : "#495057";
    s += txt(x + 36, 107, "rota", { tam: 15, cor: c, halo: 5 });
    s += txt(x + 36, 183, "regra", { tam: 15, cor: c, halo: 5 });
    s += txt(x + 36, 259, "dados", { tam: 15, cor: c, halo: 5 });
    s += txt(x + 36, 322, nome, { tam: 15 });
  });

  s += txt(190, 364, "mudar a listagem de pedidos", { tam: 15 });
  s += txt(190, 390, "= mexer em 3 pastas", { tam: 17, cor: cor.vermelho });
  s += txt(565, 364, "mudar a listagem de pedidos", { tam: 15 });
  s += txt(565, 390, "= mexer em 1 pasta", { tam: 17, cor: cor.verde });
  return quadro(760, 408, s);
}

/** Por dentro: a requisição chega, o mediator acha o handler e cada fatia resolve do seu jeito. */
function fluxoDasFatias() {
  semear("vertical-slice-2");
  let s = "";
  s += navegador(310, 8, 140, 66, "app / site");

  // requisições
  s += seta(330, 76, 200, 124, { cor: cor.azul, espessura: 2 });
  s += txt(248, 86, "POST /pedidos", { tam: 15, cor: cor.azul, ancora: "end" });
  s += seta(430, 76, 560, 124, { cor: cor.azul, espessura: 2 });
  s += txt(512, 86, "GET /clientes/:id/pedidos", { tam: 15, cor: cor.azul, ancora: "start" });

  // mediator (opcional)
  s += bloco(20, 126, 720, 44, "mediator: entrega cada mensagem ao seu handler (opcional)", {
    preench: claro.cinza,
    tam: 16,
    tracejado: true,
  });
  s += seta(180, 172, 180, 208, { espessura: 2 });
  s += seta(580, 172, 580, 208, { espessura: 2 });

  // as duas fatias
  const fatia = (x, titulo, sub, preench, chips) => {
    let r = bloco(x, 210, 320, 126, "", { preench });
    r += txt(x + 160, 232, titulo, { tam: 17, halo: 5 });
    r += txt(x + 160, 255, sub, { tam: 15, cor: "#495057", halo: 5 });
    let cx = x + 11;
    chips.forEach(([rot, w], i) => {
      r += bloco(cx, 274, w, 48, rot, { preench: "#ffffff", hachura: "solid", tam: 15, espessura: 1.6 });
      if (i < chips.length - 1) r += seta(cx + w + 2, 298, cx + w + 24, 298, { espessura: 1.6, ponta: 9 });
      cx += w + 26;
    });
    return r;
  };
  s += fatia(20, "fatia: criar pedido", "comando (muda o estado)", claro.verde, [
    ["validar", 82],
    ["regra", 82],
    ["gravar", 82],
  ]);
  s += fatia(420, "fatia: listar pedidos", "consulta (só lê)", claro.azul, [
    ["validar", 84],
    ["SQL pronto\npara a tela", 188],
  ]);

  // fatias não se chamam
  s += xis(380, 258, 20);
  s += txt(380, 296, "não se\nchamam", { tam: 15, cor: cor.vermelho });

  // o mesmo banco para as duas
  s += banco(330, 362, 100, 80, "Postgres", { preench: claro.violeta, tam: 15 });
  s += seta(265, 324, 328, 390, { cor: cor.violeta, espessura: 2 });
  s += seta(560, 324, 432, 390, { cor: cor.violeta, espessura: 2 });
  s += txt(200, 404, "escrita: regra + insert", { tam: 15, cor: cor.violeta });
  s += txt(570, 404, "leitura: um select só", { tam: 15, cor: cor.violeta });
  return quadro(760, 448, s);
}

/** Erro comum: a mesma regra copiada em várias fatias, e a correção. */
function regraEspalhada() {
  semear("vertical-slice-3");
  let s = "";
  s += txt(185, 22, "regra copiada em cada fatia", { tam: 18, cor: cor.vermelho });
  s += txt(575, 22, "regra provada vai para o domínio", { tam: 18, cor: cor.verde });
  s += linha([[380, 44], [380, 320]], { cor: cor.cinza, espessura: 1.2, tracejado: true });

  // esquerda: cada fatia com sua cópia; uma ficou diferente
  const nomes = ["carrinho", "checkout", "recompra"];
  const taxas = ["R$ 7", "R$ 9", "R$ 7"];
  nomes.forEach((n, i) => {
    const x = 30 + i * 110;
    s += bloco(x, 50, 92, 170, "", { preench: claro.verde });
    s += txt(x + 46, 74, n, { tam: 15 });
    const diferente = i === 1;
    s += bloco(x + 10, 118, 72, 70, `taxa\n${taxas[i]}`, {
      preench: diferente ? claro.vermelho : "#ffffff",
      hachura: "solid",
      tam: 15,
      cor: diferente ? cor.vermelho : undefined,
    });
  });
  s += xis(185, 246, 18);
  s += txt(185, 280, "a regra mudou e só uma", { tam: 15, cor: cor.vermelho });
  s += txt(185, 302, "cópia foi atualizada", { tam: 15, cor: cor.vermelho });

  // direita: as fatias usam a mesma regra do domínio
  nomes.forEach((n, i) => {
    const x = 420 + i * 110;
    s += bloco(x, 50, 92, 120, "", { preench: claro.verde });
    s += txt(x + 46, 74, n, { tam: 15 });
    s += txt(x + 46, 124, "usa", { tam: 15, cor: "#495057", halo: 5 });
    s += seta(x + 46, 172, 575 + (i - 1) * 60, 212, { espessura: 1.8 });
  });
  s += bloco(420, 214, 312, 50, "domínio: calcularTaxaDeEntrega()", { preench: claro.amarelo, tam: 16 });
  s += check(500, 296, 18);
  s += txt(590, 296, "uma regra, um lugar", { tam: 15, cor: cor.verde });
  return quadro(760, 324, s);
}

export default `
${resumo(
  "Em vez de separar o código pelo <b>tipo</b> (controllers, services, repositories), você separa pelo que o sistema <b>faz</b>: cada <b>fatia</b> é um caso de uso completo, da requisição ao banco, numa pasta só.",
  "Pense num bolo de três andares (massa, recheio, cobertura). Organizar por camadas é guardar cada andar numa travessa separada. A fatia vertical é cortar de cima a baixo: cada pedaço tem um pouco de tudo e pode ser servido sozinho.",
)}

<p>A <b>Vertical Slice Architecture</b> (arquitetura de fatias verticais) foi popularizada por Jimmy Bogard, criador da
biblioteca MediatR do mundo .NET, por volta de 2018. Ele a apresentou como alternativa às camadas (capítulo 4) e aos anéis
da Clean e da Onion (capítulo 7). O incômodo de partida é conhecido: para mudar uma tela, você abre o controller, o
service, o repository, o DTO e o mapper. A mudança é de <b>uma</b> funcionalidade, mas o código dela está espalhado por
várias pastas, misturado com o de todas as outras.</p>

${fig(camadasXFatias(), "À esquerda, cada pasta guarda um tipo de código de todas as features. À direita, cada pasta guarda uma feature inteira. A mesma mudança toca três pastas ou uma.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Fatia</b>: um caso de uso, uma requisição. "Criar pedido", "listar pedidos do cliente", "cancelar pedido". Tudo
o que ela precisa fica junto: o formato da entrada, a validação, a regra, o acesso ao banco e a resposta.</li>
<li><b>Handler</b>: o coração da fatia. Recebe uma mensagem (por exemplo, <code>CriarPedido</code>) e devolve uma resposta.
No estilo <i>mediator</i> (mediador), a rota não chama o handler direto: ela entrega a mensagem a um mediador, que acha o
handler certo. É opcional; uma função por rota já é uma fatia.</li>
<li><b>Comando ou consulta</b>: toda fatia é uma das duas. Comandos mudam o estado (criar, cancelar, pagar); consultas só
leem (listar, detalhar). É o CQRS (capítulo 21) em versão leve: mesmo banco, mas código de escrita e de leitura separados.</li>
<li><b>Cada fatia escolhe sua técnica</b>: a de escrita pode usar entidades e ORM; a de leitura pode fazer um SQL direto
que já devolve o formato da tela. Não existe camada obrigatória que todo mundo precisa atravessar. O caminho comum é a
fatia nascer como um <i>transaction script</i> (os passos em sequência numa função só) e ganhar entidades e objetos de
domínio quando a regra cresce.</li>
<li><b>Pouco acoplamento entre fatias, muito dentro delas</b>: o código de uma fatia pode ser bem amarrado entre si, mas
uma fatia não importa outra.</li>
<li><b>Duplicação aceitável</b>: se duas fatias têm código parecido, tudo bem. Só extraia para um lugar comum quando a
regra for <b>provadamente</b> a mesma (aparece em três lugares e muda junto). Antes disso, a abstração é um palpite.</li>
<li><b>O que pode ser compartilhado</b>: infraestrutura (conexão com o banco, autenticação, log), comportamentos
transversais num <i>pipeline</i> (middleware) que roda em volta de todos os handlers (validação, transação) e o
<b>domínio provado</b>: regras que valem para o negócio inteiro, como <code>pedido.podeCancelar()</code> ou um tipo
<code>Dinheiro</code>, numa pasta própria de domínio (e não num "utils").</li>
</ul>

${fig(fluxoDasFatias(), "Duas requisições, duas fatias. Cada uma resolve do seu jeito e as duas usam o mesmo banco, mas nenhuma chama a outra.")}

${quando(
  [
    "Backend com dezenas de funcionalidades que mudam uma de cada vez.",
    "Vários devs entregando features em paralelo: cada PR mexe numa pasta.",
    "Leitura e escrita com necessidades bem diferentes.",
    "Você quer apagar uma feature apagando uma pasta.",
  ],
  [
    "Regras ricas e muito compartilhadas (preço, impostos, crédito) sem um lugar definido para elas.",
    "Time sem revisão nem padrões combinados: cada fatia vira um estilo.",
    "App bem pequeno: qualquer organização serve.",
    "Código que não nasce de requisições (biblioteca, motor de cálculo).",
  ],
)}

${medidor({ complexidade: 2, escala: 4, operacao: 1, aprendizado: 2, time: "qualquer tamanho; brilha com vários devs em paralelo" })}

<h3>Como usar na prática</h3>
${pastas(`
src/
├── features/
│   └── pedidos/
│       ├── criar-pedido/
│       │   ├── criar-pedido.ts        # entrada, validação, handler e rota
│       │   └── criar-pedido.test.ts   # teste da fatia inteira
│       ├── listar-pedidos/
│       │   └── listar-pedidos.ts      # consulta: SQL direto, sem entidade
│       └── cancelar-pedido/
│           └── cancelar-pedido.ts
├── dominio/                           # só regra provada: Pedido, Dinheiro
├── compartilhado/                     # db, auth, log, erros
└── main.ts                            # registra a rota de cada fatia
`)}

${codigo(
  `
import { Router } from "express";
import { z } from "zod";
import { db } from "../../../compartilhado/db";
import { ErroDeNegocio } from "../../../compartilhado/erros";

// 1. entrada: o formato que só esta fatia aceita
const Item = z.object({ produtoId: z.string().uuid(), quantidade: z.number().int().min(1) });
const Entrada = z.object({ clienteId: z.string().uuid(), itens: z.array(Item).min(1) });

// 2. handler: regra e acesso a dados, juntos
export async function criarPedido({ clienteId, itens }: z.infer<typeof Entrada>) {
  const ids = [...new Set(itens.map((i) => i.produtoId))];
  const { rows } = await db.query<{ id: string; preco_centavos: number }>(
    "select id, preco_centavos from produtos where id = any($1) and ativo", [ids]);
  if (rows.length !== ids.length) throw new ErroDeNegocio("Produto indisponível");
  const preco = new Map(rows.map((p) => [p.id, p.preco_centavos]));
  const total = itens.reduce((soma, i) => soma + preco.get(i.produtoId)! * i.quantidade, 0);
  const { rows: [pedido] } = await db.query(
    "insert into pedidos (cliente_id, total_centavos) values ($1, $2) returning id",
    [clienteId, total]); // na versão real: transação + insert em pedido_itens (omitido)
  return { id: pedido.id, totalCentavos: total };
}

// 3. rota: só traduz HTTP (no Express 5, o ZodError vai ao middleware de erro, que responde 400)
export const rota = Router().post("/pedidos", async (req, res) => {
  res.status(201).json(await criarPedido(Entrada.parse(req.body)));
});`,
  "features/pedidos/criar-pedido/criar-pedido.ts",
)}

${codigo(
  `
// consulta: sem entidade nem repositório; o SQL já devolve o formato da tela
import { Router } from "express";
import { z } from "zod";
import { db } from "../../../compartilhado/db";

const Entrada = z.object({
  clienteId: z.string().uuid(),
  pagina: z.coerce.number().int().min(1).default(1),
});

export async function listarPedidos({ clienteId, pagina }: z.infer<typeof Entrada>) {
  const { rows } = await db.query(
    \`select p.id, p.status, p.total_centavos as "totalCentavos", count(i.pedido_id)::int as itens
       from pedidos p left join pedido_itens i on i.pedido_id = p.id
      where p.cliente_id = $1 group by p.id
      order by p.criado_em desc limit 20 offset $2\`, [clienteId, (pagina - 1) * 20]);
  return rows;
}

export const rota = Router().get("/clientes/:clienteId/pedidos", async (req, res) => {
  res.json(await listarPedidos(Entrada.parse({ ...req.query, ...req.params })));
});`,
  "features/pedidos/listar-pedidos/listar-pedidos.ts",
)}

<p>Repare: cada fatia define a própria <code>Entrada</code>, e ninguém tentou criar um DTO comum. A de escrita confere
os produtos e calcula o total; a de leitura nem passa por entidade. No <code>main.ts</code>, juntar tudo é só registrar a
<code>rota</code> de cada fatia. E o teste chama a rota da fatia com um banco de teste por trás: um só teste de
integração cobre a fatia inteira, da validação ao SQL.</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Comece por uma funcionalidade nova (ou uma que muda muito) e crie a pasta dela em <code>features/</code>. Não precisa migrar tudo de uma vez: as fatias convivem com o código em camadas.",
  "Dê à pasta o nome do caso de uso, com verbo: <code>criar-pedido</code>, <code>cancelar-pedido</code>. Dentro dela, coloque entrada, validação, handler, acesso a dados, rota e teste.",
  "Separe comandos de consultas. Consultas podem ir direto ao banco e devolver o formato da tela.",
  "Deixe a duplicação acontecer. Quando a mesma regra aparecer em três fatias e mudar junto, extraia para <code>dominio/</code> (de preferência no próprio objeto, como <code>pedido.podeCancelar()</code>).",
  "Coloque o que é transversal (autenticação, log, transação, tratamento de erros) num middleware ou pipeline único.",
  "Proíba uma fatia de importar outra com uma checagem automática (dependency-cruiser ou eslint-plugin-boundaries). Se uma precisa da outra, extraia o comum ou publique um evento.",
])}

${dica(
  "Preciso de um mediator?",
  "<p>Não. No .NET, o MediatR popularizou o estilo (cada mensagem com seu handler e <i>behaviors</i> que rodam em volta de todos). Em TypeScript, uma função por fatia mais os middlewares do framework resolvem quase sempre. O mediator compensa quando o mesmo caso de uso é disparado por HTTP, fila e linha de comando e você quer um pipeline único para todos.</p>",
)}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Uma mudança mexe numa pasta só: PRs menores e menos conflito de merge", "Código parecido repetido entre fatias (de propósito, mas exige vigilância)"],
    ["Cada fatia usa a técnica que precisa (SQL direto na leitura, entidade na escrita)", "Estilos diferentes entre fatias se o time não combinar padrões"],
    ["Fácil de achar e de apagar: o nome da pasta é o nome da funcionalidade", "Regra de negócio se espalha se não houver um lugar para o domínio"],
    ["Testes que cobrem a fatia de ponta a ponta", "Testes de integração, mais lentos que os de núcleo puro (capítulo 6)"],
  ],
)}

<h3>Erros comuns</h3>
<p>A fatia vertical funciona muito bem enquanto cada caso de uso tem regras próprias. Ela vira bagunça quando uma regra
de negócio importante é copiada em várias fatias e cada cópia evolui de um jeito.</p>

${fig(regraEspalhada(), "A taxa de entrega copiada em três fatias: quando muda, alguma cópia fica para trás. A saída é dar à regra um lugar só, no domínio.")}

<ul>
<li><b>Regra de domínio espalhada</b>: "este pedido pode ser cancelado?" verificado em quatro handlers, cada um de um jeito.
Regra que vale para o negócio inteiro mora no domínio, perto dos dados.</li>
<li><b>Pasta compartilhada que vira lixão</b>: tudo que se repete duas vezes vai para <code>compartilhado/</code>, e você
volta a ter uma camada de serviços gigante, agora sem nome. Extraia só o que já se provou comum.</li>
<li><b>Fatia chamando fatia</b>: o handler de "fechar pedido" chama o de "reservar estoque", direto ou por um
<code>mediator.send()</code>. É acoplamento escondido: mudar um quebra o outro. Extraia a regra comum ou publique um evento (capítulo 20).</li>
<li><b>Fatia gorda</b>: um <code>PedidosHandler</code> com doze métodos é um service de camadas com outro nome. Uma fatia,
um caso de uso.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine o backend de um app de delivery com uns 80 endpoints, organizado em camadas. Toda funcionalidade nova mexia em controller, service, repository, DTO e mapper, e o <code>PedidoService</code> era usado por quase todas as telas. Dois times viviam resolvendo conflito de merge nesse arquivo.</p><p>O time passou a criar as features novas como fatias e a mover as antigas aos poucos, sempre que alguém precisava mexer nelas. Os PRs encolheram, e a listagem de pedidos ganhou um SQL próprio, mais rápido do que carregar entidades inteiras para usar três campos.</p><p>O tropeço veio meses depois: a taxa de entrega tinha sido copiada nas fatias de carrinho, checkout e recompra. A regra mudou, só a cópia do checkout foi atualizada, e o app mostrou um preço no carrinho e cobrou outro no checkout. A correção foi a da figura de erros comuns: <code>calcularTaxaDeEntrega()</code> foi para o domínio e as três fatias passaram a usá-la.</p>",
)}

${dica(
  "Fatias, Clean ou hexagonal?",
  "<p>Não precisa escolher um lado. As fatias se combinam bem com os anéis da Clean e da Onion (capítulo 7): fatias por fora e um domínio rico no centro, que várias fatias usam. Numa fatia que fala com um serviço externo instável (pagamento, por exemplo), nada impede usar uma porta e um adaptador, como na hexagonal (capítulo 6). A diferença é que a interface aparece onde ajuda, e não em toda fatia por obrigação.</p>",
)}

${alerta(
  "O que fatia não é",
  "<p>Uma pasta <code>pedidos/</code> com <code>pedidos.controller.ts</code>, <code>pedidos.service.ts</code> e <code>pedidos.repository.ts</code> (o padrão de muitos projetos NestJS, por exemplo) agrupa por <b>entidade</b>, mas continua em camadas por dentro: o service atende todos os casos de uso de pedido. Na fatia, a divisão é por <b>caso de uso</b>. Fatia também não é microsserviço: as fatias rodam todas no mesmo processo e, em geral, usam o mesmo banco. E não confunda com a <i>fatia vertical</i> do planejamento ágil (quebrar o trabalho em entregas que vão da tela ao banco): a ideia é parecida, mas lá se fala de planejar entregas; aqui, de organizar o código.</p>",
)}

${combina([
  [21, "CQRS", "cada fatia é um comando ou uma consulta"],
  [12, "Monólito modular", "módulos por fora, fatias por dentro"],
  [7, "Clean Architecture e Onion", "domínio rico no centro, fatias em volta"],
  [20, "Orientada a eventos", "fatias conversam por eventos, não por chamada"],
  [14, "Microsserviços", "cada serviço organizado em fatias"],
  [4, "Camadas", "a organização que as fatias substituem"],
])}

${lembre([
  "Organize por funcionalidade: cada fatia é um caso de uso completo, da requisição ao banco.",
  "Pouco acoplamento entre fatias, muito dentro delas; duplicação é aceitável até a regra se provar comum.",
  "Regra de negócio importante tem casa própria no domínio; sem isso, as fatias viram bagunça.",
])}
`;
