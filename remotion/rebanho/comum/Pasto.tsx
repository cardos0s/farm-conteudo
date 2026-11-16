import React from "react";
import { Bebedouro } from "../confinamento/Mundo";
import { Boi, type Jeito } from "../pesagem/Boi";
import { Arvore, type Vista, type XZ, aleatorio, chao, faixa, projetar } from "../pesagem/Mundo";

// Fazenda de pasto montada por descrição: piquetes (com altura e cor do capim), cercas, gado e objetos.
// Cada vídeo explicativo descreve a sua cena; valores podem variar no tempo (função de t).

type Num = number | ((t: number) => number);
const val = (n: Num | undefined, t: number, padrao = 0) => (n === undefined ? padrao : typeof n === "function" ? n(t) : n);

export type Piquete = { x0: number; x1: number; z0: number; z1: number; /** altura do capim (m) */ capim: Num; /** capim desigual: moitas altas no meio do rapado */ falhado?: boolean; /** 0 verde .. 1 seco (por padrão segue a cena) */ seco?: Num; terra?: boolean };
export type Cerca = { a: XZ; b: XZ; tipo: "arame" | "tabua" };
export type BoiP = { x: Num; z: number; pelagem?: string; vira?: boolean | ((t: number) => boolean); esc?: number; semente?: number; /** fase do passo quando anda */ passo?: (t: number) => number | undefined; pasta?: Num; atento?: Num; brinco?: string };
export type Objeto = { x: number; z: number; tipo: "bebedouro" | "cocho" | "cochoCoberto" | "arvore" | "placa" | "porteira"; texto?: string; esc?: number; variante?: number };
export type CenaPasto = { piquetes: Piquete[]; cercas: Cerca[]; bois: BoiP[]; objetos: Objeto[]; estrada?: { x0: number; x1: number; z0: number; z1: number }; seco?: Num; arvoresLonge?: boolean };

const hex = (c: string) => (c.startsWith("rgb") ? c.slice(4, -1).split(",").map(Number) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
export function mistura(a: string, b: string, p: number): string {
  const A = hex(a), B = hex(b), q = Math.min(1, Math.max(0, p));
  return `rgb(${A.map((x, i) => Math.round(x + (B[i]! - x) * q)).join(",")})`;
}
const MADEIRA = "#8C5B34", MADEIRA_ESC = "#6A4224", MADEIRA_LUZ = "#B07A48";

const Cocho: React.FC<{ coberto?: boolean }> = ({ coberto }) => (
  <g>
    <ellipse cx={0} cy={2} rx={coberto ? 230 : 170} ry={18} fill="#2B1D10" opacity={0.25} />
    {coberto && (
      <>
        {[-190, 190].map((x) => <rect key={x} x={x - 7} y={-250} width={14} height={250} fill={MADEIRA_ESC} />)}
        <path d="M -250,-236 L 0,-310 L 250,-236 L 250,-222 L -250,-222 Z" fill="#9AA3A8" />
        <path d="M -250,-236 L 0,-310 L 0,-296 L -250,-222 Z" fill="#C3CACE" />
      </>
    )}
    <path d="M -160,-72 L 160,-72 L 140,-30 L -140,-30 Z" fill="#7A5232" />
    <rect x={-150} y={-80} width={300} height={12} rx={4} fill={coberto ? "#E9DDBE" : "#F1EEE6"} />
    {[-120, 120].map((x) => <rect key={x} x={x - 9} y={-30} width={18} height={30} fill="#5B3A22" />)}
  </g>
);
const Placa: React.FC<{ texto: string }> = ({ texto }) => (
  <g>
    <rect x={-70} y={-240} width={9} height={240} fill={MADEIRA_ESC} />
    <rect x={61} y={-240} width={9} height={240} fill={MADEIRA_ESC} />
    <rect x={-92} y={-262} width={184} height={74} rx={6} fill="#F4EFE6" stroke="#2F5D3A" strokeWidth={6} />
    <text x={0} y={-212} textAnchor="middle" fontFamily="'Roboto Slab', Georgia, serif" fontWeight={800} fontSize={texto.length > 9 ? 30 : 38} fill="#2F5D3A">{texto}</text>
  </g>
);

const NUVENS = [{ ang: -75, alt: 0.3, e: 1.1 }, { ang: -40, alt: 0.42, e: 0.9 }, { ang: -6, alt: 0.26, e: 1.2 }, { ang: 28, alt: 0.4, e: 0.85 }, { ang: 58, alt: 0.28, e: 1.15 }, { ang: 92, alt: 0.38, e: 0.9 }, { ang: 125, alt: 0.26, e: 1.1 }, { ang: -110, alt: 0.36, e: 1 }];
const LONGE = [{ x: -70, z: 30, e: 1.5, tp: 0 }, { x: -85, z: 90, e: 1.6, tp: 1 }, { x: -75, z: 150, e: 1.5, tp: 0 }, { x: 72, z: 20, e: 1.5, tp: 1 }, { x: 88, z: 80, e: 1.6, tp: 2 }, { x: 76, z: 140, e: 1.5, tp: 0 }, { x: -20, z: 210, e: 1.7, tp: 1 }, { x: 30, z: 220, e: 1.7, tp: 0 }, { x: -60, z: -20, e: 1.4, tp: 2 }, { x: 64, z: -24, e: 1.4, tp: 0 }];

type Tufo = { x: number; z: number; e: number; pq: number; alto: boolean };
function semear(cena: CenaPasto): Tufo[] {
  const r = aleatorio(11), saida: Tufo[] = [];
  cena.piquetes.forEach((p, pq) => {
    if (p.terra) return;
    const passo = 1.45;
    for (let x = p.x0 + 0.5; x < p.x1 - 0.3; x += passo) for (let z = p.z0 + 0.5; z < p.z1 - 0.3; z += passo) {
      const jx = x + (r() - 0.5) * passo, jz = z + (r() - 0.5) * passo, e = 0.75 + r() * 0.5, alto = r() < 0.16;
      saida.push({ x: jx, z: jz, e, pq, alto });
    }
  });
  return saida;
}
const sementes = new WeakMap<CenaPasto, Tufo[]>();

export const Pasto: React.FC<{ v: Vista; t: number; id: string; cena: CenaPasto; leve?: boolean }> = ({ v, t, id, cena, leve }) => {
  if (!sementes.has(cena)) sementes.set(cena, semear(cena));
  const esc = v.f / 1100;
  const itens: { z: number; el: React.ReactNode }[] = [];
  const add = (z: number, el: React.ReactNode) => itens.push({ z, el });
  let k = 0;
  const secoCena = val(cena.seco, t);
  const VERDE_ALTO = mistura("#6CA83E", "#C2A85C", secoCena), VERDE_BAIXO = mistura("#9CC257", "#D2BE7E", secoCena);

  const serra = (base: number, amp: number, fase: number) => {
    const p: string[] = [`0,${v.h}`];
    for (let x = -20; x <= v.w + 20; x += 24) {
      const ang = v.guinada + Math.atan((x - v.cx) / v.f);
      p.push(`${x},${(v.hor + 2 - (base + amp * (0.55 * Math.sin(ang * 2.3 + fase) + 0.3 * Math.sin(ang * 5.1 + fase * 2.1) + 0.15 * Math.sin(ang * 11.3 + fase * 0.7))) * esc).toFixed(1)}`);
    }
    p.push(`${v.w},${v.h}`);
    return p.join(" ");
  };
  const angTela = (graus: number) => {
    let d = (graus * Math.PI) / 180 - v.guinada;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d) < 1.35 ? v.cx + v.f * Math.tan(d) : null;
  };
  const figura = (X: number, Z: number, escala: number, vira: boolean, el: React.ReactNode, margem = 400, max = 110) => {
    const p = projetar(v, X, 0, Z);
    if (!p || p.z > max || p.x < -margem * esc || p.x > v.w + margem * esc) return;
    const s = (escala * v.f) / p.z / 100;
    add(p.z, <g key={k++} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(vira ? -s : s).toFixed(4)} ${s.toFixed(4)})`}>{el}</g>);
  };
  const poste = (p: XZ, alt: number, larg: number, cor: string, luz: string) => {
    const b = projetar(v, p[0], 0, p[1]);
    if (!b || b.z > 90 || b.x < -100 || b.x > v.w + 100) return;
    const w = (larg * v.f) / b.z, h = (alt * v.f) / b.z;
    add(b.z, <g key={k++}><rect x={b.x - w / 2} y={b.y - h} width={w} height={h} fill={cor} /><rect x={b.x - w / 2} y={b.y - h} width={w * 0.35} height={h} fill={luz} opacity={0.55} /></g>);
  };

  // cercas: arame (elétrica, dois fios e isolador) ou tábua
  for (const c of cena.cercas) {
    const comp = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]);
    const vao = c.tipo === "arame" ? 5 : 2.4, n = Math.max(1, Math.round(comp / vao));
    const em = (u: number): XZ => [c.a[0] + (c.b[0] - c.a[0]) * u, c.a[1] + (c.b[1] - c.a[1]) * u];
    for (let i = 0; i <= n; i++) poste(em(i / n), c.tipo === "arame" ? 1.2 : 1.7, c.tipo === "arame" ? 0.09 : 0.18, c.tipo === "arame" ? "#6B5A45" : MADEIRA_ESC, c.tipo === "arame" ? "#A08C70" : MADEIRA_LUZ);
    for (let i = 0; i < n; i++) {
      const a = em(i / n), b = em((i + 1) / n);
      for (const h of c.tipo === "arame" ? [0.62, 1.02] : [0.45, 0.85, 1.25, 1.55]) {
        const e = c.tipo === "arame" ? 0.014 : 0.07;
        const q = faixa(v, a, b, h - e, h + e);
        if (q && q.z < 90) add(q.z + 0.02, <polygon key={k++} points={q.d} fill={c.tipo === "arame" ? "#E9E4D8" : MADEIRA} stroke={c.tipo === "arame" ? undefined : MADEIRA_ESC} strokeWidth={1} />);
      }
    }
  }

  for (let i = 0; i < cena.bois.length; i++) {
    const b = cena.bois[i]!;
    const x = val(b.x, t), vira = typeof b.vira === "function" ? b.vira(t) : !!b.vira;
    const jeito: Jeito = { passo: b.passo?.(t), pasta: val(b.pasta, t), atento: val(b.atento, t) };
    const d = Math.hypot(x - v.x, b.z - v.z);
    figura(x, b.z, b.esc ?? 1, vira, <Boi id={`${id}-b${i}`} t={t} pelagem={b.pelagem} semente={b.semente ?? i * 1.3} brinco={b.brinco} espelhado={vira} simples={leve || d > 26} jeito={jeito} />, 400, 85);
  }
  for (const o of cena.objetos) {
    if (o.tipo === "arvore") figura(o.x, o.z, o.esc ?? 1.3, false, <Arvore tipo={o.variante ?? 0} vento={1.3 * Math.sin(t * 0.9 + o.x) + 0.6 * Math.sin(t * 2.3 + o.z)} />, 900, 400);
    else if (o.tipo === "bebedouro") figura(o.x, o.z, o.esc ?? 1, false, <Bebedouro t={t} />);
    else if (o.tipo === "placa") figura(o.x, o.z, o.esc ?? 1, false, <Placa texto={o.texto ?? ""} />);
    else if (o.tipo === "porteira") {
      for (const s of [-1, 1]) poste([o.x + s * 2.6, o.z], 3.3, 0.3, MADEIRA_ESC, MADEIRA_LUZ);
      const q = faixa(v, [o.x - 2.9, o.z], [o.x + 2.9, o.z], 3.0, 3.28);
      if (q) add(q.z, <polygon key={k++} points={q.d} fill={MADEIRA_ESC} />);
    } else figura(o.x, o.z, o.esc ?? 1, false, <Cocho coberto={o.tipo === "cochoCoberto"} />);
  }
  if (cena.arvoresLonge !== false) LONGE.forEach((a) => figura(a.x, a.z, a.e, false, <Arvore tipo={secoCena > 0.6 && a.tp === 2 ? 1 : a.tp} vento={1.2 * Math.sin(t * 0.9 + a.x)} />, 900, 400));

  // capim: tufos com a altura e a cor do piquete
  if (!leve) {
    const alturas = cena.piquetes.map((p) => val(p.capim, t)), secos = cena.piquetes.map((p) => (p.seco === undefined ? secoCena : val(p.seco, t)));
    for (const tf of sementes.get(cena)!) {
      const dz = tf.z - v.z;
      if (dz < -3 || dz > 34 || Math.abs(tf.x - v.x) > 34) continue;
      const p = projetar(v, tf.x, 0, tf.z);
      if (!p || p.z > 30 || p.x < -60 || p.x > v.w + 60) continue;
      const pq = cena.piquetes[tf.pq]!;
      const alt = pq.falhado ? (tf.alto ? 0.42 : 0.04) : alturas[tf.pq]!;
      const s = ((alt / 0.44) * tf.e * v.f) / p.z / 100;
      if (s * 44 < 1.5) continue;
      const cor = mistura(tf.alto ? "#2F6E22" : "#3F7F28", tf.alto ? "#8F7430" : "#A58A3E", secos[tf.pq]! + (pq.falhado && tf.alto ? 0.35 : 0));
      add(p.z, (
        <path key={k++} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(s * 1.25 + 0.012 * esc).toFixed(4)} ${s.toFixed(4)}) skewX(${(9 * Math.sin(t * 1.9 + tf.x * 0.7) + 4 * Math.sin(t * 4.3 + tf.z)).toFixed(1)})`}
          d="M -14,0 C -16,-14 -22,-24 -28,-30 C -18,-26 -10,-16 -7,0 Z M -5,0 C -4,-20 -2,-34 4,-44 C 6,-30 6,-14 5,0 Z M 8,0 C 12,-12 18,-22 28,-27 C 22,-18 18,-8 17,0 Z" fill={cor} />
      ));
    }
  }
  itens.sort((a, b) => b.z - a.z);

  const sol = angTela(-28), bando = angTela(70 - 3.4 * t);
  const e = cena.estrada;
  return (
    <svg width={v.w} height={v.h} viewBox={`0 0 ${v.w} ${v.h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`${id}-ceu`} gradientUnits="userSpaceOnUse" x1={0} y1={v.hor - 1500 * esc} x2={0} y2={v.hor}>
          <stop offset="0" stopColor={mistura("#3F8FD6", "#5A9CD0", secoCena)} />
          <stop offset="0.55" stopColor={mistura("#8CC4EC", "#A9CDE4", secoCena)} />
          <stop offset="0.88" stopColor={mistura("#D8ECF4", "#EFE6CF", secoCena)} />
          <stop offset="1" stopColor={mistura("#FBE8C2", "#F6D9A0", secoCena)} />
        </linearGradient>
        <linearGradient id={`${id}-pasto`} gradientUnits="userSpaceOnUse" x1={0} y1={v.hor} x2={0} y2={v.hor + 900 * esc}>
          <stop offset="0" stopColor={mistura("#A9C76A", "#D8C98A", secoCena)} />
          <stop offset="0.12" stopColor={mistura("#8DB850", "#CDB872", secoCena)} />
          <stop offset="1" stopColor={mistura("#6C9E38", "#B89C56", secoCena)} />
        </linearGradient>
        <radialGradient id={`${id}-sol`}>
          <stop offset="0" stopColor="#FFF6D0" stopOpacity={1} />
          <stop offset="0.18" stopColor="#FFE9A0" stopOpacity={0.95} />
          <stop offset="0.22" stopColor="#FFE08A" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFE08A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={v.w} height={v.h} fill={`url(#${id}-ceu)`} />
      {sol !== null && <circle cx={sol} cy={v.hor - 560 * esc} r={420 * esc} fill={`url(#${id}-sol)`} />}
      {NUVENS.map((n, i) => {
        const x = angTela(n.ang + t * 0.4);
        if (x === null) return null;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${(v.hor - n.alt * 1500 * esc).toFixed(1)}) scale(${n.e * esc})`} fill="#FFFFFF" opacity={0.92 - 0.35 * secoCena}>
            <ellipse cx={0} cy={0} rx={150} ry={46} /><ellipse cx={-70} cy={-28} rx={80} ry={48} /><ellipse cx={30} cy={-46} rx={96} ry={62} /><ellipse cx={110} cy={-16} rx={70} ry={38} />
          </g>
        );
      })}
      {bando !== null && (
        <g transform={`translate(${bando.toFixed(1)} ${(v.hor - 0.33 * 1500 * esc + 14 * Math.sin(t * 0.8)).toFixed(1)}) scale(${esc})`} stroke="#2E3B45" strokeWidth={4} fill="none" strokeLinecap="round">
          {Array.from({ length: 6 }, (_, j) => {
            const asa = 9 * Math.sin(t * 9 + j * 1.3), dx = (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 46 + 6 * Math.sin(t * 1.1 + j), dy = Math.ceil(j / 2) * 24 + 5 * Math.sin(t * 1.7 + j * 2);
            return <path key={j} d={`M ${dx - 15},${dy + asa} Q ${dx - 7},${dy - asa * 0.6} ${dx},${dy} Q ${dx + 7},${dy - asa * 0.6} ${dx + 15},${dy + asa}`} />;
          })}
        </g>
      )}
      <polygon points={serra(70, 46, 0.4)} fill={mistura("#9DBFC4", "#B9C3B4", secoCena)} />
      <polygon points={serra(40, 34, 2.2)} fill={mistura("#86B08A", "#B5B184", secoCena)} />
      <polygon points={serra(16, 14, 4.1)} fill={mistura("#7FAE5E", "#C2B272", secoCena)} />
      <rect x={0} y={v.hor} width={v.w} height={Math.max(0, v.h - v.hor)} fill={`url(#${id}-pasto)`} />
      {cena.piquetes.map((p, i) => {
        const pol = chao(v, [[p.x0, p.z0], [p.x1, p.z0], [p.x1, p.z1], [p.x0, p.z1]]);
        if (!pol) return null;
        const alt = p.falhado ? 0.08 : val(p.capim, t), sc = p.seco === undefined ? secoCena : val(p.seco, t);
        const cor = p.terra ? "#C2946A" : mistura(mistura("#B9C77A", "#D3C48A", sc), mistura(VERDE_BAIXO, VERDE_ALTO, (alt - 0.1) / 0.22), Math.min(1, alt / 0.1));
        return <polygon key={i} points={pol} fill={cor} />;
      })}
      {e && (() => { const pol = chao(v, [[e.x0, e.z0], [e.x1, e.z0], [e.x1, e.z1], [e.x0, e.z1]]); return pol ? <polygon points={pol} fill="#D2AE82" /> : null; })()}
      {itens.map((i) => i.el)}
    </svg>
  );
};
