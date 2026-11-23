import React from "react";
import { Janela, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { Texto } from "../../../lousa/Texto";
import { progresso, useT } from "../../../lousa/tempo";
import { EXPIRADA, PAGA, Status } from "../pecas";
import { R } from "../regioes";
import { Digitado, TextoUI } from "./comum";

// 3/4 · Observabilidade: o painel do suporte acha o pedido e mostra cada cobrança e a linha do tempo.

const COL = [30, 230, 470, 800];
const EVENTOS: [string, string, string?][] = [
  ["14:02", "cobrança 1 criada"],
  ["14:04", "cobrança 1 expirou sem pagamento", ui.vermelho],
  ["14:05", "cobrança 2 criada e paga"],
  ["14:05", "webhook não recebido", ui.laranja],
  ["14:09", "reconciliado: pedido pago", ui.verde],
];

function Busca({ de }: { de: number }) {
  const t = useT();
  if (t < de) return null;
  const a = progresso(t, de, 0.25);
  return (
    <g opacity={a}>
      <rect x={30} y={28} width={920} height={72} rx={14} fill="#f4f4f1" stroke={ui.borda} strokeWidth={1.5} />
      <circle cx={70} cy={60} r={13} fill="none" stroke={ui.apagado} strokeWidth={3.5} />
      <line x1={80} y1={70} x2={90} y2={80} stroke={ui.apagado} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

export function CenaObservabilidade() {
  return (
    <NaPagina p={R.observabilidade}>
      <Janela x={40} y={70} w={1000} h={800} titulo="suporte · pedidos" status={ui.violeta} de={54.4}>
        <Busca de={54.6} />
        <Digitado x={110} y={74} texto="pedido 4821" de={54.9} ritmo={0.07} />
        {["cobrança", "txid", "status", "hora"].map((c, i) => (
          <TextoUI key={c} x={COL[i]} y={160} tam={22} negrito cor={ui.apagado} de={55.8}>
            {c}
          </TextoUI>
        ))}
        <line x1={30} y1={182} x2={970} y2={182} stroke={ui.linha} strokeWidth={1.5} />
        <TextoUI x={COL[0]} y={238} tam={28} de={56.0}>1</TextoUI>
        <TextoUI x={COL[1]} y={238} tam={26} mono de={56.0}>…a91f</TextoUI>
        <Status x={COL[2]} y={238} texto="expirada" {...EXPIRADA} tam={26} de={56.1} />
        <TextoUI x={COL[3]} y={238} tam={28} de={56.0}>14:02</TextoUI>
        <TextoUI x={COL[0]} y={306} tam={28} de={56.4}>2</TextoUI>
        <TextoUI x={COL[1]} y={306} tam={26} mono de={56.4}>…7c3e</TextoUI>
        <Status x={COL[2]} y={306} texto="paga" {...PAGA} tam={26} de={56.5} />
        <TextoUI x={COL[3]} y={306} tam={28} de={56.4}>14:05</TextoUI>
        <line x1={30} y1={345} x2={970} y2={345} stroke={ui.linha} strokeWidth={1.5} />
        <TextoUI x={30} y={408} tam={30} negrito de={57.1}>pedido #4821</TextoUI>
        <Status x={290} y={408} texto="pago" {...PAGA} tam={28} de={57.3} />
        <TextoUI x={30} y={482} tam={22} negrito cor={ui.apagado} de={57.7}>linha do tempo</TextoUI>
        {EVENTOS.map(([h, e, c], i) => (
          <React.Fragment key={i}>
            <TextoUI x={30} y={536 + i * 44} tam={24} mono cor={ui.apagado} de={57.9 + i * 0.35}>
              {h}
            </TextoUI>
            <TextoUI x={140} y={536 + i * 44} tam={24} mono cor={c ?? ui.texto} de={57.9 + i * 0.35}>
              {e}
            </TextoUI>
          </React.Fragment>
        ))}
      </Janela>
      <Texto x={540} y={975} tam={50} ancora="middle" destaque={ui.rosa} de={60.0} dur={0.9}>
        {"achou em *{segundos}, sem pedir extrato"}
      </Texto>
    </NaPagina>
  );
}
