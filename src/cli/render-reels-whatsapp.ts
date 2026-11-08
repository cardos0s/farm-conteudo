import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

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
  execFileSync("pdftoppm", ["-r", "90", "-png", "-singlefile", "-f", String(n), "-l", String(n), pdf, `${paginas}/p-${nome}`], { stdio: "ignore" });
}

const filtro = process.argv[2] ? [Number(process.argv[2])] : [1, 2, 3];
const navegador = process.env.REMOTION_CHROME || null;
await mkdir("saida/materiais/reels", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts"), publicDir: path.resolve("public"), symlinkPublicDir: true });

for (const parte of filtro) {
  const inputProps = { parte };
  const composition = await selectComposition({ serveUrl, id: "ReelWhatsApp", inputProps, browserExecutable: navegador });
  const destino = `saida/materiais/reels/system-design-whatsapp-parte-${parte}.mp4`;
  const inicio = Date.now();
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: destino,
    inputProps,
    crf: 18,
    imageFormat: "jpeg",
    jpegQuality: 92,
    audioBitrate: "192k",
    concurrency: os.cpus().length,
    browserExecutable: navegador,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 100);
      if (p !== ultimo && p % 10 === 0) {
        ultimo = p;
        console.log(`parte ${parte}: ${p}% (${((Date.now() - inicio) / 1000).toFixed(0)} s)`);
      }
    },
  });
  console.log(`ok: ${destino} (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
}
