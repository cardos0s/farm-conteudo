import React from "react";
import { useCurrentFrame } from "remotion";
import { Abertura, AMARELO, Adesivo, Cartao, Confete, CORPO, CREME, Etapa, Fecho, Fundo, LARANJA, Letra, Painel, SUAVE, TEXTO, TITULO, TelaCheia, Tx, VERDE, VERDE_ESC, carimbo, pulo, vida } from "../comum/Esquemas";
import { Moldura, type Toque } from "../comum/Moldura";
import { Pasto } from "../comum/Pasto";
import { A, FPS, L } from "../comum/tempo";
import { type Vista } from "../pesagem/Mundo";
import { fora, lerp, limitar, prog } from "../pesagem/roteiro";
import { ARROBAS, ATALHO, CARCACA, CARIMBOS, PESO, R, REND, T, T_RESULTADO, camera, cena, mov } from "./roteiro";

const { F, falas, inicio } = R;
const TOQUES: Toque[] = [...CARIMBOS.map((t) => ({ t, som: "carimbo" as const })), { t: T_RESULTADO, som: "plim", vol: 0.6 }, { t: T.app, som: "giro", vol: 0.35 }, { t: T.foto, som: "clique", vol: 0.6 }, { t: T.segue - 0.1, som: "giro", vol: 0.4 }, { t: T.segue + 0.6, som: "plim", vol: 0.4 }];
const LOTE = [{ brinco: 12, kg: 512 }, { brinco: 19, kg: 480 }, { brinco: 31, kg: 556 }];
const arr = (kg: number) => ((kg * REND) / 100 / 15).toFixed(1).replace(".", ",");

/** Um termo da conta, que pula na tela quando é falado. */
const Termo: React.FC<{ t: number; em: number; x: number; y?: number; tam?: number; cor?: string; children: string }> = ({ t, em, x, y = 0, tam = 92, cor = VERDE, children }) => {
  const e = pulo(t, em - 0.1);
  return e > 0 ? <g transform={`translate(${x} ${y}) scale(${e})`} opacity={limitar(e * 2)}><Tx x={0} y={tam * 0.34} tam={tam} cor={cor}>{children}</Tx></g> : null;
};

export function ReelArroba() {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const v: Vista = { x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1100 * cam.zoom, cx: L / 2, hor: cam.hor, w: L, h: A };
  const fimDe = (n: number) => F(n + 1) - 0.25;
  const app = { de: T.app, ate: T.segue - 0.15 };
  const corta = prog(t, T.sobra - 0.2, 0.9, fora); // a barra do peso vivo se divide em carcaça e o resto
  const res = t >= T.dezenove - 0.1 ? vida(t, T.dezenove - 0.1, fimDe(5)) : { e: 0, o: 0 };
  const estouro = t >= T_RESULTADO ? 1 + 0.2 * Math.exp(-(t - T_RESULTADO) * 7) * Math.cos((t - T_RESULTADO) * 16) : 1;
  return (
    <Moldura t={t} cam={cam} mundo={<Pasto v={v} t={t} id="m" cena={cena} />} falas={falas} inicio={inicio} zEm={mov.zEm} velEm={mov.velEm} toques={TOQUES} bufaEm={F(1) + 2.7}>
      <Fundo />
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
        <Abertura t={t} fala={falas[0]!} inicio={inicio[0]!} ate={fimDe(0)} linhas={[{ n: 3, tam: 80 }, { n: 1, tam: 150, cor: AMARELO }, { n: 3, tam: 96 }]} adesivo={{ texto: "Vem comigo!", em: T.vem }} />

        <Etapa t={t} de={F(1) + 0.2} ate={fimDe(1)}>1 · O QUE É A ARROBA</Etapa>
        <Painel t={t} de={T.arroba - 0.2} ate={fimDe(1)} y={450} h={330}>
          <Tx x={-250} y={22} tam={110}>1 @</Tx>
          <Tx x={-60} y={18} tam={90} cor={SUAVE}>=</Tx>
          <g transform={`translate(190 -10) scale(${carimbo(t, T.quinze - 0.1)})`} opacity={limitar((t - T.quinze + 0.12) / 0.1)}><Tx x={0} y={30} tam={130} cor={LARANJA}>15 kg</Tx></g>
          <Tx x={190} y={104} tam={50} o={prog(t, T.carcaca - 0.1, 0.25)}>de carcaça</Tx>
        </Painel>
        {(() => { const e = vida(t, T.nao - 0.1, fimDe(1)); return <g opacity={e.o}><Adesivo x={540} y={690} tam={54} giro={-2} escala={e.e} fundo="#8E3B2A">não é peso vivo!</Adesivo></g>; })()}

        <Etapa t={t} de={F(2) + 0.2} ate={fimDe(2)}>2 · CARCAÇA E RENDIMENTO</Etapa>
        <Painel t={t} de={F(2) + 0.5} ate={fimDe(2)} y={500} h={440}>
          <Tx x={-430} y={-150} tam={36} ancora="start" cor={SUAVE} titulo={false} peso={700}>PESO VIVO DO BOI</Tx>
          <rect x={-430} y={-124} width={860} height={92} rx={22} fill="#9C968D" />
          <rect x={-430} y={-124} width={lerp(860, 860 * 0.54, corta)} height={92} rx={22} fill={VERDE} />
          <Tx x={-410} y={-62} tam={46} ancora="start" cor={CREME}>{corta > 0.5 ? "CARCAÇA" : "100%"}</Tx>
          <Tx x={410} y={-64} tam={34} ancora="end" cor={CREME} titulo={false} peso={700} o={corta}>fica no abate</Tx>
          {["couro", "cabeça", "patas", "vísceras"].map((p, i) => { const e = pulo(t, T.itens[i]! - 0.1); return <Adesivo key={i} x={-318 + i * 212} y={34} tam={38} giro={[-3, 2, -2, 3][i]!} escala={e} opacidade={limitar(e * 2)} fundo="#6F6B67">{p}</Adesivo>; })}
          <g opacity={prog(t, T.parte - 0.2, 0.3)}>
            <Tx x={0} y={128} tam={50} cor={LARANJA}>RENDIMENTO</Tx>
            <Tx x={0} y={182} tam={40} titulo={false} peso={700}>= carcaça ÷ peso vivo</Tx>
          </g>
        </Painel>

        <Etapa t={t} de={F(3) + 0.2} ate={fimDe(3)}>3 · QUANTO RENDE</Etapa>
        {t > T.cinquenta - 0.15 && t < fimDe(3) + 0.3 && (
          <g opacity={1 - prog(t, fimDe(3), 0.25)}>
            <g transform={`translate(540 440) scale(${carimbo(t, T.cinquenta - 0.1)}) rotate(-2)`} opacity={limitar((t - T.cinquenta + 0.15) / 0.1)}><Letra x={0} y={0} tam={250} cor={AMARELO} borda={0.14}>{`${REND}%`}</Letra></g>
            <Letra x={540} y={545} tam={50}>nelore bem acabado</Letra>
            {["raça", "acabamento", "jejum"].map((p, i) => { const e = pulo(t, T.fatores[i]! - 0.1); return <Adesivo key={i} x={[180, 520, 880][i]!} y={660} tam={50} giro={[-3, 2, -2][i]!} escala={e} opacidade={limitar(e * 2)} fundo={i === 1 ? LARANJA : CREME} cor={i === 1 ? CREME : VERDE}>{p}</Adesivo>; })}
          </g>
        )}

        <Etapa t={t} de={F(4) + 0.2} ate={fimDe(5)}>4 · A CONTA</Etapa>
        <Painel t={t} de={T.pesa - 0.4} ate={fimDe(5)} y={470} h={390}>
          <Tx x={-290} y={-140} tam={30} cor={SUAVE} titulo={false} peso={700} o={pulo(t, T.pesa - 0.1)}>PESO VIVO</Tx>
          <Tx x={30} y={-140} tam={30} cor={SUAVE} titulo={false} peso={700} o={pulo(t, T.vezes - 0.1)}>RENDIMENTO</Tx>
          <Tx x={310} y={-140} tam={30} cor={SUAVE} titulo={false} peso={700} o={pulo(t, T.da - 0.1)}>CARCAÇA</Tx>
          <Termo t={t} em={T.pesa} x={-290} y={-80} tam={84}>{`${PESO} kg`}</Termo>
          <Termo t={t} em={T.vezes} x={-108} y={-80} tam={70} cor={SUAVE}>×</Termo>
          <Termo t={t} em={T.vezes + 0.3} x={30} y={-80} tam={84} cor={LARANJA}>{`${REND}%`}</Termo>
          <Termo t={t} em={T.da} x={160} y={-80} tam={70} cor={SUAVE}>=</Termo>
          <Termo t={t} em={T.da} x={318} y={-80} tam={78}>{`${CARCACA} kg`}</Termo>
          <line x1={-430} x2={430} y1={0} y2={0} stroke="#E4DED2" strokeWidth={5} opacity={prog(t, T.dividindo - 0.3, 0.3)} />
          <Termo t={t} em={T.dividindo} x={-300} y={90} tam={80}>{`${CARCACA} kg`}</Termo>
          <Termo t={t} em={T.dividindo + 0.25} x={-130} y={90} tam={70} cor={SUAVE}>÷</Termo>
          <Termo t={t} em={T.dividindo + 0.5} x={-40} y={90} tam={80} cor={LARANJA}>15</Termo>
          <Termo t={t} em={T.dezenove} x={50} y={90} tam={70} cor={SUAVE}>=</Termo>
        </Painel>
        {res.o > 0 && (
          <g opacity={res.o} transform={`translate(818 600) scale(${res.e * estouro}) rotate(-3)`}><Letra x={0} y={0} tam={118} cor={AMARELO} borda={0.15}>{`${ARROBAS} @`}</Letra></g>
        )}
        <Confete t={t} de={T_RESULTADO} semente={8} x={800} y={560} />

        <Etapa t={t} de={F(6) + 0.2} ate={fimDe(6)}>5 · O ATALHO DE CURRAL</Etapa>
        <Painel t={t} de={T.dividir - 0.3} ate={fimDe(6)} y={470} h={390}>
          <Termo t={t} em={T.dividir} x={-290} y={-95} tam={84}>{`${PESO} kg`}</Termo>
          <Termo t={t} em={T.trinta - 0.3} x={-110} y={-95} tam={70} cor={SUAVE}>÷</Termo>
          <Termo t={t} em={T.trinta} x={10} y={-95} tam={84} cor={LARANJA}>30</Termo>
          <Termo t={t} em={T.dezoito} x={120} y={-95} tam={70} cor={SUAVE}>=</Termo>
          <Termo t={t} em={T.dezoito} x={290} y={-95} tam={96}>{`${ATALHO} @`}</Termo>
          <Tx x={0} y={-10} tam={36} cor="#8E3B2A" titulo={false} peso={700} o={prog(t, T.so50 - 0.2, 0.3)}>o atalho considera só 50% de rendimento</Tx>
          {[{ r: "atalho (÷ 30)", v: `${ATALHO} @`, n: ATALHO, cor: "#9C8B6A", y: 40 }, { r: `conta com ${REND}%`, v: `${ARROBAS} @`, n: 19.5, cor: VERDE, y: 112 }].map((b, i) => {
            const e = prog(t, T.rende - 0.9 + i * 0.5, 0.6, fora);
            return (
              <g key={i} opacity={limitar(e * 3)}>
                <rect x={-430} y={b.y} width={(700 * (b.n - 14) * e) / 5.5} height={54} rx={16} fill={b.cor} />
                <Tx x={-412} y={b.y + 38} tam={32} ancora="start" cor={CREME} titulo={false} peso={700}>{b.r}</Tx>
                <Tx x={-410 + (700 * (b.n - 14) * e) / 5.5} y={b.y + 42} tam={44} ancora="start" cor={b.cor}>{b.v}</Tx>
              </g>
            );
          })}
        </Painel>
      </svg>

      <TelaCheia t={t} de={app.de} ate={app.ate + 0.5} titulo="Arrobas do lote" sub="Lote 4 · peso por foto · 3 bois">
        <Cartao y={380} h={250} e={pulo(t, T.escolher - 1.6)}>
          <div style={{ padding: "30px 40px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: 34, letterSpacing: 2, color: SUAVE }}>RENDIMENTO DE CARCAÇA</span>
            <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 84, color: LARANJA }}>{Math.round(lerp(50, REND, prog(t, T.escolher - 0.4, 0.9)))}%</span>
          </div>
          <div style={{ margin: "0 40px", height: 20, borderRadius: 10, background: "#E9E2D5", position: "relative" }}>
            <div style={{ width: `${lerp(40, 72, prog(t, T.escolher - 0.4, 0.9))}%`, height: "100%", borderRadius: 10, background: LARANJA }} />
            <div style={{ position: "absolute", left: `calc(${lerp(40, 72, prog(t, T.escolher - 0.4, 0.9))}% - 28px)`, top: -18, width: 56, height: 56, borderRadius: 28, background: "#fff", border: `8px solid ${LARANJA}`, boxSizing: "border-box" }} />
          </div>
        </Cartao>
        {LOTE.map((b, i) => (
          <Cartao key={i} y={660 + i * 170} h={150} e={pulo(t, T.foto - 0.2 + i * 0.25)}>
            <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 40px", gap: 26 }}>
              <div style={{ width: 86, height: 86, borderRadius: 43, background: "#F1ECE2", border: `6px solid ${VERDE}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITULO, fontWeight: 800, fontSize: 36, color: TEXTO }}>{b.brinco}</div>
              <div style={{ flex: 1, fontSize: 44, fontWeight: 700, fontFamily: CORPO }}>{b.kg} kg</div>
              <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 72, color: VERDE, opacity: prog(t, T.arrobasLote - 0.2 + i * 0.15, 0.3) }}>{arr(lerp(b.kg * 50 / REND, b.kg, prog(t, T.escolher - 0.4, 0.9)))} @</div>
            </div>
          </Cartao>
        ))}
        <Cartao y={1180} h={220} e={pulo(t, T.arrobasLote + 0.5)} fundo={VERDE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 44px", color: "#fff" }}>
            <span style={{ fontWeight: 700, fontSize: 38, letterSpacing: 2 }}>TOTAL DO LOTE</span>
            <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 120 }}>{arr(lerp(1548 * 50 / REND, 1548, prog(t, T.escolher - 0.4, 0.9)))} @</span>
          </div>
        </Cartao>
      </TelaCheia>
      <Fecho t={t} de={app.ate} />
    </Moldura>
  );
}
