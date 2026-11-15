import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apagarMeus, carregarMeus, salvarMeu } from "./armazenamento";
import { COMENTARIOS, EU, NOTIFICACOES, POSTS, REPOSTS, SEGUINDO_INICIAL, STORIES, USUARIOS } from "./dados";
import { PESOS, pontuar, pontuarReel, type Nota, type Sinais } from "./ranking";
import type { Comentario, Evento, Notificacao, Post, Story, Usuario } from "./tipos";

// O "back-end" da demo. Cada ação faz o que um servidor faria (grava, atualiza contador, notifica,
// registra sinal para o ranking) e deixa um Evento explicando os passos — é o que o Raio-X mostra.

type Estado = {
  curtidos: Record<string, boolean>;
  salvos: Record<string, boolean>;
  repostados: Record<string, number>;
  seguindo: Record<string, boolean>;
  afinidade: Record<string, number>;
  interesse: Record<string, number>;
  assistido: Record<string, number>;
  comentarios: Comentario[];
  curtidasComentario: Record<string, boolean>;
  storiesVistos: Record<string, boolean>;
  votos: Record<string, 0 | 1>;
  /** Curtidas extras de um post "bombando" (simulação do modo demo). */
  impulso: Record<string, number>;
  notificacoes: Notificacao[];
  curtidasRecebidas: Record<string, number>;
  eventos: Evento[];
  ordemFeed: string[];
  ordemReels: string[];
};

const CHAVE = "flagra-estado-v2";

const inicial = (): Estado => ({
  curtidos: {},
  salvos: {},
  repostados: {},
  seguindo: Object.fromEntries(SEGUINDO_INICIAL.map((u) => [u, true])),
  afinidade: {},
  interesse: {},
  assistido: {},
  comentarios: [],
  curtidasComentario: {},
  storiesVistos: {},
  votos: {},
  impulso: {},
  notificacoes: [],
  curtidasRecebidas: {},
  eventos: [],
  ordemFeed: [],
  ordemReels: [],
});

function carregar(): Estado {
  try {
    const s = localStorage.getItem(CHAVE);
    if (s) return { ...inicial(), ...JSON.parse(s) };
  } catch {
    /* sem storage */
  }
  return inicial();
}

export type ItemFeed = { chave: string; post: Post; via?: string; nota: Nota };

const numero = (n: number) => n.toLocaleString("pt-BR");
let seq = 0;
const novoId = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

function somar(mapa: Record<string, number>, chaves: string[], d: number) {
  const m = { ...mapa };
  for (const k of chaves) m[k] = Math.max(0, (m[k] ?? 0) + d);
  return m;
}

function useLojaInterna() {
  const [e, setE] = useState<Estado>(carregar);
  const [meus, setMeus] = useState<Post[]>([]);
  const [raioX, setRaioX] = useState(false);
  /** Post em destaque no modo demo (o Raio-X dele abre sozinho). */
  const [destaque, setDestaque] = useState<string>();
  /** Com o modo demo ligado, o cartão da demo mostra os eventos e o painel do Raio-X fica escondido. */
  const [modoDemo, setModoDemo] = useState(false);
  const estado = useRef(e);
  estado.current = e;

  useEffect(() => void carregarMeus().then(setMeus), []);
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ ...e, eventos: e.eventos.slice(0, 40) }));
    } catch {
      /* sem storage */
    }
  }, [e]);

  const todos = useMemo(() => [...meus, ...POSTS], [meus]);
  const porId = useMemo(() => new Map(todos.map((p) => [p.id, p])), [todos]);
  const usuarios = useMemo(() => new Map(USUARIOS.map((u) => [u.id, u])), []);
  const usuario = useCallback((id: string): Usuario => usuarios.get(id) ?? { id, nome: id, seguidores: 0, seguindo: 0 }, [usuarios]);

  const sinais: Sinais = { seguindo: e.seguindo, afinidade: e.afinidade, interesse: e.interesse };

  /** Contadores como o app mostra: valor do banco + o que você fez agora. */
  const contagem = useCallback(
    (p: Post) => ({
      curtidas: p.curtidas + (p.meu ? e.curtidasRecebidas[p.id] ?? 0 : 0) + (e.curtidos[p.id] ? 1 : 0) + (e.impulso[p.id] ?? 0),
      comentarios: p.comentarios + e.comentarios.filter((c) => c.postId === p.id).length + Math.round((e.impulso[p.id] ?? 0) * 0.04),
      reposts: p.reposts + (e.repostados[p.id] ? 1 : 0) + Math.round((e.impulso[p.id] ?? 0) * 0.12),
      salvos: p.salvos + (e.salvos[p.id] ? 1 : 0),
    }),
    [e],
  );
  const comContagem = (p: Post): Post => ({ ...p, ...contagem(p) });

  const registrar = (ev: Omit<Evento, "id" | "em">) => setE((s) => ({ ...s, eventos: [{ ...ev, id: novoId(), em: Date.now() }, ...s.eventos].slice(0, 60) }));

  // ── Feed ────────────────────────────────────────────────────────────────
  const candidatosFeed = useCallback((): ItemFeed[] => {
    const s = estado.current;
    const sin: Sinais = { seguindo: s.seguindo, afinidade: s.afinidade, interesse: s.interesse };
    const itens = new Map<string, ItemFeed>();
    for (const p of todos) {
      if (p.tipo !== "post") continue;
      const pc = comContagem(p);
      itens.set(p.id, { chave: p.id, post: pc, nota: pontuar(pc, sin) });
    }
    // Repost de alguém que você segue pode trazer um post de quem você não segue.
    for (const r of REPOSTS) {
      const p = porId.get(r.postId);
      if (!p || !s.seguindo[r.por] || s.seguindo[p.autor]) continue;
      const pc = comContagem(p);
      const nota = pontuar(pc, sin, Date.now(), r.por);
      const atual = itens.get(p.id);
      if (!atual || nota.total > atual.nota.total) itens.set(p.id, { chave: p.id, post: pc, via: r.por, nota });
    }
    return [...itens.values()];
  }, [todos, porId, e]); // eslint-disable-line react-hooks/exhaustive-deps

  const feed = useMemo(() => {
    const itens = candidatosFeed();
    const pos = new Map(e.ordemFeed.map((k, i) => [k, i]));
    // Sem ordem salva: ordena pela nota. Com ordem: mantém a da última atualização (o feed não pula enquanto você rola);
    // post novo seu vai para o topo.
    return itens.sort((a, b) => {
      const pa = pos.get(a.chave);
      const pb = pos.get(b.chave);
      if (pa === undefined && pb === undefined) return b.nota.total - a.nota.total;
      if (pa === undefined) return a.post.meu ? -1 : 1;
      if (pb === undefined) return b.post.meu ? 1 : -1;
      return pa - pb;
    });
  }, [candidatosFeed, e.ordemFeed]);

  const reels = useMemo(() => {
    const itens = todos
      .filter((p) => p.tipo === "reel")
      .map((p) => {
        const pc = comContagem(p);
        return { chave: p.id, post: pc, nota: pontuarReel(pc, sinais, e.assistido) };
      });
    const pos = new Map(e.ordemReels.map((k, i) => [k, i]));
    return itens.sort((a, b) => {
      const pa = pos.get(a.chave);
      const pb = pos.get(b.chave);
      if (pa === undefined || pb === undefined) return pa === undefined && pb === undefined ? b.nota.total - a.nota.total : pa === undefined ? -1 : 1;
      return pa - pb;
    });
  }, [todos, e]); // eslint-disable-line react-hooks/exhaustive-deps

  const recalcularFeed = () => {
    const itens = candidatosFeed().sort((a, b) => b.nota.total - a.nota.total);
    setE((s) => ({ ...s, ordemFeed: itens.map((i) => i.chave) }));
    const top = itens.slice(0, 3).map((i, n) => `${n + 1}º ${i.post.id} (nota ${i.nota.total.toFixed(2)}: ${i.nota.motivos[0]})`);
    registrar({
      icone: "🔄",
      titulo: "Feed recalculado",
      passos: [`${itens.length} posts candidatos: de quem você segue + reposts de quem você segue`, "cada um ganha nota = afinidade × interesse × engajamento × frescor", "ordena da maior nota para a menor", ...top],
    });
  };

  const recalcularReels = () => {
    const itens = todos
      .filter((p) => p.tipo === "reel")
      .map((p) => ({ id: p.id, nota: pontuarReel(comContagem(p), sinais, estado.current.assistido) }))
      .sort((a, b) => b.nota.total - a.nota.total);
    setE((s) => ({ ...s, ordemReels: itens.map((i) => i.id) }));
  };

  // ── Ações ───────────────────────────────────────────────────────────────
  const curtir = (p: Post, forcar?: boolean) => {
    const ja = !!estado.current.curtidos[p.id];
    const vai = forcar ?? !ja;
    if (vai === ja) return;
    const antes = contagem(p).curtidas;
    setE((s) => ({
      ...s,
      curtidos: { ...s.curtidos, [p.id]: vai },
      afinidade: somar(s.afinidade, [p.autor], vai ? 1 : -1),
      interesse: somar(s.interesse, p.tags, vai ? PESOS.curtida : -PESOS.curtida),
    }));
    registrar(
      vai
        ? {
            icone: "❤️",
            titulo: `Curtida em ${p.tipo === "reel" ? "reel" : "post"} de @${p.autor}`,
            passos: [
              `grava a linha (você, ${p.id}) na tabela curtidas — a chave única impede curtir duas vezes`,
              `contador do post: ${numero(antes)} → ${numero(antes + 1)}`,
              `notificação para @${p.autor}: "você curtiu"`,
              `sinal para o ranking: ${p.tags.map((t) => `#${t}`).join(" ")} +${PESOS.curtida} · afinidade com @${p.autor} +1`,
            ],
          }
        : {
            icone: "🤍",
            titulo: `Descurtiu post de @${p.autor}`,
            passos: [`apaga a linha (você, ${p.id}) de curtidas`, `contador: ${numero(antes)} → ${numero(antes - 1)}`, "a notificação some e os sinais voltam"],
          },
    );
  };

  const comentar = (p: Post, texto: string, respostaDe?: Comentario) => {
    const c: Comentario = { id: novoId(), postId: p.id, autor: EU, texto, criadoEm: Date.now(), curtidas: 0, respostaDe: respostaDe?.id };
    const antes = contagem(p).comentarios;
    setE((s) => ({
      ...s,
      comentarios: [...s.comentarios, c],
      afinidade: somar(s.afinidade, [p.autor], 2),
      interesse: somar(s.interesse, p.tags, PESOS.comentario),
    }));
    registrar({
      icone: "💬",
      titulo: respostaDe ? `Resposta a @${respostaDe.autor}` : `Comentário no post de @${p.autor}`,
      passos: [
        `grava em comentarios (post: ${p.id}, autor: você, texto${respostaDe ? `, resposta_de: ${respostaDe.id}` : ""})`,
        `contador de comentários: ${numero(antes)} → ${numero(antes + 1)}`,
        respostaDe ? `notifica @${respostaDe.autor} (dono do comentário) e @${p.autor} (dono do post)` : `notifica @${p.autor}`,
        `comentário pesa ${PESOS.comentario}× uma curtida: ${p.tags.map((t) => `#${t}`).join(" ")} +${PESOS.comentario} · afinidade +2`,
      ],
    });
  };

  const curtirComentario = (c: Comentario) => {
    const vai = !estado.current.curtidasComentario[c.id];
    setE((s) => ({ ...s, curtidasComentario: { ...s.curtidasComentario, [c.id]: vai } }));
    if (vai) registrar({ icone: "❤️", titulo: `Curtiu o comentário de @${c.autor}`, passos: ["grava em curtidas_comentario (você, comentário)", "comentários mais curtidos sobem para o topo da lista", `notifica @${c.autor}`] });
  };

  const repostar = (p: Post) => {
    const vai = !estado.current.repostados[p.id];
    setE((s) => {
      const repostados = { ...s.repostados };
      if (vai) repostados[p.id] = Date.now();
      else delete repostados[p.id];
      return { ...s, repostados, afinidade: somar(s.afinidade, [p.autor], vai ? 3 : -3), interesse: somar(s.interesse, p.tags, vai ? PESOS.repost : -PESOS.repost) };
    });
    const eu = usuario(EU);
    registrar(
      vai
        ? {
            icone: "🔁",
            titulo: `Repost do post de @${p.autor}`,
            passos: [
              `grava (você, ${p.id}) na tabela reposts — o post não é copiado, só referenciado`,
              "aparece no seu perfil, na aba Reposts",
              `entra no feed dos seus ${numero(eu.seguidores)} seguidores com "voce repostou" — mesmo de quem não segue @${p.autor}`,
              `repost pesa ${PESOS.repost}× uma curtida: é o sinal mais forte de que o conteúdo vale ser espalhado`,
            ],
          }
        : { icone: "↩️", titulo: "Repost desfeito", passos: [`apaga (você, ${p.id}) de reposts`, "sai do seu perfil e do feed dos seus seguidores"] },
    );
  };

  const salvar = (p: Post) => {
    const vai = !estado.current.salvos[p.id];
    setE((s) => ({ ...s, salvos: { ...s.salvos, [p.id]: vai }, interesse: somar(s.interesse, p.tags, vai ? PESOS.salvo : -PESOS.salvo) }));
    if (vai)
      registrar({
        icone: "🔖",
        titulo: "Post salvo",
        passos: ["grava em salvos (você, post) — só você vê essa lista", `ninguém é notificado, mas o ranking vê: salvar pesa ${PESOS.salvo}× uma curtida`],
      });
  };

  const seguir = (id: string) => {
    const vai = !estado.current.seguindo[id];
    setE((s) => ({ ...s, seguindo: { ...s.seguindo, [id]: vai } }));
    registrar(
      vai
        ? {
            icone: "➕",
            titulo: `Seguindo @${id}`,
            passos: [`grava (você → @${id}) na tabela seguidores`, `contador de seguidores de @${id} +1`, `a partir da próxima atualização, os posts de @${id} entram no seu feed com afinidade 1 (antes: 0,35)`],
          }
        : { icone: "➖", titulo: `Deixou de seguir @${id}`, passos: [`apaga (você → @${id}) de seguidores`, "os posts dele só aparecem se alguém que você segue repostar"] },
    );
  };

  const assistir = (p: Post, segundos: number, duracao: number) => {
    if (segundos < 0.5) return;
    const pct = Math.min(1, segundos / (duracao || 8));
    const bonus = pct > 0.9 ? 2 : pct > 0.5 ? 1 : 0;
    setE((s) => ({
      ...s,
      assistido: { ...s.assistido, [p.id]: (s.assistido[p.id] ?? 0) + segundos },
      interesse: bonus ? somar(s.interesse, p.tags, bonus) : s.interesse,
    }));
    registrar({
      icone: "👀",
      titulo: `Assistiu ${segundos.toFixed(1)} s do reel de @${p.autor}`,
      passos: [
        `o app manda a visualização com o tempo assistido: ${Math.round(pct * 100)}% do vídeo`,
        bonus ? `passou de ${pct > 0.9 ? "90" : "50"}%: ${p.tags.map((t) => `#${t}`).join(" ")} +${bonus} — nos Reels, ver até o fim vale mais que curtir` : "pulou antes da metade: sinal fraco (ou negativo) para esse tema",
        "a ordem dos próximos Reels é recalculada com esse sinal",
      ],
    });
  };

  const verStory = (st: Story) => {
    if (estado.current.storiesVistos[st.id]) return;
    setE((s) => ({ ...s, storiesVistos: { ...s.storiesVistos, [st.id]: true } }));
    const resto = STORIES.filter((x) => x.autor === st.autor && x.id !== st.id && !estado.current.storiesVistos[x.id]).length;
    registrar({
      icone: "👁️",
      titulo: `Story de @${st.autor} visto`,
      passos: [
        `grava (você, ${st.id}) em visualizacoes_story: @${st.autor} vê seu nome na lista "visto por"`,
        resto > 0 ? `ainda faltam ${resto} story(s) de @${st.autor}: o anel continua colorido` : `você viu todos os stories de @${st.autor}: o anel fica cinza e ela vai para o fim da fila`,
        "o story some sozinho 24 h depois de postado (o arquivo pode ir para os Destaques)",
      ],
    });
  };

  const votarEnquete = (st: Story, opcao: 0 | 1) => {
    if (!st.enquete || estado.current.votos[st.id] !== undefined) return;
    setE((s) => ({ ...s, votos: { ...s.votos, [st.id]: opcao }, afinidade: somar(s.afinidade, [st.autor], 2) }));
    const v = [...st.enquete.votos] as [number, number];
    v[opcao] += 1;
    const pct = Math.round((v[opcao] / (v[0] + v[1])) * 100);
    registrar({
      icone: "🗳️",
      titulo: `Voto na enquete de @${st.autor}`,
      passos: [
        `grava (você, ${st.id}, "${st.enquete.opcoes[opcao]}") em votos — um voto por pessoa`,
        `soma no total da opção e devolve a porcentagem: ${st.enquete.opcoes[opcao]} ${pct}%`,
        `@${st.autor} vê quem votou em quê`,
        "votar é interação: afinidade com a pessoa +2, e os stories dela passam a aparecer primeiro",
      ],
    });
  };

  /** Simula um post "bombando": curtidas chegando rápido durante alguns segundos. */
  const impulsionar = (p: Post, segundos = 8) => {
    const antes = contagem(p).curtidas;
    let total = 0;
    const id = window.setInterval(() => {
      const d = 400 + Math.floor(Math.random() * 900);
      total += d;
      setE((s) => ({ ...s, impulso: { ...s.impulso, [p.id]: (s.impulso[p.id] ?? 0) + d } }));
    }, 250);
    window.setTimeout(() => {
      window.clearInterval(id);
      registrar({
        icone: "🚀",
        titulo: `${p.tipo === "reel" ? "Reel" : "Post"} de @${p.autor} bombando`,
        passos: [
          `+${numero(total)} curtidas em ${segundos} s (${numero(antes)} → ${numero(antes + total)}), com comentários e reposts junto`,
          "o engajamento entra na nota em escala logarítmica: sobe, mas sem atropelar todo o resto",
          "nos Reels, reação rápida nas primeiras horas faz o vídeo ser testado com quem não segue o autor",
        ],
      });
    }, segundos * 1000);
  };

  const reiniciar = () => {
    setE(inicial());
    setRaioX(false);
    setDestaque(undefined);
  };

  const postar = async (dados: { legenda: string; local: string; tags: string[]; arquivo: File }) => {
    const reel = dados.arquivo.type.startsWith("video");
    const novo = await salvarMeu(
      { id: `meu-${novoId()}`, autor: EU, tipo: reel ? "reel" : "post", legenda: dados.legenda, tags: dados.tags, local: dados.local || undefined, criadoEm: Date.now(), curtidas: 0, comentarios: 0, reposts: 0, salvos: 0, visualizacoes: 0, meu: true },
      dados.arquivo,
    );
    setMeus((m) => [novo, ...m]);
    const eu = usuario(EU);
    registrar({
      icone: "📤",
      titulo: reel ? "Reel publicado" : "Post publicado",
      passos: [
        "o arquivo sobe para o storage e a linha do post vai para a tabela posts",
        `fan-out: o post entra como candidato no feed dos seus ${numero(eu.seguidores)} seguidores`,
        "cada seguidor vê em uma posição diferente: depende da nota de cada um",
        "as primeiras reações decidem se ele é mostrado para mais gente (engajamento)",
      ],
    });
    // Simula as primeiras curtidas chegando dos seguidores.
    const fas = USUARIOS.filter((u) => u.id !== EU).sort(() => Math.random() - 0.5).slice(0, 7);
    fas.forEach((u, i) =>
      window.setTimeout(() => {
        setE((s) => ({
          ...s,
          curtidasRecebidas: { ...s.curtidasRecebidas, [novo.id]: (s.curtidasRecebidas[novo.id] ?? 0) + 1 + Math.floor(Math.random() * 3) },
          notificacoes: [{ id: novoId(), de: u.id, tipo: i === 3 ? "comentario" : "curtida", postId: novo.id, texto: i === 3 ? "que flagra 😂" : undefined, em: Date.now() }, ...s.notificacoes],
          comentarios: i === 3 ? [...s.comentarios, { id: novoId(), postId: novo.id, autor: u.id, texto: "que flagra 😂", criadoEm: Date.now(), curtidas: 0 }] : s.comentarios,
        }));
      }, 1800 + i * 1500),
    );
    return novo;
  };

  const zerar = async () => {
    await apagarMeus();
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* nada */
    }
    location.reload();
  };

  const comentariosDe = (postId: string) => [...COMENTARIOS.filter((c) => c.postId === postId), ...e.comentarios.filter((c) => c.postId === postId)];

  return {
    estado: e,
    meus: meus.map(comContagem),
    todos: todos.map(comContagem),
    feed,
    reels,
    stories: STORIES,
    notificacoes: [...e.notificacoes, ...NOTIFICACOES],
    raioX,
    setRaioX,
    destaque,
    setDestaque,
    modoDemo,
    setModoDemo,
    usuario,
    contagem,
    comentariosDe,
    porId: (id: string) => {
      const p = porId.get(id);
      return p ? comContagem(p) : undefined;
    },
    acoes: { curtir, comentar, curtirComentario, repostar, salvar, seguir, assistir, verStory, votarEnquete, impulsionar, postar, recalcularFeed, recalcularReels, zerar, reiniciar },
  };
}

type Loja = ReturnType<typeof useLojaInterna>;
const Contexto = createContext<Loja | null>(null);

export function ProvedorLoja({ children }: { children: React.ReactNode }) {
  const loja = useLojaInterna();
  return <Contexto.Provider value={loja}>{children}</Contexto.Provider>;
}

export function useLoja() {
  const l = useContext(Contexto);
  if (!l) throw new Error("useLoja fora do ProvedorLoja");
  return l;
}
