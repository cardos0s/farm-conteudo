import React from "react";
import { Marca } from "./Celular";
import { A, L, PESAGENS, T, T_CEL_DESCE, T_LOTE, boiAtual, fora, lerp, limitar, mola, prog } from "./roteiro";

// Letreiros, adesivos, selos e confete por cima da cena.

const VERDE = "#2F5D3A", VERDE_ESC = "#16301D", CREME = "#FFF8EA", LARANJA = "#B5651D", AMARELO = "#FFD166";
const TITULO = "'Roboto Slab', Georgia, serif", CORPO = "Inter, Arial, sans-serif";

const Letra: React.FC<{ x: number; y: number; tam: number; cor?: string; borda?: number; children: React.ReactNode; ancora?: "middle" | "start" | "end" }> = ({ x, y, tam, cor = CREME, borda = 0.2, children, ancora = "middle" }) => (
  <>
    <text x={x} y={y + tam * 0.07} textAnchor={ancora} fontFamily={TITULO} fontWeight={800} fontSize={tam} fill={VERDE_ESC} stroke={VERDE_ESC} strokeWidth={tam * borda} strokeLinejoin="round" opacity={0.55}>
      {children}
    </text>
    <text x={x} y={y} textAnchor={ancora} fontFamily={TITULO} fontWeight={800} fontSize={tam} fill={cor} stroke={VERDE_ESC} strokeWidth={tam * borda} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  </>
);

function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const CORES_CONFETE = ["#2F5D3A", "#F4EFE6", "#FFD166", "#E07A2F", "#7BE08A", "#FFFFFF"];
const Confete: React.FC<{ t: number; de: number; semente: number; x?: number; y?: number }> = ({ t, de, semente, x = 540, y = 360 }) => {
  const dt = t - de;
  if (dt < 0 || dt > 2.6) return null;
  const r = aleatorio(semente);
  return (
    <g opacity={1 - limitar((dt - 1.9) / 0.7)}>
      {Array.from({ length: 110 }, (_, i) => {
        const ang = r() * Math.PI * 2, vel = 500 + r() * 1300, w = 14 + r() * 18, cor = CORES_CONFETE[i % CORES_CONFETE.length]!, gira = (r() - 0.5) * 900, fase = r() * 6;
        const arrasto = (1 - Math.exp(-2.2 * dt)) / 2.2;
        const px = x + Math.cos(ang) * vel * arrasto;
        const py = y + Math.sin(ang) * vel * arrasto * 0.8 - 260 * arrasto + 620 * dt * dt;
        return <rect key={i} x={-w / 2} y={-w * 0.3} width={w} height={w * 0.6} rx={2} fill={cor} transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${(gira * dt).toFixed(0)}) scale(1 ${Math.cos(dt * 9 + fase).toFixed(2)})`} />;
      })}
    </g>
  );
};

const Adesivo: React.FC<{ x: number; y: number; tam: number; giro: number; escala: number; fundo?: string; cor?: string; children: string; opacidade?: number }> = ({ x, y, tam, giro, escala, fundo = LARANJA, cor = CREME, children, opacidade = 1 }) => {
  const w = children.length * tam * 0.6 + tam * 1.3, h = tam * 1.75;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`} opacity={opacidade}>
      <rect x={-w / 2 - 8} y={-h / 2 - 2} width={w + 16} height={h + 16} rx={h / 2 + 8} fill="#000" opacity={0.22} />
      <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx={h / 2 + 8} fill="#FFFFFF" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fundo} />
      <text x={0} y={tam * 0.35} textAnchor="middle" fontFamily={TITULO} fontWeight={800} fontSize={tam} fill={cor}>
        {children}
      </text>
    </g>
  );
};

const SELOS = [
  { texto: "SEM TRONCO", t: T.tronco - 0.12, giro: -4 },
  { texto: "SEM BALANÇA", t: T.balanca - 0.12, giro: 3 },
  { texto: "SEM ESTRESSE", t: T.estresse - 0.12, giro: -3 },
];

export const Sobreposicoes: React.FC<{ t: number }> = ({ t }) => {
  // 1. A porteira
  const tituloSai = 1 - prog(t, 2.95, 0.3);
  const l1 = prog(t, 0.2, 0.45, mola), l2 = prog(t, 0.5, 0.45, mola);
  const vem = prog(t, T.vem - 0.05, 0.4, mola);
  const pulo = t > T.vem ? Math.abs(Math.sin((t - T.vem) * 6.5)) * 46 * Math.exp(-(t - T.vem) * 1.1) : 0;
  // 2. A foto
  const chuta = prog(t, T.chuta + 0.05, 0.4, mola) * (1 - prog(t, T.abro - 0.25, 0.3));
  const i = boiAtual(t);
  const b = PESAGENS[i]!;
  const fimPeso = [T.proximo + 0.05, PESAGENS[2].giro - 0.05, T_LOTE - 0.15][i]!;
  const pesoVis = t >= b.mostra ? 1 - prog(t, fimPeso, 0.25) : 0;
  const kg = Math.round(b.peso * prog(t, b.mostra, b.conta, fora));
  const chegou = b.mostra + b.conta;
  const estouro = t >= chegou ? 1 + 0.22 * Math.exp(-(t - chegou) * 7) * Math.cos((t - chegou) * 16) : lerp(0.7, 1, prog(t, b.mostra, 0.25, mola));
  const selosSaem = 1 - prog(t, T.proximo, 0.25);
  // 4. O fecho
  const fecho = prog(t, T_CEL_DESCE + 0.25, 0.6);
  const nome = prog(t, T_CEL_DESCE + 0.35, 0.55, mola);
  const segue = prog(t, T_CEL_DESCE + 0.8, 0.45, mola);
  const pulsa = t > T_CEL_DESCE + 1.3 ? 1 + 0.04 * Math.sin((t - T_CEL_DESCE - 1.3) * 6) : 1;
  const flashes = PESAGENS.reduce((s, p) => s + (t >= p.clique ? 1 - prog(t, p.clique, 0.28, fora) : 0), 0);
  return (
    <>
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sb-vinheta" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.62" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#1A1206" stopOpacity={0.42} />
          </radialGradient>
          <linearGradient id="sb-fecho" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#16301D" stopOpacity={0.82} />
            <stop offset="0.62" stopColor="#16301D" stopOpacity={0.5} />
            <stop offset="1" stopColor="#16301D" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill="url(#sb-vinheta)" />
        <rect width={L} height={A} fill="#fff" opacity={flashes * 0.4} />

        {tituloSai > 0 && (
          <g opacity={tituloSai} transform={`translate(0 ${-(1 - tituloSai) * 80})`}>
            <g transform={`translate(540 330) scale(${l1}) rotate(-2)`} opacity={limitar(l1 * 2)}>
              <Letra x={0} y={0} tam={104}>Bora pesar o gado</Letra>
            </g>
            <g transform={`translate(540 480) scale(${l2}) rotate(-2)`} opacity={limitar(l2 * 2)}>
              <Letra x={0} y={0} tam={138} cor={AMARELO}>sem balança?</Letra>
            </g>
            <Adesivo x={540} y={650 - pulo} tam={84} giro={-5 + 3 * Math.sin(t * 7)} escala={vem} opacidade={limitar(vem * 2)}>Vem comigo!</Adesivo>
          </g>
        )}

        {chuta > 0 && (
          <g transform={`translate(540 360) scale(${chuta}) rotate(${1.5 * Math.sin(t * 3)})`} opacity={limitar(chuta * 2)}>
            <path d="M -450,-170 h 900 a 44 44 0 0 1 44 44 v 250 a 44 44 0 0 1 -44 44 h -330 l -60,74 l -14,-74 h -496 a 44 44 0 0 1 -44 -44 v -250 a 44 44 0 0 1 44 -44 Z" fill="#000" opacity={0.2} transform="translate(0 12)" />
            <path d="M -450,-170 h 900 a 44 44 0 0 1 44 44 v 250 a 44 44 0 0 1 -44 44 h -330 l -60,74 l -14,-74 h -496 a 44 44 0 0 1 -44 -44 v -250 a 44 44 0 0 1 44 -44 Z" fill={CREME} stroke={VERDE} strokeWidth={8} />
            <text x={0} y={-86} textAnchor="middle" fontFamily={CORPO} fontWeight={700} fontSize={46} fill={LARANJA}>CHUTA AÍ NOS COMENTÁRIOS</text>
            <text x={0} y={22} textAnchor="middle" fontFamily={TITULO} fontWeight={800} fontSize={98} fill={VERDE}>Quanto pesa</text>
            <text x={0} y={126} textAnchor="middle" fontFamily={TITULO} fontWeight={800} fontSize={98} fill={VERDE}>esse aqui?</text>
          </g>
        )}

        {pesoVis > 0 && (
          <g transform={`translate(${i === 0 ? 540 : 500} ${320 - (1 - pesoVis) * 60}) scale(${estouro}) rotate(-2)`} opacity={pesoVis}>
            <Letra x={-40} y={0} tam={250} cor={AMARELO} borda={0.16} ancora="middle">{String(kg)}</Letra>
            <Letra x={String(kg).length * 250 * 0.29 - 30} y={0} tam={130} borda={0.2} ancora="start">{i === 0 ? "kg" : "kg!"}</Letra>
          </g>
        )}
        {SELOS.map((s, k) => {
          const e = prog(t, s.t, 0.2, fora);
          if (e <= 0 || selosSaem <= 0) return null;
          const treme = t < s.t + 0.45 ? 5 * Math.sin((t - s.t) * 60) * Math.exp(-(t - s.t) * 9) : 0;
          return (
            <g key={k} opacity={selosSaem}>
              <Adesivo x={218 + treme} y={1000 + k * 132} tam={41} giro={s.giro} escala={lerp(2.6, 1, e)} opacidade={e} fundo={VERDE}>{`✓ ${s.texto}`}</Adesivo>
            </g>
          );
        })}
        <Confete t={t} de={PESAGENS[0].mostra + PESAGENS[0].conta} semente={3} />
        <Confete t={t} de={PESAGENS[2].mostra + PESAGENS[2].conta} semente={11} />

        {fecho > 0 && (
          <g>
            <rect width={L} height={A} fill="url(#sb-fecho)" opacity={fecho} />
            <g transform={`translate(540 760) scale(${nome})`} opacity={limitar(nome * 2)}>
              <Letra x={0} y={0} tam={210} borda={0.1}>Rebanho</Letra>
            </g>
            <Adesivo x={540} y={930} tam={72} giro={-3} escala={segue * pulsa} opacidade={limitar(segue * 2)}>Segue pra ver mais!</Adesivo>
            <Confete t={t} de={T_CEL_DESCE + 0.7} semente={29} x={540} y={700} />
          </g>
        )}
      </svg>
      {fecho > 0 && (
        <div style={{ position: "absolute", left: 540 - 95, top: 330, opacity: limitar(nome * 2), transform: `scale(${nome})`, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.35))" }}>
          <Marca tamanho={190} />
        </div>
      )}
    </>
  );
};
