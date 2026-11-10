import React from "react";
import eventosA from "../../../public/selloop/filme/f2-a-painel/eventos.json";
import eventosB from "../../../public/selloop/filme/f2-b-nova-campanha/eventos.json";
import eventosC from "../../../public/selloop/filme/f2-c-relatorio/eventos.json";
import eventosD from "../../../public/selloop/filme/f2-d-modelos/eventos.json";
import locucaoR2 from "../../../public/selloop/locucao/r2/locucao.json";
import { marca, recorte, type Gravacao } from "../gravacao";
import type { Alvo } from "../reel/base";
import { Confete, LogoCanal, Selo, type PropsCamada } from "../reel/Efeitos";
import { cliquesApos } from "../reel/montagemReel";
import type { SobreReel } from "../reel/Reel";
import type { FalaLocucao } from "../Video";
import { ajudasFluidas, viagemApos } from "./ajudas";
import type { TrilhaDeCliques } from "./Caminho";
import { Fluido, type EdicaoFluida } from "./Fluido";
import { criarRoteiro } from "./roteiro";

// Reel 2 · Disparador de campanhas no WhatsApp, em tomada contínua (vertical, 9:16).
// Painel → a campanha nova montada de ponta a ponta numa tomada só (identificação, público,
// validação, agendamento, modelo, quem responde, sequência, confirmação) → relatório e leads sem
// interação → um modelo para cada uso. A tela é filmada quadro a quadro e toca sempre em 1x; de cada
// etapa aparece o caminho (os cliques) e, no fim dela, o resultado salta da janela.

const PASTA = "selloop/filme";
const CA = "f2-a-painel";
const CB = "f2-b-nova-campanha";
const CC = "f2-c-relatorio";
const CD = "f2-d-modelos";
const g = {
  [CA]: eventosA as unknown as Gravacao,
  [CB]: eventosB as unknown as Gravacao,
  [CC]: eventosC as unknown as Gravacao,
  [CD]: eventosD as unknown as Gravacao,
};
const [A, B, C, D] = [g[CA], g[CB], g[CC], g[CD]];
const loc = locucaoR2.falas as unknown as (FalaLocucao & { nivel?: number })[];
const R = criarRoteiro({ filmes: g, locucao: loc, transicao: 0.4 });
const { palavra, dito, fimFala } = R;
const mA = (n: string) => marca(A, n);
const mB = (n: string) => marca(B, n);
const mC = (n: string) => marca(C, n);
/** Os cliques da campanha nova depois de uma marca, na ordem. */
const cB = (n: string) => cliquesApos(B, mB(n));
/** Instante do vídeo em que um instante do filme aparece. */
const SA = (t: number) => R.saida(CA, t);
const SB = (t: number) => R.saida(CB, t);
const SC = (t: number) => R.saida(CC, t);
const SD = (t: number) => R.saida(CD, t);
/** O que cada momento precisa lembrar da linha do tempo para desenhar por cima dela depois. */
const M: Record<string, number> = {};

// ════ Linha do tempo ═════════════════════════════════════════════════════════════════════════════

// 1 · o painel de campanhas: a aba abre em "campanhas" e o cursor passa pelos números nas palavras
const [cAba] = cliquesApos(A, 0);
const NUMEROS = [
  ["enviadas", "mensagem"],
  ["entregues", "chega"],
  ["lidas", "centenas"],
  ["responderam", "clientes"],
] as const;
R.abrir(CA, mA("aba") - 0.1, { entrada: 0.3 });
M.painel = R.parte;
R.fala("v2-01", { em: 0.9 });
R.anda(mA("indicadores"), { aperta: false });
for (const [numero, dita] of NUMEROS) R.chega(viagemApos(A, mA(numero)), dito("v2-01", dita) + 0.05);
R.seguraAte(fimFala("v2-01") + 0.5);

// 2 · a campanha nova, numa tomada só
const [cNova, cNome, cEquipe, cCanal] = cB("nova");
R.abrir(CB, cNova.t - 0.3);
M.campanha = R.parte;

// 2a · identificação: o nome é digitado em "nome", a equipe e o número entram nas palavras deles
R.anda(cEquipe.t + 0.12);
R.fala("v2-02", { em: SB(cEquipe.t) - palavra("v2-02", "equipe") - 0.25 });
R.clica(cCanal, dito("v2-02", "número") + 0.25);
R.anda(mB("publico") - 0.02);
M.identificado = R.agora;
R.seguraAte(Math.max(R.agora + 1.15, fimFala("v2-02") + 0.45));
M.identificacaoFim = R.agora;

// 2b · público: abre em "público"; as tags em "tag"; o cursor passa por segmento e cidade
const [cPublico, cMercados, cPadarias] = cB("publico");
R.anda(cPublico.t + 0.12);
R.fala("v2-03", { em: SB(cPublico.t) - palavra("v2-03", "público") - 0.15 });
R.clica(cMercados, dito("v2-03", "tag") - 0.02);
R.anda(cPadarias.t + 0.15);
R.chega(viagemApos(B, mB("segmentos")), dito("v2-03", "segmento") + 0.15);
R.chega(viagemApos(B, mB("cidade")), dito("v2-03", "cidade") + 0.1);
R.anda(mB("validar") - 0.02);
M.publicoPronto = R.agora;
R.seguraAte(Math.max(R.agora + 1.15, fimFala("v2-03") + 0.45));
M.publicoFim = R.agora;

// 2c · validação: o clique em "confere"; depois, sem fala, quem não tem WhatsApp sai da lista
const [cValidar] = cB("validar");
const [cRemover, cDefinirPublico] = cB("remover");
R.fala("v2-04", { em: R.agora + 0.05 });
R.clica(cValidar, dito("v2-04", "confere") + 0.1);
R.anda(mB("remover") - 0.02);
M.validado = SB(mB("validado")) + 0.3;
R.seguraAte(Math.max(M.validado + 1.3, fimFala("v2-04") + 0.45));
M.validarFim = R.agora;
R.anda(cDefinirPublico.t + 0.3);
M.validarSai = R.agora;

// 2d · agendamento: "Agendar", a data e a hora; depois as regras de envio (intervalo e limite)
const [cAgendar, cData] = cB("agendar");
const [cRegras] = cB("regras");
const [cDefinirRegras] = cB("regras-ok");
R.anda(cAgendar.t + 0.1);
R.fala("v2-05", { em: SB(cAgendar.t) - 0.2 });
R.anda(mB("agendado"));
R.clica(cRegras, dito("v2-05", "com") - 0.05);
R.chega(viagemApos(B, mB("intervalo")), dito("v2-05", "intervalo") + 0.2);
R.chega(viagemApos(B, mB("limite")), dito("v2-05", "limite") + 0.2);
R.anda(mB("regras-ok") - 0.02);
M.agendado = R.agora;
R.seguraAte(Math.max(R.agora + 1.2, fimFala("v2-05") + 0.45));
M.agendarFim = R.agora;
R.anda(cDefinirRegras.t + 0.3);
M.agendarSai = R.agora;

// 2e · o modelo aprovado: a lista abre, o modelo é escolhido em "modelo" e a prévia salta
const [cEscolher, cSemana] = cB("modelo");
const [cUsar] = cB("usar-modelo");
R.anda(cSemana.t + 0.1);
R.fala("v2-06", { em: SB(cSemana.t) - palavra("v2-06", "modelo") - 0.05 });
R.anda(mB("modelo-preview") + 0.35);
M.modelo = R.agora;
R.anda(mB("usar-modelo") - 0.02);
R.seguraAte(Math.max(M.modelo + 2.0, fimFala("v2-06") + 0.5));
M.modeloFim = R.agora;
R.anda(cUsar.t + 0.35);
M.modeloSai = R.agora;

// 2f · quem responde: o cursor vai ao cartão em "quem atende"; "Agente IA" e a Lia em "agente de IA"
const [cAgente, cLia] = cB("agente");
R.fala("v2-07", { em: R.agora + 0.1 });
R.chega(viagemApos(B, mB("resposta")), dito("v2-07", "quem") + 0.1);
R.clica(cAgente, dito("v2-07", "agente") + 0.1);
R.anda(mB("lia") + 0.1);
M.lia = R.agora;
R.anda(mB("sequencia") - 0.02);
R.seguraAte(Math.max(M.lia + 1.3, fimFala("v2-07") + 0.5));
M.respostaFim = R.agora;

// 2g · a sequência: o lembrete (o modelo da 2ª mensagem) e o prazo ("2" digitado em "definir")
const [cEditar] = cB("sequencia");
const [cAdicionar] = cB("editor");
const [, , cUltima] = cB("lembrete");
const [cEsperar, cDias] = cB("prazo");
const [cPronto] = cB("pronto");
R.anda(cEsperar.t + 0.12);
R.fala("v2-06b", { em: SB(cEsperar.t) - palavra("v2-06b", "prazo") + 0.6 });
R.anda(mB("sequencia-vista"));
M.sequencia = R.agora;
R.anda(mB("pronto") - 0.02);
R.seguraAte(Math.max(M.sequencia + 1.4, fimFala("v2-06b") + 0.5));
M.sequenciaFim = R.agora;
R.anda(cPronto.t + 0.3);
M.sequenciaSai = R.agora;

// 2h · conferir, confirmar e a campanha agendada na lista
const [cAgendarCampanha] = cB("confirmar");
const [cConfirmar] = cB("confirma");
R.anda(cAgendarCampanha.t + 0.1);
R.fala("v2-07b", { em: SB(cAgendarCampanha.t) - 0.3 });
R.anda(mB("resumo") + 0.3);
M.resumo = R.agora;
R.anda(mB("confirma") - 0.02);
R.seguraAte(Math.max(M.resumo + 0.95, dito("v2-07b", "confirme") - 0.25));
M.resumoSai = R.agora;
// confirma; a página desce até a lista, com a campanha nova no topo
R.anda(mB("lista") + 0.1);
M.naLista = R.agora;
R.anda(mB("fim") - 0.05);
R.seguraAte(Math.max(M.naLista + 2.1, fimFala("v2-07b") + 0.9));
M.campanhaFim = R.agora;

// 3 · o relatório de uma campanha concluída: abre em "relatório"; os números nas palavras
const [cAbrir] = cliquesApos(C, mC("abrir"));
const [cSemInteracao] = cliquesApos(C, mC("sem-interacao"));
const [cTag] = cliquesApos(C, mC("tag"));
const [cAplicar] = cliquesApos(C, mC("aplicar"));
const DO_RELATORIO = [
  ["envios", "recebeu"],
  ["lidos", "leu"],
  ["interagidos", "respondeu"],
] as const;
R.abrir(CC, cAbrir.t - 0.35);
M.relatorio = R.parte;
R.anda(cAbrir.t + 0.1);
R.fala("v2-08", { em: SC(cAbrir.t) - palavra("v2-08", "relatório") - 0.05 });
R.anda(mC("numeros"));
for (const [numero, dita] of DO_RELATORIO) R.chega(viagemApos(C, mC(numero)), dito("v2-08", dita) + 0.05);
R.chega(viagemApos(C, mC("conversao")), dito("v2-08", "respondeu") + 0.6);
R.seguraAte(Math.max(R.agora + 0.9, fimFala("v2-08") + 0.6));
M.relatorioFim = R.agora;

// 3b · quem não interagiu: a lista abre em "interagiu"; a tag "Nova abordagem" em "nova"
R.fala("v2-09", { em: R.agora + 0.05 });
R.clica(cSemInteracao, dito("v2-09", "interagiu") + 0.1);
R.anda(mC("tag") - 0.02);
R.clica(cTag, dito("v2-09", "nova") + 0.05);
R.anda(mC("aplicado") + 0.3);
M.aplicado = R.agora;
R.anda(mC("fim") + 0.3);
R.seguraAte(Math.max(M.aplicado + 1.4, fimFala("v2-09") + 0.7));
M.leadsFim = R.agora;

// 4 · um modelo para cada uso: o clique em cada modelo cai na palavra do seu uso
const USOS = [
  { dito: "promoções", nome: "Promoções", recorte: "previa-promocao", w: 520 },
  { dito: "comunicados", nome: "Comunicados", recorte: "previa-comunicado", w: 600 },
  { dito: "lembretes", nome: "Lembretes de pagamento", recorte: "previa-boleto", w: 600 },
  { dito: "lançamentos", nome: "Lançamentos", recorte: "previa-lancamento", w: 540 },
  { dito: "reativar", nome: "Reativação", recorte: "previa-reativacao", w: 600 },
  { dito: "convidar", nome: "Convites", recorte: "previa-convite", w: 540 },
] as const;
const cModelos = cliquesApos(D, 0).slice(0, USOS.length);
R.abrir(CD, cModelos[0].t - 0.45);
M.usos = R.parte;
R.anda(cModelos[0].t + 0.1);
R.fala("v2-10", { em: SD(cModelos[0].t) - palavra("v2-10", USOS[0].dito) + 0.12 });
USOS.slice(1).forEach((u, k) => R.clica(cModelos[k + 1], dito("v2-10", u.dito) - 0.12));
R.anda(marca(D, "fim") + 0.3);
R.seguraAte(fimFala("v2-10") + 0.8);
M.usosFim = R.agora;

// a frase já está na tela: sem legenda
R.encerramento("Suas vendas em loop.", 4.9);
R.fala("v2-11", { em: M.usosFim + 0.5, legenda: false });

const roteiro = R.pronto();
const inicioDe = (i: number) => roteiro.partes[i].inicio;

// ════ Câmera (no tempo do vídeo; px CSS da tela, 1600×900) ═══════════════════════════════════════
// A janela da campanha ocupa quase a tela toda (x 225–1375, y 44–853); as de cada etapa abrem por
// cima dela. A câmera fica na parte da janela onde a etapa acontece e muda quando a janela muda.
const alvos: Record<number, Alvo[]> = {};
alvos[M.painel] = [
  { t: 0, cx: 560, cy: 330, zoom: 1.1 },
  { t: SA(cAba.t) + 0.3, cx: 740, cy: 345, zoom: 1.15 },
];
alvos[M.campanha] = [
  // o botão "Nova campanha", no alto da página
  { t: 0, cx: 1150, cy: 380, zoom: 1.0 },
  // identificação: o alto da janela, à esquerda
  { t: SB(cNova.t) + 0.1, cx: 672, cy: 383, zoom: 1.12 },
  // "Definir público": os filtros em cima; "Validar WhatsApp" embaixo
  { t: SB(cPublico.t) - 0.2, cx: 760, cy: 470, zoom: 1.12 },
  { t: SB(cPublico.t) + 0.25, cx: 800, cy: 432, zoom: 1.12 },
  { t: SB(mB("selecionados")) - 0.2, cx: 800, cy: 462, zoom: 1.12 },
  // a validação: a janela inteira
  { t: M.validado - 0.45, cx: 790, cy: 448, zoom: 1.0 },
  // de volta à campanha: público e disparo, embaixo à esquerda
  { t: SB(cDefinirPublico.t) + 0.1, cx: 672, cy: 514, zoom: 1.12 },
  // as regras de envio: o alto da janela; depois o botão "Definir", embaixo
  { t: SB(cRegras.t) + 0.1, cx: 800, cy: 383, zoom: 1.12 },
  { t: M.agendarFim - 0.1, cx: 800, cy: 514, zoom: 1.12 },
  // os modelos: a lista e a prévia, lado a lado
  { t: SB(cDefinirRegras.t) + 0.1, cx: 900, cy: 420, zoom: 1.0 },
  { t: SB(cEscolher.t) + 0.1, cx: 800, cy: 446, zoom: 1.0 },
  // a campanha com o modelo: a mensagem e "Quando o lead responder", à direita
  { t: SB(cUsar.t) + 0.1, cx: 928, cy: 440, zoom: 1.12 },
  { t: dito("v2-07", "quem") - 0.5, cx: 928, cy: 514, zoom: 1.12 },
  // a sequência: o painel à esquerda e o fluxo no meio
  { t: SB(cEditar.t) - 0.25, cx: 800, cy: 514, zoom: 1.12 },
  { t: SB(cEditar.t) + 0.2, cx: 740, cy: 458, zoom: 1.0 },
  { t: SB(cPronto.t) - 0.45, cx: 875, cy: 474, zoom: 1.0 },
  // o resumo, no meio
  { t: SB(cAgendarCampanha.t) - 0.3, cx: 900, cy: 500, zoom: 1.0 },
  { t: SB(mB("resumo")) - 0.1, cx: 800, cy: 448, zoom: 1.12 },
  // a lista de campanhas: do nome ao status
  { t: SB(cConfirmar.t) + 0.3, cx: 650, cy: 500, zoom: 0.9 },
];
alvos[M.relatorio] = [
  // a lista de campanhas, onde se clica
  { t: 0, cx: 560, cy: 520, zoom: 1.0 },
  // o relatório abre à direita: os números da campanha
  { t: SC(cAbrir.t) + 0.2, cx: 903, cy: 479, zoom: 0.9 },
  { t: SC(mC("numeros")) - 0.1, cx: 903, cy: 560, zoom: 1.1 },
  // "Sem interação", no alto à direita; depois a janela dos leads
  { t: SC(cSemInteracao.t) - 0.9, cx: 1045, cy: 421, zoom: 0.9 },
  { t: SC(cSemInteracao.t) + 0.2, cx: 800, cy: 440, zoom: 1.0 },
  { t: SC(cTag.t) - 0.4, cx: 875, cy: 474, zoom: 1.0 },
];
// a lista de modelos e a prévia no WhatsApp, lado a lado
alvos[M.usos] = [{ t: 0, cx: 800, cy: 450, zoom: 0.95 }];

const { salto } = ajudasFluidas({ partes: roteiro.partes, filmes: g, alvos, pastaFilme: PASTA });

// ════ Por cima da janela: títulos, caminhos, recortes que saltam e camadas ═══════════════════════
const sobre: SobreReel[] = [];
const caminhos: TrilhaDeCliques[] = [];
const sons: NonNullable<EdicaoFluida["sons"]> = [];
const titulo = (texto: string, de: number, ate: number): SobreReel => ({ tipo: "titulo", texto, de, ate });
const camada = (de: number, ate: number, el: React.FC<PropsCamada>, o: { atras?: boolean; escurece?: boolean } = {}): SobreReel => ({ tipo: "camada", de, ate, el, ...o });
const ESQ = 282;
const DIR = 798;

// 1 · painel: os números do período saltam em mosaico quando o cursor chega em cada um
{
  const i = M.painel;
  const fim = inicioDe(M.campanha);
  const oficial = dito("v2-01", "pelo") - 0.1;
  sobre.push(titulo("A *mensagem certa* para centenas de clientes", 0.15, oficial), titulo("Pelo *WhatsApp oficial*", oficial + 0.05, fim));
  caminhos.push({ de: 0.5, ate: oficial - 0.05, passos: [{ rotulo: "Campanhas", em: SA(cAba.t) }] });
  const LUGARES = [
    [ESQ, 715, -2],
    [DIR, 715, 1.5],
    [ESQ, 1030, 1.5],
    [DIR, 1030, -1.5],
  ] as const;
  NUMEROS.forEach(([numero], k) => {
    const [cx, cy, rot] = LUGARES[k];
    sobre.push(salto(i, numero, { de: SA(viagemApos(A, mA(numero)).ate) + 0.05, ate: fim, w: 470, cx, cy, raio: 16, rot }));
  });
  sobre.push(camada(dito("v2-01", "WhatsApp") - 0.15, fim, (q) => <LogoCanal {...q} canal="whatsapp" x={540} y={872} tamanho={190} />));
}

const i = M.campanha;

// 2a · identificação: o nome, a equipe e o número saem do formulário
{
  const de = M.identificado;
  const fim = M.identificacaoFim;
  sobre.push(titulo("Nome, equipe e *número*", inicioDe(i) + 0.1, fim));
  caminhos.push({
    de: inicioDe(i) + 0.1,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Nova campanha", em: SB(cNova.t) },
      { rotulo: "Nome", em: SB(cNome.t) },
      { rotulo: "Equipe", em: SB(cEquipe.t) },
      { rotulo: "Número", em: SB(cCanal.t) },
    ],
  });
  sobre.push(salto(i, "identificacao", { de, ate: fim, parte: { x: 0, y: 0.25, w: 0.62, h: 0.33 }, w: 900, cy: 760, raio: 12, rot: -1.5 }));
  sobre.push(salto(i, "identificacao", { de: de + 0.14, ate: fim, parte: { x: 0, y: 0.56, w: 0.3, h: 0.44 }, w: 500, cx: 300, cy: 990, raio: 12, rot: 2 }));
  sobre.push(salto(i, "identificacao", { de: de + 0.28, ate: fim, parte: { x: 0.5, y: 0.56, w: 0.37, h: 0.44 }, w: 620, cx: 690, cy: 1210, raio: 12, rot: -1.5 }));
}

// 2b · público: as tags escolhidas e quantos contatos entram
{
  const de = M.publicoPronto;
  const fim = M.publicoFim;
  sobre.push(titulo("O público sai da *sua carteira*", M.identificacaoFim, fim));
  caminhos.push({
    de: M.identificacaoFim,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Definir público", em: SB(cPublico.t) },
      { rotulo: "Mercados", em: SB(cMercados.t) },
      { rotulo: "Padarias", em: SB(cPadarias.t) },
    ],
  });
  sobre.push(salto(i, "tags", { de, ate: fim, w: 940, cy: 810, raio: 12, rot: -1.5 }));
  sobre.push(salto(i, "selecionados", { de: de + 0.16, ate: fim, w: 940, cy: 1070, raio: 14, rot: 1.5 }));
}

// 2c · validação: os números sem WhatsApp aparecem e saem da lista
{
  const fim = M.validarFim;
  sobre.push(titulo("Confere quem *tem WhatsApp*", M.publicoFim, M.validarSai));
  caminhos.push({
    de: M.publicoFim,
    ate: M.validarSai - 0.05,
    passos: [
      { rotulo: "Validar WhatsApp", em: SB(cValidar.t) },
      { rotulo: "Remover da lista", em: SB(cRemover.t) },
      { rotulo: "Definir", em: SB(cDefinirPublico.t) },
    ],
  });
  sobre.push(salto(i, "sem-whatsapp", { de: M.validado, ate: fim, parte: { x: 0, y: 0, w: 0.64, h: 0.61 }, w: 900, cy: 870, raio: 12, rot: -1.5 }));
  sobre.push(camada(M.validado + 0.45, fim, (q) => <Selo {...q} x={540} y={1210} texto="9 números sem WhatsApp fora da lista" icone="filtro" tom="escuro" tamanho={38} />));
}

// 2d · agendamento: a data e a hora; o intervalo e o limite por dia
{
  const de = M.agendado;
  const fim = M.agendarFim;
  sobre.push(titulo("*Agende* para o melhor horário", M.validarSai, M.agendarSai));
  caminhos.push({
    de: M.validarSai,
    ate: M.agendarSai - 0.05,
    passos: [
      { rotulo: "Agendar", em: SB(cAgendar.t) },
      { rotulo: "Data e hora", em: SB(cData.t) },
      { rotulo: "Regras de envio", em: SB(cRegras.t) },
      { rotulo: "Definir", em: SB(cDefinirRegras.t) },
    ],
  });
  sobre.push(salto(i, "agendamento", { de, ate: fim, parte: { x: 0, y: 0.42, w: 0.5, h: 0.58 }, w: 880, cy: 790, raio: 12, rot: -1.5 }));
  sobre.push(camada(de + 0.2, fim, (q) => <Selo {...q} x={540} y={1010} texto="Intervalo entre os envios" icone="relogio" tom="claro" tamanho={44} giro={1.5} />));
  sobre.push(camada(de + 0.4, fim, (q) => <Selo {...q} x={540} y={1150} texto="Até 250 envios por dia" icone="escudo" tom="marca" tamanho={44} giro={-1.5} />));
}

// 2e · modelo aprovado pela Meta: a prévia salta, e cada parte dela é apontada na palavra
{
  const de = M.modelo;
  const fim = M.modeloFim;
  sobre.push(titulo("Modelo *aprovado pela Meta*", M.agendarSai, M.modeloSai));
  caminhos.push({
    de: M.agendarSai,
    ate: M.modeloSai - 0.05,
    passos: [
      { rotulo: "Escolher modelo", em: SB(cEscolher.t) },
      { rotulo: "Semana do Atacado", em: SB(cSemana.t) },
      { rotulo: "Usar", em: SB(cUsar.t) },
    ],
  });
  sobre.push(salto(i, "modelo", { de, ate: fim, w: 630, cy: 950, raio: 12, rot: -1.5 }));
  sobre.push(camada(Math.max(de + 0.3, dito("v2-06", "Meta") - 0.1), fim, (q) => <Selo {...q} x={540} y={590} texto="Aprovado pela Meta" icone="certo" tom="verde" tamanho={40} />));
  // cada parte do modelo, apontada do lado de fora do cartão
  sobre.push(camada(Math.max(de + 0.5, dito("v2-06", "imagem") - 0.1), fim, (q) => <Selo {...q} x={912} y={745} texto="Imagem" tom="marca" tamanho={38} giro={4} />));
  sobre.push(camada(dito("v2-06", "botões") - 0.1, fim, (q) => <Selo {...q} x={912} y={1250} texto="Botões" tom="marca" tamanho={38} giro={-3} />));
  sobre.push(camada(dito("v2-06", "nome") - 0.1, fim, (q) => <Selo {...q} x={150} y={924} texto="Nome" tom="marca" tamanho={38} giro={-4} />));
}

// 2f · quem responde: o time ou a agente de IA, na hora
{
  const de = M.lia;
  const fim = M.respostaFim;
  sobre.push(titulo("Seu time ou a *agente de IA* responde", M.modeloSai, fim));
  caminhos.push({
    de: M.modeloSai,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Quando o lead responder", em: SB(viagemApos(B, mB("resposta")).ate) },
      { rotulo: "Agente IA", em: SB(cAgente.t) },
      { rotulo: "Lia", em: SB(cLia.t) },
    ],
  });
  // enquanto a fala é "o seu time", o selo aparece ao lado do cartão, sem cobrir a tela
  sobre.push(camada(dito("v2-07", "time") - 0.15, de, (q) => <Selo {...q} x={300} y={1240} texto="Seu time" icone="pessoas" tom="claro" tamanho={44} giro={-2} />));
  // a caixa "Quando o lead responder", já com a Lia escolhida
  sobre.push(salto(i, "resposta", { de, ate: fim, parte: { x: 0, y: 0, w: 1, h: 0.76 }, w: 900, cy: 850, raio: 14, rot: -1.5 }));
  sobre.push(camada(de + 0.25, fim, (q) => <Selo {...q} x={540} y={1150} texto="Agente Lia" icone="robo" tom="marca" tamanho={44} giro={2} />));
  sobre.push(camada(Math.max(de + 0.5, dito("v2-07", "na") - 0.1), fim, (q) => <Selo {...q} x={540} y={1272} texto="Na hora" icone="relogio" tom="verde" tamanho={40} />));
}

// 2g · sequência: a espera e a 2ª mensagem saem do fluxo
{
  const de = M.sequencia;
  const fim = M.sequenciaFim;
  sobre.push(titulo("*Sequência* com lembrete automático", M.respostaFim, M.sequenciaSai));
  caminhos.push({
    de: M.respostaFim,
    ate: M.sequenciaSai - 0.05,
    passos: [
      { rotulo: "Editar sequência", em: SB(cEditar.t) },
      { rotulo: "Adicionar", em: SB(cAdicionar.t) },
      { rotulo: "Modelo", em: SB(cUltima.t) },
      { rotulo: "2 dias", em: SB(cDias.t) },
    ],
  });
  sobre.push(salto(i, "sequencia", { de, ate: fim, parte: { x: 0, y: 0.06, w: 0.56, h: 0.92 }, w: 780, cy: 925, raio: 14, rot: -1.5 }));
  sobre.push(camada(de + 0.35, fim, (q) => <Selo {...q} x={772} y={1268} texto="2 dias depois" icone="relogio" tom="marca" tamanho={42} giro={-3} />));
}

// 2h · confirmação: o resumo; depois, a campanha nova na lista, agendada
{
  const fim = M.campanhaFim;
  const confirma = SB(cConfirmar.t) + 0.4;
  sobre.push(titulo("Confira e *confirme*", M.sequenciaSai, confirma), titulo("Campanha *agendada*", confirma + 0.05, fim));
  caminhos.push({
    de: M.sequenciaSai,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Agendar campanha", em: SB(cAgendarCampanha.t) },
      { rotulo: "Confirmar e agendar", em: SB(cConfirmar.t) },
    ],
  });
  sobre.push(salto(i, "confirmacao", { de: M.resumo, ate: M.resumoSai, parte: { x: 0.02, y: 0.15, w: 0.62, h: 0.45 }, w: 900, raio: 12, rot: -1.5 }));
  const de = M.naLista;
  sobre.push(salto(i, "linha-nova", { de, ate: fim, parte: { x: 0, y: 0, w: 0.42, h: 1 }, w: 880, cy: 790, raio: 12, rot: -1.5 }));
  sobre.push(salto(i, "linha-nova", { de: de + 0.18, ate: fim, parte: { x: 0.56, y: 0, w: 0.35, h: 1 }, w: 700, cy: 960, raio: 12, rot: 1.5 }));
  sobre.push(salto(i, "status-nova", { de: de + 0.4, ate: fim, w: 380, cy: 1140, raio: 999, rot: -2 }));
  sobre.push(camada(de + 0.6, de + 2.2, (q) => <Confete {...q} x={540} y={1100} />));
  sons.push({ em: de + 0.55, arquivo: "sino.wav", volume: 0.45 });
}

// 3 · relatório: os números da campanha saltam em mosaico quando o cursor chega em cada um
{
  const j = M.relatorio;
  const fim = M.relatorioFim;
  sobre.push(titulo("*Relatório* de cada campanha", inicioDe(j) + 0.1, fim));
  caminhos.push({ de: inicioDe(j) + 0.1, ate: fim - 0.05, passos: [{ rotulo: "Semana do Atacado", em: SC(cAbrir.t) }] });
  const chegou = (n: string) => SC(viagemApos(C, mC(n)).ate) + 0.05;
  sobre.push(salto(j, "envios", { de: chegou("envios"), ate: fim, w: 450, cx: ESQ, cy: 765, raio: 16, rot: -2 }));
  sobre.push(salto(j, "lidos", { de: chegou("lidos"), ate: fim, w: 450, cx: DIR, cy: 765, raio: 16, rot: 1.5 }));
  sobre.push(salto(j, "interagidos", { de: chegou("interagidos"), ate: fim, w: 450, cx: ESQ, cy: 1150, raio: 16, rot: 1.5 }));
  sobre.push(salto(j, "conversao", { de: chegou("conversao"), ate: fim, w: 450, cx: DIR, cy: 1150, raio: 16, rot: -1.5 }));
}

// 3b · leads sem interação: quantos são, a tag e as ações aplicadas
{
  const j = M.relatorio;
  const fim = M.leadsFim;
  const tag = SC(cTag.t) - 0.25;
  sobre.push(titulo("Quem não interagiu fica *separado*", M.relatorioFim, tag), titulo("Pronto para uma *nova abordagem*", tag + 0.05, fim));
  caminhos.push({
    de: M.relatorioFim,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Sem interação", em: SC(cSemInteracao.t) },
      { rotulo: "Nova abordagem", em: SC(cTag.t) },
      { rotulo: "Aplicar", em: SC(cAplicar.t) },
    ],
  });
  sobre.push(camada(SC(mC("leads")) + 0.25, tag, (q) => <Selo {...q} x={540} y={1262} texto="51 leads não interagiram" icone="pessoas" tom="escuro" tamanho={40} />));
  const de = M.aplicado;
  sobre.push(salto(j, "tag", { de, ate: fim, w: 880, cy: 860, raio: 14, rot: -1.5 }));
  sobre.push(salto(j, "aplicado", { de: de + 0.2, ate: fim, w: 880, cy: 1150, raio: 12, rot: 1.5 }));
  sons.push({ em: de + 0.3, arquivo: "sino.wav", volume: 0.4 });
}

// 4 · um modelo para cada uso: a prévia de cada um salta logo depois do clique
{
  const j = M.usos;
  const fim = M.usosFim;
  sobre.push(titulo("Um modelo para *cada uso*", inicioDe(j) + 0.1, fim));
  // as prévias se empilham à direita, deixando à vista a lista onde o cursor clica
  USOS.forEach((u, k) => {
    const de = SD(cModelos[k].t) + 0.3;
    const proximo = k + 1 < USOS.length ? SD(cModelos[k + 1].t) + 0.3 : fim;
    const prop = recorte(D, u.recorte).caixa.h / recorte(D, u.recorte).caixa.w;
    const cx = 690 + (k - 2.5) * 12;
    const cy = 900 + (k % 2 ? 14 : -14);
    sobre.push(salto(j, u.recorte, { de, ate: fim, w: u.w, cx, cy, raio: 12, rot: (k % 2 ? 1 : -1) * (1.5 + (k % 3)), faiscas: k === 0 }));
    sobre.push(camada(de + 0.12, proximo, (q) => <Selo {...q} x={690} y={Math.min(1292, cy + (u.w * prop) / 2 + 40)} texto={u.nome} icone="megafone" tom="marca" tamanho={42} />));
  });
}

export const edicaoF2: EdicaoFluida = {
  ...roteiro,
  sobre,
  caminhos,
  alvos,
  sons,
  url: "app.selloop.com.br/atendimento",
  pastaFilme: PASTA,
  pastaLocucao: "selloop/locucao/r2",
  assunto: "Campanhas",
  icone: "megafone",
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.2, volumeFala: 0.07 },
};
export const DURACAO_F2 = Math.max(roteiro.duracao, fimFala("v2-11") + 1.5);

export const SelloopReelCampanhasFluido: React.FC = () => <Fluido edicao={edicaoF2} filmes={g} locucao={loc} />;
