// Capítulo 11: Monólito. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, curva, etiqueta, linha, navegador, nuvem, passo, quadro, semear, servidor, seta, txt, check, xis } from "../desenho.mjs";

function visaoGeral() {
  semear("monolito-1");
  let s = "";
  // quem usa o sistema
  s += navegador(15, 70, 120, 80, "site");
  s += navegador(15, 200, 120, 80, "app");
  s += seta(138, 110, 186, 140, { cor: cor.azul, espessura: 2 });
  s += seta(138, 240, 186, 210, { cor: cor.azul, espessura: 2 });
  s += txt(162, 175, "HTTP", { tam: 15, cor: cor.azul });
  // a aplicação: um processo com todos os módulos
  s += bloco(190, 30, 380, 300, "", { preench: claro.amarelo, gap: 8 });
  s += txt(380, 54, "aplicação: um processo só", { tam: 17, halo: 5 });
  const mod = (x, y, w, h, nome) => bloco(x, y, w, h, nome, { preench: "#ffffff", hachura: "solid", tam: 16 });
  s += mod(210, 75, 150, 52, "catálogo");
  s += mod(410, 75, 145, 52, "pedidos");
  s += mod(210, 160, 150, 52, "usuários");
  s += mod(410, 160, 145, 52, "pagamentos");
  s += mod(300, 240, 165, 48, "notificações");
  s += seta(408, 101, 363, 101, { cor: cor.verde, espessura: 2 });
  s += seta(482, 129, 482, 157, { cor: cor.verde, espessura: 2 });
  s += seta(452, 214, 422, 237, { cor: cor.verde, espessura: 2 });
  s += txt(380, 312, "módulos se chamam por função, sem rede", { tam: 15, cor: cor.verde, halo: 5 });
  // um banco
  s += seta(573, 180, 622, 180, { duplo: true, espessura: 2 });
  s += txt(597, 164, "SQL", { tam: 15 });
  s += banco(625, 125, 110, 110, "banco", { preench: claro.violeta });
  s += txt(680, 260, "um banco,\nvárias tabelas", { tam: 15, cor: cor.cinza });
  // como vai para o ar
  const y = 385;
  s += etiqueta(95, y, "um repositório", { tam: 15, preench: claro.cinza });
  s += etiqueta(280, y, "um build", { tam: 15, preench: claro.cinza });
  s += etiqueta(470, y, "um artefato", { tam: 15, preench: claro.cinza });
  s += etiqueta(660, y, "um deploy", { tam: 15, preench: claro.verde });
  s += seta(166, y, 234, y, { espessura: 1.8 });
  s += seta(326, y, 410, y, { espessura: 1.8 });
  s += seta(529, y, 609, y, { espessura: 1.8 });
  return quadro(760, 410, s);
}

function escala() {
  semear("monolito-2");
  let s = "";
  // 1. vertical
  s += passo(30, 24, "1");
  s += txt(112, 25, "máquina maior", { tam: 16, cor: cor.azul });
  s += servidor(28, 100, 46, 62, "antes");
  s += seta(82, 131, 112, 131, { cor: cor.azul, espessura: 2 });
  s += servidor(120, 72, 78, 118, "depois", { luz: cor.azul });
  s += txt(110, 252, "mais CPU e memória\nna mesma máquina", { tam: 15, cor: cor.cinza });
  s += txt(110, 322, "fácil, mas tem teto\ne continua sendo um\nponto único de falha", { tam: 15, cor: cor.vermelho });
  s += linha([[218, 14], [218, 405]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  // 2. réplicas atrás do balanceador
  s += nuvem(425, 16, 130, 58, "usuários");
  s += seta(490, 80, 490, 103, { espessura: 2 });
  s += bloco(400, 105, 180, 42, "balanceador", { preench: claro.cinza, tam: 16 });
  const apps = [265, 425, 585];
  apps.forEach((x, i) => {
    s += bloco(x, 185, 130, 50, `app (cópia ${i + 1})`, { preench: claro.amarelo, tam: 15 });
    s += seta(490, 149, x + 65, 183, { espessura: 1.8 });
  });
  s += passo(243, 210, "2");
  // 3. cache
  s += bloco(265, 295, 130, 48, "cache (Redis)", { preench: claro.vermelho, tam: 15 });
  s += seta(330, 237, 330, 293, { espessura: 1.8, rotulo: "lê antes", dx: -6, ancora: "end", dy: 0, tam: 15 });
  s += passo(243, 319, "3");
  // 4. banco principal + réplica de leitura
  s += banco(440, 280, 100, 84, "principal", { preench: claro.violeta, tam: 15 });
  s += seta(490, 237, 490, 278, { espessura: 1.8, rotulo: "escreve", dx: 8, ancora: "start", dy: 0, tam: 15 });
  s += banco(605, 280, 90, 84, "réplica", { preench: claro.ciano, tam: 15 });
  s += seta(650, 237, 650, 278, { espessura: 1.8, rotulo: "lê", dx: 8, ancora: "start", dy: 0, tam: 15 });
  s += seta(542, 326, 603, 326, { tracejado: true, cor: cor.violeta, espessura: 1.6 });
  s += txt(572, 310, "copia", { tam: 15, cor: cor.violeta });
  s += passo(722, 304, "4");
  s += txt(650, 380, "só leitura", { tam: 15, cor: cor.cinza });
  s += txt(470, 404, "a app não guarda estado: sessão e arquivos ficam fora dela", { tam: 15, cor: cor.vermelho });
  return quadro(760, 420, s);
}

function saudavelOuLama() {
  semear("monolito-3");
  let s = "";
  const mod = (x, y, nome) => bloco(x, y, 120, 48, nome, { preench: "#ffffff", hachura: "solid", tam: 16 });
  // saudável
  s += txt(190, 26, "monólito saudável", { tam: 17, cor: cor.verde });
  s += mod(40, 60, "catálogo");
  s += mod(220, 60, "pedidos");
  s += mod(40, 150, "usuários");
  s += mod(220, 150, "pagamentos");
  s += seta(218, 84, 162, 84, { cor: cor.verde, espessura: 2 });
  s += seta(280, 110, 280, 148, { cor: cor.verde, espessura: 2 });
  s += seta(218, 174, 162, 174, { cor: cor.verde, espessura: 2 });
  s += check(48, 282);
  s += txt(200, 282, "poucas dependências,\nsempre na mesma direção", { tam: 15 });
  s += linha([[380, 16], [380, 320]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  // bola de lama
  s += txt(570, 26, "bola de lama", { tam: 17, cor: cor.vermelho });
  s += mod(415, 60, "catálogo");
  s += mod(605, 60, "pedidos");
  s += mod(415, 150, "usuários");
  s += mod(605, 150, "pagamentos");
  s += bloco(532, 230, 80, 36, "utils", { preench: claro.cinza, tam: 15 });
  const v = { cor: cor.vermelho, espessura: 1.6 };
  s += seta(535, 108, 605, 150, v);
  s += seta(535, 150, 605, 108, v);
  s += seta(605, 74, 537, 74, v);
  s += seta(535, 94, 603, 94, v);
  s += seta(535, 174, 603, 174, { ...v, duplo: true });
  s += seta(470, 108, 470, 148, v);
  s += seta(470, 198, 545, 228, v);
  s += seta(660, 198, 600, 228, v);
  s += curva([[612, 250], [736, 222], [740, 130], [727, 96]], v);
  s += curva([[415, 84], [396, 160], [410, 240], [530, 250]], v);
  s += xis(430, 300);
  s += txt(585, 300, "tudo depende de tudo:\nmudar um quebra outro", { tam: 15 });
  return quadro(760, 330, s);
}

export default `
${resumo(
  "O sistema inteiro é construído, testado e implantado como <b>uma peça só</b>: um código, um artefato, um deploy. Todas as funcionalidades rodam no mesmo processo e conversam por chamadas de função.",
  "Um restaurante com uma cozinha só. Os cozinheiros dividem o espaço e passam o prato de mão em mão, sem motoboy entre eles. Funciona muito bem, até a cozinha ficar lotada de gente esbarrando uma na outra.",
)}

<p>Durante muito tempo, o monólito foi o jeito padrão de construir sistemas, e pouca gente se preocupava em dar nome a isso. A palavra ganhou fama (e um
tom meio pejorativo) quando os microsserviços ficaram populares, depois do artigo de James Lewis e Martin Fowler em 2014. Mas
monólito descreve <b>como o sistema vai para o ar</b> (uma peça só), não a qualidade do código. O que dá problema é a bagunça,
que Brian Foote e Joseph Yoder batizaram em 1997 de <b>Big Ball of Mud</b> (grande bola de lama).</p>

${fig(visaoGeral(), "Um processo, módulos que se chamam por função, um banco e um caminho só até a produção.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Um código, um build, um artefato</b>: um repositório gera uma única peça implantável (um <code>.jar</code>, uma
imagem Docker, uma pasta <code>dist/</code>).</li>
<li><b>Um processo</b> (ou cópias idênticas dele): catálogo, pedidos e pagamentos rodam juntos, na mesma memória.</li>
<li><b>Módulos conversam por chamada de função</b>: <code>pagamentos.cobrar(pedido)</code> é uma linha de código, não uma
requisição HTTP.</li>
<li><b>Um banco, geralmente</b>: o mesmo banco relacional para todos, com transações que envolvem várias tabelas.</li>
<li><b>Um artefato, vários papéis</b>: o mesmo build sobe como servidor web e como <i>worker</i> (consumidor de fila).
Continua sendo um monólito: o que o define é a <b>unidade de deploy</b>, não o número de máquinas.</li>
</ul>

<h4>O que você ganha (e não é pouco)</h4>
<ul>
<li><b>Simplicidade</b>: um projeto para clonar, rodar e entender.</li>
<li><b>Transações locais</b>: pedido e baixa de estoque numa única transação do banco; ou tudo acontece, ou nada. Com os
dados espalhados em serviços, isso vira uma saga (capítulo 23).</li>
<li><b>Depuração e deploy simples</b>: um <i>stack trace</i> (a pilha de chamadas do erro) mostra o caminho inteiro; há uma só
versão em produção, e voltar atrás é subir a anterior.</li>
<li><b>Desempenho sem rede</b>: uma chamada de função custa nanossegundos. Uma chamada HTTP a outro serviço, mesmo no
mesmo data center, custa de frações de milissegundo a alguns milissegundos (rede e serialização), e pode falhar no meio.</li>
</ul>

<h4>Como um monólito escala</h4>
<p>"Monólito não escala" é mito. Ele escala de quatro jeitos, que se somam:</p>
<ol>
<li><b>Vertical</b>: mais CPU e memória na mesma máquina. Não muda código, mas tem teto e é um ponto único de falha.</li>
<li><b>Réplicas atrás de um balanceador</b>: cópias idênticas da app, com um balanceador de carga dividindo as requisições.
Pede app <b>sem estado</b> (<i>stateless</i>): sessão no Redis ou num token, arquivos num serviço de armazenamento como o S3. De brinde,
deploy sem parar, trocando uma cópia por vez.</li>
<li><b>Cache</b>: respostas caras (a página de um produto) guardadas em memória, num Redis por exemplo.</li>
<li><b>Réplicas de leitura</b>: o banco principal recebe as escritas e copia os dados para réplicas que atendem as leituras.
A cópia atrasa um pouco: logo depois de gravar, leia do principal.</li>
</ol>

${fig(escala(), "Os quatro jeitos de escalar um monólito. Para não poluir, cada seta sai de uma cópia só; na prática, todas usam o cache, o principal e a réplica.")}

<p>O limite costuma ser o banco principal, que recebe todas as escritas. Passar daí exige dividir os dados entre vários
bancos (<i>sharding</i>), o que é caro em qualquer arquitetura. Muitos sistemas grandes nunca chegam lá.</p>

<h4>Quando começa a doer</h4>
<ul>
<li><b>Acoplamento</b>: sem fronteiras, cada módulo mexe nas entranhas do outro. Mudar o frete quebra o relatório financeiro.</li>
<li><b>Deploy de tudo junto</b>: uma correção de uma linha no checkout espera (e arrisca) o sistema inteiro. Um vazamento de
memória no relatório derruba as vendas.</li>
<li><b>Times pisando uns nos outros</b>: conflitos de merge, fila para fazer deploy, build e testes cada vez mais lentos.</li>
<li><b>Escala em bloco</b>: se só a busca precisa de muita memória, você paga essa memória em todas as cópias.</li>
<li><b>Tecnologia única</b>: uma linguagem e uma versão de framework para tudo. Atualizar o Rails ou o Node vira um
projeto do sistema inteiro.</li>
<li><b>Bola de lama</b>: o fim da linha, quando as fronteiras somem de vez.</li>
</ul>

${fig(saudavelOuLama(), "Os dois têm um deploy só. Boa parte da dor vem da falta de fronteiras, não do processo único: por isso o remédio costuma ser o monólito modular (capítulo 12), e não microsserviços.")}

${quando(
  [
    "Produto novo ou MVP: o negócio e as fronteiras ainda vão mudar.",
    "Um time ou poucos times no mesmo produto.",
    "Regras que pedem consistência forte (pedido, estoque e pagamento juntos).",
    "Operação enxuta, sem time de plataforma para cuidar de dezenas de serviços.",
    "Tráfego que cabe em algumas máquinas, o caso da maioria dos sistemas.",
  ],
  [
    "Muitos times que precisam entregar de forma independente e já brigam pela fila de deploy.",
    "Uma parte com necessidade muito diferente (GPU, escala bem maior): extraia só ela.",
    "Uma parte que precisa ficar isolada por segurança ou regulação, como os dados de cartão.",
    "Uma parte que pede outra linguagem, como aprendizado de máquina (<i>machine learning</i>) em Python num sistema em Java.",
  ],
)}

${medidor({ complexidade: 1, escala: 3, operacao: 1, aprendizado: 1, time: "de 1 dev a alguns times; com muitos times, vá para o modular (cap. 12)" })}

<h3>Como usar na prática</h3>
<p>Um monólito saudável se organiza <b>por assunto do negócio</b>: um módulo por pasta, cada um com uma porta de entrada
pública. Veja o exemplo de uma loja em TypeScript, com Express e Prisma:</p>

${pastas(`
loja/
├── src/
│   ├── main.ts               # sobe o servidor HTTP
│   ├── worker.ts             # mesmo código, consome a fila
│   ├── modulos/              # catalogo/, usuarios/, notificacoes/...
│   │   ├── estoque/index.ts  # API pública do módulo
│   │   └── pedidos/          # index.ts, rotas.ts, fechar-pedido.ts
│   └── compartilhado/        # só infraestrutura: db.ts, config.ts
├── prisma/schema.prisma      # um banco, cada tabela com dono
└── Dockerfile                # gera o único artefato
`)}

${codigo(
  `
// src/main.ts: um processo, todos os módulos
import express from "express";
import { rotasCatalogo } from "./modulos/catalogo";
import { rotasPedidos } from "./modulos/pedidos";

const app = express();
app.use(express.json());
app.use("/catalogo", rotasCatalogo);
app.use("/pedidos", rotasPedidos);
app.get("/saude", (_req, res) => res.send("ok")); // o balanceador pergunta aqui
app.listen(Number(process.env.PORT ?? 3000));`,
  "src/main.ts",
)}

${codigo(
  `
// src/modulos/estoque/index.ts: a única porta de entrada do módulo
import type { Prisma } from "@prisma/client";
export type Reserva = { produtoId: string; qtd: number };

export async function reservarEstoque(tx: Prisma.TransactionClient, itens: Reserva[]) {
  for (const { produtoId, qtd } of itens) {
    const r = await tx.produto.updateMany({
      where: { id: produtoId, estoque: { gte: qtd } },
      data: { estoque: { decrement: qtd } },
    });
    if (r.count === 0) throw new Error("Sem estoque: " + produtoId);
  }
}`,
  "src/modulos/estoque/index.ts",
)}

${codigo(
  `
// src/modulos/pedidos/fechar-pedido.ts: dois módulos, uma transação
import { prisma } from "../../compartilhado/db";
import { reservarEstoque, type Reserva } from "../estoque";
import { enfileirarEmail } from "../notificacoes";

export async function fecharPedido(clienteId: string, itens: Reserva[]) {
  const pedido = await prisma.$transaction(async (tx) => {
    await reservarEstoque(tx, itens); // se lançar erro, nada é gravado
    return tx.pedido.create({ data: { clienteId, itens: { create: itens } } });
  });
  await enfileirarEmail("pedido-confirmado", pedido.id); // fora da transação
  return pedido;
}`,
  "src/modulos/pedidos/fechar-pedido.ts",
)}

<h4>Checklist para manter o monólito saudável</h4>
${passos([
  "<b>Pastas por assunto do negócio</b> (<code>pedidos</code>, <code>estoque</code>), não por tipo técnico. Dentro de cada módulo, camadas (capítulo 4) ou hexagonal (capítulo 6).",
  "<b>Uma porta de entrada por módulo</b> (<code>index.ts</code>). Uma ferramenta como dependency-cruiser ou eslint-plugin-boundaries barra no CI quem importa arquivos internos.",
  "<b>Cada tabela tem um dono</b>: só o módulo dono escreve nela; os outros pedem pela API dele.",
  "<b>App sem estado</b>: sessão e arquivos fora do servidor, tarefa agendada em uma cópia só, trabalho lento (e-mail, relatório) na fila.",
  "<b>Deploy pequeno e frequente</b>: testes automatizados, CI/CD e <i>feature flags</i> (chaves que ligam e desligam funcionalidades). Migrações de banco compatíveis com a versão anterior, porque no deploy sem parar as duas versões rodam juntas.",
  "<b>Meça e vigie os sinais</b>: tempo e memória por rota mostram quem pesa; build lento e fila de deploy dizem que é hora do modular (capítulo 12).",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Um repositório, um build, um deploy: fácil de entender e de operar", "Todo deploy leva tudo: uma mudança pequena espera (e arrisca) o sistema inteiro"],
    ["Transações locais: consistência forte sem sagas", "Escala em bloco: para dar memória a uma parte, você multiplica a app toda"],
    ["Depuração simples: um stack trace, um breakpoint, um log", "Um bug grave (como um vazamento de memória) derruba todas as funcionalidades"],
    ["Chamadas sem rede e infra barata: poucas máquinas, um banco", "Sem disciplina, as fronteiras somem e vira bola de lama"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Achar que monólito é sinônimo de bagunça</b> e quebrar em microsserviços para "arrumar". Sem fronteiras, nasce um
<b>monólito distribuído</b>: a mesma bagunça, agora com rede no meio.</li>
<li><b>Guardar estado no servidor</b>: sessão em memória, upload no disco local, tarefa agendada rodando em todas as cópias (e
mandando o mesmo e-mail três vezes). Quebra quando entra a segunda máquina.</li>
<li><b>Chamar serviço externo dentro da transação</b>: cobrar no gateway de pagamento ou mandar e-mail no meio dela segura <i>locks</i>
(travas) no banco e, se houver <i>rollback</i> (a transação é desfeita), o e-mail já foi. Chame depois do <i>commit</i>
(a confirmação da transação); se o aviso não pode se perder, use o
padrão <i>outbox</i> (capítulo 23).</li>
</ul>

${pratica(
  "No mundo real",
  "<p><b>Shopify</b>: o sistema principal é um grande monólito Rails. Em <i>Deconstructing the Monolith</i> (2019), o time contou que o reorganizou em componentes com fronteiras claras, em vez de partir para microsserviços.</p><p><b>Stack Overflow</b>: segundo os posts de Nick Craver (edição de 2016), o site é uma aplicação .NET monolítica em poucos servidores, com SQL Server e cache em Redis.</p><p><b>Basecamp</b>: em <i>The Majestic Monolith</i> (2016), David Heinemeier Hansson, criador do Rails, defendeu o monólito como a escolha certa para um time do tamanho do deles.</p>",
)}

${dica(
  "Monolith First",
  "<p>Em <i>Monolith First</i> (2015), Martin Fowler notou que quase todas as histórias de sucesso com microsserviços começaram com um monólito que cresceu demais e foi dividido, e que quase todos os casos que ele conhecia de sistemas criados como microsserviços desde o início acabaram em sérios problemas. No começo você ainda não sabe onde ficam as fronteiras certas, e errar a fronteira entre serviços custa muito mais do que entre pastas.</p>",
)}

${alerta(
  "Monólito, monólito modular ou monólito distribuído?",
  "<p><b>Monólito</b> (este capítulo): uma unidade de deploy, bem ou mal organizada por dentro. <b>Monólito modular</b> (capítulo 12): continua com um deploy só, mas com módulos de fronteiras checadas pela máquina. <b>Monólito distribuído</b> (capítulo 31): serviços separados que dividem o banco e só funcionam se forem para o ar juntos. Tem os custos dos dois mundos e as vantagens de nenhum.</p>",
)}

${combina([
  [4, "Camadas", "a organização interna mais comum"],
  [6, "Hexagonal", "núcleo isolado dentro do monólito"],
  [8, "Vertical Slice", "uma pasta por funcionalidade"],
  [12, "Monólito modular", "o próximo passo"],
  [18, "Cliente-servidor", "o servidor de aplicação"],
  [30, "Como migrar", "extrair partes aos poucos"],
])}

${lembre([
  "Monólito é uma unidade de deploy (um código, um artefato), não sinônimo de bagunça.",
  "Escala com máquina maior, réplicas sem estado, cache e réplicas de leitura.",
  "É a melhor escolha para quase todo começo; com muitos times, evolua para o modular (cap. 12).",
])}
`;
