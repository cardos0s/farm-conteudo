import React from "react";
import { AbsoluteFill } from "remotion";
import { MARCA } from "../Legendas";
import { Caixa, Esfera, Seg } from "../Pecas";
import { elastico, k, mix, prog, type V3 } from "../anim";
import { Calendario, MES_DIA_RUIM, MES_MUDANCA, Violao } from "../hobby/Video";
import { Balao, Conceito, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Pensamento, Visao, olhar, type Olhos } from "../kit/Pov";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const VIOLAO: V3 = [0.22, 0.1, 0.55];
const OLHOS: Olhos = { pos: [0, 1.2, -0.72], giro: Math.PI - 0.16, baixa: 0.42 };

/** `cinza` tira a cor da cena (a vontade que não vem); `tenta` estica a mão até o violão; `lembra` solta notas da memória; `dia` 0..1 é a luz. */
const Cena: React.FC<{ f: number; cinza: number; tenta?: number; lembra?: number; dia?: number }> = ({ f, cinza, tenta = 0, lembra = 0, dia = 1 }) => {
  const cam = olhar(OLHOS, f);
  return (
    <>
      <Visao cam={cam} tensao={cinza}>
        <Caixa t={[7, 3.2, 0.1]} raio={0.02} pos={[0, 1.6, 2.4]} cor="#FFF0DA" />
        <Caixa t={[1.0, 1.2, 0.06]} raio={0.03} pos={[-0.9, 1.7, 2.33]} cor="#FFFFFF" />
        <Caixa t={[0.86, 1.06, 0.02]} raio={0.02} pos={[-0.9, 1.7, 2.29]} cor="#BFE6FF" emissivo="#BFE6FF" brilho={0.6 * dia} sombra={false} />
        {/* o suporte e o violão */}
        <Seg a={[VIOLAO[0] - 0.14, 0, VIOLAO[2] - 0.1]} b={[VIOLAO[0], 0.42, VIOLAO[2] + 0.08]} r={0.014} cor="#2B2F55" />
        <Seg a={[VIOLAO[0] + 0.14, 0, VIOLAO[2] - 0.1]} b={[VIOLAO[0], 0.42, VIOLAO[2] + 0.08]} r={0.014} cor="#2B2F55" />
        <Seg a={[VIOLAO[0], 0, VIOLAO[2] + 0.22]} b={[VIOLAO[0], 0.42, VIOLAO[2] + 0.08]} r={0.014} cor="#2B2F55" />
        <Violao pos={VIOLAO} rot={[0.18, Math.PI + 0.2, 0]} />
        {/* minhas pernas */}
        <Seg a={[0.1, 0.5, -0.72]} b={[0.11, 0.5, -0.36]} r={0.075} cor="#3B4A7A" />
        <Seg a={[-0.1, 0.5, -0.72]} b={[-0.11, 0.5, -0.36]} r={0.075} cor="#3B4A7A" />
        <Seg a={[0.11, 0.5, -0.36]} b={[0.11, 0.09, -0.32]} r={0.065} cor="#3B4A7A" />
        <Seg a={[-0.11, 0.5, -0.36]} b={[-0.11, 0.09, -0.32]} r={0.065} cor="#3B4A7A" />
        <MaoPov cam={cam} alvo={[VIOLAO[0] + 0.02, 0.95, VIOLAO[2] - 0.12]} lado={-1} quanto={tenta} fecha={0.25} />
        {lembra > 0.02 &&
          [0, 1, 2, 3].map((i) => {
            const u = ((f + i * 16) % 64) / 64;
            return <Esfera key={i} r={0.04 * lembra * Math.min(1, u * 5, (1 - u) * 4)} pos={[VIOLAO[0] - 0.2 + 0.14 * i + 0.06 * Math.sin(u * 6 + i), 0.8 + u * 0.6, VIOLAO[2] - 0.1]} cor={i % 2 ? "#2EC4B6" : "#FFC53D"} emissivo={i % 2 ? "#2EC4B6" : "#FFC53D"} brilho={0.5} sombra={false} />;
          })}
      </Visao>
      <AbsoluteFill style={{ background: "#241A4A", opacity: 0.4 * (1 - dia) }} />
    </>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} cinza={0} lembra={prog(p(0), 0.35, 0.55) * (1 - prog(p(0), 0.85, 1))} />;
  if (em(1)) return <Cena f={f} cinza={0.7 * prog(p(1), 0.1, 0.6)} tenta={k(p(1), [[0.15, 0], [0.45, 0.55], [0.6, 0.55], [0.95, 0]])} />;
  if (em(2))
    return (
      <>
        <Cena f={f} cinza={0.7} />
        <Pensamento f={f} texto="Amanhã, talvez." forca={prog(p(2), 0.1, 0.4)} topo={560} />
      </>
    );
  if (em(3)) return <Cena f={f} cinza={0.7} dia={0.5 + 0.5 * Math.cos(p(3) * 5 * 2 * Math.PI)} />;
  if (em(4)) return <Cena f={f} cinza={0.7} />;
  // --- a explicação ---
  if (em(5)) return <Cena f={f} cinza={mix(0, 0.7, prog(p(5), 0.45, 0.6))} lembra={1 - prog(p(5), 0.4, 0.5)} />;
  if (em(6) || em(7))
    return (
      <>
        <Cena f={f} cinza={0.7} tenta={em(7) ? k(p(7), [[0.3, 0], [0.55, 0.5], [0.7, 0.5], [0.95, 0]]) : 0} />
        {em(6) && <Conceito f={f} de={F[6].de + 4} ate={F[7].de - 4} texto="anedonia" />}
        {em(7) && <Balao texto="Não é preguiça" p={prog(p(7), 0.02, 0.16, elastico)} topo={250} cor={MARCA.sol} tamanho={60} />}
      </>
    );
  if (em(8))
    return (
      <>
        <Cena f={f} cinza={0.7} />
        <Balao texto="pode fazer parte da depressão" p={prog(p(8), 0.2, 0.35, elastico)} topo={250} tamanho={46} />
      </>
    );
  if (em(9))
    return (
      <AbsoluteFill style={{ background: MARCA.creme }}>
        <Calendario dias={MES_DIA_RUIM} mostra={prog(p(9), 0.02, 0.4, (v) => v)} destaque={p(9) > 0.5 ? [15, 15] : undefined} titulo="Um dia ruim" />
      </AbsoluteFill>
    );
  if (em(10) || em(11))
    return (
      <AbsoluteFill style={{ background: MARCA.creme }}>
        <Calendario dias={MES_MUDANCA} mostra={em(10) ? prog(p(10), 0.02, 0.35, (v) => v) : 1} destaque={em(11) || p(10) > 0.5 ? [14, 27] : undefined} titulo="Duas semanas ou mais" />
        {em(11) && <Balao texto="comparar com a rotina da própria pessoa" p={prog(p(11), 0.1, 0.25, elastico)} topo={1010} cor={MARCA.roxo} corTexto="#FFFFFF" tamanho={44} />}
      </AbsoluteFill>
    );
  // --- o que fazer ---
  return (
    <>
      <Cena f={f} cinza={0.5} />
      {em(12) && <Balao texto="Conversar com um profissional de saúde" p={prog(p(12), 0.2, 0.35, elastico)} topo={250} cor="#2FB36B" corTexto="#FFFFFF" tamanho={46} />}
    </>
  );
};

export const { Componente: ExplicaMenteHobbypov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
