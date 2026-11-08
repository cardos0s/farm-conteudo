import React, { useMemo } from "react";
import { FONTE_LOUSA } from "../../lousa/fontes";

// Mostra um diagrama do PDF (string SVG de materiais/whatsapp/diagramas.mjs) se desenhando:
// cada traço aparece em sequência, na ordem em que foi desenhado, como na lousa das aulas.

type Elemento = { html: string; tipo: "traco" | "preench" | "texto" };

export function analisar(svg: string) {
  const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100").split(/\s+/).map(Number);
  const elementos: Elemento[] = (svg.match(/<path[^>]*\/>|<text[^>]*>[\s\S]*?<\/text>/g) ?? []).map((html) => {
    html = html.replace(/font-family="Excali"/g, `font-family="${FONTE_LOUSA.replace(/"/g, "'")}"`);
    if (html.startsWith("<text")) return { html, tipo: "texto" };
    const preenchido = !/fill="none"/.test(html) || /stroke-dasharray/.test(html);
    return { html, tipo: preenchido ? "preench" : "traco" };
  });
  return { largura: vb[2], altura: vb[3], elementos };
}

/** Constrói o SVG no instante t: elementos desenhados entre `de` e `de + dur`. */
export function DiagramaAnimado({ svg, t, de, dur }: { svg: string; t: number; de: number; dur: number }) {
  const { largura, altura, elementos } = useMemo(() => analisar(svg), [svg]);
  const n = elementos.length;
  const cada = Math.max(0.22, (dur / Math.max(n, 1)) * 6);
  const conteudo = elementos
    .map((e, i) => {
      const ini = de + (dur - cada) * (i / Math.max(n - 1, 1));
      const p = Math.min(1, Math.max(0, (t - ini) / cada));
      if (p <= 0) return "";
      if (p >= 1) return e.html;
      if (e.tipo === "traco") return e.html.replace("<path ", `<path pathLength="1" stroke-dasharray="${p.toFixed(3)} 2" `);
      return e.html.replace(/^<(path|text) /, `<$1 opacity="${p.toFixed(3)}" `);
    })
    .join("");
  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
      dangerouslySetInnerHTML={{ __html: conteudo }}
    />
  );
}
