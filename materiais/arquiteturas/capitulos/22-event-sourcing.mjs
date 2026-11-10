// Capítulo 22: Event Sourcing. Guardar a sequência de eventos em vez do estado atual; estado = aplicar os
// eventos em ordem; snapshots, projeções, auditoria, versionamento (upcasting) e dados pessoais (LGPD).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, engrenagem, etiqueta, evento, linha, navegador, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Diagrama principal: o stream de eventos da conta 42 vira o saldo; ao lado, o que a tabela comum guarda. */
function contaEmEventos() {
  semear("event-sourcing-1");
  let s = "";
  s += txt(18, 22, "event store · stream da conta 42 (só acrescenta no fim)", { tam: 17, ancora: "start" });
  const eventos = [
    ["ContaAberta", "titular: Ana", cor.cinza, "R$ 0"],
    ["ValorDepositado", "+ R$ 500", cor.verde, "R$ 500"],
    ["ValorSacado", "- R$ 120", cor.vermelho, "R$ 380"],
    ["ValorDepositado", "+ R$ 80", cor.verde, "R$ 460"],
  ];
  const w = 150, y = 46, h = 90, passoX = 165;
  eventos.forEach(([nome, det, c, saldo], i) => {
    const x = 18 + i * passoX;
    const cx = x + w / 2;
    s += bloco(x, y, w, h, "", { preench: claro.laranja });
    s += txt(x + 12, y + 17, "#" + (i + 1), { tam: 15, cor: cor.cinza, ancora: "start" });
    s += evento(x + w - 20, y + 6, 20);
    s += txt(cx, y + 47, nome, { tam: 16 });
    s += txt(cx, y + 71, det, { tam: 16, cor: c });
    s += seta(cx, y + h + 4, cx, 184, { cor: cor.cinza, espessura: 1.6 });
    s += etiqueta(cx, 200, "saldo " + saldo, { w: 96, tam: 15, preench: i === 3 ? claro.amarelo : "#ffffff" });
    if (i > 0) s += seta(cx - passoX + 58, 200, cx - 58, 200, { cor: cor.cinza, espessura: 1.6, ponta: 10 });
  });
  // vaga do próximo evento
  s += bloco(678, y, 64, h, "", { preench: "none", tracejado: true, cor: cor.cinza });
  s += txt(710, y + 34, "+", { tam: 24, cor: cor.cinza });
  s += txt(710, y + 62, "novo", { tam: 15, cor: cor.cinza });
  s += txt(18, 240, "estado após cada evento: pare onde quiser = viagem no tempo", { tam: 15, cor: cor.cinza, ancora: "start" });

  // embaixo, à esquerda: o que um CRUD guardaria
  s += bloco(18, 270, 330, 100, "", { preench: claro.cinza });
  s += txt(183, 290, "tabela comum (CRUD)", { tam: 16 });
  s += ret(68, 306, 230, 54, { preench: "#ffffff", hachura: "solid", espessura: 1.5 });
  s += linha([[68, 333], [298, 333]], { espessura: 1.2 });
  s += linha([[140, 306], [140, 360]], { espessura: 1.2 });
  s += txt(104, 320, "id", { tam: 15, cor: cor.cinza });
  s += txt(219, 320, "saldo", { tam: 15, cor: cor.cinza });
  s += txt(104, 347, "42", { tam: 15 });
  s += txt(219, 347, "R$ 460", { tam: 15 });
  s += txt(183, 392, "só a última foto: como chegou aqui?", { tam: 15, cor: cor.vermelho });

  // embaixo, à direita: o estado calculado a partir dos eventos
  const cx4 = 18 + 3 * passoX + w / 2;
  s += seta(cx4, 214, cx4, 268, { cor: cor.tinta, espessura: 2 });
  s += bloco(410, 270, 332, 100, "", { preench: claro.amarelo });
  s += txt(576, 292, "estado atual (calculado)", { tam: 16 });
  s += txt(576, 324, "saldo R$ 460 · versão 4", { tam: 19 });
  s += txt(576, 352, "= aplicar #1, #2, #3 e #4, em ordem", { tam: 15, cor: cor.cinza });
  s += txt(576, 392, "o mesmo saldo, com a história inteira", { tam: 15, cor: cor.verde });
  return quadro(760, 410, s);
}

/** Fluxo de escrita (comando → agregado → event store) e de leitura (projeções → telas). */
function fluxo() {
  semear("event-sourcing-2");
  let s = "";
  s += txt(18, 22, "lado da escrita", { tam: 16, cor: cor.azul, ancora: "start" });
  s += navegador(18, 56, 120, 84, "app");
  s += seta(140, 98, 236, 98, { cor: cor.azul, espessura: 2, rotulo: "comando\n\"sacar 120\"", dy: -26 });

  s += bloco(238, 46, 226, 112, "", { preench: claro.amarelo });
  s += txt(351, 68, "Conta (agregado)", { tam: 17 });
  s += txt(256, 96, "1. reaplica os eventos", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += txt(256, 118, "2. valida: tem saldo?", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += txt(256, 140, "3. gera ValorSacado", { tam: 15, cor: cor.cinza, ancora: "start" });

  s += banco(604, 40, 136, 126, "event store", { preench: claro.laranja, tam: 16 });
  s += txt(672, 184, "só acrescenta", { tam: 15, cor: cor.cinza });
  s += seta(600, 74, 468, 74, { cor: cor.cinza, espessura: 1.8, tracejado: true, rotulo: "lê os eventos", dy: -14 });
  s += seta(468, 124, 600, 124, { cor: cor.laranja, espessura: 2.2, rotulo: "anexa o novo\n(versão 5)", dy: 26, corRotulo: cor.laranja });

  // projeções
  s += seta(660, 196, 512, 234, { cor: cor.verde, espessura: 1.8, ponta: 10 });
  s += engrenagem(490, 244, 15, { preench: claro.verde });
  s += txt(462, 244, "projeções assinam os eventos", { tam: 15, cor: cor.verde, ancora: "end" });
  const leituras = [
    [230, "extrato"],
    [410, "saldos"],
    [590, "alertas de fraude"],
  ];
  for (const [x, nome] of leituras) {
    s += seta(490 + (x - 410) * 0.12, 266, x + 80, 294, { cor: cor.verde, espessura: 1.6, ponta: 10 });
    s += bloco(x, 296, 160, 56, nome, { preench: claro.verde, tam: 16 });
  }
  s += seta(226, 318, 82, 146, { cor: cor.verde, espessura: 1.8, tracejado: true, rotulo: "as telas leem\nas projeções", dx: -58, dy: 4, corRotulo: cor.verde });
  s += txt(18, 340, "lado da leitura", { tam: 16, cor: cor.verde, ancora: "start" });
  s += txt(380, 392, "eventos = a verdade · projeções = cópias descartáveis, refeitas relendo os eventos", { tam: 15, cor: cor.vermelho });
  return quadro(760, 410, s);
}

export default `
${resumo(
  "Em vez de guardar só o estado atual (o saldo da conta), o sistema guarda <b>cada fato que aconteceu</b>, em ordem, e nunca apaga nenhum. O estado atual é calculado <b>reaplicando esses eventos</b> do primeiro ao último.",
  "O extrato do banco. O saldo é só o resultado de todas as linhas. Se algo parece errado, você confere linha por linha. E ninguém apaga uma linha: um estorno entra como uma linha nova.",
)}

<p>Num sistema comum, um saque de R$ 120 vira um <code>UPDATE contas SET saldo = 380</code>: o número antigo some e ninguém
sabe mais como se chegou ali. O <b>Event Sourcing</b> (em tradução livre, "o estado vem dos eventos") inverte isso: o que vai
para o banco é o fato "foram sacados R$ 120", e o saldo é uma conta feita a partir dos fatos. A ideia é antiga: a contabilidade
sempre trabalhou com lançamentos que não se apagam, e os bancos de dados usam um log parecido por dentro (o WAL, <i>write-ahead
log</i>, do Postgres, por exemplo). Como padrão de aplicação, foi descrito por Martin Fowler num artigo de 2005 e popularizado por Greg Young, junto
com o CQRS (capítulo 21), por volta de 2010.</p>

${fig(contaEmEventos(), "Quatro eventos da conta 42, aplicados em ordem, dão o saldo de R$ 460. A tabela comum chega ao mesmo número, mas esquece o caminho.")}

<h3>Como funciona</h3>
<ul>
<li><b>Evento</b>: um fato do negócio que já aconteceu, com nome no passado (<code>ContaAberta</code>, <code>ValorSacado</code>).
Depois de gravado, nunca muda. Leva os dados do fato e metadados: quando, quem, versão do formato.</li>
<li><b>Stream</b> (fluxo): a sequência de eventos de uma mesma coisa, como a conta 42. Cada evento tem uma posição no stream
(1, 2, 3...), que é a sua <b>versão</b>.</li>
<li><b>Event store</b>: o banco onde ficam os streams. Operações principais: <b>anexar</b> eventos no fim de um stream,
<b>ler</b> um stream em ordem e <b>assinar</b> os eventos novos (é assim que as projeções se alimentam). Não existe UPDATE nem
DELETE de evento.</li>
<li><b>Agregado</b>: o objeto que protege as regras de uma coisa do negócio (termo do DDD, o <i>Domain-Driven Design</i>). Ao
receber um comando ("sacar R$ 120"), ele relê os seus eventos para saber o estado, valida a regra e <b>gera eventos novos</b>.
Ele não grava o estado: grava os eventos.</li>
<li><b>Estado = aplicar os eventos em ordem</b>: uma função pequena, <code>aplicar(estado, evento)</code>, roda do primeiro ao
último evento. É um <code>reduce</code> (ou <i>fold</i>, para quem vem da programação funcional).</li>
<li><b>Projeções</b>: leitores que acompanham os eventos e montam tabelas prontas para consulta (extrato, saldo por cliente,
relatórios). São o lado de leitura do CQRS (capítulo 21).</li>
</ul>

${fig(fluxo(), "Escrita: o agregado relê os eventos, decide e anexa um novo. Leitura: projeções transformam os eventos em tabelas que as telas consultam.")}

${quando(
  [
    "O histórico é exigência ou é o produto: dinheiro, contabilidade, pagamentos, seguros, saúde (quem fez o quê, e quando).",
    "Você precisa responder \"como estava em tal data?\", reprocessar cálculos ou investigar fraudes e disputas.",
    "O domínio já pensa em eventos: pedidos que passam por etapas, reservas, logística, carteira de investimentos.",
    "Novas visões dos mesmos dados (relatórios, antifraude) surgem com o tempo: cada uma vira uma projeção sobre todo o passado.",
  ],
  [
    "CRUD simples: cadastro de produtos, configurações, perfil de usuário. Ninguém quer esse histórico.",
    "Você só precisa de um log de auditoria: uma tabela de histórico ou a captura de mudanças do banco (CDC, <i>change data capture</i>) resolve com muito menos esforço.",
    "O time nunca usou o padrão e o prazo é curto: erros de modelagem ficam gravados para sempre.",
    "A ideia é usar no sistema inteiro: em todos os módulos, o custo se multiplica e o ganho não.",
  ],
)}

${medidor({ complexidade: 4, escala: 4, operacao: 4, aprendizado: 4, time: "qualquer, se alguém já domina o padrão" })}

<h3>Como usar na prática</h3>
${pastas(`
├── dominio/
│   ├── eventos.ts           # tipos dos eventos (contrato para sempre)
│   ├── conta.ts             # agregado: decide e aplica eventos
│   └── upcasters.ts         # converte versões antigas de eventos
├── comandos/sacar.ts        # carrega, decide, anexa
├── projecoes/extrato.ts     # evento -> linhas da tabela de extrato
└── infra/event-store-pg.ts  # tabela só de inserção + versão
`, "estrutura de pastas: src/contas/")}

${codigo(
  `
export type EventoDaConta =   // fatos no passado; gravados, não mudam
  | { tipo: "ContaAberta"; titular: string }
  | { tipo: "ValorDepositado"; valor: number }   // valores em centavos
  | { tipo: "ValorSacado"; valor: number };`,
  "src/contas/dominio/eventos.ts",
)}

${codigo(
  `
export class Conta {
  saldo = 0;
  aberta = false;
  versao = 0;                    // posição do último evento lido do banco
  novos: EventoDaConta[] = [];   // gerados agora, ainda não gravados
  static reconstruir(historico: EventoDaConta[]): Conta {
    const conta = new Conta();
    historico.forEach((e) => conta.aplicar(e));
    conta.versao = historico.length;
    return conta;
  }
  sacar(valor: number) {              // DECIDE: valida e gera um evento
    if (!this.aberta || valor <= 0) throw new Error("Saque inválido");
    if (valor > this.saldo) throw new Error("Saldo insuficiente");
    const e: EventoDaConta = { tipo: "ValorSacado", valor };
    this.aplicar(e);
    this.novos.push(e);
  }
  private aplicar(e: EventoDaConta) {  // APLICA: só muda o estado
    switch (e.tipo) {
      case "ContaAberta": this.aberta = true; break;
      case "ValorDepositado": this.saldo += e.valor; break;
      case "ValorSacado": this.saldo -= e.valor; break;
    }
  }
}`,
  "src/contas/dominio/conta.ts: o agregado",
)}

<p>Repare na divisão: <code>sacar()</code> <b>decide</b> (valida e gera o evento) e <code>aplicar()</code> só <b>muda o estado</b>,
sem validar e sem falhar. O motivo: <code>aplicar()</code> também roda ao reler eventos antigos, e um fato que já aconteceu não
pode ser recusado. Depositar e abrir a conta seguem o mesmo molde de <code>sacar()</code>.</p>

${codigo(
  `
// infra: o event store só sabe anexar no fim e ler em ordem
export interface EventStore {
  ler(stream: string): Promise<EventoDaConta[]>;
  // grava depois da versão esperada; se alguém gravou antes, lança erro
  anexar(stream: string, versaoEsperada: number, eventos: EventoDaConta[]): Promise<void>;
}

// comandos/sacar.ts: carrega, decide, grava
export async function sacar(store: EventStore, contaId: string, valor: number) {
  const stream = "conta-" + contaId;
  const conta = Conta.reconstruir(await store.ler(stream));
  conta.sacar(valor);                                     // pode lançar "Saldo insuficiente"
  await store.anexar(stream, conta.versao, conta.novos);  // concorrência otimista
}`,
  "src/contas/infra e comandos",
)}

<p>No Postgres, o event store pode ser uma tabela <code>eventos (stream_id, versao, tipo, dados jsonb, criado_em)</code> com chave
primária em <code>(stream_id, versao)</code>. Se dois saques simultâneos leram a versão 4 e tentam gravar a versão 5, o segundo
leva erro de chave duplicada, relê a conta (agora com saldo menor) e decide de novo: é o <b>controle de concorrência
otimista</b>. A projeção do extrato é só uma função que faz um <code>insert</code> por evento. Também há ferramentas prontas,
como o EventStoreDB (hoje KurrentDB), o Axon (Java) e o Marten (.NET).</p>

<h4>Snapshots: um atalho para streams longos</h4>
<p>Uma conta com anos de movimento pode ter milhares de eventos, e reler todos a cada saque fica lento. O <b>snapshot</b> (foto)
resolve: de tempos em tempos (a cada 500 eventos, por exemplo), o sistema salva o estado calculado e a versão em que a foto foi
tirada. Para reconstruir, carrega a foto mais recente e aplica só os eventos que vieram depois. O snapshot é um cache: pode ser
apagado e refeito, porque a verdade continua nos eventos (se o formato do estado mudar, descarte as fotos antigas). Meça antes
de criar: streams com poucas centenas de eventos costumam carregar rápido. E cuide do tamanho do agregado: um stream por conta
é normal; um stream para a loja inteira vira gargalo, porque toda gravação disputa a mesma versão.</p>

<h4>Auditoria e viagem no tempo</h4>
<p>Como nada é apagado, o event store já é um registro de auditoria: o que aconteceu, quando, a pedido de quem e em que ordem.
E dá para "voltar no tempo": aplique só os eventos até uma data e você tem o estado exato daquele momento ("qual era o saldo no
fechamento do mês?"). Também ajuda a depurar (reproduza no seu computador os eventos de um caso com bug, anonimizados) e a
corrigir cálculos: conserte a regra e <b>reprocesse</b> o histórico numa projeção nova, sem tocar em nenhum evento.</p>

<h4>Quando os eventos mudam: versionamento</h4>
<p>Eventos gravados ficam para sempre, mas o negócio muda: um dia o depósito precisa registrar o canal (Pix, TED, boleto).
Você não reescreve os eventos antigos. Escolha a saída mais leve que resolver:</p>
<ul>
<li><b>Campo novo opcional</b>: o código trata a ausência com um valor padrão. Resolve a maioria dos casos.</li>
<li><b>Upcasting</b>: cada evento guarda a versão do formato e, ao ler, o formato antigo vira o atual, um degrau por vez
(v1 para v2, v2 para v3). O banco não muda; o resto do código só vê a versão nova.</li>
<li><b>Tipo novo de evento</b>, quando o <i>significado</i> muda; e, como último recurso, <b>migrar o stream</b> (copiar os
eventos para um stream novo, transformando no caminho).</li>
</ul>

${codigo(
  `
// dominio/upcasters.ts: o banco guarda v1 e v2 misturados, para sempre;
// ao ler, tudo vira a versão atual antes de chegar ao agregado
type Canal = "pix" | "ted" | "boleto" | "desconhecido";
type DepositoV1 = { tipo: "ValorDepositado"; v: 1; valor: number };
type DepositoV2 = { tipo: "ValorDepositado"; v: 2; valor: number; canal: Canal };

export function upcastDeposito(e: DepositoV1 | DepositoV2): DepositoV2 {
  if (e.v === 1) return { ...e, v: 2, canal: "desconhecido" }; // a v1 não sabia o canal
  return e;
}`,
  "src/contas/dominio/upcasters.ts",
)}

<h4>Dados pessoais: LGPD, GDPR e o direito de apagar</h4>
<p>A LGPD (no Brasil) e o GDPR (na Europa) dão ao titular o direito de pedir a eliminação dos seus dados pessoais em várias
situações. Num event store imutável, apagar é justamente o que não se faz. As saídas mais usadas:</p>
<ul>
<li><b>Deixar dados pessoais fora dos eventos</b>: o evento guarda só o <code>clienteId</code>; nome, CPF e endereço ficam numa
tabela comum, que pode ser apagada.</li>
<li><b>Criptografia por titular</b> (<i>crypto-shredding</i>): cada cliente tem a sua própria chave, guardada num cofre de
chaves, e os campos pessoais vão cifrados dentro dos eventos. Para "esquecer" o cliente, você apaga a chave. Os eventos
continuam lá, inclusive nos backups, mas aqueles campos ficam ilegíveis para sempre (desde que a chave não sobreviva em
nenhuma cópia do cofre).</li>
<li><b>Projeções e cópias também contam</b>: depois, limpe ou reconstrua as projeções, os caches e o que foi para outros sistemas.</li>
</ul>

${alerta(
  "Combine com o jurídico antes",
  "<p>A eliminação tem exceções (dados que a lei obriga a guardar, como registros financeiros), e o crypto-shredding é uma técnica, não um carimbo de conformidade. Decida com o encarregado de dados (o DPO) o que pode ser apagado e como provar que foi.</p>",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Escolha <b>um</b> módulo onde o histórico vale muito (contas, carteira, pedidos). O resto do sistema pode continuar CRUD.",
  "Liste com o time os fatos do negócio, no passado e com as palavras de quem usa (<code>PedidoPago</code>, não <code>StatusAlterado</code>). Uma sessão de <i>event storming</i> (post-its com os eventos em ordem numa parede) ajuda muito.",
  "Escreva o agregado separando <b>decidir</b> de <b>aplicar</b>. Teste no formato: <i>dados estes eventos, quando este comando, então estes eventos novos</i>.",
  "Comece com uma tabela só de inserção no banco que você já usa, com chave única em (stream, versão). Troque por um event store dedicado só se precisar.",
  "Crie as projeções que as telas pedem e um comando para <b>reconstruir</b> qualquer projeção do zero, relendo todos os eventos.",
  "Desde o primeiro dia: versão do formato em cada evento, metadados (quem, quando, id de correlação) e uma decisão escrita sobre dados pessoais.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Histórico completo e auditável de tudo o que aconteceu", "Mais conceitos e código: agregados, eventos, projeções, versões"],
    ["Viagem no tempo: o estado em qualquer data, e bugs reproduzíveis", "Consultas dependem de projeções; filtrar direto no event store é difícil"],
    ["Novas visões dos dados a qualquer hora, relendo o passado", "Projeções assíncronas ficam um pouco atrasadas (consistência eventual)"],
    ["Escrita simples e rápida: só acrescentar no fim", "Eventos são para sempre: errar o desenho custa caro, e apagar dados pessoais exige técnica"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Evento que é CRUD disfarçado</b>: <code>ContaAtualizada { saldo: 460 }</code> não diz o que aconteceu. Nomeie pela
intenção do negócio: <code>ValorSacado</code>, <code>TarifaCobrada</code>.</li>
<li><b>Editar eventos antigos para "consertar"</b>: um UPDATE no event store destrói a auditoria e deixa as projeções erradas.
Corrija com um evento novo (<code>SaqueEstornado</code>), como faz a contabilidade.</li>
<li><b>Validar ou causar efeitos dentro do <code>aplicar()</code></b>: se a regra mudar, eventos antigos deixam de carregar; se
ele envia e-mail, o cliente recebe de novo toda vez que a conta é reconstruída. Regras ficam no método que decide; efeitos, fora, reagindo
só a eventos novos.</li>
<li><b>Consultar sem projeção</b>: carregar milhares de streams para responder "quais contas estão negativas?". Pergunta
frequente merece uma projeção.</li>
<li><b>Projeção que conta duas vezes</b>: a entrega de eventos costuma ser "pelo menos uma vez". Guarde a última versão
processada ou use chave única.</li>
<li><b>Esquecer o atraso das projeções</b>: o cliente saca e o extrato, que ainda não processou o evento, não mostra o saque.
Devolva o resultado na resposta do comando ou espere a projeção chegar à versão gravada antes de mostrar a tela.</li>
</ul>

${pratica(
  "No mundo real (um exemplo)",
  "<p>Imagine uma carteira digital. Um cliente reclama que o saldo \"estava errado na sexta à noite\". Com uma tabela de saldo, o suporte só veria o número de hoje. Com event sourcing, o time reconstrói a conta até sexta às 21h, vê que uma devolução de Pix entrou duas vezes e grava um evento de correção, sem apagar nada. Meses depois, a área de risco pede um alerta de \"muitos saques pequenos em sequência\": o time escreve uma projeção nova, roda sobre todo o histórico e, no primeiro dia, o alerta já conhece o passado inteiro.</p>",
)}

${dica(
  "Não confunda com arquitetura orientada a eventos (nem com CQRS)",
  "<p>Na arquitetura orientada a eventos (capítulo 20), eventos servem para <b>serviços conversarem</b>; no event sourcing, são o <b>jeito de guardar o estado</b> dentro de um serviço. Dá para ter um sem o outro; com os dois, publique para outros times eventos de integração, mais estáveis, e não os eventos internos do agregado. Já o CQRS (capítulo 21) vive bem sem event sourcing, mas o contrário é raro: como o event store é ruim para consultas, quase todo event sourcing vem com CQRS.</p>",
)}

${alerta(
  "Kafka não é event store (na maioria dos casos)",
  "<p>O Kafka é ótimo para distribuir eventos entre serviços, mas não foi feito para ler com eficiência só os eventos da conta 42, nem para recusar uma gravação quando a versão esperada não bate. O desenho comum: a verdade fica num event store, e um processo que assina esse event store publica os eventos no Kafka para quem quiser ouvir. Assim, se o Kafka estiver fora do ar, nada se perde: a publicação continua de onde parou.</p>",
)}

${combina([
  [21, "CQRS", "as projeções são o lado de leitura"],
  [20, "Orientada a eventos", "publicar fatos para outros serviços"],
  [23, "Sagas", "processos longos que reagem a eventos"],
  [6, "Hexagonal", "o event store como adaptador de saída"],
  [25, "Modelo de atores", "atores que se recuperam relendo eventos"],
  [26, "Arquiteturas de dados", "o log como fonte da verdade (Kappa)"],
])}

${lembre([
  "A verdade é a lista de eventos (fatos no passado, que nunca mudam); o estado atual é o resultado de aplicá-los em ordem.",
  "Consultas saem de projeções, e snapshots só aceleram: os dois são descartáveis e podem ser refeitos relendo os eventos.",
  "Use onde o histórico vale ouro (dinheiro, auditoria), versione os eventos e proteja dados pessoais desde o início. Em CRUD simples, é peso morto.",
])}
`;
