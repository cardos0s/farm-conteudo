import React from "react";
import { elastico, k, mix, mixV, prog, soma, type V3 } from "../anim";
import { Balao, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Barulho, Explica, MaoPov, Visao, diante, entre, olhar, type Olhos } from "../kit/Pov";
import { projetar } from "../kit/Palco";
import { BOTAO_LIQ, Balcao, Braco, CaixaDeSom, LIQ, Liquidificador, Notas, SOM } from "../liquidificador/Video";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NO_SOM: Olhos = { pos: [-0.05, 0.95, -0.2], giro: -0.52, baixa: 0.3 };
const NO_LIQ: Olhos = { pos: [0.05, 0.95, -0.2], giro: 0.55, baixa: 0.28 };
const OS_DOIS: Olhos = { pos: [0.02, 1.0, 1.35], giro: 0, baixa: 0.16 };

type Est = { o: Olhos; musica: number; ligado: number; tensao: number; ouvidos: number; botao?: number; volume?: number; braco?: number; danca?: number };

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const danca = (e.danca ?? 0) * e.musica;
  const o: Olhos = { ...e.o, pos: [e.o.pos[0] + 0.03 * Math.sin(f * 0.33) * danca, e.o.pos[1] + 0.02 * Math.abs(Math.sin(f * 0.33)) * danca, e.o.pos[2]] };
  const cam = olhar(o, f, { treme: e.ligado * e.tensao });
  const liq = projetar(cam, soma(LIQ, [0, 0.2, 0]));
  return (
    <>
      <Visao cam={cam} tensao={e.tensao}>
        <Balcao />
        <CaixaDeSom pulsa={e.musica * Math.abs(Math.sin(f * 0.33))} />
        <Liquidificador ligado={e.ligado} f={f} />
        <Notas f={f} volume={e.musica} />
        {(e.braco ?? 0) > 0.01 && <Braco mao={mixV([1.3, 0.9, -0.6], soma(BOTAO_LIQ, [0.03, 0.01, 0.045]), e.braco ?? 0)} />}
        {/* minha mão no botão ou no volume da caixa de som */}
        <MaoPov cam={cam} alvo={soma(SOM, [0.05, 0.36, 0.05])} quanto={e.botao ?? 0} fecha={0.35} />
        <MaoPov cam={cam} alvo={soma(SOM, [-0.06, 0.37, 0.05])} quanto={e.volume ?? 0} fecha={0.55} />
        {/* minhas mãos indo tapar os ouvidos */}
        <MaoPov cam={cam} alvo={diante(cam, 0.125, 0.0, 0.3)} quanto={e.ouvidos} fecha={0.25} palma={[-1, 0, 0]} />
        <MaoPov cam={cam} alvo={diante(cam, -0.125, 0.0, 0.3)} lado={-1} quanto={e.ouvidos} fecha={0.25} palma={[1, 0, 0]} />
      </Visao>
      <Barulho f={f} forca={e.ligado * (1 - 0.45 * e.ouvidos)} x={liq.x} y={liq.y} />
    </>
  );
};

const COMPARA = ["Começo: ela escolhe × de surpresa", "Duração: ela sabe × não sabe", "Controle: com ela × com outra pessoa"];
const PESA = ["O som pode chegar mais alto, ou tudo de uma vez", "Não conseguir prever", "Não conseguir controlar"];

const desenhar = (q: Quadro) => {
  const { f, p, em } = q;
  // --- a vivência ---
  if (em(0)) {
    const x = p(0);
    return <Cena f={f} e={{ o: NO_SOM, musica: prog(x, 0.42, 0.5), ligado: 0, tensao: 0, ouvidos: 0, botao: k(x, [[0.15, 0], [0.38, 1], [0.5, 1], [0.7, 0]]), danca: prog(x, 0.6, 0.8) }} />;
  }
  if (em(1)) {
    const x = p(1);
    return <Cena f={f} e={{ o: NO_SOM, musica: 1 - 0.55 * prog(x, 0.6, 0.8), ligado: 0, tensao: 0, ouvidos: 0, volume: k(x, [[0.4, 0], [0.58, 1], [0.85, 1], [1, 0]]), danca: 1 - prog(x, 0.35, 0.5) }} />;
  }
  if (em(2)) {
    const x = p(2);
    return <Cena f={f} e={{ o: entre(NO_SOM, NO_LIQ, prog(x, 0.45, 0.8)), musica: 0.45, ligado: prog(x, 0.84, 0.88), tensao: 0.5 * prog(x, 0.84, 1), ouvidos: 0, braco: prog(x, 0.1, 0.8), danca: 1 - prog(x, 0.3, 0.5) }} />;
  }
  if (em(3)) return <Cena f={f} e={{ o: NO_LIQ, musica: 0, ligado: 1, tensao: mix(0.5, 0.85, p(3)), ouvidos: 0, braco: 1 }} />;
  if (em(4)) return <Cena f={f} e={{ o: { ...NO_LIQ, baixa: mix(0.28, 0.5, p(4)) }, musica: 0, ligado: 1, tensao: 1, ouvidos: prog(p(4), 0.35, 0.7), braco: 0.6 }} />;
  // --- a explicação ---
  if (em(5)) return <Cena f={f} e={{ o: entre(NO_LIQ, OS_DOIS, prog(p(5), 0, 0.8)), musica: 0, ligado: 1 - prog(p(5), 0.2, 0.4), tensao: 0.6 * (1 - prog(p(5), 0.3, 0.9)), ouvidos: 1 - prog(p(5), 0.4, 0.9), braco: 0 }} />;
  if (em(6)) return <Cena f={f} e={{ o: OS_DOIS, musica: prog(p(6), 0.1, 0.2), ligado: 0, tensao: 0, ouvidos: 0 }} />;
  if (em(7) || em(8)) {
    const quantos = em(7) ? prog(p(7), 0.3, 0.5) : 1 + prog(p(8), 0.45, 0.6) + prog(p(8), 0.78, 0.9);
    return (
      <>
        <Cena f={f} e={{ o: OS_DOIS, musica: 0.5, ligado: 0, tensao: 0, ouvidos: 0 }} />
        <Explica titulo="processamento sensorial" passos={PESA} quantos={quantos + 0.4} ativo={em(7) ? 0 : p(8) < 0.78 ? 1 : 2} entra={em(7) ? prog(p(7), 0, 0.1) : 1} />
      </>
    );
  }
  if (em(9) || em(10)) {
    const x = em(9) ? p(9) : 1;
    return (
      <>
        <Cena f={f} e={{ o: OS_DOIS, musica: 0.5, ligado: 0, tensao: 0, ouvidos: 0 }} />
        <Explica titulo="música × liquidificador" passos={COMPARA} quantos={em(9) ? 0.4 + prog(x, 0.25, 0.4) + prog(x, 0.5, 0.65) + prog(x, 0.75, 0.9) : 3.4} ativo={em(9) ? (x < 0.5 ? 0 : x < 0.75 ? 1 : 2) : -1} />
      </>
    );
  }
  if (em(11))
    return (
      <>
        <Cena f={f} e={{ o: OS_DOIS, musica: 0.4, ligado: 0, tensao: 0.15, ouvidos: 0 }} />
        <Etapas itens={["Sono", "Cansaço", "Ambiente"]} aceso={Math.min(2, Math.floor(prog(p(11), 0.35, 1, (v) => v) * 3))} opacidade={prog(p(11), 0.25, 0.35)} />
      </>
    );
  // --- o que testar e observar ---
  if (em(12)) {
    const x = p(12);
    return (
      <>
        <Cena f={f} e={{ o: NO_LIQ, musica: 0, ligado: prog(x, 0.62, 0.66), tensao: 0.25 * prog(x, 0.62, 0.8), ouvidos: 0, braco: prog(x, 0.4, 0.62) }} />
        <Balao texto="Vou ligar. É rapidinho!" p={prog(x, 0.12, 0.26, elastico) * (1 - prog(x, 0.55, 0.62))} topo={250} tamanho={48} />
      </>
    );
  }
  const x = em(13) ? p(13) : 1;
  const parte = Math.min(2, Math.floor(prog(x, 0.42, 1, (v) => v) * 3));
  return (
    <>
      <Cena f={f} e={{ o: NO_LIQ, musica: 0, ligado: em(13) && parte < 2 ? 1 : 0, tensao: em(13) ? (parte === 2 ? 0.5 : 0.4) : 0.3, ouvidos: em(13) ? (parte === 0 ? 0 : 1) : 1, braco: parte === 2 ? 0.7 : 1 }} />
      {em(13) && <Etapas itens={["No começo", "Durante", "Antes de ligar"]} aceso={x < 0.42 ? -1 : parte} opacidade={prog(x, 0.3, 0.4)} />}
    </>
  );
};

export const { Componente: ExplicaMenteLiquidificadorpov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
