import React from "react";
import { useCurrentFrame } from "remotion";
import { Abertura, AMARELO, AZUL, Adesivo, Cartao, CORPO, CREME, Etapa, Fecho, Fundo, LARANJA, Painel, SUAVE, Seta, TITULO, TelaCheia, Tx, VERDE, VERDE_ESC, pulo, vida } from "../comum/Esquemas";
import { Moldura, type Toque } from "../comum/Moldura";
import { Pasto, mistura } from "../comum/Pasto";
import { A, FPS, L } from "../comum/tempo";
import { type Vista } from "../pesagem/Mundo";
import { fora, lerp, limitar, prog } from "../pesagem/roteiro";
import { CARIMBOS, R, T, camera, cena, mov, rebrota } from "./roteiro";

const { F, falas, inicio } = R;
const TOQUES: Toque[] = [...CARIMBOS.map((t) => ({ t, som: "carimbo" as const })), { t: T.app, som: "giro", vol: 0.35 }, { t: T.tres, som: "plim" }, { t: T.segue - 0.1, som: "giro", vol: 0.4 }, { t: T.segue + 0.6, som: "plim", vol: 0.4 }];

/** Planta dos piquetes: o lote ocupa um e os outros descansam (mais verdes quanto mais tempo parados). */
const Planta: React.FC<{ onde: number; w: number; h: number; rotulos?: boolean }> = ({ onde, w, h, rotulos }) => {
  const cw = w / 4 - 10, ch = h / 2 - 22, ordem = [0, 1, 2, 3, 7, 6, 5, 4];
  const atual = Math.floor(onde) % 8, passa = onde % 1;
  return (
    <g>
      <rect x={-w / 2} y={-11} width={w} height={22} fill="#D2AE82" />
      {ordem.map((pos, n) => {
        const col = pos % 4, lin = pos < 4 ? 0 : 1, x = -w / 2 + col * (cw + 13.3), y = lin ? 20 : -ch - 20;
        const descanso = (n - atual + 8) % 8; // há quantas trocas o gado saiu daqui (0 = está aqui)
        const fill = descanso === 0 ? "#A9C76A" : mistura("#C9D58C", "#3F7F2E", (8 - descanso) / 7);
        return (
          <g key={n}>
            <rect x={x} y={y} width={cw} height={ch} rx={12} fill={fill} stroke={descanso === 0 ? LARANJA : "#FFFFFF"} strokeWidth={descanso === 0 ? 7 : 3} />
            {rotulos && <text x={x + 12} y={y + 30} fontFamily={CORPO} fontWeight={700} fontSize={22} fill={VERDE_ESC} opacity={0.7}>{n + 1}</text>}
            {descanso === 0 && Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx={x + 26 + (i % 3) * (cw - 52) / 2 + 6 * Math.sin(i * 5 + onde * 9)} cy={y + 28 + Math.floor(i / 3) * (ch - 50) / 2} rx={13} ry={8} fill="#FFFFFF" stroke="#6B6F5E" strokeWidth={2} opacity={passa > 0.85 ? 1 - (passa - 0.85) / 0.15 : 1} />)}
          </g>
        );
      })}
    </g>
  );
};

/** Touceira de capim com régua. */
const Capim: React.FC<{ x: number; alt: number; rotulo: string; cm: string; cor: string; e: number }> = ({ x, alt, rotulo, cm, cor, e }) => (
  <g transform={`translate(${x} 118)`} opacity={limitar(e * 2)}>
    <rect x={-150} y={0} width={300} height={10} rx={5} fill="#B98F62" />
    {Array.from({ length: 13 }, (_, i) => {
      const bx = -130 + i * 21.5, h = alt * e * (0.8 + 0.2 * Math.sin(i * 2.7)), incl = 14 * Math.sin(i * 1.9);
      return <path key={i} d={`M ${bx - 8},0 Q ${bx + incl * 0.3},${-h * 0.6} ${bx + incl},${-h} Q ${bx + incl * 0.5 + 6},${-h * 0.5} ${bx + 8},0 Z`} fill={i % 2 ? "#4F8A2E" : "#6BA53C"} />;
    })}
    <line x1={168} y1={0} x2={168} y2={-alt} stroke={cor} strokeWidth={6} />
    <line x1={154} y1={-alt} x2={182} y2={-alt} stroke={cor} strokeWidth={6} />
    <line x1={154} y1={0} x2={182} y2={0} stroke={cor} strokeWidth={6} />
    <Tx x={0} y={-alt - 62} tam={34} cor={SUAVE} titulo={false} peso={700}>{rotulo}</Tx>
    <Tx x={0} y={-alt - 14} tam={52} cor={cor}>{cm}</Tx>
  </g>
);

export function ReelRotacionado() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100, cx: L / 2, hor: cam.hor, w: L, h: A };
  const fimDe = (n: number) => F(n + 1) - 0.25;
  const chips = [{ p: "rapa o capim novo", t: T.rapa, f: LARANJA, c: CREME }, { p: "larga o velho", t: T.larga, f: CREME, c: VERDE_ESC }, { p: "o pasto vai falhando", t: T.falhando, f: "#8E3B2A", c: CREME }];
  const dia = 1 + Math.round(29 * rebrota(t));
  const app = { de: T.app, ate: T.segue - 0.15 };
  return (
    <Moldura t={t} cam={cam} mundo={<Pasto v={v} t={t} id="m" cena={cena} />} falas={falas} inicio={inicio} zEm={mov.zEm} velEm={mov.velEm} toques={TOQUES} bufaEm={F(3) - 0.4}>
      <Fundo />
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
        <Abertura t={t} fala={falas[0]!} inicio={inicio[0]!} ate={fimDe(0)} linhas={[{ n: 4, tam: 74 }, { n: 2, tam: 100, cor: AMARELO }, { n: 3, tam: 88 }, { n: 3, tam: 88 }]} adesivo={{ texto: "Vem comigo!", em: T.vem }} />

        <Etapa t={t} de={F(1) + 0.2} ate={fimDe(1)}>PASTO CONTÍNUO</Etapa>
        {chips.map((c, i) => { const e = vida(t, c.t - 0.1, fimDe(1)); return <g key={i} opacity={e.o}><Adesivo x={540} y={370 + i * 118} tam={54} giro={[-3, 2, -2][i]!} escala={e.e} fundo={c.f} cor={c.c}>{c.p}</Adesivo></g>; })}

        <Etapa t={t} de={F(2) + 0.2} ate={fimDe(2)}>1 · PASTO DIVIDIDO EM PIQUETES</Etapa>
        <Painel t={t} de={T.piquetes - 0.2} ate={fimDe(2)} y={500} h={430}>
          <g transform="translate(0 -18)"><Planta onde={Math.max(0, (t - T.umPorVez) / 1.25)} w={860} h={300} /></g>
          <Tx x={-430} y={184} tam={30} ancora="start" cor={LARANJA} titulo={false} peso={700} o={prog(t, T.umPorVez - 0.1, 0.3)}>■ gado: um piquete por vez</Tx>
          <Tx x={430} y={184} tam={30} ancora="end" cor={VERDE} titulo={false} peso={700} o={prog(t, T.descansam - 0.3, 0.3)}>■ os outros descansam</Tx>
        </Painel>

        <Etapa t={t} de={T.altura - 0.3} ate={fimDe(3)}>2 · A ALTURA DO CAPIM</Etapa>
        <Painel t={t} de={T.altura + 0.5} ate={fimDe(3)} y={480} h={400}>
          <Tx x={0} y={176} tam={30} cor={SUAVE} titulo={false} peso={700}>exemplo: capim-marandu</Tx>
          <Capim x={-230} alt={150} rotulo="O GADO ENTRA" cm="30 cm" cor={VERDE} e={prog(t, T.trinta - 0.15, 0.5, fora)} />
          <Capim x={230} alt={75} rotulo="O GADO SAI" cm="15 cm" cor={LARANJA} e={prog(t, T.quinze - 0.15, 0.5, fora)} />
          <Seta x={0} y={60} cor={LARANJA} e={pulo(t, T.quinze - 0.1)} />
        </Painel>
        {(() => { const e = vida(t, T.nunca - 0.1, fimDe(3)); return <g opacity={e.o}><Adesivo x={540} y={735} tam={54} giro={-2} escala={e.e} fundo="#8E3B2A">nunca rapa até o chão</Adesivo></g>; })()}

        <Etapa t={t} de={F(4) + 0.2} ate={fimDe(4)}>3 · O DESCANSO</Etapa>
        <Painel t={t} de={T.descansa - 0.2} ate={fimDe(4)} y={420} h={260}>
          <Tx x={-430} y={-52} tam={36} ancora="start" cor={LARANJA} titulo={false} peso={700}>PIQUETE EM DESCANSO</Tx>
          <Tx x={430} y={-46} tam={60} ancora="end">{`Dia ${dia}`}</Tx>
          <rect x={-430} y={-14} width={860} height={50} rx={25} fill="#E4DED2" />
          <rect x={-430} y={-14} width={Math.max(50, 860 * rebrota(t))} height={50} rx={25} fill={VERDE} />
          <Tx x={-430} y={92} tam={36} ancora="start" titulo={false} peso={700}>nas águas: uns 30 dias</Tx>
          <Tx x={430} y={92} tam={36} ancora="end" cor={LARANJA} titulo={false} peso={700} o={prog(t, T.seca - 0.6, 0.3)}>na seca: mais tempo</Tx>
        </Painel>

        <Etapa t={t} de={F(5) + 0.2} ate={fimDe(5)}>4 · ÁGUA E SAL POR PERTO</Etapa>
        {[{ p: "Água", t: T.agua, x: 330, f: AZUL, c: CREME }, { p: "Sal mineral", t: T.sal, x: 700, f: CREME, c: VERDE }].map((c, i) => { const e = vida(t, c.t - 0.1, fimDe(5)); return <g key={i} opacity={e.o}><Adesivo x={c.x} y={380} tam={62} giro={i ? 2 : -3} escala={e.e} fundo={c.f} cor={c.c}>{c.p}</Adesivo></g>; })}
        {(() => { const e = vida(t, T.praca - 0.1, fimDe(5)); return <g opacity={e.o}><Adesivo x={540} y={510} tam={50} giro={-2} escala={e.e} fundo={LARANJA}>praça de alimentação no meio</Adesivo></g>; })()}

        <Etapa t={t} de={F(6) + 0.2} ate={fimDe(6)}>5 · A LOTAÇÃO SOBE</Etapa>
        <Painel t={t} de={T.lotacao + 0.5} ate={fimDe(6)} y={490} h={420}>
          {[{ r: "Contínuo", v: "1 UA/ha", n: 1, t: T.uma, cor: "#9C8B6A", y: -110 }, { r: "Rotacionado", v: "3+ UA/ha", n: 3, t: T.tres, cor: VERDE, y: 40 }].map((b, i) => {
            const e = prog(t, b.t - 0.15, 0.6, fora);
            return (
              <g key={i} opacity={limitar(e * 3)}>
                <Tx x={-430} y={b.y - 22} tam={40} ancora="start" cor={b.cor}>{b.r}</Tx>
                <rect x={-430} y={b.y} width={860} height={62} rx={20} fill="#E9E2D5" />
                <rect x={-430} y={b.y} width={(860 * b.n * e) / 3.4} height={62} rx={20} fill={b.cor} />
                <Tx x={-410 + (860 * b.n * e) / 3.4} y={b.y + 46} tam={46} ancora="start" cor={b.cor}>{b.v}</Tx>
              </g>
            );
          })}
          <Tx x={0} y={168} tam={30} cor={SUAVE} titulo={false} peso={700}>1 UA (unidade animal) = 450 kg de peso vivo</Tx>
        </Painel>
      </svg>

      <TelaCheia t={t} de={app.de} ate={app.ate + 0.5} titulo="Piquetes" sub="Fazenda · módulo rotacionado · 8 piquetes">
        <Cartao y={380} h={560} e={pulo(t, app.de + 0.3)}>
          <div style={{ padding: "34px 40px 0", fontFamily: TITULO, fontWeight: 800, fontSize: 52, color: VERDE }}>Lote 2 está no <span style={{ color: LARANJA }}>piquete 3</span></div>
          <svg width={980} height={420} viewBox="-490 -210 980 420"><Planta onde={2.3} w={880} h={340} rotulos /></svg>
        </Cartao>
        <Cartao y={970} w={475} h={400} e={pulo(t, T.faltam - 0.3)}>
          <div style={{ padding: "34px 36px", color: SUAVE, fontWeight: 700, fontSize: 32, letterSpacing: 2 }}>TROCA EM
            <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 150, color: LARANJA, lineHeight: 1.1, letterSpacing: 0 }}>2<span style={{ fontSize: 60 }}> dias</span></div>
            <div style={{ height: 22, borderRadius: 11, background: "#E9E2D5", marginTop: 8 }}><div style={{ width: `${60 * prog(t, T.faltam, 0.6, fora)}%`, height: "100%", borderRadius: 11, background: LARANJA }} /></div>
            <div style={{ marginTop: 14, fontSize: 30, letterSpacing: 0 }}>dia 3 de 5 no piquete</div>
          </div>
        </Cartao>
        <Cartao x={555} y={970} w={475} h={400} e={pulo(t, T.peso - 0.3)} fundo={VERDE}>
          <div style={{ padding: "34px 36px", color: "#fff", fontWeight: 700, fontSize: 32, letterSpacing: 2, opacity: 0.95 }}>PESO MÉDIO
            <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 150, lineHeight: 1.1, letterSpacing: 0 }}>{Math.round(lerp(400, 438, prog(t, T.peso - 0.2, 0.8, fora)))}<span style={{ fontSize: 60 }}> kg</span></div>
            <div style={{ marginTop: 34, fontSize: 34, letterSpacing: 0 }}>+0,7 kg por dia no mês</div>
          </div>
        </Cartao>
      </TelaCheia>
      <Fecho t={t} de={app.ate} />
    </Moldura>
  );
}
