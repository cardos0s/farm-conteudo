import React, { useMemo } from "react";
import rough from "roughjs";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { tinta } from "../../lousa/paleta";
import { lerp, progresso, suave } from "../../lousa/tempo";
import type { Segmento } from "./roteiro";

// Camada da câmera, comum a todas as aulas. Cada segmento do EDL vira uma <Sequence> com o
// trecho do clipe 1440p (em public/<pasta>/IMG_<clipe>.mp4). O enquadramento depende do "modo"
// no tempo (tela cheia, dividida, PiP no canto, cartão ou oculta) e o recorte acompanha o rosto
// (trilha suavizada de detecção facial, gerada por scripts/aulas/rostos.py).

/** O que a câmera precisa saber de cada aula. */
export type FonteAula = {
  fps: number;
  segmentos: Segmento[];
  rostos: Record<string, [number, number, number, number][]>;
  /** pasta dos vídeos dentro de public/, por exemplo "aulas/complexidade" */
  pasta: string;
};

export type Modo = "oculta" | "cheia" | "dividida" | "pip" | "cartao" | "surge";
export type ChaveModo = { t: number; modo: Modo; dur?: number };

const LW = 2560;
const LH = 1440;
export const PIP = { x: 1466, y: 684, w: 418, h: 360 };
/** Vídeo pequeno no centro da lousa de abertura, como uma imagem colada no canvas. */
const CARTAO = { x: 720, y: 735, w: 480, h: 270 };

type Ret = { x: number; y: number; w: number; h: number };
type Caixa = Ret & { raio: number; alfa: number };

const prender = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function caixaDo(modo: Modo): Caixa {
  switch (modo) {
    case "cheia":
      return { x: 0, y: 0, w: 1920, h: 1080, raio: 0, alfa: 1 };
    case "dividida":
      return { x: 0, y: 0, w: 960, h: 1080, raio: 0, alfa: 1 };
    case "pip":
      return { ...PIP, raio: 22, alfa: 1 };
    case "oculta":
      return { x: PIP.x + PIP.w * 0.2, y: PIP.y + PIP.h * 0.2, w: PIP.w * 0.6, h: PIP.h * 0.6, raio: 22, alfa: 0 };
    case "cartao":
      return { ...CARTAO, raio: 14, alfa: 1 };
    case "surge":
      return { x: CARTAO.x + CARTAO.w * 0.2, y: CARTAO.y + CARTAO.h * 0.2, w: CARTAO.w * 0.6, h: CARTAO.h * 0.6, raio: 14, alfa: 0 };
  }
}

function rosto(aula: FonteAula, clip: string, t: number) {
  const tr = aula.rostos[clip];
  const i = prender(Math.floor(t * 2), 0, tr.length - 2);
  const [a, b] = [tr[i], tr[i + 1]];
  const k = prender((t - a[0]) / (b[0] - a[0] || 1), 0, 1);
  return { cx: lerp(a[1], b[1], k), cy: lerp(a[2], b[2], k), s: lerp(a[3], b[3], k) };
}

function dentro(r: Ret): Ret {
  const w = Math.min(r.w, LW);
  const h = Math.min(r.h, LH);
  return { w, h, x: prender(r.x, 0, LW - w), y: prender(r.y, 0, LH - h) };
}

function recorteDo(aula: FonteAula, modo: Modo, clip: string, t: number, zoom: number): Ret {
  const f = rosto(aula, clip, t);
  if (modo === "cartao" || modo === "surge") return { x: 0, y: 0, w: LW, h: LH };
  if (modo === "cheia") {
    if (zoom <= 1.001) return { x: 0, y: 0, w: LW, h: LH };
    const w = LW / zoom;
    const h = LH / zoom;
    return dentro({ x: f.cx - w / 2, y: f.cy + f.s * 0.2 - h / 2, w, h });
  }
  if (modo === "dividida") {
    const h = LH;
    const w = (LH * 960) / 1080;
    return dentro({ x: f.cx - w / 2, y: 0, w, h });
  }
  const h = prender(f.s * 2.7, 820, 1300);
  const w = (h * PIP.w) / PIP.h;
  return dentro({ x: f.cx - w / 2, y: f.cy - h * 0.4, w, h });
}

const mistura = <T extends Record<string, number>>(a: T, b: T, p: number): T =>
  Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], p)])) as T;

export function modoEm(t: number, chaves: ChaveModo[]) {
  let i = 0;
  while (i + 1 < chaves.length && chaves[i + 1].t <= t) i++;
  const atual = chaves[i];
  const anterior = chaves[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : progresso(t, atual.t, atual.dur ?? 0.6, suave);
  return { de: anterior.modo, para: atual.modo, p };
}

/** Zoom de "punch-in" alternado a cada corte em tela cheia, para disfarçar os cortes secos. */
function zoomDo(aula: FonteAula, seg: Segmento): number {
  const doClipe = aula.segmentos.filter((s) => s.clip === seg.clip);
  return doClipe.indexOf(seg) % 2 === 1 ? 1.12 : 1;
}

function Trecho({ aula, seg, chaves, fonte, congelar }: { aula: FonteAula; seg: Segmento; chaves: ChaveModo[]; fonte: { clip: string; inicio: number }; congelar: boolean }) {
  const frame = useCurrentFrame();
  const t = (seg.startF + frame) / aula.fps;
  const tSrc = (fonte.inicio + (congelar ? 0 : frame)) / aula.fps;
  const { de, para, p } = modoEm(t, chaves);
  const zoom = seg.clip === "pausa" ? 1 : zoomDo(aula, seg);
  const c = mistura(caixaDo(de), caixaDo(para), p);
  if (c.alfa <= 0.001) return null;
  const r = mistura(recorteDo(aula, de, fonte.clip, tSrc, zoom), recorteDo(aula, para, fonte.clip, tSrc, zoom), p);
  const escala = Math.max(c.w / r.w, c.h / r.h);
  const ehPip = 1 - prender((c.w - PIP.w) / (960 - PIP.w), 0, 1);
  const video = (
    <OffthreadVideo
      src={staticFile(`${aula.pasta}/IMG_${fonte.clip}.mp4`)}
      trimBefore={congelar ? 0 : fonte.inicio}
      muted
      style={{
        position: "absolute",
        width: LW * escala,
        height: LH * escala,
        left: -r.x * escala + (c.w - r.w * escala) / 2,
        top: -r.y * escala + (c.h - r.h * escala) / 2,
        maxWidth: "none",
      }}
    />
  );
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
        boxShadow: ehPip > 0 ? `0 ${12 * ehPip}px ${34 * ehPip}px rgba(0,0,0,${0.22 * ehPip})` : undefined,
        background: "#000",
      }}
    >
      {congelar ? <Freeze frame={fonte.inicio}>{video}</Freeze> : video}
    </div>
  );
}

/** Contorno à mão em volta do PiP (gerado uma vez e esticado para a caixa atual). */
function MolduraPip({ chaves, fps }: { chaves: ChaveModo[]; fps: number }) {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const caminhos = useMemo(() => {
    const g = rough.generator();
    const d = g.rectangle(4, 4, PIP.w - 8, PIP.h - 8, { seed: 11, roughness: 1.3, stroke: tinta, strokeWidth: 3.4, bowing: 1.2 });
    return g.toPaths(d);
  }, []);
  const { de, para, p } = modoEm(t, chaves);
  const c = mistura(caixaDo(de), caixaDo(para), p);
  const ehPip = 1 - prender((c.w - PIP.w) / (960 - PIP.w), 0, 1);
  if (c.alfa * ehPip <= 0.01) return null;
  return (
    <svg
      style={{ position: "absolute", left: c.x - 6, top: c.y - 6, width: c.w + 12, height: c.h + 12, opacity: c.alfa * ehPip }}
      viewBox={`0 0 ${PIP.w} ${PIP.h}`}
      preserveAspectRatio="none"
    >
      {caminhos.map((cm, i) => (
        <path key={i} d={cm.d} fill="none" stroke={cm.stroke} strokeWidth={cm.strokeWidth} strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function Camera({ chaves, aula }: { chaves: ChaveModo[]; aula: FonteAula }) {
  const { segmentos } = aula;
  return (
    <AbsoluteFill>
      {segmentos.map((seg, i) => {
        let fonte = { clip: seg.clip, inicio: seg.inF };
        let congelar = false;
        if (seg.clip === "pausa") {
          // nas pausas mostra o trecho logo antes da próxima fala (ou congela, se não houver)
          const prox = segmentos.slice(i + 1).find((s) => s.clip !== "pausa");
          const ant = [...segmentos.slice(0, i)].reverse().find((s) => s.clip !== "pausa");
          const len = seg.endF - seg.startF;
          if (prox && prox.inF - len >= 0) fonte = { clip: prox.clip, inicio: prox.inF - len };
          else if (prox) [fonte, congelar] = [{ clip: prox.clip, inicio: prox.inF }, true];
          else if (ant) [fonte, congelar] = [{ clip: ant.clip, inicio: ant.outF - 1 }, true];
        }
        return (
          <Sequence key={i} from={seg.startF} durationInFrames={seg.endF - seg.startF} layout="none">
            <Trecho aula={aula} seg={seg} chaves={chaves} fonte={fonte} congelar={congelar} />
          </Sequence>
        );
      })}
      <MolduraPip chaves={chaves} fps={aula.fps} />
    </AbsoluteFill>
  );
}
