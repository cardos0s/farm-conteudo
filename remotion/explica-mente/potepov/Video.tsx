import React from "react";
import { MARCA } from "../Legendas";
import { mix, prog } from "../anim";
import { Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import type { Cam } from "../kit/Palco";
import { Aperto } from "../kit/Pov";
import { Cena } from "../pote/Video";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

/** Os olhos de quem está sentado à mesa, olhando para as próprias mãos no pote. */
const OLHOS: Cam = { pos: [0.02, 0.5, -0.42], alvo: [0.02, 0.1, 0.06], fov: 50 };
const PERTO: Cam = { pos: [0.02, 0.44, -0.34], alvo: [0.02, 0.1, 0.06], fov: 50 };
const cam = (t: number): Cam => ({ pos: [0.02, mix(OLHOS.pos[1], PERTO.pos[1], t), mix(OLHOS.pos[2], PERTO.pos[2], t)], alvo: OLHOS.alvo, fov: 50 });

const Pausa: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "absolute", top: 250, left: 64, opacity: p, background: MARCA.roxo, borderRadius: 999, padding: "20px 30px", display: "flex", gap: 12 }}>
    <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
    <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
  </div>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  const vai = f * 0.16;
  // --- a vivência ---
  if (em(0)) return <Cena f={f} e={{ firma: 0, torce: 0.6, abre: 0 }} cam={OLHOS} />;
  if (em(1) || em(2))
    return (
      <>
        <Cena f={f} e={{ firma: 0, torce: vai, abre: 0 }} cam={cam(em(1) ? p(1) : 1)} />
        <Aperto tensao={em(2) ? 0.5 * p(2) : 0} />
      </>
    );
  if (em(3) || em(4)) {
    const para = em(3) ? prog(p(3), 0.1, 0.25) : 1;
    return (
      <>
        <Cena f={f} e={{ firma: 0, torce: mix(vai, Math.round(vai / Math.PI) * Math.PI + 1.2, para), abre: 0, setaPote: em(3) ? prog(p(3), 0.4, 0.55) : 1 }} cam={PERTO} />
        <Pausa p={para} />
      </>
    );
  }
  // --- a explicação ---
  if (em(5))
    return (
      <>
        <Cena f={f} e={{ firma: 0, torce: 1.2, abre: 0 }} cam={OLHOS} />
        <Etapas itens={["Estabilizar", "Girar"]} aceso={-1} opacidade={prog(p(5), 0.5, 0.6)} />
      </>
    );
  if (em(6))
    return (
      <>
        <Cena f={f} e={{ firma: prog(p(6), 0.1, 0.4), torce: 1.2, abre: 0, setasFirma: prog(p(6), 0.4, 0.55) }} cam={OLHOS} />
        <Etapas itens={["Estabilizar", "Girar"]} aceso={0} />
      </>
    );
  if (em(7))
    return (
      <>
        <Cena f={f} e={{ firma: 1, torce: 1.2 + p(7) * 8, abre: prog(p(7), 0.35, 0.95), setaTampa: prog(p(7), 0.05, 0.2) * (1 - prog(p(7), 0.75, 0.9)), setasFirma: 1 - prog(p(7), 0.8, 0.95) }} cam={OLHOS} />
        <Etapas itens={["Estabilizar", "Girar"]} aceso={1} />
        <Aperto alivio={0.6 * prog(p(7), 0.85, 1)} />
      </>
    );
  if (em(8))
    return (
      <>
        <Cena f={f} e={{ firma: 1, torce: 1.2, abre: 0, setasFirma: 1, setaTampa: 1 }} cam={OLHOS} />
        <Conceito f={f} de={F[8].de + 4} ate={F[9].de - 4} texto="coordenação bilateral" />
      </>
    );
  if (em(9)) {
    const solta = prog(p(9), 0.1, 0.4);
    return (
      <>
        <Cena f={f} e={{ firma: 1 - 0.75 * solta, torce: vai, abre: 0, setaPote: prog(p(9), 0.5, 0.65) }} cam={OLHOS} />
        <Aperto tensao={0.35 * solta} />
      </>
    );
  }
  if (em(10))
    return (
      <>
        <Cena f={f} e={{ firma: 1, torce: 1.2, abre: 0 }} cam={OLHOS} />
        <Etapas itens={["Tesoura", "Abotoar", "Garrafa"]} aceso={Math.min(2, Math.floor(prog(p(10), 0.3, 1, (v) => v) * 3))} opacidade={prog(p(10), 0.2, 0.3)} />
      </>
    );
  // --- o que observar ---
  const x = em(11) ? prog(p(11), 0.4, 1, (v) => v) : 1;
  const parte = em(11) ? (p(11) < 0.4 ? -1 : Math.min(2, Math.floor(x * 3))) : 2;
  return (
    <>
      <Cena f={f} e={{ firma: parte === -1 ? 0 : 1, torce: parte === 2 ? vai : 1.2, abre: 0, setasFirma: parte === 0 ? 1 : 0, setaTampa: parte === 2 ? 1 : 0 }} cam={OLHOS} />
      {em(11) && <Etapas itens={["Estabilizar o pote", "Segurar a tampa", "Girar a tampa"]} aceso={parte} emColuna topo={232} opacidade={prog(p(11), 0.25, 0.35)} />}
    </>
  );
};

export const { Componente: ExplicaMentePotepov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
