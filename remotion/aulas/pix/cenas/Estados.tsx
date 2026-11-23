import React from "react";
import { Seta } from "../../../lousa/Esboco";
import { SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";

// 1/4 · Máquina de estados: a tentativa (cada cobrança) e o pedido têm estados separados,
// e o pedido só olha para o evento "alguma tentativa foi paga".

const TAM = 36;

export function CenaEstados() {
  return (
    <NaPagina p={R.estados}>
      <Texto x={60} y={92} tam={64} cor={ui.rosa} de={32.9} dur={0.7}>
        máquina de estados
      </Texto>

      {/* cada tentativa */}
      <Texto x={60} y={180} tam={40} cor={cor.cinza} de={33.3} dur={0.5}>
        cada tentativa (cobrança)
      </Texto>
      <Etiqueta x={150} y={330} texto="criada" tam={TAM} preench={claro.cinza} hachura="solid" de={33.6} />
      <Seta desde={[240, 330]} para={[312, 330]} de={34.0} dur={0.4} />
      <Etiqueta x={420} y={330} texto="pendente" tam={TAM} preench={claro.laranja} hachura="solid" de={34.2} />
      <Seta desde={[530, 312]} para={[716, 258]} cor={cor.verde} de={34.8} dur={0.45} />
      <Texto x={600} y={262} tam={28} cor={cor.verde} ancora="middle" de={35.0} dur={0.3} girar={-16}>
        pagou
      </Texto>
      <Etiqueta x={790} y={250} texto="paga" tam={TAM} preench={claro.verde} hachura="solid" de={35.0} />
      <Seta desde={[530, 350]} para={[680, 418]} cor={cor.vermelho} de={35.4} dur={0.45} />
      <Texto x={590} y={430} tam={28} cor={cor.vermelho} ancora="middle" de={35.6} dur={0.4} girar={24}>
        expirou
      </Texto>
      <Etiqueta x={790} y={420} texto="expirada" tam={TAM} preench={claro.vermelho} hachura="solid" de={35.6} />

      {/* o pedido */}
      <Texto x={60} y={600} tam={40} cor={cor.cinza} de={36.4} dur={0.5}>
        o pedido
      </Texto>
      <Etiqueta x={190} y={730} texto="aguardando" tam={TAM} preench={claro.laranja} hachura="solid" de={36.6} />
      <Seta desde={[322, 730]} para={[490, 730]} cor={cor.verde} de={37.0} dur={0.4} />
      <Etiqueta x={560} y={730} texto="pago" tam={TAM} preench={claro.verde} hachura="solid" de={37.2} />
      <Seta desde={[632, 730]} para={[770, 730]} de={37.5} dur={0.4} />
      <Etiqueta x={870} y={730} texto="enviado" tam={TAM} preench={claro.azul} hachura="solid" de={37.7} />

      {/* a ligação entre as duas máquinas */}
      <SetaTracejada
        desde={[860, 262]}
        para={[615, 698]}
        via={[1040, 480]}
        cor={ui.rosa}
        de={38.7}
        dur={0.7}
        carga={{ texto: "evento: tentativa paga", de: 38.9, dur: 1.2, fundo: "#fff0f6", cor: ui.rosa }}
      />
      <Texto x={540} y={890} tam={50} ancora="middle" destaque={ui.rosa} de={39.6} dur={0.9}>
        {"pedido pago = *{alguma} tentativa paga"}
      </Texto>
      <Texto x={540} y={975} tam={38} cor={cor.cinza} ancora="middle" de={40.9} dur={0.8}>
        uma cobrança expirada não trava o pedido
      </Texto>
    </NaPagina>
  );
}
