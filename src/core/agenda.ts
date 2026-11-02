// Horários de publicação no Instagram (hora local, definida pela variável TZ).
// Reels e carrosséis se alternam a cada 1h30 para a conta não postar dois conteúdos colados:
// 09:00 🎬 · 10:30 🖼 · 12:00 🎬 · 13:30 🖼 · 15:00 🎬 · 16:30 🖼 · 18:00 🎬 · 19:30 🖼 · 21:00 🎬 · 22:00 🖼
// Para mais de 5 por dia de um formato, acrescente horários na lista dele.
export const HORARIOS = {
  reel: ["09:00", "12:00", "15:00", "18:00", "21:00"],
  carrossel: ["10:30", "13:30", "16:30", "19:30", "22:00"],
} as const;

export type FormatoPost = keyof typeof HORARIOS;

/**
 * Próximo horário livre a partir de `agora` (com 10 minutos de folga para o upload).
 * Um horário fica ocupado quando já há outra peça da mesma vertical e do mesmo formato marcada para ele.
 */
export function proximoHorario(agora: Date, ocupados: Date[], horarios: readonly string[] = HORARIOS.reel): Date {
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
