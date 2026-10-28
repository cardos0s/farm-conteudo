import { describe, expect, it } from "vitest";
import { proximoHorario } from "../src/core/agenda";

const em = (s: string) => new Date(s);

describe("proximoHorario", () => {
  it("pega o próximo horário do dia com folga de 10 minutos", () => {
    expect(proximoHorario(em("2026-10-28T08:55:00"), [])).toEqual(em("2026-10-28T12:00:00"));
    expect(proximoHorario(em("2026-10-28T08:40:00"), [])).toEqual(em("2026-10-28T09:00:00"));
  });

  it("pula horários já ocupados pela mesma vertical", () => {
    const ocupados = [em("2026-10-28T12:00:00"), em("2026-10-28T15:00:00")];
    expect(proximoHorario(em("2026-10-28T10:00:00"), ocupados)).toEqual(em("2026-10-28T18:00:00"));
  });

  it("passa para o dia seguinte depois das 21h", () => {
    expect(proximoHorario(em("2026-10-28T21:30:00"), [])).toEqual(em("2026-10-29T09:00:00"));
  });
});
