import React from "react";
import { Easing } from "remotion";
import { Elipse, Linha } from "../../lousa/Esboco";
import { FONTE_UI, ui } from "../../lousa/Janelas";
import { tinta } from "../../lousa/paleta";
import { progresso, saida, useT } from "../../lousa/tempo";

// Peças próprias do Reel do Pix: o celular com a cobrança, o QR code e o relógio.

const entrar = Easing.out(Easing.back(1.5));

/** QR code de enfeite: os três quadrados de canto e "módulos" pseudoaleatórios (fixos pela semente). */
export function QR({ x, y, tam, semente, cor = tinta, opacidade = 1 }: { x: number; y: number; tam: number; semente: number; cor?: string; opacidade?: number }) {
  const N = 21;
  const m = tam / N;
  const canto = (i: number, j: number) => (i < 8 && j < 8) || (i < 8 && j >= N - 8) || (i >= N - 8 && j < 8);
  const modulos: React.ReactNode[] = [];
  let h = semente * 2654435761;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      h = (Math.imul(h ^ (h >>> 13), 1274126177) + i * 31 + j) >>> 0;
      if (canto(i, j) || h % 100 > 47) continue;
      modulos.push(<rect key={`${i}-${j}`} x={x + j * m} y={y + i * m} width={m + 0.4} height={m + 0.4} fill={cor} />);
    }
  }
  const olho = (ox: number, oy: number) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox + m * 0.5} y={oy + m * 0.5} width={m * 6} height={m * 6} fill="none" stroke={cor} strokeWidth={m} />
      <rect x={ox + m * 2} y={oy + m * 2} width={m * 3} height={m * 3} fill={cor} />
    </g>
  );
  return (
    <g opacity={opacidade}>
      {modulos}
      {olho(x, y)}
      {olho(x + (N - 7) * m, y)}
      {olho(x, y + (N - 7) * m)}
    </g>
  );
}

const mmss = (seg: number) => {
  const s = Math.max(0, Math.ceil(seg));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export type CelularPixProps = {
  x: number;
  y: number;
  w?: number;
  de: number;
  /** número da cobrança (muda o QR) */
  cobranca: number;
  valor: string;
  /** contagem regressiva: segundos que faltam em `de` */
  expiraEm: number;
  /** bateria no começo (%) e instante em que o celular apaga */
  bateria: number;
  apaga?: number;
  /** "pagando…" e depois "Pix enviado" */
  paga?: { de: number; ok: number };
};

/** Celular com a tela de pagamento Pix: valor, QR, contagem regressiva e bateria. */
export function CelularPix({ x, y, w = 300, de, cobranca, valor, expiraEm, bateria, apaga, paga }: CelularPixProps) {
  const t = useT();
  if (t < de) return null;
  const pe = progresso(t, de, 0.4, entrar);
  const alfa = Math.min(1, (t - de) / 0.2);
  const h = w * 2.02;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const desligado = apaga !== undefined && t >= apaga;
  const escuro = apaga !== undefined ? progresso(t, apaga, 0.25) : 0;
  const resta = expiraEm - (t - de);
  const pagou = paga && t >= paga.ok;
  const pagando = paga && t >= paga.de && !pagou;
  const urgente = !paga && resta <= 3;
  const tq = w - 120;
  const xq = cx - tq / 2;
  const yq = y + 210;
  const corBat = bateria <= 5 ? ui.vermelho : ui.verde;
  return (
    <g opacity={alfa} transform={`translate(${cx} ${cy}) scale(${0.9 + 0.1 * pe}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={40} fill="#1f1f1f" style={{ filter: "drop-shadow(0 14px 22px rgba(30,30,25,0.18))" }} />
      <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx={32} fill="#ffffff" />
      {/* barra de status: bateria */}
      <g>
        <rect x={x + w - 92} y={y + 30} width={44} height={22} rx={5} fill="none" stroke={tinta} strokeWidth={2.5} />
        <rect x={x + w - 47} y={y + 36} width={4} height={10} rx={1.5} fill={tinta} />
        <rect x={x + w - 89} y={y + 33} width={Math.max(3, 38 * (bateria / 100))} height={16} rx={3} fill={corBat} />
        <text x={x + w - 100} y={y + 48} textAnchor="end" fontFamily={FONTE_UI} fontWeight={700} fontSize={19} fill={corBat}>
          {`${bateria}%`}
        </text>
      </g>
      <rect x={cx - 40} y={y + 24} width={80} height={22} rx={11} fill="#1f1f1f" />
      {/* tela do Pix */}
      <text x={x + 34} y={y + 104} fontFamily={FONTE_UI} fontWeight={700} fontSize={26} fill={ui.texto}>
        {`Pix · cobrança ${cobranca}`}
      </text>
      <text x={x + 34} y={y + 160} fontFamily={FONTE_UI} fontWeight={700} fontSize={42} fill={ui.texto}>
        {valor}
      </text>
      <QR x={xq} y={yq} tam={tq} semente={cobranca * 7 + 3} opacidade={pagou ? 0.12 : 1} />
      {pagou ? (
        <g transform={`translate(${cx} ${yq + tq / 2})`}>
          <circle r={62 * (0.7 + 0.3 * progresso(t, paga!.ok, 0.35, entrar))} fill={ui.verde} />
          <path d="M-28 2 L-8 22 L30 -20" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
      {/* rodapé: contagem regressiva, "pagando…" ou "Pix enviado" */}
      {(() => {
        const yb = y + h - 150;
        if (pagou)
          return (
            <>
              <rect x={x + 30} y={yb} width={w - 60} height={64} rx={14} fill="#ebfbee" />
              <text x={cx} y={yb + 42} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={26} fill={ui.verde}>
                Pix enviado
              </text>
            </>
          );
        if (pagando)
          return (
            <>
              <rect x={x + 30} y={yb} width={w - 60} height={64} rx={14} fill="#f1f3f5" />
              <text x={cx} y={yb + 42} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={26} fill={ui.apagado}>
                {"pagando" + ".".repeat(1 + (Math.floor(t * 4) % 3))}
              </text>
            </>
          );
        return (
          <>
            <rect x={x + 30} y={yb} width={w - 60} height={64} rx={14} fill={urgente ? "#fff5f5" : "#f1f3f5"} />
            <text x={cx} y={yb + 42} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={26} fill={urgente ? ui.vermelho : ui.texto}>
              {`expira em ${mmss(resta)}`}
            </text>
          </>
        );
      })()}
      {/* celular apagado */}
      {desligado && (
        <g opacity={escuro}>
          <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx={32} fill="#0d0d0d" />
          <rect x={cx - 46} y={cy - 26} width={84} height={46} rx={8} fill="none" stroke={ui.vermelho} strokeWidth={4} />
          <rect x={cx + 40} y={cy - 12} width={7} height={18} rx={2} fill={ui.vermelho} />
          <rect x={cx - 41} y={cy - 21} width={6} height={36} rx={2} fill={ui.vermelho} />
        </g>
      )}
    </g>
  );
}

/** Relógio desenhado à mão cujos ponteiros giram enquanto o tempo "passa". */
export function Relogio({ cx, cy, r = 80, de, gira }: { cx: number; cy: number; r?: number; de: number; gira: [number, number] }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, gira[0], gira[1] - gira[0], (x) => x);
  const minuto = -Math.PI / 2 + p * Math.PI * 2 * 3;
  const hora = -Math.PI / 2 + p * Math.PI;
  const ponteiro = (ang: number, comp: number, esp: number, cor: string) => (
    <line x1={cx} y1={cy} x2={cx + Math.cos(ang) * comp} y2={cy + Math.sin(ang) * comp} stroke={cor} strokeWidth={esp} strokeLinecap="round" />
  );
  const marcas = progresso(t, de + 0.4, 0.3);
  return (
    <>
      <Elipse cx={cx} cy={cy} w={r * 2} h={r * 2} espessura={4} preench="#fff5f5" hachura="solid" de={de} dur={0.5} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return <Linha key={i} pts={[[cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78], [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92]]} espessura={3} de={de + 0.35 + i * 0.05} dur={0.1} />;
      })}
      <g opacity={marcas}>
        {ponteiro(hora, r * 0.45, 7, tinta)}
        {ponteiro(minuto, r * 0.7, 5, ui.vermelho)}
        <circle cx={cx} cy={cy} r={7} fill={tinta} />
      </g>
    </>
  );
}

/** Pílula de status (ex.: "paga", "expirada"). (x, y) é o canto esquerdo da linha de base. */
export function Status({ x, y, texto, cor, fundo, de, ate, tam = 22 }: { x: number; y: number; texto: string; cor: string; fundo: string; de: number; ate?: number; tam?: number }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.3, entrar);
  const alfa = Math.min(1, (t - de) / 0.15) * saida(t, ate, 0.25);
  if (alfa <= 0) return null;
  const w = [...texto].length * tam * 0.6 + tam * 1.2;
  const h = tam * 1.6;
  return (
    <g opacity={alfa} transform={`translate(${x + w / 2} ${y - tam * 0.36}) scale(${0.8 + 0.2 * p}) translate(${-(x + w / 2)} ${-(y - tam * 0.36)})`}>
      <rect x={x} y={y - tam * 0.36 - h / 2} width={w} height={h} rx={h / 2} fill={fundo} />
      <text x={x + w / 2} y={y} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={tam} fill={cor}>
        {texto}
      </text>
    </g>
  );
}

export const PAGA = { cor: ui.verde, fundo: "#ebfbee" };
export const EXPIRADA = { cor: ui.vermelho, fundo: "#fff5f5" };
export const PENDENTE = { cor: ui.laranja, fundo: "#fff4e6" };
