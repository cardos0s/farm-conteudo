import React from "react";
import { Curva, Elipse, Linha, Ret } from "../../../lousa/Esboco";
import { FONTE_LOUSA } from "../../../lousa/fontes";
import { claro, cor, tinta } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { progresso, useT } from "../../../lousa/tempo";

// Desenhos à mão (estilo Excalidraw) da história: boneco, celular, extrato e documento.

type P = [number, number];

/** Boneco de palito. (x, y) é o centro da cabeça; `s` é a escala. */
export function Boneco({ x, y, s = 1, de, corpo = tinta, braco = "baixo" }: { x: number; y: number; s?: number; de: number; corpo?: string; braco?: "baixo" | "frente" | "cima" }) {
  const r = 34 * s;
  const ombro = y + r + 22 * s;
  const quadril = y + r + 120 * s;
  const mao = (lado: 1 | -1): P => {
    if (braco === "frente" && lado === 1) return [x + 78 * s, ombro + 30 * s];
    if (braco === "cima") return [x + lado * 62 * s, ombro - 60 * s];
    return [x + lado * 48 * s, ombro + 72 * s];
  };
  return (
    <>
      <Elipse cx={x} cy={y} w={r * 2} h={r * 2} cor={corpo} espessura={3.2} de={de} dur={0.35} />
      <Linha pts={[[x, y + r], [x, quadril]]} cor={corpo} espessura={3.4} de={de + 0.3} dur={0.2} />
      <Linha pts={[mao(-1), [x, ombro], mao(1)]} cor={corpo} espessura={3.4} de={de + 0.45} dur={0.25} />
      <Linha pts={[[x - 40 * s, quadril + 92 * s], [x, quadril], [x + 40 * s, quadril + 92 * s]]} cor={corpo} espessura={3.4} de={de + 0.6} dur={0.25} />
    </>
  );
}

/** Texto manuscrito que muda com o tempo (ex.: contagem regressiva). */
export function TextoVivo({ x, y, tam, cor: c = tinta, de, ate, texto }: { x: number; y: number; tam: number; cor?: string; de: number; ate?: number; texto: (t: number) => string }) {
  const t = useT();
  if (t < de || (ate !== undefined && t >= ate)) return null;
  return (
    <text x={x} y={y} fontFamily={FONTE_LOUSA} fontSize={tam} fill={c} textAnchor="middle" opacity={progresso(t, de, 0.2)}>
      {texto(t)}
    </text>
  );
}

/** QR code rabiscado: três quadradinhos de canto e hachura cruzada no meio. */
function QREsboco({ x, y, l, de }: { x: number; y: number; l: number; de: number }) {
  const q = l * 0.3;
  return (
    <>
      <Ret x={x} y={y} w={l} h={l} redondo={false} preench={tinta} hachura="cross-hatch" vaoHachura={9} pesoHachura={1.6} espessura={2.6} de={de} dur={0.6} />
      {([[x, y], [x + l - q, y], [x, y + l - q]] as P[]).map(([a, b], i) => (
        <Ret key={i} x={a} y={b} w={q} h={q} redondo={false} preench="#ffffff" hachura="solid" espessura={3} de={de + 0.35 + i * 0.08} dur={0.2} />
      ))}
    </>
  );
}

export type CelularEsbocoProps = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  de: number;
  titulo: string;
  /** contagem regressiva: segundos que faltam em `de + 0.6` */
  expira?: number;
  /** o celular apaga neste instante */
  apaga?: number;
  /** "pagando…" e depois o check de pago */
  paga?: { de: number; ok: number };
};

/** Celular desenhado à mão com a tela do Pix. */
export function CelularEsboco({ x, y, w = 190, h = 330, de, titulo, expira, apaga, paga }: CelularEsbocoProps) {
  const cx = x + w / 2;
  const l = w * 0.56;
  const yq = y + 70 + (h - 140 - l) / 2;
  const ini = de + 0.6;
  return (
    <>
      <Ret x={x} y={y} w={w} h={h} espessura={3.6} de={de} dur={0.5} />
      <Linha pts={[[cx - 22, y + 18], [cx + 22, y + 18]]} espessura={4} de={de + 0.4} dur={0.15} />
      <Texto x={cx} y={y + 66} tam={36} ancora="middle" de={de + 0.35} dur={0.3}>
        {titulo}
      </Texto>
      <QREsboco x={cx - l / 2} y={yq} l={l} de={de + 0.45} />
      {expira !== undefined && (
        <TextoVivo
          x={cx}
          y={y + h - 34}
          tam={50}
          de={ini}
          ate={apaga}
          cor={cor.vermelho}
          texto={(t) => `00:0${Math.max(0, Math.ceil(expira - (t - ini)))}`}
        />
      )}
      {paga && (
        <>
          <TextoVivo x={cx} y={y + h - 34} tam={40} de={paga.de} ate={paga.ok} cor={cor.cinza} texto={(t) => "pagando" + ".".repeat(1 + (Math.floor(t * 4) % 3))} />
          <Elipse cx={cx} cy={yq + l / 2} w={l * 1.05} h={l * 1.05} cor={cor.verde} preench="#ffffff" hachura="solid" espessura={4.5} de={paga.ok} dur={0.3} />
          <Linha pts={[[cx - l * 0.22, yq + l * 0.52], [cx - l * 0.05, yq + l * 0.68], [cx + l * 0.24, yq + l * 0.32]]} cor={cor.verde} espessura={7} de={paga.ok + 0.25} dur={0.25} />
          <Texto x={cx} y={y + h - 30} tam={46} cor={cor.verde} ancora="middle" de={paga.ok + 0.2} dur={0.3}>
            pago!
          </Texto>
        </>
      )}
      {apaga !== undefined && <Ret x={x + 8} y={y + 34} w={w - 16} h={h - 44} redondo={false} preench={tinta} hachura="solid" cor={tinta} espessura={2} de={apaga} dur={0.25} />}
    </>
  );
}

/** Bateria desenhada à mão; `nivel` 0..1. */
export function Bateria({ x, y, nivel, de, corNivel = cor.vermelho }: { x: number; y: number; nivel: number; de: number; corNivel?: string }) {
  return (
    <>
      <Ret x={x} y={y} w={76} h={38} espessura={3} de={de} dur={0.3} />
      <Ret x={x + 76} y={y + 11} w={8} h={16} redondo={false} preench={tinta} hachura="solid" espessura={2} de={de + 0.2} dur={0.1} />
      {nivel > 0 && <Ret x={x + 6} y={y + 6} w={Math.max(6, 64 * nivel)} h={26} redondo={false} preench={corNivel} hachura="solid" cor={corNivel} espessura={1.5} de={de + 0.3} dur={0.15} />}
    </>
  );
}

/** Folha de extrato bancário com linhas rabiscadas e uma linha marcada. */
export function Extrato({ x, y, de }: { x: number; y: number; de: number }) {
  const w = 160;
  const h = 210;
  return (
    <>
      <Ret x={x} y={y} w={w} h={h} redondo={false} preench="#ffffff" hachura="solid" espessura={3} de={de} dur={0.4} />
      <Texto x={x + w / 2} y={y + 42} tam={30} ancora="middle" de={de + 0.25} dur={0.3}>
        extrato
      </Texto>
      {[0, 1, 2, 3].map((i) => (
        <Linha key={i} pts={[[x + 22, y + 82 + i * 30], [x + w - 26 - (i % 2) * 30, y + 82 + i * 30]]} cor={i === 2 ? cor.vermelho : cor.cinza} espessura={i === 2 ? 4 : 2.6} de={de + 0.4 + i * 0.1} dur={0.15} />
      ))}
      <Elipse cx={x + w / 2} cy={y + 142} w={w - 8} h={40} cor={cor.vermelho} espessura={3} de={de + 0.9} dur={0.3} />
    </>
  );
}

/** Documento de identidade rabiscado. */
export function Documento({ x, y, de }: { x: number; y: number; de: number }) {
  const w = 190;
  const h = 120;
  return (
    <>
      <Ret x={x} y={y} w={w} h={h} preench={claro.azul} hachura="hachure" vaoHachura={12} espessura={3} de={de} dur={0.4} />
      <Elipse cx={x + 46} cy={y + 54} w={50} h={56} preench="#ffffff" hachura="solid" espessura={2.6} de={de + 0.3} dur={0.2} />
      <Curva pts={[[x + 24, y + 104], [x + 46, y + 86], [x + 68, y + 104]]} espessura={2.6} de={de + 0.45} dur={0.15} />
      {[0, 1, 2].map((i) => (
        <Linha key={i} pts={[[x + 92, y + 36 + i * 26], [x + w - 22 - (i === 2 ? 30 : 0), y + 36 + i * 26]]} espessura={2.6} de={de + 0.5 + i * 0.08} dur={0.12} />
      ))}
    </>
  );
}

/** Balão de pensamento com "?". */
export function Duvida({ x, y, de }: { x: number; y: number; de: number }) {
  return (
    <>
      <Elipse cx={x} cy={y} w={70} h={64} espessura={2.6} preench="#ffffff" hachura="solid" de={de} dur={0.25} />
      <Elipse cx={x - 30} cy={y + 44} w={14} h={12} espessura={2.2} de={de + 0.2} dur={0.1} />
      <Texto x={x} y={y + 16} tam={46} cor={cor.vermelho} ancora="middle" de={de + 0.2} dur={0.15}>
        ?
      </Texto>
    </>
  );
}
