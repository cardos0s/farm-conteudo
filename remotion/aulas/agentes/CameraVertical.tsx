import React from "react";
import { OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BARRA, FONTE_UI, ui } from "../../lousa/Janelas";
import { lerp, progresso, suave } from "../../lousa/tempo";
import type { Segmento } from "../comum/roteiro";

// Câmera do Reel vertical (1080x1920) a partir de um vídeo 3840x2160:
//  - "rosto": a pessoa em tela cheia (recorte 9:16 que segue o rosto)
//  - "painel": um painel embaixo, com barra de título como os terminais, e o canvas em cima
//  - "pip": janelinha pequena no canto, com barra de título (a aula fica no canvas)
//  - "oculta": some

export type ModoV = "rosto" | "painel" | "pip" | "oculta";
export type ChaveV = { t: number; modo: ModoV; dur?: number };
export type FonteVertical = { fps: number; segmentos: Segmento[]; rostos: Record<string, [number, number, number, number][]>; pasta: string };

const LW = 3840;
const LH = 2160;

type Caixa = { x: number; y: number; w: number; h: number; raio: number; alfa: number; barra: number };
export const PAINEL: Caixa = { x: 40, y: 1124, w: 1000, h: 736, raio: 18, alfa: 1, barra: BARRA };
/** Janelinha da câmera: abaixo do canvas, à esquerda (longe dos botões do Reels, à direita). */
export const PIP: Caixa = { x: 40, y: 1196, w: 360, h: 300, raio: 16, alfa: 1, barra: 44 };
const CAIXAS: Record<ModoV, Caixa> = {
  rosto: { x: 0, y: 0, w: 1080, h: 1920, raio: 0, alfa: 1, barra: 0 },
  painel: PAINEL,
  pip: PIP,
  oculta: { ...PIP, alfa: 0 },
};

type Ret = { x: number; y: number; w: number; h: number };
const prender = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mistura = <T extends Record<string, number>>(a: T, b: T, p: number): T =>
  Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], p)])) as T;

export function modoEm(t: number, chaves: ChaveV[]) {
  let i = 0;
  while (i + 1 < chaves.length && chaves[i + 1].t <= t) i++;
  const atual = chaves[i];
  const anterior = chaves[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : progresso(t, atual.t, atual.dur ?? 0.6, suave);
  return { de: anterior.modo, para: atual.modo, p };
}

/** Quanto do "painel" está na tela (0 = rosto/oculta, 1 = painel). */
export function painelEm(t: number, chaves: ChaveV[]) {
  const { de, para, p } = modoEm(t, chaves);
  const v = (m: ModoV) => (m === "painel" ? 1 : 0);
  return lerp(v(de), v(para), p);
}

function rosto(aula: FonteVertical, clip: string, t: number) {
  const tr = aula.rostos[clip];
  const i = Math.min(tr.length - 1, Math.max(0, Math.floor(t * 2)));
  const j = Math.min(tr.length - 1, i + 1);
  const k = prender(t * 2 - i, 0, 1);
  return { cx: lerp(tr[i][1], tr[j][1], k), cy: lerp(tr[i][2], tr[j][2], k), s: lerp(tr[i][3], tr[j][3], k) };
}

function dentro(r: Ret): Ret {
  const w = Math.min(r.w, LW);
  const h = Math.min(r.h, LH);
  return { w, h, x: prender(r.x, 0, LW - w), y: prender(r.y, 0, LH - h) };
}

/** Recorte do vídeo para a área de vídeo da caixa do modo (já descontada a barra de título). */
function recorteDo(aula: FonteVertical, modo: ModoV, clip: string, t: number, zoom: number): Ret {
  const f = rosto(aula, clip, t);
  const c = CAIXAS[modo];
  const aspecto = c.w / (c.h - c.barra);
  if (modo === "rosto") {
    const h = prender(f.s * 3.3, 1500, LH) / zoom;
    const w = h * aspecto;
    return dentro({ x: f.cx - w / 2, y: f.cy - h * 0.36, w, h });
  }
  const h = prender(f.s * (modo === "pip" ? 2.2 : 2.05), 950, LH) / zoom;
  const w = h * aspecto;
  return dentro({ x: f.cx - w / 2, y: f.cy - h * 0.42, w, h });
}

/** Zoom de "punch-in" alternado a cada corte, para disfarçar os cortes secos. */
function zoomDo(aula: FonteVertical, seg: Segmento): number {
  const doClipe = aula.segmentos.filter((s) => s.clip === seg.clip);
  return doClipe.indexOf(seg) % 2 === 1 ? 1.1 : 1;
}

function Trecho({ aula, seg, chaves }: { aula: FonteVertical; seg: Segmento; chaves: ChaveV[] }) {
  const frame = useCurrentFrame();
  const t = (seg.startF + frame) / aula.fps;
  const tSrc = (seg.inF + frame) / aula.fps;
  const { de, para, p } = modoEm(t, chaves);
  const zoom = zoomDo(aula, seg);
  const c = mistura(CAIXAS[de], CAIXAS[para], p);
  if (c.alfa <= 0.001) return null;
  const r = mistura(recorteDo(aula, de, seg.clip, tSrc, zoom), recorteDo(aula, para, seg.clip, tSrc, zoom), p);
  const hv = c.h - c.barra;
  const escala = Math.max(c.w / r.w, hv / r.h);
  const ehPainel = prender(c.barra / 40, 0, 1);
  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y,
        width: c.w,
        height: c.h,
        overflow: "hidden",
        borderRadius: c.raio,
        opacity: c.alfa,
        background: ui.barra,
        border: ehPainel > 0 ? `${1.6 * ehPainel}px solid ${ui.borda}` : undefined,
        boxShadow: ehPainel > 0 ? `0 ${14 * ehPainel}px ${30 * ehPainel}px rgba(30,30,25,${0.16 * ehPainel})` : undefined,
      }}
    >
      {c.barra > 1 && <BarraCamera largura={c.w} altura={c.barra} />}
      <div style={{ position: "absolute", left: 0, top: c.barra, width: c.w, height: hv, overflow: "hidden", background: "#000" }}>
        <OffthreadVideo
          src={staticFile(`${aula.pasta}/IMG_${seg.clip}.mp4`)}
          trimBefore={seg.inF}
          muted
          style={{
            position: "absolute",
            width: LW * escala,
            height: LH * escala,
            left: -r.x * escala + (c.w - r.w * escala) / 2,
            top: -r.y * escala + (hv - r.h * escala) / 2,
            maxWidth: "none",
          }}
        />
      </div>
    </div>
  );
}

/** Barra de título do painel da câmera, igual à dos terminais. */
function BarraCamera({ largura, altura }: { largura: number; altura: number }) {
  const frame = useCurrentFrame();
  const aceso = Math.floor(frame / 30) % 2 === 0;
  return (
    <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect width={largura} height={altura} fill={ui.barra} />
      <line x1={0} y1={altura - 0.75} x2={largura} y2={altura - 0.75} stroke={ui.linha} strokeWidth={1.5} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={24 + i * 20} cy={altura / 2} r={6} fill="#dedfd8" />
      ))}
      <circle cx={94} cy={altura / 2} r={7} fill={ui.vermelho} opacity={aceso ? 1 : 0.35} />
      <text x={110} y={altura / 2 + 8} fontFamily={FONTE_UI} fontWeight={700} fontSize={23} fill={ui.texto}>
        câmera
      </text>
    </svg>
  );
}

export function CameraVertical({ chaves, aula }: { chaves: ChaveV[]; aula: FonteVertical }) {
  return (
    <>
      {aula.segmentos.map((seg, i) => (
        <Sequence key={i} from={seg.startF} durationInFrames={seg.endF - seg.startF} layout="none">
          <Trecho aula={aula} seg={seg} chaves={chaves} />
        </Sequence>
      ))}
    </>
  );
}
