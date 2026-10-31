import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { PropsReel } from "../core/roteiro";
import type { PropsUgc } from "../ugc/formato";
import { tipoMime } from "../ugc/midia";

let bundleCache: Promise<string> | null = null;

function obterBundle(): Promise<string> {
  bundleCache ??= bundle({ entryPoint: path.resolve("remotion/index.ts") });
  return bundleCache;
}

const navegador = () => process.env.REMOTION_CHROME || null;

async function renderizar(id: string, props: Record<string, unknown>, destino: string, crf?: number) {
  const serveUrl = await obterBundle();
  const composition = await selectComposition({ serveUrl, id, inputProps: props, browserExecutable: navegador() });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf,
    outputLocation: destino,
    inputProps: props,
    browserExecutable: navegador(),
    chromiumOptions: { gl: "swangle" },
  });
  return destino;
}

/** Renderiza um Reel vertical (1080x1920, H.264) e devolve o caminho do MP4. */
export async function renderizarReel(props: PropsReel, destino: string): Promise<string> {
  return renderizar("Reel", props as unknown as Record<string, unknown>, destino);
}

/**
 * Serve uma pasta em 127.0.0.1 com suporte a Range (o Remotion busca trechos dos vídeos).
 * As mídias do UGC são geradas depois do bundle, então não dá para usar a pasta public/.
 */
export async function servirPasta(pasta: string): Promise<{ base: string; fechar: () => Promise<void> }> {
  const raiz = path.resolve(pasta);
  const servidor: Server = createServer(async (req, res) => {
    try {
      const nome = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname).replace(/^\/+/, "");
      const arquivo = path.resolve(raiz, nome);
      if (!arquivo.startsWith(raiz + path.sep)) throw new Error("fora da pasta");
      const { size } = await stat(arquivo);
      const cabecalho = { "Content-Type": tipoMime(arquivo), "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*" };
      const faixa = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
      if (faixa) {
        const inicio = faixa[1] ? Number(faixa[1]) : size - Number(faixa[2]);
        const fim = faixa[1] && faixa[2] ? Math.min(Number(faixa[2]), size - 1) : size - 1;
        res.writeHead(206, { ...cabecalho, "Content-Range": `bytes ${inicio}-${fim}/${size}`, "Content-Length": fim - inicio + 1 });
        createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
      } else {
        res.writeHead(200, { ...cabecalho, "Content-Length": size });
        createReadStream(arquivo).pipe(res);
      }
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
  const { port } = servidor.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}/`, fechar: () => new Promise((ok) => servidor.close(() => ok())) };
}

/** Renderiza o vídeo UGC; `pasta` é onde estão as mídias citadas nos blocos. */
export async function renderizarUgc(props: Omit<PropsUgc, "base">, pasta: string, destino: string): Promise<string> {
  const { base, fechar } = await servirPasta(pasta);
  try {
    // CRF 20: arquivo menor que o padrão, para caber no limite de 50 MB do Telegram.
    return await renderizar("Ugc", { ...props, base } as Record<string, unknown>, destino, 20);
  } finally {
    await fechar();
  }
}
