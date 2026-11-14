import React, { useLayoutEffect } from "react";
import "../../lousa/fontes";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { PerspectiveCamera } from "three";
import { Boneco, LIA } from "../Boneco";
import { Sala } from "../Cenario";
import { Final, Legenda, MARCA } from "../Legendas";
import { Esfera } from "../Pecas";
import { elastico, limitar, prog, sair } from "../anim";
import { FONTE_LOUSA } from "../../lousa/fontes";
import { ALTURA, LARGURA } from "../roteiro";
import { CORES, Colher, Luz, Mancha, Mao, Mesa, Tigela } from "./Objetos";
import { estado, quadro1, quadro2, quadro3, type EstadoMesa } from "./coreografia";
import { CARTAO, CORTES, FALAS, FINAL, PASSOS, ROTULO } from "./roteiro";
import { noRoteiro } from "./tempo";

const POPPINS = "Poppins, sans-serif";

const Camera: React.FC<{ cam: EstadoMesa["cam"] }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.near = 0.1;
    camera.far = 30;
    camera.lookAt(...cam.alvo);
    camera.updateProjectionMatrix();
  });
  return null;
};

const Cena: React.FC<{ e: EstadoMesa; largura: number; altura: number }> = ({ e, largura, altura }) => (
  <ThreeCanvas width={largura} height={altura} shadows flat camera={{ fov: e.cam.fov, position: e.cam.pos }} style={{ backgroundColor: "#FFF0DA" }}>
    <Camera cam={e.cam} />
    <color attach="background" args={["#FFF0DA"]} />
    <hemisphereLight args={["#FFFFFF", "#F3D9B5", 1.55]} />
    <directionalLight
      position={[-1.6, 3.2, 2.4]}
      intensity={1.75}
      color="#FFF6E8"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-1.6}
      shadow-camera-right={1.6}
      shadow-camera-top={1.6}
      shadow-camera-bottom={-1.6}
      shadow-camera-near={0.5}
      shadow-camera-far={10}
      shadow-bias={-0.0005}
      shadow-normalBias={0.008}
    />
    <directionalLight position={[3, 1.5, 2.5]} intensity={0.35} color="#E6DCFF" />
    <group position={[0, -0.62, 0.15]}>
      <Sala />
    </group>
    <Mesa />
    {e.tigela && <Tigela pos={[0, 0, 0]} />}
    {e.lia && <Boneco m={LIA} p={e.lia} />}
    <group position={e.colher.pos} rotation={[e.colher.rot[0], e.colher.rot[1], e.colher.rot[2], "YXZ"]}>
      <Colher comida={e.colher.comida} />
    </group>
    {e.mao && (
      <group position={e.mao.pos} rotation={[e.mao.rot[0], e.mao.rot[1], e.mao.rot[2], "YXZ"]}>
        <Mao fecha={e.mao.fecha} />
      </group>
    )}
    {e.gota && <Esfera r={0.016} pos={e.gota} cor={CORES.comida} rug={0.8} />}
    {e.manchas.map((m, i) => (
      <Mancha key={i} {...m} />
    ))}
    {e.luzes.map((l, i) => (
      <Luz key={i} {...l} />
    ))}
  </ThreeCanvas>
);

const Passo: React.FC<{ i: number; aceso: boolean; grande?: boolean }> = ({ i, aceso, grande }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, background: aceso ? MARCA.roxo : "#FFFFFF", color: aceso ? "#FFFFFF" : MARCA.tinta, borderRadius: 999, padding: grande ? "10px 26px 8px 10px" : "8px 20px 6px 8px", fontFamily: POPPINS, fontWeight: 700, fontSize: grande ? 34 : 27, boxShadow: "0 8px 22px rgba(36,26,74,0.18)", whiteSpace: "nowrap" }}>
    <span style={{ width: grande ? 46 : 38, height: grande ? 46 : 38, borderRadius: "50%", background: aceso ? MARCA.sol : MARCA.roxo, color: aceso ? MARCA.tinta : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{i + 1}</span>
    {PASSOS[i]}
  </div>
);

/** Qual quadro está em destaque em cada momento (null = todos). */
const destaque = (f: number): number[] | null => {
  const fl = (i: number) => FALAS[i - 1];
  if (f >= fl(8).de - 4 && f < fl(9).de - 4) return [0];
  if (f >= fl(9).de - 4 && f < fl(10).de - 4) return [2];
  if (f >= fl(10).de - 4 && f < fl(11).de - 4) return [0, 2];
  return null;
};

const Quadros: React.FC<{ f: number }> = ({ f }) => {
  const L = 980;
  const A = 364;
  const estados = [quadro1(f), quadro2(f), quadro3(f)];
  const d = destaque(f);
  return (
    <AbsoluteFill style={{ background: MARCA.creme }}>
      {estados.map((e, i) => {
        const entra = prog(f, CORTES.quadros + 2 + i * 14, CORTES.quadros + 18 + i * 14, elastico);
        const aceso = !d || d.includes(i);
        return (
          <div key={i} style={{ position: "absolute", left: 50, top: 196 + i * (A + 18), width: L, height: A, borderRadius: 36, overflow: "hidden", transform: `scale(${Math.max(0.001, entra)})`, opacity: aceso ? 1 : 0.38, outline: `${d && aceso ? 10 : 0}px solid ${MARCA.roxo}`, outlineOffset: -10, boxShadow: "0 12px 30px rgba(36,26,74,0.18)" }}>
            <Cena e={e} largura={L} altura={A} />
            <div style={{ position: "absolute", left: 22, top: 20 }}>
              <Passo i={i} aceso={!!d && aceso} grande />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  if (f < ROTULO.de || f >= ROTULO.ate) return null;
  const p = prog(f, ROTULO.de, ROTULO.de + 12, elastico);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 330, transform: `scale(${p})`, background: MARCA.sol, color: MARCA.tinta, fontFamily: POPPINS, fontWeight: 800, fontSize: 78, padding: "26px 56px 20px", borderRadius: 40, boxShadow: "0 18px 44px rgba(36,26,74,0.25)" }}>{ROTULO.texto}</div>
    </AbsoluteFill>
  );
};

const PassosEmCasa: React.FC<{ f: number }> = ({ f }) => {
  const fl = FALAS[13];
  if (f < fl.de - 8 || f >= CORTES.cartao) return null;
  const p = prog(f, fl.de - 8, fl.de + 4, sair) * (1 - prog(f, CORTES.cartao - 8, CORTES.cartao));
  const qual = Math.min(2, Math.floor(limitar((f - fl.de) / (fl.ate - fl.de)) * 3));
  return (
    <div style={{ position: "absolute", top: 236, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14, opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
      {[0, 1, 2].map((i) => (
        <Passo key={i} i={i} aceso={f >= fl.de && i === qual} />
      ))}
    </div>
  );
};

/** O cartão: a frase vaga é riscada e dá lugar ao que foi observado. */
const Cartao: React.FC<{ f: number }> = ({ f }) => {
  if (f < CORTES.cartao || f >= CORTES.fim + 10) return null;
  const entra = prog(f, CORTES.cartao, CORTES.cartao + 12, elastico);
  const sai = prog(f, CORTES.fim - 2, CORTES.fim + 10);
  const risco = prog(f, CORTES.troca, CORTES.troca + 12);
  const n = Math.round(limitar((f - CORTES.troca - 10) / 44) * CARTAO.depois.length);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 760, width: 880, minHeight: 470, boxSizing: "border-box", padding: "70px 60px 50px", background: "#FFFDF6", borderRadius: 26, boxShadow: "0 24px 60px rgba(36,26,74,0.28)", transform: `translateY(${(1 - entra) * 600 + sai * 900}px) rotate(${-1.5 + (1 - entra) * 5}deg)` }}>
        <div style={{ position: "absolute", top: -26, left: "50%", marginLeft: -110, width: 220, height: 62, borderRadius: 16, background: "#8B8FA8", boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.15)" }} />
        <div style={{ position: "relative", display: "inline-block", fontFamily: FONTE_LOUSA, fontSize: 70 - 14 * risco, lineHeight: 1.2, color: MARCA.tinta, opacity: 1 - 0.5 * risco }}>
          {CARTAO.antes}
          <div style={{ position: "absolute", left: -8, top: "52%", height: 7, borderRadius: 4, width: `calc(${risco * 100}% + ${16 * risco}px)`, background: MARCA.coral }} />
        </div>
        <div style={{ marginTop: 26, fontFamily: FONTE_LOUSA, fontSize: 68, lineHeight: 1.22, color: MARCA.roxo }}>
          {CARTAO.depois.slice(0, n)}
          <span style={{ color: "transparent" }}>{CARTAO.depois.slice(n)}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** "Explica, Mente!" · por que uma terapeuta ocupacional levaria uma colher pra sessão (1080×1920). */
export const ExplicaMenteColher: React.FC = () => {
  const f = noRoteiro(useCurrentFrame());
  const emQuadros = f >= CORTES.quadros && f < CORTES.casa;
  return (
    <AbsoluteFill style={{ background: MARCA.creme }}>
      {!emQuadros && f < FINAL.de + 14 && <Cena e={estado(f)} largura={LARGURA} altura={ALTURA} />}
      {emQuadros && <Quadros f={f} />}
      <Rotulo f={f} />
      <PassosEmCasa f={f} />
      <Cartao f={f} />
      <Legenda f={f} falas={FALAS} />
      <Final f={f} final={FINAL} />
    </AbsoluteFill>
  );
};
