import React from "react";
import { AbsoluteFill } from "remotion";
import { Euler, Matrix4, Vector3 } from "three";
import { MARCA } from "../Legendas";
import { Caixa } from "../Pecas";
import { elastico, k, limitar, mix, mixV, norm, prog, soma, sub, type V3 } from "../anim";
import { Mao } from "../colher/Objetos";
import { Sofa } from "../coracao/Video";
import { Conceito, POPPINS, Roda, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { MACANETA, Porta } from "../porta/Video";
import { CICLO, DUVIDA, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const OLHOS = 1.5;
const NA_PORTA: V3 = [0.16, OLHOS, -0.28];
const LONGE: V3 = [-1.55, OLHOS, -0.22];

/**
 * O que a pessoa vê. `s` 0 = diante da porta, 1 = longe; `vira` 0 = olhando a porta, 1 = de costas pra ela;
 * `duvida` aperta a visão; `alivio` clareia; `mao` leva a mão à maçaneta.
 */
type Olhar = { s: number; vira: number; duvida: number; alivio: number; mao: number; andando: number; puxa?: number };

const camera = (f: number, o: Olhar): Cam => {
  const passo = Math.abs(Math.sin(f * 0.34)) * o.andando;
  const pos = mixV(NA_PORTA, LONGE, o.s);
  pos[1] += 0.035 * passo - 0.03 * o.alivio;
  pos[2] += 0.02 * Math.sin(f * 0.17) * o.andando;
  // gira pelo lado da parede com a janela
  const a = -Math.PI * o.vira;
  const perto = 1 - limitar(o.s * 2);
  const baixa = -0.42 * perto * (1 - o.vira) - 0.06;
  const treme = 0.012 * Math.sin(f * 1.1) * o.duvida;
  return { pos, alvo: soma(pos, [Math.cos(a) + treme, baixa, Math.sin(a)]), fov: mix(58, 34, (o.puxa ?? 0)) };
};

/** A mão direita, vista de cima, indo até a maçaneta. */
const MaoPov: React.FC<{ f: number; cam: Cam; mao: number }> = ({ f, cam, mao }) => {
  if (mao < 0.01) return null;
  const testa = mao > 0.95 ? 0.012 * Math.sin(f * 0.9) : 0;
  const naMacaneta: V3 = [MACANETA[0] - 0.075, MACANETA[1] + 0.035 + testa, MACANETA[2] + 0.005];
  const descanso: V3 = [cam.pos[0] + 0.25, cam.pos[1] - 0.75, cam.pos[2] + 0.3];
  const pos = mixV(descanso, naMacaneta, mao);
  const cotovelo: V3 = [cam.pos[0] + 0.05, cam.pos[1] - 0.55, cam.pos[2] + 0.3];
  const y = norm(sub(pos, cotovelo));
  const zBruto: V3 = [0.15, -1, 0.1];
  const escalar = zBruto[0] * y[0] + zBruto[1] * y[1] + zBruto[2] * y[2];
  const z = norm([zBruto[0] - escalar * y[0], zBruto[1] - escalar * y[1], zBruto[2] - escalar * y[2]]);
  const x: V3 = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
  const e = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(...x), new Vector3(...y), new Vector3(...z)), "YXZ");
  return (
    <group position={pos} rotation={[e.x, e.y, e.z, "YXZ"]}>
      <Mao fecha={mix(0.3, 0.72, prog(mao, 0.7, 1))} />
    </group>
  );
};

/** O pensamento que insiste, escrito na frente dos olhos. */
const Pensamento: React.FC<{ f: number; forca: number; ecos?: number }> = ({ f, forca, ecos = 0 }) => {
  if (forca < 0.02) return null;
  const lugares = [
    [0, 0, 1],
    [-150, -210, 0.55],
    [170, 190, 0.5],
    [-120, 330, 0.4],
    [130, -360, 0.4],
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {lugares.slice(0, 1 + Math.round(ecos * 4)).map(([x, y, s], i) => (
        <div key={i} style={{ position: "absolute", top: 720 + y, left: 0, right: 0, textAlign: "center", transform: `translateX(${x + 6 * Math.sin(f * 0.21 + i)}px) scale(${(0.6 + 0.4 * Math.min(1, forca * 1.3)) * (i === 0 ? 1 + 0.03 * Math.sin(f * 0.5) : s)}) rotate(${i === 0 ? 0 : (i % 2 ? 4 : -4)}deg)`, fontFamily: POPPINS, fontStyle: "italic", fontWeight: 800, fontSize: 86, lineHeight: 1.05, color: "#FFFFFF", opacity: forca * (i === 0 ? 1 : 0.55), textShadow: "0 6px 30px rgba(20,10,50,0.9), 0 0 4px rgba(20,10,50,0.9)", padding: "0 70px" }}>
          {DUVIDA}
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Cena: React.FC<{ f: number; o: Olhar; ecos?: number }> = ({ f, o, ecos }) => {
  const cam = camera(f, o);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, filter: `blur(${2.2 * o.duvida}px) saturate(${1 - 0.45 * o.duvida + 0.15 * o.alivio}) brightness(${1 - 0.1 * o.duvida + 0.08 * o.alivio})` }}>
        <Palco cam={cam}>
          <Porta f={f} />
          {/* para onde ela estava indo: a saída, clara, no fim do corredor */}
          <Caixa t={[0.14, 2.6, 4.2]} raio={0.02} pos={[-3.6, 1.3, -0.3]} cor="#F6DFC0" />
          <Caixa t={[0.03, 2.05, 1.0]} raio={0.01} pos={[-3.52, 1.03, -0.25]} cor="#FFF6D6" emissivo="#FFF6D6" brilho={0.9} sombra={false} />
          <Caixa t={[0.05, 2.15, 0.08]} raio={0.01} pos={[-3.5, 1.08, -0.79]} cor="#FFFFFF" />
          <Caixa t={[0.05, 2.15, 0.08]} raio={0.01} pos={[-3.5, 1.08, 0.29]} cor="#FFFFFF" />
          <Caixa t={[0.05, 0.08, 1.16]} raio={0.01} pos={[-3.5, 2.12, -0.25]} cor="#FFFFFF" />
          <group position={[-2.3, 0, 0.75]} rotation={[0, Math.PI, 0]}>
            <Sofa />
          </group>
          <MaoPov f={f} cam={cam} mao={o.mao} />
        </Palco>
      </div>
      {/* a visão aperta com a dúvida e abre com o alívio */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, rgba(20,10,50,0) ${62 - 34 * o.duvida}%, rgba(20,10,50,${0.25 + 0.6 * o.duvida}) 100%)`, opacity: 1 - o.alivio * 0.9 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(255,246,214,0.55), rgba(255,246,214,0) 70%)", opacity: o.alivio }} />
      <Pensamento f={f} forca={o.duvida} ecos={ecos} />
    </>
  );
};

/** Uma ida e volta inteira, em `t` 0..1: afasta, a dúvida vem, vira, volta, checa, alivia. */
const volta = (t: number): Olhar => {
  const x = ((t % 1) + 1) % 1;
  return {
    s: k(x, [[0, 0], [0.06, 0], [0.3, 0.55], [0.5, 0.55], [0.72, 0], [1, 0]]),
    vira: k(x, [[0, 0], [0.08, 1], [0.34, 1], [0.46, 0], [1, 0]]),
    duvida: k(x, [[0.26, 0], [0.34, 1], [0.8, 1], [0.9, 0]]),
    alivio: k(x, [[0.86, 0], [0.93, 1], [1, 0.4]]),
    mao: k(x, [[0.68, 0], [0.76, 1], [0.9, 1], [0.97, 0]]),
    andando: x > 0.06 && x < 0.3 ? 1 : x > 0.5 && x < 0.72 ? 1 : 0,
  };
};

const Relogio: React.FC<{ p: number }> = ({ p }) => {
  const a = 2 * Math.PI * 0.45 * p;
  const fim = { x: 150 + 118 * Math.sin(a), y: 150 - 118 * Math.cos(a) };
  return (
    <div style={{ position: "absolute", top: 236, left: 390, width: 300, height: 300, transform: `scale(${prog(p, 0, 0.1, elastico)})` }}>
      <svg width="300" height="300">
        <circle cx="150" cy="150" r="140" fill="#FFFFFF" stroke={MARCA.tinta} strokeWidth="12" />
        <path d={`M150 150 L150 32 A118 118 0 ${a > Math.PI ? 1 : 0} 1 ${fim.x} ${fim.y} Z`} fill={MARCA.coral} opacity="0.85" />
        <line x1="150" y1="150" x2={fim.x} y2={fim.y} stroke={MARCA.tinta} strokeWidth="10" strokeLinecap="round" />
        <circle cx="150" cy="150" r="12" fill={MARCA.tinta} />
      </svg>
    </div>
  );
};

/** O alarme que a dúvida dispara. `forca` 0 = quieto, 1 = tocando. */
const Alarme: React.FC<{ f: number; forca: number; entra: number }> = ({ f, forca, entra }) => {
  const pisca = 0.5 + 0.5 * Math.sin(f * 0.7);
  const cor = forca > 0.5 ? MARCA.coral : "#2FB36B";
  return (
    <>
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${220 * forca}px rgba(255,60,50,${0.55 * forca * pisca})` }} />
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: entra }}>
        <div style={{ position: "relative", width: 190, height: 190, transform: `scale(${entra * (1 + 0.08 * forca * pisca)}) rotate(${forca * 7 * Math.sin(f * 1.4)}deg)` }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "absolute", inset: -26 - 34 * i, borderRadius: "50%", border: `8px solid ${cor}`, opacity: forca * (i ? 1 - pisca : pisca) * 0.8 }} />
          ))}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor, boxShadow: "0 12px 30px rgba(20,10,50,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="110" height="110" viewBox="0 0 100 100">
              <path d="M50 12 C30 12 24 30 24 46 L24 62 L14 76 L86 76 L76 62 L76 46 C76 30 70 12 50 12 Z" fill="#FFFFFF" />
              <circle cx="50" cy="86" r="9" fill="#FFFFFF" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a experiência ---
  if (em(0)) return <Cena f={f} o={{ s: 0.1 * prog(p(0), 0.75, 1), vira: prog(p(0), 0.6, 0.95), duvida: 0, alivio: 0, mao: 0, andando: p(0) > 0.75 ? 1 : 0 }} />;
  if (em(1)) {
    const x = p(1);
    return <Cena f={f} o={{ s: mix(0.1, 0.55, prog(x, 0, 0.3)), vira: 1 - prog(x, 0.45, 0.8), duvida: prog(x, 0.15, 0.4), alivio: 0, mao: 0, andando: x < 0.3 ? 1 : 0, puxa: prog(x, 0.6, 1) }} />;
  }
  if (em(2)) {
    const x = p(2);
    return <Cena f={f} o={{ s: mix(0.55, 0, prog(x, 0, 0.45)), vira: 0, duvida: 1 - prog(x, 0.8, 1) * 0.7, alivio: 0, mao: prog(x, 0.4, 0.6), andando: x < 0.45 ? 1 : 0, puxa: 1 - prog(x, 0, 0.3) }} />;
  }
  if (em(3)) return <Cena f={f} o={{ s: 0, vira: 0, duvida: 0.3 * (1 - prog(p(3), 0, 0.3)), alivio: prog(p(3), 0.05, 0.5), mao: 1 - prog(p(3), 0.5, 0.9), andando: 0 }} />;
  if (em(4)) {
    const x = p(4);
    return <Cena f={f} o={{ s: mix(0, 0.45, prog(x, 0.1, 0.55)), vira: prog(x, 0, 0.2), duvida: prog(x, 0.55, 0.8), alivio: 0.6 * (1 - prog(x, 0, 0.3)), mao: 0, andando: x > 0.1 && x < 0.55 ? 1 : 0 }} ecos={prog(x, 0.7, 1) * 0.5} />;
  }
  // --- a explicação ---
  const longe = { s: 0.45, andando: 0, mao: 0, alivio: 0 };
  // a cena para: o que está acontecendo aqui?
  if (em(5)) return <Cena f={f} o={{ ...longe, vira: 1 - prog(p(5), 0.1, 0.6), duvida: 1 - 0.5 * prog(p(5), 0.2, 0.7), puxa: prog(p(5), 0.3, 0.9) * 0.6 }} ecos={0.5 * (1 - prog(p(5), 0.1, 0.5))} />;
  // obsessão: a dúvida chega como um alarme
  if (em(6)) {
    const x = p(6);
    return (
      <>
        <Cena f={f} o={{ ...longe, vira: 0, duvida: mix(0.5, 1, prog(x, 0.3, 0.5)), puxa: 0.6 }} />
        <Conceito f={f} de={F[6].de + 22} ate={F[7].de - 4} texto="obsessão" />
        <Alarme f={f} forca={prog(x, 0.42, 0.5)} entra={prog(x, 0.38, 0.48, elastico)} />
      </>
    );
  }
  // compulsão: checar desliga o alarme
  if (em(7)) {
    const x = p(7);
    return (
      <>
        <Cena f={f} o={{ s: mix(0.45, 0, prog(x, 0, 0.35)), vira: 0, duvida: 1 - 0.75 * prog(x, 0.8, 0.95), alivio: 0, mao: prog(x, 0.3, 0.5), andando: x < 0.35 ? 1 : 0, puxa: 0.6 * (1 - prog(x, 0, 0.3)) }} />
        <Conceito f={f} de={F[7].de + 4} ate={F[8].de - 4} texto="compulsão" />
        <Alarme f={f} forca={1 - prog(x, 0.8, 0.86)} entra={1} />
      </>
    );
  }
  // funciona, mas só por um instante
  if (em(8)) {
    const x = p(8);
    const volta_ = prog(x, 0.62, 0.9);
    return (
      <>
        <Cena f={f} o={{ s: 0, vira: 0, duvida: 0.7 * volta_, alivio: prog(x, 0, 0.25) * (1 - volta_), mao: 1, andando: 0 }} />
        <Alarme f={f} forca={prog(x, 0.7, 0.78)} entra={1} />
      </>
    );
  }
  // o cérebro aprende: o ciclo com os nomes
  if (em(9)) {
    const x = p(9);
    const visiveis = 1 + Math.floor(prog(x, 0.04, 0.42, (v) => v) * 4);
    return (
      <>
        <Cena f={f} o={{ ...volta(0.8), duvida: 0.35, alivio: 0 }} />
        <AbsoluteFill style={{ background: "rgba(255,244,228,0.92)", opacity: prog(x, 0, 0.06) }}>
          <Roda itens={CICLO} aceso={x < 0.45 ? Math.min(3, visiveis - 1) : x < 0.72 ? 3 : Math.floor((f / 14) % 4)} visiveis={visiveis} cores={[MARCA.coral, MARCA.coral, MARCA.roxo, "#2FB36B"]} />
          <div style={{ position: "absolute", top: 1150, left: 0, right: 0, textAlign: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 52, lineHeight: 1.15, color: "#2FB36B", opacity: prog(x, 0.42, 0.5) }}>
            checar trouxe alívio
          </div>
        </AbsoluteFill>
      </>
    );
  }
  // por isso se repete, mesmo sabendo
  if (em(10)) {
    const x = p(10);
    return (
      <>
        <Cena f={f * 1.5} o={volta(0.34 + x * 2.3)} ecos={0.5 + 0.5 * x} />
        <Relogio p={x * 0.5} />
      </>
    );
  }
  const x = em(11) ? p(11) : 1;
  return (
    <>
      <Cena f={f} o={volta(0.3 + (f / 170) % 1)} ecos={0.4} />
      <Relogio p={0.5 + 0.5 * x} />
    </>
  );
};

export const { Componente: ExplicaMentePortapov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
