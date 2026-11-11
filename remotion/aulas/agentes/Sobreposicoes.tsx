import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { Chip, FONTE_UI, ui } from "../../lousa/Janelas";
import { tinta } from "../../lousa/paleta";
import { progresso, saida, useT } from "../../lousa/tempo";
import { Texto } from "../../lousa/Texto";
import { painelEm, type ChaveV } from "./CameraVertical";
import { ALVO, TELA } from "./regioes";
import { s } from "./roteiro";

const entrar = Easing.out(Easing.back(1.4));

/** Cartão branco "colado" sobre o vídeo da câmera. */
function Cartao({ x, y, w, h, de, ate, girar = -1.2, children }: { x: number; y: number; w: number; h: number; de: number; ate?: number; girar?: number; children: React.ReactNode }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.4, entrar);
  const alfa = Math.min(1, (t - de) / 0.2) * saida(t, ate, 0.3);
  if (alfa <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={alfa} transform={`rotate(${girar} ${cx} ${cy}) translate(${cx} ${cy}) scale(${0.88 + 0.12 * p}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={26} fill="#ffffff" style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.25))" }} />
      {children}
    </g>
  );
}

/** "− 100% +" no canto do canvas, como nos apps de canvas; mostra o zoom atual. */
export function ZoomPilula({ z, chaves }: { z: number; chaves: ChaveV[] }) {
  const t = useT();
  const alfa = painelEm(t, chaves);
  if (alfa <= 0.01) return null;
  const x = TELA.w - 40 - 170;
  const y = ALVO.y + ALVO.h - 42;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        <g opacity={alfa}>
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
        </g>
      </svg>
    </AbsoluteFill>
  );
}

export function Sobreposicoes() {
  const fimTitulo = s(5.62);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        {/* abertura: o tema da aula */}
        <Cartao x={90} y={1060} w={900} h={330} de={0} ate={fimTitulo - 0.1}>
          <Texto x={540} y={1210} tam={104} cor={ui.rosa} ancora="middle" de={0.05} dur={0.6}>
            orquestração
          </Texto>
          <Texto x={540} y={1310} tam={62} cor={tinta} ancora="middle" de={0.5} dur={0.6}>
            de agentes de IA
          </Texto>
        </Cartao>

        {/* "Percebe? Orquestrar não é só distribuir tarefas, é coordenar todo esse processo." */}
        <Cartao x={80} y={1040} w={920} h={340} de={s(73.6)} ate={s(77.7)} girar={1}>
          <Texto x={540} y={1150} tam={54} ancora="middle" de={s(73.79)} dur={0.9}>
            orquestrar não é só
          </Texto>
          <Texto x={540} y={1222} tam={54} ancora="middle" de={s(74.69)} dur={0.7}>
            distribuir tarefas
          </Texto>
          <Texto x={540} y={1320} tam={66} cor={ui.rosa} ancora="middle" de={s(75.93)} dur={0.9}>
            é coordenar o processo
          </Texto>
        </Cartao>

        {/* chamada final */}
        <Cartao x={80} y={1170} w={920} h={330} de={s(141.8)} girar={-1}>
          <Texto x={540} y={1268} tam={52} ancora="middle" de={s(141.9)} dur={0.8}>
            na comunidade, a gente
          </Texto>
          <Texto x={540} y={1340} tam={52} ancora="middle" destaque={ui.rosa} de={s(143.0)} dur={0.9}>
            {"constrói isso *{do zero}"}
          </Texto>
          <Chip x={540} y={1430} texto="publico.dev.br" fundo="#f3f0ff" cor={ui.violeta} tam={30} de={s(144.4)} />
        </Cartao>
      </svg>
    </AbsoluteFill>
  );
}
