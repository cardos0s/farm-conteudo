import React from "react";
import { AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { cliques, type Gravacao } from "../gravacao";
import { FPS } from "../marca";
import { cameraEm, prender, saidaForte, transformar, type Alvo, type Enquadre } from "../reel/base";
import { EncerramentoReel } from "../reel/Encerramento";
import { FundoReel } from "../reel/Fundo";
import type { NomeIcone } from "../reel/Icones";
import { Moldura, Seta } from "../reel/Palco";
import { Recorte } from "../reel/Recorte";
import { Camada, Dissolve, ganhoDaFala, type SobreReel } from "../reel/Reel";
import { LegendaReel, Marca, paginasDaFala, Titulo } from "../reel/Texto";
import { Trilha, type Edicao, type FalaLocucao } from "../Video";
import { ALTURA_DO_CAMINHO, Caminho, type TrilhaDeCliques } from "./Caminho";
import { cursorEm, naSaida, noFilme, type FalaNoVideo, type Parte, type Tomada } from "./roteiro";

// Montagem vertical "em tomada contínua": o mesmo desenho dos Reels (janela no meio, título, legenda,
// elementos que saltam), sobre filmagens quadro a quadro. A tela toca sempre em 1x; a câmera e o
// cursor são calculados no tempo do vídeo, então não há emenda nem mudança de velocidade no meio de
// um movimento.

export type EdicaoFluida = {
  partes: Parte[];
  falas: FalaNoVideo[];
  duracao: number;
  sobre: SobreReel[];
  caminhos: TrilhaDeCliques[];
  /** Alvos da câmera de cada tomada (pela posição dela em `partes`), no tempo do vídeo. */
  alvos: Record<number, Alvo[]>;
  /** Endereço mostrado na barra da janela (fixo, ou conforme o instante do vídeo, quando a tela navega). */
  url: string | ((o: number) => string);
  /** Pasta das filmagens em public/ (cada cena em <pasta>/<cena>/tela.mp4). */
  pastaFilme: string;
  pastaLocucao: string;
  assunto: string;
  icone: NomeIcone;
  trilha?: Edicao["trilha"];
  sons?: { em: number; arquivo: string; volume?: number }[];
};

/** A câmera de uma tomada no instante `o` do vídeo: desliza entre os alvos, sempre na mesma cadência. */
export const cameraDaTomada = (alvos: Alvo[], o: number): Enquadre => cameraEm(alvos, o, { janela: 1.3, avanco: 0.35 });

type CliqueNoVideo = { o: number; x: number; y: number };
const cacheCliques = new WeakMap<Tomada, CliqueNoVideo[]>();
/** Os cliques que uma tomada mostra, no tempo do vídeo. */
export function cliquesDaTomada(t: Tomada, g: Gravacao): CliqueNoVideo[] {
  let cs = cacheCliques.get(t);
  if (!cs) {
    const andam = t.pedacos.filter((p) => p.m1 > p.m0);
    const mIni = andam[0]?.m0 ?? 0;
    const mFim = andam[andam.length - 1]?.m1 ?? 0;
    cs = cliques(g)
      .filter((c) => c.t >= mIni && c.t < mFim)
      .map((c) => ({ o: naSaida(t, c.t), x: c.x, y: c.y }));
    cacheCliques.set(t, cs);
  }
  return cs;
}

/** O que uma tomada mostra dentro da janela: o quadro do filme, a câmera, as ondas de clique e o cursor. */
const TelaFluida: React.FC<{
  tomada: Tomada;
  filme: Gravacao;
  video: string;
  alvos: Alvo[];
  /** Quanto leva para sair depois do fim (a entrada da tela seguinte). */
  saida: number;
  /** Quanto desliza ao entrar e ao sair (px): 0 quando é a janela inteira que entra ou sai. */
  deslizeEntra: number;
  deslizeSai: number;
}> = ({ tomada, filme, video, alvos, saida, deslizeEntra, deslizeSai }) => {
  const frame = useCurrentFrame();
  const o = frame / FPS;
  if (o < tomada.inicio - 1e-6 || o > tomada.fim + saida) return null;
  const dentro = prender(o, tomada.inicio, tomada.fim);
  const quadro = Math.round(noFilme(tomada, dentro) * filme.fps);
  const tela = { w: filme.largura, h: filme.altura };
  /** px do vídeo por px CSS da tela filmada. */
  const K = filme.escala;
  const { z, tx, ty } = transformar(cameraDaTomada(alvos, o), tela);
  const cursor = cursorEm(tomada, filme, dentro);
  const cs = cliquesDaTomada(tomada, filme);
  const apertado = cs.some((c) => o >= c.o && o < c.o + 0.14);
  const ondas = cs.filter((c) => o >= c.o && o < c.o + 0.5);
  const e = tomada.entrada > 0 && deslizeEntra > 0 ? saidaForte((o - tomada.inicio) / tomada.entrada) : 1;
  const s = saida > 0 ? prender((o - tomada.fim) / saida) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(e, deslizeSai > 0 ? 1 - s : 1), transform: `translateX(${(1 - e) * deslizeEntra - s * deslizeSai}px)` }}>
      {/* a câmera é uma transformação sobre o vídeo no tamanho original: desliza e aproxima em
          frações de pixel, sem os degraus de 1 px de uma posição ou de um tamanho arredondados */}
      <div style={{ position: "absolute", left: 0, top: 0, width: tela.w * K, height: tela.h * K, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z / K})` }}>
        {/* o quadro exato do filme: nada de velocidade, o vídeo só mostra o quadro pedido */}
        <Freeze frame={quadro}>
          <OffthreadVideo src={staticFile(video)} muted style={{ position: "absolute", left: 0, top: 0, width: tela.w * K, height: tela.h * K }} />
        </Freeze>
      </div>
      {ondas.map((c, i) => {
        const k = (o - c.o) / 0.5;
        const r = 34 + 62 * k;
        return (
          <div
            key={i}
            style={{ position: "absolute", left: 0, top: 0, transform: `translate(${tx + c.x * z - r}px, ${ty + c.y * z - r}px)`, width: r * 2, height: r * 2, borderRadius: "50%", background: "rgba(40, 73, 219, 0.2)", border: "4px solid rgba(40, 73, 219, 0.8)", opacity: 1 - k }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${tx + cursor.x * z - 5}px, ${ty + cursor.y * z - 5}px)` }}>
        <Seta escala={apertado ? 1.5 : 1.75} />
      </div>
    </div>
  );
};

export const Fluido: React.FC<{
  edicao: EdicaoFluida;
  filmes: Record<string, Gravacao>;
  locucao: (FalaLocucao & { nivel?: number })[];
  /** Cenas desenhadas pelo próprio vídeo (partes do tipo "cena"), pelo nome. */
  cenas?: Record<string, React.FC>;
}> = ({ edicao, filmes, locucao, cenas = {} }) => {
  const frame = useCurrentFrame();
  const o = frame / FPS;
  const { partes } = edicao;
  const ehTela = (p: Parte | undefined): p is Tomada => p?.tipo === "tela";

  // ── a janela entra com a primeira tomada e sai quando vem uma cena própria ou o encerramento ──
  let presenca = 0;
  partes.forEach((p, i) => {
    if (!ehTela(p)) return;
    const ant = partes[i - 1];
    const prox = partes[i + 1];
    const sai = prox && !ehTela(prox) ? prox.entrada : 0;
    if (o < p.inicio || o > p.fim + sai) return;
    const e = ehTela(ant) ? 1 : prender((o - p.inicio) / Math.max(p.entrada, 0.45));
    const s = sai > 0 ? 1 - prender((o - p.fim) / sai) : 1;
    presenca = Math.max(presenca, Math.min(saidaForte(e), s));
  });

  // ── quanto apagar a janela: enquanto um recorte (ou uma camada que peça) está na frente ──
  let escuro = 0;
  for (const s of edicao.sobre) {
    if (s.tipo === "titulo" || s.escurece === false || (s.tipo === "camada" && !s.escurece)) continue;
    escuro = Math.max(escuro, Math.min(prender((o - s.de) / 0.25), prender((s.ate - o) / 0.25)));
  }

  const noFim = partes.some((p) => p.tipo === "encerramento" && o >= p.inicio + p.entrada * 0.5);

  // ── títulos: um sai antes de o próximo entrar; com o caminho embaixo, o título sobe ──
  const titulos = edicao.sobre
    .filter((s): s is Extract<SobreReel, { tipo: "titulo" }> => s.tipo === "titulo")
    .sort((x, y) => x.de - y.de)
    .map((s, k, lista) => (k + 1 < lista.length ? { ...s, ate: Math.min(s.ate, lista[k + 1].de - 0.03) } : s))
    .map((s) => ({ ...s, comCaminho: edicao.caminhos.some((c) => c.de < s.ate - 0.3 && c.ate > s.de + 0.3) }));

  // ── legenda ──
  const paginas = edicao.falas.flatMap((f, k) => {
    const l = locucao.find((x) => x.id === f.id);
    if (!l || f.legenda === false || !l.palavras) return [];
    const pgs = paginasDaFala(l.palavras, f.em, l.duracao);
    const proxima = edicao.falas[k + 1]?.em;
    if (proxima !== undefined && pgs.length) pgs[pgs.length - 1].ate = Math.min(pgs[pgs.length - 1].ate, proxima - 0.05);
    return pgs;
  });

  // ── sons: clique, troca de tela e salto dos recortes ──
  const sonsClique: number[] = [];
  const sonsTroca: number[] = [];
  partes.forEach((p, i) => {
    if (i > 0 && p.entrada > 0) sonsTroca.push(p.inicio);
    if (!ehTela(p)) return;
    for (const c of cliquesDaTomada(p, filmes[p.cena])) if (!sonsClique.length || c.o - sonsClique[sonsClique.length - 1] > 0.14) sonsClique.push(c.o);
  });
  const sonsSalto = edicao.sobre.filter((s) => s.tipo === "recorte" && s.som !== false).map((s) => s.de);
  const seq = (de: number, ate: number) => ({ from: Math.round(de * FPS), durationInFrames: Math.max(1, Math.round(ate * FPS) - Math.round(de * FPS)) });

  return (
    <AbsoluteFill style={{ background: "#00042d" }}>
      <FundoReel />

      {/* cenas próprias (ex.: o celular) ficam atrás da janela; elas trazem o próprio fundo */}
      {partes.map((p, i) => {
        if (p.tipo !== "cena" || !cenas[p.nome]) return null;
        const prox = partes[i + 1];
        return (
          <Sequence key={`c${i}`} {...seq(p.inicio, p.fim + (prox?.entrada ?? 0))} layout="none">
            <Dissolve dur={p.fim - p.inicio + (prox?.entrada ?? 0)} entra={p.entrada} sai={prox?.entrada ?? 0}>
              {React.createElement(cenas[p.nome])}
            </Dissolve>
          </Sequence>
        );
      })}

      {!noFim && <Marca assunto={edicao.assunto} icone={edicao.icone} />}

      <Moldura url={typeof edicao.url === "function" ? edicao.url(o) : edicao.url} presenca={presenca} escuro={escuro}>
        {partes.map((p, i) => {
          if (!ehTela(p)) return null;
          const ant = partes[i - 1];
          const prox = partes[i + 1];
          return (
            <TelaFluida
              key={`t${i}`}
              tomada={p}
              filme={filmes[p.cena]}
              video={`${edicao.pastaFilme}/${p.cena}/tela.mp4`}
              alvos={edicao.alvos[i] ?? []}
              saida={prox ? prox.entrada : 0}
              deslizeEntra={ehTela(ant) ? 120 : 0}
              deslizeSai={ehTela(prox) ? 120 : 0}
            />
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
        <Titulo key={`h${i}`} texto={s.texto} de={s.de} ate={s.ate} sobe={s.comCaminho ? ALTURA_DO_CAMINHO : 0} corpoMax={s.comCaminho ? 60 : undefined} />
      ))}
      {edicao.caminhos.map((c, i) => (
        <Caminho key={`k${i}`} trilha={c} />
      ))}
      <LegendaReel paginas={paginas} />

      {partes.map((p, i) =>
        p.tipo === "encerramento" ? (
          <Sequence key={`e${i}`} {...seq(p.inicio, p.fim)} layout="none">
            <Dissolve dur={p.fim - p.inicio} entra={p.entrada} sai={0}>
              <EncerramentoReel frase={p.frase} />
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
      {sonsTroca.map((em, i) => (
        <Sequence key={`st${i}`} from={Math.max(0, Math.round((em - 0.05) * FPS))} durationInFrames={Math.round(0.7 * FPS)} layout="none">
          <Audio src={staticFile("selloop/sons/whoosh.wav")} volume={0.3} />
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
