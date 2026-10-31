import { describe, expect, it } from "vitest";
import { exemploUgc } from "../remotion/exemplos";
import { agruparPalavras, duracaoUgc, EstiloSchema, palavrasDoAlinhamento, palavrasEstimadas } from "../src/ugc/formato";
import estilo from "../estilos/exemplo/estilo.json";
import { PersonaSchema } from "../src/ugc/persona";
import persona from "../personas/exemplo/persona.json";
import { FPS } from "../src/core/roteiro";

describe("ugc", () => {
  it("transforma o alinhamento por caractere em palavras com tempo", () => {
    const texto = "Oi, gente! Tudo bem?";
    const chars = [...texto];
    const p = palavrasDoAlinhamento({
      characters: chars,
      character_start_times_seconds: chars.map((_, i) => i * 0.1),
      character_end_times_seconds: chars.map((_, i) => i * 0.1 + 0.1),
    });
    expect(p.map((x) => x.texto)).toEqual(["Oi,", "gente!", "Tudo", "bem?"]);
    expect(p[1].inicio).toBeCloseTo(0.4);
    expect(p[1].fim).toBeCloseTo(1.0);
  });

  it("agrupa legendas pelo limite de palavras e quebra em pausas longas", () => {
    const ps = [
      { texto: "a", inicio: 0, fim: 0.2 },
      { texto: "b", inicio: 0.2, fim: 0.4 },
      { texto: "c", inicio: 0.4, fim: 0.6 },
      { texto: "d", inicio: 0.6, fim: 0.8 },
      { texto: "e", inicio: 1.5, fim: 1.7 },
    ];
    expect(agruparPalavras(ps, 3).map((g) => g.map((x) => x.texto).join(""))).toEqual(["abc", "d", "e"]);
  });

  it("estima o tempo das palavras cobrindo a duração toda", () => {
    const p = palavrasEstimadas("uma frase de teste", 2);
    expect(p).toHaveLength(4);
    expect(p.at(-1)!.fim).toBeCloseTo(2);
  });

  it("o estilo e a persona de exemplo estão no formato certo", () => {
    expect(EstiloSchema.safeParse(estilo).success).toBe(true);
    expect(PersonaSchema.safeParse(persona).success).toBe(true);
    expect(PersonaSchema.safeParse({ ...persona, ficticia: false }).success).toBe(false);
  });

  it("a duração do vídeo é a soma dos blocos", () => {
    expect(duracaoUgc(exemploUgc.blocos)).toBe(exemploUgc.blocos.length * 3 * FPS);
  });
});
