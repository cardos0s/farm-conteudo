import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../marca/fontes";
import { Cavalo } from "./Cavalo";
import { Celular } from "./Celular";
import { Mundo, type Vista } from "./Mundo";
import { A, CARIMBOS, CHEGADAS, FPS, INICIO_FALA, L, PESAGENS, T, T_CEL_DESCE, T_CEL_SOBE, camera, falas } from "./roteiro";
import { Sobreposicoes } from "./Sobreposicoes";

// Reel do Rebanho (1080x1920): pesagem do gado por foto, visto em primeira pessoa de cima do cavalo.
// 1. a porteira abre e a gente entra no curral · 2. foto do boi e o peso · 3. mais dois bois · 4. lote do dia.

// ── Som: trilha de violão, ambiente e efeitos (gerados por scripts/rebanho/trilha.py) ──
const som = (nome: string) => staticFile(`rebanho/pesagem/sons/${nome}`);
type Toque = { t: number; arquivo: string; vol: number };
const TOQUES: Toque[] = [];
// cascos: uma batida a cada 0,75 m, mais fraca conforme o cavalo freia
for (let d = 0.2, k = 0; d < 13.9; d += 0.75, k++) {
  const t = d <= 9 ? d / 3 : 3 + (3 - Math.sqrt(9 - 1.8 * (d - 9))) / 0.9;
  const vel = d <= 9 ? 3 : 3 - 0.9 * (t - 3);
  TOQUES.push({ t, arquivo: k % 2 ? "casco-2.wav" : "casco-1.wav", vol: 0.5 * Math.min(1, 0.35 + vel / 4) });
}
TOQUES.push({ t: 2.03, arquivo: "porteira.wav", vol: 0.55 });
TOQUES.push({ t: T_CEL_SOBE, arquivo: "giro.wav", vol: 0.3 });
for (let n = 0; n < 3; n++) TOQUES.push({ t: T.enquadro - 0.1 + (n * (T.foto - T.enquadro + 0.1)) / 3, arquivo: "bipe.wav", vol: 0.35 });
PESAGENS.forEach((p, i) => {
  TOQUES.push({ t: p.clique - 0.02, arquivo: "clique.wav", vol: 0.8 });
  if (i > 0) TOQUES.push({ t: p.giro - 0.05, arquivo: "giro.wav", vol: 0.6 });
});
CHEGADAS.forEach((t) => TOQUES.push({ t, arquivo: "plim.wav", vol: 0.5 }));
CARIMBOS.forEach((t) => TOQUES.push({ t: t + 0.12, arquivo: "carimbo.wav", vol: 0.6 }));
TOQUES.push({ t: T_CEL_DESCE, arquivo: "giro.wav", vol: 0.4 }, { t: T_CEL_DESCE + 0.75, arquivo: "plim.wav", vol: 0.4 });

export function ReelPesagem() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100 * cam.zoom, cx: L / 2, hor: cam.hor, w: L, h: A };
  const borrao = Math.min(40, Math.abs(cam.giroVel) * 0.16);
  return (
    <AbsoluteFill style={{ background: "#8CC4EC", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="giro" x="-10%" width="120%">
          <feGaussianBlur stdDeviation={`${borrao.toFixed(1)} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `translate(${cam.tremor[0].toFixed(1)}px, ${cam.tremor[1].toFixed(1)}px) rotate(${cam.rolo.toFixed(3)}deg) scale(1.06)`, filter: borrao > 0.5 ? "url(#giro)" : undefined }}>
        <Mundo v={v} t={t} id="m" />
      </AbsoluteFill>
      <Cavalo cam={cam} t={t} />
      <Celular cam={cam} t={t} />
      <Sobreposicoes t={t} />
      <Audio src={som("musica.mp3")} volume={0.2} />
      <Audio src={som("ambiente.mp3")} volume={0.45} />
      {TOQUES.map((q, i) => (
        <Sequence key={`s${i}`} from={Math.round(q.t * FPS)} layout="none">
          <Audio src={som(q.arquivo)} volume={q.vol} />
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
