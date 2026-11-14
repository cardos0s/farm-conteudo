import React from "react";
import { ADULTO, Boneco, LIA, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa } from "../Pecas";
import { Tenis } from "../Tenis";
import { elastico, fala, k, mix, mixV, prog, sair, soma, type V3 } from "../anim";
import { Conceito, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { andando, emPe, olharPara } from "../kit/poses";
import { PASSOS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

// ---------- cartões das instruções (2D) ----------
const Icone: React.FC<{ i: number; cor: string }> = ({ i, cor }) => (
  <svg width="110" height="110" viewBox="0 0 100 100">
    {i === 0 && (
      <>
        <path d="M12 66 L12 44 Q12 34 24 34 L40 34 L52 50 Q70 52 84 60 Q90 64 88 70 L88 74 L12 74 Z" fill={cor} />
        <rect x="10" y="72" width="80" height="10" rx="5" fill={MARCA.tinta} />
      </>
    )}
    {i === 1 && (
      <>
        <path d="M50 10 Q78 48 78 64 A28 28 0 0 1 22 64 Q22 48 50 10 Z" fill={cor} />
        <path d="M36 62 Q36 76 50 80" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />
      </>
    )}
    {i === 2 && (
      <>
        <circle cx="50" cy="52" r="34" fill={cor} />
        <circle cx="50" cy="52" r="20" fill="#FFFFFF" opacity="0.85" />
        <rect x="6" y="20" width="7" height="64" rx="3.5" fill={MARCA.tinta} />
        <rect x="87" y="20" width="7" height="64" rx="3.5" fill={MARCA.tinta} />
      </>
    )}
  </svg>
);

/** `presente` 1 = na cabeça, 0 = sumiu (vira contorno tracejado). */
const Cartao: React.FC<{ i: number; presente: number; feito?: number; entra?: number; grande?: boolean; fixado?: boolean }> = ({ i, presente, feito = 0, entra = 1, grande, fixado }) => {
  const cores = [MARCA.coral, "#3D9BE9", MARCA.menta];
  const L = grande ? 420 : 312;
  return (
    <div style={{ position: "relative", width: L, height: grande ? 330 : 258, transform: `scale(${Math.max(0.001, entra)})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 34, border: `6px dashed ${MARCA.roxo}`, opacity: 0.35 * (1 - presente) }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#FFFFFF", boxShadow: "0 12px 30px rgba(36,26,74,0.2)", opacity: presente, transform: `scale(${0.82 + 0.18 * presente}) translateY(${(1 - presente) * -24}px)`, filter: `blur(${(1 - presente) * 7}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Icone i={i} cor={cores[i]} />
        <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: grande ? 44 : 32, color: MARCA.tinta, textAlign: "center", lineHeight: 1.1, padding: "0 14px" }}>{PASSOS[i]}</div>
      </div>
      {fixado && <div style={{ position: "absolute", top: -14, left: "50%", marginLeft: -15, width: 30, height: 30, borderRadius: "50%", background: MARCA.coral, boxShadow: "0 4px 8px rgba(0,0,0,0.25)" }} />}
      {feito > 0.01 && (
        <div style={{ position: "absolute", right: -12, bottom: -12, width: 84, height: 84, borderRadius: "50%", background: "#2FB36B", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${feito})`, boxShadow: "0 6px 14px rgba(0,0,0,0.25)" }}>
          <svg width="50" height="50" viewBox="0 0 50 50">
            <path d="M10 26 L21 37 L40 14" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
};

const Fileira: React.FC<{ presentes: number[]; feitos?: number[]; entradas?: number[]; fixado?: boolean; opacidade?: number }> = ({ presentes, feitos = [0, 0, 0], entradas = [1, 1, 1], fixado, opacidade = 1 }) => (
  <div style={{ position: "absolute", top: 232, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20, opacity: opacidade, ...(fixado ? { top: 214, left: 30, right: 30, padding: "40px 0 34px", background: "#E9C79A", borderRadius: 40, boxShadow: "inset 0 0 0 12px #C99861" } : {}) }}>
    {[0, 1, 2].map((i) => (
      <Cartao key={i} i={i} presente={presentes[i]} feito={feitos[i]} entra={entradas[i]} fixado={fixado} />
    ))}
  </div>
);

// ---------- cena 3D ----------
const INICIO: V3 = [0.05, 0, -0.25];
const TENIS_NO_CHAO: V3 = [-0.28, 0, -0.1];
const JUNTO_DO_TENIS: V3 = [-0.14, 0, -0.26];
const SAPATEIRA: V3 = [0.5, 0, -0.95];
const JUNTO_DA_SAPATEIRA: V3 = [0.38, 0, -0.55];
const CAM: Cam = { pos: [0, 1.0, 3.7], alvo: [0.05, 0.6, -0.4], fov: 34 };

const Sapateira: React.FC = () => (
  <group position={SAPATEIRA}>
    <Caixa t={[0.5, 0.04, 0.34]} raio={0.012} pos={[0, 0.02, 0]} cor="#2EC4B6" />
    <Caixa t={[0.5, 0.26, 0.04]} raio={0.012} pos={[0, 0.13, -0.15]} cor="#2EC4B6" />
    <Caixa t={[0.04, 0.26, 0.34]} raio={0.012} pos={[-0.23, 0.13, 0]} cor="#2EC4B6" />
    <Caixa t={[0.04, 0.26, 0.34]} raio={0.012} pos={[0.23, 0.13, 0]} cor="#2EC4B6" />
  </group>
);

/** Lia guarda o tênis: anda até ele, abaixa, pega, leva até a sapateira e solta. `x` 0..1. */
const guardando = (f: number, x: number): { lia: Pose; tenis: { pos: V3; rot: V3 } } => {
  const naSapateira: V3 = soma(SAPATEIRA, [0.02, 0.04, 0.02]);
  if (x < 0.14) return { lia: andando(LIA, INICIO, JUNTO_DO_TENIS, x / 0.14, f), tenis: { pos: TENIS_NO_CHAO, rot: [0, 0.6, 0] } };
  if (x < 0.4) {
    const desce = k(x, [[0.14, 0], [0.24, 1], [0.3, 1], [0.4, 0]]);
    const p = emPe(LIA, JUNTO_DO_TENIS, -0.75, f);
    const mao: V3 = mixV(p.maoD, soma(TENIS_NO_CHAO, [0, 0.11, 0]), desce);
    const pegou = x > 0.27;
    return {
      lia: { ...p, pos: [p.pos[0], p.pos[1] - 0.2 * desce, p.pos[2]], inclina: 0.03 + 0.75 * desce, maoD: pegou ? mixV(soma(TENIS_NO_CHAO, [0, 0.11, 0]), [p.pos[0] - 0.16, 0.42, p.pos[2] + 0.1], prog(x, 0.3, 0.4)) : mao, cabeca: [0.2 * desce, 0, 0] },
      tenis: pegou ? { pos: soma(mixV(soma(TENIS_NO_CHAO, [0, 0.11, 0]), [p.pos[0] - 0.16, 0.42, p.pos[2] + 0.1], prog(x, 0.3, 0.4)), [0, -0.1, 0]), rot: [0.15, 0.6, 0] } : { pos: TENIS_NO_CHAO, rot: [0, 0.6, 0] },
    };
  }
  if (x < 0.82) {
    const p = andando(LIA, JUNTO_DO_TENIS, JUNTO_DA_SAPATEIRA, (x - 0.4) / 0.42, f);
    const mao: V3 = [p.pos[0] + 0.12, 0.42, p.pos[2] + 0.14];
    return { lia: { ...p, maoD: mao }, tenis: { pos: soma(mao, [0, -0.1, 0]), rot: [0.15, p.yaw, 0] } };
  }
  const solta = prog(x, 0.82, 0.94);
  const p = emPe(LIA, JUNTO_DA_SAPATEIRA, 0.3, f);
  const segura: V3 = [p.pos[0] + 0.12, 0.42, p.pos[2] + 0.14];
  const mao = mixV(segura, soma(naSapateira, [0, 0.16, 0.05]), solta);
  return { lia: { ...p, inclina: 0.03 + 0.4 * solta, maoD: mixV(mao, p.maoD, prog(x, 0.95, 1)) }, tenis: { pos: mixV(soma(segura, [0, -0.1, 0]), naSapateira, solta), rot: [0.15 * (1 - solta), mix(0.3, 1.2, solta), 0] } };
};

const Cena: React.FC<{ f: number; lia: Pose; tenis: { pos: V3; rot: V3 }; adulto?: Pose; cam?: Cam }> = ({ lia, tenis, adulto, cam = CAM }) => (
  <Palco cam={cam}>
    <Sapateira />
    <Boneco m={LIA} p={lia} />
    {adulto && <Boneco m={ADULTO} p={adulto} />}
    <group position={tenis.pos} rotation={[tenis.rot[0], tenis.rot[1], tenis.rot[2], "YXZ"]}>
      <Tenis />
    </group>
  </Palco>
);

const GUARDADO = { pos: soma(SAPATEIRA, [0.02, 0.04, 0.02]) as V3, rot: [0, 1.2, 0] as V3 };

const perdida = (f: number, pos: V3): Pose => {
  const p = emPe(LIA, pos, 0.1, f);
  const vira = Math.sin(f * 0.07);
  return { ...p, cabeca: [-0.05, 0.6 * vira, 0.08], maoD: [p.pos[0] - 0.13, p.pos[1] + 0.52, p.pos[2] + 0.1], sobr: 0.7, sorriso: -0.15 };
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // gancho: o primeiro passo foi feito, os outros dois sumiram
  if (em(0)) return (
    <>
      <Cena f={f} lia={perdida(f, JUNTO_DA_SAPATEIRA)} tenis={GUARDADO} />
      <Fileira presentes={[1, 0, 0]} feitos={[1, 0, 0]} opacidade={prog(p(0), 0, 0.1)} />
    </>
  );
  // os três pedidos
  if (em(1)) {
    const x = p(1);
    const adulto = emPe(ADULTO, [-0.42, 0, -0.5], 0.75, f, 2);
    adulto.boca = x < 0.62 ? fala(f, 2) : 0;
    adulto.maoD = [adulto.pos[0] + 0.06, 1.2 + 0.03 * Math.sin(f * 0.3), adulto.pos[2] + 0.3];
    adulto.inclina = 0.14;
    const lia = emPe(LIA, INICIO, -0.6, f);
    adulto.cabeca = olharPara(ADULTO, adulto, [lia.pos[0], 0.95, lia.pos[2]], 0.55);
    lia.cabeca = soma(olharPara(LIA, lia, [adulto.pos[0], 1.5, adulto.pos[2]]), [0.12 * Math.max(0, Math.sin(f * 0.35)) * prog(x, 0.6, 0.7), 0, 0]);
    return (
      <>
        <Cena f={f} lia={lia} adulto={adulto} tenis={{ pos: TENIS_NO_CHAO, rot: [0, 0.6, 0] }} cam={{ pos: [-0.1, 1.0, 3.7], alvo: [-0.12, 0.72, -0.4], fov: 34 }} />
        <div style={{ position: "absolute", top: 220, right: 50, display: "flex", flexDirection: "column", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <Cartao key={i} i={i} presente={1} entra={prog(x, 0.02 + i * 0.2, 0.12 + i * 0.2, elastico)} />
          ))}
        </div>
      </>
    );
  }
  // enquanto guarda o tênis, os outros dois somem
  if (em(2)) {
    const x = p(2);
    const g = guardando(f, x);
    return (
      <>
        <Cena f={f} {...g} />
        <Fileira presentes={[1, 1 - prog(x, 0.25, 0.6), 1 - prog(x, 0.45, 0.85)]} feitos={[prog(x, 0.92, 1, elastico), 0, 0]} />
      </>
    );
  }
  if (em(3) || em(4))
    return (
      <>
        <Cena f={f} lia={perdida(f, JUNTO_DA_SAPATEIRA)} tenis={GUARDADO} cam={{ ...CAM, pos: mixV(CAM.pos, [0.2, 0.95, 3.0], em(3) ? p(3) : 1), alvo: mixV(CAM.alvo, [0.3, 0.6, -0.5], em(3) ? p(3) : 1) }} />
        <Fileira presentes={[1, 0, 0]} feitos={[1, 0, 0]} />
        <Conceito f={f} de={F[3].de + 30} ate={F[5].de - 4} texto="memória de trabalho" topo={540} />
      </>
    );
  // um passo de cada vez, ou os três à vista
  if (em(5)) {
    const x = p(5);
    if (x < 0.5) {
      const lia = andando(LIA, JUNTO_DA_SAPATEIRA, [-1.0, 0, -0.35], prog(x, 0.14, 0.5, (t) => t), f);
      return (
        <>
          <Cena f={f} lia={lia} tenis={GUARDADO} />
          <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <Cartao i={1} presente={1} grande entra={prog(x, 0.02, 0.12, elastico)} />
          </div>
        </>
      );
    }
    const lia = emPe(LIA, INICIO, 0, f);
    lia.cabeca = [-0.4, 0, 0];
    return (
      <>
        <Cena f={f} lia={lia} tenis={GUARDADO} />
        <Fileira presentes={[1, 1, 1]} feitos={[1, 0, 0]} fixado opacidade={prog(x, 0.5, 0.56)} />
      </>
    );
  }
  // e repara no que muda: os três passos feitos
  const x = em(6) ? p(6) : 1;
  const lia = emPe(LIA, INICIO, 0, f);
  const festa = prog(x, 0.6, 0.8, elastico);
  lia.maoE = mixV(lia.maoE, [lia.pos[0] + 0.26, 1.0, lia.pos[2] + 0.05], festa);
  lia.maoD = mixV(lia.maoD, [lia.pos[0] - 0.26, 1.0, lia.pos[2] + 0.05], festa);
  lia.sorriso = 1;
  lia.cabeca = [-0.4 * (1 - festa), 0, 0];
  return (
    <>
      <Cena f={f} lia={lia} tenis={GUARDADO} />
      <Fileira presentes={[1, 1, 1]} feitos={[1, prog(x, 0.1, 0.25, elastico), prog(x, 0.4, 0.55, elastico)]} fixado />
    </>
  );
};

export const { Componente: ExplicaMenteInstrucoes, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
