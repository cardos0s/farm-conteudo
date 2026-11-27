import React from "react";
import { AbsoluteFill } from "remotion";
import { elastico, limitar, prog, soma } from "../anim";
import { Balao, criarEpisodio, type Quadro } from "../kit/Episodio";
import { projetar } from "../kit/Palco";
import { Barulho, Explica, MaoPov, Visao, diante, olhar, type Olhos } from "../kit/Pov";
import { Balcao, CaixaDeSom, LIQ, Liquidificador, Notas } from "../liquidificador/Video";
import { Cena as DeFora, MAOS_LIQ, MAOS_SOM } from "../maos/Video";
import { FUNCOES, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const NO_SOM: Olhos = { pos: [-0.05, 0.95, -0.1], giro: -0.45, baixa: 0.3 };
const NO_LIQ: Olhos = { pos: [0.05, 0.95, -0.1], giro: 0.5, baixa: 0.28 };

/** `onde`: "som" = a música preferida; "liq" = o lugar barulhento. `balanca` 0..1 põe as mãos balançando na frente dos olhos. */
const Cena: React.FC<{ f: number; onde: "som" | "liq"; contexto: number; balanca: number }> = ({ f, onde, contexto, balanca }) => {
  const feliz = onde === "som";
  const base = feliz ? NO_SOM : NO_LIQ;
  const pulo = feliz ? 0.02 * Math.abs(Math.sin(f * 0.33)) * contexto : 0;
  const cam = olhar({ ...base, pos: [base.pos[0], base.pos[1] + pulo, base.pos[2]] }, f, { treme: feliz ? 0 : contexto });
  const a = Math.sin(f * 1.25);
  const b = Math.sin(f * 1.25 + 1.4);
  const tela = projetar(cam, soma(LIQ, [0, 0.2, 0]));
  return (
    <>
      <Visao cam={cam} tensao={feliz ? 0 : 0.65 * contexto} alivio={feliz ? 0.45 * contexto : 0}>
        <Balcao />
        <CaixaDeSom pulsa={feliz ? contexto * Math.abs(Math.sin(f * 0.33)) : 0} />
        <Liquidificador ligado={feliz ? 0 : contexto} f={f} />
        {feliz && <Notas f={f} volume={contexto} />}
        <MaoPov cam={cam} alvo={diante(cam, 0.085 + 0.012 * b, -0.1 + 0.035 * a, 0.33)} quanto={balanca} fecha={0.15} palma={[-0.6, -0.3, -0.7]} />
        <MaoPov cam={cam} alvo={diante(cam, -0.085 - 0.012 * a, -0.1 + 0.035 * b, 0.33)} lado={-1} quanto={balanca} fecha={0.15} palma={[0.6, -0.3, -0.7]} />
      </Visao>
      {!feliz && <Barulho f={f} forca={contexto * 0.8} x={tela.x} y={tela.y} />}
    </>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em } = q;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} onde="som" contexto={prog(p(0), 0.15, 0.35)} balanca={0} />;
  if (em(1)) return <Cena f={f} onde="som" contexto={1} balanca={prog(p(1), 0.02, 0.2)} />;
  if (em(2)) {
    const x = p(2);
    return (
      <>
        <Cena f={f} onde="liq" contexto={prog(x, 0.35, 0.5)} balanca={0} />
        <AbsoluteFill style={{ background: "#FFFFFF", opacity: 0.85 * limitar(1 - x / 0.12) }} />
      </>
    );
  }
  if (em(3) || em(4)) return <Cena f={f} onde="liq" contexto={em(4) ? 1 - 0.3 * p(4) : 1} balanca={em(3) ? prog(p(3), 0.02, 0.2) : 1} />;
  // --- a explicação ---
  if (em(5)) return <DeFora f={f} onde={p(5) < 0.5 ? "som" : "liq"} cam={p(5) < 0.5 ? MAOS_SOM : MAOS_LIQ} contexto={0} />;
  if (em(6) || em(7) || em(8) || em(9)) {
    const i = em(6) ? -1 : em(7) ? 0 : em(8) ? 1 : 2;
    return (
      <>
        <Cena f={f} onde="som" contexto={1} balanca={1} />
        <Explica titulo="stimming" passos={FUNCOES} quantos={i + 0.4 + (i >= 0 ? prog(p(i + 7), 0.1, 0.3) * 0.6 : 0)} ativo={i} entra={em(6) ? prog(p(6), 0, 0.1) : 1} />
      </>
    );
  }
  if (em(10))
    return (
      <>
        <Cena f={f} onde="som" contexto={1} balanca={1} />
        <Balao texto="Não machuca? Não precisa impedir." p={prog(p(10), 0.2, 0.35, elastico)} topo={250} cor="#2FB36B" corTexto="#FFFFFF" tamanho={46} />
      </>
    );
  if (em(11))
    return (
      <>
        <Cena f={f} onde="liq" contexto={1} balanca={1} />
        <Balao texto="Com sofrimento? Procurar a causa." p={prog(p(11), 0.25, 0.4, elastico)} topo={250} tamanho={46} />
      </>
    );
  // --- o que observar ---
  return (
    <>
      <Cena f={f} onde="som" contexto={1} balanca={1} />
      {em(12) && <Balao texto="É a minha música preferida!" p={prog(p(12), 0.4, 0.55, elastico)} topo={250} tamanho={46} />}
    </>
  );
};

export const { Componente: ExplicaMenteMaospov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
