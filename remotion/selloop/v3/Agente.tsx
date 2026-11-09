import React from "react";
import locucaoV3 from "../../../public/selloop/locucao/v3/locucao.json";
import eventosA from "../../../public/selloop/telas/v3-a-conversa/eventos.json";
import eventosB from "../../../public/selloop/telas/v3-b-canais/eventos.json";
import eventosC from "../../../public/selloop/telas/v3-c-agenda/eventos.json";
import eventosD from "../../../public/selloop/telas/v3-d-funil/eventos.json";
import eventosE from "../../../public/selloop/telas/v3-e-agente/eventos.json";
import type { Plano } from "../camera";
import { cliques, foco, marca, tempoFoco, type Gravacao } from "../gravacao";
import { criarMontagem, type Trecho } from "../montagem";
import { duracaoTotal, Video, type Edicao, type FalaLocucao, type Sobreposicao } from "../Video";
import { CenaNoite, CenaResposta } from "./Noite";

// Vídeo 3 · Agente inteligente na conversa, 24 h.
// 23h47: o cliente manda um áudio (celular) → a Lia entende e responde em áudio (plataforma) → o áudio
// dela toca no celular → ela atende nos três canais → manda orçamento, marca a visita, cria a
// oportunidade, transfere com resumo → como se configura a Lia (Agente Hub).

const g = {
  "v3-a-conversa": eventosA as unknown as Gravacao,
  "v3-b-canais": eventosB as unknown as Gravacao,
  "v3-c-agenda": eventosC as unknown as Gravacao,
  "v3-d-funil": eventosD as unknown as Gravacao,
  "v3-e-agente": eventosE as unknown as Gravacao,
};
const loc = locucaoV3.falas as unknown as FalaLocucao[];
const TRANSICAO = 0.35;
const { durFala, palavra, trecho, sincronizar, fechar } = criarMontagem(loc, { url: "app.selloop.com.br/atendimento", transicao: TRANSICAO, pastaLocucao: "selloop/locucao/v3" });
const [A, B, C, D, E] = Object.values(g);
const mA = (n: string) => marca(A, n);

// ── Cena da noite (celular): narração, o cliente grava e manda o áudio, o áudio toca ───────────────
const ANTES_NOITE = 0.5;
const N0 = TRANSICAO * 0.5 + ANTES_NOITE; // início da narração dentro do bloco
const NOITE = {
  fala: N0,
  casa: N0 + palavra("v3-01", "O"),
  grava: N0 + palavra("v3-01", "cliente") - 0.2,
  envio: N0 + palavra("v3-01", "áudio") - 0.25,
  toca: N0 + durFala("v3-01") + 0.45,
  duracaoAudio: durFala("fabio-01"),
};
const DUR_NOITE = NOITE.toca + NOITE.duracaoAudio + 0.6;

// ── Resposta da Lia no celular ─────────────────────────────────────────────────────────────────────
const RESPOSTA = { grava: 0.5, envio: 1.75, toca: 2.05, duracaoAudio: durFala("lia-01"), resposta: 2.05 + durFala("lia-01") + 0.35, duracaoAudioCliente: durFala("fabio-01") };
const DUR_RESPOSTA = RESPOSTA.resposta + 1.0;

// ── Enquadramentos (px CSS da tela gravada, 1600×900) ─────────────────────────────────────────────
const CHAT = { zoom: 1.28, x: 1000, y: 500 };
const PLANOS_A: Plano[] = [
  { t: 0, zoom: 1 },
  { t: tempoFoco(A, "lia-atendendo") - 0.3, caixa: foco(A, "lia-atendendo"), folga: 260, dur: 0.8 },
  { t: mA("transcricao") + 0.3, ...CHAT, dur: 0.9 },
  { t: mA("transferir") - 0.2, ...CHAT, y: 560, dur: 0.6 },
  { t: tempoFoco(A, "resumo") - 0.4, caixa: foco(A, "resumo"), folga: 160, dur: 0.9 },
];
const PLANOS_D: Plano[] = [
  { t: 0, zoom: 1 },
  { t: tempoFoco(D, "card-lia") - 0.2, caixa: foco(D, "card-lia"), folga: 190, dur: 1.0 },
];
/** Na fala do v3-08, quando a tela chega na "Resposta em Áudio" (pouco depois de "voz"). */
const VOZ_V8 = palavra("v3-08", "voz") + 1.6;
const PLANOS_E: Plano[] = [
  { t: 0, zoom: 1 },
  { t: marca(E, "conhecimento") + 0.2, zoom: 1.18, x: 960, y: 560, dur: 0.8 },
  { t: tempoFoco(E, "voz") - 0.3, caixa: foco(E, "voz"), folga: 210, dur: 0.9 },
];
const PLANOS_C: Plano[] = [
  { t: 0, zoom: 1.05 },
  { t: marca(C, "dia") + 0.2, caixa: { x: 740, y: 480, w: 850, h: 140 }, folga: 110, dur: 1.0 },
  { t: marca(C, "painel") - 0.4, caixa: { x: 740, y: 380, w: 850, h: 260 }, folga: 90, dur: 0.9 },
];

// ── Âncoras: cada momento da tela cai numa palavra da narração ────────────────────────────────────
const cB = cliques(B).map((c) => c.t);
const abreConversa = 0.35; // a conversa aparece um tico depois do clique
const tLiaAparece = mA("resposta") + 0.25;
const tNota = mA("transferir") + 5.6; // a nota interna aparece ~2 s depois do realtime reconectar
const tTransfere = mA("transferir") + 2.55;

const trechos: Trecho[] = [
  { bloco: { tipo: "abertura", dur: 1.9 }, antes: 0 },
  // 23h47 no celular do cliente; depois o áudio dele toca
  { bloco: { tipo: "cena", nome: "noite", dur: DUR_NOITE }, fala: "v3-01", antes: ANTES_NOITE },
  // A Lia atende: entende o áudio (transcrição) e responde em áudio
  ...sincronizar("v3-a-conversa", mA("abrir") - 0.3, [
    [tempoFoco(A, "lia-atendendo") + 0.2, palavra("v3-02", "Lia")],
    [cliques(A)[1].t + 0.15, palavra("v3-02", "entende")],
    [tLiaAparece, palavra("v3-02", "responde", 1)],
    [mA("orcamento") - 0.3, durFala("v3-02") + 0.55],
  ], { fala: "v3-02", antes: 0.35, transicao: TRANSICAO, planos: PLANOS_A }),
  // O áudio da Lia toca no celular do cliente
  { bloco: { tipo: "cena", nome: "resposta", dur: DUR_RESPOSTA }, antes: 0 },
  // 24 h nos três canais
  ...sincronizar("v3-b-canais", 0.3, [
    [cB[0] + abreConversa, palavra("v3-03", "WhatsApp")],
    [cB[1] + abreConversa, palavra("v3-03", "Instagram")],
    [cB[2] + abreConversa, palavra("v3-03", "Messenger")],
    [B.duracao - 0.2, durFala("v3-03") + 0.5],
  ], { fala: "v3-03", antes: 0.35, transicao: TRANSICAO, zoomCliques: 1.2 }),
  // Habilidades em ação
  trecho("v3-a-conversa", mA("orcamento") - 0.2, mA("visita") - 0.3, { fala: "v3-04", antes: 0.3, velMax: 2.4, planos: PLANOS_A }),
  trecho("v3-c-agenda", marca(C, "dia") - 0.3, C.duracao - 0.3, { fala: "v3-05", antes: 0.25, velMax: 3.2, planos: PLANOS_C }),
  trecho("v3-d-funil", 0.5, D.duracao - 0.3, { fala: "v3-06", antes: 0.25, velMax: 3, planos: PLANOS_D }),
  ...sincronizar("v3-a-conversa", mA("transferir") - 0.2, [
    [tTransfere, palavra("v3-07", "transfere")],
    [tNota, palavra("v3-07", "resumo")],
    [A.duracao - 0.3, durFala("v3-07") + 1.1],
  ], { fala: "v3-07", antes: 0.3, transicao: TRANSICAO, planos: PLANOS_A }),
  // Como se configura a Lia
  ...sincronizar("v3-e-agente", marca(E, "abrir") - 0.3, [
    [marca(E, "conhecimento") + 0.6, palavra("v3-08", "Lia")],
    [marca(E, "habilidades") + 0.6, palavra("v3-08", "habilidades")],
    [cliques(E)[3].t + 0.3, palavra("v3-08", "tom") + 0.8],
    // a resposta em áudio entra logo depois da fala e fica um pouco mais na tela
    [tempoFoco(E, "voz"), VOZ_V8],
    [E.duracao - 0.3, VOZ_V8 + 1.8],
  ], { fala: "v3-08", antes: 0.35, transicao: TRANSICAO, planos: PLANOS_E }),
  // a frase já está na tela: sem legenda
  { bloco: { tipo: "encerramento", dur: 4.8, frase: "Atendimento inteligente, 24 horas por dia." }, fala: "v3-09", antes: 0.5, legenda: false },
];
const { edicao: ed0, inicioBloco, fimBloco, emFala, idx } = fechar(trechos);

const iNoite = trechos.findIndex((x) => x.bloco.tipo === "cena" && x.bloco.nome === "noite");
const iResposta = trechos.findIndex((x) => x.bloco.tipo === "cena" && x.bloco.nome === "resposta");
// os áudios do Fábio e da Lia tocam dentro dos blocos do celular
const falas = [
  ...ed0.falas,
  { id: "fabio-01", em: inicioBloco(iNoite) + NOITE.toca },
  { id: "lia-01", em: inicioBloco(iResposta) + RESPOSTA.toca },
].sort((a, b) => a.em - b.em);

const CHIP = { x: 1480, y: 140 };
const chip = (texto: string, de: number, ate: number): Sobreposicao => ({ tipo: "chip", texto, ...CHIP, de, ate, destaque: true });
const emV2 = emFala("v3-02");
const emV3 = emFala("v3-03");
const emV8 = emFala("v3-08");
const fimDe = (fala: string, n = 1) => fimBloco(idx(fala) + n - 1) - 0.15;

const sobreposicoes: Sobreposicao[] = [
  chip("Lia atendendo · 23h47", emV2 + palavra("v3-02", "Lia") - 0.2, emV2 + palavra("v3-02", "entende") - 0.15),
  chip("Entende o áudio", emV2 + palavra("v3-02", "entende") - 0.1, emV2 + palavra("v3-02", "responde", 1) - 0.15),
  chip("Responde em áudio", emV2 + palavra("v3-02", "responde", 1) - 0.1, fimDe("v3-02", 4)),
  chip("24 horas por dia", emV3 + palavra("v3-03", "24") - 0.1, fimDe("v3-03", 4)),
  { tipo: "canal", canal: "whatsapp", x: 1250, y: 420, de: emV3 + palavra("v3-03", "WhatsApp") - 0.05, ate: fimDe("v3-03", 4), tamanho: 110, comNome: true },
  { tipo: "canal", canal: "instagram", x: 1400, y: 580, de: emV3 + palavra("v3-03", "Instagram") - 0.05, ate: fimDe("v3-03", 4), tamanho: 110, comNome: true },
  { tipo: "canal", canal: "messenger", x: 1250, y: 740, de: emV3 + palavra("v3-03", "Messenger") - 0.05, ate: fimDe("v3-03", 4), tamanho: 110, comNome: true },
  chip("Orçamento no WhatsApp", emFala("v3-04") + palavra("v3-04", "orçamento") - 0.3, fimDe("v3-04")),
  chip("Visita na agenda do vendedor", emFala("v3-05") - 0.1, fimDe("v3-05")),
  chip("Oportunidade criada no CRM", emFala("v3-06") - 0.1, fimDe("v3-06")),
  chip("Transfere com o resumo", emFala("v3-07") + palavra("v3-07", "transfere") - 0.1, fimDe("v3-07", 3)),
  chip("Base de conhecimento", emV8 + palavra("v3-08", "treina") - 0.1, emV8 + palavra("v3-08", "habilidades") - 0.15),
  chip("Habilidades", emV8 + palavra("v3-08", "habilidades") - 0.1, emV8 + palavra("v3-08", "tom") + 0.6),
  chip("Tom de comunicação", emV8 + palavra("v3-08", "tom") + 0.7, emV8 + VOZ_V8 - 0.6),
  chip("Resposta em áudio, com a voz da Lia", emV8 + VOZ_V8 - 0.5, fimDe("v3-08", 5)),
];

export const edicaoV3: Edicao = {
  ...ed0,
  falas,
  sobreposicoes,
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.18, volumeFala: 0.06 },
};
export const DURACAO_V3 = Math.max(duracaoTotal(edicaoV3), emFala("v3-09") + durFala("v3-09") + 1.4);

const cenas = {
  noite: () => <CenaNoite {...NOITE} />,
  resposta: () => <CenaResposta {...RESPOSTA} />,
};

export const SelloopAgente: React.FC = () => <Video edicao={edicaoV3} gravacoes={g} locucao={loc} cenas={cenas} />;
