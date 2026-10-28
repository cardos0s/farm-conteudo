import { describe, expect, it } from "vitest";
import { FPS, duracaoTotal, normalizarRoteiro, type Roteiro } from "../src/core/roteiro";
import { exemplos } from "../remotion/exemplos";
import { verticais } from "../verticais";
import { linkRastreado } from "../src/core/vertical";

describe("roteiro", () => {
  it("põe abertura no início, encerramento no fim e limita durações e listas", () => {
    const r: Roteiro = {
      cenas: [
        { tipo: "encerramento", cta: "Assine", duracaoSeg: 30 },
        { tipo: "ranking", titulo: "T", itens: Array.from({ length: 9 }, (_, i) => ({ nome: `${i}`, valor: "1" })), duracaoSeg: 4 },
        { tipo: "abertura", chamada: "Oi", subtitulo: null, duracaoSeg: 0.5 },
      ],
    };
    const n = normalizarRoteiro(r);
    expect(n.cenas.map((c) => c.tipo)).toEqual(["abertura", "ranking", "encerramento"]);
    expect(n.cenas[0].duracaoSeg).toBe(2);
    expect(n.cenas[2].duracaoSeg).toBe(8);
    expect(n.cenas[1].tipo === "ranking" && n.cenas[1].itens.length).toBe(5);
    expect(duracaoTotal(n)).toBe((2 + 4 + 8) * FPS);
  });

  it("os exemplos das três marcas ficam entre 10 e 40 segundos", () => {
    for (const e of Object.values(exemplos)) {
      const s = duracaoTotal(e.roteiro) / FPS;
      expect(s).toBeGreaterThanOrEqual(10);
      expect(s).toBeLessThanOrEqual(40);
    }
  });
});

describe("verticais", () => {
  it("as três estão configuradas com marca e link rastreado", () => {
    expect(verticais.map((v) => v.id).sort()).toEqual(["cockpit", "focca", "rebanho"]);
    for (const v of verticais) {
      const url = new URL(linkRastreado(v, "newsletter"));
      expect(url.searchParams.get("utm_campaign")).toBe(`${v.id}-fabrica`);
      expect(v.fontes.rss.length).toBeGreaterThan(0);
      expect(v.regras.length).toBeGreaterThan(0);
    }
  });
});
