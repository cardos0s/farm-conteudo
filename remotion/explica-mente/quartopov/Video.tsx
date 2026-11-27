import React from "react";
import { MARCA } from "../Legendas";
import { elastico, mixV, prog, soma, type V3 } from "../anim";
import { Balao, Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Visao, diante, entre, olhar, type Olhos } from "../kit/Pov";
import { CESTO, Nuvem, Quarto, ROUPA, Roupa } from "../quarto/Video";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const AMPLA = "Arruma o quarto";
const CONCRETA = "Põe a roupa no cesto";
const GERAL: Olhos = { pos: [0.05, 0.95, 1.05], giro: 0, baixa: 0.42 };
const NA_ROUPA: Olhos = { pos: [-0.22, 0.95, 0.6], giro: -0.12, baixa: 1.05 };
const NO_CESTO: Olhos = { pos: [0.42, 0.95, 0.0], giro: 0.1, baixa: 1.0 };

type Est = { o: Olhos; roupa: "chao" | "mao" | "cesto"; pega?: number; solta?: number; seta?: number; tensao?: number; alivio?: number; andando?: number };

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const cam = olhar(e.o, f, { andando: e.andando });
  const naMao = diante(cam, 0.12, -0.28, 0.45);
  const noCesto: V3 = [CESTO[0], 0.3, CESTO[2]];
  const pos = e.roupa === "chao" ? ROUPA : e.roupa === "cesto" ? noCesto : mixV(naMao, noCesto, e.solta ?? 0);
  return (
    <Visao cam={cam} tensao={e.tensao ?? 0} alivio={e.alivio ?? 0}>
      <Quarto seta={e.seta ?? 0} />
      <Roupa pos={pos} />
      <MaoPov cam={cam} alvo={e.roupa === "mao" ? soma(pos, [0.02, 0.07, 0.04]) : soma(ROUPA, [0, 0.08, 0.02])} quanto={e.roupa === "mao" ? 1 - 0.4 * (e.solta ?? 0) : e.pega ?? 0} fecha={0.55} />
    </Visao>
  );
};

const procurando = (f: number): Olhos => ({ ...GERAL, giro: 0.3 * Math.sin(f * 0.06), baixa: 0.42 + 0.12 * Math.sin(f * 0.045) });

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0) || em(1))
    return (
      <>
        <Cena f={f} e={{ o: em(0) ? GERAL : procurando(f), roupa: "chao", tensao: em(1) ? 0.2 * p(1) : 0 }} />
        <Balao texto={AMPLA} p={em(0) ? prog(p(0), 0.05, 0.3, elastico) : 1} topo={236} />
      </>
    );
  if (em(2) || em(3) || em(4)) {
    const quantas = em(2) ? p(2) * 5.4 : 6;
    return (
      <>
        <Cena f={f} e={{ o: em(2) ? procurando(f) : GERAL, roupa: "chao", tensao: em(2) ? 0.2 + 0.55 * p(2) : 0.75 }} />
        <Balao texto={AMPLA} p={1} topo={236} />
        <Nuvem quantas={quantas} f={f} />
      </>
    );
  }
  // --- a explicação ---
  if (em(5))
    return (
      <>
        <Cena f={f} e={{ o: GERAL, roupa: "chao", tensao: 0.5 }} />
        <Balao texto={AMPLA} p={1} topo={236} />
        <Nuvem quantas={6} f={f} opacidade={0.6} />
      </>
    );
  if (em(6) || em(7))
    return (
      <>
        <Cena f={f} e={{ o: GERAL, roupa: "chao", tensao: 0.4 }} />
        <Balao texto={AMPLA} p={1} topo={236} />
        <Etapas itens={["Escolher por onde começar", "Organizar o que vai pra onde", "Ordenar o que vem depois"]} aceso={em(6) ? Math.min(2, Math.floor(p(6) * 3)) : -1} emColuna topo={420} opacidade={em(6) ? prog(p(6), 0, 0.06) : 1} />
        {em(7) && <Conceito f={f} de={F[7].de + 4} ate={F[8].de - 4} texto="planejamento" topo={760} />}
      </>
    );
  if (em(8))
    return (
      <>
        <Cena f={f} e={{ o: GERAL, roupa: "chao", tensao: 0.75 }} />
        <Balao texto={AMPLA} p={1} topo={236} />
        <Nuvem quantas={6} f={f} />
      </>
    );
  if (em(9) || em(10))
    return (
      <>
        <Cena f={f} e={{ o: entre(GERAL, { ...GERAL, giro: -0.12, baixa: 0.6 }, em(9) ? prog(p(9), 0.4, 0.9) : 1), roupa: "chao", seta: em(9) ? prog(p(9), 0.5, 1) : 1, tensao: em(9) ? 0.75 * (1 - prog(p(9), 0.2, 0.5)) : 0 }} />
        <Balao texto={AMPLA} p={em(9) ? 1 - prog(p(9), 0.2, 0.3) : 0} topo={236} />
        <Balao texto={CONCRETA} p={em(9) ? prog(p(9), 0.3, 0.45, elastico) : 1} topo={236} cor={MARCA.roxo} corTexto="#FFFFFF" />
        {em(10) && <Etapas itens={["Um objeto", "Um lugar", "Um começo"]} aceso={Math.min(2, Math.floor(p(10) * 3))} topo={400} opacidade={prog(p(10), 0, 0.08)} />}
      </>
    );
  if (em(11)) {
    const x = p(11);
    const o = x < 0.3 ? entre({ ...GERAL, giro: -0.12, baixa: 0.6 }, NA_ROUPA, prog(x, 0, 0.3)) : x < 0.45 ? NA_ROUPA : entre(NA_ROUPA, NO_CESTO, prog(x, 0.45, 0.75));
    return (
      <>
        <Cena f={f} e={{ o, roupa: x < 0.4 ? "chao" : x < 0.9 ? "mao" : "cesto", pega: prog(x, 0.28, 0.4), solta: prog(x, 0.76, 0.9), seta: 1 - prog(x, 0.4, 0.6), andando: x < 0.3 || (x > 0.45 && x < 0.75) ? 1 : 0, alivio: 0.6 * prog(x, 0.9, 1) }} />
        <Balao texto={CONCRETA} p={1} topo={236} cor={MARCA.roxo} corTexto="#FFFFFF" />
      </>
    );
  }
  // --- o que testar ---
  const x = em(12) ? p(12) : 1;
  return (
    <>
      <Cena f={f} e={{ o: entre(NO_CESTO, GERAL, em(12) ? prog(x, 0, 0.4) : 1), roupa: "cesto", alivio: 0.3 }} />
      <div style={{ opacity: em(14) ? 1 - prog(p(14), 0, 0.1) : 1 }}>
        <Balao texto={AMPLA} p={prog(x, 0.3, 0.42, elastico) * 0.85} topo={236} cor="#EDE6F7" corTexto="#8B8FA8" />
        <Balao texto={`${CONCRETA}  ✓`} p={prog(x, 0.6, 0.72, elastico)} topo={390} cor="#2FB36B" corTexto="#FFFFFF" />
      </div>
    </>
  );
};

export const { Componente: ExplicaMenteQuartopov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
