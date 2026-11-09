import React from "react";
import locucaoV2 from "../../../public/selloop/locucao/v2/locucao.json";
import eventosA from "../../../public/selloop/telas/v2-a-painel/eventos.json";
import eventosB from "../../../public/selloop/telas/v2-b-nova-campanha/eventos.json";
import eventosC from "../../../public/selloop/telas/v2-c-relatorio/eventos.json";
import eventosD from "../../../public/selloop/telas/v2-d-modelos/eventos.json";
import type { Plano } from "../camera";
import { cliques, foco, marca, tempoFoco, type Gravacao } from "../gravacao";
import { criarMontagem, type Trecho } from "../montagem";
import { duracaoTotal, Video, type Edicao, type FalaLocucao, type Sobreposicao } from "../Video";

// Vídeo 2 · Disparador de campanhas no WhatsApp.
// Painel → campanha nova passo a passo (identificação, público, validação, agendamento, modelo, quem
// responde, sequência, confirmação) → relatório e leads sem interação → um modelo para cada uso.

const g = {
  "v2-a-painel": eventosA as unknown as Gravacao,
  "v2-b-nova-campanha": eventosB as unknown as Gravacao,
  "v2-c-relatorio": eventosC as unknown as Gravacao,
  "v2-d-modelos": eventosD as unknown as Gravacao,
};
const loc = locucaoV2.falas as unknown as FalaLocucao[];
const TRANSICAO = 0.35;
const { durFala, palavra, trecho, fechar } = criarMontagem(loc, { url: "app.selloop.com.br/atendimento", transicao: TRANSICAO, pastaLocucao: "selloop/locucao/v2" });
const [A, B, C, D] = Object.values(g);
const mB = (nome: string) => marca(B, nome);

// Enquadramentos da campanha nova (px CSS da tela gravada, 1600×900)
const IDENTIFICACAO = { x: 248, y: 126, w: 728, h: 206 };
const INICIO = { x: 248, y: 470, w: 728, h: 225 };
const PREVIA_MODELO = { x: 807, y: 144, w: 416, h: 382 };
const RESPOSTA = { x: 992, y: 690, w: 360, h: 170 };
const MEIO = { x: 800, y: 450 };
/** Lista de modelos + prévia no WhatsApp, lado a lado, na janela "Modelo da campanha". */
const MODELOS_E_PREVIA = { x: 376, y: 144, w: 847, h: 382 };
const PLANOS_D: Plano[] = [{ t: 0, caixa: MODELOS_E_PREVIA, folga: 40 }];

const PLANOS_B: Plano[] = [
  { t: 0, zoom: 1 },
  { t: mB("nova") + 0.8, caixa: IDENTIFICACAO, folga: 80, dur: 0.9 },
  { t: mB("publico") + 0.2, zoom: 1.12, ...MEIO, dur: 0.8 },
  { t: mB("validar") + 0.2, zoom: 1.2, ...MEIO, dur: 0.7 },
  { t: mB("agendar") - 0.1, caixa: INICIO, folga: 90, dur: 0.8 },
  { t: mB("regras") + 0.3, zoom: 1.08, ...MEIO, dur: 0.7 },
  { t: mB("modelo") + 0.3, zoom: 1.1, ...MEIO, dur: 0.7 },
  { t: mB("modelo-preview") - 0.3, caixa: PREVIA_MODELO, folga: 50, dur: 0.9 },
  { t: mB("resposta") - 0.3, caixa: RESPOSTA, folga: 90, dur: 0.8 },
  { t: mB("sequencia") + 0.3, zoom: 1.08, x: 860, y: 430, dur: 0.8 },
  { t: tempoFoco(B, "seq-lia") - 0.2, caixa: foco(B, "seq-lia"), folga: 220, dur: 0.8 },
  { t: tempoFoco(B, "seq-lia") + 1.4, zoom: 1.12, x: 860, y: 480, dur: 0.9 },
  { t: mB("confirmar") + 0.4, zoom: 1.3, ...MEIO, dur: 0.8 },
  { t: mB("agendada") + 0.1, zoom: 1, dur: 0.8 },
  { t: tempoFoco(B, "linha-nova"), caixa: foco(B, "linha-nova"), folga: 260, dur: 1 },
];

// Os modelos trocam no instante em que o narrador fala cada uso
const USOS: [string, string][] = [
  ["promoções", "Promoções"],
  ["comunicados", "Comunicados"],
  ["lembretes", "Lembretes de pagamento"],
  ["lançamentos", "Lançamentos"],
  ["reativar", "Reativação de clientes"],
  ["convidar", "Convites para eventos"],
];
const cliquesD = cliques(D).slice(0, USOS.length).map((c) => c.t);
const palavrasUso = USOS.map(([p]) => palavra("v2-10", p));
const ANTES_V210 = 0.3;
const ADIANTA = 0.12; // o clique aparece um tico antes da palavra: a troca do modelo acompanha a fala
const trechosModelos: Trecho[] = (() => {
  const r: Trecho[] = [];
  // do começo da cena até o primeiro clique, chegando nele junto com "promoções"
  const ini = Math.max(0, cliquesD[0] - 1.2);
  const ateClique0 = palavrasUso[0] + ANTES_V210 + TRANSICAO * 0.5 - ADIANTA;
  r.push({ ...trecho("v2-d-modelos", ini, cliquesD[0], { vel: (cliquesD[0] - ini) / ateClique0, planos: PLANOS_D }), fala: "v2-10", antes: ANTES_V210 });
  for (let k = 0; k + 1 < cliquesD.length; k++) {
    const vel = (cliquesD[k + 1] - cliquesD[k]) / (palavrasUso[k + 1] - palavrasUso[k]);
    r.push(trecho("v2-d-modelos", cliquesD[k], cliquesD[k + 1], { vel, planos: PLANOS_D }));
  }
  // depois do último clique: o resto da frase e um respiro
  const fimD = marca(D, "fim") + 0.5;
  const resto = durFala("v2-10") - palavrasUso[palavrasUso.length - 1] + 0.6;
  r.push(trecho("v2-d-modelos", cliquesD[cliquesD.length - 1], fimD, { vel: (fimD - cliquesD[cliquesD.length - 1]) / resto, planos: PLANOS_D }));
  return r;
})();

const trechos: Trecho[] = [
  { bloco: { tipo: "abertura", dur: 1.9 }, antes: 0 },
  // O painel de campanhas: mensagens enviadas, lidas e respondidas
  trecho("v2-a-painel", 0.3, A.duracao, { fala: "v2-01", antes: 0.3, velMin: 0.75, zoomCliques: 1.15 }),
  // Campanha nova, etapa por etapa
  trecho("v2-b-nova-campanha", mB("nova") - 0.2, mB("publico"), { fala: "v2-02", antes: 0.3, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", mB("publico"), mB("validar"), { fala: "v2-03", antes: 0.3, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", mB("validar"), mB("agendar"), { fala: "v2-04", antes: 0.3, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", mB("agendar"), mB("modelo"), { fala: "v2-05", antes: 0.3, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", mB("modelo"), mB("resposta"), { fala: "v2-06", antes: 0.3, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", mB("resposta"), tempoFoco(B, "seq-lia") + 1.2, { fala: "v2-07", antes: 0.3, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", tempoFoco(B, "seq-lia") + 1.2, mB("confirmar"), { fala: "v2-06b", antes: 0.3, velMax: 3.4, planos: PLANOS_B }),
  trecho("v2-b-nova-campanha", mB("confirmar"), B.duracao, { fala: "v2-07b", antes: 0.3, planos: PLANOS_B }),
  // Relatório: quem recebeu, leu e respondeu, e o fluxo com os números de cada mensagem
  trecho("v2-c-relatorio", marca(C, "abrir") - 0.2, marca(C, "sem-interacao"), { fala: "v2-08", antes: 0.3, velMax: 2.6, zoomCliques: 1.15 }),
  // Quem não interagiu ganha a tag "Nova abordagem"
  trecho("v2-c-relatorio", marca(C, "sem-interacao"), C.duracao, { fala: "v2-09", antes: 0.3, zoomCliques: 1.2 }),
  // Um modelo para cada uso
  ...trechosModelos,
  // a frase já está na tela: sem legenda
  { bloco: { tipo: "encerramento", dur: 4.6, frase: "Suas vendas em loop." }, fala: "v2-11", antes: 0.5, legenda: false },
];
const { edicao: ed0, fimBloco, emFala, idx } = fechar(trechos);

const CHIP = { x: 1480, y: 140 };
const chip = (fala: string, texto: string, o: Partial<{ de: number; ate: number; x: number; y: number }> = {}): Sobreposicao => ({
  tipo: "chip",
  texto,
  ...CHIP,
  de: emFala(fala) - 0.1,
  ate: fimBloco(idx(fala)) - 0.15,
  destaque: true,
  ...o,
});

const iModelos = idx("v2-10");
const emV210 = emFala("v2-10");
const chipsUsos: Sobreposicao[] = USOS.map(([p, texto], k) => ({
  tipo: "chip",
  texto,
  ...CHIP,
  de: emV210 + palavrasUso[k] - 0.1,
  ate: k + 1 < USOS.length ? emV210 + palavrasUso[k + 1] - 0.12 : fimBloco(iModelos + USOS.length) - 0.15,
  destaque: true,
}));

const sobreposicoes: Sobreposicao[] = [
  { tipo: "canal", canal: "whatsapp", x: 1290, y: 600, de: emFala("v2-01") + palavra("v2-01", "WhatsApp") - 0.05, ate: fimBloco(1) - 0.1, tamanho: 120, comNome: true },
  chip("v2-01", "Campanhas no WhatsApp oficial", { de: emFala("v2-01") + palavra("v2-01", "campanhas") }),
  chip("v2-02", "Nome, equipe e número"),
  chip("v2-03", "Público por tag, segmento ou cidade"),
  chip("v2-04", "Validação de WhatsApp"),
  chip("v2-05", "Agendamento e limite por dia"),
  chip("v2-06", "Modelo aprovado pela Meta"),
  chip("v2-07", "Agente de IA responde na hora"),
  chip("v2-06b", "Sequência de follow-up"),
  chip("v2-07b", "Campanha agendada"),
  chip("v2-08", "Relatório da campanha"),
  chip("v2-09", "Leads sem interação"),
  ...chipsUsos,
];

export const edicaoV2: Edicao = {
  ...ed0,
  sobreposicoes,
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.2, volumeFala: 0.075 },
};
export const DURACAO_V2 = Math.max(duracaoTotal(edicaoV2), emFala("v2-11") + durFala("v2-11") + 1.4);

export const SelloopCampanhas: React.FC = () => <Video edicao={edicaoV2} gravacoes={g} locucao={loc} />;
