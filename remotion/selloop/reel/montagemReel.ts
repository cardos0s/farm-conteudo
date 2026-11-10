import { recorte, type Caixa, type Gravacao } from "../gravacao";
import type { OpcoesTrecho, Trecho } from "../montagem";
import type { Bloco } from "../Video";
import { cameraNoTrecho, projetar, type Alvo, type Ret } from "./base";
import type { SobreReel } from "./Reel";

// Ajudas para escrever a edição de um vídeo vertical: de um recorte marcado na cena para o elemento
// que salta da janela no instante certo do vídeo.

/** Centro da janela: onde um recorte fica em repouso, se a edição não disser outra coisa. */
export const CENTRO = { cx: 540, cy: 950 };

export type OpcoesSalto = {
  /** Largura em repouso (px do quadro). Sem ela, o recorte cresce até caber em `maxL` × `maxA`. */
  w?: number;
  maxL?: number;
  maxA?: number;
  cx?: number;
  cy?: number;
  rot?: number;
  /** Raio do canto do elemento na plataforma (px CSS): 16 nas mensagens, 999 nas pílulas. */
  raio?: number;
  /** Segundos antes (negativo) ou depois do instante em que o recorte foi marcado na gravação. */
  atraso?: number;
  /** Quando sai (s do vídeo). Padrão: o fim do bloco. */
  ate?: number;
  /** Quando entra (s do vídeo), no lugar do instante marcado na gravação. */
  de?: number;
  moldura?: boolean;
  faiscas?: boolean;
  escurece?: boolean;
  som?: boolean;
  /** Outra imagem no lugar do recorte (ex.: a página do PDF), com a sua proporção (altura ÷ largura). */
  imagem?: { src: string; proporcao: number };
  /** Com `imagem`: a caixa (px CSS da gravação) de onde ela sai, no lugar da caixa do recorte. */
  caixa?: Caixa;
  /** Só uma parte do recorte, em frações dele (0 a 1): salta só esse pedaço, bem maior. */
  parte?: { x: number; y: number; w: number; h: number };
};

export function ajudasDoReel(o: {
  gravacoes: Record<string, Gravacao>;
  alvos: Record<string, Alvo[]>;
  blocos: Bloco[];
  inicioBloco: (i: number) => number;
  fimBloco: (i: number) => number;
  noBloco: (i: number, tRec: number) => number;
  naGravacao: (i: number, tVideo: number) => number;
}) {
  const tela = (cena: string) => ({ w: o.gravacoes[cena].largura, h: o.gravacoes[cena].altura });

  /** Onde uma caixa da gravação aparece no quadro, no instante tRec de um trecho tocado em `velocidade`. */
  const naJanela = (cena: string, caixa: Caixa, tRec: number, velocidade = 1): Ret => projetar(caixa, cameraNoTrecho(o.alvos[cena] ?? [], tRec, velocidade), tela(cena));

  /**
   * O recorte `nome` da cena salta da janela durante o bloco `i` (um trecho dessa mesma cena).
   * Entra quando o elemento foi marcado na gravação e sai no fim do bloco.
   */
  function salto(i: number, nome: string, op: OpcoesSalto = {}): SobreReel {
    const b = o.blocos[i];
    if (b.tipo !== "tela") throw new Error(`O bloco ${i} não é um trecho de tela (recorte "${nome}").`);
    const r = recorte(o.gravacoes[b.cena], nome);
    const p = op.parte;
    const caixa = op.caixa ?? (p ? { x: r.caixa.x + p.x * r.caixa.w, y: r.caixa.y + p.y * r.caixa.h, w: p.w * r.caixa.w, h: p.h * r.caixa.h } : r.caixa);
    const limitar = (t: number, bloco = b) => Math.min(Math.max(t, bloco.de), bloco.ate);
    // entra quando o recorte foi marcado na gravação (se cair fora do trecho mostrado, na borda dele)
    const de = op.de ?? o.noBloco(i, limitar(r.t + (op.atraso ?? 0)));
    const ate = op.ate ?? o.fimBloco(i);
    // sai de onde o elemento está na janela nesse instante do vídeo: vale o trecho dessa cena que
    // está na tela em `de` (pode ser o vizinho do bloco i)
    const j = o.blocos.findIndex((x, k) => x.tipo === "tela" && x.cena === b.cena && de >= o.inicioBloco(k) && de < o.fimBloco(k));
    const naTela = j >= 0 ? (o.blocos[j] as typeof b) : b;
    const tRec = limitar(o.naGravacao(j >= 0 ? j : i, de), naTela);
    const proporcao = op.imagem?.proporcao ?? caixa.h / caixa.w;
    const maxL = op.maxL ?? 900;
    const maxA = op.maxA ?? 760;
    // cabe na área e não amplia mais que 3,2× (a imagem do recorte está em 3×)
    const w = op.w ?? Math.min(maxL, maxA / proporcao, op.imagem ? maxL : caixa.w * 3.2);
    const escala = w / caixa.w;
    return {
      tipo: "recorte",
      de,
      ate,
      src: op.imagem?.src ?? `selloop/telas/${b.cena}/recortes/${nome}.png`,
      origem: naJanela(b.cena, caixa, tRec, naTela.velocidade ?? 1),
      destino: { cx: op.cx ?? CENTRO.cx, cy: op.cy ?? CENTRO.cy, w },
      proporcao,
      corte: op.imagem ? undefined : p,
      raio: op.imagem ? 10 : Math.min((op.raio ?? 16) * escala, (w * proporcao) / 2),
      rot: op.rot,
      moldura: op.moldura,
      faiscas: op.faiscas,
      escurece: op.escurece,
      som: op.som,
    };
  }

  return { salto, naJanela };
}

/** Cliques de uma gravação a partir de um instante (para achar "o 1º e o 2º clique depois da marca"). */
export function cliquesApos(g: Gravacao, t: number): { t: number; x: number; y: number }[] {
  return g.eventos.filter((e): e is Extract<Gravacao["eventos"][number], { tipo: "clique" }> => e.tipo === "clique" && e.t >= t).map((e) => ({ t: e.t, x: e.x, y: e.y }));
}

/**
 * Monta os trechos de uma fala a partir de pedaços da gravação com hora marcada para terminar.
 * Cada parte mostra [de, ate] da gravação e termina quando a fala chega em `fim` (segundos da fala);
 * a última termina `respiro` segundos depois do fim da fala. A velocidade de cada parte sai disso.
 * Partes seguidas na gravação (uma começa onde a outra acabou) emendam sem corte.
 */
export function criarGrupos(o: {
  trecho: (cena: string, de: number, ate: number, op?: OpcoesTrecho) => Trecho;
  durFala: (id: string) => number;
  /** Transição entre telas diferentes e corte dentro da mesma tela (s). */
  transicao: number;
  corte: number;
}) {
  return function grupo(
    fala: string,
    cena: string,
    partes: { de: number; ate: number; fim?: number }[],
    op: { antes?: number; respiro?: number; entrada?: "tela" | "corte" | "segue" } = {},
  ): Trecho[] {
    const antes = op.antes ?? 0.3;
    // "tela": vem de outra tela (desliza); "corte": pulo dentro da mesma tela; "segue": continua a gravação
    const entrada = { tela: o.transicao, corte: o.corte, segue: 0 }[op.entrada ?? "tela"];
    const inicioDaFala = entrada * 0.5 + antes;
    let inicio = 0; // quando a parte começa, contado do começo da primeira
    return partes.map((p, k) => {
      const segue = k > 0 && Math.abs(p.de - partes[k - 1].ate) < 0.05;
      const ent = k === 0 ? entrada : segue ? 0 : o.corte;
      const ultima = k === partes.length - 1;
      if (!ultima && p.fim === undefined) throw new Error(`Falta "fim" na parte ${k} da fala ${fala}.`);
      const fim = inicioDaFala + (ultima ? o.durFala(fala) + (op.respiro ?? 0.6) : (p.fim as number));
      if (k > 0) inicio -= ent; // o corte se sobrepõe ao fim da parte anterior
      const dur = fim - inicio;
      if (dur <= 0.05) throw new Error(`Parte ${k} da fala ${fala} ficou sem duração (${dur.toFixed(2)} s).`);
      const t = o.trecho(cena, p.de, p.ate, { vel: (p.ate - p.de) / dur, entrada: ent });
      inicio = fim;
      return k === 0 ? { ...t, fala, antes } : t;
    });
  };
}
