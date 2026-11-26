import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import sfx from "../comum/sfx.json";
import { FIM_REAL, FPS, GANCHO, INTRO, PARTES, real } from "./roteiro";

// Voz do gancho, música e efeitos do Reel de design patterns.
// - Gancho: o áudio da própria gravação (public/aulas/patterns/gancho.mov).
// - Música: original, gerada por scripts/aulas/musica_patterns.py (public/aulas/patterns/musica.wav).
// - Efeitos: SFX Kit (CC0), baixados por scripts/aulas/baixar_sfx.py (public/sfx/).
// Tempos do canvas no tempo de projeto, com c(t) (passa pelo mapa de tempo da narração).

type Chave = keyof typeof sfx;
/** [instante na tela (s do vídeo), efeito, volume] */
type Deixa = [number, Chave, number];

const c = (t: number) => INTRO + real(t);

const DEIXAS: Deixa[] = [
  [INTRO, "whoosh_entrada", 0.6], // corte do gancho para o canvas

  // ---- gancho no canvas
  ...Array.from({ length: 9 }, (_, i): Deixa => [c(0.3 + i * 0.38), "pop_pequeno", 0.35]),
  [c(4.0), "marcador", 0.3],
  [c(5.2), "marcador", 0.35],
  [c(8.0), "tambor", 0.8], // "sim."
  [c(8.5), "sucesso", 0.45],
  [c(9.6), "brilho", 0.4],

  // ---- contexto
  [c(13.2), "lapis", 0.35], // o livro
  [c(13.3), "boom_medio", 0.6], // 1994
  [c(17.0), "contagem", 0.5], // 23 padrões
  [c(20.2), "pop_grande", 0.4],
  [c(20.8), "pop_grande", 0.4],
  [c(21.5), "pop_grande", 0.45],
  [c(24.6), "vira", 0.5], // a pergunta

  // ---- criacionais
  [c(29.2), "swish", 0.5],
  ...[0, 1, 2, 3].map((i): Deixa => [c(34.0 + i * 0.25), "pop_pequeno", 0.35]),
  [c(35.0), "materializa", 0.5], // uma única instância
  [c(37.0), "digitando_curto", 0.4],
  [c(38.4), "digitando_curto", 0.4],
  [c(39.6), "sucesso_suave", 0.4],
  [c(42.0), "swish", 0.45],
  [c(43.2), "pop_medio", 0.4],
  [c(44.6), "zip_medio", 0.4], // a fábrica cria
  ...[44.8, 45.1, 45.4].map((t): Deixa => [c(t), "pop_medio", 0.35]),
  [c(46.8), "digitando", 0.4],
  [c(50.0), "swish", 0.45],
  [c(50.6), "digitando", 0.35],
  ...[51.5, 52.3, 53.1, 53.9, 54.7].map((t): Deixa => [c(t), "numero", 0.4]), // cada peça do agente
  [c(55.9), "conquista", 0.55], // pronto

  // ---- estruturais
  [c(58.2), "swish", 0.5],
  ...[62.6, 63.0, 63.4].map((t): Deixa => [c(t), "pop_medio", 0.35]),
  ...[64.2, 64.4, 64.6].map((t): Deixa => [c(t), "vira", 0.35]), // adapters
  [c(65.4), "materializa", 0.45], // interface única
  [c(66.9), "zip_medio", 0.35],
  [c(71.0), "swish", 0.45],
  ...[72.4, 73.3, 74.2, 75.1].map((t): Deixa => [c(t), "barra", 0.45]), // camadas
  [c(76.1), "digitando", 0.35],
  [c(78.0), "swish", 0.45],
  [c(79.3), "processando", 0.4], // a complexidade
  [c(81.6), "tambor", 0.7], // a fachada
  [c(83.3), "zip_medio", 0.4],

  // ---- comportamentais
  [c(86.2), "swish", 0.5],
  [c(90.6), "pop_grande", 0.4],
  ...[91.4, 91.8, 92.2].map((t): Deixa => [c(t), "pop_medio", 0.35]),
  [c(93.0), "digitando", 0.35],
  ...[94.6, 95.0, 95.4].map((t): Deixa => [c(t), "numero", 0.4]), // custo, latência, complexidade
  ...[96.0, 96.7, 97.4].map((t): Deixa => [c(t), "zip_forte", 0.4]), // tarefas roteadas
  [c(98.0), "swish", 0.45],
  [c(99.8), "processando", 0.4],
  [c(101.0), "sucesso", 0.5],
  ...[101.9, 102.5, 103.1].map((t): Deixa => [c(t), "mensagem", 0.4]), // observadores notificados
  [c(106.0), "swish", 0.45],
  ...[106.8, 107.1, 107.4].map((t): Deixa => [c(t), "pop_medio", 0.35]),
  ...[108.2, 109.0, 109.7].map((t): Deixa => [c(t), "zip_medio", 0.35]),
  [c(110.4), "sucesso", 0.5],
  [c(111.5), "whoosh_rapido", 0.4],
  [c(112.3), "negado", 1.2], // interrompida
  [c(112.4), "bloqueio", 0.6],

  // ---- conexão
  [c(119.4), "marcador", 0.35],
  ...[120.0, 121.5, 123.0, 124.5].flatMap((t): Deixa[] => [
    [c(t), "vira", 0.4],
    [c(t + 0.5), "pop_medio", 0.35],
  ]),
  [c(125.8), "brilho", 0.4],

  // ---- fechamento
  ...[0, 1, 2, 3].map((i): Deixa => [c(127.3 + i * 0.6), "pop_pequeno", 0.35]),
  [c(132.2), "tambor", 0.8], // fundamentos
  [c(137.7), "risco", 0.5], // modelos mudam (riscado)
  [c(138.9), "risco", 0.5], // frameworks mudam (riscado)
  ...[0, 1, 2, 3].map((i): Deixa => [c(141.2 + i * 0.5), "numero", 0.4]),
  [c(146.2), "boom", 0.8], // a frase final
  [c(150.6), "assinatura_tech", 0.6], // "mais evidente"
];

/** Trocas de câmera do canvas: um whoosh baixinho no meio do movimento. */
const TROCAS: Deixa[] = PARTES.slice(1).map((p) => [c(p.t - 0.1), p.rotulo === "os padrões de hoje" ? "whoosh_entrada" : "whoosh_troca", 0.3]);

const TOTAL = INTRO + FIM_REAL;

/** Momentos em que a música abaixa por um instante para o efeito aparecer (ducking). */
const DESTAQUES = [c(8.0), c(13.3), c(81.6), c(112.3), c(132.2), c(146.2)];
function abaixa(t: number) {
  let g = 1;
  for (const d of DESTAQUES) {
    const k = t < d ? (d - t) / 0.08 : (t - d) / 0.9;
    if (k < 1) g = Math.min(g, 0.4 + 0.6 * k);
  }
  return g;
}

/** Ganho geral dos efeitos (volumes acima de 1 nas deixas servem para sons baixos por natureza). */
const GANHO_EFEITOS = 0.7;
/**
 * Música: baixinha sob a voz do gancho; no canvas, mais presente enquanto não há narração.
 * Quando a narração entrar, baixe MUSICA_CANVAS para ~0,12 (como no Reel do Pix).
 */
const MUSICA_GANCHO = 0.05;
const MUSICA_CANVAS = 0.2;

export function Sons() {
  return (
    <>
      <Audio src={staticFile(GANCHO.arquivo)} trimBefore={Math.round(GANCHO.de * FPS)} trimAfter={Math.round(GANCHO.ate * FPS)} />
      <Audio
        src={staticFile("aulas/patterns/musica.wav")}
        volume={(f) =>
          interpolate(f / FPS, [0, INTRO - 0.3, INTRO, TOTAL - 2, TOTAL], [MUSICA_GANCHO, MUSICA_GANCHO, MUSICA_CANVAS, MUSICA_CANVAS, 0], { extrapolateRight: "clamp" }) * abaixa(f / FPS)
        }
      />
      {[...DEIXAS, ...TROCAS].map(([t, chave, vol], i) => (
        <Sequence key={i} from={Math.max(0, Math.round((t - sfx[chave].sync) * FPS))} layout="none">
          <Audio src={staticFile(`sfx/${chave}.wav`)} volume={Math.min(1, vol * GANHO_EFEITOS)} />
        </Sequence>
      ))}
    </>
  );
}
