import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import "../../marca/fontes";
import { Cavalo } from "../pesagem/Cavalo";
import { type Camera } from "../pesagem/roteiro";
import { Legenda } from "./Legenda";
import { type Fala, FPS } from "./tempo";

// Moldura comum: o mundo visto de cima do cavalo, a legenda e o som (voz, violão, ambiente, cascos e efeitos).

export type Toque = { t: number; som: "carimbo" | "giro" | "plim" | "clique" | "bipe"; vol?: number };
const curto = (nome: string) => staticFile(`rebanho/pesagem/sons/${nome}.wav`);

/** Uma batida de casco a cada 0,75 m andado. */
function cascos(zEm: (t: number) => number, velEm: (t: number) => number, dur: number) {
  const saida: { t: number; vol: number; k: number }[] = [];
  for (let t = 0, prox = 0.3, k = 0; t < dur; t += 1 / 120) {
    if (zEm(t) - zEm(0) >= prox) { saida.push({ t, vol: 0.42 * Math.min(1, 0.4 + velEm(t) / 2.5), k: k++ }); prox += 0.75; }
  }
  return saida;
}

export const Moldura: React.FC<{
  t: number;
  cam: Camera;
  mundo: React.ReactNode;
  falas: Fala[];
  inicio: number[];
  zEm: (t: number) => number;
  velEm: (t: number) => number;
  toques: Toque[];
  bufaEm?: number;
  legendaY?: number;
  /** cobre o cavalo (tela cheia do app, por exemplo) */
  children?: React.ReactNode;
}> = ({ t, cam, mundo, falas, inicio, zEm, velEm, toques, bufaEm = -1, legendaY, children }) => {
  const { durationInFrames } = useVideoConfig();
  const borrao = Math.min(40, Math.abs(cam.giroVel) * 0.16);
  const batidas = React.useMemo(() => cascos(zEm, velEm, durationInFrames / FPS), [zEm, velEm, durationInFrames]);
  // a trilha é uma só para todos os vídeos; some nos dois segundos finais
  const some = (f: number) => Math.min(1, Math.max(0, (durationInFrames - f) / (2 * FPS)));
  return (
    <AbsoluteFill style={{ background: "#8CC4EC", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="giro" x="-10%" width="120%">
          <feGaussianBlur stdDeviation={`${borrao.toFixed(1)} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `translate(${cam.tremor[0].toFixed(1)}px, ${cam.tremor[1].toFixed(1)}px) rotate(${cam.rolo.toFixed(3)}deg) scale(1.06)`, filter: borrao > 3 ? "url(#giro)" : undefined }}>
        {mundo}
      </AbsoluteFill>
      <Cavalo cam={cam} t={t} comCelular={0} bufaEm={bufaEm} />
      {children}
      <Legenda falas={falas} inicio={inicio} t={t} y={legendaY} />
      <Audio src={staticFile("rebanho/comum/sons/musica.mp3")} volume={(f) => 0.2 * some(f)} />
      <Audio src={staticFile("rebanho/comum/sons/ambiente.mp3")} volume={(f) => 0.45 * some(f)} />
      {batidas.map((b) => (
        <Sequence key={`c${b.k}`} from={Math.round(b.t * FPS)} layout="none">
          <Audio src={curto(b.k % 2 ? "casco-2" : "casco-1")} volume={b.vol} />
        </Sequence>
      ))}
      {toques.map((q, i) => (
        <Sequence key={`q${i}`} from={Math.round(q.t * FPS)} layout="none">
          <Audio src={curto(q.som)} volume={q.vol ?? 0.5} />
        </Sequence>
      ))}
      {falas.map((f, i) => (
        <Sequence key={i} from={Math.round(inicio[i]! * FPS)} layout="none">
          <Audio src={staticFile(f.arquivo)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
