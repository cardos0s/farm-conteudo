import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Renovação do token e descoberta da conta, com a API do Instagram simulada.

let ig: typeof import("../src/publicacao/instagram");
let rebanho: typeof import("../verticais/rebanho").default;
const DIA = 86400_000;
const chamadas: string[] = [];

function simularApi(respostas: Record<string, unknown>) {
  vi.stubGlobal("fetch", async (url: string | URL) => {
    const u = String(url);
    chamadas.push(u);
    const chave = Object.keys(respostas).find((k) => u.includes(k));
    const corpo = chave ? respostas[chave] : { error: { message: "rota inesperada" } };
    return new Response(JSON.stringify(corpo), { status: chave ? 200 : 400 });
  });
}

beforeAll(async () => {
  process.env.FABRICA_DADOS = await mkdtemp(path.join(tmpdir(), "fabrica-ig-"));
  delete process.env.IG_GRAPH_HOST;
  ig = await import("../src/publicacao/instagram");
  rebanho = (await import("../verticais/rebanho")).default;
});

afterEach(() => {
  vi.unstubAllGlobals();
  chamadas.length = 0;
});

describe("token do Instagram", () => {
  it("registra o token do .env, renova depois de 7 dias e passa a usar o renovado", async () => {
    process.env.IG_REBANHO_TOKEN = "token-do-env";
    delete process.env.IG_REBANHO_USER_ID;
    const inicio = Date.now();
    simularApi({
      refresh_access_token: { access_token: "token-renovado", expires_in: 5184000 },
      "/me?": { user_id: "17841400000000000", username: "rebanho.app" },
    });

    expect(await ig.renovarTokenInstagram(rebanho, inicio)).toBe("em-dia");
    expect(await ig.renovarTokenInstagram(rebanho, inicio + 3 * DIA)).toBe("em-dia");
    expect(chamadas).toHaveLength(0);

    expect(await ig.renovarTokenInstagram(rebanho, inicio + 8 * DIA)).toBe("renovado");
    expect(chamadas[0]).toContain("grant_type=ig_refresh_token");
    expect(chamadas[0]).toContain("access_token=token-do-env");

    // A conta vem do próprio token, já usando o renovado.
    expect(await ig.contaInstagram(rebanho)).toEqual({ id: "17841400000000000", username: "rebanho.app" });
    expect(chamadas.at(-1)).toContain("access_token=token-renovado");
  });

  it("recomeça do token novo quando ele é trocado no .env", async () => {
    process.env.IG_REBANHO_TOKEN = "outro-token";
    simularApi({ "/me?": { user_id: "1", username: "x" } });
    expect(await ig.renovarTokenInstagram(rebanho)).toBe("em-dia");
    await ig.contaInstagram(rebanho);
    expect(chamadas.at(-1)).toContain("access_token=outro-token");
  });

  it("explica o que fazer quando a renovação falha", async () => {
    process.env.IG_REBANHO_TOKEN = "token-vencido";
    await ig.renovarTokenInstagram(rebanho, Date.now());
    simularApi({});
    await expect(ig.renovarTokenInstagram(rebanho, Date.now() + 8 * DIA)).rejects.toThrow(/gere um novo no painel da Meta/);
  });

  it("não tenta renovar no login pelo Facebook nem sem token", async () => {
    process.env.IG_GRAPH_HOST = "graph.facebook.com";
    expect(await ig.renovarTokenInstagram(rebanho)).toBe("nao-se-aplica");
    delete process.env.IG_GRAPH_HOST;
    delete process.env.IG_REBANHO_TOKEN;
    expect(await ig.renovarTokenInstagram(rebanho)).toBe("nao-se-aplica");
    expect(ig.credenciaisInstagram(rebanho)).toBeNull();
  });
});
