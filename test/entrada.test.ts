import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Conteúdo pronto: arquivos na pasta de entrada → agenda → Instagram, com as integrações externas simuladas.

const enviados = vi.hoisted(() => ({ mensagens: [] as string[], reels: [] as { arquivo?: string; url?: string }[], carrosseis: [] as string[][] }));
const config = vi.hoisted(() => ({ armazenamento: true }));

vi.mock("../src/video/render", () => ({ renderizarReel: async () => "", renderizarCarrossel: async () => [] }));
vi.mock("../src/publicacao/armazenamento", () => ({
  armazenamentoConfigurado: () => config.armazenamento,
  enviarParaPublico: async (a: string) => `https://cdn.ex.com/${path.basename(a)}`,
}));
vi.mock("../src/publicacao/instagram", () => ({
  credenciaisInstagram: () => ({ usuario: "1", token: "t" }),
  uploadDiretoDeVideo: () => true,
  publicarReel: async (_v: unknown, video: { arquivo?: string; url?: string }) => {
    enviados.reels.push(video);
    return { id: "ig1" };
  },
  publicarCarrossel: async (_v: unknown, urls: string[]) => {
    enviados.carrosseis.push(urls);
    return { id: "ig2" };
  },
}));
vi.mock("../src/publicacao/telegram", () => ({
  telegramConfigurado: () => true,
  botoesAprovacao: (id: string) => ({ id }),
  botaoCancelar: (id: string) => ({ cancelar: id }),
  enviarVideo: async () => {},
  enviarAlbum: async () => {},
  enviarDocumento: async () => {},
  enviarMensagem: async (t: string) => {
    enviados.mensagens.push(t);
  },
  alertar: async (e: unknown) => {
    throw e;
  },
}));

let entrada: typeof import("../src/entrada");
let fabrica: typeof import("../src/fabrica");
let estado: typeof import("../src/core/estado");
let rebanho: typeof import("../verticais/rebanho").default;
let raiz: string;

const DEPOIS_DA_COPIA = () => Date.now() + 10 * 60_000;
const pasta = (...p: string[]) => path.join(raiz, "entrada", "rebanho", ...p);
const hora = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

async function imagem(arquivo: string, largura = 1080, altura = 1350, formato: "png" | "jpeg" = "png") {
  await mkdir(path.dirname(arquivo), { recursive: true });
  await sharp({ create: { width: largura, height: altura, channels: 3, background: "#2F5D3A" } })[formato]().toFile(arquivo);
}

async function reel(nome: string, legenda?: string) {
  await mkdir(pasta("reels"), { recursive: true });
  await writeFile(pasta("reels", `${nome}.mp4`), "video");
  if (legenda !== undefined) await writeFile(pasta("reels", `${nome}.txt`), legenda);
}

beforeAll(async () => {
  raiz = await mkdtemp(path.join(tmpdir(), "fabrica-entrada-"));
  process.env.FABRICA_DADOS = path.join(raiz, "dados");
  process.env.FABRICA_ENTRADA = path.join(raiz, "entrada");
  process.env.FABRICA_IMPORTADOS = path.join(raiz, "importados");
  entrada = await import("../src/entrada");
  fabrica = await import("../src/fabrica");
  estado = await import("../src/core/estado");
  rebanho = (await import("../verticais/rebanho")).default;
});

beforeEach(async () => {
  for (const lista of Object.values(enviados)) lista.length = 0;
  config.armazenamento = true;
  for (const d of ["dados", "entrada", "importados"]) await rm(path.join(raiz, d), { recursive: true, force: true });
});

describe("pasta de entrada", () => {
  it("agenda Reels e carrosséis nos horários de cada formato e tira da pasta", async () => {
    await reel("01-pasto", "Legenda do Reel #pecuaria");
    await imagem(pasta("carrosseis", "01-chuva", "1.png"));
    await imagem(pasta("carrosseis", "01-chuva", "2.png"));
    await imagem(pasta("carrosseis", "01-chuva", "3.jpg"), 1080, 1080, "jpeg");
    await writeFile(pasta("carrosseis", "01-chuva", "legenda.txt"), "Legenda do carrossel");

    expect(await entrada.importarEntrada([rebanho], DEPOIS_DA_COPIA())).toBe(2);

    const pecas = await estado.listarPecas();
    const r = pecas.find((p) => p.tipo === "reel")!;
    const c = pecas.find((p) => p.tipo === "carrossel")!;
    expect(r.status).toBe("aprovada");
    expect(hora(r.agendadaPara!)).toBe("12:00");
    expect(hora(c.agendadaPara!)).toBe("19:00");
    expect(r.legenda).toBe("Legenda do Reel #pecuaria");
    expect(c.legenda).toBe("Legenda do carrossel");

    // As imagens viram JPEG, na ordem dos nomes.
    expect(c.imagens).toHaveLength(3);
    for (const img of c.imagens!) expect((await sharp(img).metadata()).format).toBe("jpeg");

    // A pasta de entrada fica vazia e cada item gera um aviso com o botão de cancelar.
    expect(await readdir(pasta("reels"))).toEqual([]);
    expect(await readdir(pasta("carrosseis"))).toEqual([]);
    expect(enviados.mensagens.filter((m) => m.includes("agendado para"))).toHaveLength(2);

    // No horário, publica.
    const antes = new Date(Date.now() - 1000).toISOString();
    for (const p of pecas) await estado.atualizarPeca(p.id, { agendadaPara: antes });
    expect(await fabrica.publicarVencidas()).toBe(2);
    // O Reel vai direto do disco, sem passar pelo armazenamento público.
    expect(enviados.reels).toEqual([{ arquivo: r.videoPath }]);
    expect(enviados.carrosseis[0]).toHaveLength(3);
    expect(enviados.carrosseis[0][0]).toMatch(/-01\.jpg$/);
  });

  it("posta na ordem dos números do nome (2 antes de 10)", async () => {
    await reel("10-b", "b");
    await reel("2-a", "a");
    await reel("1-c", "c");
    await entrada.importarEntrada([rebanho], DEPOIS_DA_COPIA());
    const ordem = (await estado.listarPecas()).sort((a, b) => a.agendadaPara!.localeCompare(b.agendadaPara!)).map((p) => p.titulo);
    expect(ordem).toEqual(["1-c.mp4", "2-a.mp4", "10-b.mp4"]);
  });

  it("espera a cópia terminar antes de importar", async () => {
    await reel("01-pasto", "Legenda");
    expect(await entrada.importarEntrada([rebanho], Date.now())).toBe(0);
    expect(await readdir(pasta("reels"))).toHaveLength(2);
  });

  it("avisa quando o Reel vem sem legenda, mas agenda", async () => {
    await reel("01-sem-texto");
    expect(await entrada.importarEntrada([rebanho], DEPOIS_DA_COPIA())).toBe(1);
    expect(enviados.mensagens[0]).toContain("Sem legenda");
  });

  it("separa o que o Instagram recusaria, explicando o motivo", async () => {
    await imagem(pasta("carrosseis", "01-uma-foto", "1.png"));
    await imagem(pasta("carrosseis", "02-stories", "1.png"), 1080, 1920);
    await imagem(pasta("carrosseis", "02-stories", "2.png"), 1080, 1920);
    await reel("03-longo", "x".repeat(2300));

    expect(await entrada.importarEntrada([rebanho], DEPOIS_DA_COPIA())).toBe(0);
    const problemas = await readdir(pasta("com-problema"));
    expect(problemas).toEqual(expect.arrayContaining(["01-uma-foto", "02-stories", "03-longo.mp4", "03-longo.txt"]));
    expect(await readFile(pasta("com-problema", "01-uma-foto.problema.txt"), "utf8")).toContain("de 2 a 20");
    expect(await readFile(pasta("com-problema", "02-stories.problema.txt"), "utf8")).toContain("4:5");
    expect(enviados.mensagens.filter((m) => m.includes("não entrou na agenda"))).toHaveLength(3);

    // Na rodada seguinte não alerta de novo.
    enviados.mensagens.length = 0;
    await entrada.importarEntrada([rebanho], DEPOIS_DA_COPIA());
    expect(enviados.mensagens).toHaveLength(0);
  });

  it("sem armazenamento público, posta Reels e separa os carrosséis explicando o motivo", async () => {
    config.armazenamento = false;
    await reel("01-pasto", "Legenda");
    await imagem(pasta("carrosseis", "01-chuva", "1.png"));
    await imagem(pasta("carrosseis", "01-chuva", "2.png"));

    expect(await entrada.importarEntrada([rebanho], DEPOIS_DA_COPIA())).toBe(1);
    expect(await readFile(pasta("com-problema", "01-chuva.problema.txt"), "utf8")).toContain("armazenamento público");

    const [r] = await estado.listarPecas();
    await estado.atualizarPeca(r.id, { agendadaPara: new Date(Date.now() - 1000).toISOString() });
    expect(await fabrica.publicarVencidas()).toBe(1);
    expect(enviados.reels).toEqual([{ arquivo: r.videoPath }]);
  });
});
