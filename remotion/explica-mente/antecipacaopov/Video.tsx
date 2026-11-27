import React from "react";
import { AbsoluteFill } from "remotion";
import { Armario, DENTRO, FORA } from "../antecipacao/Video";
import { elastico, k, limitar, mix, mixV, prog, soma, type V3 } from "../anim";
import { Balao, Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { projetar } from "../kit/Palco";
import { Barulho, MaoPov, Visao, diante, entre, olhar, type Olhos } from "../kit/Pov";
import { BOTAO_LIQ, Balcao, Braco, LIQ, Liquidificador } from "../liquidificador/Video";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NO_ARMARIO: Olhos = { pos: [0.2, 0.95, -0.05], giro: 0.25, baixa: -0.18 };
const NO_BALCAO: Olhos = { pos: [0.2, 0.95, -0.05], giro: 0.36, baixa: 0.42 };
const LINHA = ["Aparelho à vista", "Mãos nos ouvidos", "Aparelho ligado"];

/** A cena inteira num tempo só (0..1): armário abre, aparelho sai e desce, mãos nos ouvidos, alguém liga. */
const Cena: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const abre = k(t, [[0, 0], [0.13, 1], [0.55, 1], [0.66, 0]]);
  const pos = mixV(mixV(DENTRO, FORA, prog(t, 0.15, 0.3)), LIQ, prog(t, 0.3, 0.5));
  const ligado = prog(t, 0.79, 0.81);
  const tapa = prog(t, 0.3, 0.44);
  const o = entre(NO_ARMARIO, NO_BALCAO, prog(t, 0.28, 0.5));
  const cam = olhar(o, f, { treme: ligado });
  const noAparelho = soma(pos, [0.11, 0.2, 0.06]);
  const longe: V3 = [1.3, 1.0, -0.7];
  const mao = t < 0.55 ? mixV(longe, noAparelho, prog(t, 0.02, 0.15)) : t < 0.68 ? mixV(noAparelho, longe, prog(t, 0.55, 0.66)) : mixV(longe, soma(BOTAO_LIQ, [0.03, 0.01, 0.045]), k(t, [[0.68, 0], [0.78, 1], [0.86, 1], [0.95, 0]]));
  const tela = projetar(cam, soma(LIQ, [0, 0.2, 0]));
  return (
    <>
      <Visao cam={cam} tensao={Math.max(0.75 * prog(t, 0.16, 0.4), ligado)}>
        <Balcao />
        <Armario abre={abre} />
        <Liquidificador ligado={ligado} f={f} pos={pos} />
        <Braco mao={mao} />
        <MaoPov cam={cam} alvo={diante(cam, 0.125, 0.0, 0.3)} quanto={tapa} fecha={0.25} palma={[-1, 0, 0]} />
        <MaoPov cam={cam} alvo={diante(cam, -0.125, 0.0, 0.3)} lado={-1} quanto={tapa} fecha={0.25} palma={[1, 0, 0]} />
      </Visao>
      <Barulho f={f} forca={ligado * 0.6} x={tela.x} y={tela.y} />
    </>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} t={mix(0, 0.15, p(0))} />;
  if (em(1)) return <Cena f={f} t={mix(0.15, 0.3, p(1))} />;
  if (em(2)) return <Cena f={f} t={mix(0.3, 0.42, p(2))} />;
  if (em(3)) return <Cena f={f} t={mix(0.42, 0.6, p(3))} />;
  if (em(4)) return <Cena f={f} t={0.6} />;
  // --- a explicação ---
  if (em(5)) return <Cena f={f} t={0.62} />;
  if (em(6))
    return (
      <>
        <Cena f={f} t={0.62} />
        <Conceito f={f} de={F[6].de + 4} ate={F[7].de - 4} texto="antecipação" />
      </>
    );
  if (em(7) || em(8)) {
    // a cena de novo, com a linha do tempo ao lado
    const x = em(7) ? p(7) * 0.55 : 0.55 + p(8) * 0.45;
    const parte = x < 0.4 ? 0 : x < 0.7 ? 1 : 2;
    const t = parte === 0 ? mix(0, 0.3, x / 0.4) : parte === 1 ? mix(0.3, 0.6, (x - 0.4) / 0.3) : mix(0.68, 0.92, (x - 0.7) / 0.3);
    return (
      <>
        <Cena f={f} t={t} />
        <Etapas itens={LINHA} aceso={parte} emColuna topo={228} opacidade={prog(x, 0, 0.06)} />
      </>
    );
  }
  if (em(9))
    return (
      <>
        <Cena f={f} t={0.62} />
        <Etapas itens={["Não poder prever", "Não poder controlar"]} aceso={p(9) < 0.75 ? 0 : 1} emColuna topo={236} opacidade={prog(p(9), 0.45, 0.55)} />
      </>
    );
  if (em(10)) {
    const x = p(10);
    const volta = limitar(1 - Math.abs(x - 0.5) / 0.06);
    return (
      <>
        <Cena f={f} t={x < 0.5 ? 0.62 : mix(0.05, 0.45, prog(x, 0.55, 1, (v) => v))} />
        <AbsoluteFill style={{ background: "#FFFFFF", opacity: 0.8 * volta }} />
      </>
    );
  }
  // --- o que testar ---
  if (em(11)) {
    const x = p(11);
    return (
      <>
        <Cena f={f} t={mix(0.0, 0.14, prog(x, 0.5, 1))} />
        <Balao texto="Vou usar o liquidificador, tá?" p={prog(x, 0.05, 0.18, elastico)} topo={236} tamanho={46} />
        <Etapas itens={["Avisar antes", "Mostrar o que vai acontecer", "Dizer por quanto tempo"]} aceso={Math.min(2, Math.floor(prog(x, 0.3, 1, (v) => v) * 3))} emColuna topo={410} opacidade={prog(x, 0.22, 0.32)} />
      </>
    );
  }
  return (
    <>
      <Cena f={f} t={em(12) ? mix(0.14, 0.45, p(12)) : 0.6} />
      {em(12) && <Etapas itens={LINHA} aceso={0} emColuna topo={228} />}
    </>
  );
};

export const { Componente: ExplicaMenteAntecipacaopov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
