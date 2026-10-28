import type { Edicao } from "../agentes";
import { linkRastreado, type Vertical } from "../core/vertical";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const paragrafos = (s: string) =>
  s
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${esc(p.trim())}</p>`)
    .join("");

/** HTML simples, com estilos inline, que funciona colado no editor do Beehiiv ou enviado pela API. */
export function montarHtml(v: Vertical, e: Edicao): string {
  const c = v.marca.cores;
  const secoes = e.secoes
    .map(
      (s) => `
  <h2 style="font-size:20px;margin:28px 0 8px;color:${c.primaria}">${esc(s.titulo)}</h2>
  ${paragrafos(s.texto)}
  ${s.fonteUrl ? `<p style="margin:0 0 16px;font-size:13px"><a href="${esc(s.fonteUrl)}" style="color:#666">Fonte</a></p>` : ""}`,
    )
    .join("\n");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#222;max-width:640px;margin:0 auto">
  ${paragrafos(e.abertura)}
  ${secoes}
  <div style="margin:32px 0;padding:20px 24px;border-left:6px solid ${c.primaria};background:#f6f6f6">
    <h3 style="margin:0 0 8px">${esc(v.app.nome)}</h3>
    ${paragrafos(e.blocoApp)}
    <a href="${esc(linkRastreado(v, "newsletter"))}" style="display:inline-block;background:${c.primaria};color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Conhecer o ${esc(v.app.nome)}</a>
  </div>
  ${paragrafos(e.despedida)}
</div>`;
}
