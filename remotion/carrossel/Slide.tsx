import React from "react";
import { AbsoluteFill } from "remotion";
import { ALTURA_SLIDE, LARGURA_SLIDE, type PropsSlide, type Slide as TipoSlide } from "../../src/core/carrossel";
import type { Marca } from "../../src/core/roteiro";

// Slides estáticos de carrossel (1080x1350). O elemento da marca avança a cada slide:
// o anel do Pomodoro vai fechando, a cerca vai se estendendo e a zebra continua de um slide para o outro.

const MARGEM = 90;
type P<T extends TipoSlide["tipo"]> = { slide: Extract<TipoSlide, { tipo: T }>; marca: Marca };

/** Diminui a fonte quando o texto é longo, para nada vazar do slide. */
function tamanho(texto: string, base: number, minimo: number, folga: number): number {
  if (texto.length <= folga) return base;
  return Math.max(minimo, Math.round(base * Math.sqrt(folga / texto.length)));
}

const Titulo: React.FC<{ marca: Marca; texto: string; base?: number; folga?: number }> = ({ marca, texto, base = 76, folga = 40 }) => (
  <div style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: tamanho(texto, base, 48, folga), lineHeight: 1.1, color: marca.cores.texto }}>
    {texto}
  </div>
);

const Fonte: React.FC<{ marca: Marca; fonte: string | null }> = ({ marca, fonte }) =>
  fonte ? <div style={{ marginTop: 40, fontFamily: marca.fonteTexto, fontSize: 28, color: marca.cores.suave }}>Fonte: {fonte}</div> : null;

const Capa: React.FC<P<"capa">> = ({ slide, marca }) => (
  <>
    <div style={{ width: 220, height: 16, background: marca.cores.primaria, marginBottom: 48 }} />
    <div style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: tamanho(slide.titulo, 112, 64, 45), lineHeight: 1.05, color: marca.cores.texto }}>
      {slide.titulo}
    </div>
    {slide.subtitulo && (
      <div style={{ marginTop: 36, fontFamily: marca.fonteTexto, fontSize: tamanho(slide.subtitulo, 44, 32, 70), lineHeight: 1.3, color: marca.cores.suave }}>
        {slide.subtitulo}
      </div>
    )}
    <div
      style={{
        marginTop: 64,
        alignSelf: "flex-start",
        padding: "18px 32px",
        borderRadius: 999,
        background: marca.cores.primaria,
        color: "#FFFFFF",
        fontFamily: marca.fonteTexto,
        fontWeight: 700,
        fontSize: 34,
      }}
    >
      Arrasta para o lado →
    </div>
  </>
);

const Texto: React.FC<P<"texto">> = ({ slide, marca }) => (
  <div style={{ background: marca.cores.superficie, borderLeft: `14px solid ${marca.cores.primaria}`, borderRadius: 24, padding: 64 }}>
    <Titulo marca={marca} texto={slide.titulo} base={68} />
    <div style={{ marginTop: 36, fontFamily: marca.fonteTexto, fontSize: tamanho(slide.texto, 44, 32, 180), lineHeight: 1.4, color: marca.cores.texto }}>
      {slide.texto}
    </div>
    <Fonte marca={marca} fonte={slide.fonte} />
  </div>
);

const Lista: React.FC<P<"lista">> = ({ slide, marca }) => {
  const maior = Math.max(...slide.itens.map((i) => i.length), 0);
  const fonte = tamanho("x".repeat(maior), 42, 32, 60);
  return (
    <>
      <Titulo marca={marca} texto={slide.titulo} base={68} />
      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 22 }}>
        {slide.itens.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 28, alignItems: "flex-start", background: marca.cores.superficie, borderRadius: 20, padding: "26px 32px" }}>
            <span style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: 48, lineHeight: 1, color: marca.cores.primaria, minWidth: 40 }}>{i + 1}</span>
            <span style={{ fontFamily: marca.fonteTexto, fontSize: fonte, lineHeight: 1.3, color: marca.cores.texto }}>{item}</span>
          </div>
        ))}
      </div>
      <Fonte marca={marca} fonte={slide.fonte} />
    </>
  );
};

const Numero: React.FC<P<"numero">> = ({ slide, marca }) => (
  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: tamanho(slide.valor, 260, 120, 6), lineHeight: 1, color: marca.cores.primaria }}>
      {slide.valor}
    </div>
    <div style={{ marginTop: 48, fontFamily: marca.fonteTexto, fontSize: tamanho(slide.legenda, 50, 36, 90), lineHeight: 1.3, color: marca.cores.texto }}>
      {slide.legenda}
    </div>
    <Fonte marca={marca} fonte={slide.fonte} />
  </div>
);

const formatar = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const Grafico: React.FC<P<"grafico">> = ({ slide, marca }) => {
  const max = Math.max(...slide.pontos.map((p) => p.valor), 0) || 1;
  const altura = 560;
  const largura = LARGURA_SLIDE - MARGEM * 2;
  const passo = largura / Math.max(slide.pontos.length, 1);
  return (
    <>
      <Titulo marca={marca} texto={slide.titulo} base={64} />
      <div style={{ marginTop: 16, fontFamily: marca.fonteTexto, fontSize: 34, color: marca.cores.suave }}>em {slide.unidade}</div>
      <div style={{ position: "relative", height: altura, marginTop: 40 }}>
        {slide.pontos.map((p, i) => {
          const h = (Math.max(p.valor, 0) / max) * (altura - 130);
          return (
            <div key={i} style={{ position: "absolute", bottom: 60, left: i * passo + passo * 0.15, width: passo * 0.7 }}>
              <div style={{ textAlign: "center", fontFamily: marca.fonteTexto, fontSize: 28, fontWeight: 700, color: marca.cores.texto, marginBottom: 10 }}>
                {formatar(p.valor)}
              </div>
              <div style={{ height: h, borderRadius: "14px 14px 0 0", background: i === slide.pontos.length - 1 ? marca.cores.primaria : marca.cores.suave }} />
              <div style={{ position: "absolute", top: "100%", left: -20, right: -20, marginTop: 14, textAlign: "center", fontFamily: marca.fonteTexto, fontSize: 26, color: marca.cores.suave }}>
                {p.rotulo}
              </div>
            </div>
          );
        })}
      </div>
      <Fonte marca={marca} fonte={slide.fonte} />
    </>
  );
};

const Ranking: React.FC<P<"ranking">> = ({ slide, marca }) => (
  <>
    <Titulo marca={marca} texto={slide.titulo} base={68} />
    <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 20 }}>
      {slide.itens.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            background: marca.cores.superficie,
            borderRadius: 20,
            padding: "24px 32px",
            fontFamily: marca.fonteTexto,
            color: marca.cores.texto,
          }}
        >
          <span style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: 56, color: i === 0 ? marca.cores.primaria : marca.cores.suave, width: 60 }}>{i + 1}</span>
          <span style={{ flex: 1, fontSize: tamanho(item.nome, 42, 30, 22), fontWeight: 700 }}>{item.nome}</span>
          <span style={{ fontSize: 38, color: marca.cores.suave }}>{item.valor}</span>
        </div>
      ))}
    </div>
    <Fonte marca={marca} fonte={slide.fonte} />
  </>
);

const Fechamento: React.FC<P<"fechamento">> = ({ slide, marca }) => (
  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", color: "#FFFFFF" }}>
    <div style={{ fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: tamanho(slide.titulo, 72, 48, 40), lineHeight: 1.15 }}>{slide.titulo}</div>
    <div style={{ marginTop: 64, fontFamily: marca.fonteTitulo, fontWeight: 900, fontSize: 120 }}>{marca.nomeApp}</div>
    <div style={{ marginTop: 32, fontFamily: marca.fonteTexto, fontSize: tamanho(slide.cta, 46, 34, 70), lineHeight: 1.3 }}>{slide.cta}</div>
    <div style={{ marginTop: 56, fontFamily: marca.fonteTexto, fontSize: 36, opacity: 0.85 }}>Link na bio · {marca.arroba}</div>
  </div>
);

function Conteudo({ slide, marca }: { slide: TipoSlide; marca: Marca }) {
  switch (slide.tipo) {
    case "capa":
      return <Capa slide={slide} marca={marca} />;
    case "texto":
      return <Texto slide={slide} marca={marca} />;
    case "lista":
      return <Lista slide={slide} marca={marca} />;
    case "numero":
      return <Numero slide={slide} marca={marca} />;
    case "grafico":
      return <Grafico slide={slide} marca={marca} />;
    case "ranking":
      return <Ranking slide={slide} marca={marca} />;
    case "fechamento":
      return <Fechamento slide={slide} marca={marca} />;
  }
}

// ── Elemento da marca, parado, mas avançando slide a slide ─────────

const ElementoSlide: React.FC<{ marca: Marca; indice: number; total: number }> = ({ marca, indice, total }) => {
  const progresso = (indice + 1) / Math.max(total, 1);
  if (marca.elemento === "zebra") {
    const largura = 90;
    // O deslocamento muda a cada slide, então a zebra parece continuar quando a pessoa arrasta.
    const deslocamento = (indice * 60) % (largura * 2);
    return (
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 36, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: -largura * 2 + deslocamento,
            width: LARGURA_SLIDE + largura * 4,
            background: `repeating-linear-gradient(90deg, ${marca.cores.primaria} 0 ${largura}px, ${marca.cores.secundaria} ${largura}px ${largura * 2}px)`,
          }}
        />
      </div>
    );
  }
  if (marca.elemento === "pomodoro") {
    const raio = 30;
    const circ = 2 * Math.PI * raio;
    return (
      <svg width={80} height={80} style={{ position: "absolute", top: 46, right: 70 }}>
        <circle cx={40} cy={40} r={raio} fill="none" stroke={marca.cores.superficie} strokeWidth={9} />
        <circle
          cx={40}
          cy={40}
          r={raio}
          fill="none"
          stroke={marca.cores.primaria}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progresso)}
          transform="rotate(-90 40 40)"
        />
      </svg>
    );
  }
  const mourao = 135;
  return (
    <div style={{ position: "absolute", left: 0, bottom: 24, height: 70, width: LARGURA_SLIDE * progresso, overflow: "hidden" }}>
      {[18, 42].map((y) => (
        <div key={y} style={{ position: "absolute", left: 0, top: y, width: LARGURA_SLIDE, height: 6, background: marca.cores.secundaria }} />
      ))}
      {Array.from({ length: 9 }, (_, i) => i * mourao).map((x) => (
        <div key={x} style={{ position: "absolute", left: x + 20, top: 0, width: 14, height: 70, borderRadius: 4, background: marca.cores.primaria }} />
      ))}
    </div>
  );
};

export const Slide: React.FC<PropsSlide> = ({ marca, slide, indice, total }) => {
  const final = slide.tipo === "fechamento";
  const corRodape = final ? "rgba(255,255,255,0.85)" : marca.cores.suave;
  return (
    <AbsoluteFill style={{ width: LARGURA_SLIDE, height: ALTURA_SLIDE, background: final ? marca.cores.primaria : marca.cores.fundo }}>
      {/* Cabeçalho: nome do app e posição no carrossel */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: MARGEM,
          right: marca.elemento === "pomodoro" ? 180 : MARGEM,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: marca.fonteTexto,
          fontSize: 30,
          fontWeight: 700,
          color: corRodape,
        }}
      >
        <span>{marca.nomeApp}</span>
        <span>
          {indice + 1}/{total}
        </span>
      </div>

      <AbsoluteFill style={{ padding: `150px ${MARGEM}px 170px`, justifyContent: "center", display: "flex", flexDirection: "column" }}>
        <Conteudo slide={slide} marca={marca} />
      </AbsoluteFill>

      {/* Rodapé: @ da marca e convite para arrastar */}
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          right: MARGEM,
          bottom: marca.elemento === "pomodoro" ? 60 : 110,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: marca.fonteTexto,
          fontSize: 30,
          color: corRodape,
        }}
      >
        <span>{marca.arroba}</span>
        <span>{indice < total - 1 ? "arrasta →" : ""}</span>
      </div>

      {!final && <ElementoSlide marca={marca} indice={indice} total={total} />}
    </AbsoluteFill>
  );
};
