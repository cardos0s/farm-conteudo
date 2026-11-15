import React from "react";
import { Boi, type Jeito } from "../pesagem/Boi";
import { Arvore, type P3, type Vista, type XZ, aleatorio, chao, faixa, projetar, quad } from "../pesagem/Mundo";
import { batida, limitar, prog } from "../pesagem/roteiro";
import { BEBEDOURO, BOI_FOTO, GUINADA_BOI, T_CLIQUE, TRATO_DESDE, X_CAM, X_VAGAO, Z_PARADA, tratoAte, vagaoVel, vagaoZ } from "./roteiro";

// O confinamento: corredor de trato no meio, linha de cocho dos dois lados, baias (lotes) com sombrite
// e bebedouro, vagão misturador distribuindo o trato e a fábrica de ração no fundo. Tudo em metros.

const COCHO_X = 3.3, COCHO_L = 0.8, COCHO_H = 0.6, CERCA_X = 4.25, FUNDO_X = 36;
const Z_INI = 2, Z_FIM = 146, BAIA = 24;
const CONCRETO = "#BDB7AA", CONCRETO_ESC = "#8E897E", CONCRETO_LUZ = "#D6D1C4", RACAO = "#D9B14A", RACAO_ESC = "#B98E2E";
const MADEIRA = "#8C5B34", MADEIRA_ESC = "#6A4224", MADEIRA_LUZ = "#B07A48";

type BoiC = { x: number; z: number; pelagem: string; vira: boolean; esc: number; semente: number; cocho?: boolean; come?: number; anda?: number };
const BOIS: BoiC[] = [];
{
  const r = aleatorio(91);
  const cor = () => { const x = r(); return x < 0.68 ? "branco" : x < 0.86 ? "cinza" : "caramelo"; };
  const grau = Math.PI / 180;
  const naMira = (x: number, z: number) => {
    // nada entre a câmera parada e o boi da foto, nem em cima do bebedouro
    const ang = Math.atan2(x - X_CAM, z - Z_PARADA) / grau, d = Math.hypot(x - X_CAM, z - Z_PARADA);
    if (Math.abs(ang - GUINADA_BOI) < 17 && d < 32) return true;
    if (Math.hypot(x - BOI_FOTO.x, z - BOI_FOTO.z) < 3.4) return true;
    return Math.abs(x - BEBEDOURO.x) < 3.2 && Math.abs(z - BEBEDOURO.z) < 1.6;
  };
  // na linha de cocho da esquerda: quase lotado, esperando o trato
  for (let z = 3.6; z < 130; z += 1.7 + r() * 0.5) if (r() < 0.82) BOIS.push({ x: -4.72 - r() * 0.14, z, pelagem: cor(), vira: false, esc: 0.94 + r() * 0.1, semente: r() * 9, cocho: true });
  // na da direita: poucos, beliscando a sobra
  for (let z = 3.6; z < 130; z += 1.9 + r() * 0.8) {
    const x = 4.72 + r() * 0.14, p = cor(), e = 0.94 + r() * 0.1, s = r() * 9, come = r();
    if (r() < 0.34 && !naMira(x, z)) BOIS.push({ x, z, pelagem: p, vira: true, esc: e, semente: s, cocho: true, come: come < 0.6 ? 1 : 0 });
  }
  // soltos nas baias
  for (const lado of [-1, 1]) {
    for (let z0 = Z_INI; z0 < 122; z0 += BAIA) {
      for (let i = 0; i < 7; i++) {
        const x = lado * (7.5 + r() * 24), z = z0 + 1.5 + r() * (BAIA - 3), vira = r() < 0.5, p = cor(), e = 0.92 + r() * 0.12, s = r() * 9, anda = r() < 0.3 ? 0.25 + r() * 0.15 : undefined;
        if (!naMira(x, z)) BOIS.push({ x, z, pelagem: p, vira, esc: e, semente: s, anda });
      }
    }
  }
  // um bebendo água
  BOIS.push({ x: BEBEDOURO.x + 2.05, z: BEBEDOURO.z + 0.1, pelagem: "branco", vira: true, esc: 1, semente: 3.3, come: 0.8 });
}
const ARVORES = [
  { x: -46, z: 20, esc: 1.4, tipo: 0 }, { x: -52, z: 58, esc: 1.5, tipo: 1 }, { x: -44, z: 96, esc: 1.3, tipo: 0 }, { x: -58, z: 130, esc: 1.5, tipo: 2 },
  { x: 47, z: 12, esc: 1.5, tipo: 1 }, { x: 55, z: 50, esc: 1.3, tipo: 0 }, { x: 45, z: 84, esc: 1.4, tipo: 2 }, { x: 52, z: 120, esc: 1.5, tipo: 0 },
  { x: -40, z: -8, esc: 1.2, tipo: 1 }, { x: 42, z: -12, esc: 1.3, tipo: 0 }, { x: 70, z: 160, esc: 1.6, tipo: 1 }, { x: -70, z: 170, esc: 1.6, tipo: 0 },
];
const NUVENS = [
  { ang: -75, alt: 0.3, e: 1.1 }, { ang: -40, alt: 0.42, e: 0.9 }, { ang: -6, alt: 0.26, e: 1.2 }, { ang: 28, alt: 0.4, e: 0.85 },
  { ang: 58, alt: 0.28, e: 1.15 }, { ang: 92, alt: 0.38, e: 0.9 }, { ang: 125, alt: 0.26, e: 1.1 },
];
const POEIRA: { x: number; y: number; z: number; r: number; f: number }[] = [];
{
  const r = aleatorio(5);
  for (let i = 0; i < 90; i++) POEIRA.push({ x: -9 + r() * 18, y: 0.2 + r() * 2.8, z: -6 + r() * 60, r: 0.012 + r() * 0.022, f: r() * 6.28 });
}
const MANCHAS: { x: number; z: number; r: number }[] = [];
{
  const r = aleatorio(17);
  for (let i = 0; i < 70; i++) { const lado = r() < 0.5 ? -1 : 1; MANCHAS.push({ x: lado * (5.5 + r() * 26), z: 3 + r() * 70, r: 0.5 + r() * 1.1 }); }
}

/** Vagão misturador visto por trás, com o trator na frente. 1 = 1 cm, origem no chão. */
const Vagao: React.FC<{ t: number; despeja: number }> = ({ t, despeja }) => {
  const treme = despeja * 1.5 * Math.sin(t * 31);
  return (
    <g transform={`translate(0 ${treme.toFixed(1)})`}>
      <ellipse cx={0} cy={0} rx={175} ry={20} fill="#2B1D10" opacity={0.3} />
      {/* trator */}
      <rect x={-62} y={-372} width={124} height={120} rx={10} fill="#2F6B3F" />
      <rect x={-50} y={-360} width={100} height={74} rx={6} fill="#9FCBE0" />
      <rect x={-70} y={-384} width={140} height={16} rx={6} fill="#24532F" />
      <rect x={-8} y={-396} width={16} height={12} rx={3} fill={Math.sin(t * 9) > 0 ? "#FFB020" : "#C97A10"} />
      <rect x={46} y={-430} width={9} height={62} fill="#3A3A3A" />
      {[0, 1, 2].map((i) => {
        const p = (t * 0.9 + i / 3) % 1;
        return <circle key={i} cx={50 + 22 * p} cy={-436 - 90 * p} r={10 + 26 * p} fill="#6B6B6B" opacity={0.35 * (1 - p) * (0.4 + 0.6 * despeja)} />;
      })}
      {/* rodas e eixo */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 100 - 22} y={-100} width={44} height={100} rx={14} fill="#1D1D1D" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={s * 100 - 22} y={-92 + ((i * 25 + t * 160 * despeja) % 100)} width={44} height={5} fill="#3A3A3A" />)}
        </g>
      ))}
      <rect x={-92} y={-74} width={184} height={20} fill="#2E2E2E" />
      {/* caçamba */}
      <path d="M -124,-256 L 124,-256 L 106,-84 L -106,-84 Z" fill="#C4472B" />
      <path d="M -124,-256 L -100,-256 L -90,-84 L -106,-84 Z" fill="#E0694B" opacity={0.8} />
      {[-52, 0, 52].map((x) => <path key={x} d={`M ${x},-252 L ${x * 0.88},-88`} stroke="#8E2E1A" strokeWidth={5} />)}
      <rect x={-130} y={-268} width={260} height={16} rx={4} fill="#8E2E1A" />
      <ellipse cx={0} cy={-268} rx={104} ry={24} fill={RACAO} />
      <ellipse cx={-22} cy={-274} rx={58} ry={13} fill="#E7C866" />
      <rect x={-96} y={-128} width={192} height={18} fill="#F4E04D" />
      {[-1, 1].map((s) => <rect key={s} x={s * 84 - 12} y={-108} width={24} height={14} rx={3} fill="#D92B2B" />)}
      {/* bica de descarga para o cocho, à esquerda */}
      <path d="M -108,-176 L -222,-150 L -226,-118 L -108,-132 Z" fill="#8E2E1A" />
      <path d="M -108,-170 L -220,-146 L -221,-138 L -108,-158 Z" fill="#B5452F" />
      {despeja > 0.05 && Array.from({ length: 14 }, (_, i) => {
        const p = (t * 2.6 + i / 14) % 1;
        return <rect key={i} x={-226 - 26 * p + 9 * Math.sin(i * 7.3)} y={-122 + 62 * p * p + 5 * Math.sin(i * 3.1)} width={11} height={8} rx={2} fill={i % 3 ? RACAO : "#F0D77A"} opacity={despeja} />;
      })}
    </g>
  );
};

const Fabrica: React.FC = () => (
  <g>
    {[-520, -300, -80].map((x, i) => (
      <g key={i}>
        <rect x={x} y={-900} width={190} height={900} fill={i % 2 ? "#C9CED2" : "#B7BDC2"} />
        <rect x={x} y={-900} width={50} height={900} fill="#E3E7EA" opacity={0.7} />
        <path d={`M ${x - 8},-900 L ${x + 95},-1010 L ${x + 198},-900 Z`} fill="#9AA1A7" />
        {[1, 2, 3, 4, 5].map((k) => <rect key={k} x={x} y={-900 + k * 150} width={190} height={5} fill="#8E959B" opacity={0.6} />)}
      </g>
    ))}
    <rect x={180} y={-520} width={760} height={520} fill="#B5764A" />
    <path d="M 140,-510 L 560,-720 L 980,-510 Z" fill="#7D8A93" />
    <rect x={430} y={-330} width={260} height={330} fill="#5B3A22" />
    <rect x={-530} y={-1040} width={1250} height={14} fill="#7C848A" />
  </g>
);

const Bebedouro: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <ellipse cx={0} cy={2} rx={130} ry={16} fill="#2B1D10" opacity={0.25} />
    <path d="M -110,-58 L 110,-58 L 98,0 L -98,0 Z" fill={CONCRETO} />
    <path d="M -110,-58 L -90,-58 L -82,0 L -98,0 Z" fill={CONCRETO_LUZ} />
    <ellipse cx={0} cy={-58} rx={110} ry={17} fill={CONCRETO_ESC} />
    <ellipse cx={0} cy={-57} rx={98} ry={13} fill="#4FA3D4" />
    <ellipse cx={-30 + 12 * Math.sin(t * 1.3)} cy={-59} rx={34} ry={4} fill="#BFE6F7" opacity={0.8} />
    <ellipse cx={40 + 8 * Math.sin(t * 1.9 + 1)} cy={-54} rx={22} ry={3} fill="#BFE6F7" opacity={0.6} />
  </g>
);

type Item = { z: number; el: React.ReactNode };

export const Confinamento: React.FC<{ v: Vista; t: number; id: string; leve?: boolean }> = ({ v, t, id, leve }) => {
  const esc = v.f / 1100;
  const itens: Item[] = [];
  const add = (z: number, el: React.ReactNode) => itens.push({ z, el });
  let k = 0;
  const longe = leve ? 60 : 95;

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
  const poli = (q: { d: string; z: number } | null, dz: number, cor: string, extra: React.SVGProps<SVGPolygonElement> = {}) => {
    if (q) add(q.z + dz, <polygon key={k++} points={q.d} fill={cor} {...extra} />);
  };
  const poste = (p: XZ, alt: number, larg: number, cor = MADEIRA_ESC, luz = MADEIRA_LUZ) => {
    const base = projetar(v, p[0], 0, p[1]);
    if (!base || base.z > longe || base.x < -150 || base.x > v.w + 150) return;
    const w = (larg * v.f) / base.z, hpx = (alt * v.f) / base.z;
    add(base.z, (
      <g key={k++}>
        <rect x={base.x - w / 2} y={base.y - hpx} width={w} height={hpx} fill={cor} />
        <rect x={base.x - w / 2} y={base.y - hpx} width={w * 0.35} height={hpx} fill={luz} opacity={0.55} />
      </g>
    ));
  };
  const figura = (X: number, Z: number, escala: number, vira: boolean, el: React.ReactNode, margem = 400, max = longe) => {
    const p = projetar(v, X, 0, Z);
    if (!p || p.z > max || p.x < -margem * esc || p.x > v.w + margem * esc) return;
    const s = (escala * v.f) / p.z / 100;
    add(p.z, <g key={k++} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(vira ? -s : s).toFixed(4)} ${s.toFixed(4)})`}>{el}</g>);
  };
  const plano = (x0: number, x1: number, z0: number, z1: number, y: number) => quad(v, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]] as P3[]);

  // ── linha de cocho, dos dois lados ──
  const feito = tratoAte(t);
  const zc0 = Math.max(Z_INI, Math.floor((v.z - 12) / 1.5) * 1.5 + 0.5);
  for (const lado of [-1, 1]) {
    const xi = lado * COCHO_X, xe = lado * (COCHO_X + COCHO_L);
    for (let z = zc0; z < Math.min(Z_FIM, v.z + longe); z += 1.5) {
      const z1 = z + 1.5;
      const frente = faixa(v, [xi, z], [xi, z1], 0, COCHO_H);
      if (!frente) continue;
      poli(frente, 0.05, CONCRETO, { stroke: CONCRETO_ESC, strokeWidth: Math.min(2, 5 / frente.z) * esc });
      poli(faixa(v, [xe, z], [xe, z1], COCHO_H - 0.1, COCHO_H + 0.06), 0.3, CONCRETO_ESC);
      const cheio = lado < 0 && z1 > TRATO_DESDE && z < feito;
      const sobra = !cheio && (Math.sin(z * 12.9898 + lado * 4.1) * 43758.5453) % 1 > (lado < 0 ? 0.55 : 0.25);
      poli(plano(xi + lado * 0.07, xe - lado * 0.04, z, z1, COCHO_H - 0.1), 0.18, cheio ? RACAO : "#7E786D");
      if (cheio && !leve) poli(plano(xi + lado * 0.22, xe - lado * 0.22, z + 0.1, z1 - 0.2, COCHO_H - 0.02), 0.16, z % 3 < 1.5 ? "#E6C665" : RACAO_ESC);
      if (sobra) poli(plano(xi + lado * 0.3, xe - lado * 0.25, z + 0.2, z1 - 0.5, COCHO_H - 0.09), 0.16, RACAO_ESC, { opacity: 0.85 });
      poli(plano(xi, xi + lado * 0.07, z, z1, COCHO_H), 0.1, CONCRETO_LUZ);
    }
    // cerca de cabo atrás do cocho
    const zp0 = Math.max(Z_INI, Math.floor((v.z - 10) / 3) * 3 + 2);
    for (let z = zp0; z < Math.min(Z_FIM, v.z + longe); z += 3) poste([lado * CERCA_X, z], 1.55, 0.13, "#6F6A62", "#A39D92");
    for (const h of [0.82, 1.12, 1.42]) {
      for (let z = zp0; z < Math.min(Z_FIM, v.z + longe); z += 12) poli(faixa(v, [lado * CERCA_X, z], [lado * CERCA_X, z + 12], h - 0.016, h + 0.016), 0.2, "#4E4E4A");
    }
    // divisas das baias, com a placa do lote virada para o corredor
    for (let z = Z_INI, n = 0; z <= Z_FIM; z += BAIA, n++) {
      if (z < v.z - 4 || z > v.z + longe) continue;
      for (let x = CERCA_X; x < FUNDO_X; x += 4) {
        poste([lado * x, z], 1.6, 0.16);
        for (const h of [0.5, 0.95, 1.4]) poli(faixa(v, [lado * x, z], [lado * Math.min(FUNDO_X, x + 4), z], h - 0.06, h + 0.06), 0.02, MADEIRA, { stroke: MADEIRA_ESC, strokeWidth: 1 });
      }
      if (z >= Z_FIM) continue;
      const zp = z + 1.2, x0 = lado * 4.5, x1 = lado * 6.5;
      poste([x0, zp], 2.7, 0.1);
      poste([x1, zp], 2.7, 0.1);
      const placa = quad(v, [[Math.min(x0, x1), 2.7, zp], [Math.max(x0, x1), 2.7, zp], [Math.max(x0, x1), 1.95, zp], [Math.min(x0, x1), 1.95, zp]]);
      const c = projetar(v, (x0 + x1) / 2, 2.32, zp);
      if (placa && c && c.z < 60) {
        add(placa.z - 0.02, (
          <g key={k++}>
            <polygon points={placa.d} fill="#F4EFE6" stroke="#2F5D3A" strokeWidth={(0.06 * v.f) / c.z} />
            <text x={c.x} y={c.y + (0.15 * v.f) / c.z} textAnchor="middle" fontFamily="'Roboto Slab', Georgia, serif" fontWeight={800} fontSize={(0.44 * v.f) / c.z} fill="#2F5D3A">
              {`LOTE ${n * 2 + (lado > 0 ? 2 : 1)}`}
            </text>
          </g>
        ));
      }
      // sombrite e bebedouro de cada baia
      const zs = z + BAIA / 2, xs0 = lado * 13, xs1 = lado * 24;
      for (const [px, pz] of [[xs0, zs - 4], [xs1, zs - 4], [xs0, zs + 4], [xs1, zs + 4]] as XZ[]) poste([px, pz], 3.7, 0.16, "#5A554E", "#8D877D");
      poli(plano(Math.min(xs0, xs1) - 0.5, Math.max(xs0, xs1) + 0.5, zs - 4.6, zs + 4.6, 3.7), -0.5, "#2E3B33", { opacity: 0.86 });
      if (!(lado > 0 && Math.abs(z + 17 - BEBEDOURO.z) < 14)) figura(lado * 9.5, z + 17, 1, false, <Bebedouro t={t} />);
    }
  }
  figura(BEBEDOURO.x, BEBEDOURO.z, 1, false, <Bebedouro t={t} />);

  // ── entrada: pórtico ──
  poste([-3.25, 0], 4.2, 0.34);
  poste([3.25, 0], 4.2, 0.34);
  poli(faixa(v, [-3.6, 0], [3.6, 0], 3.78, 4.08), -0.01, MADEIRA_ESC);

  // ── gado ──
  for (let i = 0; i < BOIS.length; i++) {
    const b = BOIS[i]!;
    let jeito: Jeito;
    if (b.cocho && !b.vira) {
      // esperando o trato; baixa a cabeça para comer quando o vagão passa
      const come = prog(feito - b.z, 0.2, 1.6);
      jeito = { pasta: come, atento: 0.45 * (1 - come) };
    } else if (b.cocho) jeito = { pasta: b.come };
    else jeito = { passo: b.anda ? t * 11 * b.anda + i : undefined, pasta: b.come };
    const x = b.x + (b.anda ?? 0) * t * (b.vira ? -1 : 1);
    const d = Math.hypot(x - v.x, b.z - v.z);
    figura(x, b.z, b.esc, b.vira, <Boi id={`${id}-b${i}`} t={t} pelagem={b.pelagem} semente={b.semente} simples={leve || d > 26} jeito={jeito} />, 400, leve ? 45 : 80);
  }
  figura(BOI_FOTO.x, BOI_FOTO.z, 1.08, false, <Boi id={`${id}-foto`} t={t} pelagem="branco" semente={2} brinco="27" jeito={{ atento: prog(t, T_CLIQUE - 2.2, 0.6), susto: batida(t, T_CLIQUE, 3.5) }} />);

  // ── vagão de trato ──
  const despeja = limitar(vagaoVel(t) / 1.2);
  const zv = vagaoZ(t);
  figura(X_VAGAO, zv, 1, false, <Vagao t={t} despeja={despeja} />, 700);
  if (despeja > 0.05) {
    for (let i = 0; i < 7; i++) {
      const p = (t * 0.7 + i / 7) % 1;
      const pp = projetar(v, X_VAGAO + (i % 2 ? 1 : -1) * 1.0 + 0.3 * Math.sin(i * 5), 0.25 + 0.9 * p, zv - 0.6 - 2.8 * p);
      if (pp) add(pp.z, <circle key={k++} cx={pp.x} cy={pp.y} r={((0.35 + 0.8 * p) * v.f) / pp.z} fill="#E2C39A" opacity={0.3 * (1 - p) * despeja} />);
    }
  }

  ARVORES.forEach((a) => figura(a.x, a.z, a.esc, false, <Arvore tipo={a.tipo} vento={1.3 * Math.sin(t * 0.9 + a.x) + 0.6 * Math.sin(t * 2.3 + a.z)} />, 900, 400));
  figura(9, 178, 1, false, <Fabrica />, 1600, 400);
  // silo trincheira coberto de lona, à esquerda no fundo
  figura(-62, 150, 1, false, (
    <g>
      <path d="M -900,0 C -700,-330 500,-330 900,0 Z" fill="#ECECE6" />
      <path d="M -900,0 C -700,-330 -200,-330 0,-250 C -300,-250 -700,-180 -900,0 Z" fill="#FFFFFF" opacity={0.7} />
      {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={-700 + i * 125} cy={-70 - 150 * Math.sin((i / 11) * Math.PI)} rx={34} ry={22} fill="#2A2A2A" />)}
    </g>
  ), 2000, 400);

  if (!leve) {
    for (const m of POEIRA) {
      const p = projetar(v, m.x + 0.5 * Math.sin(t * 0.4 + m.f) + 0.1 * t, m.y + 0.15 * Math.sin(t * 0.7 + m.f * 2), v.z + ((m.z - v.z) % 60 + 60) % 60 - 4);
      if (!p || p.x < -20 || p.x > v.w + 20) continue;
      add(p.z, <circle key={k++} cx={p.x} cy={p.y} r={Math.max(1.2, (m.r * v.f) / p.z)} fill="#FFF4DC" opacity={0.3 + 0.25 * Math.sin(t * 1.3 + m.f)} />);
    }
  }
  itens.sort((a, b) => b.z - a.z);

  const corredor = chao(v, [[-COCHO_X, -70], [COCHO_X, -70], [COCHO_X, 190], [-COCHO_X, 190]]);
  const rastros = [-2.25, -0.45, 0.45, 2.25].map((x) => chao(v, [[x - 0.22, -70], [x + 0.22, -70], [x + 0.22, 190], [x - 0.22, 190]]));
  const baias = [-1, 1].map((s) => chao(v, [[s * COCHO_X, Z_INI], [s * FUNDO_X, Z_INI], [s * FUNDO_X, Z_FIM], [s * COCHO_X, Z_FIM]]));
  const pisos = [-1, 1].map((s) => chao(v, [[s * (COCHO_X + COCHO_L), Z_INI], [s * 7.2, Z_INI], [s * 7.2, Z_FIM], [s * (COCHO_X + COCHO_L), Z_FIM]]));
  const sol = angTela(-28);
  const bando = angTela(70 - 4.2 * t);
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
          <stop offset="0" stopColor="#C99A6C" />
          <stop offset="1" stopColor="#A9734A" />
        </linearGradient>
        <linearGradient id={`${id}-corredor`} gradientUnits="userSpaceOnUse" x1={0} y1={v.hor} x2={0} y2={v.hor + 900 * esc}>
          <stop offset="0" stopColor="#DDBD92" />
          <stop offset="1" stopColor="#CDA676" />
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
          <g key={i} transform={`translate(${x.toFixed(1)} ${(v.hor - n.alt * 1500 * esc).toFixed(1)}) scale(${n.e * esc})`} fill="#FFFFFF" opacity={0.92}>
            <ellipse cx={0} cy={0} rx={150} ry={46} />
            <ellipse cx={-70} cy={-28} rx={80} ry={48} />
            <ellipse cx={30} cy={-46} rx={96} ry={62} />
            <ellipse cx={110} cy={-16} rx={70} ry={38} />
          </g>
        );
      })}
      {bando !== null && (
        <g transform={`translate(${bando.toFixed(1)} ${(v.hor - 0.33 * 1500 * esc + 14 * Math.sin(t * 0.8)).toFixed(1)}) scale(${esc})`} stroke="#2E3B45" strokeWidth={4} fill="none" strokeLinecap="round">
          {Array.from({ length: 6 }, (_, j) => {
            const asa = 9 * Math.sin(t * 9 + j * 1.3);
            const dx = (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 46 + 6 * Math.sin(t * 1.1 + j), dy = Math.ceil(j / 2) * 24 + 5 * Math.sin(t * 1.7 + j * 2);
            return <path key={j} d={`M ${dx - 15},${dy + asa} Q ${dx - 7},${dy - asa * 0.6} ${dx},${dy} Q ${dx + 7},${dy - asa * 0.6} ${dx + 15},${dy + asa}`} />;
          })}
        </g>
      )}
      <polygon points={serra(70, 46, 0.4)} fill="#9DBFC4" />
      <polygon points={serra(40, 34, 2.2)} fill="#86B08A" />
      <polygon points={serra(16, 14, 4.1)} fill="#7FAE5E" />
      <rect x={0} y={v.hor} width={v.w} height={Math.max(0, v.h - v.hor)} fill={`url(#${id}-pasto)`} />
      {baias.map((p, i) => p && <polygon key={i} points={p} fill={`url(#${id}-terra)`} />)}
      {pisos.map((p, i) => p && <polygon key={i} points={p} fill="#B9AE9C" opacity={0.75} />)}
      {corredor && <polygon points={corredor} fill={`url(#${id}-corredor)`} />}
      {rastros.map((p, i) => p && <polygon key={i} points={p} fill="#B98F62" opacity={0.45} />)}
      {!leve && MANCHAS.map((m, i) => {
        const p = projetar(v, m.x, 0, m.z);
        if (!p || p.z < 1.2 || p.z > 50) return null;
        const rx = (m.r * v.f) / p.z;
        return <ellipse key={i} cx={p.x} cy={p.y} rx={rx} ry={((rx * v.y) / p.z) * 0.9} fill={i % 3 ? "#8E5E38" : "#D9B285"} opacity={0.3} />;
      })}
      {itens.map((i) => i.el)}
    </svg>
  );
};
