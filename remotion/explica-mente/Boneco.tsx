import React from "react";
import { Caixa, Cilindro, Esfera, Mat, Seg } from "./Pecas";
import { Tenis, TORNOZELO_NO_TENIS } from "./Tenis";
import { esc, girar, ik, norm, soma, sub, type V3 } from "./anim";

export type Medidas = {
  estilo: "lia" | "tera" | "adulto";
  cabeca: number;
  torso: number;
  raioTorso: number;
  ombro: number;
  alturaOmbro: number;
  quadril: number;
  braco: [number, number];
  perna: [number, number];
  rBraco: number;
  rPerna: number;
  mao: number;
  cores: { pele: string; cabelo: string; blusa: string; quadril: string; coxa: string; canela: string; manga: string; pe: string };
};

export const LIA: Medidas = {
  estilo: "lia",
  cabeca: 0.15,
  torso: 0.27,
  raioTorso: 0.105,
  ombro: 0.118,
  alturaOmbro: 0.25,
  quadril: 0.068,
  braco: [0.18, 0.17],
  perna: [0.22, 0.22],
  rBraco: 0.033,
  rPerna: 0.042,
  mao: 0.042,
  cores: { pele: "#B5734A", cabelo: "#2A1A16", blusa: "#FFC53D", quadril: "#4C6FE0", coxa: "#4C6FE0", canela: "#B5734A", manga: "#FFC53D", pe: "#F4EEFF" },
};

export const TERA: Medidas = {
  estilo: "tera",
  cabeca: 0.15,
  torso: 0.46,
  raioTorso: 0.15,
  ombro: 0.175,
  alturaOmbro: 0.43,
  quadril: 0.09,
  braco: [0.28, 0.26],
  perna: [0.41, 0.41],
  rBraco: 0.042,
  rPerna: 0.06,
  mao: 0.052,
  cores: { pele: "#EDB58C", cabelo: "#7A3A2A", blusa: "#6C4BD8", quadril: "#2B2F55", coxa: "#2B2F55", canela: "#2B2F55", manga: "#6C4BD8", pe: "#FFFFFF" },
};

export type Pose = {
  /** Centro da bacia, no mundo. */
  pos: V3;
  yaw: number;
  /** Inclinação do tronco para a frente. */
  inclina: number;
  tomba: number;
  giroTorso: number;
  /** Cabeça: baixar, virar (positivo = para a esquerda dela), tombar. */
  cabeca: V3;
  maoE: V3;
  maoD: V3;
  peE: V3;
  peD: V3;
  /** Ponta do pé para baixo. */
  peEInc: number;
  peDInc: number;
  poloPeE?: V3;
  poloPeD?: V3;
  poloMaoE?: V3;
  poloMaoD?: V3;
  /** Abertura da boca (0 = fechada). */
  boca: number;
  sorriso: number;
  olhos: number;
  /** Sobrancelha: positivo = preocupada, negativo = brava. */
  sobr: number;
  aponta?: "E" | "D";
};

const Rosto: React.FC<{ m: Medidas; p: Pose }> = ({ m, p }) => {
  const r = m.cabeca;
  const escuro = "#2B1B17";
  return (
    <>
      {[1, -1].map((l) => (
        <group key={l}>
          <Esfera r={r * 0.13} pos={[l * r * 0.36, r * 0.08, r * 0.89]} escala={[1, Math.max(0.12, p.olhos), 0.6]} cor={escuro} rug={0.25} sombra={false} />
          <Esfera r={r * 0.035} pos={[l * r * 0.36 + r * 0.035, r * 0.12, r * 0.965]} cor="#FFFFFF" sombra={false} brilho={0.6} emissivo="#FFFFFF" />
          <group position={[l * r * 0.37, r * 0.34, r * 0.9]} rotation={[0, 0, -l * p.sobr * 0.5]}>
            <Caixa t={[r * 0.26, r * 0.055, r * 0.05]} raio={r * 0.02} cor={m.cores.cabelo} sombra={false} />
          </group>
          <Esfera r={r * 0.16} pos={[l * r * 0.6, r * -0.2, r * 0.73]} escala={[1, 0.65, 0.4]} cor="#F0806E" rug={0.9} sombra={false} />
          <Esfera r={r * 0.17} pos={[l * r * 0.97, 0, 0]} escala={[0.5, 1, 0.8]} cor={m.cores.pele} />
        </group>
      ))}
      <Esfera r={r * 0.075} pos={[0, r * -0.1, r * 1.0]} cor={m.cores.pele} sombra={false} />
      {p.boca > 0.06 ? (
        <Esfera r={1} pos={[0, r * -0.4, r * 0.9]} escala={[r * 0.17, r * (0.03 + 0.14 * p.boca), r * 0.06]} cor="#7A2330" rug={0.4} sombra={false} />
      ) : (
        <mesh position={[0, r * (-0.36 - 0.03 * Math.sign(p.sorriso)), r * 0.93]} rotation={[0, 0, Math.PI]} scale={[1, Math.abs(p.sorriso) < 0.08 ? 0.08 : p.sorriso, 1]}>
          <torusGeometry args={[r * 0.17, r * 0.028, 10, 24, Math.PI]} />
          <Mat cor="#7A2330" rug={0.4} />
        </mesh>
      )}
    </>
  );
};

const Cabelo: React.FC<{ m: Medidas }> = ({ m }) => {
  const r = m.cabeca;
  const c = m.cores.cabelo;
  if (m.estilo === "lia") {
    return (
      <>
        <Esfera r={r * 1.13} pos={[0, r * 0.22, r * -0.3]} cor={c} rug={0.95} />
        {[1, -1].map((l) => (
          <group key={l} position={[l * r * 0.78, r * 0.95, r * -0.12]}>
            <Esfera r={r * 0.46} cor={c} rug={0.95} />
            <Esfera r={r * 0.24} pos={[l * r * 0.22, r * 0.3, r * 0.1]} cor={c} rug={0.95} />
            <Esfera r={r * 0.22} pos={[l * -r * 0.1, r * 0.36, r * -0.12]} cor={c} rug={0.95} />
            <mesh position={[l * r * -0.22, r * -0.3, 0]} rotation={[Math.PI / 2, l * 0.6, 0]}>
              <torusGeometry args={[r * 0.2, r * 0.06, 10, 20]} />
              <Mat cor="#FF5A8A" />
            </mesh>
          </group>
        ))}
      </>
    );
  }
  if (m.estilo === "adulto") {
    return (
      <>
        <Esfera r={r * 1.13} pos={[0, r * 0.22, r * -0.3]} cor={c} rug={0.9} />
        <Esfera r={r * 0.5} pos={[r * 0.35, r * 0.95, r * 0.25]} escala={[1.3, 0.6, 0.9]} cor={c} rug={0.9} />
      </>
    );
  }
  return (
    <>
      <Esfera r={r * 1.13} pos={[0, r * 0.2, r * -0.28]} cor={c} rug={0.8} />
      <Esfera r={r * 0.45} pos={[0, r * 0.98, r * -0.5]} cor={c} rug={0.8} />
      <Esfera r={r * 0.5} pos={[r * 0.55, r * 0.6, r * 0.5]} escala={[1, 0.7, 0.6]} cor={c} rug={0.8} />
      <Esfera r={r * 0.5} pos={[r * -0.55, r * 0.6, r * 0.5]} escala={[1, 0.7, 0.6]} cor={c} rug={0.8} />
      {/* óculos */}
      {[1, -1].map((l) => (
        <mesh key={l} position={[l * r * 0.37, r * 0.08, r * 0.97]}>
          <torusGeometry args={[r * 0.22, r * 0.028, 10, 28]} />
          <Mat cor="#2B2F55" rug={0.3} />
        </mesh>
      ))}
      <Caixa t={[r * 0.3, r * 0.04, r * 0.04]} raio={r * 0.015} pos={[0, r * 0.1, r * 1.0]} cor="#2B2F55" sombra={false} />
    </>
  );
};

const Pe: React.FC<{ m: Medidas; pos: V3; yaw: number; inc: number; calcado?: boolean; aberto?: number }> = ({ m, pos, yaw, inc, calcado, aberto }) => (
  <group position={pos} rotation={[inc, yaw, 0, "YXZ"]}>
    {m.estilo === "lia" ? (
      <>
        <Cilindro r={m.rPerna * 1.08} h={0.07} pos={[0, 0.03, 0]} cor={m.cores.pe} rug={0.9} />
        <Cilindro r={m.rPerna * 1.12} h={0.014} pos={[0, 0.05, 0]} cor="#8E6BE8" rug={0.9} />
        {calcado ? (
          <group position={esc(TORNOZELO_NO_TENIS, -1)}>
            <Tenis aberto={aberto} />
          </group>
        ) : (
          <Esfera r={1} escala={[0.04, 0.036, 0.082]} pos={[0, -0.026, 0.042]} cor={m.cores.pe} rug={0.9} />
        )}
      </>
    ) : (
      <>
        <Esfera r={1} escala={[0.058, 0.05, 0.13]} pos={[0, -0.03, 0.06]} cor={m.cores.pe} rug={0.5} />
        <Caixa t={[0.112, 0.03, 0.26]} raio={0.014} pos={[0, -0.066, 0.06]} cor="#E7E3F5" />
      </>
    )}
  </group>
);

/** `fantasma` desenha um dos braços só como contorno pontilhado (a posição que o corpo sente, sem a imagem). */
export const Boneco: React.FC<{ m: Medidas; p: Pose; calcadoD?: boolean; tenisAberto?: number; fantasma?: "E" | "D" }> = ({ m, p, calcadoD, tenisAberto, fantasma }) => {
  const rotT: V3 = [p.inclina, p.yaw + p.giroTorso, p.tomba];
  const rotY: V3 = [0, p.yaw, 0];
  const membro = (l: 1 | -1, tipo: "braco" | "perna") => {
    if (tipo === "braco") {
      const raiz = soma(p.pos, girar([l * m.ombro, m.alturaOmbro, 0], rotT));
      const polo = girar((l === 1 ? p.poloMaoE : p.poloMaoD) ?? [l * 0.8, -1, -0.6], rotY);
      return { raiz, ...ik(raiz, l === 1 ? p.maoE : p.maoD, m.braco[0], m.braco[1], polo) };
    }
    const raiz = soma(p.pos, girar([l * m.quadril, -0.015, 0], rotY));
    const polo = girar((l === 1 ? p.poloPeE : p.poloPeD) ?? [l * 0.12, 0.35, 1], rotY);
    return { raiz, ...ik(raiz, l === 1 ? p.peE : p.peD, m.perna[0], m.perna[1], polo) };
  };
  const bE = membro(1, "braco");
  const bD = membro(-1, "braco");
  const pE = membro(1, "perna");
  const pD = membro(-1, "perna");
  const c = m.cores;
  const tera = m.estilo === "tera";

  return (
    <>
      <group position={p.pos} rotation={[rotT[0], rotT[1], rotT[2], "YXZ"]}>
        {/* quadril */}
        <Esfera r={1} escala={[m.raioTorso * 1.12, m.raioTorso * 0.8, m.raioTorso * 0.98]} pos={[0, 0.005, 0]} cor={c.quadril} />
        {/* tronco */}
        <mesh position={[0, (m.torso + 0.04) / 2 - 0.01, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[m.raioTorso * 0.97, m.torso + 0.04 - m.raioTorso * 1.94, 10, 32]} />
          <Mat cor={c.blusa} />
        </mesh>
        {tera && (
          <>
            {/* crachá */}
            <Caixa t={[0.06, 0.08, 0.01]} raio={0.004} pos={[0.07, m.torso * 0.55, m.raioTorso * 0.93]} cor="#FFFFFF" sombra={false} />
            <Caixa t={[0.035, 0.02, 0.012]} raio={0.004} pos={[0.07, m.torso * 0.59, m.raioTorso * 0.935]} cor="#FFC53D" sombra={false} />
          </>
        )}
        {/* pescoço e cabeça */}
        <Cilindro r={m.cabeca * 0.3} h={m.cabeca * 0.5} pos={[0, m.torso + m.cabeca * 0.02, 0]} cor={c.pele} />
        <group position={[0, m.torso + m.cabeca * 1.02, 0]} rotation={[p.cabeca[0], p.cabeca[1], p.cabeca[2], "YXZ"]}>
          <Esfera r={m.cabeca} cor={c.pele} />
          <Cabelo m={m} />
          <Rosto m={m} p={p} />
        </group>
      </group>

      {/* braços */}
      {([[bE, 1], [bD, -1]] as const).map(([b, l]) => (
        fantasma === (l === 1 ? "E" : "D") ? (
          <group key={l}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
              const t = i / 9;
              const pt = t < 0.5 ? b.raiz.map((v, j) => v + (b.meio[j] - v) * t * 2) : b.meio.map((v, j) => v + (b.fim[j] - v) * (t - 0.5) * 2);
              return <Esfera key={i} r={i === 9 ? m.mao * 0.55 : m.rBraco * 0.42} pos={pt as V3} cor="#6C4BD8" emissivo="#6C4BD8" brilho={0.5} sombra={false} />;
            })}
          </group>
        ) : (
        <group key={l}>
          <Seg a={b.raiz} b={b.meio} r={m.rBraco * 1.12} r2={m.rBraco} cor={c.manga} />
          <Seg a={b.meio} b={b.fim} r={m.rBraco * 0.93} r2={m.rBraco * 0.86} cor={c.pele} />
          <Esfera r={m.mao} pos={b.fim} cor={c.pele} />
          {p.aponta === (l === 1 ? "E" : "D") && (
            <Seg a={b.fim} b={soma(b.fim, esc(norm(sub(b.fim, b.meio)), m.mao * 2.1))} r={m.mao * 0.34} cor={c.pele} />
          )}
        </group>
        )
      ))}

      {/* pernas */}
      {([[pE, 1], [pD, -1]] as const).map(([pr, l]) => (
        <group key={l}>
          <Seg a={pr.raiz} b={pr.meio} r={m.rPerna * 1.2} r2={m.rPerna * 1.02} cor={c.coxa} />
          <Seg a={pr.meio} b={pr.fim} r={m.rPerna * 0.95} r2={m.rPerna * 0.84} cor={c.canela} />
          <Pe m={m} pos={pr.fim} yaw={p.yaw} inc={l === 1 ? p.peEInc : p.peDInc} calcado={l === -1 && calcadoD} aberto={tenisAberto} />
        </group>
      ))}
    </>
  );
};

/** Um adulto qualquer (mãe, pai, a própria pessoa do exemplo), diferente da terapeuta. */
export const ADULTO: Medidas = {
  ...TERA,
  estilo: "adulto",
  cores: { pele: "#A9683F", cabelo: "#2E1F1A", blusa: "#FF7A59", quadril: "#3B4A7A", coxa: "#3B4A7A", canela: "#3B4A7A", manga: "#FF7A59", pe: "#FFFFFF" },
};
