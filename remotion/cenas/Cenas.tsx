import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Cena, Marca } from "../../src/core/roteiro";

type P<T extends Cena["tipo"]> = { cena: Extract<Cena, { tipo: T }>; marca: Marca };

const MARGEM = 90;

function useEntrada(atraso = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - atraso, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${(1 - s) * 60}px)` };
}

const Rodape: React.FC<{ marca: Marca; texto?: string }> = ({ marca, texto }) => (
  <div
    style={{
      position: "absolute",
      left: MARGEM,
      right: MARGEM,
      bottom: 200,
      fontFamily: marca.fonteTexto,
      fontSize: 30,
      color: marca.cores.suave,
      display: "flex",
      justifyContent: "space-between",
    }}
  >
    <span>{texto ? `Fonte: ${texto}` : ""}</span>
    <span>{marca.arroba}</span>
  </div>
);

const Titulo: React.FC<{ marca: Marca; children: React.ReactNode; tamanho?: number; atraso?: number }> = ({
  marca,
  children,
  tamanho = 76,
  atraso = 0,
}) => (
  <div
    style={{
      ...useEntrada(atraso),
      fontFamily: marca.fonteTitulo,
      fontSize: tamanho,
      lineHeight: 1.08,
      color: marca.cores.texto,
      fontWeight: 900,
    }}
  >
    {children}
  </div>
);

export const Abertura: React.FC<P<"abertura">> = ({ cena, marca }) => {
  const frame = useCurrentFrame();
  const barra = interpolate(frame, [0, 18], [0, 260], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: MARGEM, justifyContent: "center" }}>
      <div style={{ width: barra, height: 16, background: marca.cores.primaria, marginBottom: 48 }} />
      <Titulo marca={marca} tamanho={112}>
        {cena.chamada}
      </Titulo>
      {cena.subtitulo && (
        <div style={{ ...useEntrada(10), marginTop: 36, fontFamily: marca.fonteTexto, fontSize: 44, color: marca.cores.suave }}>
          {cena.subtitulo}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Noticia: React.FC<P<"noticia">> = ({ cena, marca }) => (
  <AbsoluteFill style={{ padding: MARGEM, justifyContent: "center" }}>
    <div
      style={{
        background: marca.cores.superficie,
        borderLeft: `14px solid ${marca.cores.primaria}`,
        borderRadius: 24,
        padding: 64,
        ...useEntrada(),
      }}
    >
      <Titulo marca={marca} tamanho={68} atraso={4}>
        {cena.titulo}
      </Titulo>
      <div style={{ ...useEntrada(12), marginTop: 36, fontFamily: marca.fonteTexto, fontSize: 44, lineHeight: 1.35, color: marca.cores.texto }}>
        {cena.texto}
      </div>
    </div>
    <Rodape marca={marca} texto={cena.fonte} />
  </AbsoluteFill>
);

const formatar = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export const Grafico: React.FC<P<"grafico">> = ({ cena, marca }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = Math.max(...cena.pontos.map((p) => p.valor), 0) || 1;
  const altura = 900;
  const largura = 1080 - MARGEM * 2;
  const passo = largura / cena.pontos.length;
  return (
    <AbsoluteFill style={{ padding: MARGEM, paddingTop: 260 }}>
      <Titulo marca={marca} tamanho={64}>
        {cena.titulo}
      </Titulo>
      <div style={{ ...useEntrada(6), marginTop: 20, fontFamily: marca.fonteTexto, fontSize: 36, color: marca.cores.suave }}>
        em {cena.unidade}
      </div>
      <div style={{ position: "relative", height: altura, marginTop: 60 }}>
        {cena.pontos.map((p, i) => {
          const s = spring({ frame: frame - 8 - i * 4, fps, config: { damping: 200 } });
          const h = (Math.max(p.valor, 0) / max) * (altura - 160) * s;
          return (
            <div key={i} style={{ position: "absolute", bottom: 70, left: i * passo + passo * 0.15, width: passo * 0.7 }}>
              <div style={{ textAlign: "center", fontFamily: marca.fonteTexto, fontSize: 30, fontWeight: 700, color: marca.cores.texto, opacity: s, marginBottom: 10 }}>
                {formatar(p.valor * s)}
              </div>
              <div
                style={{
                  height: h,
                  borderRadius: "14px 14px 0 0",
                  background: i === cena.pontos.length - 1 ? marca.cores.primaria : marca.cores.suave,
                }}
              />
              <div style={{ position: "absolute", top: "100%", left: -20, right: -20, marginTop: 16, textAlign: "center", fontFamily: marca.fonteTexto, fontSize: 28, color: marca.cores.suave }}>
                {p.rotulo}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Ranking: React.FC<P<"ranking">> = ({ cena, marca }) => (
  <AbsoluteFill style={{ padding: MARGEM, justifyContent: "center" }}>
    <Titulo marca={marca} tamanho={68}>
      {cena.titulo}
    </Titulo>
    <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 24 }}>
      {cena.itens.map((item, i) => (
        <div
          key={i}
          style={{
            ...useEntrada(6 + i * 5),
            display: "flex",
            alignItems: "center",
            gap: 32,
            background: marca.cores.superficie,
            borderRadius: 20,
            padding: "28px 36px",
            fontFamily: marca.fonteTexto,
            color: marca.cores.texto,
          }}
        >
          <span style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: 64, color: i === 0 ? marca.cores.primaria : marca.cores.suave, width: 70 }}>
            {i + 1}
          </span>
          <span style={{ flex: 1, fontSize: 46, fontWeight: 700 }}>{item.nome}</span>
          <span style={{ fontSize: 42, color: marca.cores.suave }}>{item.valor}</span>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

export const Contagem: React.FC<P<"contagem">> = ({ cena, marca }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const dias = Math.round(cena.dias * s);
  return (
    <AbsoluteFill style={{ padding: MARGEM, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Titulo marca={marca} tamanho={60}>
        {cena.titulo}
      </Titulo>
      <div style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: 340, lineHeight: 1, color: marca.cores.primaria, margin: "40px 0" }}>{dias}</div>
      <div style={{ ...useEntrada(20), fontFamily: marca.fonteTexto, fontSize: 48, color: marca.cores.texto }}>
        {cena.dias === 1 ? "dia" : "dias"} para {cena.rotulo}
      </div>
    </AbsoluteFill>
  );
};

export const Encerramento: React.FC<P<"encerramento">> = ({ cena, marca }) => (
  <AbsoluteFill style={{ padding: MARGEM, justifyContent: "center", alignItems: "center", textAlign: "center", background: marca.cores.primaria }}>
    <div style={{ ...useEntrada(), fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: 130, color: "#FFFFFF" }}>
      {marca.nomeApp}
    </div>
    <div style={{ ...useEntrada(8), marginTop: 40, fontFamily: marca.fonteTexto, fontSize: 52, lineHeight: 1.3, color: "#FFFFFF" }}>{cena.cta}</div>
    <div style={{ ...useEntrada(16), marginTop: 60, fontFamily: marca.fonteTexto, fontSize: 38, color: "#FFFFFF", opacity: 0.85 }}>
      Link na bio · {marca.arroba}
    </div>
  </AbsoluteFill>
);

export const RenderCena: React.FC<{ cena: Cena; marca: Marca }> = ({ cena, marca }) => {
  switch (cena.tipo) {
    case "abertura":
      return <Abertura cena={cena} marca={marca} />;
    case "noticia":
      return <Noticia cena={cena} marca={marca} />;
    case "grafico":
      return <Grafico cena={cena} marca={marca} />;
    case "ranking":
      return <Ranking cena={cena} marca={marca} />;
    case "contagem":
      return <Contagem cena={cena} marca={marca} />;
    case "encerramento":
      return <Encerramento cena={cena} marca={marca} />;
  }
};
