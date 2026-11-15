import React from "react";
import { Mundo, caixaDoBoi, type Vista } from "./Mundo";
import { PELAGENS } from "./Boi";
import { type Camera, MEDIA, PESAGENS, T, T_CEL_DESCE, T_CEL_SOBE, T_LOTE, boiAtual, fora, lerp, limitar, mola, prog } from "./roteiro";

// O celular na mão direita, com o app do Rebanho: câmera que enquadra o boi, peso estimado e o lote do dia.

const LT = 472, AT = 1012; // tela
const VERDE = "#2F5D3A", CREME = "#F4EFE6", LARANJA = "#B5651D", TEXTO = "#1F2A1F", SUAVE = "#6B6F5E", TRAVA = "#7BE08A";
const TITULO = "'Roboto Slab', Georgia, serif", CORPO = "Inter, Arial, sans-serif";
const PELE = "#C98F6B", PELE_ESC = "#A66F4E";

const Cantos: React.FC<{ cx: number; cy: number; w: number; h: number; cor: string; esp: number }> = ({ cx, cy, w, h, cor, esp }) => {
  const c = Math.min(w, h) * 0.2, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const d = `M ${x0},${y0 + c} L ${x0},${y0} L ${x0 + c},${y0} M ${x1 - c},${y0} L ${x1},${y0} L ${x1},${y0 + c} M ${x1},${y1 - c} L ${x1},${y1} L ${x1 - c},${y1} M ${x0 + c},${y1} L ${x0},${y1} L ${x0},${y1 - c}`;
  return (
    <>
      <path d={d} stroke="#000000" strokeOpacity={0.35} strokeWidth={esp + 4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={cor} strokeWidth={esp} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

const TelaCamera: React.FC<{ cam: Camera; t: number }> = ({ cam, t }) => {
  const i = boiAtual(t);
  const b = PESAGENS[i]!;
  const v: Vista = {
    x: cam.x, y: cam.y, z: cam.z, guinada: cam.guinada, f: 800, cx: LT / 2 + 5 * Math.sin(t * 1.9) + 3 * Math.sin(t * 4.3),
    hor: 205 + 4 * Math.sin(t * 2.3 + 1) + (cam.hor - 400) * 0.25, w: LT, h: AT,
  };
  const travou = prog(t, b.trava, 0.42, fora);
  const fotografou = t >= b.clique;
  const caixa = caixaDoBoi(v, b.x, b.z);
  const solta = { cx: LT / 2, cy: 400, w: 390, h: 470 };
  const pulso = 1 + 0.03 * Math.sin(t * 9) * (1 - travou);
  const alvo = caixa ?? solta;
  const cantos = { cx: lerp(solta.cx, alvo.cx, travou), cy: lerp(solta.cy, alvo.cy, travou), w: lerp(solta.w, alvo.w, travou) * pulso, h: lerp(solta.h, alvo.h, travou) * pulso };
  const flash = 1 - prog(t, b.clique, 0.35, fora);
  // contagem 3, 2, 1 só na primeira foto
  const passoCont = (T.foto - T.enquadro + 0.1) / 3;
  const nCont = i === 0 ? Math.floor((t - (T.enquadro - 0.1)) / passoCont) : -1;
  const pCont = i === 0 ? ((t - (T.enquadro - 0.1)) % passoCont) / passoCont : 0;
  const cartao = prog(t, b.clique + 0.12, 0.4, fora);
  const pronto = t >= b.mostra;
  const kg = Math.round(b.peso * prog(t, b.mostra, b.conta, fora));
  const chegou = prog(t, b.mostra + b.conta, 0.3, mola);
  const dica = fotografou ? "Foto feita" : travou > 0.6 ? "Boi enquadrado" : "Enquadre o boi de lado";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <Mundo v={v} t={t} id="cel" leve />
      <svg width={LT} height={AT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="cel-topo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.6} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect width={LT} height={190} fill="url(#cel-topo)" />
        <Cantos {...cantos} cor={travou > 0.6 ? TRAVA : "#FFFFFF"} esp={7} />
        {travou > 0.9 && !fotografou && <circle cx={cantos.cx} cy={cantos.cy} r={7} fill={TRAVA} />}
        {nCont >= 0 && nCont < 3 && (
          <text x={LT / 2} y={420} textAnchor="middle" dominantBaseline="middle" fontFamily={TITULO} fontWeight={800} fontSize={lerp(300, 200, fora(pCont))} fill="#FFFFFF" stroke="#16301D" strokeWidth={10} paintOrder="stroke" opacity={1 - limitar((pCont - 0.7) / 0.3)}>
            {3 - nCont}
          </text>
        )}
      </svg>
      <div style={{ position: "absolute", top: 46, left: 0, right: 0, textAlign: "center", fontFamily: CORPO, fontWeight: 700, fontSize: 24, color: "#fff" }}>Pesagem por foto</div>
      <div style={{ position: "absolute", top: 92, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: travou > 0.6 ? VERDE : "rgba(0,0,0,0.55)", color: "#fff", fontFamily: CORPO, fontWeight: 700, fontSize: 21, padding: "9px 20px", borderRadius: 30 }}>{dica}</div>
      </div>
      {/* botão de foto */}
      <div style={{ position: "absolute", left: LT / 2 - 50, bottom: 60, width: 100, height: 100, borderRadius: 50, border: "7px solid #fff", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - cartao }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: "#fff", transform: `scale(${1 - 0.25 * prog(t, b.clique - 0.12, 0.12)})` }} />
      </div>
      {/* cartão com o peso */}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 22, height: 292, borderRadius: 34, background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.35)", transform: `translateY(${(1 - cartao) * 360}px)`, padding: "26px 30px", boxSizing: "border-box", fontFamily: CORPO, color: TEXTO }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 1.5, color: SUAVE }}>PESO ESTIMADO</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: SUAVE }}>Boi {i + 1} de 3</div>
        </div>
        {pronto ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4, transform: `scale(${1 + 0.06 * chegou * (1 - prog(t, b.mostra + b.conta + 0.3, 0.3))})`, transformOrigin: "left center" }}>
            <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 132, lineHeight: 1.1, color: VERDE }}>{kg}</span>
            <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 58, color: VERDE }}>kg</span>
          </div>
        ) : (
          <div style={{ marginTop: 44, marginBottom: 46 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: VERDE }}>Calculando o peso…</div>
            <div style={{ marginTop: 18, height: 12, borderRadius: 6, background: "#E4DED2", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${100 * limitar((t - b.clique) / Math.max(0.2, b.mostra - b.clique))}%`, background: VERDE, borderRadius: 6 }} />
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, opacity: pronto ? chegou : 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: VERDE, color: "#fff", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXTO }}>Salvo no lote de hoje</div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.95 * (fotografou ? 1 : 0) }} />
    </div>
  );
};

const TelaAbertura: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: VERDE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
    <Marca tamanho={150} />
    <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 76, color: CREME }}>Rebanho</div>
  </div>
);

/** Símbolo do app: cabeça de boi com chifres num quadrado arredondado. */
export const Marca: React.FC<{ tamanho: number; fundo?: string; cor?: string }> = ({ tamanho, fundo = CREME, cor = VERDE }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
    <rect width={100} height={100} rx={26} fill={fundo} />
    <path d="M 18,26 C 16,42 26,50 38,50 L 36,58 C 36,74 42,84 50,84 C 58,84 64,74 64,58 L 62,50 C 74,50 84,42 82,26 C 78,36 70,40 62,40 C 58,36 54,35 50,35 C 46,35 42,36 38,40 C 30,40 22,36 18,26 Z" fill={cor} />
    <ellipse cx={50} cy={74} rx={9} ry={6} fill={fundo} opacity={0.9} />
  </svg>
);

const TelaLote: React.FC<{ t: number }> = ({ t }) => {
  const tm = T_LOTE + 1.35;
  const media = Math.round(MEDIA * prog(t, tm, 0.7, fora));
  const maior = Math.max(...PESAGENS.map((p) => p.peso));
  return (
    <div style={{ position: "absolute", inset: 0, background: CREME, fontFamily: CORPO, color: TEXTO }}>
      <div style={{ background: VERDE, padding: "64px 30px 26px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Marca tamanho={46} />
          <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 40 }}>Lote de hoje</div>
        </div>
        <div style={{ fontSize: 22, marginTop: 8, opacity: 0.9 }}>3 bois pesados por foto</div>
      </div>
      <div style={{ padding: "22px 22px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {PESAGENS.map((p, i) => {
          const e = prog(t, T_LOTE + 0.35 + i * 0.22, 0.4, fora);
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 24, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, opacity: e, transform: `translateX(${(1 - e) * 60}px)`, boxShadow: "0 3px 10px rgba(60,40,10,0.08)" }}>
              <div style={{ width: 62, height: 62, borderRadius: 31, background: PELAGENS[p.pelagem]!.corpo, border: `4px solid ${PELAGENS[p.pelagem]!.cupim}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITULO, fontWeight: 800, fontSize: 26, color: TEXTO }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>Brinco {12 + i * 7}</div>
                <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: "#E9E2D5" }}>
                  <div style={{ height: "100%", width: `${(p.peso / maior) * 100 * e}%`, borderRadius: 5, background: i === 1 ? LARANJA : VERDE }} />
                </div>
              </div>
              <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 40, color: VERDE }}>{p.peso}<span style={{ fontSize: 24 }}> kg</span></div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, background: VERDE, borderRadius: 28, padding: "24px 28px 20px", color: "#fff", opacity: prog(t, tm - 0.2, 0.4), transform: `scale(${lerp(0.9, 1, prog(t, tm - 0.2, 0.45, mola))})` }}>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: 1.5, opacity: 0.85 }}>MÉDIA DO LOTE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 150, lineHeight: 1.12 }}>{media}</span>
            <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 62 }}>kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Celular: React.FC<{ cam: Camera; t: number }> = ({ cam, t }) => {
  const sobe = prog(t, T_CEL_SOBE, 0.65, mola);
  const lote = prog(t, T_LOTE - 0.1, 0.6);
  const desce = prog(t, T_CEL_DESCE, 0.7, (x) => x * x);
  if (t < T_CEL_SOBE || desce >= 1) return null;
  const escala = lerp(1, 1.27, lote);
  const x = lerp(690, 560, lote) - limitar(cam.giroVel, -200, 200) * 0.5 + 4 * Math.sin(t * 1.7);
  const topo = lerp(905, 500, lote) + (1 - sobe) * 1250 + desce * 1700 + 5 * Math.sin(t * 2.1);
  const giro = lerp(-2.5, 0, lote) + (1 - sobe) * 14 + limitar(cam.giroVel, -200, 200) * 0.03 + desce * 10;
  const abre = prog(t, T_CEL_SOBE + 0.5, 0.35);
  const toque = PESAGENS.reduce((s, p) => s + (t > p.clique - 0.18 && t < p.clique + 0.12 ? Math.sin(((t - p.clique + 0.18) / 0.3) * Math.PI) : 0), 0);
  return (
    <div style={{ position: "absolute", left: x, top: topo, width: 0, height: 0, transform: `rotate(${giro}deg) scale(${escala})`, transformOrigin: "0 520px" }}>
      {/* palma e braço por trás do aparelho */}
      <svg width={900} height={1500} viewBox="-300 0 900 1500" style={{ position: "absolute", left: -300, top: 0, overflow: "visible" }}>
        <defs>
          <pattern id="cel-xadrez" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <rect width="56" height="56" fill="#2F5D3A" />
            <rect width="56" height="14" fill="#F4EFE6" opacity="0.28" />
            <rect width="14" height="56" fill="#F4EFE6" opacity="0.28" />
            <rect y="28" width="56" height="5" fill="#16301D" opacity="0.5" />
            <rect x="28" width="5" height="56" fill="#16301D" opacity="0.5" />
          </pattern>
        </defs>
        <path d="M 150,1080 L 400,1010 L 640,1700 L 300,1700 Z" fill="url(#cel-xadrez)" />
        <path d="M 138,1066 L 408,990 L 420,1030 L 150,1104 Z" fill="#244A2E" />
        <path d="M -200,620 C -260,700 -250,930 -120,1050 C 20,1150 300,1120 380,1010 C 420,900 380,700 300,640 Z" fill={PELE} />
      </svg>
      {/* aparelho */}
      <div style={{ position: "absolute", left: -250, top: 0, width: 500, height: 1040, borderRadius: 66, background: "#14161A", boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 3px #3A3D44" }}>
        <div style={{ position: "absolute", left: 14, top: 14, width: LT, height: AT, borderRadius: 54, overflow: "hidden", background: "#000" }}>
          {lote < 1 && <TelaCamera cam={cam} t={t} />}
          {abre < 1 && <div style={{ position: "absolute", inset: 0, opacity: 1 - abre }}><TelaAbertura /></div>}
          {lote > 0 && <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - lote) * LT}px)` }}><TelaLote t={t} /></div>}
          <div style={{ position: "absolute", left: LT / 2 - 56, top: 12, width: 112, height: 26, borderRadius: 13, background: "#000" }} />
        </div>
      </div>
      {/* dedos na frente */}
      <svg width={900} height={1500} viewBox="-300 0 900 1500" style={{ position: "absolute", left: -300, top: 0, overflow: "visible" }}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={-290} y={596 + i * 92} width={74 - i * 3} height={78} rx={36} fill={PELE} stroke={PELE_ESC} strokeWidth={3} />
          </g>
        ))}
        <g transform={`rotate(${-toque * 16} 300 900)`}>
          <path d="M 330,940 C 340,860 320,760 262,690 C 240,668 206,676 204,706 C 204,740 232,790 236,850 C 238,900 250,940 280,960 Z" fill={PELE} stroke={PELE_ESC} strokeWidth={3} />
          <path d="M 216,700 C 222,690 244,690 252,704 C 246,716 226,718 216,700 Z" fill="#E7C3A8" opacity={0.8} />
        </g>
      </svg>
    </div>
  );
};
