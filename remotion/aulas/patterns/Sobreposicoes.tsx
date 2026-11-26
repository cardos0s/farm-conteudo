import React from "react";
import { AbsoluteFill } from "remotion";
import { ui } from "../../lousa/Janelas";
import { Texto } from "../../lousa/Texto";
import { Legendas, NotaTela } from "../comum/Legenda";
import { LEGENDA, TELA } from "./regioes";
import { FIM, LEGENDAS, PARTES } from "./roteiro";

// Por cima do canvas: o painel da legenda e as notas grandes (a pergunta do contexto e a frase final).

export function Sobreposicoes() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={TELA.w} height={TELA.h} viewBox={`0 0 ${TELA.w} ${TELA.h}`}>
        {/* "Mas como esses padrões se encaixam nessa nova realidade?" */}
        <NotaTela x={110} y={480} w={860} h={360} de={24.6} ate={28.8} girar={-1.6}>
          <Texto x={540} y={600} tam={58} ancora="middle" de={24.8} dur={0.7}>
            e como eles se encaixam
          </Texto>
          <Texto x={540} y={720} tam={80} cor={ui.rosa} ancora="middle" de={25.6} dur={0.8}>
            na era da IA?
          </Texto>
        </NotaTela>
        {/* "A era da IA não tornou os fundamentos obsoletos. Tornou a falta deles ainda mais evidente." */}
        <NotaTela x={80} y={420} w={920} h={520} de={146.2} girar={1.4}>
          <Texto x={540} y={540} tam={50} ancora="middle" de={146.4} dur={0.9}>
            a IA não tornou os
          </Texto>
          <Texto x={540} y={612} tam={50} ancora="middle" de={147.2} dur={0.8}>
            fundamentos obsoletos.
          </Texto>
          <Texto x={540} y={730} tam={58} ancora="middle" de={149.6} dur={0.8}>
            tornou a falta deles
          </Texto>
          <Texto x={540} y={850} tam={88} cor={ui.rosa} ancora="middle" de={150.6} dur={0.9}>
            mais evidente
          </Texto>
        </NotaTela>
        <Legendas painel={LEGENDA} partes={PARTES} frases={LEGENDAS} fim={FIM} />
      </svg>
    </AbsoluteFill>
  );
}
