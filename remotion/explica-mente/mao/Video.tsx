import React from "react";
import { Boneco, LIA, type Pose } from "../Boneco";
import { Banquinho } from "../Cenario";
import { Esfera } from "../Pecas";
import { girar, k, mix, mixV, prog, soma, type V3 } from "../anim";
import { Luz } from "../colher/Objetos";
import { Conceito, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { cabecaDe, emPe, olharPara } from "../kit/poses";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0.05, 0.9, 2.5], alvo: [0.08, 0.62, -0.4], fov: 34 };
const ONDE: V3 = [-0.12, 0, -0.4];
const BOLA: V3 = [0.4, 0.27 + 0.075, -0.3];

/** `ergue` 0..1 levanta o braço esquerdo; `fechados` fecha os olhos; `alcanca` leva a mão até a bola. */
const lia = (f: number, ergue: number, fechados: number, alcanca = 0, olhaMao = 0): Pose => {
  const p = emPe(LIA, ONDE, 0.12, f);
  const balanco = 0.03 * Math.sin(f * 0.09) * ergue;
  const alto: V3 = [p.pos[0] + 0.34 + balanco, 0.98 + balanco, p.pos[2] + 0.06];
  const mao = mixV(mixV(p.maoE, alto, ergue), soma(BOLA, [-0.03, 0.05, 0.04]), alcanca);
  const pose: Pose = { ...p, maoE: mao, olhos: mix(p.olhos, 0.08, fechados), sorriso: 0.7, inclina: 0.03 + 0.12 * alcanca, giroTorso: 0.25 * alcanca };
  pose.cabeca = mixV([0, 0, 0], olharPara(LIA, pose, mao), Math.max(alcanca, olhaMao));
  return pose;
};

/** Pontos do braço esquerdo (ombro, cotovelo aproximado e mão) para os sinais. */
const articulacoes = (p: Pose): V3[] => {
  const ombro = soma(p.pos, girar([LIA.ombro, LIA.alturaOmbro, 0], [p.inclina, p.yaw, 0]));
  const meio = mixV(ombro, p.maoE, 0.5);
  return [p.maoE, [meio[0], meio[1] - 0.05, meio[2] - 0.03], ombro];
};

const Cena: React.FC<{ f: number; p: Pose; fantasma?: boolean; sinais?: number; bola?: number; olhar?: number; cam?: Cam }> = ({ f, p, fantasma, sinais = 0, bola = 0, olhar = 0, cam = CAM }) => {
  const pts = articulacoes(p);
  const cab = cabecaDe(LIA, p);
  return (
    <Palco cam={cam}>
      <Banquinho pos={[BOLA[0], 0, BOLA[2]]} />
      {bola > 0.01 && <Esfera r={0.075 * bola} pos={BOLA} cor="#FF5A4E" />}
      <Boneco m={LIA} p={p} fantasma={fantasma ? "E" : undefined} />
      {sinais > 0.01 &&
        pts.map((pt, i) => {
          const t = ((f + i * 9) % 34) / 34;
          return (
            <group key={i}>
              <Luz pos={pt} r={0.014 + 0.004 * Math.sin(f * 0.5 + i)} cor="#FFD23F" forca={sinais} />
              <Luz pos={mixV(pt, cab, t)} r={0.009} cor="#FFD23F" forca={sinais * Math.min(1, t * 6, (1 - t) * 5)} />
            </group>
          );
        })}
      {olhar > 0.01 &&
        [1, 2, 3, 4, 5, 6].map((i) => <Luz key={i} pos={mixV(soma(cab, [0.02, 0.01, 0.14]), p.maoE, i / 7)} r={0.007} cor="#6FF2E2" forca={olhar * (i / 7 < olhar * 1.2 ? 1 : 0)} />)}
    </Palco>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) return <Cena f={f} p={lia(f, prog(p(0), 0.1, 0.5), prog(p(0), 0, 0.12))} fantasma={p(0) > 0.6 && Math.floor(f / 14) % 2 === 0} />;
  if (em(1)) {
    const x = p(1);
    return <Cena f={f} p={lia(f, k(x, [[0.2, 0.2], [0.45, 1]]), prog(x, 0, 0.12))} fantasma={x > 0.55} />;
  }
  if (em(2) || em(3)) {
    const sinais = em(3) ? prog(p(3), 0, 0.12) : 0;
    return (
      <>
        <Cena f={f} p={lia(f, 1, 1)} fantasma sinais={sinais} cam={{ ...CAM, pos: mixV(CAM.pos, [0.15, 0.95, 2.05], em(2) ? p(2) : 1), alvo: mixV(CAM.alvo, [0.1, 0.78, -0.4], em(2) ? p(2) : 1) }} />
        <Conceito f={f} de={F[2].de + 28} ate={F[4].de - 4} texto="propriocepção" />
      </>
    );
  }
  if (em(4)) {
    const x = p(4);
    return <Cena f={f} p={lia(f, 1 - prog(x, 0.5, 0.7), 1 - prog(x, 0.08, 0.16), prog(x, 0.6, 0.85))} bola={prog(x, 0.3, 0.42)} olhar={prog(x, 0.45, 0.6) * (1 - prog(x, 0.9, 1))} />;
  }
  if (em(5)) return <Cena f={f} p={lia(f, 0.5 + 0.5 * Math.sin(f * 0.12), 0)} bola={1} />;
  const x = em(6) ? p(6) : 1;
  return <Cena f={f} p={lia(f, 0, 0, prog(x, 0.15, 0.45), 1)} bola={1} olhar={prog(x, 0.1, 0.3)} />;
};

export const { Componente: ExplicaMenteMao, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
