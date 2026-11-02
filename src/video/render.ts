import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import type { Carrossel, PropsSlide } from "../core/carrossel";
import type { Marca, PropsReel } from "../core/roteiro";

let bundleCache: Promise<string> | null = null;

function obterBundle(): Promise<string> {
  bundleCache ??= bundle({ entryPoint: path.resolve("remotion/index.ts") });
  return bundleCache;
}

const navegador = () => process.env.REMOTION_CHROME || null;
const chromiumOptions = { gl: "swangle" as const };

// As verticais produzem em paralelo, mas o render roda um de cada vez: renderizar dois
// vídeos juntos estoura a memória de um servidor de 2 GB.
let fila: Promise<unknown> = Promise.resolve();
function naFila<T>(tarefa: () => Promise<T>): Promise<T> {
  const vez = fila.then(tarefa, tarefa);
  fila = vez.catch(() => {});
  return vez;
}

/** Renderiza um Reel vertical (1080x1920, H.264) e devolve o caminho do MP4. */
export function renderizarReel(props: PropsReel, destino: string): Promise<string> {
  return naFila(async () => {
    const serveUrl = await obterBundle();
    const inputProps = props as unknown as Record<string, unknown>;
    const composition = await selectComposition({ serveUrl, id: "Reel", inputProps, browserExecutable: navegador() });
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: destino,
      inputProps,
      browserExecutable: navegador(),
      chromiumOptions,
    });
    return destino;
  });
}

/**
 * Renderiza cada slide do carrossel como JPEG 1080x1350 (o formato 4:5 ocupa mais tela no feed).
 * Os arquivos levam o id da peça no nome para não colidirem no bucket público.
 */
export function renderizarCarrossel(marca: Marca, carrossel: Carrossel, pasta: string, id: string): Promise<string[]> {
  return naFila(async () => {
    const serveUrl = await obterBundle();
    await mkdir(pasta, { recursive: true });
    const browser = await openBrowser("chrome", { browserExecutable: navegador(), chromiumOptions });
    try {
      const arquivos: string[] = [];
      const total = carrossel.slides.length;
      for (const [indice, slide] of carrossel.slides.entries()) {
        const props: PropsSlide = { marca, slide, indice, total };
        const inputProps = props as unknown as Record<string, unknown>;
        const composition = await selectComposition({ serveUrl, id: "Slide", inputProps, puppeteerInstance: browser });
        const destino = path.join(pasta, `${id}-${String(indice + 1).padStart(2, "0")}.jpg`);
        await renderStill({
          composition,
          serveUrl,
          output: destino,
          inputProps,
          imageFormat: "jpeg",
          jpegQuality: 92,
          puppeteerInstance: browser,
          overwrite: true,
        });
        arquivos.push(destino);
      }
      return arquivos;
    } finally {
      await browser.close({ silent: true });
    }
  });
}
