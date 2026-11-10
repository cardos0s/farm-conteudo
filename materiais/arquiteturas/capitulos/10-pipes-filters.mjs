// Capítulo 10: Pipes and Filters. Mesma estrutura do capítulo-modelo (06-hexagonal.mjs).

import { codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, engrenagem, linha, navegador, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Cano: tubo entre dois componentes, com a seta de sentido por dentro. */
function cano(x1, x2, cy, itens = []) {
  let s = ret(x1, cy - 11, x2 - x1 - 8, 22, { preench: claro.ciano, hachura: "solid", espessura: 1.6 });
  for (const x of itens) s += ret(x, cy - 7, 14, 14, { preench: claro.laranja, hachura: "solid", espessura: 1.2 });
  s += seta(itens.length ? x2 - 22 : x1 + 4, cy, x2 - 1, cy, { cor: cor.ciano, espessura: 2, ponta: 11 });
  return s;
}

/** Diagrama principal: fonte, três filtros, canos e destino, com o que passa em cada cano. */
function diagrama() {
  semear("pipes-filters-1");
  let s = "";
  const cy = 165;
  // cabeçalhos
  s += txt(58, 36, "fonte", { tam: 17, cor: cor.azul });
  s += txt(58, 58, "(source)", { tam: 15, cor: cor.cinza });
  s += txt(380, 36, "filtros: cada um faz uma coisa só", { tam: 17, cor: cor.laranja });
  s += txt(380, 58, "(filters)", { tam: 15, cor: cor.cinza });
  s += txt(702, 36, "destino", { tam: 17, cor: cor.violeta });
  s += txt(702, 58, "(sink)", { tam: 15, cor: cor.cinza });
  // fonte
  s += banco(12, 118, 92, 96, "CSV", { preench: claro.azul, tam: 16 });
  s += txt(58, 234, "vendas.csv", { tam: 15 });
  // filtros
  const filtros = [
    [150, "ler\nlinhas"],
    [320, "validar"],
    [490, "somar\npor loja"],
  ];
  for (const [x, nome] of filtros) {
    s += bloco(x, 118, 120, 94, "", { preench: claro.amarelo });
    s += txt(x + 60, 148, nome, { tam: 16 });
    s += engrenagem(x + 60, 190, 10);
  }
  // destino
  s += navegador(656, 120, 94, 90, "relatório");
  // canos e o que passa em cada um
  const canos = [
    [104, 150, "linhas\nde texto"],
    [270, 320, "objetos\nVenda"],
    [440, 490, "só vendas\nválidas"],
    [610, 656, "total\npor loja"],
  ];
  for (const [x1, x2, dado] of canos) {
    const meio = (x1 + x2) / 2 - 4;
    s += cano(x1 + 2, x2, cy);
    s += txt(meio, 140, "cano", { tam: 15, cor: cor.ciano });
    s += linha([[meio, 180], [meio, 252]], { cor: cor.cinza, espessura: 1.2, tracejado: true });
    s += txt(meio, 276, dado, { tam: 15, cor: cor.cinza });
  }
  s += txt(380, 336, "um filtro não sabe quem vem antes nem depois: só conhece o formato do dado", { tam: 16, cor: cor.vermelho });
  return quadro(760, 358, s);
}

/** Lote x streaming: no lote, B e C esperam; no streaming, todos trabalham juntos. */
function loteStreaming() {
  semear("pipes-filters-2");
  let s = "";
  const filtro = (x, cy, nome, ativo) =>
    bloco(x, cy - 32, 110, 64, "", { preench: ativo ? claro.amarelo : claro.cinza, tracejado: !ativo, cor: ativo ? cor.tinta : cor.cinza }) +
    txt(x + 55, cy - 10, nome, { tam: 16 }) +
    txt(x + 55, cy + 14, ativo ? "trabalhando" : "esperando", { tam: 15, cor: ativo ? cor.verde : cor.cinza });

  // lote
  const c1 = 84;
  s += txt(20, 24, "lote (batch)", { tam: 17, cor: cor.azul, ancora: "start" });
  s += filtro(20, c1, "filtro A", true);
  s += seta(132, c1, 166, c1, { espessura: 1.8 });
  s += txt(212, 40, "lote inteiro", { tam: 15, cor: cor.laranja });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s += ret(172 + i * 21, c1 - 28 + j * 21, 16, 16, { preench: claro.laranja, hachura: "solid", espessura: 1.2 });
  s += seta(258, c1, 298, c1, { espessura: 1.8 });
  s += filtro(300, c1, "filtro B", false);
  s += seta(412, c1, 446, c1, { espessura: 1.8, cor: cor.cinza });
  s += ret(452, c1 - 29, 79, 58, { tracejado: true, cor: cor.cinza, espessura: 1.4 });
  s += txt(491, c1, "vazio", { tam: 15, cor: cor.cinza });
  s += seta(536, c1, 578, c1, { espessura: 1.8, cor: cor.cinza });
  s += filtro(580, c1, "filtro C", false);
  s += txt(380, 142, "B e C ficam parados até A terminar tudo: o resultado só sai no fim", { tam: 15 });

  s += linha([[20, 170], [740, 170]], { cor: cor.cinza, espessura: 1.1, tracejado: true });

  // streaming
  const c2 = 256;
  s += txt(20, 198, "streaming", { tam: 17, cor: cor.verde, ancora: "start" });
  s += filtro(20, c2, "filtro A", true);
  s += cano(134, 300, c2, [152, 198, 244]);
  s += filtro(300, c2, "filtro B", true);
  s += cano(414, 580, c2, [432, 478, 524]);
  s += filtro(580, c2, "filtro C", true);
  s += txt(380, 314, "cada item segue na hora: os três trabalham juntos e usam pouca memória", { tam: 15 });
  return quadro(760, 334, s);
}

export default `
${resumo(
  "O processamento vira uma linha de montagem: cada <b>filtro</b> recebe dados, faz uma única transformação e entrega o resultado ao próximo por um <b>cano</b> (pipe). Os filtros não se conhecem; só conhecem o formato do dado que entra e que sai.",
  "Num lava-rápido automático, o carro passa por estações: molhar, ensaboar, escovar, secar. Cada uma faz uma coisa só e não sabe o que veio antes. Para passar cera, basta encaixar mais uma estação.",
)}

<p>Pipes and Filters (canos e filtros) é um dos estilos mais antigos da computação. Ficou famoso com o Unix, nos Bell
Labs, no começo dos anos 1970: o caractere <code>|</code> liga a saída de um programa à entrada do próximo, e programas
pequenos que fazem uma coisa só viram ferramentas poderosas quando encadeados. A mesma ideia está hoje nos compiladores,
no ETL, no processamento de vídeo, nos middlewares do Express e nos streams do Node.</p>

${fig(diagrama(), "Os dados entram pela fonte, atravessam filtros independentes ligados por canos e saem no destino. Em cada cano, o dado tem um formato combinado.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Filtro</b>: lê da entrada, transforma e escreve na saída. Pode converter (texto em objeto), enriquecer (calcular o
frete), descartar (só vendas válidas), agrupar, ou dividir e juntar canos (<i>fan-out</i> e <i>fan-in</i>, como o
<code>tee</code> do Unix). Apesar do nome, "filtrar" aqui é transformar de qualquer jeito, não só remover.</li>
<li><b>Cano (pipe)</b>: leva a saída de um filtro até a entrada do próximo. Pode ser um array em memória, um stream, o pipe
do sistema operacional, um arquivo ou uma fila (RabbitMQ, SQS, Kafka). Em memória é rápido; com uma fila, cada filtro
pode rodar em outra máquina.</li>
<li><b>Fonte e destino</b> (<i>source</i> e <i>sink</i>): de onde os dados vêm e para onde vão (arquivo, API, banco, tela).</li>
<li><b>Contrato</b>: o formato do dado em cada cano. No Unix é texto, linha a linha; num programa TypeScript, um tipo como
<code>Venda</code>. Respeitado o contrato, dá para trocar, reordenar e reaproveitar filtros.</li>
<li><b>Regra de ouro</b>: um filtro nunca chama o próximo nem lê o estado dos vizinhos. Quem decide a ordem é quem monta
o pipeline (a linha de comando, o <code>main.ts</code>).</li>
</ul>

<p>O exemplo mais famoso cabe numa linha de terminal. Quais IPs mais causaram erro 500 no servidor?</p>

${codigo(
  `
grep " 500 " acesso.log |  # só as linhas com erro 500
  cut -d' ' -f1 |          # fica só com o IP (1ª coluna)
  sort | uniq -c |         # junta IPs iguais e conta cada um
  sort -rn |               # maior contagem primeiro
  head -5                  # os 5 primeiros`,
  "terminal",
)}

<p>São seis comandos que não sabem uns dos outros: cada um lê texto e escreve texto. Trocar <code>head -5</code> por
<code>head -20</code> ou pôr mais um <code>grep</code> no meio não mexe em nenhum outro.</p>

<h4>Onde você já usa sem perceber</h4>
${tabela(
  ["Onde", "Filtros", "O que passa nos canos"],
  [
    ["Compilador (TypeScript)", "scanner → parser → binder → checker → emitter", "tokens, árvore de sintaxe"],
    ["ETL e dados", "extrair → limpar → transformar → carregar", "arquivos, tabelas, filas"],
    ["Vídeo (FFmpeg)", "decodificar → redimensionar → comprimir", "quadros (frames)"],
    ["Express, Koa", "middlewares: <code>json()</code> → autenticação → rota", "o mesmo <code>req</code>/<code>res</code> (no Koa, <code>ctx</code>)"],
    ["Streams do Node", "<code>Readable</code> → <code>Transform</code> → <code>Writable</code>", "pedaços (chunks)"],
  ],
)}

<h4>Lote ou streaming</h4>

${fig(loteStreaming(), "Mesmos filtros, dois ritmos. No lote, cada etapa espera a anterior acabar. No streaming, os itens fluem um a um e todas as etapas trabalham ao mesmo tempo.")}

<ul>
<li><b>Lote (batch)</b>: cada filtro processa o conjunto inteiro e só então passa adiante. É simples, fácil de reprocessar
e combina com tarefas periódicas (o fechamento do mês). O custo: o resultado só sai no fim, e o lote todo precisa caber
na memória ou no disco.</li>
<li><b>Streaming</b>: cada item (ou pedaço, o <i>chunk</i>) segue assim que fica pronto. Todos os filtros trabalham ao
mesmo tempo, a memória fica quase constante e o primeiro resultado sai em instantes. Por isso
<code>grep erro app.log | head -20</code> roda num arquivo de gigabytes sem carregá-lo na memória.</li>
</ul>

<p>Cuidado com filtros que precisam ver tudo: o <code>sort</code> só escreve a primeira linha depois de ler a última, e
vira um "ponto de lote" no meio do streaming. Rankings e totais têm o mesmo problema; em dados que nunca acabam, a saída
é calcular por janelas de tempo (capítulo 26).</p>

<h4>Backpressure: quando o cano enche</h4>
<p>Se um filtro produz mais rápido do que o próximo consome, os itens se acumulam no cano. Sem controle, a memória cresce
até o processo cair. <b>Backpressure</b> (contrapressão) é o jeito de o filtro lento avisar o anterior: "espera, ainda não
dei conta".</p>
<ul>
<li>No Unix, o pipe tem um buffer pequeno (no Linux, 64 KiB por padrão). Quando ele enche, o sistema pausa o programa que
escreve até o próximo ler.</li>
<li>No Node, <code>writable.write()</code> devolve <code>false</code> quando o buffer interno passa do limite
(<code>highWaterMark</code>), e quem escreve deve esperar o evento <code>"drain"</code>. O <code>stream.pipeline</code>
faz isso por você.</li>
<li>Com filas entre processos, não há freio automático: a fila absorve a diferença. Fila que só cresce pede mais
cópias do filtro seguinte.</li>
</ul>

<h4>Paralelismo e escala por filtro</h4>
<p>Em streaming, as etapas se sobrepõem: enquanto o terceiro filtro trabalha no item 1, o segundo já está no item 2.
Em processos separados (pipe do Unix, workers com filas), isso é paralelismo real; num único processo Node, as etapas
se revezam na mesma thread. A vazão total nunca supera a do filtro mais lento, o gargalo, e a saída é escalar só ele,
com várias cópias lendo da mesma fila. É fácil se o filtro é <b>sem estado</b> (redimensionar uma imagem) e a ordem não
importa, porque várias cópias embaralham a ordem. Se ele guarda estado (somar por loja), divida os dados por chave: as
vendas da loja X caem sempre na mesma cópia, e a ordem dentro de cada chave se mantém.</p>

${quando(
  [
    "O trabalho é uma sequência de transformações: importar planilhas, ETL, relatórios, logs.",
    "Dados grandes ou contínuos, que não cabem na memória.",
    "Mídia: imagens, áudio e vídeo (redimensionar, cortar, comprimir).",
    "Etapas mudam com frequência ou precisam escalar separadas.",
  ],
  [
    "O fluxo tem decisões, voltas e etapas a desfazer: use máquina de estados ou sagas (capítulo 23).",
    "As etapas leem e escrevem o mesmo estado (o mesmo carrinho, o mesmo saldo).",
    "Há ida e volta com o usuário, ou tudo precisa ser uma transação só.",
    "São duas etapas simples: uma função resolve.",
  ],
)}

${medidor({ complexidade: 2, escala: 4, operacao: 2, aprendizado: 2, time: "qualquer tamanho; com filas, cada etapa pode ter um dono" })}

<h3>Como usar na prática</h3>
<p>O relatório do primeiro diagrama em duas versões: funções puras (lote) e streams do Node (arquivos grandes).</p>

${pastas(`
src/
├── importacao/
│   ├── tipos.ts               # o contrato: o formato do dado nos canos
│   ├── filtros/               # um arquivo por filtro; nenhum importa o outro
│   └── pipeline.ts            # a ordem dos filtros, e só isso
└── logs/erros.ts              # versão em streaming (Node streams)
`)}

${codigo(
  `
// tipos.ts: o contrato entre os filtros
export type Venda = { loja: string; valor: number; moeda: "BRL" | "USD" };
export type Filtro<E, S> = (entrada: E) => S;

// filtros/: funções puras, cada uma faz uma coisa só
export const lerCsv: Filtro<string, Venda[]> = (texto) =>
  texto.trim().split("\\n").slice(1).map((linha) => {
    const [loja, valor, moeda] = linha.split(",");
    return { loja, valor: Number(valor), moeda: moeda as Venda["moeda"] };
  });

export const validar: Filtro<Venda[], Venda[]> = (vendas) =>
  vendas.filter((v) => v.loja !== "" && Number.isFinite(v.valor) && v.valor > 0
    && ["BRL", "USD"].includes(v.moeda));`,
  "src/importacao/tipos.ts e filtros/",
)}

${codigo(
  `
// um filtro configurável: recebe a cotação e devolve o filtro
export const emReais = (cotacao: number): Filtro<Venda[], Venda[]> => (vendas) =>
  vendas.map((v) => (v.moeda === "USD" ? { ...v, valor: v.valor * cotacao, moeda: "BRL" } : v));

export const somarPorLoja: Filtro<Venda[], Map<string, number>> = (vendas) => {
  const totais = new Map<string, number>();
  for (const v of vendas) totais.set(v.loja, (totais.get(v.loja) ?? 0) + v.valor);
  return totais;
};

// pipeline.ts: só a ordem dos filtros, e mais nada
export function relatorioDeVendas(csv: string, cotacaoDolar: number) {
  const limpeza: Filtro<Venda[], Venda[]>[] = [validar, emReais(cotacaoDolar)];
  const vendas = limpeza.reduce((dado, filtro) => filtro(dado), lerCsv(csv));
  return somarPorLoja(vendas);
}`,
  "src/importacao/filtros/ e pipeline.ts",
)}

<p>Cada filtro se testa com uma linha, sem arquivo nem banco:
<code>expect(validar([{ loja: "A", valor: -5, moeda: "BRL" }])).toEqual([])</code>.
Uma nova regra de limpeza é uma função nova e um item a mais no array <code>limpeza</code>. Mas essa versão carrega tudo
na memória. Para um log de gigabytes, a ideia vira streams; o Node aceita funções geradoras assíncronas
(<code>async function*</code>) como filtros dentro do <code>pipeline</code>:</p>

${codigo(
  `
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

// filtro 1: junta os pedaços (chunks) e solta linhas completas
async function* linhas(fonte: AsyncIterable<string>) {
  let resto = "";
  for await (const pedaco of fonte) {
    const partes = (resto + pedaco).split("\\n");
    resto = partes.pop() ?? "";
    yield* partes;
  }
  if (resto) yield resto;
}

// filtro 2: deixa passar só as linhas com erro 500
async function* soErros(fonte: AsyncIterable<string>) {
  for await (const linha of fonte) if (linha.includes(" 500 ")) yield linha + "\\n";
}

// a montagem: fonte -> filtros -> destino
await pipeline(
  createReadStream("acesso.log", { encoding: "utf8" }), // fonte (utf8 não corta acentos)
  linhas,
  soErros,
  createGzip(),                                         // filtro pronto: comprime
  createWriteStream("erros.log.gz"),                    // destino
);`,
  "src/logs/erros.ts",
)}

<p>Cada gerador só puxa o próximo pedaço quando termina o anterior, e o <code>pipeline</code> respeita o backpressure
de cada cano; se uma etapa falha, ele fecha as outras e rejeita a promise. O <code>.pipe()</code> também respeita
backpressure, mas não repassa erros e pode deixar streams abertos.</p>

<h4>Passo a passo para adotar</h4>
${passos([
  "Escreva o fluxo como frase de verbos: \"ler → validar → converter → somar\". Muitos \"se... senão...\" indicam que não é pipeline.",
  "Defina o contrato de cada cano e escreva cada filtro como função pura que faz uma coisa só.",
  "Monte a ordem num único lugar (<code>pipeline.ts</code>, o script, a configuração).",
  "Pouco dado: lote com arrays. Arquivo grande: <code>stream.pipeline</code>. Etapas que escalam separadas: filas entre workers.",
  "Decida o destino dos itens ruins e meça a vazão de cada filtro: o mais lento é o que você escala.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Filtros pequenos e testáveis sozinhos", "Cada salto entre processos serializa o dado e soma latência"],
    ["Mudar etapas mexendo só na montagem", "Fluxos com decisões e voltas ficam forçados"],
    ["Reuso do mesmo filtro em vários pipelines", "Estado compartilhado quebra o modelo"],
    ["Dados enormes com pouca memória (streaming)", "Erro no meio do fluxo exige decisão por etapa"],
    ["Paralelismo e escala só da etapa lenta", "O bug aparece no filtro 5, mas nasceu no 2"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Filtro que conhece o vizinho</b>: chama o próximo direto ou depende de um campo "secreto" fora do contrato.</li>
<li><b>Estado compartilhado escondido</b>: filtros usando a mesma variável global, cache ou tabela. Quebra no paralelo.</li>
<li><b>Ignorar o backpressure</b>: ler um arquivo enorme com <code>readFile</code>, ou chamar <code>write()</code> sem olhar
o retorno. A memória explode em produção, nunca no teste com dez linhas.</li>
<li><b>Filtro que não aguenta repetição</b>: com filas, a mesma mensagem pode chegar duas vezes (entrega "pelo menos
uma vez"). Processar a mesma mensagem de novo não pode gravar dois registros nem somar em dobro: o filtro precisa ser idempotente.</li>
<li><b>Granularidade errada</b>: <code>processarTudo</code> não é pipeline; vinte filtros triviais atrás de filas pagam latência a cada salto.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>Imagine um app de delivery em que os restaurantes sobem fotos dos pratos. Cada foto passa por: <b>validar</b> → <b>remover metadados</b> (a foto pode trazer a localização de quem tirou) → <b>redimensionar</b> em três tamanhos → <b>converter</b> para WebP → <b>salvar</b> → <b>avisar</b> o catálogo. Cada etapa é um worker, com filas entre elas. Na véspera de um feriado, só a fila de redimensionar cresce: o time sobe mais cópias desse worker e não toca no resto. Uma foto corrompida vai para uma fila de rejeitados (<i>dead letter queue</i>) em vez de travar a linha.</p>",
)}

${dica(
  "Middleware do Express é pipeline, com duas diferenças",
  "<p>Cada <code>app.use()</code> encaixa um filtro: <code>express.json()</code> transforma o corpo em objeto, a autenticação coloca <code>req.usuario</code> e a rota responde. Só que todos mexem no <b>mesmo</b> <code>req</code>/<code>res</code> (estado compartilhado), e qualquer um pode encerrar a corrida sem chamar <code>next()</code>. Por isso a ordem importa: autenticação registrada depois da rota não protege nada. E, como cada middleware chama o próximo, o desenho fica mais perto do padrão <i>Chain of Responsibility</i> (cadeia de responsabilidade) do que de filtros puros.</p>",
)}

${combina([
  [26, "Arquiteturas de dados", "ETL e streaming em grande escala"],
  [20, "Orientada a eventos", "filas como canos; lá, porém, quem publica não sabe quem consome"],
  [15, "Serverless", "cada filtro uma função disparada pela etapa anterior"],
  [6, "Hexagonal", "o pipeline no núcleo; fonte e destino como adaptadores"],
])}

${lembre([
  "Cada filtro faz uma transformação, não conhece os vizinhos e só conhece o formato do dado no cano.",
  "Streaming com backpressure processa dados enormes com pouca memória; escale o filtro mais lento.",
  "Brilha em fluxos lineares de transformação; decisões e estado compartilhado pedem outra arquitetura.",
])}
`;
