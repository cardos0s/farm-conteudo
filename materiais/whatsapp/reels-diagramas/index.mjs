// Diagramas desenhados para os Reels (linguagem leiga), um arquivo por diagrama. Cada função devolve
// um SVG 968x690 com as etapas marcadas (etapa(n, ...)), que o vídeo desenha no ritmo da narração.
import { conexao } from "./conexao.mjs";
import { recepcao } from "./recepcao.mjs";
import { caminho } from "./caminho.mjs";
import { ordem } from "./ordem.mjs";
import { tiquinhos } from "./tiquinhos.mjs";
import { offline } from "./offline.mjs";
import { grupos } from "./grupos.mjs";
import { cartas } from "./cartas.mjs";
import { tamanho } from "./tamanho.mjs";
import { gavetas } from "./gavetas.mjs";
import { senha } from "./senha.mjs";
import { reconexao } from "./reconexao.mjs";
import { luz } from "./luz.mjs";
import { cripto } from "./cripto.mjs";

// nomes com prefixo "reels:" para não colidir com os diagramas do PDF (grupos, reconexao...)
export const diagramasReels = {
  "reels:conexao": conexao,
  "reels:recepcao": recepcao,
  "reels:caminho": caminho,
  "reels:ordem": ordem,
  "reels:tiquinhos": tiquinhos,
  "reels:offline": offline,
  "reels:grupos": grupos,
  "reels:cartas": cartas,
  "reels:tamanho": tamanho,
  "reels:gavetas": gavetas,
  "reels:senha": senha,
  "reels:reconexao": reconexao,
  "reels:luz": luz,
  "reels:cripto": cripto,
};
