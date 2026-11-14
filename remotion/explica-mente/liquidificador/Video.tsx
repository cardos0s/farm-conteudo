import React from "react";
import { AbsoluteFill } from "remotion";
import { Boneco, LIA, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera, Seg } from "../Pecas";
import { elastico, k, limitar, mix, mixV, prog, sair, soma, type V3 } from "../anim";
import { Conceito, Etapas, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { emPe, nosOuvidos, olharPara } from "../kit/poses";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const BALCAO = 0.47;
const SOM: V3 = [-0.52, BALCAO, -1.02];
export const LIQ: V3 = [0.56, BALCAO, -1.02];
const BOTAO_SOM = soma(SOM, [0.05, 0.3, 0.02]);
export const BOTAO_LIQ = soma(LIQ, [0, 0.055, 0.085]);

export const Balcao: React.FC = () => (
  <>
    <Caixa t={[2.8, BALCAO - 0.04, 0.5]} raio={0.02} pos={[0, (BALCAO - 0.04) / 2, -1.22]} cor="#FFFFFF" />
    <Caixa t={[2.86, 0.04, 0.56]} raio={0.012} pos={[0, BALCAO - 0.02, -1.22]} cor="#D99B5B" />
  </>
);

export const CaixaDeSom: React.FC<{ pulsa: number }> = ({ pulsa }) => (
  <group position={SOM}>
    <Caixa t={[0.26, 0.3, 0.17]} raio={0.03} pos={[0, 0.15, 0]} cor="#6C4BD8" />
    <Cilindro r={0.078 * (1 + 0.06 * pulsa)} h={0.012} pos={[0, 0.13, 0.088]} rot={[Math.PI / 2, 0, 0]} cor="#FFC53D" />
    <Cilindro r={0.035} h={0.014} pos={[0, 0.13, 0.092]} rot={[Math.PI / 2, 0, 0]} cor="#2B2F55" />
    <Cilindro r={0.032} h={0.024} pos={[0.05, 0.31, 0.02]} cor="#FF5A4E" />
    <Cilindro r={0.024} h={0.03} pos={[-0.06, 0.31, 0.02]} cor="#2EC4B6" />
  </group>
);

export const Liquidificador: React.FC<{ ligado: number; f: number; pos?: V3 }> = ({ ligado, f, pos = LIQ }) => (
  <group position={[pos[0] + 0.004 * ligado * Math.sin(f * 2.3), pos[1], pos[2] + 0.004 * ligado * Math.sin(f * 3.1)]}>
    <Caixa t={[0.17, 0.11, 0.17]} raio={0.025} pos={[0, 0.055, 0]} cor="#FF5A4E" />
    <Cilindro r={0.02} h={0.012} pos={[0, 0.055, 0.088]} rot={[Math.PI / 2, 0, 0]} cor="#FFC53D" />
    <Cilindro r={0.078} r2={0.058} h={0.2} pos={[0, 0.21, 0]} cor="#CFEFFF" rug={0.25} />
    <Cilindro r={0.07} r2={0.056} h={0.1} pos={[0, 0.165, 0]} escala={[1.03, 1, 1.03]} cor="#FF9EC0" rug={0.5} sombra={false} />
    <Cilindro r={0.082} h={0.025} pos={[0, 0.322, 0]} cor="#2B2F55" />
  </group>
);

/** Notas que sobem da caixa de som. */
const Notas: React.FC<{ f: number; volume: number }> = ({ f, volume }) => (
  <>
    {volume > 0.03 &&
      [0, 1, 2, 3].map((i) => {
        const t = ((f + i * 17) % 68) / 68;
        const s = volume * Math.min(1, t * 5, (1 - t) * 4) * 1.15;
        const pos: V3 = [SOM[0] - 0.12 + i * 0.09 + 0.05 * Math.sin(t * 7 + i), SOM[1] + 0.38 + t * 0.5, SOM[2] + 0.12];
        return (
          <group key={i} position={pos} scale={s} rotation={[0, 0, 0.25 * Math.sin(t * 6 + i)]}>
            <Esfera r={0.03} escala={[1.25, 1, 0.6]} cor={i % 2 ? "#2EC4B6" : "#FFC53D"} />
            <Seg a={[0.03, 0, 0]} b={[0.03, 0.1, 0]} r={0.006} cor={i % 2 ? "#2EC4B6" : "#FFC53D"} />
          </group>
        );
      })}
  </>
);

/** Ondas ásperas saindo do liquidificador (só imagem; o vídeo não reproduz o ruído). */
export const Ruido: React.FC<{ f: number; forca: number }> = ({ f, forca }) => (
  <>
    {forca > 0.03 &&
      [0, 1, 2].map((i) => {
        const t = ((f + i * 10) % 30) / 30;
        return (
          <mesh key={i} position={[LIQ[0], LIQ[1] + 0.2, LIQ[2] + 0.1]} rotation={[0, 0, f * 0.4 + i]} scale={0.14 + t * 0.42}>
            <torusGeometry args={[1, 0.035, 3, 9]} />
            <meshBasicMaterial color="#FF5A4E" transparent opacity={forca * (1 - t) * 0.85} depthWrite={false} />
          </mesh>
        );
      })}
  </>
);

/** Braço de outra pessoa entrando no quadro para ligar o aparelho. */
export const Braco: React.FC<{ mao: V3 }> = ({ mao }) => {
  const cotovelo: V3 = [mao[0] + 0.3, mao[1] + 0.2, mao[2] + 0.12];
  return (
    <>
      <Seg a={[cotovelo[0] + 0.5, cotovelo[1] + 0.25, cotovelo[2] + 0.1]} b={cotovelo} r={0.055} cor="#FF7A59" />
      <Seg a={cotovelo} b={mao} r={0.043} r2={0.038} cor="#A9683F" />
      <Esfera r={0.052} pos={mao} cor="#A9683F" />
    </>
  );
};

const CAM_SOM: Cam = { pos: [-0.3, 0.8, 2.7], alvo: [-0.32, 0.56, -0.9], fov: 34 };
export const CAM_LIQ: Cam = { pos: [0.3, 0.8, 2.7], alvo: [0.3, 0.56, -0.9], fov: 34 };
const aproximar = (c: Cam, t: number): Cam => ({ ...c, pos: mixV(c.pos, [c.pos[0], c.pos[1], c.pos[2] - 0.3], t) });

export const incomodada = (p: Pose, forca: number): Pose => {
  const o = nosOuvidos(LIA, p);
  return { ...p, maoE: mixV(p.maoE, o.maoE, forca), maoD: mixV(p.maoD, o.maoD, forca), inclina: p.inclina + 0.12 * forca, sobr: 0.8 * forca, sorriso: mix(p.sorriso, -0.6, forca), olhos: mix(p.olhos, 0.3, forca), cabeca: [0.15 * forca, p.cabeca[1], 0.08 * forca] };
};

const dancando = (f: number, forca: number): Pose => {
  const p = emPe(LIA, [-0.14, 0, -0.74], -0.25, f);
  const b = Math.sin(f * 0.33);
  return {
    ...p,
    pos: [p.pos[0] + 0.03 * b * forca, p.pos[1] - 0.02 * Math.abs(Math.cos(f * 0.33)) * forca, p.pos[2]],
    tomba: 0.13 * b * forca,
    maoE: mixV(p.maoE, [p.pos[0] + 0.3, 0.86 + 0.1 * b, p.pos[2] + 0.08], forca),
    maoD: mixV(p.maoD, [p.pos[0] - 0.3, 0.86 - 0.1 * b, p.pos[2] + 0.08], forca),
    cabeca: [0, 0, -0.12 * b * forca],
    sorriso: mix(0.6, 1, forca),
  };
};

export const pertoDoLiq = (f: number): Pose => {
  const p = emPe(LIA, [0.05, 0, -0.72], 0.2, f, 1);
  return { ...p, cabeca: olharPara(LIA, p, soma(LIQ, [0, 0.2, 0]), 0.6) };
};

/** Cena do liquidificador: `ligado` 0..1, `tapa` 0..1 (mãos nos ouvidos), `mao` = quão perto do botão está a mão do adulto. */
const CenaLiq: React.FC<{ f: number; ligado: number; tapa: number; mao: number; cam: Cam; susto?: number }> = ({ f, ligado, tapa, mao, cam, susto = 0 }) => {
  const base = pertoDoLiq(f);
  const lia = incomodada({ ...base, pos: [base.pos[0] - 0.05 * susto, base.pos[1] + 0.05 * Math.sin(Math.PI * susto), base.pos[2]] }, tapa);
  return (
    <Palco cam={cam}>
      <Balcao />
      <CaixaDeSom pulsa={0} />
      <Liquidificador ligado={ligado} f={f} />
      <Ruido f={f} forca={ligado} />
      <Boneco m={LIA} p={lia} />
      {mao > 0.01 && <Braco mao={mixV([1.25, 0.85, -0.7], soma(BOTAO_LIQ, [0.03, 0.01, 0.045]), mao)} />}
    </Palco>
  );
};

const Linha: React.FC<{ rotulo: string; a: string; b: string; p: number }> = ({ rotulo, a, b, p }) => (
  <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
    <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 46, color: MARCA.tinta, textAlign: "center", marginBottom: 12 }}>{rotulo}</div>
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, background: "#DDF6F2", borderRadius: 30, padding: "30px 16px 24px", fontFamily: POPPINS, fontWeight: 700, fontSize: 44, color: "#12756B", textAlign: "center" }}>{a}</div>
      <div style={{ flex: 1, background: "#FFE1DD", borderRadius: 30, padding: "30px 16px 24px", fontFamily: POPPINS, fontWeight: 700, fontSize: 44, color: "#B7342C", textAlign: "center" }}>{b}</div>
    </div>
  </div>
);

/** As duas linhas do tempo lado a lado: começo, duração e controle. */
const Comparacao: React.FC<{ q: Quadro }> = ({ q }) => {
  const p = q.p(5);
  const entra = prog(p, 0, 0.08, sair);
  const barra = (cor: string, suave: boolean) => (
    <div style={{ flex: 1, height: 150, borderRadius: 30, background: "#FFFFFF", position: "relative", overflow: "hidden", boxShadow: "0 8px 22px rgba(36,26,74,0.12)" }}>
      <div style={{ position: "absolute", left: "24%", right: `${100 - 24 - 66 * prog(p, 0.05, 0.4)}%`, top: 0, bottom: 0, background: cor, clipPath: suave ? "polygon(0 100%, 24% 0, 100% 0, 100% 100%)" : "none" }} />
      <div style={{ position: "absolute", left: "24%", top: 0, bottom: 0, width: 8, marginLeft: -4, background: MARCA.tinta }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ background: MARCA.creme, opacity: entra, padding: "230px 56px 0", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
        <div style={{ flex: 1, fontFamily: POPPINS, fontWeight: 800, fontSize: 54, color: "#12756B", textAlign: "center" }}>Música</div>
        <div style={{ flex: 1, fontFamily: POPPINS, fontWeight: 800, fontSize: 54, color: "#B7342C", textAlign: "center" }}>Liquidificador</div>
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 44 }}>
        {barra("#2EC4B6", true)}
        {barra("#FF5A4E", false)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <Linha rotulo="Começo" a="ela escolhe" b="de surpresa" p={prog(p, 0.1, 0.22, sair)} />
        <Linha rotulo="Duração" a="ela sabe" b="não sabe" p={prog(p, 0.4, 0.52, sair)} />
        <Linha rotulo="Controle" a="com ela" b="com outra pessoa" p={prog(p, 0.66, 0.78, sair)} />
      </div>
    </AbsoluteFill>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // gancho: o liquidificador incomoda...
  if (em(0)) return <CenaLiq f={f} ligado={1} tapa={prog(p(0), 0.02, 0.14)} mao={0} cam={aproximar(CAM_LIQ, p(0))} />;
  // ...e a música alta, não
  if (em(1) || em(2)) {
    const aperta = em(2) ? k(p(2), [[0.04, 0], [0.16, 1], [0.26, 1], [0.36, 0]]) : 0;
    const abaixa = em(2) ? k(p(2), [[0.62, 0], [0.74, 1], [0.92, 1], [1, 0]]) : 0;
    const tocando = em(1) ? 1 : prog(p(2), 0.14, 0.2);
    const volume = tocando * (1 - 0.6 * prog(p(2), 0.74, 0.9) * (em(2) ? 1 : 0));
    const lia = dancando(f, tocando * (1 - Math.max(aperta, abaixa)));
    if (em(2)) {
      lia.maoD = mixV(lia.maoD, soma(BOTAO_SOM, [0.02, 0.03, 0.03]), aperta);
      lia.maoD = mixV(lia.maoD, soma(SOM, [-0.04, 0.34, 0.05]), abaixa);
      lia.giroTorso = -0.5 * Math.max(aperta, abaixa);
      lia.cabeca = mixV(lia.cabeca, olharPara(LIA, lia, BOTAO_SOM), Math.max(aperta, abaixa));
    }
    return (
      <Palco cam={aproximar(CAM_SOM, em(1) ? p(1) * 0.5 : 0.5 + p(2) * 0.5)}>
        <Balcao />
        <CaixaDeSom pulsa={volume * Math.abs(Math.sin(f * 0.33))} />
        <Liquidificador ligado={0} f={f} />
        <Notas f={f} volume={volume} />
        <Boneco m={LIA} p={lia} />
      </Palco>
    );
  }
  // o liquidificador começa de surpresa, ligado por outra pessoa
  if (em(3)) {
    const x = p(3);
    const liga = prog(x, 0.2, 0.22);
    return <CenaLiq f={f} ligado={liga} tapa={prog(x, 0.24, 0.36)} susto={prog(x, 0.2, 0.3)} mao={k(x, [[0, 0], [0.18, 1], [0.6, 1], [0.8, 0.3]])} cam={aproximar(CAM_LIQ, x * 0.5)} />;
  }
  if (em(4))
    return (
      <>
        <CenaLiq f={f} ligado={1} tapa={1} mao={0.3} cam={aproximar(CAM_LIQ, 0.5 + p(4) * 0.5)} />
        <Conceito f={f} de={F[4].de + 20} ate={F[5].de - 4} texto="processamento sensorial" />
      </>
    );
  if (em(5)) return <Comparacao q={q} />;
  // em que momento o desconforto aparece?
  if (em(6)) return <CenaLiq f={f} ligado={0} tapa={0} mao={0} cam={CAM_LIQ} />;
  const x = em(7) ? p(7) : 1;
  const parte = Math.min(2, Math.floor(x * 3));
  const y = (x * 3) % 1;
  const estado = em(7)
    ? parte === 0
      ? { ligado: prog(y, 0.25, 0.3), tapa: prog(y, 0.4, 0.7) * 0.6, mao: k(y, [[0, 0.4], [0.25, 1]]), susto: prog(y, 0.25, 0.5) }
      : parte === 1
        ? { ligado: 1, tapa: 1, mao: 0.3, susto: 0 }
        : { ligado: 0, tapa: prog(y, 0.1, 0.35), mao: k(y, [[0.1, 0], [0.9, 0.75]]), susto: 0 }
    : { ligado: 0, tapa: 1, mao: 0.75, susto: 0 };
  return (
    <>
      <CenaLiq f={f} {...estado} cam={CAM_LIQ} />
      {em(7) && <Etapas itens={["Quando começa", "Enquanto dura", "Antes de ligar"]} aceso={parte} opacidade={prog(x, 0, 0.05)} />}
    </>
  );
};

export const { Componente: ExplicaMenteLiquidificador, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });


