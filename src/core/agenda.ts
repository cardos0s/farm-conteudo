// Horários de publicação no Instagram (hora local, definida pela variável TZ).
// 08:00 🎬 · 10:00 🖼 · 12:00 🎬 · 13:00 🖼 · 18:00 🎬 · 19:00 🖼
// Para postar mais (ou menos) de um formato por dia, acrescente (ou tire) horários da lista dele.
export const HORARIOS = {
  reel: ["08:00", "12:00", "18:00"],
  carrossel: ["10:00", "13:00", "19:00"],
} as const;

/** Até onde a agenda vai: dá para carregar vários meses de conteúdo de uma vez. */
const DIAS_DE_AGENDA = 366;

export type FormatoPost = keyof typeof HORARIOS;

/**
 * Próximo horário livre a partir de `agora` (com 10 minutos de folga para o upload).
 * Um horário fica ocupado quando já há outra peça da mesma vertical e do mesmo formato marcada para ele.
 */
export function proximoHorario(agora: Date, ocupados: Date[], horarios: readonly string[] = HORARIOS.reel): Date {
  const minimo = agora.getTime() + 10 * 60_000;
  const tomados = new Set(ocupados.map((d) => d.getTime()));
  for (let dia = 0; dia < DIAS_DE_AGENDA; dia++) {
    for (const h of horarios) {
      const [hh, mm] = h.split(":").map(Number);
      const t = new Date(agora);
      t.setDate(t.getDate() + dia);
      t.setHours(hh, mm, 0, 0);
      if (t.getTime() >= minimo && !tomados.has(t.getTime())) return t;
    }
  }
  throw new Error(`Agenda cheia pelos próximos ${DIAS_DE_AGENDA} dias`);
}
