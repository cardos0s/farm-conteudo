import React from "react";
import { AbsoluteFill } from "remotion";
import { MARCA } from "../Legendas";
import { Arara } from "../camiseta/Video";
import { elastico, mix, prog } from "../anim";
import { Balao, Conceito, Etapas, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Visao, diante, entre, olhar, type Olhos } from "../kit/Pov";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NA_ARARA: Olhos = { pos: [0, 0.95, 0.75], giro: 0, baixa: 0.1 };
const DE_PERTO: Olhos = { pos: [0.26, 0.95, -0.2], giro: 0.03, baixa: 0.12, fov: 40 };

/** O incômodo que vem de trás, da nuca: não dá pra ver, só sentir. */
const Incomodo: React.FC<{ f: number; forca: number }> = ({ f, forca }) =>
  forca < 0.02 ? null : (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% -6%, rgba(255,70,60,${0.75 * forca * (0.7 + 0.3 * Math.sin(f * 0.6))}) 0%, rgba(255,70,60,0) ${34 + 10 * forca}%)` }} />
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = 300 + i * 80 + 14 * Math.sin(f * 0.9 + i * 2);
          const h = (70 + 50 * Math.abs(Math.sin(f * 0.5 + i))) * forca;
          return <path key={i} d={`M${x - 22} 150 L${x} ${150 + h} L${x + 22} 150`} fill="none" stroke="#FF5A4E" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" opacity={forca * 0.9} />;
        })}
      </svg>
    </AbsoluteFill>
  );

type Est = { o: Olhos; incomodo: number; puxa?: number; detalhes?: boolean; brilho?: number; alivio?: number };

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const mexe = e.incomodo * (e.puxa ?? 0);
  const o: Olhos = { ...e.o, pos: [e.o.pos[0] + 0.02 * Math.sin(f * 0.5) * mexe, e.o.pos[1] + 0.015 * Math.sin(f * 0.8) * mexe, e.o.pos[2]], giro: e.o.giro + 0.05 * Math.sin(f * 0.35) * e.incomodo };
  const cam = olhar(o, f, { treme: e.incomodo * 0.6 });
  return (
    <>
      <Visao cam={cam} tensao={0.55 * e.incomodo} alivio={e.alivio ?? 0}>
        <Arara f={f} detalhes={e.detalhes} brilho={e.brilho} />
        {/* a mão subindo pra puxar a gola, atrás da cabeça */}
        <MaoPov cam={cam} alvo={diante(cam, 0.1, 0.2 + 0.015 * Math.sin(f * 0.7), 0.3)} quanto={e.puxa ?? 0} fecha={0.6} palma={[0, 0, 1]} />
      </Visao>
      <Incomodo f={f} forca={e.incomodo} />
    </>
  );
};

/** O mapa de onde a camiseta encosta (vista de costas). */
const Mapa: React.FC<{ p: number; ativo: number }> = ({ p, ativo }) => {
  const pontos = [
    [[540, 500]],
    [[330, 560], [750, 560]],
    [[390, 1130], [690, 1130]],
  ];
  return (
    <AbsoluteFill style={{ background: "rgba(255,244,228,0.93)", opacity: prog(p, 0, 0.08) }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <path d="M400 470 Q540 540 680 470 L860 560 L960 760 L820 830 L780 720 L780 1180 Q540 1220 300 1180 L300 720 L260 830 L120 760 L220 560 Z" fill="#FFC53D" stroke="#C9871A" strokeWidth="10" strokeLinejoin="round" />
        <path d="M400 470 Q540 540 680 470" fill="none" stroke="#C9871A" strokeWidth="12" />
        <rect x="512" y="486" width="56" height="64" rx="6" fill="#FFFFFF" stroke="#C9871A" strokeWidth="5" />
        {pontos.map((grupo, i) =>
          grupo.map(([x, y], j) => (
            <g key={`${i}${j}`} opacity={i <= ativo ? 1 : 0.15}>
              <circle cx={x} cy={y} r={i === ativo ? 70 : 46} fill={i === 0 ? "#FF5A4E" : "#FF9F43"} opacity="0.35" />
              <circle cx={x} cy={y} r={i === ativo ? 34 : 24} fill={i === 0 ? "#FF5A4E" : "#FF9F43"} />
            </g>
          )),
        )}
      </svg>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 54, color: MARCA.tinta }}>onde a roupa encosta</div>
    </AbsoluteFill>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} e={{ o: NA_ARARA, incomodo: 0 }} />;
  if (em(1)) return <Cena f={f} e={{ o: NA_ARARA, incomodo: 0.5 * prog(p(1), 0.2, 0.7) }} />;
  if (em(2)) return <Cena f={f} e={{ o: { ...NA_ARARA, baixa: mix(0.1, 0.3, p(2)) }, incomodo: mix(0.5, 0.85, p(2)) }} />;
  if (em(3) || em(4)) return <Cena f={f} e={{ o: { ...NA_ARARA, baixa: 0.3 }, incomodo: em(3) ? 1 : 1 - 0.4 * p(4), puxa: em(3) ? prog(p(3), 0.05, 0.3) : 1 }} />;
  // --- a explicação ---
  if (em(5)) return <Cena f={f} e={{ o: NA_ARARA, incomodo: 0.2, detalhes: true }} />;
  if (em(6)) return <Cena f={f} e={{ o: entre(NA_ARARA, DE_PERTO, prog(p(6), 0, 0.35)), incomodo: 0, detalhes: true, brilho: prog(p(6), 0.35, 0.5) }} />;
  if (em(7) || em(8))
    return (
      <>
        <Cena f={f} e={{ o: entre(DE_PERTO, NA_ARARA, em(7) ? prog(p(7), 0, 0.5) : 1), incomodo: em(8) ? 0.8 : 0.3 * p(7), detalhes: true, puxa: em(8) ? 1 : 0 }} />
        {em(7) && <Conceito f={f} de={F[7].de + 4} ate={F[8].de - 4} texto="sensibilidade tátil" topo={420} />}
      </>
    );
  if (em(9))
    return (
      <>
        <Cena f={f} e={{ o: NA_ARARA, incomodo: 0.25 + 0.25 * Math.sin(f * 0.08), detalhes: true }} />
        <Etapas itens={["A pessoa", "O sono", "O humor", "O ambiente"]} aceso={Math.min(3, Math.floor(prog(p(9), 0.15, 1, (v) => v) * 4))} emColuna topo={420} opacidade={prog(p(9), 0.05, 0.15)} />
      </>
    );
  if (em(10)) {
    const x = p(10);
    return (
      <>
        <Cena f={f} e={{ o: NA_ARARA, incomodo: 0.2, detalhes: true }} />
        <Mapa p={x} ativo={x < 0.62 ? -1 : Math.min(2, Math.floor(prog(x, 0.62, 1, (v) => v) * 3))} />
      </>
    );
  }
  // --- o que fazer ---
  if (em(11))
    return (
      <>
        <Cena f={f} e={{ o: NA_ARARA, incomodo: 0.5, detalhes: true, puxa: 1 }} />
        <Balao texto="Qual parte incomoda?" p={prog(p(11), 0.3, 0.45, elastico)} topo={420} />
      </>
    );
  const x = em(12) ? p(12) : 1;
  return (
    <>
      <Cena f={f} e={{ o: NA_ARARA, incomodo: 0.5 * (1 - prog(x, 0.2, 0.6)), detalhes: true, puxa: 1 - prog(x, 0.3, 0.7), alivio: 0.6 * prog(x, 0.5, 0.9) }} />
      {em(12) && <Balao texto="Sem forçar" p={prog(x, 0.15, 0.3, elastico)} topo={420} cor="#2FB36B" corTexto="#FFFFFF" />}
    </>
  );
};

export const { Componente: ExplicaMenteCamisetapov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });


