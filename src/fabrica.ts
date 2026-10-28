import { mkdir } from "node:fs/promises";
import path from "node:path";
import { escolherPautas, escreverNewsletter, escreverPeca, materialDaPauta, revisar, type Pauta, type Rascunho } from "./agentes";
import { coletar, textoDoArtigo } from "./coleta";
import { proximoHorario } from "./core/agenda";
import { atualizarPeca, gravarChave, lerChave, lerPeca, listarPecas, novoId, salvarPeca, type Peca } from "./core/estado";
import { normalizarRoteiro } from "./core/roteiro";
import type { Vertical } from "./core/vertical";
import { montarHtml } from "./newsletter/html";
import { enviarParaPublico } from "./publicacao/armazenamento";
import { publicarNewsletter } from "./publicacao/beehiiv";
import { credenciaisInstagram, publicarReel } from "./publicacao/instagram";
import { alertar, botoesAprovacao, enviarDocumento, enviarMensagem, enviarVideo, telegramConfigurado } from "./publicacao/telegram";
import { renderizarReel } from "./video/render";
import { buscarVertical } from "../verticais";

const DIR_VIDEOS = "saida/videos";
const DIA = 86400_000;

// ── Produção diária de Reels ───────────────────────────────────────

async function produzirPeca(v: Vertical, pauta: Pauta): Promise<Peca | null> {
  const textos: Record<string, string> = {};
  for (const n of pauta.noticias) textos[n.url] = await textoDoArtigo(n.url);
  const material = materialDaPauta(pauta, textos);

  let rascunho: Rascunho = await escreverPeca(v, pauta, material);
  let revisao = await revisar(v, material, rascunho);
  if (!revisao.aprovado) {
    rascunho = await escreverPeca(v, pauta, material, revisao.problemas);
    revisao = await revisar(v, material, rascunho);
  }
  if (!revisao.aprovado) {
    await enviarMensagem(
      `🟡 ${v.app.nome}: a pauta "${pauta.angulo}" foi descartada porque não passou na revisão.\n\n${revisao.problemas.map((p) => `• ${p}`).join("\n")}`,
    );
    return null;
  }

  const id = novoId(v.id, "reel");
  const roteiro = normalizarRoteiro(rascunho.roteiro);
  await mkdir(DIR_VIDEOS, { recursive: true });
  const videoPath = path.join(DIR_VIDEOS, `${id}.mp4`);
  await renderizarReel({ marca: v.marca, roteiro }, videoPath);

  const legenda = `${rascunho.legenda.trim()}\n\n${v.hashtags.join(" ")}`;
  const fontes = [
    ...pauta.noticias.map((n) => ({ nome: n.fonte, url: n.url })),
    ...pauta.dados.map((d) => ({ nome: d.fonte, url: d.url })),
  ];
  return salvarPeca({
    id,
    tipo: "reel",
    vertical: v.id,
    criadaEm: new Date().toISOString(),
    status: "aguardando",
    titulo: rascunho.titulo,
    fontes,
    roteiro,
    legenda,
    blocoNewsletter: rascunho.blocoNewsletter,
    videoPath,
  });
}

async function pedirAprovacao(p: Peca, v: Vertical) {
  const fontes = p.fontes.map((f) => `${f.nome}${f.url ? ` (${f.url})` : ""}`).join("\n");
  const texto = `🎬 ${v.app.nome} · ${p.titulo}\n\n${p.legenda}\n\nFontes:\n${fontes}`;
  if (!telegramConfigurado()) {
    console.log(texto);
    return;
  }
  await enviarVideo(p.videoPath!, texto, botoesAprovacao(p.id));
}

/** Coleta, escreve, revisa, renderiza e manda para aprovação. Uma vertical com erro não derruba as outras. */
export async function rodarDiario(verticais: Vertical[]) {
  const resumo: string[] = [];
  const falhas: string[] = [];
  const recentes = (await listarPecas((p) => Date.now() - Date.parse(p.criadaEm) < 14 * DIA)).map((p) => `${p.vertical}: ${p.titulo}`);

  for (const v of verticais) {
    try {
      const coleta = await coletar(v);
      falhas.push(...coleta.falhas.map((f) => `${v.app.nome} · ${f}`));
      const pautas = await escolherPautas(
        v,
        coleta,
        recentes.filter((r) => r.startsWith(`${v.id}:`)).map((r) => r.slice(v.id.length + 2)),
      );
      let feitas = 0;
      for (const pauta of pautas) {
        try {
          const peca = await produzirPeca(v, pauta);
          if (!peca) continue;
          await pedirAprovacao(peca, v);
          feitas++;
          const usadas = await lerChave<string[]>(`usadas-${v.id}`, []);
          await gravarChave(`usadas-${v.id}`, [...usadas, ...pauta.noticias.map((n) => n.url)].slice(-500));
        } catch (e) {
          await alertar(e, `${v.app.nome} · pauta "${pauta.angulo}"`);
        }
      }
      resumo.push(`${v.app.nome}: ${feitas} vídeo(s)`);
    } catch (e) {
      await alertar(e, `${v.app.nome} · produção diária`);
      resumo.push(`${v.app.nome}: falhou`);
    }
  }

  let msg = `☀️ Produção do dia pronta para aprovar.\n${resumo.join("\n")}`;
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
          p.tipo === "reel" &&
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

  const agendadas = await listarPecas((x) => x.vertical === p.vertical && x.status === "aprovada" && !!x.agendadaPara);
  const quando = proximoHorario(new Date(), agendadas.map((x) => new Date(x.agendadaPara!)));
  await atualizarPeca(id, { status: "aprovada", agendadaPara: quando.toISOString() });
  const hora = quando.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  const aviso = credenciaisInstagram(v) ? "" : "\n(Instagram ainda não configurado: no horário eu aviso para você postar manualmente.)";
  return `✅ Aprovado. Vai para o Instagram do ${v.app.nome} em ${hora}.${aviso}`;
}

export async function rejeitar(id: string): Promise<string> {
  const p = await lerPeca(id);
  if (!p) return "Peça não encontrada.";
  if (p.status !== "aguardando") return `Essa peça já está como "${p.status}".`;
  await atualizarPeca(id, { status: "rejeitada" });
  return "❌ Rejeitado. Não vai ao ar.";
}

const MAX_TENTATIVAS = 3;

/** Publica os Reels aprovados cujo horário já chegou. */
export async function publicarVencidas(): Promise<number> {
  const agora = Date.now();
  const vencidas = await listarPecas(
    (p) => p.tipo === "reel" && p.status === "aprovada" && !!p.agendadaPara && Date.parse(p.agendadaPara) <= agora,
  );
  let publicadas = 0;
  for (const p of vencidas) {
    const v = buscarVertical(p.vertical);
    if (!credenciaisInstagram(v)) {
      await atualizarPeca(p.id, { status: "erro", erro: "Instagram não configurado" });
      await enviarMensagem(`📲 Hora de postar o vídeo "${p.titulo}" no Instagram do ${v.app.nome}. Como o Instagram não está configurado, publique manualmente: ele está em ${p.videoPath}.`);
      continue;
    }
    try {
      const url = await enviarParaPublico(p.videoPath!, p.vertical);
      const r = await publicarReel(v, url, p.legenda!);
      await atualizarPeca(p.id, { status: "publicada", publicadaEm: new Date().toISOString(), idExterno: r.id, permalink: r.permalink });
      await enviarMensagem(`📣 No ar no Instagram do ${v.app.nome}: ${p.titulo}${r.permalink ? `\n${r.permalink}` : ""}`);
      publicadas++;
    } catch (e) {
      const tentativas = (p.tentativas ?? 0) + 1;
      if (tentativas >= MAX_TENTATIVAS) {
        await atualizarPeca(p.id, { status: "erro", tentativas, erro: (e as Error).message });
        await alertar(e, `publicação de "${p.titulo}" (${v.app.nome}) após ${tentativas} tentativas`);
      } else {
        // Tenta de novo em 30 minutos.
        await atualizarPeca(p.id, { tentativas, agendadaPara: new Date(agora + 30 * 60_000).toISOString() });
      }
    }
  }
  return publicadas;
}

export async function statusTexto(): Promise<string> {
  const pecas = await listarPecas((p) => Date.now() - Date.parse(p.criadaEm) < 7 * DIA);
  if (!pecas.length) return "Nada produzido nos últimos 7 dias.";
  const icone: Record<Peca["status"], string> = { aguardando: "⏳", aprovada: "🗓", rejeitada: "❌", publicada: "✅", erro: "⚠️" };
  return pecas
    .map((p) => {
      const quando = p.status === "aprovada" && p.agendadaPara ? ` · ${new Date(p.agendadaPara).toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}` : "";
      return `${icone[p.status]} ${buscarVertical(p.vertical).app.nome} · ${p.titulo}${quando}`;
    })
    .join("\n");
}
