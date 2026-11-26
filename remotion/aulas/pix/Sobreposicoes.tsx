import React from "react";
import { AbsoluteFill } from "remotion";
import { ui } from "../../lousa/Janelas";
import { Texto } from "../../lousa/Texto";
import { Legendas, NotaTela } from "../comum/Legenda";
import { LEGENDA, TELA } from "./regioes";
import { FIM, LEGENDAS, PARTES } from "./roteiro";

// Por cima do canvas: o painel da legenda (a fala, frase a frase) e as notas grandes.

export function Sobreposicoes() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        {/* "O cliente virou parte do processo de suporte." */}
        <NotaTela x={110} y={500} w={860} h={330} de={29.3} ate={32.2} girar={-1.8}>
          <Texto x={540} y={620} tam={60} ancora="middle" de={29.45} dur={0.7}>
            o cliente virou
          </Texto>
          <Texto x={540} y={730} tam={72} cor={ui.rosa} ancora="middle" de={30.2} dur={0.8}>
            parte do suporte
          </Texto>
        </NotaTela>
        {/* "O gargalo deixa de ser tecnológico e vira operacional." */}
        <NotaTela x={130} y={470} w={820} h={360} de={78.2} ate={81.6} girar={1.6}>
          <Texto x={540} y={590} tam={58} ancora="middle" de={78.35} dur={0.6}>
            o gargalo vira
          </Texto>
          <Texto x={540} y={706} tam={80} cor={ui.rosa} ancora="middle" de={79.0} dur={0.8}>
            operacional
          </Texto>
        </NotaTela>
        <Legendas painel={LEGENDA} partes={PARTES} frases={LEGENDAS} fim={FIM} />
      </svg>
    </AbsoluteFill>
  );
}
