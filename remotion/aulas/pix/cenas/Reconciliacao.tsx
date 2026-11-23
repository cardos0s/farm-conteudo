import React from "react";
import { Xis } from "../../../lousa/Esboco";
import { Janela, SetaTracejada, Terminal, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { cor } from "../../../lousa/paleta";
import { Texto } from "../../../lousa/Texto";
import { PAGA, PENDENTE, Status } from "../pecas";
import { R } from "../regioes";
import { TextoUI } from "./comum";

// 2/4 · Reconciliação: o webhook não chegou, então um job consulta o provedor e recupera o estado.

const SIS = { x: 50, y: 110, w: 400, h: 210 };
const PSP = { x: 630, y: 110, w: 400, h: 210 };
const TERM = { x: 50, y: 440, w: 980, h: 400 };
const v = ui.violeta;
const ok = ui.verde;

export function CenaReconciliacao() {
  return (
    <NaPagina p={R.reconciliacao}>
      <Janela {...SIS} titulo="seu sistema" status={ui.violeta} de={43.4}>
        <TextoUI x={30} y={62} tam={26} de={43.6}>tentativa 2</TextoUI>
        <Status x={30} y={130} texto="pendente" {...PENDENTE} tam={28} de={43.7} ate={50.4} />
        <Status x={30} y={130} texto="paga" {...PAGA} tam={28} de={50.5} />
      </Janela>
      <Janela {...PSP} titulo="provedor Pix" status={ui.verde} de={43.8}>
        <TextoUI x={30} y={62} tam={24} mono cor={ui.apagado} de={44.0}>txid …7c3e</TextoUI>
        <Status x={30} y={130} texto="CONCLUIDA" {...PAGA} tam={28} de={44.1} />
      </Janela>

      {/* o webhook se perde no caminho */}
      <SetaTracejada desde={[PSP.x - 8, 230]} para={[SIS.x + SIS.w + 8, 230]} via={[540, 190]} cor={ui.vermelho} de={44.4} dur={0.5} carga={{ texto: "webhook", de: 44.5, dur: 0.6, fundo: "#fff5f5", cor: ui.vermelho }} />
      <Xis x={540} y={212} s={46} de={45.2} />
      <Texto x={540} y={380} tam={36} cor={cor.vermelho} ancora="middle" de={45.4} dur={0.6}>
        o webhook não chegou
      </Texto>

      <Terminal
        {...TERM}
        titulo="reconciliador"
        status={v}
        de={46.2}
        tam={27}
        entre={1.6}
        topo={50}
        ativo={[[48.1, 51.4]]}
        linhas={[
          { de: 46.5, partes: [["❯ ", v], ["a cada 1 min: tentativas pendentes"]] },
          { de: 47.4, partes: [["  tentativa 2 · pendente há 4 min", ui.apagado]] },
          { de: 48.2, partes: [["→ ", ui.azul], ["GET /cob/7c3e…"]] },
          { de: 49.3, partes: [["← ", ok], ["status: CONCLUIDA", ok]] },
          { de: 50.3, partes: [["✓ ", ok], ["tentativa 2: paga"]] },
          { de: 51.0, partes: [["✓ ", ok], ["pedido #4821: pago", ok]] },
        ]}
      />
      <SetaTracejada desde={[790, TERM.y - 8]} para={[790, PSP.y + PSP.h + 10]} cor={ui.azul} de={48.1} dur={0.4} carga={{ texto: "consulta", de: 48.2, dur: 0.7, cor: ui.azul }} />
      <SetaTracejada desde={[930, PSP.y + PSP.h + 10]} para={[930, TERM.y - 8]} cor={ok} de={49.1} dur={0.4} carga={{ texto: "CONCLUIDA", de: 49.2, dur: 0.7, fundo: "#ebfbee", cor: ok }} />
      <SetaTracejada desde={[250, TERM.y - 8]} para={[250, SIS.y + SIS.h + 10]} cor={ok} de={50.1} dur={0.4} carga={{ texto: "paga", de: 50.15, dur: 0.5, fundo: "#ebfbee", cor: ok }} />

      <Texto x={540} y={960} tam={52} ancora="middle" destaque={ui.rosa} de={51.6} dur={0.8}>
        {"não espere: *{pergunte} ao provedor"}
      </Texto>
    </NaPagina>
  );
}
