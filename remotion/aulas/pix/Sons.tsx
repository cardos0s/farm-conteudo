import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { FIM, FPS, INTRO, PARTES } from "./roteiro";
import sfx from "./sfx.json";

// Trilha e efeitos sonoros do Reel, no estilo de edição de Reels: poucos sons, bem marcados.
// - Música: original, gerada por scripts/aulas/sons_pix.py (public/aulas/pix/sons/musica.wav).
// - Efeitos: SFX Kit (CC0), baixados por scripts/aulas/baixar_sfx_pix.py (public/aulas/pix/sfx/).
// Cada efeito é posicionado pelo seu ponto de sincronia (sfx.json): o golpe do tambor, o pico do
// whoosh ou a chegada do reverse whoosh caem exatamente no instante marcado aqui.
// Tempos: intro em segundos do vídeo; canvas em segundos do canvas, com c(t).

type Chave = keyof typeof sfx;
/** [instante na tela (s do vídeo), efeito, volume] */
type Deixa = [number, Chave, number];

const c = (t: number) => INTRO + t;

const DEIXAS: Deixa[] = [
  // ---- intro (vlog)
  [0.65, "whoosh_suave", 0.5], // a faixa abre no meio
  [1.95, "whoosh_forte", 0.55], // toma a tela
  [3.0, "zip_forte", 0.5], // faixa de cima chega
  [3.1, "zip_medio", 0.45], // faixa de baixo chega
  [3.2, "tambor", 0.8], // BLACK
  [3.7, "brilho", 0.5], // friday
  [5.2, "reverso", 0.7], // puxa até o corte do vazamento de luz
  [5.45, "boom", 0.9], // E ISSO
  [5.95, "baixo_808", 0.75], // aconteceu…
  [7.85, "whoosh_entrada", 0.55], // entra no canvas

  // ---- abertura no canvas
  [c(0.2), "marcador", 0.35], // "um Pix, 30 minutos"
  [c(2.0), "pop_grande", 0.45], // janela do pedido
  [c(3.9), "nope", 0.5], // "???"

  // ---- a história
  [c(6.1), "lapis", 0.35], // desenhando
  [c(7.6), "tique_rapido", 0.5], // a contagem correndo
  [c(10.1), "desliga", 1.3], // apagou
  [c(10.5), "murcha", 0.55], // "descarregou!"
  [c(13.1), "whoosh_rapido", 0.45], // "liguei de novo"
  [c(15.2), "cartao", 0.5], // pagando…
  [c(16.6), "caixa", 1.43], // pago! (ka-ching)
  [c(17.5), "caneta", 0.3], // "1 compra, 2 Pix"

  // ---- o problema
  [c(19.5), "marcador", 0.3],
  [c(20.6), "nope", 0.5], // não pago
  [c(21.0), "ding_ding", 0.45], // pago
  [c(23.0), "boom_medio", 0.7], // transação duplicada?!
  [c(23.1), "alarme", 0.45],
  [c(24.9), "pop_grande", 0.4], // funcionários
  [c(25.15), "pop_grande", 0.35],
  [c(26.7), "relogio", 0.55], // o tempo passando
  [c(29.3), "boom", 0.85], // "o cliente virou parte do suporte"
  [c(30.2), "womp", 0.6],

  // ---- 1/4 máquina de estados
  [c(32.9), "swish", 0.5],
  [c(33.6), "pop_pequeno", 0.4],
  [c(35.0), "pop_medio", 0.45], // paga
  [c(35.6), "pop_medio", 0.4], // expirada
  [c(37.2), "bolha_ok", 0.45], // pedido pago
  [c(38.7), "zip_medio", 0.45], // a seta que liga as máquinas
  [c(39.6), "caneta", 0.3],

  // ---- 2/4 reconciliação
  [c(43.4), "swish", 0.5],
  [c(44.5), "zip_sai", 0.5], // webhook sai…
  [c(45.2), "negado", 1.43], // …e não chega
  [c(46.5), "digitando", 0.45], // reconciliador
  [c(48.2), "processando", 0.45], // consulta o provedor
  [c(49.3), "mensagem", 0.5], // CONCLUIDA
  [c(51.0), "sucesso", 0.6], // pedido pago

  // ---- 3/4 observabilidade
  [c(54.4), "swish", 0.5],
  [c(54.9), "digitando_curto", 0.5], // "pedido 4821"
  [c(55.75), "enter", 0.5],
  [c(56.0), "scan", 0.45], // as cobranças aparecem
  [c(57.3), "sucesso_suave", 0.5], // pago
  [c(60.0), "marcador", 0.3],

  // ---- 4/4 contingência
  [c(64.5), "swish", 0.5],
  ...[0, 1, 2, 3].flatMap((i): Deixa[] => [
    [c(65.0 + i), "impacto", 0.4], // falha
    [c(65.6 + i), "numero", 0.45], // plano
  ]),
  [c(69.8), "assinatura", 0.5], // "faz parte do projeto"

  // ---- em escala: spam de notificações, subida e o "operacional"
  ...Array.from({ length: 20 }, (_, i): Deixa => [c(74.2 + i * 0.17), i % 2 ? "mensagem_suave" : "mensagem", 0.22 + i * 0.01]),
  [c(79.0), "riser_1s", 0.6], // pico junto com o tambor
  [c(79.0), "tambor_enorme", 0.9], // "operacional"
  [c(79.0), "boom_queda", 0.5],

  // ---- final
  [c(83.8), "assinatura_brilho", 0.6], // "se recuperar"
  ...[0, 1, 2, 3].map((i): Deixa => [c(84.8 + i * 0.3), "pop_medio", 0.35]),
  [c(86.7), "enviado", 0.45], // "e você, já passou por isso?"
];

/** Trocas de câmera do canvas: um whoosh baixinho no meio do movimento. */
const TROCAS: Deixa[] = PARTES.slice(1).map((p) => [c(p.t - 0.1), p.rotulo === "em escala" ? "whoosh_entrada" : "whoosh_troca", 0.3]);

const TOTAL = INTRO + FIM;

/** Momentos em que a música abaixa por um instante para o efeito aparecer (ducking). */
const DESTAQUES = [3.2, 5.45, 5.95, c(10.1), c(16.6), c(23.0), c(29.3), c(45.2), c(51.0), c(79.0), c(83.8)];
/** Quanto a música deixa passar no instante t (1 = normal; cai para ~0,4 nos destaques). */
function abaixa(t: number) {
  let g = 1;
  for (const d of DESTAQUES) {
    const k = t < d ? (d - t) / 0.08 : (t - d) / 0.9; // desce rápido, volta devagar
    if (k < 1) g = Math.min(g, 0.4 + 0.6 * k);
  }
  return g;
}
/**
 * Ganho geral dos efeitos. Volumes acima de 1 nas deixas servem para os sons que já são baixos
 * por natureza (caixa registradora, "acesso negado"); o resultado nunca passa de 1.
 */
const GANHO_EFEITOS = 0.7;

export function Sons() {
  return (
    <>
      {/* música por baixo de tudo: abaixa nos destaques e some aos poucos no fim */}
      <Audio
        src={staticFile("aulas/pix/sons/musica.wav")}
        volume={(f) => interpolate(f / FPS, [0, TOTAL - 2, TOTAL], [0.09, 0.09, 0], { extrapolateRight: "clamp" }) * abaixa(f / FPS)}
      />
      {[...DEIXAS, ...TROCAS].map(([t, chave, vol], i) => (
        // começa antes do instante para que o ponto de sincronia do som caia em `t`
        <Sequence key={i} from={Math.max(0, Math.round((t - sfx[chave].sync) * FPS))} layout="none">
          <Audio src={staticFile(`aulas/pix/sfx/${chave}.wav`)} volume={Math.min(1, vol * GANHO_EFEITOS)} />
        </Sequence>
      ))}
    </>
  );
}
