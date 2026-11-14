import React from "react";
import { Boneco, LIA, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa } from "../Pecas";
import { elastico, k, mix, mixV, prog, sair, type V3 } from "../anim";
import { Conceito, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { emPe } from "../kit/poses";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const MESA = 0.3;
const Z = -0.5;
const X_A = -0.3;
const X_B = 0.3;
const CAM: Cam = { pos: [0, 0.9, 2.7], alvo: [0, 0.56, -0.6], fov: 34 };

const CaixaDePapelao: React.FC<{ pos: V3; rot?: number }> = ({ pos, rot = 0 }) => (
  <group position={pos} rotation={[rot, 0, rot * 0.5]}>
    <Caixa t={[0.27, 0.24, 0.27]} raio={0.012} pos={[0, 0.12, 0]} cor="#D9A566" rug={0.9} />
    <Caixa t={[0.275, 0.05, 0.08]} raio={0.004} pos={[0, 0.222, 0]} cor="#F3DDB0" sombra={false} />
    <Caixa t={[0.08, 0.1, 0.275]} raio={0.004} pos={[0, 0.2, 0]} cor="#F3DDB0" sombra={false} />
  </group>
);

type Tipo = "cheia" | "vazia" | "ajustada";

/** Lia levanta uma caixa. `t` 0..1: aproxima as mãos (até 0,2), levanta, segura e devolve. */
const levantar = (f: number, t: number, tipo: Tipo, x: number): { lia: Pose; altura: number; gira: number } => {
  const pega = prog(t, 0.02, 0.2);
  const altura =
    tipo === "cheia"
      ? 0.13 * k(t, [[0.2, 0], [0.7, 1], [0.85, 1], [1, 0]]) + (t > 0.25 && t < 0.85 ? 0.006 * Math.sin(f * 1.3) : 0)
      : tipo === "vazia"
        ? 0.32 * k(t, [[0.2, 0], [0.29, 1], [0.75, 1], [1, 0]], t < 0.3 ? elastico : sair)
        : 0.2 * k(t, [[0.2, 0], [0.45, 1], [0.85, 1], [1, 0]]);
  const esforco = tipo === "cheia" ? k(t, [[0.18, 0], [0.3, 1], [0.85, 1], [1, 0]]) : 0;
  const susto = tipo === "vazia" ? k(t, [[0.2, 0], [0.26, 1], [0.8, 1], [1, 0]]) : 0;
  const p = emPe(LIA, [x, 0, -0.76], 0, f);
  const yMao = MESA + 0.13 + altura;
  const lia: Pose = {
    ...p,
    pos: [p.pos[0], p.pos[1] - 0.05 * esforco + 0.03 * susto, p.pos[2] - 0.05 * susto],
    inclina: mix(0.03, 0.38, pega) - 0.3 * esforco * 0.5 - 0.42 * susto,
    maoE: mixV(p.maoE, [x + 0.15, yMao, Z + 0.02], pega),
    maoD: mixV(p.maoD, [x - 0.15, yMao, Z + 0.02], pega),
    cabeca: [0.25 * pega * (1 - susto) - 0.2 * susto, 0, 0],
    sobr: -0.6 * esforco + 0.9 * susto,
    sorriso: mix(0.6, -0.4, esforco) * (1 - susto) + (tipo === "ajustada" ? 0.4 * prog(t, 0.3, 0.5) : 0),
    boca: 0.8 * susto,
  };
  return { lia, altura, gira: -0.25 * susto };
};

const Cena: React.FC<{ f: number; t: number; tipo: Tipo; qual: "A" | "B"; cam?: Cam }> = ({ f, t, tipo, qual, cam = CAM }) => {
  const x = qual === "A" ? X_A : X_B;
  const l = levantar(f, t, tipo, x);
  return (
    <Palco cam={cam}>
      <Caixa t={[1.3, MESA, 0.5]} raio={0.02} pos={[0, MESA / 2, Z]} cor="#E6B67A" />
      <CaixaDePapelao pos={[X_A, MESA + (qual === "A" ? l.altura : 0), Z]} rot={qual === "A" ? l.gira : 0} />
      <CaixaDePapelao pos={[X_B, MESA + (qual === "B" ? l.altura : 0), Z]} rot={qual === "B" ? l.gira : 0} />
      <Boneco m={LIA} p={l.lia} />
    </Palco>
  );
};

/** As duas barras: a força que o corpo preparou e o peso que a caixa tinha de verdade. */
const Barras: React.FC<{ esperada: number; real: number; mostraReal: number; entra: number; iguais?: number }> = ({ esperada, real, mostraReal, entra, iguais = 0 }) => {
  const barra = (rotulo: string, v: number, cor: string, op: number) => (
    <div style={{ opacity: op }}>
      <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 38, color: MARCA.tinta, marginBottom: 8 }}>{rotulo}</div>
      <div style={{ height: 62, borderRadius: 31, background: "#EFE7F9", overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", borderRadius: 31, background: cor }} />
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 222, left: 60, right: 60, padding: "30px 40px 36px", background: "#FFFFFF", borderRadius: 40, boxShadow: "0 14px 36px rgba(36,26,74,0.2)", display: "flex", flexDirection: "column", gap: 22, opacity: entra, transform: `translateY(${(1 - entra) * -40}px)` }}>
      {barra("Força preparada", esperada, iguais > 0.5 ? "#2FB36B" : MARCA.roxo, 1)}
      {barra("Peso da caixa", real, iguais > 0.5 ? "#2FB36B" : MARCA.coral, mostraReal)}
    </div>
  );
};

const Pausa: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "absolute", top: 610, left: 64, opacity: p, background: MARCA.roxo, borderRadius: 999, padding: "20px 30px", display: "flex", gap: 12 }}>
    <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
    <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
  </div>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) return <Cena f={f} t={mix(0.08, 0.7, p(0))} tipo="vazia" qual="B" />;
  if (em(1)) return <Cena f={f} t={prog(p(1), 0.3, 1, (x) => x) * 0.86} tipo="cheia" qual="A" />;
  if (em(2)) return <Cena f={f} t={mix(0.0, 0.62, p(2))} tipo="vazia" qual="B" />;
  if (em(3) || em(4)) {
    // volta a cena e congela antes de a mão tocar na caixa
    const volta = em(3) ? prog(p(3), 0, 0.22) : 1;
    return (
      <>
        <Cena f={f} t={mix(0.62, 0.15, volta)} tipo="vazia" qual="B" cam={{ ...CAM, pos: mixV(CAM.pos, [0.2, 0.8, 2.1], volta), alvo: mixV(CAM.alvo, [0.25, 0.52, -0.6], volta) }} />
        <Pausa p={prog(volta, 0.9, 1)} />
        <Barras esperada={0.86 * (em(3) ? prog(p(3), 0.45, 0.75) : 1)} real={0} mostraReal={0} entra={em(3) ? prog(p(3), 0.38, 0.48, sair) : 1} />
        <Conceito f={f} de={F[4].de + 4} ate={F[5].de - 4} texto="controle antecipatório" topo={720} />
      </>
    );
  }
  if (em(5)) {
    const x = p(5);
    return (
      <>
        <Cena f={f} t={mix(0.15, 0.6, prog(x, 0.05, 0.6, (v) => v))} tipo="vazia" qual="B" cam={{ ...CAM, pos: mixV([0.2, 0.8, 2.1], CAM.pos, prog(x, 0, 0.3)), alvo: mixV([0.25, 0.52, -0.6], CAM.alvo, prog(x, 0, 0.3)) }} />
        <Barras esperada={0.86} real={0.2 * prog(x, 0.2, 0.45)} mostraReal={prog(x, 0.15, 0.25)} entra={1} />
      </>
    );
  }
  // segunda tentativa: a força já vem ajustada
  const x = em(6) ? p(6) : 1;
  return (
    <>
      <Cena f={f} t={mix(0.0, 0.8, x)} tipo="ajustada" qual="B" />
      <Barras esperada={mix(0.86, 0.22, prog(x, 0.08, 0.3))} real={0.2} mostraReal={1} entra={1 - (em(7) ? prog(p(7), 0, 0.1) : 0)} iguais={prog(x, 0.3, 0.32)} />
    </>
  );
};

export const { Componente: ExplicaMenteCaixa, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
