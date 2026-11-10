import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cliques, type Gravacao } from "../gravacao";
import { FPS } from "../marca";
import { continua, duracaoBloco, inicios, transicaoAntes, Trilha, type Bloco, type Edicao, type FalaLocucao } from "../Video";
import { prender, saidaForte, type Alvo, type Ret } from "./base";
import type { PropsCamada } from "./Efeitos";
import { EncerramentoReel } from "./Encerramento";
import { FundoReel } from "./Fundo";
import type { NomeIcone } from "./Icones";
import { Moldura, TelaNoPalco } from "./Palco";
import { Recorte, type DestinoRecorte } from "./Recorte";
import { LegendaReel, Marca, paginasDaFala, Titulo } from "./Texto";

// Montagem dos vídeos verticais (Reels e Stories). Mesma linha do tempo da versão horizontal (blocos
// guiados pela locução), com outro desenho: uma janela fixa no meio, título em cima, legenda embaixo
// e, por cima de tudo, os elementos que saltam da tela.

export type SobreReel =
  | { tipo: "titulo"; de: number; ate: number; texto: string }
  | {
      tipo: "recorte";
      de: number;
      ate: number;
      /** Caminho da imagem em public/. */
      src: string;
      origem: Ret;
      destino: DestinoRecorte;
      proporcao: number;
      /** Só uma parte da imagem, em frações dela. */
      corte?: { x: number; y: number; w: number; h: number };
      raio?: number;
      rot?: number;
      moldura?: boolean;
      faiscas?: boolean;
      /** Apaga um pouco a janela enquanto o recorte está na frente (padrão: sim). */
      escurece?: boolean;
      som?: boolean;
    }
  | { tipo: "camada"; de: number; ate: number; el: React.FC<PropsCamada>; atras?: boolean; escurece?: boolean };

export type EdicaoReel = Omit<Edicao, "sobreposicoes"> & {
  sobre: SobreReel[];
  /** Alvos da câmera de cada gravação (pelo nome da cena). */
  alvos: Record<string, Alvo[]>;
  /** Assunto do vídeo, ao lado do logo. */
  assunto: string;
  icone: NomeIcone;
  /** Efeitos sonoros avulsos (arquivo em public/selloop/sons). */
  sons?: { em: number; arquivo: string; volume?: number }[];
};

const ehTela = (b: Bloco | undefined): b is Extract<Bloco, { tipo: "tela" }> => b?.tipo === "tela";

/** Conteúdo de um bloco de tela dentro da janela, com a troca de conteúdo no começo e no fim. */
const ConteudoTela: React.FC<{
  bloco: Extract<Bloco, { tipo: "tela" }>;
  gravacao: Gravacao;
  alvos: Alvo[];
  dur: number;
  entra: number;
  sai: number;
  /** Quanto o conteúdo desliza ao entrar e ao sair (px): 0 num corte dentro da mesma tela. */
  deslizeEntra: number;
  deslizeSai: number;
}> = ({ bloco, gravacao, alvos, dur, entra, sai, deslizeEntra, deslizeSai }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const e = entra > 0 ? saidaForte(t / entra) : 1;
  const s = sai > 0 ? prender((t - (dur - sai)) / sai) : 0;
  return (
    <TelaNoPalco
      gravacao={gravacao}
      video={`selloop/telas/${bloco.cena}/tela.mp4`}
      alvos={alvos}
      inicio={bloco.de}
      velocidade={bloco.velocidade ?? 1}
      presenca={Math.min(e, 1 - s)}
      desliza={(1 - e) * deslizeEntra - s * deslizeSai}
    />
  );
};

/** Aparece e some por inteiro (blocos de cena própria e o encerramento). */
export const Dissolve: React.FC<{ dur: number; entra: number; sai: number; children: React.ReactNode }> = ({ dur, entra, sai, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const e = entra > 0 ? prender(t / entra) : 1;
  const s = sai > 0 ? prender((t - (dur - sai)) / sai) : 0;
  return <AbsoluteFill style={{ opacity: Math.min(e, 1 - s) }}>{children}</AbsoluteFill>;
};

/** Uma camada no seu trecho, com o tempo contado desde que entrou. */
export const Camada: React.FC<{ dur: number; el: React.FC<PropsCamada> }> = ({ dur, el: El }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <El t={frame / fps} dur={dur} />;
};

export const ganhoDaFala = (l: FalaLocucao & { nivel?: number }) => (l.nivel === undefined ? 1 : prender(Math.pow(10, (-17.5 - l.nivel) / 20), 0.75, 1.35));

export const Reel: React.FC<{
  edicao: EdicaoReel;
  gravacoes: Record<string, Gravacao>;
  locucao: (FalaLocucao & { nivel?: number })[];
  /** Blocos desenhados pelo próprio vídeo (tipo "cena"), pelo nome. */
  cenas?: Record<string, React.FC>;
}> = ({ edicao, gravacoes, locucao, cenas = {} }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { blocos } = edicao;
  const ini = inicios(edicao);
  const fim = (i: number) => ini[i] + duracaoBloco(blocos[i]);
  const tr = (i: number) => (i < blocos.length ? transicaoAntes(edicao, i) : 0);

  // ── a janela entra quando começa um bloco de tela e sai quando vem uma cena própria ou o fim ──
  let presenca = 0;
  let url = "";
  blocos.forEach((b, i) => {
    if (!ehTela(b) || t < ini[i] || t > fim(i)) return;
    const e = ehTela(blocos[i - 1]) ? 1 : tr(i) > 0 ? prender((t - ini[i]) / Math.max(tr(i), 0.45)) : i === 0 ? prender(t / 0.5) : 1;
    const s = i + 1 < blocos.length && !ehTela(blocos[i + 1]) ? 1 - prender((t - (fim(i) - tr(i + 1))) / Math.max(tr(i + 1), 0.001)) : 1;
    presenca = Math.max(presenca, Math.min(saidaForte(e), s));
    url = b.url;
  });

  // ── quanto apagar a janela: enquanto um recorte (ou uma camada que peça) está na frente ──
  let escuro = 0;
  for (const s of edicao.sobre) {
    if (s.tipo === "titulo" || s.escurece === false || (s.tipo === "camada" && !s.escurece)) continue;
    escuro = Math.max(escuro, Math.min(prender((t - s.de) / 0.25), prender((s.ate - t) / 0.25)));
  }

  const noFim = blocos.some((b, i) => b.tipo === "encerramento" && t >= ini[i] + tr(i) * 0.5);

  // ── títulos: o de um momento sai antes de o próximo entrar (nunca dois escritos um sobre o outro) ──
  const titulos = edicao.sobre
    .filter((s): s is Extract<SobreReel, { tipo: "titulo" }> => s.tipo === "titulo")
    .sort((x, y) => x.de - y.de)
    .map((s, k, lista) => (k + 1 < lista.length ? { ...s, ate: Math.min(s.ate, lista[k + 1].de - 0.03) } : s));

  // ── legenda ──
  const paginas = edicao.falas.flatMap((f, k) => {
    const l = locucao.find((x) => x.id === f.id);
    if (!l || f.legenda === false || !l.palavras) return [];
    const pgs = paginasDaFala(l.palavras, f.em, l.duracao);
    const proxima = edicao.falas[k + 1]?.em;
    if (proxima !== undefined && pgs.length) pgs[pgs.length - 1].ate = Math.min(pgs[pgs.length - 1].ate, proxima - 0.05);
    return pgs;
  });

  // ── sons: clique (sem metralhar nos trechos acelerados), troca de cena e salto dos recortes ──
  const sonsClique: number[] = [];
  const sonsTroca: { em: number; volume: number }[] = [];
  blocos.forEach((b, i) => {
    if (i > 0 && tr(i) > 0) {
      const anterior = blocos[i - 1];
      const mesmaCena = ehTela(b) && ehTela(anterior) && b.cena === anterior.cena;
      if (!mesmaCena) sonsTroca.push({ em: ini[i], volume: 0.3 });
    }
    if (!ehTela(b)) return;
    for (const c of cliques(gravacoes[b.cena])) {
      if (c.t < b.de || c.t >= b.ate) continue;
      const em = ini[i] + (c.t - b.de) / (b.velocidade ?? 1);
      if (!sonsClique.length || em - sonsClique[sonsClique.length - 1] > 0.14) sonsClique.push(em);
    }
  });
  const sonsSalto = edicao.sobre.filter((s) => s.tipo === "recorte" && s.som !== false).map((s) => s.de);
  const seq = (de: number, ate: number) => ({ from: Math.round(de * FPS), durationInFrames: Math.max(1, Math.round(ate * FPS) - Math.round(de * FPS)) });

  return (
    <AbsoluteFill style={{ background: "#00042d" }}>
      <FundoReel />

      {/* cenas próprias (ex.: o celular) ficam atrás da janela; elas trazem o próprio fundo */}
      {blocos.map((b, i) =>
        b.tipo === "cena" && cenas[b.nome] ? (
          <Sequence key={`c${i}`} {...seq(ini[i], fim(i))} layout="none">
            <Dissolve dur={duracaoBloco(b)} entra={tr(i)} sai={i + 1 < blocos.length ? tr(i + 1) : 0}>
              {React.createElement(cenas[b.nome])}
            </Dissolve>
          </Sequence>
        ) : null,
      )}

      {!noFim && <Marca assunto={edicao.assunto} icone={edicao.icone} />}

      <Moldura url={url} presenca={presenca} escuro={escuro}>
        {blocos.map((b, i) => {
          if (!ehTela(b)) return null;
          const antes = blocos[i - 1];
          const depois = blocos[i + 1];
          const entra = ehTela(antes) && !continua(blocos, i) ? tr(i) : 0;
          const sai = ehTela(depois) && !continua(blocos, i + 1) ? tr(i + 1) : 0;
          // troca de tela: o conteúdo desliza; corte dentro da mesma tela: só dissolve
          const deslize = (outro: Bloco | undefined) => (ehTela(outro) && outro.cena !== b.cena ? 120 : 0);
          return (
            <Sequence key={`t${i}`} {...seq(ini[i], fim(i))} layout="none">
              <ConteudoTela bloco={b} gravacao={gravacoes[b.cena]} alvos={edicao.alvos[b.cena] ?? []} dur={duracaoBloco(b)} entra={entra} sai={sai} deslizeEntra={deslize(antes)} deslizeSai={deslize(depois)} />
            </Sequence>
          );
        })}
      </Moldura>

      {edicao.sobre.map((s, i) =>
        s.tipo === "camada" && s.atras ? (
          <Sequence key={`a${i}`} {...seq(s.de, s.ate)} layout="none">
            <Camada dur={s.ate - s.de} el={s.el} />
          </Sequence>
        ) : null,
      )}
      {edicao.sobre.map((s, i) =>
        s.tipo === "recorte" ? <Recorte key={`r${i}`} src={staticFile(s.src)} origem={s.origem} destino={s.destino} proporcao={s.proporcao} corte={s.corte} de={s.de} ate={s.ate} raio={s.raio} rot={s.rot} moldura={s.moldura} faiscas={s.faiscas} /> : null,
      )}
      {edicao.sobre.map((s, i) =>
        s.tipo === "camada" && !s.atras ? (
          <Sequence key={`f${i}`} {...seq(s.de, s.ate)} layout="none">
            <Camada dur={s.ate - s.de} el={s.el} />
          </Sequence>
        ) : null,
      )}
      {titulos.map((s, i) => (
        <Titulo key={`h${i}`} texto={s.texto} de={s.de} ate={s.ate} />
      ))}
      <LegendaReel paginas={paginas} />

      {blocos.map((b, i) =>
        b.tipo === "encerramento" ? (
          <Sequence key={`e${i}`} {...seq(ini[i], fim(i))} layout="none">
            <Dissolve dur={duracaoBloco(b)} entra={tr(i)} sai={0}>
              <EncerramentoReel frase={b.frase} />
            </Dissolve>
          </Sequence>
        ) : null,
      )}

      {/* ── áudio ── */}
      {edicao.falas.map((f) => {
        const l = locucao.find((x) => x.id === f.id);
        if (!l) return null;
        return (
          <Sequence key={f.id} from={Math.round(f.em * FPS)} durationInFrames={Math.ceil((l.duracao + 0.5) * FPS)} layout="none">
            <Audio src={staticFile(`${edicao.pastaLocucao}/${l.arquivo}`)} volume={ganhoDaFala(l)} />
          </Sequence>
        );
      })}
      {edicao.trilha && <Trilha trilha={edicao.trilha} janelas={edicao.falas.map((f) => [f.em, f.em + (locucao.find((x) => x.id === f.id)?.duracao ?? 0)])} />}
      {sonsClique.map((em, i) => (
        <Sequence key={`sc${i}`} from={Math.round(em * FPS)} durationInFrames={Math.round(0.3 * FPS)} layout="none">
          <Audio src={staticFile("selloop/sons/clique.wav")} volume={0.26} />
        </Sequence>
      ))}
      {sonsTroca.map((s, i) => (
        <Sequence key={`st${i}`} from={Math.max(0, Math.round((s.em - 0.05) * FPS))} durationInFrames={Math.round(0.7 * FPS)} layout="none">
          <Audio src={staticFile("selloop/sons/whoosh.wav")} volume={s.volume} />
        </Sequence>
      ))}
      {sonsSalto.map((em, i) => (
        <Sequence key={`ss${i}`} from={Math.round(em * FPS)} durationInFrames={Math.round(0.5 * FPS)} layout="none">
          <Audio src={staticFile("selloop/sons/salto.wav")} volume={0.5} />
        </Sequence>
      ))}
      {(edicao.sons ?? []).map((s, i) => (
        <Sequence key={`sx${i}`} from={Math.round(s.em * FPS)} durationInFrames={Math.round(1.6 * FPS)} layout="none">
          <Audio src={staticFile(`selloop/sons/${s.arquivo}`)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
