import React from "react";
import { Caminho, Elipse, Linha, Ret, type Estilo, type Tempo } from "../../../lousa/Esboco";
import { claro, cor } from "../../../lousa/paleta";
import { largura, Texto } from "../../../lousa/Texto";

// Desenhos reaproveitados nas cenas desta aula: pessoas, robô, papel, balão de fala etc.
// Todos recebem `de` (segundo em que começam a ser desenhados) e, opcionalmente, `ate`.

type Base = Estilo & Tempo;
type Ponto = [number, number];

const poligono = (pts: Ponto[]) => `M${pts.map((p) => p.join(" ")).join(" L")} Z`;

/** Folha de papel com o canto dobrado e linhas de texto. */
export function Papel({
  x,
  y,
  w,
  h,
  linhas = 4,
  titulo,
  corLinhas = cor.cinza,
  de,
  ate,
  preench = "#ffffff",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  linhas?: number;
  titulo?: string;
  corLinhas?: string;
  de: number;
  ate?: number;
  preench?: string;
}) {
  const c = Math.min(w, h) * 0.2;
  const topo = titulo ? y + 78 : y + 46;
  const passo = (y + h - 30 - topo) / Math.max(1, linhas);
  return (
    <>
      <Caminho d={poligono([[x, y], [x + w - c, y], [x + w, y + c], [x + w, y + h], [x, y + h]])} preench={preench} hachura="solid" de={de} dur={0.5} ate={ate} />
      <Linha pts={[[x + w - c, y], [x + w - c, y + c], [x + w, y + c]]} espessura={2.4} de={de + 0.3} dur={0.2} ate={ate} />
      {titulo && (
        <Texto x={x + 22} y={y + 52} tam={34} de={de + 0.3} ate={ate}>
          {titulo}
        </Texto>
      )}
      {Array.from({ length: linhas }, (_, i) => (
        <Linha
          key={i}
          pts={[[x + 22, topo + i * passo], [x + w - 22 - (i % 3 === 2 ? w * 0.3 : i % 2 ? w * 0.12 : 0), topo + i * passo]]}
          cor={corLinhas}
          espessura={3}
          de={de + 0.4 + i * 0.08}
          dur={0.2}
          ate={ate}
        />
      ))}
    </>
  );
}

/** Robô (o agente). (x, y) é o centro da cabeça; s é a largura da cabeça. */
export function Robo({ x, y, s = 200, de, ate, olhos = cor.tinta, preench = claro.azul }: { x: number; y: number; s?: number; de: number; ate?: number; olhos?: string; preench?: string }) {
  const h = s * 0.78;
  return (
    <>
      <Linha pts={[[x, y - h / 2], [x, y - h / 2 - s * 0.2]]} de={de} dur={0.15} ate={ate} />
      <Elipse cx={x} cy={y - h / 2 - s * 0.24} w={s * 0.12} h={s * 0.12} preench={claro.vermelho} hachura="solid" de={de + 0.1} dur={0.2} ate={ate} />
      <Ret x={x - s / 2} y={y - h / 2} w={s} h={h} preench={preench} de={de} dur={0.6} ate={ate} />
      <Elipse cx={x - s * 0.2} cy={y - h * 0.08} w={s * 0.17} h={s * 0.17} preench={olhos} hachura="solid" de={de + 0.45} dur={0.2} ate={ate} />
      <Elipse cx={x + s * 0.2} cy={y - h * 0.08} w={s * 0.17} h={s * 0.17} preench={olhos} hachura="solid" de={de + 0.5} dur={0.2} ate={ate} />
      <Linha pts={[[x - s * 0.18, y + h * 0.24], [x, y + h * 0.3], [x + s * 0.18, y + h * 0.24]]} de={de + 0.6} dur={0.2} ate={ate} />
      <Ret x={x - s * 0.06} y={y + h / 2} w={s * 0.12} h={s * 0.1} redondo={false} de={de + 0.5} dur={0.15} ate={ate} />
      <Ret x={x - s * 0.42} y={y + h / 2 + s * 0.1} w={s * 0.84} h={s * 0.42} preench={preench} de={de + 0.55} dur={0.45} ate={ate} />
    </>
  );
}

/** Pessoa em traço simples. (x, y) é o centro da cabeça; s é o diâmetro da cabeça. */
export function Boneco({
  x,
  y,
  s = 70,
  de,
  ate,
  pele = claro.laranja,
  roupa,
  gravata = false,
  bracos = "baixo",
}: {
  x: number;
  y: number;
  s?: number;
  de: number;
  ate?: number;
  pele?: string;
  roupa?: string;
  gravata?: boolean;
  bracos?: "baixo" | "cima" | "aponta";
}) {
  const ombro = y + s * 0.85;
  const quadril = y + s * 2.1;
  const pe = y + s * 3.1;
  const braco: Record<string, Ponto[][]> = {
    baixo: [[[x, ombro], [x - s * 0.55, y + s * 1.7]], [[x, ombro], [x + s * 0.55, y + s * 1.7]]],
    cima: [[[x, ombro], [x - s * 0.6, y + s * 0.2]], [[x, ombro], [x + s * 0.6, y + s * 0.2]]],
    aponta: [[[x, ombro], [x - s * 0.55, y + s * 1.7]], [[x, ombro], [x + s * 0.95, y + s * 0.55]]],
  };
  return (
    <>
      <Elipse cx={x} cy={y} w={s} h={s * 1.05} preench={pele} hachura="solid" de={de} dur={0.35} ate={ate} />
      {roupa ? (
        <Caminho
          d={poligono([[x - s * 0.42, ombro - s * 0.2], [x + s * 0.42, ombro - s * 0.2], [x + s * 0.32, quadril], [x - s * 0.32, quadril]])}
          preench={roupa}
          de={de + 0.2}
          dur={0.4}
          ate={ate}
        />
      ) : (
        <Linha pts={[[x, y + s * 0.53], [x, quadril]]} de={de + 0.2} dur={0.25} ate={ate} />
      )}
      {gravata && <Caminho d={poligono([[x, ombro - s * 0.18], [x + s * 0.1, ombro + s * 0.5], [x, ombro + s * 0.75], [x - s * 0.1, ombro + s * 0.5]])} preench={cor.vermelho} hachura="solid" cor={cor.vermelho} de={de + 0.45} dur={0.2} ate={ate} />}
      {braco[bracos].map((pts, i) => (
        <Linha key={i} pts={pts} de={de + 0.4 + i * 0.08} dur={0.2} ate={ate} />
      ))}
      <Linha pts={[[x - s * 0.15, quadril], [x - s * 0.4, pe]]} de={de + 0.55} dur={0.2} ate={ate} />
      <Linha pts={[[x + s * 0.15, quadril], [x + s * 0.4, pe]]} de={de + 0.6} dur={0.2} ate={ate} />
    </>
  );
}

function caminhoBalao(x: number, y: number, w: number, h: number, ponta: Ponto) {
  const r = Math.min(28, h * 0.3);
  // a ponta sai da borda de baixo, perto do lado mais próximo do alvo
  const bx = Math.min(x + w - r - 50, Math.max(x + r + 10, ponta[0] - 30));
  return [
    `M${x + r} ${y}`,
    `L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r}`,
    `L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `L${bx + 44} ${y + h} L${ponta[0]} ${ponta[1]} L${bx} ${y + h}`,
    `L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r}`,
    `L${x} ${y + r} Q${x} ${y} ${x + r} ${y}`,
  ].join(" ");
}

/** Balão de fala ajustado ao texto. (x, y) é o canto superior esquerdo; a ponta aponta para `ponta`. */
export function Balao({
  x,
  y,
  texto,
  ponta,
  tam = 44,
  pad = 28,
  preench = "#ffffff",
  corBorda,
  de,
  ate,
}: {
  x: number;
  y: number;
  texto: string;
  ponta: Ponto;
  tam?: number;
  pad?: number;
  preench?: string;
  corBorda?: string;
  de: number;
  ate?: number;
}) {
  const ls = texto.split("\n");
  const w = Math.max(...ls.map((l) => largura(l, tam))) + pad * 2;
  const h = ls.length * tam * 1.2 + pad * 1.2;
  return (
    <>
      <Caminho d={caminhoBalao(x, y, w, h, ponta)} preench={preench} hachura="solid" cor={corBorda} de={de} dur={0.5} ate={ate} />
      <Texto x={x + pad} y={y + pad * 0.6 + tam * 0.95} tam={tam} de={de + 0.25} ate={ate} alturaLinha={1.2}>
        {texto}
      </Texto>
    </>
  );
}

/** Celular. (x, y) canto superior esquerdo. */
export function Celular({ x, y, w = 120, h = 210, de, ate, tela = claro.cinza }: { x: number; y: number; w?: number; h?: number; de: number; ate?: number; tela?: string }) {
  return (
    <>
      <Ret x={x} y={y} w={w} h={h} preench="#495057" hachura="solid" de={de} dur={0.4} ate={ate} />
      <Ret x={x + 10} y={y + 22} w={w - 20} h={h - 56} redondo={false} preench={tela} hachura="solid" espessura={2} de={de + 0.2} dur={0.3} ate={ate} />
      <Elipse cx={x + w / 2} cy={y + h - 17} w={14} h={14} cor="#dee2e6" de={de + 0.35} dur={0.15} ate={ate} />
    </>
  );
}

/** Lâmpada (apagada por padrão). (x, y) centro do bulbo. */
export function Lampada({ x, y, s = 120, acesa, de, ate }: { x: number; y: number; s?: number; acesa?: string; de: number; ate?: number }) {
  return (
    <>
      <Caminho
        d={`M${x - s * 0.22} ${y + s * 0.42} Q${x - s * 0.22} ${y + s * 0.22} ${x - s * 0.4} ${y + s * 0.05} A${s * 0.5} ${s * 0.5} 0 1 1 ${x + s * 0.4} ${y + s * 0.05} Q${x + s * 0.22} ${y + s * 0.22} ${x + s * 0.22} ${y + s * 0.42} Z`}
        preench={acesa ?? "#f1f3f5"}
        hachura={acesa ? "hachure" : "solid"}
        de={de}
        dur={0.5}
        ate={ate}
      />
      <Ret x={x - s * 0.24} y={y + s * 0.45} w={s * 0.48} h={s * 0.12} redondo={false} preench="#adb5bd" hachura="solid" de={de + 0.35} dur={0.15} ate={ate} />
      <Ret x={x - s * 0.2} y={y + s * 0.6} w={s * 0.4} h={s * 0.12} redondo={false} preench="#adb5bd" hachura="solid" de={de + 0.4} dur={0.15} ate={ate} />
      <Linha pts={[[x - s * 0.1, y + s * 0.42], [x - s * 0.1, y + s * 0.1], [x, y + s * 0.2], [x + s * 0.1, y + s * 0.1], [x + s * 0.1, y + s * 0.42]]} cor={cor.cinza} espessura={2} de={de + 0.45} dur={0.25} ate={ate} />
    </>
  );
}

/** Brilho de quatro pontas. */
export function Brilho({ x, y, s = 30, de, ate, cor: c = cor.laranja }: { x: number; y: number; s?: number; de: number; ate?: number; cor?: string }) {
  const k = s * 0.22;
  const d = `M${x} ${y - s} Q${x + k} ${y - k} ${x + s} ${y} Q${x + k} ${y + k} ${x} ${y + s} Q${x - k} ${y + k} ${x - s} ${y} Q${x - k} ${y - k} ${x} ${y - s} Z`;
  return <Caminho d={d} cor={c} preench={c} hachura="solid" espessura={2} de={de} dur={0.25} ate={ate} />;
}

/** Lupa. (x, y) centro da lente. */
export function Lupa({ x, y, s = 90, de, ate }: { x: number; y: number; s?: number; de: number; ate?: number }) {
  return (
    <>
      <Elipse cx={x} cy={y} w={s} h={s} preench={claro.azul} espessura={4} de={de} dur={0.4} ate={ate} />
      <Linha pts={[[x + s * 0.36, y + s * 0.36], [x + s * 0.85, y + s * 0.85]]} espessura={9} de={de + 0.3} dur={0.25} ate={ate} />
    </>
  );
}

/** Martelo de juiz. (x, y) centro da cabeça do martelo. */
export function Martelo({ x, y, s = 1, de, ate }: { x: number; y: number; s?: number; de: number; ate?: number }) {
  const rot = (px: number, py: number, a = -0.6): Ponto => [x + (px * Math.cos(a) - py * Math.sin(a)) * s, y + (px * Math.sin(a) + py * Math.cos(a)) * s];
  return (
    <>
      <Caminho d={poligono([rot(-14, 30), rot(14, 30), rot(14, 230), rot(-14, 230)])} preench={claro.laranja} hachura="solid" de={de + 0.3} dur={0.35} ate={ate} />
      <Caminho d={poligono([rot(-95, -45), rot(95, -45), rot(95, 45), rot(-95, 45)])} preench="#a87a4f" de={de} dur={0.5} ate={ate} />
      <Linha pts={[rot(-62, -45), rot(-62, 45)]} espessura={2.5} de={de + 0.4} dur={0.15} ate={ate} />
      <Linha pts={[rot(62, -45), rot(62, 45)]} espessura={2.5} de={de + 0.45} dur={0.15} ate={ate} />
      <Ret x={x - 40 * s} y={y + 190 * s} w={210 * s} h={44 * s} preench="#a87a4f" de={de + 0.5} dur={0.35} ate={ate} />
    </>
  );
}
