import type { Fala } from "../roteiro";

export const FPS = 30;
export const TOTAL_QUADROS = 2070;

const n = (de: number, ate: number, texto: string): Fala => ({ de, ate, quem: "narracao", texto });

/**
 * Narração com o tempo estimado de cada legenda (ritmo de leitura calmo).
 * Com a locução gravada, os tempos reais vêm de tempos.json e o vídeo se ajusta sozinho.
 */
export const FALAS: Fala[] = [
  n(6, 116, "Por que uma terapeuta ocupacional levaria uma colher pra sessão?"),
  n(124, 266, "Porque comer com ela exige um monte de ajustes que a gente nem percebe."),
  n(280, 444, "Quando a colher começa a escorregar, os receptores do tato nos dedos captam esse movimento."),
  n(452, 582, "O sistema nervoso usa essa informação pra ajustar a força da mão,"),
  n(588, 706, "muitas vezes antes de você perceber que a colher ia cair."),
  n(714, 770, "Isso é feedback sensorial."),
  n(790, 866, "Agora imagina duas crianças que derrubam comida."),
  n(874, 950, "Na primeira, o cabo escapa da mão."),
  n(958, 1122, "Na segunda, a mão segura firme, mas a colher vira no caminho até a boca."),
  n(1130, 1240, "O resultado é o mesmo. A dificuldade aparece em momentos diferentes."),
  n(1248, 1356, "É por isso que a terapeuta observa a tarefa inteira."),
  n(1376, 1442, "Seu filho derruba comida com frequência?"),
  n(1450, 1538, "Na próxima refeição, repara em que momento acontece."),
  n(1546, 1720, "É quando pega a colher, quando coloca a comida nela ou no caminho até a boca?"),
  n(1728, 1848, "Se isso estiver atrapalhando as refeições, leva esse exemplo pra terapeuta."),
  n(1856, 1964, "Ele conta muito mais do que “não sabe usar colher”."),
];

/** Cortes entre os blocos. */
export const CORTES = { segura: 120, dedos: 274, quadros: 780, casa: 1366, cartao: 1724, troca: 1852, fim: 1972 };

export const ROTULO = { de: 712, ate: 780, texto: "feedback sensorial" };
export const PASSOS = ["Segurar o cabo", "Pegar a comida", "Levar à boca"];
export const CARTAO = { antes: "Derruba comida", depois: "Segura a colher, mas ela vira perto da boca" };
export const FINAL = { de: CORTES.fim, marca: ["Explica,", "Mente!"], linhas: ["", "Em breve · app para clínicas"] };
