import type { Plano } from "./camera";
import { duracaoBloco, inicios, transicaoAntes, type Bloco, type Edicao, type FalaLocucao } from "./Video";

// Montagem guiada pela locução, comum aos vídeos do pack: cada trecho de tela tem (ou não) a sua fala
// e ajusta a velocidade para caber nela; as falas entram no início de cada trecho.

export type Trecho = {
  bloco: Bloco;
  fala?: string;
  /** Respiro antes da fala (s, a partir do início do trecho já visível). */
  antes: number;
  /** Respiro depois da fala (s). */
  depois?: number;
  velMin?: number;
  velMax?: number;
  /** Velocidade fixa (ignora a fala). */
  vel?: number;
  /** false quando o texto da fala já está na tela (encerramento). */
  legenda?: boolean;
};

export type OpcoesTrecho = { fala?: string; antes?: number; depois?: number; velMin?: number; velMax?: number; vel?: number; planos?: Plano[]; zoomCliques?: number };

export function criarMontagem(loc: FalaLocucao[], cfg: { url: string; transicao: number; pastaLocucao: string }) {
  const durFala = (id: string) => loc.find((f) => f.id === id)?.duracao ?? 0;
  /** Instante (s, dentro da fala) em que começa a palavra que começa com `texto`. */
  const palavra = (id: string, texto: string, ordem = 0) => loc.find((f) => f.id === id)?.palavras?.filter((p) => p.texto.startsWith(texto))[ordem]?.de ?? 0;

  /** Um trecho de tela; a velocidade sai em `fechar()`, depois que se sabe quais trechos emendam. */
  function trecho(cena: string, de: number, ate: number, o: OpcoesTrecho = {}): Trecho {
    return {
      bloco: { tipo: "tela", cena, url: cfg.url, de, ate, planos: o.planos, zoomCliques: o.zoomCliques },
      fala: o.fala,
      antes: o.antes ?? 0.45,
      depois: o.depois ?? 0.5,
      velMin: o.velMin,
      velMax: o.velMax,
      vel: o.vel,
    };
  }

  /**
   * Trechos seguidos de uma gravação em que cada momento da tela cai numa palavra da fala.
   * `ancoras` = [[tempo na gravação, tempo na fala], ...] em ordem; o primeiro trecho vai de `de`
   * até a primeira âncora e leva a fala (que entra `antes` s depois do trecho aparecer).
   * `transicao` é a do primeiro trecho (0 se ele emendar no anterior).
   */
  function sincronizar(cena: string, de: number, ancoras: [number, number][], o: { fala: string; antes?: number; transicao: number; planos?: Plano[]; zoomCliques?: number }): Trecho[] {
    const antes = o.antes ?? 0.4;
    const visual = { planos: o.planos, zoomCliques: o.zoomCliques };
    const r: Trecho[] = [];
    const ateFala0 = o.transicao * 0.5 + antes + ancoras[0][1];
    r.push({ ...trecho(cena, de, ancoras[0][0], { vel: (ancoras[0][0] - de) / ateFala0, ...visual }), fala: o.fala, antes });
    for (let k = 0; k + 1 < ancoras.length; k++) {
      const [rec0, fala0] = ancoras[k];
      const [rec1, fala1] = ancoras[k + 1];
      r.push(trecho(cena, rec0, rec1, { vel: (rec1 - rec0) / (fala1 - fala0), ...visual }));
    }
    return r;
  }

  /** Resolve velocidades, inícios e falas; devolve a edição (sem sobreposições) e funções de tempo. */
  function fechar(trechos: Trecho[]) {
    const blocos = trechos.map((x) => x.bloco);
    const base = { blocos, transicao: cfg.transicao };
    trechos.forEach((x, i) => {
      const b = x.bloco;
      if (b.tipo !== "tela") return;
      // a velocidade que faz o trecho durar a fala + respiros (+ a transição, quando há uma)
      const alvo = x.fala ? durFala(x.fala) + x.antes + (x.depois ?? 0.5) + transicaoAntes(base, i) : b.ate - b.de;
      b.velocidade = x.vel ?? Math.min(x.velMax ?? 3, Math.max(x.velMin ?? 0.6, (b.ate - b.de) / alvo));
    });
    const ini = inicios(base);
    const inicioBloco = (i: number) => ini[i];
    const fimBloco = (i: number) => ini[i] + duracaoBloco(blocos[i]);
    /** Instante do vídeo em que o momento tRec da gravação aparece dentro do bloco i. */
    const noBloco = (i: number, tRec: number) => {
      const b = blocos[i] as Extract<Bloco, { tipo: "tela" }>;
      return ini[i] + (tRec - b.de) / (b.velocidade ?? 1);
    };
    const falas = trechos.flatMap((x, i) => (x.fala ? [{ id: x.fala, em: ini[i] + transicaoAntes(base, i) * 0.5 + x.antes, legenda: x.legenda }] : []));
    const emFala = (id: string) => {
      const f = falas.find((x) => x.id === id);
      if (!f) throw new Error(`Fala sem trecho: ${id}`);
      return f.em;
    };
    /** Índice do trecho que tem a fala. */
    const idx = (fala: string) => trechos.findIndex((x) => x.fala === fala);
    const edicao: Omit<Edicao, "sobreposicoes"> = { blocos, falas, transicao: cfg.transicao, pastaLocucao: cfg.pastaLocucao };
    return { edicao, blocos, inicioBloco, fimBloco, noBloco, emFala, idx };
  }

  return { durFala, palavra, trecho, sincronizar, fechar };
}
