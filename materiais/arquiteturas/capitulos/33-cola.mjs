// Capítulo 33: Cola final. Capítulo de consulta rápida da parte V, então a estrutura é própria:
// abertura → fluxograma de bolso → 10 regras de ouro → cada arquitetura em uma linha (uma tabela por parte)
// → glossário → para lembrar → recado de despedida da Julia. Os capítulos 27 a 32 aparecem no parágrafo de abertura
// (no lugar do "combina com"), para o glossário, o lembre e o recado caberem na mesma página.

import { fig, lembre, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { bloco, claro, cor, linha, passo, quadro, semear, seta, txt } from "../desenho.mjs";

/** Fluxograma de bolso: quatro perguntas, da esquerda para a direita; em cada uma, o padrão "na dúvida"
 *  (verde) e as duas saídas que só valem quando uma dor real aparece. */
function fluxograma() {
  semear("cola-1");
  let s = "";
  const colunas = [
    {
      pergunta: "Como organizar\no código?",
      opcoes: [
        ["na dúvida", "Camadas ou MVC", "caps. 4 e 5"],
        ["regra rica", "Hexagonal, Clean", "caps. 6 e 7"],
        ["muitas features", "Vertical Slice", "cap. 8"],
      ],
    },
    {
      pergunta: "Quantas partes\nvão para o ar?",
      opcoes: [
        ["na dúvida", "Monólito modular", "caps. 11 e 12"],
        ["times travados", "Microsserviços", "cap. 14"],
        ["picos e eventos", "Serverless", "cap. 15"],
      ],
    },
    {
      pergunta: "Como as partes\nconversam?",
      opcoes: [
        ["na dúvida", "Chamada direta", "caps. 12 e 18"],
        ["várias reações", "Eventos", "cap. 20"],
        ["vários bancos", "Saga", "cap. 23"],
      ],
    },
    {
      pergunta: "Como ler e\nguardar dados?",
      opcoes: [
        ["na dúvida", "Um banco só", "índice e réplica"],
        ["leitura diferente", "CQRS", "cap. 21"],
        ["histórico é tudo", "Event Sourcing", "cap. 22"],
      ],
    },
  ];
  colunas.forEach((c, i) => {
    const x0 = 4 + i * 188;
    // pergunta
    s += bloco(x0 + 4, 12, 176, 66, "", { preench: claro.amarelo, hachura: "solid" });
    s += passo(x0 + 24, 45, String(i + 1));
    s += txt(x0 + 106, 45, c.pergunta, { tam: 15 });
    // espinha e ramos
    const cy = [132, 214, 296];
    s += linha([[x0 + 18, 78], [x0 + 18, cy[2]]], { espessura: 1.8 });
    c.opcoes.forEach(([quando, nome, cap], j) => {
      const padrao = j === 0;
      s += seta(x0 + 18, cy[j], x0 + 38, cy[j], { espessura: 1.8, ponta: 9, cor: padrao ? cor.verde : cor.tinta });
      s += bloco(x0 + 40, cy[j] - 34, 144, 68, "", { preench: padrao ? claro.verde : claro.azul, hachura: "solid", espessura: padrao ? 2.4 : 1.8 });
      s += txt(x0 + 112, cy[j] - 19, quando, { tam: 15, cor: padrao ? cor.verde : cor.azul });
      s += txt(x0 + 112, cy[j], nome, { tam: 16 });
      s += txt(x0 + 112, cy[j] + 19, cap, { tam: 15, cor: cor.cinza });
    });
  });
  s += txt(380, 356, "responda de 1 a 4 e fique no verde até uma dor medida pedir outra caixa", { tam: 16, cor: cor.vermelho });
  s += txt(380, 384, "casos especiais (plugins, pipelines, células, P2P, atores, dados): veja as tabelas", { tam: 15, cor: cor.cinza });
  return quadro(760, 404, s);
}

const arq = (nome, n) => `<b>${nome}</b><br>cap. ${n}`;
const CAB = ["Arquitetura", "O que é", "Use quando", "Evite quando"];

export default `
${resumo(
  "Tudo o que o livro ensinou, em formato de consulta: um fluxograma de bolso, cada arquitetura em uma linha, as regras que valem para todas e o vocabulário que aparece em qualquer conversa de arquitetura.",
  "É a cola que o professor deixou levar para a prova: não substitui ter estudado, mas lembra o essencial na hora em que você precisa decidir.",
)}

<p>Use estas páginas em três momentos: antes de uma decisão (para lembrar as opções), numa revisão de código ou de
arquitetura (para conferir o "evite quando") e numa entrevista (para explicar cada estilo em uma frase). Quando precisar do
detalhe, siga o número do capítulo. Para ir além da cola, a parte V traz o comparativo completo (capítulo 27), as
árvores de decisão (28), as combinações (29), a migração sem parar o sistema (30), os anti-padrões (31) e os ADRs (32).</p>

${fig(fluxograma(), "Quatro perguntas, quatro decisões independentes. A caixa verde é o ponto de partida; as azuis só entram quando o problema escrito em cima delas existe de verdade. O capítulo 28 tem as árvores completas.", "grande")}

<h3>As 10 regras de ouro</h3>
${passos([
  "<b>Comece simples.</b> Um monólito bem organizado leva a maioria dos produtos muito longe. É a ideia do <i>Monolith First</i>, de Martin Fowler (2015).",
  "<b>Decida pela dor, não pela moda.</b> \"A Netflix usa\" não é requisito. Meça o problema (tempo de resposta, fila de deploy, custo) antes de mudar.",
  "<b>Divida pelo negócio, não pela tecnologia.</b> Fronteiras como catálogo, pedidos e pagamentos duram mais do que \"front\", \"back\" e \"banco\".",
  "<b>Dependências apontam para o que muda menos.</b> As regras de negócio ficam no centro; framework, banco e tela são detalhes plugados por fora.",
  "<b>Cada dado tem um dono.</b> Nenhum módulo ou serviço lê a tabela do outro: pede pela API ou escuta um evento.",
  "<b>Distribuir não conserta bagunça.</b> Código acoplado separado em serviços vira um monólito distribuído, mais lento e mais caro.",
  "<b>O sistema espelha a organização.</b> É a Lei de Conway (Melvin Conway, 1968): desenhe os times e as fronteiras do sistema juntos.",
  "<b>Toda escolha é uma troca.</b> Escreva o que você ganha e o que paga. Se não achou o custo, ainda não entendeu a opção.",
  "<b>Conte com a falha.</b> Rede cai e mensagem chega repetida: timeout, retentativa, idempotência e um plano para quando a outra ponta não responde.",
  "<b>Registre e evolua aos poucos.</b> Cada decisão importante vira um ADR (capítulo 32), e mudanças grandes acontecem por etapas, sem parar o sistema (capítulo 30).",
])}

<h3>Cada arquitetura em uma linha</h3>
<p>Uma linha por capítulo, separadas pelas partes do livro. Não é um cardápio de escolha única: um sistema comum mistura
linhas das três tabelas, como monólito modular por fora, núcleo hexagonal nos módulos com regra rica, eventos entre os módulos
e CQRS só na tela de relatórios (capítulo 29).</p>

<h4>Parte II · O código por dentro</h4>
${tabela(
  CAB,
  [
    [arq("Camadas", 4), "Pilha de camadas (tela, regra, dados); cada uma só chama a de baixo.", "CRUD, backoffice, time iniciante, primeira versão do produto.", "Regra rica que precisa de teste sem banco; vários times no mesmo código."],
    [arq("MVC, MVP e MVVM", 5), "Separam a tela (View) dos dados e regras (Model), com uma peça no meio.", "Todo app com tela ou API; siga o padrão que o seu framework já usa.", "Esperar que eles organizem o negócio; forçar MVP em React ou SwiftUI."],
    [arq("Hexagonal", 6), "O núcleo de regras declara portas; banco, HTTP e filas entram por adaptadores.", "Regra rica e mutável, várias entradas, teste sem infraestrutura.", "CRUD quase sem regra, protótipo descartável, script de um arquivo."],
    [arq("Clean e Onion", 7), "Anéis: regras no centro, frameworks na borda, dependência só para dentro.", "Sistema de anos, regras ricas, vários canais, time médio ou grande.", "CRUD, MVP, prazo curto com time sem prática em interfaces."],
    [arq("Vertical Slice", 8), "Uma pasta por caso de uso, da requisição ao banco.", "Muitas features que mudam uma de cada vez, com devs em paralelo.", "Regras muito compartilhadas sem lugar definido; time sem padrões combinados."],
    [arq("Microkernel", 9), "Núcleo pequeno e estável; o resto chega como plugins.", "Muitas variações da mesma coisa; ferramentas como IDE, CMS e ERP.", "Ainda não se sabe o que varia; plugins precisam mudar o fluxo principal."],
    [arq("Pipes and Filters", 10), "Linha de montagem: cada filtro faz uma transformação e passa adiante.", "ETL, importação de arquivos, logs, mídia, grandes volumes em streaming.", "Fluxo cheio de decisões e voltas; etapas que mexem no mesmo estado."],
  ],
  "compacta",
)}

<h4>Parte III · O sistema por fora</h4>
${tabela(
  CAB,
  [
    [arq("Monólito", 11), "Um código, um artefato, um deploy; tudo no mesmo processo.", "Produto novo; um ou poucos times; consistência forte.", "Fila de deploy entre muitos times; escala muito desigual."],
    [arq("Monólito modular", 12), "Um deploy só, mas módulos com API pública e dados próprios.", "Domínio crescendo, dois ou mais times, fronteiras ainda mudando.", "App pequeno; partes que exigem escala, stack ou isolamento de falha próprios."],
    [arq("SOA", 13), "Serviços corporativos, em geral ligados por um barramento (ESB).", "Empresa grande, com legado e contratos formais.", "Produto novo de poucos times; ninguém para operar o ESB."],
    [arq("Microsserviços", 14), "Serviços independentes, cada um com seus dados e seu deploy.", "Times travados no mesmo deploy, com automação pronta.", "Time pequeno; domínio incerto; sem automação nem observabilidade."],
    [arq("Serverless", 15), "Funções disparadas por eventos; o provedor escala e cobra pelo uso.", "Tráfego irregular, eventos, tarefas agendadas.", "Latência mínima constante; processo longo; carga alta e estável."],
    [arq("Micro-frontends", 16), "Front-end dividido por área de negócio, cada pedaço de um time.", "Três ou mais times no mesmo produto web.", "Um time só no front; app pequeno; telas muito entrelaçadas."],
    [arq("Células", 17), "Cópias isoladas do sistema, cada uma para uma fatia dos clientes.", "SaaS grande em que uma queda geral custa muito caro.", "Produto pequeno ou médio; dados que não se dividem por cliente."],
  ],
  "compacta",
)}

<h4>Parte IV · Comunicação e dados</h4>
${tabela(
  CAB,
  [
    [arq("Cliente-servidor", 18), "O cliente pede, o servidor atende; N camadas (tiers) dividem tela, regra e dados em máquinas.", "Quase todo app web e mobile: dados compartilhados e regras protegidas.", "Cliente falando direto com o banco; somar tiers sem um gargalo medido."],
    [arq("Peer-to-peer", 19), "Cada nó é cliente e servidor ao mesmo tempo; os dados vão direto entre os pares.", "Arquivo grande para muitos; chamada 1:1; uso offline.", "Fonte única da verdade; controle e exclusão de dados."],
    [arq("Orientada a eventos", 20), "Quem publica anuncia um fato; quem se interessa reage no seu tempo.", "Várias reações a uma ação; picos; parceiros instáveis.", "Usuário precisa da resposta na hora; transação forte; sistema pequeno."],
    [arq("CQRS", 21), "Um modelo para escrever (comandos) e outro para ler (consultas).", "Leitura muito diferente da escrita, ou em volume muito maior.", "CRUD; índice, view ou réplica de leitura já resolvem a lentidão."],
    [arq("Event Sourcing", 22), "Guarda cada fato, em ordem; o estado sai deles.", "Dinheiro, auditoria e a pergunta \"como estava em tal data?\".", "CRUD; um log de auditoria já basta; usar no sistema todo."],
    [arq("Sagas", 23), "Transações locais em sequência, cada passo com uma compensação.", "Operação que atravessa serviços com bancos próprios.", "Dados no mesmo banco; regra que exige consistência imediata."],
    [arq("Space-based", 24), "Dados em memória replicada; o banco é atualizado depois.", "Picos enormes (ingressos, leilões); banco no limite.", "Carga previsível; dados grandes demais para a memória."],
    [arq("Modelo de atores", 25), "Unidades com estado privado que só conversam por mensagens, uma por vez.", "Muitas entidades vivas: chat, jogos, IoT, conexões longas.", "CRUD sem estado; lote e análise; transação forte entre muitas entidades."],
    [arq("Arquiteturas de dados", 26), "Warehouse, lake e lakehouse (onde moram), Lambda e Kappa (como processar), Data Mesh (quem cuida).", "Warehouse para começar; Kappa para resultado em segundos; Mesh com muitos domínios.", "Dados que cabem num banco; Lambda em projeto novo; Mesh com time pequeno."],
  ],
  "compacta",
)}

<h3>Glossário de bolso</h3>
${tabela(
  ["Termo", "O que quer dizer"],
  [
    ["<b>Acoplamento</b>", "Quanto uma parte depende de outra. Alto: mudar uma obriga a mexer na outra."],
    ["<b>ADR</b>", "<i>Architecture Decision Record</i>: registro curto de uma decisão e do porquê dela (capítulo 32)."],
    ["<b>Agregado</b>", "Objetos que mudam juntos e protegem suas regras numa transação (termo do <i>Domain-Driven Design</i>)."],
    ["<b>API gateway</b>", "Porta de entrada única: roteia cada chamada ao serviço certo e cuida de autenticação e limites."],
    ["<b>Assíncrono</b>", "Envia (por uma fila, por exemplo) e segue sem esperar. Síncrono é o oposto: espera a resposta."],
    ["<b>Broker</b>", "Intermediário que recebe, guarda e entrega mensagens, como Kafka, RabbitMQ ou SQS."],
    ["<b>Coesão</b>", "Quanto o que está dentro de uma parte pertence junto. Alta: tudo ali muda pelo mesmo motivo."],
    ["<b>Compensação</b>", "Ação de negócio que desfaz um passo anterior (estornar, liberar reserva). É a base das sagas."],
    ["<b>Consistência&nbsp;eventual</b>", "As cópias ficam iguais depois de um tempo; até lá, uma leitura pode trazer o valor antigo."],
    ["<b>Consistência forte</b>", "Toda leitura vê a última escrita confirmada, não importa de onde se lê."],
    ["<b>Contexto delimitado</b>", "<i>Bounded context</i>: fronteira em que cada termo tem um significado só, como \"cliente\" no financeiro."],
    ["<b>Contrato</b>", "O que uma parte promete a quem a usa (rotas, formatos, eventos). Mudar sem aviso quebra os outros."],
    ["<b>Disponibilidade</b>", "Fração do tempo em que o sistema responde. 99,9% ≈ 8,8 horas fora por ano; 99,99% ≈ 53 minutos."],
    ["<b>Escala horizontal</b>", "Mais máquinas iguais dividindo a carga. A escala vertical é trocar por uma máquina maior."],
    ["<b>Função de aptidão</b>", "<i>Fitness function</i>: teste automático que confere uma regra de arquitetura (capítulo 32)."],
    ["<b>Idempotência</b>", "Repetir a operação dá o mesmo resultado que fazê-la uma vez. Obrigatória quando há retentativa."],
    ["<b>Latência</b>", "Tempo de uma operação, do pedido à resposta. Olhe os percentis (p95, p99), não só a média."],
    ["<b>Monólito distribuído</b>", "Serviços separados que só funcionam e só vão para o ar juntos: o custo dos dois mundos."],
    ["<b>Observabilidade</b>", "Logs, métricas e rastreamento (<i>traces</i>) para entender o que o sistema faz, até entre serviços."],
    ["<b>Orquestração</b>", "Um coordenador manda cada parte agir. O oposto é a coreografia: cada parte reage aos eventos."],
    ["<b>Outbox</b>", "Tabela gravada na mesma transação do dado; um processo separado publica os eventos a partir dela."],
    ["<b>Partida a frio</b>", "<i>Cold start</i>: atraso quando a função precisa subir do zero (estava parada ou a carga subiu)."],
    ["<b>Particionamento</b>", "<i>Sharding</i>: dividir os dados entre máquinas por uma chave, como cliente ou região."],
    ["<b>Projeção</b>", "Cópia dos dados no formato que uma tela precisa: o modelo de leitura do CQRS e do event sourcing."],
    ["<b>Raio de impacto</b>", "<i>Blast radius</i>: quanto do sistema e dos clientes uma única falha consegue atingir."],
    ["<b>Réplica de leitura</b>", "Cópia do banco que só atende leituras e recebe as escritas do principal, às vezes com atraso."],
    ["<b>Throughput</b>", "Vazão: quantas operações o sistema completa por unidade de tempo (pedidos por segundo)."],
  ],
  "compacta",
)}

${lembre([
  "Toda arquitetura tem custo: escolha a que custa menos para o seu problema, time e momento.",
  "Comece pela caixa verde e suba um degrau por vez, só quando uma dor medida pedir.",
  "Fronteiras pelo negócio, dados com dono e decisões registradas valem em qualquer arquitetura do livro.",
])}

${pratica(
  "Um recado da Julia",
  "<p>Se você chegou até aqui, já sabe fazer as duas perguntas que mais importam: <b>qual dor</b> esta escolha resolve e <b>qual custo</b> ela cobra. Agora é praticar: no próximo projeto ou na próxima entrevista, volte a esta cola. E me conta lá no @juliacardoso.dev o que você construiu. Obrigada por ler. Um abraço, Julia.</p>",
)}
`;
