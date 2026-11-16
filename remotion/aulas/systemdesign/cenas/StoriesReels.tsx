import React from "react";
import { Caminho, Elipse, Linha, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { Nota, SetaTracejada, ui } from "../../../lousa/Janelas";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor, tinta } from "../../../lousa/paleta";
import { Caixa, Capitulo } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { R, T } from "../roteiro";
import { rosa } from "./Comeco";

// Stories (a linha do tempo de 24 h) e Reels (o funil de recomendação).

const LINHA_X = 200;
const Y0 = 230;
const Y24 = 1380;
const yHora = (h: number) => Y0 + ((Y24 - Y0) * h) / 24;

export function CenaStories() {
  const t = (s: number) => T.stories + s;
  return (
    <NaPagina p={R.stories}>
      <Capitulo n={5} titulo="stories" de={t(0)} />

      {/* linha do tempo de 24 h */}
      <Ret x={LINHA_X - 12} y={Y0} w={24} h={Y24 - Y0} preench={claro.rosa} hachura="solid" cor={rosa} espessura={2.5} redondo de={t(0.4)} dur={1.0} />
      {[0, 6, 12, 18, 24].map((h, i) => (
        <React.Fragment key={h}>
          <Linha pts={[[LINHA_X - 34, yHora(h)], [LINHA_X - 16, yHora(h)]]} cor={cor.cinza} espessura={2.5} de={t(0.6 + i * 0.12)} dur={0.15} />
          <Texto x={LINHA_X - 46} y={yHora(h) + 12} tam={34} ancora="end" cor={cor.cinza} de={t(0.6 + i * 0.12)}>
            {`${h} h`}
          </Texto>
        </React.Fragment>
      ))}

      {/* posta */}
      <Elipse cx={LINHA_X} cy={yHora(0)} w={34} h={34} preench={rosa} hachura="solid" cor={rosa} de={t(1.2)} dur={0.2} />
      <Texto x={260} y={yHora(0) + 6} tam={46} de={t(1.3)}>
        posta
      </Texto>
      <Texto x={260} y={yHora(0) + 58} tam={32} cor={cor.cinza} de={t(1.6)}>
        expira_em = agora + 24 h
      </Texto>
      <Nota x={680} y={150} w={360} h={220} texto={"bandeja: quem\nvocê não viu vem\nprimeiro"} tam={32} de={t(8.4)} girar={1.5} />

      {/* você vê: o anel fica cinza */}
      <Elipse cx={LINHA_X} cy={yHora(3.6)} w={26} h={26} preench="#ffffff" hachura="solid" cor={rosa} espessura={3} de={t(2.2)} dur={0.2} />
      <Elipse cx={330} cy={yHora(3.6)} w={112} h={112} cor={rosa} espessura={8} de={t(2.3)} dur={0.5} />
      <Elipse cx={330} cy={yHora(3.6)} w={82} h={82} preench={claro.violeta} hachura="solid" cor={ui.violeta} espessura={2} de={t(2.6)} dur={0.25} />
      <Elipse cx={330} cy={yHora(3.6)} w={112} h={112} cor="#adb5bd" espessura={10} de={t(3.6)} dur={0.6} semente={11} />
      <Texto x={420} y={yHora(3.6) - 4} tam={46} de={t(2.5)}>
        você vê
      </Texto>
      <Texto x={420} y={yHora(3.6) + 46} tam={32} cor={cor.cinza} de={t(3.6)}>
        {"entra em vistos(você)\n→ anel cinza"}
      </Texto>

      {/* enquete */}
      <Elipse cx={LINHA_X} cy={yHora(7.2)} w={26} h={26} preench="#ffffff" hachura="solid" cor={rosa} espessura={3} de={t(4.6)} dur={0.2} />
      <Texto x={260} y={yHora(7.2) + 6} tam={46} de={t(4.7)}>
        vota na enquete
      </Texto>
      <Caixa x={260} y={yHora(7.2) + 40} w={380} h={64} texto="Key West · 45%" tam={30} preench={claro.amarelo} hachura="solid" de={t(5.1)} dur={0.3} atrasoTexto={0.1} />
      <Caixa x={260} y={yHora(7.2) + 116} w={380} h={64} texto="Miami · 55%" tam={30} preench={claro.cinza} hachura="solid" de={t(5.3)} dur={0.3} atrasoTexto={0.1} />
      <Texto x={680} y={yHora(7.2) + 100} tam={32} cor={cor.cinza} de={t(5.7)}>
        {"um voto por pessoa,\ntotal somado no cache"}
      </Texto>

      {/* expira */}
      <Elipse cx={LINHA_X} cy={yHora(24)} w={34} h={34} preench={tinta} hachura="solid" de={t(6.6)} dur={0.2} />
      <Texto x={260} y={yHora(24) + 6} tam={46} de={t(6.7)}>
        expira
      </Texto>
      <Texto x={260} y={yHora(24) + 56} tam={30} cor={cor.cinza} de={t(7.0)}>
        {"some da bandeja,\nlinha e arquivo apagados"}
      </Texto>
      <Ret x={830} y={yHora(24) - 150} w={150} h={250} cor={tinta} espessura={3.5} de={t(6.8)} dur={0.4} />
      <Xis x={905} y={yHora(24) - 25} s={110} cor={cor.vermelho} espessura={6} de={t(7.4)} dur={0.35} />
      <SetaTracejada desde={[LINHA_X, yHora(24) + 24]} via={[LINHA_X, 1560]} para={[520, 1560]} cor={cor.cinza} de={t(8.0)} dur={0.6} />
      <Texto x={540} y={1572} tam={34} de={t(8.5)}>
        Destaques (se salvar)
      </Texto>
    </NaPagina>
  );
}

export function CenaReels() {
  const t = (s: number) => T.reels + s;
  return (
    <NaPagina p={R.reels}>
      <Capitulo n={6} titulo="reels" de={t(0)} />
      <Texto x={540} y={190} tam={40} ancora="middle" cor={cor.cinza} de={t(0.2)}>
        recomendação, não seguidores
      </Texto>
      <Caixa x={90} y={240} w={900} h={170} texto={"acervo\nbilhões de vídeos"} tam={46} preench={claro.cinza} hachura="solid" de={t(0.6)} dur={0.5} />
      <Seta desde={[540, 412]} para={[540, 482]} de={t(1.5)} dur={0.35} />
      <Caixa x={170} y={490} w={740} h={160} texto={"candidatos · ~2 mil\nseguidos · parecidos · em alta"} tam={36} preench={claro.azul} cor={ui.azul} de={t(1.7)} dur={0.5} />
      <Seta desde={[540, 652]} para={[540, 722]} de={t(3.2)} dur={0.35} />
      <Caixa x={270} y={730} w={540} h={160} texto={"ranking · ~500\nprevê tempo assistido"} tam={36} corTexto={rosa} preench={claro.rosa} cor={rosa} espessura={4.5} de={t(3.4)} dur={0.5} />
      <Seta desde={[540, 892]} para={[540, 962]} de={t(5.0)} dur={0.35} />
      <Caixa x={350} y={970} w={380} h={150} texto={"re-ranking\n10 próximos"} tam={36} preench={claro.verde} cor={ui.verde} de={t(5.2)} dur={0.5} />
      <Texto x={330} y={1035} tam={28} ancora="end" cor={cor.cinza} de={t(5.8)}>
        {"nada de 3 do\nmesmo autor"}
      </Texto>
      <Seta desde={[540, 1122]} para={[540, 1192]} de={t(6.3)} dur={0.35} />
      <Ret x={460} y={1200} w={160} h={250} cor={tinta} espessura={4} de={t(6.5)} dur={0.45} />
      <Caminho d="M520 1290 L575 1325 L520 1360 Z" cor={rosa} preench={claro.rosa} hachura="solid" espessura={3} de={t(6.9)} dur={0.25} />

      {/* o tempo assistido volta como sinal */}
      <SetaTracejada
        desde={[622, 1325]}
        via={[1080, 1100]}
        para={[814, 815]}
        cor={rosa}
        espessura={5}
        de={t(7.4)}
        dur={0.8}
        fluxo={[t(8.2), T.geral]}
        carga={{ texto: "assistiu 6,2 s", de: t(8.3), dur: 1.4, cor: rosa }}
      />
      <Texto x={680} y={1430} tam={34} cor={rosa} de={t(8.0)}>
        {"tempo assistido\nvolta em segundos"}
      </Texto>
      <Nota x={60} y={1480} w={960} h={130} texto={"vídeo novo → grupo pequeno → se prende,\ngrupo maior → bomba"} tam={34} de={t(10.0)} girar={-0.8} />
    </NaPagina>
  );
}
