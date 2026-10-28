import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { PropsReel } from "../core/roteiro";

let bundleCache: Promise<string> | null = null;

function obterBundle(): Promise<string> {
  bundleCache ??= bundle({ entryPoint: path.resolve("remotion/index.ts") });
  return bundleCache;
}

const navegador = () => process.env.REMOTION_CHROME || null;

/** Renderiza um Reel vertical (1080x1920, H.264) e devolve o caminho do MP4. */
export async function renderizarReel(props: PropsReel, destino: string): Promise<string> {
  const serveUrl = await obterBundle();
  const inputProps = props as unknown as Record<string, unknown>;
  const composition = await selectComposition({
    serveUrl,
    id: "Reel",
    inputProps,
    browserExecutable: navegador(),
  });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: destino,
    inputProps,
    browserExecutable: navegador(),
    chromiumOptions: { gl: "swangle" },
  });
  return destino;
}
