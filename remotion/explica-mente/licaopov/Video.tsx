import React from "react";
import { Seg } from "../Pecas";
import { elastico, mix, prog, type V3 } from "../anim";
import { Mesa } from "../colher/Objetos";
import { Balao, Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Pensamento, Visao, olhar, type Olhos } from "../kit/Pov";
import { Botao, Caderno, Conta } from "../licao/Video";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NO_CADERNO: Olhos = { pos: [0, 0.34, -0.2], giro: Math.PI, baixa: 0.9, fov: 62 };
const LONGE: Olhos = { pos: [0, 0.34, -0.2], giro: Math.PI - 0.5, baixa: 0.12, fov: 62 };
const misto = (t: number): Olhos => ({ ...NO_CADERNO, giro: mix(NO_CADERNO.giro, LONGE.giro, t), baixa: mix(NO_CADERNO.baixa, LONGE.baixa, t) });

type Est = { o: Olhos; hesita: number; abre?: number; pagina?: number; escreve?: number; tensao?: number; alivio?: number };

const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => {
  const cam = olhar(e.o, f);
  const abre = e.abre ?? 0;
  const escreve = e.escreve ?? 0;
  // a mão paira sobre a capa, abre o caderno ou escreve
  const pairando: V3 = [-0.05 + 0.012 * Math.sin(f * 0.25), 0.1 + 0.03 * (1 - e.hesita), 0.06];
  const abrindo: V3 = [mix(0.07, -0.15, abre), 0.06 + 0.1 * Math.sin(Math.PI * abre), 0.06];
  const escrevendo: V3 = [-0.02 + 0.05 * Math.sin(f * 0.5), 0.05, 0.0 + 0.09 * ((f * 0.01) % 1)];
  const alvo = escreve > 0.05 ? escrevendo : abre > 0 && abre < 1 ? abrindo : pairando;
  return (
    <Visao cam={cam} tensao={e.tensao ?? 0} alivio={e.alivio ?? 0} sala={[0, -0.62, 0.15]}>
      <Mesa />
      <Caderno abre={abre} pagina={e.pagina ?? 0} escrito={escreve} />
      <MaoPov cam={cam} alvo={alvo} quanto={Math.max(e.hesita, escreve, abre > 0 && abre < 1 ? 1 : 0)} fecha={escreve > 0.05 ? 0.7 : 0.3} />
      {escreve > 0.1 && <Seg a={[alvo[0] + 0.01, alvo[1] - 0.035, alvo[2] - 0.02]} b={[alvo[0] - 0.03, alvo[1] + 0.09, alvo[2] + 0.03]} r={0.007} cor="#FFC53D" />}
    </Visao>
  );
};

const vaiEVolta = (f: number) => 0.5 + 0.5 * Math.sin(f * 0.12);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0))
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: 0 }} />
        <Conta p={prog(p(0), 0.1, 0.3, elastico)} />
      </>
    );
  if (em(1)) return <Cena f={f} e={{ o: NO_CADERNO, hesita: 0.4 * prog(p(1), 0.4, 0.8) }} />;
  if (em(2))
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: vaiEVolta(f), tensao: 0.2 }} />
        <Pensamento f={f} texto="Já vou." forca={prog(p(2), 0.35, 0.55)} topo={520} />
      </>
    );
  if (em(3) || em(4)) {
    const foge = em(3) ? prog(p(3), 0.1, 0.4) * (1 - prog(p(3), 0.65, 0.95)) : 0;
    return (
      <>
        <Cena f={f} e={{ o: misto(foge), hesita: 0.3 * vaiEVolta(f), tensao: 0.45 }} />
        <Pensamento f={f} texto="Já vou." forca={0.8} ecos={em(3) ? p(3) * 0.75 : 0.75} topo={520} />
      </>
    );
  }
  // --- a explicação ---
  if (em(5))
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: 0.3, tensao: 0.3 }} />
        <Balao texto="Saber o conteúdo  ✓" p={prog(p(5), 0.02, 0.16, elastico)} topo={240} cor="#2FB36B" corTexto="#FFFFFF" tamanho={48} />
        <Balao texto="Começar  …" p={prog(p(5), 0.5, 0.64, elastico)} topo={380} tamanho={48} />
      </>
    );
  if (em(6))
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: 0.3, tensao: 0.3 }} />
        <Conceito f={f} de={F[6].de + 4} ate={F[7].de - 4} texto="iniciação de tarefa" />
      </>
    );
  if (em(7))
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: 0.3, tensao: 0.3 }} />
        <Etapas itens={["Decidir o que fazer primeiro", "Achar o material", "Largar o que estava fazendo"]} aceso={Math.min(2, Math.floor(prog(p(7), 0.25, 1, (v) => v) * 3))} emColuna topo={236} opacidade={prog(p(7), 0.12, 0.22)} />
      </>
    );
  if (em(8)) return <Cena f={f} e={{ o: misto(0.6 * vaiEVolta(f * 0.4)), hesita: 0.2, tensao: 0.5 }} />;
  if (em(9))
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: 0.3 * vaiEVolta(f), tensao: 0.5 }} />
        <Balao texto="Faz a lição!" p={prog(p(9), 0.05, 0.18, elastico)} topo={240} cor="#EDE6F7" corTexto="#8B8FA8" />
        <Balao texto="Faz a lição!" p={prog(p(9), 0.35, 0.48, elastico)} topo={380} cor="#EDE6F7" corTexto="#8B8FA8" />
        <Balao texto="Faz a lição!" p={prog(p(9), 0.62, 0.75, elastico)} topo={520} cor="#EDE6F7" corTexto="#8B8FA8" />
      </>
    );
  if (em(10)) {
    const x = p(10);
    return (
      <>
        <Cena f={f} e={{ o: NO_CADERNO, hesita: 0.5, abre: prog(x, 0.5, 0.72), pagina: prog(x, 0.76, 0.99, (v) => v), tensao: 0.5 * (1 - prog(x, 0.3, 0.5)) }} />
        <Botao n={1} texto="Abrir na página 12" p={prog(x, 0.28, 0.42, elastico)} apertado={prog(x, 0.48, 0.54)} topo={250} />
      </>
    );
  }
  // --- o que testar ---
  const x = em(11) ? p(11) : 1;
  return (
    <>
      <Cena f={f} e={{ o: NO_CADERNO, hesita: 0, abre: 1, pagina: 1, escreve: prog(x, 0.05, 0.3), alivio: 0.5 * prog(x, 0.3, 0.7) }} />
      {em(12) && <Balao texto="Faz a lição!" p={prog(p(12), 0.25, 0.38, elastico) * 0.85} topo={240} cor="#EDE6F7" corTexto="#8B8FA8" tamanho={46} />}
      {em(12) && <Balao texto="Abre o caderno na página 12  ✓" p={prog(p(12), 0.55, 0.68, elastico)} topo={370} cor="#2FB36B" corTexto="#FFFFFF" tamanho={44} />}
    </>
  );
};

export const { Componente: ExplicaMenteLicaopov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
