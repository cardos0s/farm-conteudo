import { copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { FormatoPost } from "./core/agenda";
import { novoId, salvarPeca, type Peca } from "./core/estado";
import type { Vertical } from "./core/vertical";
import { agendar } from "./fabrica";
import { botaoCancelar, enviarMensagem } from "./publicacao/telegram";

// Conteúdo pronto: você coloca os Reels e carrosséis numa pasta e a fábrica agenda e posta.
//
//   entrada/rebanho/reels/01-nome.mp4          o vídeo
//   entrada/rebanho/reels/01-nome.txt          a legenda (mesmo nome do vídeo)
//   entrada/rebanho/carrosseis/01-nome/        uma pasta por carrossel
//       1.jpg, 2.jpg, ... (de 2 a 20 imagens, na ordem do nome)
//       legenda.txt
//
// A ordem de postagem segue a ordem dos nomes (01, 02, ..., 10). Cada item entra no próximo
// horário livre do formato dele e sai da pasta de entrada; o que tiver problema vai para
// entrada/<app>/com-problema/ com um arquivo explicando o motivo.

export const DIR_ENTRADA = process.env.FABRICA_ENTRADA || "entrada";
const DIR_IMPORTADOS = process.env.FABRICA_IMPORTADOS || "saida/importados";
/** Arquivo modificado há menos que isso ainda pode estar sendo copiado ou sincronizado. */
const ESPERA_COPIA_MS = 2 * 60_000;

const VIDEOS = [".mp4", ".mov"];
const IMAGENS = [".jpg", ".jpeg", ".png", ".webp"];
const LIMITE_LEGENDA = 2200;
const LIMITE_HASHTAGS = 30;

const porNome = (a: string, b: string) => a.localeCompare(b, "pt-BR", { numeric: true });
const extensao = (a: string) => path.extname(a).toLowerCase();
const visivel = (a: string) => !a.startsWith(".");

class ProblemaNoArquivo extends Error {}

async function listar(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter(visivel).sort(porNome);
  } catch {
    return [];
  }
}

async function existe(arquivo: string) {
  return stat(arquivo).then(
    () => true,
    () => false,
  );
}

/** Move entre pastas, mesmo que estejam em discos diferentes. */
async function mover(de: string, para: string) {
  await mkdir(path.dirname(para), { recursive: true });
  try {
    await rename(de, para);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EXDEV") throw e;
    await copyFile(de, para);
    await rm(de);
  }
}

/** Verdadeiro se nenhum dos arquivos mudou nos últimos minutos (a cópia terminou). */
async function copiaTerminou(arquivos: string[], agora: number) {
  for (const a of arquivos) {
    if (!(await existe(a))) continue;
    if (agora - (await stat(a)).mtimeMs < ESPERA_COPIA_MS) return false;
  }
  return true;
}

async function lerLegenda(arquivo: string): Promise<string> {
  const legenda = (await existe(arquivo)) ? (await readFile(arquivo, "utf8")).trim() : "";
  if (legenda.length > LIMITE_LEGENDA) {
    throw new ProblemaNoArquivo(`a legenda tem ${legenda.length} caracteres; o Instagram aceita até ${LIMITE_LEGENDA}`);
  }
  const hashtags = legenda.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  if (hashtags > LIMITE_HASHTAGS) throw new ProblemaNoArquivo(`a legenda tem ${hashtags} hashtags; o Instagram aceita até ${LIMITE_HASHTAGS}`);
  return legenda;
}

/**
 * Prepara a imagem para a API do Instagram, que só aceita JPEG com proporção entre 4:5 (retrato) e 1,91:1 (paisagem).
 * Gira conforme o EXIF, converte PNG/WebP para JPEG e reduz para no máximo 1440 px de largura.
 */
async function prepararImagem(origem: string, destino: string) {
  const info = await sharp(origem).metadata();
  const girada = (info.orientation ?? 1) >= 5;
  const largura = (girada ? info.height : info.width) ?? 0;
  const altura = (girada ? info.width : info.height) ?? 0;
  const proporcao = largura / altura;
  if (!(proporcao >= 0.8 - 0.01 && proporcao <= 1.91 + 0.01)) {
    throw new ProblemaNoArquivo(
      `${path.basename(origem)} tem ${largura}x${altura}; o Instagram só aceita de 4:5 (ex.: 1080x1350) a 1,91:1 (ex.: 1080x566)`,
    );
  }
  await mkdir(path.dirname(destino), { recursive: true });
  await sharp(origem).rotate().resize({ width: 1440, withoutEnlargement: true }).toColorspace("srgb").jpeg({ quality: 92, mozjpeg: true }).toFile(destino);
}

interface Item {
  formato: FormatoPost;
  nome: string;
  /** O que sai da pasta de entrada quando o item é importado (ou quando dá problema). */
  arquivos: string[];
  importar: (id: string) => Promise<Partial<Peca>>;
}

async function itensDoApp(v: Vertical): Promise<Item[]> {
  const base = path.join(DIR_ENTRADA, v.id);
  const itens: Item[] = [];

  const pastaReels = path.join(base, "reels");
  for (const arquivo of await listar(pastaReels)) {
    if (!VIDEOS.includes(extensao(arquivo))) continue;
    const video = path.join(pastaReels, arquivo);
    const txt = path.join(pastaReels, `${path.parse(arquivo).name}.txt`);
    itens.push({
      formato: "reel",
      nome: arquivo,
      arquivos: [video, txt],
      importar: async (id) => {
        const legenda = await lerLegenda(txt);
        const videoPath = path.join(DIR_IMPORTADOS, v.id, `${id}${extensao(arquivo)}`);
        await mover(video, videoPath);
        if (await existe(txt)) await mover(txt, path.join(DIR_IMPORTADOS, v.id, `${id}.txt`));
        return { legenda, videoPath };
      },
    });
  }

  const pastaCarrosseis = path.join(base, "carrosseis");
  for (const nome of await listar(pastaCarrosseis)) {
    const pasta = path.join(pastaCarrosseis, nome);
    if (!(await stat(pasta)).isDirectory()) continue;
    const conteudo = await listar(pasta);
    itens.push({
      formato: "carrossel",
      nome,
      arquivos: [pasta, ...conteudo.map((a) => path.join(pasta, a))],
      importar: async (id) => {
        const fotos = conteudo.filter((a) => IMAGENS.includes(extensao(a)));
        if (fotos.length < 2 || fotos.length > 20) {
          throw new ProblemaNoArquivo(`o carrossel tem ${fotos.length} imagem(ns); o Instagram aceita de 2 a 20 (JPG, PNG ou WebP)`);
        }
        const txt = conteudo.find((a) => a.toLowerCase() === "legenda.txt");
        const legenda = txt ? await lerLegenda(path.join(pasta, txt)) : "";
        const imagens: string[] = [];
        for (const [i, foto] of fotos.entries()) {
          const destino = path.join(DIR_IMPORTADOS, v.id, id, `${id}-${String(i + 1).padStart(2, "0")}.jpg`);
          await prepararImagem(path.join(pasta, foto), destino);
          imagens.push(destino);
        }
        await rm(pasta, { recursive: true });
        return { legenda, imagens };
      },
    });
  }
  return itens;
}

async function separarComProblema(v: Vertical, item: Item, motivo: string) {
  const destino = path.join(DIR_ENTRADA, v.id, "com-problema");
  // Reel: o vídeo e o .txt. Carrossel: a pasta inteira.
  const mover_ = item.formato === "reel" ? item.arquivos : [item.arquivos[0]];
  for (const a of mover_) if (await existe(a)) await mover(a, path.join(destino, path.basename(a)));
  const pasta = item.formato === "reel" ? "reels" : "carrosseis";
  await writeFile(path.join(destino, `${item.nome}.problema.txt`), `${motivo}\n\nCorrija e coloque de volta em entrada/${v.id}/${pasta}/.\n`);
}

const horaCurta = (d: Date) => d.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Lê a pasta de entrada de cada app, agenda cada Reel e carrossel no próximo horário livre do formato
 * e avisa no Telegram, com o botão de cancelar. Devolve quantos itens entraram na agenda.
 */
export async function importarEntrada(verticais: Vertical[], agora = Date.now()): Promise<number> {
  let importados = 0;
  for (const v of verticais) {
    for (const item of await itensDoApp(v)) {
      if (!(await copiaTerminou(item.arquivos, agora))) continue;
      const nome = item.formato === "reel" ? "Reel" : "Carrossel";
      const id = novoId(v.id, item.formato);
      let midia: Partial<Peca>;
      try {
        midia = await item.importar(id);
      } catch (e) {
        // Arquivo fora do padrão ou ilegível: separa para não tentar de novo a cada minuto.
        const motivo = e instanceof ProblemaNoArquivo ? e.message : `não consegui ler o arquivo (${(e as Error).message})`;
        await separarComProblema(v, item, motivo);
        await enviarMensagem(`🟡 ${nome} "${item.nome}" (${v.app.nome}) não entrou na agenda: ${motivo}.\nEle foi para entrada/${v.id}/com-problema/.`);
        continue;
      }
      const peca = await salvarPeca({
        id,
        tipo: item.formato,
        vertical: v.id,
        criadaEm: new Date().toISOString(),
        status: "aguardando",
        titulo: item.nome,
        fontes: [],
        ...midia,
      });
      const quando = await agendar(peca);
      importados++;
      const aviso = peca.legenda ? "" : "\n⚠️ Sem legenda: vai ao ar sem texto. Se não era isso, toque em ❌ e coloque de novo na pasta, junto com o .txt.";
      await enviarMensagem(`🗓 ${item.formato === "reel" ? "🎬" : "🖼"} ${nome} "${item.nome}" (${v.app.nome}) agendado para ${horaCurta(quando)}.${aviso}`, {
        reply_markup: botaoCancelar(id),
      });
    }
  }
  return importados;
}

/** Cria as pastas de entrada de cada app, para você saber onde colocar os arquivos. */
export async function criarPastasDeEntrada(verticais: Vertical[]) {
  for (const v of verticais) {
    for (const sub of ["reels", "carrosseis"]) await mkdir(path.join(DIR_ENTRADA, v.id, sub), { recursive: true });
  }
}
