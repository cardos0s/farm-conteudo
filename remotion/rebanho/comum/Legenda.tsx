import React from "react";
import { type Fala, L } from "./tempo";

// Legenda falada: a frase aparece em pedaços curtos e a palavra do momento fica em destaque.

type Pedaco = { de: number; ate: number; palavras: { p: string; t: number }[] };

function pedacos(falas: Fala[], inicio: number[]): Pedaco[] {
  const saida: Pedaco[] = [];
  falas.forEach((f, n) => {
    let atual: Pedaco | null = null, letras = 0;
    f.palavras.forEach((w, i) => {
      const t = inicio[n]! + w.i;
      if (!atual) { atual = { de: t, ate: t, palavras: [] }; letras = 0; }
      atual.palavras.push({ p: w.p, t });
      atual.ate = inicio[n]! + w.f;
      letras += w.p.length + 1;
      const pontua = /[.!?:;]$/.test(w.p) || (/,$/.test(w.p) && letras > 12);
      if (pontua || letras > 22 || atual.palavras.length >= 5 || i === f.palavras.length - 1) { saida.push(atual); atual = null; }
    });
  });
  // cada pedaço fica na tela até o próximo entrar (ou um pouco depois do fim da fala)
  saida.forEach((p, i) => { const prox = saida[i + 1]; p.ate = prox && prox.de - p.ate < 0.6 ? prox.de : p.ate + 0.35; });
  return saida;
}

const cache = new WeakMap<Fala[], Pedaco[]>();

export const Legenda: React.FC<{ falas: Fala[]; inicio: number[]; t: number; y?: number }> = ({ falas, inicio, t, y = 1470 }) => {
  if (!cache.has(falas)) cache.set(falas, pedacos(falas, inicio));
  const p = cache.get(falas)!.find((x) => t >= x.de - 0.04 && t < x.ate);
  if (!p) return null;
  const entra = Math.min(1, (t - p.de + 0.04) / 0.1);
  return (
    <div style={{ position: "absolute", left: 0, width: L, top: y, display: "flex", justifyContent: "center", transform: `translateY(${(1 - entra) * 14}px)`, opacity: entra }}>
      <div style={{ maxWidth: 940, padding: "14px 34px 18px", borderRadius: 30, background: "rgba(16,35,20,0.78)", fontFamily: "'Roboto Slab', Georgia, serif", fontWeight: 800, fontSize: 62, lineHeight: 1.18, textAlign: "center", color: "#FFF8EA", textShadow: "0 3px 0 rgba(0,0,0,0.35)" }}>
        {p.palavras.map((w, i) => {
          const dita = t >= w.t - 0.03, prox = p.palavras[i + 1];
          const agora = dita && (!prox || t < prox.t - 0.03);
          return (
            <span key={i} style={{ color: agora ? "#FFD166" : "#FFF8EA", opacity: dita ? 1 : 0.45 }}>
              {i ? " " : ""}
              {w.p}
            </span>
          );
        })}
      </div>
    </div>
  );
};
