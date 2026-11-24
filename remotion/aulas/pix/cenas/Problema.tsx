import React from "react";
import { Check, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { cor } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { Relogio } from "../pecas";
import { R } from "../regioes";
import { Boneco, Documento, Duvida, Extrato } from "./desenhos";

// O problema, desenhado à mão: o sistema da loja vê uma transação duplicada, o pedido fica
// travado e o cliente vira parte do suporte (funcionários, extrato, documento, ~30 min).

export function CenaProblema() {
  return (
    <NaPagina p={R.problema}>
      <Texto x={60} y={96} tam={56} de={19.4} dur={0.6}>
        o sistema da loja
      </Texto>
      <Ret x={60} y={140} w={960} h={380} espessura={3.4} de={19.5} dur={0.6} />

      <Texto x={110} y={240} tam={46} de={19.9} dur={0.3}>
        Pix 1
      </Texto>
      <Texto x={290} y={240} tam={46} de={20.0} dur={0.4}>
        R$ 389,90
      </Texto>
      <Xis x={640} y={226} s={34} de={20.6} />
      <Texto x={680} y={240} tam={44} cor={cor.vermelho} de={20.6} dur={0.4}>
        não pago
      </Texto>

      <Texto x={110} y={330} tam={46} de={20.3} dur={0.3}>
        Pix 2
      </Texto>
      <Texto x={290} y={330} tam={46} de={20.4} dur={0.4}>
        R$ 389,90
      </Texto>
      <Check x={618} y={322} s={38} de={21.0} />
      <Texto x={680} y={330} tam={44} cor={cor.verde} de={21.0} dur={0.3}>
        pago
      </Texto>

      <Linha pts={[[100, 375], [980, 375]]} cor={cor.cinza} espessura={2.4} de={21.3} dur={0.3} />
      <Texto x={110} y={450} tam={46} de={21.5} dur={0.3}>
        pedido:
      </Texto>
      <Texto x={290} y={450} tam={46} cor={cor.laranja} de={21.8} dur={0.5}>
        aguardando…
      </Texto>

      <Seta desde={[880, 570]} para={[945, 300]} via={[975, 450]} cor={cor.vermelho} de={22.9} dur={0.5} />
      <Texto x={520} y={600} tam={56} cor={cor.vermelho} ancora="middle" girar={-2} de={23.0} dur={0.7}>
        transação duplicada?!
      </Texto>

      {/* o cliente vira suporte */}
      <Boneco x={130} y={745} s={0.9} braco="cima" de={24.9} />
      <Boneco x={290} y={745} s={0.9} braco="cima" de={25.1} />
      <Duvida x={210} y={672} de={25.4} />
      <Extrato x={420} y={700} de={25.5} />
      <Documento x={620} y={745} de={26.1} />
      <Relogio cx={925} cy={770} r={75} de={26.6} gira={[26.8, 29.2]} />
      <Texto x={925} y={912} tam={60} cor={cor.vermelho} ancora="middle" de={27.2} dur={0.6}>
        ~30 min
      </Texto>
    </NaPagina>
  );
}
