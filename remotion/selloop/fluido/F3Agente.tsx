import React from "react";
import eventosA from "../../../public/selloop/filme/f3-a-conversa/eventos.json";
import eventosB from "../../../public/selloop/filme/f3-b-canais/eventos.json";
import eventosE from "../../../public/selloop/filme/f3-e-agente/eventos.json";
import locucaoR3 from "../../../public/selloop/locucao/r3/locucao.json";
import { marca, type Gravacao } from "../gravacao";
import type { Canal } from "../marca";
import type { Alvo } from "../reel/base";
import { LogoCanal, Relogio24, Selo, type PropsCamada } from "../reel/Efeitos";
import { cliquesApos } from "../reel/montagemReel";
import { CenaNoiteReel, CenaRespostaReel } from "../reel/NoiteReel";
import type { SobreReel } from "../reel/Reel";
import type { FalaLocucao } from "../Video";
import { ajudasFluidas, viagemApos } from "./ajudas";
import type { TrilhaDeCliques } from "./Caminho";
import { Fluido, type EdicaoFluida } from "./Fluido";
import { criarRoteiro } from "./roteiro";

// Reel 3 · Agente inteligente na conversa, 24 h, em tomada contínua (vertical, 9:16).
// 23h47: o cliente manda um áudio (celular) → na plataforma, a Lia entende e responde em áudio → o
// áudio dela toca no celular → ela atende nos três canais → numa tomada só: manda o orçamento, marca a
// visita (Agenda), cria a oportunidade (Vendas) e transfere com o resumo → como se configura a Lia.
// As telas são filmadas quadro a quadro e tocam sempre em 1x; a navegação entre elas aparece.

const PASTA = "selloop/filme";
const CA = "f3-a-conversa";
const CB = "f3-b-canais";
const CE = "f3-e-agente";
const g = {
  [CA]: eventosA as unknown as Gravacao,
  [CB]: eventosB as unknown as Gravacao,
  [CE]: eventosE as unknown as Gravacao,
};
const [A, B, E] = [g[CA], g[CB], g[CE]];
const loc = locucaoR3.falas as unknown as (FalaLocucao & { nivel?: number })[];
const R = criarRoteiro({ filmes: g, locucao: loc, transicao: 0.4 });
const { durFala, palavra, dito, fimFala } = R;
const mA = (n: string) => marca(A, n);
const mB = (n: string) => marca(B, n);
const mE = (n: string) => marca(E, n);
const cA = (n: string) => cliquesApos(A, mA(n));
/** Instante do vídeo em que um instante do filme aparece (as duas tomadas da conversa não se cruzam). */
const SA = (t: number) => R.saida(CA, t);
const SB = (t: number) => R.saida(CB, t);
const SE = (t: number) => R.saida(CE, t);
/** O que cada momento precisa lembrar da linha do tempo para desenhar por cima dela depois. */
const M: Record<string, number> = {};

// ════ Linha do tempo ═════════════════════════════════════════════════════════════════════════════

// 1 · 23h47 no celular do cliente: a narração, o cliente grava e manda o áudio, o áudio toca
const ANTES_NOITE = 0.45;
const NOITE = {
  casa: ANTES_NOITE + palavra("v3-01", "O") - 0.1,
  grava: ANTES_NOITE + palavra("v3-01", "cliente") - 0.2,
  envio: ANTES_NOITE + palavra("v3-01", "áudio") - 0.15,
  toca: ANTES_NOITE + durFala("v3-01") + 0.4,
  duracaoAudio: durFala("fabio-01"),
};
R.cena("noite", NOITE.toca + NOITE.duracaoAudio + 0.55, { entrada: 0 });
R.fala("v3-01", { em: ANTES_NOITE });
// o áudio do cliente toca com legenda (muita gente assiste sem som)
R.fala("fabio-01", { em: NOITE.toca });

// 2 · na plataforma: a Lia está atendendo, entende o áudio (transcrição) e responde em áudio
const [cAbrir] = cA("abrir");
const [cTranscricao] = cA("transcricao");
R.abrir(CA, cAbrir.t - 0.3);
M.lia = R.parte;
R.anda(cAbrir.t + 0.1);
R.fala("v3-02", { em: SA(cAbrir.t) - 0.15 });
// o cursor vai ao selo "Lia atendendo" em "Lia"
R.chega(viagemApos(A, mA("lia")), dito("v3-02", "Lia") + 0.1);
M.selo = R.agora - 0.2;
R.seguraAte(dito("v3-02", "Ela") - 0.5);
M.seloSai = R.agora;
// "Ela entende o áudio": a transcrição abre
R.clica(cTranscricao, dito("v3-02", "entende") + 0.1);
R.anda(mA("resposta") - 0.02);
M.transcrito = SA(mA("transcrito")) + 0.35;
// "e responde em áudio": a resposta da Lia chega e a transcrição dela abre
R.seguraAte(dito("v3-02", "responde", 1) - 0.25);
R.anda(mA("respondido") + 0.45);
M.respondido = R.agora;
R.seguraAte(Math.max(M.respondido + 1.7, fimFala("v3-02") + 0.6));
M.liaFim = R.agora;

// 3 · a resposta em áudio da Lia toca no celular do cliente
const RESPOSTA = {
  grava: 0.45,
  envio: 1.55,
  toca: 1.85,
  duracaoAudio: durFala("lia-01"),
  resposta: 1.85 + durFala("lia-01") + 0.3,
  duracaoAudioCliente: durFala("fabio-01"),
  // o que ela resolve, no instante do áudio em que fala
  pontos: [
    { em: palavra("lia-01", "sim"), texto: "Entrega em Joinville" },
    { em: palavra("lia-01", "quinta"), texto: "40 fardos na quinta" },
    { em: palavra("lia-01", "orçamento"), texto: "Oferece o orçamento" },
  ],
};
R.cena("resposta", RESPOSTA.resposta + 0.95);
R.fala("lia-01", { em: M.liaFim + RESPOSTA.toca });
M.respostaFim = R.agora;

// 4 · 24 horas nos três canais: cada conversa abre na palavra do seu canal
const cCanais = cliquesApos(B, 0).slice(0, 3);
R.abrir(CB, mB("lista") - 0.2);
M.canais = R.parte;
R.fala("v3-03", { em: R.agora - 0.15 });
(["WhatsApp", "Instagram", "Messenger"] as const).forEach((canal, k) => R.clica(cCanais[k], dito("v3-03", canal) - 0.12, 0.45));
R.anda(mB("fim") + 0.3);
R.seguraAte(fimFala("v3-03") + 0.75);
M.canaisFim = R.agora;

// 5 · numa tomada só: o orçamento, a visita na Agenda, a oportunidade em Vendas e a transferência
const [cAgenda, cDia] = cA("agenda");
const [cVendas] = cA("funil");
const [cAtendimento, cConversa] = cA("voltar");
R.abrir(CA, mA("orcamento") - 0.1);
M.acoes = R.parte;
R.fala("v3-04", { em: R.agora - 0.15 });
// "ela manda o orçamento": o cliente monta e devolve
R.anda(mA("orcamento-pedido"), { descanso: 0.35 });
R.anda(mA("orcamento-chegou") + 0.35);
M.orcamento = R.agora;
// com o orçamento na frente, a conversa segue por baixo: a Lia combina a visita com o cliente
R.anda(mA("agenda") - 0.05, { descanso: 0.25 });
R.seguraAte(Math.max(M.orcamento + 1.3, fimFala("v3-04") + 0.2));
M.orcamentoFim = R.agora;
// "marca a visita": a mensagem em que ela combina; "na agenda do vendedor": a barra lateral leva à Agenda
R.fala("v3-05", { em: R.agora + 0.05 });
R.segura(0.85);
M.combinadaSai = R.agora;
R.clica(cAgenda, dito("v3-05", "agenda") + 0.25);
R.anda(cDia.t + 0.1);
R.anda(mA("painel") + 0.45);
M.visita = R.agora;
R.anda(mA("funil") - 0.02);
R.seguraAte(Math.max(M.visita + 1.3, fimFala("v3-05") + 0.3));
M.visitaFim = R.agora;
// "cria a oportunidade no CRM": a barra lateral leva a Vendas, com o card que a Lia criou
R.fala("v3-06", { em: R.agora + 0.05 });
R.clica(cVendas, dito("v3-06", "cria") + 0.3);
R.anda(mA("card") + 0.3);
M.card = R.agora;
R.anda(mA("voltar") - 0.02);
R.seguraAte(Math.max(M.card + 1.3, fimFala("v3-06") + 0.35));
M.cardFim = R.agora;
// "e, quando o assunto pede uma pessoa": de volta à conversa, o cliente pede prazo no boleto;
// "transfere para a equipe certa, com o resumo da conversa": a transferência e a nota interna
R.fala("v3-07", { em: R.agora + 0.7 });
R.anda(mA("transferir") - 0.02);
R.anda(mA("transferida") + 0.3, { descanso: 0.3 });
M.transferida = R.agora;
R.seguraAte(Math.max(M.transferida + 0.5, dito("v3-07", "transfere") + 0.25));
R.anda(mA("fim") - 0.05);
M.resumo = Math.max(SA(mA("fim") - 0.1), dito("v3-07", "resumo") - 0.25);
R.seguraAte(Math.max(M.resumo + 1.6, fimFala("v3-07") + 0.75));
M.acoesFim = R.agora;

// 6 · a configuração da Lia: o caminho até ela (Configurações › Atendimento › Agente Hub) e, nela, o
// conhecimento, as habilidades, o tom e a voz
const [cConfig] = cliquesApos(E, mE("configuracoes"));
const [cMenu] = cliquesApos(E, mE("atendimento"));
const [cAba] = cliquesApos(E, mE("agente-hub"));
const [cLia] = cliquesApos(E, mE("abrir"));
const [cConhecimento] = cliquesApos(E, mE("conhecimento"));
const [cHabilidades] = cliquesApos(E, mE("habilidades"));
const [cPerfil] = cliquesApos(E, mE("tom"));
R.abrir(CE, cConfig.t - 0.35);
M.treino = R.parte;
// sem narração, o caminho: a engrenagem, Atendimento e a aba Agente Hub
R.anda(cAba.t + 0.1);
// "Você treina a Lia": a fala começa no clique da aba, e o clique na Lia cai no nome dela
R.fala("v3-08", { em: SE(cAba.t) - 0.05 });
R.clica(cLia, dito("v3-08", "Lia") + 0.05);
// "com o que a sua empresa sabe": a base de conhecimento
R.clica(cConhecimento, dito("v3-08", "sua") + 0.05);
R.anda(mE("habilidades") - 0.02);
M.conhecimento = R.agora;
// "escolhe as habilidades"; "o tom": o perfil; "e a voz": a página desce até a resposta em áudio
R.clica(cHabilidades, dito("v3-08", "habilidades") + 0.25);
R.clica(cPerfil, dito("v3-08", "tom") - 0.05);
R.anda(mE("voz") - 0.02);
R.chega(viagemApos(E, mE("voz")), dito("v3-08", "voz") + 0.35);
M.voz = R.agora - 0.2;
R.anda(mE("fim"));
R.seguraAte(Math.max(M.voz + 1.8, fimFala("v3-08") + 0.9));
M.treinoFim = R.agora;

// a frase já está na tela: sem legenda
R.encerramento("Atendimento inteligente, 24 horas por dia.", { fala: "v3-09" });

const roteiro = R.pronto();
const inicioDe = (i: number) => roteiro.partes[i].inicio;

// ════ Câmera (no tempo do vídeo; px CSS da tela, 1600×900) ═══════════════════════════════════════
const alvos: Record<number, Alvo[]> = {};
/** A barra lateral e o começo da página: é por ela que se troca de tela. */
const ESQUERDA = { cx: 500, cy: 420, zoom: 0.87 };
/** A conversa aberta (o painel da direita). */
const CONVERSA = { cx: 1000, cy: 500, zoom: 0.87 };
alvos[M.lia] = [
  // a lista, onde se clica na conversa do Fábio
  { t: 0, cx: 560, cy: 330, zoom: 1.12 },
  // o cabeçalho da conversa, com o selo "Lia atendendo"
  { t: SA(cAbrir.t) + 0.2, cx: 1065, cy: 330, zoom: 1.12 },
  // o áudio do cliente e a transcrição, à esquerda da conversa
  { t: SA(cTranscricao.t) - 0.6, cx: 890, cy: 330, zoom: 1.12 },
  // a resposta da Lia, à direita (a câmera só sai da transcrição depois que ela salta)
  { t: SA(mA("resposta")) + 0.7, cx: 1130, cy: 400, zoom: 1.12 },
];
alvos[M.canais] = [
  // a lista com uma conversa de cada canal; nos cliques, a lista e a conversa lado a lado
  { t: 0, cx: 362, cy: 470, zoom: 1.6 },
  { t: SB(cCanais[0].t) - 0.2, cx: 730, cy: 450, zoom: 0.8 },
];
alvos[M.acoes] = [
  // a conversa: o orçamento chega e a visita é combinada
  { t: 0, ...CONVERSA },
  // a barra lateral leva à Agenda; o calendário abre; no dia 12, o painel do dia, à direita
  { t: SA(cAgenda.t) - 0.75, ...ESQUERDA },
  { t: SA(cDia.t) + 0.1, cx: 1130, cy: 520, zoom: 1.05 },
  // a barra lateral leva a Vendas: a coluna "Novo lead", com o card da Lia
  { t: SA(cVendas.t) - 0.75, ...ESQUERDA },
  { t: SA(cVendas.t) + 0.2, cx: 416, cy: 380, zoom: 1.2 },
  // de volta: a barra lateral, a lista e a conversa
  { t: SA(cAtendimento.t) - 0.6, ...ESQUERDA },
  { t: SA(cConversa.t) + 0.15, ...CONVERSA, cy: 560 },
];
alvos[M.treino] = [
  // a engrenagem das configurações, no alto à direita
  { t: 0, cx: 1025, cy: 400, zoom: 0.87 },
  // as configurações: o menu à esquerda e as abas, até o Agente Hub
  { t: SE(cConfig.t) + 0.15, cx: 620, cy: 400, zoom: 0.87 },
  // dentro da Lia: o menu dela e o conteúdo
  { t: SE(cLia.t) + 0.15, cx: 880, cy: 470, zoom: 0.95 },
];

const { salto } = ajudasFluidas({ partes: roteiro.partes, filmes: g, alvos, pastaFilme: PASTA });

// ════ Por cima da janela: títulos, caminhos, recortes que saltam e camadas ═══════════════════════
const sobre: SobreReel[] = [];
const caminhos: TrilhaDeCliques[] = [];
const titulo = (texto: string, de: number, ate: number): SobreReel => ({ tipo: "titulo", texto, de, ate });
const camada = (de: number, ate: number, el: React.FC<PropsCamada>, o: { atras?: boolean; escurece?: boolean } = {}): SobreReel => ({ tipo: "camada", de, ate, el, ...o });

// 2 · a Lia atendendo; a transcrição do áudio; a resposta em áudio
{
  const i = M.lia;
  const fim = M.liaFim;
  const ela = dito("v3-02", "Ela") - 0.1;
  // o título e o caminho entram depois que o relógio da cena da noite saiu do alto do quadro
  sobre.push(titulo("Quem responde é a *Lia*", inicioDe(i) + 0.4, ela), titulo("Entende o áudio e *responde em áudio*", ela + 0.05, fim));
  caminhos.push({
    de: inicioDe(i) + 0.4,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Fábio Martins", em: SA(cAbrir.t) },
      { rotulo: "Ver transcrição", em: SA(cTranscricao.t) },
    ],
  });
  sobre.push(salto(i, "lia-atendendo", { de: Math.max(M.selo, dito("v3-02", "Lia") + 0.15), ate: M.seloSai, w: 760, cy: 900, raio: 999, rot: -2 }));
  sobre.push(camada(dito("v3-02", "agente") + 0.1, M.seloSai, (q) => <Selo {...q} x={540} y={1110} texto="Agente inteligente da Nova Rota" icone="robo" tom="marca" tamanho={40} />));
  // o áudio do cliente, transcrito, fica em cima sem apagar a janela: por baixo, a resposta da Lia chega
  sobre.push(salto(i, "audio-fabio", { de: M.transcrito, ate: fim, w: 950, cy: 760, raio: 16, rot: -1.5, escurece: false }));
  sobre.push(salto(i, "audio-lia", { de: M.respondido, ate: fim, w: 950, cy: 1085, raio: 16, rot: 1.5 }));
}

// 3 · no celular
sobre.push(titulo("A *resposta em áudio* da Lia", M.liaFim + 0.2, M.respostaFim - 0.1));

// 4 · canais: a resposta da Lia em cada canal, com a logo dele. As respostas se empilham de cima para
// baixo sem apagar a janela: cada conversa da lista ainda está à vista quando o cursor clica nela
{
  const i = M.canais;
  const fim = M.canaisFim;
  sobre.push(titulo("Atende *24 horas por dia*", inicioDe(i) + 0.15, fim));
  sobre.push(camada(dito("v3-03", "24") - 0.3, dito("v3-03", "WhatsApp") - 0.25, (q) => <Relogio24 {...q} x={540} y={935} />, { escurece: true }));
  const LINHAS: { canal: Canal; nome: string; recorte: string; cy: number; rot: number }[] = [
    { canal: "whatsapp", nome: "WhatsApp", recorte: "resposta-whatsapp", cy: 715, rot: -1.2 },
    { canal: "instagram", nome: "Instagram", recorte: "resposta-instagram", cy: 868, rot: 1.2 },
    { canal: "messenger", nome: "Messenger", recorte: "resposta-messenger", cy: 1021, rot: -1.2 },
  ];
  caminhos.push({ de: dito("v3-03", "WhatsApp") - 0.6, ate: fim - 0.05, passos: LINHAS.map((l, k) => ({ rotulo: l.nome, em: SB(cCanais[k].t) })) });
  LINHAS.forEach((l, k) => {
    const de = SB(cCanais[k].t) + 0.45;
    sobre.push(salto(i, l.recorte, { de, ate: fim, w: 880, cx: 590, cy: l.cy, raio: 16, rot: l.rot, faiscas: false, escurece: false }));
    sobre.push(camada(de - 0.25, fim, (q) => <LogoCanal {...q} canal={l.canal} x={120} y={l.cy - 52} tamanho={104} />));
  });
}

// 5 · as habilidades em ação, com o caminho pela barra lateral
{
  const i = M.acoes;
  // o orçamento: os itens e o total que o cliente montou
  sobre.push(titulo("Manda o *orçamento*", inicioDe(i) + 0.15, M.orcamentoFim));
  sobre.push(salto(i, "orcamento", { de: M.orcamento, ate: M.orcamentoFim, parte: { x: 0, y: 0.42, w: 1, h: 0.5 }, w: 900, raio: 14, rot: -1.5 }));
  // a visita: a mensagem em que ela combina; depois, o compromisso na agenda do vendedor
  sobre.push(titulo("Marca a *visita* na agenda", M.orcamentoFim, M.visitaFim));
  caminhos.push({
    de: M.orcamentoFim,
    ate: M.visitaFim - 0.05,
    passos: [
      { rotulo: "Agenda", em: SA(cAgenda.t) },
      { rotulo: "Dia 12", em: SA(cDia.t) },
    ],
  });
  sobre.push(salto(i, "visita-combinada", { de: M.orcamentoFim + 0.05, ate: M.combinadaSai, maxL: 940, cy: 950, raio: 16, rot: 1.5 }));
  sobre.push(salto(i, "visita", { de: M.visita, ate: M.visitaFim, w: 880, cy: 880, raio: 16, rot: -1.5 }));
  sobre.push(camada(M.visita + 0.25, M.visitaFim, (q) => <Selo {...q} x={540} y={1110} texto="Quinta, 10h · com o Diogo" icone="agenda" tom="marca" tamanho={42} giro={1.5} />));
  // a oportunidade no funil de vendas
  sobre.push(titulo("Cria a *oportunidade* no CRM", M.visitaFim, M.cardFim));
  caminhos.push({ de: M.visitaFim, ate: M.cardFim - 0.05, passos: [{ rotulo: "Vendas", em: SA(cVendas.t) }] });
  sobre.push(salto(i, "card", { de: M.card, ate: M.cardFim, w: 880, cy: 900, raio: 16, rot: -1.5 }));
  sobre.push(camada(M.card + 0.25, M.cardFim, (q) => <Selo {...q} x={540} y={1215} texto="Criada pela Lia" icone="robo" tom="marca" tamanho={42} giro={1.5} />));
  // a transferência com o resumo
  sobre.push(titulo("Transfere com o *resumo da conversa*", M.cardFim, M.acoesFim));
  caminhos.push({
    de: M.cardFim,
    ate: M.acoesFim - 0.05,
    passos: [
      { rotulo: "Atendimento", em: SA(cAtendimento.t) },
      { rotulo: "Fábio Martins", em: SA(cConversa.t) },
    ],
  });
  sobre.push(salto(i, "transferida", { de: Math.max(M.transferida, dito("v3-07", "transfere") + 0.1), ate: M.acoesFim, w: 820, cy: 790, raio: 999, rot: -1.5 }));
  sobre.push(salto(i, "resumo", { de: M.resumo, ate: M.acoesFim, w: 940, cy: 1040, raio: 14, rot: 1.2 }));
}

// 6 · a configuração: o conhecimento, as habilidades (em nuvem), o tom e a voz
{
  const i = M.treino;
  const fim = M.treinoFim;
  const escolhe = dito("v3-08", "escolhe") - 0.1;
  sobre.push(titulo("Você *treina* a Lia", inicioDe(i) + 0.15, escolhe), titulo("Habilidades, tom e *voz*", escolhe + 0.05, fim));
  // primeiro o caminho até a Lia; depois, o que se ajusta nela
  caminhos.push({
    de: inicioDe(i) + 0.15,
    ate: SE(cConhecimento.t) - 0.15,
    passos: [
      { rotulo: "Configurações", em: SE(cConfig.t) },
      { rotulo: "Atendimento", em: SE(cMenu.t) },
      { rotulo: "Agente Hub", em: SE(cAba.t) },
      { rotulo: "Lia", em: SE(cLia.t) },
    ],
  });
  caminhos.push({
    de: SE(cConhecimento.t) - 0.1,
    ate: fim - 0.05,
    passos: [
      { rotulo: "Conhecimento", em: SE(cConhecimento.t) },
      { rotulo: "Habilidades", em: SE(cHabilidades.t) },
      { rotulo: "Perfil", em: SE(cPerfil.t) },
    ],
  });
  // os documentos e o site da base de conhecimento
  sobre.push(salto(i, "conhecimento", { de: M.conhecimento - 0.3, ate: dito("v3-08", "habilidades") - 0.25, parte: { x: 0, y: 0, w: 0.6, h: 1 }, w: 880, raio: 14, rot: -1.5 }));
  // as habilidades, com os nomes que têm na plataforma: em nuvem no alto da janela, acima do menu
  const HABILIDADES = [
    ["Agendar Reunião", "agenda", 300, 622],
    ["Criar Card no CRM", "funil", 762, 642],
    ["Envio de Formulários", "formulario", 284, 706],
    ["Transferir Atendimento", "transferir", 772, 726],
    ["Consultar Integrações", "documento", 300, 790],
    ["Follow-up", "repetir", 742, 810],
  ] as const;
  const nuvem = SE(cHabilidades.t) + 0.35;
  HABILIDADES.forEach(([nome, icone, x, y], k) =>
    sobre.push(camada(nuvem + k * 0.09, fim, (q) => <Selo {...q} x={x} y={y} texto={nome} icone={icone} tom={k % 3 === 1 ? "marca" : "claro"} tamanho={33} giro={k % 2 ? 2 : -2} />, { escurece: true })),
  );
  sobre.push(camada(Math.max(SE(cPerfil.t) + 0.25, dito("v3-08", "tom") - 0.1), fim, (q) => <Selo {...q} x={600} y={1010} texto="Tom consultivo e acolhedor" icone="conversa" tom="verde" tamanho={40} />, { escurece: true }));
  sobre.push(salto(i, "voz", { de: M.voz, ate: fim, parte: { x: 0, y: 0, w: 0.66, h: 0.74 }, w: 900, cy: 1215, raio: 14, rot: -1 }));
}

/** O endereço da janela acompanha a navegação. */
const ENDERECOS: [number, string][] = [
  [0, "/atendimento"],
  [SA(cAgenda.t) + 0.1, "/agenda"],
  [SA(cVendas.t) + 0.1, "/pipeline"],
  [SA(cAtendimento.t) + 0.1, "/atendimento"],
  [SE(cConfig.t) + 0.1, "/configuracoes"],
  [SE(cMenu.t) + 0.1, "/configuracoes/canais"],
  [SE(cAba.t) + 0.1, "/configuracoes/agente-hub"],
];
const endereco = (o: number) => `app.selloop.com.br${[...ENDERECOS].reverse().find(([t]) => o >= t)?.[1] ?? ENDERECOS[0][1]}`;

export const edicaoF3: EdicaoFluida = {
  ...roteiro,
  sobre,
  caminhos,
  alvos,
  url: endereco,
  pastaFilme: PASTA,
  pastaLocucao: "selloop/locucao/r3",
  assunto: "Agente de IA",
  icone: "robo",
  trilha: { arquivo: "selloop/sons/trilha.wav", volume: 0.18, volumeFala: 0.06 },
};
export const DURACAO_F3 = roteiro.duracao;

const cenas = {
  noite: () => <CenaNoiteReel {...NOITE} />,
  resposta: () => <CenaRespostaReel {...RESPOSTA} />,
};

export const SelloopReelAgenteFluido: React.FC = () => <Fluido edicao={edicaoF3} filmes={g} locucao={loc} cenas={cenas} />;
