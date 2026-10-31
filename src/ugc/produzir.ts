import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pedirAprovacao } from "../fabrica";
import { novoId, salvarPeca, type Peca } from "../core/estado";
import type { Vertical } from "../core/vertical";
import { enviarMensagem } from "../publicacao/telegram";
import { renderizarUgc } from "../video/render";
import { escreverUgc, revisarUgc, type RascunhoUgc } from "./agentes";
import { FOLGA_SEG, palavrasDoAlinhamento, palavrasEstimadas, type Bloco, type BlocoRender, type Estilo, type PropsUgc } from "./formato";
import { duracaoMidia, existe, FFMPEG, hash, normalizarAudio, rodar } from "./midia";
import { carregarEstilo, carregarPersona, type Persona } from "./persona";
import * as provedores from "./provedores";

export const DIR_UGC = "saida/ugc";
const DIR_SFX = "ativos/sfx";

export const ROTULO_IA = "Personagem criada com IA";

interface Trabalho {
  id: string;
  vertical: Vertical["id"];
  briefing: string;
  rascunho: RascunhoUgc;
}

export interface OpcoesUgc {
  briefing?: string;
  /** Para depois do roteiro aprovado pelo revisor, sem gastar com voz e vídeo. */
  soRoteiro?: boolean;
  /** Retoma um trabalho salvo em saida/ugc/<id> (o que já foi gerado não é pago de novo). */
  continuar?: string;
}

/** Gera o arquivo só se ele ainda não existir. */
async function cache(arquivo: string, gerar: () => Promise<unknown>): Promise<string> {
  if (!(await existe(arquivo))) {
    await gerar();
    if (!(await existe(arquivo))) throw new Error(`A geração não criou ${arquivo}`);
  }
  return arquivo;
}

const segundosDoClipe = (d: number) => Math.min(15, Math.max(3, Math.ceil(d)));

function promptQuadro(persona: Persona | null, estilo: Estilo, b: Bloco): string {
  const camera = `Luz: ${estilo.camera.luz}. Ambiente: ${estilo.camera.ambiente}.`;
  if (b.visual.tipo === "persona") {
    return `Quadro vertical 9:16 de um vídeo UGC gravado com celular, fotorrealista. A mesma pessoa das imagens de referência, idêntica no rosto, cabelo e corpo: ${persona!.aparencia}
Enquadramento: ${b.visual.enquadramento}. Cena: ${b.visual.cena}. ${camera}
${b.visual.falandoParaCamera ? "Olhando para a lente, boca levemente aberta no meio de uma frase." : ""}
Sem texto, legenda, logotipo ou marca d'água na imagem.`;
  }
  if (b.visual.tipo === "broll") {
    return `Quadro vertical 9:16, fotorrealista, como gravado com celular. ${b.visual.cena}. ${camera} Sem pessoas em destaque, sem texto, logotipo ou marca d'água.`;
  }
  throw new Error("Bloco de tela não gera quadro");
}

function promptVideo(estilo: Estilo, b: Bloco): string {
  if (b.visual.tipo === "persona") {
    const fala = b.visual.falandoParaCamera
      ? "She talks to the camera naturally, mouth moving as if speaking, small natural head and hand gestures, blinking."
      : "She does not talk to the camera.";
    return `Handheld smartphone UGC footage. ${b.visual.movimento}. ${fala} Camera: ${estilo.camera.movimento}. Realistic, natural skin, no text on screen.`;
  }
  if (b.visual.tipo === "broll") return `Handheld smartphone footage. ${b.visual.cena}. Subtle natural motion. Realistic, no text on screen.`;
  throw new Error("Bloco de tela não gera vídeo");
}

async function gerarBloco(ctx: {
  v: Vertical;
  persona: Persona;
  estilo: Estilo;
  pasta: string;
  idTrabalho: string;
  referenciaCena: string[];
  avisos: Set<string>;
}, b: Bloco, i: number): Promise<BlocoRender> {
  const { v, persona, estilo, pasta } = ctx;
  const m = (nome: string) => path.join(pasta, nome);

  // 1. Voz, com o tempo de cada palavra para a legenda.
  const chaveFala = hash(b.fala, persona.voz, process.env.ELEVENLABS_MODELO);
  const audio = `fala-${chaveFala}.mp3`;
  const arquivoAlinhamento = m(`fala-${chaveFala}.json`);
  await cache(m(audio), async () => {
    const al = await provedores.falar(b.fala, persona.voz, m(audio));
    await writeFile(arquivoAlinhamento, JSON.stringify(al));
  });
  const alinhamento = JSON.parse(await readFile(arquivoAlinhamento, "utf8").catch(() => "null"));
  const duracaoFala = await duracaoMidia(m(audio));
  const duracaoSeg = duracaoFala + FOLGA_SEG;
  const palavras = alinhamento ? palavrasDoAlinhamento(alinhamento) : palavrasEstimadas(b.fala, duracaoFala);

  const render: BlocoRender = { audio, duracaoSeg, palavras, headline: b.headline, zoom: b.zoom };

  // 2. Imagem.
  const visual = b.visual;
  if (visual.tipo === "tela") {
    const tela = v.ugc!.telas.find((t) => t.nome === visual.tela);
    if (!tela) throw new Error(`Bloco ${i + 1}: a tela "${visual.tela}" não está em verticais/${v.id}.ts`);
    const nome = `tela-${hash(tela.arquivo)}${path.extname(tela.arquivo)}`;
    await cache(m(nome), () => copyFile(tela.arquivo, m(nome)));
    if (/\.(mp4|mov|webm)$/i.test(nome)) {
      render.video = nome;
      render.videoDuracaoSeg = await duracaoMidia(m(nome));
    } else render.imagem = nome;
  } else {
    const ehPersona = b.visual.tipo === "persona";
    const pQuadro = promptQuadro(persona, estilo, b);
    const refs = ehPersona ? [...persona.folha, ...ctx.referenciaCena] : [];
    const quadro = `quadro-${hash(pQuadro, refs)}.png`;
    await cache(m(quadro), () => provedores.gerarImagem(pQuadro, refs, m(quadro)));
    // O primeiro quadro da personagem vira referência de cenário para os seguintes.
    if (ehPersona && !ctx.referenciaCena.length) ctx.referenciaCena.push(m(quadro));

    const pVideo = promptVideo(estilo, b);
    const segundos = segundosDoClipe(duracaoSeg);
    const clipe = `clipe-${hash(quadro, pVideo, segundos, process.env.OPENROUTER_VIDEO_MODELO)}.mp4`;
    await cache(m(clipe), () => provedores.gerarVideo({ prompt: pVideo, quadroInicial: m(quadro), duracaoSeg: segundos, destino: m(clipe) }));
    render.video = clipe;

    if (b.visual.tipo === "persona" && b.visual.falandoParaCamera) {
      if (provedores.lipsyncConfigurado()) {
        // Corta o clipe no tamanho da fala antes de sincronizar a boca.
        const corte = `corte-${hash(clipe, duracaoSeg)}.mp4`;
        await cache(m(corte), () => rodar(FFMPEG, ["-y", "-i", m(clipe), "-t", duracaoSeg.toFixed(2), "-an", "-c:v", "libx264", "-crf", "16", m(corte)]));
        const sync = `sync-${hash(corte, audio)}.mp4`;
        await cache(m(sync), () => provedores.sincronizarLabios(m(corte), m(audio), m(sync), `ugc/${ctx.idTrabalho}`));
        render.video = sync;
      } else {
        ctx.avisos.add("Sem FAL_KEY: a boca da personagem não está sincronizada com a fala.");
      }
    }
    render.videoDuracaoSeg = await duracaoMidia(m(render.video));
  }

  // 3. Efeito sonoro no início do bloco.
  if (b.sfx) {
    const def = estilo.sfx.find((s) => s.nome === b.sfx);
    if (def) {
      const global = path.join(DIR_SFX, `${def.nome}.mp3`);
      await mkdir(DIR_SFX, { recursive: true });
      await cache(global, () => provedores.gerarSfx(def.descricao, global));
      render.sfx = `sfx-${def.nome}.mp3`;
      render.sfxVolume = def.volume;
      await copyFile(global, m(render.sfx));
    }
  }
  return render;
}

async function escreverRevisado(v: Vertical, persona: Persona, estilo: Estilo, briefing: string): Promise<RascunhoUgc | null> {
  let rascunho = await escreverUgc(v, persona, estilo, briefing);
  let revisao = await revisarUgc(v, persona, estilo, briefing, rascunho);
  if (!revisao.aprovado) {
    rascunho = await escreverUgc(v, persona, estilo, briefing, revisao.problemas);
    revisao = await revisarUgc(v, persona, estilo, briefing, rascunho);
  }
  if (!revisao.aprovado) {
    await enviarMensagem(`🟡 ${v.app.nome}: o roteiro UGC foi descartado porque não passou na revisão.\n\n${revisao.problemas.map((p) => `• ${p}`).join("\n")}`);
    return null;
  }
  return rascunho;
}

export function roteiroEmTexto(r: RascunhoUgc): string {
  return r.roteiro.blocos
    .map((b, i) => {
      const visual = b.visual.tipo === "persona" ? `${b.visual.enquadramento} · ${b.visual.cena}` : b.visual.tipo === "tela" ? `tela: ${b.visual.tela}` : `b-roll: ${b.visual.cena}`;
      const extras = [b.headline && `headline "${b.headline}"`, b.sfx && `sfx ${b.sfx}`, b.zoom && "zoom"].filter(Boolean).join(" · ");
      return `${i + 1}. [${b.papel}] ${b.fala}\n   🎥 ${visual}${extras ? `\n   ✨ ${extras}` : ""}`;
    })
    .join("\n");
}

/** Roteiro → revisão → voz → quadros → vídeos → sincronia labial → render → Telegram. */
export async function produzirUgc(v: Vertical, opcoes: OpcoesUgc): Promise<Peca | null> {
  if (!v.ugc) throw new Error(`Configure "ugc" em verticais/${v.id}.ts (persona, estilo, telas e fatos)`);
  const [persona, estilo] = await Promise.all([carregarPersona(v.ugc.persona), carregarEstilo(v.ugc.estilo)]);

  let trabalho: Trabalho;
  if (opcoes.continuar) {
    trabalho = JSON.parse(await readFile(path.join(DIR_UGC, opcoes.continuar, "trabalho.json"), "utf8"));
    if (trabalho.vertical !== v.id) throw new Error(`O trabalho ${opcoes.continuar} é da vertical ${trabalho.vertical}`);
  } else {
    if (!opcoes.briefing?.trim()) throw new Error("Passe o briefing do vídeo (--briefing \"...\" ou --briefing-arquivo caminho.md)");
    const rascunho = await escreverRevisado(v, persona, estilo, opcoes.briefing);
    if (!rascunho) return null;
    trabalho = { id: novoId(v.id, "ugc"), vertical: v.id, briefing: opcoes.briefing, rascunho };
  }

  const pasta = path.join(DIR_UGC, trabalho.id);
  await mkdir(pasta, { recursive: true });
  await writeFile(path.join(pasta, "trabalho.json"), JSON.stringify(trabalho, null, 2));

  if (opcoes.soRoteiro) {
    await enviarMensagem(
      `📝 ${v.app.nome} · roteiro UGC "${trabalho.rascunho.titulo}"\n\n${roteiroEmTexto(trabalho.rascunho)}\n\nPara gerar o vídeo: npm run ugc ${v.id} -- --continuar ${trabalho.id}`,
    );
    return null;
  }

  const avisos = new Set<string>();
  const ctx = { v, persona, estilo, pasta, idTrabalho: trabalho.id, referenciaCena: [] as string[], avisos };
  const blocos: BlocoRender[] = [];
  // Em sequência: o primeiro quadro da personagem é referência de cenário para os outros.
  for (const [i, b] of trabalho.rascunho.roteiro.blocos.entries()) {
    console.log(`Bloco ${i + 1}/${trabalho.rascunho.roteiro.blocos.length}: ${b.fala.slice(0, 60)}`);
    blocos.push(await gerarBloco(ctx, b, i));
  }

  const props: Omit<PropsUgc, "base"> = {
    marca: v.marca,
    estilo: { legendas: estilo.legendas, headline: estilo.headline, zoom: estilo.zoom, cor: estilo.cor },
    blocos,
    rotuloIa: ROTULO_IA,
  };
  await writeFile(path.join(pasta, "props.json"), JSON.stringify(props, null, 2));
  const bruto = path.join(pasta, "render.mp4");
  await renderizarUgc(props, pasta, bruto);
  const videoPath = path.join(pasta, `${trabalho.id}.mp4`);
  await normalizarAudio(bruto, videoPath);

  const legenda = `${trabalho.rascunho.legenda.trim()}\n\n🤖 ${ROTULO_IA}.\n\n${v.hashtags.join(" ")}`;
  const peca = await salvarPeca({
    id: trabalho.id,
    tipo: "reel",
    formato: "ugc",
    vertical: v.id,
    criadaEm: new Date().toISOString(),
    status: "aguardando",
    titulo: trabalho.rascunho.titulo,
    fontes: [{ nome: "Briefing e fatos do app", url: "" }],
    legenda,
    videoPath,
  });
  await pedirAprovacao(peca, v, [...avisos]);
  return peca;
}
