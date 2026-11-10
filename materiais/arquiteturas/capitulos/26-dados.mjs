// Capítulo 26: Arquiteturas de dados. Três perguntas diferentes: ONDE guardar (warehouse, lake, lakehouse com
// Delta Lake / Iceberg), COMO processar (Lambda: batch + velocidade + serviço; Kappa: só streaming, reprocessa
// relendo o log) e QUEM cuida (Data Mesh). SQL analítico e consumidor de stream (Kappa).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, check, claro, cor, elipse, etiqueta, fila, linha, navegador, pessoa, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

/** Diagrama principal: warehouse x lake x lakehouse, lado a lado, com prós e contras. */
function armazenamento() {
  semear("dados-1");
  let s = "";
  const X = [15, 265, 515];
  const tit = ["Data warehouse", "Data lake", "Lakehouse"];
  const sub = ["banco feito para análise", "galpão de arquivos", "lake + formato de tabela"];
  const itens = [
    [["SQL rápido e confiável", true], ["ótimo para BI", true], ["caro com muito volume", false]],
    [["barato, guarda tudo", true], ["bom para ML", true], ["vira pântano fácil", false]],
    [["preço de lake", true], ["SQL com transações", true], ["pede mais engenharia", false]],
  ];
  X.forEach((x, k) => {
    s += ret(x, 8, 230, 302, { cor: cor.cinza, espessura: 1.5 });
    s += txt(x + 115, 32, tit[k], { tam: 19 });
    s += txt(x + 115, 56, sub[k], { tam: 15, cor: cor.cinza });
    itens[k].forEach(([t, ok], i) => {
      const y = 232 + i * 26;
      s += ok ? check(x + 24, y) : xis(x + 24, y, 13);
      s += txt(x + 42, y, t, { tam: 15, ancora: "start" });
    });
  });
  // warehouse: modelo estrela (fato no meio, dimensões em volta)
  const a = X[0];
  s += linha([[a + 52, 108], [a + 90, 122]], { espessura: 1.5 });
  s += linha([[a + 178, 108], [a + 140, 122]], { espessura: 1.5 });
  s += linha([[a + 115, 162], [a + 115, 176]], { espessura: 1.5 });
  s += bloco(a + 8, 74, 88, 34, "produto", { preench: "#ffffff", hachura: "solid", tam: 15 });
  s += bloco(a + 134, 74, 88, 34, "cliente", { preench: "#ffffff", hachura: "solid", tam: 15 });
  s += bloco(a + 70, 121, 90, 42, "vendas", { preench: claro.azul, tam: 16 });
  s += bloco(a + 71, 176, 88, 34, "data", { preench: "#ffffff", hachura: "solid", tam: 15 });
  // lake: arquivos de todo tipo boiando
  const b = X[1];
  s += elipse(b + 115, 142, 212, 124, { preench: claro.azul, gap: 7 });
  s += etiqueta(b + 80, 108, "json", { tam: 15, preench: "#ffffff" });
  s += etiqueta(b + 152, 108, "csv", { tam: 15, preench: claro.laranja });
  s += etiqueta(b + 62, 142, "logs", { tam: 15, preench: claro.verde });
  s += etiqueta(b + 152, 142, "parquet", { tam: 15, preench: "#ffffff" });
  s += etiqueta(b + 108, 176, "fotos", { tam: 15, preench: claro.violeta });
  // lakehouse: os mesmos arquivos, com uma camada de tabela por cima
  const c = X[2];
  s += elipse(c + 115, 178, 204, 62, { preench: claro.azul, gap: 7 });
  s += txt(c + 115, 179, "arquivos Parquet", { tam: 15, halo: 4 });
  s += linha([[c + 70, 130], [c + 80, 150]], { tracejado: true, espessura: 1.4 });
  s += linha([[c + 160, 130], [c + 150, 150]], { tracejado: true, espessura: 1.4 });
  s += bloco(c + 17, 84, 196, 46, "Delta Lake / Iceberg", { preench: claro.verde, hachura: "solid", tam: 15 });
  s += txt(380, 334, "o lakehouse quer o preço do lake com a organização do warehouse", { tam: 16, cor: cor.azul });
  return quadro(760, 350, s);
}

/** Lambda: cada evento vai para a camada batch e para a de velocidade; a de serviço junta as duas. */
function lambda() {
  semear("dados-2");
  let s = "";
  s += fila(20, 104, 110, 40, "eventos");
  s += seta(132, 114, 198, 50, { espessura: 2 });
  s += seta(132, 134, 198, 180, { espessura: 2 });
  s += bloco(200, 6, 240, 76, "", { preench: claro.amarelo });
  s += txt(320, 26, "camada batch", { tam: 18, halo: 4 });
  s += txt(320, 56, "guarda tudo e recalcula\nde hora em hora ou à noite", { tam: 15, halo: 4 });
  s += bloco(200, 146, 240, 76, "", { preench: claro.laranja });
  s += txt(320, 166, "camada de velocidade", { tam: 18, halo: 4 });
  s += txt(320, 196, "só o que chegou depois\ndo último batch, em segundos", { tam: 15, halo: 4 });
  s += bloco(575, 6, 170, 216, "", { preench: claro.verde });
  s += txt(660, 78, "camada de\nserviço", { tam: 18, halo: 4 });
  s += txt(660, 150, "junta as duas\nvisões e responde\nao painel", { tam: 15, halo: 4 });
  s += seta(442, 44, 573, 44, { espessura: 2, rotulo: "visão batch" });
  s += seta(442, 184, 573, 184, { espessura: 2, rotulo: "visão recente" });
  s += txt(380, 248, "o preço: a mesma regra escrita duas vezes, em batch e em streaming", { tam: 16, cor: cor.vermelho });
  return quadro(760, 262, s);
}

/** Kappa: um log guardado; a versão nova do processador relê do início, lado a lado com a atual. */
function kappa() {
  semear("dados-3");
  let s = "";
  s += txt(280, 24, "log de eventos guardado por muito tempo (ex.: Kafka)", { tam: 16 });
  s += ret(30, 46, 500, 50, { preench: claro.laranja });
  for (let i = 1; i < 10; i++) s += linha([[30 + i * 50, 50], [30 + i * 50, 92]], { espessura: 1.1 });
  for (let i = 0; i < 10; i++) s += txt(55 + i * 50, 72, String(i), { tam: 15, halo: 3 });
  s += seta(725, 71, 540, 71, { espessura: 2, rotulo: "novos eventos", dy: -16 });
  s += seta(55, 98, 112, 146, { espessura: 2, cor: cor.verde });
  s += txt(100, 120, "relê desde o 0", { tam: 15, cor: cor.verde, ancora: "start" });
  s += seta(505, 98, 448, 146, { espessura: 2, cor: cor.azul });
  s += txt(495, 120, "lê o que chega", { tam: 15, cor: cor.azul, ancora: "start" });
  s += bloco(40, 148, 210, 60, "processador v2\n(código novo)", { preench: claro.verde, tam: 16 });
  s += bloco(300, 148, 210, 60, "processador v1\n(em produção)", { preench: claro.azul, tam: 16 });
  s += seta(145, 210, 145, 232, { espessura: 1.8 });
  s += seta(405, 210, 405, 232, { espessura: 1.8 });
  s += bloco(65, 234, 160, 42, "tabela v2", { preench: claro.violeta, tam: 16 });
  s += bloco(325, 234, 160, 42, "tabela v1", { preench: claro.violeta, tam: 16 });
  s += navegador(590, 190, 140, 90, "painel");
  s += seta(487, 255, 588, 242, { espessura: 2, rotulo: "hoje" });
  s += linha([[145, 278], [145, 308], [660, 308]], { tracejado: true, cor: cor.verde, espessura: 1.8 });
  s += seta(660, 308, 660, 283, { tracejado: true, cor: cor.verde, espessura: 1.8 });
  s += txt(400, 328, "quando a v2 alcança o fim do log, o painel troca para ela e a v1 é apagada", { tam: 15, cor: cor.verde });
  return quadro(760, 344, s);
}

/** Data Mesh: domínios donos dos dados publicam produtos sobre uma plataforma comum, sob regras comuns. */
function dataMesh() {
  semear("dados-4");
  let s = "";
  s += ret(6, 6, 748, 348, { cor: cor.violeta, tracejado: true, espessura: 1.8 });
  for (const [nome, x] of [["Pedidos", 25], ["Pagamentos", 268], ["Entregas", 511]]) {
    s += ret(x, 24, 224, 190, { preench: claro.amarelo, gap: 10, espessura: 2 });
    s += txt(x + 112, 46, nome, { tam: 18, halo: 5 });
    s += pessoa(x + 52, 70, {});
    s += txt(x + 52, 130, "time dono", { tam: 15, halo: 4 });
    s += bloco(x + 112, 72, 96, 42, "sistema", { preench: "#ffffff", hachura: "solid", tam: 15 });
    s += seta(x + 160, 116, x + 160, 148, { espessura: 1.8 });
    s += bloco(x + 17, 150, 190, 48, "produto de dados", { preench: claro.verde, hachura: "solid", tam: 16 });
    s += seta(x + 112, 200, x + 112, 244, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  }
  s += txt(394, 230, "publica no catálogo", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += bloco(25, 248, 710, 64, "", { preench: claro.azul });
  s += txt(380, 267, "plataforma self-service", { tam: 18, halo: 4 });
  s += txt(380, 295, "armazenamento, pipelines, catálogo e controle de acesso prontos", { tam: 15, halo: 4 });
  s += txt(380, 336, "governança federada: regras comuns para todos (privacidade, nomes, qualidade)", { tam: 15, cor: cor.violeta });
  return quadro(760, 360, s);
}

const SQL = `
-- receita por dia e categoria + média dos últimos 7 dias corridos (dialeto Postgres)
with diaria as (
  select date_trunc('day', p.pago_em) as dia, pr.categoria,
         sum(i.quantidade * i.preco_unitario) as receita
  from prata.pedidos p
  join prata.itens_pedido i on i.pedido_id = p.id
  join prata.produtos pr on pr.id = i.produto_id
  where p.status = 'pago' and p.pago_em >= current_date - interval '90 days'
  group by 1, 2
)
select dia, categoria, receita,
       sum(receita) over (partition by categoria order by dia
         range between interval '6 days' preceding and current row) / 7.0 as media_7d
from diaria
order by dia, categoria;`;

const CONSUMIDOR = `
import { Kafka } from "kafkajs";
import { Pool } from "pg";
const VERSAO = "v2"; // mudou a regra? suba uma versão nova e ela relê o log
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const kafka = new Kafka({ clientId: "vendas-ao-vivo", brokers: ["kafka:9092"] });
const consumidor = kafka.consumer({ groupId: \`vendas-por-minuto-\${VERSAO}\` });
type PedidoPago = { id: string; valor: number; pagoEm: string };
await consumidor.connect();
// grupo novo + fromBeginning: começa do primeiro evento guardado no tópico
await consumidor.subscribe({ topic: "pedidos-pagos", fromBeginning: true });
await consumidor.run({
  eachMessage: async ({ message }) => {
    if (!message.value) return;
    const p: PedidoPago = JSON.parse(message.value.toString());
    // idempotente: se o mesmo evento chegar duas vezes, não conta em dobro
    await db.query(
      \`with novo as (
         insert into pedidos_contados_\${VERSAO} (pedido_id) values ($1)
         on conflict do nothing returning pedido_id)
       insert into vendas_por_minuto_\${VERSAO} (minuto, total, qtd)
       select date_trunc('minute', $2::timestamptz), $3::numeric, 1 from novo
       on conflict (minuto) do update
         set total = vendas_por_minuto_\${VERSAO}.total + excluded.total,
             qtd   = vendas_por_minuto_\${VERSAO}.qtd + 1\`,
      [p.id, p.pagoEm, p.valor],
    );
  },
});`;

export default `
${resumo(
  "Arquitetura de dados decide <b>onde</b> os dados de análise moram (warehouse, lake ou lakehouse), <b>como</b> eles são processados (Lambda ou Kappa) e <b>quem</b> cuida deles (Data Mesh).",
  "Numa rede de supermercados, escolher entre prateleiras etiquetadas e um galpão onde tudo entra é o \"onde\". Contar o estoque toda noite ou ao vivo é o \"como\". Deixar cada loja cuidar do próprio estoque, seguindo as regras da rede, é o \"quem\".",
)}

<p>O banco do seu app é <b>transacional</b> (OLTP, <i>online transaction processing</i>): feito para milhares de operações
pequenas, como gravar um pedido. Análise é o contrário (OLAP, <i>online analytical processing</i>): poucas perguntas enormes,
como "receita por categoria nos últimos dois anos". Rodar isso no banco de produção deixa o app lento, e juntar ali dados de
vários sistemas (app, pagamentos, CRM) fica difícil. Por isso, as empresas copiam os dados para um lugar feito para análise.
As seis arquiteturas deste capítulo não competem entre si: respondem a três perguntas diferentes. Uma empresa pode ter um
lakehouse (onde), processado no estilo Kappa (como) e organizado como Data Mesh (quem).</p>

${fig(armazenamento(), "Três jeitos de guardar dados para análise. O lakehouse guarda arquivos no armazenamento barato do lake e põe por cima uma camada que os organiza como tabelas.", "grande")}

<h3>Como funciona</h3>
<h4>Onde guardar: warehouse, lake e lakehouse</h4>
<ul>
<li><b>Data warehouse</b> (armazém de dados): um banco feito para análise. Os modernos guardam os dados <b>por coluna</b>: para somar o
valor de um bilhão de pedidos, lê só a coluna <code>valor</code>, não a linha inteira. Os dados entram limpos e modelados,
em geral num <b>modelo estrela</b>: uma tabela de fatos (vendas) no meio, ligada a dimensões (produto, cliente, data). O
esquema é definido antes de gravar (<i>schema-on-write</i>). Exemplos: Snowflake, Google BigQuery, Amazon Redshift.</li>
<li><b>Data lake</b> (lago de dados): arquivos num armazenamento de objetos barato (Amazon S3, Google Cloud Storage, Azure
Data Lake Storage), em qualquer formato: JSON, CSV, logs, imagens, Parquet (formato de arquivo colunar e aberto). O esquema
só é aplicado na hora de ler (<i>schema-on-read</i>). É ótimo para guardar tudo e treinar modelos de machine learning, mas,
sem catálogo e sem regras, vira um <b>pântano de dados</b> (<i>data swamp</i>) em que ninguém confia.</li>
<li><b>Lakehouse</b>: um data lake com um <b>formato de tabela aberto</b> por cima, como <b>Delta Lake</b>, <b>Apache
Iceberg</b> ou Apache Hudi. Os dados continuam em arquivos Parquet no armazenamento barato, mas uma camada de metadados
registra quais arquivos formam cada versão da tabela. Isso traz o que faltava ao lake: transações ACID (duas cargas ao mesmo
tempo não corrompem a tabela), mudança de esquema com segurança, consulta a versões antigas (<i>time travel</i>) e vários
motores (Spark, Trino, DuckDB e os próprios warehouses) lendo a mesma tabela.</li>
</ul>

${dica(
  "ETL ou ELT?",
  "<p><b>ETL</b> (<i>extract, transform, load</i>) transforma os dados antes de gravar no destino. <b>ELT</b> carrega os dados brutos primeiro e transforma lá dentro, com SQL: é o mais comum hoje. Ferramentas como o dbt tratam essas transformações como código versionado e testado.</p>",
)}

<h4>Como processar: batch, Lambda e Kappa</h4>
<p>Em <b>lote</b> (<i>batch</i>), você pega um monte de dados parados e calcula tudo de uma vez, como no relatório da
madrugada. Em <b>fluxo</b> (<i>streaming</i>), cada evento é processado assim que chega, como no alerta de fraude. O batch é
simples e preciso, mas atrasado. O streaming é rápido, mas mais difícil de acertar: eventos chegam fora de ordem ou
duplicados, e corrigir um erro antigo exige reprocessar. A <b>arquitetura Lambda</b>, proposta por Nathan Marz, roda os dois
ao mesmo tempo:</p>
<ul>
<li><b>Camada batch</b>: guarda todos os eventos brutos, só acrescentando, e de tempos em tempos recalcula as visões do
zero. Se um bug estragou os números de ontem, basta corrigir o código: o próximo recálculo conserta tudo.</li>
<li><b>Camada de velocidade</b> (<i>speed layer</i>): processa só o que chegou depois do último batch, em segundos. Quando o
batch seguinte cobre esse período, o resultado rápido é descartado.</li>
<li><b>Camada de serviço</b> (<i>serving layer</i>): deixa as visões do batch prontas para consulta. A resposta junta essa
visão com a da camada de velocidade (o batch até a meia-noite mais o streaming de hoje).</li>
</ul>

${fig(lambda(), "Lambda: dois caminhos. A visão batch é precisa, mas atrasada; a visão recente é rápida.")}

<p>O problema é o custo: a mesma regra de negócio ("o que conta como venda?") fica escrita duas vezes, em duas tecnologias
(tipicamente Hadoop ou Spark no batch e Storm, Flink ou Spark Streaming na velocidade). Quando as duas versões divergem, o
painel ao vivo não bate com o relatório do dia seguinte. Hoje, motores como Apache Flink e Spark Structured Streaming rodam o
mesmo código em lote e em fluxo, o que tirou boa parte da razão de existir da Lambda.</p>

<p>A <b>arquitetura Kappa</b>, proposta em 2014 por Jay Kreps (um dos criadores do Apache Kafka), corta a camada batch. Tudo
é streaming, e o segredo é um <b>log de eventos guardado por muito tempo</b>: um tópico do Kafka pode reter eventos por dias,
meses ou sem prazo. Para mudar uma regra ou corrigir um bug, você sobe uma versão nova do processador, que relê o log desde o
primeiro evento e grava numa tabela nova. Quando ela alcança o presente, as consultas passam a ler a tabela nova e a antiga é
apagada. É a ideia do Event Sourcing (capítulo 22) em escala de plataforma de dados.</p>

${fig(kappa(), "Kappa: um código só. Reprocessar é reler o log com a versão nova do processador, rodando ao lado da atual.")}

<h4>Quem cuida: Data Mesh</h4>
<p>No desenho comum, um <b>time central de dados</b> puxa, limpa e entrega os dados de todos os sistemas. Em empresas
grandes, esse time vira gargalo: não conhece o negócio de cada área e acumula uma fila enorme de pedidos. O
<b>Data Mesh</b>, proposto por Zhamak Dehghani em 2019, aplica aos dados a ideia que os microsserviços (capítulo 14)
aplicaram ao código: dividir por domínio. São quatro princípios:</p>
<ol>
<li><b>Domínios donos dos dados</b>: o time de Pedidos cuida dos dados de pedidos, inclusive os de análise, porque é quem
entende o que eles significam.</li>
<li><b>Dados como produto</b>: cada conjunto publicado tem dono, documentação, esquema estável e metas de qualidade e de
atualização, como uma API.</li>
<li><b>Plataforma self-service</b>: um time de plataforma oferece armazenamento, pipelines, catálogo e controle de acesso
prontos, para cada domínio não reinventar a roda.</li>
<li><b>Governança federada</b>: regras comuns (privacidade e LGPD, nomes, padrões de qualidade) são decididas por um grupo
com gente dos domínios e da plataforma e, sempre que possível, checadas automaticamente pela plataforma.</li>
</ol>

${fig(dataMesh(), "Data Mesh: cada domínio publica produtos de dados sobre uma plataforma comum, dentro de regras que valem para todos.")}

${quando(
  [
    "<b>Warehouse gerenciado</b>: a primeira parada de quase toda empresa, da startup à média. Várias fontes (app, pagamentos, CRM), perguntas que cruzam todas e relatórios que aceitam horas de atraso.",
    "<b>Lakehouse</b>: muito volume (logs, eventos, imagens) e cientistas de dados treinando modelos sobre os mesmos dados do BI.",
    "<b>Kappa</b>: decisão em segundos (fraude, estoque, preço dinâmico, painel ao vivo) com um código só, e só para esses casos.",
    "<b>Data Mesh</b>: empresa grande, dezenas de times, e o time central de dados virou uma fila.",
  ],
  [
    "Os dados cabem num banco e uma réplica de leitura com uma ferramenta de BI responde tudo: ainda não precisa de nada disso.",
    "<b>Lakehouse</b> para poucos dados tabulares: um warehouse gerenciado resolve com menos peças.",
    "<b>Streaming</b> para um relatório lido uma vez por dia: custo sem ganho.",
    "<b>Lambda</b> num projeto novo: manter dois códigos raramente compensa com os motores de hoje.",
    "<b>Data Mesh</b> com um time de dados de três pessoas: é reorganização da empresa, não ferramenta.",
  ],
)}

<p>O medidor vale para o caso típico (lakehouse com um pouco de streaming); um warehouse gerenciado sozinho fica bem abaixo.</p>
${medidor({ complexidade: 4, escala: 5, operacao: 4, aprendizado: 4, time: "2 a 5 pessoas de dados para começar; Data Mesh pede vários times" })}

<h3>Como usar na prática</h3>
<p>Um exemplo de plataforma enxuta para uma loja online: os dados do banco do app são copiados para um lakehouse e
organizados em três camadas (bronze, prata e ouro, às vezes chamada de arquitetura medalhão), e um processador de stream
alimenta o painel de vendas ao vivo.</p>
${pastas(`
plataforma-dados/
├── ingestao/
│   ├── cdc-banco-loja.yaml          # copia cada mudança do banco do app
│   └── consumidor-pedidos.ts        # stream: Kafka → painel ao vivo
├── transformacoes/                  # SQL versionado (estilo dbt)
│   ├── bronze/pedidos_brutos.sql    # cópia fiel da origem
│   ├── prata/pedidos.sql            # limpo, tipado, sem duplicatas
│   └── ouro/receita_diaria.sql      # pronto para o painel
├── contratos/pedidos-pagos.yaml     # dono, esquema e metas do produto
└── testes/                          # único, não nulo, valores válidos
`)}

${codigo(SQL, "transformacoes/ouro/receita_diaria.sql", { realce: false })}

<p>A consulta usa poucas colunas de tabelas que podem ter dezenas. Como warehouse e lakehouse guardam por coluna, só essas
colunas saem do disco: por isso ela roda rápido lá e pesa demais no banco do app. Repare na janela: ela soma os últimos 7
dias corridos e divide por 7, então dia sem venda conta como zero (um <code>avg()</code> faria a média só dos dias com venda).</p>

${codigo(CONSUMIDOR, "ingestao/consumidor-pedidos.ts")}

<p>Esse consumidor é o coração da Kappa. Para mudar a regra (por exemplo, descontar cupons), troque <code>VERSAO</code> para
<code>"v3"</code>: o grupo de consumidores novo não tem posição salva, então começa do primeiro evento retido no tópico e
monta as tabelas da v3 enquanto a v2 continua servindo o painel.</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Liste as perguntas do negócio e o atraso aceitável de cada uma (um dia, uma hora, segundos). Isso decide entre batch e streaming.",
  "Tire a análise do banco de produção: copie os dados para um warehouse ou lakehouse gerenciado, com carga periódica ou CDC (<i>change data capture</i>: ler o log de alterações do banco e mandar cada mudança adiante, com ferramentas como Debezium).",
  "Organize em camadas bronze, prata e ouro, com SQL versionado e testado, e dê a cada tabela publicada dono, descrição e regras de qualidade num catálogo.",
  "Streaming só onde o atraso custa dinheiro, no estilo Kappa: um código só, gravação idempotente e retenção para reprocessar. Se o time central virar gargalo, passe a posse dos dados aos domínios aos poucos (Data Mesh).",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Arquitetura", "Pergunta", "Você ganha", "Você paga"],
  [
    ["<b>Data warehouse</b>", "onde", "SQL rápido, dados confiáveis, BI fácil", "caro com muito volume; dado não estruturado fica de fora"],
    ["<b>Data lake</b>", "onde", "armazenamento barato, qualquer formato, bom para ML", "sem transações nem catálogo, vira pântano"],
    ["<b>Lakehouse</b>", "onde", "preço de lake com tabelas confiáveis; formato aberto", "mais peças para manter (compactar arquivos pequenos, catálogo)"],
    ["<b>Lambda</b>", "como", "precisão do batch com a velocidade do streaming", "a mesma regra em dois códigos; números que não batem"],
    ["<b>Kappa</b>", "como", "um código só; reprocessa relendo o log", "retenção longa e streaming bem feito (ordem, duplicatas)"],
    ["<b>Data Mesh</b>", "quem", "escala com o número de times; dados com quem entende deles", "mudança de organização; exige plataforma e governança maduras"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Lake sem dono nem catálogo</b>: tudo entra, nada é documentado, e logo ninguém confia nos números.</li>
<li><b>Consumidor que conta duas vezes</b>: sistemas de stream costumam entregar cada mensagem <b>pelo menos uma vez</b>. Sem
gravação idempotente, uma reentrega infla a receita.</li>
<li><b>Kappa sem retenção</b>: se o tópico guarda só 7 dias (o padrão do Kafka), não dá para reprocessar o mês passado.
Planeje a retenção ou guarde uma cópia dos eventos no lake.</li>
<li><b>Data Mesh só no organograma</b>: mandar cada área "se virar", sem plataforma nem regras comuns, troca um pântano grande
por vários pequenos.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O Apache Iceberg nasceu na Netflix. As tabelas do data lake da empresa eram enormes, e o jeito antigo de saber quais arquivos formavam cada tabela (listar as pastas no armazenamento) era lento e inseguro com várias gravações ao mesmo tempo. O Iceberg passou a registrar os arquivos de cada versão em metadados próprios, foi doado à Fundação Apache e virou um dos formatos-base do lakehouse. O Delta Lake veio da Databricks, que popularizou o termo lakehouse, e o Apache Hudi, da Uber.</p>",
)}

${alerta(
  "Não confunda com AWS Lambda",
  "<p>A arquitetura Lambda não tem relação com o AWS Lambda, o serviço de funções serverless da Amazon (capítulo 15). Só o nome é igual: uma é um jeito de organizar o processamento de dados; o outro é um produto para rodar funções sob demanda.</p>",
)}

${combina([
  [20, "Orientada a eventos", "os eventos que alimentam o streaming"],
  [22, "Event Sourcing", "log imutável e reprocessamento, como na Kappa"],
  [21, "CQRS", "o warehouse é um grande modelo de leitura"],
  [14, "Microsserviços", "Data Mesh é a mesma divisão por domínio, para dados"],
  [10, "Pipes and Filters", "pipelines de transformação em etapas"],
  [15, "Serverless", "motores de consulta pagos por uso"],
])}

${lembre([
  "Separe as perguntas: onde guardar (warehouse, lake, lakehouse), como processar (Lambda, Kappa) e quem cuida (Data Mesh).",
  "Comece simples: um warehouse gerenciado resolve a maioria das empresas; streaming só onde segundos valem dinheiro.",
  "Kappa troca os dois códigos da Lambda por um log que pode ser relido; Data Mesh troca o time central gargalo por domínios donos dos dados.",
])}
`;
