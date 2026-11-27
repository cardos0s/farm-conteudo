import React from "react";
import { AbsoluteFill } from "remotion";
import { ADULTO, Boneco } from "../Boneco";
import { MARCA } from "../Legendas";
import { Tenis } from "../Tenis";
import { elastico, fala, k, mix, mixV, prog, soma, type V3 } from "../anim";
import { Cartao, Fileira, Sapateira, SAPATEIRA } from "../instrucoes/Video";
import { Conceito, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Visao, diante, entre, olhar, type Olhos } from "../kit/Pov";
import { emPe, olharPara } from "../kit/poses";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const TENIS: V3 = [0.32, 0, -0.15];
const NO_ADULTO: Olhos = { pos: [0.05, 0.95, 0.35], giro: -0.25, baixa: -0.5 };
const NO_TENIS: Olhos = { pos: [0.12, 0.95, 0.2], giro: 0.5, baixa: 1.05 };
const NA_SAPATEIRA: Olhos = { pos: [0.4, 0.95, -0.3], giro: 0.15, baixa: 0.95 };
const PERDIDA: Olhos = { pos: [0.55, 0.95, 0.3], giro: -0.75, baixa: -0.38 };

type Est = { o: Olhos; fala?: boolean; tenis: "chao" | "mao" | "guardado"; pega?: number; solta?: number; tensao?: number; alivio?: number; andando?: number };

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const cam = olhar(e.o, f, { andando: e.andando });
  const adulto = emPe(ADULTO, [-0.2, 0, -0.5], 0.25, f, 2);
  adulto.boca = e.fala ? fala(f, 2) : 0;
  adulto.inclina = 0.16;
  adulto.maoD = [adulto.pos[0] + 0.05, 1.2 + 0.03 * Math.sin(f * 0.3), adulto.pos[2] + 0.3];
  adulto.cabeca = olharPara(ADULTO, adulto, cam.pos, 0.6);
  const naMao = diante(cam, 0.14, -0.3, 0.45);
  const guardado = soma(SAPATEIRA, [0.02, 0.04, 0.02]);
  const posTenis = e.tenis === "chao" ? TENIS : e.tenis === "guardado" ? guardado : mixV(naMao, guardado, e.solta ?? 0);
  return (
    <Visao cam={cam} tensao={e.tensao ?? 0} alivio={e.alivio ?? 0}>
      <Sapateira />
      <Boneco m={ADULTO} p={adulto} />
      <group position={posTenis} rotation={[0, e.tenis === "mao" ? e.o.giro * -1 + 0.4 : 0.6, 0]}>
        <Tenis />
      </group>
      <MaoPov cam={cam} alvo={e.tenis === "mao" ? soma(posTenis, [0.02, 0.1, 0.05]) : soma(TENIS, [0, 0.11, 0.02])} quanto={e.tenis === "mao" ? 1 - (e.solta ?? 0) * 0.3 : e.pega ?? 0} fecha={0.55} />
    </Visao>
  );
};

/** A memória de trabalho como uma bancada pequena: os cartões que não cabem escorregam. */
const Bancada: React.FC<{ p: number }> = ({ p }) => {
  const cai = (de: number) => prog(p, de, de + 0.22);
  return (
    <AbsoluteFill style={{ background: "rgba(255,244,228,0.92)", opacity: prog(p, 0, 0.08) }}>
      {[0, 1, 2].map((i) => {
        const c = i === 2 ? cai(0.35) : i === 1 ? cai(0.68) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: 60 + i * 325, top: 520 + c * 620, transform: `rotate(${c * (i === 2 ? 34 : -26)}deg)`, opacity: 1 - c * 0.85 }}>
            <Cartao i={i} presente={1} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 40, top: 792, width: 470 + 230 * (1 - prog(p, 0.3, 0.4)) + 300 * (1 - prog(p, 0.1, 0.2)), height: 46, borderRadius: 23, background: MARCA.roxo, boxShadow: "0 12px 26px rgba(36,26,74,0.25)" }} />
    </AbsoluteFill>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) {
    const x = p(0);
    return (
      <>
        <Cena f={f} e={{ o: NO_ADULTO, fala: true, tenis: "chao" }} />
        <Fileira presentes={[1, 1, 1]} entradas={[prog(x, 0.02, 0.14, elastico), prog(x, 0.34, 0.46, elastico), prog(x, 0.64, 0.76, elastico)]} />
      </>
    );
  }
  if (em(1))
    return (
      <>
        <Cena f={f} e={{ o: { ...NO_ADULTO, baixa: -0.5 + 0.1 * Math.max(0, Math.sin(f * 0.4)) }, tenis: "chao" }} />
        <Fileira presentes={[1, 1, 1]} />
      </>
    );
  if (em(2)) {
    const x = p(2);
    return (
      <>
        <Cena f={f} e={{ o: x < 0.6 ? entre(NO_ADULTO, NO_TENIS, prog(x, 0, 0.35)) : entre(NO_TENIS, NA_SAPATEIRA, prog(x, 0.6, 1)), tenis: x < 0.5 ? "chao" : "mao", pega: prog(x, 0.3, 0.48), andando: x > 0.6 ? 1 : 0, tensao: 0.25 * prog(x, 0.55, 0.9) }} />
        <Fileira presentes={[1, 1 - prog(x, 0.35, 0.8), 1 - prog(x, 0.55, 1)]} />
      </>
    );
  }
  if (em(3))
    return (
      <>
        <Cena f={f} e={{ o: NA_SAPATEIRA, tenis: p(3) < 0.75 ? "mao" : "guardado", solta: prog(p(3), 0.3, 0.75), alivio: 0.5 * prog(p(3), 0.75, 0.95) }} />
        <Fileira presentes={[1, 0, 0]} feitos={[prog(p(3), 0.78, 0.92, elastico), 0, 0]} />
      </>
    );
  if (em(4) || em(5))
    return (
      <>
        <Cena f={f} e={{ o: { ...entre(NA_SAPATEIRA, PERDIDA, em(4) ? prog(p(4), 0, 0.3) : 1), giro: -0.75 + 0.3 * Math.sin(f * 0.07) }, tenis: "guardado", tensao: em(4) ? 0.45 * prog(p(4), 0.2, 0.7) : 0.45 }} />
        <Fileira presentes={[1, 0, 0]} feitos={[1, 0, 0]} />
      </>
    );
  // --- a explicação ---
  if (em(6) || em(7)) {
    const some = em(7) ? p(7) : 0;
    return (
      <>
        <Cena f={f} e={{ o: PERDIDA, tenis: "guardado", tensao: 0.3 }} />
        <Fileira presentes={[1, em(6) ? prog(p(6), 0.3, 0.45) : 1 - prog(some, 0.3, 0.6), em(6) ? prog(p(6), 0.4, 0.55) : 1 - prog(some, 0.5, 0.8)]} feitos={[1, 0, 0]} />
      </>
    );
  }
  if (em(8))
    return (
      <>
        <Cena f={f} e={{ o: PERDIDA, tenis: "guardado", tensao: 0.3 }} />
        <Fileira presentes={[1, 0, 0]} feitos={[1, 0, 0]} />
        <Conceito f={f} de={F[8].de + 22} ate={F[9].de - 4} texto="memória de trabalho" topo={560} />
      </>
    );
  if (em(9))
    return (
      <>
        <Cena f={f} e={{ o: PERDIDA, tenis: "guardado", tensao: 0.3 }} />
        <Bancada p={p(9)} />
      </>
    );
  if (em(10)) return <Cena f={f} e={{ o: entre(PERDIDA, { pos: [0.3, 0.95, 0.3], giro: -0.56, baixa: -0.46 }, prog(p(10), 0, 0.3)), tenis: "guardado", fala: p(10) > 0.55 }} />;
  // --- o que testar ---
  const deFrente: Olhos = { pos: [0.3, 0.95, 0.3], giro: -0.56, baixa: -0.46 };
  if (em(11))
    return (
      <>
        <Cena f={f} e={{ o: deFrente, tenis: "guardado", fala: true }} />
        <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Cartao i={1} presente={1} grande entra={prog(p(11), 0.3, 0.45, elastico)} />
        </div>
      </>
    );
  const x = em(13) ? p(13) : em(12) ? 0 : 1;
  return (
    <>
      <Cena f={f} e={{ o: { ...deFrente, baixa: -0.62 }, tenis: "guardado", alivio: 0.5 * x }} />
      <Fileira presentes={[1, 1, 1]} feitos={[1, prog(x, 0.2, 0.35, elastico), prog(x, 0.55, 0.7, elastico)]} fixado opacidade={em(12) ? prog(p(12), 0.2, 0.32) : 1} />
    </>
  );
};

export const { Componente: ExplicaMenteInstrucoespov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });

