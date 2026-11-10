// Capítulo 14 — Microsserviços. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, fila, linha, navegador, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

/** Diagrama 1: visão geral (clientes → gateway → serviços, cada um com seu banco, e o broker de eventos). */
function diagramaGeral() {
  semear("microsservicos-1");
  let s = "";
  s += navegador(215, 12, 130, 80, "site");
  s += navegador(415, 12, 130, 80, "app");
  s += seta(280, 94, 280, 124, { cor: cor.azul, espessura: 2 });
  s += seta(480, 94, 480, 124, { cor: cor.azul, espessura: 2 });
  s += bloco(60, 128, 640, 48, "API Gateway: autenticação, rotas, limite de chamadas", { preench: claro.amarelo, tam: 16 });
  const servicos = [
    ["Catálogo", "Mongo"],
    ["Pedidos", "Postgres"],
    ["Pagamentos", "Postgres"],
    ["Entregas", "MySQL"],
  ];
  servicos.forEach(([nome, bd], i) => {
    const x = 22 + i * 185;
    s += ret(x - 8, 208, 166, 180, { tracejado: true, cor: cor.cinza, espessura: 1.3 });
    s += seta(x + 75, 178, x + 75, 220, { espessura: 1.8 });
    s += bloco(x, 222, 150, 54, nome, { preench: claro.azul, tam: 17 });
    s += linha([[x + 60, 276], [x + 60, 299]], { espessura: 1.6 });
    s += banco(x + 20, 298, 80, 60, bd, { preench: claro.violeta, tam: 15 });
    s += txt(x + 60, 374, `time ${"ABCD"[i]}`, { tam: 15, cor: cor.cinza });
  });
  // eventos: Pedidos publica, Pagamentos publica e consome, Entregas consome
  s += seta(335, 278, 335, 397, { cor: cor.laranja, tracejado: true, espessura: 2 });
  s += seta(520, 280, 520, 395, { cor: cor.laranja, tracejado: true, espessura: 2, duplo: true });
  s += seta(705, 397, 705, 280, { cor: cor.laranja, tracejado: true, espessura: 2 });
  s += bloco(22, 400, 705, 40, "broker de eventos (ex.: Kafka, RabbitMQ)", { preench: claro.laranja, tam: 16 });
  return quadro(760, 452, s);
}

/** Diagrama 2: comunicação síncrona (cadeia) x assíncrona (evento numa fila). */
function diagramaComunicacao() {
  semear("microsservicos-2");
  let s = "";
  s += linha([[380, 14], [380, 304]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  // esquerda: síncrono
  s += txt(190, 22, "síncrono: pede e espera", { tam: 18, cor: cor.azul });
  const cadeia = [
    ["Pedidos", 46, claro.azul],
    ["Pagamentos", 128, claro.azul],
    ["Antifraude", 210, claro.vermelho],
  ];
  for (const [nome, y, c] of cadeia) s += bloco(100, y, 160, 50, nome, { preench: c, tam: 17 });
  for (const y of [96, 178]) {
    s += seta(160, y + 2, 160, y + 30, { cor: cor.azul, espessura: 2 });
    s += seta(200, y + 30, 200, y + 3, { cor: cor.cinza, tracejado: true, espessura: 1.6 });
    s += txt(214, y + 18, "espera...", { tam: 15, cor: cor.cinza, ancora: "start" });
  }
  s += xis(78, 235, 22);
  s += txt(190, 296, "Antifraude caiu? o pedido inteiro falha", { tam: 15, cor: cor.vermelho });
  // direita: assíncrono
  s += txt(570, 22, "assíncrono: avisa e segue", { tam: 18, cor: cor.laranja });
  s += bloco(495, 44, 150, 50, "Pedidos", { preench: claro.azul, tam: 17 });
  s += seta(570, 96, 570, 122, { cor: cor.laranja, espessura: 2 });
  s += txt(584, 112, "publica PedidoCriado", { tam: 15, cor: cor.laranja, ancora: "start" });
  s += fila(470, 126, 200, 36, "");
  const consumidores = [
    ["Estoque", 408, claro.verde],
    ["E-mail", 518, claro.verde],
    ["Entregas", 628, claro.cinza],
  ];
  for (const [nome, x, c] of consumidores) {
    s += bloco(x, 200, 104, 48, nome, { preench: c, tam: 16, tracejado: nome === "Entregas" });
    s += seta(570 + (x + 52 - 570) * 0.15, 165, x + 52, 198, { cor: cor.laranja, espessura: 1.8 });
  }
  s += txt(570, 274, "Entregas caiu? o evento espera na fila", { tam: 15, cor: cor.verde });
  s += txt(570, 296, "e Pedidos já respondeu ao cliente", { tam: 15, cor: cor.verde });
  return quadro(760, 312, s);
}

/** Diagrama 3: os estados do circuit breaker (disjuntor). */
function diagramaDisjuntor() {
  semear("microsservicos-3");
  let s = "";
  const estado = (x, y, nome, sub, c) =>
    bloco(x, y, 210, 80, nome, { preench: c, hachura: "solid", topo: true, tam: 19 }) + txt(x + 105, y + 56, sub, { tam: 16 });
  s += estado(30, 40, "fechado", "as chamadas passam", claro.verde);
  s += estado(520, 40, "aberto", "devolve erro na hora", claro.vermelho);
  s += estado(275, 232, "meio-aberto", "deixa passar um teste", claro.amarelo);
  s += seta(244, 80, 516, 80, { espessura: 2, rotulo: "falhas passaram do limite", dy: -16 });
  s += seta(560, 124, 455, 228, { espessura: 2, rotulo: "passou o tempo\nde espera", dx: -24, dy: 0, ancora: "end" });
  s += seta(488, 270, 690, 124, { espessura: 2, cor: cor.vermelho, rotulo: "teste falhou", dx: 26, dy: 6, ancora: "start" });
  s += seta(290, 228, 180, 124, { espessura: 2, cor: cor.verde, rotulo: "teste deu certo", dx: -24, dy: 0, ancora: "end" });
  return quadro(760, 330, s);
}

/** Diagrama 4: o monólito distribuído (o que evitar). */
function diagramaMonolitoDistribuido() {
  semear("microsservicos-4");
  let s = "";
  s += txt(380, 26, "chamadas síncronas em cadeia: se um cai, todos sentem", { tam: 16, cor: cor.laranja });
  ["Pedidos", "Estoque", "Pagamentos", "Entregas"].forEach((nome, i) => {
    s += bloco(40 + i * 180, 60, 140, 52, nome, { preench: claro.azul, tam: 17 });
  });
  for (let i = 0; i < 3; i++) s += seta(184 + i * 180, 86, 216 + i * 180, 86, { duplo: true, cor: cor.laranja, espessura: 2, ponta: 10 });
  s += banco(270, 220, 220, 96, "banco único", { preench: claro.vermelho, tam: 17 });
  s += seta(110, 116, 288, 234, { cor: cor.vermelho, espessura: 1.8 });
  s += seta(290, 116, 345, 226, { cor: cor.vermelho, espessura: 1.8 });
  s += seta(470, 116, 415, 226, { cor: cor.vermelho, espessura: 1.8 });
  s += seta(650, 116, 472, 234, { cor: cor.vermelho, espessura: 1.8 });
  s += txt(140, 270, "todos leem e escrevem\nnas mesmas tabelas", { tam: 15, cor: cor.vermelho });
  s += txt(620, 270, "mudou uma coluna?\ndeploy de todos juntos", { tam: 15, cor: cor.vermelho });
  s += txt(380, 360, "separado no deploy, grudado nos dados: o pior dos dois mundos", { tam: 17, cor: cor.vermelho });
  return quadro(760, 385, s);
}

export default `
${resumo(
  "O sistema vira um conjunto de serviços pequenos e independentes. Cada um cuida de uma parte do negócio, tem <b>seus próprios dados</b>, vai para o ar <b>sozinho</b> e conversa com os outros <b>pela rede</b>.",
  "Uma praça de alimentação no lugar de um restaurante gigante. Cada loja tem cozinha, estoque e equipe próprios, abre e reforma sem pedir licença às vizinhas, e se a pizzaria fecha o japonês continua vendendo. O preço: para montar um combo com itens de três lojas, alguém precisa coordenar.",
)}

<p>O termo ficou popular com o artigo <i>Microservices</i>, de James Lewis e Martin Fowler, em 2014. A ideia de dividir o
sistema em serviços já existia na SOA (capítulo 13); a diferença está no tamanho, na independência e em quem manda nos
dados: em vez de serviços grandes ligados por um barramento central cheio de regras, serviços pequenos, cada um com dono,
banco e deploy próprios, ligados por canais simples.</p>

${fig(diagramaGeral(), "Visão geral: os clientes entram por um API Gateway; cada serviço tem seu banco e seu time. Setas cheias: chamadas síncronas. Setas laranja tracejadas: eventos pelo broker.", "grande")}

<h3>Como funciona</h3>
<p>Lewis e Fowler não definiram microsserviços por uma regra única, mas por características: serviços como peças
que se trocam sozinhas, organização por <b>capacidade de negócio</b>, times que cuidam do que constroem em produção
("produtos, não projetos"), <b>pontas inteligentes e canos burros</b> (a regra fica nos serviços; a rede só transporta),
governança e dados descentralizados, automação de infraestrutura, projeto para a falha e design evolutivo. Na prática,
três ideias seguram todo o resto:</p>
<ul>
<li><b>Um serviço por capacidade de negócio.</b> A fronteira certa costuma ser um <b>contexto delimitado</b> (<i>bounded
context</i>, do Domain-Driven Design): um pedaço do negócio onde cada palavra tem um significado só. "Produto" no catálogo
tem foto e descrição; no estoque, tem quantidade e prateleira. São dois modelos, em dois serviços.</li>
<li><b>Banco por serviço.</b> Só o serviço de pedidos lê e grava as tabelas de pedidos. Quem precisa desses dados pede pela
API ou escuta os eventos. Não precisa ser um servidor por serviço: um schema que só aquele serviço acessa já cumpre a
regra. Um relatório que cruza pedidos e clientes vira uma composição de chamadas ou uma visão de leitura alimentada
por eventos (capítulo 21).</li>
<li><b>Deploy independente.</b> O time de pagamentos publica numa terça às 15h sem combinar com ninguém. Se publicar um
serviço exige publicar outros três juntos, a independência é só no nome.</li>
</ul>

<h4>Como os serviços conversam</h4>
<p><b>Síncrono</b>: um serviço chama o outro e espera a resposta. O mais comum é <b>REST</b> (HTTP com JSON). Entre
serviços internos, muitos times usam <b>gRPC</b>: roda sobre HTTP/2, usa Protocol Buffers (formato binário com contrato
tipado) e costuma ser mais rápido. Use quando precisa da resposta <b>agora</b>: o preço do frete, se o cartão passou.</p>
<p><b>Assíncrono</b>: o serviço publica um <b>evento</b> ("pedido criado") num <i>broker</i> (intermediário de mensagens, como Kafka, RabbitMQ ou SQS) e segue a vida;
quem tiver interesse consome quando puder, e quem publica nem sabe quem escuta. Use para avisar que algo aconteceu: mandar
e-mail, emitir nota fiscal, separar no estoque (capítulo 20).</p>

${fig(diagramaComunicacao(), "Na chamada síncrona, a lentidão e a falha de um serviço sobem pela cadeia. No evento, a fila absorve o problema: o consumidor processa quando voltar.")}

<h4>API Gateway e BFF</h4>
<p>O cliente não deveria conhecer 30 endereços internos. O <b>API Gateway</b> é a porta única de entrada: encaminha
<code>/pedidos</code> para o serviço certo, confere o login, aplica limite de requisições (<i>rate limiting</i>) e cuida do
HTTPS (ex.: Kong, Amazon API Gateway, NGINX, Envoy). O <b>BFF</b> (<i>Backend for Frontend</i>) é um backend por tipo de
cliente, mantido pelo time daquela tela: o BFF do app junta numa resposta só o que viria de cinco serviços, para o celular
no 4G não fazer cinco viagens. Cuidado para o gateway não acumular regra de negócio e virar o barramento da SOA de novo.</p>

<h4>Descoberta de serviço</h4>
<p>Instâncias sobem, caem e mudam de endereço o tempo todo (deploy, autoescala). A <b>descoberta de serviço</b> responde
"onde está o serviço de pagamentos agora?". Ou cada instância se anuncia num <b>registro</b> que os clientes consultam
(Consul, Eureka), ou a <b>plataforma resolve</b>: no Kubernetes, o nome <code>http://pagamentos</code> vira um endereço
estável que distribui as chamadas entre as réplicas.</p>

<h4>Resiliência: projetar para a falha</h4>
<p>Num monólito, chamar uma função não falha por causa da rede. Entre serviços, falha. Quatro defesas básicas:</p>
<ul>
<li><b>Timeout</b>: toda chamada tem prazo. Sem ele, conexões ficam presas num serviço lento e a lentidão se espalha.</li>
<li><b>Retry com backoff</b>: repetir a chamada só quando o erro é temporário (timeout, 5xx, 429 "muitas requisições"), esperando cada vez mais (200 ms, 400 ms,
800 ms...) com um sorteio (<i>jitter</i>) para os clientes não voltarem todos juntos. Só repita operações
<b>idempotentes</b> (rodar duas vezes não duplica o efeito) ou use uma chave de idempotência.</li>
<li><b>Circuit breaker</b> (disjuntor): quando as falhas passam de um limite (por exemplo, metade das chamadas nos últimos
10 segundos), ele "abre" e as chamadas falham na hora, sem bater no serviço doente, que ganha tempo para se recuperar.
Depois de uma espera, deixa passar uma ou poucas chamadas de teste.</li>
<li><b>Bulkhead</b> (as divisórias estanques do casco de um navio: um compartimento inunda, o navio não afunda): um <i>pool</i> (conjunto reservado) de conexões para o frete, outro para o pagamento. Se o
frete travar, esgota só o próprio pool e o checkout segue.</li>
</ul>
<p>Tenha um <b>fallback</b> (plano B): se as recomendações do streaming caírem, mostre os mais vistos em vez de uma tela de
erro. O circuit breaker e o bulkhead ficaram conhecidos pelo livro <i>Release It!</i>, de Michael Nygard. No código, use uma biblioteca
(como cockatiel ou opossum, em Node) em vez de reinventar.</p>

${fig(diagramaDisjuntor(), "Os três estados do circuit breaker. Aberto, ele protege o serviço doente e quem chama; meio-aberto, testa se já dá para voltar.")}

<h4>Observabilidade</h4>
<p>Uma compra passa por seis serviços e demora 4 segundos. Onde está a lentidão? Três pilares respondem:</p>
<ul>
<li><b>Logs estruturados</b> (em JSON), todos com o mesmo identificador da requisição, para filtrar a jornada inteira.</li>
<li><b>Métricas</b> por serviço: quantas requisições, quantos erros e quanto tempo. Olhe as mais lentas, não só a média: o p99 é o tempo que 99% das requisições
não ultrapassam.</li>
<li><b>Tracing distribuído</b>: cada requisição ganha um <i>trace id</i> que viaja nos cabeçalhos (no padrão W3C, o
<code>traceparent</code>) e cada serviço registra um trecho (<i>span</i>). Sai uma linha do tempo mostrando onde foram os
4 segundos. O OpenTelemetry é o padrão aberto para coletar; Jaeger, Zipkin e Grafana Tempo mostram os traces.</li>
</ul>

<h4>Deploy: contêineres, Kubernetes e service mesh</h4>
<p>Cada serviço vira uma <b>imagem de contêiner</b> (Docker). O <b>Kubernetes</b> mantém o número certo de réplicas, reinicia
as que caem, troca versões aos poucos (<i>rolling update</i>) e dá a descoberta por nome. Com muitos serviços, alguns times
adotam um <b>service mesh</b> (Istio, Linkerd): em geral, um proxy ao lado de cada serviço (o <i>sidecar</i>) que cuida de
criptografia entre serviços (mTLS), retries, timeouts e métricas sem mudar o código. O gateway cuida do tráfego que entra
de fora; o mesh, do tráfego entre os serviços. É mais uma peça complexa: só vale quando a quantidade de serviços justifica.</p>

<h4>Consistência entre serviços</h4>
<p>Com um banco por serviço, nenhuma transação cobre pedido, pagamento e estoque ao mesmo tempo. A saída é a
<b>consistência eventual</b>: cada serviço confirma a sua parte e avisa os outros por eventos; por alguns segundos, o pedido
pode estar "aguardando pagamento" num lugar e "pago" em outro. Se um passo falha, uma <b>saga</b> desfaz os anteriores com
compensações (estornar, devolver ao estoque), como mostra o capítulo 23. E cuidado com a escrita dupla: se o serviço grava
o pedido e cai antes de publicar o evento, o evento se perde. O padrão <b>outbox</b> resolve isso (no código abaixo).</p>

${quando(
  [
    "Vários times esbarram uns nos outros no mesmo deploy e precisam publicar com autonomia.",
    "Partes com necessidades de escala muito diferentes: a busca recebe muito mais tráfego do que o checkout.",
    "O domínio é estável e bem entendido: as fronteiras entre as partes não mudam todo mês.",
    "Uma parte tem exigências próprias de segurança (pagamentos sob as regras do PCI DSS, isolados do resto).",
  ],
  [
    "Time pequeno (um ou dois times): o custo de operar engole o ganho de autonomia.",
    "Domínio ainda incerto (produto novo procurando mercado): fronteira errada entre serviços é cara de mover.",
    "Ainda não há deploy automatizado, monitoramento e plantão funcionando.",
    "O problema real é código bagunçado: distribuir não conserta acoplamento (capítulo 31).",
    "O motivo é \"a Netflix usa\" ou \"fica bonito no currículo\".",
  ],
)}

${medidor({ complexidade: 5, escala: 5, operacao: 5, aprendizado: 4, time: "vários times autônomos; com um time só, quase nunca compensa" })}

<h3>Como usar na prática</h3>
<p>Uma loja com três serviços num <i>monorepo</i> (todos num repositório só; um repositório por serviço também serve). O que importa: cada serviço com build,
banco e deploy próprios.</p>
${pastas(`
loja/
├── servicos/
│   ├── pedidos/
│   │   ├── src/
│   │   │   ├── api/                 # rotas HTTP (contrato em openapi.yaml)
│   │   │   ├── dominio/             # regras (pode ser hexagonal, capítulo 6)
│   │   │   ├── clientes/            # chamadas a outros serviços
│   │   │   └── eventos/             # publica e consome eventos
│   │   └── migrations/              # o banco é só dele
│   ├── pagamentos/                  # mesma estrutura, outro time
│   └── estoque/
├── contratos/                       # esquemas dos eventos, versionados
└── infra/                           # Kubernetes e pipelines de deploy
`)}

${codigo(
  `
// Chamada síncrona com timeout, retry com backoff e chave de idempotência
class ErroDefinitivo extends Error {}
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function cobrar(pedidoId: string, valor: number) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const resp = await fetch("http://pagamentos:8080/cobrancas", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": \`cobranca-\${pedidoId}\`, // repetir não cobra duas vezes
        },
        body: JSON.stringify({ pedidoId, valor }),
        signal: AbortSignal.timeout(2000), // nunca espere para sempre
      });
      if (resp.ok) return (await resp.json()) as { cobrancaId: string };
      // 4xx é erro de quem pediu: repetir não ajuda (exceto 429, "muitas requisições")
      if (resp.status < 500 && resp.status !== 429)
        throw new ErroDefinitivo(\`recusado: \${resp.status}\`);
      throw new Error(\`temporário: \${resp.status}\`); // 5xx ou 429: tenta de novo
    } catch (erro) {
      if (erro instanceof ErroDefinitivo || tentativa === 3) throw erro;
      await esperar(200 * 2 ** (tentativa - 1) + Math.random() * 100); // ~200 ms, ~400 ms
    }
  }
}`,
  "servicos/pedidos/src/clientes/pagamentos.ts",
)}

${codigo(
  `
// 1) Pedido e evento na MESMA transação (padrão outbox): grava os dois ou nenhum
await emTransacao(db, async (tx) => {
  await tx.query("insert into pedidos (id, cliente_id, total) values ($1, $2, $3)",
    [pedido.id, pedido.clienteId, pedido.total]);
  await tx.query("insert into outbox (id, tipo, payload) values ($1, $2, $3)",
    [randomUUID(), "PedidoCriado", { pedidoId: pedido.id, itens: pedido.itens }]);
});

// 2) Um processo separado lê a outbox e publica no Kafka (biblioteca kafkajs)
const { rows } = await db.query(
  "select * from outbox where publicado_em is null order by criado_em limit 100");
for (const ev of rows) {
  await producer.send({ topic: "pedidos", messages: [{
    key: ev.payload.pedidoId, value: JSON.stringify(ev.payload),
    headers: { tipo: ev.tipo, "evento-id": ev.id } }] });
  await db.query("update outbox set publicado_em = now() where id = $1", [ev.id]);
}`,
  "servicos/pedidos/src/eventos",
)}

<p>Repare no que acontece se o publicador cair entre o <code>send</code> e o <code>update</code>: o evento sai de novo na
próxima rodada. Isso é a entrega "pelo menos uma vez" (<i>at-least-once</i>), e por isso quem consome precisa aguentar
duplicatas. No estoque, o consumidor grava o <code>evento-id</code> numa tabela de eventos já processados, na mesma transação
em que reserva os itens, e ignora os ids repetidos. Outra opção para publicar: ler o log do banco com <i>change data
capture</i> (ex.: Debezium).</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Comece pelo monólito modular (capítulo 12): acerte as fronteiras antes de pôr a rede no meio.",
  "Escolha o primeiro serviço por um motivo concreto (escala, time dedicado, ritmo de deploy) e com poucas dependências.",
  "Defina o contrato antes do código: OpenAPI para a API, um esquema versionado para cada evento.",
  "Mova os dados: as tabelas passam a ser só do serviço novo. Os outros pedem pela API ou escutam eventos; ninguém lê o banco alheio.",
  "Antes de ir para produção: pipeline próprio, health check, logs estruturados, métricas e tracing.",
  "Desvie o tráfego aos poucos (strangler fig, capítulo 30), apague o código antigo e só extraia o próximo serviço quando surgir outro motivo concreto.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Deploy independente: cada time publica quando quiser", "Muito mais peças para operar: pipelines, monitoramento, plantão"],
    ["Escala só a parte que precisa (mais réplicas da busca, não do sistema todo)", "Rede no meio: latência, falhas parciais, timeouts"],
    ["Falha isolada: se as recomendações caem, o checkout segue", "Consistência eventual e sagas no lugar de transações"],
    ["Times autônomos, com dono claro e liberdade de tecnologia", "Testar e depurar o fluxo inteiro exige contratos e tracing"],
  ],
)}

<h3>Erros comuns</h3>
<p>Quase todos os erros levam ao mesmo lugar: o <b>monólito distribuído</b>. Os serviços estão separados no deploy, mas
grudados no código e nos dados.</p>

${fig(diagramaMonolitoDistribuido(), "O monólito distribuído: banco compartilhado, chamadas em cadeia e deploy em conjunto. Tem todos os custos dos microsserviços e nenhuma das vantagens.")}

<ul>
<li><b>Banco compartilhado</b>: dois serviços lendo as mesmas tabelas. Uma coluna renomeada quebra os dois, e eles nunca mais
publicam separados.</li>
<li><b>Cadeias síncronas longas</b>: uma requisição que atravessa cinco serviços em sequência. Se cada um tem 99,9% de
disponibilidade, a cadeia fica com cerca de 99,5% (0,999 elevado a 5): de 8,8 horas fora por ano, você vai
para quase 44. Prefira eventos, ou guarde uma cópia local (atualizada por eventos) dos dados que consulta toda hora.</li>
<li><b>Serviços pequenos demais</b>: um serviço por tabela ("serviço de endereços", "serviço de clientes" que só faz CRUD).
Toda funcionalidade nova mexe em quatro serviços. "Micro" não se mede em linhas: um bom serviço cabe na cabeça de um time
e muda por um motivo de negócio.</li>
<li><b>Biblioteca compartilhada com regra de negócio</b>: mudar a regra obriga todos a publicar juntos. Compartilhe só
utilitários técnicos (log, autenticação).</li>
<li><b>Retry sem timeout, backoff e idempotência</b>: quando um serviço engasga, todos repetem ao mesmo tempo e derrubam o que
estava se recuperando; e ainda cobram o cliente duas vezes. Evite também retry em todas as camadas: 3 tentativas em cada
um de 3 níveis viram até 27 chamadas no último.</li>
<li><b>Quebrar o contrato sem aviso</b>: renomear um campo da API ou do evento derruba quem consome. Só adicione campos ou
crie uma versão nova. Testes de contrato (como os do Pact) pegam a quebra antes do deploy.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>A <b>Netflix</b> é o exemplo mais citado. A empresa contou no blog de engenharia que levou anos migrando de uma aplicação monolítica no próprio data center para centenas de microsserviços na nuvem da AWS. Pelo caminho, abriu o código de várias peças que nasceram da necessidade: <b>Eureka</b> (descoberta de serviço), <b>Zuul</b> (gateway) e <b>Hystrix</b> (circuit breaker, hoje em modo de manutenção). Também ficou famosa por derrubar servidores de propósito em produção com o <b>Chaos Monkey</b>, para ter certeza de que o sistema aguenta falhas.</p>",
)}

${dica(
  "Lei de Conway: desenhe os times junto com os serviços",
  "<p>Melvin Conway observou em 1968 que os sistemas acabam copiando a estrutura de comunicação da organização que os constrói. Cada serviço precisa de um time dono (um time pode ter vários serviços; um serviço não deve ter vários times). Se três times precisam se reunir para mudar um serviço, a fronteira está errada.</p>",
)}

${alerta(
  "Monólito primeiro",
  "<p>No texto <i>MonolithFirst</i>, de 2015, Martin Fowler defende começar com um monólito e extrair serviços quando as fronteiras estiverem claras, porque acertar essas fronteiras logo no início é muito difícil. Shopify e Stack Overflow mostram publicamente que dá para atender volume enorme com monólitos bem organizados (capítulos 11 e 12). Comece por um monólito modular: se um dia precisar distribuir, os módulos já são candidatos naturais a serviço.</p>",
)}

${combina([
  [12, "Monólito modular", "onde as fronteiras nascem antes de virar serviço"],
  [23, "Sagas", "consistência entre serviços sem transação global"],
  [20, "Orientada a eventos", "a comunicação assíncrona entre serviços"],
  [6, "Hexagonal", "como organizar o código dentro de cada serviço"],
  [17, "Células", "isolar falhas replicando o conjunto de serviços"],
  [30, "Como migrar", "extrair serviços do monólito aos poucos"],
])}

${lembre([
  "Microsserviço é capacidade de negócio + dados próprios + deploy independente. Sem os três, é um monólito com rede no meio.",
  "A rede falha: timeout, retry com backoff, circuit breaker, idempotência e observabilidade não são opcionais.",
  "É uma resposta a problemas de organização e escala (muitos times, cargas diferentes). Com time pequeno ou domínio incerto, comece pelo monólito modular.",
])}
`;
