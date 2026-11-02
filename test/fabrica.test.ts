import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Fluxo completo com as integrações externas simuladas: produzir → aprovar → agendar → publicar.

const enviados = vi.hoisted(() => ({
  videos: [] as string[],
  albuns: [] as string[][],
  mensagens: [] as string[],
  reels: [] as string[],
  carrosseis: [] as string[][],
}));
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
  // Devolve exatamente o que foi encomendado de cada formato.
  escolherPautas: async (_v: unknown, c: any, _r: unknown, encomenda: { reel: number; carrossel: number }) => [
    ...Array.from({ length: encomenda.reel }, (_, i) => ({ formato: "reel", noticias: c.noticias, dados: [], angulo: `Reel ${i}` })),
    ...Array.from({ length: encomenda.carrossel }, (_, i) => ({ formato: "carrossel", noticias: c.noticias, dados: [], angulo: `Carrossel ${i}` })),
  ],
  materialDaPauta: () => "material",
  escreverPeca: async () => ({
    titulo: "Reel de teste",
    roteiro: { cenas: [{ tipo: "abertura", chamada: "Oi", subtitulo: null, duracaoSeg: 3 }, { tipo: "encerramento", cta: "Assine", duracaoSeg: 3 }] },
    legenda: "Legenda",
    blocoNewsletter: "Bloco",
  }),
  escreverCarrossel: async () => ({
    titulo: "Carrossel de teste",
    carrossel: {
      slides: [
        { tipo: "fechamento", titulo: "Fim", cta: "Assine" },
        { tipo: "texto", titulo: "Meio", texto: "Texto", fonte: "Fonte X" },
        { tipo: "capa", titulo: "Capa", subtitulo: null },
      ],
    },
    legenda: "Legenda do carrossel",
    blocoNewsletter: "Bloco",
  }),
  revisar: async () => {
    const aprovado = revisoes.fila.shift() ?? true;
    return { aprovado, problemas: aprovado ? [] : ["número inventado"] };
  },
  escreverNewsletter: async () => ({ assunto: "A", subtitulo: "S", abertura: "Oi", secoes: [], blocoApp: "App", despedida: "Tchau" }),
}));

vi.mock("../src/video/render", () => ({
  renderizarReel: async (_p: unknown, destino: string) => destino,
  renderizarCarrossel: async (_m: unknown, c: any, pasta: string, id: string) => c.slides.map((_: unknown, i: number) => `${pasta}/${id}-0${i + 1}.jpg`),
}));
vi.mock("../src/publicacao/armazenamento", () => ({ enviarParaPublico: async (a: string) => `https://cdn.ex.com/${a}` }));
vi.mock("../src/publicacao/instagram", () => ({
  credenciaisInstagram: () => ({ usuario: "1", token: "t" }),
  publicarReel: async (_v: unknown, url: string) => {
    enviados.reels.push(url);
    return { id: "ig1", permalink: "https://instagram.com/reel/1" };
  },
  publicarCarrossel: async (_v: unknown, urls: string[]) => {
    enviados.carrosseis.push(urls);
    return { id: "ig2", permalink: "https://instagram.com/p/2" };
  },
}));
vi.mock("../src/publicacao/telegram", () => ({
  telegramConfigurado: () => true,
  botoesAprovacao: (id: string) => ({ id }),
  botaoCancelar: (id: string) => ({ cancelar: id }),
  enviarVideo: async (arquivo: string) => {
    enviados.videos.push(arquivo);
  },
  enviarAlbum: async (arquivos: string[]) => {
    enviados.albuns.push(arquivos);
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
let agenda: typeof import("../src/core/agenda");
let verticais: typeof import("../verticais").verticais;
let dir: string;

beforeAll(async () => {
  dir = process.env.FABRICA_DADOS = await mkdtemp(path.join(tmpdir(), "fabrica-"));
  fabrica = await import("../src/fabrica");
  estado = await import("../src/core/estado");
  agenda = await import("../src/core/agenda");
  verticais = (await import("../verticais")).verticais;
});

beforeEach(async () => {
  for (const lista of Object.values(enviados)) lista.length = 0;
  revisoes.fila = [];
  await rm(path.join(dir, "pecas"), { recursive: true, force: true });
});

const hora = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

describe("fábrica", () => {
  it("produz 5 Reels e 5 carrosséis por app e manda tudo para aprovação", async () => {
    await fabrica.rodarDiario(verticais);
    expect(enviados.videos).toHaveLength(15);
    expect(enviados.albuns).toHaveLength(15);
    // O carrossel chega com capa primeiro e fechamento por último, um arquivo por slide.
    expect(enviados.albuns[0]).toHaveLength(3);

    const resumo = enviados.mensagens.at(-1)!;
    expect(resumo).toContain("5/5 Reels e 5/5 carrosséis");
    expect(resumo).toContain("/aprovar_tudo");
    expect(resumo).toContain("Fontes com problema");

    const carrossel = (await estado.listarPecas((p) => p.tipo === "carrossel"))[0];
    expect(carrossel.slides!.map((s) => s.tipo)).toEqual(["capa", "texto", "fechamento"]);
    expect(carrossel.legenda).toContain("#");
  });

  it("não produz de novo enquanto a fila do dia estiver cheia", async () => {
    const [cockpit] = verticais;
    await fabrica.rodarDiario([cockpit]);
    enviados.videos.length = enviados.albuns.length = 0;
    await fabrica.rodarDiario([cockpit]);
    expect(enviados.videos).toHaveLength(0);
    expect(enviados.albuns).toHaveLength(0);
    expect(enviados.mensagens.at(-1)).toContain("fila cheia");
  });

  it("/aprovar_tudo distribui Reels e carrosséis nos horários de cada formato", async () => {
    const [cockpit] = verticais;
    await fabrica.rodarDiario([cockpit]);
    const resposta = await fabrica.aprovarTudo();
    expect(resposta).toContain("10 peça(s) aprovadas");
    expect(resposta).toContain("5 Reels e 5 carrosséis");

    const agendadas = await estado.listarPecas((p) => p.status === "aprovada");
    expect(agendadas).toHaveLength(10);
    for (const p of agendadas) {
      const lista: readonly string[] = agenda.HORARIOS[p.tipo as "reel" | "carrossel"];
      expect(lista).toContain(hora(p.agendadaPara!));
    }
    // Nenhum horário repetido dentro do mesmo formato.
    for (const tipo of ["reel", "carrossel"]) {
      const horarios = agendadas.filter((p) => p.tipo === tipo).map((p) => p.agendadaPara);
      expect(new Set(horarios).size).toBe(5);
    }
    expect(await fabrica.aprovarTudo()).toContain("Nada esperando");
  });

  it("aprova, cancela e publica Reel e carrossel no horário", async () => {
    const [cockpit] = verticais;
    await fabrica.rodarDiario([cockpit]);
    const reels = await estado.listarPecas((p) => p.tipo === "reel");
    const [carrossel] = await estado.listarPecas((p) => p.tipo === "carrossel");

    expect(await fabrica.aprovar(reels[0].id)).toContain("O Reel vai para o Instagram");
    expect(await fabrica.aprovar(reels[0].id)).toContain("já está");
    expect(await fabrica.aprovar(carrossel.id)).toContain("O carrossel vai para o Instagram");
    expect(await fabrica.rejeitar(reels[1].id)).toContain("Rejeitado");

    // Cancelar um post agendado libera o horário dele.
    expect(await fabrica.aprovar(reels[2].id)).toContain("Aprovado");
    expect(await fabrica.rejeitar(reels[2].id)).toContain("Cancelado");
    expect((await estado.lerPeca(reels[2].id))?.agendadaPara).toBeUndefined();

    // Antecipa os horários para testar a publicação.
    const antes = new Date(Date.now() - 1000).toISOString();
    await estado.atualizarPeca(reels[0].id, { agendadaPara: antes });
    await estado.atualizarPeca(carrossel.id, { agendadaPara: antes });
    expect(await fabrica.publicarVencidas()).toBe(2);
    expect((await estado.lerPeca(carrossel.id))?.status).toBe("publicada");
    expect(enviados.reels).toHaveLength(1);
    expect(enviados.carrosseis[0]).toHaveLength(3);
    expect(enviados.carrosseis[0][0]).toMatch(/^https:\/\/cdn\.ex\.com\/.+-01\.jpg$/);

    const status = await fabrica.statusTexto();
    expect(status).toContain("🎬 Reels: 1 no ar");
    expect(status).toContain("🖼 Carrosséis: 1 no ar");
  });

  it("peças sem aprovação expiram e liberam a produção do dia seguinte", async () => {
    const [cockpit] = verticais;
    await fabrica.rodarDiario([cockpit]);
    for (const p of await estado.listarPecas()) {
      await estado.atualizarPeca(p.id, { criadaEm: new Date(Date.now() - 25 * 3600_000).toISOString() });
    }
    enviados.videos.length = 0;
    await fabrica.rodarDiario([cockpit]);
    expect(enviados.videos).toHaveLength(5);
    expect(enviados.mensagens.at(-1)).toContain("10 peça(s) de ontem expiraram");
  });

  it("na aprovação automática a peça já entra na agenda e chega só com o botão de cancelar", async () => {
    const [cockpit] = verticais;
    const auto = { ...cockpit, volume: { ...cockpit.volume, reelsPorDia: 1, carrosseisPorDia: 1, aprovacao: "automatica" as const } };
    await fabrica.rodarDiario([auto]);
    const pecas = await estado.listarPecas();
    expect(pecas).toHaveLength(2);
    expect(pecas.every((p) => p.status === "aprovada" && !!p.agendadaPara)).toBe(true);
    expect(enviados.mensagens.some((m) => m.includes("Já agendado"))).toBe(true);
    expect(enviados.mensagens.at(-1)).not.toContain("/aprovar_tudo");
  });

  it("reescreve uma vez quando o revisor reprova e descarta se reprovar de novo", async () => {
    const [cockpit] = verticais;
    const umReel = { ...cockpit, volume: { ...cockpit.volume, reelsPorDia: 1, carrosseisPorDia: 0 } };
    revisoes.fila = [false, true];
    await fabrica.rodarDiario([umReel]);
    expect(enviados.videos).toHaveLength(1);

    await rm(path.join(dir, "pecas"), { recursive: true, force: true });
    revisoes.fila = [false, false];
    await fabrica.rodarDiario([umReel]);
    expect(enviados.videos).toHaveLength(1);
    expect(enviados.mensagens.some((m) => m.includes("descartada"))).toBe(true);
  });
});
