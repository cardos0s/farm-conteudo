// Capítulo 9: Microkernel (plugins). Mesma estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, check, claro, cor, etiqueta, linha, passo, quadro, ret, semear, seta, txt, xis } from "../desenho.mjs";

/** Diagrama principal: núcleo com pontos de extensão e plugins encaixados dos dois lados. */
function nucleoEPlugins() {
  semear("microkernel-1");
  let s = "";
  // cabeçalhos dos dois grupos de plugins
  s += txt(105, 26, "plugins de frete", { tam: 17, cor: cor.verde });
  s += txt(105, 50, "contrato PluginDeFrete", { tam: 15, cor: cor.cinza });
  s += txt(655, 26, "plugins de relatório", { tam: 17, cor: cor.violeta });
  s += txt(655, 50, "contrato Exportador", { tam: 15, cor: cor.cinza });

  // núcleo
  s += bloco(255, 80, 250, 212, "", { preench: claro.amarelo, espessura: 2.6 });
  s += txt(380, 108, "núcleo", { tam: 21 });
  s += txt(380, 136, "carrinho, checkout,", { tam: 15, cor: "#495057" });
  s += txt(380, 156, "estoque, pedidos", { tam: 15, cor: "#495057" });
  s += bloco(290, 186, 180, 76, "registro\nde plugins", { preench: "#ffffff", hachura: "solid", tam: 16 });

  // pontos de extensão (encaixes na borda do núcleo)
  const encaixe = (x, y, c) => bloco(x - 9, y - 9, 18, 18, "", { preench: c, hachura: "solid", cor: c });
  const ys = [125, 245];
  for (const y of ys) {
    s += encaixe(255, y, cor.verde);
    s += encaixe(505, y, cor.violeta);
  }

  // plugins
  const esq = [["motoboy"], ["retirada na loja"]];
  const dir = [["PDF"], ["planilha CSV"]];
  esq.forEach(([nome], i) => {
    const y = ys[i];
    s += bloco(20, y - 30, 170, 60, nome, { preench: claro.verde, tam: 16 });
    s += seta(192, y, 241, y, { cor: cor.verde, espessura: 2 });
  });
  dir.forEach(([nome], i) => {
    const y = ys[i];
    s += bloco(570, y - 30, 170, 60, nome, { preench: claro.violeta, tam: 16 });
    s += seta(568, y, 519, y, { cor: cor.violeta, espessura: 2 });
  });

  // plugin novo entrando por baixo
  s += bloco(295, 344, 170, 52, "plugin novo", { preench: claro.cinza, tracejado: true, tam: 16 });
  s += seta(380, 342, 380, 306, { cor: cor.cinza, tracejado: true, espessura: 2 });
  s += txt(400, 322, "entra sem mudar o núcleo", { tam: 15, cor: cor.cinza, ancora: "start" });

  // legenda do encaixe
  s += bloco(24, 352, 16, 16, "", { preench: cor.verde, hachura: "solid", cor: cor.verde });
  s += txt(50, 360, "ponto de", { tam: 15, ancora: "start" });
  s += txt(50, 380, "extensão", { tam: 15, ancora: "start" });

  s += txt(380, 426, "os plugins dependem do contrato; o núcleo não conhece plugin nenhum pelo nome", { tam: 16, cor: cor.vermelho });
  return quadro(760, 444, s);
}

/** Ciclo de vida: descobrir → manifesto → versão → registrar; e, na hora de usar, falhas isoladas. */
function cicloDeVida() {
  semear("microkernel-2");
  let s = "";
  // linha 1: carregamento
  const etapas = [
    [20, "descobrir", ["pasta, npm, loja", "ou config do cliente"]],
    [210, "ler manifesto", ["nome, versão,", "API, permissões"]],
    [400, "versão\ncompatível?", null],
    [590, "registrar", ["mapa: nome → plugin", ""]],
  ];
  etapas.forEach(([x, rot, legenda], i) => {
    s += bloco(x, 40, 150, 62, rot, { preench: i === 2 ? claro.amarelo : claro.azul, tam: 16 });
    s += passo(x + 2, 40, String(i + 1));
    if (legenda) {
      s += txt(x + 75, 124, legenda[0], { tam: 15, cor: cor.cinza });
      if (legenda[1]) s += txt(x + 75, 144, legenda[1], { tam: 15, cor: cor.cinza });
    }
    if (i < 3) s += seta(x + 153, 71, x + 207, 71, { espessura: 2, cor: i === 2 ? cor.verde : cor.tinta });
  });
  s += txt(571, 54, "sim", { tam: 15, cor: cor.verde });
  // ramo de recusa
  s += seta(475, 104, 475, 140, { cor: cor.vermelho, espessura: 2 });
  s += txt(458, 122, "não", { tam: 15, cor: cor.vermelho, ancora: "end" });
  s += xis(475, 156, 16);
  s += txt(475, 182, "recusado com aviso", { tam: 15, cor: cor.vermelho });
  s += txt(475, 201, "(o núcleo segue)", { tam: 15, cor: cor.vermelho });

  s += linha([[20, 222], [740, 222]], { cor: cor.cinza, espessura: 1.2, tracejado: true });

  // linha 2: uso
  s += passo(33, 248, "5", cor.verde);
  s += txt(56, 248, "usar: no checkout, o núcleo pede cotação a todos os plugins de frete", { tam: 16, ancora: "start" });
  s += bloco(20, 304, 150, 62, "checkout\n(núcleo)", { preench: claro.amarelo, tam: 16 });
  s += seta(172, 335, 226, 335, { espessura: 2 });
  s += bloco(228, 304, 150, 62, "registro", { preench: claro.cinza, tam: 16 });
  const plugins = [
    [272, "motoboy", "R$ 18,90", true],
    [326, "retirada na loja", "R$ 0,00", true],
    [380, "transportadora", "não respondeu", false],
  ];
  for (const [y, nome, res, ok] of plugins) {
    s += bloco(450, y - 21, 150, 42, nome, { preench: claro.verde, tam: 15 });
    s += seta(380, 335, 447, y, { espessura: 1.8 });
    s += ok ? check(620, y, 16) : xis(620, y, 15);
    s += txt(636, y, res, { tam: 15, ancora: "start", cor: ok ? cor.tinta : cor.vermelho });
  }
  s += txt(380, 432, "o cliente vê duas opções; a transportadora fora do ar não trava a compra", { tam: 15, cor: cor.cinza });
  return quadro(760, 450, s);
}

/** Níveis de isolamento: quanto menos confiança no autor do plugin, mais isolamento. */
function isolamento() {
  semear("microkernel-3");
  let s = "";
  const cols = [
    [130, "mesmo processo", "mesma memória", "simples e rápido", "um bug derruba tudo", "webpack, ESLint, WordPress"],
    [380, "processo separado", "2 processos", "o núcleo sobrevive", "chamadas viram mensagens", "VS Code (Extension Host)"],
    [630, "sandbox + permissões", "permissões: rede, config", "acesso só ao permitido", "mais trabalho para montar", "extensões de navegador"],
  ];
  for (const [cx, titulo, tag, ganho, custo, exemplo] of cols) {
    s += txt(cx, 24, titulo, { tam: 17 });
    s += etiqueta(cx, 176, tag, { tam: 14, preench: "#ffffff" });
    s += txt(cx, 210, ganho, { tam: 15, cor: cor.verde });
    s += txt(cx, 232, custo, { tam: 15, cor: cor.vermelho });
    s += txt(cx, 262, exemplo, { tam: 15, cor: cor.cinza });
  }
  // coluna 1: núcleo e plugin dentro do mesmo processo
  s += ret(28, 50, 204, 104, { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += bloco(42, 66, 82, 72, "núcleo", { preench: claro.amarelo, tam: 15 });
  s += bloco(136, 66, 82, 72, "plugin", { preench: claro.verde, tam: 15 });
  // coluna 2: dois processos que trocam mensagens
  s += txt(380, 52, "mensagens", { tam: 15, cor: cor.azul });
  s += bloco(275, 66, 82, 72, "núcleo", { preench: claro.amarelo, tam: 15 });
  s += bloco(403, 66, 82, 72, "plugin", { preench: claro.verde, tam: 15 });
  s += seta(360, 102, 400, 102, { duplo: true, cor: cor.azul, espessura: 2, ponta: 10 });
  // coluna 3: plugin dentro de uma caixa fechada
  s += bloco(520, 66, 78, 72, "núcleo", { preench: claro.amarelo, tam: 15 });
  s += ret(618, 50, 124, 104, { tracejado: true, cor: cor.vermelho, espessura: 2.4 });
  s += bloco(638, 66, 84, 72, "plugin", { preench: claro.verde, tam: 15 });
  s += seta(600, 102, 635, 102, { duplo: true, espessura: 2, ponta: 9 });

  s += seta(70, 304, 700, 304, { cor: cor.cinza, espessura: 2 });
  s += txt(380, 288, "mais isolamento: mais segurança, mais custo e mais latência", { tam: 15, cor: cor.cinza });
  return quadro(760, 322, s);
}

export default `
${resumo(
  "Um <b>núcleo</b> pequeno e estável faz o essencial e abre <b>pontos de extensão</b>. Todo o resto chega como <b>plugins</b> que se encaixam nesses pontos, sem mexer no núcleo.",
  "Pense num videogame. O console sabe ligar, ler o controle e mostrar a imagem. Cada jogo é um cartucho no formato que o console aceita. Você compra jogo novo sem abrir o console, e um jogo da geração errada simplesmente não encaixa.",
)}

<p>O nome vem dos sistemas operacionais. Um kernel monolítico, como o do Linux, roda drivers e sistema de arquivos dentro
do próprio núcleo. Um <i>microkernel</i>, como o do MINIX ou o do QNX, guarda no núcleo só o essencial (agendar processos,
gerenciar memória, trocar mensagens) e roda o resto como processos à parte. Em aplicações, a ideia é a mesma: um núcleo
mínimo e funcionalidades plugáveis. Por isso o estilo também é chamado de <b>arquitetura de plugins</b> (<i>plug-in
architecture</i>); Mark Richards o descreve com esse nome em <i>Software Architecture Patterns</i> e em <i>Fundamentals of
Software Architecture</i> (com Neal Ford). Você usa isso todo dia: no editor de código, no navegador, no linter.</p>

${fig(nucleoEPlugins(), "O núcleo faz o básico e abre encaixes. Cada plugin segue o contrato de um encaixe. Plugin novo é só mais uma peça registrada.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Núcleo</b> (<i>core system</i>): o mínimo para o produto funcionar. Numa loja: carrinho, checkout, pedidos. Num
editor: abrir, editar e salvar arquivos. Ele também cuida do ciclo de vida dos plugins e oferece serviços comuns (log,
configuração, eventos). Não tem regra de nenhum cliente específico.</li>
<li><b>Ponto de extensão</b> (<i>extension point</i>): um lugar onde o núcleo aceita ajuda de fora, descrito por um
<b>contrato</b> (uma interface). "Quem sabe cotar frete?", "quem sabe exportar relatório?". O plugin só faz o que o
contrato permite.</li>
<li><b>Plugin</b>: um módulo que implementa um contrato. Depende só do contrato (e de um pequeno SDK que o núcleo oferece),
nunca das classes internas do núcleo. O ideal é que um plugin não conheça os outros.</li>
<li><b>Manifesto</b>: a ficha do plugin. Nome, versão, versão do contrato que ele segue, permissões de que precisa,
quando deve ser ativado. Com ela, o núcleo decide se aceita o plugin antes de executar uma linha dele.</li>
<li><b>Registro</b> (<i>registry</i>): a lista de plugins carregados e dos pontos que cada um atende. Pode ser um mapa em
memória, um arquivo de configuração ou uma tabela no banco com o que cada cliente ativou.</li>
<li><b>Carregamento</b>: <i>estático</i> (os plugins vão no mesmo build e a configuração liga ou desliga cada um) ou
<i>dinâmico</i> (descobertos com o sistema rodando: <code>import()</code>, uma pasta de plugins, pacotes npm, uma loja
de extensões).</li>
</ul>

${fig(cicloDeVida(), "O ciclo de vida de um plugin: o núcleo lê a ficha antes de rodar o código e recusa o que é incompatível. Na hora de usar, um plugin com problema fica de fora sem derrubar os outros.", "grande")}

<h4>Duas formas de encaixar</h4>
<p><b>Contrato</b>: o plugin entrega um objeto e o núcleo o chama quando precisa ("me dê uma cotação de frete"). É o
padrão Strategy em escala de produto, e é o que vamos usar no código. <b>Ganchos</b> (<i>hooks</i>): o núcleo avisa
"vou publicar o post" ou "terminei de compilar", e cada plugin interessado reage ou altera o dado que passa por ali. O
WordPress chama isso de <i>actions</i> (reagir) e <i>filters</i> (alterar um valor); o webpack expõe dezenas de ganchos
no seu compilador. Muitos produtos usam as duas formas.</p>

${tabela(
  ["Onde você já viu", "O núcleo faz", "Como o plugin se encaixa"],
  [
    ["<b>VS Code</b>", "abrir, editar e salvar arquivos", "extensões com manifesto (<code>package.json</code>) e a API <code>vscode</code>; rodam num processo separado"],
    ["<b>Chrome, Firefox</b>", "navegar e desenhar páginas", "extensões com <code>manifest.json</code> declarando as permissões de que precisam"],
    ["<b>WordPress</b>", "publicar páginas e posts", "plugins e temas por ganchos (<code>add_action</code>, <code>add_filter</code>)"],
    ["<b>ESLint</b>", "ler o código e percorrer a árvore sintática (AST)", "cada regra devolve funções chamadas para cada tipo de nó da árvore"],
    ["<b>webpack, Babel, Vite</b>", "empacotar ou transformar JavaScript", "webpack: ganchos do compilador; Babel: visitantes da AST; Vite: ganchos no formato dos plugins do Rollup"],
    ["<b>Eclipse</b>", "uma plataforma sobre OSGi", "quase tudo é plugin, com pontos de extensão declarados em <code>plugin.xml</code>"],
  ],
)}

${quando(
  [
    "Cada cliente, país ou plano quer o produto de um jeito (ERP, plataforma de lojas, CMS): regras por cliente viram plugins ligados por configuração.",
    "Há muitas variações da mesma coisa: transportadoras, meios de pagamento, formatos de exportação, integrações.",
    "Você quer que outros times, parceiros ou a comunidade estendam o produto sem mexer no código central.",
    "É uma ferramenta: editor, IDE, linter, bundler, CLI, painel administrativo.",
  ],
  [
    "Só existe um jeito de fazer e nenhum sinal de variação: o plugin vira indireção sem retorno.",
    "O produto é novo e você ainda não sabe o que varia: contrato errado é caro de mudar depois que há plugins. Espere a terceira variação.",
    "Os \"plugins\" precisam mudar o fluxo principal ou conversar muito entre si: o núcleo não é estável.",
    "Cada parte precisa de deploy e escala independentes: aí o problema é outro (capítulo 14).",
  ],
)}

${medidor({ complexidade: 3, escala: 2, operacao: 2, aprendizado: 3, time: "qualquer tamanho; plugins deixam times (e terceiros) trabalharem em paralelo" })}

<h3>Como usar na prática</h3>
<p>Imagine uma plataforma de lojas virtuais: várias lojas no mesmo sistema. Cada loja oferece formas de entrega
diferentes. Uma tem motoboy na cidade, outra tem retirada no balcão, outra entrega por transportadora. Em vez de um
<code>if</code> por loja no checkout, cada forma de entrega vira um plugin, e cada loja liga os que quiser.</p>

${pastas(`
src/
├── nucleo/
│   ├── contratos.ts           # o que um plugin pode fazer (API pública)
│   ├── registro.ts            # valida, guarda e chama os plugins
│   └── checkout.ts            # fluxo principal: usa "os plugins de frete"
├── plugins/
│   ├── motoboy/index.ts       # cada plugin só importa nucleo/contratos
│   ├── retirada-na-loja/index.ts
│   └── transportadora/index.ts
└── main.ts                    # carrega os plugins que cada loja ativou
`)}

${codigo(
  `
// nucleo/contratos.ts — a única parte do núcleo que os plugins enxergam
export const VERSAO_API = 2;

export interface PedidoParaFrete {
  pais: string;          // "BR", "AR"...
  cidade: string;
  pesoGramas: number;
  valorCentavos: number;
}

export interface Cotacao {
  servico: string;       // "Motoboy (hoje)", "Retirada na loja"
  precoCentavos: number;
  prazoDias: number;
}

export interface PluginDeFrete {
  nome: string;
  versaoApi: number;     // versão do contrato para a qual o plugin foi feito
  cotar(pedido: PedidoParaFrete): Promise<Cotacao | null>; // null = "não atendo"
}`,
  "src/nucleo/contratos.ts",
)}

${codigo(
  `
// nucleo/registro.ts — guarda os plugins e protege o núcleo deles
import { VERSAO_API, type Cotacao, type PedidoParaFrete, type PluginDeFrete } from "./contratos";

const comTempoLimite = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, falha) => setTimeout(() => falha(new Error("tempo esgotado")), ms))]);

export class RegistroDeFrete {
  private plugins = new Map<string, PluginDeFrete>();

  registrar(plugin: PluginDeFrete) {
    if (plugin.versaoApi !== VERSAO_API) {
      console.warn(\`"\${plugin.nome}" ignorado: feito para a API v\${plugin.versaoApi}, núcleo na v\${VERSAO_API}\`);
      return; // recusa com aviso, em vez de quebrar no meio de uma compra
    }
    this.plugins.set(plugin.nome, plugin);
  }

  async cotarTodos(pedido: PedidoParaFrete): Promise<Cotacao[]> {
    const lista = [...this.plugins.values()];
    const resultados = await Promise.allSettled(
      // o .then() transforma erro síncrono do plugin em promessa rejeitada
      lista.map((p) => comTempoLimite(Promise.resolve().then(() => p.cotar(pedido)), 2000)),
    );
    return resultados.flatMap((r, i) => {
      if (r.status === "rejected") console.error(\`plugin "\${lista[i].nome}" falhou:\`, r.reason);
      return r.status === "fulfilled" && r.value ? [r.value] : []; // quem falhou fica de fora
    });
  }
}`,
  "src/nucleo/registro.ts",
)}

${codigo(
  `
// plugins/motoboy/index.ts — um plugin: conhece o contrato e mais nada do núcleo
import type { PluginDeFrete } from "../../nucleo/contratos";

const motoboy: PluginDeFrete = {
  nome: "motoboy",
  versaoApi: 2,
  async cotar(pedido) {
    if (pedido.cidade !== "Campinas" || pedido.pesoGramas > 5000) return null; // não atendo
    return { servico: "Motoboy (hoje)", precoCentavos: 1890, prazoDias: 0 };
  },
};
export default motoboy;

// main.ts — carrega sob demanda só os plugins que esta loja ativou
const DISPONIVEIS: Record<string, () => Promise<{ default: PluginDeFrete }>> = {
  "motoboy": () => import("./plugins/motoboy/index.js"),
  "retirada-na-loja": () => import("./plugins/retirada-na-loja/index.js"),
  "transportadora": () => import("./plugins/transportadora/index.js"),
};

const registro = new RegistroDeFrete();
for (const nome of configDaLoja.pluginsDeFrete) {   // ex.: ["motoboy", "retirada-na-loja"]
  const carregar = DISPONIVEIS[nome];
  if (carregar) registro.registrar((await carregar()).default);
}
const opcoes = await registro.cotarTodos(pedido);    // o checkout nem sabe quais plugins existem`,
  "src/plugins/motoboy e src/main.ts",
)}

<p>Repare na lista fechada <code>DISPONIVEIS</code>: o carregamento é dinâmico (só o que a loja usa vai para a memória), mas
nenhum caminho de arquivo vem de fora. Ferramentas como o ESLint e o Babel vão além e acham plugins por convenção de nome
nos pacotes instalados (<code>eslint-plugin-*</code>, <code>babel-plugin-*</code>).</p>

<h4>Versionar o contrato</h4>
<p>Depois que existem plugins, o contrato vira uma <b>API pública</b>: renomear um campo quebra o plugin de alguém. Regras
que funcionam:</p>
<ul>
<li><b>Versão no contrato e no plugin</b>: o plugin diz para qual versão foi feito (um número, como no código acima, ou uma
faixa no estilo semver, como o <code>"engines": { "vscode": "^1.80.0" }</code> das extensões do VS Code). O núcleo recusa
com aviso o que não for compatível.</li>
<li><b>Mudança que só adiciona não quebra</b>: campo novo opcional, método novo com comportamento padrão. É versão menor.</li>
<li><b>Mudança que remove ou muda o sentido quebra</b>: suba a versão maior, marque o antigo como obsoleto
(<i>deprecated</i>) e aceite as duas versões por um tempo, com um adaptador que traduz a antiga para a nova.</li>
<li><b>Kit de testes do contrato</b>: publique testes que todo plugin deve passar (responde em até 2 segundos, devolve
<code>null</code> quando não atende, nunca dá preço negativo). Assim o autor descobre antes da produção se respeita o
combinado.</li>
</ul>

<h4>Isolamento e segurança</h4>
<p>Um plugin é código rodando dentro do seu produto. Se ele trava, vaza memória ou faz algo malicioso, o problema é seu.
Quanto menos você confia em quem escreveu, mais isolamento precisa:</p>

${fig(isolamento(), "Três níveis de isolamento. Comece pelo mais simples que dá conta do nível de confiança nos autores dos plugins.")}

<ul>
<li><b>Plugins do seu time</b>: o mesmo processo basta, com as proteções do código acima: tempo limite, falha isolada, log
com o nome do plugin e, se quiser ir além, desligamento automático de quem falha demais.</li>
<li><b>Plugins de parceiros</b>: processo separado ou <i>worker</i>, conversando por mensagens. Um travamento não derruba
o núcleo.</li>
<li><b>Plugins de qualquer pessoa</b> (uma loja aberta de extensões): sandbox, <b>permissões declaradas</b> no manifesto
("ler a aba atual", "acessar a rede"), revisão antes de publicar e um jeito de desligar um plugin à distância. Lojas de
extensões de navegadores e de editores já tiveram extensões maliciosas publicadas: trate plugin de terceiros como
qualquer dependência de terceiros.</li>
</ul>

<h4>Passo a passo para adotar</h4>
${passos([
  "Liste o que varia de verdade: três transportadoras, dois formatos de relatório, regras de imposto por país. Se só existe uma variação, ainda não é hora.",
  "Desenhe o contrato a partir do que o núcleo precisa (entrada e saída), com tipos do núcleo e o mínimo de métodos.",
  "Transforme o código que já existe no primeiro plugin (o frete atual vira o plugin <code>transportadora</code>). Se o contrato não serve nem para ele, não vai servir para os outros.",
  "Escreva o registro: registrar, validar a versão, listar por ponto de extensão, desligar.",
  "Decida como cada cliente ativa os plugins (configuração, tabela no banco, <i>feature flag</i>) e como eles são carregados.",
  "Proteja o núcleo: tempo limite, falha isolada, logs com o nome do plugin.",
  "Versione e documente o contrato, com changelog e um kit de testes que todo plugin roda.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Funcionalidade nova sem mexer no núcleo (menos risco de quebrar o que funciona)", "Desenhar bons contratos é difícil, e mudá-los depois é caro"],
    ["Cada cliente, país ou plano liga só o que precisa", "Mais combinações de plugins ativos para testar"],
    ["Outros times e terceiros estendem o produto em paralelo", "Compatibilidade: cada versão do núcleo precisa respeitar os plugins existentes"],
    ["Núcleo pequeno, estável e fácil de entender", "Sem isolamento, um plugin ruim deixa tudo lento ou derruba o sistema"],
    ["Desligar um recurso com problema sem mudar o núcleo", "Indireção: seguir o fluxo ao depurar fica mais difícil"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Núcleo engordando</b>: aparece um <code>if (loja === "loja-x")</code> no checkout "só desta vez". A regra que deveria
ser plugin vazou para o núcleo, e o núcleo deixa de ser estável.</li>
<li><b>Contrato que entrega tudo</b>: passar o <code>app</code> inteiro ou a conexão do banco para o plugin ("faça o que
quiser"). Qualquer mudança interna quebra plugins, e qualquer plugin pode fazer qualquer coisa. Exponha só o necessário.</li>
<li><b>Plugins que dependem uns dos outros</b>: o plugin A importa o plugin B e a ordem de carregamento passa a importar.
Se precisam conversar, que seja pelo núcleo (eventos) ou com a dependência declarada no manifesto.</li>
<li><b>Mudar o contrato sem versionar</b>: um campo renomeado e todos os plugins quebram em produção ao mesmo tempo.</li>
<li><b>Confiar no plugin</b>: chamar a API da transportadora sem tempo limite. Ela fica lenta e o checkout inteiro espera.</li>
<li><b>Sistema de plugins para uma implementação só</b>: registro, manifesto e versionamento para algo que nunca variou.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O VS Code é um núcleo de editor com quase todo o resto vindo de extensões, inclusive muito do suporte a linguagens que já vem instalado. A documentação oficial de extensões mostra as peças deste capítulo:</p><ul><li><b>manifesto</b>: cada extensão tem um <code>package.json</code> com <code>engines.vscode</code> (as versões do editor com que ela funciona) e <code>contributes</code> (comandos, menus e configurações que ela acrescenta, declarados sem rodar código);</li><li><b>carregamento sob demanda</b>: eventos de ativação fazem a extensão de uma linguagem só carregar quando você abre um arquivo daquela linguagem, por exemplo;</li><li><b>isolamento</b>: as extensões rodam num processo à parte, o <i>Extension Host</i>, para que uma extensão lenta não congele a digitação.</li></ul>",
)}

${dica(
  "Microkernel ou hexagonal?",
  "<p>Os dois têm um núcleo que define interfaces. A diferença está no que se encaixa. Na hexagonal (capítulo 6), os adaptadores ligam o núcleo a <b>tecnologias</b> (banco, HTTP, e-mail), e em produção costuma haver um adaptador por porta. No microkernel, os plugins trazem <b>funcionalidades</b> e variações, muitos no mesmo encaixe ao mesmo tempo, escolhidos por cliente ou configuração. Dá para combinar: o núcleo organizado como hexágono, com plugins entrando por uma porta.</p>",
)}

${alerta(
  "Plugin não é microsserviço",
  "<p>No microkernel, núcleo e plugins costumam rodar juntos, no mesmo deploy e muitas vezes no mesmo processo. O objetivo é estender o produto, não escalar partes separadamente. Se cada parte precisa de time, deploy e banco próprios, o assunto é microsserviços (capítulo 14).</p>",
)}

${combina([
  [6, "Hexagonal", "o núcleo por dentro; plugins entram por uma porta"],
  [12, "Monólito modular", "módulos opcionais por cliente como plugins"],
  [20, "Orientada a eventos", "ganchos são eventos dentro do processo"],
  [10, "Pipes and Filters", "plugins como etapas de um pipeline"],
  [11, "Monólito", "núcleo e plugins num deploy só"],
  [16, "Micro-frontends", "uma tela-núcleo com pedaços plugáveis"],
])}

${lembre([
  "Núcleo pequeno e estável, com pontos de extensão descritos por contratos; o que varia (por cliente, país, formato) vira plugin.",
  "O contrato é uma API pública: versione, teste e mude com cuidado, porque cada mudança pode quebrar o plugin de alguém.",
  "Proteja o núcleo dos plugins: tempo limite e falha isolada sempre; para código de terceiros, processo separado, sandbox e permissões.",
])}
`;
