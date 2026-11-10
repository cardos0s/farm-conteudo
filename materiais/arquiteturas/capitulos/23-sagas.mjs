// Capítulo 23 — Sagas e consistência entre serviços. Segue a estrutura do capítulo-modelo (06-hexagonal):
// abertura → diagrama → como funciona (2PC, saga, orquestração x coreografia) → quando usar → medidor
// → na prática (pastas, código, outbox, ferramentas) → vantagens e custos → erros comuns → exemplo → combina → lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, check, claro, cor, etiqueta, fila, linha, passo, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

const COLS = [95, 285, 475, 665];
const SERVICOS = ["Pedidos", "Pagamentos", "Estoque", "Entrega"];

/** Diagrama principal: ida (transações locais) e volta (compensações na ordem inversa). */
function diagrama() {
  semear("sagas-1");
  let s = "";
  COLS.forEach((cx, i) => {
    s += txt(cx, 20, SERVICOS[i], { tam: 17 });
    s += banco(cx - 26, 34, 52, 44, "", { preench: claro.violeta });
  });
  s += txt(15, 98, "ida: cada passo é uma transação local, com commit no banco do próprio serviço", { tam: 15, cor: cor.verde, ancora: "start" });
  const ida = ["cria pedido", "cobra o cartão", "reserva itens", "agenda entrega"];
  COLS.forEach((cx, i) => {
    const falhou = i === 3;
    s += bloco(cx - 80, 126, 160, 54, ida[i], { preench: falhou ? claro.cinza : claro.verde, tam: 16 });
    s += passo(cx - 64, 126, `T${i + 1}`, falhou ? cor.vermelho : cor.verde);
    if (i < 3) s += seta(cx + 82, 153, cx + 108, 153, { cor: cor.verde, espessura: 2, ponta: 10 });
  });
  s += xis(744, 126, 16);
  // a falha desce e começa a volta
  s += linha([[665, 182], [665, 251]], { cor: cor.vermelho, espessura: 2 });
  s += seta(665, 251, 558, 251, { cor: cor.vermelho, espessura: 2, ponta: 10 });
  s += txt(655, 206, "T4 falhou: sem entregador", { tam: 15, cor: cor.vermelho, ancora: "end" });
  const volta = ["cancela pedido", "estorna", "libera itens"];
  [2, 1, 0].forEach((i) => {
    const cx = COLS[i];
    s += bloco(cx - 80, 224, 160, 54, volta[i], { preench: claro.vermelho, tam: 16 });
    s += passo(cx - 64, 224, `C${i + 1}`, cor.vermelho);
    if (i > 0) s += seta(cx - 82, 251, COLS[i - 1] + 82, 251, { cor: cor.vermelho, espessura: 2, ponta: 10 });
  });
  s += txt(15, 306, "volta: compensações desfazem o que já foi confirmado, da última para a primeira", { tam: 15, cor: cor.vermelho, ancora: "start" });
  s += txt(380, 342, "no fim: pedido CANCELADO, cartão estornado, estoque como antes", { tam: 16 });
  return quadro(760, 362, s);
}

/** Orquestração: um componente central manda comandos e decide o próximo passo. */
function orquestracao() {
  semear("sagas-2");
  let s = "";
  const passoY = 60;
  const cys = COLS.map((_, i) => 44 + i * passoY);
  s += bloco(20, 12, 210, cys[3] + 28 - 12, "", { preench: claro.amarelo });
  s += txt(125, 64, "orquestrador", { tam: 19 });
  s += txt(125, 96, "sabe a ordem", { tam: 15, cor: cor.cinza });
  s += txt(125, 116, "dos passos e", { tam: 15, cor: cor.cinza });
  s += txt(125, 136, "guarda o estado", { tam: 15, cor: cor.cinza });
  s += banco(85, 166, 80, 60, "estado", { preench: claro.violeta, tam: 15 });
  const cmds = ["criar pedido", "cobrar", "reservar itens", "agendar entrega"];
  cys.forEach((cy, i) => {
    s += bloco(520, cy - 24, 220, 48, SERVICOS[i], { preench: claro.azul });
    s += seta(234, cy - 7, 516, cy - 7, { cor: cor.azul, espessura: 2, ponta: 11 });
    s += seta(516, cy + 9, 236, cy + 9, { cor: cor.cinza, espessura: 1.4, tracejado: true, ponta: 9 });
    s += passo(296, cy - 25, String(i + 1), cor.azul);
    s += txt(314, cy - 24, cmds[i], { tam: 15, cor: cor.azul, ancora: "start" });
  });
  const ly = cys[3] + 52;
  s += linha([[20, ly], [62, ly]], { cor: cor.azul, espessura: 2 });
  s += txt(70, ly, "comando: \"faça isto\"", { tam: 15, ancora: "start" });
  s += linha([[290, ly], [332, ly]], { cor: cor.cinza, espessura: 1.4, tracejado: true });
  s += txt(340, ly, "resposta: ok ou falhou", { tam: 15, ancora: "start" });
  s += txt(15, ly + 30, "se o passo 4 falha, ele manda as compensações: liberar (3), estornar (2), cancelar (1)", { tam: 15, cor: cor.vermelho, ancora: "start" });
  return quadro(760, ly + 48, s);
}

/** Coreografia: cada serviço publica um evento e o próximo reage; a falha também é um evento. */
function coreografia() {
  semear("sagas-3");
  let s = "";
  s += txt(15, 22, "caminho feliz: cada serviço publica um evento, e o próximo reage a ele", { tam: 15, cor: cor.verde, ancora: "start" });
  COLS.forEach((cx, i) => {
    s += bloco(cx - 75, 150, 150, 56, SERVICOS[i], { preench: claro.azul });
  });
  const eventos = ["PedidoCriado", "PagamentoAprovado", "EstoqueReservado"];
  eventos.forEach((ev, i) => {
    const ex = (COLS[i] + COLS[i + 1]) / 2;
    s += seta(COLS[i] + 30, 148, ex - 30, 96, { cor: cor.verde, espessura: 2, ponta: 10 });
    s += seta(ex + 30, 96, COLS[i + 1] - 30, 148, { cor: cor.verde, espessura: 2, ponta: 10 });
    s += etiqueta(ex, 80, ev, { tam: 15, preench: claro.verde });
  });
  s += txt(112, 116, "publica", { tam: 15, cor: cor.cinza, ancora: "end" });
  s += txt(256, 120, "escuta", { tam: 15, cor: cor.cinza, ancora: "start" });
  // falha: o Estoque publica um evento e os anteriores compensam
  s += seta(470, 208, 432, 276, { cor: cor.vermelho, espessura: 2, ponta: 10 });
  s += etiqueta(380, 290, "EstoqueEsgotado", { tam: 15, preench: claro.vermelho });
  s += seta(334, 276, 296, 210, { cor: cor.vermelho, espessura: 2, ponta: 10 });
  s += seta(310, 296, 108, 210, { cor: cor.vermelho, espessura: 2, ponta: 10 });
  s += txt(300, 240, "estorna", { tam: 15, cor: cor.vermelho, ancora: "end" });
  s += txt(40, 286, "cancela o pedido", { tam: 15, cor: cor.vermelho, ancora: "start" });
  s += txt(560, 252, "falha também", { tam: 15, cor: cor.vermelho, ancora: "start" });
  s += txt(560, 272, "vira evento", { tam: 15, cor: cor.vermelho, ancora: "start" });
  s += txt(380, 336, "ninguém comanda: o fluxo é a soma das reações aos eventos", { tam: 16, cor: cor.tinta });
  return quadro(760, 354, s);
}

/** Outbox: sem ela, salvar e publicar são duas escritas; com ela, uma transação só e o envio vem depois. */
function outbox() {
  semear("sagas-4");
  let s = "";
  // jeito errado
  s += txt(15, 20, "sem outbox: duas escritas separadas", { tam: 16, cor: cor.vermelho, ancora: "start" });
  s += bloco(20, 58, 160, 56, "Pagamentos", { preench: claro.azul, tam: 16 });
  s += banco(292, 38, 90, 60, "banco", { preench: claro.violeta, tam: 15 });
  s += check(402, 68, 18);
  s += fila(292, 122, 100, 32, "broker");
  s += seta(182, 74, 288, 66, { cor: cor.verde, espessura: 2, ponta: 10, rotulo: "1 salva", dy: -14 });
  s += seta(182, 100, 288, 134, { cor: cor.vermelho, espessura: 2, ponta: 10, tracejado: true });
  s += txt(228, 142, "2 publica", { tam: 15, cor: cor.vermelho, ancora: "end" });
  s += xis(240, 118, 14);
  s += txt(450, 58, "e se cair entre 1 e 2?", { tam: 16, cor: cor.vermelho, ancora: "start" });
  s += txt(450, 88, "o banco diz APROVADO,", { tam: 15, ancora: "start" });
  s += txt(450, 112, "mas o evento nunca sai", { tam: 15, ancora: "start" });
  s += txt(450, 136, "e o Estoque nunca reserva", { tam: 15, ancora: "start" });
  s += linha([[15, 188], [745, 188]], { cor: cor.cinza, espessura: 1.2, tracejado: true });
  // jeito certo
  s += txt(15, 214, "com outbox: uma transação grava o dado e o evento; o envio vem depois", { tam: 16, cor: cor.verde, ancora: "start" });
  s += banco(20, 236, 282, 160, "", { preench: claro.violeta });
  s += txt(161, 270, "banco do Pagamentos", { tam: 15 });
  s += ret(32, 284, 258, 86, { tracejado: true, espessura: 1.4 });
  s += bloco(42, 292, 118, 44, "pagamentos", { preench: "#ffffff", hachura: "solid", tam: 15, espessura: 1.6 });
  s += bloco(170, 292, 110, 44, "outbox", { preench: claro.amarelo, hachura: "solid", tam: 15, espessura: 1.6 });
  s += txt(161, 354, "1 transação só", { tam: 15, cor: cor.verde });
  s += seta(304, 314, 340, 314, { espessura: 2, ponta: 10 });
  s += bloco(342, 288, 120, 52, "publicador", { preench: claro.cinza, tam: 16 });
  s += txt(402, 364, "2 lê o que não saiu", { tam: 15, cor: cor.cinza });
  s += seta(464, 314, 500, 314, { espessura: 2, ponta: 10 });
  s += fila(502, 296, 100, 36, "broker");
  s += seta(604, 314, 640, 314, { espessura: 2, ponta: 10 });
  s += bloco(642, 288, 103, 52, "Estoque", { preench: claro.azul, tam: 16 });
  s += txt(693, 366, "3 ignora\nrepetidas", { tam: 15, cor: cor.cinza });
  return quadro(760, 410, s);
}

export default `
${resumo(
  "Quando uma operação passa por vários serviços, cada um com o próprio banco, não existe um <code>COMMIT</code> que valha para todos. A <b>saga</b> divide a operação em <b>transações locais</b>, uma por serviço, e cada passo tem uma <b>compensação</b>: a ação que desfaz o seu efeito se algo der errado mais adiante.",
  "Você monta uma viagem em três sites: passagem, hotel e carro. O carro não sai? Ninguém apaga a passagem como se ela nunca tivesse existido: você cancela o hotel e pede reembolso da passagem. Cada desfazer é uma ação nova, com regras próprias (e às vezes multa).",
)}

<p>O nome vem de um artigo de 1987 de Hector Garcia-Molina e Kenneth Salem sobre transações longas num banco de dados:
em vez de deixar tudo travado por horas, quebrar o trabalho em pedaços que confirmam sozinhos, cada um com o seu
desfazer. A ideia voltou com força junto com os microsserviços (capítulo 14). Lá, cada serviço é dono do próprio banco, e
"fazer um pedido" mexe no banco de Pedidos, no de Pagamentos, no de Estoque e no de Entrega. Não há um
<code>BEGIN ... COMMIT</code> que cubra os quatro.</p>

${fig(diagrama(), "Em verde, a ida: quatro transações locais, cada uma no banco do seu serviço. Quando a T4 falha, a volta (em vermelho) desfaz o que já tinha sido confirmado, na ordem inversa.", "grande")}

<h3>Como funciona</h3>
<h4>Por que não uma transação só</h4>
<p>Dentro de um banco, uma transação <b>ACID</b> (atômica, consistente, isolada e durável) garante o "tudo ou nada". Entre
serviços com bancos separados, cada <code>COMMIT</code> vale só para o seu banco: se o Pagamento confirma e o Estoque
falha logo depois, o dinheiro já saiu. Existe um protocolo para amarrar vários bancos, o <b>2PC</b> (<i>two-phase
commit</i>, confirmação em duas fases): um coordenador pergunta a todos "vocês conseguem confirmar?" e, se todos dizem
sim, manda confirmar. Entre microsserviços ele costuma ser evitado, porque:</p>
<ul>
<li><b>trava recursos</b>: cada participante segura bloqueios (locks) até a decisão; se o coordenador cai no meio, eles
podem ficar travados esperando;</li>
<li><b>derruba a disponibilidade</b>: a operação só funciona se todos estiverem no ar ao mesmo tempo;</li>
<li><b>nem todo mundo participa</b>: muitos bancos NoSQL, brokers de mensagens e APIs de terceiros (gateway de pagamento,
transportadora) não oferecem 2PC.</li>
</ul>

<h4>A saga: transações locais + compensações</h4>
<ul>
<li><b>Cada passo é uma transação local</b>, comum, no banco de um serviço: T1 cria o pedido como <code>PENDENTE</code>,
T2 cobra, T3 reserva os itens, T4 agenda a entrega.</li>
<li><b>Cada passo que pode precisar ser desfeito tem uma compensação</b>: C1 cancela o pedido, C2 estorna, C3 libera os
itens. Se um passo falha, a saga roda as compensações dos que já deram certo, do último para o primeiro.</li>
<li><b>Compensar não é rollback</b>: o estorno é uma operação nova, que aparece no extrato do cliente. O pedido não some:
fica <code>CANCELADO</code>, com histórico.</li>
<li><b>A ordem importa</b>: primeiro os passos que têm compensação; depois o <b>passo pivô</b> (o ponto sem volta: se ele
confirma, a saga vai até o fim); por último, os passos que não falham por regra de negócio (confirmar o pedido, mandar o
e-mail), que a saga só repete até dar certo.</li>
</ul>
<p>O preço é a <b>consistência eventual</b>: por alguns segundos (às vezes minutos), os dados dos serviços não batem entre
si. Costuma-se dizer que a saga tem o A, o C e o D do ACID, mas não o I: sem <b>isolamento</b>, outras operações podem ver
o pedido no meio do caminho. Por isso os estados intermediários precisam existir no negócio (<code>PENDENTE</code>,
"confirmando pagamento") e aparecer na tela.</p>

<h4>Orquestração x coreografia</h4>
<p>Há dois jeitos de coordenar os passos. Na <b>orquestração</b>, um componente central conhece a sequência, manda
<b>comandos</b> para cada serviço ("cobre R$ 100 do pedido 123") e, conforme as respostas, decide o próximo passo ou as
compensações. Ele pode morar dentro do serviço de Pedidos ou ser um motor de workflow (veja as ferramentas adiante).</p>

${fig(orquestracao(), "Orquestração: um componente conhece o roteiro inteiro. Para saber em que pé está o pedido 123, basta olhar o estado guardado por ele.")}

<p>Na <b>coreografia</b> não há chefe. Cada serviço faz a sua parte e publica um <b>evento</b> ("pagamento aprovado") num
broker (Kafka, RabbitMQ, SNS com SQS); quem se interessa reage. Comando é "faça isto", dirigido a um serviço; evento é
"isto aconteceu", para quem quiser ouvir (capítulo 20). Aqui o fluxo não está escrito em lugar nenhum: ele é a soma das
reações.</p>

${fig(coreografia(), "Coreografia: os eventos passam por um broker. Em verde, o caminho feliz; em vermelho, o evento de falha que faz os serviços anteriores compensarem.")}

${tabela(
  ["", "Orquestração", "Coreografia"],
  [
    ["<b>Onde está o fluxo</b>", "Num lugar só (código ou diagrama)", "Espalhado pelos consumidores de eventos"],
    ["<b>Acoplamento</b>", "O orquestrador conhece todos os serviços", "Serviços só conhecem eventos"],
    ["<b>Risco típico</b>", "Orquestrador acumular regra de negócio demais", "Ciclos, e ninguém saber dizer o fluxo inteiro"],
    ["<b>Bom para</b>", "Muitos passos, decisões no meio, prazos", "2 ou 3 passos simples, times independentes"],
  ],
)}

${quando(
  [
    "Uma operação de negócio atravessa dois ou mais serviços, cada um com o próprio banco.",
    "O negócio aceita alguns segundos de estado intermediário (\"pedido em processamento\").",
    "Cada passo tem um desfazer que faz sentido para o negócio: estornar, liberar reserva, cancelar.",
    "O processo é longo (horas ou dias, como aprovação de crédito ou reserva de viagem) ou envolve APIs de terceiros.",
  ],
  [
    "Os dados estão no mesmo banco: uma transação local comum resolve (monólito, capítulo 11, ou monólito modular, 12).",
    "A regra exige consistência imediata (ex.: saldo que não pode ficar errado nem por um instante): mantenha esses dados no mesmo serviço.",
    "Você separou em serviços dados que sempre mudam juntos: a saga vai remendar uma fronteira errada.",
    "Ainda não há broker, monitoramento e rastreamento entre serviços funcionando.",
  ],
)}

${medidor({ complexidade: 4, escala: 4, operacao: 3, aprendizado: 4, time: "times que já operam microsserviços" })}

<h3>Como usar na prática</h3>
<p>O exemplo é uma saga orquestrada que mora no serviço de Pedidos. As chamadas aos outros serviços ficam em
<code>clientes/</code>; a outbox garante que nenhuma mensagem se perca.</p>
${pastas(`
servico-pedidos/src/
├── sagas/fazer-pedido/
│   ├── passos.ts           # cada passo com a sua compensação
│   └── orquestrador.ts     # roda em ordem, compensa ao contrário, grava o log
├── clientes/               # chamadas a Pagamentos, Estoque, Entrega
├── outbox/                 # grava eventos na transação; publicador envia ao broker
└── consumidores/           # handlers idempotentes (tabela processadas)
`)}

${codigo(
  `
// passos.ts: cada passo sabe fazer e, quando dá, desfazer
export interface Passo<C> {
  nome: string;
  executar(ctx: C): Promise<void>;
  compensar?(ctx: C): Promise<void>; // o pivô (sem volta) não tem
}

type Ctx = { pedidoId: string; total: number; itens: Item[] };

// o pedidoId vai em toda chamada: é a chave de idempotência
export const fazerPedido: Passo<Ctx>[] = [
  { nome: "criar", executar: (c) => pedidos.criarPendente(c),
    compensar: (c) => pedidos.cancelar(c.pedidoId) },
  { nome: "cobrar", executar: (c) => pagamentos.cobrar(c.pedidoId, c.total),
    compensar: (c) => pagamentos.estornar(c.pedidoId) },
  { nome: "reservar", executar: (c) => estoque.reservar(c.pedidoId, c.itens),
    compensar: (c) => estoque.liberar(c.pedidoId) },
  { nome: "agendar", executar: (c) => entrega.agendar(c.pedidoId) }, // pivô
];`,
  "sagas/fazer-pedido/passos.ts",
)}

${codigo(
  `
// orquestrador.ts: roda em ordem; se um passo falha, compensa ao contrário
export async function rodarSaga<C>(id: string, passos: Passo<C>[], ctx: C) {
  const aDesfazer: Passo<C>[] = [];
  for (const passo of passos) {
    aDesfazer.push(passo); // antes: num timeout, o passo pode ter acontecido
    try {
      await comRetentativas(() => passo.executar(ctx)); // só erro temporário
      await logDaSaga.salvar(id, passo.nome, "feito");
    } catch {
      // se uma compensação esgotar as tentativas, o erro sobe e vira alerta
      for (const p of aDesfazer.reverse()) {
        const desfazer = p.compensar; // idempotente: nada a desfazer = não faz nada
        if (desfazer) await comRetentativas(() => desfazer(ctx));
        await logDaSaga.salvar(id, p.nome, "compensado");
      }
      return "cancelada";
    }
  }
  return "concluida";
}

// serviço de Pedidos: a confirmação final é local; se falhar, só tenta de novo
const fim = await rodarSaga(ctx.pedidoId, fazerPedido, ctx);
if (fim === "concluida") await pedidos.confirmar(ctx.pedidoId);`,
  "sagas/fazer-pedido/orquestrador.ts",
)}
<p>Repare num detalhe: a compensação entra na lista <b>antes</b> de o passo rodar. Se a cobrança der timeout, o cartão
pode ter sido cobrado mesmo assim, então o estorno roda também. Se não houve cobrança, ele não faz nada. Por isso toda
compensação precisa ser idempotente e aceitar "não havia nada para desfazer".</p>

<h4>Outbox e idempotência: as duas travas de segurança</h4>
<p>Duas coisas quebram sagas na vida real. A primeira é a <b>escrita dupla</b> (<i>dual write</i>): o serviço grava no
banco e depois publica no broker; se o processo cai entre as duas, o banco diz "aprovado" e ninguém fica sabendo. O
padrão <b>outbox</b> resolve: o evento vai para uma tabela <code>outbox</code>, na mesma transação do dado, e um publicador
envia depois. A segunda é a <b>entrega repetida</b>: brokers e retentativas garantem entrega "pelo menos uma vez"
(<i>at-least-once</i>), então a mesma mensagem pode chegar duas vezes. Cada passo precisa ser <b>idempotente</b>:
processar duas vezes tem o mesmo efeito que processar uma.</p>

${fig(outbox(), "Em cima, a escrita dupla que perde eventos. Embaixo, a outbox: se o publicador cair, ele reenvia depois; por isso quem recebe precisa ignorar repetidas.")}

${codigo(
  `
// Pagamentos: muda o dado e grava o evento na MESMA transação
await db.transaction(async (tx) => {
  await tx.query(
    "update pagamentos set status = 'APROVADO' where pedido_id = $1", [pedidoId]);
  await tx.query(
    "insert into outbox (id, tipo, dados) values ($1, $2, $3)",
    [randomUUID(), "PagamentoAprovado", { pedidoId }]);
});

// publicador, a cada segundo: envia o que não saiu (se cair no meio, reenvia depois)
const { rows } = await db.query(
  "select * from outbox where enviado_em is null order by criado_em");
for (const ev of rows) {
  await broker.publicar(ev.tipo, ev.dados, { id: ev.id });
  await db.query("update outbox set enviado_em = now() where id = $1", [ev.id]);
}

// Estoque: consumidor idempotente (a mesma mensagem pode chegar duas vezes)
await db.transaction(async (tx) => {
  const r = await tx.query(
    "insert into processadas (id) values ($1) on conflict do nothing", [msg.id]);
  if (r.rowCount === 0) return; // já processada: ignora
  await reservarItens(tx, msg.dados.pedidoId);
});`,
  "outbox (Pagamentos) e consumidor idempotente (Estoque)",
)}

<h4>Ferramentas que fazem o trabalho pesado</h4>
<p>O orquestrador acima é didático: se o processo cair no passo 3, alguém precisa ler o log e continuar dali. Motores de
workflow fazem isso por você: guardam o estado de cada execução, tentam de novo, têm timers que sobrevivem a reinícios e um
painel para ver em que passo está cada saga.</p>
${tabela(
  ["Ferramenta", "Como você descreve o fluxo", "Bom para"],
  [
    ["<b>Temporal</b>", "Código comum (TypeScript, Go, Java, Python e outras); o motor guarda o histórico e retoma depois de quedas", "Times que querem a saga como código, com testes"],
    ["<b>Camunda</b>", "Diagrama BPMN (notação padrão de processos), executado pelo motor; o BPMN tem eventos de compensação", "Processos que analistas também leem, com tarefas humanas (aprovar, revisar)"],
    ["<b>AWS Step Functions</b>", "Máquina de estados em JSON (Amazon States Language), com editor visual e <code>Retry</code>/<code>Catch</code> em cada estado", "Quem já está na AWS e orquestra funções Lambda (capítulo 15)"],
  ],
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Desenhe a saga antes do código: os passos, o serviço dono de cada um e a compensação de cada um. O passo sem volta (pivô) vem depois dos que têm compensação.",
  "Dê nome aos estados intermediários (<code>PENDENTE</code>, <code>CANCELADO</code>) e mostre-os na tela: \"estamos confirmando seu pagamento\".",
  "Escolha o estilo: coreografia para 2 ou 3 passos simples; orquestração quando há mais passos, decisões no meio ou prazos.",
  "Torne passos e compensações idempotentes e publique mensagens pela outbox (ou por CDC, <i>change data capture</i>, que lê as mudanças no log do banco, com ferramentas como o Debezium).",
  "Separe erro temporário (rede, timeout: tente de novo com espera crescente) de erro de negócio (cartão recusado: compense). Monitore sagas paradas e passe um <i>correlation id</i> em todas as mensagens para segui-las nos logs.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Operações entre serviços sem transação distribuída nem bloqueios longos", "Consistência eventual: por um tempo, os dados não batem"],
    ["Cada serviço continua dono do seu banco e da sua tecnologia", "Uma compensação para escrever e testar em cada passo"],
    ["Funciona com APIs de terceiros e com processos que duram dias", "Sem isolamento: outras operações veem estados intermediários"],
    ["A falha vira fluxo de negócio explícito (estorno, cancelamento)", "Mais peças: broker, outbox, orquestrador, rastreamento"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Compensação que falha em silêncio</b>: o estorno dá erro, ninguém vê, e o cliente fica cobrado por um pedido
cancelado. Compensação precisa de retentativa, idempotência e, no fim, alerta e uma fila de mensagens mortas
(<i>dead letter queue</i>) para alguém resolver.</li>
<li><b>Confiar que a mensagem chega uma vez só</b>: ela pode chegar duas vezes (cliente cobrado em dobro) ou nunca sair
(escrita dupla sem outbox). Idempotência e outbox não são opcionais.</li>
<li><b>Tratar timeout como falha</b>: o pagamento pode ter passado e só a resposta se perdeu. Consulte o status ou tente de
novo com a mesma chave antes de compensar.</li>
<li><b>Esquecer que não há isolamento</b>: enquanto a saga roda, outra operação pode ler ou mudar o mesmo pedido (o
cliente pede para cancelar no meio da cobrança). Use o estado intermediário como <b>trava semântica</b>: com o pedido em
<code>PENDENTE</code>, as outras operações esperam ou recusam.</li>
<li><b>Compensação que apaga</b>: <code>delete from pedidos</code> em vez de marcar <code>CANCELADO</code>. Some o
histórico, e uma mensagem atrasada pode "ressuscitar" o pedido.</li>
<li><b>Coreografia que virou novelo</b>: muitos serviços reagindo aos eventos uns dos outros, ciclos, e ninguém sabe dizer
qual é o fluxo. Passou de quatro ou cinco passos, considere orquestração.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine um app de delivery de comida. A saga do pedido é: cobrar o cliente, o restaurante aceitar, alocar um entregador. Se nenhum entregador aceita em 10 minutos, a saga compensa: avisa o restaurante e estorna o cliente. Dois detalhes aparecem logo. Primeiro, a compensação depende do momento: se o prato já está pronto, \"desfazer\" vira outra regra de negócio (oferecer retirada no balcão, pagar o restaurante assim mesmo). Segundo, o prazo de 10 minutos é parte da saga: motores como Temporal e Step Functions têm timers duráveis para isso, sem cron improvisado.</p>",
)}

${dica(
  "Truque do pagamento: autorizar antes, capturar depois",
  "<p>No cartão de crédito, dá para <b>autorizar</b> o valor (reservar no limite do cliente) no começo da saga e só <b>capturar</b> (cobrar de fato) no fim, quando estoque e entrega estiverem garantidos. Cancelar uma autorização costuma ser mais simples que estornar uma cobrança. Vale para qualquer passo: <b>reservar</b> primeiro e <b>confirmar</b> no fim deixa as compensações baratas.</p>",
)}

${alerta(
  "Se tudo precisa de saga, a fronteira pode estar errada",
  "<p>Saga é remédio para quando os dados <b>precisam</b> morar em serviços diferentes. Se cada operação simples exige uma saga de quatro passos, talvez esses dados devessem estar no mesmo serviço, ou num monólito modular (capítulo 12). Uma transação local é sempre mais simples que a melhor saga.</p>",
)}

${combina([
  [14, "Microsserviços", "onde a saga nasce: um banco por serviço"],
  [20, "Orientada a eventos", "a base da coreografia"],
  [15, "Serverless", "Step Functions orquestrando funções"],
  [22, "Event Sourcing", "os eventos da saga viram histórico"],
  [21, "CQRS", "telas de leitura mostram o status da saga"],
  [12, "Monólito modular", "quando uma transação local resolve"],
])}

${lembre([
  "Entre serviços com bancos separados não há transação única: a saga encadeia transações locais e desfaz com compensações, na ordem inversa.",
  "Orquestração põe o fluxo num lugar só (fácil de ver e mudar); coreografia espalha o fluxo em eventos (menos acoplamento, mais difícil de seguir).",
  "Toda mensagem pode sumir ou chegar duas vezes: outbox para não perder, idempotência para não repetir.",
])}
`;
