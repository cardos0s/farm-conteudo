import React, { useMemo } from "react";
import { Boi, type Jeito } from "./Boi";
import { PESAGENS, batida, limitar, prog, suave } from "./roteiro";

// A fazenda em 3D simples: chão plano, cercas e porteira como painéis verticais, bois e árvores
// como figuras de frente para a câmera. Tudo em metros; a câmera é quem está em cima do cavalo.

export type Vista = { x: number; y: number; z: number; guinada: number; f: number; cx: number; hor: number; w: number; h: number };
type XZ = readonly [number, number];
type P3 = readonly [number, number, number];

const PERTO = 0.4;
const paraCam = (v: Vista, X: number, Z: number): [number, number] => {
  const dx = X - v.x, dz = Z - v.z, c = Math.cos(v.guinada), s = Math.sin(v.guinada);
  return [dx * c - dz * s, dx * s + dz * c];
};
export function projetar(v: Vista, X: number, Y: number, Z: number): { x: number; y: number; z: number } | null {
  const [xc, zc] = paraCam(v, X, Z);
  if (zc < PERTO) return null;
  return { x: v.cx + (v.f * xc) / zc, y: v.hor + (v.f * (v.y - Y)) / zc, z: zc };
}
const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

/** Polígono no chão (y = 0), recortado no plano próximo da câmera. */
function chao(v: Vista, poli: XZ[]): string | null {
  const cam = poli.map(([X, Z]) => paraCam(v, X, Z));
  const fora: [number, number][] = [];
  for (let i = 0; i < cam.length; i++) {
    const a = cam[i]!, b = cam[(i + 1) % cam.length]!;
    const da = a[1] >= PERTO, db = b[1] >= PERTO;
    if (da) fora.push(a);
    if (da !== db) {
      const u = (PERTO - a[1]) / (b[1] - a[1]);
      fora.push([a[0] + (b[0] - a[0]) * u, PERTO]);
    }
  }
  if (fora.length < 3) return null;
  return pts(fora.map(([xc, zc]) => ({ x: v.cx + (v.f * xc) / zc, y: v.hor + (v.f * v.y) / zc })));
}

/** Faixa vertical (tábua de cerca) entre dois pontos do chão, da altura h0 até h1. */
function faixa(v: Vista, a: XZ, b: XZ, h0: number, h1: number): { d: string; z: number } | null {
  const ca = paraCam(v, a[0], a[1]), cb = paraCam(v, b[0], b[1]);
  if (ca[1] < PERTO && cb[1] < PERTO) return null;
  let A = ca, B = cb;
  if (ca[1] < PERTO) { const u = (PERTO - ca[1]) / (cb[1] - ca[1]); A = [ca[0] + (cb[0] - ca[0]) * u, PERTO]; }
  if (cb[1] < PERTO) { const u = (PERTO - cb[1]) / (ca[1] - cb[1]); B = [cb[0] + (ca[0] - cb[0]) * u, PERTO]; }
  const P = (c: [number, number], h: number) => ({ x: v.cx + (v.f * c[0]) / c[1], y: v.hor + (v.f * (v.y - h)) / c[1] });
  const q = [P(A, h1), P(B, h1), P(B, h0), P(A, h0)];
  if (Math.max(q[0]!.x, q[1]!.x) < -200 || Math.min(q[0]!.x, q[1]!.x) > v.w + 200) return null;
  return { d: pts(q), z: (A[1] + B[1]) / 2 };
}
function quad(v: Vista, q: P3[]): { d: string; z: number } | null {
  const pr = q.map(([X, Y, Z]) => projetar(v, X, Y, Z));
  if (pr.some((p) => !p)) return null;
  const ok = pr as { x: number; y: number; z: number }[];
  return { d: pts(ok), z: ok.reduce((s, p) => s + p.z, 0) / ok.length };
}

function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Planta da fazenda ────────────────────────────────────────────────
const CURRAL = { x0: -11, x1: 11, z0: 0, z1: 21 };
const VAO = 2.2; // meia largura da porteira
const TABUAS = [0.42, 0.82, 1.22, 1.58];
const MADEIRA = "#8C5B34", MADEIRA_ESC = "#6A4224", MADEIRA_LUZ = "#B07A48";

type Trecho = { a: XZ; b: XZ };
function cerca(de: XZ, ate: XZ): { trechos: Trecho[]; postes: XZ[] } {
  const comp = Math.hypot(ate[0] - de[0], ate[1] - de[1]);
  const n = Math.round(comp / 2.2);
  const nos: XZ[] = Array.from({ length: n + 1 }, (_, i) => [de[0] + ((ate[0] - de[0]) * i) / n, de[1] + ((ate[1] - de[1]) * i) / n] as const);
  return { trechos: nos.slice(0, -1).map((a, i) => ({ a, b: nos[i + 1]! })), postes: nos };
}
const lados = [
  cerca([CURRAL.x0, 0], [-VAO, 0]),
  cerca([VAO, 0], [CURRAL.x1, 0]),
  cerca([CURRAL.x1, 0], [CURRAL.x1, CURRAL.z1]),
  cerca([CURRAL.x1, CURRAL.z1], [CURRAL.x0, CURRAL.z1]),
  cerca([CURRAL.x0, CURRAL.z1], [CURRAL.x0, 0]),
];
const TRECHOS = lados.flatMap((l) => l.trechos);
const POSTES = lados.flatMap((l) => l.postes).filter((p) => !(Math.abs(Math.abs(p[0]) - VAO) < 0.01 && p[1] === 0));
// corredor de arame que leva até a porteira
const MOUROES: XZ[] = [];
for (let z = -34; z <= -2; z += 4) MOUROES.push([-3.4, z], [3.4, z]);

type BoiFundo = { x: number; z: number; pelagem: string; vira: boolean; esc: number; anda?: number; pasta?: boolean };
/** `anda`: velocidade (m/s) na direção em que o boi está virado. */
const BOIS_FUNDO: BoiFundo[] = [
  { x: -4.4, z: 19.5, pelagem: "branco", vira: true, esc: 1, pasta: true },
  { x: 4.6, z: 19.2, pelagem: "cinza", vira: false, esc: 0.96 },
  { x: -8.2, z: 10.5, pelagem: "branco", vira: false, esc: 0.95 },
  { x: 8.3, z: 17.2, pelagem: "branco", vira: true, esc: 1.02 },
  { x: -9.6, z: 16.8, pelagem: "caramelo", vira: false, esc: 0.92, anda: 0.42 },
  { x: 9.8, z: 13.9, pelagem: "branco", vira: true, esc: 0.98, anda: 0.36 },
  { x: 6.0, z: 0.9, pelagem: "cinza", vira: true, esc: 0.97 },
  // soltos no pasto
  { x: -24, z: 38, pelagem: "branco", vira: false, esc: 1, pasta: true },
  { x: -17, z: 46, pelagem: "branco", vira: true, esc: 1, anda: 0.3 },
  { x: 22, z: 34, pelagem: "branco", vira: true, esc: 1, anda: 0.35 },
  { x: 31, z: 26, pelagem: "cinza", vira: false, esc: 1, pasta: true },
  { x: 27, z: 9, pelagem: "branco", vira: true, esc: 1, pasta: true },
  { x: 37, z: -9, pelagem: "branco", vira: false, esc: 1, anda: 0.3 },
  { x: 24, z: -9, pelagem: "caramelo", vira: true, esc: 1, pasta: true },
  { x: 16, z: 44, pelagem: "branco", vira: false, esc: 1, pasta: true },
];
const ARVORES = [
  { x: -16, z: 9, esc: 1.5, tipo: 0 },
  { x: -30, z: 30, esc: 1.2, tipo: 1 },
  { x: -9, z: 52, esc: 1.3, tipo: 0 },
  { x: 14, z: 58, esc: 1.4, tipo: 1 },
  { x: 36, z: 40, esc: 1.3, tipo: 0 },
  { x: 44, z: 14, esc: 1.5, tipo: 1 },
  { x: 40, z: -14, esc: 1.2, tipo: 0 },
  { x: 19, z: 27, esc: 1.1, tipo: 2 },
  { x: -20, z: -6, esc: 1.2, tipo: 1 },
  { x: 55, z: 30, esc: 1.4, tipo: 2 },
  { x: 60, z: 2, esc: 1.5, tipo: 0 },
  { x: -42, z: 55, esc: 1.5, tipo: 2 },
];
const CASA = { x: -26, z: 62 };

const TUFOS: { x: number; z: number; e: number; flor: number }[] = [];
{
  const r = aleatorio(7);
  while (TUFOS.length < 230) {
    const x = -32 + r() * 80, z = -10 + r() * 58;
    const noCurral = x > CURRAL.x0 - 0.6 && x < CURRAL.x1 + 0.6 && z > -0.6 && z < CURRAL.z1 + 0.6;
    const naEstrada = Math.abs(x) < 2.4 && z < 0.5;
    if (noCurral || naEstrada) continue;
    TUFOS.push({ x, z, e: 0.7 + r() * 0.8, flor: r() });
  }
}
const MANCHAS: { x: number; z: number; r: number }[] = [];
{
  const r = aleatorio(21);
  for (let i = 0; i < 34; i++) MANCHAS.push({ x: -9.5 + r() * 19, z: 1.5 + r() * 18, r: 0.5 + r() * 0.9 });
}
const NUVENS = [
  { ang: -70, alt: 0.33, e: 1.1 }, { ang: -38, alt: 0.2, e: 0.8 }, { ang: -8, alt: 0.4, e: 1.25 }, { ang: 24, alt: 0.24, e: 0.9 },
  { ang: 52, alt: 0.36, e: 1.15 }, { ang: 84, alt: 0.22, e: 0.85 }, { ang: 112, alt: 0.38, e: 1.2 }, { ang: 142, alt: 0.26, e: 0.9 }, { ang: 170, alt: 0.34, e: 1 },
];
const SOL = -24;
const POEIRA: { x: number; y: number; z: number; r: number; f: number }[] = [];
{
  const r = aleatorio(33);
  for (let i = 0; i < 70; i++) POEIRA.push({ x: -10 + r() * 20, y: 0.2 + r() * 2.6, z: -4 + r() * 22, r: 0.012 + r() * 0.022, f: r() * 6.28 });
}
const BANDOS = [
  { ang: 62, vel: -6.5, alt: 0.3, n: 6 },
  { ang: 168, vel: -3.6, alt: 0.24, n: 4 },
];

/** Abertura da porteira (0 fechada, 1 aberta). */
// no fim do curso a folha bate no batente e balança um pouco
export const aberturaPorteira = (t: number) => prog(t, 0.55, 1.5, suave) + (t > 2.05 ? 0.045 * Math.exp(-(t - 2.05) * 4.5) * Math.sin((t - 2.05) * 13) : 0);

const Arvore: React.FC<{ tipo: number; vento: number }> = ({ tipo, vento }) => {
  // unidade: 1 = 1 cm, origem no pé do tronco
  const copa = tipo === 2 ? ["#E0B02E", "#C9941F", "#F2CC52"] : tipo === 1 ? ["#3F7F3A", "#2F6530", "#5C9A47"] : ["#4E8F3F", "#3A7434", "#6BA850"];
  return (
    <g>
      <ellipse cx={30} cy={0} rx={300} ry={26} fill="#22331A" opacity={0.25} />
      <path d="M -22,0 C -16,-120 -20,-200 -30,-290 L 26,-290 C 18,-200 16,-110 26,0 Z" fill="#6B4A2E" />
      <path d="M -6,-250 C -60,-300 -90,-330 -120,-350 M 6,-250 C 60,-310 80,-330 110,-360" stroke="#6B4A2E" strokeWidth={18} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${vento.toFixed(2)} 0 -300) skewX(${(vento * 0.8).toFixed(2)})`}>
        <ellipse cx={-130} cy={-400} rx={170} ry={120} fill={copa[1]} />
        <ellipse cx={140} cy={-410} rx={180} ry={130} fill={copa[1]} />
        <ellipse cx={0} cy={-500} rx={220} ry={160} fill={copa[0]} />
        <ellipse cx={-150} cy={-470} rx={130} ry={95} fill={copa[0]} />
        <ellipse cx={150} cy={-490} rx={140} ry={100} fill={copa[0]} />
        <ellipse cx={-50} cy={-570} rx={130} ry={80} fill={copa[2]} opacity={0.85} />
        <ellipse cx={-170} cy={-510} rx={70} ry={45} fill={copa[2]} opacity={0.7} />
      </g>
    </g>
  );
};

const Casa: React.FC = () => (
  <g>
    <rect x={-420} y={-300} width={840} height={300} fill="#F3E6CF" />
    <rect x={-420} y={-60} width={840} height={60} fill="#C98F5E" />
    <path d="M -480,-290 L -330,-470 L 330,-470 L 480,-290 Z" fill="#B4532F" />
    <path d="M -480,-290 L 480,-290 L 470,-270 L -470,-270 Z" fill="#8E3F22" />
    <rect x={-60} y={-200} width={110} height={200} fill="#7A5232" />
    <rect x={-300} y={-220} width={120} height={110} fill="#5E8FA8" />
    <rect x={190} y={-220} width={120} height={110} fill="#5E8FA8" />
    {/* galpão ao lado */}
    <rect x={560} y={-360} width={520} height={360} fill="#A8643C" />
    <path d="M 530,-350 L 820,-520 L 1110,-350 Z" fill="#7D8A93" />
    <rect x={730} y={-230} width={180} height={230} fill="#5B3A22" />
  </g>
);

type Item = { z: number; el: React.ReactNode };

export const Mundo: React.FC<{ v: Vista; t: number; id: string; leve?: boolean }> = ({ v, t, id, leve }) => {
  const ceu = useMemo(() => ({ nuvens: NUVENS }), []);
  const esc = v.f / 1100;
  const itens: Item[] = [];
  const add = (z: number, el: React.ReactNode) => itens.push({ z, el });
  let k = 0;

  // serras ao fundo, em função do ângulo de visão
  const serra = (base: number, amp: number, fase: number) => {
    const p: string[] = [`0,${v.h}`];
    for (let x = -20; x <= v.w + 20; x += 24) {
      const ang = v.guinada + Math.atan((x - v.cx) / v.f);
      const alt = base + amp * (0.55 * Math.sin(ang * 2.3 + fase) + 0.3 * Math.sin(ang * 5.1 + fase * 2.1) + 0.15 * Math.sin(ang * 11.3 + fase * 0.7));
      p.push(`${x},${(v.hor + 2 - alt * esc).toFixed(1)}`);
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

  // cercas do curral
  for (const tr of TRECHOS) {
    for (const h of TABUAS) {
      const q = faixa(v, tr.a, tr.b, h - 0.075, h + 0.075);
      if (q) add(q.z + 0.02, <polygon key={k++} points={q.d} fill={MADEIRA} stroke={MADEIRA_ESC} strokeWidth={Math.min(2.5, 6 / q.z) * esc} />);
    }
  }
  const poste = (p: XZ, alt: number, larg: number, cor = MADEIRA_ESC) => {
    const base = projetar(v, p[0], 0, p[1]);
    if (!base || base.x < -150 || base.x > v.w + 150) return;
    const w = (larg * v.f) / base.z, hpx = (alt * v.f) / base.z;
    add(base.z, (
      <g key={k++}>
        <rect x={base.x - w / 2} y={base.y - hpx} width={w} height={hpx} fill={cor} />
        <rect x={base.x - w / 2} y={base.y - hpx} width={w * 0.35} height={hpx} fill={MADEIRA_LUZ} opacity={0.55} />
      </g>
    ));
  };
  for (const p of POSTES) poste(p, 1.78, 0.2);

  // porteira: dois mourões altos, travessa com placa e duas folhas que abrem para dentro
  poste([-VAO, 0], 3.45, 0.32);
  poste([VAO, 0], 3.45, 0.32);
  const trave = faixa(v, [-VAO - 0.3, 0], [VAO + 0.3, 0], 3.12, 3.38);
  if (trave) add(trave.z - 0.01, <polygon key={k++} points={trave.d} fill={MADEIRA_ESC} />);
  const placa = quad(v, [[-1.05, 3.02, 0], [1.05, 3.02, 0], [1.05, 2.5, 0], [-1.05, 2.5, 0]]);
  if (placa) {
    const c = projetar(v, 0, 2.76, 0)!;
    // some ao passar por baixo, para não cobrir o título
    add(placa.z - 0.02, (
      <g key={k++} opacity={Math.min(1, Math.max(0, (c.z - 2.2) / 1.6))}>
        <polygon points={placa.d} fill="#F4EFE6" stroke="#2F5D3A" strokeWidth={(0.05 * v.f) / c.z} />
        <text x={c.x} y={c.y + (0.12 * v.f) / c.z} textAnchor="middle" fontFamily="'Roboto Slab', Georgia, serif" fontWeight={800} fontSize={(0.34 * v.f) / c.z} fill="#2F5D3A">
          CURRAL
        </text>
      </g>
    ));
  }
  const ang = aberturaPorteira(t) * 1.78;
  const COMP = 2.14;
  for (const lado of [-1, 1]) {
    const dob: XZ = [lado * VAO, 0];
    const ponta: XZ = [lado * (VAO - COMP * Math.cos(ang)), COMP * Math.sin(ang)];
    const em = (u: number): XZ => [dob[0] + (ponta[0] - dob[0]) * u, dob[1] + (ponta[1] - dob[1]) * u];
    const partes: ({ d: string; z: number } | null)[] = [
      ...[0.4, 0.78, 1.16, 1.5].map((h) => faixa(v, em(0), em(1), h - 0.065, h + 0.065)),
      faixa(v, em(0), em(0.07), 0.25, 1.62),
      faixa(v, em(0.93), em(1), 0.25, 1.62),
      quad(v, [[em(0.05)[0], 0.36, em(0.05)[1]], [em(0.05)[0], 0.52, em(0.05)[1]], [em(0.95)[0], 1.56, em(0.95)[1]], [em(0.95)[0], 1.4, em(0.95)[1]]]),
    ];
    for (const q of partes) if (q) add(q.z - 0.03, <polygon key={k++} points={q.d} fill={MADEIRA_LUZ} stroke={MADEIRA_ESC} strokeWidth={Math.min(3, 8 / q.z) * esc} />);
  }

  // corredor de arame
  for (const p of MOUROES) poste(p, 1.45, 0.14, "#75502F");
  for (const lado of [-3.4, 3.4]) {
    for (const h of [0.45, 0.85, 1.25]) {
      const q = faixa(v, [lado, -34], [lado, 0], h - 0.012, h + 0.012);
      if (q) add(40, <polygon key={k++} points={q.d} fill="#5B5B55" opacity={0.8} />);
    }
  }

  // figuras de frente para a câmera
  const figura = (X: number, Z: number, escala: number, vira: boolean, el: React.ReactNode, margem = 400) => {
    const p = projetar(v, X, 0, Z);
    if (!p || p.x < -margem * esc || p.x > v.w + margem * esc) return;
    const s = (escala * v.f) / p.z / 100;
    add(p.z, <g key={k++} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(vira ? -s : s).toFixed(4)} ${s.toFixed(4)})`}>{el}</g>);
  };
  PESAGENS.forEach((b, i) => {
    // o primeiro vem andando e para; todos erguem a cabeça quando a gente chega e levam um sustinho no flash
    const falta = i === 0 ? Math.max(0, 4.4 - t) : 0;
    const perto = Math.hypot(b.x - v.x, b.z - v.z);
    const jeito: Jeito = {
      passo: falta > 0 ? t * 5.4 : undefined,
      atento: i === 0 ? limitar((11 - perto) / 4) : prog(t, b.giro + 0.35, 0.5),
      susto: batida(t, b.clique, 3.5),
    };
    figura(b.x - 0.5 * falta * (b.vira ? -1 : 1), b.z, 1.04, b.vira, <Boi id={`${id}-p${i}`} t={t} pelagem={b.pelagem} semente={i + 1} brinco={String(12 + i * 7)} espelhado={b.vira} jeito={jeito} />);
  });
  BOIS_FUNDO.forEach((b, i) => {
    const x = b.x + (b.anda ?? 0) * t * (b.vira ? -1 : 1);
    figura(x, b.z, b.esc, b.vira, <Boi id={`${id}-f${i}`} t={t} pelagem={b.pelagem} semente={i + 5} simples={b.z > 30 || leve} jeito={{ passo: b.anda ? t * 11 * b.anda + i : undefined, pasta: b.pasta }} />);
  });
  ARVORES.forEach((a) => figura(a.x, a.z, a.esc, false, <Arvore tipo={a.tipo} vento={1.3 * Math.sin(t * 0.9 + a.x) + 0.6 * Math.sin(t * 2.3 + a.z)} />, 900));
  figura(CASA.x, CASA.z, 1, false, <Casa />, 1400);
  // cocho no fundo do curral
  figura(-4.5, 20.2, 1, false, (
    <g>
      <rect x={-160} y={-62} width={320} height={40} rx={6} fill="#7A5232" />
      <rect x={-150} y={-70} width={300} height={12} fill="#D8C27A" />
      <rect x={-140} y={-24} width={16} height={24} fill="#5B3A22" />
      <rect x={124} y={-24} width={16} height={24} fill="#5B3A22" />
    </g>
  ));
  if (!leve) {
    for (const tf of TUFOS) {
      const p = projetar(v, tf.x, 0, tf.z);
      if (!p || p.z > 38 || p.x < -60 || p.x > v.w + 60) continue;
      const s = (tf.e * v.f) / p.z / 100;
      add(p.z, (
        <g key={k++} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${s.toFixed(4)}) skewX(${(9 * Math.sin(t * 1.9 + tf.x * 0.7) + 4 * Math.sin(t * 4.3 + tf.z)).toFixed(1)})`}>
          <path d="M -14,0 C -16,-14 -22,-24 -28,-30 C -18,-26 -10,-16 -7,0 Z M -5,0 C -4,-20 -2,-34 4,-44 C 6,-30 6,-14 5,0 Z M 8,0 C 12,-12 18,-22 28,-27 C 22,-18 18,-8 17,0 Z" fill={tf.flor > 0.5 ? "#4F8A2E" : "#5F9A36"} />
          {tf.flor > 0.86 && <circle cx={4} cy={-46} r={5} fill="#F6D04A" />}
        </g>
      ));
    }
  }
  if (!leve) {
    // poeira fina no ar, pegando a luz
    for (const m of POEIRA) {
      const p = projetar(v, m.x + 0.5 * Math.sin(t * 0.4 + m.f) + 0.12 * t, m.y + 0.15 * Math.sin(t * 0.7 + m.f * 2), m.z);
      if (!p || p.x < -20 || p.x > v.w + 20) continue;
      add(p.z, <circle key={k++} cx={p.x} cy={p.y} r={Math.max(1.2, (m.r * v.f) / p.z)} fill="#FFF4DC" opacity={0.3 + 0.25 * Math.sin(t * 1.3 + m.f)} />);
    }
  }
  itens.sort((a, b) => b.z - a.z);

  const curral = chao(v, [[CURRAL.x0, 0], [CURRAL.x1, 0], [CURRAL.x1, CURRAL.z1], [CURRAL.x0, CURRAL.z1]]);
  const estrada = chao(v, [[-2.1, -60], [2.1, -60], [2.3, 0], [-2.3, 0]]);
  const sol = angTela(SOL);
  return (
    <svg width={v.w} height={v.h} viewBox={`0 0 ${v.w} ${v.h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`${id}-ceu`} gradientUnits="userSpaceOnUse" x1={0} y1={v.hor - 1500 * esc} x2={0} y2={v.hor}>
          <stop offset="0" stopColor="#3F8FD6" />
          <stop offset="0.55" stopColor="#8CC4EC" />
          <stop offset="0.88" stopColor="#D8ECF4" />
          <stop offset="1" stopColor="#FBE8C2" />
        </linearGradient>
        <linearGradient id={`${id}-pasto`} gradientUnits="userSpaceOnUse" x1={0} y1={v.hor} x2={0} y2={v.hor + 900 * esc}>
          <stop offset="0" stopColor="#A9C76A" />
          <stop offset="0.12" stopColor="#8DB850" />
          <stop offset="1" stopColor="#6C9E38" />
        </linearGradient>
        <linearGradient id={`${id}-terra`} gradientUnits="userSpaceOnUse" x1={0} y1={v.hor} x2={0} y2={v.hor + 900 * esc}>
          <stop offset="0" stopColor="#D2A070" />
          <stop offset="1" stopColor="#B57C4C" />
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
      {ceu.nuvens.map((n, i) => {
        const x = angTela(n.ang + t * 0.5);
        if (x === null) return null;
        const s = n.e * esc;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${(v.hor - n.alt * 1500 * esc).toFixed(1)}) scale(${s})`} fill="#FFFFFF" opacity={0.92}>
            <ellipse cx={0} cy={0} rx={150} ry={46} />
            <ellipse cx={-70} cy={-28} rx={80} ry={48} />
            <ellipse cx={30} cy={-46} rx={96} ry={62} />
            <ellipse cx={110} cy={-16} rx={70} ry={38} />
          </g>
        );
      })}
      {BANDOS.map((b, i) => {
        const x = angTela(b.ang + b.vel * t);
        if (x === null) return null;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${(v.hor - b.alt * 1500 * esc + 14 * Math.sin(t * 0.8 + i)).toFixed(1)}) scale(${esc})`} stroke="#2E3B45" strokeWidth={4} fill="none" strokeLinecap="round">
            {Array.from({ length: b.n }, (_, j) => {
              const asa = 9 * Math.sin(t * 9 + j * 1.3);
              const dx = (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 46 + 6 * Math.sin(t * 1.1 + j), dy = Math.ceil(j / 2) * 24 + 5 * Math.sin(t * 1.7 + j * 2);
              return <path key={j} d={`M ${dx - 15},${dy + asa} Q ${dx - 7},${dy - asa * 0.6} ${dx},${dy} Q ${dx + 7},${dy - asa * 0.6} ${dx + 15},${dy + asa}`} />;
            })}
          </g>
        );
      })}
      <polygon points={serra(70, 46, 0.4)} fill="#9DBFC4" />
      <polygon points={serra(40, 34, 2.2)} fill="#86B08A" />
      <polygon points={serra(16, 14, 4.1)} fill="#7FAE5E" />
      <rect x={0} y={v.hor} width={v.w} height={Math.max(0, v.h - v.hor)} fill={`url(#${id}-pasto)`} />
      {estrada && <polygon points={estrada} fill="#CDA272" />}
      {curral && <polygon points={curral} fill={`url(#${id}-terra)`} />}
      {!leve && MANCHAS.map((m, i) => {
        const p = projetar(v, m.x, 0, m.z);
        if (!p || p.z < 1.2) return null;
        const rx = (m.r * v.f) / p.z;
        return <ellipse key={i} cx={p.x} cy={p.y} rx={rx} ry={(rx * v.y) / p.z * 0.9} fill={i % 3 ? "#A56F42" : "#DDB080"} opacity={0.35} />;
      })}
      {itens.map((i) => i.el)}
    </svg>
  );
};

/** Caixa (em pixels da vista) que enquadra um boi parado em (x, z). */
export function caixaDoBoi(v: Vista, x: number, z: number) {
  const c = projetar(v, x, 0.86, z);
  if (!c) return null;
  const e = v.f / c.z;
  return { cx: c.x, cy: c.y, w: 2.85 * e, h: 2.05 * e };
}
