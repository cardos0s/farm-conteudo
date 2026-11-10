import { recorte, trajetos, type Caixa, type Gravacao, type Trajeto } from "../gravacao";
import { projetar, type Alvo, type Ret } from "../reel/base";
import { CENTRO, type OpcoesSalto } from "../reel/montagemReel";
import type { SobreReel } from "../reel/Reel";
import { cameraDaTomada } from "./Fluido";
import type { Parte } from "./roteiro";

// Ajudas para escrever a edição em tomada contínua: onde um elemento da tela está no quadro num
// instante do vídeo, e o recorte que salta dali.

/** A viagem do cursor que começa no instante `t` do filme, ou logo depois (a `ordem`-ésima). */
export function viagemApos(g: Gravacao, t: number, ordem = 0): Trajeto {
  const v = trajetos(g).filter((x) => x.t >= t - 0.06)[ordem];
  if (!v) throw new Error(`Não há viagem do cursor depois de ${t.toFixed(2)} s em ${g.cena}.`);
  return v;
}

/** Limites do centro da câmera (px CSS da tela). */
export type Faixa = { x: [number, number]; y: [number, number] };

/**
 * Um alvo de câmera em cada clique do filme entre `de` e `ate` (s do filme): a câmera acompanha o
 * cursor. Com `faixa`, o centro dela fica dentro desses limites, e ela acompanha sem atravessar a
 * tela a cada clique. `saida` leva um instante do filme ao instante do vídeo em que ele aparece.
 */
export function alvosNosCliques(saida: (mt: number) => number, g: Gravacao, de: number, ate: number, zoom: number, faixa?: Faixa): Alvo[] {
  const preso = (v: number, [a, b]: [number, number]) => Math.min(b, Math.max(a, v));
  return g.eventos
    .filter((e): e is Extract<Gravacao["eventos"][number], { tipo: "clique" }> => e.tipo === "clique" && e.t >= de && e.t < ate)
    .map((c) => ({ t: saida(c.t) - 0.3, cx: faixa ? preso(c.x, faixa.x) : c.x, cy: faixa ? preso(c.y, faixa.y) : c.y, zoom }));
}

export function ajudasFluidas(o: { partes: Parte[]; filmes: Record<string, Gravacao>; alvos: Record<number, Alvo[]>; pastaFilme: string }) {
  const cenaDe = (i: number) => {
    const p = o.partes[i];
    if (p?.tipo !== "tela") throw new Error(`A parte ${i} não é uma tomada de tela.`);
    return p.cena;
  };

  /** Onde uma caixa da tela (px CSS do filme) aparece no quadro no instante `quando` do vídeo, na tomada `i`. */
  function naJanela(i: number, caixa: Caixa, quando: number): Ret {
    const g = o.filmes[cenaDe(i)];
    return projetar(caixa, cameraDaTomada(o.alvos[i] ?? [], quando), { w: g.largura, h: g.altura });
  }

  /** O recorte `nome` da cena da tomada `i` salta da janela em `de` e sai em `ate` (s do vídeo). */
  function salto(i: number, nome: string, op: OpcoesSalto & { de: number; ate: number; origem?: Ret }): SobreReel {
    const cena = cenaDe(i);
    const r = recorte(o.filmes[cena], nome);
    const p = op.parte;
    const caixa = op.caixa ?? (p ? { x: r.caixa.x + p.x * r.caixa.w, y: r.caixa.y + p.y * r.caixa.h, w: p.w * r.caixa.w, h: p.h * r.caixa.h } : r.caixa);
    const proporcao = op.imagem?.proporcao ?? caixa.h / caixa.w;
    const maxL = op.maxL ?? 900;
    const maxA = op.maxA ?? 760;
    // cabe na área e não amplia mais que 3,2× (a imagem do recorte está em 3×)
    const w = op.w ?? Math.min(maxL, maxA / proporcao, op.imagem ? maxL : caixa.w * 3.2);
    const escala = w / caixa.w;
    return {
      tipo: "recorte",
      de: op.de,
      ate: op.ate,
      src: op.imagem?.src ?? `${o.pastaFilme}/${cena}/recortes/${nome}.png`,
      origem: op.origem ?? naJanela(i, caixa, op.de),
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

  return { naJanela, salto };
}
