import React from "react";
import { Img, spring, useVideoConfig } from "remotion";
import { canais, cor, fonte, type Canal } from "../marca";
import { prender, saidaForte } from "./base";
import { Icone, type NomeIcone } from "./Icones";

// Efeitos de motion design do formato vertical. Cada um é uma "camada": recebe o tempo desde que
// entrou (t, em segundos) e quanto dura (dur), e desenha por cima do palco.

export type PropsCamada = { t: number; dur: number };

const acaso = (i: number, n: number) => {
  const x = Math.sin(i * 91.7 + n * 47.3) * 43758.5453;
  return x - Math.floor(x);
};

/** Mola no tempo da camada (0 → 1 com um leve passar do ponto). */
function useMola(t: number, atraso = 0, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const { fps } = useVideoConfig();
  return spring({ frame: Math.round((t - atraso) * fps), fps, config: { damping: 13, stiffness: 150, mass: 0.7, ...config } });
}

/** Quanto a camada aparece: entra pela mola e some nos últimos instantes. */
const somePeloFim = (t: number, dur: number, cauda = 0.22) => 1 - prender((t - (dur - cauda)) / cauda);

/** Confete saindo de um ponto: comemoração curta (pagamento confirmado, avaliação cinco estrelas). */
export const Confete: React.FC<PropsCamada & { x: number; y: number; n?: number; forca?: number }> = ({ t, x, y, n = 34, forca = 1 }) => {
  if (t < 0 || t > 1.6) return null;
  const cores = ["#00adff", "#2849db", "#10b981", "#ffd166", "#ffffff", "#ff7a59"];
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const ang = -Math.PI / 2 + (acaso(i, 1) - 0.5) * 2.5;
        const vel = (520 + acaso(i, 2) * 620) * forca;
        const px = x + Math.cos(ang) * vel * t * (1 - 0.25 * t);
        const py = y + Math.sin(ang) * vel * t + 900 * t * t;
        const tam = 12 + acaso(i, 3) * 14;
        const vida = 1 - prender((t - 0.9) / 0.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: tam,
              height: tam * (acaso(i, 4) > 0.5 ? 0.45 : 1),
              borderRadius: acaso(i, 5) > 0.6 ? "50%" : 3,
              background: cores[i % cores.length],
              opacity: vida,
              transform: `rotate(${t * (400 + acaso(i, 6) * 700) * (i % 2 ? 1 : -1)}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

/** Cinco estrelas que acendem uma a uma. */
export const Estrelas: React.FC<PropsCamada & { x: number; y: number; tamanho?: number; atraso?: number }> = ({ t, dur, x, y, tamanho = 96, atraso = 0 }) => {
  const { fps } = useVideoConfig();
  const some = somePeloFim(t, dur);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", display: "flex", gap: tamanho * 0.12, opacity: some }}>
      {Array.from({ length: 5 }, (_, i) => {
        const s = spring({ frame: Math.round((t - atraso - i * 0.11) * fps), fps, config: { damping: 9, stiffness: 190, mass: 0.6 } });
        return (
          <div key={i} style={{ transform: `scale(${s}) rotate(${(1 - s) * -50}deg)`, filter: "drop-shadow(0 10px 18px rgba(0,4,45,0.45))" }}>
            <Icone nome="estrela" tamanho={tamanho} cor="#ffc93c" cheio traco={1.4} />
          </div>
        );
      })}
    </div>
  );
};

/** Selo: uma pílula com ícone e texto que entra com mola. `tom` muda a cor. */
export const Selo: React.FC<
  PropsCamada & { x: number; y: number; texto: string; icone?: NomeIcone; ponto?: string; tom?: "claro" | "marca" | "verde" | "escuro"; tamanho?: number; atraso?: number; giro?: number }
> = ({ t, dur, x, y, texto, icone, ponto, tom = "claro", tamanho = 40, atraso = 0, giro = 0 }) => {
  const s = useMola(t, atraso);
  const some = somePeloFim(t, dur);
  if (t < atraso) return null;
  const tons = {
    claro: { fundo: "#ffffff", texto: cor.tinta, icone: cor.royal },
    marca: { fundo: cor.royal, texto: "#ffffff", icone: "#ffffff" },
    verde: { fundo: "#10b981", texto: "#ffffff", icone: "#ffffff" },
    escuro: { fundo: "rgba(0,4,45,0.82)", texto: "#ffffff", icone: "#7fd8ff" },
  }[tom];
  const flutua = Math.sin((t - atraso) * 1.5 + y) * 5;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + flutua,
        transform: `translate(-50%, -50%) scale(${(0.5 + 0.5 * s) * (0.92 + 0.08 * some)}) rotate(${giro + (1 - s) * -8}deg)`,
        opacity: Math.min(prender(s * 1.4), some),
        display: "flex",
        alignItems: "center",
        gap: tamanho * 0.36,
        padding: `${tamanho * 0.42}px ${tamanho * 0.8}px ${tamanho * 0.42}px ${icone || ponto ? tamanho * 0.6 : tamanho * 0.8}px`,
        borderRadius: tamanho * 2,
        background: tons.fundo,
        color: tons.texto,
        boxShadow: "0 22px 54px rgba(0,4,45,0.48)",
        fontFamily: fonte,
        fontWeight: 600,
        fontSize: tamanho,
        whiteSpace: "nowrap",
      }}
    >
      {icone && <Icone nome={icone} tamanho={tamanho * 1.05} cor={tons.icone} traco={2.3} />}
      {ponto && <span style={{ width: tamanho * 0.5, height: tamanho * 0.5, borderRadius: "50%", background: ponto, flexShrink: 0 }} />}
      {texto}
    </div>
  );
};

/** A logo oficial de um canal num disco branco, entrando com mola (a logo não é alterada). */
export const LogoCanal: React.FC<PropsCamada & { canal: Canal; x: number; y: number; tamanho?: number; atraso?: number; comNome?: boolean; de?: { x: number; y: number } }> = ({
  t,
  dur,
  canal,
  x,
  y,
  tamanho = 150,
  atraso = 0,
  comNome = false,
  de,
}) => {
  const s = useMola(t, atraso, { damping: 12, stiffness: 120, mass: 0.8 });
  const some = somePeloFim(t, dur);
  if (t < atraso) return null;
  const c = canais[canal];
  const k = prender(s);
  const px = de ? de.x + (x - de.x) * s : x;
  const py = (de ? de.y + (y - de.y) * s : y) + Math.sin((t - atraso) * 1.4 + x) * 7;
  return (
    <div style={{ position: "absolute", left: px, top: py, transform: `translate(-50%, -50%) scale(${(0.35 + 0.65 * s) * (0.9 + 0.1 * some)})`, opacity: Math.min(k * 1.5, some), display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: tamanho, height: tamanho, borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 26px 60px rgba(0,4,45,0.5)" }}>
        <Img src={c.src} style={{ width: tamanho * 0.6, height: tamanho * 0.6, objectFit: "contain" }} />
      </div>
      {comNome && <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: tamanho * 0.2, color: "#ffffff", textShadow: "0 4px 14px rgba(0,4,45,0.6)" }}>{c.nome}</div>}
    </div>
  );
};

/** Selo redondo "24h": o anel dá a volta inteira, como um relógio, enquanto o número conta até 24. */
export const Relogio24: React.FC<PropsCamada & { x: number; y: number; tamanho?: number }> = ({ t, dur, x, y, tamanho = 340 }) => {
  const s = useMola(t, 0, { damping: 12, stiffness: 120, mass: 0.8 });
  const some = somePeloFim(t, dur);
  const volta = saidaForte((t - 0.12) / 1.0);
  const r = tamanho / 2 - 18;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: tamanho, height: tamanho, transform: `translate(-50%, -50%) scale(${(0.4 + 0.6 * s) * (0.9 + 0.1 * some)})`, opacity: Math.min(prender(s * 1.4), some) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#ffffff", boxShadow: "0 34px 80px rgba(0,4,45,0.55), 0 0 0 12px rgba(255,255,255,0.14)" }} />
      <svg width={tamanho} height={tamanho} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="#e3e9f8" strokeWidth={15} />
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor.royal} strokeWidth={15} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - volta)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: fonte, color: cor.marinho }}>
        <div style={{ fontSize: tamanho * 0.36, fontWeight: 700, lineHeight: 1, letterSpacing: -3, fontVariantNumeric: "tabular-nums" }}>{Math.round(24 * volta)}h</div>
        <div style={{ fontSize: tamanho * 0.105, fontWeight: 600, color: "#5b6b86", marginTop: 6 }}>por dia</div>
      </div>
    </div>
  );
};
