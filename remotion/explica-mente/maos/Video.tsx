import React from "react";
import { Boneco, LIA, type Pose } from "../Boneco";
import { elastico, mix, mixV, prog, type V3 } from "../anim";
import { Balao, Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { emPe } from "../kit/poses";
import { Balcao, CAM_LIQ, CAM_SOM, CaixaDeSom, Liquidificador, Notas, Ruido } from "../liquidificador/Video";
import { FUNCOES, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

type Onde = "som" | "liq";
const LUGAR: Record<Onde, V3> = { som: [-0.16, 0, -0.74], liq: [0.08, 0, -0.72] };

/** Lia balançando as mãos. `humor` 1 = feliz, -1 = incomodada. */
const balancando = (f: number, onde: Onde, humor: number): Pose => {
  const p = emPe(LIA, LUGAR[onde], onde === "som" ? -0.2 : 0.2, f);
  const a = Math.sin(f * 1.25);
  const b = Math.sin(f * 1.25 + 1.4);
  const pulo = Math.max(0, humor) * 0.02 * Math.abs(Math.sin(f * 0.3));
  return {
    ...p,
    pos: [p.pos[0], p.pos[1] + pulo, p.pos[2]],
    maoE: [p.pos[0] + 0.15 + 0.03 * b, 0.7 + 0.06 * a + pulo, p.pos[2] + 0.16],
    maoD: [p.pos[0] - 0.15 - 0.03 * a, 0.7 + 0.06 * b + pulo, p.pos[2] + 0.16],
    cabeca: [humor < 0 ? 0.12 : -0.03, 0, 0.05 * Math.sin(f * 0.3)],
    sorriso: mix(-0.45, 1, (humor + 1) / 2),
    sobr: humor < 0 ? 0.7 : 0,
    olhos: humor < 0 ? 0.5 : p.olhos,
  };
};

const MAOS_SOM: Cam = { pos: [-0.16, 0.5, 0.42], alvo: [-0.16, 0.5, -0.58], fov: 36 };
const MAOS_LIQ: Cam = { pos: [0.08, 0.5, 0.44], alvo: [0.08, 0.5, -0.56], fov: 36 };
const misturar = (a: Cam, b: Cam, t: number): Cam => ({ pos: mixV(a.pos, b.pos, t), alvo: mixV(a.alvo, b.alvo, t), fov: mix(a.fov, b.fov, t) });

const Cena: React.FC<{ f: number; onde: Onde; cam: Cam; contexto: number }> = ({ f, onde, cam, contexto }) => (
  <Palco cam={cam}>
    <Balcao />
    <CaixaDeSom pulsa={onde === "som" ? contexto * Math.abs(Math.sin(f * 0.33)) : 0} />
    <Liquidificador ligado={onde === "liq" ? contexto : 0} f={f} />
    {onde === "som" && <Notas f={f} volume={contexto} />}
    {onde === "liq" && <Ruido f={f} forca={contexto} />}
    <Boneco m={LIA} p={balancando(f, onde, onde === "som" ? 1 : -1)} />
  </Palco>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) return <Cena f={f} onde="som" cam={misturar(MAOS_SOM, { ...CAM_SOM, pos: [-0.3, 0.8, 1.6] }, prog(p(0), 0.2, 0.9) * 0.55)} contexto={0} />;
  // só as mãos: primeiro uma cena, depois a outra
  if (em(1)) return <Cena f={f} onde={p(1) < 0.5 ? "som" : "liq"} cam={p(1) < 0.5 ? MAOS_SOM : MAOS_LIQ} contexto={0} />;
  if (em(2)) return <Cena f={f} onde="som" cam={misturar(MAOS_SOM, CAM_SOM, prog(p(2), 0.05, 0.4))} contexto={prog(p(2), 0.2, 0.4)} />;
  if (em(3)) return <Cena f={f} onde="liq" cam={misturar(MAOS_LIQ, CAM_LIQ, prog(p(3), 0.1, 0.5))} contexto={prog(p(3), 0.25, 0.5)} />;
  if (em(4))
    return (
      <>
        <Cena f={f} onde="som" cam={CAM_SOM} contexto={1} />
        <Conceito f={f} de={F[4].de + 4} ate={F[5].de - 4} texto="stimming" />
        <Etapas itens={FUNCOES} aceso={Math.min(2, Math.floor(prog(p(4), 0.4, 1, (v) => v) * 3))} topo={372} opacidade={prog(p(4), 0.34, 0.42)} />
      </>
    );
  const x = em(5) ? p(5) : 1;
  return (
    <>
      <Cena f={f} onde="som" cam={CAM_SOM} contexto={1} />
      {em(5) && <Balao texto="É a minha música preferida!" p={prog(x, 0.45, 0.6, elastico)} topo={250} tamanho={46} />}
    </>
  );
};

export const { Componente: ExplicaMenteMaos, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
