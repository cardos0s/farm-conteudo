import { execFileSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { CAUDA, MAXIMO, duracaoNatural, intros } from "../../remotion/reels/whatsapp/roteiro";

// Renderiza a série de Reels do ebook "System Design do WhatsApp" (3 MP4 verticais, narrados).
// Precisa do PDF já gerado (npm run pdf:whatsapp), porque as páginas dele aparecem na chamada
// final, e da narração preparada (materiais/whatsapp/narracao.py), que põe os MP3 em
// public/materiais/whatsapp/narracao/.
// Uso: npm run render:reels-whatsapp [1|2|3]

const pdf = "saida/materiais/system-design-whatsapp.pdf";
if (!existsSync("public/materiais/whatsapp/sons/trilha.wav")) throw new Error("Trilha e efeitos não encontrados. Rode: npm run sons:whatsapp");
for (const n of [1, 2, 3]) {
  const mp3 = `public/materiais/whatsapp/narracao/parte${n}.mp3`;
  if (!existsSync(mp3)) throw new Error(`Narração não encontrada em ${mp3}. Rode: python3 materiais/whatsapp/narracao.py parte1.mp3 parte2.mp3 parte3.mp3`);
}
if (!existsSync(pdf)) throw new Error(`PDF não encontrado em ${pdf}. Rode antes: npm run pdf:whatsapp`);

// Páginas do PDF mostradas na chamada (capa, arquitetura, caminho da mensagem e cola).
const paginas = "public/materiais/whatsapp/paginas";
await mkdir(paginas, { recursive: true });
for (const n of [1, 8, 11, 21]) {
  const nome = String(n).padStart(2, "0");
  execFileSync("pdftoppm", ["-r", "200", "-png", "-singlefile", "-f", String(n), "-l", String(n), pdf, `${paginas}/p-${nome}`], { stdio: "ignore" });
}

function limitar(arquivo: string, duracao: number) {
  const tmp = arquivo.replace(/\.mp4$/, ".tmp.mp4");
  // -t: a faixa de áudio (AAC) não pode sair mais longa que o vídeo
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", arquivo, "-t", duracao.toFixed(3), "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89:attack=5:release=60:level=false", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", tmp]);
  renameSync(tmp, arquivo);
}

const filtro = (process.argv[2] ? [Number(process.argv[2])] : [1, 2, 3]) as (1 | 2 | 3)[];
for (const parte of filtro) {
  if (intros[parte] && !existsSync(`public/materiais/whatsapp/intro/parte${parte}/fundo.mp4`))
    throw new Error(`Intro da parte ${parte} não encontrada. Rode: python3 materiais/whatsapp/intro.py <video.mov> --parte ${parte}`);
  const natural = duracaoNatural(parte);
  if (natural > MAXIMO)
    console.warn(`atenção: a parte ${parte} teria ${natural.toFixed(2)} s; o teto de ${MAXIMO} s encurta a chamada final em ${(natural - MAXIMO).toFixed(2)} s (de ${CAUDA} s)` +
      (natural - CAUDA > MAXIMO ? " e CORTA a narração" : ""));
}
const navegador = process.env.REMOTION_CHROME || null;
await mkdir("saida/materiais/reels", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public"), symlinkPublicDir: true });

type Camada = "tudo" | "semIntro" | "introAtras" | "introFrente" | "mascara";

/** Renderiza uma camada da composição ReelWhatsApp em 4K (scale 2). */
async function renderizar(parte: 1 | 2 | 3, camada: Camada, destino: string, extra: Partial<Parameters<typeof renderMedia>[0]> = {}) {
  const inputProps = { parte, camada };
  const composition = await selectComposition({ serveUrl, id: "ReelWhatsApp", inputProps, browserExecutable: navegador });
  const inicio = Date.now();
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: destino,
    inputProps,
    // 4K vertical (2160x3840), a resolução original do vídeo da Julia; cor marcada como BT.709
    scale: 2,
    colorSpace: "bt709",
    crf: 16,
    imageFormat: "jpeg",
    jpegQuality: 96,
    audioBitrate: "192k",
    concurrency: os.cpus().length,
    browserExecutable: navegador,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 100);
      if (p !== ultimo && p % 10 === 0) {
        ultimo = p;
        console.log(`parte ${parte} (${camada}): ${p}% (${((Date.now() - inicio) / 1000).toFixed(0)} s)`);
      }
    },
    ...extra,
  });
  return composition.durationInFrames / composition.fps;
}

for (const parte of filtro) {
  const destino = `saida/materiais/reels/system-design-whatsapp-parte-${parte}.mp4`;
  const intro = intros[parte];
  if (!intro) {
    const dur = await renderizar(parte, "tudo", destino);
    // volume final no padrão de Reels (-14 LUFS) e limitador em -1 dBFS (voz + trilha + efeitos somados)
    limitar(destino, dur);
    console.log(`ok: ${destino} (${dur.toFixed(1)} s)`);
    continue;
  }
  // Parte com intro gravada: o vídeo dela é HDR. As camadas saem daqui e o materiais/whatsapp/hdr.py
  // monta o arquivo final em HLG com os pixels originais dela (sem conversão de cor).
  const pasta = "saida/materiais/reels/.camadas";
  await mkdir(pasta, { recursive: true });
  const faixa: [number, number] = [0, intro.quadros - 1];
  const transparente = { codec: "prores", proResProfile: "4444", imageFormat: "png", pixelFormat: "yuva444p10le", frameRange: faixa, muted: true } as const;
  await renderizar(parte, "semIntro", `${pasta}/parte${parte}-semIntro.mp4`, { crf: 10 });
  await renderizar(parte, "introAtras", `${pasta}/parte${parte}-introAtras.mov`, transparente);
  await renderizar(parte, "introFrente", `${pasta}/parte${parte}-introFrente.mov`, transparente);
  await renderizar(parte, "mascara", `${pasta}/parte${parte}-mascara.mov`, { codec: "prores", proResProfile: "hq", frameRange: faixa, muted: true });
  execFileSync("python3", ["-I", "materiais/whatsapp/hdr.py", "--parte", String(parte), "--preset", "fast"], { stdio: "inherit" });
}
