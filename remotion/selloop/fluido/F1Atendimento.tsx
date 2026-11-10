import React from "react";
import eventosA from "../../../public/selloop/filme/f1-a-caixa/eventos.json";
import eventosB from "../../../public/selloop/filme/f1-b-privacidade/eventos.json";
import eventosC from "../../../public/selloop/filme/f1-c-recursos/eventos.json";
import eventosD from "../../../public/selloop/filme/f1-d-protocolo/eventos.json";
import eventosE from "../../../public/selloop/filme/f1-e-concluir/eventos.json";
import eventosF from "../../../public/selloop/filme/f1-f-indicadores/eventos.json";
import locucaoR1 from "../../../public/selloop/locucao/r1/locucao.json";
import { marca, recorte, trajetos, type Gravacao, type Trajeto } from "../gravacao";
import type { Canal } from "../marca";
import { prender, type Alvo } from "../reel/base";
import { Confete, Estrelas, LogoCanal, Selo, type PropsCamada } from "../reel/Efeitos";
import { cliquesApos } from "../reel/montagemReel";
import type { SobreReel } from "../reel/Reel";
import type { FalaLocucao } from "../Video";
import { ajudasFluidas } from "./ajudas";
import type { TrilhaDeCliques } from "./Caminho";
import { Fluido, type EdicaoFluida } from "./Fluido";
import { criarRoteiro } from "./roteiro";

// Reel 1 · Ambiente de atendimento, em tomada contínua (vertical, 9:16).
// As cenas são filmadas quadro a quadro (scripts/telas/filmar.mjs) e tocam sempre em 1x: o vídeo
// mostra o caminho de cada coisa — onde o cursor vai e clica — e o resultado salta da tela quando
// chega. A locução (voz da Raquel) entra no ritmo da tela, que espera por ela nos quadros parados.

const PASTA = "selloop/filme";
const g = {
  "f1-a-caixa": eventosA as unknown as Gravacao,
  "f1-b-privacidade": eventosB as unknown as Gravacao,
  "f1-c-recursos": eventosC as unknown as Gravacao,
  "f1-d-protocolo": eventosD as unknown as Gravacao,
  "f1-e-concluir": eventosE as unknown as Gravacao,
  "f1-f-indicadores": eventosF as unknown as Gravacao,
};
const [A, B, C, D, E, F] = Object.values(g);
const loc = locucaoR1.falas as unknown as (FalaLocucao & { nivel?: number })[];
const R = criarRoteiro({ filmes: g, locucao: loc, transicao: 0.4 });
const { durFala, palavra, dito, fimFala } = R;
const [tA, tE, tF] = [A, E, F].map(trajetos);
/** O cursor já chegou e a tela assentou (o realce do item terminou de acender). */
const ASSENTA = 0.26;
/**
 * O cursor faz a viagem `t` chegando ao destino no instante `quando` do vídeo: a tela espera parada
 * (com o cursor em repouso) até a hora de ele sair.
 */
const chegar = (t: Trajeto, quando: number) => {
  R.anda(t.t);
  R.seguraAte(quando - (t.ate - t.t));
  R.anda(t.ate + ASSENTA, { aperta: false });
};

const sobre: SobreReel[] = [];
const caminhos: TrilhaDeCliques[] = [];
const sons: NonNullable<EdicaoFluida["sons"]> = [];
/** O que cada momento precisa lembrar da linha do tempo para desenhar por cima dela depois. */
const M: Record<string, number> = {};

// ════ Linha do tempo ═════════════════════════════════════════════════════════════════════════════

// 1 · os três canais na mesma caixa de entrada; as mensagens chegam ao vivo
R.abrir("f1-a-caixa", marca(A, "novos") - 0.3);
M.caixa = R.parte;
R.fala("v1-01", { em: 0.45 });
// o cursor chega na conversa de cada canal na palavra dele
(["WhatsApp", "Instagram", "Messenger"] as const).forEach((canal, k) => chegar(tA[k], dito("v1-01", canal) + 0.05));
R.seguraAte(dito("v1-01", "tudo") - 0.3);
M.chegam = R.agora;
R.anda(marca(A, "todos") - 0.05, { descanso: 0.4 });
R.seguraAte(fimFala("v1-01") + 0.4);

// 2 · a empresa toda no mesmo número: a aba Todos
M.empresa = R.agora;
R.fala("v1-02", { em: R.agora + 0.1 });
R.anda(marca(A, "equipes") - 0.05, { aperta: false });
R.seguraAte(fimFala("v1-02") + 0.45);

// 3 · o atendente só vê o que é dele
R.abrir("f1-b-privacidade", marca(B, "meus") - 0.05);
M.privacidade = R.parte;
R.fala("v1-03", { em: R.agora - 0.1 });
R.anda(marca(B, "lista") - 0.05);
R.seguraAte(fimFala("v1-03") + 0.75);

// 4 · quem administra vê todas as equipes e acompanha a transferência
R.abrir("f1-a-caixa", marca(A, "equipes") - 0.05);
M.admin = R.parte;
R.fala("v1-04", { em: R.agora - 0.1 });
chegar(tA[4], dito("v1-04", "conversas"));
chegar(tA[5], dito("v1-04", "equipes"));
R.seguraAte(dito("v1-04", "acompanha") - 0.15);
R.anda(marca(A, "transferida") - 0.05);
M.transferida = R.agora;
R.anda(A.duracao - 0.3, { aperta: false });
R.seguraAte(fimFala("v1-04") + 0.45);

// 5 · dentro da conversa: o clipe e o caminho de cada recurso
type Recurso = {
  marca: string;
  fala: string;
  titulo: string;
  /** O caminho: o clipe, o item do menu e o botão que envia. */
  passos: [string, string, string];
  /** O que salta quando chega, e o instante do filme em que já está na conversa. */
  recorte: string;
  chega: number;
  salto: Record<string, unknown>;
};
const mC = (n: string) => marca(C, n);
const RECURSOS: Recurso[] = [
  { marca: "produtos", fala: "v1-05", titulo: "Catálogo com *foto e preço*", passos: ["Anexos", "Produtos", "Enviar"], recorte: "produto", chega: mC("produtos-chegou") - 0.25, salto: { maxA: 740 } },
  { marca: "orcamento", fala: "v1-05b", titulo: "*Orçamento* pelo WhatsApp", passos: ["Anexos", "Orçamento", "Enviar"], recorte: "orcamento", chega: mC("orcamento-pedido") + 0.3, salto: { parte: { x: 0, y: 0.395, w: 1, h: 0.555 }, maxL: 800, maxA: 740 } },
  { marca: "formulario", fala: "v1-05c", titulo: "*Formulários* preenchidos", passos: ["Anexos", "Formulário", "Enviar"], recorte: "formulario", chega: mC("formulario-chegou") - 0.4, salto: { maxL: 860 } },
  { marca: "enquete", fala: "v1-05d", titulo: "*Enquetes* com voto na hora", passos: ["Anexos", "Enquete", "Enviar"], recorte: "enquete", chega: mC("enquete-chegou") - 0.4, salto: { maxL: 860 } },
  { marca: "pagamento", fala: "v1-06", titulo: "*Cobrança por Pix* ali mesmo", passos: ["Anexos", "Pagamento", "Enviar"], recorte: "cobranca", chega: mC("cobranca-chegou") - 0.3, salto: { maxA: 720 } },
  { marca: "notas", fala: "v1-06b", titulo: "*Nota fiscal* do seu sistema", passos: ["Anexos", "Notas e pedidos", "Enviar"], recorte: "nota", chega: mC("nota-chegou") - 0.3, salto: { w: 600 } },
  { marca: "agendar", fala: "v1-06c", titulo: "Mensagem *agendada*", passos: ["Anexos", "Agendar mensagem", "Agendar"], recorte: "agendada", chega: mC("agendada-chegou") - 0.3, salto: { maxL: 940 } },
];
/** Quanto um resultado fica saltado na frente da janela, no mínimo (s). */
const NA_FRENTE = 1.05;
/** O resultado aparece na conversa e, um instante depois, salta. */
const ANTES_DE_SALTAR = 0.16;
/** O cursor já sai para o próximo caminho enquanto o resultado anterior ainda some da frente. */
const SAINDO = 0.3;

R.abrir("f1-c-recursos", mC("clipe") - 0.25);
M.recursos = R.parte;
R.fala("v1-05", { em: R.agora - 0.1 });
// o clipe abre: tudo que cabe na conversa está ali
R.anda(mC("menu") + 0.12, { aperta: false });
M.menu = R.agora;
R.seguraAte(dito("v1-05", "O") - 0.1, 1.0);
M.menuSai = R.agora;

RECURSOS.forEach((r, k) => {
  const inicio = R.agora;
  const cs = cliquesApos(C, mC(r.marca));
  // o clique que envia é o último antes de o resultado chegar
  const envia = [...cs].reverse().find((c) => c.t < r.chega) ?? cs[0];
  const primeiro = k === 0 ? cliquesApos(C, mC("clipe"))[0] : cs[0];
  const item = k === 0 ? cs[0] : cs[1];
  // o caminho no ritmo da fala, quando dá: a última palavra cai com o resultado saltando
  const folga = k === 0 ? fimFala("v1-05") - 0.25 - R.agora : durFala(r.fala) - 0.15;
  R.andaEm(r.chega, Math.max(1.6, folga));
  R.segura(ANTES_DE_SALTAR);
  const salta = R.agora;
  let naFrenteDesde = salta;
  if (r.marca === "pagamento") {
    // o QR fica na frente um instante; aí o cartão vira "Pago" e salta de novo, na palavra "paga"
    R.segura(0.95);
    M.qrSai = R.agora;
    R.anda(mC("pago") + 0.4, { descanso: 0.12 });
    M.pago = naFrenteDesde = R.agora;
    R.fala(r.fala, { em: Math.max(inicio + 0.05, M.pago - palavra(r.fala, "paga") - 0.05) });
  } else if (k > 0) {
    // a última palavra cai com o salto; num caminho comprido, a fala começa um pouco antes disso
    const adianta = Math.min(0.45, Math.max(0, (salta - inicio - durFala(r.fala)) * 0.35));
    R.fala(r.fala, { em: Math.max(inicio + 0.05, salta + 0.25 - durFala(r.fala) - adianta) });
  }
  M[`${r.marca}:inicio`] = inicio;
  M[`${r.marca}:salta`] = salta;
  caminhos.push({
    de: k === 0 ? M.menuSai - 0.15 : inicio,
    ate: 0, // fecha quando o momento acaba (abaixo)
    passos: [
      { rotulo: r.passos[0], em: R.saida("f1-c-recursos", primeiro.t) },
      { rotulo: r.passos[1], em: R.saida("f1-c-recursos", item.t) },
      { rotulo: r.passos[2], em: R.saida("f1-c-recursos", envia.t) },
    ],
  });
  // com o resultado na frente, a conversa segue por baixo até o ponto de partida do próximo recurso
  const proximo = RECURSOS[k + 1];
  R.anda(proximo ? mC(proximo.marca) : mC("fim") + 0.3, { descanso: 0.15 });
  R.seguraAte(Math.max(naFrenteDesde + NA_FRENTE, fimFala(r.fala) + 0.3) - (proximo ? SAINDO : 0));
  M[`${r.marca}:fim`] = R.agora;
  M[`${r.marca}:some`] = R.agora + (proximo ? SAINDO : 0);
  caminhos[caminhos.length - 1].ate = R.agora - 0.05;
});

// 6 · protocolo: da Central de Protocolos ao PDF, e o PDF de volta na conversa
const mD = (n: string) => marca(D, n);
R.abrir("f1-d-protocolo", mD("protocolos") - 0.2);
M.protocolo = R.parte;
// a fala entra um pouco depois: "protocolo" é dito com a lista já aberta, e o número fica na frente
R.fala("v1-07", { em: R.agora + 0.45 });
R.anda(mD("lista"));
M.lista = R.agora;
R.seguraAte(dito("v1-07", "Se") - 0.15);
// "se o cliente pedir o histórico": busca a Marina e marca o atendimento dela
R.andaEm(mD("gerar") - 0.05, dito("v1-07", "você") - 0.1 - R.agora);
// "você gera o PDF": o clique em Gerar PDF e a página saindo do botão
R.anda(mD("pdf-pronto") + 0.25);
M.pdf = R.agora;
R.seguraAte(dito("v1-07", "envia") - 0.35, 1.0);
M.pdfSai = R.agora;
// de volta ao Loop Chat, para enviar
const cliqueVoltar = cliquesApos(D, mD("voltar"))[0];
R.anda(cliqueVoltar.t + 0.2);
M.protocoloFim = R.agora;
// na conversa, o PDF já anexado: é só enviar
R.abrir("f1-d-protocolo", mD("enviar") - 0.4, { entrada: 0.35 });
M.anexar = R.parte;
R.anda(mD("pdf-chegou") - 0.3);
R.segura(ANTES_DE_SALTAR);
M.enviado = R.agora;
R.seguraAte(Math.max(R.agora + NA_FRENTE, fimFala("v1-07") + 0.4));

// 7 · concluir: a pesquisa de satisfação vai sozinha e a avaliação chega na conversa
const mE = (n: string) => marca(E, n);
R.abrir("f1-e-concluir", mE("concluir") - 0.2);
M.pesquisa = R.parte;
R.fala("v1-08", { em: R.agora - 0.1 });
R.anda(tE[1].ate + ASSENTA);
M.caixaPesquisa = R.agora;
R.seguraAte(dito("v1-08", "vai") - 0.35, 0.8);
M.caixaSai = R.agora;
R.anda(mE("pesquisa") - 0.35);
M.pesquisaChega = R.agora;
R.seguraAte(dito("v1-08", "avaliação") - 0.15, 1.0);
M.pesquisaSai = R.agora;
R.anda(mE("avaliacao") + 0.4, { descanso: 0.15 });
M.avaliacao = R.agora;
R.anda(E.duracao - 0.3);
R.seguraAte(Math.max(M.avaliacao + 1.7, fimFala("v1-08") + 0.6));

// 8 · indicadores: o painel abre, o cursor passa por cada parte e a página desce até a nota média
const mF = (n: string) => marca(F, n);
R.abrir("f1-f-indicadores", mF("abrir") - 0.2);
M.indicadores = R.parte;
R.fala("v1-09", { em: R.agora - 0.1 });
R.anda(mF("cartoes"), { aperta: false });
// "volume, tempo de espera, desempenho de cada equipe": o cursor passa pelos cartões e a página desce
R.seguraAte(dito("v1-09", "volume") - 0.55);
R.anda(tF[4].ate + ASSENTA, { descanso: 0.12 });
chegar(tF[5], dito("v1-09", "nota") - 0.1);
R.seguraAte(fimFala("v1-09") + 0.9);
M.indicadoresFim = R.agora;

// a frase já está na tela: sem legenda
R.encerramento("Atenda e venda sem trocar de tela.", 4.9);
R.fala("v1-10", { em: M.indicadoresFim + 0.5, legenda: false });

const roteiro = R.pronto();
const S = R.saida;

// ════ Câmera (no tempo do vídeo; px CSS da tela, 1600×900) ═══════════════════════════════════════
/** A lista de conversas encostada à esquerda da janela: sobra espaço à direita para o que salta. */
const LISTA = { cx: 362, cy: 418, zoom: 1.75 };
/** A lista com as abas em cima (onde se clica em Todos e Meus). */
const LISTA_E_ABAS = { cx: 372, cy: 345, zoom: 1.5 };
const alvos: Record<number, Alvo[]> = {};
type Faixa = { x: [number, number]; y: [number, number] };
/**
 * Um alvo em cada clique de uma tomada: a câmera acompanha o cursor. Com `faixa`, o centro dela fica
 * dentro desses limites (px CSS): ela acompanha sem atravessar a tela a cada clique.
 */
const nosCliques = (cena: string, G: Gravacao, de: number, ate: number, zoom: number, faixa?: Faixa): Alvo[] =>
  cliquesApos(G, de)
    .filter((c) => c.t < ate)
    .map((c) => ({ t: S(cena, c.t) - 0.3, cx: faixa ? prender(c.x, ...faixa.x) : c.x, cy: faixa ? prender(c.y, ...faixa.y) : c.y, zoom }));

alvos[M.caixa] = [
  { t: 0, ...LISTA },
  { t: M.empresa - 0.2, ...LISTA_E_ABAS },
  { t: dito("v1-02", "atende") - 0.4, cx: 400, cy: 525, zoom: 1.35 },
];
alvos[M.privacidade] = [{ t: 0, ...LISTA_E_ABAS }];
{
  const aviso = recorte(A, "transferida").caixa;
  alvos[M.admin] = [
    { t: 0, cx: 400, cy: 560, zoom: 1.35 },
    { t: dito("v1-04", "acompanha") + 0.1, cx: aviso.x + aviso.w / 2, cy: aviso.y + aviso.h / 2 + 60, zoom: 1.4 },
  ];
}
{
  // a conversa inteira no começo (o clipe e o menu); depois a câmera acompanha os cliques e vai para
  // cada resultado quando ele chega
  // a câmera fica sobre a conversa (o clipe embaixo à esquerda, as mensagens enviadas à direita)
  const CONVERSA: Faixa = { x: [745, 1125], y: [390, 560] };
  const ZOOM = 1.12;
  const a: Alvo[] = [{ t: 0, cx: 905, cy: 540, zoom: 1.0 }, ...nosCliques("f1-c-recursos", C, mC("produtos"), C.duracao, ZOOM, CONVERSA)];
  for (const r of RECURSOS) {
    const c = recorte(C, r.recorte).caixa;
    a.push({ t: M[`${r.marca}:salta`] - 0.45, cx: prender(c.x + c.w / 2, ...CONVERSA.x), cy: prender(c.y + c.h / 2, ...CONVERSA.y), zoom: ZOOM });
  }
  alvos[M.recursos] = a.sort((x, y) => x.t - y.t);
}
// a Central de Protocolos é uma tabela larga: a página na altura da janela, e a câmera pende para o
// lado de cada clique (busca à direita, seleção à esquerda, Gerar PDF à direita)
{
  const TABELA: Faixa = { x: [680, 1008], y: [450, 450] };
  alvos[M.protocolo] = [
    { t: 0, cx: 834, cy: 450, zoom: 0.845 },
    // quando a lista abre, o lado dos números de protocolo
    { t: M.lista - 0.3, cx: TABELA.x[0], cy: 450, zoom: 0.845 },
    ...nosCliques("f1-d-protocolo", D, mD("lista"), cliqueVoltar.t + 0.05, 0.845, TABELA),
  ];
}
{
  const pdf = recorte(D, "pdf-enviado").caixa;
  alvos[M.anexar] = [
    { t: 0, cx: 820, cy: 480, zoom: 0.95 },
    { t: M.enviado - 0.5, cx: pdf.x + pdf.w / 2 - 120, cy: pdf.y + pdf.h / 2 - 40, zoom: 1.0 },
  ];
}
alvos[M.pesquisa] = [{ t: 0, cx: 1150, cy: 360, zoom: 0.95 }, ...nosCliques("f1-e-concluir", E, 0, E.duracao, 0.95), { t: M.avaliacao - 0.5, cx: 1050, cy: 560, zoom: 1.0 }];
alvos[M.indicadores] = [
  { t: 0, cx: 836, cy: 420, zoom: 0.84 },
  { t: dito("v1-09", "volume") - 0.7, cx: 1160, cy: 430, zoom: 1.2 },
  { t: dito("v1-09", "tempo") - 0.6, cx: 560, cy: 720, zoom: 1.15 },
  { t: S("f1-f-indicadores", F.eventos.find((e) => e.tipo === "rolar")!.t) - 0.2, cx: 600, cy: 330, zoom: 1.15 },
  { t: dito("v1-09", "nota") - 0.7, cx: 470, cy: 740, zoom: 1.2 },
];

/** A página dos indicadores acabou de descer. */
M.desceu = S("f1-f-indicadores", F.eventos.find((e) => e.tipo === "rolar")!.t + 1.1);
const { salto, naJanela } = ajudasFluidas({ partes: roteiro.partes, filmes: g, alvos, pastaFilme: PASTA });

// ════ Por cima da janela: títulos, caminhos, recortes que saltam e camadas ═══════════════════════
const titulo = (texto: string, de: number, ate: number): SobreReel => ({ tipo: "titulo", texto, de, ate });
const camada = (de: number, ate: number, el: React.FC<PropsCamada>, o: { atras?: boolean; escurece?: boolean } = {}): SobreReel => ({ tipo: "camada", de, ate, el, ...o });
const inicioDe = (i: number) => roteiro.partes[i].inicio;
const fimDe = (i: number) => roteiro.partes[i].fim;

// 1 · canais: a logo de cada canal sai da conversa em que ele aparece, na palavra em que é dito;
// depois, cada mensagem que chega traz a logo do canal para o topo da lista
{
  const naSelloop = dito("v1-01", "Na");
  sobre.push(titulo("Seu cliente chama em *todo canal*", 0.15, naSelloop - 0.1), titulo("Tudo chega no *mesmo lugar*", naSelloop, M.empresa));
  const linhas: [Canal, string, string][] = [
    ["whatsapp", "conversa-whatsapp", "WhatsApp"],
    ["instagram", "conversa-instagram", "Instagram"],
    ["messenger", "conversa-messenger", "Messenger"],
  ];
  for (const [canal, nome, palavraDoCanal] of linhas) {
    const de = dito("v1-01", palavraDoCanal) - 0.1;
    const ret = naJanela(M.caixa, recorte(A, nome).caixa, de);
    const origem = { x: ret.x + ret.w * 0.14, y: ret.y + ret.h * 0.6 };
    sobre.push(camada(de, M.chegam - 0.05, (p) => <LogoCanal {...p} canal={canal} x={842} y={ret.y + ret.h / 2} tamanho={168} de={origem} />));
  }
  // as três mensagens chegam na ordem WhatsApp, Instagram, Messenger: a conversa sobe para o topo
  const topo = naJanela(M.caixa, recorte(A, "conversa-instagram").caixa, M.chegam + 0.5);
  const chegadas = [0, 0.52, 1.04].map((d) => S("f1-a-caixa", marca(A, "chegam") + d) + 0.08);
  (["whatsapp", "instagram", "messenger"] as Canal[]).forEach((canal, k) => {
    const de = chegadas[k];
    const ate = k < 2 ? chegadas[k + 1] + 0.1 : M.empresa - 0.1;
    sobre.push(camada(de, ate, (p) => <LogoCanal {...p} canal={canal} x={842} y={topo.y + topo.h / 2} tamanho={150} de={{ x: topo.x + topo.w * 0.14, y: topo.y + topo.h * 0.6 }} />));
  });
  sobre.push(camada(dito("v1-01", "tudo") - 0.1, M.empresa - 0.1, (p) => <Selo {...p} x={540} y={1262} texto="Uma caixa de entrada só" icone="caixa" tom="marca" tamanho={44} />));
}

// 2 · a empresa toda no mesmo número: conversas de equipes diferentes saltam da lista
{
  const fim = fimDe(M.caixa);
  sobre.push(titulo("A empresa no *mesmo número*", M.empresa + 0.05, fim));
  caminhos.push({ de: M.empresa, ate: fim - 0.1, passos: [{ rotulo: "Todos", em: S("f1-a-caixa", cliquesApos(A, marca(A, "todos"))[0].t) }] });
  sobre.push(salto(M.caixa, "conversa-comercial", { de: dito("v1-02", "número") - 0.15, ate: fim, w: 800, cy: 800, rot: -2.5, raio: 14 }));
  sobre.push(salto(M.caixa, "conversa-financeiro", { de: dito("v1-02", "WhatsApp") - 0.1, ate: fim, w: 800, cy: 1105, rot: 2, raio: 14 }));
  sobre.push(camada(dito("v1-02", "Direct") - 0.15, fim, (p) => <Selo {...p} x={540} y={1286} texto="(48) 3209-4100" icone="conversa" tom="marca" tamanho={46} />));
}

// 3 · privacidade do atendente
{
  const i = M.privacidade;
  sobre.push(titulo("Cada um vê *só o que é seu*", inicioDe(i) + 0.1, fimDe(i)));
  caminhos.push({ de: inicioDe(i) + 0.1, ate: fimDe(i) - 0.1, passos: [{ rotulo: "Meus", em: S("f1-b-privacidade", cliquesApos(B, 0)[0].t) }] });
  // as três primeiras conversas da aba "Meus" do Diogo
  sobre.push(salto(i, "meus", { de: dito("v1-03", "só") - 0.1, ate: fimDe(i), parte: { x: 0, y: 0, w: 1, h: 0.752 }, w: 690, cy: 925, raio: 14, rot: -1.5 }));
  sobre.push(camada(dito("v1-03", "próprios") + 0.1, fimDe(i), (p) => <Selo {...p} x={540} y={1296} texto="Só as conversas do Diogo" icone="cadeado" tom="escuro" tamanho={40} />));
}

// 4 · controle de quem administra e a transferência entre equipes
{
  const i = M.admin;
  const acompanha = dito("v1-04", "acompanha");
  sobre.push(titulo("O administrador tem *controle total*", inicioDe(i) + 0.1, acompanha - 0.1), titulo("*Transferência* sem repetir nada", acompanha, fimDe(i)));
  // ao lado da lista (aba "Todos"), as equipes da empresa
  const ve = dito("v1-04", "vê") - 0.1;
  const EQUIPES = [
    ["Comercial", "#2849db", 700, -3],
    ["Financeiro", "#10b981", 850, 2.5],
    ["Suporte", "#f59e0b", 1000, -2],
  ] as const;
  EQUIPES.forEach(([nome, corEquipe, y, giro], k) => sobre.push(camada(ve + 0.3 + k * 0.22, acompanha - 0.1, (p) => <Selo {...p} x={796} y={y} texto={nome} ponto={corEquipe} tom="claro" tamanho={46} giro={giro} />)));
  sobre.push(camada(ve, acompanha - 0.1, (p) => <Selo {...p} x={540} y={1250} texto="Vê todas as equipes" icone="olho" tom="marca" tamanho={44} />));
  const pilula = Math.max(dito("v1-04", "transferência") - 0.1, M.transferida + 0.2);
  sobre.push(salto(i, "transferida", { de: pilula, ate: fimDe(i), w: 820, cy: 900, raio: 999, rot: -1.5 }));
  sobre.push(camada(pilula + 0.4, fimDe(i), (p) => <Selo {...p} x={320} y={1080} texto="Comercial" tom="claro" tamanho={40} />));
  sobre.push(camada(pilula + 0.6, fimDe(i), (p) => <Selo {...p} x={760} y={1080} texto="Financeiro" icone="transferir" tom="verde" tamanho={40} />));
}

// 5 · recursos da conversa: o menu do clipe e, de cada recurso, o resultado que chega
{
  const i = M.recursos;
  sobre.push(titulo("Tudo *à mão* na conversa", inicioDe(i) + 0.1, M.menuSai - 0.1));
  // do menu aberto salta a parte com os recursos (de "Produtos" a "Agendar mensagem")
  sobre.push(salto(i, "menu", { de: M.menu + 0.05, ate: M.menuSai, parte: { x: 0, y: 5 / 15, w: 1, h: 9 / 15 }, w: 480, cy: 950, rot: -1.5, raio: 12 }));
  RECURSOS.forEach((r, k) => {
    const de = M[`${r.marca}:salta`];
    const fim = M[`${r.marca}:fim`];
    sobre.push(titulo(r.titulo, (k === 0 ? M.menuSai : M[`${r.marca}:inicio`]) + 0.02, fim));
    if (r.marca === "pagamento") {
      sobre.push(salto(i, "cobranca", { de, ate: M.qrSai, raio: 16, rot: -2, ...r.salto }));
      sobre.push(salto(i, "cobranca-paga", { de: M.pago, ate: M[`${r.marca}:some`], maxA: 700, raio: 16, rot: 1.5 }));
      sobre.push(camada(M.pago + 0.25, M.pago + 1.9, (p) => <Confete {...p} x={540} y={1010} />));
      sons.push({ em: M.pago + 0.2, arquivo: "sino.wav", volume: 0.45 });
    } else {
      sobre.push(salto(i, r.recorte, { de, ate: M[`${r.marca}:some`], raio: 16, rot: k % 2 ? 1.6 : -2, ...r.salto }));
    }
  });
}

// 6 · protocolo e PDF da conversa
{
  const i = M.protocolo;
  const j = M.anexar;
  const se = dito("v1-07", "Se");
  const voce = dito("v1-07", "você");
  sobre.push(
    titulo("Todo atendimento tem *protocolo*", inicioDe(i) + 0.1, se - 0.1),
    titulo("O cliente pediu o *histórico?*", se, voce - 0.1),
    titulo("*PDF* da conversa completa", voce, inicioDe(j) - 0.05),
    titulo("Enviado *na hora*", inicioDe(j), fimDe(j)),
  );
  const cs = cliquesApos(D, 0);
  const noVideo = (k: number, ordem = 0) => S("f1-d-protocolo", cs[k].t, ordem);
  caminhos.push({
    de: inicioDe(i) + 0.1,
    ate: fimDe(i) - 0.05,
    passos: [
      { rotulo: "Protocolos", em: noVideo(0) },
      { rotulo: "Buscar", em: noVideo(1) },
      { rotulo: "Selecionar", em: noVideo(2) },
      { rotulo: "Gerar PDF", em: noVideo(3) },
    ],
  });
  // de volta à conversa: o Loop Chat e o anexo ficaram para trás; falta enviar
  caminhos.push({
    de: inicioDe(j) + 0.05,
    ate: fimDe(j) - 0.1,
    passos: [
      { rotulo: "Loop Chat", em: inicioDe(j) },
      { rotulo: "Anexar o PDF", em: inicioDe(j) },
      { rotulo: "Enviar", em: S("f1-d-protocolo", cliquesApos(D, mD("enviar"))[0].t) },
    ],
  });
  // o número do protocolo, a situação e o contato (as duas primeiras colunas da linha)
  sobre.push(salto(i, "protocolo", { de: M.lista + 0.15, ate: se - 0.05, parte: { x: 0, y: 0, w: 0.6, h: 1 }, w: 900, raio: 10, rot: -1.5 }));
  // o pedido da cliente chega pela esquerda, por cima da parte vazia da tela
  sobre.push(salto(i, "pedido", { de: dito("v1-07", "pedir") - 0.2, ate: voce - 0.05, maxL: 900, cy: 1170, raio: 16, rot: 1.5, escurece: false, origem: { x: -520, y: 1120, w: 460, h: 60 } }));
  // a página do PDF sai do botão "Gerar PDF"
  sobre.push(salto(i, "gerar-pdf", { de: M.pdf, ate: M.pdfSai, w: 560, cy: 950, rot: -3, imagem: { src: `${PASTA}/f1-d-protocolo/pagina-1.png`, proporcao: 1.4142 } }));
  sobre.push(salto(j, "pdf-enviado", { de: M.enviado, ate: fimDe(j), w: 620, raio: 16, rot: -2 }));
}

// 7 · pesquisa de satisfação e a avaliação
{
  const i = M.pesquisa;
  const fim = fimDe(i);
  const avaliacao = dito("v1-08", "avaliação") - 0.2;
  sobre.push(titulo("*Pesquisa de satisfação* automática", inicioDe(i) + 0.1, avaliacao), titulo("A *avaliação* aparece ali mesmo", avaliacao + 0.05, fim));
  const cs = cliquesApos(E, 0);
  caminhos.push({ de: inicioDe(i) + 0.1, ate: avaliacao, passos: [{ rotulo: "Concluir", em: S("f1-e-concluir", cs[0].t) }, { rotulo: "Finalizar", em: S("f1-e-concluir", cs[1].t) }] });
  sobre.push(salto(i, "concluir", { de: M.caixaPesquisa, ate: M.caixaSai, maxL: 900, raio: 16, rot: -1.5 }));
  sobre.push(salto(i, "pesquisa", { de: M.pesquisaChega, ate: M.pesquisaSai, maxL: 940, raio: 16, rot: 1.5 }));
  const nota = M.avaliacao;
  sobre.push(salto(i, "avaliacao", { de: nota, ate: fim, w: 900, cy: 1100, raio: 999, rot: -1.5 }));
  sobre.push(camada(nota + 0.15, fim, (p) => <Estrelas {...p} x={540} y={860} tamanho={132} />, { escurece: true }));
  sobre.push(camada(nota + 0.5, nota + 2.1, (p) => <Confete {...p} x={540} y={900} />));
  sons.push({ em: nota + 0.35, arquivo: "sino.wav", volume: 0.45 });
}

// 8 · indicadores do gestor: o painel se monta em mosaico na frente da janela, uma parte por palavra
{
  const i = M.indicadores;
  const fim = M.indicadoresFim;
  const naPalavra = (p: string) => dito("v1-09", p) - 0.12;
  const ESQ = 282;
  const DIR = 798;
  sobre.push(titulo("*Indicadores* para o gestor", inicioDe(i) + 0.1, fim));
  caminhos.push({ de: inicioDe(i) + 0.1, ate: naPalavra("volume") - 0.1, passos: [{ rotulo: "Indicadores de Atendimento", em: S("f1-f-indicadores", cliquesApos(F, 0)[0].t) }] });
  // de cada cartão sai a parte com o número (o resto é espaço em branco)
  sobre.push(salto(i, "novos", { de: naPalavra("volume"), ate: fim, w: 470, cx: ESQ, cy: 700, raio: 12, rot: -2 }));
  sobre.push(salto(i, "espera", { de: naPalavra("tempo"), ate: fim, parte: { x: 0.02, y: 0.08, w: 0.44, h: 0.68 }, w: 470, cx: DIR, cy: 700, raio: 16, rot: 1.5 }));
  sobre.push(salto(i, "equipe-campea", { de: Math.max(naPalavra("desempenho"), M.desceu - 0.1), ate: fim, parte: { x: 0.01, y: 0.06, w: 0.37, h: 0.88 }, w: 470, cx: ESQ, cy: 925, raio: 16, rot: 1.5 }));
  sobre.push(salto(i, "atendente-campeao", { de: Math.max(naPalavra("cada"), M.desceu + 0.15), ate: fim, parte: { x: 0.01, y: 0.06, w: 0.37, h: 0.88 }, w: 470, cx: DIR, cy: 925, raio: 16, rot: -1.5 }));
  sobre.push(salto(i, "nota-media", { de: naPalavra("nota"), ate: fim, w: 988, cy: 1180, raio: 16, rot: -0.8 }));
}

export const edicaoF1: EdicaoFluida = {
  ...roteiro,
  sobre,
  caminhos,
  alvos,
  sons,
  url: "app.selloop.com.br/atendimento",
  pastaFilme: PASTA,
  pastaLocucao: "selloop/locucao/r1",
  assunto: "Atendimento",
  icone: "conversa",
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.2, volumeFala: 0.07 },
};
export const DURACAO_F1 = Math.max(roteiro.duracao, fimFala("v1-10") + 1.5);

export const SelloopReelAtendimentoFluido: React.FC = () => <Fluido edicao={edicaoF1} filmes={g} locucao={loc} />;
