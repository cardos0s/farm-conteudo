import React from "react";
import { Seta } from "../../../lousa/Esboco";
import { ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";

// 4/4 · Contingência: cada falha previsível já tem um plano.

const LINHAS: [string, string][] = [
  ["webhook atrasa", "reconciliação"],
  ["conexão cai", "retentativa idempotente"],
  ["celular descarrega", "nova cobrança, mesmo pedido"],
  ["pagou duas vezes", "estorno automático"],
];
const TAM = 34;

export function CenaContingencia() {
  return (
    <NaPagina p={R.contingencia}>
      <Texto x={60} y={96} tam={60} cor={ui.rosa} de={64.5} dur={0.7}>
        o que vai falhar (e vai)
      </Texto>
      <Texto x={250} y={200} tam={38} cor={cor.cinza} ancora="middle" de={64.8} dur={0.3}>
        falha
      </Texto>
      <Texto x={790} y={200} tam={38} cor={cor.cinza} ancora="middle" de={64.8} dur={0.3}>
        plano
      </Texto>
      {LINHAS.map(([falha, plano], i) => {
        const y = 300 + i * 150;
        const de = 65.0 + i * 1.0;
        return (
          <React.Fragment key={falha}>
            <Etiqueta x={250} y={y} texto={falha} tam={TAM} preench={claro.vermelho} hachura="solid" de={de} />
            <Seta desde={[446, y]} para={[526, y]} de={de + 0.35} dur={0.35} />
            <Etiqueta x={790} y={y} texto={plano} tam={TAM} preench={claro.verde} hachura="solid" de={de + 0.6} />
          </React.Fragment>
        );
      })}
      <Texto x={540} y={960} tam={56} ancora="middle" destaque={ui.rosa} de={69.7} dur={0.8}>
        {"faz parte do *{projeto}"}
      </Texto>
    </NaPagina>
  );
}
