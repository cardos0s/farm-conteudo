import React from "react";
import { Check, Seta, Xis } from "../../../lousa/Esboco";
import { ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { cor } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { CelularPix } from "../pecas";
import { R } from "../regioes";

// A história: o Pix a 2 segundos de expirar, o celular apaga, uma nova cobrança e o pagamento.

const W = 300;
const Y = 170;
const X1 = 110;
const X2 = 670;
const APAGA = 10.1;

export function CenaHistoria() {
  return (
    <NaPagina p={R.historia}>
      <Texto x={60} y={96} tam={56} de={5.9} dur={0.6}>
        Black Friday · Paraguai
      </Texto>
      {/* faltando 2 s para expirar (o contador chega em 00:02 quando o celular apaga) */}
      <CelularPix x={X1} y={Y} w={W} de={6.2} cobranca={1} valor="R$ 389,90" expiraEm={APAGA - 6.2 + 1.6} bateria={1} apaga={APAGA} />
      <Texto x={X1 + W / 2} y={850} tam={46} ancora="middle" de={6.6} dur={0.5}>
        cobrança 1
      </Texto>
      <Texto x={X1 + W + 30} y={300} tam={40} cor={cor.vermelho} de={10.4} dur={0.6} girar={-4}>
        {"0%"}
      </Texto>
      <Xis x={X1 + W / 2} y={905} s={34} de={11.2} />

      <Seta desde={[X1 + W + 24, 520]} para={[X2 - 24, 520]} via={[(X1 + W + X2) / 2, 490]} cor={cor.cinza} de={13.0} dur={0.6} />
      <Texto x={(X1 + W + X2) / 2} y={590} tam={34} cor={cor.cinza} ancora="middle" de={13.2} dur={0.5}>
        de novo
      </Texto>
      <CelularPix x={X2} y={Y} w={W} de={13.3} cobranca={2} valor="R$ 389,90" expiraEm={900} bateria={4} paga={{ de: 15.2, ok: 16.6 }} />
      <Texto x={X2 + W / 2} y={850} tam={46} ancora="middle" de={13.7} dur={0.5}>
        cobrança 2
      </Texto>
      <Check x={X2 + W / 2 - 18} y={912} s={38} de={16.8} />

      <Texto x={540} y={1010} tam={58} cor={ui.rosa} ancora="middle" de={17.4} dur={0.8}>
        1 pedido, 2 cobranças
      </Texto>
    </NaPagina>
  );
}
