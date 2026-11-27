import React from "react";
import { MARCA } from "../Legendas";
import { Caixa } from "../Pecas";
import { elastico, k, mix, prog, sair, type V3 } from "../anim";
import { Barras, CaixaDePapelao } from "../caixa/Video";
import { Balao, Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Explica, MaoPov, Visao, entre, olhar, type Olhos } from "../kit/Pov";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const MESA = 0.3;
const Z = -0.5;
const XA = -0.3;
const XB = 0.3;
const GERAL: Olhos = { pos: [0, 0.95, 0.4], giro: 0, baixa: 0.55 };
const NA_A: Olhos = { pos: [-0.12, 0.95, 0.25], giro: -0.24, baixa: 0.62 };
const NA_B: Olhos = { pos: [0.12, 0.95, 0.25], giro: 0.24, baixa: 0.62 };

type Est = { o: Olhos; qual: "A" | "B" | null; pega: number; altura: number; treme?: number; susto?: number; tensao?: number; alivio?: number };

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const s = e.susto ?? 0;
  const o: Olhos = { ...e.o, pos: [e.o.pos[0], e.o.pos[1], e.o.pos[2] + 0.1 * s], baixa: e.o.baixa - 0.35 * s };
  const cam = olhar(o, f, { treme: e.treme });
  const x = e.qual === "A" ? XA : XB;
  const y = MESA + 0.13 + e.altura;
  return (
    <Visao cam={cam} tensao={e.tensao ?? 0} alivio={e.alivio ?? 0}>
      <Caixa t={[1.3, MESA, 0.5]} raio={0.02} pos={[0, MESA / 2, Z]} cor="#E6B67A" />
      <CaixaDePapelao pos={[XA, MESA + (e.qual === "A" ? e.altura : 0), Z]} />
      <CaixaDePapelao pos={[XB, MESA + (e.qual === "B" ? e.altura : 0), Z]} rot={e.qual === "B" ? -0.3 * s : 0} />
      {e.qual && <MaoPov cam={cam} alvo={[x + 0.16, y, Z + 0.06]} quanto={e.pega} fecha={0.35} palma={[-1, 0, 0]} />}
      {e.qual && <MaoPov cam={cam} alvo={[x - 0.16, y, Z + 0.06]} lado={-1} quanto={e.pega} fecha={0.35} palma={[1, 0, 0]} />}
    </Visao>
  );
};

const Pausa: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "absolute", top: 610, left: 64, opacity: p, background: MARCA.roxo, borderRadius: 999, padding: "20px 30px", display: "flex", gap: 12 }}>
    <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
    <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
  </div>
);

const PISTAS = ["A visão dá a primeira pista", "A experiência dá a segunda", "O cérebro prepara os músculos antes"];
const voa = (x: number) => k(x, [[0, 0], [0.12, 1], [1, 1]], elastico);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} e={{ o: entre(GERAL, NA_A, prog(p(0), 0.4, 0.75)), qual: "A", pega: prog(p(0), 0.6, 0.95), altura: 0 }} />;
  if (em(1)) {
    const x = p(1);
    return <Cena f={f} e={{ o: NA_A, qual: "A", pega: 1, altura: 0.12 * k(x, [[0.05, 0], [0.6, 1], [0.8, 1], [1, 0]]) + 0.005 * Math.sin(f * 1.3), treme: 0.6, tensao: 0.2 * prog(x, 0.1, 0.5) * (1 - prog(x, 0.8, 1)) }} />;
  }
  if (em(2)) return <Cena f={f} e={{ o: entre(NA_A, NA_B, prog(p(2), 0.1, 0.55)), qual: p(2) < 0.3 ? "A" : "B", pega: p(2) < 0.3 ? 1 - prog(p(2), 0, 0.3) : prog(p(2), 0.5, 0.95), altura: 0 }} />;
  if (em(3) || em(4)) {
    const x = em(3) ? p(3) : 1;
    return <Cena f={f} e={{ o: NA_B, qual: "B", pega: 1, altura: 0.42 * voa(prog(x, 0.1, 0.9, (v) => v)), susto: prog(x, 0.14, 0.3) * (em(4) ? 1 - 0.5 * p(4) : 1) }} />;
  }
  // --- a explicação ---
  if (em(5) || em(6)) {
    const volta = em(5) ? prog(p(5), 0, 0.2) : 1;
    return (
      <>
        <Cena f={f} e={{ o: NA_B, qual: "B", pega: mix(1, 0.72, volta), altura: 0.42 * (1 - volta), susto: 0.5 * (1 - volta) }} />
        <Pausa p={prog(volta, 0.9, 1)} />
        <Barras esperada={0.86 * (em(5) ? prog(p(5), 0.45, 0.8) : 1)} real={0} mostraReal={0} entra={em(5) ? prog(p(5), 0.35, 0.45, sair) : 1} />
        <Conceito f={f} de={F[6].de + 4} ate={F[7].de - 4} texto="controle antecipatório" topo={720} />
      </>
    );
  }
  if (em(7))
    return (
      <>
        <Cena f={f} e={{ o: NA_B, qual: "B", pega: 0.72, altura: 0 }} />
        <Etapas itens={["Tamanho", "Formato", "Material"]} aceso={Math.min(2, Math.floor(prog(p(7), 0.45, 1, (v) => v) * 3))} opacidade={prog(p(7), 0.35, 0.45)} />
      </>
    );
  if (em(8))
    return (
      <>
        <Cena f={f} e={{ o: entre(NA_B, NA_A, prog(p(8), 0.1, 0.45)), qual: null, pega: 0, altura: 0 }} />
        <Balao texto="A última pesava bastante" p={prog(p(8), 0.4, 0.55, elastico)} topo={250} tamanho={48} />
      </>
    );
  if (em(9))
    return (
      <>
        <Cena f={f} e={{ o: GERAL, qual: null, pega: 0, altura: 0 }} />
        <Explica titulo="controle antecipatório" passos={PISTAS} quantos={0.4 + prog(p(9), 0.05, 0.15) + prog(p(9), 0.2, 0.3) + prog(p(9), 0.45, 0.55)} ativo={p(9) < 0.2 ? 0 : p(9) < 0.45 ? 1 : 2} entra={prog(p(9), 0, 0.08)} />
      </>
    );
  if (em(10)) {
    const x = p(10);
    return (
      <>
        <Cena f={f} e={{ o: NA_B, qual: "B", pega: mix(0.72, 1, prog(x, 0, 0.15)), altura: 0.42 * voa(prog(x, 0.2, 1, (v) => v)), susto: prog(x, 0.24, 0.4) }} />
        <Barras esperada={0.86} real={0.2 * prog(x, 0.3, 0.5)} mostraReal={prog(x, 0.25, 0.35)} entra={1} />
      </>
    );
  }
  if (em(11)) {
    const x = p(11);
    return (
      <>
        <Cena f={f} e={{ o: NA_B, qual: "B", pega: 1, altura: 0.16 * k(x, [[0, 0.42 / 0.16], [0.2, 0], [0.5, 0], [0.8, 1], [1, 1]]), alivio: 0.5 * prog(x, 0.8, 1) }} />
        <Barras esperada={mix(0.86, 0.22, prog(x, 0.3, 0.55))} real={0.2} mostraReal={1} entra={1} iguais={prog(x, 0.55, 0.57)} />
      </>
    );
  }
  // --- o que observar ---
  if (em(12))
    return (
      <>
        <Cena f={f} e={{ o: NA_B, qual: "B", pega: 1, altura: 0.16 }} />
        <Etapas itens={["Copo cheio", "Mochila", "Jarra"]} aceso={Math.min(2, Math.floor(prog(p(12), 0.5, 1, (v) => v) * 3))} opacidade={prog(p(12), 0.4, 0.5)} />
      </>
    );
  return <Cena f={f} e={{ o: NA_B, qual: "B", pega: 1, altura: 0.16 * (1 - (em(13) ? prog(p(13), 0.5, 0.9) : 1)) }} />;
};

export const { Componente: ExplicaMenteCaixapov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
