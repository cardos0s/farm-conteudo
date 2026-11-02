import { describe, expect, it } from "vitest";
import { HORARIOS, proximoHorario } from "../src/core/agenda";

const em = (s: string) => new Date(s);

describe("proximoHorario", () => {
  it("Reels às 8h, 12h e 18h; carrosséis às 10h, 13h e 19h", () => {
    expect(HORARIOS.reel).toEqual(["08:00", "12:00", "18:00"]);
    expect(HORARIOS.carrossel).toEqual(["10:00", "13:00", "19:00"]);
  });

  it("pega o próximo horário do dia com folga de 10 minutos", () => {
    expect(proximoHorario(em("2026-10-28T07:55:00"), [])).toEqual(em("2026-10-28T12:00:00"));
    expect(proximoHorario(em("2026-10-28T07:40:00"), [])).toEqual(em("2026-10-28T08:00:00"));
  });

  it("pula horários já ocupados pela mesma vertical", () => {
    const ocupados = [em("2026-10-28T12:00:00"), em("2026-10-28T18:00:00")];
    expect(proximoHorario(em("2026-10-28T10:00:00"), ocupados)).toEqual(em("2026-10-29T08:00:00"));
  });

  it("passa para o dia seguinte depois do último horário", () => {
    expect(proximoHorario(em("2026-10-28T18:30:00"), [])).toEqual(em("2026-10-29T08:00:00"));
    expect(proximoHorario(em("2026-10-28T19:30:00"), [], HORARIOS.carrossel)).toEqual(em("2026-10-29T10:00:00"));
  });

  it("carrosséis usam os próprios horários, sem bater com os Reels", () => {
    expect(proximoHorario(em("2026-10-28T08:05:00"), [], HORARIOS.carrossel)).toEqual(em("2026-10-28T10:00:00"));
    expect(new Set([...HORARIOS.reel, ...HORARIOS.carrossel]).size).toBe(6);
  });

  it("aguenta vários meses de conteúdo carregados de uma vez", () => {
    const agora = em("2026-10-28T20:00:00");
    const ocupados: Date[] = [];
    for (let i = 0; i < 200; i++) ocupados.push(proximoHorario(agora, ocupados));
    // 200 Reels a 3 por dia = 66 dias cheios (29/10 a 02/01) + 2: o último sai às 12h de 03/01.
    expect(ocupados.at(-1)).toEqual(em("2027-01-03T12:00:00"));
  });
});
