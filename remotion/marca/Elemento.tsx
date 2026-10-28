import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Marca } from "../../src/core/roteiro";

// O elemento visual de cada marca, que se move durante o vídeo inteiro.

const Zebra: React.FC<{ marca: Marca }> = ({ marca }) => {
  const frame = useCurrentFrame();
  const largura = 90;
  const deslocamento = (frame * 6) % (largura * 2);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 44, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -largura * 2 + deslocamento,
          width: 1080 + largura * 4,
          background: `repeating-linear-gradient(90deg, ${marca.cores.primaria} 0 ${largura}px, ${marca.cores.secundaria} ${largura}px ${largura * 2}px)`,
        }}
      />
    </div>
  );
};

const Pomodoro: React.FC<{ marca: Marca }> = ({ marca }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const raio = 46;
  const circ = 2 * Math.PI * raio;
  const progresso = interpolate(frame, [0, durationInFrames - 1], [0, 1], { extrapolateRight: "clamp" });
  return (
    <svg width={120} height={120} style={{ position: "absolute", top: 70, right: 70 }}>
      <circle cx={60} cy={60} r={raio} fill="none" stroke={marca.cores.superficie} strokeWidth={12} />
      <circle
        cx={60}
        cy={60}
        r={raio}
        fill="none"
        stroke={marca.cores.primaria}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progresso)}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
};

const Cerca: React.FC<{ marca: Marca }> = ({ marca }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const largura = interpolate(frame, [0, Math.min(90, durationInFrames - 1)], [0, 1080], {
    extrapolateRight: "clamp",
  });
  const mourao = 135;
  const postes = Array.from({ length: 9 }, (_, i) => i * mourao);
  return (
    <div style={{ position: "absolute", left: 0, bottom: 40, height: 110, width: largura, overflow: "hidden" }}>
      {[30, 65].map((y) => (
        <div key={y} style={{ position: "absolute", left: 0, top: y, width: 1080, height: 8, background: marca.cores.secundaria }} />
      ))}
      {postes.map((x) => (
        <div
          key={x}
          style={{ position: "absolute", left: x + 20, top: 0, width: 18, height: 110, borderRadius: 4, background: marca.cores.primaria }}
        />
      ))}
    </div>
  );
};

export const ElementoMarca: React.FC<{ marca: Marca }> = ({ marca }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {marca.elemento === "zebra" && <Zebra marca={marca} />}
    {marca.elemento === "pomodoro" && <Pomodoro marca={marca} />}
    {marca.elemento === "cerca" && <Cerca marca={marca} />}
  </AbsoluteFill>
);
