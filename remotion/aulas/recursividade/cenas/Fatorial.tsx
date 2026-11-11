import React from "react";
import { Elipse, Ret, Seta } from "../../../lousa/Esboco";
import { Codigo, colunaCodigo, linhaCodigo } from "../../../lousa/Codigo";
import { NaPagina } from "../../../lousa/Lousa";
import { claro, cor } from "../../../lousa/paleta";
import { Caixa, Capitulo, Etiqueta } from "../../../lousa/Pecas";
import { Texto } from "../../../lousa/Texto";
import { P } from "../paginas";
import { S, pausas } from "../roteiro";

const s = (t: number) => S("3582", t);

export const CODIGO_FATORIAL = ["def fatorial(n):", "    if n <= 1:", "        return 1", "    return n * fatorial(n - 1)"];

function PaginaFatorial() {
  // pilha de chamadas: desce até o caso-base, depois os resultados sobem
  const linhas = [
    { txt: "fatorial(4) = 4 × fatorial(3)", ret: "24", desce: 18.4, sobe: 31.0 },
    { txt: "fatorial(3) = 3 × fatorial(2)", ret: "6", desce: 21.4, sobe: 30.5 },
    { txt: "fatorial(2) = 2 × fatorial(1)", ret: "2", desce: 25.8, sobe: 30.0 },
    { txt: "fatorial(1) = 1", ret: "1", desce: 28.5, sobe: 29.4 },
  ];
  const y0 = 350;
  const passo = 150;
  return (
    <NaPagina p={P.fatorial}>
      <Capitulo n={1} titulo="fatorial" de={pausas[1].de + 0.3} />
      <Texto x={80} y={190} tam={70} de={s(8.9)} dur={0.6}>
        o fatorial
      </Texto>
      <Texto x={80} y={272} tam={46} de={s(10.6)} dur={1.0}>
        4! = 4 × 3 × 2 × 1 = 24
      </Texto>
      <Codigo x={1040} y={150} tam={32} arquivo="fatorial.py" linhas={[...CODIGO_FATORIAL, "", "print(fatorial(4))  # 24"]} de={s(13.3)} />
      {linhas.map((l, i) => {
        const y = y0 + i * passo;
        const base = i === linhas.length - 1;
        return (
          <React.Fragment key={i}>
            <Caixa x={150} y={y} w={680} h={96} texto={l.txt} tam={36} preench={base ? claro.verde : claro.azul} de={s(l.desce)} dur={0.45} />
            {i > 0 && <Seta desde={[300, y - passo + 100]} para={[300, y - 6]} cor={cor.azul} de={s(l.desce) - 0.15} dur={0.3} ponta={16} />}
            <Elipse cx={920} cy={y + 48} w={110} h={84} cor={cor.verde} preench={claro.verde} hachura="solid" de={s(l.sobe)} dur={0.3} />
            <Texto x={920} y={y + 62} tam={40} cor={cor.verde} ancora="middle" de={s(l.sobe) + 0.1}>
              {l.ret}
            </Texto>
            {i < linhas.length - 1 && <Seta desde={[920, y + passo + 4]} para={[920, y + 94]} cor={cor.verde} de={s(linhas[i + 1].sobe) + 0.2} dur={0.3} ponta={16} />}
          </React.Fragment>
        );
      })}
      {/* rótulos da descida e da subida */}
      <Seta desde={[95, 370]} para={[95, 880]} cor={cor.azul} espessura={5} de={s(36.5)} dur={0.5} />
      <Texto x={62} y={625} tam={32} cor={cor.azul} ancora="middle" girar={-90} de={s(36.6)} dur={0.5}>
        chamadas descem
      </Texto>
      <Seta desde={[1020, 880]} para={[1020, 370]} cor={cor.verde} espessura={5} de={s(38.1)} dur={0.5} />
      <Texto x={1058} y={625} tam={32} cor={cor.verde} ancora="middle" girar={90} de={s(38.2)} dur={0.5}>
        retornos sobem
      </Texto>
    </NaPagina>
  );
}

function PaginaConceitos() {
  const x = 110;
  const y = 210;
  const tam = 40;
  const base = { y0: linhaCodigo(y, tam, 1) - tam * 0.95, y1: linhaCodigo(y, tam, 2) + tam * 0.35 };
  const passoRec = { y0: linhaCodigo(y, tam, 3) - tam * 0.95, y1: linhaCodigo(y, tam, 3) + tam * 0.35 };
  const x0 = colunaCodigo(x, tam, 4) - 12;
  return (
    <NaPagina p={P.conceitos}>
      <Texto x={960} y={130} tam={62} ancora="middle" de={s(43.4)} dur={0.9}>
        {"*{caso-base} e passo recursivo"}
      </Texto>
      <Codigo x={x} y={y} tam={tam} arquivo="fatorial.py" linhas={CODIGO_FATORIAL} de={s(39.8)} ritmo={0.016} />
      <Ret x={x0} y={base.y0} w={colunaCodigo(x, tam, 16) - x0 + 14} h={base.y1 - base.y0} cor={cor.verde} espessura={3.5} de={s(43.8)} dur={0.45} />
      <Texto x={920} y={linhaCodigo(y, tam, 1) + 22} tam={44} cor={cor.verde} de={s(43.9)} dur={0.5}>
        caso-base
      </Texto>
      <Ret x={x0} y={passoRec.y0} w={colunaCodigo(x, tam, 30) - x0 + 14} h={passoRec.y1 - passoRec.y0} cor={cor.laranja} espessura={3.5} de={s(44.8)} dur={0.45} />
      <Texto x={920} y={linhaCodigo(y, tam, 3) + 8} tam={44} cor={cor.laranja} de={s(44.9)} dur={0.6}>
        passo recursivo
      </Texto>
      <Texto x={110} y={650} tam={38} destaque={cor.verde} de={s(46.4)} dur={1.2}>
        {"*{caso-base}: a condição que encerra a recursão"}
      </Texto>
      <Texto x={110} y={712} tam={38} destaque={cor.laranja} de={s(50.1)} dur={1.6}>
        {"*{passo recursivo}: a chamada que aproxima o problema do caso-base"}
      </Texto>
      {/* uma chamada por nível: cresce linear */}
      <Texto x={110} y={830} tam={38} de={s(57.8)} dur={0.9}>
        1 chamada recursiva por execução
      </Texto>
      <Texto x={110} y={900} tam={38} cor={cor.cinza} de={s(61.4)} dur={0.6}>
        n = 4: 4 chamadas
      </Texto>
      <Texto x={110} y={960} tam={38} cor={cor.cinza} de={s(62.9)} dur={0.6}>
        n = 100: 100 chamadas
      </Texto>
      <Etiqueta x={800} y={915} texto="O(n) · linear" tam={48} preench={claro.azul} de={s(66.1)} dur={0.45} />
      <Texto x={800} y={1010} tam={30} cor={cor.cinza} ancora="middle" de={s(68.4)} dur={0.6}>
        (a mesma notação da aula 1)
      </Texto>
    </NaPagina>
  );
}

export function Fatorial() {
  return (
    <>
      <PaginaFatorial />
      <PaginaConceitos />
    </>
  );
}
