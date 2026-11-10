import React from "react";
import locucaoR2 from "../../../public/selloop/locucao/r2/locucao.json";
import eventosA from "../../../public/selloop/telas/v2-a-painel/eventos.json";
import eventosB from "../../../public/selloop/telas/v2-b-nova-campanha/eventos.json";
import eventosC from "../../../public/selloop/telas/v2-c-relatorio/eventos.json";
import eventosD from "../../../public/selloop/telas/v2-d-modelos/eventos.json";
import { marca, recorte, type Gravacao } from "../gravacao";
import { criarMontagem, type Trecho } from "../montagem";
import { duracaoTotal, type FalaLocucao } from "../Video";
import { alvoDaCaixa, alvosDaGravacao, type Alvo } from "./base";
import { Confete, LogoCanal, Selo, type PropsCamada } from "./Efeitos";
import { ajudasDoReel, cliquesApos, criarGrupos } from "./montagemReel";
import { Reel, type EdicaoReel, type SobreReel } from "./Reel";

// Reel 2 · Disparador de campanhas no WhatsApp (vertical, 9:16).
// Painel → campanha nova (identificação, público, validação, agendamento, modelo, quem responde,
// sequência, confirmação) → relatório e leads sem interação → um modelo para cada uso.
// De cada etapa aparece um trecho curto da tela, e o que importa salta dela.

const g = {
  "v2-a-painel": eventosA as unknown as Gravacao,
  "v2-b-nova-campanha": eventosB as unknown as Gravacao,
  "v2-c-relatorio": eventosC as unknown as Gravacao,
  "v2-d-modelos": eventosD as unknown as Gravacao,
};
const [A, B, C, D] = Object.values(g);
const loc = locucaoR2.falas as unknown as (FalaLocucao & { nivel?: number })[];
const TRANSICAO = 0.4;
const CORTE = 0.2;
const { durFala, palavra, trecho, fechar } = criarMontagem(loc, { url: "app.selloop.com.br/atendimento", transicao: TRANSICAO, pastaLocucao: "selloop/locucao/r2" });
const grupo = criarGrupos({ trecho, durFala, transicao: TRANSICAO, corte: CORTE });
const mB = (n: string) => marca(B, n);
const mC = (n: string) => marca(C, n);
const rB = (n: string) => recorte(B, n).t;
const rC = (n: string) => recorte(C, n).t;
/** Fala `id`, instante (s, dentro da fala) da palavra. */
const p = (id: string, texto: string, ordem = 0) => palavra(id, texto, ordem);

// ── Cliques de cada etapa (na ordem em que a cena clica) ──────────────────────────────────────────
const [, cNome, cEquipe, cCanal] = cliquesApos(B, mB("nova"));
const [cDefinirPublico, cMercados, cPadarias] = cliquesApos(B, mB("publico"));
const [cValidar] = cliquesApos(B, mB("validar"));
const [cAgendar] = cliquesApos(B, mB("agendar"));
const [cRegras] = cliquesApos(B, mB("regras"));
const [cEscolherModelo, cSemana, cUsarModelo] = cliquesApos(B, mB("modelo"));
const [cAgenteIA] = cliquesApos(B, mB("resposta"));
const [cEditarSequencia] = cliquesApos(B, mB("sequencia"));
const [cAgendarCampanha, cConfirmar] = cliquesApos(B, mB("confirmar"));
const [cAbrirRelatorio] = cliquesApos(C, mC("abrir"));
const [cSemInteracao] = cliquesApos(C, mC("sem-interacao"));
const [cTag, cAplicar] = cliquesApos(C, mC("tag"));
const cModelos = cliquesApos(D, 0).slice(0, 6);

// ── Câmera de cada gravação (px CSS da tela, 1600×900) ────────────────────────────────────────────
const alvos: Record<string, Alvo[]> = {
  // a aba "Campanhas", depois os indicadores e o gráfico
  "v2-a-painel": [
    { t: 0, cx: 560, cy: 330, zoom: 1.1 },
    { t: cliquesApos(A, 0)[0].t + 0.5, cx: 700, cy: 360, zoom: 1.15 },
    { t: marca(A, "grafico") - 0.5, cx: 760, cy: 520, zoom: 0.95 },
  ],
  // segue os cliques e a digitação; vai para cada parte marcada logo depois do clique que a mostra
  "v2-b-nova-campanha": alvosDaGravacao(B, { zoomClique: 1.45, zoomRecorte: 1.3, folgaRecorte: 90, adiantaRecorte: 2.6, ignorar: (e) => e.tipo === "recorte" && e.nome === "status-nova" }),
  "v2-c-relatorio": alvosDaGravacao(C, { zoomClique: 1.4, zoomRecorte: 1.25, folgaRecorte: 90, adiantaRecorte: 2.6, ignorar: (e) => e.tipo === "recorte" && ["lidos", "interagidos", "conversao", "celular"].includes(e.nome) }),
  // a lista de modelos e a prévia no WhatsApp, lado a lado
  "v2-d-modelos": [alvoDaCaixa(0, { x: 376, y: 120, w: 847, h: 430 }, { folga: 16, zoomMax: 1.3 })],
};

// ── Linha do tempo ────────────────────────────────────────────────────────────────────────────────
const T: Trecho[] = [];
/** Índice do primeiro trecho de cada momento, pelo nome. */
const I: Record<string, number> = {};
const por = (nome: string, ts: Trecho[]) => {
  I[nome] = T.length;
  T.push(...ts);
};

// 1 · o painel de campanhas
por("painel", grupo("v2-01", "v2-a-painel", [{ de: 1.6, ate: A.duracao - 0.2 }], { antes: 0.4, entrada: "segue", respiro: 0.7 }));

// 2 · campanha nova: nome, equipe e número
por(
  "identificacao",
  grupo("v2-02", "v2-b-nova-campanha", [
    { de: cNome.t - 0.3, ate: cEquipe.t - 0.05, fim: p("v2-02", "equipe") - 0.1 },
    { de: cEquipe.t - 0.05, ate: cCanal.t - 0.05, fim: p("v2-02", "número") - 0.1 },
    { de: cCanal.t - 0.05, ate: mB("publico") + 0.05 },
  ]),
);
// 3 · o público: tags da carteira
por(
  "publico",
  grupo(
    "v2-03",
    "v2-b-nova-campanha",
    [
      { de: mB("publico") + 0.05, ate: cDefinirPublico.t, fim: p("v2-03", "público") },
      { de: cDefinirPublico.t, ate: cMercados.t, fim: p("v2-03", "tag") - 0.05 },
      { de: cMercados.t, ate: cPadarias.t, fim: p("v2-03", "segmento") - 0.1 },
      { de: cPadarias.t, ate: mB("validar") },
    ],
    { entrada: "segue" },
  ),
);
// 4 · a validação de WhatsApp
por(
  "validar",
  grupo(
    "v2-04",
    "v2-b-nova-campanha",
    [
      { de: mB("validar"), ate: cValidar.t, fim: p("v2-04", "a") },
      { de: cValidar.t, ate: rB("sem-whatsapp") + 0.1 },
    ],
    { entrada: "segue", respiro: 0.7 },
  ),
);
// 5 · agendamento e regras de envio
por(
  "agendar",
  grupo(
    "v2-05",
    "v2-b-nova-campanha",
    [
      { de: cAgendar.t - 0.3, ate: rB("agendamento") + 0.1, fim: p("v2-05", "com") - 0.05 },
      { de: cRegras.t - 0.3, ate: rB("regras") + 0.2 },
    ],
    { entrada: "corte", respiro: 0.7 },
  ),
);
// 6 · o modelo aprovado: a lista de modelos e, ao clicar, a prévia
por(
  "modelo",
  grupo(
    "v2-06",
    "v2-b-nova-campanha",
    [
      { de: cEscolherModelo.t - 0.3, ate: cSemana.t, fim: p("v2-06", "modelo") - 0.25 },
      { de: cSemana.t, ate: rB("modelo") + 0.1 },
    ],
    { entrada: "corte", respiro: 0.7 },
  ),
);
// 7 · quem responde: o time ou a agente de IA
por(
  "resposta",
  grupo(
    "v2-07",
    "v2-b-nova-campanha",
    [
      { de: cUsarModelo.t + 0.2, ate: cAgenteIA.t, fim: p("v2-07", "agente") - 0.1 },
      { de: cAgenteIA.t, ate: rB("resposta") + 0.1 },
    ],
    { entrada: "corte", respiro: 0.7 },
  ),
);
// 8 · a sequência: abre o fluxo e, depois de montado, a espera de 2 dias e a 2ª mensagem
por(
  "sequencia",
  grupo(
    "v2-06b",
    "v2-b-nova-campanha",
    [
      { de: cEditarSequencia.t - 0.3, ate: cEditarSequencia.t + 1.8, fim: p("v2-06b", "sequência") - 0.15 },
      { de: rB("sequencia") - 2.4, ate: rB("sequencia") + 0.1 },
    ],
    { entrada: "corte", respiro: 0.7 },
  ),
);
// 9 · conferir, confirmar e a campanha agendada na lista
por(
  "confirmar",
  grupo(
    "v2-07b",
    "v2-b-nova-campanha",
    [
      { de: cAgendarCampanha.t - 0.25, ate: cAgendarCampanha.t + 1.6, fim: p("v2-07b", "confirme") - 0.1 },
      { de: cConfirmar.t - 0.35, ate: cConfirmar.t + 1.6, fim: p("v2-07b", "e") + 0.02 },
      { de: rB("linha-nova") - 2.4, ate: B.duracao - 0.1 },
    ],
    { entrada: "corte", respiro: 0.9 },
  ),
);
// 10 · o relatório de uma campanha concluída
por(
  "relatorio",
  grupo("v2-08", "v2-c-relatorio", [
    { de: cAbrirRelatorio.t - 0.4, ate: mC("numeros") + 0.1, fim: p("v2-08", "quem") - 0.15 },
    { de: mC("numeros") + 0.1, ate: rC("envios") + 0.1 },
  ]),
);
// 11 · quem não interagiu ganha a tag "Nova abordagem"
por(
  "leads",
  grupo(
    "v2-09",
    "v2-c-relatorio",
    [
      { de: cSemInteracao.t - 0.3, ate: rC("leads") + 0.1, fim: p("v2-09", "para") - 0.05 },
      { de: cTag.t - 0.3, ate: C.duracao - 0.3 },
    ],
    { entrada: "corte", respiro: 1.0 },
  ),
);
// 12 · um modelo para cada uso: o clique em cada modelo cai na palavra do seu uso
const USOS = [
  { dito: "promoções", nome: "Promoções", recorte: "previa-promocao", w: 610 },
  { dito: "comunicados", nome: "Comunicados", recorte: "previa-comunicado", w: 760 },
  { dito: "lembretes", nome: "Lembretes de pagamento", recorte: "previa-boleto", w: 860 },
  { dito: "lançamentos", nome: "Lançamentos", recorte: "previa-lancamento", w: 660 },
  { dito: "reativar", nome: "Reativação", recorte: "previa-reativacao", w: 860 },
  { dito: "convidar", nome: "Convites", recorte: "previa-convite", w: 660 },
] as const;
/** O clique no modelo acontece um instante antes da palavra. */
const ADIANTA_USO = 0.12;
por(
  "usos",
  grupo("v2-10", "v2-d-modelos", [
    { de: cModelos[0].t - 0.9, ate: cModelos[0].t, fim: p("v2-10", USOS[0].dito) - ADIANTA_USO },
    ...USOS.map((_, k) => (k + 1 < USOS.length ? { de: cModelos[k].t, ate: cModelos[k + 1].t, fim: p("v2-10", USOS[k + 1].dito) - ADIANTA_USO } : { de: cModelos[k].t, ate: marca(D, "fim") + 0.5 })),
  ]),
);

// a frase já está na tela: sem legenda
I.fim = T.length;
T.push({ bloco: { tipo: "encerramento", dur: 4.9, frase: "Suas vendas em loop." }, fala: "v2-11", antes: 0.5, legenda: false });

const M = fechar(T);
const { inicioBloco, fimBloco, noBloco, naGravacao, emFala } = M;
const { salto } = ajudasDoReel({ gravacoes: g, alvos, blocos: M.blocos, inicioBloco, fimBloco, noBloco, naGravacao });
/** Instante do vídeo em que a palavra da fala é dita. */
const dito = (id: string, texto: string, ordem = 0) => emFala(id) + p(id, texto, ordem);
/** Fim do grupo que começa em I[nome] (o começo do próximo grupo). */
const ORDEM = ["painel", "identificacao", "publico", "validar", "agendar", "modelo", "resposta", "sequencia", "confirmar", "relatorio", "leads", "usos", "fim"];
const fimDe = (nome: string) => fimBloco(I[ORDEM[ORDEM.indexOf(nome) + 1]] - 1);

// ── Por cima da janela ────────────────────────────────────────────────────────────────────────────
const titulo = (texto: string, de: number, ate: number): SobreReel => ({ tipo: "titulo", texto, de, ate });
const camada = (de: number, ate: number, el: React.FC<PropsCamada>, o: { atras?: boolean; escurece?: boolean } = {}): SobreReel => ({ tipo: "camada", de, ate, el, ...o });
const sobre: SobreReel[] = [];
const sons: NonNullable<EdicaoReel["sons"]> = [];
const ESQ = 282;
const DIR = 798;

// 1 · painel: os números do período saltam em mosaico; no fim, o WhatsApp oficial
{
  const i = I.painel;
  const fim = fimDe("painel");
  const oficial = dito("v2-01", "pelo") - 0.1;
  sobre.push(titulo("A *mensagem certa* para centenas de clientes", 0.15, oficial), titulo("Pelo *WhatsApp oficial*", oficial + 0.05, fim));
  sobre.push(salto(i, "enviadas", { de: dito("v2-01", "mensagem") - 0.1, ate: fim, w: 470, cx: ESQ, cy: 715, raio: 16, rot: -2 }));
  sobre.push(salto(i, "entregues", { de: dito("v2-01", "chega") - 0.1, ate: fim, w: 470, cx: DIR, cy: 715, raio: 16, rot: 1.5 }));
  sobre.push(salto(i, "lidas", { de: dito("v2-01", "centenas") - 0.05, ate: fim, w: 470, cx: ESQ, cy: 1030, raio: 16, rot: 1.5 }));
  sobre.push(salto(i, "responderam", { de: dito("v2-01", "clientes") - 0.1, ate: fim, w: 470, cx: DIR, cy: 1030, raio: 16, rot: -1.5 }));
  sobre.push(camada(dito("v2-01", "WhatsApp") - 0.15, fim, (q) => <LogoCanal {...q} canal="whatsapp" x={540} y={872} tamanho={190} />));
}

// 2 · identificação: o nome, a equipe e o número saem do formulário
{
  const i = I.identificacao;
  const fim = fimDe("identificacao");
  sobre.push(titulo("Nome, equipe e *número*", inicioBloco(i) + 0.1, fim));
  sobre.push(salto(i, "identificacao", { de: dito("v2-02", "escolhe") - 0.15, ate: fim, parte: { x: 0, y: 0.25, w: 0.62, h: 0.33 }, w: 900, cy: 760, raio: 12, rot: -1.5 }));
  sobre.push(salto(i, "identificacao", { de: dito("v2-02", "equipe") + 0.1, ate: fim, parte: { x: 0, y: 0.56, w: 0.3, h: 0.44 }, w: 500, cx: 300, cy: 990, raio: 12, rot: 2 }));
  sobre.push(salto(i, "identificacao", { de: dito("v2-02", "número") + 0.1, ate: fim, parte: { x: 0.5, y: 0.56, w: 0.37, h: 0.44 }, w: 620, cx: 690, cy: 1210, raio: 12, rot: -1.5 }));
}

// 3 · público: as tags escolhidas e quantos contatos entram
{
  const i = I.publico;
  const fim = fimDe("publico");
  sobre.push(titulo("O público sai da *sua carteira*", inicioBloco(i) + 0.05, fim));
  sobre.push(salto(i + 3, "tags", { de: noBloco(i + 3, cPadarias.t + 0.4), ate: fim, w: 940, cy: 810, raio: 12, rot: -1.5 }));
  sobre.push(salto(i + 3, "selecionados", { de: dito("v2-03", "cidade") - 0.1, ate: fim, w: 940, cy: 1070, raio: 14, rot: 1.5 }));
}

// 4 · validação: os números sem WhatsApp aparecem e saem da lista
{
  const i = I.validar;
  const fim = fimDe("validar");
  sobre.push(titulo("Confere quem *tem WhatsApp*", inicioBloco(i) + 0.05, fim));
  const achou = noBloco(i + 1, recorte(B, "sem-whatsapp").t - 2.2);
  sobre.push(salto(i + 1, "sem-whatsapp", { de: achou, ate: fim, parte: { x: 0, y: 0, w: 0.64, h: 0.61 }, w: 900, cy: 870, raio: 12, rot: -1.5 }));
  sobre.push(camada(achou + 0.45, fim, (q) => <Selo {...q} x={540} y={1210} texto="9 números sem WhatsApp fora da lista" icone="filtro" tom="escuro" tamanho={38} />));
}

// 5 · agendamento: a data e a hora; depois, o intervalo e o limite por dia
{
  const i = I.agendar;
  const fim = fimDe("agendar");
  sobre.push(titulo("*Agende* para o melhor horário", inicioBloco(i) + 0.1, fim));
  sobre.push(salto(i, "agendamento", { de: dito("v2-05", "horário") - 0.05, ate: fim, parte: { x: 0, y: 0.42, w: 0.5, h: 0.58 }, w: 880, cy: 790, raio: 12, rot: -1.5 }));
  sobre.push(camada(dito("v2-05", "intervalo") - 0.1, fim, (q) => <Selo {...q} x={540} y={1010} texto="Intervalo entre os envios" icone="relogio" tom="claro" tamanho={44} giro={1.5} />));
  sobre.push(camada(dito("v2-05", "limite") - 0.1, fim, (q) => <Selo {...q} x={540} y={1150} texto="Até 250 envios por dia" icone="escudo" tom="marca" tamanho={44} giro={-1.5} />));
}

// 6 · modelo aprovado pela Meta: a prévia salta, e cada parte dela é apontada na palavra
{
  const i = I.modelo;
  const fim = fimDe("modelo");
  sobre.push(titulo("Modelo *aprovado pela Meta*", inicioBloco(i) + 0.1, fim));
  sobre.push(salto(i + 1, "modelo", { de: dito("v2-06", "modelo") + 0.25, ate: fim, w: 630, cy: 950, raio: 12, rot: -1.5 }));
  sobre.push(camada(dito("v2-06", "aprovado") + 0.25, fim, (q) => <Selo {...q} x={540} y={590} texto="Aprovado pela Meta" icone="certo" tom="verde" tamanho={40} />));
  // cada parte do modelo, apontada do lado de fora do cartão
  sobre.push(camada(dito("v2-06", "imagem") - 0.1, fim, (q) => <Selo {...q} x={912} y={745} texto="Imagem" tom="marca" tamanho={38} giro={4} />));
  sobre.push(camada(dito("v2-06", "botões") - 0.1, fim, (q) => <Selo {...q} x={912} y={1250} texto="Botões" tom="marca" tamanho={38} giro={-3} />));
  sobre.push(camada(dito("v2-06", "nome") - 0.1, fim, (q) => <Selo {...q} x={150} y={924} texto="Nome" tom="marca" tamanho={38} giro={-4} />));
}

// 7 · quem responde: o time ou a agente de IA, na hora
{
  const i = I.resposta;
  const fim = fimDe("resposta");
  sobre.push(titulo("Seu time ou a *agente de IA* responde", inicioBloco(i) + 0.1, fim));
  // a caixa "Quando o lead responder" (a imagem é de depois de escolher a Lia)
  sobre.push(salto(i, "resposta", { de: dito("v2-07", "quem") - 0.1, ate: fim, parte: { x: 0, y: 0, w: 1, h: 0.76 }, w: 900, cy: 850, raio: 14, rot: -1.5 }));
  sobre.push(camada(dito("v2-07", "time") - 0.15, fim, (q) => <Selo {...q} x={300} y={1150} texto="Seu time" icone="pessoas" tom="claro" tamanho={44} giro={-2} />));
  sobre.push(camada(dito("v2-07", "agente") - 0.1, fim, (q) => <Selo {...q} x={740} y={1150} texto="Agente Lia" icone="robo" tom="marca" tamanho={44} giro={2} />));
  sobre.push(camada(dito("v2-07", "na") - 0.1, fim, (q) => <Selo {...q} x={540} y={1272} texto="Na hora" icone="relogio" tom="verde" tamanho={40} />));
}

// 8 · sequência: a espera e a 2ª mensagem saem do fluxo
{
  const i = I.sequencia;
  const fim = fimDe("sequencia");
  sobre.push(titulo("*Sequência* com lembrete automático", inicioBloco(i) + 0.1, fim));
  sobre.push(salto(i + 1, "sequencia", { de: dito("v2-06b", "sequência") + 0.3, ate: fim, parte: { x: 0, y: 0.06, w: 0.56, h: 0.92 }, w: 780, cy: 925, raio: 14, rot: -1.5 }));
  sobre.push(camada(dito("v2-06b", "prazo") - 0.1, fim, (q) => <Selo {...q} x={772} y={1268} texto="2 dias depois" icone="relogio" tom="marca" tamanho={42} giro={-3} />));
}

// 9 · confirmação: o resumo; depois, a campanha nova na lista, agendada
{
  const i = I.confirmar;
  const fim = fimDe("confirmar");
  const naLista = inicioBloco(i + 2);
  sobre.push(titulo("Confira e *confirme*", inicioBloco(i) + 0.1, naLista), titulo("Campanha *agendada*", naLista + 0.05, fim));
  sobre.push(salto(i, "confirmacao", { de: noBloco(i, cAgendarCampanha.t + 0.55), ate: naLista + 0.1, parte: { x: 0.02, y: 0.15, w: 0.62, h: 0.45 }, w: 900, raio: 12, rot: -1.5 }));
  sobre.push(salto(i + 2, "linha-nova", { de: dito("v2-07b", "campanha") - 0.15, ate: fim, parte: { x: 0, y: 0, w: 0.42, h: 1 }, w: 880, cy: 790, raio: 12, rot: -1.5 }));
  sobre.push(salto(i + 2, "linha-nova", { de: dito("v2-07b", "fica") - 0.15, ate: fim, parte: { x: 0.56, y: 0, w: 0.35, h: 1 }, w: 700, cy: 960, raio: 12, rot: 1.5 }));
  const agendada = dito("v2-07b", "agendada") - 0.05;
  sobre.push(salto(i + 2, "status-nova", { de: agendada, ate: fim, w: 380, cy: 1140, raio: 999, rot: -2 }));
  sobre.push(camada(agendada + 0.2, agendada + 1.8, (q) => <Confete {...q} x={540} y={1100} />));
  sons.push({ em: agendada + 0.15, arquivo: "sino.wav", volume: 0.45 });
}

// 10 · relatório: os números da campanha saltam em mosaico
{
  const i = I.relatorio;
  const fim = fimDe("relatorio");
  sobre.push(titulo("*Relatório* de cada campanha", inicioBloco(i) + 0.1, fim));
  sobre.push(salto(i + 1, "envios", { de: dito("v2-08", "recebeu") - 0.12, ate: fim, w: 450, cx: ESQ, cy: 765, raio: 16, rot: -2 }));
  sobre.push(salto(i + 1, "lidos", { de: dito("v2-08", "leu") - 0.12, ate: fim, w: 450, cx: DIR, cy: 765, raio: 16, rot: 1.5 }));
  sobre.push(salto(i + 1, "interagidos", { de: dito("v2-08", "respondeu") - 0.12, ate: fim, w: 450, cx: ESQ, cy: 1150, raio: 16, rot: 1.5 }));
  sobre.push(salto(i + 1, "conversao", { de: dito("v2-08", "respondeu") + 0.3, ate: fim, w: 450, cx: DIR, cy: 1150, raio: 16, rot: -1.5 }));
}

// 11 · leads sem interação: a lista, a tag e as ações aplicadas
{
  const i = I.leads;
  const fim = fimDe("leads");
  const tag = inicioBloco(i + 1);
  sobre.push(titulo("Quem não interagiu fica *separado*", inicioBloco(i) + 0.1, tag), titulo("Pronto para uma *nova abordagem*", tag + 0.05, fim));
  sobre.push(salto(i, "leads", { de: noBloco(i, cSemInteracao.t + 0.9), ate: tag + 0.1, parte: { x: 0, y: 0, w: 0.6, h: 1 }, w: 860, raio: 12, rot: -1.5 }));
  sobre.push(salto(i + 1, "tag", { de: noBloco(i + 1, cTag.t + 0.35), ate: fim, w: 880, cy: 860, raio: 14, rot: -1.5 }));
  const aplicado = noBloco(i + 1, cAplicar.t + 0.7);
  sobre.push(salto(i + 1, "aplicado", { de: aplicado, ate: fim, w: 880, cy: 1150, raio: 12, rot: 1.5 }));
  sons.push({ em: aplicado + 0.15, arquivo: "sino.wav", volume: 0.4 });
}

// 12 · um modelo para cada uso: a prévia de cada um salta na palavra do seu uso
{
  const i = I.usos;
  const fim = fimDe("usos");
  sobre.push(titulo("Um modelo para *cada uso*", inicioBloco(i) + 0.1, fim));
  // as prévias se empilham: cada uma entra por cima da anterior, um pouco deslocada e inclinada
  USOS.forEach((u, k) => {
    const de = dito("v2-10", u.dito) + 0.18;
    const proximo = k + 1 < USOS.length ? dito("v2-10", USOS[k + 1].dito) + 0.18 : fim;
    const prop = recorte(D, u.recorte).caixa.h / recorte(D, u.recorte).caixa.w;
    const cx = 540 + (k - 2.5) * 16;
    const cy = 890 + (k % 2 ? 14 : -14);
    sobre.push(salto(i + k + 1, u.recorte, { de, ate: fim, w: u.w, cx, cy, raio: 12, rot: (k % 2 ? 1 : -1) * (1.5 + (k % 3)), faiscas: k === 0 }));
    sobre.push(camada(de + 0.12, proximo, (q) => <Selo {...q} x={540} y={Math.min(1292, cy + (u.w * prop) / 2 + 40)} texto={u.nome} icone="megafone" tom="marca" tamanho={44} />));
  });
}

export const edicaoR2: EdicaoReel = {
  ...M.edicao,
  sobre,
  alvos,
  sons,
  assunto: "Campanhas",
  icone: "megafone",
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.2, volumeFala: 0.07 },
};
export const DURACAO_R2 = Math.max(duracaoTotal(edicaoR2), emFala("v2-11") + durFala("v2-11") + 1.5);

export const SelloopReelCampanhas: React.FC = () => <Reel edicao={edicaoR2} gravacoes={g} locucao={loc} />;
