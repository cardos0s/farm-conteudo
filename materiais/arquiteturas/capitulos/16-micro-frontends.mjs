// Capítulo 16: Micro-frontends. Segue o modelo do capítulo 6:
// abertura (resumo) → diagrama → como funciona (casca, rotas, design system, 3 jeitos de integrar, conversa entre partes,
// dependências duplicadas) → quando usar → medidor → na prática (pastas + código + passos) → vantagens e custos
// → erros comuns → mundo real → combina com → para lembrar.

import { codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, claro, cor, evento, linha, navegador, passo, pessoa, quadro, ret, semear, servidor, seta, txt } from "../desenho.mjs";

/** O principal: uma tela só para o usuário, montada por fatias verticais (tela + API + time). */
function diagrama() {
  semear("micro-frontends-1");
  let s = "";
  s += navegador(30, 14, 700, 192);
  s += bloco(50, 38, 660, 42, "casca (shell): cabeçalho, login, menu e rotas", { preench: claro.cinza, tam: 16 });
  const cols = [
    [55, "catálogo", claro.azul, cor.azul, "time Descoberta", "API de produtos"],
    [280, "carrinho", claro.verde, cor.verde, "time Compras", "API de pedidos"],
    [505, "minha conta", claro.violeta, cor.violeta, "time Clientes", "API de clientes"],
  ];
  for (const [x, nome, c, forte, time, api] of cols) {
    const cx = x + 100;
    // a fatia vertical inteira, do navegador ao servidor
    s += ret(x - 6, 84, 212, 312, { cor: forte, tracejado: true, espessura: 1.6 });
    s += bloco(x, 90, 200, 94, "", { preench: c });
    s += txt(cx, 122, nome, { tam: 19, halo: 5 });
    s += txt(cx, 154, "micro-frontend", { tam: 15, cor: cor.tinta, halo: 5 });
    s += seta(cx, 188, cx, 232, { cor: forte, espessura: 2 });
    s += servidor(cx - 30, 236, 60, 56, api, { tam: 15 });
    s += pessoa(cx - 62, 340, { preench: c, cor: forte });
    s += txt(cx - 38, 362, time, { tam: 16, cor: forte, ancora: "start" });
  }
  s += txt(380, 418, "cada time é dono da fatia inteira: tela, API e deploy próprio", { tam: 16, cor: cor.vermelho });
  return quadro(760, 434, s);
}

/** Os três jeitos de juntar as peças: no build, no navegador e no servidor. */
function integracao() {
  semear("micro-frontends-2");
  let s = "";
  s += linha([[255, 20], [255, 400]], { cor: cor.cinza, tracejado: true, espessura: 1.2 });
  s += linha([[505, 20], [505, 400]], { cor: cor.cinza, tracejado: true, espessura: 1.2 });
  const titulos = [
    [130, "1. no build", "pacotes npm\nversionados", cor.azul],
    [380, "2. no navegador", "Module Federation,\nweb components, iframes", cor.verde],
    [630, "3. no servidor", "composição de\nfragmentos HTML", cor.violeta],
  ];
  for (const [cx, t, sub, c] of titulos) {
    s += txt(cx, 28, t, { tam: 19, cor: c });
    s += txt(cx, 64, sub, { tam: 15, cor: cor.cinza });
  }
  const pecas = (x0) =>
    bloco(x0, 100, 95, 40, "catálogo", { preench: claro.azul, tam: 15 }) + bloco(x0 + 105, 100, 95, 40, "carrinho", { preench: claro.verde, tam: 15 });

  // 1. no build: tudo vira um bundle antes do deploy
  s += pecas(30);
  s += seta(77, 142, 108, 178, { espessura: 1.8 });
  s += seta(182, 142, 152, 178, { espessura: 1.8 });
  s += bloco(35, 180, 190, 48, "build da casca", { preench: claro.cinza, tam: 16 });
  s += seta(130, 230, 130, 262, { espessura: 1.8 });
  s += navegador(55, 265, 150, 80, "1 bundle só");
  s += txt(130, 382, "simples, mas todos\npublicam juntos", { tam: 15 });

  // 2. no navegador: a casca baixa cada parte na hora
  s += pecas(280);
  s += seta(327, 142, 335, 192, { cor: cor.verde, tracejado: true, espessura: 1.8 });
  s += seta(432, 142, 425, 192, { cor: cor.verde, tracejado: true, espessura: 1.8 });
  s += txt(380, 167, "na hora", { tam: 15, cor: cor.verde });
  s += navegador(290, 195, 180, 150);
  s += bloco(305, 220, 150, 32, "casca", { preench: claro.cinza, tam: 15 });
  s += bloco(305, 262, 70, 70, "", { preench: claro.azul });
  s += bloco(385, 262, 70, 70, "", { preench: claro.verde });
  s += txt(380, 382, "cada time publica\nquando quiser", { tam: 15 });

  // 3. no servidor: o HTML já sai montado
  s += pecas(530);
  s += seta(577, 142, 608, 178, { cor: cor.violeta, espessura: 1.8 });
  s += seta(682, 142, 652, 178, { cor: cor.violeta, espessura: 1.8 });
  s += bloco(535, 180, 190, 48, "servidor monta", { preench: claro.amarelo, tam: 16 });
  s += seta(630, 230, 630, 262, { cor: cor.violeta, espessura: 1.8 });
  s += navegador(555, 265, 150, 80, "HTML pronto");
  s += txt(630, 382, "rápido na 1ª carga,\nbom para SEO", { tam: 15 });
  return quadro(760, 410, s);
}

/** Como as partes conversam sem se conhecer: evento no navegador + URL. */
function conversa() {
  semear("micro-frontends-3");
  let s = "";
  s += navegador(20, 10, 460, 290);
  // barra de endereço: estado que todos podem ler
  s += ret(36, 34, 428, 30, { preench: "#ffffff", hachura: "solid", espessura: 1.4 });
  s += txt(50, 49, "loja.com/produtos/123?cor=azul", { tam: 15, ancora: "start", cor: cor.azul });
  // casca com o contador do carrinho
  s += bloco(36, 74, 428, 50, "", { preench: claro.cinza });
  s += txt(110, 99, "casca", { tam: 17, halo: 5 });
  s += bloco(290, 82, 160, 34, "Carrinho (2)", { preench: claro.verde, hachura: "solid", tam: 16 });
  // catálogo com o botão comprar
  s += bloco(36, 134, 428, 154, "", { preench: claro.azul });
  s += txt(250, 152, "catálogo", { tam: 17, halo: 5 });
  s += ret(60, 172, 150, 96, { preench: "#ffffff", hachura: "solid", espessura: 1.4 });
  s += txt(135, 220, "Tênis azul", { tam: 15 });
  s += bloco(250, 200, 150, 44, "comprar", { preench: claro.amarelo, hachura: "solid", tam: 16 });
  // o evento no window
  s += bloco(510, 176, 240, 66, "", { preench: claro.laranja });
  s += evento(532, 182, 28);
  s += txt(652, 196, "evento no window", { tam: 15, halo: 5 });
  s += txt(630, 224, "carrinho:item-adicionado", { tam: 15, halo: 5 });
  // API do carrinho
  s += servidor(600, 20, 60, 60, "API do carrinho", { tam: 15 });
  // setas numeradas
  s += seta(402, 222, 506, 212, { cor: cor.laranja, espessura: 2 });
  s += passo(452, 198, "1", cor.laranja);
  s += seta(560, 172, 454, 108, { cor: cor.verde, espessura: 2 });
  s += passo(532, 126, "2", cor.verde);
  s += seta(454, 92, 594, 56, { cor: cor.verde, espessura: 2 });
  s += passo(512, 58, "3", cor.verde);
  // legenda
  const leg = [
    [266, "1", "o catálogo avisa", cor.laranja],
    [292, "2", "o carrinho escuta", cor.verde],
    [318, "3", "e busca o total", cor.verde],
  ];
  for (const [y, n, t, c] of leg) s += passo(524, y, n, c) + txt(546, y, t, { tam: 15, ancora: "start" });
  s += txt(250, 322, "a URL guarda o que dá para compartilhar (produto, cor)", { tam: 15, cor: cor.azul });
  return quadro(760, 340, s);
}

export default `
${resumo(
  "Dividir o front-end de um produto web em pedaços por <b>área de negócio</b>, cada um feito e publicado por um time diferente, e juntar tudo numa tela só para o usuário.",
  "Um shopping: cada loja tem dono, equipe e vitrine próprios, e pode reformar sem fechar o shopping. A administração cuida dos corredores, da entrada e das placas. O cliente sente que está num lugar só.",
)}

<p>É a ideia dos microsserviços (capítulo 14) levada para o navegador. O termo ficou conhecido em 2016, quando apareceu
no Technology Radar da ThoughtWorks. O problema que ele ataca é comum: a empresa já tem vários times de backend
independentes, mas todos mexem no mesmo front-end gigante. Cada deploy junta o trabalho de todo mundo, e um bug no checkout
segura a publicação da nova busca.</p>

${fig(diagrama(), "Para o usuário é um site só. Por trás, cada área é uma fatia vertical: o micro-frontend, a API que ele chama e o time que cuida dos dois.")}

<h3>Como funciona</h3>
<ul>
<li><b>Fatias por domínio</b>: cada micro-frontend é uma área do negócio (busca, produto, carrinho, conta), não um tipo
técnico de peça. Tem time dono, código, pipeline e deploy próprios.</li>
<li><b>Casca</b> (em inglês, <i>shell</i> ou <i>host</i>): o app que carrega primeiro. Desenha o layout comum
(cabeçalho, rodapé), cuida do login e decide qual micro-frontend aparece em cada rota. Deve ser fina: nada de regra de
negócio.</li>
<li><b>Roteamento em dois níveis</b>: a casca resolve o começo da URL (<code>/produtos/*</code> vai para o catálogo,
<code>/carrinho</code> vai para o carrinho) e cada micro-frontend resolve as próprias sub-rotas.</li>
<li><b>Por página ou na mesma tela</b>: o mais simples é cada página ter um time dono. Juntar partes de vários times
numa tela só (o contador do carrinho no cabeçalho da vitrine) também é possível, mas exige mais coordenação.</li>
<li><b>Design system compartilhado</b>: biblioteca de componentes (botão, campo, modal) e de <i>tokens</i> (cores,
fontes, espaçamentos), publicada como pacote versionado. É o que faz cinco times parecerem um produto só.</li>
</ul>

<h4>Três jeitos de juntar as peças</h4>
${fig(integracao(), "A diferença está em QUANDO as partes se juntam: antes do deploy, no navegador do usuário ou no servidor, a cada requisição.")}
<ul>
<li><b>No build</b>: cada parte vira um pacote npm e a casca gera um bundle (o JavaScript final) único. Simples e com
tipos de ponta a ponta, mas mudar o carrinho exige republicar a casca: perde-se o deploy independente. Por isso muita gente chama isso
só de front modular.</li>
<li><b>No navegador (em tempo de execução, o <i>runtime</i>)</b>: a casca baixa cada parte enquanto o usuário navega. Três técnicas comuns:
  <ul>
  <li><b>Module Federation</b>: nasceu no Webpack 5 (hoje existe também no Rspack, de forma nativa, e no Vite, por plugin).
  Um app <i>host</i> carrega módulos expostos por apps <i>remotes</i>, e eles dividem bibliotecas como o React.</li>
  <li><b>Web components</b>: cada time entrega uma tag HTML própria (<code>&lt;loja-carrinho&gt;</code>) com
  <i>Custom Elements</i>, padrão do navegador. Funciona com qualquer framework, e o <i>Shadow DOM</i> isola o CSS.</li>
  <li><b>iframes</b>: isolamento total, mas cada iframe é uma página inteira: pesa e complica altura, rotas,
  acessibilidade e SEO (como o Google lê a página). Serve para widgets de terceiros e telas internas legadas.</li>
  </ul></li>
<li><b>No servidor</b>: o servidor (ou a CDN) junta fragmentos HTML de cada time antes de responder, com SSI
(<i>Server Side Includes</i>), ESI (<i>Edge Side Includes</i>) ou renderização no servidor. A página chega pronta: boa
para a primeira carga e para SEO.</li>
</ul>

<h4>Como eles conversam</h4>
${fig(conversa(), "O catálogo não importa nada do carrinho: só dispara um evento. O contador do cabeçalho (do time do carrinho) escuta e busca o total na API, que continua sendo a fonte da verdade.")}
<ul>
<li><b>URL</b>: o que dá para compartilhar num link (produto aberto, filtros) fica na URL, e todos leem dali.</li>
<li><b>Eventos do navegador</b>: um <code>CustomEvent</code> no <code>window</code> avisa os outros sem que um conheça
o outro. Nome e formato do evento viram contrato, como uma API.</li>
<li><b>Backend como fonte da verdade</b>: o carrinho mora na API do carrinho, não numa variável global do front.</li>
</ul>

<h4>O preço escondido: dependências duplicadas</h4>
<p>Se cada time empacota o próprio React, o usuário baixa o React três vezes. E se o componente de um time for
renderizado pelo React de outro, os hooks (como o <code>useState</code>) quebram com o erro <i>Invalid hook call</i>. Por isso o Module Federation tem a opção <code>shared</code> com <code>singleton: true</code>
(uma cópia só para todos). Combine uma versão principal de framework e vigie o tamanho do bundle a cada deploy.</p>

${quando(
  [
    "Vários times (três ou mais) mexem no mesmo produto web e travam uns aos outros no deploy.",
    "O produto é grande e tem áreas bem separadas: catálogo, checkout, conta, painel do vendedor.",
    "Você precisa trocar de framework aos poucos (sair de AngularJS ou jQuery), uma área por vez.",
    "Os times querem ser donos da tela, não só da API (o backend pode até ser um monólito: micro-frontend não exige microsserviço).",
  ],
  [
    "Um time só cuida do front: um app bem modularizado resolve, por uma fração do custo.",
    "App pequeno, MVP ou produto que ainda está descobrindo o que é.",
    "Telas muito entrelaçadas, em que todo recurso mexe em quase todas as áreas.",
    "A motivação é \"cada time usa o framework que quiser\": isso multiplica peso e complexidade.",
  ],
)}

${medidor({ complexidade: 4, escala: 4, operacao: 3, aprendizado: 3, time: "a partir de 3 times no mesmo front" })}

<h3>Como usar na prática</h3>
<p>Exemplo com Module Federation e React. Cada pasta pode ser um repositório ou um pacote num monorepo (um repositório para tudo), desde que tenha
build e deploy próprios.</p>
${pastas(`
loja-web/
├── casca/                         # time Plataforma: layout, login, rotas
│   ├── src/index.ts               # só faz import("./bootstrap")
│   ├── src/bootstrap.tsx          # monta o React de verdade
│   ├── src/rotas.tsx              # qual micro-frontend em cada rota
│   └── webpack.config.ts          # declara os remotes
├── mf-catalogo/                   # time Descoberta (deploy próprio)
│   └── webpack.config.ts          # expõe ./Vitrine
├── mf-carrinho/                   # time Compras (deploy próprio)
│   └── src/contador-carrinho.ts   # web component do cabeçalho
└── design-system/                 # pacote npm versionado
`)}

${codigo(
  `
// mf-catalogo/webpack.config.ts: o REMOTE expõe a vitrine
import { container, type Configuration } from "webpack";
const { ModuleFederationPlugin } = container;

export default {
  plugins: [
    new ModuleFederationPlugin({
      name: "catalogo",
      filename: "remoteEntry.js",    // o "cardápio" que a casca baixa
      exposes: { "./Vitrine": "./src/Vitrine.tsx" },
      shared: { react: { singleton: true }, "react-dom": { singleton: true } },
    }),
  ],
} satisfies Configuration;

// casca/webpack.config.ts: o HOST diz onde buscar cada remote
new ModuleFederationPlugin({
  name: "casca",
  remotes: {
    catalogo: "catalogo@https://catalogo.loja.com/remoteEntry.js",
    carrinho: "carrinho@https://carrinho.loja.com/remoteEntry.js",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});`,
  "webpack.config.ts (remote e host)",
)}

<p>Dois detalhes práticos. No TypeScript, cada remote importado precisa de uma declaração de tipos
(<code>declare module "catalogo/Vitrine"</code> num arquivo <code>.d.ts</code>). E o <code>remoteEntry.js</code> deve
ter cache curto: com cache longo, o usuário continua na versão velha depois do deploy.</p>

${codigo(
  `
// casca/src/rotas.tsx: a casca só decide QUEM aparece em cada rota
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary"; // pacote pronto

const Vitrine = lazy(() => import("catalogo/Vitrine")); // baixa o remote na hora
const Carrinho = lazy(() => import("carrinho/Pagina"));

export function Rotas() {
  const { pathname } = useLocation(); // mudar de rota limpa o erro
  return (
    <ErrorBoundary resetKeys={[pathname]} fallback={<p>Esta parte está fora do ar.</p>}>
      <Suspense fallback={<p>Carregando...</p>}>
        <Routes>
          <Route path="/produtos/*" element={<Vitrine />} />
          <Route path="/carrinho" element={<Carrinho />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}`,
  "casca/src/rotas.tsx",
)}

${codigo(
  `
// mf-carrinho/src/contador-carrinho.ts: vira a tag <loja-contador-carrinho>
class ContadorCarrinho extends HTMLElement {
  private aoAdicionar = () => this.atualizar();
  connectedCallback() {
    window.addEventListener("carrinho:item-adicionado", this.aoAdicionar);
    this.atualizar();
  }
  disconnectedCallback() { // sem isso, o ouvinte fica preso no window
    window.removeEventListener("carrinho:item-adicionado", this.aoAdicionar);
  }
  async atualizar() { // o evento só avisa; o total vem da API
    const { itens } = await (await fetch("/api/carrinho/resumo")).json();
    this.textContent = \`Carrinho (\${itens})\`;
  }
}
customElements.define("loja-contador-carrinho", ContadorCarrinho);

// mf-catalogo, depois de gravar o item na API: avisa sem importar nada do carrinho
window.dispatchEvent(new CustomEvent("carrinho:item-adicionado", { detail: { id: "123" } }));`,
  "comunicação por evento (web component)",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Desenhe as fronteiras pelo negócio: cada micro-frontend é uma área com um time dono, de preferência o mesmo da API (a Lei de Conway a seu favor, capítulo 2).",
  "Crie a casca fina: layout, login, rotas de primeiro nível e aviso de erro (no Module Federation, o <code>index.ts</code> só faz <code>import(\"./bootstrap\")</code>, para as bibliotecas compartilhadas carregarem antes).",
  "Escolha UM jeito de integrar e uma versão de framework para todos (registre num ADR, capítulo 32). Publique o design system antes do segundo micro-frontend.",
  "Escreva o contrato entre as partes: rotas, eventos e URL. Trate como API pública.",
  "Dê a cada parte pipeline e deploy próprios, teto de bundle e testes de ponta a ponta.",
  "Migre aos poucos: a casca manda as rotas já migradas para os micro-frontends e o resto para o front antigo (Strangler Fig, capítulo 30).",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Cada time publica quando quiser, sem fila de deploy", "Mais peças: casca, vários pipelines, versões e endereços"],
    ["Time dono da fatia inteira, da tela ao banco", "Cara de colcha de retalhos se o design system for fraco"],
    ["Trocar de framework aos poucos, área por área", "Bundle maior quando as dependências se repetem"],
    ["Queda de uma parte fica contida na área dela", "Testar a jornada inteira (ponta a ponta) fica mais difícil"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Fatiar por peça técnica</b>: um micro-frontend para o cabeçalho, outro para os formulários. Todo recurso novo
mexe em vários ao mesmo tempo.</li>
<li><b>Casca gorda</b>: regra de negócio e chamadas de API na casca, que vira um monólito disfarçado.</li>
<li><b>Estado global compartilhado</b>: uma <i>store</i> única (o estado central do front, como no Redux) que todos leem e escrevem. Um time renomeia um campo e quebra
o outro.</li>
<li><b>Sem plano B</b>: um remote cai e a página fica branca. Toda parte carregada em runtime precisa de
<i>fallback</i> (o <code>ErrorBoundary</code> do exemplo).</li>
<li><b>CSS vazando</b>: o <code>.botao</code> de um time muda o do outro. Use CSS Modules, prefixos ou Shadow DOM.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine uma loja com front em React e quatro times, em que cada deploy junta o trabalho de todos. Ela separa casca e login (time Plataforma), vitrine (Descoberta), carrinho (Compras) e conta (Clientes), com Module Federation e React compartilhado. Cada time passa a publicar no seu ritmo. O custo: agora a Plataforma cuida da casca, do design system e do tamanho do bundle.</p>",
)}

${dica(
  "Antes de micro-frontends, tente um front modular",
  "<p>Pastas por área, lint que barra imports entre áreas e donos por pasta resolvem muito, num deploy só: é o monólito modular (capítulo 12) no front. Separe primeiro; distribua quando os times travarem.</p>",
)}

${combina([
  [14, "Microsserviços", "dono da API e da tela"],
  [12, "Monólito modular", "a alternativa mais simples"],
  [9, "Microkernel", "a casca como núcleo"],
  [30, "Como migrar", "trocar o front área por área"],
])}

${lembre([
  "Micro-frontends resolvem um problema de organização (vários times no mesmo front), não de tecnologia.",
  "Divida por área de negócio, mantenha a casca fina e converse pouco: URL e eventos, nada de estado global.",
  "Controle o custo: design system compartilhado, uma cópia só de cada biblioteca e limite de tamanho de bundle.",
])}
`;
