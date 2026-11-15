import React from "react";
import { Marca } from "../pesagem/Celular";
import { fora, lerp, limitar, mola, prog } from "../pesagem/roteiro";
import { Adesivo, Confete, Letra } from "../pesagem/Sobreposicoes";
import { A, DIAS, ENTRADA, L, SAIDA, T, T_CEL_DESCE, T_CLIQUE, T_GMD } from "./roteiro";

// Letreiros e gráficos de cada etapa do confinamento, por cima da cena.

const VERDE = "#2F5D3A", VERDE_ESC = "#16301D", CREME = "#FFF8EA", LARANJA = "#B5651D", AMARELO = "#FFD166", AZUL = "#2E7FB8";
const TITULO = "'Roboto Slab', Georgia, serif", CORPO = "Inter, Arial, sans-serif";

/** Aparece em `de` com um pulinho e some em `ate`. */
const vida = (t: number, de: number, ate: number) => ({ e: prog(t, de, 0.38, mola), o: limitar((t - de) / 0.12) * (1 - prog(t, ate, 0.25)) });
/** Carimbo: entra grande e assenta. */
const carimbo = (t: number, de: number) => lerp(2.4, 1, prog(t, de, 0.2, fora));

const Seta: React.FC<{ x: number; y: number; cor: string; cima?: boolean; e: number }> = ({ x, y, cor, cima, e }) => (
  <g transform={`translate(${x} ${y}) scale(${e}) rotate(${cima ? -90 : 90})`}>
    <circle r={40} fill="#fff" />
    <circle r={33} fill={cor} />
    <path d="M -15,0 L 13,0 M 2,-12 L 14,0 L 2,12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const Sobreposicoes: React.FC<{ t: number }> = ({ t }) => {
  const F = { lotes: T.chega, adapt: T.adaptacao, leitura: T.leitura - 1.2, trato: T.trato, evol: T.evolucao, fecho: T.fecho };
  // 1. abertura
  const abre = 1 - prog(t, F.lotes - 0.25, 0.3);
  const pal = (i: number) => limitar((t - T.titulo[i]! + 0.08) / 0.12);
  const vem = prog(t, T.vem - 0.05, 0.4, mola);
  const pulo = t > T.vem ? Math.abs(Math.sin((t - T.vem) * 6.5)) * 46 * Math.exp(-(t - T.vem) * 1.1) : 0;
  // 2. chegada e lotes
  const chegada = vida(t, F.lotes + 0.15, F.adapt - 0.25);
  const kg380 = Math.round(ENTRADA * prog(t, T.trezentos - 0.1, 0.7, fora));
  // 3. adaptação
  const adapt = vida(t, T.quinze - 0.15, F.leitura - 0.1);
  const dieta = vida(t, T.dieta - 0.1, F.leitura - 0.1);
  const pd = prog(t, T.dieta + 0.3, T.concentrado + 0.9 - T.dieta, (x) => x);
  const dia = 1 + Math.round(14 * pd);
  const vol = Math.round(lerp(60, 25, pd));
  // 4. leitura de cocho
  const leitura = vida(t, T.leitura - 0.15, F.trato - 0.2);
  // 5. trato e água
  const trato = vida(t, T.trato + 0.25, T.agua - 0.3);
  const agua = vida(t, T.agua - 0.1, F.evol - 0.1);
  // 6. evolução
  const evolSai = 1 - prog(t, T.gmd - 0.35, 0.25);
  const v380 = prog(t, T.de380 - 0.05, 0.35, mola), v540 = prog(t, T.para540 - 0.05, 0.4, mola), vCem = prog(t, T.cem - 0.1, 0.35, mola);
  const gmdVis = t >= T.gmd - 0.1 ? 1 - prog(t, T.fecho + 1.6, 0.3) : 0;
  const gmdE = t >= T_GMD ? 1 + 0.2 * Math.exp(-(t - T_GMD) * 7) * Math.cos((t - T_GMD) * 16) : lerp(0.7, 1, prog(t, T.gmd - 0.1, 0.3, mola));
  // 7. fecho
  const fecho = prog(t, T_CEL_DESCE + 0.25, 0.6);
  const nome = prog(t, T_CEL_DESCE + 0.35, 0.55, mola);
  const segue = prog(t, T_CEL_DESCE + 0.8, 0.45, mola);
  const pulsa = t > T_CEL_DESCE + 1.3 ? 1 + 0.04 * Math.sin((t - T_CEL_DESCE - 1.3) * 6) : 1;
  const flash = t >= T_CLIQUE ? 1 - prog(t, T_CLIQUE, 0.28, fora) : 0;
  const ING = [
    { p: "Silagem", t: T.silagem, x: 300, y: 380, fundo: VERDE, cor: CREME },
    { p: "Milho", t: T.milho, x: 770, y: 380, fundo: "#E9B93A", cor: VERDE_ESC },
    { p: "Farelo", t: T.farelo, x: 250, y: 500, fundo: LARANJA, cor: CREME },
    { p: "Núcleo mineral", t: T.nucleo, x: 700, y: 500, fundo: CREME, cor: VERDE },
  ];
  return (
    <>
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sc-vinheta" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.62" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#1A1206" stopOpacity={0.42} />
          </radialGradient>
          <linearGradient id="sc-topo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10230F" stopOpacity={0.5} />
            <stop offset="1" stopColor="#10230F" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sc-fecho" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#16301D" stopOpacity={0.82} />
            <stop offset="0.62" stopColor="#16301D" stopOpacity={0.5} />
            <stop offset="1" stopColor="#16301D" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill="url(#sc-vinheta)" />
        <rect width={L} height={640} fill="url(#sc-topo)" />
        <rect width={L} height={A} fill="#fff" opacity={flash * 0.4} />

        {abre > 0 && (
          <g opacity={abre} transform={`translate(0 ${-(1 - abre) * 80})`}>
            <g transform="translate(540 250) rotate(-2)">
              <Letra x={0} y={0} tam={84}>
                {["Já", "viu", "um"].map((p, i) => <tspan key={i} fillOpacity={pal(i)} strokeOpacity={pal(i)}>{i ? " " : ""}{p}</tspan>)}
              </Letra>
            </g>
            <g transform={`translate(540 392) scale(${prog(t, T.titulo[3]! - 0.08, 0.4, mola)}) rotate(-2)`} opacity={pal(3)}>
              <Letra x={0} y={0} tam={128} cor={AMARELO} borda={0.16}>confinamento</Letra>
            </g>
            <g transform="translate(540 512) rotate(-2)">
              <Letra x={0} y={0} tam={104}>
                {["por", "dentro?"].map((p, i) => <tspan key={i} fillOpacity={pal(4 + i)} strokeOpacity={pal(4 + i)}>{i ? " " : ""}{p}</tspan>)}
              </Letra>
            </g>
            <Adesivo x={540} y={670 - pulo} tam={84} giro={-5 + 3 * Math.sin(t * 7)} escala={vem} opacidade={limitar(vem * 2)}>Vem comigo!</Adesivo>
          </g>
        )}

        {chegada.o > 0 && (
          <g opacity={chegada.o}>
            <Adesivo x={540} y={235} tam={50} giro={-2} escala={chegada.e} fundo={VERDE}>1 · CHEGADA DO PASTO</Adesivo>
            {t > T.trezentos - 0.12 && (
              <g transform={`translate(520 440) scale(${carimbo(t, T.trezentos - 0.1)}) rotate(-2)`} opacity={limitar((t - T.trezentos + 0.12) / 0.1)}>
                <Letra x={-60} y={0} tam={210} cor={AMARELO} borda={0.14}>{String(kg380)}</Letra>
                <Letra x={String(kg380).length * 210 * 0.29 - 50} y={0} tam={110} ancora="start">kg</Letra>
              </g>
            )}
            {["LOTE 1", "LOTE 2", "LOTE 3"].map((p, i) => {
              const e = prog(t, T.lotes - 0.25 + i * 0.16, 0.35, mola);
              return <Adesivo key={i} x={240 + i * 300} y={580} tam={48} giro={[-4, 2, -3][i]!} escala={e} opacidade={limitar(e * 2)} fundo={i === 1 ? LARANJA : CREME} cor={i === 1 ? CREME : VERDE}>{p}</Adesivo>;
            })}
            <g opacity={prog(t, T.lotes + 0.35, 0.3)}>
              <Letra x={540} y={700} tam={58}>separados por peso</Letra>
            </g>
          </g>
        )}

        {adapt.o > 0 && (
          <g opacity={adapt.o}>
            <Adesivo x={540} y={235} tam={50} giro={-2} escala={adapt.e} fundo={VERDE}>2 · ADAPTAÇÃO: 15 DIAS</Adesivo>
            <g transform={`translate(540 440) scale(${dieta.e})`} opacity={dieta.o}>
              <rect x={-470} y={-122} width={940} height={268} rx={40} fill="#000" opacity={0.2} transform="translate(0 10)" />
              <rect x={-470} y={-122} width={940} height={268} rx={40} fill={CREME} stroke={VERDE} strokeWidth={7} />
              <text x={-430} y={-62} fontFamily={CORPO} fontWeight={700} fontSize={38} fill={LARANJA}>DIETA NO COCHO</text>
              <text x={430} y={-58} textAnchor="end" fontFamily={TITULO} fontWeight={800} fontSize={56} fill={VERDE}>{`Dia ${dia}`}</text>
              <rect x={-430} y={-28} width={860} height={86} rx={22} fill="#E08A2E" />
              <rect x={-430} y={-28} width={(860 * vol) / 100} height={86} rx={22} fill={VERDE} />
              <rect x={-430 + (860 * vol) / 100 - 22} y={-28} width={22} height={86} fill={VERDE} />
              <text x={-410} y={30} fontFamily={TITULO} fontWeight={800} fontSize={44} fill={CREME}>{`${vol}%`}</text>
              <text x={410} y={30} textAnchor="end" fontFamily={TITULO} fontWeight={800} fontSize={44} fill={CREME}>{`${100 - vol}%`}</text>
              <text x={-430} y={112} fontFamily={CORPO} fontWeight={700} fontSize={36} fill={VERDE}>Volumoso</text>
              <text x={430} y={112} textAnchor="end" fontFamily={CORPO} fontWeight={700} fontSize={36} fill="#B5651D">Concentrado</text>
            </g>
          </g>
        )}

        {leitura.o > 0 && (
          <g opacity={leitura.o}>
            <Adesivo x={540} y={235} tam={50} giro={-2} escala={leitura.e} fundo={VERDE}>3 · LEITURA DE COCHO</Adesivo>
            {[
              { a: "Sobrou muito?", ta: T.sobrou, b: "diminui o trato", tb: T.diminui, cor: LARANJA, y: 385, cima: false },
              { a: "Raspou?", ta: T.raspou, b: "aumenta o trato", tb: T.aumenta, cor: VERDE, y: 525, cima: true },
            ].map((r, i) => {
              const ea = prog(t, r.ta - 0.1, 0.35, mola), eb = prog(t, r.tb - 0.1, 0.35, mola);
              const destaque = i === 1 && t > T.aumenta ? 1 + 0.07 * Math.sin((t - T.aumenta) * 7) * Math.exp(-(t - T.aumenta) * 0.8) : 1;
              return (
                <g key={i}>
                  <Adesivo x={245} y={r.y} tam={46} giro={-2} escala={ea} opacidade={limitar(ea * 2)} fundo={CREME} cor={VERDE_ESC}>{r.a}</Adesivo>
                  <Seta x={510} y={r.y} cor={r.cor} cima={r.cima} e={eb} />
                  <Adesivo x={790} y={r.y} tam={46} giro={2} escala={eb * destaque} opacidade={limitar(eb * 2)} fundo={r.cor}>{r.b}</Adesivo>
                </g>
              );
            })}
          </g>
        )}

        {(trato.o > 0 || agua.o > 0) && (
          <g>
            <g opacity={Math.max(trato.o, agua.o)}>
              <Adesivo x={540} y={235} tam={50} giro={-2} escala={trato.e} fundo={VERDE}>4 · TRATO NO COCHO</Adesivo>
            </g>
            <g opacity={trato.o}>
              {ING.map((g, i) => {
                const e = prog(t, g.t - 0.1, 0.35, mola);
                return <Adesivo key={i} x={g.x} y={g.y} tam={54} giro={[-3, 3, 2, -2][i]!} escala={e} opacidade={limitar(e * 2)} fundo={g.fundo} cor={g.cor}>{g.p}</Adesivo>;
              })}
            </g>
            <g opacity={agua.o}>
              <Adesivo x={540} y={410} tam={62} giro={-2} escala={agua.e} fundo={AZUL}>Água limpa à vontade</Adesivo>
            </g>
          </g>
        )}

        {t > T.de380 - 0.1 && evolSai > 0 && (
          <g opacity={evolSai}>
            <g transform={`translate(215 330) scale(${v380}) rotate(-3)`} opacity={limitar(v380 * 2)}>
              <Letra x={0} y={0} tam={150}>{String(ENTRADA)}</Letra>
            </g>
            <g transform={`translate(700 330) scale(${v540}) rotate(-2)`} opacity={limitar(v540 * 2)}>
              <Letra x={-60} y={0} tam={200} cor={AMARELO} borda={0.14}>{String(SAIDA)}</Letra>
              <Letra x={130} y={0} tam={100} ancora="start">kg</Letra>
            </g>
            <Seta x={410} y={285} cor={LARANJA} e={v540} cima />
            <Adesivo x={540} y={440} tam={52} giro={-2} escala={vCem} opacidade={limitar(vCem * 2)} fundo={VERDE}>{`em ${DIAS} dias de cocho`}</Adesivo>
          </g>
        )}
        {gmdVis > 0 && (
          <g opacity={gmdVis}>
            <g transform={`translate(540 320) scale(${gmdE}) rotate(-2)`}>
              <Letra x={-170} y={0} tam={220} cor={AMARELO} borda={0.14}>+1,6</Letra>
              <Letra x={120} y={0} tam={96} ancora="start">kg/dia</Letra>
            </g>
            <Adesivo x={540} y={440} tam={50} giro={-2} escala={prog(t, T_GMD - 0.1, 0.35, mola)} opacidade={prog(t, T_GMD - 0.1, 0.2)} fundo={VERDE}>ganho médio diário</Adesivo>
          </g>
        )}
        <Confete t={t} de={T_GMD} semente={5} y={330} />

        {fecho > 0 && (
          <g>
            <rect width={L} height={A} fill="url(#sc-fecho)" opacity={fecho} />
            <g transform={`translate(540 760) scale(${nome})`} opacity={limitar(nome * 2)}>
              <Letra x={0} y={0} tam={210} borda={0.1}>Rebanho</Letra>
            </g>
            <Adesivo x={540} y={930} tam={72} giro={-3} escala={segue * pulsa} opacidade={limitar(segue * 2)}>Segue pra ver mais!</Adesivo>
            <Confete t={t} de={T_CEL_DESCE + 0.7} semente={29} x={540} y={700} />
          </g>
        )}
      </svg>
      {fecho > 0 && (
        <div style={{ position: "absolute", left: 540 - 95, top: 330, opacity: limitar(nome * 2), transform: `scale(${nome})`, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.35))" }}>
          <Marca tamanho={190} />
        </div>
      )}
    </>
  );
};
