import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Celular, LARGURA_CELULAR, type MsgCelular } from "../Celular";
import { cor, fonte } from "../marca";
import { prender, RW } from "./base";
import { CeuNoiteReel } from "./Fundo";
import { Icone, type NomeIcone } from "./Icones";

// As partes do Reel 3 fora da plataforma, em formato vertical: a noite, o celular do cliente com o
// áudio que ele manda e, depois, a resposta em áudio da Lia tocando nesse celular.
// Os tempos (s) são locais a cada cena; quem monta (R3Agente.tsx) calcula quando cada áudio toca.

/**
 * O celular é mais curto que um aparelho real para caber, grande, entre o título e a legenda
 * (de y = 546 a 1352). Na cena da noite fica no centro; na da resposta, à direita, com o que a Lia
 * resolve listado à esquerda.
 */
const TOPO = 546;
const ALTURA_NA_TELA = 806;
type Lugar = { escala: number; x: number };
const CENTRO: Lugar = { escala: 1.44, x: (RW - LARGURA_CELULAR * 1.44) / 2 };
const DIREITA: Lugar = { escala: 1.36, x: RW - LARGURA_CELULAR * 1.36 - 30 };

/** O que já estava na conversa: a campanha da Semana do Atacado que o Fábio recebeu ontem (Reel 2). */
const HISTORICO: MsgCelular[] = [
  { em: -1, lado: "empresa", tipo: "data", texto: "ONTEM", hora: "" },
  {
    em: -1,
    lado: "empresa",
    tipo: "cartao",
    imagem: staticFile("selloop/celular/semana-atacado.png"),
    linhas: ["Oi, Fábio! 🛒 É a Semana do Atacado na Nova Rota: até 15% off em bebidas e mercearia, só até sexta.", " ", "Quer que eu já separe o seu pedido?"],
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

/** O celular entrando de baixo, com mola e um balanço leve. */
const CelularNaCena: React.FC<Omit<React.ComponentProps<typeof Celular>, "escala" | "altura"> & { lugar: Lugar }> = ({ lugar, ...props }) => {
  const { frame, fps, t } = useT();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: RW, height: 1920, perspective: 2200 }}>
      <div
        style={{
          position: "absolute",
          left: lugar.x,
          top: TOPO,
          opacity: prender(s * 1.6),
          // a subida vai na transformação: movimento sem degraus de 1 px
          transform: `translateY(${(1 - s) * 220}px) rotateY(${Math.sin(t * 0.6) * 2.4}deg) rotateX(${(1 - s) * 12 + Math.cos(t * 0.45) * 1.2}deg)`,
          transformOrigin: `${(LARGURA_CELULAR * lugar.escala) / 2}px ${ALTURA_NA_TELA / 2}px`,
        }}
      >
        <Celular escala={lugar.escala} altura={ALTURA_NA_TELA / lugar.escala} {...props} />
      </div>
    </div>
  );
};

/** Barrinhas de equalizador: mexem enquanto um áudio toca. */
const Equalizador: React.FC<{ tocando: boolean; n?: number; altura?: number; corBarra?: string }> = ({ tocando, n = 7, altura = 54, corBarra = "#7fd8ff" }) => {
  const { t } = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: altura }}>
      {Array.from({ length: n }, (_, i) => {
        const h = tocando ? altura * (0.25 + 0.75 * Math.abs(Math.sin(t * (5 + i * 0.7) + i * 1.3))) : altura * 0.18;
        return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: corBarra, opacity: tocando ? 1 : 0.5 }} />;
      })}
    </div>
  );
};

/** Etiqueta que entra com mola ao lado do celular (por cima da borda dele). */
const Etiqueta: React.FC<{ em: number; ate?: number; x: number; y: number; giro?: number; tom?: "claro" | "marca" | "verde" | "vidro"; icone?: NomeIcone; children: React.ReactNode; tamanho?: number }> = ({
  em,
  ate,
  x,
  y,
  giro = 0,
  tom = "claro",
  icone,
  children,
  tamanho = 36,
}) => {
  const { frame, fps, t } = useT();
  if (t < em || (ate !== undefined && t > ate)) return null;
  const s = spring({ frame: frame - Math.round(em * fps), fps, config: { damping: 12, stiffness: 150, mass: 0.7 } });
  const some = ate === undefined ? 1 : 1 - prender((t - (ate - 0.22)) / 0.22);
  const tons = {
    claro: { fundo: "#ffffff", texto: cor.tinta, icone: cor.royal, borda: "none" },
    marca: { fundo: cor.royal, texto: "#ffffff", icone: "#ffffff", borda: "none" },
    verde: { fundo: "#10b981", texto: "#ffffff", icone: "#ffffff", borda: "none" },
    vidro: { fundo: "rgba(255,255,255,0.12)", texto: "#ffffff", icone: "#7fd8ff", borda: "1.5px solid rgba(255,255,255,0.24)" },
  }[tom];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${Math.sin((t - em) * 1.5 + x) * 5}px) scale(${(0.5 + 0.5 * s) * (0.92 + 0.08 * some)}) rotate(${giro + (1 - s) * -8}deg)`,
        opacity: Math.min(prender(s * 1.4), some),
        display: "flex",
        alignItems: "center",
        gap: tamanho * 0.34,
        padding: `${tamanho * 0.42}px ${tamanho * 0.75}px ${tamanho * 0.42}px ${icone ? tamanho * 0.58 : tamanho * 0.75}px`,
        borderRadius: tamanho * 2,
        background: tons.fundo,
        border: tons.borda,
        color: tons.texto,
        boxShadow: "0 22px 54px rgba(0,2,30,0.55)",
        fontFamily: fonte,
        fontWeight: 600,
        fontSize: tamanho,
        whiteSpace: "nowrap",
      }}
    >
      {icone && <Icone nome={icone} tamanho={tamanho * 1.05} cor={tons.icone} traco={2.3} />}
      {children}
    </div>
  );
};

/**
 * 23h47: o relógio, o time em casa e o cliente gravando um áudio no WhatsApp; depois o áudio toca.
 * `casa` = quando a fala diz que o time foi para casa; `grava` e `envio` = o cliente grava e manda o
 * áudio; `toca` = quando o áudio dele começa a tocar.
 */
export const CenaNoiteReel: React.FC<{ casa: number; grava: number; envio: number; toca: number; duracaoAudio: number }> = ({ casa, grava, envio, toca, duracaoAudio }) => {
  const { frame, fps, t } = useT();
  const pisca = Math.floor(t * 2) % 2 === 0;
  const tocando = t >= toca && t < toca + duracaoAudio;
  const relogio = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 120, mass: 0.8 } });
  const emCasa = spring({ frame: frame - Math.round(casa * fps), fps, config: { damping: 15, stiffness: 130 } });
  const mensagens: MsgCelular[] = [...HISTORICO, { em: envio, lado: "eu", tipo: "audio", duracao: duracaoAudio, tocaEm: toca, hora: "23:47" }];
  return (
    <AbsoluteFill>
      <CeuNoiteReel />
      {/* a lua */}
      <div style={{ position: "absolute", left: 846, top: 334, width: 84, height: 84, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #ffffff, #cfdcff 60%, #9fb4ff)", boxShadow: "0 0 80px 20px rgba(160,185,255,0.35)", opacity: relogio, transform: `scale(${0.6 + 0.4 * relogio})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 314, textAlign: "center", fontFamily: fonte, color: "#ffffff" }}>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: 1, opacity: 0.72 * relogio }}>Terça-feira · 10 de novembro</div>
        <div style={{ fontSize: 128, fontWeight: 700, lineHeight: 1.04, letterSpacing: -3.5, transform: `scale(${0.7 + 0.3 * relogio})`, opacity: prender(relogio * 1.4), textShadow: "0 10px 50px rgba(120,150,255,0.45)" }}>
          23<span style={{ opacity: pisca ? 1 : 0.25 }}>:</span>47
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: -4, fontSize: 34, fontWeight: 600, opacity: prender(emCasa * 1.3), transform: `translateY(${(1 - emCasa) * 18}px)` }}>
          <Icone nome="lua" tamanho={32} cor="#7fd8ff" traco={2.2} />
          O time já foi para casa.
        </div>
      </div>
      <CelularNaCena lugar={CENTRO} mensagens={mensagens} hora="23:47" gravando={{ de: grava, ate: envio }} />
      <Etiqueta em={grava} ate={envio + 0.1} x={912} y={1296} giro={3} tom="claro" icone="microfone" tamanho={32}>
        Gravando…
      </Etiqueta>
      <Etiqueta em={envio + 0.15} x={208} y={1192} giro={-3} tom="marca" icone="microfone" tamanho={32}>
        Áudio do cliente
      </Etiqueta>
      {t >= toca - 0.2 && (
        <div style={{ position: "absolute", left: 208, top: 1250, transform: "translateX(-50%)", opacity: prender((t - (toca - 0.2)) / 0.3) }}>
          <Equalizador tocando={tocando} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * A Lia grava e manda a resposta em áudio, que toca no celular do cliente; ele responde "Manda sim!".
 * `pontos` = o que a Lia resolve na resposta, cada item no instante (s, dentro do áudio) em que ela fala.
 */
export const CenaRespostaReel: React.FC<{
  grava: number;
  envio: number;
  toca: number;
  duracaoAudio: number;
  resposta: number;
  duracaoAudioCliente: number;
  pontos: { em: number; texto: string }[];
}> = ({ grava, envio, toca, duracaoAudio, resposta, duracaoAudioCliente, pontos }) => {
  const { t } = useT();
  const tocando = t >= toca && t < toca + duracaoAudio;
  const mensagens: MsgCelular[] = [
    ...HISTORICO,
    { em: -1, lado: "eu", tipo: "audio", duracao: duracaoAudioCliente, tocaEm: -100, hora: "23:47" },
    { em: envio, lado: "empresa", tipo: "audio", duracao: duracaoAudio, tocaEm: toca, hora: "23:47" },
    { em: resposta, lado: "eu", tipo: "texto", texto: "Manda sim! 👍", hora: "23:48" },
  ];
  // o que a Lia resolve, em lista à esquerda do celular
  const COLUNA = 262;
  return (
    <AbsoluteFill>
      <CeuNoiteReel />
      <CelularNaCena lugar={DIREITA} mensagens={mensagens} hora="23:47" estados={[{ de: grava, ate: envio, texto: "gravando áudio…" }]} />
      <Etiqueta em={grava} ate={envio + 0.1} x={COLUNA} y={640} giro={-3} tom="vidro" icone="microfone" tamanho={31}>
        Lia gravando…
      </Etiqueta>
      <Etiqueta em={envio + 0.15} x={COLUNA} y={640} giro={-3} tom="marca" icone="robo" tamanho={31}>
        Lia respondeu em áudio
      </Etiqueta>
      {t >= toca - 0.2 && (
        <div style={{ position: "absolute", left: COLUNA, top: 708, transform: "translateX(-50%)", opacity: prender((t - (toca - 0.2)) / 0.3) }}>
          <Equalizador tocando={tocando} n={9} altura={60} />
        </div>
      )}
      {pontos.map((p, i) => (
        <Etiqueta key={i} em={toca + p.em} x={COLUNA} y={870 + i * 124} giro={i % 2 ? 2.5 : -2.5} tom="claro" icone="certo" tamanho={30}>
          {p.texto}
        </Etiqueta>
      ))}
    </AbsoluteFill>
  );
};
