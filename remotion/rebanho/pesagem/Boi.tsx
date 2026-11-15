import React from "react";

// Boi nelore de perfil (olhando para a direita). Unidade: 1 = 1 cm; origem no chão, no meio do corpo.

export type Pelagem = { corpo: string; sombra: string; cupim: string; luz: string };
export const PELAGENS: Record<string, Pelagem> = {
  branco: { corpo: "#F1ECE2", sombra: "#C9C1B3", cupim: "#9C968D", luz: "#FFFFFF" },
  cinza: { corpo: "#D9D5CF", sombra: "#A9A39B", cupim: "#6F6B67", luz: "#F4F1EC" },
  caramelo: { corpo: "#C98A52", sombra: "#9C6335", cupim: "#7A4A26", luz: "#E2AC78" },
};

const CORPO =
  "M -100,-138 C -70,-146 -30,-146 -5,-144 C 5,-150 12,-173 32,-173 C 50,-173 54,-151 62,-147 C 72,-149 80,-155 90,-155 C 100,-155 106,-147 110,-137 L 124,-112 C 128,-104 124,-96 114,-96 C 104,-96 96,-102 90,-110 C 85,-100 80,-84 70,-72 C 62,-62 52,-58 44,-60 C 20,-52 -30,-50 -60,-58 C -72,-62 -80,-70 -86,-82 C -100,-84 -112,-100 -110,-120 C -109,-130 -106,-136 -100,-138 Z";

const pataFrente = (x: number) => `M ${x - 9},-78 L ${x + 10},-78 C ${x + 8},-60 ${x + 6},-48 ${x + 7},-38 L ${x + 6},-9 L ${x - 6},-9 L ${x - 7},-38 C ${x - 6},-50 ${x - 8},-62 ${x - 9},-78 Z`;
const pataTras = (x: number) => `M ${x - 16},-96 C ${x - 12},-74 ${x - 3},-58 ${x - 8},-40 L ${x - 9},-9 L ${x + 4},-9 L ${x + 6},-40 C ${x + 12},-56 ${x + 14},-76 ${x + 12},-96 Z`;
const casco = (x: number) => `M ${x - 8},-10 L ${x + 8},-10 L ${x + 9},0 L ${x - 9},0 Z`;

export const Boi: React.FC<{ id: string; t: number; pelagem?: string; semente?: number; brinco?: string; simples?: boolean; espelhado?: boolean }> = ({ id, t, pelagem = "branco", semente = 0, brinco, simples, espelhado }) => {
  const p = PELAGENS[pelagem] ?? PELAGENS.branco!;
  const f = semente * 1.7;
  const rabo = 9 * Math.sin(t * 2.3 + f) + 5 * Math.sin(t * 5.1 + f * 2);
  const orelha = 7 * Math.max(0, Math.sin(t * 1.9 + f * 3)) ** 6 * Math.sin(t * 22);
  const pisca = Math.sin(t * 0.9 + f) > 0.985 ? 0.15 : 1;
  const cabeca = 1.6 * Math.sin(t * 1.1 + f);
  const escuro = "#3A3431";
  return (
    <g>
      <ellipse cx={4} cy={0} rx={122} ry={13} fill="#2B1D10" opacity={0.28} />
      {/* patas do lado de lá */}
      <g fill={p.sombra}>
        <path d={pataFrente(60)} />
        <path d={pataTras(-58)} />
      </g>
      <g fill="#4A4038">
        <path d={casco(60)} />
        <path d={casco(-60)} />
      </g>
      {/* rabo */}
      <g transform={`rotate(${rabo} -106 -130)`}>
        <path d="M -106,-132 C -118,-112 -117,-82 -113,-52" stroke={p.sombra} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M -116,-56 C -122,-40 -118,-24 -111,-18 C -106,-26 -106,-44 -109,-56 Z" fill={escuro} />
      </g>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={CORPO} />
        </clipPath>
        <radialGradient id={`${id}-cupim`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.cupim} stopOpacity={0.6} />
          <stop offset="1" stopColor={p.cupim} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-barriga`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor={p.sombra} stopOpacity={0} />
          <stop offset="1" stopColor={p.sombra} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <path d={CORPO} fill={p.corpo} />
      {!simples && (
        <g clipPath={`url(#${id}-c)`}>
          <rect x={-120} y={-180} width={250} height={135} fill={`url(#${id}-barriga)`} />
          <ellipse cx={36} cy={-150} rx={58} ry={46} fill={`url(#${id}-cupim)`} />
          <ellipse cx={-96} cy={-96} rx={30} ry={46} fill={p.sombra} opacity={0.35} />
          <path d="M -100,-140 C -70,-148 -30,-148 -5,-146 C 5,-152 12,-175 32,-175" stroke={p.luz} strokeWidth={7} fill="none" opacity={0.75} />
          {/* barbela */}
          <path d="M 88,-108 C 82,-96 78,-82 68,-70" stroke={p.sombra} strokeWidth={3} fill="none" opacity={0.8} />
          <path d="M 76,-112 C 72,-100 68,-88 60,-78" stroke={p.sombra} strokeWidth={2.5} fill="none" opacity={0.6} />
        </g>
      )}
      {/* patas do lado de cá */}
      <path d={pataFrente(42)} fill={p.corpo} />
      <path d={pataTras(-78)} fill={p.corpo} />
      <path d={`M 33,-78 C 36,-62 34,-50 35,-38 L 36,-9`} stroke={p.sombra} strokeWidth={3} fill="none" opacity={0.7} />
      <path d={`M -94,-96 C -90,-74 -81,-58 -86,-40 L -87,-9`} stroke={p.sombra} strokeWidth={3} fill="none" opacity={0.7} />
      <g fill={escuro}>
        <path d={casco(42)} />
        <path d={casco(-80)} />
      </g>
      {/* cabeça */}
      <g transform={`rotate(${cabeca} 70 -130)`}>
        <path d="M 93,-154 C 94,-166 88,-175 80,-178 C 84,-169 84,-160 85,-153 Z" fill="#5E554C" />
        <path d="M 117,-122 L 124,-112 C 128,-104 124,-96 114,-96 C 108,-96 103,-99 100,-103 C 108,-107 113,-113 117,-122 Z" fill={escuro} />
        <ellipse cx={120} cy={-106} rx={2.6} ry={1.8} fill="#15110F" />
        <g transform={`rotate(${orelha} 88 -146)`}>
          <path d="M 91,-147 C 76,-152 60,-140 57,-126 C 71,-125 86,-131 93,-140 Z" fill={p.sombra} />
          <path d="M 86,-144 C 76,-145 66,-138 63,-130 C 72,-130 82,-134 87,-140 Z" fill="#D9A79A" opacity={0.75} />
          {brinco && (
            <g transform="translate(70 -131) rotate(12)">
              <rect x={-7} y={-1} width={14} height={16} rx={2.5} fill="#F6C330" stroke="#B88A12" strokeWidth={1} />
              <text x={0} y={11} transform={espelhado ? "scale(-1 1)" : undefined} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={8} fill="#3A2A05">
                {brinco}
              </text>
            </g>
          )}
        </g>
        <g transform={`translate(105 -134) scale(1 ${pisca})`}>
          <ellipse rx={3.6} ry={3.6} fill="#1B1512" />
          <circle cx={1} cy={-1.2} r={1} fill="#FFFFFF" opacity={0.9} />
        </g>
      </g>
    </g>
  );
};
