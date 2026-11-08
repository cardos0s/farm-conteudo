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
export type NomeDiagrama = "caminhoLeigo" | "gruposLeigo" | "particoesLeigo" | "reconexaoLeigo";

/** icone: "check", "x" ou um emoji. */
export type Item = { texto: string; quando?: string; icone?: string; destaque?: boolean };
export type Linha = { grande: string; texto: string; quando?: string; destaque?: boolean; cor?: string };

export type Visual =
  | { tipo: "gancho"; apoio?: string; texto: string }
  | { tipo: "diagrama"; nome: NomeDiagrama; focos?: { quando: string; foco: Foco | null }[]; semDesenho?: boolean; focoInicial?: Foco }
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
    {
      quando: "Quando você abre o WhatsApp",
      titulo: "Primeiro: o *servidor*",
      visual: {
        tipo: "comparacao",
        emoji: "📱➜🖥️",
        frase: "seu celular se conecta a um *servidor*",
        itens: [
          { texto: "Servidor = um computador da empresa", quando: "que a gente chama", icone: "🖥️" },
          { texto: "A conexão fica aberta, como uma ligação", quando: "E essa conexão", icone: "📞" },
          { texto: "São centenas de servidores", quando: "Só que existem", icone: "🏢" },
        ],
      },
    },
    {
      quando: "Então o WhatsApp precisa",
      titulo: "A *recepção* do prédio",
      visual: {
        tipo: "linhas",
        curta: true,
        itens: [
          { grande: "🏢", texto: "uma lista\nquem está em qual servidor" },
          { grande: "👩", texto: "Ana\nestá na sala 12", quando: "A Ana está" },
          { grande: "👨", texto: "Bruno\nestá na sala 40", quando: "o Bruno está", destaque: true },
        ],
      },
    },
    {
      quando: "Agora a Ana manda",
      titulo: "Ana manda *\"oi\"* pro Bruno",
      visual: {
        tipo: "diagrama",
        nome: "caminhoLeigo",
        focoInicial: { x: 0, y: 0, w: 560, h: 250 },
        focos: [
          { quando: "E a primeira coisa", foco: { x: 0, y: 60, w: 560, h: 200 } },
          { quando: "Só depois de anotar", foco: { x: 0, y: 140, w: 560, h: 120 } },
        ],
      },
    },
    {
      quando: "Por que nessa ordem",
      titulo: "Por que *nessa ordem*?",
      visual: {
        tipo: "comparacao",
        emoji: "📝",
        frase: "✓ = o WhatsApp *guardou*",
        itens: [
          { texto: "Se avisasse antes e desse problema, a mensagem sumia", quando: "Porque se o servidor", icone: XIS },
          { texto: "Guardada e segura. Mas ainda não chegou", quando: "Ela está segura", icone: "🔒", destaque: true },
        ],
      },
    },
    {
      quando: "Depois o servidor da Ana",
      titulo: "Ana manda *\"oi\"* pro Bruno",
      visual: {
        tipo: "diagrama",
        nome: "caminhoLeigo",
        semDesenho: true,
        focoInicial: { x: 200, y: 240, w: 845, h: 200 },
        focos: [{ quando: "O celular do Bruno responde", foco: { x: 0, y: 400, w: 860, h: 170 } }],
      },
    },
    {
      quando: "E quando o Bruno abre",
      titulo: "Os *tiquinhos*",
      visual: {
        tipo: "linhas",
        curta: true,
        itens: [
          { grande: "✓", texto: "guardado\no WhatsApp anotou", cor: "#868e96" },
          { grande: "✓✓", texto: "entregue\nchegou no celular", cor: "#868e96" },
          { grande: "✓✓", texto: "lido\no Bruno abriu a conversa", quando: "os tiquinhos ficam azuis", destaque: true, cor: "#1971c2" },
        ],
      },
    },
    {
      quando: "E se o Bruno estiver",
      titulo: "E se o celular estiver *desligado*?",
      visual: {
        tipo: "comparacao",
        emoji: "📬",
        frase: "a mensagem espera na *caixa de correio*",
        itens: [
          { texto: "A notificação é só um aviso: pode se perder", quando: "O WhatsApp manda uma notificação", icone: "🔔" },
          { texto: "Ligou o celular: \"o que chegou pra mim?\"", quando: "Quando o Bruno liga", icone: "📲" },
          { texto: "Por isso, às vezes, um tiquinho só por horas", quando: "É por isso", icone: "✓", destaque: true },
        ],
      },
    },
    { quando: "No meu guia tem", visual: { tipo: "cta" } },
  ],
  3: [
    { quando: "Quando você manda", visual: { tipo: "gancho", apoio: "num grupo de mil pessoas,", texto: "1 mensagem vira *mil*." } },
    { quando: "Num grupo, o servidor", titulo: "Grupo: uma *cópia* pra cada um", visual: { tipo: "diagrama", nome: "gruposLeigo" } },
    {
      quando: "É como mandar a mesma carta",
      titulo: "Grupo: uma *cópia* pra cada um",
      visual: {
        tipo: "comparacao",
        emoji: "✉️",
        frase: "a mesma carta para *mil endereços*",
        itens: [
          { texto: "Quanto maior o grupo, mais trabalho", quando: "Quanto maior", icone: "📈" },
          { texto: "Por isso todo app limita o tamanho", quando: "Por isso", icone: "🚧" },
          { texto: "WhatsApp: no máximo 1.024 pessoas", quando: "No WhatsApp, o máximo", icone: CHECK, destaque: true },
        ],
      },
    },
    {
      quando: "Agora pensa no tamanho",
      titulo: "Onde guardar *tudo isso*?",
      visual: {
        tipo: "comparacao",
        emoji: "🗄️",
        frase: "quase *2 petabytes* por ano",
        itens: [
          { texto: "Não cabe num computador", quando: "Isso não cabe", icone: XIS },
          { texto: "Dividido em muitas gavetas", quando: "Precisa ser dividido", icone: "🗂️" },
          { texto: "A pergunta é: como dividir?", quando: "A pergunta é", icone: "🤔", destaque: true },
        ],
      },
    },
    {
      quando: "Se você separar mensagem",
      titulo: "Como *dividir*?",
      visual: {
        tipo: "diagrama",
        nome: "particoesLeigo",
        focoInicial: { x: 430, y: 0, w: 410, h: 225 },
        focos: [{ quando: "O jeito certo", foco: { x: 0, y: 0, w: 410, h: 225 } }],
      },
    },
    {
      quando: "E como o sistema sabe a ordem",
      titulo: "Como fica *em ordem*?",
      visual: {
        tipo: "comparacao",
        emoji: "🎫",
        frase: "uma *senha* com o relógio impresso",
        itens: [
          { texto: "Cada mensagem ganha um número que começa pelo horário", quando: "Cada mensagem ganha", icone: "🕐" },
          { texto: "Número em ordem = mensagem em ordem", quando: "Então, colocar", icone: CHECK },
          { texto: "+ qual servidor criou: o número nunca repete", quando: "E junto vai", icone: "🖥️", destaque: true },
        ],
      },
    },
    { quando: "E se um servidor quebrar", titulo: "E se um servidor *quebrar*?", visual: { tipo: "diagrama", nome: "reconexaoLeigo" } },
    {
      quando: "É igual quando a luz volta",
      titulo: "E se um servidor *quebrar*?",
      visual: {
        tipo: "comparacao",
        emoji: "💡",
        frase: "a luz volta e todo mundo *liga tudo*",
        itens: [
          { texto: "Cada celular espera um pouquinho", quando: "Então, cada celular", icone: "⏳" },
          { texto: "Se não der, espera um pouco mais", quando: "E se não der", icone: "⏳" },
          { texto: "Nenhuma mensagem se perde", quando: "E nenhuma mensagem", icone: CHECK, destaque: true },
        ],
      },
    },
    {
      quando: "E um bônus",
      titulo: "Bônus: o WhatsApp *de verdade*",
      visual: {
        tipo: "lista",
        itens: [
          { texto: "Criptografia de ponta a ponta", quando: "as mensagens são criptografadas", icone: "🔒" },
          { texto: "Nem o WhatsApp consegue ler", quando: "Isso quer dizer", icone: "🙈" },
          { texto: "Apagada dos servidores depois de entregue", quando: "E depois que a mensagem", icone: "🗑️" },
          { texto: "Sua conversa fica no seu celular", quando: "A sua conversa", icone: "📱", destaque: true },
        ],
      },
    },
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

export type CenaTempo = Cena & { inicio: number; fim: number; tempos: number[]; focosT: { de: number; foco: Foco | null }[] };

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
    return { ...c, inicio, fim, tempos, focosT };
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
