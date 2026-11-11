import React from "react";
import { Curva, Elipse } from "../../../lousa/Esboco";
import { FONTE_UI, Janela, Chip, Nota, Terminal, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { cor, tinta } from "../../../lousa/paleta";
import { progresso, useT } from "../../../lousa/tempo";
import { Texto } from "../../../lousa/Texto";
import { R } from "../regioes";
import { s } from "../roteiro";

/** Texto de interface que aparece digitado (balões do chat). */
function Digitado({ x, y, linhas, de, ritmo = 0.022, tam = 27, corTexto = ui.texto, ancora = "start" }: { x: number; y: number; linhas: string[]; de: number; ritmo?: number; tam?: number; corTexto?: string; ancora?: "start" | "end" }) {
  const t = useT();
  if (t < de) return null;
  let resta = Math.floor((t - de) / ritmo) + 1;
  return (
    <>
      {linhas.map((l, i) => {
        const n = Math.max(0, Math.min(l.length, resta));
        resta -= l.length;
        if (n <= 0) return null;
        return (
          <text key={i} x={x} y={y + i * tam * 1.4} textAnchor={ancora} fontFamily={FONTE_UI} fontSize={tam} fill={corTexto} style={{ whiteSpace: "pre" }}>
            {l.slice(0, n)}
          </text>
        );
      })}
    </>
  );
}

/** Balão de conversa que cresce a partir do canto. */
function Balao({ x, y, w, h, fundo, de, origem }: { x: number; y: number; w: number; h: number; fundo: string; de: number; origem: "esq" | "dir" }) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.25);
  const ox = origem === "dir" ? x + w : x;
  return <rect x={x} y={y} width={w} height={h} rx={22} fill={fundo} opacity={p} transform={`translate(${ox} ${y}) scale(${0.85 + 0.15 * p}) translate(${-ox} ${-y})`} />;
}

export function CenaChat() {
  const pergunta = "como eu crio um app de tarefas?";
  const resposta = ["Você pode começar pelas telas,", "depois o banco de dados", "e por último o login."];
  return (
    <NaPagina p={R.chat}>
      <Texto x={64} y={96} tam={58} de={s(5.9)} dur={0.6}>
        IA de chat
      </Texto>
      <Janela x={60} y={140} w={960} h={470} titulo="chat" de={s(6.0)}>
        <Digitado x={934} y={36} linhas={["você"]} de={s(7.46)} tam={18} corTexto={ui.apagado} ancora="end" ritmo={0.001} />
        <Balao x={934 - 520} y={48} w={520} h={66} fundo="#e7f5ff" de={s(7.46)} origem="dir" />
        <Digitado x={934 - 26} y={92} linhas={[pergunta]} de={s(7.5)} ritmo={0.018} ancora="end" />
        <Digitado x={26} y={158} linhas={["IA"]} de={s(8.42)} tam={18} corTexto={ui.apagado} ritmo={0.001} />
        <Balao x={26} y={170} w={560} h={150} fundo="#f1f3f5" de={s(8.42)} origem="esq" />
        <Digitado x={52} y={214} linhas={resposta} de={s(8.46)} ritmo={0.009} tam={26} />
      </Janela>
      <Texto x={540} y={720} tam={50} cor={cor.cinza} ancora="middle" de={s(8.9)} dur={0.7}>
        pergunta → resposta
      </Texto>
      <Curva pts={[[70, 890], [120, 860], [170, 892], [220, 860], [270, 892], [320, 862]]} cor="#ae3ec9" espessura={5} aspereza={0.5} de={s(6.6)} dur={0.6} />
    </NaPagina>
  );
}

/** Carinha desenhada à mão. */
function Carinha({ cx, cy, de }: { cx: number; cy: number; de: number }) {
  return (
    <>
      <Elipse cx={cx} cy={cy} w={74} h={70} espessura={3} de={de} dur={0.4} />
      <Elipse cx={cx - 13} cy={cy - 9} w={7} h={9} preench={tinta} hachura="solid" espessura={2} de={de + 0.35} dur={0.1} />
      <Elipse cx={cx + 13} cy={cy - 9} w={7} h={9} preench={tinta} hachura="solid" espessura={2} de={de + 0.4} dur={0.1} />
      <Curva pts={[[cx - 18, cy + 9], [cx, cy + 22], [cx + 18, cy + 9]]} espessura={3} de={de + 0.45} dur={0.25} />
    </>
  );
}

export function CenaAgente() {
  const v = ui.violeta;
  const ok = ui.verde;
  const fer = ui.azul;
  return (
    <NaPagina p={R.agente}>
      <Texto x={64} y={96} tam={62} cor={ui.rosa} de={s(10.5)} dur={0.7}>
        agente de IA
      </Texto>
      <Carinha cx={960} cy={70} de={s(11.0)} />
      <Terminal
        x={60}
        y={140}
        w={960}
        h={440}
        titulo="agente"
        status={ui.verde}
        de={s(10.7)}
        ativo={[[s(11.6), s(18.6)]]}
        corAtivo={ui.verde}
        tam={27}
        entre={1.55}
        topo={50}
        linhas={[
          { de: s(11.6), partes: [["❯ ", v], ["objetivo: publicar o app de tarefas"]] },
          { de: s(13.12), partes: [["⏺ ", ok], ["Read", fer], ["(src/app.ts)"]] },
          { de: s(14.4), partes: [["⏺ ", ok], ["WebSearch", fer], ['("como publicar")']] },
          { de: s(15.85), partes: [["⏺ ", ok], ["Bash", fer], ["(npm run build)"]] },
          { de: s(16.45), partes: [["⏺ ", ok], ["Bash", fer], ["(npm run deploy)"]] },
          { de: s(17.07), partes: [["✓ objetivo atingido: app no ar", ok]] },
        ]}
      />
      <Chip x={275} y={642} texto="ferramentas" fundo="#d0ebff" cor={ui.azul} de={s(13.12)} />
      <Chip x={485} y={642} texto="informações" fundo="#c5f6fa" cor="#0c8599" de={s(14.4)} />
      <Chip x={666} y={642} texto="tarefas" fundo="#ffe8cc" cor={ui.laranja} de={s(15.85)} />
      <Chip x={826} y={642} texto="objetivo" fundo="#d3f9d8" cor={ui.verde} de={s(17.07)} />
      <Nota x={150} y={706} w={780} h={220} texto={"agente =\nIA + *{ferramentas} + *{objetivo}"} tam={46} de={s(18.89)} durTexto={1.1} />
    </NaPagina>
  );
}
