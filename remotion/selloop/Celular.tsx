import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonte } from "./marca";

// O celular do cliente (lado de quem escreve para a empresa), com a conversa acontecendo:
// mensagens chegando, áudio gravando e tocando com a onda andando. Tema escuro de app de mensagens.

export type MsgCelular = {
  /** Instante (s, no tempo da sequência) em que a mensagem aparece. */
  em: number;
  /** "eu" = o cliente (dono do celular); "empresa" = a Nova Rota. */
  lado: "eu" | "empresa";
  /** "data" = separador de dia (ONTEM, HOJE). */
  tipo: "texto" | "audio" | "cartao" | "data";
  texto?: string;
  hora: string;
  /** Áudio: duração (s) e quando começa a tocar (s). */
  duracao?: number;
  tocaEm?: number;
  /** Cartão (ex.: orçamento ou modelo de campanha): imagem, título, linhas e botões. */
  imagem?: string;
  titulo?: string;
  linhas?: string[];
  botao?: string;
  botoes?: string[];
};

const W = 392;
const H = 820;
const COR = {
  fundo: "#0b141a",
  topo: "#1f2c34",
  eu: "#005c4b",
  empresa: "#202c33",
  texto: "#e9edef",
  suave: "#8696a0",
  verde: "#00a884",
  azulLido: "#53bdeb",
};

const ondas = Array.from({ length: 34 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6 + 1.3)));

const Check: React.FC<{ lido: boolean }> = ({ lido }) => (
  <svg width={18} height={12} viewBox="0 0 18 12" style={{ marginLeft: 3 }}>
    <path d="M1 6.5 L4.5 10 L11 2.5" fill="none" stroke={lido ? COR.azulLido : COR.suave} strokeWidth={1.8} strokeLinecap="round" />
    <path d="M6.5 9.5 L7.5 10 L14 2.5" fill="none" stroke={lido ? COR.azulLido : COR.suave} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

const Play: React.FC<{ tocando: boolean }> = ({ tocando }) =>
  tocando ? (
    <svg width={22} height={22} viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill={COR.suave} /><rect x="14" y="5" width="4" height="14" rx="1" fill={COR.suave} /></svg>
  ) : (
    <svg width={22} height={22} viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill={COR.suave} /></svg>
  );

function fmt(s: number) {
  const n = Math.max(0, Math.round(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

const Audio: React.FC<{ m: MsgCelular; t: number }> = ({ m, t }) => {
  const dur = m.duracao ?? 5;
  const p = m.tocaEm === undefined ? 0 : Math.min(1, Math.max(0, (t - m.tocaEm) / dur));
  const tocando = m.tocaEm !== undefined && t >= m.tocaEm && t < m.tocaEm + dur;
  const tocou = m.tocaEm !== undefined && t >= m.tocaEm + dur;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: 250 }}>
      {m.lado === "empresa" && (
        <div style={{ position: "relative", width: 42, height: 42, borderRadius: 21, background: "#2849db", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
          NR
          <svg width={16} height={16} viewBox="0 0 24 24" style={{ position: "absolute", right: -4, bottom: -2 }}>
            <circle cx="12" cy="12" r="11" fill={COR.empresa} />
            <path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zm-6 8a6 6 0 0 0 12 0" fill="none" stroke={tocou || tocando ? COR.azulLido : COR.verde} strokeWidth={2} />
          </svg>
        </div>
      )}
      <Play tocando={tocando} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ position: "relative", height: 26, display: "flex", alignItems: "center", gap: 2 }}>
          {ondas.map((h, i) => (
            <div key={i} style={{ width: 3, height: 26 * h, borderRadius: 2, background: i / ondas.length <= p ? (m.lado === "eu" ? "#a9e6d6" : COR.azulLido) : "#8696a088" }} />
          ))}
          <div style={{ position: "absolute", left: `calc(${p * 100}% - 6px)`, width: 12, height: 12, borderRadius: 6, background: m.lado === "eu" ? "#a9e6d6" : COR.azulLido }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COR.suave }}>
          <span>{tocando ? fmt(t - (m.tocaEm ?? 0)) : fmt(dur)}</span>
        </div>
      </div>
      {m.lado === "eu" && (
        <div style={{ width: 42, height: 42, borderRadius: 21, background: "#6b7c85", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>FM</div>
      )}
    </div>
  );
};

const Balao: React.FC<{ m: MsgCelular; t: number; lido: boolean }> = ({ m, t, lido }) => {
  const eu = m.lado === "eu";
  return (
    <div style={{ display: "flex", justifyContent: eu ? "flex-end" : "flex-start", padding: "2px 10px" }}>
      <div style={{ maxWidth: m.tipo === "texto" ? 300 : 320, background: eu ? COR.eu : COR.empresa, color: COR.texto, borderRadius: 10, borderTopRightRadius: eu ? 2 : 10, borderTopLeftRadius: eu ? 10 : 2, padding: m.tipo === "texto" ? "7px 10px 6px" : "8px 10px 6px", boxShadow: "0 1px 1px #0005", fontSize: 15.5, lineHeight: 1.32 }}>
        {m.tipo === "texto" && <div style={{ whiteSpace: "pre-wrap" }}>{m.texto}</div>}
        {m.tipo === "audio" && <Audio m={m} t={t} />}
        {m.tipo === "cartao" && (
          <div style={{ width: 280 }}>
            {m.imagem && <Img src={m.imagem} style={{ width: "100%", borderRadius: 7, marginBottom: 7, display: "block" }} />}
            {m.titulo && <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{m.titulo}</div>}
            {m.linhas?.map((l, i) => (
              <div key={i} style={{ fontSize: 14, color: "#d1d7db", whiteSpace: "pre-wrap" }}>{l}</div>
            ))}
            {[...(m.botao ? [m.botao] : []), ...(m.botoes ?? [])].map((b) => (
              <div key={b} style={{ marginTop: 8, borderTop: "1px solid #ffffff1a", paddingTop: 8, textAlign: "center", color: COR.azulLido, fontWeight: 600, fontSize: 15 }}>{b}</div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", fontSize: 11, color: eu ? "#a6c9c0" : COR.suave, marginTop: 2 }}>
          {m.hora}
          {eu && <Check lido={lido} />}
        </div>
      </div>
    </div>
  );
};

const Separador: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ alignSelf: "center", background: "#182229", color: COR.suave, fontSize: 12.5, padding: "5px 12px", borderRadius: 8, margin: "4px 0 6px" }}>{texto}</div>
);

const BarraStatus: React.FC<{ hora: string }> = ({ hora }) => (
  <div style={{ height: 46, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 30px 6px", color: "#fff", fontSize: 16, fontWeight: 600 }}>
    <span>{hora}</span>
    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <svg width={18} height={12} viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff" /><rect x="5" y="5" width="3" height="7" rx="1" fill="#fff" /><rect x="10" y="2" width="3" height="10" rx="1" fill="#fff" /><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff" /></svg>
      <svg width={26} height={13} viewBox="0 0 26 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3" fill="none" stroke="#fff" opacity="0.6" /><rect x="2.5" y="2.5" width="14" height="8" rx="1.5" fill="#fff" /><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#fff" opacity="0.6" /></svg>
    </span>
  </div>
);

/** Celular com a conversa. `t` é o tempo (s) dentro da sequência em que o celular aparece. */
export const Celular: React.FC<{
  mensagens: MsgCelular[];
  hora: string;
  /** Intervalos (s) em que a empresa aparece "gravando áudio..." ou "digitando...". */
  estados?: { de: number; ate: number; texto: string }[];
  /** Intervalo em que o cliente está gravando um áudio (barra de gravação embaixo). */
  gravando?: { de: number; ate: number };
  escala?: number;
  /** Linha embaixo do nome da empresa quando ela não está digitando nem gravando. */
  status?: string;
  /** Altura do aparelho (px, antes da escala). Menor que o padrão = um celular mais curto. */
  altura?: number;
}> = ({ mensagens, hora, estados = [], gravando, escala = 1, status = "Conta comercial", altura = H }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const visiveis = mensagens.filter((m) => t >= m.em);
  const estado = estados.find((e) => t >= e.de && t < e.ate);
  const grav = gravando && t >= gravando.de && t < gravando.ate;
  const ultimaEmpresa = [...mensagens].filter((m) => m.lado === "empresa" && m.tipo !== "data" && t >= m.em).pop();
  return (
    <div style={{ width: W, height: altura, transform: `scale(${escala})`, transformOrigin: "top left", borderRadius: 58, background: "#111", padding: 12, boxShadow: "0 40px 90px #00042d99, inset 0 0 0 2px #333", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ position: "relative", width: W - 24, height: altura - 24, borderRadius: 46, overflow: "hidden", background: COR.fundo }}>
        <div style={{ position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)", width: 110, height: 30, borderRadius: 16, background: "#000", zIndex: 3 }} />
        <div style={{ background: COR.topo }}>
          <BarraStatus hora={hora} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 10px" }}>
            <svg width={12} height={20} viewBox="0 0 12 20"><path d="M10 2 L2 10 L10 18" fill="none" stroke={COR.texto} strokeWidth={2.4} strokeLinecap="round" /></svg>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "#2849db", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>NR</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: COR.texto, fontWeight: 600, fontSize: 16.5, display: "flex", alignItems: "center", gap: 5 }}>
                Nova Rota Distribuidora
                <svg width={16} height={16} viewBox="0 0 24 24"><path d="M12 1l2.6 2.2 3.4-.4 1 3.3 3 1.7-1 3.3 1 3.3-3 1.7-1 3.3-3.4-.4L12 23l-2.6-2.2-3.4.4-1-3.3-3-1.7 1-3.3-1-3.3 3-1.7 1-3.3 3.4.4z" fill={COR.verde} /><path d="M7.5 12.2l3 3 6-6.4" fill="none" stroke="#fff" strokeWidth={2} /></svg>
              </div>
              <div style={{ color: estado ? COR.verde : COR.suave, fontSize: 13 }}>{estado ? estado.texto : status}</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 104, bottom: 62, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, paddingBottom: 8, overflow: "hidden" }}>
          {!mensagens.some((m) => m.tipo === "data") && <Separador texto="HOJE" />}
          {visiveis.map((m, i) => {
            if (m.tipo === "data") return <Separador key={i} texto={m.texto ?? ""} />;
            const s = spring({ frame: frame - Math.round(m.em * fps), fps, config: { damping: 18, stiffness: 170 } });
            const lido = m.lado === "eu" && !!ultimaEmpresa && ultimaEmpresa.em >= m.em;
            return (
              <div key={i} style={{ opacity: s, transform: `translateY(${(1 - s) * 18}px) scale(${0.96 + 0.04 * s})`, transformOrigin: m.lado === "eu" ? "right bottom" : "left bottom" }}>
                <Balao m={m} t={t} lido={lido} />
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 62, display: "flex", alignItems: "center", gap: 8, padding: "0 8px 6px" }}>
          <div style={{ flex: 1, height: 44, borderRadius: 22, background: COR.topo, display: "flex", alignItems: "center", padding: "0 16px", color: grav ? "#f15c6d" : COR.suave, fontSize: 15.5, gap: 8 }}>
            {grav ? (
              <>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: "#f15c6d", opacity: 0.5 + 0.5 * Math.abs(Math.sin(t * 4)) }} />
                <span style={{ color: COR.texto }}>{fmt(t - (gravando?.de ?? 0))}</span>
                <span style={{ marginLeft: "auto", color: COR.suave }}>‹ deslize para cancelar</span>
              </>
            ) : (
              "Mensagem"
            )}
          </div>
          <div style={{ width: 46, height: 46, borderRadius: 23, background: COR.verde, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${grav ? 1.15 + 0.05 * Math.sin(t * 6) : 1})` }}>
            <svg width={22} height={22} viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 14 0M12 19v3" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Entrada do celular com mola, para usar dentro de uma Sequence. */
export function useEntradaCelular(atraso = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - Math.round(atraso * fps), fps, config: { damping: 16, stiffness: 90 } });
  return { opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${(1 - s) * 120}px)` };
}

export const FONTE_CELULAR = fonte;
/** Largura do aparelho (px, antes da escala). */
export const LARGURA_CELULAR = W;
