import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { FIM, FPS, INTRO, PARTES } from "./roteiro";

// Trilha e efeitos sonoros do Reel, gerados por scripts/aulas/sons_pix.py em public/aulas/pix/sons/.
// Os efeitos seguem os mesmos tempos das animações: os da intro em segundos do vídeo e os do
// canvas em segundos do canvas (c(t) soma a duração da intro).

type Som =
  | "whoosh"
  | "whoosh_curto"
  | "whoosh_descendo"
  | "impacto"
  | "boom"
  | "brilho"
  | "luz"
  | "subida"
  | "pop"
  | "pop_agudo"
  | "pop_grave"
  | "teclas"
  | "teclas_longo"
  | "bipe"
  | "desliga"
  | "pago"
  | "pago_suave"
  | "erro"
  | "tique_taque"
  | "nota"
  | "risco0"
  | "risco1"
  | "risco2"
  | "risco3";

/** [segundo do vídeo, som, volume] */
type Deixa = [number, Som, number];

const c = (t: number) => INTRO + t;
const risco = (t: number, i: number, v = 0.22): Deixa => [c(t), `risco${i % 4}` as Som, v];

const DEIXAS: Deixa[] = [
  // ---- intro (vlog)
  [0.25, "whoosh", 0.3], // a faixa abre no meio
  [1.65, "whoosh_curto", 0.3], // toma a tela
  [2.72, "whoosh_curto", 0.35], // faixas deslizam
  [2.85, "whoosh", 0.25],
  [3.2, "impacto", 0.75], // BLACK
  [3.65, "brilho", 0.45], // friday
  [4.85, "luz", 0.6], // vazamento de luz
  [5.45, "impacto", 0.55], // E ISSO
  [5.95, "brilho", 0.35], // aconteceu…
  [7.55, "whoosh_descendo", 0.4], // entra no canvas

  // ---- abertura no canvas
  risco(0.1, 0),
  risco(0.55, 1),
  risco(1.2, 2, 0.15),
  [c(2.0), "pop", 0.45], // janela do pedido
  [c(2.6), "pop_grave", 0.3],
  [c(3.2), "pop", 0.3],
  [c(3.9), "erro", 0.25], // "???"

  // ---- a história
  risco(5.9, 3),
  risco(6.0, 0, 0.18), // boneco
  risco(6.3, 1), // celular 1
  [c(7.7), "bipe", 0.22], // contagem
  [c(8.7), "bipe", 0.24],
  [c(9.7), "bipe", 0.28],
  [c(10.1), "desliga", 0.6], // apagou
  [c(13.0), "whoosh_curto", 0.25], // "liguei de novo"
  risco(13.3, 2), // celular 2
  [c(16.6), "pago", 0.45], // pago!
  risco(17.4, 3, 0.18),

  // ---- o problema
  risco(19.4, 0),
  risco(19.5, 1, 0.16),
  [c(20.6), "erro", 0.3], // não pago
  [c(21.0), "pago_suave", 0.3], // pago
  [c(23.0), "erro", 0.45], // transação duplicada?!
  [c(24.9), "pop_grave", 0.35], // funcionários
  [c(25.1), "pop_grave", 0.3],
  risco(25.5, 2, 0.16), // extrato
  risco(26.1, 3, 0.16), // documento
  [c(26.7), "tique_taque", 0.5], // relógio
  [c(29.3), "nota", 0.6], // "o cliente virou parte do suporte"

  // ---- 1/4 máquina de estados
  risco(32.9, 0),
  ...[33.6, 34.2, 35.0, 35.6, 36.6, 37.2, 37.7].map((t, i) => risco(t, i + 1, 0.14)),
  [c(38.7), "whoosh_curto", 0.25], // a seta que liga as máquinas
  [c(39.1), "pop_agudo", 0.35],
  risco(39.6, 2),

  // ---- 2/4 reconciliação
  [c(43.4), "pop", 0.4],
  [c(43.8), "pop", 0.35],
  [c(44.5), "whoosh_curto", 0.3], // webhook
  [c(45.2), "erro", 0.4], // não chegou
  [c(46.2), "pop_grave", 0.35], // terminal
  [c(46.5), "teclas", 0.4],
  [c(47.4), "teclas", 0.35],
  [c(48.2), "whoosh_curto", 0.25], // consulta
  [c(49.2), "whoosh_curto", 0.25], // CONCLUIDA
  [c(50.5), "pago_suave", 0.35],
  [c(51.0), "pago", 0.45], // pedido pago
  risco(51.6, 3),

  // ---- 3/4 observabilidade
  [c(54.4), "pop", 0.4],
  [c(54.9), "teclas_longo", 0.45], // busca "pedido 4821"
  [c(56.0), "pop_agudo", 0.3],
  [c(56.4), "pop_agudo", 0.3],
  [c(57.3), "pago_suave", 0.35],
  risco(60.0, 0),

  // ---- 4/4 contingência
  risco(64.5, 1),
  ...[0, 1, 2, 3].flatMap((i): Deixa[] => [risco(65.0 + i, i, 0.15), [c(65.6 + i), "pop_agudo", 0.25]]),
  risco(69.7, 2),

  // ---- em escala: pedidos travados pipocando, cada vez mais agudo
  ...Array.from({ length: 20 }, (_, i): Deixa => [c(74.2 + i * 0.17), i % 3 === 0 ? "pop_agudo" : "pop", 0.16 + i * 0.008]),
  [c(78.2), "nota", 0.6],
  [c(78.95), "boom", 0.8], // "operacional"

  // ---- final
  [c(82.2), "nota", 0.55],
  ...[0, 1, 2, 3].map((i): Deixa => [c(84.8 + i * 0.3), "pop", 0.3]),
  risco(86.6, 3),
];

/** Transições de câmera do canvas: um whoosh baixinho em cada troca de parte. */
const TROCAS: Deixa[] = PARTES.slice(1).map((p) => [c(p.t - 0.55), p.rotulo === "em escala" ? "whoosh_descendo" : "whoosh", 0.18]);

const TOTAL = INTRO + FIM;

export function Sons() {
  return (
    <>
      {/* música: um pouco mais baixa na intro, normal no canvas e some no fim */}
      <Audio
        src={staticFile("aulas/pix/sons/musica.wav")}
        volume={(f) => interpolate(f / FPS, [0, INTRO - 0.5, INTRO, TOTAL - 2, TOTAL], [0.55, 0.55, 0.62, 0.62, 0], { extrapolateRight: "clamp" })}
      />
      {[...DEIXAS, ...TROCAS].map(([t, som, vol], i) => (
        <Sequence key={i} from={Math.round(t * FPS)} layout="none">
          <Audio src={staticFile(`aulas/pix/sons/${som}.wav`)} volume={vol} />
        </Sequence>
      ))}
    </>
  );
}
