import React from "react";
import { Boneco, LIA, type Pose } from "../Boneco";
import { Caixa, Cilindro, Seg } from "../Pecas";
import { elastico, mix, mixV, prog, type V3 } from "../anim";
import { Luz } from "../colher/Objetos";
import { Balao, Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { cabecaDe, emPe } from "../kit/poses";
import { PONTOS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0, 0.85, 2.7], alvo: [0, 0.62, -0.5], fov: 34 };
const ARARA = { y: 1.02, z: -0.75 };
const COR = LIA.cores.blusa;

/** Camiseta no cabide. `detalhes` mostra a etiqueta rígida e a costura em relevo. */
const Camiseta: React.FC<{ x: number; detalhes?: boolean; brilho?: number; f: number }> = ({ x, detalhes, brilho = 0, f }) => (
  <group position={[x, ARARA.y, ARARA.z]} rotation={[0, 0, 0.02 * Math.sin(f * 0.05 + x * 9)]}>
    <Seg a={[0, 0, 0]} b={[0, -0.08, 0]} r={0.008} cor="#8B8FA8" />
    <Seg a={[-0.15, -0.13, 0]} b={[0, -0.08, 0]} r={0.008} cor="#8B8FA8" />
    <Seg a={[0.15, -0.13, 0]} b={[0, -0.08, 0]} r={0.008} cor="#8B8FA8" />
    <Caixa t={[0.3, 0.36, 0.05]} raio={0.02} pos={[0, -0.32, 0]} cor={COR} />
    <Caixa t={[0.13, 0.11, 0.05]} raio={0.02} pos={[-0.19, -0.2, 0]} rot={[0, 0, -0.5]} cor={COR} />
    <Caixa t={[0.13, 0.11, 0.05]} raio={0.02} pos={[0.19, -0.2, 0]} rot={[0, 0, 0.5]} cor={COR} />
    <Cilindro r={0.055} h={0.012} pos={[0, -0.145, 0.022]} rot={[Math.PI / 2, 0, 0]} escala={[1, 1, 0.6]} cor="#E0A11E" sombra={false} />
    {detalhes && (
      <>
        {/* etiqueta rígida na gola */}
        <Caixa t={[0.05, 0.06, 0.006]} raio={0.002} pos={[0, -0.118, 0.012]} rot={[0.25, 0, 0]} cor="#FFFFFF" />
        {/* costuras em relevo nos ombros e na lateral */}
        <Seg a={[-0.15, -0.145, 0.027]} b={[-0.045, -0.142, 0.027]} r={0.007} cor="#C9871A" />
        <Seg a={[0.15, -0.145, 0.027]} b={[0.045, -0.142, 0.027]} r={0.007} cor="#C9871A" />
        <Seg a={[0.15, -0.2, 0.027]} b={[0.15, -0.49, 0.027]} r={0.006} cor="#C9871A" />
        {brilho > 0.01 && <Luz pos={[0, -0.11, 0.03]} r={0.02} cor="#FF5A4E" forca={brilho * (0.6 + 0.4 * Math.sin(f * 0.4))} />}
        {brilho > 0.01 && <Luz pos={[0.1, -0.143, 0.04]} r={0.014} cor="#FFD23F" forca={brilho * (0.6 + 0.4 * Math.sin(f * 0.4 + 2))} />}
        {brilho > 0.01 && <Luz pos={[-0.1, -0.143, 0.04]} r={0.014} cor="#FFD23F" forca={brilho * (0.6 + 0.4 * Math.sin(f * 0.4 + 2))} />}
      </>
    )}
  </group>
);

const Arara: React.FC<{ f: number; detalhes?: boolean; brilho?: number }> = ({ f, detalhes, brilho }) => (
  <>
    <Seg a={[-0.62, 0, ARARA.z]} b={[-0.62, ARARA.y, ARARA.z]} r={0.018} cor="#FFFFFF" />
    <Seg a={[0.62, 0, ARARA.z]} b={[0.62, ARARA.y, ARARA.z]} r={0.018} cor="#FFFFFF" />
    <Seg a={[-0.62, ARARA.y, ARARA.z]} b={[0.62, ARARA.y, ARARA.z]} r={0.018} cor="#FFFFFF" />
    <Camiseta x={-0.28} f={f} />
    <Camiseta x={0.28} f={f} detalhes={detalhes} brilho={brilho} />
  </>
);

/** Lia incomodada, puxando a gola na nuca. `costas` vira ela de costas para a câmera. */
const lia = (f: number, incomodo: number, costas = 0, aponta = 0): Pose => {
  const p = emPe(LIA, [0, 0, -0.2], Math.PI * costas, f);
  const cab = cabecaDe(LIA, p);
  const tras = costas > 0.5 ? 1 : -1;
  const nuca: V3 = [cab[0] - 0.05 * tras, cab[1] - 0.13, cab[2] + 0.09 * tras];
  const puxa = 0.012 * Math.sin(f * 0.45) * incomodo;
  return {
    ...p,
    maoD: mixV(p.maoD, [nuca[0], nuca[1] + puxa, nuca[2]], Math.max(incomodo, aponta)),
    tomba: 0.07 * Math.sin(f * 0.2) * incomodo,
    cabeca: [0.12 * incomodo, 0, -0.12 * incomodo],
    sobr: 0.8 * incomodo,
    sorriso: mix(0.6, -0.5, incomodo),
    olhos: mix(p.olhos, 0.4, incomodo * 0.6),
  };
};

/** Pontos em que a camiseta encosta no corpo (vistos de costas). */
const contato = (p: Pose): V3[][] => {
  const z = p.pos[2] + 0.11;
  const y = p.pos[1];
  const x = p.pos[0];
  return [[[x, y + 0.31, z]], [[x - 0.115, y + 0.26, z - 0.02], [x + 0.115, y + 0.26, z - 0.02]], [[x - 0.07, y + 0.03, z], [x + 0.07, y + 0.03, z]]];
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) return (
    <Palco cam={{ ...CAM, pos: mixV([0, 0.85, 2.2], CAM.pos, p(0)) }}>
      <Arara f={f} />
      <Boneco m={LIA} p={lia(f, prog(p(0), 0.05, 0.25))} />
    </Palco>
  );
  if (em(1) || em(2)) {
    const zoom = em(2) ? prog(p(2), 0, 0.3) : 0;
    const cam: Cam = { pos: mixV([0, 0.95, 2.3], [0.26, 0.95, 0.15], zoom), alvo: mixV([0, 0.72, ARARA.z], [0.28, 0.82, ARARA.z], zoom), fov: 34 };
    return (
      <Palco cam={cam}>
        <Arara f={f} detalhes brilho={em(2) ? prog(p(2), 0.35, 0.5) : 0} />
      </Palco>
    );
  }
  if (em(3))
    return (
      <>
        <Palco cam={CAM}>
          <Arara f={f} detalhes />
          <Boneco m={LIA} p={lia(f, 1)} />
        </Palco>
        <Conceito f={f} de={F[3].de + 4} ate={F[4].de - 4} texto="sensibilidade tátil" />
      </>
    );
  if (em(4)) {
    // de costas: o mapa de onde a roupa encosta
    const x = p(4);
    const parte = x < 0.5 ? -1 : Math.min(2, Math.floor(prog(x, 0.5, 1, (v) => v) * 3));
    const pose = lia(f, 0.3, 1);
    const pts = contato(pose);
    return (
      <>
        <Palco cam={{ pos: [0, 0.85, 1.9], alvo: [0, 0.68, -0.2], fov: 34 }}>
          <Boneco m={LIA} p={pose} />
          {pts.map((grupo, i) =>
            grupo.map((pt, j) => <Luz key={`${i}${j}`} pos={pt} r={i === parte ? 0.03 : 0.018} cor={i === 0 ? "#FF5A4E" : "#FFD23F"} forca={prog(x, 0.2 + i * 0.08, 0.3 + i * 0.08) * (i === parte ? 1 : 0.55)} />),
          )}
        </Palco>
        <Etapas itens={PONTOS} aceso={parte} opacidade={prog(x, 0.4, 0.5)} />
      </>
    );
  }
  const x = em(5) ? p(5) : 1;
  return (
    <>
      <Palco cam={CAM}>
        <Arara f={f} detalhes />
        <Boneco m={LIA} p={{ ...lia(f, 0, 0, prog(x, 0.35, 0.55)), sorriso: 0.3 }} />
      </Palco>
      {em(5) && <Balao texto="Qual parte incomoda?" p={prog(x, 0.05, 0.2, elastico)} topo={240} />}
    </>
  );
};

export const { Componente: ExplicaMenteCamiseta, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
