import { execFileSync } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Fluxo completo do UGC com as APIs pagas trocadas por mídia sintética do ffmpeg.

const chamadas = { falar: 0, imagem: 0, video: 0, lipsync: 0, sfx: 0, aprovacoes: [] as string[][] };
const ff = (...a: string[]) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
const video = (destino: string, seg = 3) =>
  ff("-f", "lavfi", "-i", `color=c=gray:s=270x480:d=${seg}`, "-f", "lavfi", "-i", `sine=d=${seg}`, "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", destino);

vi.mock("../src/ugc/agentes", () => ({
  escreverUgc: async () => ({
    titulo: "Teste UGC",
    legenda: "Primeira linha\nSegunda linha",
    roteiro: {
      blocos: [
        { papel: "gancho", fala: "Você não precisa estudar dez horas.", visual: { tipo: "persona", falandoParaCamera: true, enquadramento: "selfie", cena: "quarto", movimento: "leve" }, headline: "Oi", sfx: "pop", zoom: true },
        { papel: "demo", fala: "Olha como funciona.", visual: { tipo: "broll", cena: "mesa de estudos" }, headline: null, sfx: null, zoom: false },
      ],
    },
  }),
  revisarUgc: async () => ({ aprovado: true, problemas: [] }),
}));

vi.mock("../src/ugc/provedores", () => ({
  falar: async (_t: string, _v: unknown, destino: string) => {
    chamadas.falar++;
    ff("-f", "lavfi", "-i", "sine=d=1.5", destino);
    return null;
  },
  gerarImagem: async (_p: string, _r: string[], destino: string) => {
    chamadas.imagem++;
    ff("-f", "lavfi", "-i", "color=c=red:s=270x480", "-frames:v", "1", destino);
  },
  gerarVideo: async (o: { destino: string; duracaoSeg: number }) => {
    chamadas.video++;
    video(o.destino, o.duracaoSeg);
  },
  lipsyncConfigurado: () => false,
  sincronizarLabios: async () => {
    chamadas.lipsync++;
  },
  gerarSfx: async (_d: string, destino: string) => {
    chamadas.sfx++;
    ff("-f", "lavfi", "-i", "sine=d=0.5", destino);
  },
}));

vi.mock("../src/video/render", () => ({
  renderizarUgc: async (_p: unknown, _pasta: string, destino: string) => video(destino, 3),
}));

vi.mock("../src/publicacao/telegram", () => ({
  telegramConfigurado: () => true,
  botoesAprovacao: () => ({}),
  enviarVideo: async () => {},
  enviarDocumento: async () => {},
  enviarMensagem: async () => {},
  alertar: async (e: unknown) => {
    throw e;
  },
}));

vi.mock("../src/fabrica", () => ({
  pedirAprovacao: async (_p: unknown, _v: unknown, avisos: string[]) => {
    chamadas.aprovacoes.push(avisos);
  },
}));

let produzir: typeof import("../src/ugc/produzir");
let focca: import("../src/core/vertical").Vertical;

beforeAll(async () => {
  const raiz = process.cwd();
  const tmp = await mkdtemp(path.join(tmpdir(), "ugc-"));
  process.env.FABRICA_DADOS = path.join(tmp, "dados");
  process.env.FABRICA_PERSONAS = path.join(raiz, "personas");
  process.env.FABRICA_ESTILOS = path.join(raiz, "estilos");
  process.chdir(tmp);
  produzir = await import("../src/ugc/produzir");
  focca = (await import("../verticais")).buscarVertical("focca");
});

describe("produção UGC", () => {
  it("gera voz, quadros, vídeos e efeitos, avisa da falta de lipsync e não paga duas vezes ao continuar", async () => {
    const peca = await produzir.produzirUgc(focca, { briefing: "Mostrar o cronograma" });
    expect(peca?.formato).toBe("ugc");
    expect(peca?.legenda).toContain(produzir.ROTULO_IA);
    expect(chamadas).toMatchObject({ falar: 2, imagem: 2, video: 2, lipsync: 0, sfx: 1 });
    expect(chamadas.aprovacoes[0].join(" ")).toContain("FAL_KEY");

    await produzir.produzirUgc(focca, { continuar: peca!.id });
    expect(chamadas).toMatchObject({ falar: 2, imagem: 2, video: 2, sfx: 1 });
  }, 60_000);

  it("--so-roteiro para antes de gerar mídia", async () => {
    const antes = chamadas.falar;
    expect(await produzir.produzirUgc(focca, { briefing: "x", soRoteiro: true })).toBeNull();
    expect(chamadas.falar).toBe(antes);
  });
});
