import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { planosDosCliques, type Plano } from "./camera";
import { cliques, type Gravacao } from "./gravacao";
import { FPS } from "./marca";
import { BalaoCanal, Chip, Folha, Fundo, Legenda, type Fala } from "./Pecas";
import { Tela } from "./Tela";
import { Abertura, Encerramento } from "./Vinhetas";
import type { Canal } from "./marca";

// Montagem genérica dos vídeos do pack: blocos em sequência (abertura, trechos de tela, encerramento),
// com locução, legenda, balões e som de clique. Cada vídeo só descreve a sua edição (Edicao).

export type BlocoTela = {
  tipo: "tela";
  /** Nome da gravação (pasta em public/selloop/telas). */
  cena: string;
  url: string;
  /** Trecho da gravação, em segundos. */
  de: number;
  ate: number;
  velocidade?: number;
  /** Enquadramentos em tempo da gravação. Sem planos, a câmera segue os cliques. */
  planos?: Plano[];
  zoomCliques?: number;
};
/** Bloco desenhado por um componente do próprio vídeo (ex.: o celular do vídeo 3), pelo nome. */
export type BlocoCena = { tipo: "cena"; dur: number; nome: string };
export type Bloco = BlocoTela | BlocoCena | { tipo: "abertura"; dur: number } | { tipo: "encerramento"; dur: number; frase: string };

export type Sobreposicao =
  | { tipo: "canal"; canal: Canal; de: number; ate: number; x: number; y: number; tamanho?: number; comNome?: boolean }
  | { tipo: "chip"; texto: string; de: number; ate: number; x: number; y: number; destaque?: boolean; tamanho?: number }
  | { tipo: "folha"; src: string; de: number; ate: number; x: number; y: number; largura: number; rotacao?: number; rotulo?: string };

export type FalaLocucao = { id: string; arquivo: string; duracao: number; legendas: { texto: string; de: number; ate: number }[]; palavras?: { texto: string; de: number; ate: number }[] };

export type Edicao = {
  blocos: Bloco[];
  /** Cada fala começa em `em` segundos do vídeo. `legenda: false` quando o texto já está na tela. */
  falas: { id: string; em: number; legenda?: boolean }[];
  sobreposicoes: Sobreposicao[];
  /** Duração da transição entre blocos (s). */
  transicao: number;
  pastaLocucao: string;
  /** Trilha de fundo (em public/) e volumes: normal e durante a locução. */
  trilha?: { arquivo: string; volume: number; volumeFala: number };
};

export function duracaoBloco(b: Bloco): number {
  if (b.tipo === "tela") return (b.ate - b.de) / (b.velocidade ?? 1);
  return b.dur;
}

/**
 * Junção contínua: o bloco segue a mesma gravação exatamente de onde o anterior parou. Aí não há
 * transição nem sobreposição (só muda a velocidade), senão a dissolvência mostraria a tela "dobrada".
 */
export function continua(blocos: Bloco[], i: number): boolean {
  if (i === 0) return false;
  const a = blocos[i - 1];
  const b = blocos[i];
  return a.tipo === "tela" && b.tipo === "tela" && a.cena === b.cena && Math.abs(b.de - a.ate) < 0.05;
}

/** Duração da transição que leva ao bloco i (0 no primeiro bloco e nas junções contínuas). */
export function transicaoAntes(ed: Pick<Edicao, "blocos" | "transicao">, i: number): number {
  return i === 0 || continua(ed.blocos, i) ? 0 : ed.transicao;
}

export function inicios(ed: Pick<Edicao, "blocos" | "transicao">): number[] {
  const r: number[] = [];
  let t = 0;
  ed.blocos.forEach((b, i) => {
    t -= transicaoAntes(ed, i);
    r.push(t);
    t += duracaoBloco(b);
  });
  return r;
}

export function duracaoTotal(ed: Pick<Edicao, "blocos" | "transicao">): number {
  const i = inicios(ed);
  const ultimo = ed.blocos.length - 1;
  return i[ultimo] + duracaoBloco(ed.blocos[ultimo]);
}

const Entrada: React.FC<{ transicao: number; dur: number; children: React.ReactNode }> = ({ transicao, dur, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const entra = transicao > 0 ? interpolate(t, [0, transicao], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity: entra }}>{children}</AbsoluteFill>;
};

/** Trilha que abaixa sozinha enquanto o narrador fala (rampa de 0,35 s). */
const Trilha: React.FC<{ trilha: NonNullable<Edicao["trilha"]>; janelas: number[][] }> = ({ trilha, janelas }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const rampa = 0.35;
  const volume = (f: number) => {
    const t = f / fps;
    let fala = 0;
    for (const [a, b] of janelas) {
      const k = Math.min(1, Math.max(0, (t - (a - rampa)) / rampa), Math.max(0, ((b + rampa) - t) / rampa));
      fala = Math.max(fala, k);
    }
    const fim = Math.min(1, (durationInFrames - f) / (1.5 * fps));
    return (trilha.volume + (trilha.volumeFala - trilha.volume) * fala) * fim;
  };
  return <Audio src={staticFile(trilha.arquivo)} volume={volume} />;
};

export const Video: React.FC<{ edicao: Edicao; gravacoes: Record<string, Gravacao>; locucao: FalaLocucao[]; cenas?: Record<string, React.FC> }> = ({ edicao, gravacoes, locucao, cenas = {} }) => {
  const ini = inicios(edicao);
  const falas: Fala[] = [];
  for (const f of edicao.falas) {
    const l = locucao.find((x) => x.id === f.id);
    if (!l || f.legenda === false) continue;
    for (const leg of l.legendas) falas.push({ de: f.em + leg.de, ate: f.em + leg.ate + 0.15, texto: leg.texto });
  }
  // som de clique em cada clique de cada trecho de tela
  const sons: number[] = [];
  edicao.blocos.forEach((b, i) => {
    if (b.tipo !== "tela") return;
    const g = gravacoes[b.cena];
    for (const c of cliques(g)) if (c.t >= b.de && c.t < b.ate) sons.push(ini[i] + (c.t - b.de) / (b.velocidade ?? 1));
  });

  return (
    <AbsoluteFill style={{ background: "#00042d" }}>
      <Fundo />
      {edicao.blocos.map((b, i) => {
        // o fim arredondado de um bloco é o início arredondado do seguinte: junção contínua sem quadro vazio
        const de = Math.round(ini[i] * FPS);
        const dur = Math.round((ini[i] + duracaoBloco(b)) * FPS) - de;
        return (
          <Sequence key={i} from={de} durationInFrames={dur} layout="none">
            <Entrada transicao={transicaoAntes(edicao, i)} dur={dur / FPS}>
              {b.tipo === "abertura" && <Abertura />}
              {b.tipo === "encerramento" && <Encerramento frase={b.frase} />}
              {b.tipo === "cena" && cenas[b.nome] && React.createElement(cenas[b.nome])}
              {b.tipo === "tela" && (
                <Tela
                  gravacao={gravacoes[b.cena]}
                  video={`selloop/telas/${b.cena}/tela.mp4`}
                  url={b.url}
                  inicio={b.de}
                  velocidade={b.velocidade ?? 1}
                  planos={b.planos ?? planosDosCliques(cliques(gravacoes[b.cena]), { zoom: b.zoomCliques ?? 1.5 })}
                />
              )}
            </Entrada>
          </Sequence>
        );
      })}
      {edicao.sobreposicoes.map((s, i) =>
        s.tipo === "canal" ? (
          <BalaoCanal key={i} canal={s.canal} x={s.x} y={s.y} de={s.de} ate={s.ate} tamanho={s.tamanho} comNome={s.comNome} />
        ) : s.tipo === "folha" ? (
          <Folha key={i} src={staticFile(s.src)} x={s.x} y={s.y} de={s.de} ate={s.ate} largura={s.largura} rotacao={s.rotacao} rotulo={s.rotulo} />
        ) : (
          <Chip key={i} texto={s.texto} x={s.x} y={s.y} de={s.de} ate={s.ate} destaque={s.destaque} tamanho={s.tamanho} />
        ),
      )}
      <Legenda falas={falas} />
      {edicao.falas.map((f) => {
        const l = locucao.find((x) => x.id === f.id);
        if (!l) return null;
        return (
          <Sequence key={f.id} from={Math.round(f.em * FPS)} durationInFrames={Math.ceil((l.duracao + 0.5) * FPS)} layout="none">
            <Audio src={staticFile(`${edicao.pastaLocucao}/${l.arquivo}`)} volume={1} />
          </Sequence>
        );
      })}
      {edicao.trilha && <Trilha trilha={edicao.trilha} janelas={edicao.falas.map((f) => [f.em, f.em + (locucao.find((x) => x.id === f.id)?.duracao ?? 0)])} />}
      {sons.map((t, i) => (
        <Sequence key={`c${i}`} from={Math.round(t * FPS)} durationInFrames={Math.round(0.3 * FPS)} layout="none">
          <Audio src={staticFile("selloop/sons/clique.wav")} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
