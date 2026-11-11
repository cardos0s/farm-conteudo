import type { Pagina } from "../../lousa/Lousa";

// Onde cada cena fica no canvas infinito. Cada parte da aula ocupa uma área própria, com as
// páginas em grade de 4 colunas. No fim de cada parte, a câmera se afasta para mostrar a parte toda.

const CEL_X = 2100;
const CEL_Y = 1300;
const COLS = 4;

function parte(y0: number, nomes: string[]): { paginas: Record<string, Pagina>; fim: number } {
  const paginas: Record<string, Pagina> = {};
  let col = 0;
  let lin = 0;
  for (const nome of nomes) {
    paginas[nome] = { x: col * CEL_X, y: y0 + lin * CEL_Y, w: 1920, h: 1080 };
    col++;
    if (col === COLS) {
      col = 0;
      lin++;
    }
  }
  if (col > 0) lin++;
  return { paginas, fim: y0 + lin * CEL_Y + 900 };
}

const p1 = parte(0, [
  "abertura", "agente", "pergunta", "promessa",
  "frase", "llm", "proxima", "confianca",
  "alucinacao", "colega", "agenteDef", "nota",
  "llmNota", "subjetiva", "enem",
]);
const p2 = parte(p1.fim, ["cap2", "juiz", "var", "fluxo", "conceitos", "honestidade"]);
const p3 = parte(p2.fim, ["cap3", "conversa", "checks", "estranho", "pesos", "codigoJuiz", "baseline", "evidencia"]);
const p4 = parte(p3.fim, [
  "cap4", "pecas", "formulario", "prompt",
  "julgar", "localizar", "repl", "gates",
  "existir", "score", "conta", "rodar",
]);
const p5 = parte(p4.fim, ["cap5", "tresVezes", "detetive", "raciocinio", "investigacao", "v2", "provaFalsa", "media"]);
const p6 = parte(p5.fim, ["cap6", "ci", "skills", "limites", "resumoFinal", "desafio", "fim"]);

export const P = { ...p1.paginas, ...p2.paginas, ...p3.paginas, ...p4.paginas, ...p5.paginas, ...p6.paginas } as Record<string, Pagina>;

export const PARTES = [p1, p2, p3, p4, p5, p6].map((p) => Object.values(p.paginas));
export const todas = Object.values(P);
