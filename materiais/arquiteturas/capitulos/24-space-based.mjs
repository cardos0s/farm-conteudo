// Capítulo 24: Space-based. Dados quentes em grades de memória replicadas dentro das unidades de processamento;
// o banco é atualizado depois, por bombas de dados. Estrutura igual à do capítulo-modelo (06-hexagonal).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, etiqueta, fila, linha, pessoa, quadro, ret, semear, servidor, seta, txt, xis } from "../desenho.mjs";

function diagrama() {
  semear("space-based-1");
  let s = "";
  // quem chama
  for (const x of [250, 290, 330]) s += pessoa(x, 16, {});
  s += txt(362, 34, "milhares de pedidos no mesmo minuto", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += seta(290, 62, 290, 92, { espessura: 2 });
  // middleware virtualizado
  s += ret(20, 84, 540, 70, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += txt(22, 70, "middleware virtualizado", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += bloco(32, 92, 160, 54, "grade de\nprocessamento", { preench: claro.cinza, tam: 15 });
  s += bloco(210, 92, 160, 54, "grade de\nmensagens", { preench: claro.azul, tam: 15 });
  s += bloco(388, 92, 160, 54, "gerente de\nimplantação", { preench: claro.violeta, tam: 15 });
  // unidades de processamento
  [30, 210, 390].forEach((x, i) => {
    const extra = i === 2;
    s += bloco(x, 186, 150, 112, extra ? "unidade (extra)" : "unidade", { preench: claro.verde, gap: 9, tam: 15, topo: true, tracejado: extra });
    s += bloco(x + 12, 216, 126, 30, "código", { preench: "#ffffff", hachura: "solid", tam: 15 });
    s += bloco(x + 12, 254, 126, 32, "grade de dados", { preench: claro.amarelo, hachura: "solid", tam: 15 });
    s += seta(x + 75, 300, x + 75, 338, { espessura: 1.8 });
  });
  // a grade de mensagens distribui os pedidos
  s += seta(272, 148, 108, 184, { cor: cor.azul, espessura: 1.8 });
  s += seta(290, 148, 287, 184, { cor: cor.azul, espessura: 1.8 });
  s += seta(308, 148, 450, 184, { cor: cor.azul, espessura: 1.8 });
  // o gerente sobe e desce unidades
  s += seta(505, 148, 505, 184, { cor: cor.violeta, espessura: 1.8, tracejado: true });
  s += txt(514, 168, "liga/desliga", { tam: 15, cor: cor.violeta, ancora: "start" });
  // replicação entre as grades
  s += seta(171, 270, 219, 270, { cor: cor.laranja, espessura: 2, tracejado: true, duplo: true, ponta: 10 });
  s += seta(351, 270, 399, 270, { cor: cor.laranja, espessura: 2, tracejado: true, duplo: true, ponta: 10 });
  s += txt(195, 318, "replica", { tam: 15, cor: cor.laranja });
  s += txt(375, 318, "replica", { tam: 15, cor: cor.laranja });
  // bombas de dados, escritor e banco
  s += fila(30, 340, 510, 34, "bomba de dados: fila persistente");
  s += bloco(590, 335, 150, 44, "escritor de dados", { preench: claro.laranja, tam: 15 });
  s += seta(542, 357, 588, 357, { espessura: 1.8 });
  s += banco(620, 196, 90, 92, "banco", { preench: claro.violeta });
  s += seta(665, 333, 665, 292, { espessura: 1.8 });
  s += seta(618, 232, 544, 232, { cor: cor.cinza, espessura: 1.6, tracejado: true });
  s += txt(580, 266, "leitor\nde dados", { tam: 15, cor: cor.cinza });
  s += txt(665, 118, "o banco fica\nfora do caminho\nda requisição", { tam: 15, cor: cor.vermelho });
  s += txt(380, 424, "grava na memória agora; o banco recebe a mudança um pouco depois", { tam: 16, cor: cor.vermelho });
  return quadro(760, 444, s);
}

function comparacao() {
  semear("space-based-2");
  let s = "";
  s += linha([[380, 14], [380, 360]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  // tradicional
  s += txt(195, 22, "tradicional", { tam: 18 });
  for (const x of [70, 168, 266]) {
    s += seta(x + 28, 40, x + 28, 62, { espessura: 1.6 });
    s += servidor(x, 64, 56, 70);
  }
  s += banco(150, 196, 90, 90, "banco", { preench: claro.vermelho });
  s += seta(98, 140, 166, 198, { cor: cor.vermelho, espessura: 1.8 });
  s += seta(196, 140, 195, 192, { cor: cor.vermelho, espessura: 1.8 });
  s += seta(294, 140, 224, 198, { cor: cor.vermelho, espessura: 1.8 });
  s += txt(296, 244, "gargalo", { tam: 16, cor: cor.vermelho });
  s += txt(195, 336, "todo pedido espera o banco:\nmais servidores não resolvem", { tam: 15, cor: cor.vermelho });
  // space-based
  s += txt(565, 22, "space-based", { tam: 18 });
  for (const x of [400, 523, 646]) {
    s += seta(x + 42, 40, x + 42, 62, { espessura: 1.6 });
    s += bloco(x, 64, 84, 64, "memória", { preench: claro.amarelo, tam: 15 });
  }
  s += seta(487, 96, 520, 96, { cor: cor.laranja, espessura: 1.8, tracejado: true, duplo: true, ponta: 9 });
  s += seta(610, 96, 643, 96, { cor: cor.laranja, espessura: 1.8, tracejado: true, duplo: true, ponta: 9 });
  s += seta(442, 132, 455, 166, { espessura: 1.6 });
  s += seta(565, 132, 545, 166, { espessura: 1.6 });
  s += seta(688, 132, 625, 166, { espessura: 1.6 });
  s += fila(400, 168, 240, 30, "");
  s += txt(694, 186, "bomba\nde dados", { tam: 15, cor: cor.cinza });
  s += seta(520, 202, 520, 234, { cor: cor.cinza, espessura: 1.6, tracejado: true });
  s += txt(534, 218, "depois", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += banco(475, 238, 90, 76, "banco", { preench: claro.verde });
  s += txt(565, 336, "o pedido responde da memória;\no banco não segura ninguém", { tam: 15, cor: cor.verde });
  return quadro(760, 372, s);
}

function colisao() {
  semear("space-based-3");
  let s = "";
  s += seta(52, 84, 52, 278, { cor: cor.cinza, espessura: 1.6 });
  s += txt(52, 298, "tempo", { tam: 15, cor: cor.cinza });
  s += bloco(110, 20, 200, 50, "unidade 1", { preench: claro.verde, tam: 16 });
  s += bloco(450, 20, 200, 50, "unidade 2", { preench: claro.verde, tam: 16 });
  s += linha([[210, 72], [210, 282]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += linha([[550, 72], [550, 282]], { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += etiqueta(210, 100, "assento A12: livre", { tam: 15, preench: "#ffffff" });
  s += etiqueta(550, 100, "assento A12: livre", { tam: 15, preench: "#ffffff" });
  s += bloco(120, 128, 180, 36, "reserva p/ Ana", { preench: claro.azul, tam: 15 });
  s += bloco(460, 128, 180, 36, "reserva p/ Bruno", { preench: claro.azul, tam: 15 });
  s += txt(380, 146, "a cópia ainda\nestá a caminho", { tam: 15, cor: cor.laranja });
  s += seta(300, 172, 460, 236, { cor: cor.laranja, espessura: 1.8, tracejado: true });
  s += seta(460, 172, 300, 236, { cor: cor.laranja, espessura: 1.8, tracejado: true });
  s += bloco(120, 240, 180, 36, "chega: Bruno", { preench: claro.vermelho, tam: 15 });
  s += bloco(460, 240, 180, 36, "chega: Ana", { preench: claro.vermelho, tam: 15 });
  s += xis(96, 258) + xis(664, 258);
  s += txt(380, 310, "o mesmo assento foi vendido duas vezes", { tam: 16, cor: cor.vermelho });
  return quadro(760, 330, s);
}

export default `
${resumo(
  "Em vez de todo pedido ir ao banco de dados, cada servidor (a <b>unidade de processamento</b>) trabalha com os dados em memória, compartilhados com os outros por replicação. O banco é atualizado depois, em segundo plano, e deixa de ser o gargalo.",
  "Na bilheteria de um show lotado, cada guichê tem uma cópia da planta de lugares e os atendentes avisam uns aos outros a cada venda. Ninguém corre até o escritório central a cada ingresso: um mensageiro vai levando as vendas para o livro oficial, e a fila não espera por ele.",
)}

<p>O nome vem da ideia de <b>espaço de tuplas</b> (<i>tuple space</i>): uma memória compartilhada onde processos deixam e
pegam dados sem conversar diretamente. Mark Richards descreveu esse estilo nos livros <i>Software Architecture Patterns</i> e
<i>Fundamentals of Software Architecture</i> (este com Neal Ford). O problema que ele ataca é bem concreto: numa aplicação web comum, dá para
multiplicar os servidores de aplicação, mas todos continuam batendo no mesmo banco. Quando o pico chega, é o banco que cai
primeiro. A saída do space-based é tirar o banco do caminho da requisição.</p>

${fig(diagrama(), "Os pedidos entram pela grade de mensagens e caem em unidades que leem e gravam na própria memória. As grades se replicam entre si; a bomba de dados leva cada mudança até o banco, fora do caminho do usuário.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Unidade de processamento</b>: uma cópia da aplicação (ou de uma parte dela, como "assentos" ou "lances") que carrega
junto os dados de que precisa, numa <b>grade de dados em memória</b> (<i>in-memory data grid</i>). Ler e gravar é mexer na
RAM, sem ida ao banco. Você roda várias cópias iguais; uma cópia nova que sobe no meio do dia recebe os dados das outras, não do banco.</li>
<li><b>Middleware virtualizado</b>: as peças que coordenam as unidades.
  <ul>
  <li><b>grade de mensagens</b>: recebe os pedidos, guarda a sessão se precisar e escolhe para qual unidade mandar (pense num
  balanceador de carga esperto).</li>
  <li><b>grade de dados</b>: cuida da replicação entre as unidades. Nas ferramentas atuais, ela roda dentro de cada unidade
  (por isso, no diagrama, ela aparece nas unidades e não na caixa do middleware).</li>
  <li><b>grade de processamento</b> (opcional): orquestra um pedido que precisa de mais de uma unidade, por exemplo reservar
  o assento e depois cobrar.</li>
  <li><b>gerente de implantação</b>: liga e desliga unidades conforme a carga. É ele que dá a elasticidade.</li>
  </ul></li>
<li><b>Bombas de dados</b> (<i>data pumps</i>): cada mudança na memória vira uma mensagem numa fila persistente, de forma
<b>assíncrona</b>. O usuário já recebeu a resposta quando a mensagem sai.</li>
<li><b>Escritores de dados</b> (<i>data writers</i>): processos separados que consomem a fila e gravam no banco.</li>
<li><b>Leitores de dados</b> (<i>data readers</i>): fazem o caminho contrário, só quando preciso. Se todas as unidades caírem
ou uma versão nova subir do zero, eles carregam o banco de volta para a memória. Também buscam dado antigo que não está na grade.</li>
</ul>

${fig(comparacao(), "À esquerda, mais servidores só aumentam a fila no mesmo banco. À direita, cada pedido é resolvido na memória e o banco recebe as mudanças pela fila, no ritmo dele.")}

<h4>Cache replicado ou distribuído?</h4>
<p>Há dois jeitos de montar a grade de dados, e a escolha muda o comportamento do sistema:</p>
<ul>
<li><b>Replicado</b>: cada unidade tem a cópia completa e avisa as outras a cada mudança. A leitura é local e muito rápida, e
se uma unidade cai as outras seguem com tudo. Serve para dados pequenos e mais lidos do que escritos.</li>
<li><b>Distribuído</b> (particionado): cada chave mora em um nó, o "dono", com uma cópia de backup em outro. Cabe muito mais
dado e o dono garante atualizações atômicas; em troca, parte das leituras atravessa a rede.</li>
</ul>
<p>O risco do replicado é a <b>colisão de dados</b>: duas unidades mudam o mesmo item antes de a réplica chegar. Ela fica
mais provável com mais unidades, mais escritas no mesmo item e replicação mais lenta.</p>

${fig(colisao(), "Com cache replicado, as duas unidades viram o assento livre e venderam. Para itens disputados, use grade particionada (um dono por chave) ou trava por chave.")}

${quando(
  [
    "Picos enormes e imprevisíveis: abertura de venda de ingressos, leilões online, <i>flash sales</i> (promoções relâmpago).",
    "O banco virou o gargalo e já não adianta só aumentar a máquina, criar índices ou réplicas de leitura.",
    "Os dados disputados no pico cabem em memória: os assentos de um show, os lotes de um leilão, o estoque de uma promoção.",
    "O negócio aceita que o banco fique alguns instantes atrás da memória.",
  ],
  [
    "A carga é previsível e banco bem indexado, cache e réplicas de leitura dão conta (a maioria dos sistemas).",
    "O volume de dados é grande demais para a memória, ou há muita escrita sobre os mesmos itens o tempo todo.",
    "Toda gravação precisa estar confirmada no banco antes de responder (lançamentos contábeis, por exemplo).",
    "O time é pequeno, sem experiência em sistemas distribuídos, ou o orçamento é curto: memória e muitos nós custam caro.",
  ],
)}

${medidor({ complexidade: 5, escala: 5, operacao: 4, aprendizado: 4, time: "times experientes em sistemas distribuídos, com gente para operar" })}

<h3>Como usar na prática</h3>
<p>Ninguém escreve a grade de dados do zero. As ferramentas mais conhecidas são o <b>Hazelcast</b> (feito em Java, com edição
open source e clientes para Node.js, Python, Go e outras), o <b>Apache Ignite</b> (da Apache, com consultas SQL e
processamento junto dos dados) e o <b>GigaSpaces</b> (comercial). A grade pode rodar <b>embutida</b> no processo da unidade
ou como um cluster ao lado. Uma fila (Kafka, RabbitMQ) faz a bomba de dados e o autoscaling do Kubernetes ou da nuvem faz
o gerente de implantação. Muitas grades já trazem a bomba pronta, o <b>write-behind</b> (gravação adiada): a própria grade
grava no banco em lotes, em segundo plano (<code>MapStore</code> no Hazelcast, <code>CacheStore</code> no Ignite). É mais
simples, mas essa fila fica na memória da grade, não em disco.</p>

${pastas(`
ingressos/
├── unidade/                       # várias cópias; sobe e desce com a carga
│   ├── rotas.ts                   # entrada HTTP (vinda da grade de mensagens)
│   ├── reservar-assento.ts        # regra de negócio, só memória
│   └── grade.ts                   # mapas da grade de dados
├── escritor-de-dados/escritor.ts  # consome a fila e grava no banco
├── leitor-de-dados/leitor.ts      # enche a grade a partir do banco
└── infra/                         # grade de mensagens e autoscaling (gerente de implantação)
`)}

${codigo(
  `
// unidade/grade.ts: o que a grade oferece (os nomes mudam por ferramenta)
export interface MapaDistribuido<K, V> {
  get(chave: K): Promise<V | undefined>;
  put(chave: K, valor: V): Promise<void>;
  replaceIfSame(chave: K, esperado: V, novo: V): Promise<boolean>; // troca atômica
}
export type Assento = { id: string; livre: boolean; clienteId?: string; versao: number };
export type Mudanca = { assentoId: string; clienteId: string; versao: number };
export interface BombaDeDados { enviar(m: Mudanca): Promise<void> } // fila persistente

// unidade/reservar-assento.ts: roda em cada cópia da unidade
export class ReservarAssento {
  constructor(private assentos: MapaDistribuido<string, Assento>, private bomba: BombaDeDados) {}
  async executar(assentoId: string, clienteId: string): Promise<"ok" | "ocupado"> {
    const atual = await this.assentos.get(assentoId); // memória, sem banco
    if (!atual || !atual.livre) return "ocupado";
    const novo: Assento = { ...atual, livre: false, clienteId, versao: atual.versao + 1 };
    // só grava se ninguém mexeu no assento desde a leitura
    if (!(await this.assentos.replaceIfSame(assentoId, atual, novo))) return "ocupado";
    // o banco fica para depois: a mudança vai para a fila e o cliente já tem a resposta
    await this.bomba.enviar({ assentoId, clienteId, versao: novo.versao });
    return "ok";
  }
}`,
  "unidade/grade.ts e unidade/reservar-assento.ts",
)}

<p>No Hazelcast, o mapa vem de <code>client.getMap("assentos")</code> e o método tem esse nome. Num mapa <b>particionado</b>
a troca é atômica (de duas reservas simultâneas, só uma ganha); num <b>replicado</b>, não há essa garantia.</p>

${codigo(
  `
// escritor-de-dados/escritor.ts: processo separado, consome a fila e grava no banco
// "versao < $3" deixa a gravação idempotente: mensagem repetida ou atrasada é ignorada
const SQL = "update assentos set livre = false, cliente_id = $2, versao = $3 " +
            "where id = $1 and versao < $3";
fila.consumir("mudancas-assentos", async (m: Mudanca) => {
  await db.query(SQL, [m.assentoId, m.clienteId, m.versao]);
});

// leitor-de-dados/leitor.ts: na partida a frio, enche a grade a partir do banco
export async function aquecerGrade(eventoId: string, mapa: MapaDistribuido<string, Assento>) {
  const sql = "select id, livre, cliente_id, versao from assentos where evento_id = $1";
  const { rows } = await db.query(sql, [eventoId]);
  for (const { id, livre, cliente_id, versao } of rows)
    await mapa.put(id, { id, livre, clienteId: cliente_id, versao });
}`,
  "escritor-de-dados e leitor-de-dados",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Ache o <b>dado quente</b>: o que sofre no pico (assentos, lances, estoque da promoção). Só ele vai para a grade; o resto do sistema continua como está.",
  "Escolha a ferramenta e o modo da grade: replicado para dados pequenos e muito lidos, particionado quando o dado é maior ou a escrita é disputada.",
  "Para cada escrita disputada, defina a operação atômica: troca condicional, trava por chave ou processamento no próprio nó dono da chave.",
  "Monte a bomba de dados com fila persistente e escritores idempotentes: a mesma mensagem pode chegar duas vezes.",
  "Escreva o leitor de dados e ensaie a partida a frio: derrube todas as unidades e meça quanto tempo a grade leva para voltar cheia.",
  "Configure o gerente de implantação e simule o pico com teste de carga antes do dia da venda.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Respostas muito rápidas: tudo em memória", "Muitas peças: grade, filas, escritores e leitores"],
    ["Elasticidade: liga unidades no pico e desliga depois", "Custo alto de memória e de muitos nós rodando"],
    ["O banco deixa de ser o gargalo e de derrubar o sistema", "Banco um pouco atrás da memória (consistência eventual)"],
    ["Aguenta picos que ninguém conseguiu prever", "Colisões quando duas unidades mudam o mesmo item"],
    ["Se uma unidade cai, as outras têm cópia dos dados", "Difícil de testar: só teste de carga realista mostra"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Colocar o banco inteiro na memória</b>: fica caro, a replicação pesa e a partida a frio demora. Só o dado quente vai
para a grade.</li>
<li><b>Ignorar colisões</b>: cache replicado com muita escrita no mesmo item vende mais do que existe.</li>
<li><b>Bomba de dados sem garantia</b>: mandar para o banco "em segundo plano" com uma promise solta ou uma fila só em memória.
Se a unidade cai, as mudanças somem.</li>
<li><b>Escritor que não é idempotente</b>: a mesma mensagem chega duas vezes e a reserva é gravada em dobro.</li>
<li><b>Esquecer a partida a frio</b>: a grade sobe vazia e tudo aparece como "esgotado", ou o leitor derruba o banco ao
carregar tudo de uma vez.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine uma plataforma de ingressos. Em dias normais, duas unidades dão conta. Quando abre a venda de um show grande, uma multidão chega no mesmo minuto atrás dos mesmos assentos. Uma fila de espera virtual controla quantos entram por vez e o gerente de implantação liga dezenas de unidades. Os assentos ficam num mapa particionado: cada um tem um dono e não é vendido duas vezes. Reserva não paga em alguns minutos expira e libera o assento (as grades têm tempo de vida por item). Cada mudança chega ao Postgres pela bomba de dados e, passado o pico, as unidades extras são desligadas. Cadastro, pagamento e emissão do ingresso seguem como serviços comuns: só o mapa de assentos é space-based.</p>",
)}

${dica(
  "Não é só um cache na frente do banco",
  "<p>No cache comum (um Redis ao lado da aplicação, por exemplo), o banco é a fonte da verdade: a escrita vai para o banco e o cache só acelera a leitura. No space-based é o contrário: durante a operação, a <b>grade em memória é a fonte da verdade</b> e o banco é a cópia gravada depois. Essa inversão tira o banco do caminho e traz os riscos.</p>",
)}

${alerta(
  "Memória não é disco",
  "<p>Se todas as cópias de um dado caírem antes de a bomba entregar a mudança, ela se perde. Mantenha ao menos um backup de cada item em outra máquina, envie para a fila logo após gravar e combine com o negócio o que é aceitável perder. Para dinheiro, a resposta costuma ser \"nada\": nesse caso, confirme no banco antes de responder e use a grade só para ler.</p>",
)}

${combina([
  [20, "Orientada a eventos", "a bomba de dados é uma fila de eventos"],
  [21, "CQRS", "escrita na memória, relatórios lendo do banco"],
  [14, "Microsserviços", "só o serviço que sofre o pico vira space-based"],
  [23, "Sagas", "quando um pedido passa por várias unidades"],
  [25, "Modelo de atores", "outra forma de manter estado em memória e distribuído"],
  [17, "Células", "para isolar falhas e grupos de clientes"],
])}

${lembre([
  "Os dados quentes ficam em memória, replicados entre unidades de processamento; o banco sai do caminho da requisição.",
  "Bombas de dados gravam no banco de forma assíncrona: ele fica um pouco atrás, e memória que cai sem backup perde dados.",
  "Use para picos extremos e imprevisíveis (ingressos, leilões, flash sales); para carga comum, é complexidade e custo demais.",
])}
`;
