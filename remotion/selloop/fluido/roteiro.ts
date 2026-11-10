import { trajetos, type Gravacao, type Ponto, type Trajeto } from "../gravacao";
import type { FalaLocucao } from "../Video";

// Linha do tempo da montagem "em tomada contínua", para filmagens quadro a quadro
// (scripts/telas/filmar.mjs). A tela nunca é acelerada nem desacelerada: todo quadro em que a
// imagem muda toca em 1x, na cadência exata em que foi filmado. O ritmo vem de dois lugares em que
// não há movimento para estragar:
//   - esperas (imagem parada, cursor parado) encolhem ou são seguradas à vontade;
//   - viagens do cursor sobre imagem parada encurtam, e o cursor é redesenhado no tempo do vídeo.
// A sincronia com a locução se faz segurando um quadro parado até a palavra chegar.

export const FPS = 60;
const quadros = (s: number) => Math.round(s * FPS);
const q = (s: number) => quadros(s) / FPS;
const prender = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Aceleração e freada de uma mão (a mesma curva da filmagem). */
export const mao = (k: number) => {
  const u = prender(k, 0, 1);
  return u * u * u * (10 - 15 * u + 6 * u * u);
};

/** [m0, m1] do filme aparece em [o0, o1] do vídeo (linear; m0 = m1 é um quadro segurado). */
export type Pedaco = { m0: number; m1: number; o0: number; o1: number };
export type Tomada = { tipo: "tela"; cena: string; inicio: number; fim: number; entrada: number; pedacos: Pedaco[] };
export type Propria = { tipo: "cena"; nome: string; inicio: number; fim: number; entrada: number } | { tipo: "encerramento"; frase: string; inicio: number; fim: number; entrada: number };
export type Parte = Tomada | Propria;
export type FalaNoVideo = { id: string; em: number; legenda?: boolean };

// ── O que há em cada quadro de um filme ───────────────────────────────────────────────────────────
type Mapa = { igual: Uint8Array; viaja: Int16Array; trajetos: Trajeto[] };
const mapas = new WeakMap<Gravacao, Mapa>();
function mapaDe(g: Gravacao): Mapa {
  let m = mapas.get(g);
  if (m) return m;
  const n = quadros(g.duracao) + 2;
  const igual = new Uint8Array(n); // o quadro f tem a mesma imagem do f-1
  for (const [a, b] of g.parados ?? []) for (let f = quadros(a) + 1; f <= quadros(b) && f < n; f++) igual[f] = 1;
  const ts = trajetos(g);
  const viaja = new Int16Array(n).fill(-1); // qual trajeto do cursor está em curso entre f e f+1
  ts.forEach((t, j) => {
    for (let f = quadros(t.t); f < quadros(t.ate) && f < n; f++) viaja[f] = j;
  });
  m = { igual, viaja, trajetos: ts };
  mapas.set(g, m);
  return m;
}

const distancia = (t: Trajeto) => Math.hypot(t.para.x - t.de.x, t.para.y - t.de.y);
/** Quanto uma viagem do cursor dura no vídeo: rápida, mas dá para acompanhar. */
export const duracaoDaViagem = (dist: number) => prender(0.2 + dist / 3200, 0.24, 0.5);

export type Ritmo = {
  /** Quanto dura, no máximo, uma espera com tudo parado (s). */
  descanso?: number;
  /** Multiplica a duração das viagens do cursor (1 = duracaoDaViagem). */
  viagem?: number;
  /** false: toca tudo como foi filmado, sem encolher nada. */
  aperta?: boolean;
};

/** Trechos [m0, m1] do filme e quanto cada um dura no vídeo, de `de` a `ate`. */
function apertar(g: Gravacao, de: number, ate: number, r: Ritmo): { m0: number; m1: number; dur: number }[] {
  const { igual, viaja, trajetos: ts } = mapaDe(g);
  const fa = quadros(de);
  const fb = quadros(ate);
  const saida: { m0: number; m1: number; dur: number }[] = [];
  const classe = (f: number) => (r.aperta === false || !igual[f + 1] ? 0 : viaja[f] >= 0 ? 2 + viaja[f] : 1);
  let f = fa;
  while (f < fb) {
    const c = classe(f);
    let fim = f + 1;
    while (fim < fb && classe(fim) === c) fim++;
    const n = fim - f;
    let dur = n;
    if (c === 1) dur = Math.max(1, Math.min(n, Math.round((r.descanso ?? 0.1) * FPS)));
    else if (c >= 2) {
      const t = ts[c - 2];
      const fator = Math.min(1, (duracaoDaViagem(distancia(t)) * (r.viagem ?? 1)) / Math.max(1 / FPS, t.ate - t.t));
      dur = Math.max(Math.min(n, 2), Math.round(n * fator));
    }
    saida.push({ m0: f / FPS, m1: fim / FPS, dur: dur / FPS });
    f = fim;
  }
  return saida;
}

export function criarRoteiro(o: { filmes: Record<string, Gravacao>; locucao: FalaLocucao[]; transicao?: number }) {
  const T = o.transicao ?? 0.4;
  const partes: Parte[] = [];
  const falas: FalaNoVideo[] = [];
  let agora = 0;
  let atual: Tomada | null = null;
  let m = 0;

  const filme = (cena: string) => {
    const g = o.filmes[cena];
    if (!g) throw new Error(`Não há filme da cena ${cena}.`);
    return g;
  };
  const durFala = (id: string) => o.locucao.find((f) => f.id === id)?.duracao ?? 0;
  /** Instante (s, dentro da fala) em que começa a palavra que começa com `texto`. */
  const palavra = (id: string, texto: string, ordem = 0) => {
    const p = o.locucao.find((f) => f.id === id)?.palavras?.filter((x) => x.texto.startsWith(texto))[ordem];
    if (!p) throw new Error(`A fala ${id} não tem a palavra "${texto}".`);
    return p.de;
  };
  const emFala = (id: string) => {
    const f = falas.find((x) => x.id === id);
    if (!f) throw new Error(`A fala ${id} ainda não entrou no roteiro.`);
    return f.em;
  };
  /** Instante do vídeo em que a palavra da fala é dita. */
  const dito = (id: string, texto: string, ordem = 0) => emFala(id) + palavra(id, texto, ordem);
  const fimFala = (id: string) => emFala(id) + durFala(id);

  function fechar() {
    if (atual) atual.fim = agora;
    atual = null;
  }
  const tomada = () => {
    if (!atual) throw new Error("Não há tomada aberta.");
    return atual;
  };

  const R = {
    get agora() {
      return agora;
    },
    /** Instante do filme que está na tela. */
    get noFilme() {
      return m;
    },
    /** Posição da parte atual (a tomada aberta) na lista de partes. */
    get parte() {
      return partes.length - 1;
    },
    durFala,
    palavra,
    emFala,
    dito,
    fimFala,

    /** Começa uma tomada da cena no instante `de` do filme. Vindo de outra tela, entra deslizando. */
    abrir(cena: string, de: number, op: { entrada?: number } = {}) {
      fechar();
      filme(cena);
      const entrada = op.entrada ?? (partes.length ? T : 0.5);
      atual = { tipo: "tela", cena, inicio: agora, fim: agora, entrada, pedacos: [] };
      partes.push(atual);
      m = q(de);
      // a tela entra parada no primeiro quadro
      if (entrada > 0) R.segura(entrada);
      return agora;
    },
    /** Segura o quadro que está na tela por `dur` segundos. */
    segura(dur: number) {
      const d = q(dur);
      if (d <= 0) return agora;
      tomada().pedacos.push({ m0: m, m1: m, o0: agora, o1: q(agora + d) });
      agora = q(agora + d);
      return agora;
    },
    /** Segura o quadro até o instante `oAlvo` do vídeo (pelo menos `min` segundos). */
    seguraAte(oAlvo: number, min = 0) {
      return R.segura(Math.max(min, oAlvo - agora));
    },
    /** Toca o filme até `ate` (s do filme), encolhendo as esperas. Devolve o instante do vídeo em que chega. */
    anda(ate: number, ritmo: Ritmo = {}) {
      const t = tomada();
      const g = filme(t.cena);
      const fim = Math.min(q(ate), q(g.duracao) - 1 / FPS);
      if (fim <= m + 1e-9) return agora;
      for (const s of apertar(g, m, fim, ritmo)) {
        t.pedacos.push({ m0: s.m0, m1: s.m1, o0: agora, o1: q(agora + s.dur) });
        agora = q(agora + s.dur);
      }
      m = fim;
      return agora;
    },
    /**
     * Toca o filme até `ate` procurando durar `durAlvo` segundos: encolhe as esperas e as viagens do
     * cursor só o quanto precisa. Se nem no mais apertado couber, dura o mínimo possível.
     */
    andaEm(ate: number, durAlvo: number) {
      const t = tomada();
      const g = filme(t.cena);
      const fim = Math.min(q(ate), q(g.duracao) - 1 / FPS);
      if (fim <= m + 1e-9) return agora;
      const ritmo = (s: number): Ritmo => ({ descanso: 0.05 + s * 0.6, viagem: 1 + s * 1.2 });
      const total = (s: number) => apertar(g, m, fim, ritmo(s)).reduce((n, x) => n + x.dur, 0);
      let a = 0;
      let b = 1;
      if (total(0) >= durAlvo) b = 0;
      else if (total(1) <= durAlvo) a = 1;
      else for (let i = 0; i < 24; i++) {
        const meio = (a + b) / 2;
        if (total(meio) > durAlvo) b = meio;
        else a = meio;
      }
      return R.anda(ate, ritmo(b === 0 ? 0 : a));
    },
    /**
     * O cursor faz a viagem `t` chegando ao destino no instante `quando` do vídeo: a tela espera parada
     * (com o cursor em repouso) até a hora de ele sair. Depois de chegar, toca mais `assenta` segundos
     * do filme (o realce do item acende).
     */
    chega(t: Trajeto, quando: number, assenta = 0.26) {
      R.anda(t.t);
      R.seguraAte(quando - (t.ate - t.t));
      return R.anda(t.ate + assenta, { aperta: false });
    },
    /**
     * O clique `c` do filme acontece no instante `quando` do vídeo: a tela espera parada antes de o
     * cursor sair para ele. Se já passou da hora, o clique acontece assim que der. Depois do clique,
     * toca mais `depois` segundos do filme.
     */
    clica(c: { t: number }, quando: number, depois = 0.12) {
      const g = filme(tomada().cena);
      // a viagem que termina neste clique
      const v = [...trajetos(g)].reverse().find((x) => x.ate <= c.t + 1e-6 && x.ate > c.t - 0.35);
      const sai = v && v.t >= m - 1e-6 ? v.t : m;
      R.anda(sai);
      R.seguraAte(quando - (c.t - sai));
      return R.anda(c.t + depois, { aperta: false });
    },
    /** Uma cena desenhada pelo próprio vídeo (ex.: o celular) ou o encerramento. */
    cena(nome: string, dur: number, op: { entrada?: number } = {}) {
      fechar();
      partes.push({ tipo: "cena", nome, inicio: agora, fim: q(agora + dur), entrada: op.entrada ?? T });
      agora = q(agora + dur);
      return agora;
    },
    /**
     * O encerramento: a frase na tela e a fala final (sem legenda, porque a frase já está escrita).
     * Dura o bastante para a fala terminar e sobrar um respiro (`depois`), e nunca menos que `minimo`:
     * o vídeo acaba junto com ele, com o cartão na tela até o último quadro.
     */
    encerramento(frase: string, op: { fala?: string; antes?: number; depois?: number; minimo?: number; entrada?: number } = {}) {
      fechar();
      const antes = op.antes ?? 0.5;
      const dur = Math.max(op.minimo ?? 4.9, op.fala ? antes + durFala(op.fala) + (op.depois ?? 1.5) : 0);
      const inicio = agora;
      partes.push({ tipo: "encerramento", frase, inicio, fim: q(inicio + dur), entrada: op.entrada ?? T });
      agora = q(inicio + dur);
      if (op.fala) R.fala(op.fala, { em: inicio + antes, legenda: false });
      return agora;
    },
    /** A fala entra em `em` (padrão: agora). Não pode começar antes de a anterior terminar. */
    fala(id: string, op: { em?: number; legenda?: boolean } = {}) {
      if (!o.locucao.some((f) => f.id === id)) throw new Error(`Não existe a fala ${id}.`);
      const em = q(op.em ?? agora);
      const ant = falas[falas.length - 1];
      if (ant && em < ant.em + durFala(ant.id) + 0.05) throw new Error(`A fala ${id} (${em.toFixed(2)} s) começa antes de ${ant.id} terminar (${(ant.em + durFala(ant.id)).toFixed(2)} s).`);
      falas.push({ id, em, legenda: op.legenda });
      return em;
    },
    /**
     * Instante do vídeo em que o instante `mt` do filme da cena aparece (a primeira vez; `ordem` escolhe
     * outra tomada que também mostre esse instante).
     */
    saida(cena: string, mt: number, ordem = 0) {
      let n = 0;
      for (const p of partes) {
        if (p.tipo !== "tela" || p.cena !== cena) continue;
        const primeiro = p.pedacos.find((x) => x.m1 > x.m0);
        const ultimo = [...p.pedacos].reverse().find((x) => x.m1 > x.m0);
        if (!primeiro || !ultimo || mt < primeiro.m0 - 1e-6 || mt > ultimo.m1 + 1e-6) continue;
        if (n++ !== ordem) continue;
        for (const x of p.pedacos) if (x.m1 > x.m0 && mt <= x.m1 + 1e-6) return x.o0 + (prender(mt, x.m0, x.m1) - x.m0) * ((x.o1 - x.o0) / (x.m1 - x.m0));
      }
      throw new Error(`O instante ${mt.toFixed(2)} s de ${cena} não aparece no vídeo.`);
    },
    pronto() {
      fechar();
      return { partes, falas, duracao: agora };
    },
  };
  return R;
}

// ── Consultas sobre uma tomada pronta (na hora de desenhar) ───────────────────────────────────────

/** Instante do filme que está na tela no instante `o` do vídeo. */
export function noFilme(t: Tomada, o: number): number {
  const ps = t.pedacos;
  if (!ps.length) return 0;
  if (o <= ps[0].o0) return ps[0].m0;
  let lo = 0;
  let hi = ps.length - 1;
  if (o >= ps[hi].o1) return ps[hi].m1;
  while (lo < hi) {
    const meio = (lo + hi) >> 1;
    if (ps[meio].o1 <= o) lo = meio + 1;
    else hi = meio;
  }
  const p = ps[lo];
  return p.o1 > p.o0 ? p.m0 + ((o - p.o0) / (p.o1 - p.o0)) * (p.m1 - p.m0) : p.m0;
}

/** Instante do vídeo em que o instante `mt` do filme aparece nesta tomada (preso às bordas dela). */
export function naSaida(t: Tomada, mt: number): number {
  for (const x of t.pedacos) if (x.m1 > x.m0 && mt <= x.m1 + 1e-6) return x.o0 + (prender(mt, x.m0, x.m1) - x.m0) * ((x.o1 - x.o0) / (x.m1 - x.m0));
  return t.pedacos.length ? t.pedacos[t.pedacos.length - 1].o1 : t.inicio;
}

const noArco = (t: Trajeto, k: number): Ponto => ({
  x: (1 - k) * (1 - k) * t.de.x + 2 * (1 - k) * k * t.c.x + k * k * t.para.x,
  y: (1 - k) * (1 - k) * t.de.y + 2 * (1 - k) * k * t.c.y + k * k * t.para.y,
});

type Viagem = { o0: number; o1: number; t: Trajeto };
const viagens = new WeakMap<Tomada, Viagem[]>();

/**
 * Onde o cursor está no instante `o` do vídeo. Cada viagem é redesenhada no tempo do vídeo: sai e
 * chega nos instantes em que saiu e chegou no filme, com a mesma curva, numa aceleração só — mesmo
 * que a espera no meio dela tenha sido encolhida.
 */
export function cursorEm(t: Tomada, g: Gravacao, o: number): Ponto {
  let vs = viagens.get(t);
  if (!vs) {
    const mIni = t.pedacos.find((x) => x.m1 > x.m0)?.m0 ?? 0;
    const mFim = [...t.pedacos].reverse().find((x) => x.m1 > x.m0)?.m1 ?? 0;
    vs = trajetos(g)
      .filter((x) => x.ate > mIni && x.t < mFim)
      .map((x) => ({ o0: naSaida(t, Math.max(x.t, mIni)), o1: naSaida(t, Math.min(x.ate, mFim)), t: x }));
    viagens.set(t, vs);
  }
  const mIni = t.pedacos.find((x) => x.m1 > x.m0)?.m0 ?? 0;
  let pos: Ponto | null = null;
  for (const v of vs) {
    if (o < v.o0) break;
    if (o <= v.o1 && v.o1 > v.o0) {
      // a parte da viagem que esta tomada mostra (inteira, quase sempre)
      const k0 = v.t.t < mIni ? (mIni - v.t.t) / (v.t.ate - v.t.t) : 0;
      const u = (o - v.o0) / (v.o1 - v.o0);
      return noArco(v.t, mao(k0) + (1 - mao(k0)) * mao(u));
    }
    pos = v.t.para;
  }
  if (pos) return pos;
  // antes da primeira viagem: onde o cursor estava no começo da tomada
  const antes = [...trajetos(g)].reverse().find((x) => x.ate <= mIni + 1e-6);
  if (antes) return antes.para;
  const primeiro = vs[0]?.t.de ?? g.eventos.find((e) => e.tipo === "mouse");
  return primeiro ? { x: primeiro.x, y: primeiro.y } : { x: g.largura / 2, y: g.altura / 2 };
}
