import React from "react";
import { AbsoluteFill } from "remotion";
import { Boneco, LIA, type Pose } from "../Boneco";
import { Banquinho } from "../Cenario";
import { MARCA } from "../Legendas";
import { Caixa, Esfera } from "../Pecas";
import { elastico, limitar, mix, mixV, prog, type V3 } from "../anim";
import { Balao, Conceito, POPPINS, TresQuadros, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { emPe, sentado } from "../kit/poses";
import { ETAPAS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM_JOGO: Cam = { pos: [0.2, 0.75, 3.1], alvo: [0.35, 0.5, -0.5], fov: 34 };

/** Jogando videogame, de perfil para a TV. `ligada` 0 = tela apagada; `encerra` 0..1 estica a mão para desligar. */
const Jogo: React.FC<{ f: number; ligada: number; encerra?: number; cam?: Cam; largura?: number; altura?: number }> = ({ f, ligada, encerra = 0, cam = CAM_JOGO, largura, altura }) => {
  const p = sentado(LIA, [0.0, 0, -0.45], Math.PI / 2, 0.27, f);
  const aperta = 0.012 * Math.sin(f * 0.9) * ligada;
  const controle: V3 = [0.2, 0.45, -0.45];
  const botao: V3 = [0.92, 0.3, -0.2];
  const pose: Pose = {
    ...p,
    inclina: 0.16 + 0.25 * encerra,
    maoE: [controle[0], controle[1] + aperta, controle[2] - 0.06],
    maoD: mixV([controle[0], controle[1] - aperta, controle[2] + 0.06], botao, encerra),
    cabeca: [-0.05, 0, 0],
    sorriso: mix(0.2, 0.9, ligada),
    sobr: encerra > 0.2 ? 0.4 : 0,
  };
  const cores = ["#2EC4B6", "#FFC53D", "#FF5A8A"];
  return (
    <Palco cam={cam} largura={largura} altura={altura}>
      <Banquinho pos={[0, 0, -0.45]} />
      {/* TV numa estante baixa */}
      <Caixa t={[0.3, 0.3, 1.0]} raio={0.03} pos={[1.02, 0.15, -0.45]} cor="#D99B5B" />
      <Caixa t={[0.06, 0.52, 0.86]} raio={0.02} pos={[1.02, 0.6, -0.45]} cor="#2B2F55" />
      <Caixa t={[0.02, 0.44, 0.78]} raio={0.01} pos={[0.985, 0.6, -0.45]} cor={ligada > 0.5 ? "#7ED8FF" : "#3A3F66"} emissivo={ligada > 0.5 ? "#7ED8FF" : "#000000"} brilho={0.7 * ligada} sombra={false} />
      {ligada > 0.5 && cores.map((c, i) => <Esfera key={i} r={0.05} pos={[0.97, 0.6 + 0.12 * Math.sin(f * 0.13 + i * 2), -0.45 + 0.26 * Math.sin(f * 0.09 + i * 2.2)]} cor={c} emissivo={c} brilho={0.6} sombra={false} />)}
      <Esfera r={0.022} pos={[0.95, 0.3, -0.2]} cor="#FF5A4E" emissivo="#FF5A4E" brilho={0.6 * ligada} sombra={false} />
      <Boneco m={LIA} p={pose} />
      <Caixa t={[0.05, 0.03, 0.16]} raio={0.012} pos={[controle[0] + 0.01, controle[1], controle[2]]} cor="#6C4BD8" />
    </Palco>
  );
};

/** Pegando a toalha no gancho. */
const Toalha: React.FC<{ f: number; pega: number; cam: Cam; largura?: number; altura?: number }> = ({ f, pega, cam, largura, altura }) => {
  const gancho: V3 = [0.35, 0.95, -1.6];
  const p = emPe(LIA, [0.05, 0, -1.15], 0.5, f);
  const mao: V3 = mixV(p.maoE, [gancho[0] - 0.03, gancho[1] - 0.1, gancho[2] + 0.12], pega);
  return (
    <Palco cam={cam} largura={largura} altura={altura}>
      <Caixa t={[0.05, 0.05, 0.1]} raio={0.02} pos={[gancho[0], gancho[1] + 0.03, gancho[2] + 0.04]} cor="#8B8FA8" />
      <Caixa t={[0.3, 0.46, 0.04]} raio={0.02} pos={[gancho[0], gancho[1] - 0.22, gancho[2] + 0.1]} rot={[0, 0, 0.03 * Math.sin(f * 0.1)]} cor="#2EC4B6" />
      <Caixa t={[0.3, 0.05, 0.045]} raio={0.01} pos={[gancho[0], gancho[1] - 0.36, gancho[2] + 0.1]} cor="#FFFFFF" sombra={false} />
      <Boneco m={LIA} p={{ ...p, maoE: mao, cabeca: [-0.15 * pega, 0.3, 0], sorriso: 0.5 }} />
    </Palco>
  );
};

/** Na banheira, com espuma. */
const Banho: React.FC<{ f: number; cam: Cam; largura?: number; altura?: number }> = ({ f, cam, largura, altura }) => {
  const p = sentado(LIA, [0, 0, -0.95], 0, 0.12, f);
  const pose: Pose = { ...p, maoE: [0.2, 0.62 + 0.04 * Math.sin(f * 0.2), -0.75], maoD: [-0.2, 0.5, -0.8], sorriso: 1, peE: [0.08, 0.1, -0.7], peD: [-0.08, 0.1, -0.7] };
  return (
    <Palco cam={cam} largura={largura} altura={altura}>
      <Caixa t={[1.25, 0.5, 0.75]} raio={0.1} pos={[0, 0.25, -0.9]} cor="#FFFFFF" />
      <Caixa t={[1.1, 0.04, 0.6]} raio={0.02} pos={[0, 0.47, -0.9]} cor="#BFE6FF" sombra={false} />
      <Boneco m={LIA} p={pose} />
      {[[-0.4, 0], [-0.25, 0.12], [0.3, 0.05], [0.42, -0.08], [0.05, 0.2], [-0.1, 0.22], [0.2, 0.2]].map(([x, z], i) => (
        <Esfera key={i} r={0.07 + 0.02 * Math.sin(i * 3)} pos={[x, 0.52 + 0.01 * Math.sin(f * 0.12 + i), -0.8 + z]} cor="#FFFFFF" rug={0.3} sombra={false} />
      ))}
      <Esfera r={0.05} pos={[0.33, 0.55, -0.62]} escala={[1.2, 1, 1]} cor="#FFC53D" />
      <Esfera r={0.03} pos={[0.37, 0.61, -0.61]} cor="#FFC53D" />
    </Palco>
  );
};

const CAM_Q1: Cam = { pos: [0.3, 0.6, 2.7], alvo: [0.42, 0.42, -0.45], fov: 15 };
const CAM_Q2: Cam = { pos: [0.2, 0.85, 2.0], alvo: [0.2, 0.8, -1.3], fov: 14 };
const CAM_Q3: Cam = { pos: [0, 0.75, 2.6], alvo: [0, 0.6, -0.9], fov: 15 };
const CAM_BANHO: Cam = { pos: [0, 0.9, 2.5], alvo: [0, 0.55, -0.9], fov: 34 };

/** A linha do pedido: jogo, banho, e o trecho escondido no meio. */
const Linha: React.FC<{ meio: number; entra: number }> = ({ meio, entra }) => (
  <div style={{ position: "absolute", top: 236, left: 50, right: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, opacity: entra, fontFamily: POPPINS, fontWeight: 800, fontSize: 44 }}>
    <div style={{ background: MARCA.roxo, color: "#FFFFFF", borderRadius: 30, padding: "22px 34px 18px" }}>Jogo</div>
    <div style={{ width: 40 + 380 * meio, height: 92, borderRadius: 30, border: `6px dashed ${MARCA.coral}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", color: MARCA.coral, overflow: "hidden", whiteSpace: "nowrap" }}>{meio > 0.6 ? "? ? ?" : ""}</div>
    <div style={{ background: "#3D9BE9", color: "#FFFFFF", borderRadius: 30, padding: "22px 34px 18px" }}>Banho</div>
  </div>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0))
    return (
      <>
        <Jogo f={f} ligada={1} />
        <Balao texto="Hora do banho!" p={prog(p(0), 0.35, 0.5, elastico)} topo={250} />
      </>
    );
  if (em(1)) {
    const x = p(1);
    const corte = limitar(1 - Math.abs(x - 0.55) / 0.05);
    return (
      <>
        {x < 0.55 ? <Jogo f={f} ligada={1} /> : <Banho f={f} cam={CAM_BANHO} />}
        <AbsoluteFill style={{ background: "#FFFFFF", opacity: corte }} />
        <Linha meio={0} entra={prog(x, 0.05, 0.15)} />
      </>
    );
  }
  if (em(2))
    return (
      <>
        <Jogo f={f} ligada={1} />
        <Linha meio={prog(p(2), 0.15, 0.6)} entra={1} />
      </>
    );
  if (em(3) && p(3) < 0.36)
    return (
      <>
        <Jogo f={f} ligada={1} />
        <Linha meio={1} entra={1 - prog(p(3), 0.26, 0.34)} />
        <Conceito f={f} de={F[3].de + 4} ate={F[3].de + (F[3].ate - F[3].de) * 0.36} texto="troca de tarefa" topo={420} />
      </>
    );
  // os três quadros: encerrar, preparar, começar
  const parte = (x: number) => Math.min(2, Math.floor(x * 3));
  const aceso = em(4) ? [parte(p(4))] : em(5) ? [parte(prog(p(5), 0.34, 1, (v) => v))] : em(6) ? [0] : null;
  const de = F[3].de + (F[3].ate - F[3].de) * 0.36;
  const desliga = em(4) ? prog(p(4), 0.1, 0.3) : 0;
  return (
    <TresQuadros
      f={f}
      de={de}
      rotulos={ETAPAS}
      aceso={em(5) && p(5) < 0.34 ? null : aceso}
      cenas={(L, A) => [
        <Jogo key={0} f={f} ligada={em(4) ? 1 - prog(p(4), 0.26, 0.3) : 1} encerra={em(4) ? desliga * (1 - prog(p(4), 0.32, 0.4)) : 0} cam={CAM_Q1} largura={L} altura={A} />,
        <Toalha key={1} f={f} pega={0.5 + 0.5 * Math.sin(f * 0.08)} cam={CAM_Q2} largura={L} altura={A} />,
        <Banho key={2} f={f} cam={CAM_Q3} largura={L} altura={A} />,
      ]}
    />
  );
};

export const { Componente: ExplicaMenteTroca, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
