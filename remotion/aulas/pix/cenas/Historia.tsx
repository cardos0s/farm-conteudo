import React from "react";
import { Seta } from "../../../lousa/Esboco";
import { ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { cor } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";
import { Bateria, Boneco, CelularEsboco } from "./desenhos";

// A história, desenhada à mão: o Pix a 2 segundos de expirar, o celular apaga,
// uma nova cobrança e o pagamento.

const APAGA = 10.1;

export function CenaHistoria() {
  return (
    <NaPagina p={R.historia}>
      <Texto x={60} y={96} tam={56} de={5.9} dur={0.6}>
        Black Friday · Paraguai
      </Texto>
      <Boneco x={115} y={430} s={1.4} braco="frente" de={6.0} />

      {/* Pix 1: a contagem chega em 00:02 e o celular apaga */}
      <CelularEsboco x={250} y={290} w={250} h={450} de={6.3} titulo="Pix 1" expira={4.8} apaga={APAGA} />
      <Bateria x={290} y={204} nivel={0.06} de={6.8} />
      <Texto x={398} y={236} tam={38} cor={cor.vermelho} de={7.0} dur={0.2} ate={APAGA}>
        1%
      </Texto>
      <Texto x={398} y={236} tam={38} cor={cor.vermelho} de={APAGA + 0.1} dur={0.2}>
        0%
      </Texto>
      <Texto x={375} y={820} tam={58} cor={cor.vermelho} ancora="middle" girar={-3} de={APAGA + 0.2} dur={0.5}>
        descarregou!
      </Texto>

      {/* Pix 2 */}
      <Seta desde={[515, 330]} para={[690, 330]} via={[602, 290]} cor={cor.cinza} de={13.0} dur={0.5} />
      <Texto x={602} y={268} tam={32} cor={cor.cinza} ancora="middle" de={13.1} dur={0.4}>
        liguei de novo
      </Texto>
      <CelularEsboco x={705} y={290} w={250} h={450} de={13.3} titulo="Pix 2" paga={{ de: 15.2, ok: 16.6 }} />

      <Texto x={540} y={975} tam={70} cor={ui.rosa} ancora="middle" de={17.4} dur={0.8}>
        1 compra, 2 Pix
      </Texto>
    </NaPagina>
  );
}
