// Capítulo 29: Combinações que funcionam. Capítulo da parte V, então a estrutura muda em relação aos capítulos
// de arquitetura: abertura → as três perguntas e o cardápio → sete receitas (ingredientes, para quem, por que
// combina, como encaixa, riscos; cada uma com diagrama ou tabela) → a escada → combinações que brigam → fechamento.

import { alerta, codigo, combina, dica, fig, lembre, passos, pastas, pratica, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, caminho, claro, cor, elipse, engrenagem, etiqueta, fila, linha, navegador, pessoa, quadro, ret, semear, seta, txt, xis, check } from "../desenho.mjs";

/** Hexágono pequeno (o núcleo de um módulo, como no capítulo 6). */
function hexagono(cx, cy, r, preench = claro.amarelo) {
  const pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((Math.PI / 3) * i), cy + r * 0.82 * Math.sin((Math.PI / 3) * i)]);
  return caminho(`M${pts.map((p) => p.join(",")).join(" L")} Z`, { preench, espessura: 2, gap: 7 });
}

/** Receita 2: monólito modular, um hexágono por módulo, eventos internos. */
function receitaModular() {
  semear("combinacoes-1");
  let s = "";
  s += ret(12, 14, 736, 278, { espessura: 2.2, tracejado: true });
  s += txt(30, 36, "monólito: um deploy, um processo", { tam: 16, cor: cor.cinza, ancora: "start" });
  const modulos = [
    [36, "faturamento"],
    [286, "contas"],
    [536, "notificações"],
  ];
  for (const [x, nome] of modulos) {
    s += bloco(x, 56, 190, 136, nome, { preench: "#ffffff", hachura: "solid", topo: true });
    s += hexagono(x + 62, 140, 40);
    s += txt(x + 62, 141, "núcleo", { tam: 15 });
    s += banco(x + 120, 108, 54, 64, "dados", { preench: claro.cinza, tam: 15 });
  }
  // chamada síncrona pela API pública
  s += seta(228, 96, 284, 96, { espessura: 2, rotulo: "API", dy: -13 });
  // eventos internos
  s += fila(36, 228, 690, 30, "");
  s += txt(381, 276, "eventos internos (barramento em memória)", { tam: 16 });
  s += seta(70, 194, 70, 226, { cor: cor.laranja, espessura: 2 });
  s += txt(80, 210, "publica FaturaPaga", { tam: 15, cor: cor.laranja, ancora: "start" });
  s += seta(320, 226, 320, 194, { cor: cor.azul, espessura: 2 });
  s += txt(330, 210, "reage: libera o plano", { tam: 15, cor: cor.azul, ancora: "start" });
  s += seta(560, 226, 560, 194, { cor: cor.azul, espessura: 2 });
  s += txt(570, 210, "reage: manda recibo", { tam: 15, cor: cor.azul, ancora: "start" });
  s += txt(380, 320, "para extrair um módulo depois, troque o barramento em memória por uma fila", { tam: 16, cor: cor.vermelho });
  return quadro(760, 340, s);
}

/** Receita 3: e-commerce com CQRS no catálogo e saga coreografada no checkout. */
function receitaEcommerce() {
  semear("combinacoes-2");
  let s = "";
  // em cima: CQRS no catálogo
  s += txt(20, 22, "catálogo com CQRS", { tam: 16, cor: cor.violeta, ancora: "start" });
  s += bloco(30, 56, 150, 62, "Catálogo", { preench: claro.violeta });
  s += txt(105, 138, "modelo de escrita", { tam: 15, cor: cor.cinza });
  s += seta(184, 87, 326, 87, { espessura: 2, cor: cor.laranja, rotulo: "ProdutoAlterado", corRotulo: cor.laranja });
  s += bloco(330, 56, 150, 62, "Busca", { preench: claro.verde });
  s += txt(405, 138, "modelo de leitura", { tam: 15, cor: cor.cinza });
  s += navegador(600, 46, 130, 82, "vitrine");
  s += seta(596, 87, 484, 87, { espessura: 2, rotulo: "consulta" });
  s += linha([[20, 160], [740, 160]], { tracejado: true, cor: cor.cinza, espessura: 1.2 });
  // embaixo: saga no checkout
  s += txt(20, 184, "checkout com saga", { tam: 16, cor: cor.laranja, ancora: "start" });
  for (const [x, nome] of [[20, "Pedidos"], [300, "Estoque"], [620, "Pagamento"]]) {
    s += bloco(x, 212, 120, 62, nome, { preench: claro.azul });
    s += banco(x + 37, 288, 46, 44, "", { preench: claro.cinza });
  }
  s += seta(142, 236, 298, 236, { espessura: 2, cor: cor.laranja, rotulo: "1 PedidoCriado", corRotulo: cor.laranja });
  s += seta(422, 236, 618, 236, { espessura: 2, cor: cor.laranja, rotulo: "2 EstoqueReservado", corRotulo: cor.laranja });
  // compensação
  s += seta(618, 260, 424, 260, { tracejado: true, cor: cor.vermelho, espessura: 1.9 });
  s += txt(520, 288, "PagamentoRecusado:\nlibera a reserva", { tam: 15, cor: cor.vermelho });
  // sucesso volta para o pedido
  s += linha([[726, 276], [726, 362], [38, 362]], { cor: cor.verde, espessura: 2 });
  s += seta(38, 362, 38, 278, { cor: cor.verde, espessura: 2 });
  s += txt(380, 382, "3 PagamentoAprovado: o pedido é confirmado", { tam: 15, cor: cor.verde });
  return quadro(760, 398, s);
}

/** Receita 5: dispositivos → log → filtros; reprocessamento no estilo Kappa. */
function receitaStreaming() {
  semear("combinacoes-3");
  let s = "";
  for (const y of [46, 90, 134]) {
    s += ret(28, y, 44, 26, { preench: claro.ciano, hachura: "solid", espessura: 1.6 });
    s += linha([[62, y], [62, y - 9]], { espessura: 1.4 });
    s += elipse(62, y - 11, 6, 6, { preench: cor.ciano, hachura: "solid", cor: cor.ciano });
  }
  s += txt(50, 184, "dispositivos", { tam: 15 });
  s += seta(78, 103, 117, 103, { espessura: 2 });
  s += fila(120, 85, 140, 36, "");
  s += txt(190, 66, "log de eventos", { tam: 16 });
  s += seta(264, 103, 304, 103, { espessura: 2 });
  const filtros = [
    [335, "validar"],
    [455, "enriquecer"],
    [575, "somar por\nminuto"],
  ];
  for (const [cx, nome] of filtros) {
    s += engrenagem(cx, 103, 18);
    s += txt(cx, nome.includes("\n") ? 158 : 150, nome, { tam: 15 });
  }
  s += seta(362, 103, 426, 103, { espessura: 2 });
  s += seta(482, 103, 546, 103, { espessura: 2 });
  s += seta(602, 103, 640, 103, { espessura: 2 });
  s += banco(642, 68, 96, 74, "tabela\natual", { preench: claro.verde, tam: 15 });
  // reprocessar (Kappa)
  s += linha([[190, 124], [190, 262]], { cor: cor.violeta, espessura: 2, tracejado: true });
  s += seta(190, 262, 298, 262, { cor: cor.violeta, espessura: 2, tracejado: true });
  s += txt(202, 206, "lê desde\no começo", { tam: 15, cor: cor.violeta, ancora: "start" });
  s += bloco(300, 230, 280, 64, "mesmo pipeline, versão nova", { preench: claro.violeta, tam: 16 });
  s += seta(582, 262, 640, 262, { cor: cor.violeta, espessura: 2 });
  s += banco(642, 226, 96, 74, "tabela\nnova", { preench: claro.violeta, tam: 15 });
  s += txt(380, 334, "quando a versão nova alcança o presente, a leitura troca de tabela", { tam: 16, cor: cor.violeta });
  return quadro(760, 354, s);
}

/** Receita 6: app com MVVM → BFF em função serverless → serviços. */
function receitaMobile() {
  semear("combinacoes-4");
  let s = "";
  // celular com MVVM
  s += ret(30, 20, 160, 292, { preench: "#ffffff", hachura: "solid", espessura: 2.4 });
  s += linha([[88, 34], [132, 34]], { espessura: 2.6 });
  s += bloco(48, 54, 124, 52, "View (tela)", { preench: claro.amarelo, tam: 16 });
  s += bloco(48, 146, 124, 52, "ViewModel", { preench: claro.verde, tam: 16 });
  s += bloco(48, 238, 124, 52, "Repositório", { preench: claro.cinza, tam: 16 });
  s += seta(62, 144, 62, 108, { cor: cor.verde, espessura: 1.9 });
  s += txt(73, 118, "estado", { tam: 15, cor: cor.verde, ancora: "start" });
  s += seta(158, 108, 158, 144, { espessura: 1.9 });
  s += txt(150, 136, "ação", { tam: 15, ancora: "end" });
  s += seta(110, 200, 110, 236, { espessura: 1.9 });
  s += txt(110, 334, "app (MVVM)", { tam: 16 });
  // só o BFF fica no serverless; os serviços podem ser de qualquer tipo
  s += ret(290, 20, 220, 292, { espessura: 1.8, tracejado: true, cor: cor.ciano });
  s += txt(400, 42, "função serverless", { tam: 16, cor: cor.ciano });
  s += seta(174, 264, 318, 264, { espessura: 2.2 });
  s += txt(232, 226, "1 chamada\npor tela", { tam: 15 });
  s += bloco(320, 222, 150, 76, "BFF", { preench: claro.laranja, tam: 20 });
  s += txt(660, 42, "serviços", { tam: 16, cor: cor.azul });
  const servicos = [
    [74, "Pedidos"],
    [152, "Catálogo"],
    [230, "Perfil"],
  ];
  for (const [y, nome] of servicos) {
    s += bloco(585, y, 150, 50, nome, { preench: claro.azul, tam: 16 });
    s += seta(472, 258, 583, y + 25, { espessura: 1.7, cor: cor.cinza });
  }
  s += txt(395, 120, "junta as respostas,\ncorta campos e\nformata para a tela", { tam: 15, cor: cor.cinza });
  s += seta(395, 160, 395, 218, { espessura: 1.4, cor: cor.cinza, tracejado: true });
  return quadro(760, 350, s);
}

/** Receita 7: roteador fino na frente de células independentes. */
function receitaCelulas() {
  semear("combinacoes-5");
  let s = "";
  s += pessoa(70, 30, { rotulo: "cliente 42" });
  s += seta(100, 62, 218, 62, { espessura: 2 });
  s += bloco(220, 30, 240, 64, "roteador de células", { preench: claro.amarelo });
  s += seta(462, 62, 522, 62, { espessura: 1.6, tracejado: true, cor: cor.cinza });
  s += etiqueta(622, 62, "cliente 42 → célula B", { tam: 15, w: 168 });
  const celulas = [
    [20, "célula A", false],
    [265, "célula B", true],
    [510, "célula C", false],
  ];
  for (const [x, nome, caiu] of celulas) {
    s += ret(x, 150, 230, 188, { espessura: 2, tracejado: true, cor: caiu ? cor.vermelho : cor.tinta, preench: caiu ? claro.vermelho : undefined, gap: 9 });
    s += txt(x + 115, 172, nome, { tam: 17, cor: caiu ? cor.vermelho : cor.tinta });
    for (let i = 0; i < 3; i++) s += bloco(x + 28 + i * 62, 196, 50, 38, "", { preench: "#ffffff", hachura: "solid", espessura: 1.6 });
    s += txt(x + 115, 250, "serviços", { tam: 15, cor: cor.cinza });
    s += banco(x + 80, 266, 70, 58, "banco", { preench: "#ffffff", tam: 15 });
  }
  s += seta(300, 96, 140, 146, { espessura: 1.7, cor: cor.cinza });
  s += seta(340, 96, 378, 146, { espessura: 2.4 });
  s += seta(400, 96, 620, 146, { espessura: 1.7, cor: cor.cinza });
  s += xis(475, 172, 18);
  s += check(68, 364) + txt(145, 364, "clientes da A: ok", { tam: 15, cor: cor.verde });
  s += txt(380, 364, "clientes da B: fora do ar", { tam: 15, cor: cor.vermelho });
  s += check(558, 364) + txt(635, 364, "clientes da C: ok", { tam: 15, cor: cor.verde });
  return quadro(760, 384, s);
}

/** A escada: receitas 1 → 2 → 3 → 7, e as receitas de domínio que entram em qualquer degrau. */
function escada() {
  semear("combinacoes-6");
  let s = "";
  s += txt(20, 30, "a escada: suba quando a dor aparecer", { tam: 16, cor: cor.verde, ancora: "start" });
  const degraus = [
    [15, 260, "1. MVP\nmonólito + camadas", claro.cinza],
    [200, 190, "2. SaaS crescendo\nmonólito modular", claro.verde],
    [385, 120, "3. e-commerce\nmicrosserviços", claro.azul],
    [570, 50, "7. SaaS enorme\n+ células", claro.violeta],
  ];
  for (const [x, y, nome, c] of degraus) s += bloco(x, y, 170, 60, nome, { preench: c, tam: 15 });
  const dores = ["produto validado,\nmais de um time", "times precisam de\ndeploy independente", "uma pane geral\ncusta contratos"];
  for (let i = 0; i < 3; i++) {
    const [x, y] = degraus[i];
    const [nx, ny] = degraus[i + 1];
    s += linha([[x + 85, y - 2], [x + 85, ny + 30]], { espessura: 2 });
    s += seta(x + 85, ny + 30, nx - 2, ny + 30, { espessura: 2 });
    s += txt(nx + 85, ny + 88, dores[i], { tam: 15, cor: cor.cinza });
  }
  s += ret(395, 250, 350, 86, { tracejado: true, espessura: 1.6, cor: cor.laranja });
  s += txt(570, 272, "receitas de domínio (qualquer degrau)", { tam: 15, cor: cor.laranja });
  s += etiqueta(455, 310, "4. fintech", { tam: 15, preench: claro.laranja });
  s += etiqueta(572, 310, "5. streaming", { tam: 15, preench: claro.laranja });
  s += etiqueta(690, 310, "6. mobile", { tam: 15, preench: claro.laranja });
  return quadro(760, 350, s);
}

export default `
${resumo(
  "Arquiteturas não competem: cada uma responde a uma pergunta diferente, e os sistemas de verdade juntam várias. Aqui estão <b>sete combinações que funcionam</b>, com o porquê, o encaixe e os riscos de cada uma.",
  "Pense num prato feito: arroz, feijão, bife e salada. Cada item cumpre um papel e o conjunto funciona. Mas ninguém serve feijoada no café da manhã: a receita depende da hora e de quem vai comer.",
)}

<p>Até aqui, cada arquitetura apareceu sozinha. Na vida real elas andam juntas: ninguém escolhe "microsserviços" e para
por aí. Isso funciona porque elas respondem a perguntas diferentes, que são exatamente as partes II, III e IV deste livro:</p>
<ul>
<li><b>Por dentro</b> (parte II): como organizar o código de cada aplicação?</li>
<li><b>Por fora</b> (parte III): em quantas partes o sistema vai para o ar?</li>
<li><b>Comunicação e dados</b> (parte IV): como as partes conversam e guardam o que sabem?</li>
</ul>
<p>Uma boa combinação escolhe uma resposta para cada pergunta, e as respostas precisam conversar entre si. A tabela abaixo é
o cardápio do capítulo. Depois vem cada receita: ingredientes, para quem serve, por que as peças combinam, como se
encaixam e o que pode dar errado.</p>

${tabela(
  ["Receita", "Por dentro", "Por fora", "Comunicação e dados"],
  [
    ["<b>1. MVP de startup</b>", "camadas", "monólito", "chamadas diretas, um banco, transações"],
    ["<b>2. SaaS crescendo</b>", "hexagonal em cada módulo", "monólito modular", "eventos internos"],
    ["<b>3. E-commerce grande</b>", "camadas ou hexagonal em cada serviço", "microsserviços", "eventos, sagas e CQRS no catálogo"],
    ["<b>4. Fintech</b>", "hexagonal", "monólito modular ou serviços", "event sourcing e sagas"],
    ["<b>5. IoT e streaming</b>", "pipes and filters", "consumidores de stream", "eventos num log, Kappa"],
    ["<b>6. App mobile</b>", "MVVM no app", "BFF em serverless", "HTTP do app ao BFF; eventos nas tarefas de fundo"],
    ["<b>7. SaaS enorme</b>", "camadas ou hexagonal em cada serviço", "microsserviços em células", "eventos dentro da célula; roteamento por cliente"],
  ],
  "compacta",
)}

<h3>Receita 1: MVP de startup</h3>
<p><b>Ingredientes:</b> monólito (capítulo 11) + camadas (capítulo 4). <b>Para quem:</b> produto novo, time pequeno,
muita dúvida sobre o que o cliente quer de verdade.</p>
<p><b>Por que combina.</b> No começo, o que importa é a velocidade de aprender: lançar, medir, mudar. O monólito deixa
pouca coisa para operar, e as camadas são o formato mais conhecido: frameworks como Rails, Django, Laravel, NestJS e Spring
já empurram nessa direção, então quem chega entende o projeto no primeiro dia. É a ideia do "Monolith First", de Martin
Fowler (2015): comece pelo monólito e só divida quando souber onde ficam as fronteiras.</p>

${tabela(
  ["Peça", "Papel na receita"],
  [
    ["Monólito", "Um deploy, um banco, nenhuma chamada de rede entre as partes. Uma transação garante a consistência."],
    ["Camadas", "Rotas → serviços → repositórios: entrada, regra e acesso a dados, cada um no seu lugar."],
    ["Pastas por funcionalidade", "<code>pedidos/</code> e <code>clientes/</code>, cada uma com as suas camadas dentro. Deixa o caminho pronto para a receita 2."],
  ],
)}

<p><b>Riscos.</b> Sem disciplina, as camadas viram enfeite: regra de negócio no controller, um <code>PedidoService</code>
de três mil linhas, e o projeto escorrega para a grande bola de lama (capítulo 31). Duas defesas baratas: as pastas por
funcionalidade da tabela e testes nos serviços. E não tenha medo do monólito: o Stack Overflow é o exemplo clássico de
um site com tráfego enorme atendido por um monólito rodando em poucos servidores.</p>

<h3>Receita 2: SaaS crescendo</h3>
<p><b>Ingredientes:</b> monólito modular (capítulo 12) + hexagonal em cada módulo (capítulo 6) + eventos internos
(capítulo 20). <b>Para quem:</b> produto validado, dois ou mais times mexendo no mesmo código, regras ficando ricas
(planos, cobrança, permissões).</p>
<p><b>Por que combina.</b> Cada peça resolve uma dor diferente do crescimento. O monólito modular cria fronteiras entre
áreas do negócio sem pagar o preço da rede: continua um deploy só. A hexagonal dentro de cada módulo protege a regra e
deixa a tecnologia trocável. E os eventos internos diminuem o acoplamento entre módulos: o faturamento avisa "fatura paga"
sem saber quem se interessa por isso.</p>

${fig(receitaModular(), "Três módulos num deploy só, cada um com o seu núcleo e os seus dados. Entre eles, só a API pública (seta preta) ou eventos internos.")}

<p style="break-after: avoid"><b>Como as peças se encaixam.</b></p>
<ul>
<li>Um módulo só fala com outro de dois jeitos: chamando a API pública dele (o <code>index.ts</code>) ou reagindo aos
eventos que ele publica. Nunca lendo as tabelas dele.</li>
<li>Publicar evento é uma <b>porta de saída</b> do núcleo (<code>PublicadorDeEventos</code>); o barramento em memória é
só um adaptador. Ouvir evento é um <b>adaptador de entrada</b> do outro módulo, igual a uma rota HTTP.</li>
<li>Por isso, extrair um módulo para um serviço (capítulo 30) é trocar adaptadores: o barramento em memória vira uma
fila de verdade, e o núcleo não muda.</li>
</ul>

${pastas(`
src/
├── faturamento/
│   ├── nucleo/              # fatura, pagar-fatura, portas
│   ├── adaptadores/         # http, postgres, ouvintes de eventos
│   └── index.ts             # API pública: o resto é privado
├── contas/                  # mesmo formato
├── notificacoes/            # mesmo formato
├── compartilhado/
│   └── barramento.ts        # eventos internos, em memória
└── main.ts                  # liga módulos, adaptadores e assinaturas
`)}

${codigo(
  `
// faturamento/nucleo/portas.ts: o núcleo só sabe que eventos existem
export type FaturaPaga = { tipo: "FaturaPaga"; faturaId: string; contaId: string; valor: number };
export interface PublicadorDeEventos {
  publicar(evento: FaturaPaga): Promise<void>;
}

// faturamento/nucleo/pagar-fatura.ts: caso de uso, sem saber quem vai ouvir
export class PagarFatura {
  constructor(private faturas: RepositorioDeFaturas, private eventos: PublicadorDeEventos) {}

  async executar(faturaId: string) {
    const fatura = await this.faturas.buscar(faturaId);
    if (!fatura) throw new Error("Fatura não encontrada");
    fatura.marcarComoPaga();
    await this.faturas.salvar(fatura);
    await this.eventos.publicar({ tipo: "FaturaPaga", faturaId, contaId: fatura.contaId, valor: fatura.total });
  }
}`,
  "src/faturamento/nucleo",
)}

${codigo(
  `
// compartilhado/barramento.ts: adaptador em memória (amanhã pode ser SQS, RabbitMQ ou Kafka)
type Evento = { tipo: string };
type Ouvinte = (evento: Evento) => Promise<void>;
export class BarramentoEmMemoria {
  private ouvintes = new Map<string, Ouvinte[]>();
  assinar<E extends Evento>(tipo: E["tipo"], ouvinte: (evento: E) => Promise<void>) {
    this.ouvintes.set(tipo, [...(this.ouvintes.get(tipo) ?? []), ouvinte as Ouvinte]);
  }
  async publicar(evento: Evento) {
    for (const ouvinte of this.ouvintes.get(evento.tipo) ?? []) await ouvinte(evento);
  }
}

// main.ts: os módulos se ligam aqui; o faturamento nunca importa notificações
const barramento = new BarramentoEmMemoria();
const pagarFatura = new PagarFatura(new FaturasPostgres(pool), barramento);
barramento.assinar<FaturaPaga>("FaturaPaga", (e) => enviarRecibo.executar(e.contaId, e.faturaId));
barramento.assinar<FaturaPaga>("FaturaPaga", (e) => liberarPlano.executar(e.contaId));`,
  "src/compartilhado e src/main.ts",
)}

<p style="break-after: avoid"><b>Riscos.</b></p>
<ul>
<li><b>Fronteira furada</b>: um módulo importa um arquivo interno do outro "só dessa vez". Automatize a checagem
(dependency-cruiser ou regras de lint no TypeScript; Packwerk no Ruby).</li>
<li><b>Evento perdido ou erro que volta</b>: num barramento em memória, se o processo cair entre gravar no banco e
publicar, o evento some; e, como os ouvintes rodam dentro da chamada, um erro num deles volta para quem publicou. Quando
isso importar, use o padrão <i>outbox</i> (capítulo 20): grave o evento numa tabela, na mesma transação, e entregue depois.</li>
<li><b>Evento para tudo</b>: se cada ação dispara cinco reações em cadeia, ninguém entende mais o fluxo. Quando você
precisa da resposta agora ("esta conta pode criar mais um usuário?"), chame a API do módulo.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O Shopify mantém o seu sistema principal como um monólito Rails dividido em componentes, e criou e abriu o código do <b>Packwerk</b>, uma ferramenta que aponta quando um componente usa partes privadas de outro. É a receita 2 em grande escala: fronteiras de serviço, deploy de monólito.</p>",
)}

<h3>Receita 3: e-commerce grande</h3>
<p><b>Ingredientes:</b> microsserviços (capítulo 14) + eventos (capítulo 20) + sagas (capítulo 23) + CQRS no catálogo
(capítulo 21). <b>Para quem:</b> loja com muitos times, picos fortes (Black Friday) e partes com cargas bem diferentes: a
vitrine recebe muito mais buscas do que o checkout recebe pedidos.</p>
${fig(receitaEcommerce(), "Em cima, CQRS: o catálogo grava e avisa por evento; a busca guarda um modelo só para leitura. Embaixo, uma saga coreografada: se o pagamento for recusado, o estoque libera a reserva e o pedido é cancelado.")}

<p><b>Por que combina.</b> Os microsserviços dão a cada time o seu deploy e deixam escalar só o que está quente. Só que,
com um banco por serviço, some a transação única, e é aí que entram as outras peças. Os <b>eventos</b> evitam cadeias de
chamadas síncronas: se o serviço de e-mail cair, o pedido não cai junto. A <b>saga</b> faz o papel da transação no
checkout, com um passo de desfazer para cada passo. E o <b>CQRS no catálogo</b> separa a escrita (cadastro, preço,
descrição) da leitura (busca e vitrine), que ganha um modelo próprio, otimizado e escalado à parte.</p>

<p><b>Como as peças se encaixam.</b> Por dentro, cada serviço segue camadas ou hexagonal: consumidores de eventos são
adaptadores de entrada, e o publicador é uma porta de saída. O barramento (Kafka, RabbitMQ, SNS com SQS) é o único ponto
que todos conhecem. O CQRS entra só no catálogo, onde leitura e escrita realmente divergem; no resto, um modelo basta.</p>
<p style="break-after: avoid"><b>Riscos.</b></p>
<ul>
<li><b>Operação pesada</b>: rastreamento distribuído, logs centralizados, versionamento de eventos e plantão por
serviço. Sem isso, cada bug vira uma caça ao tesouro em dez serviços.</li>
<li><b>Mensagem repetida</b>: a maioria dos barramentos entrega "pelo menos uma vez". Todo consumidor precisa ser
idempotente: processar o mesmo evento duas vezes não pode cobrar duas vezes.</li>
<li><b>Atraso visível</b>: o preço novo leva alguns segundos para chegar à busca. Combine com o negócio o que pode ficar
defasado; o preço cobrado no checkout sempre vem do modelo de escrita.</li>
<li><b>Monólito distribuído</b>: se o checkout chama seis serviços em fila para responder, você pagou o preço dos
microsserviços sem ganhar a independência.</li>
</ul>

<h3>Receita 4: fintech</h3>
<p><b>Ingredientes:</b> hexagonal (capítulo 6) + event sourcing (capítulo 22) + sagas (capítulo 23). <b>Para quem:</b>
carteira digital, conta de pagamento, crédito: produtos em que cada centavo precisa de explicação para o cliente, para a
auditoria e para o regulador.</p>
<p><b>Por que combina.</b> Em dinheiro, "como chegamos neste saldo?" vale tanto quanto o saldo. Com <b>event
sourcing</b>, o que se grava são os fatos (depósito recebido, transferência debitada), nunca um saldo sobrescrito; o saldo
é calculado a partir deles, e dá para reconstruir a conta em qualquer data. A <b>hexagonal</b> protege as regras que
mudam com o negócio e com a regulação (limites, tarifas, antifraude) e isola os parceiros de fora: Pix, bandeira de
cartão, birô de crédito, cada um atrás de um adaptador. As <b>sagas</b> coordenam operações que passam por mais de um
sistema, como uma transferência para outro banco: debita aqui, envia para lá e, se o outro lado recusar, compensa. E não
é preciso ter microsserviços para precisar de saga: o parceiro externo já é "outro sistema".</p>

${tabela(
  ["#", "Evento gravado (nunca muda)", "Valor", "Saldo calculado"],
  [
    ["1", "<code>ContaAberta</code>", "", "R$&nbsp;0"],
    ["2", "<code>DepositoRecebido</code>", "+&nbsp;R$&nbsp;500", "R$&nbsp;500"],
    ["3", "<code>TransferenciaDebitada</code> <i>(saga: primeiro passo)</i>", "−&nbsp;R$&nbsp;200", "R$&nbsp;300"],
    ["4", "<code>TransferenciaEstornada</code> <i>(saga: compensação, o banco de destino recusou)</i>", "+&nbsp;R$&nbsp;200", "R$&nbsp;500"],
    ["5", "<code>CompraNoDebito</code>", "−&nbsp;R$&nbsp;80", "R$&nbsp;420"],
  ],
)}

<p>Repare na linha 4: a compensação da saga não apaga a linha 3: ela é um fato novo. O histórico conta a verdade
inteira, inclusive o que deu errado.</p>
<p><b>Como as peças se encaixam.</b> O <i>event store</i> (o banco de eventos) fica atrás de uma porta de saída, como
<code>RepositorioDeContas</code>: ela carrega a conta somando os eventos e grava os novos. Cada parceiro (Pix, bandeira,
birô) é outro adaptador de saída. A saga é um caso de uso que reage a eventos: ouve <code>TransferenciaDebitada</code>,
chama a porta do parceiro e grava a resposta como um evento novo. Extrato e relatórios são projeções alimentadas pelos
mesmos eventos (o lado de leitura do CQRS, capítulo 21).</p>
<p><b>Riscos.</b> Event sourcing é a peça mais cara desta receita. Evento gravado não muda, então mudar o formato exige
versionamento; contas com muitos eventos pedem <i>snapshots</i> (fotos do estado) para não somar tudo a cada leitura; e
perguntas como "quais clientes têm saldo acima de R$ 10 mil?" pedem projeções separadas. Se o que você precisa é só
auditoria, um livro-razão (<i>ledger</i>) de partidas dobradas, em tabelas que só recebem inserções, já resolve boa
parte com bem menos esforço. E, com ou sem event sourcing, toda operação com dinheiro precisa ser <b>idempotente</b>: o
cliente que toca duas vezes em "pagar", ou a mensagem que chega repetida, não pode gerar duas cobranças. O jeito comum
é uma chave de idempotência por operação, guardada e conferida antes de executar.</p>

<h3>Receita 5: IoT e streaming</h3>
<p><b>Ingredientes:</b> eventos (capítulo 20) + pipes and filters (capítulo 10) + Kappa (capítulo 26). <b>Para
quem:</b> dados que não param de chegar: sensores de uma frota, medidores de energia, a posição dos entregadores num app
de delivery, os eventos de reprodução de um streaming de vídeo.</p>
<p><b>Por que combina.</b> Aqui o dado já nasce como evento: cada leitura é um fato com horário. Um <b>log durável</b>
(Kafka, Kinesis, Pulsar) recebe tudo, absorve os picos e guarda o histórico por um tempo. O processamento é uma sequência
de etapas independentes (validar, enriquecer, agregar), que é exatamente <b>pipes and filters</b>, e cada etapa escala por
conta própria. E a <b>Kappa</b>, proposta por Jay Kreps em 2014, usa um caminho só, o de streaming: em vez de manter um
sistema em lote em paralelo (como na arquitetura Lambda), você reprocessa rodando o mesmo código de novo sobre o log.</p>

${fig(receitaStreaming(), "Cada leitura entra no log e passa por filtros independentes. Para corrigir um cálculo, a versão nova do mesmo pipeline relê o log desde o começo e grava numa tabela nova; quando ela alcança o presente, a leitura troca de tabela.")}

<p><b>Como as peças se encaixam.</b> Cada filtro é um consumidor que lê de um tópico e escreve no próximo: o log faz o
papel do cano (<i>pipe</i>). Particione os tópicos pelo id do dispositivo; assim as leituras de um mesmo sensor chegam em
ordem e o trabalho se espalha por várias cópias do filtro. Painel, alerta e tabela final são só mais consumidores do
último tópico.</p>
<p style="break-after: avoid"><b>Riscos.</b></p>
<ul>
<li><b>Dado atrasado e repetido</b>: o sensor fica sem sinal e manda tudo de uma vez, horas depois. Agrupe pela hora do
evento (não pela hora de chegada), aceite atrasos até um limite e descarte repetidos por um id.</li>
<li><b>Reprocessar tem limite</b>: só dá para refazer o que ainda está no log. A retenção (dias, meses, para sempre) é
decisão de negócio e de custo.</li>
<li><b>Filtros com estado</b> (somas por janela, contagens) precisam guardar esse estado de forma segura para não
perder a conta quando reiniciam. Frameworks como Flink (com <i>checkpoints</i>, cópias periódicas do estado) e Kafka Streams já cuidam disso; não
reinvente.</li>
</ul>

<h3>Receita 6: app mobile</h3>
<p><b>Ingredientes:</b> MVVM no app (capítulo 5) + BFF (capítulo 14) + serverless (capítulo 15). <b>Para quem:</b> app iOS e Android com
time de back-end pequeno e uso em picos (o horário do almoço num app de delivery, uma notificação para todos os
usuários).</p>
<p><b>Por que combina.</b> O <b>MVVM</b> separa a tela (View) do estado e da lógica de apresentação (ViewModel), que dá
para testar sem emulador; é o formato do guia oficial de arquitetura do Android (com o ViewModel do Jetpack) e muito
usado com SwiftUI. O <b>BFF</b>
(<i>Backend for Frontend</i>, back-end para o front-end) é uma API feita sob medida para as telas do app: junta dados de
vários serviços numa chamada só e devolve só os campos que a tela usa, o que faz muita diferença em rede móvel. E rodar o BFF e
as tarefas de fundo (redimensionar foto, mandar push) em <b>serverless</b> tira do time pequeno o trabalho de cuidar de
servidor: escala sozinho no pico e custa pouco quando ninguém está usando.</p>

${fig(receitaMobile(), "No app, a View mostra o estado do ViewModel e devolve as ações do usuário. O BFF, uma função serverless, transforma várias chamadas em uma só por tela.")}

${codigo(
  `
// bff/tela-inicial.ts: uma chamada, só o que a tela inicial usa
export async function telaInicial(usuarioId: string) {
  const [perfil, recentes, ofertas] = await Promise.all([
    contasApi.perfil(usuarioId),
    pedidosApi.recentes(usuarioId, 3),
    ofertasApi.destaques(usuarioId),
  ]);
  return {
    saudacao: \`Oi, \${perfil.primeiroNome}\`,
    ultimosPedidos: recentes.map((p) => ({ id: p.id, loja: p.loja.nome, status: p.status })),
    banner: ofertas[0]?.imagemUrl ?? null,
  };
}`,
  "bff/tela-inicial.ts",
)}

<p><b>Como as peças se encaixam.</b> O repositório do app só conversa com o BFF, nunca direto com os serviços. O BFF é
dono do formato das telas; os serviços são donos das regras. Costuma existir um BFF por tipo de cliente (app, site), e o
app iOS e o Android podem compartilhar o mesmo quando as telas são parecidas. As tarefas de fundo são outras funções,
disparadas por fila, upload ou horário.</p>
<p style="break-after: avoid"><b>Riscos.</b></p>
<ul>
<li><b>Cold start</b>: a primeira chamada a uma função "fria" demora mais, e na tela inicial isso aparece. Meça antes de
prometer tempo de resposta.</li>
<li><b>BFF engordando</b>: ele junta e formata; regra de negócio (preço, desconto, permissão) mora nos serviços. Senão
você ganha um segundo back-end para manter.</li>
<li><b>App velho no ar</b>: tem gente que demora meses para atualizar. O BFF precisa aceitar versões antigas do app;
só remova um campo quando ninguém mais usar.</li>
</ul>

<h3>Receita 7: SaaS enorme</h3>
<p><b>Ingredientes:</b> microsserviços (capítulo 14) + células (capítulo 17). <b>Para quem:</b> SaaS com muitos clientes
empresariais, em que uma pane geral custa contratos, e que já vive a receita 3.</p>
<p><b>Por que combina.</b> Os microsserviços resolvem a escala dos times e das funções, mas uma falha ainda pode pegar
todo mundo: um deploy ruim, um banco saturado, um cliente que manda tráfego demais. A <b>célula</b> copia a pilha inteira
(serviços e bancos) em unidades independentes; cada cliente mora numa célula, e um roteador fino manda cada requisição
para a célula certa. A falha fica presa numa célula, o deploy pode ir de célula em célula, e crescer vira "abrir mais
uma célula".</p>

${fig(receitaCelulas(), "O roteador só sabe qual cliente mora em qual célula. Cada célula tem todos os serviços e o próprio banco; quando a B falha, as outras nem percebem.")}

<p><b>Como as peças se encaixam.</b> Dentro da célula nada muda: os mesmos microsserviços, eventos e sagas da receita 3,
com tudo local à célula. Fora dela ficam só duas peças pequenas: o roteador e um plano de controle, que cria células e
move clientes entre elas. As células também funcionam com um monólito dentro: o que se copia é a pilha, seja ela qual
for. A AWS fala publicamente de arquitetura em células para reduzir o raio de impacto das falhas, e o Slack contou em 2023
como migrou para células cortadas por zona de disponibilidade, e não por cliente (capítulo 17), para conseguir tirar
o tráfego de uma zona com problema.</p>
<p><b>Riscos.</b> Custa caro (cada célula tem uma capacidade mínima, mesmo meio vazia); o roteador vira peça crítica e
precisa ser muito simples; tudo que cruza clientes (relatório global, busca entre empresas) fica difícil; e um cliente
maior que uma célula exige tratamento especial. É o último degrau da escada, nunca o primeiro.</p>

<h3>A escada</h3>
<p>As receitas 1, 2, 3 e 7 formam uma escada: cada degrau resolve a dor que o anterior começou a sentir. As receitas 4, 5
e 6 são de domínio: entram em qualquer degrau, só na parte do sistema que precisa delas. A carteira de um app de delivery
pode seguir a receita 4 enquanto o resto do sistema segue a 2, e o app do cliente segue a 6.</p>

${fig(escada(), "Cada seta é uma dor, não uma data. Se a dor não apareceu, fique no degrau em que está.")}

<h4>Como montar a sua combinação</h4>
${passos([
  "Escreva a dor dominante do produto: muita regra, muitos times, picos, dado contínuo, auditoria (os critérios do capítulo 2).",
  "Escolha o <b>por fora</b> pelo time e pelo deploy: um time, monólito; vários times no mesmo código, monólito modular; times que precisam publicar sem esperar os outros, serviços.",
  "Escolha o <b>por dentro</b> pela regra de negócio: pouca regra, camadas; regra rica e que muda muito, hexagonal ou clean.",
  "Escolha <b>comunicação e dados</b> pelo formato do problema: reagir a fatos, eventos; leitura muito diferente da escrita, CQRS; histórico obrigatório, event sourcing; dado sem fim, streaming.",
  "Some uma peça por vez, quando a dor aparecer, e registre o porquê num ADR (capítulo 32).",
])}

${dica(
  "Outras combinações que você vai encontrar",
  `<ul>
<li><b>Vertical slice + CQRS leve</b> (capítulos 8 e 21): cada funcionalidade é um comando ou uma consulta com o seu próprio handler, sem dois bancos.</li>
<li><b>Microkernel + hexagonal</b> (capítulos 9 e 6): o contrato do plugin é uma porta, e cada plugin é um adaptador.</li>
<li><b>Serverless + eventos</b> (capítulos 15 e 20): funções disparadas por fila, upload ou horário, o uso em que o serverless mais brilha.</li>
<li><b>Monólito modular + poucos serviços</b> (capítulos 12 e 14): o grosso fica no monólito e só sai o que tem necessidade própria, como uma busca ou um processamento de vídeo pesado.</li>
</ul>`,
)}

<h3>Erros comuns: combinações que brigam</h3>
${tabela(
  ["Combinação", "Por que dá errado", "Faça em vez disso"],
  [
    ["Microsserviços + um banco compartilhado", "Mudar uma tabela quebra vários serviços; o deploy independente deixa de existir.", "Um banco (ou schema) por serviço, ou volte para o monólito modular."],
    ["Event sourcing + CRUD sem regra", "Projeções, versões de eventos e reprocessamentos sem ganho nenhum.", "Tabelas normais + log de auditoria."],
    ["Saga dentro de um monólito com um banco só (e sem sistema externo no meio)", "Você reimplementa à mão o que uma transação faz de graça.", "Use a transação do banco."],
    ["Serverless + processo longo ou conexão sempre aberta", "Limite de tempo por execução (15 minutos no AWS Lambda) e conexões demais com o banco.", "Um contêiner ou servidor só para essa parte."],
    ["Micro-frontends com um time só", "Vários builds, deploys e versões de dependências para as mesmas pessoas.", "Um front-end modular, num repositório."],
    ["CQRS no sistema inteiro", "Dois modelos para manter em telas que só leem o que acabaram de gravar.", "CQRS só onde leitura e escrita divergem, como no catálogo."],
  ],
  "compacta",
)}
<ul>
<li><b>Montar o combo completo no dia 1</b>: microsserviços, Kafka, CQRS e células num produto sem clientes. Cada peça
custa para operar, e você paga todas antes de ter a dor que alguma delas resolve.</li>
<li><b>Copiar a receita de uma empresa gigante</b>: a arquitetura da Netflix resolve os problemas da Netflix, com o time
da Netflix. Copie o raciocínio (dor → peça), não o resultado.</li>
</ul>

${alerta(
  "Não pule degraus",
  "<p>Ir da receita 1 direto para a 3, sem passar pelas fronteiras da 2, costuma gerar um <b>monólito distribuído</b>: serviços separados no deploy, mas grudados no código e no banco. Separe primeiro em módulos; extraia serviços depois, um por vez (capítulo 30).</p>",
)}

${dica(
  "Uma ficha para cada sistema",
  "<p>Escreva a sua combinação em três linhas (por dentro, por fora, comunicação e dados) e, ao lado de cada peça, a dor que ela resolve. Peça sem dor ao lado sai da receita. Essa ficha vira o primeiro ADR do projeto.</p>",
)}

${combina([
  [2, "Os critérios que decidem a escolha", "a base de cada peça"],
  [27, "Comparativo geral", "as peças lado a lado"],
  [28, "Árvore de decisão", "qual peça para qual problema"],
  [30, "Como migrar sem parar o sistema", "subir de degrau com segurança"],
  [31, "Anti-padrões", "quando a receita desanda"],
  [32, "ADRs e revisão", "registrar por que cada peça entrou"],
])}

${lembre([
  "Cada arquitetura responde a uma pergunta (por dentro, por fora, comunicação e dados); uma boa combinação escolhe uma resposta para cada.",
  "Comece pela receita 1 ou 2 e suba de degrau só quando a dor aparecer. As receitas de domínio entram onde forem necessárias.",
  "Toda peça cobra para operar: se você não sabe dizer que dor ela resolve, ela não entra.",
])}
`;
