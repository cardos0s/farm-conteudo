// Capítulo 32: Registrando decisões: ADRs e revisão. Capítulo da parte V (não é uma arquitetura), então
// troca o medidor e o "como funciona" por: por que registrar → formato → modelo em branco → exemplo
// preenchido → onde guardar e ciclo de vida → funções de aptidão → C4 → checklist de revisão → fechamento.

import { alerta, codigo, combina, dica, fig, lembre, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, banco, claro, cor, linha, curva, navegador, pessoa, quadro, ret, semear, servidor, seta, txt, xis } from "../desenho.mjs";

/** Ponta de seta solta (para curvas). */
const ponta = (x, y, ang, c = cor.tinta) =>
  linha(
    [
      [x - 13 * Math.cos(ang - 0.45), y - 13 * Math.sin(ang - 0.45)],
      [x, y],
      [x - 13 * Math.cos(ang + 0.45), y - 13 * Math.sin(ang + 0.45)],
    ],
    { cor: c, espessura: 1.8 },
  );

/** Diagrama principal: os status de um ADR e a pasta docs/adr com um ADR substituindo outro. */
function cicloDeVida() {
  semear("adrs-1");
  let s = "";
  s += txt(20, 20, "o status de um ADR", { tam: 16, cor: cor.azul, ancora: "start" });
  // estados
  s += bloco(40, 44, 150, 54, "proposto", { preench: claro.amarelo });
  s += bloco(305, 44, 150, 54, "aceito", { preench: claro.verde });
  s += bloco(570, 44, 160, 54, "substituído", { preench: claro.violeta });
  s += bloco(40, 146, 150, 46, "rejeitado", { preench: claro.vermelho, tam: 16 });
  s += bloco(305, 146, 150, 46, "obsoleto", { preench: claro.cinza, tam: 16 });
  s += seta(193, 71, 302, 71, { espessura: 2, rotulo: "aprovado", dy: -15 });
  s += seta(458, 71, 567, 71, { espessura: 2, rotulo: "ADR novo", dy: -15 });
  s += seta(115, 100, 115, 143, { espessura: 2, rotulo: "não aprovado", ancora: "start", dx: 12, dy: 0 });
  s += seta(380, 100, 380, 143, { espessura: 2, rotulo: "deixou de valer", ancora: "start", dx: 12, dy: 0 });
  // a pasta no repositório
  s += linha([[20, 210], [740, 210]], { cor: cor.cinza, espessura: 1, tracejado: true });
  s += txt(20, 234, "docs/adr/ no repositório: numerados, nunca apagados", { tam: 16, cor: cor.azul, ancora: "start" });
  const cartao = (x, num, titulo, status, corChip, tracejado = false) =>
    ret(x, 280, 124, 128, { preench: "#ffffff", hachura: "solid", espessura: 1.8, tracejado }) +
    txt(x + 62, 298, num, { tam: 15, cor: cor.cinza }) +
    txt(x + 62, 332, titulo, { tam: 15 }) +
    ret(x + 10, 358, 104, 42, { preench: corChip, hachura: "solid", espessura: 1.3 }) +
    txt(x + 62, 379, status, { tam: 15 });
  s += cartao(20, "ADR-0001", "registrar\ndecisões", "aceito", claro.verde);
  s += cartao(158, "ADR-0002", "TypeScript\nno backend", "aceito", claro.verde);
  s += cartao(296, "ADR-0003", "monólito\nmodular", "aceito", claro.verde);
  s += cartao(434, "ADR-0004", "filas no\nRedis", "substituído\npor 0010", claro.violeta, true);
  s += txt(590, 344, "...", { tam: 22, cor: cor.cinza });
  s += cartao(622, "ADR-0010", "filas no\nRabbitMQ", "aceito", claro.verde);
  // o novo aponta para o antigo
  s += curva([[684, 276], [590, 246], [500, 276]], { cor: cor.violeta, espessura: 2 });
  s += ponta(500, 276, Math.atan2(276 - 254, 500 - 540), cor.violeta);
  s += txt(590, 236, "substitui", { tam: 15, cor: cor.violeta });
  return quadro(760, 422, s);
}

/** Funções de aptidão: disparadas no pipeline e contínuas em produção. */
function aptidao() {
  semear("adrs-2");
  let s = "";
  s += txt(330, 20, "disparadas: rodam a cada mudança", { tam: 16, cor: cor.azul });
  s += txt(650, 20, "contínuas: o tempo todo", { tam: 16, cor: cor.violeta });
  // dev
  s += pessoa(55, 96, { rotulo: "dev abre PR" });
  // pipeline
  s += ret(120, 42, 420, 160, { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += txt(330, 62, "pipeline de CI", { tam: 15, cor: cor.cinza });
  s += bloco(135, 86, 110, 80, "testes de\nunidade", { preench: claro.azul, tam: 15 });
  s += bloco(275, 86, 110, 80, "regras de\ndependência", { preench: claro.vermelho, tam: 15, cor: cor.vermelho });
  s += bloco(415, 86, 110, 80, "carga:\np95 < 300 ms", { preench: claro.azul, tam: 15 });
  s += seta(78, 126, 132, 126, { espessura: 2 });
  s += seta(247, 126, 272, 126, { espessura: 2 });
  s += seta(387, 126, 412, 126, { espessura: 2 });
  s += seta(527, 126, 604, 126, { espessura: 2, rotulo: "deploy", dy: -15, dx: 10 });
  // produção
  s += servidor(608, 82, 70, 88, "produção");
  // falha barra o PR
  s += seta(330, 168, 330, 216, { cor: cor.vermelho, espessura: 2 });
  s += xis(330, 230, 18);
  s += txt(330, 264, "PR barrado: o núcleo\nimporta \"pg\"", { tam: 15, cor: cor.vermelho });
  // monitoramento contínuo
  s += seta(643, 200, 643, 228, { cor: cor.violeta, espessura: 2 });
  s += bloco(553, 230, 190, 60, "monitoramento\np95, erros, custo", { preench: claro.violeta, tam: 15 });
  s += linha([[600, 292], [600, 314], [55, 314]], { cor: cor.violeta, espessura: 2 });
  s += seta(55, 314, 55, 170, { cor: cor.violeta, espessura: 2 });
  s += txt(330, 332, "alerta para o time quando sai do limite", { tam: 15, cor: cor.violeta });
  return quadro(760, 348, s);
}

/** Modelo C4: quatro níveis de zoom no mesmo sistema. */
function c4() {
  semear("adrs-3");
  let s = "";
  // quatro painéis de 148 de largura, com 54 de folga entre eles para a seta de zoom
  const xs = [3, 205, 407, 609];
  const titulos = ["1. Contexto", "2. Contêineres", "3. Componentes", "4. Código"];
  const legendas = ["o sistema e quem\nconversa com ele", "apps, APIs\ne bancos", "módulos dentro\nde um contêiner", "classes\n(opcional)"];
  const dentroDe = [null, "Loja online", "API", "Pedidos"];
  xs.forEach((x, i) => {
    s += txt(x + 74, 28, titulos[i], { tam: 17 });
    s += txt(x + 74, 322, legendas[i], { tam: 15, cor: cor.cinza });
    if (i === 0) s += ret(x, 52, 148, 240, { cor: cor.cinza, espessura: 1.4 });
    else {
      s += ret(x, 52, 148, 240, { cor: cor.laranja, espessura: 1.8, tracejado: true });
      s += txt(x + 74, 70, dentroDe[i], { tam: 15, cor: cor.laranja });
    }
  });
  // 1. contexto
  s += pessoa(77, 70, { rotulo: "cliente" });
  s += seta(77, 136, 77, 159, { espessura: 1.6 });
  s += bloco(22, 161, 110, 48, "Loja\nonline", { preench: claro.amarelo, tam: 15 });
  s += seta(77, 211, 77, 231, { espessura: 1.6 });
  s += bloco(17, 233, 120, 46, "pagamentos\n(externo)", { preench: claro.cinza, tam: 15 });
  // 2. contêineres
  s += navegador(224, 86, 110, 52, "app web");
  s += seta(279, 140, 279, 159, { espessura: 1.6 });
  s += bloco(224, 161, 110, 46, "API", { preench: claro.amarelo, tam: 16 });
  s += seta(279, 209, 279, 227, { espessura: 1.6 });
  s += banco(234, 229, 90, 52, "Postgres", { preench: claro.violeta, tam: 15 });
  // 3. componentes
  s += bloco(421, 88, 120, 40, "Catálogo", { preench: claro.azul, tam: 15 });
  s += bloco(421, 160, 120, 40, "Pedidos", { preench: claro.amarelo, tam: 15 });
  s += bloco(421, 232, 120, 40, "Pagamentos", { preench: claro.azul, tam: 15 });
  s += seta(481, 158, 481, 131, { espessura: 1.6 });
  s += seta(481, 202, 481, 229, { espessura: 1.6 });
  // 4. código
  const classe = (y, nome) =>
    ret(618, y, 130, 44, { preench: "#ffffff", hachura: "solid", espessura: 1.6 }) +
    txt(683, y + 14, nome, { tam: 15 }) +
    linha([[618, y + 27], [748, y + 27]], { espessura: 1.2 }) +
    linha([[630, y + 36], [706, y + 36]], { cor: cor.cinza, espessura: 1.2 });
  s += classe(88, "CriarPedido");
  s += classe(160, "Repositório");
  s += classe(232, "Pedido");
  s += seta(683, 134, 683, 157, { espessura: 1.6 });
  s += seta(683, 206, 683, 229, { espessura: 1.6 });
  // zoom de um nível para o outro: do elemento amarelo para o painel seguinte
  // [início da seta, fim da seta, altura, meio da folga entre os painéis]
  for (const [x1, x2, y, meio] of [[135, 202, 185, 178], [337, 404, 184, 380], [544, 606, 180, 582]]) {
    s += seta(x1, y, x2, y, { cor: cor.laranja, espessura: 2.2 });
    s += txt(meio, y - 17, "zoom", { tam: 15, cor: cor.laranja });
  }
  return quadro(760, 344, s);
}

const MODELO = `
# ADR-NNNN: <a decisão em uma frase curta>

Status: proposto
Data: AAAA-MM-DD    Decisores: <quem participou>

## Contexto
<O problema e as forças em jogo: negócio, prazo, time, restrições. Só fatos.>

## Decisão
<O que vamos fazer, em voz ativa: "Vamos usar...".>

## Alternativas consideradas
<Cada opção avaliada e por que ficou de fora.>

## Consequências
<O que fica mais fácil (+), o que fica mais difícil (-) e quando rever.>`;

const EXEMPLO = `
# ADR-0003: Usar monólito modular em vez de microsserviços

Status: aceito
Data: 2026-03-10    Decisores: tech lead, times de Pedidos e de Catálogo

## Contexto
Somos 8 devs em 2 times e precisamos lançar a loja em 6 meses. Não temos time
de plataforma nem experiência operando Kubernetes. No sistema antigo, um time
quebrava o código do outro com frequência.

## Decisão
Vamos construir um monólito modular em TypeScript (catalogo, pedidos, pagamentos,
entregas). Cada módulo expõe só o seu index.ts e é dono das próprias tabelas.
Um teste no CI barra imports das pastas internas de outro módulo.

## Alternativas consideradas
- Microsserviços: deploy independente, mas operação cara demais para 8 pessoas.
- Monólito sem módulos: rápido no começo, mas repete o problema entre os times.

## Consequências
+ Um deploy, um banco, transações locais: operação barata.
+ Fronteiras claras, prontas para extrair um serviço no futuro.
- Tudo escala junto: no pico, todas as partes sobem juntas.
- Exige disciplina: a regra de fronteiras precisa rodar sempre.

Rever se: o time passar de uns 25 devs ou um módulo precisar de escala,
deploy ou segurança muito diferentes dos outros.`;

const TESTE = `
// testes/arquitetura.test.ts: uma função de aptidão é só um teste
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// o núcleo não pode importar nada disto (capítulo 6)
const PROIBIDOS = ["express", "pg", "@prisma/client"];

test("o núcleo dos módulos não depende de infraestrutura", () => {
  const violacoes: string[] = [];
  for (const modulo of ["catalogo", "pedidos", "pagamentos", "entregas"]) {
    const pasta = join("src", modulo, "nucleo");
    for (const arq of readdirSync(pasta, { recursive: true, encoding: "utf8" })) {
      if (!arq.endsWith(".ts")) continue;
      const codigo = readFileSync(join(pasta, arq), "utf8");
      for (const [, origem] of codigo.matchAll(/from ["']([^"']+)["']/g)) {
        if (PROIBIDOS.includes(origem) || origem.includes("/adaptadores/"))
          violacoes.push(\`\${modulo}/nucleo/\${arq}: \${origem}\`);
      }
    }
  }
  expect(violacoes).toEqual([]); // se falhar, a lista mostra o arquivo e o import
});`;

const CARGA = `
// testes/carga/busca.js: roda no pipeline com "k6 run"
import http from "k6/http";

export const options = {
  vus: 50, // 50 usuários virtuais ao mesmo tempo
  duration: "2m",
  thresholds: {
    http_req_duration: ["p(95)<300"], // p95 abaixo de 300 ms
    http_req_failed: ["rate<0.01"], // menos de 1% de erros
  },
};

export default function () {
  http.get(__ENV.BASE_URL + "/api/produtos?busca=tenis");
}`;

export default `
${resumo(
  "Toda decisão de arquitetura cara de desfazer vira um <b>ADR</b>: um texto curto, guardado no repositório, que diz <b>o que</b> foi decidido, <b>por quê</b> e <b>a que custo</b>. As regras mais importantes viram <b>testes automáticos</b>.",
  "É o prontuário médico do sistema. O médico novo não sabe por que você toma aquele remédio. Se estiver escrito \"alergia a X, por isso Y\", ele não troca às cegas. Sem registro, cada pessoa nova no time reabre a mesma discussão (ou desfaz a decisão sem saber).",
)}

<p>Os capítulos anteriores ensinaram a escolher. Este é sobre o que vem depois: <b>registrar</b>, <b>proteger</b> e
<b>revisar</b> a escolha. ADR quer dizer <i>Architecture Decision Record</i> (registro de decisão de arquitetura). O formato
mais usado foi proposto por Michael Nygard num post de 2011 (<i>Documenting Architecture Decisions</i>) e é simples de
propósito: um arquivo de texto por decisão, curto, numerado, no mesmo repositório do código.</p>

${fig(cicloDeVida(), "Em cima, os status de um ADR. Embaixo, a pasta docs/adr: os arquivos são numerados e nunca apagados. Quando uma decisão muda, um ADR novo substitui o antigo, e os dois apontam um para o outro.", "grande")}

<h3>Por que registrar</h3>
<ul>
<li><b>Memória</b>: o código mostra <b>o que</b> foi feito; o ADR mostra <b>por quê</b>. Daqui a dois anos ninguém lembra
por que o time escolheu Postgres e não MongoDB.</li>
<li><b>Menos discussão em looping</b>: "por que não microsserviços?" se responde com um link, não com uma reunião. E ler os
ADRs em ordem é a melhor visita guiada para quem acabou de chegar.</li>
<li><b>Decisões melhores</b>: escrever contexto, alternativas e consequências obriga a pensar. Muita ideia ruim morre na
hora de preencher o parágrafo de consequências.</li>
</ul>

<h3>O formato</h3>
<p>Nygard sugere frases completas, escritas como uma conversa com um dev do futuro, em uma ou duas páginas no máximo:</p>
<ul>
<li><b>Título</b>: a decisão numa frase curta, com número ("ADR-0003: Usar monólito modular...").</li>
<li><b>Status</b>: em que ponto a decisão está (veja o ciclo de vida logo abaixo).</li>
<li><b>Contexto</b>: as forças em jogo (problema, prazo, time, restrições). Só fatos, sem defender a escolha ainda.</li>
<li><b>Decisão</b>: o que o time vai fazer, em voz ativa: "Vamos usar...".</li>
<li><b>Consequências</b>: o que fica mais fácil <b>e</b> o que fica mais difícil. Só listar o lado bom é propaganda.</li>
</ul>
<p>Muitos times somam data, quem decidiu e <b>alternativas consideradas</b> (o template MADR, por exemplo, já traz isso).
Vale a pena: metade do valor de um ADR está em saber o que <b>não</b> foi escolhido, e por quê.</p>

<h3>Um exemplo preenchido</h3>
<p>Uma loja online com dois times precisa decidir como dividir o sistema. O ADR abaixo é o resultado (caso ilustrativo):</p>

${codigo(EXEMPLO, "docs/adr/0003-monolito-modular.md", { realce: false })}

<p>Repare: o contexto fala de <b>time e prazo</b>, não só de tecnologia (capítulo 2); as consequências têm mais <b>e</b>
menos; e a última linha diz <b>quando rever</b>. É isso que faz do ADR uma decisão consciente, e não uma regra eterna.</p>

<h4>Modelo em branco para copiar</h4>
${codigo(MODELO, "docs/adr/template.md", { realce: false })}

<h3>Onde guardar e ciclo de vida</h3>
<p>Guarde os ADRs <b>no repositório</b>, em <code>docs/adr</code>, em Markdown. Assim eles passam por pull request (PR), têm
histórico no Git e ficam a um clique do código que explicam. Wiki solta fica desatualizada e ninguém acha.</p>

${pastas(`
loja/
├── docs/
│   ├── adr/
│   │   ├── template.md                 # o modelo em branco
│   │   ├── 0001-registrar-decisoes.md  # o primeiro ADR explica o processo
│   │   ├── 0003-monolito-modular.md
│   │   ├── 0004-filas-no-redis.md      # substituído por 0010
│   │   └── 0010-filas-no-rabbitmq.md   # substitui 0004
│   └── arquitetura/                    # diagramas C4 como código
├── src/
└── testes/arquitetura.test.ts          # funções de aptidão
`)}

<p>O ciclo de vida é o do desenho do começo do capítulo. O ADR nasce <b>proposto</b> num PR, e a discussão acontece nos
comentários. Aprovado, vira <b>aceito</b> e a decisão não é mais reescrita: dali em diante, só o status e os links mudam. Se o time desiste, ele fica como <b>rejeitado</b> (assim a
mesma proposta não volta daqui a seis meses sem nada novo). Quando uma decisão nova troca a antiga, escreva um ADR novo e
marque os dois: "substituído por ADR-0010" e "substitui ADR-0004". Nunca reescreva a história. <b>Obsoleto</b>
(<i>deprecated</i>) é a decisão que deixou de valer sem outra no lugar (por exemplo, a parte do sistema que ela cobria foi
desligada).</p>

<p>Nem toda decisão merece um ADR. Use a régua a seguir para separar as que merecem.</p>
${quando(
  [
    "É cara de desfazer: estilo de arquitetura, banco, linguagem, forma de comunicação entre serviços.",
    "Afeta mais de um time ou mais de um módulo.",
    "Houve discussão de verdade, com alternativas na mesa.",
  ],
  [
    "É local e fácil de trocar: nome de variável, biblioteca de datas dentro de um módulo.",
    "Já existe um padrão do time que cobre o caso.",
    "Não havia alternativa real: ninguém discordaria.",
  ],
)}

<h4>Passo a passo para começar amanhã</h4>
${passos([
  "Crie <code>docs/adr/</code> com o <code>template.md</code> e escreva o ADR-0001, \"Registrar decisões de arquitetura em ADRs\" (é também o primeiro arquivo que a ferramenta adr-tools cria).",
  "Registre as 3 a 5 decisões passadas que mais geram pergunta hoje, avisando no contexto que o registro foi feito depois.",
  "Toda decisão nova que passe na régua acima entra como PR, em status <i>proposto</i>, antes do código.",
  "Ponha um link para <code>docs/adr</code> no README. E toda regra que uma máquina consiga conferir vira função de aptidão.",
])}

<h3>Funções de aptidão: decisões que se defendem sozinhas</h3>
<p>Um ADR diz "o núcleo não depende do banco". Seis meses depois, num PR com pressa, alguém importa o driver do Postgres
dentro do núcleo, e ninguém percebe na revisão. Arquiteturas apodrecem assim: em mil atalhos pequenos (capítulo 31).</p>
<p>O livro <i>Building Evolutionary Architectures</i> (Neal Ford, Rebecca Parsons e Patrick Kua) chama de <b>função de
aptidão</b> (<i>fitness function</i>) qualquer mecanismo que mede, de forma objetiva, se uma característica da arquitetura
continua valendo. O nome vem da computação evolutiva. Na prática, é um teste automático ou um alerta, de dois tipos:
<b>disparadas</b>, que rodam quando algo acontece (em geral a cada PR, no pipeline de CI, a integração contínua), e
<b>contínuas</b>, que vigiam a produção o tempo todo.</p>

${fig(aptidao(), "As funções disparadas barram o PR antes do deploy; as contínuas vigiam a produção e avisam o time quando algo sai do limite.")}

<h4>Exemplo 1: dependências proibidas</h4>
<p>A regra do capítulo 6 vira um teste comum, que roda junto com os outros. Se alguém quebrar a regra, a falha mostra o
arquivo e o import (por exemplo, <code>pedidos/nucleo/pedido.ts: pg</code>):</p>

${codigo(TESTE, "testes/arquitetura.test.ts")}

<h4>Exemplo 2: tempo de resposta</h4>
<p>"A busca é rápida" não dá para testar. "95% das buscas respondem em menos de 300 ms com 50 usuários ao mesmo tempo" dá.
Esse número é o <b>p95</b> (percentil 95): o tempo abaixo do qual ficam 95% das respostas. No k6, uma ferramenta de teste
de carga, o limite vira um <i>threshold</i>, e o comando falha se ele for ultrapassado:</p>

${codigo(CARGA, "testes/carga/busca.js")}

<p>O teste caseiro é simples de propósito: não enxerga <code>require()</code> nem <code>import()</code> dinâmico. Em projetos
maiores, use ferramentas que analisam o código de verdade, como as da tabela a seguir.</p>
${tabela(
  ["O que proteger", "Função de aptidão", "Ferramentas (exemplos)"],
  [
    ["Núcleo isolado (capítulos 6 e 7)", "o núcleo não importa banco, HTTP nem adaptadores", "dependency-cruiser (JS/TS), ArchUnit (Java)"],
    ["Fronteiras entre módulos (capítulo 12)", "um módulo só usa a API pública do outro; nada de ciclos", "eslint-plugin-boundaries, madge, Packwerk (Ruby, da Shopify)"],
    ["Desempenho", "p95 abaixo de 300 ms com 50 usuários", "k6, Gatling, JMeter"],
    ["Segurança", "nenhuma dependência com falha crítica conhecida", "npm audit, Dependabot"],
    ["Disponibilidade (contínua)", "99,9% no mês (cerca de 43 minutos fora)", "monitoramento com alerta"],
  ],
)}

<h3>Modelo C4: o sistema em quatro níveis de zoom</h3>
<p>O ADR explica o porquê; o diagrama explica o quê. Só que diagramas de arquitetura costumam misturar servidor, classe,
fila e pessoa no mesmo desenho, sem legenda. O <b>modelo C4</b>, de Simon Brown, resolve isso como um app de mapas: você
começa no país e dá zoom até a rua. O nome vem dos quatro níveis: <i>Context</i>, <i>Containers</i>, <i>Components</i> e
<i>Code</i>.</p>
<ol>
<li><b>Contexto</b>: o sistema como uma caixa só, quem usa e com que sistemas externos ele conversa. Para todo mundo.</li>
<li><b>Contêineres</b>: as partes que rodam ou guardam dados separadamente: app web, app mobile, API, banco. Para devs e
operação.</li>
<li><b>Componentes</b>: os módulos dentro de um contêiner. Para os devs daquele contêiner.</li>
<li><b>Código</b>: classes e interfaces. Quase sempre opcional: a IDE gera quando alguém precisa.</li>
</ol>

${fig(c4(), "Cada nível dá zoom num elemento do nível anterior. Na prática, os níveis 1 e 2 resolvem a maior parte das conversas.")}

${alerta(
  "Contêiner no C4 não é contêiner Docker",
  "<p>No C4, <b>contêiner</b> é qualquer coisa que roda ou guarda dados separadamente: uma aplicação web, uma API, um app mobile, um banco. Pode rodar num contêiner Docker ou não. Para desenhar a partir de texto e guardar ao lado dos ADRs, há ferramentas como Structurizr (do próprio Simon Brown), C4-PlantUML e Mermaid.</p>",
)}

<h3>Checklist de revisão de arquitetura</h3>
<p>Revisão de arquitetura não precisa ser um comitê. Na forma mais simples, é o PR do ADR com duas ou três pessoas de fora
do time respondendo a estas perguntas. Toda resposta "não sei" vira item no contexto ou nas consequências. E, a cada
trimestre, por exemplo, releia os ADRs aceitos e confira os gatilhos de "rever se".</p>

${tabela(
  ["Tema", "Perguntas"],
  [
    ["<b>Objetivo</b>", "Que problema de negócio isto resolve? Quais características importam mais: prazo, custo, desempenho, segurança? (capítulo 2)"],
    ["<b>Alternativas</b>", "O que mais foi avaliado, e por que ficou de fora? Existe um ADR?"],
    ["<b>Limites e dados</b>", "As fronteiras seguem o negócio? Quem é dono de cada dado? Alguém lê a tabela de outro módulo?"],
    ["<b>Dependências</b>", "O núcleo depende de infraestrutura? Há ciclos? As regras importantes têm função de aptidão?"],
    ["<b>Falhas</b>", "E se o banco, a fila ou um serviço externo cair? Há timeout, nova tentativa e idempotência (repetir sem duplicar o efeito)?"],
    ["<b>Escala e segurança</b>", "Onde está o gargalo com 10 vezes mais uso? Como autentica, autoriza e guarda segredos e dados pessoais (LGPD)?"],
    ["<b>Operação e custo</b>", "Como saber se está saudável (logs, métricas, traces)? Como fazer deploy e voltar atrás? Quanto custa por mês?"],
    ["<b>Time e reversão</b>", "O time atual consegue manter isto? O que fica caro de desfazer? Qual o gatilho para rever?"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>ADR-romance</b>: dez páginas que ninguém lê. Passou de duas, o detalhe vai para um documento à parte, com link.</li>
<li><b>ADR escrito para justificar</b>: decide primeiro e escreve depois, sem alternativas reais. Escreva enquanto decide.</li>
<li><b>Editar ADR aceito</b>: escrever a decisão nova por cima da antiga apaga a história. Crie um ADR que substitui.</li>
<li><b>Função de aptidão que não barra</b>: o teste de carga falha e o deploy segue mesmo assim. Se não para o pipeline nem
gera alerta, não protege nada. E se for lenta ou falhar ao acaso, o time aprende a ignorar.</li>
<li><b>Diagrama que mistura níveis</b>: classe, servidor e time no mesmo desenho. Um nível do C4 por diagrama, com legenda.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine a loja do ADR-0003, um ano depois. Uma dev nova propõe quebrar tudo em microsserviços. Em vez de semanas de debate, o time abre o ADR e confere o \"rever se\": são 11 devs e nenhum módulo precisa de escala separada, então a decisão fica. Meses depois, pagamentos passa a exigir deploy isolado e regras próprias para dados de cartão: agora o gatilho disparou. O time escreve o ADR-0014, \"Extrair pagamentos para um serviço\", que cita o 0003, explica o que mudou e cria uma função de aptidão nova: nenhum outro módulo lê as tabelas de pagamentos. O 0003 não é substituído, porque continua valendo para o resto do sistema: ele só ganha um link para o 0014.</p>",
)}

${dica(
  "ADR, RFC ou design doc?",
  "<p>Não competem. O RFC (ou design doc) é a conversa longa para propor e discutir uma mudança antes de decidir; o ADR é a ata curta da decisão, com link para o RFC. Quem chegar daqui a dois anos lê o ADR primeiro e só abre o RFC se precisar do detalhe.</p>",
)}

${combina([
  [2, "Os critérios que decidem a escolha", "a base do contexto de todo ADR"],
  [28, "Árvore de decisão", "gera as alternativas consideradas"],
  [12, "Monólito modular", "o exemplo deste capítulo"],
  [6, "Hexagonal", "a regra de dependência que vira teste"],
  [30, "Como migrar sem parar o sistema", "cada etapa da migração vira um ADR"],
  [31, "Anti-padrões", "funções de aptidão pegam o desvio cedo"],
])}

${lembre([
  "ADR é uma ou duas páginas com contexto, decisão e consequências, em <code>docs/adr</code>, junto do código. ADR aceito não se reescreve: um ADR novo o substitui.",
  "Funções de aptidão transformam regras de arquitetura em testes que barram o PR (dependências, tempo de resposta) ou em alertas de produção.",
  "O C4 desenha o sistema em quatro níveis de zoom; a revisão de arquitetura é um checklist de perguntas respondidas no PR do ADR, não um comitê.",
])}
`;
