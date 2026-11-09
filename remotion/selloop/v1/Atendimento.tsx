import React from "react";
import locucaoV1 from "../../../public/selloop/locucao/v1/locucao.json";
import eventosA from "../../../public/selloop/telas/v1-a-caixa/eventos.json";
import eventosB from "../../../public/selloop/telas/v1-b-privacidade/eventos.json";
import eventosC from "../../../public/selloop/telas/v1-c-recursos/eventos.json";
import eventosD from "../../../public/selloop/telas/v1-d-protocolo/eventos.json";
import eventosE from "../../../public/selloop/telas/v1-e-concluir/eventos.json";
import eventosF from "../../../public/selloop/telas/v1-f-indicadores/eventos.json";
import type { Plano } from "../camera";
import { foco, marca, type Gravacao } from "../gravacao";
import { criarMontagem, type Trecho } from "../montagem";
import { duracaoTotal, Video, type Edicao, type FalaLocucao, type Sobreposicao } from "../Video";

// Vídeo 1 · Ambiente de atendimento.
// A edição é guiada pela locução: cada trecho de tela tem a sua fala e ajusta a velocidade para caber nela.
// Os cortes saem das marcas gravadas em cada cena (g.marca), então uma cena regravada continua encaixando.

const g = {
  "v1-a-caixa": eventosA as unknown as Gravacao,
  "v1-b-privacidade": eventosB as unknown as Gravacao,
  "v1-c-recursos": eventosC as unknown as Gravacao,
  "v1-d-protocolo": eventosD as unknown as Gravacao,
  "v1-e-concluir": eventosE as unknown as Gravacao,
  "v1-f-indicadores": eventosF as unknown as Gravacao,
};
const loc = locucaoV1.falas as unknown as FalaLocucao[];
const TRANSICAO = 0.35;
const { durFala, palavra, trecho, fechar } = criarMontagem(loc, { url: "app.selloop.com.br/atendimento", transicao: TRANSICAO, pastaLocucao: "selloop/locucao/v1" });
const [A, B, C, D, E, F] = Object.values(g);

// Enquadramentos (px CSS da tela gravada, 1600×900)
const LISTA = { x: 96, y: 150, w: 330, h: 720 };
const CHAT: Plano[] = [{ t: 0, zoom: 1.3, x: 930, y: 495 }];

const trechos: Trecho[] = [
  { bloco: { tipo: "abertura", dur: 1.9 }, antes: 0 },
  // A caixa de entrada: os três canais na fila "Novos"
  trecho("v1-a-caixa", 0.4, marca(A, "todos"), { fala: "v1-01", antes: 0.3, velMin: 0.7, planos: [{ t: 0, zoom: 1 }, { t: 1.5, caixa: LISTA, folga: 140, dur: 1.6 }] }),
  // Aba Todos: a empresa inteira atendendo
  trecho("v1-a-caixa", marca(A, "todos"), marca(A, "elaine"), { fala: "v1-02", antes: 0.2, velMin: 0.75, planos: [{ t: 0, caixa: LISTA, folga: 140 }, { t: marca(A, "todos") + 1.4, caixa: LISTA, folga: 60, dur: 1.4 }] }),
  // A visão do atendente: só Novos e Meus
  trecho("v1-b-privacidade", 0.6, B.duracao, { fala: "v1-03", antes: 0.25, velMax: 2.2, planos: [{ t: 0, caixa: { x: 100, y: 150, w: 320, h: 260 }, folga: 70, dur: 0.01 }, { t: marca(B, "meus") + 0.5, caixa: LISTA, folga: 100, dur: 1.2 }] }),
  // O administrador acompanha a transferência para o Financeiro
  trecho("v1-a-caixa", marca(A, "elaine") - 0.2, A.duracao, { fala: "v1-04", antes: 0.25, velMin: 0.65, planos: [{ t: 0, zoom: 1.05 }, { t: marca(A, "elaine") + 0.5, caixa: foco(A, "transferida"), folga: 280, dur: 1.5 }] }),
  // Recursos do clipe, cada um com a sua frase
  trecho("v1-c-recursos", marca(C, "produtos") - 0.2, marca(C, "orcamento"), { fala: "v1-05", antes: 0.3, velMax: 3, planos: CHAT }),
  trecho("v1-c-recursos", marca(C, "orcamento"), marca(C, "formulario"), { fala: "v1-05b", antes: 0.3, velMax: 3, planos: CHAT }),
  trecho("v1-c-recursos", marca(C, "formulario"), marca(C, "enquete"), { fala: "v1-05c", antes: 0.3, velMax: 3, planos: CHAT }),
  trecho("v1-c-recursos", marca(C, "enquete"), marca(C, "pagamento"), { fala: "v1-05d", antes: 0.3, velMax: 3, planos: CHAT }),
  trecho("v1-c-recursos", marca(C, "pagamento"), marca(C, "notas"), { fala: "v1-06", antes: 0.4, velMax: 3, planos: CHAT }),
  trecho("v1-c-recursos", marca(C, "notas"), marca(C, "agendar"), { fala: "v1-06b", antes: 0.3, velMax: 3, planos: CHAT }),
  trecho("v1-c-recursos", marca(C, "agendar"), marca(C, "fim") + 0.9, { fala: "v1-06c", antes: 0.6, velMax: 3, planos: CHAT }),
  // Protocolo: o pedido, a Central de Protocolos e o PDF; a volta para a conversa vai bem rápida
  trecho("v1-d-protocolo", marca(D, "pedido") - 0.2, marca(D, "pdf-pronto") + 1.6, { fala: "v1-07", antes: 0.3, velMax: 2.2, zoomCliques: 1.3 }),
  trecho("v1-d-protocolo", marca(D, "pdf-pronto") + 1.6, marca(D, "fim") + 0.6, { vel: 4, zoomCliques: 1.3 }),
  // Concluir com pesquisa e a avaliação chegando
  trecho("v1-e-concluir", marca(E, "concluir") - 0.3, E.duracao, { fala: "v1-08", antes: 0.3, velMax: 2, zoomCliques: 1.4 }),
  // Indicadores
  trecho("v1-f-indicadores", marca(F, "abrir") - 0.2, F.duracao, { fala: "v1-09", antes: 0.4, velMax: 1.9, zoomCliques: 1.2 }),
  // a frase já está na tela: sem legenda
  { bloco: { tipo: "encerramento", dur: 4.8, frase: "Atenda e venda sem trocar de tela." }, fala: "v1-10", antes: 0.5, legenda: false },
];
const { edicao: ed0, inicioBloco, fimBloco, noBloco, emFala, idx } = fechar(trechos);

const CHIP = { x: 1500, y: 140 };
const chipRecurso = (fala: string, texto: string): Sobreposicao => ({ tipo: "chip", texto, ...CHIP, de: emFala(fala) - 0.1, ate: fimBloco(idx(fala)), destaque: true });

const sobreposicoes: Sobreposicao[] = [
  // os três canais entram quando o narrador fala cada um
  { tipo: "canal", canal: "whatsapp", x: 1250, y: 330, de: emFala("v1-01") + palavra("v1-01", "WhatsApp"), ate: fimBloco(1) - 0.1, tamanho: 120, comNome: true },
  { tipo: "canal", canal: "instagram", x: 1410, y: 500, de: emFala("v1-01") + palavra("v1-01", "Instagram"), ate: fimBloco(1) - 0.1, tamanho: 120, comNome: true },
  { tipo: "canal", canal: "messenger", x: 1250, y: 670, de: emFala("v1-01") + palavra("v1-01", "Messenger"), ate: fimBloco(1) - 0.1, tamanho: 120, comNome: true },
  // equipes e atendentes na aba Todos
  { tipo: "chip", texto: "Comercial", x: 1180, y: 380, de: emFala("v1-02") + 1.4, ate: fimBloco(2) - 0.1, tamanho: 32 },
  { tipo: "chip", texto: "Financeiro", x: 1420, y: 520, de: emFala("v1-02") + 1.6, ate: fimBloco(2) - 0.1, tamanho: 32 },
  { tipo: "chip", texto: "Suporte", x: 1200, y: 660, de: emFala("v1-02") + 1.8, ate: fimBloco(2) - 0.1, tamanho: 32 },
  { tipo: "chip", texto: "Visão do atendente: só o que é dele", x: 1220, y: 175, de: inicioBloco(3) + 0.4, ate: fimBloco(3) - 0.15, destaque: true, tamanho: 30 },
  { tipo: "chip", texto: "Controle total do administrador", x: 1240, y: 175, de: inicioBloco(4) + 0.4, ate: fimBloco(4) - 0.15, destaque: true, tamanho: 30 },
  // recursos do clipe
  chipRecurso("v1-05", "Catálogo com foto e preço"),
  chipRecurso("v1-05b", "Orçamento no WhatsApp"),
  chipRecurso("v1-05c", "Formulário"),
  chipRecurso("v1-05d", "Enquete"),
  chipRecurso("v1-06", "Cobrança por Pix"),
  chipRecurso("v1-06b", "Nota fiscal do ERP"),
  chipRecurso("v1-06c", "Mensagem agendada"),
  { tipo: "chip", texto: "Protocolo + PDF da conversa", ...CHIP, x: 1480, de: emFala("v1-07") - 0.1, ate: fimBloco(13) - 0.2, destaque: true },
  { tipo: "folha", src: "selloop/telas/v1-d-protocolo/pagina-1.png", x: 1480, y: 230, largura: 430, de: noBloco(12, marca(D, "pdf-pronto")) - 0.1, ate: fimBloco(12) + 0.6 },
  chipRecurso("v1-08", "Pesquisa de satisfação"),
  { tipo: "chip", texto: "Indicadores de atendimento", ...CHIP, x: 1480, de: emFala("v1-09") - 0.1, ate: fimBloco(idx("v1-09")) - 0.2, destaque: true },
];

export const edicaoV1: Edicao = {
  ...ed0,
  sobreposicoes,
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.2, volumeFala: 0.075 },
};
export const DURACAO_V1 = Math.max(duracaoTotal(edicaoV1), emFala("v1-10") + durFala("v1-10") + 1.4);

export const SelloopAtendimento: React.FC = () => <Video edicao={edicaoV1} gravacoes={g} locucao={loc} />;
