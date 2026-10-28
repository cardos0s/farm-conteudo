// Horários de publicação no Instagram (hora local, definida pela variável TZ).
export const HORARIOS_PADRAO = ["09:00", "12:00", "15:00", "18:00", "21:00"];

/**
 * Próximo horário livre a partir de `agora` (com 10 minutos de folga para o upload).
 * Um horário fica ocupado quando já há outra peça da mesma vertical marcada para ele.
 */
export function proximoHorario(agora: Date, ocupados: Date[], horarios = HORARIOS_PADRAO): Date {
  const minimo = agora.getTime() + 10 * 60_000;
  const tomados = new Set(ocupados.map((d) => d.getTime()));
  for (let dia = 0; dia < 30; dia++) {
    for (const h of horarios) {
      const [hh, mm] = h.split(":").map(Number);
      const t = new Date(agora);
      t.setDate(t.getDate() + dia);
      t.setHours(hh, mm, 0, 0);
      if (t.getTime() >= minimo && !tomados.has(t.getTime())) return t;
    }
  }
  throw new Error("Agenda cheia pelos próximos 30 dias");
}
