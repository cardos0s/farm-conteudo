import type { Vertical } from "../core/vertical";

// Criação de posts pela API v2 do Beehiiv. A rota de criação de posts não está liberada em todos os
// planos; quando a API recusa, o bot manda o HTML pronto no Telegram para colar no editor.

export function publicacaoBeehiiv(v: Vertical): string | null {
  return process.env[`BEEHIIV_${v.id.toUpperCase()}_PUB_ID`] || null;
}

export async function publicarNewsletter(
  v: Vertical,
  edicao: { assunto: string; subtitulo: string; html: string },
): Promise<{ id: string; url?: string }> {
  const pub = publicacaoBeehiiv(v);
  const chave = process.env.BEEHIIV_API_KEY;
  if (!pub || !chave) throw new Error(`Beehiiv de ${v.app.nome} não configurado`);
  const r = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: edicao.assunto,
      subtitle: edicao.subtitulo,
      body_content: edicao.html,
      status: "confirmed",
      email_settings: { email_subject_line: edicao.assunto, email_preview_text: edicao.subtitulo },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const j = (await r.json().catch(() => ({}))) as any;
  if (!r.ok) throw new Error(`Beehiiv ${r.status}: ${JSON.stringify(j.errors ?? j).slice(0, 300)}`);
  return { id: j.data?.id, url: j.data?.web_url };
}
