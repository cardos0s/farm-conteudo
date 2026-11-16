import React from "react";
import { useCurrentFrame } from "remotion";
import { Abertura, AMARELO, Adesivo, Cartao, CORPO, CREME, Etapa, Fecho, Fundo, LARANJA, Letra, Painel, SUAVE, TITULO, TelaCheia, Tx, VERDE, VERDE_ESC, carimbo, pulo, vida } from "../comum/Esquemas";
import { Moldura, type Toque } from "../comum/Moldura";
import { Pasto } from "../comum/Pasto";
import { A, FPS, L } from "../comum/tempo";
import { type Vista } from "../pesagem/Mundo";
import { fora, limitar, prog } from "../pesagem/roteiro";
import { CARIMBOS, MARCOS, R, T, camera, cena, idadeEm, mov } from "./roteiro";

const { F, falas, inicio } = R;
const TOQUES: Toque[] = [...CARIMBOS.map((t) => ({ t, som: "carimbo" as const })), { t: T.abate, som: "plim" }, { t: T.app, som: "giro", vol: 0.35 }, { t: T.segue - 0.1, som: "giro", vol: 0.4 }, { t: T.segue + 0.6, som: "plim", vol: 0.4 }];
const FASES = [{ nome: "CRIA", de: 0, ate: 8, cor: "#7FB04F" }, { nome: "RECRIA", de: 8, ate: 20, cor: VERDE }, { nome: "ENGORDA", de: 20, ate: 27, cor: LARANJA }];
const kgEm = (mes: number) => { const i = Math.max(0, MARCOS.findIndex((m) => m.mes >= mes) - 1), a = MARCOS[i]!, b = MARCOS[Math.min(MARCOS.length - 1, i + 1)]!; return b.mes === a.mes ? a.kg : a.kg + ((b.kg - a.kg) * (mes - a.mes)) / (b.mes - a.mes); };

/** Linha da vida do boi: as três fases, os marcos de peso e onde a explicação está agora. */
const Linha: React.FC<{ t: number }> = ({ t }) => {
  const W = 860, X = (mes: number) => -W / 2 + (W * mes) / 27, idade = idadeEm(t);
  const quandoMarco = [T.nasce, T.duzentos, T.trezentos, T.quinhentos];
  return (
    <g>
      {FASES.map((f, i) => {
        const ativa = idade >= f.de - 0.01 && (idade < f.ate || i === 2);
        return (
          <g key={i} opacity={ativa ? 1 : 0.42}>
            <rect x={X(f.de) + 3} y={-52} width={X(f.ate) - X(f.de) - 6} height={70} rx={18} fill={f.cor} />
            <Tx x={(X(f.de) + X(f.ate)) / 2} y={-4} tam={i === 0 ? 34 : 38} cor={CREME}>{f.nome}</Tx>
          </g>
        );
      })}
      {MARCOS.map((m, i) => {
        const e = pulo(t, quandoMarco[i]! - 0.1);
        return (
          <g key={i} opacity={limitar(e * 2)}>
            <line x1={X(m.mes)} x2={X(m.mes)} y1={-62} y2={34} stroke={VERDE_ESC} strokeWidth={5} />
            <g transform={`translate(${X(m.mes)} 76) scale(${e})`}><Tx x={0} y={0} tam={i === 3 || i === 0 ? 40 : 44} ancora={i === 0 ? "start" : i === 3 ? "end" : "middle"} cor={i === 3 ? LARANJA : VERDE}>{`${m.kg} kg`}</Tx></g>
            <Tx x={X(m.mes)} y={110} tam={24} ancora={i === 0 ? "start" : i === 3 ? "end" : "middle"} cor={SUAVE} titulo={false} peso={700}>{m.nome}</Tx>
          </g>
        );
      })}
      <g transform={`translate(${X(idade)} -76)`}>
        <path d="M 0,18 L -16,-6 L 16,-6 Z" fill={VERDE_ESC} />
        <rect x={-74} y={-52} width={148} height={48} rx={24} fill={VERDE_ESC} />
        <Tx x={0} y={-18} tam={30} cor={AMARELO}>{`${Math.round(kgEm(idade))} kg`}</Tx>
      </g>
    </g>
  );
};

export function ReelFases() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100, cx: L / 2, hor: cam.hor, w: L, h: A };
  const fimDe = (n: number) => F(n + 1) - 0.25;
  const app = { de: T.app, ate: T.segue - 0.15 };
  const chips = (itens: { p: string; t: number; f?: string; c?: string; x?: number; y?: number; tam?: number }[], ate: number) => itens.map((c, i) => { const e = vida(t, c.t - 0.1, ate); return <g key={c.p} opacity={e.o}><Adesivo x={c.x ?? 540} y={c.y ?? 610} tam={c.tam ?? 50} giro={[-3, 2, -2, 3][i % 4]!} escala={e.e} fundo={c.f ?? CREME} cor={c.c ?? (c.f ? CREME : VERDE)}>{c.p}</Adesivo></g>; });
  // curva de peso no app: meta (tracejada) e o lote (verde), com um trecho atrasado na recria
  const GX = (mes: number) => 60 + (860 * mes) / 27, GY = (kg: number) => 480 - (400 * kg) / 560;
  const real = [[0, 35], [8, 196], [12, 232], [16, 268], [19, 322]] as const;
  const pc = prog(t, T.cadaFase - 0.6, 1.6, (x) => x);
  return (
    <Moldura t={t} cam={cam} mundo={<Pasto v={v} t={t} id="m" cena={cena} />} falas={falas} inicio={inicio} zEm={mov.zEm} velEm={mov.velEm} toques={TOQUES}>
      <Fundo />
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
        <Abertura t={t} fala={falas[0]!} inicio={inicio[0]!} ate={fimDe(0)} linhas={[{ n: 2, tam: 100 }, { n: 3, tam: 100 }, { n: 3, tam: 116, cor: AMARELO }]} adesivo={{ texto: "Vem comigo!", em: T.vem }} />

        <Etapa t={t} de={F(1) + 0.1} ate={fimDe(2)}>1 · CRIA</Etapa>
        <Etapa t={t} de={F(3) + 0.1} ate={fimDe(4)}>2 · RECRIA</Etapa>
        <Etapa t={t} de={F(5) + 0.1} ate={fimDe(6)}>3 · ENGORDA</Etapa>
        <Painel t={t} de={T.cria} ate={fimDe(6)} y={420} h={300}><Linha t={t} /></Painel>

        {chips([{ p: "ao pé da vaca", t: T.mamando - 0.9, x: 290 }, { p: "mamando", t: T.mamando, x: 760, f: LARANJA }, { p: "aprendendo a pastar", t: T.pastar, y: 730, f: VERDE }], fimDe(1))}
        {chips([{ p: "desmama: 7 a 8 meses", t: T.meses, f: LARANJA, tam: 54 }], fimDe(2))}
        {t > T.duzentos - 0.15 && t < fimDe(2) + 0.3 && <g opacity={1 - prog(t, fimDe(2), 0.25)} transform={`translate(540 800) scale(${carimbo(t, T.duzentos - 0.1)}) rotate(-2)`}><Letra x={0} y={0} tam={104} cor={AMARELO} borda={0.14}>meta: 200 kg</Letra></g>}
        {chips([{ p: "osso", t: T.partes[0]!, x: 200, tam: 56 }, { p: "músculo", t: T.partes[1]!, x: 500, f: LARANJA, tam: 56 }, { p: "carcaça", t: T.partes[2]!, x: 850, f: VERDE, tam: 56 }, { p: "no pasto, com suplemento", t: T.pasto, y: 730 }], fimDe(3))}
        {chips([{ p: "a fase mais longa", t: T.longa, f: LARANJA, tam: 56 }, { p: "fome na seca = boi atrasado", t: T.garrote + 0.6, y: 730, f: "#8E3B2A" }], fimDe(4))}
        {chips([{ p: "entra com 380 kg", t: T.trezentos, tam: 56, f: VERDE }, { p: "ganhar peso rápido", t: T.rapido, y: 730, x: 310, f: LARANJA, tam: 46 }, { p: "acabamento de gordura", t: T.gordura, y: 850, x: 640, tam: 46 }], fimDe(5))}
        {chips([{ p: "pronto pro abate", t: T.abate, f: LARANJA, tam: 60 }, { p: "antes dos 30 meses", t: T.trintaMeses, y: 730, f: VERDE, tam: 56 }], fimDe(6))}
      </svg>

      <TelaCheia t={t} de={app.de} ate={app.ate + 0.5} titulo="Curva de peso" sub="Lote 2 · 24 garrotes · 19 meses">
        <Cartao y={380} h={640} e={pulo(t, app.de + 0.3)}>
          <svg width={980} height={640} viewBox="0 0 980 640">
            {FASES.map((f, i) => <g key={i}><rect x={GX(f.de)} y={60} width={GX(f.ate) - GX(f.de)} height={420} fill={f.cor} opacity={0.13} /><text x={(GX(f.de) + GX(f.ate)) / 2} y={104} textAnchor="middle" fontFamily={CORPO} fontWeight={700} fontSize={28} fill={f.cor}>{f.nome}</text></g>)}
            <polyline points={MARCOS.map((m) => `${GX(m.mes)},${GY(m.kg)}`).join(" ")} fill="none" stroke={SUAVE} strokeWidth={6} strokeDasharray="16 12" />
            {MARCOS.map((m, i) => <text key={i} x={GX(m.mes)} y={GY(m.kg) - 20} textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"} fontFamily={TITULO} fontWeight={800} fontSize={30} fill={SUAVE}>{m.kg}</text>)}
            <polyline points={real.filter(([m]) => m <= 19 * pc + 0.01).map(([m, kg]) => `${GX(m)},${GY(kg)}`).join(" ")} fill="none" stroke={VERDE} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
            {real.map(([m, kg], i) => { const e = pulo(t, T.cadaFase - 0.6 + (1.6 * m) / 19); return e > 0 ? <circle key={i} cx={GX(m)} cy={GY(kg)} r={15 * e} fill="#fff" stroke={i >= 2 && i <= 3 ? LARANJA : VERDE} strokeWidth={8} /> : null; })}
            <text x={60} y={560} fontFamily={CORPO} fontWeight={700} fontSize={30} fill={SUAVE}>- - meta</text>
            <text x={250} y={560} fontFamily={CORPO} fontWeight={700} fontSize={30} fill={VERDE}>— peso médio do lote (kg)</text>
            <text x={920} y={520} textAnchor="end" fontFamily={CORPO} fontWeight={700} fontSize={26} fill={SUAVE}>idade: 0 a 27 meses</text>
          </svg>
        </Cartao>
        <Cartao y={1050} w={475} h={330} e={pulo(t, T.cadaFase + 0.9)} fundo={VERDE}>
          <div style={{ padding: "34px 36px", color: "#fff", fontWeight: 700, fontSize: 30, letterSpacing: 2 }}>PESO MÉDIO HOJE
            <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 130, lineHeight: 1.1, letterSpacing: 0 }}>322<span style={{ fontSize: 56 }}> kg</span></div>
            <div style={{ fontSize: 32, letterSpacing: 0, opacity: 0.95 }}>meta para a idade: 365 kg</div>
          </div>
        </Cartao>
        <Cartao x={555} y={1050} w={475} h={330} e={pulo(t, T.atrasado - 0.5)} fundo="#8E3B2A">
          <div style={{ padding: "34px 36px", color: "#fff", fontWeight: 700, fontSize: 30, letterSpacing: 2 }}>ATRASADOS NA RECRIA
            <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 130, lineHeight: 1.1, letterSpacing: 0 }}>5<span style={{ fontSize: 56 }}> bois</span></div>
            <div style={{ fontSize: 32, letterSpacing: 0, opacity: 0.95 }}>abaixo da meta há 2 meses</div>
          </div>
        </Cartao>
      </TelaCheia>
      <Fecho t={t} de={app.ate} />
    </Moldura>
  );
}
