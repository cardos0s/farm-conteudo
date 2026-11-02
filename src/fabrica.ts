import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  escolherPautas,
  escreverCarrossel,
  escreverNewsletter,
  escreverPeca,
  materialDaPauta,
  revisar,
  type Encomenda,
  type Pauta,
  type Rascunho,
  type RascunhoCarrossel,
} from "./agentes";
import { coletar, textoDoArtigo } from "./coleta";
import { HORARIOS, proximoHorario, type FormatoPost } from "./core/agenda";
import { MIN_SLIDES, normalizarCarrossel } from "./core/carrossel";
import { atualizarPeca, gravarChave, lerChave, lerPeca, listarPecas, novoId, salvarPeca, type Peca } from "./core/estado";
import { normalizarRoteiro } from "./core/roteiro";
import type { Vertical } from "./core/vertical";
import { montarHtml } from "./newsletter/html";
import { armazenamentoConfigurado, enviarParaPublico } from "./publicacao/armazenamento";
import { publicarNewsletter } from "./publicacao/beehiiv";
import { credenciaisInstagram, publicarCarrossel, publicarReel, uploadDiretoDeVideo } from "./publicacao/instagram";
import {
  alertar,
  botaoCancelar,
  botoesAprovacao,
  enviarAlbum,
  enviarDocumento,
  enviarMensagem,
  enviarVideo,
  telegramConfigurado,
} from "./publicacao/telegram";
import { renderizarCarrossel, renderizarReel } from "./video/render";
import { buscarVertical } from "../verticais";

const DIR_VIDEOS = "saida/videos";
const DIR_CARROSSEIS = "saida/carrosseis";
const HORA = 3600_000;
const DIA = 24 * HORA;
/** Peça que ninguém aprovou em 20 h expira: a produção do dia seguinte já traz pautas mais novas. */
const EXPIRA_EM = 20 * HORA;

const FORMATOS: FormatoPost[] = ["reel", "carrossel"];
const ICONE: Record<Peca["tipo"], string> = { reel: "🎬", carrossel: "🖼", newsletter: "📰" };
const NOME: Record<FormatoPost, [string, string]> = { reel: ["Reel", "Reels"], carrossel: ["carrossel", "carrosséis"] };
const ehPost = (p: Peca): p is Peca & { tipo: FormatoPost } => p.tipo === "reel" || p.tipo === "carrossel";
const quantos = (n: number, f: FormatoPost) => `${n} ${NOME[f][n === 1 ? 0 : 1]}`;
const horaCurta = (d: Date | string) => new Date(d).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

// ── Produção diária de Reels e carrosséis ──────────────────────────

/** Escreve e revisa; se o revisor reprovar, reescreve uma vez com as correções. Reprovou de novo: descarta e avisa. */
async function escreverRevisado<T extends Rascunho | RascunhoCarrossel>(
  v: Vertical,
  pauta: Pauta,
  material: string,
  escrever: (correcoes?: string[]) => Promise<T>,
): Promise<T | null> {
  let rascunho = await escrever();
  let revisao = await revisar(v, material, rascunho);
  if (!revisao.aprovado) {
    rascunho = await escrever(revisao.problemas);
    revisao = await revisar(v, material, rascunho);
  }
  if (revisao.aprovado) return rascunho;
  await enviarMensagem(
    `🟡 ${v.app.nome}: a pauta de ${NOME[pauta.formato][0]} "${pauta.angulo}" foi descartada porque não passou na revisão.\n\n${revisao.problemas.map((p) => `• ${p}`).join("\n")}`,
  );
  return null;
}

function fontesDaPauta(pauta: Pauta) {
  return [...pauta.noticias.map((n) => ({ nome: n.fonte, url: n.url })), ...pauta.dados.map((d) => ({ nome: d.fonte, url: d.url }))];
}

async function produzirPeca(v: Vertical, pauta: Pauta): Promise<Peca | null> {
  const textos: Record<string, string> = {};
  for (const n of pauta.noticias) textos[n.url] = await textoDoArtigo(n.url);
  const material = materialDaPauta(pauta, textos);
  const id = novoId(v.id, pauta.formato);
  const base = {
    id,
    vertical: v.id,
    criadaEm: new Date().toISOString(),
    status: "aguardando" as const,
    fontes: fontesDaPauta(pauta),
  };
  const comHashtags = (legenda: string) => `${legenda.trim()}\n\n${v.hashtags.join(" ")}`;

  if (pauta.formato === "reel") {
    const rascunho = await escreverRevisado(v, pauta, material, (c) => escreverPeca(v, pauta, material, c));
    if (!rascunho) return null;
    const roteiro = normalizarRoteiro(rascunho.roteiro);
    await mkdir(DIR_VIDEOS, { recursive: true });
    const videoPath = path.join(DIR_VIDEOS, `${id}.mp4`);
    await renderizarReel({ marca: v.marca, roteiro }, videoPath);
    return salvarPeca({
      ...base,
      tipo: "reel",
      titulo: rascunho.titulo,
      roteiro,
      legenda: comHashtags(rascunho.legenda),
      blocoNewsletter: rascunho.blocoNewsletter,
      videoPath,
    });
  }

  const rascunho = await escreverRevisado(v, pauta, material, (c) => escreverCarrossel(v, pauta, material, c));
  if (!rascunho) return null;
  const carrossel = normalizarCarrossel(rascunho.carrossel);
  if (carrossel.slides.length < MIN_SLIDES) throw new Error(`carrossel veio com só ${carrossel.slides.length} slide(s)`);
  const imagens = await renderizarCarrossel(v.marca, carrossel, path.join(DIR_CARROSSEIS, id), id);
  return salvarPeca({
    ...base,
    tipo: "carrossel",
    titulo: rascunho.titulo,
    slides: carrossel.slides,
    legenda: comHashtags(rascunho.legenda),
    blocoNewsletter: rascunho.blocoNewsletter,
    imagens,
  });
}

/** Coloca o post no próximo horário livre do formato dele, na conta do app. */
export async function agendar(p: Peca): Promise<Date> {
  if (!ehPost(p)) throw new Error(`Só Reels e carrosséis entram na agenda (veio ${p.tipo})`);
  const ocupados = await listarPecas((x) => x.id !== p.id && x.vertical === p.vertical && x.tipo === p.tipo && x.status === "aprovada" && !!x.agendadaPara);
  const quando = proximoHorario(new Date(), ocupados.map((x) => new Date(x.agendadaPara!)), HORARIOS[p.tipo]);
  await atualizarPeca(p.id, { status: "aprovada", agendadaPara: quando.toISOString() });
  return quando;
}

async function enviarParaAprovacao(p: Peca, v: Vertical) {
  let cabecalho = `${ICONE[p.tipo]} ${v.app.nome} · ${p.titulo}`;
  let teclado: object = botoesAprovacao(p.id);
  if (v.volume.aprovacao === "automatica") {
    cabecalho += `\n🗓 Já agendado para ${horaCurta(await agendar(p))}`;
    teclado = botaoCancelar(p.id);
  }
  const fontes = p.fontes.map((f) => `${f.nome}${f.url ? ` (${f.url})` : ""}`).join("\n");
  const texto = `${cabecalho}\n\n${p.legenda}\n\nFontes:\n${fontes}`;
  if (!telegramConfigurado()) {
    console.log(texto);
    return;
  }
  if (p.tipo === "reel") {
    await enviarVideo(p.videoPath!, texto, teclado);
  } else {
    await enviarAlbum(p.imagens!, cabecalho);
    await enviarMensagem(texto, { reply_markup: teclado });
  }
}

/** Marca como expiradas as peças que ninguém aprovou a tempo. */
async function expirarPendentes(): Promise<number> {
  const velhas = await listarPecas((p) => ehPost(p) && p.status === "aguardando" && Date.now() - Date.parse(p.criadaEm) > EXPIRA_EM);
  for (const p of velhas) await atualizarPeca(p.id, { status: "expirada" });
  return velhas.length;
}

/**
 * Quantas peças de cada formato produzir hoje: a meta do dia menos o que já está na fila
 * (esperando aprovação ou agendado e ainda não publicado). Assim, se a fila atrasar, a fábrica
 * produz menos no dia seguinte em vez de empurrar a agenda para cada vez mais longe.
 */
async function encomendaDoDia(v: Vertical): Promise<{ encomenda: Encomenda; fila: Encomenda }> {
  const pendentes = await listarPecas((p) => p.vertical === v.id && ehPost(p) && (p.status === "aguardando" || p.status === "aprovada"));
  const fila: Encomenda = { reel: 0, carrossel: 0 };
  for (const p of pendentes) fila[p.tipo as FormatoPost]++;
  return {
    fila,
    encomenda: {
      reel: Math.max(0, v.volume.reelsPorDia - fila.reel),
      carrossel: Math.max(0, v.volume.carrosseisPorDia - fila.carrossel),
    },
  };
}

async function produzirVertical(v: Vertical, recentes: string[]): Promise<{ resumo: string; falhas: string[] }> {
  const falhas: string[] = [];
  try {
    const { encomenda, fila } = await encomendaDoDia(v);
    const naFila = FORMATOS.filter((f) => fila[f]).map((f) => quantos(fila[f], f)).join(" e ");
    if (!encomenda.reel && !encomenda.carrossel) {
      return { resumo: `${v.app.nome}: fila cheia (${naFila} esperando horário), nada novo hoje`, falhas };
    }
    const coleta = await coletar(v);
    falhas.push(...coleta.falhas.map((f) => `${v.app.nome} · ${f}`));
    const pautas = await escolherPautas(v, coleta, recentes, encomenda);

    const feitas: Encomenda = { reel: 0, carrossel: 0 };
    for (const pauta of pautas) {
      try {
        const peca = await produzirPeca(v, pauta);
        if (!peca) continue;
        await enviarParaAprovacao(peca, v);
        feitas[pauta.formato]++;
        const usadas = await lerChave<string[]>(`usadas-${v.id}`, []);
        await gravarChave(`usadas-${v.id}`, [...usadas, ...pauta.noticias.map((n) => n.url)].slice(-1000));
      } catch (e) {
        await alertar(e, `${v.app.nome} · ${NOME[pauta.formato][0]} "${pauta.angulo}"`);
      }
    }
    let resumo = `${v.app.nome}: ${FORMATOS.map((f) => `${feitas[f]}/${encomenda[f]} ${NOME[f][1]}`).join(" e ")}`;
    if (naFila) resumo += ` (já havia ${naFila} na fila)`;
    return { resumo, falhas };
  } catch (e) {
    await alertar(e, `${v.app.nome} · produção diária`);
    return { resumo: `${v.app.nome}: falhou`, falhas };
  }
}

/**
 * Coleta, escreve, revisa, renderiza e manda para aprovação.
 * As verticais rodam em paralelo (o render continua um por vez) e uma com erro não derruba as outras.
 */
export async function rodarDiario(verticais: Vertical[]) {
  const expiradas = await expirarPendentes();
  const recentes = await listarPecas((p) => ehPost(p) && Date.now() - Date.parse(p.criadaEm) < 14 * DIA);
  const resultados = await Promise.all(
    verticais.map((v) => produzirVertical(v, recentes.filter((p) => p.vertical === v.id).map((p) => p.titulo))),
  );

  let msg = `☀️ Produção do dia pronta.\n${resultados.map((r) => r.resumo).join("\n")}`;
  if (verticais.some((v) => v.volume.aprovacao === "manual")) {
    msg += `\n\nAprove um a um pelos botões ou mande /aprovar_tudo para aprovar tudo de uma vez.`;
  }
  if (expiradas) msg += `\n\n⌛ ${expiradas} peça(s) de ontem expiraram sem aprovação.`;
  const falhas = resultados.flatMap((r) => r.falhas);
  if (falhas.length) msg += `\n\nFontes com problema (o resto seguiu normalmente):\n${falhas.map((f) => `• ${f}`).join("\n")}`;
  await enviarMensagem(msg);
}

// ── Newsletter semanal ─────────────────────────────────────────────

export async function rodarNewsletter(verticais: Vertical[], forcar = false) {
  const hoje = new Date().getDay();
  for (const v of verticais) {
    if (!forcar && v.volume.diaNewsletter !== hoje) continue;
    try {
      const semana = await listarPecas(
        (p) =>
          p.vertical === v.id &&
          ehPost(p) &&
          (p.status === "publicada" || p.status === "aprovada") &&
          Date.now() - Date.parse(p.criadaEm) < 7 * DIA &&
          !!p.blocoNewsletter,
      );
      if (!semana.length) {
        await enviarMensagem(`📭 ${v.newsletter.nome} (${v.app.nome}): nenhuma peça aprovada nesta semana, a edição foi pulada.`);
        continue;
      }
      const edicao = await escreverNewsletter(
        v,
        semana.map((p) => ({ titulo: p.titulo, texto: p.blocoNewsletter!, fonteUrl: p.fontes.find((f) => f.url)?.url ?? "" })),
      );
      const html = montarHtml(v, edicao);
      const peca = await salvarPeca({
        id: novoId(v.id, "newsletter"),
        tipo: "newsletter",
        vertical: v.id,
        criadaEm: new Date().toISOString(),
        status: "aguardando",
        titulo: edicao.assunto,
        assunto: edicao.assunto,
        blocoNewsletter: edicao.subtitulo,
        html,
        fontes: semana.flatMap((p) => p.fontes),
      });
      if (telegramConfigurado()) {
        await enviarDocumento(
          `${peca.id}.html`,
          html,
          `📰 ${v.newsletter.nome} (${v.app.nome})\nAssunto: ${edicao.assunto}\n${edicao.subtitulo}\n\nAbra o arquivo para ler a edição. Aprovar envia para a lista pelo Beehiiv.`,
          botoesAprovacao(peca.id),
        );
      } else console.log(html);
    } catch (e) {
      await alertar(e, `${v.newsletter.nome} (${v.app.nome})`);
    }
  }
}

// ── Aprovação e publicação ─────────────────────────────────────────

export async function aprovar(id: string): Promise<string> {
  const p = await lerPeca(id);
  if (!p) return "Peça não encontrada.";
  if (p.status !== "aguardando") return `Essa peça já está como "${p.status}".`;
  const v = buscarVertical(p.vertical);

  if (p.tipo === "newsletter") {
    try {
      const r = await publicarNewsletter(v, { assunto: p.assunto!, subtitulo: p.blocoNewsletter ?? "", html: p.html! });
      await atualizarPeca(id, { status: "publicada", publicadaEm: new Date().toISOString(), idExterno: r.id, permalink: r.url });
      return `✅ Newsletter enviada pelo Beehiiv${r.url ? `: ${r.url}` : "."}`;
    } catch (e) {
      await atualizarPeca(id, { status: "erro", erro: (e as Error).message });
      return `⚠️ Não consegui enviar pelo Beehiiv (${(e as Error).message}). O HTML está no arquivo acima: cole no editor do Beehiiv e envie.`;
    }
  }

  const quando = await agendar(p);
  const aviso = credenciaisInstagram(v) ? "" : "\n(Instagram ainda não configurado: no horário eu aviso para você postar manualmente.)";
  return `✅ Aprovado. O ${NOME[p.tipo as FormatoPost][0]} vai para o Instagram do ${v.app.nome} em ${horaCurta(quando)}.${aviso}`;
}

/** Aprova de uma vez todos os Reels e carrosséis esperando (newsletters continuam uma a uma). */
export async function aprovarTudo(): Promise<string> {
  const pendentes = await listarPecas((p) => ehPost(p) && p.status === "aguardando");
  if (!pendentes.length) return "Nada esperando aprovação.";
  const porApp = new Map<string, Encomenda>();
  let primeiro: Date | null = null;
  let ultimo: Date | null = null;
  for (const p of pendentes) {
    const quando = await agendar(p);
    if (!primeiro || quando < primeiro) primeiro = quando;
    if (!ultimo || quando > ultimo) ultimo = quando;
    const nome = buscarVertical(p.vertical).app.nome;
    const c = porApp.get(nome) ?? { reel: 0, carrossel: 0 };
    c[p.tipo as FormatoPost]++;
    porApp.set(nome, c);
  }
  const linhas = [...porApp].map(([nome, c]) => `• ${nome}: ${FORMATOS.filter((f) => c[f]).map((f) => quantos(c[f], f)).join(" e ")}`);
  return `✅ ${pendentes.length} peça(s) aprovadas.\n${linhas.join("\n")}\n\nAgenda: de ${horaCurta(primeiro!)} até ${horaCurta(ultimo!)}. Para tirar uma da agenda, use o ❌ da própria peça.`;
}

/** Rejeita uma peça esperando aprovação, ou cancela um post já agendado que ainda não saiu. */
export async function rejeitar(id: string): Promise<string> {
  const p = await lerPeca(id);
  if (!p) return "Peça não encontrada.";
  if (p.status === "aguardando") {
    await atualizarPeca(id, { status: "rejeitada" });
    return "❌ Rejeitado. Não vai ao ar.";
  }
  if (p.status === "aprovada") {
    await atualizarPeca(id, { status: "rejeitada", agendadaPara: undefined });
    return `❌ Cancelado. O horário de ${p.agendadaPara ? horaCurta(p.agendadaPara) : "publicação"} ficou livre.`;
  }
  return `Essa peça já está como "${p.status}".`;
}

const MAX_TENTATIVAS = 3;

async function publicarNoInstagram(p: Peca, v: Vertical) {
  if (p.tipo === "carrossel") {
    const urls: string[] = [];
    for (const img of p.imagens ?? []) urls.push(await enviarParaPublico(img, p.vertical));
    return publicarCarrossel(v, urls, p.legenda!);
  }
  if (uploadDiretoDeVideo()) return publicarReel(v, { arquivo: p.videoPath! }, p.legenda!);
  return publicarReel(v, { url: await enviarParaPublico(p.videoPath!, p.vertical) }, p.legenda!);
}

/** O que falta para publicar esta peça sem ajuda (null se nada falta). Não adianta tentar de novo enquanto faltar. */
function faltaParaPublicar(p: Peca, v: Vertical): string | null {
  if (!credenciaisInstagram(v)) return "o Instagram não está configurado";
  const precisaDeLink = p.tipo === "carrossel" || !uploadDiretoDeVideo();
  if (precisaDeLink && !armazenamentoConfigurado()) {
    return p.tipo === "carrossel"
      ? "carrossel precisa de armazenamento público (a API do Instagram só aceita imagens por link), e ele não está configurado"
      : "o armazenamento público não está configurado";
  }
  return null;
}

/** Publica os Reels e carrosséis aprovados cujo horário já chegou. */
export async function publicarVencidas(): Promise<number> {
  const agora = Date.now();
  const vencidas = await listarPecas((p) => ehPost(p) && p.status === "aprovada" && !!p.agendadaPara && Date.parse(p.agendadaPara) <= agora);
  let publicadas = 0;
  for (const p of vencidas) {
    const v = buscarVertical(p.vertical);
    const nome = NOME[p.tipo as FormatoPost][0];
    const falta = faltaParaPublicar(p, v);
    if (falta) {
      await atualizarPeca(p.id, { status: "erro", erro: falta });
      const onde = p.tipo === "carrossel" ? `as imagens estão em ${path.dirname(p.imagens?.[0] ?? DIR_CARROSSEIS)}` : `ele está em ${p.videoPath}`;
      await enviarMensagem(`📲 Hora de postar o ${nome} "${p.titulo}" no Instagram do ${v.app.nome}. Como ${falta}, publique manualmente: ${onde}.`);
      continue;
    }
    try {
      const r = await publicarNoInstagram(p, v);
      await atualizarPeca(p.id, { status: "publicada", publicadaEm: new Date().toISOString(), idExterno: r.id, permalink: r.permalink });
      await enviarMensagem(`📣 ${ICONE[p.tipo]} No ar no Instagram do ${v.app.nome}: ${p.titulo}${r.permalink ? `\n${r.permalink}` : ""}`);
      publicadas++;
    } catch (e) {
      const tentativas = (p.tentativas ?? 0) + 1;
      if (tentativas >= MAX_TENTATIVAS) {
        await atualizarPeca(p.id, { status: "erro", tentativas, erro: (e as Error).message });
        await alertar(e, `publicação do ${nome} "${p.titulo}" (${v.app.nome}) após ${tentativas} tentativas`);
      } else {
        // Tenta de novo em 30 minutos.
        await atualizarPeca(p.id, { tentativas, agendadaPara: new Date(agora + 30 * 60_000).toISOString() });
      }
    }
  }
  return publicadas;
}

/** Resumo dos últimos 7 dias por app e formato, mais os próximos posts da agenda. */
export async function statusTexto(): Promise<string> {
  const pecas = await listarPecas((p) => ehPost(p) && (Date.now() - Date.parse(p.criadaEm) < 7 * DIA || p.status === "aprovada"));
  if (!pecas.length) return "Nada produzido nos últimos 7 dias.";

  const linhas: string[] = ["📊 Últimos 7 dias"];
  const apps = [...new Set(pecas.map((p) => p.vertical))];
  for (const id of apps) {
    linhas.push("", buscarVertical(id).app.nome);
    for (const f of FORMATOS) {
      const doFormato = pecas.filter((p) => p.vertical === id && p.tipo === f);
      if (!doFormato.length) continue;
      const n = (s: Peca["status"]) => doFormato.filter((p) => p.status === s).length;
      const partes = [`${n("publicada")} no ar`, `${n("aprovada")} agendados`, `${n("aguardando")} esperando ✅`];
      if (n("erro")) partes.push(`${n("erro")} com erro`);
      const rotulo = NOME[f][1].charAt(0).toUpperCase() + NOME[f][1].slice(1);
      linhas.push(`${ICONE[f]} ${rotulo}: ${partes.join(" · ")}`);
    }
  }

  const proximos = pecas
    .filter((p) => p.status === "aprovada" && p.agendadaPara)
    .sort((a, b) => a.agendadaPara!.localeCompare(b.agendadaPara!))
    .slice(0, 10);
  if (proximos.length) {
    linhas.push("", "🗓 Próximos posts");
    for (const p of proximos) linhas.push(`${horaCurta(p.agendadaPara!)} · ${ICONE[p.tipo]} ${buscarVertical(p.vertical).app.nome} · ${p.titulo}`);
  }
  return linhas.join("\n");
}
