import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Celular, type MsgCelular } from "../Celular";
import { cor, fonte } from "../marca";

// As partes do vídeo 3 fora da plataforma: a noite, o celular do cliente e a resposta em áudio da Lia.
// Os tempos (s) são locais ao bloco; quem monta (Agente.tsx) calcula quando cada áudio toca.

const ESCALA_CELULAR = 1.08;
const CELULAR = { x: 1170, y: (1080 - 820 * ESCALA_CELULAR) / 2 };

/** O que já estava na conversa: a campanha da Semana do Atacado que o Fábio recebeu ontem (vídeo 2). */
const HISTORICO: MsgCelular[] = [
  { em: -1, lado: "empresa", tipo: "data", texto: "ONTEM", hora: "" },
  {
    em: -1,
    lado: "empresa",
    tipo: "cartao",
    imagem: staticFile("selloop/celular/semana-atacado.png"),
    linhas: ["Oi, Fábio! 🛒 É a Semana do Atacado na Nova Rota: até 15% off em bebidas e mercearia, só até sexta.", "\u00a0", "Quer que eu já separe o seu pedido?"],
    botoes: ["Quero aproveitar", "Falar com vendedor"],
    hora: "09:00",
  },
  { em: -1, lado: "empresa", tipo: "data", texto: "HOJE", hora: "" },
];

function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
}

/** Céu de madrugada: azul quase preto, um brilho de lua e estrelas piscando devagar. */
export const CeuNoite: React.FC = () => {
  const { t } = useT();
  const estrelas = React.useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return { x: r(1) * 1920, y: r(2) * 1080, tam: 1 + r(3) * 2.2, fase: r(4) * 6.28, vel: 0.6 + r(5) * 1.4 };
      }),
    [],
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #01030f 0%, #040a2a 52%, #0a1858 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -260, top: -320, width: 1100, height: 1100, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,150,255,0.20) 0%, rgba(120,150,255,0) 62%)" }} />
      <div style={{ position: "absolute", right: -380, bottom: -520, width: 1300, height: 1300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,173,255,0.16) 0%, rgba(0,173,255,0) 60%)" }} />
      {estrelas.map((e, i) => (
        <div key={i} style={{ position: "absolute", left: e.x, top: e.y, width: e.tam, height: e.tam, borderRadius: "50%", background: "#dfe7ff", opacity: 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * e.vel + e.fase)) }} />
      ))}
    </AbsoluteFill>
  );
};

const Entra: React.FC<{ em: number; children: React.ReactNode; de?: number; style?: React.CSSProperties }> = ({ em, children, de = 24, style }) => {
  const { frame, fps } = useT();
  const s = spring({ frame: frame - Math.round(em * fps), fps, config: { damping: 18, stiffness: 120 } });
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * de}px)`, ...style }}>{children}</div>;
};

/** O celular entrando de baixo, com mola. */
const CelularNaCena: React.FC<React.ComponentProps<typeof Celular>> = (props) => {
  const { frame, fps } = useT();
  const s = spring({ frame, fps, config: { damping: 17, stiffness: 80 } });
  return (
    <div style={{ position: "absolute", left: CELULAR.x, top: CELULAR.y + (1 - s) * 140, opacity: interpolate(s, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }) }}>
      <Celular escala={ESCALA_CELULAR} {...props} />
    </div>
  );
};

/** Barrinhas de equalizador: mexem enquanto um áudio toca. */
const Equalizador: React.FC<{ tocando: boolean; corBarra?: string }> = ({ tocando, corBarra = cor.ciano }) => {
  const { t } = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: 64 }}>
      {Array.from({ length: 9 }, (_, i) => {
        const h = tocando ? 14 + 46 * Math.abs(Math.sin(t * (5 + i * 0.7) + i * 1.3)) : 10;
        return <div key={i} style={{ width: 9, height: h, borderRadius: 5, background: corBarra, opacity: tocando ? 1 : 0.45 }} />;
      })}
    </div>
  );
};

/**
 * 23h47: o relógio, o time em casa e o cliente gravando um áudio no WhatsApp; depois o áudio toca.
 * `fala` = início da narração; `envio` = quando o áudio sai; `toca` = quando o áudio do cliente toca.
 */
export const CenaNoite: React.FC<{ fala: number; casa: number; grava: number; envio: number; toca: number; duracaoAudio: number }> = ({ fala, casa, grava, envio, toca, duracaoAudio }) => {
  const { t } = useT();
  const pisca = Math.floor(t * 2) % 2 === 0;
  const tocando = t >= toca && t < toca + duracaoAudio;
  const mensagens: MsgCelular[] = [...HISTORICO, { em: envio, lado: "eu", tipo: "audio", duracao: duracaoAudio, tocaEm: toca, hora: "23:47" }];
  return (
    <AbsoluteFill>
      <CeuNoite />
      <div style={{ position: "absolute", left: 190, top: 250, width: 860, fontFamily: fonte, color: "#fff" }}>
        <Entra em={0.1}>
          <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: 1, opacity: 0.7 }}>Terça-feira · 10 de novembro</div>
        </Entra>
        <Entra em={Math.max(0.2, fala - 0.1)} de={36}>
          <div style={{ fontSize: 236, fontWeight: 700, lineHeight: 1, letterSpacing: -6, marginTop: 10 }}>
            23<span style={{ opacity: pisca ? 1 : 0.25 }}>:</span>47
          </div>
        </Entra>
        <Entra em={casa}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 34, fontSize: 40, fontWeight: 500, opacity: 0.9 }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5V21H3z" />
              <path d="M9.5 21v-6h5v6" />
            </svg>
            O time já foi para casa.
          </div>
        </Entra>
        <Entra em={envio}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 46 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 28px", borderRadius: 40, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", fontSize: 32, fontWeight: 600 }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={cor.ciano} strokeWidth={2.2} strokeLinecap="round">
                <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 14 0M12 19v3" />
              </svg>
              Áudio novo do cliente
            </div>
            <Equalizador tocando={tocando} />
          </div>
        </Entra>
      </div>
      <CelularNaCena mensagens={mensagens} hora="23:47" gravando={{ de: grava, ate: envio }} />
    </AbsoluteFill>
  );
};

/** A Lia grava e manda a resposta em áudio, que toca no celular do cliente; ele responde "Manda sim!". */
export const CenaResposta: React.FC<{ grava: number; envio: number; toca: number; duracaoAudio: number; resposta: number; duracaoAudioCliente: number }> = ({ grava, envio, toca, duracaoAudio, resposta, duracaoAudioCliente }) => {
  const { t } = useT();
  const tocando = t >= toca && t < toca + duracaoAudio;
  const mensagens: MsgCelular[] = [
    ...HISTORICO,
    { em: -1, lado: "eu", tipo: "audio", duracao: duracaoAudioCliente, tocaEm: -100, hora: "23:47" },
    { em: envio, lado: "empresa", tipo: "audio", duracao: duracaoAudio, tocaEm: toca, hora: "23:47" },
    { em: resposta, lado: "eu", tipo: "texto", texto: "Manda sim! 👍", hora: "23:48" },
  ];
  return (
    <AbsoluteFill>
      <CeuNoite />
      <div style={{ position: "absolute", left: 190, top: 270, width: 880, fontFamily: fonte, color: "#fff" }}>
        <Entra em={0.15}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ width: 112, height: 112, borderRadius: 34, background: `linear-gradient(135deg, ${cor.royal}, ${cor.ciano})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 60px rgba(0,173,255,0.35)" }}>
              <svg width={62} height={62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="8" width="16" height="12" rx="3" />
                <path d="M12 8V4M9 13v1M15 13v1M9.5 17h5" />
                <circle cx="12" cy="3.5" r="1" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1 }}>Lia</div>
              <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.75, marginTop: 8 }}>Agente inteligente da Nova Rota</div>
            </div>
          </div>
        </Entra>
        <Entra em={Math.max(0.4, envio - 0.2)}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 60 }}>
            <div style={{ padding: "16px 28px", borderRadius: 40, background: cor.royal, fontSize: 34, fontWeight: 600, boxShadow: "0 18px 44px rgba(0,4,45,0.45)" }}>Respondendo em áudio</div>
            <Equalizador tocando={tocando} />
          </div>
        </Entra>
        <Entra em={toca + 1.2}>
          <div style={{ marginTop: 40, fontSize: 32, fontWeight: 500, opacity: 0.8, lineHeight: 1.4 }}>Às 23h47, com voz natural.</div>
        </Entra>
      </div>
      <CelularNaCena mensagens={mensagens} hora="23:47" estados={[{ de: grava, ate: envio, texto: "gravando áudio…" }]} />
    </AbsoluteFill>
  );
};
