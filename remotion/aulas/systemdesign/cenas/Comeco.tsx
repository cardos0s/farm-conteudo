import React from "react";
import { Caminho, Curva, Elipse, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { Chip, Nota, SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Capitulo } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { R, T } from "../roteiro";

// Abertura, o mapa, postar e o fecho.

export const rosa = cor.rosa;

/** Coração desenhado à mão, centrado em (cx, cy), com largura ~2·s. */
export function Coracao({ cx, cy, s = 60, de, preench = claro.vermelho }: { cx: number; cy: number; s?: number; de: number; preench?: string }) {
  const d = `M${cx} ${cy + s * 0.85} C${cx - s * 1.35} ${cy - s * 0.1} ${cx - s * 0.75} ${cy - s * 1.1} ${cx} ${cy - s * 0.45} C${cx + s * 0.75} ${cy - s * 1.1} ${cx + s * 1.35} ${cy - s * 0.1} ${cx} ${cy + s * 0.85} Z`;
  return <Caminho d={d} cor={cor.vermelho} preench={preench} hachura="hachure" espessura={3.5} de={de} dur={0.6} />;
}

export function CenaAbertura() {
  const t0 = T.abertura;
  const icones: { x: number; rotulo: string }[] = [
    { x: 160, rotulo: "curtida" },
    { x: 413, rotulo: "comentário" },
    { x: 666, rotulo: "repost" },
    { x: 920, rotulo: "story" },
  ];
  return (
    <NaPagina p={R.abertura}>
      <Texto x={540} y={400} tam={100} ancora="middle" de={t0 + 0.1} dur={0.6}>
        o que acontece
      </Texto>
      <Texto x={540} y={530} tam={100} cor={rosa} ancora="middle" de={t0 + 0.6} dur={0.6}>
        por trás do feed?
      </Texto>
      <Curva pts={[[180, 568], [540, 584], [900, 566]]} cor={rosa} espessura={5} aspereza={0.8} de={t0 + 1.2} dur={0.4} />

      {/* curtida */}
      <Coracao cx={icones[0].x} cy={800} s={58} de={t0 + 1.5} />
      {/* comentário */}
      <Caminho
        d={`M${icones[1].x - 70} 750 h140 a20 20 0 0 1 20 20 v62 a20 20 0 0 1 -20 20 h-80 l-36 30 v-30 h-24 a20 20 0 0 1 -20 -20 v-62 a20 20 0 0 1 20 -20 z`}
        cor={ui.azul}
        preench={claro.azul}
        espessura={3.5}
        de={t0 + 1.8}
        dur={0.6}
      />
      {/* repost */}
      <Seta desde={[icones[2].x - 64, 790]} via={[icones[2].x, 730]} para={[icones[2].x + 64, 790]} cor={ui.verde} espessura={4} de={t0 + 2.1} dur={0.5} />
      <Seta desde={[icones[2].x + 64, 830]} via={[icones[2].x, 890]} para={[icones[2].x - 64, 830]} cor={ui.verde} espessura={4} de={t0 + 2.3} dur={0.5} />
      {/* story */}
      <Elipse cx={icones[3].x} cy={805} w={130} h={130} cor={rosa} espessura={7} de={t0 + 2.5} dur={0.5} />
      <Elipse cx={icones[3].x} cy={805} w={96} h={96} cor={ui.violeta} preench={claro.violeta} hachura="solid" espessura={2} de={t0 + 2.8} dur={0.3} />
      {icones.map((i, k) => (
        <Texto key={i.rotulo} x={i.x} y={940} tam={38} ancora="middle" de={t0 + 1.7 + k * 0.3}>
          {i.rotulo}
        </Texto>
      ))}
      {/* reel */}
      <Ret x={450} y={1020} w={180} h={300} cor={cor.tinta} espessura={4} de={t0 + 3.0} dur={0.5} />
      <Caminho d="M515 1125 L590 1170 L515 1215 Z" cor={rosa} preench={claro.rosa} hachura="solid" espessura={3} de={t0 + 3.4} dur={0.3} />
      <Texto x={540} y={1380} tam={38} ancora="middle" de={t0 + 3.4}>
        reels
      </Texto>
      <Texto x={540} y={1520} tam={50} ancora="middle" cor={cor.cinza} de={t0 + 3.9} dur={0.6}>
        system design em 6 partes
      </Texto>
    </NaPagina>
  );
}

export function CenaMapa() {
  const t = (s: number) => T.mapa + s;
  const servicos = ["mídia", "posts", "social", "interações", "feed", "stories", "reels", "notificações"];
  const dados = ["arquivos", "relacional", "wide-\ncolumn", "cache", "vetores"];
  return (
    <NaPagina p={R.mapa}>
      <Capitulo n={1} titulo="o mapa" de={t(0)} />
      <Caixa x={390} y={150} w={300} h={120} texto="App" tam={54} preench={claro.violeta} cor={ui.violeta} de={t(0.3)} dur={0.5} />

      <Seta desde={[440, 272]} para={[240, 412]} de={t(1.0)} />
      <Texto x={230} y={330} tam={34} ancora="middle" cor={cor.cinza} de={t(1.1)}>
        fotos e vídeos
      </Texto>
      <Caixa x={60} y={420} w={350} h={130} texto={"CDN\ncópias perto de você"} tam={34} preench={claro.amarelo} de={t(1.3)} dur={0.5} />

      <Seta desde={[640, 272]} para={[840, 412]} de={t(2.0)} />
      <Texto x={860} y={330} tam={34} ancora="middle" cor={cor.cinza} de={t(2.1)}>
        o resto
      </Texto>
      <Caixa x={670} y={420} w={350} h={130} texto={"API\nlogin e limites"} tam={34} preench={claro.cinza} hachura="solid" de={t(2.3)} dur={0.5} />

      {/* serviços */}
      <Seta desde={[845, 552]} para={[845, 642]} de={t(3.0)} dur={0.4} />
      <Ret x={60} y={650} w={960} h={500} cor={cor.cinza} espessura={2.5} aspereza={1.4} de={t(3.1)} dur={0.6} />
      <Texto x={90} y={700} tam={34} cor={cor.cinza} de={t(3.3)}>
        serviços
      </Texto>
      {servicos.map((s, i) => (
        <Caixa
          key={s}
          x={i % 2 === 0 ? 100 : 560}
          y={724 + Math.floor(i / 2) * 104}
          w={420}
          h={90}
          texto={s}
          tam={38}
          preench={claro.azul}
          cor={ui.azul}
          espessura={2.8}
          de={t(3.5 + i * 0.16)}
          dur={0.35}
          atrasoTexto={0.15}
        />
      ))}

      {/* fila */}
      <Seta desde={[440, 1152]} para={[440, 1222]} cor={rosa} de={t(5.2)} dur={0.35} />
      <Texto x={420} y={1196} tam={30} ancora="end" cor={rosa} de={t(5.3)}>
        publicam
      </Texto>
      <Seta desde={[640, 1222]} para={[640, 1152]} cor={rosa} de={t(5.5)} dur={0.35} />
      <Texto x={660} y={1196} tam={30} cor={rosa} de={t(5.6)}>
        consomem
      </Texto>
      <Caixa x={60} y={1230} w={960} h={116} texto="fila de eventos" tam={50} corTexto={rosa} preench={claro.rosa} cor={rosa} espessura={4} de={t(4.9)} dur={0.5} />
      <Texto x={540} y={1396} tam={32} ancora="middle" cor={cor.cinza} de={t(5.8)}>
        post.criado · curtida · visualização
      </Texto>

      {/* dados */}
      <Texto x={60} y={1458} tam={32} cor={cor.cinza} de={t(6.4)}>
        dados
      </Texto>
      {dados.map((d, i) => (
        <Caixa
          key={d}
          x={60 + i * 194}
          y={1476}
          w={184}
          h={110}
          texto={d}
          tam={30}
          preench={claro.verde}
          cor={ui.verde}
          espessura={2.6}
          de={t(6.6 + i * 0.15)}
          dur={0.35}
          atrasoTexto={0.12}
        />
      ))}

      {/* uma curtida percorrendo o caminho */}
      <SetaTracejada
        desde={[980, 880]}
        via={[1070, 1060]}
        para={[930, 1226]}
        cor={rosa}
        de={t(8.0)}
        dur={0.6}
        fluxo={[t(8.6), t(12.5)]}
        carga={{ texto: "curtida", de: t(8.7), dur: 1.1, cor: rosa }}
      />
      <Chip x={850} y={1442} texto="ninguém espera ninguém" fundo="#fff0f6" cor={rosa} tam={24} de={t(9.6)} />
    </NaPagina>
  );
}

export function CenaPostar() {
  const t = (s: number) => T.postar + s;
  return (
    <NaPagina p={R.postar}>
      <Capitulo n={2} titulo="postar" de={t(0)} />
      <Caixa x={60} y={170} w={300} h={130} texto="App" tam={52} preench={claro.violeta} cor={ui.violeta} de={t(0.3)} dur={0.5} />
      <Caixa x={720} y={170} w={300} h={130} texto={"serviço\nde mídia"} tam={38} preench={claro.cinza} hachura="solid" de={t(0.8)} dur={0.5} />
      <Seta desde={[365, 212]} para={[715, 212]} de={t(1.3)} />
      <Texto x={540} y={196} tam={30} ancora="middle" de={t(1.5)}>
        1 · pede URL de upload
      </Texto>
      <Seta desde={[715, 262]} para={[365, 262]} de={t(2.2)} />
      <Texto x={540} y={312} tam={30} ancora="middle" de={t(2.4)}>
        2 · URL que vale 15 min
      </Texto>

      {/* 3: o arquivo vai direto */}
      <Caixa x={60} y={570} w={960} h={130} texto="armazenamento · arquivo original" tam={40} preench={claro.cinza} hachura="solid" de={t(3.0)} dur={0.5} />
      <Seta desde={[200, 304]} para={[200, 562]} cor={rosa} espessura={7} ponta={30} de={t(3.4)} dur={0.6} />
      <Texto x={240} y={420} tam={38} cor={rosa} de={t(3.8)}>
        {"3 · o arquivo vai direto,\nsem passar pela API"}
      </Texto>
      <SetaTracejada desde={[870, 304]} para={[870, 562]} cor={cor.cinza} de={t(4.4)} dur={0.5} />
      <Xis x={870} y={433} s={70} cor={cor.vermelho} espessura={6} de={t(4.9)} dur={0.3} />

      {/* 4: conversão */}
      <Seta desde={[540, 702]} para={[540, 802]} de={t(5.5)} dur={0.4} />
      <Texto x={570} y={762} tam={30} de={t(5.6)}>
        4 · "arquivo novo!"
      </Texto>
      <Caixa x={60} y={810} w={960} h={190} texto="" preench={claro.laranja} cor={ui.laranja} de={t(5.8)} dur={0.5} />
      <Texto x={540} y={872} tam={42} ancora="middle" de={t(6.0)}>
        workers de conversão
      </Texto>
      <Chip x={220} y={950} texto="miniatura" tam={26} de={t(6.4)} />
      <Chip x={480} y={950} texto="3 tamanhos" tam={26} de={t(6.6)} />
      <Chip x={800} y={950} texto="vídeo em pedaços (HLS)" tam={26} de={t(6.8)} />

      {/* 5, 6, 7 */}
      <Seta desde={[280, 1002]} para={[280, 1102]} de={t(7.4)} dur={0.4} />
      <Texto x={300} y={1064} tam={28} de={t(7.5)}>
        5 · versões prontas
      </Texto>
      <Caixa x={60} y={1110} w={440} h={130} texto={"CDN\npronto para tocar"} tam={36} preench={claro.amarelo} de={t(7.7)} dur={0.5} />
      <Seta desde={[800, 1002]} para={[800, 1102]} de={t(8.2)} dur={0.4} />
      <Texto x={820} y={1064} tam={28} de={t(8.3)}>
        6 · status
      </Texto>
      <Caixa x={580} y={1110} w={440} h={130} texto={"posts\npublicado ✓"} tam={38} preench={claro.verde} cor={ui.verde} de={t(8.5)} dur={0.5} />
      <Seta desde={[800, 1242]} para={[800, 1342]} cor={rosa} de={t(9.1)} dur={0.4} />
      <Texto x={820} y={1304} tam={28} cor={rosa} de={t(9.2)}>
        7
      </Texto>
      <Caixa x={580} y={1350} w={440} h={120} texto="fila: post.criado" tam={38} corTexto={rosa} preench={claro.rosa} cor={rosa} espessura={4} de={t(9.3)} dur={0.5} />
      <Nota x={60} y={1330} w={460} h={250} texto={"foto e reel:\nmesmo caminho\n(o reel só gera\nmais versões)"} tam={34} de={t(9.4)} />
    </NaPagina>
  );
}

export function CenaFim() {
  const t = (s: number) => T.fim + s;
  return (
    <NaPagina p={R.fim}>
      <Texto x={540} y={620} tam={84} ancora="middle" de={t(0.6)} dur={0.7}>
        é isso que roda
      </Texto>
      <Texto x={540} y={730} tam={84} ancora="middle" cor={rosa} de={t(1.2)} dur={0.7}>
        quando você curte
      </Texto>
      <Coracao cx={540} cy={960} s={90} de={t(1.9)} />
      <Texto x={540} y={1200} tam={44} ancora="middle" cor={cor.cinza} de={t(2.6)}>
        Flagra · app de demonstração
      </Texto>
    </NaPagina>
  );
}
