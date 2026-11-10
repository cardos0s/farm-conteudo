// Capítulo 17: Arquitetura em células (cell-based). Segue o modelo do capítulo 6:
// abertura (resumo) → diagrama → como funciona (raio de impacto, crescer, mover clientes) → quando usar → medidor
// → na prática (pastas + código + passos) → vantagens e custos → erros comuns → mundo real → combina com → para lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, evento, fila, linha, passo, pessoa, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

// cores de cada célula (e dos clientes que moram nela)
const TONS = [
  { claro: claro.azul, forte: cor.azul },
  { claro: claro.laranja, forte: cor.laranja },
  { claro: claro.violeta, forte: cor.violeta },
];

/** Uma célula: a pilha inteira (API, serviços, banco e fila) dentro de uma moldura. */
function celula(x, y, n, quem, tom) {
  const w = 210, h = 196;
  let s = ret(x, y, w, h, { preench: tom.claro, gap: 10, espessura: 2.4, cor: tom.forte });
  s += txt(x + w / 2, y + 20, `célula ${n}`, { tam: 18, cor: tom.forte });
  s += txt(x + w / 2, y + 43, quem, { tam: 15, cor: cor.tinta });
  s += bloco(x + 20, y + 56, 170, 32, "API", { preench: "#ffffff", hachura: "solid", tam: 15 });
  s += bloco(x + 20, y + 98, 80, 32, "pedidos", { preench: "#ffffff", hachura: "solid", tam: 15 });
  s += bloco(x + 110, y + 98, 80, 32, "estoque", { preench: "#ffffff", hachura: "solid", tam: 15 });
  s += banco(x + 24, y + 140, 76, 40, "dados", { preench: "#ffffff", tam: 15 });
  s += fila(x + 116, y + 146, 70, 24, "fila");
  return s;
}

function diagrama() {
  semear("celulas-1");
  let s = "";
  // clientes (lojas), pintados com a cor da célula onde moram
  const lojas = [
    [110, "loja A", 0],
    [230, "loja B", 1],
    [350, "loja C", 2],
    [470, "loja D", 0],
  ];
  for (const [x, nome, t] of lojas) {
    s += pessoa(x, 24, { preench: TONS[t].claro, rotulo: nome });
    s += seta(x, 92, x, 114, { espessura: 1.8 });
  }
  // roteador: camada fina com o mapa tenant → célula
  s += bloco(30, 116, 530, 76, "", { preench: claro.amarelo, gap: 9 });
  s += txt(165, 142, "roteador de células", { tam: 19 });
  s += txt(165, 168, "lê a loja e repassa", { tam: 15, cor: cor.cinza });
  s += ret(320, 124, 226, 60, { preench: "#ffffff", hachura: "solid", espessura: 1.4 });
  s += txt(433, 138, "mapa loja → célula", { tam: 14, cor: cor.cinza });
  s += txt(385, 158, "A → 1", { tam: 15 });
  s += txt(481, 158, "B → 2", { tam: 15 });
  s += txt(385, 176, "C → 3", { tam: 15 });
  s += txt(481, 176, "D → 1", { tam: 15 });
  // plano de controle: fora do caminho das requisições
  s += bloco(592, 116, 148, 76, "", { preench: claro.cinza, gap: 8, tracejado: true });
  s += txt(666, 136, "plano de controle", { tam: 15, cor: cor.tinta });
  s += txt(666, 167, "cria células,\nmove clientes", { tam: 15, cor: cor.cinza });
  s += seta(590, 154, 550, 154, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += seta(666, 194, 666, 230, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  // células
  s += seta(135, 194, 135, 230, { cor: cor.azul, espessura: 2 });
  s += seta(380, 194, 380, 230, { cor: cor.laranja, espessura: 2 });
  s += seta(520, 194, 590, 230, { cor: cor.violeta, espessura: 2 });
  s += celula(30, 232, 1, "lojas A e D", TONS[0]);
  s += celula(275, 232, 2, "loja B", TONS[1]);
  s += celula(520, 232, 3, "loja C", TONS[2]);
  // uma célula não chama a outra
  s += xis(257, 330, 16);
  s += xis(502, 330, 16);
  s += txt(380, 448, "cada célula tem a pilha inteira e dados próprios; uma não chama a outra", { tam: 16, cor: cor.vermelho });
  return quadro(760, 462, s);
}

function raioDeImpacto() {
  semear("celulas-2");
  let s = "";
  // esquerda: um sistema só
  s += txt(190, 16, "um sistema só", { tam: 18 });
  s += ret(30, 46, 320, 170, { preench: claro.vermelho, gap: 9, espessura: 2.2 });
  for (let l = 0; l < 3; l++) for (let c = 0; c < 4; c++) s += pessoa(80 + c * 74, 64 + l * 52, { preench: claro.vermelho, cor: cor.vermelho });
  s += evento(344, 32, 32, cor.vermelho);
  s += txt(190, 240, "um deploy com bug derruba", { tam: 16, cor: cor.vermelho });
  s += txt(190, 262, "100% dos clientes", { tam: 18, cor: cor.vermelho });
  // direita: quatro células
  s += txt(570, 16, "o mesmo sistema em 4 células", { tam: 18 });
  const caixas = [
    [400, 46, true],
    [580, 46, false],
    [400, 136, false],
    [580, 136, false],
  ];
  for (const [x, y, doente] of caixas) {
    s += ret(x, y, 160, 80, { preench: doente ? claro.vermelho : claro.verde, gap: 9, espessura: 2.2, cor: doente ? cor.vermelho : cor.verde });
    for (let c = 0; c < 3; c++) s += pessoa(x + 34 + c * 46, y + 20, { preench: doente ? claro.vermelho : claro.verde, cor: doente ? cor.vermelho : cor.tinta });
  }
  s += evento(554, 32, 32, cor.vermelho);
  s += txt(570, 240, "o mesmo bug atinge 1 célula:", { tam: 16, cor: cor.vermelho });
  s += txt(570, 262, "cerca de 25% dos clientes", { tam: 18, cor: cor.vermelho });
  s += txt(380, 294, "com N células iguais, uma falha atinge mais ou menos 1/N dos clientes", { tam: 16, cor: cor.tinta });
  return quadro(760, 306, s);
}

function moverCliente() {
  semear("celulas-3");
  let s = "";
  // roteador com o mapa sendo trocado
  s += bloco(250, 6, 260, 64, "", { preench: claro.amarelo, gap: 9 });
  s += txt(380, 24, "roteador", { tam: 18 });
  s += txt(330, 50, "D → 1", { tam: 17, cor: cor.cinza });
  s += linha([[304, 51], [356, 49]], { cor: cor.vermelho, espessura: 2.4 });
  s += txt(430, 50, "D → 3", { tam: 17, cor: cor.verde });
  s += passo(532, 38, "3", cor.verde);
  s += txt(550, 38, "troca o mapa", { tam: 15, ancora: "start", cor: cor.verde });
  // setas do roteador: antes (tracejada) e depois
  s += seta(290, 72, 150, 124, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += txt(192, 88, "antes", { tam: 15, cor: cor.cinza });
  s += seta(470, 72, 610, 124, { cor: cor.verde, espessura: 2.2 });
  s += txt(570, 88, "depois", { tam: 15, cor: cor.verde });
  // origem e destino
  s += ret(30, 126, 190, 110, { preench: claro.azul, gap: 10, espessura: 2.2, cor: cor.azul });
  s += txt(125, 146, "célula 1 (origem)", { tam: 17, cor: cor.azul });
  s += banco(85, 162, 80, 56, "loja D", { preench: "#ffffff", tam: 15 });
  s += ret(540, 126, 190, 110, { preench: claro.violeta, gap: 10, espessura: 2.2, cor: cor.violeta });
  s += txt(635, 146, "célula 3 (destino)", { tam: 17, cor: cor.violeta });
  s += banco(595, 162, 80, 56, "loja D", { preench: "#ffffff", tam: 15 });
  // cópia em duas etapas
  s += seta(172, 178, 590, 178, { espessura: 2 });
  s += passo(246, 158, "1");
  s += txt(264, 158, "copia os dados (loja no ar)", { tam: 15, ancora: "start" });
  s += seta(172, 204, 590, 204, { espessura: 2, cor: cor.laranja });
  s += passo(246, 226, "2", cor.laranja);
  s += txt(264, 226, "bloqueia escrita, copia o resto", { tam: 15, ancora: "start", cor: cor.laranja });
  // limpeza
  s += passo(46, 254, "4", cor.cinza);
  s += txt(64, 254, "depois de um tempo, apaga a cópia antiga da origem", { tam: 15, ancora: "start", cor: cor.cinza });
  s += txt(380, 282, "a loja D fica só alguns segundos sem poder gravar", { tam: 16, cor: cor.vermelho });
  return quadro(760, 294, s);
}

export default `
${resumo(
  "Em vez de um sistema gigante para todos os clientes, você roda várias <b>cópias completas e isoladas</b> dele, as <b>células</b>, cada uma atendendo uma fatia dos clientes. Um <b>roteador</b> bem fino só diz em qual célula mora cada cliente.",
  "Um condomínio com vários prédios iguais, cada um com sua caixa d'água e seu quadro de luz. Se a bomba de um prédio queima, só aquele prédio fica sem água. A portaria não resolve nada: só diz a cada visitante em qual prédio o morador mora.",
)}

<p>A inspiração é o padrão <i>bulkhead</i> (antepara), que vem dos navios: o casco é dividido em compartimentos estanques,
e um furo alaga só um compartimento. A AWS diz que seus times usam células há mais de uma década e publicou em 2023 um
guia sobre o tema no Well-Architected Framework; no mesmo ano, o Slack contou como migrou. Repare que o assunto aqui é como o sistema é
<b>dividido e implantado</b>, não como o código é organizado: dentro de cada célula pode rodar um monólito (capítulo 11)
ou um conjunto de microsserviços (capítulo 14).</p>

${fig(diagrama(), "Cada loja mora numa célula. O roteador consulta o mapa e repassa; o plano de controle cria células e move lojas, fora do caminho das requisições.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Célula</b>: uma cópia completa da pilha (serviços, banco, cache, fila) que atende só os clientes que moram nela.
Não chama as outras células e roda o mesmo código que elas.</li>
<li><b>Chave de partição</b>: o critério que decide quem mora onde. Num SaaS, quase sempre é o <i>tenant</i> (o cliente
que assina o produto: empresa, loja, conta). Tudo o que ele faz precisa caber na célula dele.</li>
<li><b>Roteador de células</b>: a única peça compartilhada no caminho das requisições. Lê a chave (subdomínio, cabeçalho
ou token), consulta o mapa <code>tenant → célula</code> e repassa. Pode ser um proxy próprio, um API gateway ou até o DNS
(cada cliente com um subdomínio que aponta para a sua célula). Sem regra de negócio: quanto mais fino, menor a chance de
ele mesmo derrubar todo mundo.</li>
<li><b>Plano de controle</b> (<i>control plane</i>): cria células, escolhe a célula de cada cliente novo, move clientes e
atualiza o mapa. Se ele cair, as células seguem atendendo; só não dá para criar nem mover nada.</li>
<li><b>Tamanho máximo</b>: cada célula tem um limite (clientes, requisições por segundo, gigabytes) testado com carga.
Chegou perto? Você não aumenta a célula: cria outra.</li>
</ul>

<h4>O ganho principal: raio de impacto</h4>
<p><b>Raio de impacto</b> (<i>blast radius</i>) é quantos clientes sentem uma falha. Num sistema único, um deploy com bug,
a consulta pesada de um cliente (o "vizinho barulhento") ou um banco que trava atingem todo mundo. Em células, a falha fica
presa em uma célula. E o deploy vira ondas: a versão nova vai para uma célula, o time observa os alarmes e só depois segue.</p>

${fig(raioDeImpacto(), "A falha é a mesma; muda quantos clientes ela alcança (no deploy, desde que ele vá uma célula por vez).")}

<h4>Crescer é adicionar células</h4>
<p>Num sistema único, crescer é caçar o próximo gargalo. Em células, é repetir algo conhecido: criar mais uma célula igual
às que você já testou no limite. Por isso a infraestrutura precisa ser código (Terraform, CloudFormation, Pulumi).</p>

${quando(
  [
    "SaaS multi-tenant grande, com muitos clientes que quase não compartilham dados.",
    "Uma queda geral custa muito caro: SLA alto, pagamentos, comunicação.",
    "O sistema ficou grande demais para um teste de carga reproduzir.",
    "Clientes grandes atrapalham os pequenos, ou exigem isolamento.",
  ],
  [
    "Produto pequeno ou médio: réplicas, várias zonas e deploy gradual custam muito menos.",
    "Os dados não se dividem por cliente (rede social, busca global).",
    "Não há infraestrutura como código nem deploy automatizado.",
    "Não há time de plataforma ou SRE para operar tudo isso.",
  ],
)}

${medidor({ complexidade: 4, escala: 5, operacao: 5, aprendizado: 4, time: "organizações grandes, com time de plataforma/SRE" })}

<h3>Como usar na prática</h3>
${pastas(`
plataforma/
├── roteador/               # camada fina: descobre a célula e repassa
│   ├── mapa.ts             # tenant → célula, com cache
│   └── main.ts             # proxy HTTP
├── plano-de-controle/      # cria células, coloca e move clientes
├── app/                    # o sistema em si, igual em todas as células
└── infra/modulo-celula/    # Terraform: 1 célula = API + banco + cache + fila
`)}

${codigo(
  `
// roteador/mapa.ts: responde só "em qual célula mora este tenant?"
export interface Celula { id: string; endereco: string } // "https://celula-3.interno"
export interface Tabela { buscar(tenantId: string): Promise<Celula | null> } // ex.: DynamoDB
export class TenantDesconhecido extends Error {}

export class MapaDeCelulas {
  private cache = new Map<string, { celula: Celula; validoAte: number }>();
  constructor(private tabela: Tabela, private ttlMs = 10000) {}

  async celulaDo(tenantId: string): Promise<Celula> {
    const guardado = this.cache.get(tenantId);
    if (guardado && guardado.validoAte > Date.now()) return guardado.celula;
    let celula: Celula | null;
    try { celula = await this.tabela.buscar(tenantId); }
    catch (erro) { if (guardado) return guardado.celula; throw erro; } // tabela fora? usa o cache
    if (!celula) throw new TenantDesconhecido(tenantId);
    this.cache.set(tenantId, { celula, validoAte: Date.now() + this.ttlMs });
    return celula;
  }
}`,
  "plataforma/roteador/mapa.ts",
)}

${codigo(
  `
// roteador/main.ts: descobre a célula e repassa a requisição inteira; nada de regra de negócio
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { MapaDeCelulas, TenantDesconhecido } from "./mapa";
import { TabelaDynamo } from "./tabela-dynamo";

const mapa = new MapaDeCelulas(new TabelaDynamo("mapa-de-celulas"));
const tenantDe = (host = "") => host.split(".")[0]; // "padaria-ze.minhaloja.com" → "padaria-ze"
const app = express();

app.use(createProxyMiddleware({
  changeOrigin: true,
  router: async (req) => (await mapa.celulaDo(tenantDe(req.headers.host))).endereco,
}));
const falhou: express.ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof TenantDesconhecido) res.status(404).json({ erro: "loja não existe" });
  else res.status(503).json({ erro: "célula indisponível, tente de novo" });
};
app.use(falhou);
app.listen(8080);`,
  "plataforma/roteador/main.ts",
)}

<h4>Colocar e mover clientes</h4>
<p>O plano de controle põe cada cliente novo na célula com mais folga. Às vezes um cliente precisa mudar de casa: a célula
encheu, ele cresceu demais ou precisa dos dados em outro país. Mover é a operação mais delicada da arquitetura, porque os
dados são copiados com o cliente usando o sistema.</p>

${fig(moverCliente(), "Copiar com a loja no ar, bloquear a escrita por pouco tempo, trocar o mapa e só depois limpar a origem.")}

${codigo(
  `
// plano-de-controle/mover-cliente.ts: roda fora do caminho das requisições
export async function moverCliente(tenantId: string, origem: CelulaAdmin, destino: CelulaAdmin) {
  await destino.copiarDados(origem, tenantId);       // 1. cópia com a loja no ar
  await origem.bloquearEscrita(tenantId);            // 2. a origem recusa escrita (503)...
  await destino.copiarMudancas(origem, tenantId);    //    ...e o destino pega o que mudou
  await destino.conferir(origem, tenantId);          //    contagens batem? senão, desfaz e aborta
  await tabelaDoMapa.atribuir(tenantId, destino.id); // 3. o mapa aponta para o destino
  await esperar(TTL_DO_CACHE_MS);                    //    o cache dos roteadores vence (10 s)
  await agendarLimpeza(origem, tenantId);            // 4. apaga a cópia antiga depois
}`,
  "plataforma/plano-de-controle/mover-cliente.ts",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Escolha a chave de partição (empresa, loja, conta) e confira que quase nenhuma operação precisa ler dados de dois clientes ao mesmo tempo.",
  "Torne a pilha inteira \"carimbável\": infraestrutura como código, num módulo com parâmetros (nome, tamanho), sem passo manual.",
  "Coloque o roteador na frente do sistema atual, com o mapa apontando todo mundo para a célula 1, que é o próprio sistema de hoje.",
  "Separe o que é realmente global (cadastro de contas, cobrança), mantenha isso pequeno e fora do caminho de cada requisição.",
  "Defina o tamanho máximo de uma célula e faça teste de carga até ele. Crie a célula 2 para clientes novos e, com a migração testada, equilibre os antigos.",
  "Publique versões em ondas (uma célula primeiro) e dê a toda métrica e todo alarme a dimensão \"célula\".",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Uma falha (ou um vizinho barulhento) atinge só os clientes de uma célula", "Infraestrutura duplicada: cada célula tem banco, cache e fila próprios"],
    ["Deploy em ondas: o bug aparece numa célula antes de chegar em todas", "Roteador e mapa viram peças críticas, que todos dividem"],
    ["Crescer é repetir uma unidade conhecida e testada no limite", "Relatórios e buscas sobre todos os clientes precisam juntar várias células"],
    ["Dá para isolar um cliente grande numa célula só dele", "Mover clientes é delicado, e operar N cópias custa mais (deploys, painéis, nuvem)"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Célula que chama outra célula</b>: se a célula 1 depende da 2 para responder, a falha volta a se espalhar. O que
precisa sair de uma célula vai por eventos assíncronos (capítulo 20).</li>
<li><b>Roteador gordo</b>: regra de negócio, agregação de respostas, autenticação complicada. Cada linha a mais nele é
risco para 100% dos clientes.</li>
<li><b>Dependência global escondida</b>: todas as células usam o mesmo banco de sessões ou a mesma fila. No desenho são
células; na hora da falha, é um sistema só.</li>
<li><b>Chave de partição errada</b>: dividir por usuário quando o trabalho acontece por empresa faz uma única tela juntar
dados de várias células.</li>
<li><b>Mapa calculado com divisão</b>: <code>hash(tenant) % N</code> parece elegante, mas ao criar a célula N+1 quase
todos os clientes mudam de casa (e os dados teriam de ir junto). Guarde o mapa numa tabela: cliente só muda de célula quando
o plano de controle decide.</li>
<li><b>Célula sem limite</b>: deixar a célula 1 crescer "porque ainda aguenta" recria o sistema gigante que você queria evitar.</li>
<li><b>Migração só em emergência</b>: a ferramenta de mover clientes falha justo no dia em que é necessária. Use-a com frequência.</li>
</ul>

${pratica(
  "No mundo real",
  `<p><b>AWS.</b> No guia <i>Reducing the Scope of Impact with Cell-Based Architecture</i>, do Well-Architected Framework, a
AWS diz que seus times usam células há mais de uma década para construir serviços mais resilientes. O guia pede um roteador
o mais simples possível, sem regra de negócio, que siga atendendo as outras células quando uma delas cai.</p>
<p><b>Slack.</b> Em 30 de junho de 2021, uma falha de rede numa das zonas de disponibilidade (AZs) da AWS usadas pelo Slack
causou erros para os usuários. O problema era numa zona só, mas partes do sistema discordavam sobre quais servidores estavam
saudáveis (a <i>gray failure</i>, ou falha cinzenta). No post <i>Slack's Migration to a Cellular
Architecture</i> (2023), o time conta a resposta: cada AZ virou uma célula. Cada serviço roda em todas as zonas, mas só fala
com serviços da própria zona; se uma zona adoece, o tráfego é drenado para as outras (a meta é tirar o máximo possível de tráfego
de uma zona em até 5 minutos). Migrar os serviços mais críticos voltados ao usuário levou cerca de um ano e meio.</p>`,
)}

${dica(
  "Cortar por cliente ou por zona?",
  "<p>Em SaaS, o comum é cortar <b>por cliente</b>: protege contra deploy ruim, vizinho barulhento e dados corrompidos. O Slack cortou <b>por zona</b>: toda zona atende todo mundo, e a proteção é contra falhas de infraestrutura. Dá para somar as duas. Outra variação descrita pela AWS é o <i>shuffle sharding</i>: cada cliente recebe uma combinação sorteada de servidores, e dois clientes raramente dividem a combinação inteira.</p>",
)}

${alerta(
  "Célula não é shard, réplica nem microsserviço",
  "<p><b>Shard</b> divide só o banco; a célula divide a pilha inteira. <b>Réplica</b> copia os mesmos dados para leitura ou failover; cada célula tem dados <b>diferentes</b>. <b>Microsserviços</b> (capítulo 14) dividem por função (pedidos, pagamentos); células dividem por cliente, e cada célula pode conter todos os microsserviços.</p>",
)}

${combina([
  [14, "Microsserviços", "cada célula roda o conjunto inteiro de serviços"],
  [12, "Monólito modular", "o conteúdo mais simples para cada célula"],
  [20, "Orientada a eventos", "células publicam eventos para o que é global"],
  [26, "Arquiteturas de dados", "juntar os dados de todas as células para análise"],
  [30, "Como migrar", "o sistema atual vira a célula 1"],
  [2, "Os critérios", "disponibilidade e raio de impacto"],
])}

${lembre([
  "Célula é uma cópia completa e isolada da pilha atendendo uma fatia dos clientes; o roteador só diz onde cada um mora.",
  "O ganho é o raio de impacto: com N células, uma falha atinge cerca de 1/N dos clientes, e crescer vira adicionar células.",
  "Custa caro (infra duplicada, migração de clientes, N cópias para operar): vale em SaaS grande, multi-tenant e com disponibilidade crítica.",
])}
`;
