import React from "react";
import { Boneco, LIA, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa, Seg } from "../Pecas";
import { elastico, k, mix, mixV, prog, type V3 } from "../anim";
import { Mesa } from "../colher/Objetos";
import { Balao, Conceito, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { naMesa } from "../kit/poses";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0.03, 0.62, 1.95], alvo: [0, 0.07, -0.1], fov: 34 };
const CADERNO: V3 = [0, 0, 0.04];

/** Caderno na mesa. `abre` 0..1 vira a capa; `pagina` 0..1 folheia até a página certa. */
const Caderno: React.FC<{ abre: number; pagina: number; escrito: number }> = ({ abre, pagina, escrito }) => (
  <group position={CADERNO}>
    <Caixa t={[0.21, 0.014, 0.27]} raio={0.004} pos={[0, 0.007, 0]} cor="#FFFDF6" />
    {[0, 1, 2, 3, 4].map((i) => (
      <Caixa key={i} t={[0.15 * (i < escrito * 5 ? 1 : 0.001), 0.002, 0.008]} raio={0.0005} pos={[0, 0.0155, -0.08 + i * 0.04]} cor="#6C4BD8" sombra={false} />
    ))}
    {/* folha virando */}
    {pagina > 0.01 && pagina < 0.99 && (
      <group position={[-0.105, 0.016, 0]} rotation={[0, 0, Math.PI * (1 - ((pagina * 3) % 1))]}>
        <Caixa t={[0.21, 0.003, 0.27]} raio={0.001} pos={[0.105, 0, 0]} cor="#FFFFFF" />
      </group>
    )}
    {/* capa */}
    <group position={[-0.105, 0.016, 0]} rotation={[0, 0, Math.PI * 0.98 * abre]}>
      <Caixa t={[0.21, 0.008, 0.27]} raio={0.003} pos={[0.105, 0.004, 0]} cor="#6C4BD8" />
      <Caixa t={[0.1, 0.01, 0.05]} raio={0.003} pos={[0.105, 0.005, -0.05]} cor="#FFFFFF" sombra={false} />
    </group>
  </group>
);

type Est = { abre: number; pagina: number; escreve: number; travada: number };

const lia = (f: number, e: Est): Pose => {
  const p = naMesa(f);
  const hesita = 0.01 * Math.sin(f * 0.25) * e.travada;
  // a mão direita paira sobre o caderno fechado, abre a capa ou escreve
  const sobre: V3 = [-0.04 + hesita, 0.1, 0.0];
  const abrindo: V3 = [mix(0.06, -0.14, e.abre), 0.06 + 0.1 * Math.sin(Math.PI * e.abre), 0.04];
  const escrevendo: V3 = [-0.02 + 0.05 * Math.sin(f * 0.5), 0.045, -0.03 + 0.1 * ((f * 0.01) % 1)];
  let mao = mixV(p.maoD, sobre, e.travada);
  if (e.abre > 0 && e.abre < 1) mao = abrindo;
  if (e.escreve > 0) mao = mixV(p.maoD, escrevendo, e.escreve);
  return {
    ...p,
    maoD: mao,
    cabeca: [0.3, 0.25 * Math.sin(f * 0.05) * e.travada, 0],
    sobr: 0.7 * e.travada,
    sorriso: mix(0.7, -0.25, e.travada),
  };
};

const Cena: React.FC<{ f: number; e: Est; cam?: Cam }> = ({ f, e, cam = CAM }) => {
  const p = lia(f, e);
  return (
    <Palco cam={cam} sala={[0, -0.62, 0.15]}>
      <Mesa />
      <Caderno abre={e.abre} pagina={e.pagina} escrito={e.escreve} />
      <Boneco m={LIA} p={p} />
      {e.escreve > 0.1 && <Seg a={[p.maoD[0] + 0.01, p.maoD[1] - 0.03, p.maoD[2] + 0.02]} b={[p.maoD[0] - 0.03, p.maoD[1] + 0.09, p.maoD[2] - 0.02]} r={0.007} cor="#FFC53D" />}
    </Palco>
  );
};

const TRAVADA: Est = { abre: 0, pagina: 0, escreve: 0, travada: 1 };

/** Balão de pensamento com a conta resolvida. */
const Conta: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "absolute", top: 236, left: 60, transform: `scale(${Math.max(0.001, p)})`, transformOrigin: "30% 100%", background: "#FFFFFF", borderRadius: 50, padding: "26px 44px 20px", boxShadow: "0 14px 36px rgba(36,26,74,0.22)", fontFamily: POPPINS, fontWeight: 800, fontSize: 84, color: MARCA.tinta, display: "flex", alignItems: "center", gap: 22 }}>
    7 + 5 = 12
    <span style={{ width: 76, height: 76, borderRadius: "50%", background: "#2FB36B", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="46" height="46" viewBox="0 0 50 50">
        <path d="M10 26 L21 37 L40 14" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </div>
);

/** O primeiro passo como um botão grande; o resto só aparece depois. */
const Botao: React.FC<{ n: number; texto: string; p: number; apertado: number; topo: number }> = ({ n, texto, p, apertado, topo }) => (
  <div style={{ position: "absolute", top: topo, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ transform: `scale(${Math.max(0.001, p) * (1 - 0.06 * apertado)})`, background: apertado > 0.5 ? "#2FB36B" : MARCA.roxo, color: "#FFFFFF", borderRadius: 50, padding: "26px 54px 22px 30px", fontFamily: POPPINS, fontWeight: 800, fontSize: 56, display: "flex", alignItems: "center", gap: 24, boxShadow: `0 ${16 - 10 * apertado}px 0 rgba(36,26,74,0.35)` }}>
      <span style={{ width: 80, height: 80, borderRadius: "50%", background: MARCA.sol, color: MARCA.tinta, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      {texto}
    </div>
  </div>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) return <Cena f={f} e={TRAVADA} cam={{ ...CAM, pos: mixV([0.03, 0.5, 1.35], CAM.pos, p(0)) }} />;
  if (em(1))
    return (
      <>
        <Cena f={f} e={TRAVADA} />
        <Conta p={prog(p(1), 0.04, 0.18, elastico)} />
      </>
    );
  if (em(2) || em(3)) {
    const x = em(3) ? p(3) : 0;
    return (
      <>
        <Cena f={f} e={TRAVADA} />
        <Conceito f={f} de={F[2].de + 4} ate={F[3].de - 4} texto="iniciação de tarefa" />
        {em(3) && <Balao texto="Saber o conteúdo  ✓" p={prog(x, 0.02, 0.14, elastico)} topo={240} cor="#2FB36B" corTexto="#FFFFFF" tamanho={48} />}
        {em(3) && <Balao texto="Dar o primeiro passo  …" p={prog(x, 0.45, 0.57, elastico)} topo={380} tamanho={48} />}
      </>
    );
  }
  if (em(4)) {
    const x = p(4);
    const abre = prog(x, 0.42, 0.62);
    const pagina = prog(x, 0.72, 0.98, (v) => v);
    return (
      <>
        <Cena f={f} e={{ abre, pagina, escreve: 0, travada: 1 - prog(x, 0.3, 0.4) }} />
        <Botao n={1} texto="Abrir o caderno" p={prog(x, 0.2, 0.34, elastico)} apertado={prog(x, 0.4, 0.46)} topo={240} />
        <Botao n={2} texto="Achar a página" p={prog(x, 0.6, 0.72, elastico)} apertado={prog(x, 0.92, 0.98)} topo={410} />
      </>
    );
  }
  const x = em(5) ? p(5) : 1;
  return (
    <>
      <Cena f={f} e={{ abre: 1, pagina: 1, escreve: prog(x, 0.05, 0.25), travada: 0 }} />
      {em(5) && <Balao texto="Faz a lição! Faz a lição!" p={prog(x, 0.3, 0.42, elastico)} topo={240} cor="#EDE6F7" corTexto="#8B8FA8" tamanho={44} />}
      {em(5) && <Balao texto="Abre o caderno na página 12  ✓" p={prog(x, 0.6, 0.72, elastico)} topo={370} cor="#2FB36B" corTexto="#FFFFFF" tamanho={44} />}
    </>
  );
};

export const { Componente: ExplicaMenteLicao, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });


