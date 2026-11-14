import React from "react";
import { AbsoluteFill } from "remotion";
import { Boneco, LIA } from "../Boneco";
import { Caixa } from "../Pecas";
import { k, limitar, mix, mixV, prog, soma, type V3 } from "../anim";
import { Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { olharPara } from "../kit/poses";
import { BOTAO_LIQ, Balcao, Braco, CAM_LIQ, LIQ, Liquidificador, Ruido, incomodada, pertoDoLiq } from "../liquidificador/Video";
import { LINHA, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const ARMARIO: V3 = [0.56, 1.2, -1.5];
const DENTRO: V3 = [0.56, 0.98, -1.5];
const FORA: V3 = [0.56, 1.0, -1.08];
const CAM: Cam = { ...CAM_LIQ, pos: [0.3, 0.95, 2.9], alvo: [0.3, 0.72, -0.9] };

const Armario: React.FC<{ abre: number }> = ({ abre }) => (
  <>
    <Caixa t={[0.56, 0.56, 0.36]} raio={0.02} pos={ARMARIO} cor="#FFFFFF" />
    <Caixa t={[0.48, 0.48, 0.02]} raio={0.005} pos={[ARMARIO[0], ARMARIO[1], ARMARIO[2] + 0.175]} cor="#5A4A6B" sombra={false} />
    <group position={[ARMARIO[0] - 0.27, ARMARIO[1], ARMARIO[2] + 0.19]} rotation={[0, -1.9 * abre, 0]}>
      <Caixa t={[0.54, 0.54, 0.03]} raio={0.012} pos={[0.27, 0, 0]} cor="#8E6BE8" />
      <Caixa t={[0.03, 0.12, 0.03]} raio={0.008} pos={[0.48, 0, 0.025]} cor="#FFC53D" />
    </group>
  </>
);

/**
 * A cena inteira num tempo só: 0–0,15 o armário abre; 0,15–0,5 o aparelho sai e desce pro balcão
 * (as mãos vão aos ouvidos no meio do caminho); 0,7–0,8 alguém aperta o botão; depois, ligado.
 */
const Cena: React.FC<{ f: number; t: number; cam?: Cam }> = ({ f, t, cam = CAM }) => {
  const abre = k(t, [[0, 0], [0.13, 1], [0.55, 1], [0.66, 0]]);
  const sai = prog(t, 0.15, 0.3);
  const desce = prog(t, 0.3, 0.5);
  const pos = mixV(mixV(DENTRO, FORA, sai), LIQ, desce);
  const ligado = prog(t, 0.79, 0.81);
  const tapa = prog(t, 0.27, 0.4);
  const base = pertoDoLiq(f);
  base.cabeca = mixV(base.cabeca, olharPara(LIA, base, soma(pos, [0, 0.2, 0]), 0.6), prog(t, 0.14, 0.22));
  const lia = incomodada(base, tapa);
  const noAparelho = soma(pos, [0.11, 0.2, 0.06]);
  const longe: V3 = [1.3, 1.0, -0.7];
  const mao = t < 0.55 ? mixV(longe, noAparelho, prog(t, 0.02, 0.15)) : t < 0.68 ? mixV(noAparelho, longe, prog(t, 0.55, 0.66)) : mixV(longe, soma(BOTAO_LIQ, [0.03, 0.01, 0.045]), k(t, [[0.68, 0], [0.78, 1], [0.86, 1], [0.95, 0]]));
  return (
    <Palco cam={cam}>
      <Balcao />
      <Armario abre={abre} />
      <Liquidificador ligado={ligado} f={f} pos={pos} />
      <Ruido f={f} forca={ligado} />
      <Boneco m={LIA} p={lia} />
      <Braco mao={mao} />
    </Palco>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // o aparelho ainda desligado, e os ouvidos já cobertos
  if (em(0) || em(1)) return <Cena f={f} t={mix(0.56, 0.7, em(0) ? p(0) * 0.5 : 0.5 + p(1) * 0.5)} cam={{ ...CAM, pos: mixV(CAM.pos, [0.3, 0.9, 2.5], em(0) ? p(0) : 1) }} />;
  if (em(2)) {
    const x = p(2);
    const volta = prog(x, 0, 0.18);
    return (
      <>
        <Cena f={f} t={x < 0.18 ? mix(0.6, 0, volta) : mix(0, 0.52, prog(x, 0.22, 0.95, (v) => v))} />
        <AbsoluteFill style={{ background: "#FFFFFF", opacity: 0.8 * limitar(1 - Math.abs(x - 0.09) / 0.09) }} />
      </>
    );
  }
  if (em(3))
    return (
      <>
        <Cena f={f} t={0.6} />
        <Conceito f={f} de={F[3].de + 4} ate={F[4].de - 4} texto="antecipação" />
      </>
    );
  if (em(4)) {
    const x = prog(p(4), 0.12, 1, (v) => v);
    const parte = Math.min(2, Math.floor(x * 3));
    const y = (x * 3) % 1;
    const t = parte === 0 ? mix(0, 0.27, y) : parte === 1 ? mix(0.27, 0.6, y) : mix(0.66, 0.9, y);
    return (
      <>
        <Cena f={f} t={x <= 0 ? 0 : t} />
        <Etapas itens={LINHA} aceso={p(4) < 0.12 ? -1 : parte} emColuna topo={228} opacidade={prog(p(4), 0, 0.08)} />
      </>
    );
  }
  // o que vem antes do gesto
  const x = em(5) ? p(5) : 1;
  return (
    <>
      <Cena f={f} t={em(5) ? mix(0.02, 0.45, x) : em(6) ? 0.6 : 0.6} />
      {(em(5) || em(6)) && <Etapas itens={LINHA} aceso={em(5) ? 0 : 1} emColuna topo={228} />}
    </>
  );
};

export const { Componente: ExplicaMenteAntecipacao, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
