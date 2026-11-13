import type { Fala } from "../roteiro";

export const FPS = 30;
export const TOTAL_QUADROS = 38 * FPS;

/** Narração com o tempo de cada legenda. Ao gravar a voz, ajuste `de` e `ate` para bater com o áudio. */
export const FALAS: Fala[] = [
  { de: 6, ate: 92, quem: "narracao", texto: "O que calçar um tênis tem a ver com terapia ocupacional?" },
  { de: 98, ate: 146, quem: "narracao", texto: "Mais do que parece." },
  { de: 152, ate: 292, quem: "narracao", texto: "Quando alguém diz “ela não consegue calçar o tênis”, ainda falta saber em qual parte." },
  { de: 298, ate: 338, quem: "narracao", texto: "É difícil se equilibrar?" },
  { de: 340, ate: 378, quem: "narracao", texto: "Abrir o tênis?" },
  { de: 380, ate: 418, quem: "narracao", texto: "Dar o laço?" },
  { de: 424, ate: 536, quem: "narracao", texto: "É a mesma tarefa, mas são dificuldades diferentes." },
  { de: 544, ate: 650, quem: "narracao", texto: "Se o problema é se equilibrar, a terapeuta pode testar um assento mais baixo." },
  { de: 654, ate: 746, quem: "narracao", texto: "Se é dar o laço, baixar o banco não ensina o laço." },
  { de: 750, ate: 896, quem: "narracao", texto: "É por isso que a TO observa como a pessoa faz a tarefa antes de decidir o que trabalhar." },
  { de: 904, ate: 1030, quem: "narracao", texto: "E anotar o que foi testado ajuda a equipe a comparar o que mudou na próxima sessão." },
  { de: 1040, ate: 1112, quem: "narracao", texto: "Isso é terapia ocupacional na prática." },
];

/** Cortes das três animações rápidas (equilíbrio, abrir, laço) e a repetição em sequência. */
export const CORTES = { pe: 150, abrir: 340, laco: 380, pe2: 420, abrir2: 460, laco2: 500, banco: 540, peApoiado: 606, lacoDeNovo: 654, observa: 750, fim: 900 };

export const NOTA = { de: 906, ate: 1034, escreveAte: 950, texto: "Testamos com o pé apoiado." };

export const FINAL = { de: 1036, marca: ["Explica,", "Mente!"], linhas: ["", "Em breve · app para clínicas"] };
