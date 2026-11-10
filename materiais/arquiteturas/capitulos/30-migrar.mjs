// Capítulo 30: Como migrar sem parar o sistema. Capítulo da parte V (não é de uma arquitetura): as técnicas
// de migração incremental (strangler fig, branch by abstraction, execução em paralelo, lançamento escuro,
// canário e flags), o roteiro para extrair um módulo, a separação do banco, a camada anticorrupção e as métricas.

import { alerta, codigo, combina, fig, lembre, passos, pratica, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, linha, navegador, pessoa, quadro, semear, seta, txt, xis } from "../desenho.mjs";

/* ------------------------------------------------------------------ diagramas */

/** Diagrama 1: o strangler fig em três momentos (só o proxy, uma rota migrada, legado desligado). */
function estrangulamento() {
  semear("migrar-1");
  let s = "";
  const etapas = [
    { titulo: "1. só o proxy", legado: ["/catalogo", "/pedidos", "/pagamento"], novo: [], nota: "nada muda para o usuário" },
    { titulo: "2. uma rota migrada", legado: ["/pedidos", "/pagamento"], novo: ["/catalogo"], nota: "o proxy desvia /catalogo" },
    { titulo: "3. legado desligado", legado: [], novo: ["/catalogo", "/pedidos", "/pagamento"], nota: "tudo no sistema novo" },
  ];
  // separadores entre os momentos
  for (const x of [253, 507]) s += linha([[x, 14], [x, 392]], { cor: cor.cinza, tracejado: true, espessura: 1.2 });
  etapas.forEach((e, i) => {
    const px = i * 254 + 4;
    const cx = px + 123;
    s += txt(cx, 24, e.titulo, { tam: 17 });
    s += navegador(cx - 48, 44, 96, 58, "usuários");
    s += seta(cx, 106, cx, 136, { espessura: 2 });
    s += bloco(cx - 70, 140, 140, 44, "proxy", { preench: claro.amarelo, tam: 17 });
    // legado (esquerda) e novo (direita)
    const lx = px + 12, nx = px + 129, by = 252, bw = 106, bh = 112;
    const legadoVivo = e.legado.length > 0, novoVivo = e.novo.length > 0;
    s += bloco(lx, by, bw, bh, "", { preench: legadoVivo ? claro.laranja : undefined, tracejado: !legadoVivo, cor: legadoVivo ? cor.tinta : cor.cinza });
    s += bloco(nx, by, bw, bh, "", { preench: novoVivo ? claro.verde : undefined, tracejado: !novoVivo, cor: novoVivo ? cor.tinta : cor.cinza });
    s += txt(lx + bw / 2, by + 20, "legado", { tam: 16, cor: legadoVivo ? cor.tinta : cor.cinza });
    s += txt(nx + bw / 2, by + 20, "novo", { tam: 16, cor: novoVivo ? cor.tinta : cor.cinza });
    e.legado.forEach((r, k) => (s += txt(lx + bw / 2, by + 50 + k * 21, r, { tam: 15 })));
    e.novo.forEach((r, k) => (s += txt(nx + bw / 2, by + 50 + k * 21, r, { tam: 15 })));
    if (!novoVivo) s += txt(nx + bw / 2, by + 66, "em\nconstrução", { tam: 15, cor: cor.cinza });
    if (!legadoVivo) s += xis(lx + bw / 2, by + 56, 26) + txt(lx + bw / 2, by + 90, "desligado", { tam: 15, cor: cor.cinza });
    // tráfego: seta grossa para quem atende
    if (legadoVivo) s += seta(cx - 30, 186, lx + bw / 2, by - 4, { espessura: novoVivo ? 2 : 2.8, cor: cor.laranja });
    if (novoVivo) s += seta(cx + 30, 186, nx + bw / 2, by - 4, { espessura: legadoVivo ? 2 : 2.8, cor: cor.verde });
    s += txt(cx, 392, e.nota, { tam: 15, cor: cor.azul });
  });
  return quadro(760, 410, s);
}

/** Diagrama 2: execução em paralelo. O cliente recebe a resposta do legado; o novo só é comparado. */
function emParalelo() {
  semear("migrar-2");
  let s = "";
  s += pessoa(55, 152, { rotulo: "cliente" });
  s += bloco(112, 145, 132, 56, "roteador", { preench: claro.amarelo, tam: 17 });
  s += seta(78, 177, 110, 175, { espessura: 2 });
  // legado em cima, novo embaixo
  s += bloco(330, 52, 170, 56, "legado", { preench: claro.laranja });
  s += bloco(330, 238, 170, 56, "novo", { preench: claro.verde });
  s += linha([[244, 162], [286, 162], [286, 80]], { espessura: 2 }) + seta(286, 80, 328, 80, { espessura: 2 });
  s += txt(278, 120, "requisição", { tam: 15, ancora: "end" });
  s += linha([[244, 186], [286, 186], [286, 266]], { espessura: 2, tracejado: true, cor: cor.verde }) + seta(286, 266, 328, 266, { espessura: 2, tracejado: true, cor: cor.verde });
  s += txt(278, 228, "cópia", { tam: 15, ancora: "end", cor: cor.verde });
  // a resposta do legado volta ao cliente por cima
  s += linha([[415, 50], [415, 28], [55, 28]], { espessura: 2.2, cor: cor.azul }) + seta(55, 28, 55, 136, { espessura: 2.2, cor: cor.azul });
  s += txt(235, 14, "resposta: só a do legado", { tam: 15, cor: cor.azul });
  // comparador
  s += bloco(578, 143, 158, 60, "comparador", { preench: claro.azul, tam: 17 });
  s += linha([[502, 80], [657, 80]], { espessura: 1.8 }) + seta(657, 80, 657, 141, { espessura: 1.8 });
  s += txt(580, 64, "resultado antigo", { tam: 15 });
  s += linha([[502, 266], [657, 266]], { espessura: 1.8, tracejado: true, cor: cor.verde }) + seta(657, 266, 657, 205, { espessura: 1.8, tracejado: true, cor: cor.verde });
  s += txt(580, 284, "resultado novo", { tam: 15, cor: cor.verde });
  s += seta(576, 173, 512, 173, { espessura: 1.8, cor: cor.vermelho });
  s += txt(420, 173, "cada diferença\nvira um caso\npara investigar", { tam: 15, cor: cor.vermelho });
  s += txt(380, 328, "o novo é testado com tráfego real, mas nenhum cliente vê o resultado dele", { tam: 15, cor: cor.cinza });
  return quadro(760, 344, s);
}

/** Diagrama 3: banco compartilhado (antes) e dono único com cópia sincronizada (durante). */
function donoUnico() {
  semear("migrar-3");
  let s = "";
  // antes
  s += txt(125, 22, "antes: banco compartilhado", { tam: 16 });
  s += bloco(12, 52, 108, 54, "legado", { preench: claro.laranja, tam: 16 });
  s += bloco(132, 52, 108, 54, "clientes", { preench: claro.verde, tam: 16 });
  s += banco(76, 202, 100, 96, "banco", { preench: claro.violeta });
  s += txt(126, 318, "tabela clientes", { tam: 15, cor: cor.cinza });
  s += seta(66, 108, 100, 198, { cor: cor.vermelho, espessura: 2, rotulo: "escreve", dx: -34, dy: 0 });
  s += seta(186, 108, 152, 198, { cor: cor.vermelho, espessura: 2, rotulo: "escreve", dx: 34, dy: 0 });
  s += txt(126, 364, "quem é o dono?", { tam: 16, cor: cor.vermelho });
  s += linha([[264, 14], [264, 380]], { cor: cor.cinza, tracejado: true, espessura: 1.2 });
  // durante
  s += txt(517, 22, "durante: um dono só", { tam: 16 });
  s += bloco(290, 52, 124, 54, "legado", { preench: claro.laranja, tam: 16 });
  s += bloco(570, 52, 176, 54, "serviço de clientes", { preench: claro.verde, tam: 16 });
  s += seta(416, 79, 568, 79, { espessura: 2, rotulo: "escreve via API", dy: -16 });
  s += banco(302, 202, 100, 96, "cópia", { preench: claro.cinza });
  s += txt(352, 318, "só leitura (visão)", { tam: 15, cor: cor.cinza });
  s += banco(608, 202, 100, 96, "clientes", { preench: claro.violeta });
  s += txt(658, 318, "dono único", { tam: 15, cor: cor.verde });
  s += seta(658, 108, 658, 198, { espessura: 2, rotulo: "grava", dx: 30, dy: 0 });
  s += seta(352, 108, 352, 198, { espessura: 2, rotulo: "lê", dx: -18, dy: 0 });
  s += seta(605, 252, 406, 252, { espessura: 2, tracejado: true, cor: cor.azul, rotulo: "sincroniza\n(eventos ou CDC)", dy: -26 });
  s += txt(517, 364, "toda escrita passa pelo dono; os outros leem cópias", { tam: 16, cor: cor.azul });
  return quadro(760, 384, s);
}

/* ------------------------------------------------------------------ texto */

export default `
${resumo(
  "Migrar sem parar é trocar o sistema por partes, com o antigo funcionando o tempo todo: cada pedaço novo entra em produção pequeno, é comparado com o antigo e pode ser desligado em minutos se algo der errado.",
  "Um restaurante que troca a cozinha sem fechar as portas. Instala o fogão novo ao lado do velho, passa um prato de cada vez para ele e só desmonta o velho quando nenhum prato depende mais dele. Os clientes continuam jantando durante a obra toda.",
)}

<p>Todo sistema que dá certo envelhece: o framework fica sem suporte, o banco não aguenta, o monólito virou bola de lama
(capítulo 31). A tentação é parar e reescrever do zero, e quase sempre é a pior opção: enquanto a versão nova não fica
pronta, a antiga continua mudando, e a nova corre atrás de um alvo que se move. Este capítulo mostra o caminho oposto, a
<b>migração incremental</b>: passos pequenos, cada um medido e reversível. As técnicas servem para extrair serviços, mas
também para trocar framework, banco ou provedor de pagamento. Só comece por uma dor concreta e medida, nunca por moda.</p>

<h3>Strangler Fig: o legado vai encolhendo</h3>
<p>Martin Fowler deu o nome em 2004, inspirado nas figueiras-estranguladoras: a semente nasce no alto de outra árvore, solta
raízes até o chão e, com os anos, envolve a hospedeira até tomar o lugar dela. No software, o sistema novo cresce em volta
do antigo, uma funcionalidade por vez, até o antigo poder ser desligado.</p>

<p>O truque é um <b>ponto de interceptação</b> na frente do legado: um proxy reverso, um API gateway ou as regras de um
load balancer (nginx, Envoy, Kong ou o gateway do provedor de nuvem). Os clientes falam só com o proxy, e só ele sabe para
onde vai cada rota. Vale também para filas (um roteador repassa cada tipo de mensagem) e para telas (as páginas
reescritas vêm do app novo, capítulo 16).</p>

${passos([
  "<b>Proxy na frente, sem mudar nada.</b> Todo o tráfego ainda vai para o legado. Meça erros e latência: essa é a sua linha de base.",
  "<b>Escolha a primeira fatia</b>: pequena, com poucas dependências e baixo risco (catálogo antes de pagamento). Ela serve para aprender o caminho, não para ganhar a guerra.",
  "<b>Construa a fatia no sistema novo</b> e coloque em produção ainda sem tráfego (lançamento escuro, mais adiante).",
  "<b>Desvie aos poucos</b>: 1% dos usuários, depois 10%, 50% e 100%. Voltar atrás é mudar uma linha no proxy.",
  "<b>Apague a fatia do legado e repita.</b> Quando não sobrar rota, o legado é desligado. Sem apagar, você mantém dois sistemas para sempre.",
])}

${fig(estrangulamento(), "O mesmo sistema em três momentos. O usuário fala sempre com o proxy; o que muda é para onde ele manda cada rota.", "grande")}

<h4>O proxy em código</h4>
${codigo(
  `
// proxy/servidor.ts: o legado atende tudo, menos o que já foi migrado
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const LEGADO = "http://legado:8080", CATALOGO = "http://catalogo:3000";

// prefixo da rota -> % dos usuários que vão para o serviço novo (busca: canário)
const migradas: Record<string, number> = { "/catalogo": 100, "/busca": 10 };

// o mesmo usuário cai sempre no mesmo lado (número de 0 a 99)
const balde = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 100;

export function destino(caminho: string, usuario: string): string {
  const prefixo = Object.keys(migradas).find((p) => caminho === p || caminho.startsWith(p + "/"));
  if (!prefixo) return LEGADO; // o que não foi migrado segue igual
  return balde(usuario) < migradas[prefixo] ? CATALOGO : LEGADO;
}

const app = express();
app.use(createProxyMiddleware({
  target: LEGADO,
  changeOrigin: true,
  router: (req) => {
    const usuario = String(req.headers["x-usuario-id"] ?? ""); // em produção: cookie ou token
    return destino((req.url ?? "/").split("?")[0], usuario);
  },
}));
app.listen(80);`,
  "proxy/servidor.ts",
)}

<p>Três detalhes importam. O padrão é sempre o legado: uma rota esquecida não quebra. O canário é por usuário, não por
requisição: a mesma pessoa não pula de um sistema para o outro a cada clique. E reverter é trocar <code>100</code> por
<code>0</code>. Em produção, esse mapa costuma vir de um serviço de configuração ou de feature flags, para mudar sem novo
deploy.</p>

<h3>Branch by abstraction: trocar por dentro</h3>
<p>O proxy só enxerga o que passa pela rede. Quando a peça a trocar está dentro do código (um cálculo de frete, o ORM, a
biblioteca de PDF), use <b>branch by abstraction</b> (ramificar por abstração). Apesar do nome, não tem a ver com branch do
Git; a ideia é o contrário: trabalhar no branch principal, em vez de manter um branch de meses que nunca consegue fazer merge.</p>
<ol>
<li>Crie uma interface na frente do código antigo e faça todo mundo chamar a interface. Nada muda de comportamento.</li>
<li>Escreva a implementação nova atrás da mesma interface, aos poucos, indo para produção desligada.</li>
<li>Troque por uma feature flag (por cliente ou por porcentagem) e compare os resultados.</li>
<li>Com a nova em 100% e estável, apague a antiga e a flag.</li>
</ol>

${codigo(
  `
// 1. a abstração: o resto do sistema só conhece isto
export interface CalculadoraDeFrete {
  calcular(pedido: Pedido): Promise<number>; // em centavos
}
// 2. FreteLegado (o código de sempre, embrulhado) e FreteNovo implementam a interface,
//    e uma flag por cliente decide qual delas (ou a comparação abaixo) cada pedido usa

// 3. execução em paralelo: responde com o antigo e compara com o novo
export class FreteComparado implements CalculadoraDeFrete {
  constructor(private antigo: CalculadoraDeFrete, private novo: CalculadoraDeFrete) {}

  async calcular(pedido: Pedido): Promise<number> {
    const valor = await this.antigo.calcular(pedido); // é este que o cliente recebe
    this.novo.calcular(pedido) // sem await: o novo não pode deixar o checkout lento
      .then((v) => {
        if (v !== valor) log.warn("frete divergente", { pedido: pedido.id, valor, novo: v });
      })
      .catch((erro) => log.error("frete novo falhou", { pedido: pedido.id, erro }));
    return valor;
  }
}`,
  "src/frete/frete.ts",
)}

<h3>Execução em paralelo: provar antes de trocar</h3>
<p>Quando o resultado precisa ser idêntico (preço, frete, imposto, permissão, saldo), testar com casos inventados não basta.
Na <b>execução em paralelo</b> (<i>parallel run</i>), o antigo e o novo recebem a mesma entrada de produção, o cliente recebe
só a resposta do antigo e um comparador registra cada diferença. Assim aparecem os casos que ninguém lembraria de testar (o
CEP de zona rural, o cupom antigo que ainda vale) sem nenhum cliente ver o erro. A classe <code>FreteComparado</code> faz
isso dentro do código; o mesmo vale no proxy, para serviços inteiros.</p>

${fig(emParalelo(), "O roteador manda a requisição ao legado e uma cópia ao novo. Só a resposta do legado volta ao cliente; as duas são comparadas e cada diferença vira um caso para investigar.")}

<ul>
<li><b>Efeitos colaterais</b>: o novo não pode cobrar o cartão, mandar e-mail nem gravar no banco de verdade. Rode-o só com
leitura ou com adaptadores de saída falsos (capítulo 6).</li>
<li><b>Ruído</b>: datas, ids gerados e ordem de listas mudam a cada execução. Normalize antes de comparar, senão o relatório
vira só alarme falso.</li>
<li><b>Custo e prazo</b>: é processamento em dobro. Compare uma amostra das requisições e combine antes o critério de saída
(por exemplo, duas semanas sem nenhuma diferença sem explicação).</li>
</ul>

<h3>Lançamento escuro, canário e feature flags</h3>
<p>Essas três técnicas separam duas coisas que costumam vir grudadas: <b>colocar o código em produção</b> (deploy) e
<b>mostrar para o usuário</b> (release).</p>
<ul>
<li><b>Lançamento escuro</b> (<i>dark launch</i>): o código novo já roda em produção com tráfego real ou uma cópia dele, mas
ninguém vê o resultado. Testa carga, conexões e configuração antes de valer.</li>
<li><b>Canário</b> (<i>canary release</i>): uma fatia pequena e real de usuários usa a versão nova (1%, 5%, 25%, 100%). O
nome vem dos canários que os mineiros levavam para a mina: se o pássaro passava mal, era hora de sair.</li>
<li><b>Feature flag</b> (interruptor de funcionalidade): um <code>if</code> que lê uma configuração em tempo de execução e
liga ou desliga sem deploy, por cliente ou porcentagem (Unleash, LaunchDarkly e o padrão OpenFeature ajudam). Flag de
migração tem data para morrer: apague junto com o código antigo.</li>
</ul>

${tabela(
  ["Técnica", "Use para trocar", "O usuário vê o novo?", "Como voltar atrás"],
  [
    ["<b>Strangler Fig</b>", "Funcionalidades que passam pela rede (rotas, telas, mensagens)", "Sim, rota por rota", "O proxy devolve a rota ao legado"],
    ["<b>Branch by abstraction</b>", "Uma peça dentro do código (biblioteca, cálculo, acesso a dados)", "Depende da flag", "Desliga a flag"],
    ["<b>Execução em paralelo</b>", "Lógica que precisa dar o mesmo resultado", "Não", "Nada a fazer: o antigo segue respondendo"],
    ["<b>Lançamento escuro</b>", "Infraestrutura, carga e integrações", "Não", "Corta o tráfego de cópia"],
    ["<b>Canário</b>", "Qualquer mudança arriscada", "Sim, uma fatia pequena", "Volta a porcentagem para 0"],
  ],
)}

<h3>Extrair um módulo para serviço, passo a passo</h3>
<p>Juntando as peças, este é o roteiro seguro para tirar, por exemplo, o módulo de clientes de um monólito:</p>
${passos([
  "<b>Escolha pelo motivo.</b> Bons candidatos: um módulo que muda muito, que precisa escalar sozinho ou que outro time vai assumir. Entre eles, o que tem menos dependências.",
  "<b>Modularize dentro do monólito primeiro</b> (capítulo 12): o resto do código fala com clientes só por uma interface pública, e ninguém mais faz <code>join</code> nas tabelas dele. Se isso é difícil dentro de um processo, pela rede será pior.",
  "<b>Escreva testes de contrato</b> para essa interface e suba o serviço novo implementando a mesma interface (no começo, lendo uma réplica do banco do monólito).",
  "<b>Troque a implementação interna por um cliente HTTP</b> (branch by abstraction), atrás de uma flag. Rode em paralelo e depois como canário.",
  "<b>Mova os dados</b> para o banco do serviço (próxima seção). Costuma ser a etapa mais longa.",
  "<b>Apague o módulo do monólito</b> e a flag, e registre a decisão num ADR (capítulo 32).",
])}

<h3>Decompor o banco compartilhado</h3>
<p>Mover código é a parte fácil. O difícil é o banco: no monólito, qualquer parte lê e escreve em qualquer tabela. Se o
serviço novo e o legado continuarem escrevendo nas mesmas tabelas, nenhum dos dois muda o esquema sem combinar com o outro,
e você ganhou um monólito distribuído (capítulo 31). A regra que guia tudo é o <b>dono único</b>: cada tabela tem um, e só
um, sistema que escreve nela.</p>

${fig(donoUnico(), "À esquerda, dois sistemas escrevendo na mesma tabela. À direita, o serviço de clientes é o único dono: o legado escreve pela API dele e lê uma cópia sincronizada.")}

<ul>
<li><b>Mapeie</b> quem lê e quem escreve cada tabela (logs do banco e busca no código). As surpresas aparecem aqui: o
relatório noturno, o script do financeiro, a integração esquecida.</li>
<li><b>Escritas</b> passam a ir pela API do dono. Se o legado grava cliente em dez lugares, cada um vira uma chamada.</li>
<li><b>Leituras</b> do legado vão para uma <b>cópia</b>, sincronizada por eventos ou por <b>CDC</b> (<i>change data
capture</i>, captura de mudanças: uma ferramenta como o Debezium lê o log de alterações do banco e publica cada mudança).
Uma <b>visão</b> (<i>view</i>) com o nome e as colunas da tabela antiga faz o código legado ler a cópia sem perceber.</li>
<li><b>Joins</b> entre donos diferentes viram composição na API ou um modelo só de leitura (capítulo 21).</li>
<li><b>Corte</b>: quando ninguém mais lê a cópia, apague a sincronização e a tabela velha.</li>
</ul>

${alerta(
  "Cuidado com a escrita dupla",
  "<p>Parece simples: o código grava no banco antigo e no novo, um depois do outro. Mas, se a segunda escrita falhar (rede, timeout, deploy no meio), os bancos divergem e ninguém fica sabendo. Prefira CDC ou o padrão outbox (capítulo 20): grava num lugar só e a mudança é propagada de forma confiável.</p>",
)}

<h3>Camada anticorrupção</h3>
<p>Durante meses, o sistema novo vai conversar com o legado, e o risco é o modelo velho vazar para o novo: colunas como
<code>ST_CLI = 'A'</code>, datas em texto, códigos com zeros à esquerda. A <b>camada anticorrupção</b> (<i>anticorruption
layer</i>, termo do livro <i>Domain-Driven Design</i>, de Eric Evans) é um tradutor na fronteira. Ele recebe
<code>{ CD_CLI: "000123", ST_CLI: "A" }</code> do legado e entrega <code>{ id: "123", ativo: true }</code> ao sistema
novo, que só enxerga os próprios conceitos. Toda a esquisitice do legado fica presa num lugar só. Na prática, é um adaptador
de saída da arquitetura hexagonal (capítulo 6), e é apagado junto com o legado.</p>

<h3>Como saber se a migração está funcionando</h3>
<p>Migração sem número vira opinião. Meça o legado <b>antes</b> de começar (a linha de base) e acompanhe o legado e o novo
lado a lado, no mesmo painel.</p>

${tabela(
  ["Métrica", "O que mostra", "Sinal de alerta"],
  [
    ["Taxa de erro, novo x legado", "Se o novo está pior que o antigo", "Erro do novo acima do legado na mesma rota"],
    ["Latência p95 e p99 (o tempo que 95% e 99% das requisições não ultrapassam)", "A experiência dos usuários mais lentos", "p99 subindo a cada etapa: cada salto na rede soma"],
    ["Divergências na execução em paralelo", "Se o novo calcula igual", "Diferenças sem explicação que não param de aparecer"],
    ["% do tráfego no novo", "O progresso de verdade", "Parado no mesmo número há semanas"],
    ["Rotas e tabelas ainda no legado", "Quanto falta", "A lista não diminui, ou cresce"],
  ],
)}

<h4>Checklist antes de mandar mais tráfego para o novo</h4>
<ul>
<li>A linha de base do legado está medida: erros, latência e volume por rota.</li>
<li>Voltar atrás leva minutos e já foi testado de verdade, não só no papel.</li>
<li>Os dados dos dois lados batem, e um script confere contagens e totais todo dia.</li>
<li>O critério para avançar está combinado (por exemplo, uma semana com erro e p99 iguais aos do legado).</li>
<li>Funcionalidade nova entra só no sistema novo. Se o legado continua ganhando novidades, a migração nunca alcança.</li>
</ul>

<h3>Erros comuns</h3>
<ul>
<li><b>Reescrever tudo de uma vez</b> (<i>big bang rewrite</i>): o time some por um ano, o legado continua mudando, a versão
nova nunca alcança e, no dia da virada, aparecem as regras que só existiam no código antigo. Se a virada dá errado, não há
volta fácil.</li>
<li><b>Migração que nunca termina</b>: as fatias fáceis migram, as difíceis ficam, e o legado vive para sempre com parte do
tráfego. Agora são dois sistemas para manter. Planeje o fim e apague código a cada etapa.</li>
<li><b>Mover o código e deixar o banco compartilhado</b>: o serviço novo continua preso ao esquema do legado.</li>
<li><b>Trocar tecnologia e comportamento ao mesmo tempo</b>: se o novo também "aproveita para corrigir" regras, a execução em
paralelo mostra diferença em tudo e ninguém sabe o que é bug. Primeiro igual, depois melhor.</li>
<li><b>Começar pelo coração</b>: a primeira fatia deve ensinar o caminho (deploy, observabilidade, reversão) com pouco risco.
Pagamento fica para quando o caminho estiver testado.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine um app de entrega com um monólito PHP de oito anos e um banco MySQL usado por tudo. O objetivo é tirar o <b>cardápio</b>, que muda o tempo todo e sofre nos horários de pico. Primeiro, um gateway passa a ficar na frente do monólito, sem mudar nada, e o time mede erros e latência por rota. Depois, o serviço novo sobe lendo uma réplica do MySQL e roda em paralelo nas leituras; o comparador acha diferenças em pratos com adicionais, corrigidas antes de qualquer cliente ver. Então vem o canário de <code>GET /cardapio</code>; um pico de p99 nos 50% faz o time voltar para 10% até ajustar o cache. Por fim, os restaurantes passam a editar o cardápio pela API do serviço, o monólito lê uma cópia sincronizada por CDC e a tabela antiga é apagada. Em nenhum momento houve uma \"noite da virada\".</p>",
)}

${combina([
  [12, "Monólito modular", "o passo antes de extrair serviços"],
  [14, "Microsserviços", "o destino mais comum das extrações"],
  [6, "Hexagonal", "a camada anticorrupção é um adaptador"],
  [20, "Orientada a eventos", "outbox e eventos para sincronizar dados"],
  [31, "Anti-padrões", "big bang rewrite e monólito distribuído"],
  [32, "ADRs", "cada etapa da migração vira uma decisão registrada"],
])}

${lembre([
  "Não reescreva tudo de uma vez: troque por fatias pequenas, cada uma medida e reversível em minutos.",
  "Strangler fig para o que passa pela rede, branch by abstraction para o que está no código, execução em paralelo para provar que o novo calcula igual.",
  "Os dados decidem: cada tabela com um dono único. E a migração só termina quando o código antigo é apagado.",
])}
`;
