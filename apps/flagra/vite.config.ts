import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";

const raiz = fileURLToPath(new URL("../..", import.meta.url));

/** POST /api/legenda: o navegador manda a descrição (e um quadro da mídia) e recebe a legenda do Claude. */
function apiLegenda(): Plugin {
  const lerCorpo = (req: IncomingMessage, limite = 8 * 1024 * 1024) =>
    new Promise<string>((ok, erro) => {
      let tamanho = 0;
      const partes: Buffer[] = [];
      req.on("data", (p: Buffer) => {
        tamanho += p.length;
        if (tamanho > limite) erro(new Error("Arquivo grande demais"));
        else partes.push(p);
      });
      req.on("end", () => ok(Buffer.concat(partes).toString("utf8")));
      req.on("error", erro);
    });

  const responder = (res: ServerResponse, status: number, corpo: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(corpo));
  };

  const rota: Connect.NextHandleFunction = async (req, res) => {
    if (req.method !== "POST") return responder(res, 405, { erro: "Use POST" });
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      return responder(res, 503, { erro: "IA desligada: preencha ANTHROPIC_API_KEY no .env" });
    }
    try {
      const { gerarLegenda } = await import("./server/legenda");
      const pedido = JSON.parse(await lerCorpo(req));
      responder(res, 200, await gerarLegenda(pedido));
    } catch (e) {
      console.error("[api/legenda]", e);
      responder(res, 500, { erro: e instanceof Error ? e.message : "Erro ao gerar a legenda" });
    }
  };

  return {
    name: "api-legenda",
    configureServer: (s) => void s.middlewares.use("/api/legenda", rota),
    configurePreviewServer: (s) => void s.middlewares.use("/api/legenda", rota),
  };
}

export default defineConfig(({ mode }) => {
  // A chave do Claude pode ficar no .env da raiz do repositório (o mesmo da fábrica) ou no do app.
  for (const pasta of [raiz, process.cwd()]) {
    for (const [k, v] of Object.entries(loadEnv(mode, pasta, ""))) process.env[k] ??= v;
  }
  return { plugins: [react(), apiLegenda()] };
});
