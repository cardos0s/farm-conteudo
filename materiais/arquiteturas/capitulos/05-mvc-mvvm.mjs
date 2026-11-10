// Capítulo 5: MVC, MVP e MVVM. Segue a estrutura do capítulo-modelo (06-hexagonal.mjs).

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, linha, navegador, quadro, ret, semear, seta, txt } from "../desenho.mjs";

// 1. Os três padrões lado a lado: mesma View, mesmo Model, muda a peça do meio.
function comparacao() {
  semear("mvc-mvvm-1");
  let s = "";
  const Y1 = 96, Y2 = 200, Y3 = 304, H = 54;
  const sep = { cor: cor.cinza, tracejado: true, espessura: 1.2 };
  s += linha([[253, 14], [253, 418]], sep) + linha([[507, 14], [507, 418]], sep);

  const titulo = (cx, t, sub) => txt(cx, 22, t, { tam: 24 }) + txt(cx, 48, sub, { tam: 15, cor: cor.cinza });
  const clique = (x) => txt(x, 68, "clique", { tam: 15, cor: cor.laranja }) + seta(x, 78, x, Y1 - 2, { cor: cor.laranja, espessura: 2 });
  const view = (x, w) => bloco(x, Y1, w, H, "View", { preench: claro.azul });
  const model = (cx) => bloco(cx - 65, Y3, 130, H, "Model", { preench: claro.verde });
  // par de setas entre duas caixas empilhadas (desce à esquerda, sobe à direita)
  const par = (cx, yA, yB, desce, sobe, o = {}) =>
    seta(cx - 42, yA + 2, cx - 42, yB - 2, { espessura: 2 }) +
    txt(cx - 50, (yA + yB) / 2, desce, { tam: 15, ancora: "end" }) +
    seta(cx + 42, yB - 2, cx + 42, yA + 2, { espessura: 2, tracejado: o.tracejado, cor: o.cor }) +
    txt(cx + 50, (yA + yB) / 2, sobe, { tam: 15, ancora: "start", cor: o.cor });

  // MVC original: triângulo
  s += titulo(127, "MVC", "o original (Smalltalk)");
  s += view(18, 100);
  s += bloco(134, Y1, 110, H, "Controller", { preench: claro.amarelo, tam: 16 });
  s += clique(189);
  s += model(127);
  s += seta(189, Y1 + H + 2, 150, Y3 - 2, { espessura: 2 });
  s += txt(206, (Y1 + H + Y3) / 2, "altera", { tam: 15 });
  s += seta(100, Y3 - 2, 68, Y1 + H + 2, { espessura: 2, tracejado: true, cor: cor.verde });
  s += txt(46, (Y1 + H + Y3) / 2, "avisa", { tam: 15, cor: cor.verde });
  s += txt(127, 396, "a View observa o Model\ne se redesenha sozinha", { tam: 15 });

  // MVP: cadeia, a View é passiva
  s += titulo(380, "MVP", "view passiva");
  s += view(300, 160);
  s += clique(380);
  s += bloco(300, Y2, 160, H, "Presenter", { preench: claro.amarelo });
  s += model(380);
  s += par(380, Y1 + H, Y2, "evento", "atualiza");
  s += par(380, Y2 + H, Y3, "pede", "dados");
  s += txt(380, 396, "o Presenter diz à View\no que ela deve mostrar", { tam: 15 });

  // MVVM: cadeia com binding
  s += titulo(633, "MVVM", "data binding");
  s += view(553, 160);
  s += clique(633);
  s += bloco(553, Y2, 160, H, "ViewModel", { preench: claro.amarelo });
  s += model(633);
  s += par(633, Y1 + H, Y2, "comando", "estado", { tracejado: true, cor: cor.violeta });
  s += txt(633, (Y1 + H + Y2) / 2, "binding", { tam: 15, cor: cor.violeta });
  s += par(633, Y2 + H, Y3, "chama", "dados");
  s += txt(633, 396, "a View se liga ao estado;\no ViewModel nem sabe dela", { tam: 15 });
  return quadro(760, 422, s);
}

// 2. O MVC dos frameworks web: um ciclo inteiro a cada requisição.
function cicloWeb() {
  semear("mvc-mvvm-2");
  let s = "";
  s += navegador(16, 36, 112, 92, "navegador");
  s += bloco(300, 60, 160, 70, "Controller", { preench: claro.amarelo });
  s += bloco(570, 60, 150, 70, "Model", { preench: claro.verde });
  s += banco(600, 182, 90, 80, "banco", { preench: claro.violeta });
  s += bloco(300, 190, 160, 64, "View (template)", { preench: claro.azul, tam: 16 });

  s += seta(130, 82, 298, 82, { espessura: 2, cor: cor.azul });
  s += txt(214, 62, "1. GET /pedidos/42", { tam: 15, cor: cor.azul });
  s += txt(214, 114, "o roteador escolhe\na ação certa", { tam: 15, cor: cor.cinza });
  s += seta(462, 82, 568, 82, { espessura: 2 });
  s += txt(515, 66, "2. busca", { tam: 15 });
  s += seta(568, 112, 462, 112, { espessura: 2 });
  s += txt(515, 130, "3. pedido", { tam: 15 });
  s += seta(645, 132, 645, 180, { espessura: 1.8, duplo: true, cor: cor.violeta });
  s += txt(672, 156, "SQL", { tam: 15, ancora: "start", cor: cor.violeta });
  s += seta(380, 132, 380, 188, { espessura: 2 });
  s += txt(392, 160, "4. passa os dados", { tam: 15, ancora: "start" });
  s += linha([[298, 222], [72, 222]], { espessura: 2, cor: cor.azul });
  s += seta(72, 222, 72, 132, { espessura: 2, cor: cor.azul });
  s += txt(185, 206, "5. HTML pronto", { tam: 15, cor: cor.azul });
  s += txt(380, 296, "a cada requisição o ciclo recomeça: ninguém fica observando o Model", { tam: 15, cor: cor.vermelho });
  return quadro(760, 292, `<g transform="translate(0,-18)">${s}</g>`);
}

// 3. Onde esses padrões ficam num sistema maior: na borda, em volta do núcleo.
function borda() {
  semear("mvc-mvvm-3");
  let s = "";
  s += ret(10, 38, 170, 196, { tracejado: true, cor: cor.azul, espessura: 1.4 });
  s += ret(250, 38, 160, 196, { tracejado: true, cor: cor.azul, espessura: 1.4 });
  s += txt(95, 20, "front: MVVM", { tam: 16, cor: cor.azul });
  s += txt(330, 20, "back: MVC", { tam: 16, cor: cor.azul });
  s += txt(535, 20, "centro", { tam: 16, cor: cor.laranja });
  s += txt(707, 20, "infra", { tam: 16, cor: cor.violeta });

  s += bloco(22, 54, 146, 50, "View (tela)", { preench: claro.azul, tam: 16 });
  s += bloco(22, 166, 146, 50, "ViewModel", { preench: claro.amarelo, tam: 16 });
  s += seta(80, 106, 80, 164, { espessura: 2, duplo: true, cor: cor.violeta });
  s += txt(92, 135, "binding", { tam: 15, ancora: "start", cor: cor.violeta });

  s += txt(330, 92, "aqui a View é\no JSON ou o HTML", { tam: 15, cor: cor.cinza });
  s += bloco(264, 166, 132, 50, "Controller", { preench: claro.amarelo, tam: 16 });
  s += seta(170, 181, 262, 181, { espessura: 2 });
  s += txt(215, 165, "HTTP", { tam: 15 });
  s += seta(262, 203, 170, 203, { espessura: 2, tracejado: true });
  s += txt(215, 221, "JSON", { tam: 15 });

  s += bloco(470, 116, 130, 104, "", { preench: claro.amarelo, espessura: 2.6 });
  s += txt(535, 140, "núcleo", { tam: 18 });
  s += txt(535, 186, "casos de uso\n+ regras", { tam: 15, cor: cor.cinza });
  s += txt(535, 98, "capítulos 6 e 7", { tam: 15, cor: cor.cinza });
  s += seta(398, 186, 468, 186, { espessura: 2 });
  s += txt(440, 170, "chama", { tam: 15 });
  s += banco(670, 124, 76, 92, "banco", { preench: claro.violeta });
  s += seta(602, 172, 668, 172, { espessura: 2 });
  s += txt(635, 156, "porta", { tam: 15 });

  s += linha([[10, 246], [10, 256], [410, 256], [410, 246]], { cor: cor.azul, espessura: 1.4 });
  s += txt(210, 276, "borda: MVC, MVP ou MVVM", { tam: 15, cor: cor.azul });
  s += linha([[470, 246], [470, 256], [600, 256], [600, 246]], { cor: cor.laranja, espessura: 1.4 });
  s += txt(535, 276, "regras de negócio", { tam: 15, cor: cor.laranja });
  s += txt(380, 308, "a borda traduz e repassa; quem decide é o núcleo", { tam: 16, cor: cor.vermelho });
  return quadro(760, 326, s);
}

export default `
${resumo(
  "Os três padrões separam a <b>tela</b> (View) dos <b>dados e regras</b> (Model) e põem uma peça no meio: o <b>Controller</b>, o <b>Presenter</b> ou o <b>ViewModel</b>. O que muda entre eles é quem recebe o clique e quem atualiza a tela.",
  "Num restaurante, você vê o cardápio e o prato (View), a cozinha guarda as receitas (Model) e o garçom leva e traz (a peça do meio). Trocar a louça não muda a receita, e o cozinheiro nunca vai até a sua mesa.",
)}

<p>O MVC (Model-View-Controller) foi criado por Trygve Reenskaug em 1979, no Xerox PARC, para as interfaces gráficas do
Smalltalk. A ideia era separar três coisas: o que o programa <b>sabe</b> (Model), o que o usuário <b>vê</b> (View) e o que
<b>trata a entrada</b> do usuário (Controller). Dele nasceram dois parentes muito usados: o <b>MVP</b> (Model-View-Presenter)
e o <b>MVVM</b> (Model-View-ViewModel).</p>

<p>Esses padrões não organizam o sistema inteiro: organizam a <b>apresentação</b>, a parte que conversa com o usuário
(o andar de cima das camadas do capítulo 4). Por isso combinam bem com hexagonal e Clean (capítulos 6 e 7).</p>

${fig(comparacao(), "Mesmo Model e mesma View nos três. Muda a peça do meio e o caminho que o clique faz até a tela mudar.", "grande")}

<h3>Como funciona</h3>

<h4>MVC original: a View observa o Model</h4>
<p>No Smalltalk, cada pedaço da tela tinha um par View + Controller. O Controller recebia mouse e teclado e mandava o
Model mudar. O Model avisava "mudei" para quem estivesse observando (o padrão <i>Observer</i>), e a View se redesenhava
lendo os dados novos. O Model não sabe nada de tela: ele só avisa.</p>

<h4>MVC na web: requisição e resposta</h4>
<p>No servidor não existe tela viva. Existe requisição e resposta. Por isso o MVC dos frameworks web (no mundo Java ele
ficou conhecido como <i>Model 2</i>; Ruby on Rails, Laravel, Spring MVC e ASP.NET MVC seguem a mesma ideia) funciona
como um ciclo que roda inteiro a cada requisição.</p>

${fig(cicloWeb(), "O roteador escolhe a ação, o controller pede ao Model, escolhe a View e devolve a resposta. Na próxima requisição, tudo de novo.")}

<p>A View é um template (ERB no Rails, Blade no Laravel, Thymeleaf no Spring, EJS no Express) ou, numa API, o próprio
JSON. O Express sozinho não é MVC: você monta o padrão com rotas, controllers e views.</p>

<h4>MVP: a View passiva</h4>
<p>No MVP, a View não fala com o Model. Ela recebe o clique e repassa ao <b>Presenter</b> ("o usuário tocou em salvar").
O Presenter busca ou altera o Model e depois diz à View exatamente o que mostrar, chamando métodos de uma interface:
<code>mostrarCarregando()</code>, <code>mostrarErro(msg)</code>. Na variante <i>Passive View</i> (view passiva), a View
quase não tem lógica, então quase não precisa de teste; na <i>Supervising Controller</i>, ela resolve as ligações simples
com os dados e o Presenter cuida do resto. Nos dois casos, o Presenter é testado com uma View falsa. O MVP foi muito usado
onde a ligação automática entre tela e dados (<i>binding</i>) era fraca ou não existia: WinForms no .NET e Android antes
do Jetpack, quando as Activities viviam gigantes.</p>

<h4>MVVM: ViewModel e data binding</h4>
<p>No MVVM, a peça do meio é o <b>ViewModel</b>: um objeto que expõe o <b>estado</b> da tela (a lista de pedidos, se está
carregando, a mensagem de erro) e <b>comandos</b> (recarregar, cancelar). A View se liga a esse estado por <b>data
binding</b> (ligação de dados): quando o estado muda, a tela se atualiza sozinha. A diferença para o MVP é essa: o
ViewModel <b>não conhece a View</b>. Ele não chama <code>mostrarErro()</code>; só muda o estado, e quem estiver ligado
reage.</p>
<p>O padrão se popularizou com o WPF, da Microsoft, e hoje está em quase todo front moderno. Angular e Vue trazem
binding pronto (<code>[(ngModel)]</code>, <code>v-model</code>); no Android, a classe <code>ViewModel</code> do Jetpack
(que sobrevive à rotação da tela) é usada com Compose; em SwiftUI, um objeto observável faz o papel. No Compose e no
React, a recomendação é a mão única: o estado desce para a tela e os eventos sobem como comandos.</p>

<h4>Onde esses padrões ficam num sistema maior</h4>
<p>Num sistema real é comum ter os dois: MVVM no front e MVC no back. Com regras de negócio ricas, o controller
não guarda regra: ele vira um <b>adaptador de entrada</b> do hexágono (capítulo 6). Na Clean
Architecture (capítulo 7), controllers e presenters aparecem com esses nomes no anel de fora.</p>

${fig(borda(), "MVC, MVP e MVVM moram na borda. As regras ficam no núcleo, que não sabe se quem chamou foi uma tela, uma API ou um teste.")}

${quando(
  [
    "Todo app com tela ou API: separar entrada, regra e tela é o básico.",
    "Seu framework já é MVC (Rails, Laravel, Spring MVC, ASP.NET MVC): siga a convenção dele.",
    "Telas com estado de verdade (formulários, filtros, offline): um ViewModel por tela.",
    "Tela sem binding cuja lógica você quer testar (WinForms, UIKit): MVP.",
  ],
  [
    "Esperar que o MVC organize o negócio: com regra rica, ponha um núcleo atrás (cap. 6 e 7).",
    "Componentes pequenos que só mostram dados: um ViewModel para cada botão é cerimônia.",
    "Forçar MVP em React, Compose ou SwiftUI: você briga com o framework.",
    "Binding de duas vias em telas enormes: ninguém sabe quem mudou o quê.",
  ],
)}

${medidor({ complexidade: 1, escala: 3, operacao: 1, aprendizado: 2, time: "qualquer tamanho; com muitos devs no mesmo app, divida em módulos (cap. 12)" })}

<h3>Como usar na prática</h3>

<p>O exemplo abaixo tem os dois lados de uma loja: o back em Express (MVC) e o front em React (MVVM).</p>

${pastas(`
api/                                 # back: MVC na web (Express)
├── views/pedidos/mostrar.ejs        # V: o template que vira HTML
└── src/pedidos/
    ├── pedidos.controller.ts        # C: traduz HTTP, chama o caso de uso
    ├── rotas.ts                     # liga cada URL a uma ação
    └── nucleo/                      # M: casos de uso e regras (cap. 6)
web/src/pedidos/                     # front: MVVM (React)
├── usePedidos.ts                    # ViewModel: estado + comandos
├── PedidosTela.tsx                  # View: só desenha
└── pedidosApi.ts                    # Model do front: fala com a API
`)}

${codigo(
  `
// pedidos.controller.ts: controller magro, só traduz HTTP
import type { Request, Response } from "express";
import type { BuscarPedido, CancelarPedido } from "./nucleo";

export class PedidosController {
  constructor(private buscar: BuscarPedido, private cancelar: CancelarPedido) {}

  mostrar = async (req: Request, res: Response) => {       // GET /pedidos/:id
    const pedido = await this.buscar.executar(req.params.id);
    if (!pedido) return res.status(404).render("erros/404");
    res.render("pedidos/mostrar", { pedido }); // escolhe a View e passa os dados
  };

  cancelarPedido = async (req: Request, res: Response) => { // POST /pedidos/:id/cancelar
    await this.cancelar.executar(req.params.id, req.body.motivo); // a regra mora no núcleo
    res.redirect("/pedidos/" + req.params.id);
  };
}

// rotas.ts: o roteador liga cada URL a uma ação do controller
const pedidos = new PedidosController(buscarPedido, cancelarPedido);
app.get("/pedidos/:id", pedidos.mostrar);
app.post("/pedidos/:id/cancelar", pedidos.cancelarPedido);`,
  "api/src/pedidos: pedidos.controller.ts e rotas.ts",
)}

${codigo(
  `
// PedidosTela.tsx: a View só desenha o estado e repassa os cliques
import { usePedidos } from "./usePedidos";

export function PedidosTela() {
  const { estado, recarregar, cancelar } = usePedidos();
  if (estado.tipo === "carregando") return <p>Carregando...</p>;
  if (estado.tipo === "erro")
    return <p>{estado.mensagem} <button onClick={recarregar}>Tentar de novo</button></p>;
  return <ul>{estado.pedidos.map((p) => (
    <li key={p.id}>
      Pedido {p.numero}: {p.status} <button onClick={() => cancelar(p.id)}>Cancelar</button>
    </li>
  ))}</ul>;
}`,
  "web/src/pedidos/PedidosTela.tsx",
)}

${codigo(
  `
// usePedidos.ts: o ViewModel da tela (estado + comandos), sem nenhum JSX
import { useCallback, useEffect, useState } from "react";
import { api, type Pedido } from "./pedidosApi";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; pedidos: Pedido[] };

export function usePedidos() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const recarregar = useCallback(async () => {
    setEstado({ tipo: "carregando" });
    try {
      setEstado({ tipo: "pronto", pedidos: await api.listarPedidos() });
    } catch {
      setEstado({ tipo: "erro", mensagem: "Não deu para carregar seus pedidos." });
    }
  }, []);
  const cancelar = useCallback(async (id: string) => {
    await api.cancelarPedido(id);
    await recarregar();
  }, [recarregar]);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { estado, recarregar, cancelar };
}`,
  "web/src/pedidos/usePedidos.ts",
)}

<p>O React não impõe MVVM: aqui o hook customizado faz o papel de ViewModel. Repare que ele não sabe como a tela é:
amanhã ela pode virar uma tabela, ou ir para o React Native, e o hook não muda. Em MVP seria o contrário: a View implementaria uma interface (<code>TelaDePedidos</code>) e o Presenter chamaria
<code>tela.mostrarPedidos(lista)</code> ou <code>tela.mostrarErro(msg)</code>.</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Siga a convenção do seu framework. Rails, Laravel e Spring MVC já trazem pastas e nomes; no Express ou Fastify, crie um controller por recurso (<code>PedidosController</code>) e registre as rotas num só lugar.",
  "Deixe o controller magro: ler parâmetros, validar o formato, chamar <b>um</b> caso de uso ou serviço e escolher a resposta (View, JSON ou status). Regra de bolso: se um método passa de umas 20 linhas, alguma regra fugiu para ele.",
  "Ponha as regras no Model ou, em sistemas maiores, no núcleo (capítulos 6 e 7). Nada de desconto calculado no controller nem <code>if</code> de negócio no template.",
  "No front, crie um ViewModel por tela (um hook, um composable, uma classe <code>ViewModel</code>) que expõe estado e comandos com nomes do usuário: <code>cancelar</code>, <code>recarregar</code>.",
  "Modele o estado como um tipo com todos os casos (carregando, erro, pronto). Assim a View não fica com cinco <code>booleans</code> que se contradizem.",
  "Teste sem tela: o ViewModel com uma API falsa (no React, com o <code>renderHook</code> da Testing Library) e o controller com um caso de uso falso.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Tela, entrada e regra separadas: mudar o visual não quebra a regra", "Mais arquivos e mais pulos para seguir um fluxo simples"],
    ["Frameworks prontos já organizam assim: quem chega se acha rápido", "O framework decide muito; sair da convenção dele custa caro"],
    ["Presenter e ViewModel testáveis sem desenhar nenhuma tela", "Binding automático pode esconder bugs e dificultar a depuração"],
    ["Várias Views para o mesmo Model (site, app, relatório em PDF)", "Sozinho, não organiza o negócio: controller e model incham"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Fat controller</b> (controller gordo): o método valida, calcula frete, aplica cupom, grava no banco e manda e-mail.
Ninguém consegue reaproveitar essa regra num job ou num consumidor de fila. O controller deve só traduzir e chamar.</li>
<li><b>Massive View Controller</b>: no iOS com UIKit, o <code>UIViewController</code> acumula rede, validação, navegação e
desenho. O apelido brinca com a própria sigla MVC. No Android antigo, o mesmo acontecia com Activities enormes. A saída é
tirar a lógica para um ViewModel ou Presenter.</li>
<li><b>Regra na View</b>: o template decide "se o cliente é VIP e o pedido passa de R$ 200, o frete é grátis". A regra
vai para o Model, e a View só mostra <code>pedido.freteGratis</code>.</li>
<li><b>ViewModel que conhece a tela</b>: importa componentes, mexe no DOM ou navega direto. No Android, guardar uma
Activity ou uma View dentro do ViewModel ainda vaza memória, porque ele vive mais que a tela. Ele expõe estado e
comandos; quem decide como desenhar é a View.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O Shopify roda num dos maiores monólitos Ruby on Rails conhecidos, e Rails é MVC de ponta a ponta. No blog de engenharia, o time contou que organizar o código só pelas pastas do framework (<code>models/</code>, <code>controllers/</code>, <code>views/</code>) deixou de funcionar com tanta gente mexendo no mesmo lugar. A saída foi dividir o código por áreas de negócio (componentes), cada uma com seu próprio MVC por dentro, e criar o <b>Packwerk</b>, ferramenta open source que checa as dependências entre esses componentes. A lição: o MVC organiza a apresentação; para organizar o negócio, você precisa de módulos (capítulo 12).</p>",
)}

${dica(
  "Cada framework chama de um jeito",
  "<p>O Django fala em <b>MTV</b> (Model, Template, View): o que ele chama de <i>view</i> faz o papel do controller, e o <i>template</i> é a View. No UIKit da Apple, o controller fica no meio, entre View e Model, bem parecido com um Presenter. E você vai ouvir falar de <b>MVI</b> (Model-View-Intent) e de Redux: variações de mão única, com um único objeto de estado. Não brigue com os nomes. Pergunte: quem recebe a entrada, quem guarda a regra e quem desenha?</p>",
)}

${alerta(
  "Model não é a tabela do banco",
  "<p>No MVC, o Model é tudo o que a aplicação sabe e decide: regras, validações de negócio, cálculos. Se o seu model é só a classe do ORM com campos, a regra vai parar no controller ou na View. O extremo oposto também dói: o lema \"skinny controller, fat model\" (controller magro, model gordo), famoso na comunidade Rails, levado longe demais cria um <code>Usuario</code> que faz tudo. Com regra rica, o Model vira o núcleo do capítulo 6, dividido em casos de uso e entidades.</p>",
)}

${combina([
  [4, "Camadas", "MVC é a camada de apresentação"],
  [6, "Hexagonal", "o controller vira um adaptador de entrada"],
  [7, "Clean Architecture e Onion", "controllers e presenters no anel de fora"],
  [12, "Monólito modular", "um MVC por módulo, como no Shopify"],
  [16, "Micro-frontends", "cada pedaço do front com seus ViewModels"],
  [18, "Cliente-servidor", "MVVM no cliente, MVC no servidor"],
])}

${lembre([
  "MVC, MVP e MVVM separam tela, entrada e regra. Muda a peça do meio e quem atualiza a tela: o Model avisando, o Presenter mandando ou o binding.",
  "Controller, Presenter e ViewModel são borda: traduzem e repassam. A regra de negócio fica no Model ou no núcleo (capítulos 6 e 7).",
  "Siga o seu framework: MVC no back (Rails, Laravel, Spring), MVVM nos fronts declarativos, MVP onde não há binding.",
])}
`;
