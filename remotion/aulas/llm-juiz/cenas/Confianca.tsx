import React from "react";
import { Check, Ret, Seta, Xis } from "../../../lousa/Esboco";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Marca } from "../../../lousa/Pecas";
import { largura, Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { F, FIM_DE, W } from "../roteiro";
import { Balao, Boneco, Brilho, Lampada, Lupa, Robo } from "./desenhos";

// 02:17–03:13 · mesma confiança no acerto e no erro, alucinação e o colega da voz firme.

function Medidor({ x, y, de }: { x: number; y: number; de: number }) {
  return (
    <>
      <Texto x={x} y={y} tam={32} cor={cor.cinza} de={de}>
        confiança
      </Texto>
      <Ret x={x} y={y + 18} w={330} h={40} redondo={false} espessura={2.4} de={de + 0.1} dur={0.25} />
      <Ret x={x + 6} y={y + 24} w={318} h={28} redondo={false} preench={cor.laranja} cor={cor.laranja} espessura={1.5} de={de + 0.35} dur={0.6} />
    </>
  );
}

function Confianca() {
  return (
    <NaPagina p={P.confianca}>
      <Texto x={960} y={110} tam={54} ancora="middle" de={F("c1")} dur={1.0}>
        {"consequência *{importante}"}
      </Texto>
      <Robo x={960} y={660} s={190} de={F("c1") + 1.2} />

      <Balao x={130} y={220} texto={"O desconto foi\nde 10%."} tam={54} ponta={[850, 600]} de={F("c2")} />
      <Medidor x={150} y={475} de={W("c2", "confiança")} />
      <Balao x={1340} y={220} texto={"O desconto foi\nde 15%."} tam={54} ponta={[1070, 600]} de={F("c3") - 0.1} />
      <Medidor x={1360} y={475} de={F("c3") + 0.2} />

      <Check x={165} y={605} s={44} de={W("c5", "certa")} />
      <Texto x={230} y={620} tam={46} cor={cor.verde} de={W("c5", "certa")}>
        certa
      </Texto>
      <Xis x={1385} y={598} s={40} de={W("c5", "errada")} />
      <Texto x={1430} y={620} tam={46} cor={cor.vermelho} de={W("c5", "errada")}>
        errada
      </Texto>

      <Texto x={960} y={300} tam={130} cor={cor.laranja} ancora="middle" de={W("c6", "mesma")} dur={0.3}>
        =
      </Texto>
      <Texto x={960} y={370} tam={42} cor={cor.laranja} ancora="middle" de={W("c6", "mesma") + 0.2}>
        mesma cara
      </Texto>

      <Lampada x={1580} y={820} s={130} de={W("c7", "luz")} />
      <Texto x={1580} y={980} tam={34} ancora="middle" de={W("c7", "vermelha")}>
        {'luz de "não sei"'}
      </Texto>
      <Xis x={1580} y={845} s={170} espessura={7} de={W("c7", "não sabe")} dur={0.4} />
      <Texto x={1580} y={1035} tam={38} cor={cor.vermelho} ancora="middle" de={W("c7", "não sabe") + 0.3}>
        não existe
      </Texto>
    </NaPagina>
  );
}

function Alucinacao() {
  const tPalavra = W("h1", "alucinação");
  const wPalavra = largura("alucinação", 140);
  return (
    <NaPagina p={P.alucinacao}>
      <Texto x={960} y={150} tam={48} ancora="middle" de={F("h1")} dur={2.0}>
        {"quando o modelo inventa um dado com cara de verdadeiro:"}
      </Texto>
      <Marca x={960 - wPalavra / 2 - 30} y={230} w={wPalavra + 60} h={150} de={tPalavra + 0.4} dur={0.6} />
      <Texto x={960} y={345} tam={140} ancora="middle" de={tPalavra} dur={0.8}>
        alucinação
      </Texto>

      <Texto x={500} y={520} tam={46} cor={cor.laranja} de={F("h2")}>
        o perigo:
      </Texto>
      <Ret x={500} y={550} w={920} h={290} preench="#ffffff" hachura="solid" de={F("h2") + 0.3} dur={0.6} />
      <Texto x={550} y={650} tam={50} de={F("h2") + 0.7} dur={1.2}>
        {"Marina ofereceu 15% de desconto\nno plano anual, e o contrato foi fechado."}
      </Texto>
      <Brilho x={480} y={560} s={30} de={W("h2", "bem escrita")} />
      <Brilho x={1440} y={600} s={24} de={W("h2", "bem escrita") + 0.1} />
      <Brilho x={1410} y={840} s={30} de={W("h2", "bem escrita") + 0.2} />
      <Texto x={960} y={930} tam={52} cor={cor.verde} ancora="middle" de={W("h2", "bem escrita")}>
        bem escrito, organizado, convincente...
      </Texto>
      <Texto x={1210} y={822} tam={68} cor={cor.vermelho} ancora="middle" girar={-7} de={FIM_DE("h2") + 0.1} dur={0.4}>
        INVENTADO
      </Texto>
      <Texto x={960} y={1015} tam={40} cor={cor.cinza} ancora="middle" de={FIM_DE("h2") + 0.4}>
        (na conversa: 10% de desconto e nada fechado)
      </Texto>
    </NaPagina>
  );
}

function Colega() {
  return (
    <NaPagina p={P.colega}>
      <Texto x={420} y={120} tam={44} cor={cor.cinza} ancora="middle" de={F("k1")}>
        o colega da voz firme
      </Texto>
      <Boneco x={400} y={270} s={88} roupa={claro.azul} bracos="aponta" de={F("k1") + 0.2} />
      <Balao x={620} y={160} texto="Com certeza: é 10%!" tam={50} ponta={[480, 260]} de={F("k2") - 0.3} />
      <Check x={1230} y={215} s={46} de={W("k2", "sabe")} />
      <Texto x={1300} y={230} tam={46} cor={cor.verde} de={W("k2", "sabe")}>
        sabia
      </Texto>
      <Balao x={620} y={330} texto="Com certeza: é 15%!" tam={50} ponta={[480, 470]} de={F("k3") - 0.3} />
      <Xis x={1255} y={380} s={42} de={W("k3", "não sabe")} />
      <Texto x={1300} y={398} tam={46} cor={cor.vermelho} de={W("k3", "não sabe")}>
        não sabia
      </Texto>
      <Texto x={960} y={600} tam={50} cor={cor.laranja} ancora="middle" de={W("k4", "mesma")}>
        mesma voz, mesma confiança
      </Texto>

      <Caixa x={140} y={720} w={700} h={180} texto={"avaliar pela\ncara da resposta"} tam={50} preench={claro.vermelho} de={F("k5")} dur={0.6} />
      <Xis x={490} y={810} s={150} espessura={8} de={W("k5", "resposta") + 0.4} dur={0.4} />
      <Seta desde={[870, 810]} para={[1040, 810]} de={F("k6")} dur={0.4} />
      <Caixa x={1060} y={720} w={700} h={180} texto={"um jeito de\n*{CONFERIR}"} tam={54} preench={claro.verde} de={W("k6", "jeito")} dur={0.6} />
      <Lupa x={1790} y={700} s={80} de={W("k6", "conferir")} />
    </NaPagina>
  );
}

export function ConfiancaEAlucinacao() {
  return (
    <>
      <Confianca />
      <Alucinacao />
      <Colega />
    </>
  );
}
