// Capítulo 20: Arquitetura orientada a eventos. Segue o modelo do capítulo 6:
// abertura → diagrama → como funciona (evento x comando, fila x pub/sub, broker x mediador, o que vai no evento,
// consistência eventual) → quando usar → medidor → na prática (brokers, entrega, ordem, outbox, esquema, pastas,
// código, passos) → vantagens e custos → erros comuns → exemplo → combina → lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, claro, cor, envelope, etiqueta, linha, pessoa, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Tubo de mensagens (fila ou tópico) com fundo sólido e divisórias. */
function tubo(x, y, w, h, preench = claro.laranja) {
  let s = ret(x, y, w, h, { preench, hachura: "solid", espessura: 1.8 });
  for (let i = 1; i < 5; i++) s += linha([[x + (w * i) / 5, y + 5], [x + (w * i) / 5, y + h - 5]], { espessura: 1.1 });
  return s;
}

/** Diagrama principal: produtor → broker → consumidores. */
function principal() {
  semear("eventos-1");
  let s = "";
  // produtor
  s += txt(95, 20, "produtor", { tam: 16, cor: cor.azul });
  s += pessoa(95, 50, { rotulo: "cliente paga" });
  s += seta(95, 122, 95, 156, { cor: cor.azul, espessura: 2 });
  s += bloco(20, 160, 150, 64, "Pedidos", { preench: claro.azul });
  s += txt(95, 256, "grava o pagamento\ne anuncia o fato", { tam: 15, cor: cor.cinza });
  // evento publicado
  s += etiqueta(232, 164, "PedidoPago", { tam: 15, preench: claro.amarelo });
  s += seta(172, 194, 302, 194, { cor: cor.laranja, espessura: 2.2 });
  s += txt(232, 218, "publica", { tam: 15, cor: cor.laranja });
  // broker
  s += ret(290, 70, 190, 270, { preench: claro.laranja, gap: 10, espessura: 2.2 });
  s += txt(385, 96, "broker", { tam: 19, halo: 5 });
  s += txt(385, 124, "Kafka, RabbitMQ, SQS...", { tam: 15, cor: cor.cinza, halo: 4 });
  s += tubo(305, 170, 160, 48, "#ffffff");
  for (const ex of [372, 404, 436]) s += envelope(ex - 11, 186, 22, 16, claro.amarelo);
  s += txt(385, 236, "tópico \"pedidos\"", { tam: 15, halo: 4 });
  s += txt(385, 296, "guarda e entrega\numa cópia a cada um", { tam: 15, cor: cor.cinza, halo: 4 });
  // consumidores
  s += txt(660, 20, "consumidores", { tam: 16, cor: cor.violeta });
  const consumidores = ["Estoque", "Nota fiscal", "E-mail", "Fidelidade"];
  consumidores.forEach((nome, i) => {
    const y = 52 + i * 75;
    s += bloco(580, y, 160, 50, nome, { preench: claro.violeta, tam: 16 });
    s += seta(467, 194, 576, y + 25, { cor: cor.violeta, espessura: 1.8 });
  });
  s += bloco(580, 352, 160, 50, "Analytics (novo)", { preench: "#ffffff", hachura: "solid", tracejado: true, tam: 15 });
  s += seta(467, 194, 576, 377, { cor: cor.cinza, espessura: 1.6, tracejado: true });
  s += txt(380, 434, "Pedidos não conhece os consumidores: para somar um, basta assinar o tópico", { tam: 16, cor: cor.vermelho });
  return quadro(760, 452, s);
}

/** Fila (ponto a ponto) x pub/sub (tópico). */
function filaXPubsub() {
  semear("eventos-2");
  let s = "";
  s += linha([[380, 16], [380, 300]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  const painel = (x0, titulo, sub, rotTubo, nomes, cores, nota) => {
    let p = "";
    p += txt(x0 + 185, 24, titulo, { tam: 18 });
    p += txt(x0 + 185, 52, sub, { tam: 15, cor: cor.cinza });
    p += bloco(x0 + 8, 140, 82, 50, "Pedidos", { tam: 16 });
    p += seta(x0 + 92, 165, x0 + 114, 165, { espessura: 1.8 });
    p += tubo(x0 + 116, 143, 80, 44);
    p += txt(x0 + 156, 206, rotTubo, { tam: 15 });
    nomes.forEach((nome, i) => {
      const y = 82 + i * 61;
      p += bloco(x0 + 262, y, 106, 44, nome, { preench: claro.violeta, tam: 15 });
      p += seta(x0 + 198, 165, x0 + 260, y + 22, { espessura: 1.6 });
      const mx = (x0 + 198 + x0 + 260) / 2, my = (165 + y + 22) / 2;
      p += envelope(mx - 11, my - 8, 22, 16, cores[i]);
    });
    p += txt(x0 + 185, 272, nota, { tam: 15, cor: cor.azul });
    return p;
  };
  s += painel(0, "fila (ponto a ponto)", "cada mensagem vai para UM consumidor", "fila", ["Notas 1", "Notas 2", "Notas 3"],
    [claro.amarelo, claro.verde, claro.azul], "3 instâncias do mesmo serviço\ndividem o trabalho");
  s += painel(385, "pub/sub (tópico)", "cada assinante recebe uma CÓPIA", "tópico", ["Estoque", "E-mail", "Fidelidade"],
    [claro.amarelo, claro.amarelo, claro.amarelo], "3 serviços diferentes,\ncada um com a sua cópia");
  return quadro(760, 310, s);
}

/** Topologia broker (coreografia) x mediador (orquestração). */
function brokerXMediador() {
  semear("eventos-3");
  let s = "";
  // em cima: broker
  s += txt(20, 22, "broker (coreografia): cada serviço reage a um evento e publica o próximo", { tam: 16, ancora: "start" });
  const nomes = ["Pedidos", "Pagamento", "Estoque", "Entrega"];
  const cx = nomes.map((_, i) => 87.5 + i * 195);
  nomes.forEach((nome, i) => (s += bloco(cx[i] - 67.5, 50, 135, 50, nome, { preench: claro.azul, tam: 16 })));
  s += ret(20, 140, 720, 44, { preench: claro.laranja, gap: 8, espessura: 2 });
  s += txt(68, 162, "broker", { tam: 16, halo: 5 });
  const eventos = ["PedidoCriado", "PagamentoAprovado", "EstoqueReservado"];
  eventos.forEach((ev, i) => {
    const m = cx[i] + 97.5;
    s += seta(cx[i] + 35, 103, m - 26, 147, { cor: cor.laranja, espessura: 1.8 });
    s += seta(m + 26, 147, cx[i + 1] - 35, 103, { cor: cor.violeta, espessura: 1.8 });
    s += etiqueta(m, 162, ev, { tam: 15, preench: claro.amarelo });
  });
  s += txt(380, 206, "ninguém conhece o fluxo inteiro: ele é a soma das reações", { tam: 15, cor: cor.cinza });
  s += linha([[20, 226], [740, 226]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  // embaixo: mediador
  s += txt(20, 250, "mediador (orquestração): um componente conhece a ordem e manda comandos", { tam: 16, ancora: "start" });
  s += etiqueta(110, 300, "PedidoCriado", { tam: 15, preench: claro.amarelo });
  s += seta(172, 300, 282, 300, { cor: cor.laranja, espessura: 2 });
  s += bloco(285, 275, 190, 50, "Mediador", { preench: claro.amarelo, tam: 18 });
  s += txt(610, 300, "guarda o estado do fluxo\ne trata as falhas", { tam: 15, cor: cor.cinza });
  const servicos = [["1. Pagamento", 200], ["2. Estoque", 380], ["3. Entrega", 560]];
  servicos.forEach(([nome, x], i) => {
    s += bloco(x - 80, 372, 160, 44, nome, { preench: claro.azul, tam: 16 });
    s += seta(330 + i * 50, 328, x, 369, { duplo: true, espessura: 1.8, cor: cor.violeta });
  });
  return quadro(760, 432, s);
}

export default `
${resumo(
  "Em vez de um serviço chamar os outros e esperar, ele <b>anuncia um fato</b> (\"o pedido 123 foi pago\") e quem se interessa reage, no seu próprio tempo. Quem publica não sabe quem escuta.",
  "Na padaria, a atendente grita \"saiu pão quente!\". Ela não liga para cada cliente nem espera resposta; quem quer pão vai até o balcão. Se aparecerem dez clientes novos amanhã, ela continua gritando do mesmo jeito.",
)}

<p>A ideia é antiga: telas reagem a cliques e sistemas corporativos trocam mensagens por filas há muito tempo. A
<b>arquitetura orientada a eventos</b> (em inglês, <i>event-driven architecture</i>, ou EDA) ganhou força junto com os
microsserviços (capítulo 14) e com brokers (intermediários de mensagens) fáceis de usar, como Kafka, RabbitMQ e as filas gerenciadas da nuvem. A divisão
em duas topologias, broker e mediador, que aparece adiante, segue a forma como Mark Richards apresenta o tema
(<i>Software Architecture Patterns</i> e <i>Fundamentals of Software Architecture</i>).</p>

${fig(principal(), "O serviço de Pedidos publica um evento no broker e segue a vida. Cada consumidor recebe sua cópia e reage. Um consumidor novo (tracejado) entra sem ninguém mexer em Pedidos.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Produtor</b>: o serviço onde o fato acontece. Ele grava o próprio dado e publica um evento. Não sabe quem vai ouvir.</li>
<li><b>Evento</b>: um registro de algo que <b>já aconteceu</b>, com nome no passado (<code>PedidoPago</code>), um id único,
a data e os dados do fato. Evento não se altera: se algo mudou depois, é outro evento.</li>
<li><b>Broker</b>: o intermediário que recebe, guarda e entrega as mensagens (Kafka, RabbitMQ, SNS/SQS). Se um consumidor
estiver fora do ar, a mensagem espera por ele.</li>
<li><b>Consumidores</b>: assinam os eventos que interessam e reagem no próprio ritmo, cada um com seu banco e sua lógica.</li>
<li><b>A grande troca</b>: em vez de "Pedidos chama Estoque, depois Nota fiscal, depois E-mail" (e falha se qualquer um
falhar), Pedidos anuncia uma vez e responde ao cliente. As reações acontecem depois, de forma <b>assíncrona</b>.</li>
</ul>

<h4>Evento, comando e mensagem</h4>
<p>Três palavras que se confundem o tempo todo, e a diferença muda o desenho do sistema:</p>
${tabela(
  ["Termo", "O que é", "Nome", "Quem recebe"],
  [
    ["<b>Mensagem</b>", "O pacote que viaja pelo broker: cabeçalhos mais corpo. Pode carregar um comando ou um evento.", "Depende do conteúdo", "Quem estiver na fila ou no tópico"],
    ["<b>Comando</b>", "Um pedido para alguém fazer algo. Pode ser recusado (\"sem estoque\").", "Imperativo: <code>ReservarEstoque</code>", "Um destinatário específico"],
    ["<b>Evento</b>", "Um fato que já aconteceu. Não dá para recusar, só reagir.", "Passado: <code>EstoqueReservado</code>", "Zero, um ou muitos assinantes"],
  ],
)}
<p>Regra de bolso: se quem envia <b>precisa</b> que um serviço específico faça algo, é comando. Se só está contando o que
aconteceu e não se importa com quem vai ouvir, é evento.</p>

<h4>Filas e pub/sub</h4>
<p>Há dois jeitos de entregar. Numa <b>fila</b> (ponto a ponto), cada mensagem vai para um só consumidor: várias instâncias
do mesmo serviço dividem o trabalho (o nome técnico é <i>competing consumers</i>, consumidores concorrentes). No
<b>pub/sub</b> (publicar e assinar), a mensagem vai para um <b>tópico</b> e cada assinante recebe a sua cópia.</p>

${fig(filaXPubsub(), "À esquerda, três mensagens diferentes, uma para cada instância. À direita, a mesma mensagem copiada para três serviços. Na prática os dois se combinam: cada serviço assinante tem sua fila (SNS entregando para filas SQS) ou seu grupo de consumidores (Kafka), e dentro dele as instâncias dividem o trabalho.")}

<h4>Duas topologias: broker e mediador</h4>
<p>Na topologia <b>broker</b>, não há chefe: cada serviço reage a um evento e publica o próximo. É a <b>coreografia</b>.
Na topologia <b>mediador</b>, um componente central recebe o evento inicial e manda comandos, em ordem, para cada etapa.
É a <b>orquestração</b>.</p>

${fig(brokerXMediador(), "Em cima, o fluxo nasce das reações em cadeia. Embaixo, o mediador conhece o roteiro: para saber em que pé está o pedido, basta perguntar a ele.")}

<p>Use <b>broker</b> quando as reações são independentes entre si (e-mail, pontos, analytics): é simples e cada time cuida
do seu. Use <b>mediador</b> quando a ordem importa e uma falha no meio exige desfazer passos anteriores. As sagas
(capítulo 23) tratam desse caso e podem ser feitas nos dois estilos.</p>

<h4>O que vai dentro do evento</h4>
${tabela(
  ["Padrão", "O evento leva", "Você ganha", "Você paga"],
  [
    [
      "<b>Notificação de evento</b>",
      "Só o essencial: tipo e ids (<code>{ pedidoId: \"123\" }</code>).",
      "Eventos pequenos; o dado oficial fica num lugar só.",
      "Quem precisa de detalhes chama a API do produtor; se ela cair, o consumidor para.",
    ],
    [
      "<b>Transferência de estado por evento</b> (<i>event-carried state transfer</i>)",
      "Os dados que os consumidores precisam: itens, valores, endereço.",
      "O consumidor guarda uma cópia local e trabalha mesmo com o produtor fora do ar.",
      "Eventos maiores e cópias espalhadas (cuidado com dados pessoais e LGPD).",
    ],
  ],
)}

<h4>Consistência eventual, sem susto</h4>
<p>Você paga um pedido no app. O serviço de Pedidos grava "pago" e responde na hora: a tela mostra "pagamento aprovado".
Logo depois o evento <code>PedidoPago</code> vai para o broker. Durante alguns milissegundos (ou alguns minutos, se o
Estoque estiver fora do ar), o estoque ainda não baixou e o e-mail ainda não chegou. Os serviços estão
<b>temporariamente</b> diferentes, mas vão concordar assim que todos processarem o evento.</p>
<p>Isso é <b>consistência eventual</b>. A palavra engana: vem do inglês <i>eventually</i>, "no fim, mais cedo ou mais
tarde", e não "de vez em quando". O mundo real já funciona assim: a compra no cartão aparece como "pendente" antes de ser
confirmada. Para conviver com isso, <b>mostre o estado intermediário</b> na tela ("pedido recebido, separando os itens"),
<b>leia de quem gravou</b> (logo depois de pagar, a tela consulta Pedidos, não uma cópia atrasada) e <b>decida o conflito</b>
no negócio: se dois clientes pagarem o último item, quem leva e quem recebe o estorno?</p>

${quando(
  [
    "Uma ação dispara várias reações que não precisam acontecer na hora (e-mail, nota fiscal, pontos, analytics).",
    "Times diferentes precisam reagir aos mesmos fatos sem combinar uma integração nova a cada mudança.",
    "Há picos de carga e você quer que a fila absorva o excesso (Black Friday, venda de ingressos).",
    "Você integra sistemas que às vezes ficam fora do ar (parceiros, ERP, legado) e não quer travar junto.",
    "Você quer um histórico de fatos para alimentar relatórios ou serviços que ainda nem existem (com um broker que guarda o log, como o Kafka).",
  ],
  [
    "O usuário precisa da resposta na hora para continuar: login, autorizar o cartão no checkout, consultar o saldo.",
    "A operação exige consistência forte: debitar uma conta e creditar outra no mesmo banco de dados é uma transação, não dois eventos.",
    "Sistema pequeno, um time e um banco: uma chamada de função resolve com muito menos peças.",
    "Não há monitoramento nem rastreamento: vai ser difícil descobrir onde a mensagem parou.",
    "O fluxo é uma sequência rígida que alguém precisa enxergar inteira: prefira um mediador explícito.",
  ],
)}

${medidor({ complexidade: 3, escala: 5, operacao: 4, aprendizado: 4, time: "brilha com vários times; dentro de um monólito, eventos internos já ajudam" })}

<h3>Como usar na prática</h3>
<h4>Entrega "pelo menos uma vez": prepare-se para repetidas</h4>
<p><b>No máximo uma vez</b> (<i>at-most-once</i>) nunca repete, mas pode perder. <b>Pelo menos uma vez</b>
(<i>at-least-once</i>) não perde, mas pode entregar duas vezes: o consumidor processa e cai antes de confirmar, ou o
produtor reenvia porque não recebeu a confirmação. É a garantia mais comum. <b>Exatamente uma vez</b> (<i>exactly-once</i>) existe só em parte: o Kafka garante isso para
quem lê de um tópico e escreve em outro dentro do próprio Kafka, mas o e-mail que seu código enviou não tem como ser "desenviado".</p>
<p>A saída é o consumidor <b>idempotente</b>: processar a mesma mensagem duas vezes tem o mesmo efeito que processar uma.
Guarde o id de cada evento já processado (na mesma transação do efeito), prefira operações idempotentes por natureza
(<code>status = 'PAGO'</code> pode rodar duas vezes, <code>saldo = saldo + 10</code> não) e mande chave de idempotência
para APIs externas que aceitam (a Stripe, por exemplo, aceita o cabeçalho <code>Idempotency-Key</code>).</p>

<h4>Ordem</h4>
<p>Não existe ordem global de graça. No Kafka, a ordem vale <b>dentro de uma partição</b>: publique com a chave
<code>pedidoId</code> e os eventos do mesmo pedido chegam em sequência (entre pedidos diferentes não há ordem, e quase
nunca precisa). Dentro de um grupo de consumidores, cada partição é lida por uma instância só: o número de partições limita o paralelismo. No RabbitMQ, vários consumidores na mesma fila ou uma reentrega embaralham o processamento; no SQS, só a
fila FIFO garante ordem. Defesa extra: ponha no evento um número de sequência do pedido (1, 2, 3...) e ignore os que forem
mais velhos que o estado atual (um <code>PedidoPago</code> atrasado não pode "ressuscitar" um pedido cancelado).</p>

<h4>Outbox: não perder o evento</h4>
<p>Gravar no banco e depois publicar no broker são <b>duas escritas</b>. Se o processo cai entre elas, o banco diz "pago" e
ninguém fica sabendo. O padrão <b>outbox</b> resolve: o evento vai para uma tabela <code>outbox</code> na mesma transação
do dado, e um publicador separado envia depois. Outra opção é o CDC (<i>change data capture</i>), que lê as mudanças no
log do banco com ferramentas como o Debezium (de preferência lendo a própria tabela outbox, para não expor o formato
das suas tabelas). O capítulo 23 mostra o desenho completo.</p>

<h4>Evolução de esquema</h4>
<p>O evento publicado é uma <b>API pública</b>: você não sabe quem depende dele. Adicionar um campo <b>opcional</b> é
seguro; remover, renomear ou mudar o tipo quebra alguém. Escreva consumidores <b>tolerantes</b>, que ignoram campos
desconhecidos. Para uma mudança que quebra, publique a versão nova em paralelo (<code>versao: 2</code> ou outro tópico),
migre os consumidores e só então desligue a antiga. Um <i>schema registry</i> (registro de esquemas, como o da Confluent, com Avro, Protobuf ou
JSON Schema) recusa um esquema novo que quebre a regra de compatibilidade escolhida; dá para checar isso no CI, antes do deploy.</p>

<h4>Escolhendo o broker</h4>
${tabela(
  ["Broker", "Como funciona", "Depois de lida", "Ordem", "Bom para"],
  [
    ["<b>Kafka</b>", "Log em partições; cada grupo guarda até onde leu (<i>offset</i>)", "Fica pelo tempo de retenção: dá para reler", "Por partição (use uma chave)", "Alto volume, muitos consumidores, reprocessar histórico"],
    ["<b>RabbitMQ</b>", "<i>Exchanges</i> roteiam para filas por regras (direct, topic, fanout)", "Sai da fila quando confirmada (<i>ack</i>)", "Na fila, com um consumidor só", "Filas de tarefas, roteamento flexível"],
    ["<b>SNS + SQS</b> (AWS)", "SNS é o tópico que copia; SQS é a fila de cada assinante", "O consumidor apaga ao processar; se não apagar, ela volta (fica no máximo 14 dias)", "Padrão: sem garantia; FIFO: por grupo", "Quem está na AWS e não quer operar broker"],
  ],
)}
<p>Operar um cluster Kafka dá trabalho; versões gerenciadas (Amazon MSK, Confluent Cloud) tiram boa parte do peso. Em outras
nuvens, os equivalentes são o Pub/Sub (Google Cloud) e o Service Bus e o Event Hubs (Azure).</p>

${pastas(`
contratos/                          # pacote compartilhado (ou schema registry)
└── pedido-pago.ts                  # envelope + dados do evento
servico-pedidos/
├── src/pagar-pedido.ts             # muda o dado + grava na outbox
├── src/outbox/publicador.ts        # envia a outbox para o broker
└── migrations/                     # tabelas pedidos e outbox
servico-estoque/
├── src/consumidores/pedido-pago.ts # reage ao evento (idempotente)
└── migrations/                     # estoque e mensagens_processadas
`)}

${codigo(
  `
// envelope igual para todo evento: o id detecta repetidas; a versão muda se o contrato quebrar
export interface Evento<T> {
  id: string; tipo: string; versao: number; ocorridoEm: string; dados: T;
}
export interface PedidoPagoV1 {
  pedidoId: string;
  clienteId: string;
  total: number;                                // em centavos
  itens: { sku: string; quantidade: number }[]; // leva o estado: Estoque não pergunta nada
  cupom?: string;                               // campo novo e opcional: não quebra ninguém
}`,
  "contratos/pedido-pago.ts",
)}

${codigo(
  `
// pagar-pedido.ts: o dado e o evento na MESMA transação (ou grava os dois, ou nenhum)
export async function pagarPedido(pedidoId: string) {
  await db.tx(async (t) => {
    const p = await t.one( // as colunas chegam como no banco (cliente_id)
      "update pedidos set status = 'PAGO' where id = $1 returning *", [pedidoId]);
    const evento: Evento<PedidoPagoV1> = {
      id: randomUUID(), tipo: "PedidoPago", versao: 1, ocorridoEm: new Date().toISOString(),
      dados: { pedidoId, clienteId: p.cliente_id, total: p.total, itens: p.itens },
    };
    await t.none("insert into outbox (id, topico, chave, conteudo) values ($1, $2, $3, $4)",
      [evento.id, "pedidos", pedidoId, JSON.stringify(evento)]);
  });
}

// outbox/publicador.ts: chamado em loop (a cada segundo, por exemplo)
export async function publicarPendentes() {
  const pendentes = await db.any<LinhaOutbox>(
    "select * from outbox where enviado_em is null order by criado_em limit 100");
  for (const linha of pendentes) {
    const msg = { key: linha.chave, value: linha.conteudo }; // mesma chave = mesma partição
    await producer.send({ topic: linha.topico, messages: [msg] });
    // se cair aqui, a linha sai de novo na próxima rodada: chega uma repetida
    await db.none("update outbox set enviado_em = now() where id = $1", [linha.id]);
  }
}`,
  "servico-pedidos: publicar pela outbox (pg-promise + kafkajs)",
)}

${codigo(
  `
const consumer = kafka.consumer({ groupId: "estoque" }); // um grupo por serviço = uma cópia
await consumer.connect();
await consumer.subscribe({ topics: ["pedidos"] });
await consumer.run({
  eachMessage: async ({ message }) => {
    const evento = JSON.parse(message.value!.toString()) as Evento<PedidoPagoV1>;
    if (evento.tipo !== "PedidoPago") return; // o tópico tem outros tipos: ignore
    await db.tx(async (t) => {
      const r = await t.result( // 1) marca como processada
        "insert into mensagens_processadas (id) values ($1) on conflict do nothing", [evento.id]);
      if (r.rowCount === 0) return; // o id já existia: é repetida, não faz nada
      for (const item of evento.dados.itens) { // 2) o efeito, na MESMA transação da marca
        await t.none("update estoque set reservado = reservado + $1 where sku = $2",
          [item.quantidade, item.sku]);
      }
    });
  }, // se der erro, o offset não avança e a mensagem volta (por isso marca e efeito andam juntos)
});`,
  "servico-estoque/src/consumidores/pedido-pago.ts",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Escolha um fluxo que hoje faz várias chamadas em sequência e cujas reações podem esperar alguns segundos (e-mail, nota fiscal, pontos).",
  "Nomeie os eventos no passado e com palavras do negócio (<code>PedidoPago</code>, não <code>PedidoAtualizado</code>). Escreva o contrato e trate como API pública.",
  "Publique pela outbox, na mesma transação da mudança, e escolha a chave de ordenação (geralmente o id da entidade).",
  "Faça cada consumidor idempotente. Configure retentativas com espera crescente e uma <b>fila de mensagens mortas</b> (<i>dead-letter queue</i>, DLQ) para o que falhar várias vezes.",
  "Coloque um id de correlação em todo evento (o mesmo id acompanha o fluxo de serviço em serviço) e monitore o atraso (<i>lag</i>) de cada consumidor: é ele que avisa que algo travou. Só depois do primeiro fluxo estável, leve a ideia para os próximos.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Quem publica não conhece quem consome: somar uma reação não mexe no produtor", "O fluxo fica espalhado: ninguém vê o processo inteiro num lugar só"],
    ["Um consumidor fora do ar não derruba o produtor; as mensagens esperam", "Consistência eventual: por um tempo, os serviços discordam"],
    ["Picos viram fila, e cada consumidor processa no seu ritmo", "Mais infraestrutura: o broker vira peça crítica (precisa de réplicas), mais DLQ e monitoramento de atraso"],
    ["Cada consumidor escala separado; os fatos alimentam analytics e serviços novos", "Repetidas, ordem, contratos e depuração distribuída viram problema seu"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Comando disfarçado de evento</b>: <code>EnviarEmailDeBoasVindas</code> publicado num tópico. Quem publica está
mandando, não contando. Publique <code>ClienteCadastrado</code> e deixe o serviço de e-mail decidir.</li>
<li><b>Consumidor sem idempotência</b>: a mensagem chega duas vezes e o cliente é cobrado duas vezes.</li>
<li><b>Escrita dupla</b>: grava no banco e publica no broker sem outbox. Um dia o evento some.</li>
<li><b>Mensagem envenenada</b> (<i>poison message</i>): um evento com defeito falha sempre, volta para a fila e pode travar
os que vêm atrás dele. Limite as tentativas e mande para a DLQ.</li>
<li><b>Pedir resposta por evento</b>: publicar <code>ConsultarSaldo</code> e esperar a resposta numa fila de retorno
costuma ser uma chamada síncrona disfarçada. Precisa dela agora? Chame a API (capítulo 18).</li>
<li><b>Evento que espelha a tabela</b>: um <code>PedidoAtualizado</code> com todas as colunas amarra os consumidores ao
seu banco. Publique o fato do negócio, com os dados que importam.</li>
<li><b>Fliperama de eventos</b> (<i>event pinball</i>): A publica, B reage e publica, C reage e publica... ninguém sabe mais explicar o fluxo.
Quando a cadeia passa de três ou quatro saltos e tem regras de falha, troque por um mediador.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine um app de delivery. Quando o restaurante aceita o pedido, Pedidos publica <code>PedidoAceito</code> e cinco consumidores reagem: push para o cliente, busca de entregador, previsão de entrega, painel do restaurante e analytics. Numa sexta à noite, o serviço de push cai por dez minutos. Com chamadas em sequência, o restaurante não conseguiria aceitar pedidos. Com eventos, as mensagens esperam no broker e são processadas quando o push volta: o cliente é avisado depois e nenhum pedido se perde.</p>",
)}

${dica(
  "Comece sem broker",
  "<p>Num monólito modular (capítulo 12), Pagamentos pode publicar <code>PagamentoAprovado</code> num barramento em memória e os outros módulos reagem. Você aprende a pensar em fatos sem operar Kafka; quando um módulo virar serviço, muda o transporte.</p>",
)}

${alerta(
  "Orientada a eventos não é Event Sourcing",
  "<p>Aqui, eventos servem para <b>serviços conversarem</b>. No Event Sourcing (capítulo 22), eventos são o <b>jeito de guardar o estado</b> dentro de um serviço. E CQRS (capítulo 21) é separar escrita de leitura. Os três combinam bem, mas dá para usar qualquer um sozinho.</p>",
)}

${combina([
  [14, "Microsserviços", "comunicação assíncrona"],
  [23, "Sagas", "transações longas entre serviços"],
  [12, "Monólito modular", "eventos entre módulos"],
  [21, "CQRS", "eventos atualizam a leitura"],
  [22, "Event Sourcing", "eventos guardam o estado"],
  [15, "Serverless", "funções disparadas por filas"],
])}

${lembre([
  "Evento é um fato no passado que quem publica anuncia sem saber quem escuta; comando é uma ordem para alguém específico.",
  "Conte com a entrega \"pelo menos uma vez\": outbox para não perder, consumidor idempotente para não repetir, chave para manter a ordem.",
  "Use para reações que podem esperar; quando a resposta precisa ser imediata e consistente, faça uma chamada direta ou uma transação.",
])}
`;
