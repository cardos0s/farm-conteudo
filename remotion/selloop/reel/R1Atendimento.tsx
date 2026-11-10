import React from "react";
import locucaoR1 from "../../../public/selloop/locucao/r1/locucao.json";
import eventosA from "../../../public/selloop/telas/v1-a-caixa/eventos.json";
import eventosB from "../../../public/selloop/telas/v1-b-privacidade/eventos.json";
import eventosC from "../../../public/selloop/telas/v1-c-recursos/eventos.json";
import eventosD from "../../../public/selloop/telas/v1-d-protocolo/eventos.json";
import eventosE from "../../../public/selloop/telas/v1-e-concluir/eventos.json";
import eventosF from "../../../public/selloop/telas/v1-f-indicadores/eventos.json";
import recortesC from "../../../public/selloop/telas/v1-c-recursos/recortes.json";
import { marca, recorte, type Gravacao } from "../gravacao";
import { criarMontagem, type Trecho } from "../montagem";
import { duracaoTotal, type FalaLocucao } from "../Video";
import { alvosDaGravacao, type Alvo } from "./base";
import { Confete, Estrelas, LogoCanal, Selo, type PropsCamada } from "./Efeitos";
import { ajudasDoReel, cliquesApos } from "./montagemReel";
import { Reel, type EdicaoReel, type SobreReel } from "./Reel";

// Reel 1 · Ambiente de atendimento (vertical, 9:16).
// Mesmo roteiro do vídeo horizontal, na voz da Raquel, com cortes mais curtos: de cada recurso
// aparecem o clique no menu e o resultado, que salta da tela.

const g = {
  "v1-a-caixa": eventosA as unknown as Gravacao,
  "v1-b-privacidade": eventosB as unknown as Gravacao,
  "v1-c-recursos": eventosC as unknown as Gravacao,
  "v1-d-protocolo": eventosD as unknown as Gravacao,
  "v1-e-concluir": eventosE as unknown as Gravacao,
  "v1-f-indicadores": eventosF as unknown as Gravacao,
};
const [A, B, C, D, E, F] = Object.values(g);
const loc = locucaoR1.falas as unknown as (FalaLocucao & { nivel?: number })[];
const TRANSICAO = 0.4;
/** Corte dentro da mesma tela: dissolve curto. */
const CORTE = 0.2;
const { durFala, palavra, trecho, sincronizar, fechar } = criarMontagem(loc, { url: "app.selloop.com.br/atendimento", transicao: TRANSICAO, pastaLocucao: "selloop/locucao/r1" });
const mA = (n: string) => marca(A, n);
const mD = (n: string) => marca(D, n);
const mF = (n: string) => marca(F, n);

// ── Câmera de cada gravação (px CSS da tela, 1600×900) ────────────────────────────────────────────
/** A lista de conversas encostada à esquerda da janela: sobra espaço à direita para o que salta. */
const LISTA = { cx: 362, cy: 418, zoom: 1.75 };
const alvos: Record<string, Alvo[]> = {
  // a ida para a conversa da Elaine (a transferência) entra depois de fechar a linha do tempo
  "v1-a-caixa": [
    { t: 0, ...LISTA },
    { t: mA("todos") + 0.3, cx: 400, cy: 525, zoom: 1.35 },
  ],
  "v1-b-privacidade": [{ t: 0, cx: 362, cy: 400, zoom: 1.75 }],
  // segue os cliques (menu, janelas) e vai para cada resultado logo depois do clique que o envia; o
  // resultado fica pequeno na janela (zoom até 1,25) para crescer bastante quando salta
  "v1-c-recursos": alvosDaGravacao(C, {
    zoomClique: 1.5,
    zoomRecorte: 1.25,
    folgaRecorte: 120,
    adiantaRecorte: 2.6,
    ignorar: (e) => e.tipo === "recorte" && e.nome.startsWith("menu"),
    // na primeira vez que o menu abre, a câmera mostra o menu inteiro
    extras: [{ t: cliquesApos(C, marca(C, "produtos"))[0].t - 0.2, cx: 553, cy: 560, zoom: 1.12 }],
  }),
  "v1-d-protocolo": alvosDaGravacao(D, { zoomClique: 1.4, zoomRecorte: 1.3, folgaRecorte: 110, adiantaRecorte: 2.6, ignorar: (e) => e.tipo === "recorte" && e.nome === "gerar-pdf" }),
  "v1-e-concluir": alvosDaGravacao(E, { zoomClique: 1.35, zoomRecorte: 1.3, folgaRecorte: 110, adiantaRecorte: 2.6 }),
  // os indicadores entram depois de fechar a linha do tempo: a câmera vai para cada parte na palavra dela
  "v1-f-indicadores": [],
};

// ── Linha do tempo ────────────────────────────────────────────────────────────────────────────────
const T: Trecho[] = [];
/** Índice do primeiro trecho de cada momento, pelo nome. */
const I: Record<string, number> = {};
const por = (nome: string, ...ts: Trecho[]) => {
  I[nome] = T.length;
  T.push(...ts);
};

// 1 · os canais chegam na mesma caixa; a empresa toda atende no mesmo número
por("canais", trecho("v1-a-caixa", 0.4, mA("todos") - 0.1, { fala: "v1-01", antes: 0.4, depois: 0.75, velMin: 0.4 }));
por("empresa", trecho("v1-a-caixa", mA("todos") - 0.1, mA("elaine") - 0.15, { fala: "v1-02", antes: 0.3, depois: 0.8, velMin: 0.4 }));
// 2 · o atendente vê só o que é dele; o administrador vê tudo
por("privacidade", trecho("v1-b-privacidade", 0.6, B.duracao - 0.2, { fala: "v1-03", antes: 0.35, depois: 1.0 }));
por("admin", trecho("v1-a-caixa", mA("elaine") - 0.15, A.duracao - 0.2, { fala: "v1-04", antes: 0.3, depois: 0.7, velMin: 0.4 }));

// 3 · os recursos da conversa: de cada um, o clique no menu e o resultado
/** `chegada`: quantos segundos antes da marca do recorte o resultado aparece na conversa (cena v1-c). */
type Recurso = { marca: string; fala: string; recorte: string; chegada: number };
const RECURSOS: Recurso[] = [
  { marca: "produtos", fala: "v1-05", recorte: "produto", chegada: 1.3 },
  { marca: "orcamento", fala: "v1-05b", recorte: "orcamento", chegada: 2.1 },
  { marca: "formulario", fala: "v1-05c", recorte: "formulario", chegada: 1.9 },
  { marca: "enquete", fala: "v1-05d", recorte: "enquete", chegada: 1.7 },
  { marca: "pagamento", fala: "v1-06", recorte: "cobranca", chegada: 1.85 },
  { marca: "notas", fala: "v1-06b", recorte: "nota", chegada: 1.45 },
  { marca: "agendar", fala: "v1-06c", recorte: "agendada", chegada: 1.65 },
];
/** O trecho do resultado começa um instante antes de ele chegar; ele salta pouco depois de chegar. */
const ANTES_DA_CHEGADA = 0.15;
const SALTA_APOS_CHEGAR = 0.4;
const chegaEm = (r: Recurso) => recorte(C, r.recorte).t - r.chegada;
/** O pagamento é confirmado na marca "pago": o cartão muda para "Pago" e salta. */
const PAGO = marca(C, "pago");
const ANTES_RECURSO = 0.12;
/** Entrada do corte do menu de cada recurso: o primeiro vem de outra tela, os outros são cortes. */
const entradaMenu = (r: Recurso) => (r.marca === "produtos" ? TRANSICAO : CORTE);
/** Quando a fala começa, contado do início do corte do menu. */
const falaNoMenu = (r: Recurso) => entradaMenu(r) * 0.5 + ANTES_RECURSO;
/** Quanto dura na tela o corte do menu de cada recurso (s). O primeiro mostra o menu inteiro. */
const durMenu = (r: Recurso) => (r.marca === "produtos" ? falaNoMenu(r) + palavra("v1-05", "O") - 0.05 : 0.8);
/** Respiro entre o fim de uma fala e o corte para o próximo recurso. */
const RESPIRO = 0.5;
const tPaga = palavra("v1-06", "você");
for (const r of RECURSOS) {
  const [clipe, item] = cliquesApos(C, marca(C, r.marca));
  const rec = recorte(C, r.recorte);
  const menu = { de: clipe.t - 0.25, ate: item.t + 0.35 };
  const dMenu = durMenu(r);
  // o resultado entra por cima do fim do menu (corte) e fica até a fala acabar, com um respiro
  const fimDaFala = falaNoMenu(r) + durFala(r.fala);
  const dResultado = Math.max(1.8, fimDaFala + RESPIRO - (dMenu - CORTE));
  por(r.marca, { ...trecho("v1-c-recursos", menu.de, menu.ate, { vel: (menu.ate - menu.de) / dMenu, entrada: entradaMenu(r) }), fala: r.fala, antes: ANTES_RECURSO });
  const de = chegaEm(r) - ANTES_DA_CHEGADA;
  if (r.marca === "pagamento") {
    // a cobrança com o QR e, quando a fala chega em "você vê quando foi paga", o "Pago"
    const corteParaPago = falaNoMenu(r) + tPaga - 0.25;
    por("cobranca", trecho("v1-c-recursos", de, rec.t + 0.05, { vel: (rec.t + 0.05 - de) / (corteParaPago + CORTE - (dMenu - CORTE)), entrada: CORTE }));
    por("paga", trecho("v1-c-recursos", PAGO - 0.2, PAGO + 1.4, { vel: 1.6 / (fimDaFala + RESPIRO + 0.25 - corteParaPago), entrada: CORTE }));
  } else {
    por(`${r.marca}-resultado`, trecho("v1-c-recursos", de, rec.t + 0.05, { vel: (rec.t + 0.05 - de) / dResultado, entrada: CORTE }));
  }
}

// 4 · protocolo: o protocolo do atendimento, o pedido do cliente, o PDF e o envio
const recProtocolo = recorte(D, "protocolo");
const recPedido = recorte(D, "pedido");
const recEnviado = recorte(D, "pdf-enviado");
const ANTES_PROTOCOLO = 0.3;
const F7 = (palavraDaFala: string) => TRANSICAO * 0.5 + ANTES_PROTOCOLO + palavra("v1-07", palavraDaFala);
/** O clique no botão "Gerar PDF". */
const CLIQUE_GERAR = cliquesApos(D, mD("gerar"))[0].t;
/** O pedido do cliente chega na marca "pedido"; o PDF enviado aparece ~1,9 s antes da marca do recorte. */
const PEDIDO_CHEGA = mD("pedido") + 0.1;
const PDF_CHEGA = recEnviado.t - 1.9;
por(
  "protocolo",
  { ...trecho("v1-d-protocolo", recProtocolo.t - 1.3, recProtocolo.t, { vel: 1.3 / (F7("Se") - 0.15), entrada: TRANSICAO }), fala: "v1-07", antes: ANTES_PROTOCOLO },
  trecho("v1-d-protocolo", PEDIDO_CHEGA - 0.2, recPedido.t + 0.05, { vel: (recPedido.t + 0.25 - PEDIDO_CHEGA) / (F7("você") - F7("Se") + CORTE), entrada: CORTE }),
  // o mouse chega no botão "Gerar PDF", clica, e a página sai dele
  trecho("v1-d-protocolo", CLIQUE_GERAR - 0.6, mD("pdf-pronto") + 1.4, { vel: (mD("pdf-pronto") + 2.0 - CLIQUE_GERAR) / (F7("envia") - 0.12 - F7("você") + CORTE), entrada: CORTE }),
  trecho("v1-d-protocolo", PDF_CHEGA - 0.2, recEnviado.t + 0.05, { vel: (recEnviado.t + 0.25 - PDF_CHEGA) / (durFala("v1-07") - palavra("v1-07", "envia") + 0.12 + 0.85 + CORTE), entrada: CORTE }),
);

// 5 · concluir com a pesquisa de satisfação; a avaliação chega na conversa
const [cliqueConcluir, cliqueFinalizar] = cliquesApos(E, marca(E, "concluir"));
const recPesquisa = recorte(E, "pesquisa");
/** A avaliação da cliente chega na conversa na marca "avaliacao". */
const AVALIACAO_CHEGA = marca(E, "avaliacao") + 0.1;
const ANTES_PESQUISA = 0.3;
const F8 = (p: string) => TRANSICAO * 0.5 + ANTES_PESQUISA + palavra("v1-08", p);
por(
  "pesquisa",
  { ...trecho("v1-e-concluir", cliqueConcluir.t - 0.4, cliqueConcluir.t + 1.7, { vel: 2.1 / (F8("vai") - 0.45), entrada: TRANSICAO }), fala: "v1-08", antes: ANTES_PESQUISA },
  // o clique em "Finalizar" e a pesquisa saindo sozinha; depois, a avaliação chegando
  trecho("v1-e-concluir", cliqueFinalizar.t - 0.3, recPesquisa.t, { vel: (recPesquisa.t - cliqueFinalizar.t + 0.3) / (F8("avaliação") - 0.1 - F8("vai") + 0.45 + CORTE), entrada: CORTE }),
  trecho("v1-e-concluir", AVALIACAO_CHEGA - 0.25, E.duracao - 0.1, { vel: (E.duracao + 0.15 - AVALIACAO_CHEGA) / (durFala("v1-08") - palavra("v1-08", "avaliação") + 0.1 + 1.0 + CORTE), entrada: CORTE }),
);

// 6 · indicadores: cada parte do painel entra na palavra em que é dita
/** Instante em que a página dos indicadores começa a rolar para a parte de baixo. */
const ROLAGEM = F.eventos.find((e) => e.tipo === "rolar")!.t;
por(
  "indicadores",
  ...sincronizar(
    "v1-f-indicadores",
    mF("abrir") - 0.2,
    [
      [mF("cartoes") + 0.5, palavra("v1-09", "volume") - 0.15],
      [ROLAGEM - 0.1, palavra("v1-09", "desempenho") - 0.6],
      [ROLAGEM + 1.5, palavra("v1-09", "desempenho") - 0.1],
      [mF("satisfacao") + 0.3, palavra("v1-09", "nota") - 0.1],
      [F.duracao - 0.1, durFala("v1-09") + 1.0],
    ],
    { fala: "v1-09", antes: 0.35, transicao: TRANSICAO },
  ),
);

// a frase já está na tela: sem legenda
por("fim", { bloco: { tipo: "encerramento", dur: 4.9, frase: "Atenda e venda sem trocar de tela." }, fala: "v1-10", antes: 0.5, legenda: false });

const M = fechar(T);
const { inicioBloco, fimBloco, noBloco, naGravacao, emFala } = M;
const { salto, naJanela } = ajudasDoReel({ gravacoes: g, alvos, blocos: M.blocos, inicioBloco, fimBloco, noBloco, naGravacao });

// câmera da caixa de entrada: fica na lista enquanto a fala é "vê as conversas de todas as equipes"
// e vai para a conversa (o aviso de transferência) quando chega em "acompanha cada transferência"
{
  const aviso = recorte(A, "transferida").caixa;
  alvos["v1-a-caixa"].push({ t: naGravacao(I.admin, emFala("v1-04") + palavra("v1-04", "acompanha") + 0.05), cx: aviso.x + aviso.w / 2, cy: aviso.y + aviso.h / 2 + 60, zoom: 1.5 });
}

// câmera dos indicadores: chega em cada parte do painel meio segundo antes da palavra dela
{
  const i = I.indicadores;
  const e9 = emFala("v1-09");
  /** Instante da gravação que está na tela quando a palavra é dita (menos a antecedência). */
  const quando = (p: string, bloco: number, antes = 0.5) => naGravacao(bloco, e9 + palavra("v1-09", p) - antes);
  alvos["v1-f-indicadores"] = [
    { t: 0, cx: 836, cy: 420, zoom: 0.84 },
    { t: quando("volume", i + 1), cx: 1160, cy: 430, zoom: 1.25 },
    { t: quando("tempo", i + 1), cx: 560, cy: 720, zoom: 1.2 },
    { t: ROLAGEM + 0.9, cx: 600, cy: 330, zoom: 1.2 },
    { t: quando("nota", i + 3, 0.6), cx: 470, cy: 740, zoom: 1.25 },
  ];
}

// ── Por cima da janela: títulos, recortes que saltam e camadas ────────────────────────────────────
const titulo = (texto: string, de: number, ate: number): SobreReel => ({ tipo: "titulo", texto, de, ate });
const camada = (de: number, ate: number, el: React.FC<PropsCamada>, o: { atras?: boolean; escurece?: boolean } = {}): SobreReel => ({ tipo: "camada", de, ate, el, ...o });
const e1 = emFala("v1-01");
const e4 = emFala("v1-04");
const sobre: SobreReel[] = [];
const sons: NonNullable<EdicaoReel["sons"]> = [];

// 1 · canais: a logo de cada canal sai da conversa em que ele aparece, na palavra em que é dito
{
  const fimCanais = fimBloco(I.canais);
  const naSelloop = e1 + palavra("v1-01", "Na");
  sobre.push(titulo("Seu cliente chama em *todo canal*", 0.15, naSelloop - 0.1), titulo("Tudo chega no *mesmo lugar*", naSelloop, fimCanais));
  const linhas = [
    ["whatsapp", "conversa-whatsapp", "WhatsApp"],
    ["instagram", "conversa-instagram", "Instagram"],
    ["messenger", "conversa-messenger", "Messenger"],
  ] as const;
  for (const [canal, nome, dito] of linhas) {
    const r = recorte(A, nome);
    const ret = naJanela("v1-a-caixa", r.caixa, r.t, (M.blocos[I.canais] as { velocidade?: number }).velocidade);
    const de = e1 + palavra("v1-01", dito) - 0.1;
    const origem = { x: ret.x + ret.w * 0.14, y: ret.y + ret.h * 0.6 };
    sobre.push(camada(de, fimCanais, (p) => <LogoCanal {...p} canal={canal} x={842} y={ret.y + ret.h / 2} tamanho={168} de={origem} />));
  }
  sobre.push(camada(naSelloop + 0.35, fimCanais, (p) => <Selo {...p} x={540} y={1262} texto="Uma caixa de entrada só" icone="caixa" tom="marca" tamanho={44} />));
}

// 2 · a empresa toda no mesmo número: conversas de equipes diferentes saltam da lista
{
  const i = I.empresa;
  const e2 = emFala("v1-02");
  sobre.push(titulo("A empresa toda no *mesmo número*", inicioBloco(i) + 0.05, fimBloco(i)));
  sobre.push(salto(i, "conversa-comercial", { de: e2 + palavra("v1-02", "atende") - 0.1, w: 800, cy: 800, rot: -2.5, raio: 14 }));
  sobre.push(salto(i, "conversa-financeiro", { de: e2 + palavra("v1-02", "número") - 0.1, w: 800, cy: 1105, rot: 2, raio: 14 }));
  sobre.push(camada(e2 + palavra("v1-02", "WhatsApp") - 0.15, fimBloco(i), (p) => <Selo {...p} x={540} y={1286} texto="(48) 3209-4100" icone="conversa" tom="marca" tamanho={46} />));
}

// 3 · privacidade do atendente
{
  const i = I.privacidade;
  sobre.push(titulo("Cada atendente vê *só o que é seu*", inicioBloco(i) + 0.1, fimBloco(i)));
  // as três primeiras conversas da aba "Meus" do Diogo
  sobre.push(salto(i, "meus", { de: emFala("v1-03") + palavra("v1-03", "vê") - 0.25, parte: { x: 0, y: 0, w: 1, h: 0.752 }, w: 690, cy: 925, raio: 14, rot: -1.5 }));
  sobre.push(camada(emFala("v1-03") + palavra("v1-03", "só"), fimBloco(i), (p) => <Selo {...p} x={540} y={1296} texto="Só as conversas do Diogo" icone="cadeado" tom="escuro" tamanho={40} />));
}

// 4 · controle do administrador e a transferência entre equipes
{
  const i = I.admin;
  const acompanha = e4 + palavra("v1-04", "acompanha");
  sobre.push(titulo("O administrador tem *controle total*", inicioBloco(i) + 0.1, acompanha - 0.1), titulo("*Transferência* sem repetir nada", acompanha, fimBloco(i)));
  // ao lado da lista (aba "Todos"), as equipes da empresa
  const ve = e4 + palavra("v1-04", "vê") - 0.1;
  const EQUIPES = [
    ["Comercial", "#2849db", 700, -3],
    ["Financeiro", "#10b981", 850, 2.5],
    ["Suporte", "#f59e0b", 1000, -2],
  ] as const;
  EQUIPES.forEach(([nome, corEquipe, y, giro], k) => sobre.push(camada(ve + 0.3 + k * 0.22, acompanha - 0.1, (p) => <Selo {...p} x={796} y={y} texto={nome} ponto={corEquipe} tom="claro" tamanho={46} giro={giro} />)));
  sobre.push(camada(ve, acompanha - 0.1, (p) => <Selo {...p} x={540} y={1250} texto="Vê todas as equipes" icone="olho" tom="marca" tamanho={44} />));
  sobre.push(salto(i, "transferida", { de: acompanha + 0.15, w: 820, cy: 900, raio: 999, rot: -1.5 }));
  sobre.push(camada(acompanha + 0.55, fimBloco(i), (p) => <Selo {...p} x={320} y={1080} texto="Comercial" tom="claro" tamanho={40} />));
  sobre.push(camada(acompanha + 0.75, fimBloco(i), (p) => <Selo {...p} x={760} y={1080} texto="Financeiro" icone="transferir" tom="verde" tamanho={40} />));
}

// 5 · recursos da conversa
{
  const TITULOS: Record<string, string> = {
    produtos: "Catálogo com *foto e preço*",
    orcamento: "*Orçamento* no próprio WhatsApp",
    formulario: "*Formulários* preenchidos",
    enquete: "*Enquetes* com voto na hora",
    pagamento: "*Cobrança por Pix* na conversa",
    notas: "*Nota fiscal* direto do sistema",
    agendar: "Mensagem *agendada*",
  };
  RECURSOS.forEach((r, k) => {
    const iMenu = I[r.marca];
    const proximo = RECURSOS[k + 1];
    const fimRecurso = proximo ? inicioBloco(I[proximo.marca]) : fimBloco(r.marca === "pagamento" ? I.paga : I[`${r.marca}-resultado`]);
    const comeco = inicioBloco(iMenu) + 0.05;
    if (r.marca === "produtos") {
      // primeiro o menu com tudo que cabe na conversa, depois o catálogo
      const catalogo = inicioBloco(I["produtos-resultado"]);
      sobre.push(titulo("Tudo *à mão* na conversa", comeco, catalogo - 0.05), titulo(TITULOS.produtos, catalogo, fimRecurso));
      // do menu aberto salta a parte com os recursos (de "Produtos" a "Agendar mensagem")
      const parte = recortesC.recortes["menu-parte"].caixa;
      sobre.push(salto(iMenu, "menu", { atraso: 0.15, caixa: parte, imagem: { src: "selloop/telas/v1-c-recursos/recortes/menu-parte.png", proporcao: parte.h / parte.w }, w: 520, cy: 945, rot: -1.5 }));
    } else {
      sobre.push(titulo(TITULOS[r.marca], comeco, fimRecurso));
    }
    if (r.marca === "pagamento") {
      sobre.push(salto(I.cobranca, "cobranca", { de: noBloco(I.cobranca, chegaEm(r) + SALTA_APOS_CHEGAR), maxA: 760, raio: 16, rot: -2 }));
      const pago = noBloco(I.paga, PAGO + 0.5);
      sobre.push(salto(I.paga, "cobranca-paga", { de: pago, maxA: 700, raio: 16, rot: 1.5 }));
      sobre.push(camada(pago + 0.25, pago + 1.9, (p) => <Confete {...p} x={540} y={1010} />));
      sons.push({ em: pago + 0.2, arquivo: "sino.wav", volume: 0.45 });
    } else {
      const iRes = I[`${r.marca}-resultado`];
      // do orçamento saltam os itens e o total (a parte de baixo do cartão), que é o que se lê
      const tamanho =
        { produto: { maxA: 760 }, orcamento: { parte: { x: 0, y: 0.395, w: 1, h: 0.555 }, maxL: 800, maxA: 770 }, formulario: { maxL: 860 }, enquete: { maxL: 860 }, nota: { w: 600 }, agendada: { maxL: 940 } }[r.recorte] ?? {};
      sobre.push(salto(iRes, r.recorte, { de: noBloco(iRes, chegaEm(r) + SALTA_APOS_CHEGAR), raio: 16, rot: k % 2 ? 1.6 : -2, ...tamanho }));
    }
  });
}

// 6 · protocolo e PDF da conversa
{
  const i = I.protocolo;
  const cortes = [inicioBloco(i), inicioBloco(i + 1), inicioBloco(i + 2), inicioBloco(i + 3), fimBloco(i + 3)];
  sobre.push(
    titulo("Todo atendimento tem *protocolo*", cortes[0] + 0.1, cortes[1]),
    titulo("O cliente pediu o *histórico*?", cortes[1] + 0.05, cortes[2]),
    titulo("*PDF* da conversa completa", cortes[2] + 0.05, cortes[3]),
    titulo("Enviado *na hora*", cortes[3] + 0.05, cortes[4]),
  );
  // o número do protocolo, a situação e o contato (as duas primeiras colunas da linha)
  sobre.push(salto(i, "protocolo", { de: cortes[0] + 0.45, parte: { x: 0, y: 0, w: 0.6, h: 1 }, w: 900, raio: 10, rot: -1.5 }));
  sobre.push(salto(i + 1, "pedido", { de: noBloco(i + 1, PEDIDO_CHEGA + 0.45), maxL: 940, raio: 16, rot: 1.5 }));
  // a página do PDF sai do botão "Gerar PDF"
  sobre.push(salto(i + 2, "gerar-pdf", { de: noBloco(i + 2, mD("pdf-pronto")) + 0.1, ate: cortes[3] + 0.5, w: 580, cy: 950, rot: -3, imagem: { src: "selloop/telas/v1-d-protocolo/pagina-1.png", proporcao: 1.4142 } }));
  sobre.push(salto(i + 3, "pdf-enviado", { de: noBloco(i + 3, PDF_CHEGA + 0.45), w: 620, raio: 16, rot: -2 }));
}

// 7 · pesquisa de satisfação e a avaliação
{
  const i = I.pesquisa;
  const avaliacao = inicioBloco(i + 2);
  sobre.push(titulo("*Pesquisa de satisfação* automática", inicioBloco(i) + 0.1, avaliacao), titulo("A *avaliação* aparece ali mesmo", avaliacao + 0.05, fimBloco(i + 2)));
  sobre.push(salto(i, "concluir", { de: noBloco(i, cliqueConcluir.t + 0.75), maxL: 900, raio: 16, rot: -1.5 }));
  sobre.push(salto(i + 1, "pesquisa", { de: noBloco(i + 1, cliqueFinalizar.t + 0.7), maxL: 940, raio: 16, rot: 1.5 }));
  const nota = noBloco(i + 2, AVALIACAO_CHEGA + 0.5);
  sobre.push(salto(i + 2, "avaliacao", { de: nota, w: 900, cy: 1100, raio: 999, rot: -1.5 }));
  sobre.push(camada(nota + 0.15, fimBloco(i + 2), (p) => <Estrelas {...p} x={540} y={860} tamanho={132} />, { escurece: true }));
  sobre.push(camada(nota + 0.5, nota + 2.1, (p) => <Confete {...p} x={540} y={900} />));
  sons.push({ em: nota + 0.35, arquivo: "sino.wav", volume: 0.45 });
}

// 8 · indicadores do gestor: o painel se monta em mosaico na frente da janela, uma parte por palavra
{
  const i = I.indicadores;
  // trechos: abre o painel · contadores · rolagem · equipes · nota média
  const [abre, volume, , equipes, nota] = [i, i + 1, i + 2, i + 3, i + 4];
  const e9 = emFala("v1-09");
  const dito = (p: string) => e9 + palavra("v1-09", p) - 0.12;
  const fimInd = fimBloco(nota);
  /** Depois da rolagem: os cartões de baixo já estão no lugar em que foram marcados. */
  const aposRolagem = (t: number) => Math.max(t, inicioBloco(equipes) + 0.05);
  const ESQ = 282;
  const DIR = 798;
  sobre.push(titulo("*Indicadores* para o gestor", inicioBloco(abre) + 0.1, fimInd));
  // de cada cartão sai a parte com o número (o resto é espaço em branco)
  sobre.push(salto(volume, "novos", { de: dito("volume"), ate: fimInd, w: 470, cx: ESQ, cy: 700, raio: 12, rot: -2 }));
  sobre.push(salto(volume, "espera", { de: dito("tempo"), ate: fimInd, parte: { x: 0.02, y: 0.08, w: 0.44, h: 0.68 }, w: 470, cx: DIR, cy: 700, raio: 16, rot: 1.5 }));
  sobre.push(salto(equipes, "equipe-campea", { de: aposRolagem(dito("desempenho")), ate: fimInd, parte: { x: 0.01, y: 0.06, w: 0.37, h: 0.88 }, w: 470, cx: ESQ, cy: 925, raio: 16, rot: 1.5 }));
  sobre.push(salto(equipes, "atendente-campeao", { de: aposRolagem(dito("cada")), ate: fimInd, parte: { x: 0.01, y: 0.06, w: 0.37, h: 0.88 }, w: 470, cx: DIR, cy: 925, raio: 16, rot: -1.5 }));
  sobre.push(salto(nota, "nota-media", { de: dito("nota"), ate: fimInd, w: 988, cy: 1180, raio: 16, rot: -0.8 }));
}

export const edicaoR1: EdicaoReel = {
  ...M.edicao,
  sobre,
  alvos,
  sons,
  assunto: "Atendimento",
  icone: "conversa",
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.2, volumeFala: 0.07 },
};
export const DURACAO_R1 = Math.max(duracaoTotal(edicaoR1), emFala("v1-10") + durFala("v1-10") + 1.5);

export const SelloopReelAtendimento: React.FC = () => <Reel edicao={edicaoR1} gravacoes={g} locucao={loc} />;
