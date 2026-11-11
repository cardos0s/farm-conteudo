import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { FONTE_UI, ui } from "../../lousa/Janelas";
import { progresso, saida, useT } from "../../lousa/tempo";
import { Texto } from "../../lousa/Texto";
import { PIP } from "./CameraVertical";
import { TELA } from "./regioes";
import { s } from "./roteiro";

const entrar = Easing.out(Easing.back(1.4));

/** Nota adesiva grande colada por cima do canvas, para destacar uma frase. */
function NotaTela({ x, y, w, h, de, ate, girar = -1.5, children }: { x: number; y: number; w: number; h: number; de: number; ate?: number; girar?: number; children: React.ReactNode }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.4, entrar);
  const alfa = Math.min(1, (t - de) / 0.2) * saida(t, ate, 0.3);
  if (alfa <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={alfa} transform={`rotate(${girar} ${cx} ${cy}) translate(${cx} ${cy}) scale(${0.88 + 0.12 * p}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#fff3bf" style={{ filter: "drop-shadow(0 18px 30px rgba(60, 50, 0, 0.22))" }} />
      <rect x={x} y={y} width={w} height={16} rx={6} fill="rgba(0,0,0,0.035)" />
      {children}
    </g>
  );
}

/** "− 100% +" ao lado da janelinha da câmera, como nos apps de canvas; mostra o zoom atual. */
export function ZoomPilula({ z }: { z: number }) {
  const x = PIP.x + PIP.w + 22;
  const y = PIP.y + 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        <rect x={x} y={y} width={170} height={44} rx={22} fill="#ffffff" stroke={ui.borda} strokeWidth={1.5} style={{ filter: "drop-shadow(0 4px 10px rgba(30,30,25,0.10))" }} />
        <text x={x + 26} y={y + 30} textAnchor="middle" fontFamily={FONTE_UI} fontSize={24} fill={ui.apagado}>
          −
        </text>
        <text x={x + 85} y={y + 30} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={21} fill={ui.texto}>
          {`${Math.round(z * 100)}%`}
        </text>
        <text x={x + 144} y={y + 30} textAnchor="middle" fontFamily={FONTE_UI} fontSize={24} fill={ui.apagado}>
          +
        </text>
      </svg>
    </AbsoluteFill>
  );
}

export function Sobreposicoes() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        {/* "Percebe? Orquestrar não é só distribuir tarefas, é coordenar todo esse processo." */}
        <NotaTela x={100} y={480} w={880} h={380} de={s(73.6)} ate={s(77.7)} girar={-1.8}>
          <Texto x={540} y={600} tam={56} ancora="middle" de={s(73.79)} dur={0.9}>
            orquestrar não é só
          </Texto>
          <Texto x={540} y={676} tam={56} ancora="middle" de={s(74.69)} dur={0.7}>
            distribuir tarefas
          </Texto>
          <Texto x={540} y={784} tam={68} cor={ui.rosa} ancora="middle" de={s(75.93)} dur={0.9}>
            é coordenar o processo
          </Texto>
        </NotaTela>
      </svg>
    </AbsoluteFill>
  );
}
