import React from "react";
import locucaoR3 from "../../../public/selloop/locucao/r3/locucao.json";
import eventosA from "../../../public/selloop/telas/v3-a-conversa/eventos.json";
import eventosB from "../../../public/selloop/telas/v3-b-canais/eventos.json";
import eventosC from "../../../public/selloop/telas/v3-c-agenda/eventos.json";
import eventosD from "../../../public/selloop/telas/v3-d-funil/eventos.json";
import eventosE from "../../../public/selloop/telas/v3-e-agente/eventos.json";
import { marca, recorte, type Gravacao } from "../gravacao";
import { criarMontagem, type Trecho } from "../montagem";
import { duracaoTotal, type FalaLocucao } from "../Video";
import { alvoDaCaixa, alvosDaGravacao, type Alvo } from "./base";
import { LogoCanal, Relogio24, Selo, type PropsCamada } from "./Efeitos";
import { ajudasDoReel, cliquesApos, criarGrupos } from "./montagemReel";
import { CenaNoiteReel, CenaRespostaReel } from "./NoiteReel";
import { Reel, type EdicaoReel, type SobreReel } from "./Reel";

// Reel 3 · Agente inteligente na conversa, 24 h (vertical, 9:16).
// 23h47: o cliente manda um áudio (celular) → a Lia entende e responde em áudio (plataforma) → o áudio
// dela toca no celular → ela atende nos três canais → manda o orçamento, marca a visita, cria a
// oportunidade e transfere com o resumo → como se configura a Lia (conhecimento, habilidades, tom, voz).

const g = {
  "v3-a-conversa": eventosA as unknown as Gravacao,
  "v3-b-canais": eventosB as unknown as Gravacao,
  "v3-c-agenda": eventosC as unknown as Gravacao,
  "v3-d-funil": eventosD as unknown as Gravacao,
  "v3-e-agente": eventosE as unknown as Gravacao,
};
const [A, B, C, D, E] = Object.values(g);
const loc = locucaoR3.falas as unknown as (FalaLocucao & { nivel?: number })[];
const TRANSICAO = 0.4;
const CORTE = 0.2;
const { durFala, palavra, trecho, fechar } = criarMontagem(loc, { url: "app.selloop.com.br/atendimento", transicao: TRANSICAO, pastaLocucao: "selloop/locucao/r3" });
const grupo = criarGrupos({ trecho, durFala, transicao: TRANSICAO, corte: CORTE });
const mA = (n: string) => marca(A, n);
const rA = (n: string) => recorte(A, n).t;
const rE = (n: string) => recorte(E, n).t;
/** Fala `id`, instante (s, dentro da fala) da palavra. */
const p = (id: string, texto: string, ordem = 0) => palavra(id, texto, ordem);

// ── Cliques de cada cena ──────────────────────────────────────────────────────────────────────────
const [cAbrir, cTranscricao] = cliquesApos(A, mA("abrir"));
const cCanais = cliquesApos(B, 0).slice(0, 3);
const [cDia] = cliquesApos(C, 0);
const [, cConhecimento] = cliquesApos(E, 0);

// ── Cenas do celular ──────────────────────────────────────────────────────────────────────────────
// 23h47: a narração, o cliente grava e manda o áudio, o áudio toca
const ANTES_NOITE = 0.45;
const NOITE = {
  casa: ANTES_NOITE + p("v3-01", "O") - 0.1,
  grava: ANTES_NOITE + p("v3-01", "cliente") - 0.2,
  envio: ANTES_NOITE + p("v3-01", "áudio") - 0.15,
  toca: ANTES_NOITE + durFala("v3-01") + 0.4,
  duracaoAudio: durFala("fabio-01"),
};
const DUR_NOITE = NOITE.toca + NOITE.duracaoAudio + 0.55;
// a resposta em áudio da Lia tocando no celular do cliente
const RESPOSTA = {
  grava: 0.45,
  envio: 1.55,
  toca: 1.85,
  duracaoAudio: durFala("lia-01"),
  resposta: 1.85 + durFala("lia-01") + 0.3,
  duracaoAudioCliente: durFala("fabio-01"),
  // o que ela resolve, no instante do áudio em que fala
  pontos: [
    { em: p("lia-01", "sim"), texto: "Entrega em Joinville" },
    { em: p("lia-01", "quinta"), texto: "40 fardos na quinta" },
    { em: p("lia-01", "orçamento"), texto: "Oferece o orçamento" },
  ],
};
const DUR_RESPOSTA = RESPOSTA.resposta + 0.95;

// ── Câmera de cada gravação (px CSS da tela, 1600×900) ────────────────────────────────────────────
const bolhaLia = recorte(A, "audio-lia").caixa;
const alvos: Record<string, Alvo[]> = {
  "v3-a-conversa": alvosDaGravacao(A, {
    zoomClique: 1.4,
    zoomRecorte: 1.3,
    folgaRecorte: 90,
    adiantaRecorte: 2.6,
    extras: [
      // quando a resposta da Lia chega, a câmera vai para ela
      { t: mA("resposta") + 0.1, cx: bolhaLia.x + bolhaLia.w / 2, cy: bolhaLia.y + bolhaLia.h / 2, zoom: 1.3 },
      // no pedido de prazo e na transferência, a parte de baixo da conversa inteira
      { t: mA("transferir") - 0.3, cx: 1002, cy: 610, zoom: 0.95 },
    ],
  }),
  // primeiro a lista com uma conversa de cada canal; nos cliques, a lista e a conversa lado a lado
  "v3-b-canais": [
    { t: 0, cx: 362, cy: 470, zoom: 1.6 },
    { t: cCanais[0].t - 0.2, cx: 730, cy: 450, zoom: 0.8 },
  ],
  // a quinta-feira no calendário e o painel do dia
  "v3-c-agenda": [{ t: 0, cx: 1130, cy: 520, zoom: 1.12 }],
  "v3-d-funil": [alvoDaCaixa(0, recorte(D, "card").caixa, { folga: 170, zoomMax: 1.5 })],
  "v3-e-agente": alvosDaGravacao(E, { zoomClique: 1.3, zoomRecorte: 1.25, folgaRecorte: 60, adiantaRecorte: 2.6, ignorar: (e) => e.tipo === "foco" }),
};

// ── Linha do tempo ────────────────────────────────────────────────────────────────────────────────
const T: Trecho[] = [];
/** Índice do primeiro trecho de cada momento, pelo nome. */
const I: Record<string, number> = {};
const ORDEM: string[] = [];
const por = (nome: string, ts: Trecho[]) => {
  I[nome] = T.length;
  ORDEM.push(nome);
  T.push(...ts);
};

// 1 · 23h47 no celular do cliente
por("noite", [{ bloco: { tipo: "cena", nome: "noite", dur: DUR_NOITE }, fala: "v3-01", antes: ANTES_NOITE }]);

// 2 · na plataforma: a Lia está atendendo, entende o áudio (transcrição) e responde em áudio
por(
  "lia",
  grupo(
    "v3-02",
    "v3-a-conversa",
    [
      { de: cAbrir.t - 0.3, ate: mA("transcricao"), fim: p("v3-02", "Ela") - 0.1 },
      { de: cTranscricao.t - 0.3, ate: mA("resposta"), fim: p("v3-02", "responde", 1) - 0.2 },
      { de: mA("resposta"), ate: rA("audio-lia") + 0.05 },
    ],
    { respiro: 0.7 },
  ),
);

// 3 · a resposta em áudio da Lia toca no celular
por("resposta", [{ bloco: { tipo: "cena", nome: "resposta", dur: DUR_RESPOSTA }, antes: 0 }]);

// 4 · 24 horas nos três canais: cada conversa abre na palavra do seu canal
const ADIANTA = 0.12;
por(
  "canais",
  grupo(
    "v3-03",
    "v3-b-canais",
    [
      { de: cCanais[0].t - 1.6, ate: cCanais[0].t, fim: p("v3-03", "WhatsApp") - ADIANTA },
      { de: cCanais[0].t, ate: cCanais[1].t, fim: p("v3-03", "Instagram") - ADIANTA },
      { de: cCanais[1].t, ate: cCanais[2].t, fim: p("v3-03", "Messenger") - ADIANTA },
      { de: cCanais[2].t, ate: recorte(B, "resposta-messenger").t + 0.1 },
    ],
    { respiro: 0.8 },
  ),
);

// 5 · habilidades em ação: orçamento, visita na agenda, oportunidade no CRM
por("orcamento", grupo("v3-04", "v3-a-conversa", [{ de: mA("orcamento") + 0.3, ate: rA("orcamento") + 0.05 }], { antes: 0.25, respiro: 0.55 }));
por("agenda", grupo("v3-05", "v3-c-agenda", [{ de: cDia.t - 0.4, ate: recorte(C, "visita").t + 0.05 }], { antes: 0.25, respiro: 0.55 }));
por("funil", grupo("v3-06", "v3-d-funil", [{ de: 0.6, ate: recorte(D, "card").t + 0.05 }], { antes: 0.25, respiro: 0.6 }));

// 6 · o assunto pede uma pessoa: a pergunta, a transferência e a nota com o resumo
const TRANSFERE = mA("transferir") + 2.45;
por(
  "transferir",
  grupo(
    "v3-07",
    "v3-a-conversa",
    [
      { de: mA("transferir") - 0.2, ate: TRANSFERE, fim: p("v3-07", "transfere") - 0.1 },
      { de: TRANSFERE, ate: TRANSFERE + 2.0, fim: p("v3-07", "com") - 0.05 },
      { de: rA("resumo") - 2.9, ate: A.duracao - 0.1 },
    ],
    { respiro: 0.9 },
  ),
);

// 7 · a configuração da Lia: conhecimento, habilidades, tom e voz
por(
  "treino",
  grupo(
    "v3-08",
    "v3-e-agente",
    [
      { de: cConhecimento.t - 0.3, ate: rE("conhecimento") + 0.05, fim: p("v3-08", "escolhe") - 0.1 },
      { de: rE("habilidades") - 1.2, ate: rE("habilidades") + 0.05, fim: p("v3-08", "tom") - 0.15 },
      { de: rE("tom") - 1.0, ate: rE("tom") + 0.05, fim: p("v3-08", "voz") - 0.25 },
      { de: rE("voz") - 1.6, ate: E.duracao - 0.1 },
    ],
    { respiro: 1.0 },
  ),
);

// a frase já está na tela: sem legenda
por("fim", [{ bloco: { tipo: "encerramento", dur: 4.9, frase: "Atendimento inteligente, 24 horas por dia." }, fala: "v3-09", antes: 0.5, legenda: false }]);

const M = fechar(T);
const { inicioBloco, fimBloco, noBloco, naGravacao, emFala } = M;
const { salto } = ajudasDoReel({ gravacoes: g, alvos, blocos: M.blocos, inicioBloco, fimBloco, noBloco, naGravacao });
/** Instante do vídeo em que a palavra da fala é dita. */
const dito = (id: string, texto: string, ordem = 0) => emFala(id) + p(id, texto, ordem);
/** Fim do momento `nome` (o último trecho antes do próximo momento). */
const fimDe = (nome: string) => fimBloco(I[ORDEM[ORDEM.indexOf(nome) + 1]] - 1);

// os áudios do Fábio e da Lia tocam dentro das cenas do celular
const falas = [
  ...M.edicao.falas,
  { id: "fabio-01", em: inicioBloco(I.noite) + NOITE.toca },
  { id: "lia-01", em: inicioBloco(I.resposta) + RESPOSTA.toca },
].sort((a, b) => a.em - b.em);

// ── Por cima da janela ────────────────────────────────────────────────────────────────────────────
const titulo = (texto: string, de: number, ate: number): SobreReel => ({ tipo: "titulo", texto, de, ate });
const camada = (de: number, ate: number, el: React.FC<PropsCamada>, o: { atras?: boolean; escurece?: boolean } = {}): SobreReel => ({ tipo: "camada", de, ate, el, ...o });
const sobre: SobreReel[] = [];

// 2 · a Lia atendendo; a transcrição do áudio; a resposta em áudio
{
  const i = I.lia;
  const fim = fimDe("lia");
  const ela = dito("v3-02", "Ela") - 0.1;
  sobre.push(titulo("Quem responde é a *Lia*", inicioBloco(i) + 0.15, ela), titulo("Entende o áudio e *responde em áudio*", ela + 0.05, fim));
  sobre.push(salto(i, "lia-atendendo", { de: dito("v3-02", "Lia") - 0.1, ate: ela, w: 760, cy: 900, raio: 999, rot: -2 }));
  sobre.push(camada(dito("v3-02", "agente") - 0.1, ela, (q) => <Selo {...q} x={540} y={1110} texto="Agente inteligente da Nova Rota" icone="robo" tom="marca" tamanho={40} />));
  sobre.push(salto(i + 1, "audio-fabio", { de: noBloco(i + 1, cTranscricao.t + 0.55), ate: fim, w: 950, cy: 760, raio: 16, rot: -1.5 }));
  sobre.push(salto(i + 2, "audio-lia", { de: dito("v3-02", "responde", 1) + 0.3, ate: fim, w: 950, cy: 1085, raio: 16, rot: 1.5 }));
}

// 3 · no celular
{
  const i = I.resposta;
  sobre.push(titulo("A *resposta em áudio* da Lia", inicioBloco(i) + 0.2, fimBloco(i) - 0.1));
}

// 4 · canais: a resposta da Lia em cada canal, com a logo dele
{
  const i = I.canais;
  const fim = fimDe("canais");
  sobre.push(titulo("Atende *24 horas por dia*", inicioBloco(i) + 0.15, fim));
  sobre.push(camada(dito("v3-03", "24") - 0.3, dito("v3-03", "WhatsApp") + 0.3, (q) => <Relogio24 {...q} x={540} y={935} />, { escurece: true }));
  const LINHAS = [
    { canal: "whatsapp", dito: "WhatsApp", recorte: "resposta-whatsapp", cy: 735, rot: -1.5 },
    { canal: "instagram", dito: "Instagram", recorte: "resposta-instagram", cy: 950, rot: 1.5 },
    { canal: "messenger", dito: "Messenger", recorte: "resposta-messenger", cy: 1165, rot: -1.5 },
  ] as const;
  LINHAS.forEach((l, k) => {
    const de = dito("v3-03", l.dito) + 0.3;
    sobre.push(salto(i + k + 1, l.recorte, { de, ate: fim, w: 860, cx: 580, cy: l.cy, raio: 16, rot: l.rot, faiscas: false }));
    sobre.push(camada(dito("v3-03", l.dito) - 0.1, fim, (q) => <LogoCanal {...q} canal={l.canal} x={128} y={l.cy - 58} tamanho={112} />));
  });
}

// 5 · orçamento: os itens e o total que o cliente montou
{
  const i = I.orcamento;
  const fim = fimDe("orcamento");
  sobre.push(titulo("Manda o *orçamento*", inicioBloco(i) + 0.15, fim));
  sobre.push(salto(i, "orcamento", { de: noBloco(i, rA("orcamento") - 1.75), ate: fim, parte: { x: 0, y: 0.42, w: 1, h: 0.5 }, w: 900, raio: 14, rot: -1.5 }));
}

// 6 · a visita na agenda do vendedor
{
  const i = I.agenda;
  const fim = fimDe("agenda");
  sobre.push(titulo("Marca a *visita* na agenda", inicioBloco(i) + 0.15, fim));
  sobre.push(salto(i, "visita", { de: noBloco(i, cDia.t + 0.9), ate: fim, w: 880, cy: 880, raio: 16, rot: -1.5 }));
  sobre.push(camada(dito("v3-05", "agenda") - 0.05, fim, (q) => <Selo {...q} x={540} y={1110} texto="Quinta, 10h · com o Diogo" icone="agenda" tom="marca" tamanho={42} giro={1.5} />));
}

// 7 · a oportunidade no funil de vendas
{
  const i = I.funil;
  const fim = fimDe("funil");
  sobre.push(titulo("Cria a *oportunidade* no CRM", inicioBloco(i) + 0.15, fim));
  sobre.push(salto(i, "card", { de: dito("v3-06", "oportunidade") - 0.15, ate: fim, w: 880, cy: 900, raio: 16, rot: -1.5 }));
  sobre.push(camada(dito("v3-06", "CRM") - 0.1, fim, (q) => <Selo {...q} x={540} y={1215} texto="Criada pela Lia" icone="robo" tom="marca" tamanho={42} giro={1.5} />));
}

// 8 · transferência com o resumo
{
  const i = I.transferir;
  const fim = fimDe("transferir");
  sobre.push(titulo("Transfere com o *resumo da conversa*", inicioBloco(i) + 0.15, fim));
  sobre.push(salto(i + 1, "transferida", { de: dito("v3-07", "transfere") + 0.3, ate: fim, w: 820, cy: 790, raio: 999, rot: -1.5 }));
  sobre.push(salto(i + 2, "resumo", { de: dito("v3-07", "resumo") - 0.2, ate: fim, w: 940, cy: 1040, raio: 14, rot: 1.2 }));
}

// 9 · a configuração: o conhecimento, as habilidades (em nuvem), o tom e a voz
{
  const i = I.treino;
  const fim = fimDe("treino");
  const escolhe = dito("v3-08", "escolhe") - 0.1;
  sobre.push(titulo("Você *treina* a Lia", inicioBloco(i) + 0.15, escolhe), titulo("Habilidades, tom e *voz*", escolhe + 0.05, fim));
  // os documentos e o site da base de conhecimento
  sobre.push(salto(i, "conhecimento", { de: dito("v3-08", "com") - 0.1, ate: escolhe + 0.1, parte: { x: 0, y: 0, w: 0.6, h: 1 }, w: 880, raio: 14, rot: -1.5 }));
  // as habilidades, com os nomes que têm na plataforma
  const HABILIDADES = [
    ["Agendar Reunião", "agenda", 300, 640],
    ["Criar Card no CRM", "funil", 762, 660],
    ["Envio de Formulários", "formulario", 284, 770],
    ["Transferir Atendimento", "transferir", 772, 790],
    ["Consultar Integrações", "documento", 300, 900],
    ["Follow-up", "repetir", 742, 920],
  ] as const;
  const nuvem = dito("v3-08", "habilidades") - 0.25;
  HABILIDADES.forEach(([nome, icone, x, y], k) =>
    sobre.push(camada(nuvem + k * 0.1, fim, (q) => <Selo {...q} x={x} y={y} texto={nome} icone={icone} tom={k % 3 === 1 ? "marca" : "claro"} tamanho={33} giro={k % 2 ? 2 : -2} />, { escurece: true })),
  );
  sobre.push(camada(dito("v3-08", "tom") - 0.1, fim, (q) => <Selo {...q} x={540} y={1050} texto="Tom consultivo e acolhedor" icone="conversa" tom="verde" tamanho={40} />, { escurece: true }));
  sobre.push(salto(i + 3, "voz", { de: dito("v3-08", "voz") - 0.1, ate: fim, parte: { x: 0, y: 0, w: 0.66, h: 0.74 }, w: 900, cy: 1215, raio: 14, rot: -1 }));
}

export const edicaoR3: EdicaoReel = {
  ...M.edicao,
  falas,
  sobre,
  alvos,
  assunto: "Agente de IA",
  icone: "robo",
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.18, volumeFala: 0.06 },
};
export const DURACAO_R3 = Math.max(duracaoTotal(edicaoR3), emFala("v3-09") + durFala("v3-09") + 1.5);

const cenas = {
  noite: () => <CenaNoiteReel {...NOITE} />,
  resposta: () => <CenaRespostaReel {...RESPOSTA} />,
};

export const SelloopReelAgente: React.FC = () => <Reel edicao={edicaoR3} gravacoes={g} locucao={loc} cenas={cenas} />;
