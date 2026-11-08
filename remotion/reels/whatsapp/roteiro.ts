// Roteiro dos 3 Reels do ebook "System Design do WhatsApp", narrados (linguagem para leigos).
//
// A narração (MP3 em public/materiais/whatsapp/narracao/) foi transcrita com tempo por palavra
// em narracao/parteN.json (materiais/whatsapp/narracao.py). Cada cena e cada item começam numa
// frase da narração (`quando`), então o vídeo acompanha a voz sozinho; se a narração for regravada,
// basta rodar o script de novo. As legendas saem das próprias palavras, destacando a que está
// sendo falada. *palavra* vira destaque amarelo nos títulos e frases.

import n1 from "./narracao/parte1.json";
import n2 from "./narracao/parte2.json";
import n3 from "./narracao/parte3.json";
import i1 from "./intro/parte1.json";

export const FPS = 30;
/** Respiro depois do fim da narração, com a chamada na tela. */
export const CAUDA = 1.2;
/** Limite desta série (2:30), com margem. */
export const MAXIMO = 149.8; // margem: o AAC declara a faixa de áudio uns centésimos mais longa

export type Palavra = { w: string; s: number; e: number };
export type Narracao = { duracao: number; palavras: Palavra[] };
export type Foco = { x: number; y: number; w: number; h: number };
/** Nome de um diagrama (função de materiais/whatsapp/diagramas.mjs ou de materiais/whatsapp/reels-diagramas/). */
export type NomeDiagrama = string;

/** icone: "check", "x" ou um emoji. */
export type Item = { texto: string; quando?: string; icone?: string; destaque?: boolean };
export type Linha = { grande: string; texto: string; quando?: string; destaque?: boolean; cor?: string };

export type Visual =
  | { tipo: "gancho"; apoio?: string; texto: string }
  | {
      tipo: "diagrama";
      nome: NomeDiagrama;
      focos?: { quando: string; foco: Foco | null }[];
      semDesenho?: boolean;
      focoInicial?: Foco;
      /** frase da narração em que cada etapa 1..N do desenho começa (null = já desenhada ao entrar) */
      etapas?: (string | null)[];
    }
  | { tipo: "linhas"; itens: Linha[]; curta?: boolean }
  | { tipo: "lista"; itens: Item[] }
  | { tipo: "comparacao"; emoji: string; frase: string; itens: Item[] }
  | { tipo: "cta" };

export type Cena = { quando: string; titulo?: string; visual: Visual };

const CHECK = "check";
const XIS = "x";

export const roteiros: Record<1 | 2 | 3, Cena[]> = {
  1: [
    { quando: "Se numa entrevista", visual: { tipo: "gancho", apoio: "numa entrevista de emprego:", texto: "Como o *WhatsApp* funciona por dentro?" } },
    {
      quando: "Isso tem nome",
      titulo: "Isso tem nome: *System Design*",
      visual: {
        tipo: "lista",
        itens: [
          { texto: "Quais computadores o app usa", quando: "quais computadores", icone: "🖥️" },
          { texto: "Como eles conversam entre si", quando: "como eles conversam", icone: "💬" },
          { texto: "Como aguentam milhões de pessoas", quando: "como aguentam", icone: "👥" },
          { texto: "Pergunta comum em entrevista", quando: "E é uma das perguntas", icone: "🎯", destaque: true },
        ],
      },
    },
    {
      quando: "O primeiro passo não é desenhar",
      titulo: "1. Primeiro, *pergunte*",
      visual: {
        tipo: "comparacao",
        emoji: "📋",
        frase: "o WhatsApp faz *muita coisa*",
        itens: [
          { texto: "Mensagem e grupo", quando: "Mensagem grupo", icone: "💬" },
          { texto: "Foto", quando: "foto", icone: "📷" },
          { texto: "Chamada de vídeo e status", quando: "chamada de vídeo", icone: "🎥" },
          { texto: "Ninguém explica tudo isso em uma hora", quando: "Ninguém explica", icone: "⏱️", destaque: true },
        ],
      },
    },
    {
      quando: "Então você escolhe",
      titulo: "1. Primeiro, *pergunte*",
      visual: {
        tipo: "lista",
        itens: [
          { texto: "Mensagem entre duas pessoas", quando: "Vou falar de mensagem", icone: CHECK },
          { texto: "Grupos", quando: "de grupo", icone: CHECK },
          { texto: "Os tiquinhos ✓✓", quando: "dos tiquinhos", icone: CHECK },
          { texto: "Chamada de vídeo fica de fora", quando: "Chamada de vídeo fica", icone: XIS },
          { texto: "Nenhuma mensagem pode se perder", quando: "Nenhuma mensagem pode", icone: "⚠️", destaque: true },
        ],
      },
    },
    {
      quando: "Segundo passo",
      titulo: "2. As *contas*",
      visual: {
        tipo: "linhas",
        itens: [
          { grande: "500 mi", texto: "pessoas por dia,\n10 mensagens cada", quando: "Imagina 500" },
          { grande: "5 bi", texto: "mensagens\npor dia", quando: "São 5 bilhões" },
          { grande: "58 mil", texto: "mensagens chegando\na cada segundo", quando: "Dividindo pelos segundos" },
          { grande: "× 3", texto: "no horário de pico,\nà noite", quando: "no horário de pico", destaque: true },
        ],
      },
    },
    {
      quando: "E tudo isso precisa ser guardado",
      titulo: "2. As *contas*",
      visual: {
        tipo: "comparacao",
        emoji: "🎬",
        frase: "*5 terabytes* por dia, só de texto",
        itens: [
          { texto: "O espaço de mais de mil filmes. Todo dia.", quando: "Para ter uma ideia", icone: "🎞️" },
          { texto: "Nenhum computador sozinho dá conta", quando: "Nenhum computador sozinho", icone: XIS },
          { texto: "Centenas de computadores trabalhando juntos", quando: "São centenas", icone: "🖥️", destaque: true },
        ],
      },
    },
    {
      quando: "Terceiro passo",
      titulo: "3. Como a mensagem *chega*?",
      visual: {
        tipo: "comparacao",
        emoji: "📱",
        frase: "Jeito 1: ficar *perguntando*",
        itens: [
          { texto: "\"Tem mensagem nova?\" toda hora", quando: "Tem mensagem nova", icone: "🔁" },
          { texto: "Igual criança no carro: \"já chegou?\"", quando: "É igual criança", icone: "🚗" },
          { texto: "Quase sempre: não. Gasta bateria e internet", quando: "Quase sempre", icone: "🔋" },
        ],
      },
    },
    {
      quando: "O segundo jeito",
      titulo: "3. Como a mensagem *chega*?",
      visual: {
        tipo: "comparacao",
        emoji: "📞",
        frase: "Jeito 2: uma *ligação aberta*",
        itens: [
          { texto: "Conecta uma vez e a linha fica ligada", quando: "O celular conecta uma vez", icone: "🔗" },
          { texto: "Chegou mensagem? Vem na hora", quando: "E quando chega", icone: "⚡" },
          { texto: "Esse jeito se chama WebSocket", quando: "Esse jeito se chama", icone: CHECK, destaque: true },
        ],
      },
    },
    { quando: "E isso é só o começo", visual: { tipo: "cta" } },
  ],
  2: [
    { quando: "O primeiro tiquinho", visual: { tipo: "gancho", apoio: "o primeiro tiquinho ✓ do WhatsApp", texto: "*não* quer dizer que chegou." } },
    { quando: "Quando você abre o WhatsApp", titulo: "Uma conexão que *não desliga*", visual: { tipo: "diagrama", nome: "reels:conexao", etapas: ["seu celular se conecta", "computador da empresa", "chama de servidor", "conexão fica aberta", "uma ligação que", "existem centenas desses", "um só não aguenta"] } },
    { quando: "Então o WhatsApp precisa", titulo: "A *recepção* do prédio", visual: { tipo: "diagrama", nome: "reels:recepcao", etapas: ["uma lista", "em qual servidor", "conectada agora", "pensa na recepção", "um prédio", "Ana está na", "Bruno está na"] } },
    { quando: "Agora a Ana manda", titulo: "Ana manda *\"oi\"* pro Bruno", visual: { tipo: "diagrama", nome: "reels:caminho", etapas: ["oi pro Bruno", "sai do celular", "anotar essa mensagem", "num lugar seguro", "ele avisa o celular", "o primeiro tiquinho"] } },
    { quando: "Por que nessa ordem", titulo: "Por que *nessa ordem*?", visual: { tipo: "diagrama", nome: "reels:ordem", etapas: ["o servidor avisasse", "desse um problema", "a mensagem sumia", "o primeiro tiquinho", "WhatsApp guardou", "esta segura", "ainda nao chegou"] } },
    { quando: "Depois o servidor da Ana", titulo: "Até o Bruno: *entregue*", visual: { tipo: "diagrama", nome: "reels:caminho", etapas: [null, null, null, null, null, null, "olha a lista", "Na sala 40", "passa a mensagem", "entrega no celular", "responde chegou", "caminho de volta", "os dois tiquinhos"] } },
    { quando: "E quando o Bruno abre", titulo: "Os *tiquinhos*", visual: { tipo: "diagrama", nome: "reels:tiquinhos", etapas: ["abre a conversa", "o celular dele", "mais um aviso", "os tiquinhos"] } },
    { quando: "E se o Bruno estiver", titulo: "Celular *desligado*", visual: { tipo: "diagrama", nome: "reels:offline", etapas: ["fica esperando por ele", "manda uma notificacao", "pode ate se perder", "liga o celular", "o app pergunta", "e pega tudo", "fica ha horas"] } },
    { quando: "No meu guia tem", visual: { tipo: "cta" } },
  ],
  3: [
    { quando: "Quando você manda", visual: { tipo: "gancho", apoio: "num grupo de mil pessoas,", texto: "1 mensagem vira *mil*." } },
    { quando: "Num grupo, o servidor", titulo: "Mensagem em *grupo*", visual: { tipo: "diagrama", nome: "reels:grupos", etapas: ["guarda sua mensagem", "uma vez só", "a lista de", "uma cópia para", "o app aberto", "recebe uma notificação", "a mensagem fica"] } },
    { quando: "É como mandar a mesma carta", titulo: "Por que o grupo tem *limite*?", visual: { tipo: "diagrama", nome: "reels:cartas", etapas: ["mil endereços", "maior o grupo", "mais trabalho", "limita o tamanho", "no whatsapp", "1.024 pessoas"] } },
    { quando: "Agora pensa no tamanho", titulo: "Onde guardar *tudo isso*?", visual: { tipo: "diagrama", nome: "reels:tamanho", etapas: ["quase dois petabytes", "nao cabe num", "precisa ser dividido", "arquivo gigante", "a pergunta e"] } },
    { quando: "Se você separar mensagem", titulo: "Guarde por *conversa*", visual: { tipo: "diagrama", nome: "reels:gavetas", etapas: ["espalhada em várias gavetas", "procurar em todas", "fica lento", "separar por conversa", "numa gaveta só", "abriu a conversa"] } },
    { quando: "E como o sistema sabe a ordem", titulo: "A *senha* com relógio", visual: { tipo: "diagrama", nome: "reels:senha", etapas: ["ganha um número", "senha de atendimento", "relógio impresso", "colocar os números", "identificação do servidor", "dois servidores nunca"] } },
    { quando: "E se um servidor quebrar", titulo: "E se um servidor *quebrar*?", visual: { tipo: "diagrama", nome: "reels:reconexao", etapas: ["servidor quebrar", "perde a conexao", "se conecta sozinho", "tem um cuidado", "ao mesmo tempo", "derruba o proximo"] } },
    { quando: "É igual quando a luz volta", titulo: "Cada um espera a *vez*", visual: { tipo: "diagrama", nome: "reels:luz", etapas: ["liga tudo", "cada celular espera", "e se nao der", "espera um pouco mais", "nenhuma mensagem se perde", "primeiro tiquinho", "foi guardada"] } },
    { quando: "E um bônus", titulo: "Só *você* lê", visual: { tipo: "diagrama", nome: "reels:cripto", etapas: ["criptografadas de ponta", "nem o próprio", "mensagem é entregue", "apagada dos servidores", "a sua conversa", "no seu celular"] } },
    { quando: "Se você curtiu", visual: { tipo: "cta" } },
  ],
};

export const narracoes: Record<1 | 2 | 3, Narracao> = { 1: n1, 2: n2, 3: n3 };

/* ------------------------------------------------------------------ tempos */

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Segundo em que a frase `ancora` começa a ser falada, procurando a partir de `desde`. */
export function achar(n: Narracao, ancora: string, desde = 0): number {
  const alvo = normal(ancora);
  const tokens = n.palavras.flatMap((p) => normal(p.w).map((t) => ({ t, s: p.s })));
  for (let i = 0; i + alvo.length <= tokens.length; i++) {
    if (tokens[i].s < desde - 0.01) continue;
    if (alvo.every((a, k) => tokens[i + k].t === a)) return tokens[i].s;
  }
  throw new Error(`Frase não encontrada na narração (depois de ${desde.toFixed(1)} s): "${ancora}"`);
}

/* ------------------------------------------------------------------ intro gravada */

/** Intro gravada pela Julia (materiais/whatsapp/intro.py): ela fala, os gráficos entram atrás dela
 *  e, quando a mão cruza a tela (`mao`), o Reel narrado entra puxado pela mão. Tempos em segundos
 *  a partir do começo do vídeo. */
export type Intro = { fps: number; duracao: number; quadros: number; mao: [number, number]; vozAte: number; palavras: Palavra[]; pasta: string };
// A Julia gravou uma intro só ("Vem construir o WhatsApp comigo"): as 3 partes usam o mesmo clipe e
// os mesmos arquivos (pasta parte1/); o que muda por parte são os gráficos atrás dela.
const introGravada = { ...(i1 as unknown as Omit<Intro, "pasta">), pasta: "parte1" };
export const intros: Partial<Record<1 | 2 | 3, Intro>> = { 1: introGravada, 2: introGravada, 3: introGravada };

/** Segundo do vídeo em que o Reel narrado começa (o gesto da mão), ou 0 sem intro. */
export const atraso = (parte: 1 | 2 | 3) => intros[parte]?.mao[0] ?? 0;

/** Duração sem o teto: o render avisa se passar de MAXIMO (aí a chamada final é encurtada). */
export const duracaoNatural = (parte: 1 | 2 | 3) => atraso(parte) + narracoes[parte].duracao + CAUDA;
export const total = (parte: 1 | 2 | 3) => Math.min(MAXIMO, duracaoNatural(parte));
/** Duração do Reel narrado (o que vem depois da intro). */
export const duracaoCorpo = (parte: 1 | 2 | 3) => total(parte) - atraso(parte);

/** Todas as falas do vídeo (intro + narração) em tempo absoluto, para a trilha baixar sob a voz. */
export function falas(parte: 1 | 2 | 3): Palavra[] {
  const intro = intros[parte];
  const d = atraso(parte);
  const daIntro = intro ? intro.palavras.filter((p) => p.e <= intro.vozAte + 0.05) : [];
  return [...daIntro, ...narracoes[parte].palavras.map((p) => ({ ...p, s: p.s + d, e: p.e + d }))];
}
export const quadros = (parte: 1 | 2 | 3) => Math.ceil(total(parte) * FPS);

export type CenaTempo = Cena & { inicio: number; fim: number; tempos: number[]; focosT: { de: number; foco: Foco | null }[]; etapasT?: number[] };

/** Resolve o início de cada cena, de cada item e de cada enquadramento da câmera. */
export function linhaDoTempo(parte: 1 | 2 | 3): CenaTempo[] {
  const n = narracoes[parte];
  const cenas = roteiros[parte];
  const inicios: number[] = [];
  cenas.forEach((c, i) => inicios.push(i === 0 ? 0 : achar(n, c.quando, inicios[i - 1])));
  return cenas.map((c, i) => {
    const inicio = inicios[i];
    const fim = i + 1 < cenas.length ? inicios[i + 1] : duracaoCorpo(parte);
    const v = c.visual;
    const itens: { quando?: string }[] = v.tipo === "lista" || v.tipo === "comparacao" || v.tipo === "linhas" ? v.itens : [];
    let desde = inicio;
    const tempos = itens.map((it, k) => {
      if (!it.quando) return inicio + 0.3 + k * 0.35;
      desde = achar(n, it.quando, desde);
      return desde;
    });
    const focosT = v.tipo === "diagrama" ? (v.focos ?? []).map((f) => ({ de: achar(n, f.quando, inicio), foco: f.foco })) : [];
    let desdeEt = inicio;
    const etapasT =
      v.tipo === "diagrama" && v.etapas
        ? v.etapas.map((a) => {
            if (a === null) return inicio - 100; // já desenhada quando a cena entra
            desdeEt = achar(n, a, desdeEt);
            return desdeEt;
          })
        : undefined;
    return { ...c, inicio, fim, tempos, focosT, etapasT };
  });
}

/* ------------------------------------------------------------------ legendas */

export type Bloco = { de: number; ate: number; palavras: Palavra[] };

/** Agrupa a narração em blocos curtos de legenda (quebra na pontuação, até 7 palavras). */
export function legendas(parte: 1 | 2 | 3): Bloco[] {
  return agrupar(narracoes[parte].palavras);
}

/** Legenda da fala da intro. */
export const legendasIntro = (parte: 1 | 2 | 3): Bloco[] => agrupar(intros[parte]?.palavras ?? []);

function agrupar(ps: Palavra[]): Bloco[] {
  const blocos: Palavra[][] = [];
  let atual: Palavra[] = [];
  ps.forEach((p, i) => {
    const prox = ps[i + 1];
    atual.push(p);
    const fimFrase = /[.?!]$/.test(p.w);
    const virgula = /[,:;]$/.test(p.w) && atual.length >= 3;
    const pausa = prox && prox.s - p.e > 0.45;
    if (fimFrase || virgula || pausa || atual.length >= 7 || !prox) {
      blocos.push(atual);
      atual = [];
    }
  });
  return blocos.map((b, i) => ({
    de: b[0].s,
    ate: Math.min(blocos[i + 1]?.[0].s ?? Infinity, b[b.length - 1].e + 0.6),
    palavras: b,
  }));
}
