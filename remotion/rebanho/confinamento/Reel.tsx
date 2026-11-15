import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../marca/fontes";
import { Cavalo } from "../pesagem/Cavalo";
import { type Vista } from "../pesagem/Mundo";
import { prog } from "../pesagem/roteiro";
import { Celular } from "./Celular";
import { Confinamento } from "./Mundo";
import { A, CARIMBOS, DURACAO, FPS, INICIO_FALA, L, T, T_CEL_DESCE, T_CEL_SOBE, T_CLIQUE, T_EVOL, T_GMD, T_PESO, camera, falas, velEm, zEm } from "./roteiro";
import { Sobreposicoes } from "./Sobreposicoes";

// Reel do Rebanho (1080x1920): como funciona um confinamento, visto de cima do cavalo, e a evolução
// do lote no app. Som: voz (ElevenLabs), violão, ambiente e efeitos (scripts/rebanho/trilha.py).

const comum = (nome: string) => staticFile(`rebanho/pesagem/sons/${nome}`);
const som = (nome: string) => staticFile(`rebanho/confinamento/sons/${nome}`);
type Toque = { t: number; arquivo: string; vol: number };
const TOQUES: Toque[] = [];
// cascos: uma batida a cada 0,75 m andado
for (let t = 0, prox = 0.3, k = 0; t < DURACAO; t += 1 / 120) {
  if (zEm(t) - zEm(0) >= prox) {
    TOQUES.push({ t, arquivo: comum(k++ % 2 ? "casco-2.wav" : "casco-1.wav"), vol: 0.42 * Math.min(1, 0.4 + velEm(t) / 2.5) });
    prox += 0.75;
  }
}
CARIMBOS.forEach((t) => TOQUES.push({ t, arquivo: comum("carimbo.wav"), vol: 0.5 }));
TOQUES.push(
  { t: T_CEL_SOBE, arquivo: comum("giro.wav"), vol: 0.3 },
  { t: T_CLIQUE - 0.02, arquivo: comum("clique.wav"), vol: 0.8 },
  { t: T_PESO + 0.4, arquivo: comum("plim.wav"), vol: 0.35 },
  { t: T_EVOL, arquivo: comum("giro.wav"), vol: 0.35 },
  { t: T_GMD, arquivo: comum("plim.wav"), vol: 0.55 },
  { t: T_CEL_DESCE, arquivo: comum("giro.wav"), vol: 0.4 },
  { t: T_CEL_DESCE + 0.75, arquivo: comum("plim.wav"), vol: 0.4 },
);

export function ReelConfinamento() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100 * cam.zoom, cx: L / 2, hor: cam.hor, w: L, h: A };
  const borrao = Math.min(40, Math.abs(cam.giroVel) * 0.16);
  const comCelular = prog(t, T_CEL_SOBE - 0.3, 0.8) * (1 - prog(t, T_CEL_DESCE, 0.9));
  return (
    <AbsoluteFill style={{ background: "#8CC4EC", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="giro" x="-10%" width="120%">
          <feGaussianBlur stdDeviation={`${borrao.toFixed(1)} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `translate(${cam.tremor[0].toFixed(1)}px, ${cam.tremor[1].toFixed(1)}px) rotate(${cam.rolo.toFixed(3)}deg) scale(1.06)`, filter: borrao > 3 ? "url(#giro)" : undefined }}>
        <Confinamento v={v} t={t} id="m" />
      </AbsoluteFill>
      <Cavalo cam={cam} t={t} comCelular={comCelular} bufaEm={T.leitura - 0.9} />
      <Celular cam={cam} t={t} />
      <Sobreposicoes t={t} />
      <Audio src={som("musica.mp3")} volume={0.2} />
      <Audio src={som("ambiente.mp3")} volume={0.45} />
      <Sequence from={Math.round((T.trato - 0.6) * FPS)} layout="none">
        <Audio src={som("trator.mp3")} volume={0.5} />
      </Sequence>
      {TOQUES.map((q, i) => (
        <Sequence key={`s${i}`} from={Math.round(q.t * FPS)} layout="none">
          <Audio src={q.arquivo} volume={q.vol} />
        </Sequence>
      ))}
      {falas.map((f, i) => (
        <Sequence key={i} from={Math.round(INICIO_FALA[i]! * FPS)} layout="none">
          <Audio src={staticFile(f.arquivo)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
