import { recorte, type Caixa, type Gravacao } from "../gravacao";
import { projetar, type Alvo, type Ret } from "../reel/base";
import { CENTRO, type OpcoesSalto } from "../reel/montagemReel";
import type { SobreReel } from "../reel/Reel";
import { cameraDaTomada } from "./Fluido";
import type { Parte } from "./roteiro";

// Ajudas para escrever a edição em tomada contínua: onde um elemento da tela está no quadro num
// instante do vídeo, e o recorte que salta dali.

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
