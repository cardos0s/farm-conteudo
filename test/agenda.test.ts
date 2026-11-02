import { describe, expect, it } from "vitest";
import { HORARIOS, proximoHorario } from "../src/core/agenda";

const em = (s: string) => new Date(s);

describe("proximoHorario", () => {
  it("um Reel às 12h e um carrossel às 19h por dia", () => {
    expect(HORARIOS.reel).toEqual(["12:00"]);
    expect(HORARIOS.carrossel).toEqual(["19:00"]);
  });

  it("pega o horário do dia com folga de 10 minutos", () => {
    expect(proximoHorario(em("2026-10-28T11:40:00"), [])).toEqual(em("2026-10-28T12:00:00"));
    expect(proximoHorario(em("2026-10-28T11:55:00"), [])).toEqual(em("2026-10-29T12:00:00"));
  });

  it("pula dias já ocupados", () => {
    const ocupados = [em("2026-10-28T12:00:00"), em("2026-10-29T12:00:00")];
    expect(proximoHorario(em("2026-10-28T08:00:00"), ocupados)).toEqual(em("2026-10-30T12:00:00"));
  });

  it("carrossel usa o próprio horário", () => {
    expect(proximoHorario(em("2026-10-28T13:00:00"), [], HORARIOS.carrossel)).toEqual(em("2026-10-28T19:00:00"));
    expect(proximoHorario(em("2026-10-28T19:30:00"), [], HORARIOS.carrossel)).toEqual(em("2026-10-29T19:00:00"));
  });

  it("os 35 Reels prontos enchem os próximos 35 dias, um por dia", () => {
    const agora = em("2026-10-28T20:00:00");
    const ocupados: Date[] = [];
    for (let i = 0; i < 35; i++) ocupados.push(proximoHorario(agora, ocupados));
    expect(ocupados[0]).toEqual(em("2026-10-29T12:00:00"));
    expect(ocupados.at(-1)).toEqual(em("2026-12-02T12:00:00"));
  });

  it("aguenta vários meses de conteúdo carregados de uma vez", () => {
    const agora = em("2026-10-28T20:00:00");
    const ocupados: Date[] = [];
    for (let i = 0; i < 200; i++) ocupados.push(proximoHorario(agora, ocupados));
    expect(ocupados.at(-1)).toEqual(em("2027-05-16T12:00:00"));
  });
});
