import React from "react";
import { useCurrentFrame } from "remotion";
import { Abertura, AMARELO, Adesivo, Cartao, CORPO, CREME, Etapa, Fecho, Fundo, LARANJA, Painel, SUAVE, Seta, TITULO, TelaCheia, Tx, VERDE, carimbo, pulo, vida } from "../comum/Esquemas";
import { Moldura, type Toque } from "../comum/Moldura";
import { Pasto, mistura } from "../comum/Pasto";
import { A, FPS, L } from "../comum/tempo";
import { type Vista } from "../pesagem/Mundo";
import { fora, lerp, limitar, prog } from "../pesagem/roteiro";
import { CARIMBOS, PB_AGUAS, PB_MINIMO, PB_SECA, R, T, camera, cena, mov } from "./roteiro";

const { F, falas, inicio } = R;
const TOQUES: Toque[] = [...CARIMBOS.map((t) => ({ t, som: "carimbo" as const })), { t: T.g400, som: "plim" }, { t: T.app, som: "giro", vol: 0.35 }, { t: T.segue - 0.1, som: "giro", vol: 0.4 }, { t: T.segue + 0.6, som: "plim", vol: 0.4 }];
const VINHO = "#8E3B2A";
// boi sanfona: peso ao longo de três anos, subindo nas águas e caindo na seca
const SANFONA = [[0, 180], [6, 270], [12, 240], [18, 340], [24, 310], [30, 420], [36, 390]] as const;

/** Medidor da proteína do capim, com a linha do mínimo que o rúmen precisa. */
const Proteina: React.FC<{ capim: number; extra?: number; rotulo: string }> = ({ capim, extra = 0, rotulo }) => {
  const W = 860, X = (pb: number) => -W / 2 + (W * pb) / 14, baixo = capim + extra < PB_MINIMO;
  return (
    <g>
      <Tx x={-430} y={-66} tam={34} ancora="start" cor={SUAVE} titulo={false} peso={700}>PROTEÍNA NA DIETA DO BOI</Tx>
      <Tx x={430} y={-58} tam={58} ancora="end" cor={baixo ? VINHO : VERDE}>{`${Math.round(capim + extra)}%`}</Tx>
      <rect x={-430} y={-34} width={W} height={70} rx={20} fill="#E4DED2" />
      <rect x={-430} y={-34} width={Math.max(30, X(capim) + 430)} height={70} rx={20} fill={mistura("#B4862E", "#2F5D3A", (capim - PB_SECA) / (PB_AGUAS - PB_SECA))} />
      {extra > 0.05 && <rect x={X(capim) - 12} y={-34} width={X(capim + extra) - X(capim) + 12} height={70} rx={20} fill={LARANJA} />}
      <Tx x={-410} y={12} tam={32} ancora="start" cor={CREME} titulo={false} peso={700}>{rotulo}</Tx>
      {extra > 1 && <Tx x={X(capim + extra) - 14} y={12} tam={30} ancora="end" cor={CREME} titulo={false} peso={700}>+ proteinado</Tx>}
      <line x1={X(PB_MINIMO)} x2={X(PB_MINIMO)} y1={-48} y2={56} stroke={VINHO} strokeWidth={6} strokeDasharray="10 8" />
      <Tx x={X(PB_MINIMO)} y={92} tam={30} cor={VINHO} titulo={false} peso={700}>{`mínimo pro rúmen trabalhar: ${PB_MINIMO}%`}</Tx>
    </g>
  );
};

export function ReelSeca() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100, cx: L / 2, hor: cam.hor, w: L, h: A };
  const fimDe = (n: number) => F(n + 1) - 0.25;
  const app = { de: T.app, ate: T.segue - 0.15 };
  const chip = (p: string, em: number, ate: number, o: { x?: number; y?: number; f?: string; c?: string; tam?: number; giro?: number } = {}) => { const e = vida(t, em - 0.1, ate); return e.o > 0 ? <g key={p} opacity={e.o}><Adesivo x={o.x ?? 540} y={o.y ?? 640} tam={o.tam ?? 50} giro={o.giro ?? -2} escala={e.e} fundo={o.f ?? CREME} cor={o.c ?? (o.f ? CREME : VERDE)}>{p}</Adesivo></g> : null; };
  const pbCapim = lerp(PB_AGUAS, PB_SECA, prog(t, T.despenca - 0.3, 1.3, fora));
  const pbExtra = (PB_MINIMO + 2 - PB_SECA) * prog(t, T.falta - 0.3, 1.0, fora);
  const SX = (mes: number) => -400 + (800 * mes) / 36, SY = (kg: number) => 130 - (230 * (kg - 160)) / 280;
  const ps = prog(t, T.ganhaAguas - 0.3, T.umAno - T.ganhaAguas + 0.4, (x) => x) * 36;
  const itens = [{ p: "cocho coberto", t: T.coberto }, { p: "espaço pra todo o lote", t: T.espaco }, { p: "capim seco sobrando no pasto", t: T.sobrando }];
  const barras = [{ r: "Nas águas", s: "pasto + sal mineral", v: 0.6, t: T.aguas, cor: VERDE }, { r: "Na seca, sem suplemento", s: "pasto seco + sal mineral", v: -0.1, t: T.daSeca, cor: VINHO }, { r: "Na seca, com proteinado", s: "pasto seco + proteinado", v: 0.2, t: T.daSeca + 0.8, cor: LARANJA }];
  return (
    <Moldura t={t} cam={cam} mundo={<Pasto v={v} t={t} id="m" cena={cena} />} falas={falas} inicio={inicio} zEm={mov.zEm} velEm={mov.velEm} toques={TOQUES} bufaEm={F(4)}>
      <Fundo />
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
        <Abertura t={t} fala={falas[0]!} inicio={inicio[0]!} ate={fimDe(0)} linhas={[{ n: 4, tam: 90 }, { n: 1, tam: 150, cor: AMARELO }, { n: 2, tam: 110 }]} adesivo={{ texto: "Vem comigo!", em: T.vem }} />

        <Etapa t={t} de={F(1) + 0.2} ate={fimDe(1)}>NAS ÁGUAS</Etapa>
        <Etapa t={t} de={F(2) + 0.2} ate={fimDe(2)}>NA SECA</Etapa>
        <Painel t={t} de={T.proteina - 0.3} ate={fimDe(2)} y={420} h={280}><g transform="translate(0 8)"><Proteina capim={pbCapim} rotulo={pbCapim > 8 ? "capim verde" : "capim seco"} /></g></Painel>
        {chip("proteína", T.proteina, fimDe(1), { x: 250, y: 650, f: VERDE, tam: 56 })}
        {chip("energia", T.energia, fimDe(1), { x: 600, y: 650, f: LARANJA, tam: 56, giro: 3 })}
        {chip("ganha peso só no pasto + sal mineral", T.ganha, fimDe(1), { y: 770, tam: 44 })}
        {chip("o rúmen não digere a fibra", T.rumen, fimDe(2), { y: 650, f: VINHO })}
        {chip("o boi come menos", T.comeMenos, fimDe(2), { y: 770, f: LARANJA, giro: 2 })}

        <Etapa t={t} de={F(3) + 0.2} ate={fimDe(3)}>O BOI SANFONA</Etapa>
        <Painel t={t} de={T.sanfona - 0.3} ate={fimDe(3)} y={480} h={400}>
          {[0, 1, 2].map((a) => <g key={a}><rect x={SX(a * 12)} y={-150} width={SX(6) - SX(0)} height={290} fill={VERDE} opacity={0.14} /><rect x={SX(a * 12 + 6)} y={-150} width={SX(6) - SX(0)} height={290} fill="#C9A227" opacity={0.2} /><Tx x={SX(a * 12 + 3)} y={-120} tam={24} titulo={false} peso={700}>águas</Tx><Tx x={SX(a * 12 + 9)} y={-120} tam={24} cor="#9A7A12" titulo={false} peso={700}>seca</Tx></g>)}
          <polyline points={SANFONA.filter(([m]) => m <= ps + 0.01).map(([m, kg]) => `${SX(m)},${SY(kg)}`).concat(ps > 0 && ps < 36 ? [(() => { const i = Math.min(5, Math.floor(ps / 6)), a = SANFONA[i]!, b = SANFONA[i + 1]!, u = (ps - a[0]) / 6; return `${SX(ps)},${SY(a[1] + (b[1] - a[1]) * u)}`; })()] : []).join(" ")} fill="none" stroke={VERDE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <Tx x={-430} y={178} tam={28} ancora="start" cor={SUAVE} titulo={false} peso={700}>peso do boi ao longo de 3 anos</Tx>
        </Painel>
        {chip("+1 ano pra ficar pronto", T.umAno, fimDe(3), { y: 750, f: VINHO, tam: 56 })}

        <Etapa t={t} de={F(4) + 0.2} ate={fimDe(4)}>A SAÍDA: PROTEINADO NO COCHO</Etapa>
        <Painel t={t} de={T.proteinado - 0.2} ate={fimDe(4)} y={420} h={280}><g transform="translate(0 8)"><Proteina capim={PB_SECA} extra={pbExtra} rotulo="capim seco" /></g></Painel>
        {chip("o boi volta a aproveitar o capim seco", T.aproveitar - 0.4, fimDe(4), { y: 650, f: VERDE, tam: 44 })}

        <Etapa t={t} de={F(5) + 0.2} ate={fimDe(5)}>QUANTO DE PROTEINADO</Etapa>
        <Painel t={t} de={T.grama - 0.4} ate={fimDe(5)} y={470} h={380}>
          <g transform={`translate(-250 -70) scale(${carimbo(t, T.grama - 0.1)})`} opacity={limitar((t - T.grama + 0.12) / 0.1)}><Tx x={0} y={30} tam={130} cor={LARANJA}>1 g</Tx></g>
          <Tx x={150} y={-70} tam={48} o={prog(t, T.grama + 0.3, 0.3)}>por kg de peso vivo</Tx>
          <Tx x={150} y={-22} tam={32} cor={SUAVE} titulo={false} peso={700} o={prog(t, T.grama + 0.3, 0.3)}>por dia, mais ou menos</Tx>
          <line x1={-430} x2={430} y1={24} y2={24} stroke="#E4DED2" strokeWidth={5} />
          <g opacity={limitar(pulo(t, T.boi400 - 0.1) * 2)}><Tx x={-225} y={118} tam={58}>boi de 400 kg</Tx></g>
          <Seta x={30} y={98} cor={LARANJA} e={pulo(t, T.g400 - 0.3)} />
          <g transform={`translate(270 98) scale(${pulo(t, T.g400 - 0.1)})`}><Tx x={0} y={24} tam={78} cor={LARANJA}>400 g/dia</Tx></g>
        </Painel>

        <Etapa t={t} de={F(6) + 0.2} ate={fimDe(6)}>ATENÇÃO</Etapa>
        <Painel t={t} de={T.coberto - 0.4} ate={fimDe(6)} y={450} h={340}>
          {itens.map((it, i) => { const e = pulo(t, it.t - 0.1); return (
            <g key={i} transform={`translate(-410 ${-94 + i * 96})`} opacity={limitar(e * 2)}>
              <circle cx={30} cy={0} r={34 * e} fill={VERDE} />
              <path d="M 14,0 L 26,13 L 48,-13" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Tx x={90} y={18} tam={50} ancora="start">{it.p}</Tx>
            </g>
          ); })}
        </Painel>
        {chip("suplemento não substitui pasto", T.naoSubstitui, fimDe(6), { y: 700, f: VINHO, tam: 52 })}

        {chip("em vez de perder…", F(7) + 0.3, T.app - 0.1, { y: 330, f: VINHO, tam: 60 })}
        {chip("segura o peso e ainda ganha um pouco", T.segura, T.app - 0.1, { y: 470, f: VERDE, tam: 46, giro: 2 })}
      </svg>

      <TelaCheia t={t} de={app.de} ate={app.ate + 0.5} titulo="Ganho por época" sub="Lote 3 · ganho médio diário · exemplo">
        {barras.map((b, i) => {
          const e = prog(t, b.t - 0.2, 0.7, fora), zero = 250, larg = Math.abs(b.v) * 900 * e;
          return (
            <Cartao key={i} y={380 + i * 300} h={270} e={pulo(t, b.t - 0.4)}>
              <div style={{ padding: "28px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div><div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 46, color: b.cor }}>{b.r}</div><div style={{ fontFamily: CORPO, fontWeight: 700, fontSize: 30, color: SUAVE, marginTop: 4 }}>{b.s}</div></div>
                <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 80, color: b.cor }}>{`${b.v > 0 ? "+" : "−"}${Math.abs(b.v * e).toFixed(2).replace(".", ",")}`}<span style={{ fontSize: 34 }}> kg/dia</span></div>
              </div>
              <div style={{ position: "relative", margin: "22px 40px 0", height: 46 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: 14, background: "#EFE9DD" }} />
                <div style={{ position: "absolute", left: b.v < 0 ? zero - larg : zero, width: larg, top: 0, bottom: 0, borderRadius: 14, background: b.cor }} />
                <div style={{ position: "absolute", left: zero - 3, top: -8, bottom: -8, width: 6, background: SUAVE }} />
              </div>
            </Cartao>
          );
        })}
        <Cartao y={1280} h={130} e={pulo(t, T.pagando - 0.4)} fundo={VERDE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#fff", fontFamily: TITULO, fontWeight: 800, fontSize: 46 }}>com proteinado: +0,30 kg/dia na seca</div>
        </Cartao>
      </TelaCheia>
      <Fecho t={t} de={app.ate} />
    </Moldura>
  );
}
