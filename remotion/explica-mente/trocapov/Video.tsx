import React from "react";
import { MARCA } from "../Legendas";
import { Caixa, Esfera } from "../Pecas";
import { elastico, mix, prog } from "../anim";
import { Balao, Conceito, POPPINS, TresQuadros, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Pensamento, Visao, diante, olhar, type Olhos } from "../kit/Pov";
import { Banho, CAM_Q1, CAM_Q2, CAM_Q3, Jogo, Linha, Toalha } from "../troca/Video";
import { ETAPAS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NA_TV: Olhos = { pos: [0, 0.66, 1.5], giro: 0, baixa: 0.0, fov: 50 };
const virado = (t: number): Olhos => ({ ...NA_TV, giro: 0.75 * t, baixa: 0.06 - 0.12 * t });

/** O jogo visto de dentro: a TV, o controle nas mãos e a fase quase no fim. `vira` desvia o olhar para quem chamou. */
const Cena: React.FC<{ f: number; vira?: number; tensao?: number; progresso?: number }> = ({ f, vira = 0, tensao = 0, progresso = 0.8 }) => {
  const cam = olhar(virado(vira), f);
  const aperta = 0.008 * Math.sin(f * 0.9);
  const cores = ["#2EC4B6", "#FFC53D", "#FF5A8A"];
  const controle = diante(cam, -0.02 * vira, -0.2, 0.34);
  return (
    <Visao cam={cam} tensao={tensao}>
      <Caixa t={[1.5, 0.34, 0.4]} raio={0.03} pos={[0, 0.17, -1.05]} cor="#D99B5B" />
      <Caixa t={[1.3, 0.8, 0.07]} raio={0.03} pos={[0, 0.8, -1.05]} cor="#2B2F55" />
      <Caixa t={[1.2, 0.7, 0.02]} raio={0.02} pos={[0, 0.8, -1.01]} cor="#7ED8FF" emissivo="#7ED8FF" brilho={0.7} sombra={false} />
      {cores.map((c, i) => (
        <Esfera key={i} r={0.07} pos={[0.4 * Math.sin(f * 0.09 + i * 2.2), 0.8 + 0.2 * Math.sin(f * 0.13 + i * 2), -0.98]} cor={c} emissivo={c} brilho={0.6} sombra={false} />
      ))}
      {/* barra da fase */}
      <Caixa t={[1.0, 0.05, 0.01]} raio={0.02} pos={[0, 1.08, -0.99]} cor="#FFFFFF" sombra={false} />
      <Caixa t={[1.0 * progresso, 0.05, 0.012]} raio={0.02} pos={[-0.5 + 0.5 * progresso, 1.08, -0.985]} cor="#2FB36B" emissivo="#2FB36B" brilho={0.5} sombra={false} />
      {/* o controle nas minhas mãos */}
      <Caixa t={[0.17, 0.03, 0.07]} raio={0.014} pos={controle} cor="#6C4BD8" />
      <MaoPov cam={cam} alvo={[controle[0] + 0.07, controle[1] + 0.03 + aperta, controle[2]]} fecha={0.6} />
      <MaoPov cam={cam} alvo={[controle[0] - 0.07, controle[1] + 0.03 - aperta, controle[2]]} lado={-1} fecha={0.6} />
    </Visao>
  );
};

/** Aviso antes da troca: quanto tempo falta. */
const Aviso: React.FC<{ minutos: number; p: number }> = ({ minutos, p }) => (
  <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ transform: `scale(${Math.max(0.001, p)})`, background: "#FFFFFF", borderRadius: 60, padding: "26px 50px 20px 30px", display: "flex", alignItems: "center", gap: 26, boxShadow: "0 14px 36px rgba(36,26,74,0.22)", fontFamily: POPPINS, fontWeight: 800, fontSize: 56, color: MARCA.tinta }}>
      <svg width="110" height="110" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="#FFFFFF" stroke={MARCA.roxo} strokeWidth="10" />
        <path d={`M50 50 L50 12 A38 38 0 ${minutos > 7 ? 1 : 0} 1 ${50 + 38 * Math.sin((minutos / 15) * 2 * Math.PI)} ${50 - 38 * Math.cos((minutos / 15) * 2 * Math.PI)} Z`} fill={MARCA.coral} />
      </svg>
      Faltam {minutos} minutos
    </div>
  </div>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} progresso={mix(0.7, 0.82, p(0))} />;
  if (em(1))
    return (
      <>
        <Cena f={f} vira={prog(p(1), 0.3, 0.7)} progresso={0.84} />
        <Balao texto="Hora do banho!" p={prog(p(1), 0.02, 0.2, elastico)} topo={250} />
      </>
    );
  if (em(2))
    return (
      <>
        <Cena f={f} vira={1 - prog(p(2), 0, 0.35)} progresso={mix(0.84, 0.9, p(2))} tensao={0.2} />
        <Pensamento f={f} texto="Só mais um pouquinho." forca={prog(p(2), 0.35, 0.55)} topo={560} tamanho={74} />
      </>
    );
  if (em(3) || em(4)) return <Cena f={f} progresso={0.9 + 0.04 * Math.sin(f * 0.05)} tensao={0.35} />;
  // --- a explicação ---
  if (em(5) || (em(6) && p(6) < 0.55))
    return (
      <>
        <Cena f={f} progresso={0.9} tensao={0.2} />
        <Linha meio={em(6) ? prog(p(6), 0.05, 0.4) : 0} entra={em(5) ? prog(p(5), 0.1, 0.25) : 1} />
        {em(6) && <Conceito f={f} de={F[6].de + (F[6].ate - F[6].de) * 0.42} ate={F[6].de + (F[6].ate - F[6].de) * 0.55} texto="troca de tarefa" topo={420} />}
      </>
    );
  if (em(6) || em(7) || em(8) || em(9) || em(12)) {
    const aceso = em(7) ? [0] : em(8) ? [1] : em(9) ? [2] : em(12) ? (p(12) < 0.35 ? null : [Math.min(2, Math.floor(prog(p(12), 0.35, 1, (v) => v) * 3))]) : null;
    const de = em(12) ? F[12].de - 40 : F[6].de + (F[6].ate - F[6].de) * 0.55;
    return (
      <TresQuadros
        f={f}
        de={de}
        rotulos={ETAPAS}
        aceso={aceso}
        cenas={(L, A) => [
          <Jogo key={0} f={f} ligada={em(7) ? 1 - prog(p(7), 0.55, 0.6) : 1} encerra={em(7) ? prog(p(7), 0.3, 0.55) * (1 - prog(p(7), 0.65, 0.8)) : 0} cam={CAM_Q1} largura={L} altura={A} />,
          <Toalha key={1} f={f} pega={0.5 + 0.5 * Math.sin(f * 0.08)} cam={CAM_Q2} largura={L} altura={A} />,
          <Banho key={2} f={f} cam={CAM_Q3} largura={L} altura={A} />,
        ]}
      />
    );
  }
  if (em(10)) return <Cena f={f} progresso={0.92} tensao={0.3} vira={0.3 * Math.max(0, Math.sin(f * 0.06))} />;
  // --- o que ajuda ---
  if (em(11)) {
    const x = p(11);
    return (
      <>
        <Cena f={f} progresso={mix(0.5, 0.95, x)} />
        <Aviso minutos={x < 0.72 ? 10 : 5} p={x < 0.72 ? prog(x, 0.3, 0.42, elastico) : prog(x, 0.72, 0.8, elastico)} />
      </>
    );
  }
  return <Cena f={f} progresso={1} />;
};

export const { Componente: ExplicaMenteTrocapov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
