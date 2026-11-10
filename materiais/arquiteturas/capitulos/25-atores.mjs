// Capítulo 25 — Modelo de atores. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, claro, cor, elipse, engrenagem, envelope, passo, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

/** Ator desenhado como elipse (o jeito clássico de desenhar atores). */
const atorBola = (cx, cy, rotulo, o = {}) =>
  elipse(cx, cy, o.w ?? 130, o.h ?? 70, {
    preench: o.preench ?? claro.verde,
    espessura: o.espessura ?? 2,
    gap: 6,
    tracejado: o.tracejado,
    cor: o.cor,
  }) + txt(cx, cy, rotulo, { tam: o.tam ?? 16 });

function anatomia() {
  semear("atores-1");
  let s = "";
  // quem manda mensagens
  s += txt(75, 78, "depositar 100", { tam: 15, cor: cor.azul });
  s += atorBola(75, 125, "ator\nPix");
  s += atorBola(75, 295, "ator\nPedido");
  s += txt(75, 346, "sacar 80", { tam: 15, cor: cor.azul });
  // o ator visto por dentro
  s += txt(370, 28, "um ator visto por dentro", { tam: 15, cor: cor.cinza });
  s += ret(225, 46, 290, 302, { preench: claro.amarelo, espessura: 2.4, gap: 9 });
  s += txt(370, 74, "ator Carteira (ana)", { tam: 19 });
  s += txt(370, 104, "caixa de mensagens", { tam: 15, cor: cor.cinza });
  s += ret(255, 120, 230, 46, { preench: "#ffffff", hachura: "solid", espessura: 1.8 });
  for (const x of [330, 380, 430]) s += envelope(x, 131, 34, 24);
  s += seta(447, 168, 442, 208, { espessura: 2 });
  s += engrenagem(440, 238, 18);
  s += txt(325, 238, "processa uma\nmensagem por vez", { tam: 15 });
  s += ret(255, 278, 230, 56, { preench: "#ffffff", hachura: "solid", espessura: 1.8 });
  s += passo(282, 306, 1);
  s += txt(385, 296, "estado privado", { tam: 15, cor: cor.cinza });
  s += txt(385, 318, "saldo = 20", { tam: 17 });
  // mensagens chegando (o envelope vai em cima da seta)
  s += seta(142, 128, 252, 140, { cor: cor.azul, espessura: 2 });
  s += envelope(178, 122, 34, 24);
  s += seta(142, 285, 252, 158, { cor: cor.azul, espessura: 2 });
  s += envelope(180, 210, 34, 24);
  // o que o ator faz com a mensagem
  s += atorBola(665, 125, "ator\nExtrato", { preench: claro.azul, w: 160 });
  s += seta(466, 228, 594, 148, { cor: cor.violeta, espessura: 2 });
  s += envelope(532, 164, 34, 24, claro.violeta);
  s += passo(604, 182, 2);
  s += txt(624, 182, "registrar -80", { tam: 15, cor: cor.violeta, ancora: "start" });
  s += atorBola(665, 300, "ator\nRecibo", { preench: claro.violeta, w: 160, tracejado: true });
  s += seta(466, 250, 588, 292, { cor: cor.violeta, espessura: 2, tracejado: true });
  s += txt(556, 257, "cria", { tam: 15, cor: cor.violeta });
  s += passo(604, 357, 3);
  s += txt(624, 357, "criado agora", { tam: 15, cor: cor.violeta, ancora: "start" });
  // legenda
  s += txt(20, 395, "o ator pode:", { tam: 16, ancora: "start" });
  s += passo(140, 395, 1);
  s += txt(158, 395, "mudar o próprio estado", { tam: 16, ancora: "start" });
  s += passo(372, 395, 2);
  s += txt(390, 395, "mandar mensagens", { tam: 16, ancora: "start" });
  s += passo(552, 395, 3);
  s += txt(570, 395, "criar outros atores", { tam: 16, ancora: "start" });
  s += txt(380, 432, "ninguém lê o estado de outro ator: tudo passa por mensagens", { tam: 16, cor: cor.vermelho });
  return quadro(760, 452, s);
}

function supervisao() {
  semear("atores-3");
  let s = "";
  s += bloco(290, 22, 180, 52, "supervisor raiz", { preench: claro.violeta, tam: 17 });
  s += bloco(70, 130, 240, 52, "supervisor de conexões", { preench: claro.violeta, tam: 16 });
  s += bloco(450, 130, 240, 52, "supervisor de salas", { preench: claro.violeta, tam: 16 });
  s += seta(350, 76, 220, 128, { espessura: 1.8 });
  s += seta(410, 76, 540, 128, { espessura: 1.8 });
  // a falha que cai demais sobe para o pai
  s += seta(95, 128, 288, 52, { tracejado: true, cor: cor.cinza, espessura: 1.6 });
  s += txt(108, 80, "caiu demais?\na falha sobe", { tam: 15, cor: cor.cinza });
  // filhos do supervisor de conexões
  s += seta(110, 184, 76, 238, { cor: cor.cinza, espessura: 1.5 });
  s += seta(270, 184, 304, 238, { cor: cor.cinza, espessura: 1.5 });
  s += atorBola(70, 268, "conexão\nAna", { w: 108, h: 56, tam: 15 });
  s += atorBola(310, 268, "conexão\nCaio", { w: 108, h: 56, tam: 15 });
  s += atorBola(190, 268, "conexão\nBia", { w: 108, h: 56, tam: 15, preench: claro.vermelho, cor: cor.vermelho, tracejado: true });
  s += xis(236, 244, 16);
  s += seta(190, 184, 190, 238, { cor: cor.verde, espessura: 2.2, rotulo: "reinicia", dx: 40, dy: 0 });
  s += txt(190, 322, "o supervisor sobe outra,\ncom estado limpo", { tam: 15, cor: cor.verde });
  // filhos do supervisor de salas
  s += seta(530, 184, 456, 238, { cor: cor.cinza, espessura: 1.5 });
  s += seta(570, 184, 570, 238, { cor: cor.cinza, espessura: 1.5 });
  s += seta(610, 184, 684, 238, { cor: cor.cinza, espessura: 1.5 });
  s += atorBola(450, 268, "sala\ngeral", { w: 108, h: 56, tam: 15, preench: claro.azul });
  s += atorBola(570, 268, "sala\nvendas", { w: 108, h: 56, tam: 15, preench: claro.azul });
  s += atorBola(690, 268, "sala\nsuporte", { w: 108, h: 56, tam: 15, preench: claro.azul });
  s += txt(570, 318, "as salas nem percebem", { tam: 15, cor: cor.cinza });
  s += txt(380, 374, "a falha fica presa no seu galho; o resto do sistema segue", { tam: 16, cor: cor.vermelho });
  return quadro(760, 394, s);
}

export default `
${resumo(
  "O sistema vira um monte de <b>atores</b>: pequenas unidades com estado privado que só conversam por <b>mensagens</b>. Cada ator tem a sua caixa de entrada e trata uma mensagem por vez, então ninguém precisa de lock.",
  "Um escritório em que cada pessoa tem uma bandeja de entrada. Ninguém mexe na gaveta do colega: deixa um bilhete na bandeja dele. Cada um lê um bilhete por vez. Se alguém passa mal, o chefe põe outra pessoa no lugar.",
)}

<p>O modelo de atores foi proposto por Carl Hewitt em 1973, como modelo teórico de computação concorrente. Ficou famoso na
prática com o Erlang, criado na Ericsson para centrais telefônicas, que atendem muitas ligações ao mesmo tempo e não podem
parar. Ao contrário dos capítulos da parte II, que organizam o código, este trata de como as partes do sistema <b>rodam ao
mesmo tempo</b> e conversam, numa máquina ou em várias.</p>

${fig(anatomia(), "Um ator por dentro: as mensagens entram na caixa, são tratadas uma por vez e podem mudar o estado, gerar novas mensagens ou criar atores.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Ator</b>: uma unidade com estado próprio, comportamento e um endereço. Pense num objeto que ninguém pode chamar
direto: o único jeito de falar com ele é mandar uma mensagem.</li>
<li><b>Caixa de mensagens</b> (<i>mailbox</i>): a fila de entrada do ator. As mensagens chegam a qualquer hora e o ator trata
<b>uma por vez</b>, normalmente na ordem de chegada.</li>
<li><b>Ao tratar uma mensagem</b>, o ator pode mudar o próprio estado, mandar mensagens para atores que conhece e criar
novos atores. Só isso.</li>
<li><b>Envio assíncrono</b>: o normal é "manda e segue" (<i>tell</i>). Quando precisa de resposta, ela volta como outra
mensagem; as bibliotecas têm um atalho para isso (<i>ask</i> ou <i>call</i>), que espera com tempo limite.</li>
<li><b>Garantias fracas, de propósito</b>: no Erlang e no Akka, entre o mesmo par de atores a ordem é mantida; entre
remetentes diferentes, não. E a entrega padrão costuma ser "no máximo uma vez" (<i>at-most-once</i>): o que não pode se perder precisa de confirmação
e reenvio.</li>
</ul>

<h4>Por que não precisa de lock</h4>
<p>Com threads e memória compartilhada, dois saques de 80 numa conta com 100 podem conferir o saldo ao mesmo tempo, antes
de qualquer um descontar: os dois passam e o saldo termina em -60. O remédio clássico é o <b>lock</b> (trava), que é fácil
de esquecer e pode causar <b>deadlock</b> (duas threads esperando uma pela outra para sempre). Com atores, o saldo tem um
dono só: os dois saques viram mensagens na caixa desse dono, o primeiro passa e o segundo recebe "saldo insuficiente". A
disputa nem chega a acontecer.</p>


<h4>Supervisão e "let it crash"</h4>
<p>No Erlang/OTP, os atores (lá chamados de <b>processos</b>, mas bem mais leves que um processo do sistema operacional)
ficam numa <b>árvore de supervisão</b>. Supervisores não fazem trabalho de negócio: só vigiam os filhos e sobem outro no lugar
de quem cai, com uma estratégia:</p>
<ul>
<li><b>one_for_one</b>: reinicia só quem caiu (o padrão para filhos independentes, como uma conexão por usuário);</li>
<li><b>one_for_all</b>: reinicia todos os irmãos, para filhos que só funcionam juntos;</li>
<li><b>rest_for_one</b>: reinicia quem caiu e os que foram iniciados depois dele.</li>
</ul>
<p>Se há reinícios demais num intervalo curto (no Elixir, o padrão tolera 3 em 5 segundos), o supervisor desiste: encerra
os filhos e a si mesmo, e a falha sobe para o supervisor de cima.</p>

${fig(supervisao(), "Árvore de supervisão de um chat: a conexão da Bia caiu, o supervisor dela sobe outra e o resto do sistema nem fica sabendo.")}

<p>Daí vem a filosofia <b>"let it crash"</b> (deixe cair): em vez de encher o código de <code>try/catch</code> para todo erro
imaginável, você escreve o caminho normal e deixa o processo morrer quando algo inesperado acontece. O supervisor recria o
ator a partir de um estado conhecido. Isso só funciona porque os atores são isolados (um não corrompe a memória do outro) e
baratos de recriar.</p>

${alerta(
  "Reiniciar é voltar ao começo",
  "<p>O ator novo começa do zero, sem o estado que estava na memória. Se o saldo só existia dentro do ator, ele sumiu. O que não pode se perder precisa estar gravado: num banco, em snapshots ou como eventos (o Akka Persistence, por exemplo, salva o estado do ator com event sourcing, capítulo 22).</p>",
)}

<h4>Transparência de localização</h4>
<p>Você manda mensagem para um <b>endereço</b> (o PID no Erlang, o <code>ActorRef</code> no Akka, a chave do <i>grain</i> no
Orleans), e não para um objeto na memória. O ator pode estar na mesma máquina ou em outro servidor, e o código de quem
manda é o mesmo. O Cluster Sharding do Akka e o Orleans usam isso para espalhar os atores pelo cluster pela chave da
entidade (o id da conta, por exemplo). Só não confunda mesmo código com mesma falha: pela rede, a mensagem pode atrasar ou
sumir.</p>

<h4>Onde o modelo existe pronto</h4>
${tabela(
  ["Plataforma", "O que tem de especial"],
  [
    ["<b>Erlang/OTP</b> (BEAM)", "Processos levíssimos (milhões numa máquina), supervisores e distribuição nativa. O RabbitMQ é feito nele."],
    ["<b>Elixir</b> (BEAM)", "Criada pelo brasileiro José Valim: OTP com sintaxe moderna. Base do framework Phoenix."],
    ["<b>Akka</b> (JVM)", "Atores tipados, cluster, sharding e persistência. Em 2022 trocou a licença aberta pela BSL; o fork aberto é o Apache Pekko."],
    ["<b>Orleans</b> (.NET)", "Atores virtuais (<i>grains</i>): você nunca cria nem destrói um; o runtime ativa sob demanda, em algum servidor, e desativa quando fica parado. Nasceu na Microsoft Research."],
    ["<b>Dapr actors</b>", "Atores virtuais no estilo Orleans, via sidecar, com SDK para JavaScript/TypeScript."],
  ],
)}


${quando(
  [
    "Muitas entidades com estado vivo e muita concorrência: conversas de chat, partidas de jogo, dispositivos IoT.",
    "Conexões longas (WebSocket, telefonia, MQTT): uma conexão, um ator.",
    "Sistemas que não podem parar e precisam se recuperar sozinhos (telecom, mensageria).",
    "Estado quente em memória, com resposta rápida, sem ir ao banco a cada evento.",
  ],
  [
    "CRUD sem estado entre requisições: servidor web + banco resolve.",
    "Processamento de dados em lote: veja os capítulos 10 e 26.",
    "Transação forte entre muitas entidades: com atores, vira saga (capítulo 23).",
    "Relatórios e buscas que cruzam muitas entidades: ator não se consulta como tabela (capítulo 21).",
  ],
)}

${medidor({ complexidade: 4, escala: 5, operacao: 3, aprendizado: 4, time: "times pequenos já vão longe com Elixir; em cluster grande, alguém experiente na plataforma" })}

<h3>Como usar na prática</h3>
<p>Para entender o mecanismo, um ator mínimo em TypeScript. O Node tem uma thread só, mas tem concorrência: com
<code>await</code>, um saque que confere o saldo, espera o banco e só depois desconta deixa outro saque passar pela mesma
conferência. A caixa de mensagens põe tudo em fila.</p>

${codigo(
  `
// Um ator mínimo: estado privado + caixa de mensagens + uma mensagem por vez
export abstract class Ator<M> {
  private caixa: M[] = [];
  private ocupado = false;
  protected abstract receber(msg: M): Promise<void>;

  enviar(msg: M): void { // "tell": guarda a mensagem e volta na hora
    this.caixa.push(msg);
    if (!this.ocupado) void this.processar();
  }

  private async processar() {
    this.ocupado = true;
    while (this.caixa.length > 0) { // a próxima espera esta terminar
      const msg = this.caixa.shift()!;
      await this.receber(msg).catch((erro) => console.error("falhou", msg, erro));
    }
    this.ocupado = false;
  }
}`,
  "src/atores/ator.ts",
)}

${codigo(
  `
import { Ator } from "../atores/ator";

type Msg =
  | { tipo: "depositar"; valor: number }
  | { tipo: "sacar"; valor: number; responder: (ok: boolean) => void };

export class Carteira extends Ator<Msg> {
  private saldo = 0; // só este ator lê e escreve
  constructor(private registrar: (valor: number) => Promise<void>) { super(); }
  protected async receber(msg: Msg) {
    if (msg.tipo === "depositar") {
      this.saldo += msg.valor;
      return this.registrar(msg.valor);
    }
    if (msg.valor > this.saldo) return msg.responder(false);
    await this.registrar(-msg.valor); // await no meio...
    this.saldo -= msg.valor; // ...e mesmo assim ninguém furou a fila
    msg.responder(true);
  }
}

// uso: dois saques ao mesmo tempo, sem lock
const carteira = new Carteira(async () => {}); // aqui entraria o extrato no banco
carteira.enviar({ tipo: "depositar", valor: 100 });
const sacar = (valor: number) =>
  new Promise<boolean>((responder) => carteira.enviar({ tipo: "sacar", valor, responder }));
console.log(await Promise.all([sacar(80), sacar(80)])); // [ true, false ]`,
  "src/carteira/carteira.ts",
)}

<p>Repare: se o <code>receber</code> falhar no meio de um saque, o <code>responder</code> nunca é chamado e a promessa
fica pendurada. Por isso toda pergunta a um ator precisa de tempo limite. Esse ator de brinquedo também não tem supervisão,
distribuição nem limite de caixa: em produção, use uma plataforma. A mesma carteira em Elixir, com <code>GenServer</code>
(o ator padrão do OTP):</p>

${pastas(`
carteiras/
├── lib/carteiras/
│   ├── application.ex   # liga a árvore de supervisão
│   ├── carteira.ex      # o ator: estado + mensagens (GenServer)
│   └── extrato.ex       # outro ator: grava o extrato em ordem
├── lib/carteiras_web/   # API e WebSocket (Phoenix): só mandam mensagens
└── test/carteira_test.exs
`)}

${codigo(
  `
defmodule Carteira do
  use GenServer

  # API: funções que viram mensagens para o processo da carteira
  def start_link(conta), do: GenServer.start_link(__MODULE__, 0, name: via(conta))
  def depositar(conta, v), do: GenServer.cast(via(conta), {:depositar, v})
  def sacar(conta, v), do: GenServer.call(via(conta), {:sacar, v})
  defp via(conta), do: {:via, Registry, {Carteiras.Registro, conta}}

  # Callbacks: rodam dentro do processo, uma mensagem por vez
  @impl true
  def init(saldo), do: {:ok, saldo}
  @impl true
  def handle_cast({:depositar, v}, saldo), do: {:noreply, saldo + v}
  @impl true
  def handle_call({:sacar, v}, _de, saldo) when v <= saldo, do: {:reply, :ok, saldo - v}
  def handle_call({:sacar, _v}, _de, saldo), do: {:reply, {:erro, :sem_saldo}, saldo}
end

# application.ex: um registro (nome -> processo) e um supervisor de carteiras
Supervisor.start_link([
  {Registry, keys: :unique, name: Carteiras.Registro},
  {DynamicSupervisor, name: Carteiras.Sup, strategy: :one_for_one}
], strategy: :one_for_one)

DynamicSupervisor.start_child(Carteiras.Sup, {Carteira, "ana"})
Carteira.depositar("ana", 100)
Carteira.sacar("ana", 80) #=> :ok
Carteira.sacar("ana", 80) #=> {:erro, :sem_saldo}`,
  "lib/carteiras/carteira.ex (Elixir)",
)}

<p><code>cast</code> é o <i>tell</i>; <code>call</code> é o <i>ask</i> (espera até 5 segundos, por padrão). Saldo insuficiente
é regra de negócio e vira resposta. Já um depósito com texto no lugar do número derruba o processo, e o supervisor sobe
outra carteira no lugar, com saldo zero.</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Escolha uma plataforma em vez de escrever a sua: Erlang ou Elixir, Akka ou Pekko, Orleans, Dapr.",
  "Encontre as entidades com estado e concorrência (uma carteira, uma sala, um dispositivo) e crie <b>um ator por instância</b>, nunca um ator para todas.",
  "Defina as mensagens como dados imutáveis, com nomes do negócio (<code>Depositar</code>, <code>Sacar</code>), e decida quais são <i>tell</i> e quais são <i>ask</i>.",
  "Desenhe a árvore de supervisão e decida como o estado sobrevive a um reinício: banco, snapshots ou eventos (capítulo 22).",
  "Meça desde o primeiro dia: tamanho das caixas, tempo por mensagem e reinícios. Caixa que só cresce é ator gargalo.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Concorrência sem lock: cada pedaço de estado tem um dono só", "Pensar tudo como mensagem assíncrona; depurar fluxos espalhados"],
    ["Milhões de entidades vivas em memória, com resposta rápida", "Estado em memória some se não for gravado; persistir é trabalho extra"],
    ["Falhas isoladas e recuperação automática por supervisores", "Garantias fracas de entrega e ordem: confirmação e reenvio ficam com você"],
    ["O mesmo código roda num servidor ou espalhado num cluster", "Plataforma específica (BEAM, Akka, Orleans) e curva de aprendizado"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Um ator para tudo</b>: um <code>GerenciadorDeCarteiras</code> com todas as contas vira uma fila só, e o sistema
inteiro anda na velocidade de um ator.</li>
<li><b>Caixa sem limite</b>: chegam mais mensagens do que o ator dá conta e a fila cresce até acabar a memória. Monitore,
limite ou aplique contrapressão (<i>backpressure</i>: avisar quem manda para ir mais devagar).</li>
<li><b>Bloquear dentro do ator</b>: uma chamada lenta e síncrona trava a fila inteira dele. Passe o trabalho demorado para
outro ator e receba o resultado como mensagem.</li>
<li><b>Deadlock com perguntas</b>: A pergunta a B e espera; B pergunta a A e espera. Sem lock, mas com espera circular.
Prefira <i>tell</i> e use tempo limite.</li>
<li><b>Mensagem com objeto mutável</b>: na JVM ou no Node, dois atores segurando o mesmo objeto é memória compartilhada de
volta. Mande dados imutáveis ou cópias.</li>
<li><b>"Let it crash" como desculpa</b>: erro esperado (saldo insuficiente, entrada inválida do usuário) vira resposta; só o
inesperado derruba o ator.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O WhatsApp construiu seu servidor de mensagens em Erlang, e a equipe mostrou em palestras públicas como poucos servidores seguravam um número enorme de conexões ao mesmo tempo. O padrão típico em Erlang é um processo leve para cada usuário conectado: se um processo cai, só aquela conexão sente, e o supervisor cuida do resto. O Discord também conta no blog de engenharia que usa Elixir na sua parte de tempo real.</p>",
)}

${alerta(
  "Ator não é microsserviço (nem fila)",
  "<p>Um microsserviço (capítulo 14) é uma aplicação com deploy próprio; um ator é uma unidade minúscula dentro de um runtime, e um só serviço pode ter milhões deles. E a caixa de mensagens não é um broker como Kafka (capítulo 20): pertence a um ator só e, em geral, vive na memória.</p>",
)}

${combina([
  [20, "Orientada a eventos", "atores reagem a mensagens; eventos ligam sistemas"],
  [22, "Event Sourcing", "para gravar o estado do ator como eventos"],
  [23, "Sagas", "para coordenar várias entidades sem transação global"],
  [17, "Arquitetura em células", "isolamento de falhas numa escala maior"],
  [14, "Microsserviços", "atores rodando dentro de um serviço"],
  [24, "Space-based", "outra forma de manter estado quente em memória"],
])}

${lembre([
  "Ator = estado privado + caixa de mensagens + uma mensagem por vez. Sem memória compartilhada, sem lock.",
  "Falha é esperada: supervisores reiniciam quem cai (\"let it crash\"), e o que não pode se perder precisa estar gravado.",
  "Brilha com muitas entidades vivas e concorrentes (chat, jogos, IoT, telecom); num CRUD comum é complexidade sem retorno.",
])}
`;
