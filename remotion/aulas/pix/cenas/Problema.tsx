import React from "react";
import { Xis } from "../../../lousa/Esboco";
import { Chip, Janela, SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { cor } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { EXPIRADA, PAGA, PENDENTE, Relogio, Status } from "../pecas";
import { R } from "../regioes";
import { TextoUI } from "./comum";

// O problema: duas tentativas no mesmo pedido, o pagamento não chega ao pedido e o cliente vira suporte.

const T1 = { x: 60, y: 400, w: 450, h: 220 };
const T2 = { x: 570, y: 400, w: 450, h: 220 };

function Tentativa({ n, txid, de, status }: { n: number; txid: string; de: number; status: React.ReactNode }) {
  const c = n === 1 ? T1 : T2;
  return (
    <Janela {...c} titulo={`tentativa ${n}`} status={n === 1 ? ui.vermelho : ui.verde} de={de}>
      <TextoUI x={30} y={60} tam={24} mono cor={ui.apagado} de={de + 0.2}>{`txid …${txid}`}</TextoUI>
      {status}
    </Janela>
  );
}

export function CenaProblema() {
  return (
    <NaPagina p={R.problema}>
      <Janela x={140} y={70} w={800} h={240} titulo="pedido #4821" status={ui.laranja} de={19.5}>
        <TextoUI x={36} y={62} tam={24} cor={ui.apagado} de={19.7}>status do pedido</TextoUI>
        <Status x={36} y={142} texto="aguardando pagamento" {...PENDENTE} tam={32} de={20.0} />
      </Janela>
      <Texto x={700} y={226} tam={86} cor={cor.vermelho} de={23.3} dur={0.4}>
        ?!
      </Texto>

      <Tentativa n={1} txid="a91f" de={20.4} status={<Status x={30} y={140} texto="expirada" {...EXPIRADA} tam={30} de={21.0} />} />
      <Tentativa n={2} txid="7c3e" de={21.2} status={<Status x={30} y={140} texto="paga" {...PAGA} tam={30} de={21.8} />} />
      <SetaTracejada desde={[T1.x + T1.w / 2, T1.y - 10]} para={[400, 322]} cor={ui.apagado} de={21.4} />
      <SetaTracejada
        desde={[T2.x + T2.w / 2, T2.y - 10]}
        para={[680, 322]}
        cor={ui.verde}
        de={22.0}
        carga={{ texto: "paga", de: 22.2, dur: 0.9, fundo: "#ebfbee", cor: ui.verde }}
      />
      <Xis x={700} y={352} s={36} de={23.1} />

      {/* o cliente vira suporte */}
      <Chip x={252} y={730} texto="funcionários" tam={28} de={24.9} />
      <Chip x={557} y={730} texto="extrato bancário" tam={28} de={25.4} />
      <Chip x={845} y={730} texto="documentos" tam={28} de={25.9} />
      <Relogio cx={330} cy={905} r={85} de={26.5} gira={[26.8, 29.2]} />
      <Texto x={450} y={935} tam={80} cor={cor.vermelho} de={27.1} dur={0.7}>
        ~30 min
      </Texto>
    </NaPagina>
  );
}
