// Reel "Design patterns na era da IA" (2160x3840, HDR HLG como a gravação do iPhone).
// Abre com o gancho gravado (IMG_3755, sem alteração de resolução nem de cor fora do título) e segue no canvas:
// contexto do Gang of Four, os 9 padrões (3 por categoria), a ponte com a IA e o fechamento.
//
// Tempo de projeto x tempo real: as cenas foram desenhadas num tempo "de projeto"; ANCORAS prende
// instantes do projeto às palavras da narração (como no Reel do Pix) e o mapa de tempo estica ou
// encolhe o canvas para acompanhar a fala.

export const FPS = 30;

/**
 * Trecho usado da gravação do gancho (s do arquivo original): de logo antes de "Quais" (1,36 s)
 * até logo depois de "IA?" (5,0 s), sem os silêncios.
 */
export const GANCHO = { arquivo: "aulas/patterns/gancho.mov", de: 1.3, ate: 5.15 };
/**
 * Trecho em que a mão passa na frente da lente (s do arquivo original): a imagem é coberta pelo
 * cartão "DESIGN PATTERNS" (Gancho.tsx) e a voz continua.
 */
export const CARTAO = { de: 2.25, ate: 3.95 };
/** Duração do gancho no vídeo final (s). */
export const INTRO = GANCHO.ate - GANCHO.de;
/** Fim do canvas no tempo de projeto (s). */
export const FIM = 155;

/** A narração começa este tanto depois do corte do gancho para o canvas (s). */
export const ATRASO_VOZ = 0.3;

/**
 * [instante de projeto do canvas, segundo da narração em que ele deve cair]. Tempos da narração em
 * remotion/aulas/patterns/edicao/narracao.json (transcrita por scripts/aulas/transcrever_narracao.py).
 */
const ANCORAS: [number, number][] = [
  [0, -ATRASO_VOZ],
  [0.3, 0.5], // "Singleton"
  [4.0, 4.96], // "ainda fazem sentido"
  [5.2, 6.3], // "na era da"
  [7.6, 8.12], // "A resposta"
  [8.0, 9.36], // "sim"
  [9.5, 9.78], // "e provavelmente"
  [9.6, 10.3],
  [13.0, 13.16], // "Em 1994"
  [13.3, 13.7],
  [14.6, 15.46], // "Gang of Four"
  [17.0, 19.96], // "catalogando 23 padrões"
  [20.2, 24.36], // "criacionais"
  [20.8, 25.42], // "estruturais"
  [21.5, 26.44], // "comportamentais"
  [24.6, 27.46], // "Mas como esses padrões…"
  [29.0, 31.2], // "Padrões criacionais"
  [29.6, 32.84], // "Responsáveis pela criação"
  [33.0, 36.82], // "Singleton"
  [34.0, 38.5], // "compartilhar"
  [35.0, 40.34], // "uma única instância"
  [35.8, 42.4], // "thread-safe"
  [37.0, 43.4], // "evitando"
  [38.4, 44.6],
  [42.0, 46.02], // "Factory Method"
  [43.2, 48.2], // "instanciar"
  [44.8, 49.4], // "provedores"
  [46.8, 50.6], // "sem acoplar"
  [48.8, 52.6], // "implementações concretas"
  [50.0, 54.0], // "Builder"
  [51.4, 56.3], // "agentes complexos"
  [52.2, 57.64], // "ferramentas"
  [53.0, 58.56], // "instruções"
  [53.8, 60.3], // "memória"
  [54.6, 61.68], // "segurança"
  [55.6, 62.8], // "incremental"
  [58.0, 63.7], // "Padrões estruturais"
  [58.6, 65.48], // "Responsáveis pela composição"
  [62.0, 69.74], // "Adapter"
  [62.6, 70.58], // "Cada provedor"
  [64.2, 73.9], // "Com Adapter"
  [65.4, 76.0], // "interface padronizada"
  [66.5, 77.54], // "independentemente"
  [71.0, 79.58], // "Decorator"
  [72.4, 81.84], // "observabilidade"
  [73.3, 83.16], // "cache"
  [74.2, 83.84], // "contabilização de tokens"
  [75.1, 85.36], // "validações"
  [76.1, 86.12], // "sem modificar"
  [78.0, 88.78], // "Facade"
  [78.8, 90.5], // "complexidade"
  [81.3, 93.38], // "você oferece"
  [81.6, 94.26], // "interface simplificada"
  [83.2, 96.0], // "aplicação consumir"
  [86.0, 97.2], // "Padrões comportamentais"
  [86.6, 99.12], // "Responsáveis pela comunicação"
  [90.0, 103.14], // "Strategy"
  [90.6, 104.82], // "alternar"
  [91.4, 105.58], // "diferentes modelos"
  [93.0, 108.38], // "durante a execução"
  [94.4, 109.54], // "considerando"
  [94.6, 110.2], // "custo"
  [95.0, 110.96], // "latência"
  [95.4, 111.74], // "complexidade"
  [96.0, 112.0], // "da tarefa"
  [98.0, 113.54], // "Observer"
  [98.6, 114.6], // "Quando um agente"
  [99.8, 115.12], // "executa"
  [101.2, 116.5], // "outros componentes"
  [101.9, 117.84], // "notificados"
  [102.5, 118.9], // "eventos"
  [103.1, 119.64], // "resultados"
  [104.0, 121.3], // "estado"
  [106.0, 122.1], // "Chain of Responsibility"
  [107.4, 125.84], // "handlers"
  [108.6, 127.32], // "segurança"
  [109.3, 128.18], // "validação"
  [110.0, 129.12], // "processamento"
  [110.4, 129.7],
  [112.3, 130.82], // "interrompida"
  [113.0, 132.3], // "encaminhada"
  [115.0, 132.5], // "E o mais interessante"
  [119.2, 137.6], // "podem ser implementados"
  [120.0, 139.2], // "combinando conceitos"
  [124.5, 142.6],
  [125.8, 143.2], // "tradicional"
  [127.0, 143.78], // "Antes de estudar"
  [127.3, 145.4], // "multiagentes"
  [127.9, 146.6], // "RAG"
  [128.5, 147.14], // "frameworks"
  [129.1, 149.3], // "qualquer tecnologia"
  [131.6, 151.66], // "estude os"
  [132.2, 152.12], // "fundamentos"
  [137.0, 153.96], // "Os modelos mudam"
  [137.7, 154.92],
  [138.2, 155.44], // "Os frameworks mudam"
  [138.9, 156.14],
  [140.2, 156.82], // "Mas os princípios"
  [141.2, 159.62], // "extensível"
  [141.7, 160.6], // "desacoplado"
  [142.2, 161.56], // "seguro"
  [142.7, 162.2], // "escalável"
  [146.2, 164.58], // "A era da inteligência artificial"
  [147.2, 167.4], // "fundamentos obsoletos"
  [149.6, 168.82], // "Tornou a falta deles"
  [150.6, 170.92], // "mais evidente"
  [FIM, 174.0],
];

function porPartes(pares: [number, number][], x: number): number {
  let i = 1;
  while (i < pares.length - 1 && x > pares[i][0]) i++;
  const [x0, y0] = pares[i - 1];
  const [x1, y1] = pares[i];
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

const PARA_REAL: [number, number][] = ANCORAS.map(([p, voz]) => [p, voz + ATRASO_VOZ]);
const PARA_PROJETO: [number, number][] = PARA_REAL.map(([p, r]) => [r, p]);

/** Segundo real do canvas (a partir do fim do gancho) em que um instante de projeto aparece. */
export const real = (tProjeto: number) => porPartes(PARA_REAL, tProjeto);
/** Instante de projeto que aparece num segundo real do canvas. */
export const projeto = (tReal: number) => porPartes(PARA_PROJETO, tReal);

export const FIM_REAL = real(FIM);
export const TOTAL_QUADROS = Math.round((INTRO + FIM_REAL) * FPS);

/** Partes do vídeo (a etiqueta aparece na barra da legenda). Tempos de projeto. */
export const PARTES = [
  { t: 0, rotulo: "design patterns na era da IA" },
  { t: 13, rotulo: "1994 · Gang of Four" },
  { t: 29, rotulo: "criacionais · Singleton" },
  { t: 42, rotulo: "criacionais · Factory Method" },
  { t: 50, rotulo: "criacionais · Builder" },
  { t: 58, rotulo: "estruturais · Adapter" },
  { t: 71, rotulo: "estruturais · Decorator" },
  { t: 78, rotulo: "estruturais · Facade" },
  { t: 86, rotulo: "comportamentais · Strategy" },
  { t: 98, rotulo: "comportamentais · Observer" },
  { t: 106, rotulo: "comportamentais · Chain of Resp." },
  { t: 115, rotulo: "os padrões de hoje" },
  { t: 127, rotulo: "fundamentos" },
] as const;

/** Frases da legenda (o que é falado). `*{...}` destaca. Tempos de projeto. */
export const LEGENDAS: { de: number; ate?: number; texto: string }[] = [
  { de: 0.1, texto: "Será que Singleton, Factory,\nStrategy e os outros design\npatterns clássicos…" },
  { de: 4.0, texto: "…ainda fazem sentido na era\nda *{inteligência artificial}?" },
  { de: 7.6, texto: "A resposta é *{sim}," },
  { de: 9.5, texto: "e provavelmente você vai\nutilizá-los *{ainda mais}." },
  { de: 13.0, texto: "Em *{1994}, o Gang of Four publicou\num dos livros mais importantes\nda engenharia de software," },
  { de: 17.0, texto: "catalogando *{23 padrões}\nde projeto, divididos em\ntrês categorias:" },
  { de: 20.0, texto: "*{criacionais}, *{estruturais}\ne *{comportamentais}." },
  { de: 24.6, texto: "Mas como esses padrões se\nencaixam nessa *{nova realidade}?" },
  { de: 29.0, texto: "Padrões *{criacionais}:\nresponsáveis pela criação e\ninstanciação de objetos." },
  { de: 33.0, texto: "*{Singleton}: compartilhar uma\núnica instância de um cliente\nde IA thread-safe," },
  { de: 37.0, texto: "evitando instanciações\n*{desnecessárias}." },
  { de: 42.0, texto: "*{Factory Method}: instanciar\ndiferentes provedores de IA" },
  { de: 46.8, texto: "sem acoplar a aplicação às\nsuas implementações *{concretas}." },
  { de: 50.0, texto: "*{Builder}: construir agentes\ncomplexos, configurando\nferramentas, instruções," },
  { de: 53.5, texto: "modelos, memória e políticas de\n*{segurança} de forma incremental." },
  { de: 58.0, texto: "Padrões *{estruturais}:\nresponsáveis pela composição e\nintegração entre componentes." },
  { de: 62.0, texto: "*{Adapter}: cada provedor de IA\npossui uma API diferente." },
  { de: 64.2, texto: "Com Adapter, uma interface\n*{padronizada}, independentemente\ndo modelo utilizado." },
  { de: 71.0, texto: "*{Decorator}: observabilidade,\ncache, contabilização de tokens\ne validações…" },
  { de: 76.1, texto: "…sem modificar a\nimplementação *{principal}." },
  { de: 78.0, texto: "*{Facade}: em vez de expor toda\na complexidade de uma\narquitetura multiagente," },
  { de: 81.3, texto: "você oferece uma interface\n*{simplificada} para a aplicação." },
  { de: 86.0, texto: "Padrões *{comportamentais}:\ncomunicação e distribuição\nde responsabilidades." },
  { de: 90.0, texto: "*{Strategy}: alternar entre\nmodelos ou estratégias de\ninferência durante a execução," },
  { de: 94.4, texto: "considerando *{custo}, *{latência}\ne complexidade da tarefa." },
  { de: 98.0, texto: "*{Observer}: quando um agente\nexecuta uma tarefa, outros\ncomponentes podem ser notificados" },
  { de: 102.3, texto: "sobre eventos, resultados\nou mudanças de *{estado}." },
  { de: 106.0, texto: "*{Chain of Responsibility}:\numa requisição passa por\ndiferentes handlers" },
  { de: 108.4, texto: "responsáveis pela segurança,\nvalidação e processamento," },
  { de: 111.2, texto: "podendo ser *{interrompida}\nou encaminhada." },
  { de: 115.0, texto: "E o mais interessante é que\nvários padrões usados hoje em\nsistemas de IA…" },
  { de: 119.2, texto: "…podem ser implementados\ncombinando conceitos que\njá conhecemos" },
  { de: 123.6, texto: "da *{engenharia de software}\ntradicional." },
  { de: 127.0, texto: "Antes de estudar multiagentes,\nRAG, frameworks de IA ou\nqualquer tecnologia em alta," },
  { de: 131.6, texto: "estude os *{fundamentos} da\nengenharia de software." },
  { de: 137.0, texto: "Os modelos mudam.\nOs frameworks mudam." },
  { de: 140.2, texto: "Mas os *{princípios}: software\nextensível, desacoplado, seguro\ne escalável continuam relevantes." },
  { de: 146.2, texto: "A era da IA não tornou os\nfundamentos obsoletos." },
  { de: 149.6, texto: "Tornou a falta deles ainda\nmais *{evidente}." },
];
