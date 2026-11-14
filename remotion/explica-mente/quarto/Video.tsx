import React from "react";
import { Boneco, LIA, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera, Seg } from "../Pecas";
import { elastico, mix, mixV, prog, type V3 } from "../anim";
import { Balao, Conceito, Etapas, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { buscarELevar, emPe } from "../kit/poses";
import { AMPLA, CONCRETA, DUVIDAS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const INICIO: V3 = [0.05, 0, -0.4];
const ROUPA: V3 = [-0.3, 0.02, 0.05];
const CESTO: V3 = [0.48, 0, -0.62];
const CAM: Cam = { pos: [0, 1.0, 3.7], alvo: [0.05, 0.6, -0.4], fov: 34 };
const CAMINHO = { inicio: INICIO, objeto: ROUPA, juntoDoObjeto: [-0.16, 0, -0.14] as V3, juntoDoDestino: [0.3, 0, -0.3] as V3, destino: [CESTO[0], 0.22, CESTO[2]] as V3 };

const Roupa: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <Esfera r={1} escala={[0.12, 0.035, 0.1]} cor="#FF5A8A" rug={0.95} />
    <Esfera r={1} escala={[0.05, 0.03, 0.045]} pos={[0.12, 0, 0.03]} cor="#FF5A8A" rug={0.95} />
    <Esfera r={1} escala={[0.05, 0.03, 0.045]} pos={[-0.12, 0, 0.02]} cor="#FF5A8A" rug={0.95} />
  </group>
);

const Quarto: React.FC<{ seta: number }> = ({ seta }) => (
  <>
    {/* cama */}
    <Caixa t={[0.95, 0.26, 0.6]} raio={0.05} pos={[-0.42, 0.13, -1.32]} cor="#8E6BE8" />
    <Caixa t={[0.3, 0.1, 0.4]} raio={0.04} pos={[-0.72, 0.3, -1.32]} cor="#FFFFFF" />
    {/* cesto */}
    <Cilindro r={0.2} r2={0.15} h={0.3} pos={[CESTO[0], 0.15, CESTO[2]]} cor="#2EC4B6" />
    <Cilindro r={0.21} h={0.03} pos={[CESTO[0], 0.3, CESTO[2]]} cor="#55D3C7" />
    <Cilindro r={0.185} h={0.01} pos={[CESTO[0], 0.3, CESTO[2]]} cor="#1E8F85" sombra={false} />
    {/* bagunça */}
    <Caixa t={[0.11, 0.11, 0.11]} raio={0.02} pos={[0.24, 0.055, 0.32]} rot={[0, 0.5, 0]} cor="#FFC53D" />
    <Caixa t={[0.1, 0.1, 0.1]} raio={0.02} pos={[0.38, 0.05, 0.2]} rot={[0, 0.2, 0]} cor="#FF5A4E" />
    <Caixa t={[0.1, 0.1, 0.1]} raio={0.02} pos={[0.27, 0.05, 0.14]} rot={[0, 1.1, 0]} cor="#3D9BE9" />
    <Esfera r={0.1} pos={[-0.52, 0.1, -0.55]} cor="#FF9F43" />
    <Caixa t={[0.2, 0.035, 0.26]} raio={0.008} pos={[0.02, 0.018, -0.85]} rot={[0, 0.4, 0]} cor="#3FAE6A" />
    <Caixa t={[0.18, 0.035, 0.24]} raio={0.008} pos={[-0.62, 0.018, 0.25]} rot={[0, -0.6, 0]} cor="#6C4BD8" />
    {/* seta da roupa até o cesto */}
    {seta > 0.02 &&
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const t = i / 7;
        if (t > seta) return null;
        const pos = mixV([ROUPA[0], 0, ROUPA[2]], [CESTO[0], 0, CESTO[2]], 0.12 + t * 0.7);
        return <Esfera key={i} r={i === 7 ? 0.05 : 0.026} pos={[pos[0], 0.2 + 0.32 * Math.sin(Math.PI * t), pos[2]]} cor="#6C4BD8" emissivo="#6C4BD8" brilho={0.4} sombra={false} />;
      })}
  </>
);

const Cena: React.FC<{ lia: Pose; roupa: V3; seta?: number; cam?: Cam }> = ({ lia, roupa, seta = 0, cam = CAM }) => (
  <Palco cam={cam}>
    <Quarto seta={seta} />
    <Roupa pos={roupa} />
    <Boneco m={LIA} p={lia} />
  </Palco>
);

const travada = (f: number): Pose => {
  const p = emPe(LIA, INICIO, 0, f);
  return { ...p, cabeca: [0.05, 0.65 * Math.sin(f * 0.06), 0], sobr: 0.7, sorriso: -0.2, maoE: [p.pos[0] + 0.15, p.pos[1] + 0.14, p.pos[2] + 0.12], maoD: [p.pos[0] - 0.15, p.pos[1] + 0.14, p.pos[2] + 0.12] };
};

const POSICOES = [
  [70, 430],
  [560, 400],
  [120, 640],
  [600, 610],
  [330, 800],
];
const Nuvem: React.FC<{ quantas: number; opacidade?: number; f: number }> = ({ quantas, opacidade = 1, f }) => (
  <>
    {DUVIDAS.map((t, i) => {
      const p = prog(quantas, i, i + 0.6, elastico);
      return (
        <div key={i} style={{ position: "absolute", left: POSICOES[i][0], top: POSICOES[i][1] + 8 * Math.sin(f * 0.08 + i), transform: `scale(${Math.max(0.001, p)}) rotate(${(i % 2 ? 3 : -3)}deg)`, opacity: opacidade, background: "#FFFFFF", borderRadius: 40, padding: "20px 34px 16px", fontFamily: POPPINS, fontWeight: 700, fontSize: 40, color: MARCA.tinta, boxShadow: "0 10px 26px rgba(36,26,74,0.2)" }}>
          {t}
        </div>
      );
    })}
  </>
);

const NO_CESTO: V3 = [CESTO[0], 0.3, CESTO[2]];

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) {
    const x = p(0);
    return (
      <>
        <Cena lia={travada(f)} roupa={ROUPA} seta={prog(x, 0.6, 0.9)} />
        <Balao texto={AMPLA} p={prog(x, 0.02, 0.12, elastico) * (1 - prog(x, 0.5, 0.56))} topo={236} />
        <Balao texto={CONCRETA} p={prog(x, 0.56, 0.68, elastico)} topo={236} cor={MARCA.roxo} corTexto="#FFFFFF" />
      </>
    );
  }
  if (em(1) || em(2) || em(3)) {
    const quantas = em(1) ? 0 : em(2) ? p(2) * 5.4 : 6;
    return (
      <>
        <Cena lia={travada(f)} roupa={ROUPA} cam={{ ...CAM, pos: mixV(CAM.pos, [0, 1.0, 3.3], em(1) ? p(1) : 1) }} />
        <Balao texto={AMPLA} p={1} topo={236} />
        <Nuvem quantas={quantas} f={f} opacidade={em(3) ? 0.35 : 1} />
        {em(3) && <Conceito f={f} de={F[3].de + 4} ate={F[4].de - 4} texto="planejamento" topo={470} />}
        {em(3) && <Etapas itens={["Escolher", "Organizar", "Ordenar"]} aceso={Math.min(2, Math.floor(prog(p(3), 0.42, 0.95, (v) => v) * 3))} topo={640} opacidade={prog(p(3), 0.36, 0.44)} emColuna />}
      </>
    );
  }
  if (em(4)) {
    const x = p(4);
    return (
      <>
        <Cena lia={{ ...emPe(LIA, INICIO, 0, f), cabeca: [0.2, 0.5, 0] }} roupa={ROUPA} seta={prog(x, 0.45, 0.95)} />
        <Balao texto={AMPLA} p={1 - prog(x, 0.2, 0.3)} topo={236} />
        <Nuvem quantas={6} f={f} opacidade={0.35 * (1 - prog(x, 0.1, 0.25))} />
        <Balao texto={CONCRETA} p={prog(x, 0.3, 0.45, elastico)} topo={236} cor={MARCA.roxo} corTexto="#FFFFFF" />
      </>
    );
  }
  if (em(5)) {
    const g = buscarELevar(LIA, f, prog(p(5), 0, 1, (v) => v), CAMINHO);
    return (
      <>
        <Cena lia={g.pose} roupa={g.objeto} seta={1 - prog(p(5), 0.5, 0.7)} />
        <Balao texto={CONCRETA} p={1} topo={236} cor={MARCA.roxo} corTexto="#FFFFFF" />
      </>
    );
  }
  // comparar as duas instruções
  const x = em(6) ? p(6) : 1;
  const lia = emPe(LIA, CAMINHO.juntoDoDestino, 0, f);
  const festa = prog(x, 0.05, 0.2, elastico) * (1 - prog(x, 0.5, 0.7));
  lia.maoE = mixV(lia.maoE, [lia.pos[0] + 0.26, 1.0, lia.pos[2] + 0.05], festa);
  lia.maoD = mixV(lia.maoD, [lia.pos[0] - 0.26, 1.0, lia.pos[2] + 0.05], festa);
  lia.sorriso = 1;
  return (
    <>
      <Cena lia={lia} roupa={NO_CESTO} />
      <div style={{ opacity: em(7) ? 1 - prog(p(7), 0, 0.1) : 1 }}>
        <Balao texto={AMPLA} p={mix(0.8, 0.8, x) * prog(x, 0, 0.1)} topo={236} cor="#EDE6F7" corTexto="#8B8FA8" />
        <Balao texto={`${CONCRETA}  ✓`} p={prog(x, 0.1, 0.25, elastico)} topo={380} cor="#2FB36B" corTexto="#FFFFFF" />
      </div>
    </>
  );
};

export const { Componente: ExplicaMenteQuarto, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });


