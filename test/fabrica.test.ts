import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Fluxo completo com as integrações externas simuladas: produzir → aprovar → agendar → publicar.

const enviados = vi.hoisted(() => ({ videos: [] as string[], mensagens: [] as string[], reels: [] as string[] }));
const revisoes = vi.hoisted(() => ({ fila: [] as boolean[] }));

vi.mock("../src/coleta", () => ({
  coletar: async () => ({
    noticias: [{ fonte: "Fonte X", titulo: "Notícia", url: "https://ex.com/a", resumo: "Resumo", publicadaEm: new Date().toISOString() }],
    dados: [],
    falhas: ["RSS Fonte Y: 403"],
  }),
  textoDoArtigo: async () => "Texto do artigo",
}));

vi.mock("../src/agentes", () => ({
  escolherPautas: async (_v: unknown, c: any) => [{ noticias: c.noticias, dados: [], angulo: "Ângulo" }],
  materialDaPauta: () => "material",
  escreverPeca: async () => ({
    titulo: "Peça de teste",
    roteiro: { cenas: [{ tipo: "abertura", chamada: "Oi", subtitulo: null, duracaoSeg: 3 }, { tipo: "encerramento", cta: "Assine", duracaoSeg: 3 }] },
    legenda: "Legenda",
    blocoNewsletter: "Bloco",
  }),
  revisar: async () => {
    const aprovado = revisoes.fila.shift() ?? true;
    return { aprovado, problemas: aprovado ? [] : ["número inventado"] };
  },
  escreverNewsletter: async () => ({ assunto: "A", subtitulo: "S", abertura: "Oi", secoes: [], blocoApp: "App", despedida: "Tchau" }),
}));

vi.mock("../src/video/render", () => ({ renderizarReel: async (_p: unknown, destino: string) => destino }));
vi.mock("../src/publicacao/armazenamento", () => ({ enviarParaPublico: async (a: string) => `https://cdn.ex.com/${a}` }));
vi.mock("../src/publicacao/instagram", () => ({
  credenciaisInstagram: () => ({ usuario: "1", token: "t" }),
  publicarReel: async (_v: unknown, url: string) => {
    enviados.reels.push(url);
    return { id: "ig1", permalink: "https://instagram.com/reel/1" };
  },
}));
vi.mock("../src/publicacao/telegram", () => ({
  telegramConfigurado: () => true,
  botoesAprovacao: (id: string) => ({ id }),
  enviarVideo: async (arquivo: string) => {
    enviados.videos.push(arquivo);
  },
  enviarDocumento: async () => {},
  enviarMensagem: async (t: string) => {
    enviados.mensagens.push(t);
  },
  alertar: async (e: unknown) => {
    throw e;
  },
}));

let fabrica: typeof import("../src/fabrica");
let estado: typeof import("../src/core/estado");
let verticais: typeof import("../verticais").verticais;

beforeAll(async () => {
  process.env.FABRICA_DADOS = await mkdtemp(path.join(tmpdir(), "fabrica-"));
  fabrica = await import("../src/fabrica");
  estado = await import("../src/core/estado");
  verticais = (await import("../verticais")).verticais;
});

beforeEach(() => {
  enviados.videos.length = enviados.mensagens.length = enviados.reels.length = 0;
  revisoes.fila = [];
});

describe("fábrica", () => {
  it("produz um vídeo por vertical, manda para aprovação e publica no horário", async () => {
    await fabrica.rodarDiario(verticais);
    expect(enviados.videos).toHaveLength(3);
    expect(enviados.mensagens.at(-1)).toContain("Fontes com problema");

    const pendentes = await estado.listarPecas((p) => p.status === "aguardando");
    expect(pendentes).toHaveLength(3);
    expect(pendentes[0].legenda).toContain("#");

    const [p1, p2] = pendentes;
    expect(await fabrica.aprovar(p1.id)).toContain("Aprovado");
    expect(await fabrica.aprovar(p1.id)).toContain("já está");
    expect(await fabrica.rejeitar(p2.id)).toContain("Rejeitado");

    // Antecipa o horário para testar a publicação.
    await estado.atualizarPeca(p1.id, { agendadaPara: new Date(Date.now() - 1000).toISOString() });
    expect(await fabrica.publicarVencidas()).toBe(1);
    expect((await estado.lerPeca(p1.id))?.status).toBe("publicada");
    expect(enviados.reels).toHaveLength(1);
  });

  it("reescreve uma vez quando o revisor reprova e descarta se reprovar de novo", async () => {
    const [cockpit] = verticais;
    revisoes.fila = [false, true];
    await fabrica.rodarDiario([cockpit]);
    expect(enviados.videos).toHaveLength(1);

    revisoes.fila = [false, false];
    await fabrica.rodarDiario([cockpit]);
    expect(enviados.videos).toHaveLength(1);
    expect(enviados.mensagens.some((m) => m.includes("descartada"))).toBe(true);
  });
});
