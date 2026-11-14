import React from "react";
import { AbsoluteFill } from "remotion";
import { ADULTO, Boneco, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera, Seg } from "../Pecas";
import { elastico, mix, prog, type V3 } from "../anim";
import { Sofa } from "../coracao/Video";
import { Conceito, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { andando, olharPara, sentado } from "../kit/poses";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0.15, 1.05, 3.1], alvo: [0.2, 0.75, -0.8], fov: 34 };
const NO_SUPORTE: V3 = [1.0, 0.1, -0.75];

const Violao: React.FC<{ pos: V3; rot: V3 }> = ({ pos, rot }) => (
  <group position={pos} rotation={[rot[0], rot[1], rot[2], "YXZ"]}>
    <Esfera r={1} escala={[0.2, 0.17, 0.06]} pos={[0, 0.17, 0]} cor="#D99B5B" />
    <Esfera r={1} escala={[0.15, 0.13, 0.058]} pos={[0, 0.4, 0]} cor="#D99B5B" />
    <Cilindro r={0.05} h={0.012} pos={[0, 0.3, 0.056]} rot={[Math.PI / 2, 0, 0]} cor="#4A2E1C" sombra={false} />
    <Caixa t={[0.1, 0.02, 0.02]} raio={0.005} pos={[0, 0.14, 0.06]} cor="#4A2E1C" sombra={false} />
    <Seg a={[0, 0.5, 0.02]} b={[0, 0.98, 0.02]} r={0.022} cor="#6B4226" />
    <Caixa t={[0.07, 0.13, 0.03]} raio={0.01} pos={[0, 1.04, 0.02]} cor="#4A2E1C" />
  </group>
);

const Suporte: React.FC = () => (
  <>
    <Seg a={[NO_SUPORTE[0] - 0.14, 0, NO_SUPORTE[2] + 0.1]} b={[NO_SUPORTE[0], 0.42, NO_SUPORTE[2] - 0.08]} r={0.014} cor="#2B2F55" />
    <Seg a={[NO_SUPORTE[0] + 0.14, 0, NO_SUPORTE[2] + 0.1]} b={[NO_SUPORTE[0], 0.42, NO_SUPORTE[2] - 0.08]} r={0.014} cor="#2B2F55" />
    <Seg a={[NO_SUPORTE[0], 0, NO_SUPORTE[2] - 0.22]} b={[NO_SUPORTE[0], 0.42, NO_SUPORTE[2] - 0.08]} r={0.014} cor="#2B2F55" />
  </>
);

/** `modo`: "olha" (sentada, olhando o violão), "toca" (tocando, como antes) ou "passa" (passa andando, t 0..1). */
const Cena: React.FC<{ f: number; modo: "olha" | "toca" | "passa"; t?: number; luz?: number; cam?: Cam }> = ({ f, modo, t = 0, luz = 1, cam = CAM }) => {
  let pose: Pose;
  let violao = { pos: NO_SUPORTE, rot: [-0.18, -0.25, 0] as V3 };
  if (modo === "passa") {
    pose = andando(ADULTO, [-1.35, 0, -0.2], [1.75, 0, -0.2], t, f);
    pose = { ...pose, sorriso: 0.1, cabeca: [0.08, 0, 0] };
  } else {
    pose = sentado(ADULTO, [0, 0, -0.86], 0, 0.42, f);
    if (modo === "toca") {
      const bate = Math.sin(f * 0.5);
      violao = { pos: [0.3, 0.52, -0.52], rot: [0.25, 0, 1.25] };
      pose = { ...pose, maoE: [0.68, 0.86, -0.5], maoD: [-0.08, 0.7 + 0.04 * bate, -0.42], inclina: 0.14, tomba: 0.05 * Math.sin(f * 0.25), cabeca: [0.12, 0, 0.1 * Math.sin(f * 0.25)], sorriso: 1 };
    } else {
      pose = { ...pose, sorriso: 0.05, sobr: 0.15, cabeca: olharPara(ADULTO, pose, [NO_SUPORTE[0], 0.6, NO_SUPORTE[2]], 0.8) };
    }
  }
  return (
    <>
      <Palco cam={cam}>
        <Sofa />
        <Suporte />
        <Violao {...violao} />
        <Boneco m={ADULTO} p={pose} />
        {modo === "toca" &&
          [0, 1, 2].map((i) => {
            const u = ((f + i * 22) % 66) / 66;
            return <Esfera key={i} r={0.035 * Math.min(1, u * 5, (1 - u) * 4)} pos={[0.35 + 0.1 * Math.sin(u * 6 + i), 0.95 + u * 0.5, -0.4]} cor={i % 2 ? "#2EC4B6" : "#FFC53D"} sombra={false} />;
          })}
      </Palco>
      <AbsoluteFill style={{ background: "#241A4A", opacity: 0.38 * (1 - luz) }} />
    </>
  );
};

// ---------- calendário ----------
type Dia = 0 | 1 | 2; // 0 = sem dia, 1 = tocou, 2 = não tocou
const Calendario: React.FC<{ dias: Dia[]; mostra: number; destaque?: [number, number]; titulo: string }> = ({ dias, mostra, destaque, titulo }) => (
  <div style={{ position: "absolute", top: 236, left: 60, right: 60, background: "#FFFFFF", borderRadius: 44, padding: "34px 36px 40px", boxShadow: "0 16px 40px rgba(36,26,74,0.2)" }}>
    <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 44, color: MARCA.tinta, textAlign: "center", marginBottom: 18 }}>{titulo}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
      {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
        <div key={i} style={{ fontFamily: POPPINS, fontWeight: 700, fontSize: 30, color: "#8B8FA8", textAlign: "center" }}>{d}</div>
      ))}
      {dias.map((d, i) => {
        const p = prog(mostra * dias.length, i, i + 1.5, elastico);
        const emDestaque = destaque && i >= destaque[0] && i <= destaque[1];
        return (
          <div key={i} style={{ aspectRatio: "1", borderRadius: 22, background: d === 1 ? "#FFE9B8" : d === 2 ? "#EDEAF2" : "transparent", outline: emDestaque ? `6px solid ${MARCA.coral}` : "none", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${d === 0 ? 1 : Math.max(0.001, p)})` }}>
            {d !== 0 && (
              <svg width="64" height="64" viewBox="0 0 64 64" opacity={d === 1 ? 1 : 0.35}>
                <ellipse cx="32" cy="44" rx="15" ry="13" fill={d === 1 ? "#D9892B" : "#8B8FA8"} />
                <ellipse cx="32" cy="28" rx="11" ry="9" fill={d === 1 ? "#D9892B" : "#8B8FA8"} />
                <rect x="29.5" y="4" width="5" height="22" rx="2" fill={d === 1 ? "#6B4226" : "#8B8FA8"} />
                <circle cx="32" cy="38" r="4.5" fill="#FFFFFF" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const T: Dia = 1;
const N: Dia = 2;
/** Um mês em que o violão vai ficando de lado. */
const MES_MUDANCA: Dia[] = [T, T, N, T, T, T, T, T, N, T, T, N, T, N, N, T, N, N, N, N, N, N, N, N, N, N, N, N];
/** Um mês comum, com um dia ruim no meio. */
const MES_DIA_RUIM: Dia[] = [T, T, N, T, T, T, T, T, T, T, N, T, T, T, T, N, T, T, T, T, T, T, T, T, N, T, T, T];

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) return <Cena f={f} modo="olha" cam={{ ...CAM, pos: [0.15, 1.05, mix(2.6, 3.1, p(0))] }} />;
  if (em(1)) {
    // os dias passam: a luz muda, a pessoa passa, o violão fica
    const x = p(1);
    const dia = (x * 3) % 1;
    return <Cena f={f} modo="passa" t={dia} luz={0.5 + 0.5 * Math.cos(x * 3 * 2 * Math.PI)} />;
  }
  if (em(2)) return p(2) < 0.5 ? <Cena f={f} modo="toca" /> : <Cena f={f} modo="olha" />;
  if (em(3))
    return (
      <>
        <Cena f={f} modo="olha" />
        <Conceito f={f} de={F[3].de + 4} ate={F[4].de - 4} texto="anedonia" />
      </>
    );
  if (em(4)) {
    const x = p(4);
    return (
      <AbsoluteFill style={{ background: MARCA.creme }}>
        <Calendario dias={MES_DIA_RUIM} mostra={prog(x, 0.02, 0.4, (v) => v)} destaque={x > 0.55 ? [15, 15] : undefined} titulo="Um dia ruim" />
      </AbsoluteFill>
    );
  }
  const x = em(5) ? p(5) : 1;
  return (
    <AbsoluteFill style={{ background: MARCA.creme }}>
      <Calendario dias={MES_MUDANCA} mostra={prog(x, 0.02, 0.4, (v) => v)} destaque={x > 0.5 ? [16, 27] : undefined} titulo="Uma mudança que persiste" />
    </AbsoluteFill>
  );
};

export const { Componente: ExplicaMenteHobby, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
