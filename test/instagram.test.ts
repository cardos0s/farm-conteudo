import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
  ig = await import("../src/publicacao/instagram");
  rebanho = (await import("../verticais/rebanho")).default;
});

beforeEach(() => {
  // Os testes de renovação são do login do Instagram; os do login unificado trocam o host.
  process.env.IG_GRAPH_HOST = "graph.instagram.com";
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

  it("não tenta renovar no login unificado (o padrão) nem sem token", async () => {
    process.env.IG_REBANHO_TOKEN = "token-suat";
    delete process.env.IG_GRAPH_HOST;
    expect(await ig.renovarTokenInstagram(rebanho)).toBe("nao-se-aplica");
    delete process.env.IG_REBANHO_TOKEN;
    expect(await ig.renovarTokenInstagram(rebanho)).toBe("nao-se-aplica");
    expect(ig.credenciaisInstagram(rebanho)).toBeNull();
  });
});

describe("login unificado (padrão)", () => {
  beforeEach(() => {
    delete process.env.IG_GRAPH_HOST;
    delete process.env.IG_REBANHO_USER_ID;
    process.env.IG_REBANHO_TOKEN = "token-suat";
  });

  it("descobre a conta pelo token em graph.facebook.com", async () => {
    simularApi({ "me/assigned_instagram_accounts": { data: [{ id: "17841400000000001", username: "rebanho" }] } });
    expect(await ig.contaInstagram(rebanho)).toEqual({ id: "17841400000000001", username: "rebanho" });
    expect(chamadas[0]).toMatch(/^https:\/\/graph\.facebook\.com\/v26\.0\/me\/assigned_instagram_accounts\?/);
  });

  it("pede o ID quando o token dá acesso a mais de uma conta", async () => {
    simularApi({ "me/assigned_instagram_accounts": { data: [{ id: "1", username: "a" }, { id: "2", username: "b" }] } });
    await expect(ig.contaInstagram(rebanho)).rejects.toThrow(/@a \(1\), @b \(2\).*IG_REBANHO_USER_ID/);
  });

  it("explica quando o token não tem nenhuma conta", async () => {
    simularApi({ "me/assigned_instagram_accounts": { data: [] } });
    await expect(ig.contaInstagram(rebanho)).rejects.toThrow(/nenhuma conta do Instagram/);
  });

  it("usa o ID informado no .env", async () => {
    process.env.IG_REBANHO_USER_ID = "999";
    simularApi({ "/999?": { username: "rebanho" } });
    expect(await ig.contaInstagram(rebanho)).toEqual({ id: "999", username: "rebanho" });
  });

  it("publica o Reel direto do disco, sem link público (upload retomável)", async () => {
    const pasta = await mkdtemp(path.join(tmpdir(), "fabrica-reel-"));
    const arquivo = path.join(pasta, "reel.mp4");
    await writeFile(arquivo, "bytes-do-video");
    process.env.IG_REBANHO_USER_ID = "178";

    const pedidos: { url: string; metodo: string; headers: Record<string, string>; corpo: string }[] = [];
    vi.stubGlobal("fetch", async (url: string | URL, init: RequestInit = {}) => {
      const u = String(url);
      const corpo = init.body instanceof URLSearchParams ? init.body.toString() : init.body ? Buffer.from(init.body as Uint8Array).toString() : "";
      pedidos.push({ url: u, metodo: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, corpo });
      let resposta: unknown = {};
      if (u.endsWith("/178/media")) resposta = { id: "c1", uri: "https://rupload.facebook.com/ig-api-upload/v26.0/c1" };
      else if (u.startsWith("https://rupload.facebook.com/")) resposta = { success: true, message: "Upload successful." };
      else if (u.includes("/c1?")) resposta = { status_code: "FINISHED" };
      else if (u.endsWith("/178/media_publish")) resposta = { id: "m1" };
      else if (u.includes("/m1?")) resposta = { permalink: "https://instagram.com/reel/m1" };
      return new Response(JSON.stringify(resposta), { status: 200 });
    });

    ig.ritmo.escala = 0;
    try {
      expect(await ig.publicarReel(rebanho, { arquivo }, "Legenda")).toEqual({ id: "m1", permalink: "https://instagram.com/reel/m1" });
    } finally {
      ig.ritmo.escala = 1;
    }

    const [criar, enviar] = pedidos;
    expect(criar.url).toBe("https://graph.facebook.com/v26.0/178/media");
    expect(criar.corpo).toContain("upload_type=resumable");
    expect(criar.corpo).toContain("media_type=REELS");
    expect(criar.corpo).not.toContain("video_url");
    expect(enviar.url).toBe("https://rupload.facebook.com/ig-api-upload/v26.0/c1");
    expect(enviar.headers).toMatchObject({ Authorization: "OAuth token-suat", offset: "0", file_size: "14" });
    expect(enviar.corpo).toBe("bytes-do-video");
    expect(pedidos.some((p) => p.url.endsWith("/178/media_publish"))).toBe(true);
  });
});
