import React from "react";
import { A, L, type Camera, T_CEL_DESCE, T_CEL_SOBE, limitar, prog, ruido } from "./roteiro";

// O que quem está montado enxerga de si: pescoço, crina e orelhas do cavalo, rédeas na mão esquerda,
// a cabeça da sela e as pernas. Origem do desenho: a nuca do cavalo.

const PELO = "#8A5A2E", PELO_ESC = "#6A4222", PELO_LUZ = "#A8733F", CRINA = "#241710", COURO = "#4A2E1A", PELE = "#C98F6B";

function crina(): string {
  const esq: string[] = [], dir: string[] = [];
  for (let y = -6, i = 0; y <= 620; y += 38, i++) {
    const xe = -18 - y * 0.03;
    const xd = xe + 64 + y * 0.2 + (i % 2 ? 16 : -8) + 9 * Math.sin(i * 1.7);
    esq.push(`${xe.toFixed(0)},${y}`);
    dir.push(`${xd.toFixed(0)},${y + (i % 2 ? 14 : 0)}`);
  }
  return `M ${esq.join(" L ")} L ${dir.reverse().join(" L ")} Z`;
}
const CRINA_D = crina();

/** `comCelular` (0..1): o cavalo sai um pouco para o lado quando o celular está na mão; por padrão segue o roteiro da pesagem. */
export const Cavalo: React.FC<{ cam: Camera; t: number; comCelular?: number; bufaEm?: number }> = ({ cam, t, comCelular: forcado, bufaEm = 6.45 }) => {
  const amp = limitar(cam.vel / 1.5);
  const passo = cam.dist * ((2 * Math.PI) / 1.5);
  const nucaY = cam.hor + 640 + 24 * Math.sin(passo + 1.2) * amp + 6 * Math.sin(t * 1.5);
  const comCelular = forcado ?? prog(t, T_CEL_SOBE - 0.3, 0.8) * (1 - prog(t, T_CEL_DESCE, 0.9));
  const nucaX = 440 - 150 * comCelular + 10 * Math.sin(passo / 2) * amp - limitar(cam.giroVel, -200, 200) * 0.35;
  // cada orelha escuta para um lado; de vez em quando uma sacode
  const orelha = (s: number) => 9 * ruido(t * 1.6, s * 3) + 12 * Math.max(0, Math.sin(t * 0.7 + s * 2)) ** 8 * Math.sin(t * 17) + 7 * Math.sin(passo + s) * amp;
  // balança a cabeça no trote, bufa e sacode ao parar, e acompanha o corpo quando a gente vira
  const bufa = t > bufaEm ? 7 * Math.exp(-(t - bufaEm) * 3.2) * Math.sin((t - bufaEm) * 24) : 0;
  const cabeca = 4.5 * Math.sin(passo / 2 + 0.6) * amp + 2.4 * ruido(t, 11) + bufa + limitar(cam.giroVel, -200, 200) * 0.035;
  const crinaVento = 3 * Math.sin(passo + 0.3) * amp + 1.6 * Math.sin(t * 2.1) + bufa * 0.6;
  const mao = { x: -168 + 4 * Math.sin(passo) * amp, y: 392 + 5 * Math.sin(passo + 0.5) * amp };
  return (
    <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="cv-pescoco" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PELO_ESC} />
          <stop offset="0.3" stopColor={PELO} />
          <stop offset="0.5" stopColor={PELO_LUZ} />
          <stop offset="0.75" stopColor={PELO} />
          <stop offset="1" stopColor={PELO_ESC} />
        </linearGradient>
        <pattern id="cv-xadrez" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
          <rect width="56" height="56" fill="#2F5D3A" />
          <rect width="56" height="14" fill="#F4EFE6" opacity="0.28" />
          <rect width="14" height="56" fill="#F4EFE6" opacity="0.28" />
          <rect y="28" width="56" height="5" fill="#16301D" opacity="0.5" />
          <rect x="28" width="5" height="56" fill="#16301D" opacity="0.5" />
        </pattern>
      </defs>
      <g transform={`translate(${nucaX.toFixed(1)} ${nucaY.toFixed(1)})`}>
        <g transform={`rotate(${cabeca.toFixed(2)} 0 300)`}>
          {/* cabeça em escorço, além da nuca */}
          <path d="M -72,16 C -66,-52 -54,-104 -40,-132 C -20,-146 20,-146 40,-132 C 54,-104 66,-52 72,16 Z" fill={PELO} />
          <path d="M -9,-128 C -5,-96 -6,-60 0,-30 C 6,-60 5,-96 9,-128 Z" fill="#F3E9D8" opacity={0.9} />
          {/* pescoço */}
          <path d="M -78,10 C -104,150 -190,330 -262,520 L -330,760 L 330,760 L 262,520 C 190,330 104,150 78,10 C 40,-12 -40,-12 -78,10 Z" fill="url(#cv-pescoco)" />
          {/* orelhas */}
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 56} 2) rotate(${s * 15 + orelha(s)})`}>
              <path d="M -24,6 C -36,-50 -22,-108 -2,-134 C 18,-104 28,-50 22,6 Z" fill={PELO_ESC} />
              <path d="M -13,0 C -20,-44 -12,-86 -2,-108 C 8,-84 15,-44 11,0 Z" fill={PELO} opacity={0.9} />
              <path d="M -8,-104 C -4,-118 0,-128 -2,-134 C 4,-126 6,-116 7,-106 Z" fill={CRINA} />
            </g>
          ))}
          {/* topete e crina */}
          <path d="M -32,10 C -28,-40 -12,-78 2,-98 C 10,-66 30,-30 32,10 Z" fill={CRINA} />
          <g transform={`skewX(${crinaVento.toFixed(2)})`}><path d={CRINA_D} fill={CRINA} /></g>
          <path d="M 4,40 C 14,160 20,300 30,440 M 30,60 C 50,200 70,330 96,470 M -6,120 C 0,260 2,400 6,560" stroke="#3E2A1D" strokeWidth={5} fill="none" opacity={0.8} />
          {/* cabeçada e rédeas */}
          <path d="M -84,34 C -44,16 44,16 84,34" stroke={COURO} strokeWidth={15} fill="none" strokeLinecap="round" />
          <path d={`M -70,-44 C -150,110 -210,260 ${mao.x - 10},${mao.y}`} stroke={COURO} strokeWidth={11} fill="none" strokeLinecap="round" />
          <path d={`M 70,-44 C 170,130 60,300 ${mao.x + 36},${mao.y + 6}`} stroke={COURO} strokeWidth={11} fill="none" strokeLinecap="round" />
        </g>
        {/* sela: cabeça e arção */}
        <path d="M -330,900 C -310,650 -130,560 0,560 C 130,560 310,650 330,900 Z" fill="#5C3A20" />
        <path d="M -300,900 C -282,676 -120,596 0,596 C 120,596 282,676 300,900" stroke="#8A5A34" strokeWidth={6} fill="none" strokeDasharray="14 12" />
        <path d="M -34,590 C -38,540 -36,512 -30,500 L 30,500 C 36,512 38,540 34,590 Z" fill="#4A2E1A" />
        <ellipse cx={0} cy={498} rx={50} ry={30} fill="#6B4426" />
        <ellipse cx={-6} cy={492} rx={30} ry={14} fill="#8A5A34" opacity={0.7} />
        {/* pernas */}
        <path d="M -560,900 L -560,700 C -470,640 -330,664 -272,770 L -236,900 Z" fill="#35557F" />
        <path d="M 560,900 L 560,700 C 470,640 330,664 272,770 L 236,900 Z" fill="#35557F" />
        <path d="M -520,712 C -440,676 -340,700 -292,790" stroke="#5B7FAE" strokeWidth={6} fill="none" opacity={0.7} />
        <path d="M 520,712 C 440,676 340,700 292,790" stroke="#5B7FAE" strokeWidth={6} fill="none" opacity={0.7} />
        {/* braço e mão esquerda com as rédeas */}
        <g transform={`translate(${mao.x.toFixed(1)} ${mao.y.toFixed(1)})`}>
          <path d="M -330,560 L -60,60 L 40,112 L -190,600 Z" fill="url(#cv-xadrez)" />
          <path d="M -72,52 L 48,116 L 34,142 L -86,78 Z" fill="#244A2E" />
          <g transform="rotate(28)">
            <rect x={-52} y={-44} width={112} height={92} rx={34} fill={PELE} />
            <path d="M -26,-44 L -26,-8 M 2,-46 L 2,-8 M 30,-44 L 30,-8" stroke="#A66F4E" strokeWidth={4} strokeLinecap="round" />
            <path d="M -50,-10 C -74,-30 -60,-62 -30,-52 C -22,-48 -22,-36 -34,-30 Z" fill={PELE} stroke="#A66F4E" strokeWidth={3} />
          </g>
        </g>
      </g>
    </svg>
  );
};
