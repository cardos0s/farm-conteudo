import React from "react";
import { AbsoluteFill } from "remotion";
import "../../lousa/fontes";
import { enquadrar, Lousa, vistaEm, type Enquadre, type Pagina } from "../../lousa/Lousa";
import { FUNDO_LOUSA } from "../../lousa/paleta";
import { useT } from "../../lousa/tempo";
import { CenaAbertura, CenaFim, CenaMapa, CenaPostar } from "./cenas/Comeco";
import { CenaCurtida, CenaFeed } from "./cenas/Feed";
import { CenaReels, CenaStories } from "./cenas/StoriesReels";
import { ALVO, R, T, TELA, TUDO } from "./roteiro";

const v = (r: Pagina) => enquadrar(r, ALVO);

/** Que parte do canvas aparece ao longo do vídeo. */
export const quadros: Enquadre[] = [
  { t: T.abertura, vista: v(R.abertura) },
  { t: T.mapa, vista: v(R.mapa) },
  { t: T.postar, vista: v(R.postar) },
  { t: T.feed, vista: v(R.feed) },
  { t: T.curtida, vista: v(R.curtida) },
  { t: T.stories, vista: v(R.stories) },
  { t: T.reels, vista: v(R.reels) },
  // visão geral: todas as partes de uma vez
  { t: T.geral, vista: enquadrar(TUDO, { x: 40, y: 60, w: 1000, h: 1800 }), dur: 1.6 },
  { t: T.fim, vista: v(R.fim), dur: 1.3 },
];

export function ReelSystemDesign() {
  const t = useT();
  const vista = vistaEm(t, quadros, TELA);
  return (
    <AbsoluteFill style={{ background: FUNDO_LOUSA }}>
      <Lousa vista={vista} tela={TELA}>
        <CenaAbertura />
        <CenaMapa />
        <CenaPostar />
        <CenaFeed />
        <CenaCurtida />
        <CenaStories />
        <CenaReels />
        <CenaFim />
      </Lousa>
    </AbsoluteFill>
  );
}
