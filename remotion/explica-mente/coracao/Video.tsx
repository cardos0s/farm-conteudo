import React from "react";
import { AbsoluteFill } from "remotion";
import { ADULTO, Boneco, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera } from "../Pecas";
import { elastico, mix, mixV, prog, type V3 } from "../anim";
import { Balao, Etapas, POPPINS, Roda, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { sentado } from "../kit/poses";
import { CICLO, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0.1, 1.05, 2.7], alvo: [0, 0.82, -0.8], fov: 34 };
const PEITO: V3 = [0.05, 0.86, -0.66];

const Sofa: React.FC = () => (
  <>
    <Caixa t={[1.5, 0.42, 0.62]} raio={0.06} pos={[0, 0.21, -0.9]} cor="#2EC4B6" />
    <Caixa t={[1.5, 0.56, 0.2]} raio={0.07} pos={[0, 0.66, -1.17]} cor="#27AFA3" />
    <Caixa t={[0.2, 0.6, 0.66]} raio={0.07} pos={[-0.78, 0.3, -0.9]} cor="#27AFA3" />
    <Caixa t={[0.2, 0.6, 0.66]} raio={0.07} pos={[0.78, 0.3, -0.9]} cor="#27AFA3" />
    <Caixa t={[0.34, 0.3, 0.12]} raio={0.05} pos={[0.45, 0.58, -1.02]} rot={[-0.2, 0, 0.15]} cor="#FFC53D" />
  </>
);

/** Coração batendo na frente do peito. `ritmo` 1 = calmo, 3 = disparado. */
const Coracao: React.FC<{ f: number; ritmo: number; fase: number }> = ({ ritmo, fase }) => {
  const bate = Math.pow(Math.max(0, Math.sin(fase)), 6);
  const s = (0.75 + 0.1 * ritmo) * (1 + 0.22 * bate);
  return (
    <group position={PEITO} scale={s}>
      <Esfera r={0.045} pos={[-0.034, 0.02, 0]} cor="#FF4D6D" emissivo="#FF4D6D" brilho={0.25 + 0.5 * bate} sombra={false} />
      <Esfera r={0.045} pos={[0.034, 0.02, 0]} cor="#FF4D6D" emissivo="#FF4D6D" brilho={0.25 + 0.5 * bate} sombra={false} />
      <Cilindro r={0.074} r2={0.004} h={0.095} pos={[0, -0.038, 0]} escala={[1, 1, 0.6]} cor="#FF4D6D" emissivo="#FF4D6D" brilho={0.25 + 0.5 * bate} sombra={false} />
    </group>
  );
};

/** `medo` 0..1 muda a postura e o rosto; `ritmo` acelera o coração. */
const Cena: React.FC<{ f: number; medo: number; ritmo: number; olha?: number; cam?: Cam }> = ({ f, medo, ritmo, olha = 0, cam = CAM }) => {
  const p = sentado(ADULTO, [0, 0, -0.86], 0, 0.42, f);
  const pose: Pose = {
    ...p,
    inclina: 0.06 + 0.16 * medo,
    maoD: mixV(p.maoD, [PEITO[0] - 0.02, PEITO[1] - 0.02, PEITO[2] - 0.05], Math.max(olha, medo)),
    cabeca: [0.35 * olha * (1 - medo) + 0.08 * medo, 0, 0.06 * medo * Math.sin(f * 0.2)],
    sobr: 0.9 * Math.max(medo, olha * 0.5),
    sorriso: mix(0.5, -0.6, Math.max(medo, olha * 0.6)),
    boca: 0.35 * medo * Math.abs(Math.sin(f * 0.25)),
  };
  // a fase acumula mais rápido quando o ritmo é alto
  const fase = f * 0.11 * ritmo;
  return (
    <Palco cam={cam}>
      <Sofa />
      <Boneco m={ADULTO} p={pose} />
      <Coracao f={f} ritmo={ritmo} fase={fase} />
    </Palco>
  );
};

const Medidor: React.FC<{ v: number; entra: number }> = ({ v, entra }) => (
  <div style={{ position: "absolute", right: 50, top: 440, width: 120, opacity: entra, transform: `translateX(${(1 - entra) * 80}px)` }}>
    <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 38, color: MARCA.tinta, textAlign: "center", marginBottom: 10 }}>medo</div>
    <div style={{ height: 560, borderRadius: 60, background: "#FFFFFF", boxShadow: "0 12px 30px rgba(36,26,74,0.2)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${v * 100}%`, background: MARCA.coral, borderRadius: 60 }} />
    </div>
  </div>
);

const desenhar = (q: Quadro) => {
  const { f, p, em } = q;
  if (em(0)) return <Cena f={f} medo={0.75} ritmo={2.6} cam={{ ...CAM, pos: mixV([0.1, 1.0, 2.2], CAM.pos, p(0)) }} />;
  if (em(1)) return <Cena f={f} medo={0} ritmo={mix(1, 2.1, prog(p(1), 0.1, 0.5))} olha={prog(p(1), 0.5, 0.75)} />;
  if (em(2))
    return (
      <>
        <Cena f={f} medo={0.3 * p(2)} ritmo={2.1} olha={1} />
        <Balao texto="Tem alguma coisa errada comigo?" p={prog(p(2), 0.2, 0.36, elastico)} topo={250} tamanho={46} />
      </>
    );
  if (em(3)) {
    const x = p(3);
    return (
      <>
        <Cena f={f} medo={mix(0.3, 1, prog(x, 0, 0.5))} ritmo={mix(2.1, 3.2, prog(x, 0.45, 0.9))} olha={1} />
        <Balao texto="Tem alguma coisa errada comigo?" p={1} topo={250} tamanho={46} />
        <Medidor v={mix(0.25, 0.95, prog(x, 0.05, 0.6))} entra={prog(x, 0, 0.1)} />
      </>
    );
  }
  if (em(4)) {
    const x = p(4);
    const visiveis = 1 + Math.floor(prog(x, 0.3, 0.75, (v) => v) * 3);
    return (
      <AbsoluteFill style={{ background: MARCA.creme, opacity: prog(x, 0, 0.06) }}>
        <Roda itens={CICLO} aceso={x < 0.8 ? Math.min(2, visiveis - 1) : Math.floor(f / 16) % 3} visiveis={visiveis} cores={["#FF4D6D", MARCA.roxo, MARCA.coral]} />
      </AbsoluteFill>
    );
  }
  if (em(5))
    return (
      <>
        <Cena f={f} medo={0} ritmo={1.9} olha={0.4} />
        <Balao texto="?" p={prog(p(5), 0.05, 0.2, elastico)} topo={300} tamanho={110} cor={MARCA.sol} />
      </>
    );
  const x = em(6) ? p(6) : 1;
  return (
    <>
      <Cena f={f} medo={em(6) ? prog(x, 0.6, 0.8) * 0.6 : 0.6} ritmo={2.1} olha={1} />
      {em(6) && <Etapas itens={["Percebeu o coração", "Sentiu medo"]} aceso={x < 0.45 ? -1 : x < 0.72 ? 0 : 1} emColuna topo={236} opacidade={prog(x, 0.3, 0.4)} />}
    </>
  );
};

export const { Componente: ExplicaMenteCoracao, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
