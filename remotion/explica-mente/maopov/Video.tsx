import React from "react";
import { AbsoluteFill } from "remotion";
import { Banquinho } from "../Cenario";
import { MARCA } from "../Legendas";
import { Esfera } from "../Pecas";
import { elastico, mix, prog } from "../anim";
import { Balao, Conceito, Etapas, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { MaoPov, Visao, diante, olhar, type Olhos } from "../kit/Pov";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const OLHOS: Olhos = { pos: [0, 0.95, 0.5], giro: 0.1, baixa: 0.2 };
const BOLA: [number, number, number] = [0.12, 0.345, -0.15];

/** A sala de olhos abertos: `ergue` levanta a mão; `alcanca` leva até a bola. */
const Sala3D: React.FC<{ f: number; ergue: number; alcanca?: number; bola?: number; baixa?: number }> = ({ f, ergue, alcanca = 0, bola = 0, baixa = 0.2 }) => {
  const cam = olhar({ ...OLHOS, baixa }, f);
  const noAlto = diante(cam, 0.035, 0.09, 0.4);
  const alvo: [number, number, number] = [mix(noAlto[0], BOLA[0] + 0.02, alcanca), mix(noAlto[1], BOLA[1] + 0.1, alcanca), mix(noAlto[2], BOLA[2] + 0.05, alcanca)];
  return (
    <Visao cam={cam}>
      <Banquinho pos={[BOLA[0], 0, BOLA[2]]} />
      {bola > 0.01 && <Esfera r={0.075 * bola} pos={BOLA} cor="#FF5A4E" />}
      <MaoPov cam={cam} alvo={alvo} quanto={Math.max(ergue, alcanca)} fecha={0.2 + 0.3 * alcanca} />
    </Visao>
  );
};

/**
 * De olhos fechados: o braço que não se vê, desenhado em pontilhado onde o corpo sente que ele está.
 * `ergue` 0..1 sobe a mão; `musculos` e `tendoes` acendem os sensores; `sinais` manda os avisos para o corpo.
 */
const BracoSentido: React.FC<{ f: number; ergue: number; forca: number; musculos?: number; tendoes?: number; sinais?: number; firme?: number }> = ({ f, ergue, forca, musculos = 0, tendoes = 0, sinais = 0, firme = 0 }) => {
  if (forca < 0.02) return null;
  const O = { x: 1010, y: 1900 };
  const C = { x: mix(900, 830, ergue), y: mix(1560, 1380, ergue) };
  const M = { x: mix(800, 650, ergue), y: mix(1260, 640, ergue) + 10 * Math.sin(f * 0.07) };
  const entre2 = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
  const pisca = 0.6 + 0.4 * Math.sin(f * 0.4);
  return (
    <AbsoluteFill style={{ opacity: forca }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <g stroke="#B9A6FF" strokeWidth={firme > 0.5 ? 30 : 26} strokeLinecap="round" strokeDasharray={firme > 0.5 ? "0" : "2 46"} fill="none" opacity={0.9}>
          <line x1={O.x} y1={O.y} x2={C.x} y2={C.y} />
          <line x1={C.x} y1={C.y} x2={M.x} y2={M.y} />
        </g>
        <circle cx={M.x} cy={M.y - 30} r="100" fill="none" stroke="#B9A6FF" strokeWidth="22" strokeDasharray={firme > 0.5 ? "0" : "2 40"} strokeLinecap="round" />
        {[-66, -22, 22, 66].map((dx, i) => (
          <line key={i} x1={M.x + dx} y1={M.y - 128} x2={M.x + dx * 1.2} y2={M.y - 230 + Math.abs(dx) * 0.5} stroke="#B9A6FF" strokeWidth="22" strokeLinecap="round" strokeDasharray={firme > 0.5 ? "0" : "2 38"} />
        ))}
        {/* sensores nos músculos (meio dos segmentos) e nos tendões (perto das juntas) */}
        {[entre2(O, C, 0.55), entre2(C, M, 0.35), entre2(C, M, 0.65)].map((pt, i) => (
          <circle key={`m${i}`} cx={pt.x} cy={pt.y} r={42 * musculos * (0.8 + 0.2 * Math.sin(f * 0.4 + i))} fill="#FFD23F" opacity={musculos * pisca} />
        ))}
        {[entre2(C, M, 0.06), entre2(C, M, 0.94), entre2(O, C, 0.94)].map((pt, i) => (
          <circle key={`t${i}`} cx={pt.x} cy={pt.y} r={40 * tendoes * (0.8 + 0.2 * Math.sin(f * 0.4 + i))} fill="#6FF2E2" opacity={tendoes * pisca} />
        ))}
        {/* os sinais descendo para o corpo */}
        {sinais > 0.02 &&
          [0, 1, 2, 3].map((i) => {
            const t = ((f + i * 9) % 36) / 36;
            const pt = t < 0.6 ? entre2(M, C, t / 0.6) : entre2(C, O, (t - 0.6) / 0.4);
            return <circle key={`s${i}`} cx={pt.x} cy={pt.y} r="24" fill={i % 2 ? "#6FF2E2" : "#FFD23F"} opacity={sinais * Math.min(1, t * 6, (1 - t) * 5)} />;
          })}
      </svg>
      {musculos > 0.3 && <div style={{ position: "absolute", left: 300, top: 1040, fontFamily: POPPINS, fontWeight: 800, fontSize: 60, color: "#FFD23F", opacity: musculos }}>músculos</div>}
      {tendoes > 0.3 && <div style={{ position: "absolute", left: 340, top: 1240, fontFamily: POPPINS, fontWeight: 800, fontSize: 60, color: "#6FF2E2", opacity: tendoes }}>tendões</div>}
    </AbsoluteFill>
  );
};

const Fechado: React.FC<{ quanto: number }> = ({ quanto }) => <AbsoluteFill style={{ background: "#120A2E", opacity: quanto }} />;

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  // --- a vivência ---
  if (em(0)) {
    const fecha = prog(p(0), 0.2, 0.75);
    return (
      <>
        <Sala3D f={f} ergue={0} />
        <AbsoluteFill style={{ background: `linear-gradient(to bottom, #120A2E ${fecha * 52}%, rgba(18,10,46,0) ${fecha * 52}%, rgba(18,10,46,0) ${100 - fecha * 52}%, #120A2E ${100 - fecha * 52}%)` }} />
      </>
    );
  }
  if (em(1) || em(2) || em(3))
    return (
      <>
        <Fechado quanto={1} />
        <BracoSentido f={f} ergue={em(1) ? prog(p(1), 0.1, 0.6) : 1} forca={em(1) ? prog(p(1), 0.05, 0.3) : 1} />
      </>
    );
  // --- a explicação ---
  if (em(4))
    return (
      <>
        <Fechado quanto={1} />
        <BracoSentido f={f} ergue={1} forca={1} />
        <Conceito f={f} de={F[4].de + 20} ate={F[5].de - 4} texto="propriocepção" />
      </>
    );
  if (em(5) || em(6) || em(7))
    return (
      <>
        <Fechado quanto={1} />
        <BracoSentido f={f} ergue={1} forca={1} musculos={em(5) ? prog(p(5), 0.05, 0.2) : 0.6} tendoes={em(6) ? prog(p(6), 0.05, 0.2) : em(7) ? 0.6 : 0} sinais={em(7) ? prog(p(7), 0, 0.1) : 0} firme={em(7) ? prog(p(7), 0.5, 0.55) : 0} />
      </>
    );
  if (em(8)) {
    const x = p(8);
    const abre = prog(x, 0.02, 0.2);
    return (
      <>
        <Sala3D f={f} ergue={1} alcanca={prog(x, 0.6, 0.9)} bola={prog(x, 0.35, 0.45)} baixa={mix(0.2, 0.62, prog(x, 0.5, 0.85))} />
        <Fechado quanto={1 - abre} />
        <BracoSentido f={f} ergue={1} forca={1 - abre} firme={1} />
      </>
    );
  }
  if (em(9))
    return (
      <>
        <Sala3D f={f} ergue={0} alcanca={1} bola={1} baixa={0.62} />
        <Etapas itens={["Abotoar conversando", "Garfo até a boca"]} aceso={p(9) < 0.3 ? -1 : p(9) < 0.65 ? 0 : 1} emColuna topo={236} opacidade={prog(p(9), 0.15, 0.25)} />
      </>
    );
  if (em(10))
    return (
      <>
        <Sala3D f={f} ergue={0.5 + 0.5 * Math.sin(f * 0.1)} bola={1} />
        <Balao texto="Não é um teste" p={prog(p(10), 0.5, 0.65, elastico)} topo={250} cor={MARCA.sol} tamanho={60} />
      </>
    );
  // --- o que observar ---
  const x = em(11) ? p(11) : 1;
  return <Sala3D f={f} ergue={0} alcanca={prog(x, 0.25, 0.6)} bola={1} baixa={mix(0.2, 0.62, prog(x, 0.1, 0.5))} />;
};

export const { Componente: ExplicaMenteMaopov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
