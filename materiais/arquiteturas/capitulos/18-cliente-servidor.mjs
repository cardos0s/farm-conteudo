// Capítulo 18: Cliente-servidor e N camadas físicas. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, check, claro, cor, etiqueta, fila, linha, navegador, nuvem, pessoa, quadro, ret, semear, servidor, seta, txt, xis } from "../desenho.mjs";

/** Diagrama principal: 2 camadas x 3 camadas, com as colunas de papel (apresentação, aplicação, dados). */
function duasETres() {
  semear("cliente-servidor-1");
  let s = "";
  // cabeçalho das colunas
  s += txt(120, 22, "apresentação", { tam: 18, cor: cor.azul });
  s += txt(120, 44, "o que o usuário vê", { tam: 15, cor: cor.cinza });
  s += txt(387, 22, "aplicação", { tam: 18, cor: cor.laranja });
  s += txt(387, 44, "as regras", { tam: 15, cor: cor.cinza });
  s += txt(640, 22, "dados", { tam: 18, cor: cor.violeta });
  s += txt(640, 44, "o que fica guardado", { tam: 15, cor: cor.cinza });

  // linha A: 2 camadas
  s += ret(8, 60, 744, 160, { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  s += txt(24, 80, "2 camadas: cliente + banco", { tam: 17, ancora: "start" });
  s += navegador(40, 96, 160, 84, "telas + regras", { tam: 16 });
  s += txt(120, 200, "app instalado em cada PC", { tam: 15 });
  s += seta(204, 140, 584, 140, { espessura: 2, rotulo: "SQL direto", dy: -14 });
  s += txt(394, 168, "senha do banco em cada PC", { tam: 15, cor: cor.vermelho });
  s += txt(394, 190, "regra mudou? reinstala tudo", { tam: 15, cor: cor.vermelho });
  s += banco(590, 88, 100, 104, "banco", { preench: claro.violeta });

  // linha B: 3 camadas
  s += ret(8, 236, 744, 176, { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  s += txt(24, 256, "3 camadas: cliente + API + banco", { tam: 17, ancora: "start" });
  s += navegador(40, 274, 160, 84, "site ou app", { tam: 16 });
  s += txt(120, 378, "navegador ou celular", { tam: 15 });
  s += seta(204, 318, 296, 318, { espessura: 2, cor: cor.azul, rotulo: "HTTP", dy: -14 });
  s += bloco(300, 274, 175, 86, "", { preench: claro.laranja });
  s += txt(387, 302, "API", { tam: 20 });
  s += txt(387, 334, "regras + segurança", { tam: 15 });
  s += seta(479, 318, 584, 318, { espessura: 2, cor: cor.violeta, rotulo: "SQL", dy: -14 });
  s += banco(590, 266, 100, 104, "banco", { preench: claro.violeta });
  s += txt(387, 392, "senha do banco e regras só aqui", { tam: 15, cor: cor.verde });
  return quadro(760, 420, s);
}

/** N camadas: o caminho de um pedido por CDN, balanceador, cópias da API, cache, banco e fila. */
function nCamadas() {
  semear("cliente-servidor-2");
  let s = "";
  s += pessoa(42, 190, { rotulo: "usuário" });
  // CDN
  s += nuvem(98, 14, 190, 104, "CDN\nimagens, JS, CSS", { tam: 15, preench: claro.ciano });
  s += seta(56, 172, 122, 124, { cor: cor.ciano, espessura: 1.8 });
  // balanceador
  s += seta(66, 210, 110, 210, { espessura: 1.8 });
  s += bloco(114, 184, 150, 54, "balanceador", { tam: 16, preench: claro.cinza });
  // cópias da API (sem estado)
  s += ret(318, 40, 118, 318, { tracejado: true, cor: cor.laranja, espessura: 1.5 });
  [54, 152, 250].forEach((y, i) => {
    s += servidor(345, y, 64, 72, `API ${i + 1}`, { luz: cor.laranja });
    s += seta(268, 211, 341, y + 36, { espessura: 1.6 });
  });
  s += txt(377, 378, "cópias sem estado", { tam: 15, cor: cor.laranja });
  // o que a API usa
  s += bloco(512, 50, 150, 54, "cache", { tam: 17, preench: claro.vermelho });
  s += txt(587, 122, "Redis", { tam: 15, cor: cor.cinza });
  s += seta(440, 100, 508, 80, { espessura: 1.6 });
  s += banco(537, 150, 100, 100, "banco", { preench: claro.violeta });
  s += txt(587, 268, "Postgres", { tam: 15, cor: cor.cinza });
  s += seta(440, 200, 533, 200, { espessura: 1.6 });
  s += fila(512, 296, 112, 42, "fila (trabalho lento)", { preench: claro.amarelo });
  s += seta(440, 312, 508, 317, { espessura: 1.6 });
  s += seta(628, 317, 664, 317, { espessura: 1.6 });
  s += servidor(670, 282, 60, 72, "worker", { luz: cor.cinza });
  s += txt(700, 392, "e-mails, PDFs", { tam: 15, cor: cor.cinza });
  return quadro(760, 404, s);
}

/** Com estado x sem estado atrás do balanceador. */
function comESemEstado() {
  semear("cliente-servidor-3");
  let s = "";
  s += linha([[380, 10], [380, 342]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });

  // com estado
  s += txt(185, 20, "com estado", { tam: 19, cor: cor.vermelho });
  s += txt(185, 44, "sessão na memória do servidor", { tam: 15, cor: cor.cinza });
  s += pessoa(185, 70, {});
  s += txt(212, 82, "Ana", { tam: 15, ancora: "start" });
  s += seta(185, 112, 185, 132, { espessura: 1.8 });
  s += bloco(110, 134, 150, 44, "balanceador", { tam: 16, preench: claro.cinza });
  s += servidor(60, 218, 64, 72, "servidor A");
  s += servidor(246, 218, 64, 72, "servidor B");
  s += seta(150, 181, 98, 214, { cor: cor.verde, espessura: 1.8, rotulo: "1º pedido", dx: -50, dy: -4 });
  s += seta(220, 181, 272, 214, { cor: cor.vermelho, espessura: 1.8, rotulo: "2º pedido", dx: 50, dy: -4 });
  s += etiqueta(92, 328, "sessão da Ana", { preench: claro.amarelo });
  s += xis(344, 254, 18);
  s += txt(278, 328, "\"quem é você?\"", { tam: 15, cor: cor.vermelho });

  // sem estado
  s += txt(575, 20, "sem estado", { tam: 19, cor: cor.verde });
  s += txt(575, 44, "sessão no token ou no Redis", { tam: 15, cor: cor.cinza });
  s += pessoa(575, 70, {});
  s += etiqueta(636, 86, "token", { preench: claro.verde, tam: 15 });
  s += seta(575, 112, 575, 132, { espessura: 1.8 });
  s += bloco(500, 134, 150, 44, "balanceador", { tam: 16, preench: claro.cinza });
  s += servidor(420, 218, 64, 72, "servidor A");
  s += servidor(666, 218, 64, 72, "servidor B");
  s += seta(540, 181, 460, 214, { cor: cor.verde, espessura: 1.8, rotulo: "1º pedido", dx: -52, dy: -4 });
  s += seta(610, 181, 690, 214, { cor: cor.verde, espessura: 1.8, rotulo: "2º pedido", dx: 52, dy: -4 });
  s += bloco(532, 231, 86, 44, "Redis", { tam: 16, preench: claro.vermelho });
  s += seta(488, 253, 528, 253, { duplo: true, tracejado: true, cor: cor.cinza, espessura: 1.4, ponta: 9 });
  s += seta(662, 253, 622, 253, { duplo: true, tracejado: true, cor: cor.cinza, espessura: 1.4, ponta: 9 });
  s += check(452, 330, 18);
  s += check(698, 330, 18);
  s += txt(575, 330, "qualquer um atende", { tam: 15, cor: cor.verde });
  return quadro(760, 348, s);
}

export default `
${resumo(
  "Um lado <b>pede</b> (o cliente) e o outro <b>atende</b> (o servidor). As <b>camadas físicas</b> (tiers) dizem em quantas partes separadas (processos ou máquinas) esse trabalho se divide: tela, regras, dados e, quando o volume cresce, cache, filas e CDN no caminho.",
  "Num restaurante, você não entra na cozinha: faz o pedido ao garçom, que traz o prato. Com a casa cheia, entram mais garçons, e qualquer um atende sua mesa, porque o pedido está anotado na comanda, não na cabeça de um garçom específico.",
)}

<p>Cliente-servidor é o modelo mais comum dos sistemas em rede: o navegador pedindo uma página, o app do banco
consultando o saldo, o jogo online sincronizando a partida. Antes dele, um mainframe fazia tudo e os terminais só
mostravam texto. Com os PCs ligados em rede, nos anos 1980 e 1990, o trabalho passou a ser dividido: o computador da
pessoa cuidava da tela e um servidor cuidava dos dados. A web popularizou o desenho de 3 camadas que quase todo app usa
hoje. Atenção ao nome: no capítulo 4 as camadas eram <b>lógicas</b> (layers, a organização do código); aqui elas são
<b>físicas</b> (tiers): processos ou máquinas diferentes, com a rede no meio.</p>

${fig(duasETres(), "Em 2 camadas, tela e regras vivem no cliente, que fala direto com o banco. Em 3 camadas, uma API no meio guarda as regras e a senha do banco.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Cliente</b>: quem toma a iniciativa. Abre a conexão, faz o pedido e mostra o resultado. Pode ser um navegador,
um app de celular, um script ou outro servidor (a própria API é cliente do banco).</li>
<li><b>Servidor</b>: fica ligado esperando pedidos e atende muitos clientes ao mesmo tempo. Guarda o que precisa ser
central: os dados, as regras que importam e os segredos.</li>
<li><b>Protocolo</b>: o combinado de como pedir e responder (HTTP, gRPC, WebSocket). O cliente conhece o contrato, não
o que o servidor tem por dentro. No HTTP comum, só o cliente inicia a conversa; para o servidor avisar algo na hora
(nova mensagem no chat, pedido saiu para entrega), o cliente mantém uma conexão aberta, como um WebSocket.</li>
<li><b>Sem memória entre pedidos</b>: o HTTP é <b>sem estado</b>. O servidor não "lembra" do pedido anterior, a menos
que o cliente mande algo que diga quem ele é (um cookie ou um token).</li>
</ul>

<h4>2, 3 ou N camadas físicas</h4>
<ul>
<li><b>2 camadas (cliente + banco)</b>: o app instalado conecta direto no banco. Era o padrão dos sistemas desktop dos
anos 1990 (Delphi, Visual Basic), com as regras no cliente ou em <i>stored procedures</i> (procedimentos guardados no
banco). É simples, mas cada PC guarda a senha do banco e abre conexões direto nele, e toda mudança de regra pede
atualizar o app em todas as máquinas.</li>
<li><b>3 camadas (apresentação, aplicação, dados)</b>: entra um servidor de aplicação no meio, normalmente uma API. O
cliente só fala com ela; só ela fala com o banco. É o padrão de quase todo app web e mobile.</li>
<li><b>N camadas</b>: as 3 camadas mais peças especializadas, cada uma resolvendo um gargalo: <b>CDN</b> (servidores
espalhados pelo mundo que entregam imagens, JS e CSS perto do usuário), <b>balanceador de carga</b> (distribui os pedidos
entre cópias da API), <b>cache</b> (memória rápida para leituras repetidas, como o Redis), <b>fila e workers</b> (trabalho
lento fora da requisição, como gerar PDF ou mandar e-mail), <b>réplicas de leitura</b> do banco e <b>busca</b>
(como o Elasticsearch).</li>
</ul>

${fig(nCamadas(), "N camadas: arquivos estáticos saem da CDN; os pedidos à API passam pelo balanceador, que escolhe uma das cópias. Elas leem do cache e do banco e jogam o trabalho lento numa fila.")}

<h4>Servidores sem estado atrás do balanceador</h4>
<p>Para aguentar mais gente, você pode comprar um servidor maior (escala vertical, que tem teto) ou colocar <b>mais
cópias</b> da API atrás de um balanceador (escala horizontal). A segunda só funciona se as cópias forem <b>sem
estado</b> (stateless): nenhuma guarda nada do usuário na própria memória ou no próprio disco entre um pedido e outro.
O que precisa durar vai para fora: a sessão num token ou num Redis, os arquivos num armazenamento de objetos (como o S3),
os dados no banco. O ganho: qualquer cópia atende qualquer pedido, dá para somar ou tirar máquinas a qualquer hora
(autoscaling), o deploy troca uma cópia de cada vez e, se uma cair, o balanceador para de mandar pedidos para ela.</p>
${fig(comESemEstado(), "Com estado, o segundo pedido cai num servidor que não conhece a sessão. Sem estado, a identidade viaja no token (ou fica num Redis compartilhado) e qualquer servidor atende.")}

<p>Existe um atalho, a <i>sticky session</i> (o balanceador manda o mesmo usuário sempre para o mesmo servidor). Ela
salva às pressas um app que guarda sessão em memória, mas se aquele servidor cair ou sair num deploy, a sessão vai junto.
Use como ponte, não como destino.</p>

<h4>Cliente magro x cliente gordo</h4>
<p>A pergunta é: quanto trabalho fica no aparelho da pessoa?</p>
${tabela(
  ["", "Cliente magro", "Cliente gordo (ou rico)"],
  [
    ["<b>O que faz</b>", "Só mostra e coleta dados; o servidor monta as telas e decide tudo", "Monta as telas, guarda estado e às vezes dados locais; pode funcionar offline"],
    ["<b>Exemplos</b>", "Site renderizado no servidor (PHP, Rails, Django), terminal de mainframe", "App desktop, SPA em React, app de celular, jogo"],
    ["<b>Você ganha</b>", "Atualiza num lugar só; roda em aparelho simples", "Interface rápida, menos idas ao servidor, modo offline"],
    ["<b>Você paga</b>", "Depende da rede a cada clique", "Versões antigas do app continuam em uso; validação duplicada"],
  ],
)}
<p>Na prática é uma régua, não duas caixas: um site em Next.js renderiza parte no servidor e parte no navegador. Só uma
coisa não muda: <b>mesmo com cliente gordo, quem decide é o servidor</b>. O cliente valida para responder rápido; o
servidor valida de novo, porque o cliente pode ser alterado por quem o usa.</p>

<h4>Tier não é layer</h4>
${tabela(
  ["", "Layer: camada lógica (capítulo 4)", "Tier: camada física (este capítulo)"],
  [
    ["<b>O que é</b>", "Uma parte do código: rotas, serviços, repositórios", "Um lugar onde o código roda: outro processo, outra máquina"],
    ["<b>Como conversa</b>", "Chamada de função: rápida, sem rede no meio", "Chamada de rede: leva milissegundos e pode falhar, demorar ou se repetir"],
  ],
)}
<p>Em português as duas viram "camada", mas não são a mesma coisa. O normal é ter várias layers dentro de um único tier: a API do exemplo abaixo é um tier só, com três layers dentro.</p>

${quando(
  [
    "Vários usuários veem e mudam os mesmos dados, e regras e segredos (preço, saldo, permissões) precisam ficar longe do usuário.",
    "<b>3 camadas</b>: quase todo app web ou mobile. É o ponto de partida padrão.",
    "<b>2 camadas</b>: só ferramenta interna, com poucos usuários, numa rede confiável e com acesso ao banco limitado (um relatório com usuário só de leitura).",
    "<b>N camadas</b>: quando um gargalo medido aparece (páginas lentas, banco sobrecarregado, tarefas longas travando pedidos).",
  ],
  [
    "2 camadas em app público: cliente com acesso direto ao banco expõe a senha e as regras.",
    "Os participantes trocam dados entre si sem um centro, ou a banda do servidor central explode (veja peer-to-peer, capítulo 19).",
    "O app precisa funcionar sem internet: cliente magro não serve; você vai precisar de dados locais e sincronização.",
    "Somar tiers \"por garantia\": cada salto de rede soma latência, custo e um ponto de falha.",
  ],
)}

${medidor({ complexidade: 2, escala: 4, operacao: 2, aprendizado: 1, time: "qualquer tamanho (notas para 3 camadas sem estado)" })}

<h3>Como usar na prática</h3>
<p>Exemplo: uma loja com site em React, API em Node e banco Postgres, com a API pronta para rodar em várias cópias.</p>
${pastas(`
loja/
├── web/src/                    # tier 1: cliente (roda no navegador)
│   ├── telas/                  # mostra e coleta dados
│   └── api.ts                  # único arquivo que faz fetch
├── api/src/                    # tier 2: servidor de aplicação
│   ├── rotas/                  # as layers do capítulo 4
│   ├── servicos/               #   moram dentro deste tier
│   ├── repositorios/           # só daqui se fala com o banco
│   └── main.ts
├── docker-compose.yml          # Postgres, Redis e 2 cópias da api
└── nginx.conf                  # balanceador na frente das cópias
`)}

${codigo(
  `
// web/src/api.ts: o cliente pede e mostra; regras e dados ficam no servidor
type Pedido = { id: string; total: number; status: string };
const API = "/api"; // mesmo domínio do site: o Nginx repassa para a API (sem CORS)

export async function listarPedidos(token: string): Promise<Pedido[]> {
  const resp = await fetch(\`\${API}/pedidos\`, {
    headers: { Authorization: \`Bearer \${token}\` }, // a "comanda" vai em todo pedido
    signal: AbortSignal.timeout(5000), // a rede falha: não espere para sempre
  });
  if (resp.status === 401) throw new Error("Sessão expirada: faça login de novo");
  if (!resp.ok) throw new Error(\`Erro \${resp.status} ao buscar pedidos\`);
  return resp.json();
}`,
  "web/src/api.ts",
)}

${codigo(
  `
// api/src/main.ts: nada do usuário fica na memória entre um pedido e outro
import express from "express";
import jwt from "jsonwebtoken";
import { pedidos, usuarios } from "./repositorios"; // falam com o Postgres

const app = express();
app.use(express.json());
const SEGREDO = process.env.JWT_SEGREDO!; // o mesmo em todas as cópias

app.post("/login", async (req, res) => {
  const usuario = await usuarios.conferirSenha(req.body.email, req.body.senha);
  if (!usuario) { res.status(401).json({ erro: "E-mail ou senha inválidos" }); return; }
  const token = jwt.sign({ sub: usuario.id }, SEGREDO, { expiresIn: "15m" });
  res.json({ token }); // a comanda fica com o cliente, não com o servidor
});`,
  "api/src/main.ts (login)",
)}

${codigo(
  `
// cada pedido traz o token; qualquer cópia da API confere sozinha
app.get("/pedidos", async (req, res) => {
  const usuarioId = idDoToken(req.headers.authorization);
  if (!usuarioId) { res.status(401).json({ erro: "Token inválido ou expirado" }); return; }
  res.json(await pedidos.doCliente(usuarioId)); // vem do banco, não da memória
});

function idDoToken(header = ""): string | null {
  try {
    return (jwt.verify(header.replace("Bearer ", ""), SEGREDO) as { sub: string }).sub;
  } catch {
    return null; // assinatura errada ou token vencido
  }
}

app.get("/saude", (_req, res) => { res.send("ok"); }); // o balanceador consulta esta rota
app.listen(3000);`,
  "api/src/main.ts (rotas protegidas)",
)}

<p>A outra forma de manter a API sem estado é guardar a sessão num cache compartilhado. No login, o servidor grava a
sessão no Redis com prazo de validade (<code>EX</code>) e manda só um id aleatório num cookie; em cada pedido, qualquer
cópia busca esse id no Redis. A vantagem sobre o token: apagar a chave derruba a sessão na hora.</p>

<h4>Passo a passo para montar</h4>
${passos([
  "Comece com 3 camadas: cliente (web ou app), API e banco. O cliente nunca recebe a senha do banco, e toda regra que importa (preço, estoque, permissões) roda no servidor, mesmo que o cliente também valide.",
  "Deixe a API sem estado: sessão em token assinado ou no Redis; uploads num armazenamento de objetos, não no disco local; segredos em variáveis de ambiente iguais em todas as cópias.",
  "Crie uma rota de saúde (<code>/saude</code>) e suba 2 cópias atrás de um balanceador (Nginx ou o da sua nuvem) desde cedo. Se algo depende de estado local, você descobre agora, não no dia do pico.",
  "Só então some tiers, um de cada vez e por um motivo medido: CDN para arquivos estáticos, cache para leituras repetidas, fila e workers para trabalho lento.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Dados e regras num lugar só: uma fonte de verdade, mais fácil de proteger", "O servidor vira ponto central de falha: precisa de cópias e monitoramento"],
    ["Cliente leve: atualizar o servidor não exige reinstalar nada (na web)", "Sem rede, nada funciona (a menos que você invista em modo offline)"],
    ["Servidores sem estado escalam colocando mais cópias atrás do balanceador", "O banco continua sendo a parte mais difícil de escalar"],
    ["Cada tier cresce e é protegido separadamente (o banco fica numa rede privada)", "Cada tier a mais soma latência, custo e uma peça para cair"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Cliente direto no banco em app público</b>: a senha do banco vai dentro do app ou do JavaScript. Qualquer pessoa
consegue extrair e ganha acesso total aos dados.</li>
<li><b>Confiar no cliente</b>: o preço e o desconto vêm do front e o servidor aceita. O usuário pode editar a requisição;
o servidor precisa recalcular tudo.</li>
<li><b>Estado escondido no servidor</b>: sessão em memória, upload no disco local, cache em variável global, tarefa
agendada rodando em cada cópia. Funciona com 1 servidor e quebra (ou manda o mesmo e-mail duas vezes) com 2.</li>
<li><b>Cliente tagarela</b>: a tela faz 20 pedidos em sequência para se montar, e cada um paga a ida e volta da rede.
Crie um endpoint pensado para aquela tela, que junta os dados no servidor.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O Stack Overflow é o exemplo clássico de que N camadas bem feitas vão longe. Nick Craver, engenheiro de lá, descreveu a arquitetura numa série de posts (<i>Stack Overflow: The Architecture</i>, edição de 2016): balanceadores HAProxy na frente, poucos servidores web rodando a aplicação, SQL Server como banco, Redis como cache e Elasticsearch para a busca. Sem microsserviços: é um monólito (capítulo 11) distribuído em tiers, cada um com um papel claro.</p>",
)}

${dica(
  "Firebase e Supabase são 2 camadas?",
  "<p>O app parece falar direto com o banco, mas fala com a API do provedor. Quem faz o papel da camada de aplicação são as regras de acesso: as <i>Security Rules</i> no Firebase e o <i>Row Level Security</i> do Postgres no Supabase. Sem essas regras bem escritas, é 2 camadas com a porta aberta.</p>",
)}

${alerta(
  "Token não é cofre nem tem botão de desligar",
  "<p>O conteúdo de um JWT é só codificado: qualquer pessoa consegue ler. A assinatura garante apenas que ninguém o alterou, então não coloque segredos nele. E um token continua válido até expirar: use validade curta com <i>refresh token</i>, ou sessão no Redis quando precisar derrubar acessos na hora (troca de senha, celular roubado).</p>",
)}

${combina([
  [4, "Camadas", "as layers que moram dentro de cada tier"],
  [11, "Monólito", "o servidor de aplicação mais comum em 3 camadas"],
  [14, "Microsserviços", "quebram o tier de aplicação em vários serviços"],
  [15, "Serverless", "tier de aplicação já sem estado, sem máquina para cuidar"],
  [19, "Peer-to-peer", "a alternativa sem servidor central"],
  [24, "Space-based", "quando o banco central vira o gargalo"],
])}

${lembre([
  "O cliente pede e o servidor decide: dados, regras e segredos ficam no servidor, e ele revalida tudo que o cliente manda.",
  "Tier é físico (outro processo ou máquina, com a rede no meio); layer é a organização do código (capítulo 4).",
  "3 camadas com servidores sem estado atrás de um balanceador é o padrão seguro; cache, fila e CDN entram quando um gargalo medido pede.",
])}
`;
