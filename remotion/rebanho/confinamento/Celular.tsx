import React from "react";
import { Aparelho, Cantos, Marca, TelaAbertura } from "../pesagem/Celular";
import { type Vista, caixaDoBoi } from "../pesagem/Mundo";
import { type Camera, fora, lerp, limitar, mola, prog } from "../pesagem/roteiro";
import { Confinamento } from "./Mundo";
import { BOI_FOTO, DIAS, ENTRADA, FOTOS, GMD, SAIDA, T, T_CEL_DESCE, T_CEL_SOBE, T_CLIQUE, T_EVOL, T_GMD, T_PESO, T_TRAVA } from "./roteiro";

// O app do Rebanho no confinamento: foto do boi (peso de hoje) e a evolução do lote, foto a foto.

const LT = 472, AT = 1012;
const VERDE = "#2F5D3A", CREME = "#F4EFE6", LARANJA = "#B5651D", TEXTO = "#1F2A1F", SUAVE = "#6B6F5E", TRAVA = "#7BE08A";
const TITULO = "'Roboto Slab', Georgia, serif", CORPO = "Inter, Arial, sans-serif";

const TelaCamera: React.FC<{ cam: Camera; t: number }> = ({ cam, t }) => {
  const v: Vista = {
    x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 1250, cx: LT / 2 + 5 * Math.sin(t * 1.9) + 3 * Math.sin(t * 4.3),
    hor: 160 + 4 * Math.sin(t * 2.3 + 1) + (cam.hor - 400) * 0.25, w: LT, h: AT,
  };
  const travou = prog(t, T_TRAVA, 0.42, fora);
  const fotografou = t >= T_CLIQUE;
  const solta = { cx: LT / 2, cy: 400, w: 390, h: 470 };
  const alvo = caixaDoBoi(v, BOI_FOTO.x, BOI_FOTO.z) ?? solta;
  const pulso = 1 + 0.03 * Math.sin(t * 9) * (1 - travou);
  const cantos = { cx: lerp(solta.cx, alvo.cx, travou), cy: lerp(solta.cy, alvo.cy, travou), w: lerp(solta.w, alvo.w, travou) * pulso, h: lerp(solta.h, alvo.h, travou) * pulso };
  const flash = fotografou ? 1 - prog(t, T_CLIQUE, 0.35, fora) : 0;
  const cartao = prog(t, T_CLIQUE + 0.1, 0.35, fora);
  const kg = Math.round(SAIDA * prog(t, T_PESO, 0.4, fora));
  const dica = fotografou ? "Foto de hoje" : travou > 0.6 ? "Boi enquadrado" : "Enquadre o boi de lado";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <Confinamento v={v} t={t} id="cel" leve />
      <svg width={LT} height={AT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="celc-topo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.6} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect width={LT} height={190} fill="url(#celc-topo)" />
        <Cantos {...cantos} cor={travou > 0.6 ? TRAVA : "#FFFFFF"} esp={7} />
      </svg>
      <div style={{ position: "absolute", top: 46, left: 0, right: 0, textAlign: "center", fontFamily: CORPO, fontWeight: 700, fontSize: 24, color: "#fff" }}>Pesagem por foto · Lote 4</div>
      <div style={{ position: "absolute", top: 92, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: travou > 0.6 ? VERDE : "rgba(0,0,0,0.55)", color: "#fff", fontFamily: CORPO, fontWeight: 700, fontSize: 21, padding: "9px 20px", borderRadius: 30 }}>{dica}</div>
      </div>
      <div style={{ position: "absolute", left: LT / 2 - 50, bottom: 60, width: 100, height: 100, borderRadius: 50, border: "7px solid #fff", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - cartao }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: "#fff", transform: `scale(${1 - 0.25 * prog(t, T_CLIQUE - 0.12, 0.12)})` }} />
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 22, height: 250, borderRadius: 34, background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.35)", transform: `translateY(${(1 - cartao) * 320}px)`, padding: "26px 30px", boxSizing: "border-box", fontFamily: CORPO, color: TEXTO }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 1.5, color: SUAVE }}>PESO DE HOJE</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: SUAVE }}>Dia {DIAS}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4, opacity: t >= T_PESO ? 1 : 0.25 }}>
          <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 132, lineHeight: 1.1, color: VERDE }}>{t >= T_PESO ? kg : "···"}</span>
          <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 58, color: VERDE }}>kg</span>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.95 }} />
    </div>
  );
};

/** Gráfico do peso médio do lote, de foto em foto. */
const TelaEvolucao: React.FC<{ t: number }> = ({ t }) => {
  const GL = 416, GA = 340, m = { e: 16, d: 30, c: 46, b: 44 };
  const X = (dia: number) => m.e + ((GL - m.e - m.d) * dia) / DIAS;
  const Y = (kg: number) => GA - m.b - ((GA - m.c - m.b) * (kg - 360)) / (560 - 360);
  // a linha anda junto com a fala: de 380... pra 540... em cem dias
  const p = prog(t, T.de380 - 0.3, T.cem - T.de380 + 0.5, (x) => x);
  const diaAtual = DIAS * p;
  const pontos = FOTOS.filter((f) => f.dia <= diaAtual).map((f) => `${X(f.dia)},${Y(f.peso)}`);
  const ponta = `${X(diaAtual)},${Y(ENTRADA + GMD * diaAtual)}`;
  const linha = [...pontos, ponta].join(" ");
  const gmd = prog(t, T.gmd - 0.1, T_GMD - T.gmd + 0.1, fora) * GMD;
  const cartaoGmd = prog(t, T.gmd - 0.3, 0.4, mola);
  return (
    <div style={{ position: "absolute", inset: 0, background: CREME, fontFamily: CORPO, color: TEXTO }}>
      <div style={{ background: VERDE, padding: "64px 28px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Marca tamanho={46} />
          <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 38 }}>Evolução do lote</div>
        </div>
        <div style={{ fontSize: 21, marginTop: 8, opacity: 0.9 }}>Lote 4 · {DIAS} dias de cocho · peso médio</div>
      </div>
      <div style={{ margin: "20px 18px 0", background: "#fff", borderRadius: 26, padding: "10px 10px 6px", boxShadow: "0 3px 10px rgba(60,40,10,0.08)" }}>
        <svg width={GL} height={GA} viewBox={`0 0 ${GL} ${GA}`}>
          <defs>
            <linearGradient id="evo-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={VERDE} stopOpacity={0.32} />
              <stop offset="1" stopColor={VERDE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {[400, 450, 500, 550].map((kg) => (
            <g key={kg}>
              <line x1={m.e} x2={GL - m.d} y1={Y(kg)} y2={Y(kg)} stroke="#E9E2D5" strokeWidth={2} />
              <text x={GL - m.d + 4} y={Y(kg) + 5} fontSize={13} fill={SUAVE}>{kg}</text>
            </g>
          ))}
          {p > 0 && <polygon points={`${X(0)},${GA - m.b} ${linha} ${X(diaAtual)},${GA - m.b}`} fill="url(#evo-area)" />}
          {p > 0 && <polyline points={linha} fill="none" stroke={VERDE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
          {FOTOS.map((f, i) => {
            const e = prog(t, T.de380 - 0.3 + ((T.cem - T.de380 + 0.5) * f.dia) / DIAS - 0.05, 0.3, mola);
            if (e <= 0) return null;
            const ultimo = i === FOTOS.length - 1;
            return (
              <g key={i} transform={`translate(${X(f.dia)} ${Y(f.peso)})`}>
                <circle r={(ultimo ? 15 : 11) * e} fill={ultimo ? LARANJA : "#fff"} stroke={ultimo ? "#fff" : VERDE} strokeWidth={5} />
                <text y={-22} textAnchor={i === 0 ? "start" : ultimo ? "end" : "middle"} x={i === 0 ? -8 : ultimo ? 14 : 0} fontFamily={TITULO} fontWeight={800} fontSize={ultimo ? 30 : 23} fill={ultimo ? LARANJA : VERDE} opacity={limitar(e)}>{f.peso}</text>
                <text y={GA - m.b - Y(f.peso) + 26} textAnchor={i === 0 ? "start" : ultimo ? "end" : "middle"} x={i === 0 ? -8 : ultimo ? 14 : 0} fontSize={16} fontWeight={700} fill={SUAVE}>dia {f.dia}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 12, margin: "14px 18px 0" }}>
        {[{ r: "ENTRADA", kg: ENTRADA, e: prog(t, T.de380 - 0.2, 0.35, mola) }, { r: "HOJE", kg: SAIDA, e: prog(t, T.para540 - 0.1, 0.35, mola) }].map((c) => (
          <div key={c.r} style={{ flex: 1, background: "#fff", borderRadius: 22, padding: "14px 18px", opacity: limitar(c.e * 2), transform: `scale(${lerp(0.85, 1, c.e)})`, boxShadow: "0 3px 10px rgba(60,40,10,0.08)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1.4, color: SUAVE }}>{c.r}</div>
            <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 48, color: VERDE, lineHeight: 1.15 }}>{c.kg}<span style={{ fontSize: 24 }}> kg</span></div>
          </div>
        ))}
      </div>
      <div style={{ margin: "14px 18px 0", background: VERDE, borderRadius: 26, padding: "18px 24px 14px", color: "#fff", opacity: limitar(cartaoGmd * 2), transform: `scale(${lerp(0.88, 1, cartaoGmd)})` }}>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 1.5, opacity: 0.85 }}>GANHO MÉDIO DIÁRIO</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 112, lineHeight: 1.12 }}>{gmd.toFixed(1).replace(".", ",")}</span>
          <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 44 }}>kg/dia</span>
        </div>
      </div>
    </div>
  );
};

export const Celular: React.FC<{ cam: Camera; t: number }> = ({ cam, t }) => {
  const sobe = prog(t, T_CEL_SOBE, 0.65, mola);
  const evol = prog(t, T_EVOL - 0.1, 0.6);
  const desce = prog(t, T_CEL_DESCE, 0.7, (x) => x * x);
  if (t < T_CEL_SOBE || desce >= 1) return null;
  const x = lerp(690, 560, evol) - limitar(cam.giroVel, -200, 200) * 0.5 + 4 * Math.sin(t * 1.7);
  const topo = lerp(905, 690, evol) + (1 - sobe) * 1250 + desce * 1700 + 5 * Math.sin(t * 2.1);
  const giro = lerp(-2.5, 0, evol) + (1 - sobe) * 14 + limitar(cam.giroVel, -200, 200) * 0.03 + desce * 10;
  const abre = prog(t, T_CEL_SOBE + 0.5, 0.35);
  const toque = t > T_CLIQUE - 0.18 && t < T_CLIQUE + 0.12 ? Math.sin(((t - T_CLIQUE + 0.18) / 0.3) * Math.PI) : 0;
  return (
    <Aparelho x={x} topo={topo} giro={giro} escala={lerp(1, 1.27, evol)} toque={toque}>
      {evol < 1 && <TelaCamera cam={cam} t={t} />}
      {abre < 1 && <div style={{ position: "absolute", inset: 0, opacity: 1 - abre }}><TelaAbertura /></div>}
      {evol > 0 && <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - evol) * LT}px)` }}><TelaEvolucao t={t} /></div>}
    </Aparelho>
  );
};
