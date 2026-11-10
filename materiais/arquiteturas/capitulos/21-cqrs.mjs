// Capítulo 21: CQRS. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, evento, linha, navegador, passo, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Diagrama principal: comando → modelo de escrita → evento → projeção → modelo de leitura ← consulta. */
function fluxo() {
  semear("cqrs-1");
  let s = "";
  s += txt(335, 22, "lado de escrita (comandos)", { tam: 16, cor: cor.azul });
  s += navegador(20, 172, 130, 96, "app");
  // escrita
  s += bloco(220, 48, 230, 84, "", { preench: claro.azul, hachura: "solid" });
  s += txt(335, 76, "modelo de escrita", { tam: 17 });
  s += txt(335, 106, "valida as regras", { tam: 15, cor: cor.cinza });
  s += banco(590, 42, 120, 96, "banco de\nescrita", { preench: claro.azul, tam: 15 });
  s += linha([[85, 168], [85, 90]], { cor: cor.azul, espessura: 2 });
  s += seta(85, 90, 216, 90, { cor: cor.azul, espessura: 2 });
  s += passo(112, 68, "1") + txt(130, 68, "comando", { tam: 15, cor: cor.azul, ancora: "start" });
  s += seta(452, 90, 586, 90, { cor: cor.azul, espessura: 2 });
  s += passo(482, 68, "2") + txt(500, 68, "grava", { tam: 15, cor: cor.azul, ancora: "start" });
  // evento → projeção → leitura
  s += seta(650, 142, 650, 196, { cor: cor.laranja, espessura: 2 });
  s += passo(454, 169, "3", cor.laranja) + evento(486, 154, 26);
  s += txt(502, 169, "PedidoConfirmado", { tam: 15, cor: cor.laranja, ancora: "start" });
  s += bloco(580, 198, 140, 56, "projeção", { preench: claro.laranja, tam: 17 });
  s += seta(650, 256, 650, 298, { cor: cor.verde, espessura: 2 });
  s += passo(560, 277, "4", cor.verde) + txt(578, 277, "atualiza", { tam: 15, cor: cor.verde, ancora: "start" });
  s += txt(362, 222, "entre gravar (2) e atualizar (4) há um atraso:\na leitura pode ficar um instante para trás", { tam: 15, cor: cor.vermelho });
  // leitura
  s += banco(590, 300, 120, 96, "banco de\nleitura", { preench: claro.verde, tam: 15 });
  s += bloco(220, 306, 230, 84, "", { preench: claro.verde, hachura: "solid" });
  s += txt(335, 334, "modelo de leitura", { tam: 17 });
  s += txt(335, 364, "só consulta, sem regra", { tam: 15, cor: cor.cinza });
  s += seta(452, 348, 586, 348, { cor: cor.verde, espessura: 2 });
  s += txt(519, 330, "lê", { tam: 15, cor: cor.verde });
  s += linha([[85, 272], [85, 348]], { cor: cor.verde, espessura: 2 });
  s += seta(85, 348, 216, 348, { cor: cor.verde, espessura: 2 });
  s += passo(112, 326, "5", cor.verde) + txt(130, 326, "consulta", { tam: 15, cor: cor.verde, ancora: "start" });
  s += txt(335, 420, "lado de leitura (consultas)", { tam: 16, cor: cor.verde });
  return quadro(760, 440, s);
}

/** Os três níveis de adoção, do mais simples ao mais separado. */
function niveis() {
  semear("cqrs-2");
  let s = "";
  const paineis = [
    { x: 15, t: "nível 1", sub: "só o código separado", nota: "leitura sempre em dia", corNota: cor.verde },
    { x: 265, t: "nível 2", sub: "+ tabelas de leitura", nota: "em dia, se atualizadas\nna mesma transação", corNota: cor.verde },
    { x: 515, t: "nível 3", sub: "+ banco só de leitura", nota: "leitura atrasa um pouco\n(consistência eventual)", corNota: cor.laranja },
  ];
  for (const p of paineis) {
    const x = p.x;
    s += txt(x + 115, 26, p.t, { tam: 18 });
    s += txt(x + 115, 52, p.sub, { tam: 15, cor: cor.cinza });
    s += bloco(x + 12, 78, 98, 48, "comando", { preench: claro.azul, tam: 15 });
    s += bloco(x + 120, 78, 98, 48, "consulta", { preench: claro.verde, tam: 15 });
    s += txt(x + 115, 306, p.nota, { tam: 15, cor: p.corNota });
  }
  // nível 1: um banco, as mesmas tabelas
  s += banco(80, 182, 100, 86, "um banco", { preench: claro.cinza, tam: 15 });
  s += seta(76, 128, 108, 178, { espessura: 1.8 });
  s += seta(184, 128, 152, 178, { espessura: 1.8 });
  // nível 2: mesmo banco, tabelas de leitura à parte
  s += ret(273, 164, 214, 116, { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += txt(380, 182, "mesmo banco", { tam: 15, cor: cor.cinza });
  s += banco(283, 198, 74, 72, "escrita", { preench: claro.azul, tam: 15 });
  s += banco(403, 198, 74, 72, "leitura", { preench: claro.verde, tam: 15 });
  s += seta(359, 236, 401, 236, { cor: cor.laranja, espessura: 2 });
  s += seta(326, 128, 320, 196, { espessura: 1.8 });
  s += seta(434, 128, 440, 196, { espessura: 1.8 });
  // nível 3: bancos separados, ligados por eventos
  s += banco(525, 188, 80, 84, "escrita", { preench: claro.azul, tam: 15 });
  s += banco(655, 188, 80, 84, "leitura", { preench: claro.verde, tam: 15 });
  s += evento(632, 194, 26);
  s += seta(607, 240, 653, 240, { cor: cor.laranja, espessura: 2 });
  s += seta(576, 128, 566, 186, { espessura: 1.8 });
  s += seta(684, 128, 694, 186, { espessura: 1.8 });
  // divisórias e eixo
  s += linha([[255, 16], [255, 326]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  s += linha([[505, 16], [505, 326]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  s += seta(30, 352, 730, 352, { cor: cor.cinza, espessura: 2 });
  s += txt(380, 378, "mais liberdade para a leitura, e mais peças para operar", { tam: 15 });
  return quadro(760, 396, s);
}

export default `
${resumo(
  "Separe o jeito de <b>mudar</b> os dados do jeito de <b>ler</b> os dados: <b>comandos</b> passam por um modelo de escrita, que protege as regras; <b>consultas</b> vão a um modelo de leitura, montado só para responder rápido no formato da tela.",
  "No supermercado, o preço muda no sistema do depósito, com nota fiscal e conferência. A etiqueta na gôndola é uma cópia feita só para o cliente ler rápido. Quando o preço muda, alguém atualiza a etiqueta, um pouco depois.",
)}

<p>Em quase todo sistema, o mesmo modelo (a mesma entidade, as mesmas tabelas) serve para gravar e para ler. Numa loja,
gravar um pedido exige validar estoque, cupom e limite de crédito; já a tela "Meus pedidos" quer foto, nome da loja, status
da entrega e total numa lista paginada: seis <i>joins</i> (junções de tabelas) e nenhuma regra. A ideia de separar as duas coisas vem do <b>CQS</b>
(<i>Command-Query Separation</i>, separação entre comando e consulta), de Bertrand Meyer: um método ou <b>muda</b> o estado
(comando) ou <b>devolve</b> uma resposta (consulta), nunca os dois. Por volta de 2010, Greg Young levou a ideia do método
para a arquitetura com o nome <b>CQRS</b> (<i>Command Query Responsibility Segregation</i>, segregação de responsabilidades
entre comando e consulta): em vez de métodos separados, <b>modelos</b> separados.</p>

${fig(fluxo(), "Em cima, a escrita: o comando passa pelas regras e é gravado. O evento avisa a projeção, que monta a tabela de leitura. Embaixo, a consulta só lê essa tabela, já no formato da tela.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Comando</b>: um pedido para mudar algo, com nome no imperativo (<code>ConfirmarPedido</code>,
<code>CancelarAssinatura</code>). Expressa uma intenção do negócio, e não "atualize esta linha". Pode ser recusado. Não devolve dados de tela: no máximo um id ou um "ok". Na API, o comando costuma virar <code>POST</code>, <code>PUT</code> ou <code>DELETE</code>; a consulta, um <code>GET</code>.</li>
<li><b>Modelo de escrita</b>: entidades com as regras do negócio, num banco normalizado, feito para gravar com segurança.
Cada comando tem um <b>command handler</b> (tratador do comando): carrega, aplica a regra, grava.</li>
<li><b>Evento</b>: o fato que aconteceu, com nome no passado (<code>PedidoConfirmado</code>). Ao contrário do comando, não
pode ser recusado: já aconteceu. Quando os dois lados ficam separados, é ele que avisa o lado de leitura.</li>
<li><b>Projeção</b>: código que escuta os eventos e atualiza o modelo de leitura, uma tabela "achatada" com as colunas
que a tela mostra.</li>
<li><b>Modelo de leitura</b>: dados prontos para consultar, sem regra. Cada consulta tem um <b>query handler</b> (tratador
da consulta) que faz um <code>SELECT</code> simples e devolve um objeto no formato da tela. A mesma escrita pode alimentar
vários modelos de leitura: a lista do app, a busca, o relatório.</li>
</ul>

<h4>Os níveis de adoção</h4>
<p>CQRS não é tudo ou nada. Dá para começar pequeno e só avançar quando uma tela pedir.</p>

${fig(niveis(), "Do nível 1 ao 3, a leitura ganha liberdade para ter o seu próprio formato e o seu próprio banco. Em troca, entram peças novas e, no nível 3, o atraso da leitura.")}

<ul>
<li><b>Nível 1: só o código separado.</b> Mesmo banco, mesmas tabelas. Comandos passam pelas entidades; consultas leem
direto com SQL e devolvem objetos simples. Já resolve muito, sem atraso nenhum.</li>
<li><b>Nível 2: tabelas de leitura no mesmo banco.</b> Tabelas desnormalizadas, feitas para a tela. Se o comando as
atualiza na mesma transação, ficam sempre em dia. Uma <i>view</i> materializada (consulta com o resultado guardado em disco) também serve, mas no Postgres ela só muda
quando alguém roda o <code>REFRESH</code>: até lá, fica para trás.</li>
<li><b>Nível 3: banco só de leitura.</b> A escrita fica, por exemplo, no Postgres, e a leitura num índice de busca ou
num cache. Uma projeção, alimentada por eventos, mantém os dois em sincronia.</li>
</ul>

<h4>A leitura atrasa: consistência eventual</h4>
<p>No nível 3, a leitura é atualizada depois da gravação: milissegundos no dia a dia, segundos ou mais num pico. É a
<b>consistência eventual</b>: os dois lados vão concordar, mas não no mesmo instante. O risco clássico: o cliente faz um
pedido, abre "Meus pedidos", o pedido ainda não aparece e ele faz tudo de novo. Jeitos comuns de lidar com isso:</p>
<ul>
<li>A tela usa a resposta do próprio comando para se atualizar, sem esperar a consulta.</li>
<li>Logo depois de gravar, aquele item específico é lido do lado de escrita (<i>read your own writes</i>, "leia o que você escreveu").</li>
<li>A tela mostra "processando" e se atualiza quando a projeção termina (por <i>polling</i>, perguntando de novo a cada poucos segundos, ou por notificação).</li>
<li>O comando aceita uma chave de idempotência, para a segunda tentativa não criar um segundo pedido.</li>
</ul>

<h4>Com ou sem event sourcing</h4>
<p>CQRS não exige event sourcing: a escrita pode guardar o estado atual em tabelas comuns e publicar eventos só para
avisar as projeções, como no exemplo deste capítulo. Com <b>event sourcing</b> (capítulo 22), a escrita guarda os próprios
eventos como fonte da verdade, e as projeções viram o jeito prático de consultar. Event sourcing quase sempre traz CQRS;
CQRS vive muito bem sozinho.</p>

${quando(
  [
    "A leitura é muito diferente da escrita: telas que juntam dados de várias entidades, busca com filtros, painéis e relatórios.",
    "Há muito mais leitura do que escrita e você quer escalar a leitura sozinha (catálogo, feed, acompanhamento de pedido).",
    "O domínio é complexo e as regras de escrita estão ficando poluídas por necessidades de tela.",
    "Você usa event sourcing (capítulo 22): as projeções são o jeito de consultar.",
  ],
  [
    "É um CRUD: a tela mostra o que foi gravado, do mesmo jeito que foi gravado.",
    "Índices, uma <i>view</i> ou uma réplica de leitura já resolvem a lentidão.",
    "O negócio não aceita atraso entre gravar e ler: fique no nível 1 ou 2.",
    "Time pequeno, sem experiência com filas, pensando direto no nível 3. Ou um MVP (produto mínimo viável).",
  ],
)}

${medidor({ complexidade: 3, escala: 4, operacao: 3, aprendizado: 3, time: "nível 1: qualquer um; nível 3: experiência com filas" })}

${dica(
  "Réplica de leitura não é CQRS",
  "<p>Uma réplica de leitura (<i>read replica</i>) copia o mesmo banco, com as mesmas tabelas: resolve <b>volume</b>, não <b>formato</b>. O CQRS muda o formato, com um modelo de leitura desenhado para a tela. Muitas vezes a réplica basta. As duas também combinam (consultas do nível 1 lendo da réplica), e a réplica atrasa um pouco: é consistência eventual do mesmo jeito.</p>",
)}

<h3>Como usar na prática</h3>
${pastas(`
src/pedidos/
├── comandos/                      # lado de escrita
│   ├── confirmar-pedido.ts        # comando + command handler
│   ├── cancelar-pedido.ts
│   └── dominio/pedido.ts          # entidade com as regras
├── consultas/                     # lado de leitura
│   ├── listar-meus-pedidos.ts     # query handler: só SELECT
│   └── detalhe-do-pedido.ts
├── projecoes/
│   └── meus-pedidos.ts            # evento -> tabela de leitura
└── eventos.ts                     # PedidoConfirmado, PedidoCancelado...
`)}

${codigo(
  `
// eventos.ts: o fato, com nome no passado
export type PedidoConfirmado = {
  tipo: "PedidoConfirmado"; pedidoId: string; clienteId: string;
  total: number; versao: number; em: string;
};

// comandos/confirmar-pedido.ts: muda o estado e não devolve dados de tela
export type ConfirmarPedido = { pedidoId: string };

export class ConfirmarPedidoHandler {
  constructor(private pedidos: RepositorioDePedidos) {}
  async executar(cmd: ConfirmarPedido): Promise<void> {
    const pedido = await this.pedidos.buscar(cmd.pedidoId);
    if (!pedido) throw new Error("Pedido não encontrado");
    pedido.confirmar(); // a regra mora na entidade: só confirma pedido pago
    const evento: PedidoConfirmado = {
      tipo: "PedidoConfirmado", pedidoId: pedido.id, clienteId: pedido.clienteId,
      total: pedido.total, versao: pedido.versao, em: new Date().toISOString(),
    };
    // grava o pedido e o evento (na tabela outbox) na MESMA transação
    await this.pedidos.salvarComEvento(pedido, evento);
  }
}`,
  "src/pedidos/eventos.ts e src/pedidos/comandos/confirmar-pedido.ts",
)}

${codigo(
  `
// projecoes/meus-pedidos.ts: escuta eventos e mantém a tabela da tela "Meus pedidos"
export async function projetarPedidoConfirmado(e: PedidoConfirmado, db: Pool) {
  // upsert idempotente: evento repetido ou fora de ordem (versão menor ou igual) não muda nada
  await db.query(
    \`insert into meus_pedidos (pedido_id, cliente_id, status, total, versao, atualizado_em)
     values ($1, $2, 'confirmado', $3, $4, $5)
     on conflict (pedido_id) do update
       set status = 'confirmado', total = excluded.total,
           versao = excluded.versao, atualizado_em = excluded.atualizado_em
       where meus_pedidos.versao < excluded.versao\`,
    [e.pedidoId, e.clienteId, e.total, e.versao, e.em],
  );
}
fila.assinar("PedidoConfirmado", (e: PedidoConfirmado) => projetarPedidoConfirmado(e, pool));`,
  "src/pedidos/projecoes/meus-pedidos.ts",
)}

${codigo(
  `
// consultas/listar-meus-pedidos.ts: só lê; nada de entidade nem de regra
export type ResumoDePedido = {
  pedidoId: string; status: string; total: number; atualizadoEm: Date;
};
export class ListarMeusPedidosHandler {
  constructor(private db: Pool) {}
  async executar(q: { clienteId: string; pagina: number }): Promise<ResumoDePedido[]> {
    const { rows } = await this.db.query(
      \`select pedido_id as "pedidoId", status, total, atualizado_em as "atualizadoEm"
       from meus_pedidos where cliente_id = $1
       order by atualizado_em desc limit 20 offset $2\`,
      [q.clienteId, q.pagina * 20],
    );
    return rows; // já no formato da tela: um SELECT, sem join
  }
}`,
  "src/pedidos/consultas/listar-meus-pedidos.ts",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Comece no nível 1: classes separadas para comandos e para consultas, no mesmo banco.",
  "Nas consultas, pule as entidades: leia direto com SQL e devolva objetos no formato da tela.",
  "Ache a tela que dói (lenta, cheia de joins, ou que precisa de busca textual). Só para ela, crie uma tabela de leitura (nível 2) ou um banco próprio (nível 3).",
  "Defina os eventos que alimentam essa leitura e publique com garantia (padrão <i>outbox</i>, explicado mais adiante).",
  "Escreva projeções idempotentes e tenha um script para reconstruir a tabela de leitura do zero, reprocessando os eventos ou relendo o lado de escrita.",
  "Combine com o time de produto como cada tela lida com o atraso e monitore o atraso (<i>lag</i>) das projeções.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Cada lado com o modelo ideal: escrita com regras, leitura achatada e pronta para a tela", "Dois modelos para manter, mais o código que os sincroniza"],
    ["A leitura escala sozinha (cache, réplicas, banco próprio) sem pesar na escrita", "Consistência eventual: a tela pode mostrar um dado de um instante atrás"],
    ["Consultas rápidas e simples, sem joins enormes", "Projeções precisam ser idempotentes, monitoradas e reconstruíveis"],
    ["Tela nova = projeção nova, sem mexer nas regras", "Mais peças nos níveis 2 e 3: tabelas extras e, no nível 3, outbox, fila e outro banco"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>CQRS no sistema inteiro</b>: aplicar nos cadastros simples também. Use só nas partes em que leitura e escrita
realmente divergem; o resto pode ser CRUD.</li>
<li><b>Ignorar o atraso</b>: a tela lê logo depois do comando, não acha o dado e o usuário repete a ação. Planeje a tela
para o atraso e torne o comando idempotente.</li>
<li><b>Projeção frágil</b>: soma o total de novo quando o mesmo evento chega duas vezes (a maioria das filas entrega
"pelo menos uma vez"), ou não tem como ser reconstruída se os dados se corromperem.</li>
<li><b>Regra de negócio na projeção ou na consulta</b>: a projeção só copia e reorganiza dados. Quem decide é o lado de escrita.</li>
<li><b>Decidir com o modelo de leitura</b>: o comando confere estoque ou saldo na tabela de leitura, que pode estar
atrasada, e aprova o que não devia. Validação de comando usa os dados do lado de escrita.</li>
</ul>

${pratica(
  "No mundo real (um exemplo)",
  "<p>Imagine um app de delivery. O lado de escrita cuida do pedido (restaurante aberto, endereço no raio de entrega, pagamento autorizado) num banco relacional, com transações. Do lado de leitura, o cliente abre \"acompanhar pedido\" várias vezes por minuto, o restaurante vê a sua fila e a busca filtra por prato, preço e tempo de entrega. Cada tela vira um modelo de leitura alimentado pelos mesmos eventos (<code>PedidoCriado</code>, <code>PedidoAceito</code>, <code>SaiuParaEntrega</code>): o acompanhamento num cache como o Redis, a busca num índice como o Elasticsearch. No almoço, a leitura cresce muito mais que a escrita, e dá para escalar só ela. O preço: cuidar das projeções, monitorar o atraso e saber reconstruir um índice do zero.</p>",
)}

${alerta(
  "Gravar e publicar: o problema da escrita dupla",
  "<p>Salvar o pedido e <b>depois</b> publicar o evento na fila é arriscado: se o processo cair entre as duas coisas, o evento se perde e a tabela de leitura fica errada sem ninguém perceber. Por isso o exemplo usa <code>salvarComEvento</code>: o evento vai para uma tabela <b>outbox</b> na mesma transação do pedido, e um processo separado lê essa tabela e publica na fila (padrão <i>transactional outbox</i>). Ferramentas de CDC (<i>change data capture</i>, captura de mudanças), como o Debezium, fazem esse papel lendo o log do banco. Em qualquer caso, o mesmo evento pode sair duas vezes: por isso a projeção é idempotente.</p>",
)}


${combina([
  [22, "Event Sourcing", "a escrita guarda eventos; as projeções são a leitura"],
  [20, "Orientada a eventos", "os eventos alimentam as projeções"],
  [8, "Vertical Slice", "cada fatia é um comando ou uma consulta"],
  [6, "Hexagonal", "portas separadas para escrita e leitura"],
  [23, "Sagas", "telas de leitura mostram o status da saga"],
  [14, "Microsserviços", "um serviço monta visões com dados de outros"],
])}

${lembre([
  "CQRS separa quem muda os dados (comandos, com regras) de quem lê (consultas, prontas para a tela). Pode ser só no código, no mesmo banco.",
  "Com um banco só de leitura vem a consistência eventual: planeje a tela, a idempotência e a reconstrução das projeções.",
  "Vale onde leitura e escrita são muito diferentes ou a leitura pesa demais; num CRUD, é exagero.",
])}
`;
