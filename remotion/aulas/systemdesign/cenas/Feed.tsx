import React from "react";
import { Linha, Seta } from "../../../lousa/Esboco";
import { Nota, SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Capitulo, Marca } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { R, T } from "../roteiro";
import { Coracao, rosa } from "./Comeco";

// Montar o feed (push × pull, híbrido, nota) e o caminho de uma curtida.

export function CenaFeed() {
  const t = (s: number) => T.feed + s;
  const timelines = ["timeline do rafa", "+ 48 mil timelines", "sua timeline"];
  const contas = ["posts da duda", "posts do rafa", "+ 200 contas"];
  return (
    <NaPagina p={R.feed}>
      <Capitulo n={3} titulo="montar o feed" de={t(0)} />

      {/* push */}
      <Texto x={60} y={200} tam={46} cor={ui.azul} de={t(0.3)} dur={0.6}>
        push: o trabalho é na hora de postar
      </Texto>
      <Caixa x={60} y={290} w={260} h={110} texto="duda posta" tam={36} preench={claro.violeta} cor={ui.violeta} de={t(0.7)} dur={0.4} />
      <Seta desde={[322, 345]} para={[392, 345]} de={t(1.1)} dur={0.35} />
      <Caixa x={400} y={290} w={230} h={110} texto="fan-out" tam={38} preench={claro.cinza} hachura="solid" de={t(1.2)} dur={0.4} />
      {timelines.map((s, i) => (
        <Caixa
          key={s}
          x={720}
          y={250 + i * 112}
          w={300}
          h={92}
          texto={s}
          tam={30}
          preench={i === 2 ? claro.rosa : claro.azul}
          cor={i === 2 ? rosa : ui.azul}
          espessura={i === 2 ? 4 : 2.8}
          de={t(1.6 + i * 0.2)}
          dur={0.35}
        />
      ))}
      {[296, 408, 520].map((y, i) => (
        <SetaTracejada key={y} desde={[632, 345]} para={[714, y]} cor={rosa} de={t(2.2 + i * 0.12)} dur={0.4} carga={{ texto: "id", de: t(2.7 + i * 0.15), dur: 0.6, cor: rosa }} />
      ))}
      <Caixa x={720} y={640} w={300} h={90} texto="você abre o app" tam={30} espessura={3.6} de={t(3.4)} dur={0.4} />
      <Seta desde={[870, 636]} para={[870, 572]} cor={ui.verde} de={t(3.7)} dur={0.3} ponta={18} />
      <Texto x={700} y={698} tam={32} ancora="end" cor={ui.verde} de={t(3.8)}>
        1 consulta
      </Texto>
      <Texto x={60} y={800} tam={34} de={t(4.2)}>
        {"postar: *{48 mil gravações} · abrir: 1 consulta"}
      </Texto>

      <Linha pts={[[60, 850], [1020, 850]]} cor={cor.cinza} espessura={2} de={t(4.8)} dur={0.4} />

      {/* pull */}
      <Texto x={60} y={940} tam={46} cor={ui.laranja} de={t(5.1)} dur={0.6}>
        pull: o trabalho é na hora de abrir
      </Texto>
      {contas.map((s, i) => (
        <Caixa key={s} x={60} y={990 + i * 112} w={300} h={92} texto={s} tam={30} preench={claro.violeta} cor={ui.violeta} de={t(5.5 + i * 0.2)} dur={0.35} />
      ))}
      <Caixa x={540} y={1080} w={260} h={120} texto={"junta e\nordena"} tam={36} preench={claro.laranja} cor={ui.laranja} espessura={4} de={t(6.2)} dur={0.4} />
      {[1036, 1148, 1260].map((y, i) => (
        <SetaTracejada key={y} desde={[364, y]} para={[534, 1140]} cor={ui.laranja} de={t(6.6 + i * 0.12)} dur={0.4} carga={{ texto: "posts", de: t(7.1 + i * 0.15), dur: 0.6, cor: ui.laranja }} />
      ))}
      <Caixa x={860} y={1080} w={160} h={120} texto={"você\nabre"} tam={32} espessura={3.6} de={t(7.4)} dur={0.4} />
      <Seta desde={[802, 1140]} para={[854, 1140]} de={t(7.7)} dur={0.3} ponta={16} />
      <Texto x={670} y={1252} tam={32} ancora="middle" cor={cor.vermelho} de={t(7.9)}>
        200 consultas
      </Texto>
      <Texto x={60} y={1380} tam={34} de={t(8.3)}>
        {"postar: 1 gravação · abrir: *{200 consultas}"}
      </Texto>

      {/* híbrido e nota */}
      <Nota x={60} y={1410} w={960} h={130} texto={"híbrido: contas com milhões de seguidores\nentram só na hora de abrir"} tam={34} de={t(9.2)} girar={-0.8} />
      <Marca x={70} y={1556} w={940} h={56} de={t(11.0)} dur={0.6} />
      <Texto x={540} y={1596} tam={34} ancora="middle" de={t(10.6)} dur={1.0}>
        nota = afinidade × interesse × engajamento × frescor
      </Texto>
    </NaPagina>
  );
}

export function CenaCurtida() {
  const t = (s: number) => T.curtida + s;
  const consumidores: { x: number; texto: string; saida: string }[] = [
    { x: 60, texto: "contador\nsoma a cada 1 s", saida: "28.430 → 28.431" },
    { x: 390, texto: "notificações\n\"e outras 20\"", saida: "push no celular" },
    { x: 720, texto: "ranking\natualiza sinais", saida: "próximo feed" },
  ];
  return (
    <NaPagina p={R.curtida}>
      <Capitulo n={4} titulo="uma curtida" de={t(0)} />
      <Coracao cx={200} cy={250} s={70} de={t(0.3)} />
      <Texto x={200} y={380} tam={36} ancora="middle" de={t(0.7)}>
        toque duplo
      </Texto>
      <Seta desde={[300, 250]} para={[420, 250]} de={t(1.0)} dur={0.4} />
      <Caixa x={430} y={190} w={330} h={120} texto="interações" tam={42} preench={claro.azul} cor={ui.azul} de={t(1.2)} dur={0.45} />

      {/* 1: grava uma linha */}
      <Seta desde={[700, 312]} para={[790, 452]} de={t(2.2)} dur={0.4} />
      <Texto x={780} y={372} tam={30} de={t(2.4)}>
        1 · grava
      </Texto>
      <Caixa x={600} y={460} w={420} h={130} texto={"curtidas\n(post, você) é única"} tam={32} preench={claro.verde} cor={ui.verde} de={t(2.6)} dur={0.45} />

      {/* 2: publica */}
      <Seta desde={[520, 312]} para={[320, 722]} cor={rosa} de={t(3.6)} dur={0.5} />
      <Texto x={220} y={540} tam={30} cor={rosa} de={t(3.9)}>
        2 · publica
      </Texto>
      <Caixa x={60} y={730} w={960} h={116} texto="fila: evento curtida" tam={44} corTexto={rosa} preench={claro.rosa} cor={rosa} espessura={4} de={t(4.2)} dur={0.45} />

      {/* consumidores */}
      {consumidores.map((c, i) => (
        <React.Fragment key={c.x}>
          <SetaTracejada desde={[c.x + 150, 850]} para={[c.x + 150, 942]} cor={rosa} de={t(5.0 + i * 0.15)} dur={0.35} carga={{ texto: "curtida", de: t(5.4 + i * 0.2), dur: 0.6, cor: rosa }} />
          <Caixa x={c.x} y={950} w={300} h={150} texto={c.texto} tam={32} preench={claro.amarelo} de={t(5.6 + i * 0.25)} dur={0.4} />
          <Texto x={c.x + 150} y={1160} tam={32} ancora="middle" cor={i === 0 ? ui.verde : cor.tinta} de={t(6.8 + i * 0.25)}>
            {c.saida}
          </Texto>
        </React.Fragment>
      ))}

      {/* o jeito ingênuo */}
      <Texto x={60} y={1300} tam={36} cor={cor.cinza} de={t(8.0)}>
        o jeito ingênuo:
      </Texto>
      <Texto x={60} y={1390} tam={54} de={t(8.4)} dur={0.6}>
        likes = likes + 1
      </Texto>
      <Linha pts={[[48, 1372], [470, 1366]]} cor={cor.vermelho} espessura={6} de={t(9.4)} dur={0.35} />
      <Texto x={60} y={1480} tam={36} cor={cor.vermelho} de={t(9.8)} dur={0.9}>
        {"milhares de toques por segundo na\nmesma linha do banco: tudo trava"}
      </Texto>
    </NaPagina>
  );
}
