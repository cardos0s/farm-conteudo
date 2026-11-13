export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;
export const TOTAL_QUADROS = 40 * FPS;

/** Início e fim de cada bloco do roteiro, em quadros. */
export const CENAS = {
  gancho: [0, 120],
  descoberta: [120, 360],
  explicacao: [360, 810],
  piada: [810, 960],
  fechamento: [960, 1200],
} as const;

export type Fala = { de: number; ate: number; quem: "lia" | "tera" | "narracao"; texto: string };

/**
 * Falas e narração com o tempo em que cada uma aparece na tela.
 * Quando a locução for gravada, é só ajustar `de` e `ate` para bater com o áudio:
 * as bocas dos personagens e as legendas seguem esta lista.
 */
export const FALAS: Fala[] = [
  { de: 46, ate: 118, quem: "lia", texto: "Moça, eu vim pra terapia ou pra calçar o tênis?" },
  { de: 166, ate: 220, quem: "tera", texto: "Me mostra qual parte tá mais difícil." },
  { de: 226, ate: 284, quem: "lia", texto: "Quando eu empurro o pé, ele foge!" },
  { de: 380, ate: 452, quem: "narracao", texto: "Sabe o “ocupacional” da terapia ocupacional?" },
  { de: 456, ate: 508, quem: "narracao", texto: "Não é só sobre trabalho." },
  { de: 512, ate: 594, quem: "narracao", texto: "Tem a ver com as coisas que a gente faz no dia a dia." },
  { de: 600, ate: 708, quem: "narracao", texto: "Nesse caso, a terapeuta observou o que dificultava calçar o tênis" },
  { de: 712, ate: 806, quem: "narracao", texto: "e testou com a Lia um jeito de fazer." },
  { de: 878, ate: 954, quem: "lia", texto: "Agora você. Sem fugir." },
  { de: 1034, ate: 1102, quem: "narracao", texto: "Na próxima sessão, a equipe já sabe o que vale testar de novo." },
];

export const NOTA = { de: 968, ate: 1100, escreveAte: 1030, texto: "Com o pé apoiado, Lia conseguiu abrir o tênis e encaixar o pé." };

export const REPLAY = { de: 360, ate: 810 };

export const FINAL = {
  de: 1104,
  marca: ["Explica,", "Mente!"],
  linhas: ["A vida real em desenho.", "Em breve, nosso app para clínicas."],
};

export const falando = (f: number, quem: Fala["quem"]) => FALAS.some((x) => x.quem === quem && f >= x.de + 2 && f <= x.ate - 6);
