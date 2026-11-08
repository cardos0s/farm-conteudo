// Roteiro dos 3 Reels do ebook "System Design do WhatsApp" em versão sem narração: o texto vai
// na tela, em legendas que trocam no ritmo de leitura, e os diagramas do PDF se desenham sozinhos.
// *palavra* vira destaque amarelo. O roteiro falado (para gravar com voz) está em
// materiais/whatsapp/REELS.md.

export const FPS = 30;

/** Região do diagrama (em unidades do viewBox) para a câmera enquadrar. */
export type Foco = { x: number; y: number; w: number; h: number };

export type Visual =
  | { tipo: "gancho"; texto: string; apoio?: string }
  | { tipo: "diagrama"; nome: "tempoReal" | "arquitetura" | "caminhoMensagem" | "grupos" | "particoes" | "snowflake" | "reconexao"; focos?: (Foco | null)[] }
  | { tipo: "passos"; itens: [string, string][] }
  | { tipo: "linhas"; itens: { grande: string; texto: string; destaque?: boolean; cor?: string }[]; curta?: boolean }
  | { tipo: "lista"; itens: string[]; sincronizada?: boolean }
  | { tipo: "cta" };

export type Cena = { titulo?: string; visual: Visual; legendas: string[] };

export type Parte = { numero: 1 | 2 | 3; cenas: Cena[] };

const CTA_TEXTO = "*System Design do WhatsApp* · R$ 15 · link na bio";

export const partes: Record<1 | 2 | 3, Parte> = {
  1: {
    numero: 1,
    cenas: [
      {
        visual: { tipo: "gancho", apoio: "numa entrevista te pedem:", texto: "Projete o *WhatsApp*." },
        legendas: ["Você saberia por onde começar?"],
      },
      {
        titulo: "O roteiro de *45 minutos*",
        visual: {
          tipo: "passos",
          itens: [
            ["Requisitos", "5 min"],
            ["Estimativas", "5 min"],
            ["API e protocolo", "5 min"],
            ["Arquitetura", "10 min"],
            ["Aprofundar", "15 min"],
            ["Gargalos e falhas", "5 min"],
          ],
        },
        legendas: ["É uma das perguntas mais comuns de *system design*.", "Dá para responder em 45 minutos seguindo esta ordem. Vamos ao começo."],
      },
      {
        titulo: "1. Pergunte *antes de desenhar*",
        visual: {
          tipo: "lista",
          itens: ["Só 1:1 ou grupos também?", "Só texto ou foto e vídeo?", "Precisa de enviada, entregue e lida?", "O que fica de fora? (ex.: chamadas)"],
        },
        legendas: [
          "Não desenhe nada ainda. Primeiro, *feche o escopo*.",
          "O entrevistador quer ver você *decidir* o que entra e o que fica de fora.",
          "E guarde este requisito, que muda tudo: *não pode perder mensagem*.",
        ],
      },
      {
        titulo: "2. As *contas*",
        visual: {
          tipo: "linhas",
          itens: [
            { grande: "5 bi", texto: "mensagens por dia\n(500 mi pessoas × 10)" },
            { grande: "58 mil/s", texto: "em média\n(÷ 86.400 s)" },
            { grande: "175 mil/s", texto: "no pico\n(× 3)", destaque: true },
            { grande: "5 TB/dia", texto: "≈ 1,8 PB por ano\n(1 KB por mensagem)" },
            { grande: "500", texto: "servidores para\n50 mi conexões" },
          ],
        },
        legendas: [
          "500 milhões de pessoas × 10 mensagens = *5 bilhões por dia*.",
          "Dividido por 86.400 segundos: *58 mil por segundo*.",
          "No horário de pico, 3 vezes isso: *175 mil por segundo*.",
          "1 KB por mensagem: *5 TB por dia*. Quase 2 PB por ano.",
          "50 milhões conectados ao mesmo tempo: uns *500 servidores* de chat.",
          "Conclusão: o banco tem que ser *dividido* e precisa de uma *fila* na frente.",
        ],
      },
      {
        titulo: "3. Como a mensagem *chega*?",
        visual: {
          tipo: "diagrama",
          nome: "tempoReal",
          focos: [
            { x: 0, y: 0, w: 222, h: 360 },
            { x: 226, y: 0, w: 230, h: 360 },
            { x: 456, y: 0, w: 204, h: 360 },
            null,
          ],
        },
        legendas: [
          "*Polling*: o app pergunta \"tem mensagem?\" a cada poucos segundos. Quase sempre: não.",
          "*Long polling*: o servidor segura a resposta, mas a conexão reabre a cada mensagem.",
          "*WebSocket*: uma conexão que fica aberta, e o servidor manda na hora.",
          "É o WebSocket que o chat usa. ✓",
        ],
      },
      {
        visual: { tipo: "cta" },
        legendas: [
          "Isso é só o começo.",
          "O guia completo tem *20 páginas*: diagramas, contas prontas e perguntas com resposta.",
          CTA_TEXTO,
          "Parte 2: o caminho de uma mensagem e o que o *tique* quer dizer.",
        ],
      },
    ],
  },
  2: {
    numero: 2,
    cenas: [
      {
        visual: { tipo: "gancho", apoio: "o primeiro tique do WhatsApp", texto: "*não* quer dizer que chegou." },
        legendas: ["Vamos seguir uma mensagem do seu celular até o da outra pessoa."],
      },
      {
        titulo: "A *arquitetura*",
        visual: {
          tipo: "diagrama",
          nome: "arquitetura",
          focos: [
            { x: 0, y: 130, w: 520, h: 280 },
            { x: 290, y: 10, w: 230, h: 280 },
            null,
          ],
        },
        legendas: [
          "Quando você abre o app, ele conecta num *servidor de chat*, e a conexão fica aberta.",
          "São centenas de servidores. Um *cache* guarda em qual deles cada pessoa está.",
          "Por trás: uma *fila*, o banco de mensagens, notificações e mídia.",
        ],
      },
      {
        titulo: "A manda *\"oi\"* para B",
        visual: {
          tipo: "diagrama",
          nome: "caminhoMensagem",
          focos: [
            { x: 0, y: 0, w: 560, h: 250 },
            { x: 0, y: 60, w: 560, h: 200 },
            { x: 0, y: 140, w: 560, h: 120 },
            { x: 0, y: 140, w: 560, h: 120 },
            { x: 200, y: 240, w: 845, h: 200 },
            { x: 0, y: 420, w: 1045, h: 150 },
            null,
          ],
        },
        legendas: [
          "1. A mensagem vai pela conexão de A até o *servidor A*.",
          "2. Antes de qualquer coisa, o servidor *grava* a mensagem numa fila.",
          "3. Só depois de gravar ele responde para A. É aí que aparece o *✓*.",
          "Se respondesse antes e caísse, a mensagem *sumiria*. ✓ = o servidor *guardou*.",
          "4 a 6. O cache diz onde está B, e o servidor de B *entrega* no celular dele.",
          "7 e 8. O celular de B confirma, e a confirmação volta para A: *✓✓ entregue*.",
        ],
      },
      {
        titulo: "O que cada *tique* quer dizer",
        visual: {
          tipo: "linhas",
          curta: true,
          itens: [
            { grande: "🕓", texto: "pendente\nainda só no seu celular", cor: "#868e96" },
            { grande: "✓", texto: "enviada\no servidor gravou", cor: "#868e96" },
            { grande: "✓✓", texto: "entregue\nchegou no celular da pessoa", cor: "#868e96" },
            { grande: "✓✓", texto: "lida\nela abriu a conversa", destaque: true, cor: "#1971c2" },
          ],
        },
        legendas: [
          "🕓 *Pendente*: a mensagem ainda está só no seu celular.",
          "✓ *Enviada*: o servidor gravou.",
          "✓✓ *Entregue*: chegou no celular da pessoa.",
          "✓✓ azul: ela *abriu* a conversa.",
        ],
      },
      {
        titulo: "E se B estiver *offline*?",
        visual: {
          tipo: "lista",
          sincronizada: true,
          itens: ["A mensagem fica pendente", "Vai uma notificação push", "B volta e busca o que chegou", "Só então: ✓✓"],
        },
        legendas: [
          "A mensagem já está gravada, então fica na lista de *pendentes* de B.",
          "Vai um push. Mas push é só um *aviso*, e pode se perder.",
          "Quando B volta, o app busca *tudo desde a última* mensagem recebida.",
          "Por isso A fica com um ✓ só até B aparecer.",
        ],
      },
      {
        visual: { tipo: "cta" },
        legendas: [
          "O fluxo completo, o protocolo e as perguntas do entrevistador estão no guia.",
          CTA_TEXTO,
          "Parte 3: grupos, petabytes de mensagens e servidor caindo.",
        ],
      },
    ],
  },
  3: {
    numero: 3,
    cenas: [
      {
        visual: { tipo: "gancho", apoio: "num grupo de 1.024 pessoas, cada mensagem vira", texto: "*1.024 entregas*." },
        legendas: ["O que acontece quando o sistema fica gigante?"],
      },
      {
        titulo: "1 mensagem, *1.024 entregas*",
        visual: { tipo: "diagrama", nome: "grupos" },
        legendas: [
          "O servidor grava a mensagem *uma vez* e pergunta quem está no grupo.",
          "Quem está online recebe na hora. Quem está offline ganha um *push* e fica pendente.",
          "Esse \"um vira muitos\" é o *fan-out*. Por isso todo grupo tem limite: no WhatsApp, 1.024.",
        ],
      },
      {
        titulo: "Como guardar *petabytes*",
        visual: {
          tipo: "diagrama",
          nome: "particoes",
          focos: [null, { x: 430, y: 0, w: 410, h: 225 }, { x: 0, y: 0, w: 410, h: 225 }],
        },
        legendas: [
          "Quase 2 PB por ano: o banco precisa ser *dividido* em muitas máquinas.",
          "Dividir pelo id da mensagem espalha a conversa: abrir uma vira *perguntar a todas*.",
          "Divida *pela conversa*: cada uma fica inteira num lugar, já em ordem.",
        ],
      },
      {
        titulo: "O *id* da mensagem",
        visual: { tipo: "diagrama", nome: "snowflake" },
        legendas: [
          "Ele começa pelo *horário*: ordenar pelo id já é ordenar pelo tempo.",
          "Depois vem qual *máquina* gerou e um *contador*.",
          "Assim dois servidores nunca geram o mesmo id no mesmo milissegundo.",
        ],
      },
      {
        titulo: "E se um servidor *cair*?",
        visual: { tipo: "diagrama", nome: "reconexao" },
        legendas: [
          "Todo mundo conectado nele reconecta em *outro* servidor.",
          "Mas não todos ao mesmo tempo: cada app espera *um pouco mais* a cada tentativa, com sorteio.",
          "E nada se perde: o ✓ só aparece *depois de gravar*.",
        ],
      },
      {
        titulo: "O WhatsApp *de verdade*",
        visual: {
          tipo: "lista",
          sincronizada: true,
          itens: ["Criptografia de ponta a ponta", "Apaga do servidor depois de entregar", "Seu histórico mora no celular"],
        },
        legendas: [
          "Bônus: o WhatsApp real tem *criptografia de ponta a ponta*.",
          "E apaga a mensagem do servidor *depois de entregar*.",
          "Seu histórico mora no celular. Falar isso na entrevista *impressiona*.",
        ],
      },
      {
        visual: { tipo: "cta" },
        legendas: [
          "No guia está tudo com calma: *14 capítulos* e todos os diagramas.",
          "Contas prontas, os erros que reprovam e as perguntas do entrevistador *com resposta*.",
          CTA_TEXTO,
        ],
      },
    ],
  },
};

/* ------------------------------------------------------------------ tempos */

const palavras = (s: string) => s.replace(/\*/g, "").split(/\s+/).filter(Boolean).length;

/** Tempo de leitura de uma legenda, em segundos (~3,7 palavras por segundo + respiro). */
export const duracaoLegenda = (s: string) => Math.max(1.9, palavras(s) * 0.27 + 0.75);

export const TRANSICAO = 0.35;

export type CenaTempo = Cena & { inicio: number; duracao: number; legendasT: { de: number; ate: number; texto: string }[] };

export function tempos(parte: Parte): { cenas: CenaTempo[]; total: number } {
  let t = 0;
  const cenas = parte.cenas.map((c) => {
    let tl = c.visual.tipo === "gancho" ? 1.6 : 0.5; // o gancho fica sozinho na tela antes da legenda
    const legendasT = c.legendas.map((texto) => {
      const de = tl;
      tl += duracaoLegenda(texto);
      return { de, ate: tl, texto };
    });
    const duracao = tl + (c.visual.tipo === "cta" ? 1.5 : TRANSICAO);
    const cena = { ...c, inicio: t, duracao, legendasT };
    t += duracao;
    return cena;
  });
  return { cenas, total: t };
}

export const quadros = (parte: 1 | 2 | 3) => Math.ceil(tempos(partes[parte]).total * FPS);
