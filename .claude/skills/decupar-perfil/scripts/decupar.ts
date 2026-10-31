import "dotenv/config";
import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { EstiloSchema } from "../../../../src/ugc/formato";
import { DIR_ESTILOS } from "../../../../src/ugc/persona";
import { duracaoMidia, FFMPEG, FFPROBE, rodar } from "../../../../src/ugc/midia";
import { transcrever } from "../../../../src/ugc/provedores";

// Decupagem técnica: cortes, tomadas, quadros de cada tomada, gancho, fala, volume e cores.
// O que é visual (enquadramento, texto na tela, gestos) o Claude lê nas folhas de contato geradas aqui.
//
// Uso:
//   npm run decupar -- <pasta-com-videos> <id-do-estilo> [--sem-transcricao]
//   npm run decupar -- --validar <id-do-estilo>

const exec = promisify(execFile);
const args = process.argv.slice(2);
const r1 = (n: number) => Math.round(n * 100) / 100;
const mediana = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function validar(id: string) {
  const arquivo = path.join(DIR_ESTILOS, id, "estilo.json");
  const r = EstiloSchema.safeParse(JSON.parse(await readFile(arquivo, "utf8")));
  if (r.success) console.log(`✅ ${arquivo} está no formato certo.`);
  else {
    console.log(`❌ ${arquivo}:`);
    for (const p of r.error.issues) console.log(`  - ${p.path.join(".")}: ${p.message}`);
    process.exitCode = 1;
  }
}

async function cortes(video: string): Promise<number[]> {
  const { stderr } = await rodar(FFMPEG, ["-i", video, "-vf", "select='gt(scene,0.27)',showinfo", "-an", "-f", "null", "-"]);
  return [...stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
}

async function silencios(video: string): Promise<{ inicio: number; fim: number }[]> {
  const { stderr } = await rodar(FFMPEG, ["-i", video, "-af", "silencedetect=n=-35dB:d=0.25", "-vn", "-f", "null", "-"]);
  const ini = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const fim = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return ini.map((s, i) => ({ inicio: r1(s), fim: r1(fim[i] ?? s) }));
}

async function volume(video: string): Promise<number | null> {
  const { stderr } = await rodar(FFMPEG, ["-i", video, "-af", "ebur128", "-vn", "-f", "null", "-"]).catch(() => ({ stderr: "" }));
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(stderr.split("Summary:").pop() ?? "");
  return m ? Number(m[1]) : null;
}

/** Cores dominantes (1 quadro por segundo, reduzido) e brilho/saturação médios. */
async function cores(video: string) {
  const { stdout } = await exec(FFMPEG, ["-v", "error", "-i", video, "-vf", "fps=1,scale=32:57,format=rgb24", "-f", "rawvideo", "-"], {
    encoding: "buffer",
    maxBuffer: 64 * 1024 * 1024,
  });
  const contagem = new Map<string, number>();
  let brilho = 0;
  let saturacao = 0;
  const n = Math.floor(stdout.length / 3);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = [stdout[i * 3], stdout[i * 3 + 1], stdout[i * 3 + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    brilho += max / 255;
    saturacao += max ? (max - min) / max : 0;
    const q = (c: number) => Math.min(255, Math.round(c / 32) * 32).toString(16).padStart(2, "0");
    const chave = `#${q(r)}${q(g)}${q(b)}`;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  const top = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    dominantes: top.map(([cor, c]) => ({ cor, pct: r1((c / n) * 100) })),
    brilhoMedio: r1(brilho / n),
    saturacaoMedia: r1(saturacao / n),
  };
}

async function quadro(video: string, t: number, destino: string) {
  await rodar(FFMPEG, ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", video, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", destino]);
}

async function folha(quadros: string[], destino: string, maxColunas: number) {
  const colunas = Math.min(maxColunas, quadros.length);
  const entradas = quadros.flatMap((q) => ["-i", q]);
  const linhas = Math.ceil(quadros.length / colunas);
  // Completa a última linha com quadros pretos para o xstack fechar a grade.
  const filtros: string[] = [];
  const nomes: string[] = [];
  for (let i = 0; i < linhas * colunas; i++) {
    if (i < quadros.length) filtros.push(`[${i}:v]scale=240:427,setsar=1[q${i}]`);
    else filtros.push(`color=c=black:s=240x427:d=1[q${i}]`);
    nomes.push(`[q${i}]`);
  }
  const layout = nomes.map((_, i) => `${(i % colunas) * 240}_${Math.floor(i / colunas) * 427}`).join("|");
  await rodar(FFMPEG, ["-v", "error", "-y", ...entradas, "-filter_complex", `${filtros.join(";")};${nomes.join("")}xstack=inputs=${nomes.length}:layout=${layout}`, "-frames:v", "1", "-q:v", "4", destino]);
}

async function decuparVideo(video: string, saida: string, comTranscricao: boolean) {
  const nome = path.basename(video, path.extname(video));
  const pasta = path.join(saida, nome);
  await mkdir(path.join(pasta, "tomadas"), { recursive: true });

  const duracao = await duracaoMidia(video);
  const { stdout: info } = await rodar(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", video]);
  const stream = JSON.parse(info).streams?.[0] ?? {};

  const ts = (await cortes(video)).filter((t) => t > 0.15 && t < duracao - 0.15);
  const limites = [0, ...ts, duracao];
  const tomadas = limites.slice(0, -1).map((ini, i) => ({ n: i + 1, inicio: r1(ini), fim: r1(limites[i + 1]), duracao: r1(limites[i + 1] - ini) }));

  // Um quadro no meio de cada tomada + 6 quadros dos primeiros 3 segundos (gancho).
  const quadrosTomadas: string[] = [];
  for (const t of tomadas) {
    const arq = path.join(pasta, "tomadas", `${String(t.n).padStart(2, "0")}.jpg`);
    await quadro(video, (t.inicio + t.fim) / 2, arq);
    quadrosTomadas.push(arq);
  }
  const quadrosGancho: string[] = [];
  for (const [i, t] of [0, 0.5, 1, 1.5, 2, 2.5].entries()) {
    if (t >= duracao) break;
    const arq = path.join(pasta, `gancho-${i}.jpg`);
    await quadro(video, t, arq);
    quadrosGancho.push(arq);
  }
  for (let i = 0; i < quadrosTomadas.length; i += 24) {
    await folha(quadrosTomadas.slice(i, i + 24), path.join(pasta, `folha-${i / 24 + 1}.jpg`), 6);
  }
  if (quadrosGancho.length) await folha(quadrosGancho, path.join(pasta, "gancho.jpg"), quadrosGancho.length);

  const sil = await silencios(video);
  const tempoSilencio = sil.reduce((s, x) => s + (x.fim - x.inicio), 0);

  let fala: Record<string, unknown> | null = null;
  if (comTranscricao && process.env.ELEVENLABS_API_KEY) {
    const audio = path.join(pasta, "audio.mp3");
    await rodar(FFMPEG, ["-v", "error", "-y", "-i", video, "-vn", "-ac", "1", "-b:a", "64k", audio]);
    try {
      const t = await transcrever(audio);
      const palavras = t.words.filter((w) => (w.type ?? "word") === "word");
      const tempoFalado = palavras.length ? palavras.at(-1)!.end - palavras[0].start : 0;
      fala = {
        texto: t.text,
        palavras: palavras.length,
        palavrasPorMinuto: tempoFalado ? Math.round((palavras.length / tempoFalado) * 60) : 0,
        primeiraPalavraSeg: r1(palavras[0]?.start ?? 0),
        gancho3s: palavras.filter((w) => w.start < 3).map((w) => w.text).join(" "),
        // Tempo de cada tomada com o que é falado nela.
        porTomada: tomadas.map((tm) => palavras.filter((w) => w.start >= tm.inicio && w.start < tm.fim).map((w) => w.text).join(" ")),
      };
      await writeFile(path.join(pasta, "transcricao.json"), JSON.stringify(t, null, 2));
    } catch (e) {
      fala = { erro: (e as Error).message };
    }
  }

  const resultado = {
    arquivo: path.basename(video),
    duracao: r1(duracao),
    resolucao: `${stream.width}x${stream.height}`,
    fps: stream.r_frame_rate,
    tomadas,
    cortesPorMinuto: r1((ts.length / duracao) * 60),
    tomadaMediana: r1(mediana(tomadas.map((t) => t.duracao))),
    silencios: sil,
    silencioPct: r1((tempoSilencio / duracao) * 100),
    volumeLufs: await volume(video),
    cores: await cores(video),
    fala,
    arquivos: {
      folhas: (await readdir(pasta)).filter((a) => a.startsWith("folha-")),
      gancho: quadrosGancho.length ? "gancho.jpg" : null,
    },
  };
  await writeFile(path.join(pasta, "decupagem.json"), JSON.stringify(resultado, null, 2));
  return resultado;
}

if (args[0] === "--validar") {
  await validar(args[1]);
} else {
  const [pastaVideos, id] = args.filter((a) => !a.startsWith("--"));
  if (!pastaVideos || !id) {
    console.error("Uso: npm run decupar -- <pasta-com-videos> <id-do-estilo> [--sem-transcricao]");
    process.exit(1);
  }
  const comTranscricao = !args.includes("--sem-transcricao");
  if (comTranscricao && !process.env.ELEVENLABS_API_KEY) console.warn("Sem ELEVENLABS_API_KEY: seguindo sem transcrição.");
  const saida = path.join(DIR_ESTILOS, id, "decupagem");
  const videos = (await readdir(pastaVideos)).filter((a) => /\.(mp4|mov|webm|mkv)$/i.test(a)).sort();
  if (!videos.length) throw new Error(`Nenhum vídeo em ${pastaVideos}`);
  const todos = [];
  for (const [i, v] of videos.entries()) {
    console.log(`[${i + 1}/${videos.length}] ${v}`);
    try {
      todos.push(await decuparVideo(path.join(pastaVideos, v), saida, comTranscricao));
    } catch (e) {
      console.error(`  falhou: ${(e as Error).message}`);
    }
  }
  const ppm = todos.map((t) => (t.fala as { palavrasPorMinuto?: number } | null)?.palavrasPorMinuto).filter((x): x is number => !!x);
  const resumo = {
    videos: todos.length,
    duracaoMediana: r1(mediana(todos.map((t) => t.duracao))),
    duracaoMin: r1(Math.min(...todos.map((t) => t.duracao))),
    duracaoMax: r1(Math.max(...todos.map((t) => t.duracao))),
    cortesPorMinutoMediana: r1(mediana(todos.map((t) => t.cortesPorMinuto))),
    tomadaMediana: r1(mediana(todos.map((t) => t.tomadaMediana))),
    silencioPctMediana: r1(mediana(todos.map((t) => t.silencioPct))),
    palavrasPorMinutoMediana: ppm.length ? mediana(ppm) : null,
    volumeLufsMediana: r1(mediana(todos.map((t) => t.volumeLufs).filter((x): x is number => x !== null))),
    ganchos: todos.map((t) => ({ video: t.arquivo, gancho3s: (t.fala as { gancho3s?: string } | null)?.gancho3s ?? null })),
  };
  await writeFile(path.join(saida, "resumo.json"), JSON.stringify(resumo, null, 2));
  console.log(`\nDecupagem em ${saida}\n${JSON.stringify(resumo, null, 2)}`);
}
process.exit();
