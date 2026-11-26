// Reel "Design patterns na era da IA" (2160x3840, HDR HLG como a gravação do iPhone).
// Abre com o gancho gravado (IMG_3755, sem alteração de resolução nem de cor fora do título) e segue no canvas:
// contexto do Gang of Four, os 9 padrões (3 por categoria), a ponte com a IA e o fechamento.
//
// Tempo de projeto x tempo real: as cenas foram desenhadas num tempo "de projeto". Quando a narração
// for gravada, ANCORAS prende instantes do projeto às palavras da fala (como no Reel do Pix) e o
// mapa de tempo estica ou encolhe o canvas para acompanhar. Sem narração, o mapa é a identidade.

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

/** [instante de projeto do canvas, segundo real do canvas]. Sem narração: identidade. */
const ANCORAS: [number, number][] = [
  [0, 0],
  [FIM, FIM],
];

function porPartes(pares: [number, number][], x: number): number {
  let i = 1;
  while (i < pares.length - 1 && x > pares[i][0]) i++;
  const [x0, y0] = pares[i - 1];
  const [x1, y1] = pares[i];
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/** Segundo real do canvas (a partir do fim do gancho) em que um instante de projeto aparece. */
export const real = (tProjeto: number) => porPartes(ANCORAS, tProjeto);
/** Instante de projeto que aparece num segundo real do canvas. */
export const projeto = (tReal: number) => porPartes(ANCORAS.map(([p, r]) => [r, p]), tReal);

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

/** Frases da legenda (o roteiro). `*{...}` destaca. Tempos de projeto. */
export const LEGENDAS: { de: number; ate?: number; texto: string }[] = [
  { de: 0.3, texto: "Será que Singleton, Factory,\nStrategy e os outros design\npatterns clássicos…" },
  { de: 4.0, texto: "…ainda fazem sentido na era\nda *{inteligência artificial}?" },
  { de: 8.0, texto: "A resposta é *{sim}." },
  { de: 9.5, texto: "E, provavelmente, você vai\nutilizá-los *{ainda mais}." },
  { de: 13.0, texto: "Em *{1994}, o Gang of Four publicou\num dos livros mais importantes\nda engenharia de software," },
  { de: 17.0, texto: "catalogando *{23 padrões}\nde projeto, divididos em\ntrês categorias:" },
  { de: 20.0, texto: "*{criacionais}, *{estruturais}\ne *{comportamentais}." },
  { de: 24.5, texto: "Mas como esses padrões se\nencaixam nessa *{nova realidade}?" },
  { de: 29.0, texto: "Padrões *{criacionais}: criação\ne instanciação de objetos." },
  { de: 33.0, texto: "*{Singleton}: uma única instância\nde um cliente de IA thread-safe,\nsem instanciações desnecessárias." },
  { de: 42.0, texto: "*{Factory Method}: instanciar\nprovedores de IA diferentes sem\nacoplar a aplicação a eles." },
  { de: 50.0, texto: "*{Builder}: montar agentes\ncomplexos aos poucos: ferramentas,\ninstruções, modelo, memória…" },
  { de: 54.5, texto: "…e políticas de *{segurança}." },
  { de: 58.0, texto: "Padrões *{estruturais}: composição\ne integração entre componentes." },
  { de: 62.0, texto: "*{Adapter}: cada provedor tem\numa API diferente; o Adapter\ndá uma interface padronizada," },
  { de: 66.5, texto: "independentemente do *{modelo}\nutilizado." },
  { de: 71.0, texto: "*{Decorator}: observabilidade,\ncache, contagem de tokens e\nvalidações sem mexer no núcleo." },
  { de: 78.0, texto: "*{Facade}: em vez de expor toda\na arquitetura multiagente,\numa interface simples." },
  { de: 86.0, texto: "Padrões *{comportamentais}:\ncomunicação e distribuição de\nresponsabilidades." },
  { de: 90.0, texto: "*{Strategy}: alternar modelos ou\nestratégias de inferência\nem tempo de execução," },
  { de: 94.5, texto: "considerando *{custo}, *{latência}\ne complexidade da tarefa." },
  { de: 98.0, texto: "*{Observer}: quando um agente\nexecuta uma tarefa, outros\ncomponentes são notificados" },
  { de: 102.5, texto: "sobre eventos, resultados\nou mudanças de *{estado}." },
  { de: 106.0, texto: "*{Chain of Responsibility}:\na requisição passa por handlers\nde segurança, validação…" },
  { de: 110.5, texto: "…e processamento, podendo ser\n*{interrompida} ou encaminhada." },
  { de: 115.0, texto: "Vários padrões usados hoje em\nsistemas de IA podem ser feitos" },
  { de: 119.5, texto: "combinando conceitos da\n*{engenharia de software}\ntradicional." },
  { de: 127.0, texto: "Antes de estudar multiagentes,\nRAG, frameworks de IA ou o que\nestiver em alta," },
  { de: 131.5, texto: "estude os *{fundamentos} da\nengenharia de software." },
  { de: 137.0, texto: "Os modelos mudam.\nOs frameworks mudam." },
  { de: 140.0, texto: "Mas os *{princípios} continuam:\nextensível, desacoplado,\nseguro e escalável." },
  { de: 146.0, texto: "A era da IA não tornou os\nfundamentos obsoletos." },
  { de: 149.5, texto: "Tornou a falta deles ainda\nmais *{evidente}." },
];
