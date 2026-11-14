import React from "react";
import { AbsoluteFill } from "remotion";
import { ADULTO, Boneco, type Pose } from "../Boneco";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera } from "../Pecas";
import { elastico, k, limitar, linear, mix, mixV, prog, sair, type V3 } from "../anim";
import { POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { andando, emPe } from "../kit/poses";
import { CICLO, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NA_PORTA: V3 = [0.56, 0, -0.4];
const LONGE: V3 = [-0.4, 0, -0.3];
const MACANETA: V3 = [0.92, 0.95, -0.2];
const CAM: Cam = { pos: [0.1, 1.1, 4.3], alvo: [0.25, 0.86, -0.5], fov: 34 };

const Porta: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Caixa t={[0.14, 2.6, 2.6]} raio={0.02} pos={[1.08, 1.3, -0.6]} cor="#F6DFC0" />
    <Caixa t={[0.08, 2.08, 1.0]} raio={0.02} pos={[1.02, 1.04, -0.5]} cor="#FFFFFF" />
    <Caixa t={[0.07, 1.98, 0.88]} raio={0.02} pos={[0.99, 1.0, -0.5]} cor="#2EC4B6" />
    <Caixa t={[0.02, 0.6, 0.6]} raio={0.008} pos={[0.955, 1.42, -0.5]} cor="#55D3C7" sombra={false} />
    <Caixa t={[0.02, 0.6, 0.6]} raio={0.008} pos={[0.955, 0.6, -0.5]} cor="#55D3C7" sombra={false} />
    <Cilindro r={0.02} h={0.07} pos={[0.95, MACANETA[1], MACANETA[2]]} rot={[0, 0, Math.PI / 2]} cor="#FFC53D" rug={0.3} />
    <Esfera r={0.042} pos={MACANETA} cor="#FFC53D" rug={0.3} />
    {/* fechadura com a luz de "trancada" */}
    <Caixa t={[0.03, 0.12, 0.08]} raio={0.01} pos={[0.95, 1.14, -0.2]} cor="#2B2F55" />
    <Esfera r={0.02} pos={[0.932, 1.16, -0.2]} cor="#2FB36B" emissivo="#2FB36B" brilho={0.8 + 0.2 * Math.sin(f * 0.2)} sombra={false} />
  </>
);

type Estado = { pose: Pose; duvida: number; alivio: number };

/** Um giro do ciclo: `t` 0 = acabou de checar; anda, duvida, volta, checa, alivia (1). */
const volta = (f: number, t: number): Estado => {
  const x = ((t % 1) + 1) % 1;
  if (x < 0.28) {
    const p = andando(ADULTO, NA_PORTA, LONGE, x / 0.28, f);
    return { pose: { ...p, sorriso: 0.7 }, duvida: 0, alivio: 1 - prog(x, 0.1, 0.28) };
  }
  if (x < 0.46) {
    const d = prog(x, 0.28, 0.38);
    const p = emPe(ADULTO, LONGE, mix(-Math.PI / 2, 0.5, d), f);
    return { pose: { ...p, sobr: 0.8 * d, sorriso: mix(0.7, -0.35, d), maoD: mixV(p.maoD, [p.pos[0] - 0.02, 1.32, p.pos[2] + 0.2], d), cabeca: [0, 0.7 * d, 0] }, duvida: d, alivio: 0 };
  }
  if (x < 0.74) {
    const p = andando(ADULTO, LONGE, NA_PORTA, (x - 0.46) / 0.28, f);
    return { pose: { ...p, sobr: 0.8, sorriso: -0.35 }, duvida: 1, alivio: 0 };
  }
  const p = emPe(ADULTO, NA_PORTA, Math.PI / 2, f);
  const mao = k(x, [[0.74, 0], [0.8, 1], [0.9, 1], [0.97, 0]]);
  const testa = x > 0.8 && x < 0.9 ? Math.sin((x - 0.8) * 190) : 0;
  const alivio = prog(x, 0.89, 0.96);
  return {
    pose: { ...p, inclina: 0.1 * mao, maoD: mixV(p.maoD, [MACANETA[0] - 0.04 + 0.012 * testa, MACANETA[1] + 0.02 * testa, MACANETA[2] + 0.02], mao), sobr: 0.8 * (1 - alivio), sorriso: mix(-0.35, 1, alivio), olhos: mix(p.olhos, 0.25, alivio * (1 - prog(x, 0.97, 1))) },
    duvida: 1 - alivio,
    alivio,
  };
};

/** Onde fica o balão em relação à pessoa (a câmera é fixa). */
const naTela = (pose: Pose) => ({ left: 540 + (pose.pos[0] - 0.25) * 640, top: 250 });

const Balao: React.FC<{ e: Estado }> = ({ e }) => {
  const forca = Math.max(e.duvida, e.alivio);
  if (forca < 0.02) return null;
  const alivio = e.alivio > e.duvida;
  const { left, top } = naTela(e.pose);
  return (
    <div style={{ position: "absolute", left: limitar(left, 150, 930) - 110, top, width: 220, height: 200, transform: `scale(${Math.min(1, forca * 1.4)})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", inset: "0 0 30px 0", borderRadius: 70, background: alivio ? "#DDF6E7" : "#FFFFFF", boxShadow: "0 12px 30px rgba(36,26,74,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 120, color: alivio ? "#2FB36B" : MARCA.coral }}>
        {alivio ? (
          <svg width="110" height="110" viewBox="0 0 50 50">
            <path d="M10 26 L21 37 L40 14" stroke="#2FB36B" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          "?"
        )}
      </div>
      <div style={{ position: "absolute", left: 96, bottom: 6, width: 30, height: 30, borderRadius: "50%", background: alivio ? "#DDF6E7" : "#FFFFFF" }} />
    </div>
  );
};

const Cena: React.FC<{ f: number; e: Estado; cam?: Cam }> = ({ f, e, cam = CAM }) => (
  <>
    <Palco cam={cam}>
      <Porta f={f} />
      <Boneco m={ADULTO} p={e.pose} />
    </Palco>
    <Balao e={e} />
  </>
);

/** O ciclo desenhado: quatro etapas em roda, com o destaque girando. */
const Ciclo: React.FC<{ q: Quadro }> = ({ q }) => {
  const x = q.em(4) ? q.p(4) : 1;
  const aceso = q.em(4) ? Math.min(3, Math.floor(prog(x, 0.34, 1, linear) * 4)) : q.em(5) ? 2 : -1;
  const visiveis = q.em(4) ? 1 + aceso : 4;
  const R = 300;
  const cx = 540;
  const cy = 760;
  const ponto = (i: number) => ({ x: cx + R * Math.sin((i * Math.PI) / 2), y: cy - R * Math.cos((i * Math.PI) / 2) });
  const cores = [MARCA.coral, MARCA.roxo, "#2FB36B", MARCA.coral];
  return (
    <AbsoluteFill style={{ background: MARCA.creme, opacity: prog(x, 0, 0.06) }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={MARCA.roxo} strokeOpacity="0.25" strokeWidth="14" strokeDasharray="2 26" strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => {
          const a0 = (i * Math.PI) / 2 + 0.42;
          const a1 = ((i + 1) * Math.PI) / 2 - 0.42;
          const p0 = { x: cx + R * Math.sin(a0), y: cy - R * Math.cos(a0) };
          const p1 = { x: cx + R * Math.sin(a1), y: cy - R * Math.cos(a1) };
          const on = i < visiveis - (q.em(4) ? 1 : 0) || !q.em(4);
          return (
            <g key={i} opacity={on ? 1 : 0}>
              <path d={`M${p0.x} ${p0.y} A${R} ${R} 0 0 1 ${p1.x} ${p1.y}`} fill="none" stroke={MARCA.roxo} strokeWidth="12" strokeLinecap="round" />
              <circle cx={p1.x} cy={p1.y} r="18" fill={MARCA.roxo} />
            </g>
          );
        })}
      </svg>
      {CICLO.map((t, i) => {
        const pt = ponto(i);
        const on = i === aceso;
        const vis = i < visiveis ? 1 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: pt.x - 190, top: pt.y - 62, width: 380, height: 124, borderRadius: 62, background: on ? cores[i] : "#FFFFFF", color: on ? "#FFFFFF" : MARCA.tinta, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 46, boxShadow: "0 12px 30px rgba(36,26,74,0.2)", transform: `scale(${vis * (on ? 1.08 : 1)})` }}>
            {t}
          </div>
        );
      })}
      {q.em(5) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: cy + R + 84, textAlign: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 54, color: "#2FB36B", opacity: prog(q.p(5), 0.05, 0.2), }}>temporário</div>
      )}
    </AbsoluteFill>
  );
};

/** Relógio que mostra o tempo que as idas e voltas tomam. */
const Relogio: React.FC<{ p: number }> = ({ p }) => {
  const a = 2 * Math.PI * 0.42 * p;
  const fim = { x: 150 + 118 * Math.sin(a), y: 150 - 118 * Math.cos(a) };
  return (
    <div style={{ position: "absolute", top: 226, left: 80, width: 300, height: 300, transform: `scale(${prog(p, 0, 0.1, elastico)})` }}>
      <svg width="300" height="300">
        <circle cx="150" cy="150" r="140" fill="#FFFFFF" stroke={MARCA.tinta} strokeWidth="12" />
        <path d={`M150 150 L150 32 A118 118 0 ${a > Math.PI ? 1 : 0} 1 ${fim.x} ${fim.y} Z`} fill={MARCA.coral} opacity="0.85" />
        <line x1="150" y1="150" x2={fim.x} y2={fim.y} stroke={MARCA.tinta} strokeWidth="10" strokeLinecap="round" />
        <circle cx="150" cy="150" r="12" fill={MARCA.tinta} />
      </svg>
    </div>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em } = q;
  if (em(0)) return <Cena f={f} e={volta(f, mix(0.76, 1.42, p(0)))} />;
  if (em(1)) {
    const x = p(1);
    // a porta trancada em close, depois a dúvida
    if (x < 0.36) return <Cena f={f} e={{ pose: emPe(ADULTO, LONGE, -Math.PI / 2, f), duvida: 0, alivio: 0 }} cam={{ pos: mixV([0.2, 1.1, 1.9], [0.25, 1.1, 1.6], x / 0.36), alvo: [0.95, 1.05, -0.3], fov: 30 }} />;
    return <Cena f={f} e={volta(f, mix(0.28, 0.44, prog(x, 0.4, 0.75)))} />;
  }
  if (em(2)) return <Cena f={f} e={volta(f, mix(0.46, 0.985, p(2)))} />;
  if (em(3)) return <Cena f={f} e={volta(f, mix(0.0, 2.0, p(3)))} />;
  if (em(4) || em(5)) return <Ciclo q={q} />;
  if (em(6)) {
    // uma checagem só, e a vida segue
    const x = p(6);
    if (x < 0.55) return <Cena f={f} e={{ ...volta(f, mix(0.76, 0.985, x / 0.55)), duvida: 0 }} />;
    const pose = andando(ADULTO, NA_PORTA, [-1.3, 0, -0.3], (x - 0.55) / 0.45, f);
    return <Cena f={f} e={{ pose: { ...pose, sorriso: 1 }, duvida: 0, alivio: 0 }} />;
  }
  const x = em(7) ? p(7) : 1;
  return (
    <>
      <Cena f={f} e={volta(f, (f / 150) % 1)} />
      <Relogio p={x} />
    </>
  );
};

export const { Componente: ExplicaMentePorta, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });


