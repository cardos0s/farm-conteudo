import React, { useMemo, useState } from "react";
import { Avatar, Nome } from "../componentes/Avatar";
import { Icone } from "../componentes/Icone";
import { PostFeed } from "../componentes/PostFeed";
import { CREDITOS, EU } from "../motor/dados";
import { useLoja } from "../motor/loja";
import { pontuar } from "../motor/ranking";
import type { Post } from "../motor/tipos";
import { curto, tempo } from "../util";

function Miniatura({ p, onClick, alta }: { p: Post; onClick: () => void; alta?: boolean }) {
  return (
    <button className={`mini ${alta ? "alta" : ""}`} onClick={onClick}>
      {p.midia.tipo === "video" ? <video src={p.midia.url} muted playsInline preload="metadata" /> : <img src={p.midia.url} alt="" loading="lazy" />}
      {p.tipo === "reel" && (
        <span className="mini-reel">
          <Icone nome="reels" tam={18} />
        </span>
      )}
    </button>
  );
}

/** Explorar: o que você ainda não segue, ordenado pelo seu interesse nos temas. */
export function Explorar({ onAbrir }: { onAbrir: (p: Post) => void }) {
  const { todos, estado } = useLoja();
  const [busca, setBusca] = useState("");
  const lista = useMemo(() => {
    const sinais = { seguindo: {}, afinidade: estado.afinidade, interesse: estado.interesse };
    const q = busca.trim().toLowerCase().replace(/^#/, "");
    return todos
      .filter((p) => !p.meu)
      .filter((p) => !q || p.tags.some((t) => t.includes(q)) || p.autor.includes(q) || p.legenda.toLowerCase().includes(q))
      .map((p) => ({ p, n: pontuar(p, sinais).total }))
      .sort((a, b) => b.n - a.n)
      .map((x) => x.p);
  }, [todos, estado, busca]);
  return (
    <div className="tela rolavel">
      <div className="busca">
        <Icone nome="lupa" tam={18} />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar (ex.: jacare)" />
      </div>
      <div className="grade explorar">
        {lista.map((p, i) => (
          <Miniatura key={p.id} p={p} alta={p.tipo === "reel" && i % 5 === 2} onClick={() => onAbrir(p)} />
        ))}
      </div>
    </div>
  );
}

/** Perfil (seu ou de outra pessoa) com abas: posts, reels, reposts e salvos. */
export function Perfil({ id, onVoltar, onAbrir, onCriar }: { id: string; onVoltar?: () => void; onAbrir: (p: Post) => void; onCriar: () => void }) {
  const { usuario, todos, estado, acoes, porId } = useLoja();
  const u = usuario(id);
  const eu = id === EU;
  const [aba, setAba] = useState<"posts" | "reels" | "reposts" | "salvos">("posts");
  const [creditos, setCreditos] = useState(false);
  const segue = !!estado.seguindo[id];
  const deles = todos.filter((p) => p.autor === id);
  const reposts = eu
    ? Object.entries(estado.repostados).sort((a, b) => b[1] - a[1]).map(([pid]) => porId(pid)).filter(Boolean) as Post[]
    : [];
  const salvos = eu ? (Object.keys(estado.salvos).filter((k) => estado.salvos[k]).map(porId).filter(Boolean) as Post[]) : [];
  const lista = aba === "posts" ? deles.filter((p) => p.tipo === "post") : aba === "reels" ? deles.filter((p) => p.tipo === "reel") : aba === "reposts" ? reposts : salvos;
  const seguindoN = eu ? Object.values(estado.seguindo).filter(Boolean).length : u.seguindo;
  const seguidoresN = u.seguidores + (!eu && segue ? 1 : 0);

  return (
    <div className="tela rolavel">
      <header className="perfil-barra">
        {onVoltar ? (
          <button onClick={onVoltar} aria-label="Voltar">
            <Icone nome="voltar" tam={24} />
          </button>
        ) : (
          <span />
        )}
        <Nome u={u} className="perfil-nome-topo" />
        {eu ? (
          <button onClick={onCriar} aria-label="Criar">
            <Icone nome="mais" tam={24} />
          </button>
        ) : (
          <Icone nome="pontos" tam={22} />
        )}
      </header>
      <section className="perfil-cabeca">
        <Avatar u={u} tam={86} />
        <div className="perfil-numeros">
          <span>
            <b>{deles.length}</b>posts
          </span>
          <span>
            <b>{curto(seguidoresN)}</b>seguidores
          </span>
          <span>
            <b>{curto(seguindoN)}</b>seguindo
          </span>
        </div>
      </section>
      <div className="perfil-bio">
        <b>{u.nome}</b>
        {u.bio && <p>{u.bio}</p>}
      </div>
      <div className="perfil-botoes">
        {eu ? (
          <>
            <button>Editar perfil</button>
            <button onClick={() => setCreditos(true)}>Créditos das fotos</button>
          </>
        ) : (
          <>
            <button className={segue ? "" : "azul"} onClick={() => acoes.seguir(id)}>
              {segue ? "Seguindo" : "Seguir"}
            </button>
            <button>Mensagem</button>
          </>
        )}
      </div>
      <nav className="perfil-abas">
        {(eu ? (["posts", "reels", "reposts", "salvos"] as const) : (["posts", "reels"] as const)).map((a) => (
          <button key={a} className={aba === a ? "ativa" : ""} onClick={() => setAba(a)}>
            <Icone nome={a === "posts" ? "grade" : a === "reels" ? "reels" : a === "reposts" ? "repost" : "salvar"} tam={22} />
          </button>
        ))}
      </nav>
      {lista.length === 0 ? (
        <p className="perfil-vazio">
          {aba === "reposts" ? "Os posts que você repostar aparecem aqui." : aba === "salvos" ? "Só você vê o que salvou." : eu ? "Toque em + para publicar seu primeiro flagra." : "Nada por aqui ainda."}
        </p>
      ) : (
        <div className="grade">
          {lista.map((p) => (
            <Miniatura key={p.id} p={p} onClick={() => onAbrir(p)} />
          ))}
        </div>
      )}
      {creditos && (
        <div className="veu" onClick={() => setCreditos(false)}>
          <section className="folha alta" onClick={(e) => e.stopPropagation()}>
            <div className="pegador" />
            <header className="folha-topo">Créditos das fotos</header>
            <ul className="creditos">
              {Object.entries(CREDITOS).map(([k, c]) => (
                <li key={k}>
                  <b>{c.titulo || k}</b> — {c.autor}, {c.licenca}.{" "}
                  <a href={c.fonte ?? undefined} target="_blank" rel="noreferrer">
                    fonte
                  </a>
                </li>
              ))}
              <li className="nota">Pessoas e histórias do app são fictícias. Fotos via Openverse/Flickr, com cores ajustadas para o app (tom de fim de tarde) e recortes.</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

/** Notificações: o lado de quem recebe a curtida, o comentário, o repost, o novo seguidor. */
export function Atividade({ onVoltar, onPerfil }: { onVoltar: () => void; onPerfil: (id: string) => void }) {
  const { notificacoes, usuario, porId, estado, acoes } = useLoja();
  const texto = { curtida: "curtiu seu post.", comentario: "comentou:", seguir: "começou a seguir você.", repost: "repostou seu post." };
  return (
    <div className="tela rolavel">
      <header className="perfil-barra">
        <button onClick={onVoltar} aria-label="Voltar">
          <Icone nome="voltar" tam={24} />
        </button>
        <b>Notificações</b>
        <span />
      </header>
      <ul className="notificacoes">
        {notificacoes.map((n) => {
          const u = usuario(n.de);
          const p = n.postId ? porId(n.postId) : undefined;
          return (
            <li key={n.id}>
              <button onClick={() => onPerfil(u.id)}>
                <Avatar u={u} tam={44} />
              </button>
              <p>
                <b>{u.id}</b> {texto[n.tipo]} {n.texto} <time>{tempo(n.em)}</time>
              </p>
              {n.tipo === "seguir" ? (
                <button className={`mini-botao ${estado.seguindo[u.id] ? "" : "azul"}`} onClick={() => acoes.seguir(u.id)}>
                  {estado.seguindo[u.id] ? "Seguindo" : "Seguir de volta"}
                </button>
              ) : p ? (
                p.midia.tipo === "video" ? <video src={p.midia.url} className="notif-mini" muted /> : <img src={p.midia.url} className="notif-mini" alt="" />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Um post aberto sozinho (vindo do Explorar ou do perfil). */
export function Detalhe({ post, onVoltar, onComentarios, onCompartilhar, onPerfil }: { post: Post; onVoltar: () => void; onComentarios: () => void; onCompartilhar: () => void; onPerfil: (id: string) => void }) {
  const { estado } = useLoja();
  const nota = pontuar(post, { seguindo: estado.seguindo, afinidade: estado.afinidade, interesse: estado.interesse });
  return (
    <div className="tela rolavel">
      <header className="perfil-barra">
        <button onClick={onVoltar} aria-label="Voltar">
          <Icone nome="voltar" tam={24} />
        </button>
        <b>Post</b>
        <span />
      </header>
      <PostFeed item={{ chave: post.id, post, nota }} onComentarios={onComentarios} onCompartilhar={onCompartilhar} onPerfil={onPerfil} />
    </div>
  );
}
