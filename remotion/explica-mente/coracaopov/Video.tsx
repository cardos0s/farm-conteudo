import React from "react";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera, Seg } from "../Pecas";
import { elastico, mix, prog } from "../anim";
import { Balao, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Explica, MaoPov, Pensamento, Visao, diante, olhar, type Olhos } from "../kit/Pov";
import { Alarme } from "../portapov/Video";
import { PASSOS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const FRENTE: Olhos = { pos: [0, 1.2, -0.72], giro: Math.PI, baixa: 0.28 };
const NO_PEITO: Olhos = { pos: [0, 1.2, -0.72], giro: Math.PI, baixa: 0.95 };
const olhos = (t: number): Olhos => ({ ...FRENTE, baixa: mix(FRENTE.baixa, NO_PEITO.baixa, t) });

/** `ritmo` 1 = calmo, 3 = disparado; `medo` 0..1 aperta a visão. */
type Est = { o: Olhos; ritmo: number; medo: number; mao?: number; sente?: number };

const Coracao: React.FC<{ bate: number; forca: number }> = ({ bate, forca }) =>
  forca < 0.02 ? null : (
    <div style={{ position: "absolute", left: 540 - 130, top: 930, width: 260, height: 240, opacity: forca, transform: `scale(${(0.8 + 0.2 * forca) * (1 + 0.22 * bate)})` }}>
      <svg width="260" height="240" viewBox="0 0 100 92">
        <path d="M50 88 C10 58 2 38 2 26 C2 10 14 2 26 2 C36 2 45 8 50 18 C55 8 64 2 74 2 C86 2 98 10 98 26 C98 38 90 58 50 88 Z" fill="#FF4D6D" stroke="#FFFFFF" strokeWidth="4" />
      </svg>
    </div>
  );

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const bate = Math.pow(Math.max(0, Math.sin(f * 0.11 * e.ritmo)), 6);
  const cam = olhar(e.o, f, { treme: e.medo });
  return (
    <>
      <Visao cam={cam} tensao={e.medo} pulso={bate * (0.25 + 0.75 * Math.min(1, (e.ritmo - 1) / 1.5))}>
        {/* a sala em frente ao sofá */}
        <Caixa t={[0.9, 0.06, 0.5]} raio={0.02} pos={[0, 0.36, 0.25]} cor="#D99B5B" />
        <Seg a={[-0.38, 0, 0.1]} b={[-0.38, 0.34, 0.1]} r={0.025} cor="#B8793F" />
        <Seg a={[0.38, 0, 0.1]} b={[0.38, 0.34, 0.1]} r={0.025} cor="#B8793F" />
        <Seg a={[-0.38, 0, 0.4]} b={[-0.38, 0.34, 0.4]} r={0.025} cor="#B8793F" />
        <Seg a={[0.38, 0, 0.4]} b={[0.38, 0.34, 0.4]} r={0.025} cor="#B8793F" />
        <Cilindro r={0.045} h={0.09} pos={[0.2, 0.435, 0.22]} cor="#FFFFFF" />
        <Caixa t={[0.24, 0.03, 0.17]} raio={0.008} pos={[-0.15, 0.405, 0.28]} rot={[0, 0.3, 0]} cor="#6C4BD8" />
        <Cilindro r={0.11} r2={0.08} h={0.2} pos={[0.95, 0.1, 0.9]} cor="#FFFFFF" />
        <Esfera r={0.22} pos={[0.95, 0.42, 0.9]} cor="#3FAE6A" rug={0.9} />
        <Esfera r={0.16} pos={[1.05, 0.62, 0.95]} cor="#3FAE6A" rug={0.9} />
        <Caixa t={[7, 3.2, 0.1]} raio={0.02} pos={[0, 1.6, 2.4]} cor="#FFF0DA" />
        <Caixa t={[1.25, 0.72, 0.06]} raio={0.03} pos={[0, 1.15, 2.32]} cor="#2B2F55" />
        <Caixa t={[1.15, 0.62, 0.02]} raio={0.02} pos={[0, 1.15, 2.28]} cor="#3A3F66" sombra={false} />
        <Caixa t={[1.6, 0.4, 0.4]} raio={0.03} pos={[0, 0.2, 2.15]} cor="#D99B5B" />
        {/* minhas pernas e a mão que vai ao peito */}
        <Seg a={[0.1, 0.5, -0.72]} b={[0.11, 0.5, -0.36]} r={0.075} cor="#3B4A7A" />
        <Seg a={[-0.1, 0.5, -0.72]} b={[-0.11, 0.5, -0.36]} r={0.075} cor="#3B4A7A" />
        <Seg a={[0.11, 0.5, -0.36]} b={[0.11, 0.09, -0.32]} r={0.065} cor="#3B4A7A" />
        <Seg a={[-0.11, 0.5, -0.36]} b={[-0.11, 0.09, -0.32]} r={0.065} cor="#3B4A7A" />
        <Esfera r={1} escala={[0.2, 0.18, 0.13]} pos={[0, 0.82, -0.74]} cor="#FF7A59" />
        <MaoPov cam={cam} alvo={diante(cam, -0.02, -0.26, 0.2)} quanto={e.mao ?? 0} fecha={0.3} palma={[0, 0, -1]} />
      </Visao>
      <Coracao bate={bate} forca={e.sente ?? 0} />
    </>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} e={{ o: FRENTE, ritmo: mix(1, 2.4, prog(p(0), 0.25, 0.7)), medo: 0, sente: prog(p(0), 0.3, 0.6) }} />;
  if (em(1)) return <Cena f={f} e={{ o: olhos(prog(p(1), 0.1, 0.5)), ritmo: 2.4, medo: 0.2 * p(1), mao: prog(p(1), 0.3, 0.6), sente: 1 }} />;
  if (em(2))
    return (
      <>
        <Cena f={f} e={{ o: NO_PEITO, ritmo: 2.6, medo: mix(0.2, 0.6, p(2)), mao: 1, sente: 1 }} />
        <Pensamento f={f} texto="Tem alguma coisa errada comigo." forca={prog(p(2), 0.05, 0.3)} topo={520} tamanho={78} />
      </>
    );
  if (em(3))
    return (
      <>
        <Cena f={f} e={{ o: olhos(1 - 0.6 * prog(p(3), 0.2, 0.7)), ritmo: mix(2.6, 3.4, p(3)), medo: mix(0.6, 1, p(3)), mao: 1, sente: 1 }} />
        <Pensamento f={f} texto="Tem alguma coisa errada comigo." forca={1} ecos={p(3)} topo={520} tamanho={78} />
      </>
    );
  if (em(4)) return <Cena f={f} e={{ o: olhos(0.4), ritmo: 3, medo: 0.7 * (1 - 0.4 * p(4)), mao: 1, sente: 1 }} />;
  // --- a explicação ---
  if (em(5) || em(6) || em(7) || em(8)) {
    const i = em(5) ? 0 : em(6) ? 1 : em(7) ? 2 : 3;
    return (
      <>
        <Cena f={f} e={{ o: olhos(0.4), ritmo: 2.6, medo: 0.4, mao: 1 }} />
        <Explica titulo="crise de pânico" passos={PASSOS} quantos={i + 0.4 + prog(p(i + 5), 0.1, 0.3) * 0.6} ativo={i} entra={em(5) ? prog(p(5), 0, 0.08) : 1} />
      </>
    );
  }
  if (em(9))
    return (
      <>
        <Cena f={f} e={{ o: FRENTE, ritmo: 2.4, medo: 0.25, mao: 1 }} />
        <Alarme f={f} forca={1} entra={prog(p(9), 0.25, 0.4, elastico)} />
        <Balao texto="alarme falso" p={prog(p(9), 0.3, 0.45, elastico)} topo={250} cor={MARCA.sol} tamanho={64} />
      </>
    );
  if (em(10) || em(11))
    return (
      <>
        <Cena f={f} e={{ o: FRENTE, ritmo: 1.6, medo: 0.05, mao: em(10) ? 1 - prog(p(10), 0.2, 0.6) : 0 }} />
        <Balao texto="Sintoma físico precisa de avaliação médica" p={em(10) ? prog(p(10), 0.45, 0.6, elastico) : 1} topo={250} tamanho={48} />
      </>
    );
  // --- o que observar ---
  if (em(12))
    return (
      <>
        <Cena f={f} e={{ o: olhos(0.5), ritmo: 2.2, medo: 0.35 * prog(p(12), 0.6, 0.8), mao: prog(p(12), 0.3, 0.5), sente: prog(p(12), 0.3, 0.45) }} />
        <Etapas itens={["Percebeu o coração", "Sentiu medo"]} aceso={p(12) < 0.45 ? -1 : p(12) < 0.72 ? 0 : 1} emColuna topo={236} opacidade={prog(p(12), 0.3, 0.4)} />
      </>
    );
  return (
    <>
      <Cena f={f} e={{ o: FRENTE, ritmo: 1.4, medo: 0, mao: 0 }} />
      {em(13) && <Balao texto="Tem tratamento" p={prog(p(13), 0.1, 0.25, elastico)} topo={250} cor="#2FB36B" corTexto="#FFFFFF" tamanho={64} />}
    </>
  );
};

export const { Componente: ExplicaMenteCoracaopov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
