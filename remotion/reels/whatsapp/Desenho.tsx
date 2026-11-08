import React, { useMemo } from "react";
import { FONTE_LOUSA } from "../../lousa/fontes";

// Mostra um diagrama do PDF (string SVG de materiais/whatsapp/diagramas.mjs) se desenhando:
// cada traço aparece em sequência, na ordem em que foi desenhado, como na lousa das aulas.

type Elemento = { html: string; tipo: "traco" | "preench" | "texto"; etapa: number };

export function analisar(svg: string) {
  const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100").split(/\s+/).map(Number);
  const elementos: Elemento[] = [];
  const pilha: number[] = [0];
  // percorre o SVG em ordem, guardando a etapa (grupos <g data-etapa="n">) de cada traço/texto
  for (const m of svg.matchAll(/<g data-etapa="(\d+)">|<\/g>|<path[^>]*\/>|<text[^>]*>[\s\S]*?<\/text>/g)) {
    const tok = m[0];
    if (m[1] !== undefined) {
      pilha.push(Number(m[1]));
      continue;
    }
    if (tok === "</g>") {
      if (pilha.length > 1) pilha.pop();
      continue;
    }
    const html = tok.replace(/font-family="Excali"/g, `font-family="${FONTE_LOUSA.replace(/"/g, "'")}"`);
    const etapa = pilha[pilha.length - 1];
    if (html.startsWith("<text")) elementos.push({ html, tipo: "texto", etapa });
    else elementos.push({ html, tipo: !/fill="none"/.test(html) || /stroke-dasharray/.test(html) ? "preench" : "traco", etapa });
  }
  const nEtapas = Math.max(0, ...elementos.map((e) => e.etapa));
  return { largura: vb[2], altura: vb[3], elementos, nEtapas };
}

function desenhar(e: Elemento, p: number): string {
  if (p <= 0) return "";
  if (p >= 1) return e.html;
  if (e.tipo === "traco") return e.html.replace("<path ", `<path pathLength="1" stroke-dasharray="${p.toFixed(3)} 2" `);
  return e.html.replace(/^<(path|text) /, `<$1 opacity="${p.toFixed(3)}" `);
}

/** Constrói o SVG no instante t. Sem `etapas`, tudo se desenha entre `de` e `de + dur`. Com `etapas`
 *  (segundo em que cada etapa 1..N começa; a etapa 0 começa em `de`), cada etapa se desenha a partir
 *  do seu instante, traço por traço, em ~0,5 a 1,4 s conforme o tamanho. */
export function DiagramaAnimado({ svg, t, de, dur, etapas }: { svg: string; t: number; de: number; dur: number; etapas?: number[] }) {
  const { largura, altura, elementos } = useMemo(() => analisar(svg), [svg]);
  let conteudo: string;
  if (!etapas) {
    const n = elementos.length;
    const cada = Math.max(0.22, (dur / Math.max(n, 1)) * 6);
    conteudo = elementos.map((e, i) => desenhar(e, Math.min(1, Math.max(0, (t - (de + (dur - cada) * (i / Math.max(n - 1, 1)))) / cada)))).join("");
  } else {
    const grupos = new Map<number, number[]>();
    elementos.forEach((e, i) => grupos.set(e.etapa, [...(grupos.get(e.etapa) ?? []), i]));
    const p = new Array<number>(elementos.length).fill(0);
    for (const [et, idx] of grupos) {
      const ini = et === 0 ? de : (etapas[et - 1] ?? 1e9);
      const durEt = et === 0 ? dur : Math.min(1.4, Math.max(0.5, idx.length * 0.04));
      const cada = Math.max(0.2, (durEt / Math.max(idx.length, 1)) * 5);
      idx.forEach((i, k) => {
        const ini_i = ini + (durEt - cada) * (k / Math.max(idx.length - 1, 1));
        p[i] = Math.min(1, Math.max(0, (t - ini_i) / cada));
      });
    }
    conteudo = elementos.map((e, i) => desenhar(e, p[i])).join("");
  }
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
