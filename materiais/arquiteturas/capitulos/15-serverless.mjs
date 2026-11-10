// Capítulo 15: Serverless (FaaS + BaaS). Segue o modelo do capítulo 6:
// abertura (resumo) → diagrama → como funciona (gatilhos, cold start, padrões, custo) → quando usar → medidor
// → na prática (pastas + código + passos) → vantagens e custos → erros comuns → mundo real → combina com → para lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, caminho, claro, cor, elipse, envelope, fila, linha, navegador, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Visão geral: gatilhos → funções → serviços gerenciados, com o provedor cuidando do resto. */
function diagrama() {
  semear("serverless-1");
  let s = "";
  // cabeçalhos das três colunas
  s += txt(105, 24, "gatilhos", { tam: 17, cor: cor.azul });
  s += txt(105, 45, "(eventos)", { tam: 15, cor: cor.cinza });
  s += txt(360, 24, "funções", { tam: 17, cor: cor.laranja });
  s += txt(360, 45, "(FaaS)", { tam: 15, cor: cor.cinza });
  s += txt(655, 24, "serviços gerenciados", { tam: 17, cor: cor.violeta });
  s += txt(655, 45, "(BaaS)", { tam: 15, cor: cor.cinza });

  // gatilhos
  s += navegador(35, 80, 140, 62, "HTTP");
  s += elipse(62, 190, 44, 44, { preench: "#ffffff", hachura: "solid", espessura: 2 });
  s += linha([[62, 190], [62, 175]], { espessura: 2 }) + linha([[62, 190], [73, 197]], { espessura: 2 });
  s += txt(128, 190, "agenda", { tam: 16 });
  s += fila(30, 255, 100, 30, "");
  s += txt(156, 270, "fila", { tam: 16 });
  s += caminho("M45,325 L75,325 L87,337 L87,375 L45,375 Z", { preench: claro.cinza, espessura: 1.8 });
  s += linha([[75, 325], [75, 337], [87, 337]], { espessura: 1.4 });
  s += txt(130, 350, "upload", { tam: 16 });

  // funções (a primeira com cópias empilhadas: várias instâncias ao mesmo tempo)
  s += ret(266, 70, 220, 48, { preench: "#ffffff", hachura: "solid", espessura: 1.6 });
  s += ret(258, 78, 220, 48, { preench: "#ffffff", hachura: "solid", espessura: 1.6 });
  const funcoes = [
    [110, "criarPedido"],
    [190, "relatorioDiario"],
    [270, "confirmarPedido"],
    [350, "gerarMiniatura"],
  ];
  for (const [cy, nome] of funcoes) s += bloco(250, cy - 24, 220, 48, nome, { preench: claro.laranja, tam: 16 });

  // setas dos gatilhos para as funções
  s += seta(178, 111, 246, 110, { cor: cor.azul, espessura: 2 });
  s += seta(162, 190, 246, 190, { cor: cor.azul, espessura: 2 });
  s += seta(176, 270, 246, 270, { cor: cor.azul, espessura: 2 });
  s += seta(162, 350, 246, 350, { cor: cor.azul, espessura: 2 });

  // serviços gerenciados
  s += banco(600, 78, 110, 140, "banco", { preench: claro.violeta, tam: 16 });
  s += envelope(600, 251, 56, 38, claro.violeta);
  s += txt(702, 270, "e-mail", { tam: 16 });
  s += bloco(590, 326, 140, 48, "arquivos", { preench: claro.violeta, tam: 16 });

  // setas das funções para os serviços
  s += seta(474, 110, 596, 110, { cor: cor.violeta, espessura: 2 });
  s += seta(474, 190, 596, 186, { cor: cor.violeta, espessura: 2 });
  s += seta(474, 270, 596, 270, { cor: cor.violeta, espessura: 2 });
  s += seta(474, 350, 586, 350, { cor: cor.violeta, espessura: 2 });

  // o que fica com o provedor
  s += ret(20, 398, 720, 40, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += txt(380, 418, "o provedor cuida de servidores, escala (de 0 a N cópias de cada função) e disponibilidade", { tam: 15, cor: cor.cinza });
  return quadro(760, 448, s);
}

/** Linha do tempo de uma instância: chamada fria, chamada quente e desligamento. */
function coldStart() {
  semear("serverless-2");
  let s = "";
  // chave marcando o cold start
  s += linha([[190, 66], [190, 54], [600, 54], [600, 66]], { cor: cor.laranja, espessura: 2 });
  s += txt(395, 34, "cold start (partida a frio)", { tam: 16, cor: cor.laranja });

  // 1) primeira chamada
  s += txt(20, 88, "primeira chamada", { tam: 16, ancora: "start" });
  s += txt(20, 110, "(fria)", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += bloco(190, 74, 140, 46, "baixa o código", { preench: claro.cinza, tam: 15 });
  s += bloco(330, 74, 140, 46, "inicia o runtime", { preench: claro.cinza, tam: 15 });
  s += bloco(470, 74, 130, 46, "init do código", { preench: claro.laranja, tam: 15 });
  s += bloco(600, 74, 100, 46, "handler", { preench: claro.verde, tam: 15 });

  // 2) chamada seguinte
  s += txt(20, 160, "chamada seguinte", { tam: 16, ancora: "start" });
  s += txt(20, 182, "(quente)", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += bloco(190, 146, 100, 46, "handler", { preench: claro.verde, tam: 15 });
  s += txt(310, 169, "a instância já está pronta: só o handler roda", { tam: 15, cor: cor.cinza, ancora: "start" });

  // 3) tempo sem uso
  s += txt(20, 232, "um tempo sem uso", { tam: 16, ancora: "start" });
  s += txt(20, 254, "(escala a zero)", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += ret(190, 218, 330, 46, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += txt(355, 241, "o provedor desliga a instância", { tam: 15, cor: cor.cinza });
  s += seta(530, 241, 578, 241, { cor: cor.laranja, espessura: 2 });
  s += txt(588, 241, "volta a ser fria", { tam: 15, cor: cor.laranja, ancora: "start" });
  return quadro(760, 276, s);
}

/** Custo por mês x volume: serverless cresce em linha reta, servidor fixo é um degrau. */
function custo() {
  semear("serverless-3");
  let s = "";
  // eixos
  s += seta(90, 310, 732, 310, { espessura: 2 });
  s += seta(90, 310, 90, 40, { espessura: 2 });
  s += txt(102, 36, "custo por mês", { tam: 16, ancora: "start" });
  s += txt(722, 292, "requisições por mês", { tam: 16, ancora: "end" });

  // servidor fixo: mesmo valor até precisar de mais uma máquina
  s += linha([[90, 200], [620, 200], [620, 125], [715, 125]], { cor: cor.azul, espessura: 3 });
  s += txt(105, 158, "servidor fixo", { tam: 16, cor: cor.azul, ancora: "start" });
  s += txt(105, 180, "custa o mesmo, cheio ou vazio", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += txt(672, 148, "+1 servidor", { tam: 15, cor: cor.azul });

  // serverless: proporcional ao uso
  s += linha([[90, 306], [700, 60]], { cor: cor.laranja, espessura: 3 });
  s += txt(690, 36, "serverless: paga por uso", { tam: 16, cor: cor.laranja, ancora: "end" });

  // ponto de virada
  s += linha([[353, 208], [353, 308]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += elipse(353, 200, 14, 14, { preench: cor.vermelho, hachura: "solid", cor: cor.vermelho });
  s += seta(392, 230, 364, 208, { cor: cor.vermelho, espessura: 1.6, ponta: 10 });
  s += txt(450, 240, "ponto de virada", { tam: 16, cor: cor.vermelho });

  // zonas
  s += txt(220, 336, "serverless sai mais barato", { tam: 15, cor: cor.laranja });
  s += txt(535, 336, "servidor fixo sai mais barato", { tam: 15, cor: cor.azul });
  return quadro(760, 356, s);
}

export default `
${resumo(
  "Você escreve só <b>funções</b> pequenas, que rodam quando algo acontece (uma requisição, uma mensagem, um horário, um upload), e usa <b>serviços prontos</b> para o resto. O provedor de nuvem cuida dos servidores, escala sozinho (inclusive até zero) e cobra pelo uso.",
  "É como usar carro de aplicativo em vez de ter carro. Você não paga seguro, IPVA nem garagem: paga por corrida. Para quem anda pouco, sai bem mais barato. Às vezes você espera o motorista chegar (o cold start). E, para quem roda o dia inteiro, todo dia, ter o próprio carro começa a compensar.",
)}

<p><b>Serverless</b> (sem servidor) não quer dizer que não existem servidores. Quer dizer que eles não são problema seu:
você entrega o código e a configuração, e o provedor decide onde rodar, quantas cópias subir e quando desligar. A ideia
ficou popular com o AWS Lambda, da Amazon, e hoje existe em todas as grandes nuvens (Azure Functions, as funções do Google
Cloud, Cloudflare Workers). Uma arquitetura serverless junta duas peças: <b>FaaS</b> (<i>Function as a Service</i>, função
como serviço), seu código dividido em funções que rodam quando um evento acontece, e <b>BaaS</b> (<i>Backend as a
Service</i>, backend como serviço), os serviços prontos que você usa por API, sem instalar: banco, login, arquivos,
filas, e-mail.</p>

${fig(diagrama(), "Cada gatilho dispara uma função; cada função faz uma coisa e usa serviços gerenciados. As cópias empilhadas mostram que uma função pode ter várias instâncias ao mesmo tempo.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Gatilho</b>: todo código serverless começa com um evento. Os mais comuns são uma requisição HTTP (que chega por um
<i>API Gateway</i>, o "porteiro" que recebe as chamadas e repassa para a função), uma mensagem numa fila, um horário
(agenda no estilo do cron, o agendador de tarefas do Linux), um arquivo enviado para o armazenamento e uma mudança no banco.</li>
<li><b>Função (handler)</b>: recebe o evento, faz uma coisa e termina. No modo padrão do AWS Lambda, cada instância atende
um evento por vez: 50 chamadas simultâneas viram até 50 cópias da função rodando lado a lado.</li>
<li><b>Escala até zero, paga por uso</b>: sem eventos, nada roda e a função não custa nada. A conta vem pelo número de
execuções e pelo tempo de execução multiplicado pela memória reservada (no Lambda, medido em milissegundos).</li>
<li><b>Sem estado local</b>: a instância pode ser destruída a qualquer momento, e a próxima chamada pode cair em outra. O
que precisa durar vai para um serviço gerenciado (banco, cache, arquivos).</li>
<li><b>Limites</b>: cada execução tem tempo e memória máximos. No AWS Lambda, são 15 minutos e 10 GB de memória (a CPU
cresce junto com a memória). Há também um limite de execuções simultâneas por conta e região, e, atrás de
um API Gateway, a resposta HTTP precisa sair em cerca de 30 segundos.</li>
</ul>

<h4>Cold start: o preço de escalar até zero</h4>
<p>Quando chega um evento e não há instância pronta, o provedor precisa criar uma: baixar o seu código, iniciar o
<i>runtime</i> (Node, Python, Java...) e rodar a inicialização do seu código. Isso é o <b>cold start</b> (partida a frio),
que pode levar de dezenas de milissegundos a alguns segundos, conforme a linguagem, o tamanho do pacote e o que o código faz
ao iniciar. As chamadas seguintes reaproveitam a instância "quente" e pulam essa etapa.</p>

${fig(coldStart(), "A primeira chamada paga a inicialização; as seguintes, não. Depois de um tempo parada, a instância é desligada e o ciclo recomeça.")}

<p>Para diminuir: pacote pequeno e poucas dependências. E crie os clientes de banco fora do handler: assim eles são montados
só no cold start e reaproveitados nas chamadas quentes. Quando a latência importa
muito, dá para manter instâncias sempre ligadas (no Lambda, <i>provisioned concurrency</i>), mas elas são cobradas mesmo
paradas: é voltar um pouco para o modelo de servidor fixo.</p>

<h4>Os três padrões mais comuns</h4>
<ol>
<li><b>API + funções + banco gerenciado</b>: o API Gateway recebe <code>POST /pedidos</code> e chama uma função, que grava
num banco cobrado por uso (como o DynamoDB no modo sob demanda). É o back-end de muitos apps e sites.</li>
<li><b>Pipeline de eventos</b>: o upload de uma foto dispara a função que gera a miniatura; ela publica "foto pronta" numa
fila; outra função atualiza o catálogo. Cada etapa escala sozinha, e uma falha não derruba as outras (é o pipes and filters
do capítulo 10 rodando na nuvem).</li>
<li><b>Tarefas agendadas</b>: todo dia às 6h, uma função gera o relatório de vendas e manda por e-mail. Sem um servidor
ligado 24 horas só para rodar um script de dois minutos.</li>
</ol>

<h4>Quanto custa: o ponto de virada</h4>
<p>Com pouco tráfego, serverless custa quase nada (os grandes provedores ainda dão uma cota gratuita por mês). Conforme o
volume cresce, a conta sobe junto, em linha reta. Um servidor fixo custa o mesmo todo mês, esteja cheio ou vazio, e só sobe
em degrau quando você precisa de mais uma máquina. Por isso existe um <b>ponto de virada</b>: abaixo dele, serverless sai
mais barato; acima, com tráfego alto e constante, o servidor fixo ganha.</p>

${fig(custo(), "Sem números de propósito: onde fica o ponto de virada depende da duração de cada execução, da memória e dos preços do provedor.", "baixa")}

<p>Faça a conta com a calculadora do provedor, incluindo os serviços em volta (API Gateway, transferência de dados, logs),
que às vezes custam mais que as funções. E lembre que o servidor fixo tem custos fora da fatura: alguém para atualizar,
monitorar e manter pelo menos duas máquinas no ar.</p>

${quando(
  [
    "O tráfego é irregular ou imprevisível: picos em certos horários, campanhas, venda de ingressos.",
    "O sistema reage a eventos: arquivo enviado, mensagem na fila, webhook de pagamento.",
    "Há tarefas agendadas ou de fundo: relatórios, limpeza de dados, lembretes, integrações.",
    "É um protótipo ou MVP, ou o time é pequeno e não tem ninguém para cuidar de servidor.",
  ],
  [
    "Toda chamada precisa de latência baixíssima e constante (jogos em tempo real, negociação na bolsa): o cold start atrapalha.",
    "O processamento é longo: vídeos de horas, treino de modelos, jobs que passam do limite de tempo (15 minutos no Lambda).",
    "O tráfego é alto e estável 24 horas por dia: a conta tende a ficar maior que a de servidores fixos.",
    "Você precisa de estado em memória entre chamadas ou tem que rodar em qualquer nuvem sem reescrever.",
  ],
)}

${medidor({ complexidade: 2, escala: 4, operacao: 2, aprendizado: 3, time: "qualquer tamanho; brilha em times pequenos, sem equipe de infraestrutura" })}

<h3>Como usar na prática</h3>
<p>Imagine a loja do diagrama: cada tarefa vira uma função com o seu gatilho, e a regra de negócio fica num módulo
compartilhado, sem nada de AWS, para ser testada sem nuvem.</p>

${pastas(`
loja/
├── serverless.yml               # funções, gatilhos e permissões
├── src/
│   ├── pedidos/
│   │   ├── criar.ts             # gatilho HTTP: POST /pedidos
│   │   └── confirmar.ts         # gatilho fila: e-mail de confirmação
│   ├── produtos/
│   │   └── miniatura.ts         # gatilho upload: gera a miniatura
│   ├── relatorios/
│   │   └── diario.ts            # gatilho agenda: todo dia às 6h
│   └── compartilhado/
│       └── pedido.ts            # regra de negócio pura (sem AWS)
└── test/                        # testa a regra sem subir nada
`)}

${codigo(
  `
// gatilho HTTP. O handler só traduz: evento -> regra -> resposta
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { novoPedido } from "../compartilhado/pedido";

// Fora do handler: roda uma vez por instância (no cold start) e é reaproveitado
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABELA = process.env.TABELA_PEDIDOS!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const dados = JSON.parse(event.body ?? "{}");
  if (!dados.itens?.length) {
    return { statusCode: 400, body: JSON.stringify({ erro: "Pedido vazio" }) };
  }
  const pedido = novoPedido(dados.clienteId, dados.itens); // regra pura, testável
  await db.send(new PutCommand({ TableName: TABELA, Item: pedido }));
  return { statusCode: 201, body: JSON.stringify({ id: pedido.id }) };
};`,
  "src/pedidos/criar.ts",
)}

${codigo(
  `
# Serverless Framework v4 (empacota o TypeScript sozinho). Omitidos: gerarMiniatura e IAM
service: loja
provider:
  name: aws
  runtime: nodejs22.x
  region: sa-east-1            # São Paulo
  memorySize: 512              # MB (a CPU cresce junto)
  timeout: 10                  # segundos; o máximo no Lambda é 900 (15 min)
  environment:
    TABELA_PEDIDOS: pedidos
functions:
  criarPedido:
    handler: src/pedidos/criar.handler
    events:
      - httpApi: "POST /pedidos"                     # HTTP
  confirmarPedido:
    handler: src/pedidos/confirmar.handler
    events:
      - sqs:                                         # fila
          arn: arn:aws:sqs:\${aws:region}:\${aws:accountId}:pedidos-criados
          functionResponseType: ReportBatchItemFailures
  relatorioDiario:
    handler: src/relatorios/diario.handler
    timeout: 300
    events:
      - schedule: cron(0 9 * * ? *)                  # 9h UTC = 6h em Brasília`,
  "serverless.yml",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Comece pequeno e pela periferia (miniaturas, relatório agendado, webhook), não pelo núcleo.",
  "Use infraestrutura como código (Serverless Framework, SAM, CDK, Terraform), nunca o painel.",
  "Mantenha o handler fino (o adaptador de entrada do capítulo 6): traduz o evento, chama a regra pura e responde.",
  "Faça cada função aguentar a mesma mensagem duas vezes (idempotência) e configure uma fila de mensagens mortas (<i>dead-letter queue</i>) para o que falhar repetidamente.",
  "Desde o primeiro dia: logs estruturados, rastreamento entre funções (OpenTelemetry, AWS X-Ray) e alerta de orçamento.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Nenhum servidor para manter: sem sistema operacional, atualização ou plano de capacidade", "Aprisionamento ao fornecedor: gatilhos, permissões e serviços são do provedor (para baratear a saída, deixe a regra num núcleo sem SDK, como no capítulo 6)"],
    ["Escala sozinho, inclusive até zero", "Cold start: a primeira chamada depois de um tempo parado demora mais"],
    ["Paga só pelo uso: ótimo para tráfego irregular e protótipos", "Com tráfego alto e constante, pode sair mais caro que servidor fixo"],
    ["Do zero à produção muito rápido, com alta disponibilidade embutida", "Limites de tempo e memória; muitas peças distribuídas para depurar e rastrear"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Função chamando função e esperando a resposta</b>: latências e cold starts se somam, e você paga pelas duas funções.
Prefira filas, eventos ou um orquestrador (AWS Step Functions, capítulo 23).</li>
<li><b>Contar com estado local</b>: carrinho ou sessão numa variável global ou no disco temporário. Funciona no
teste e some em produção, quando a chamada cai em outra instância.</li>
<li><b>Ignorar reentrega</b>: filas e eventos entregam "pelo menos uma vez", e o provedor repete chamadas assíncronas que
falharam. Sem idempotência, o cliente recebe dois e-mails ou paga duas vezes.</li>
<li><b>Laço infinito</b>: a função que grava a miniatura no mesmo bucket que a dispara chama a si mesma sem parar, e a
conta cresce a cada volta. Separe origem e destino e limite a concorrência.</li>
<li><b>Nanosserviços</b>: centenas de funções minúsculas, uma para cada pedacinho de código. Agrupe por assunto do negócio.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Em 2023, o time do Prime Video (Amazon) contou no seu blog de tecnologia como refez a ferramenta que monitora a qualidade das transmissões. A primeira versão era serverless (AWS Step Functions orquestrando funções) e saiu rápido. Com carga alta e contínua, ficou cara e esbarrou em limites de escala: cada segundo de vídeo gerava vários passos no orquestrador, e as etapas trocavam quadros pelo S3. Com tudo num único processo em contêineres, o custo de infraestrutura caiu mais de 90%. A lição não é \"serverless é ruim\": é o ponto de virada do gráfico, com volume enorme e previsível.</p>",
)}

${alerta(
  "Banco relacional e funções: cuidado com as conexões",
  "<p>Cada instância abre a sua própria conexão. Num pico, centenas de instâncias podem esgotar o limite de conexões do Postgres ou do MySQL e derrubar o banco. Use um intermediário de conexões (RDS Proxy, PgBouncer), limite a concorrência ou prefira bancos feitos para isso (como o DynamoDB).</p>",
)}

${dica(
  "Serverless não é sinônimo de microsserviços (nem de função)",
  "<p>Serverless é sobre <b>como o código vai para o ar</b>; microsserviços (capítulo 14) são sobre <b>em quantas partes o sistema é dividido</b>. Dá para colocar uma API Express inteira numa função só (o <i>lambdalith</i>) e ter um monólito serverless, ou ter microsserviços em servidores comuns. E nem todo serverless é função: no Google Cloud Run, por exemplo, você entrega um contêiner e o provedor escala do mesmo jeito, até zero.</p>",
)}

${combina([
  [20, "Orientada a eventos", "gatilho é evento"],
  [10, "Pipes and Filters", "funções em etapas"],
  [6, "Hexagonal", "handler como adaptador"],
  [23, "Sagas", "orquestrar funções"],
  [14, "Microsserviços", "serviço feito de funções"],
  [11, "Monólito", "a alternativa clássica"],
])}

${lembre([
  "Serverless = funções disparadas por eventos (FaaS) + serviços gerenciados (BaaS); o provedor cuida dos servidores e da escala.",
  "Escala até zero e paga por uso: ótimo para tráfego irregular, eventos, tarefas e protótipos; com tráfego alto e estável, o servidor fixo pode sair mais barato.",
  "Projete para os limites: cold start, tempo máximo, nada de estado local e handlers idempotentes.",
])}
`;
