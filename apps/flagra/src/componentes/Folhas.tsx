import React, { useEffect, useRef, useState } from "react";
import { EU } from "../motor/dados";
import { useLoja } from "../motor/loja";
import type { Comentario, Post } from "../motor/tipos";
import { curto, tempo } from "../util";
import { Avatar, Nome } from "./Avatar";
import { Icone } from "./Icone";

function Folha({ titulo, onFechar, children, alta }: { titulo: string; onFechar: () => void; children: React.ReactNode; alta?: boolean }) {
  return (
    <div className="veu" onClick={onFechar}>
      <section className={`folha ${alta ? "alta" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="pegador" />
        <header className="folha-topo">{titulo}</header>
        {children}
      </section>
    </div>
  );
}

const EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

/** Comentários com respostas (um nível), curtida em comentário e "Responder". */
export function Comentarios({ post, onFechar }: { post: Post; onFechar: () => void }) {
  const { comentariosDe, usuario, acoes, estado } = useLoja();
  const [texto, setTexto] = useState("");
  const [resp, setResp] = useState<Comentario>();
  const entrada = useRef<HTMLInputElement>(null);
  const todos = comentariosDe(post.id);
  const curt = (c: Comentario) => c.curtidas + (estado.curtidasComentario[c.id] ? 1 : 0);
  // Comentários do topo: os seus primeiro, depois os mais curtidos. Respostas ficam embaixo de cada um.
  const raiz = todos.filter((c) => !c.respostaDe).sort((a, b) => (a.autor === EU ? -1 : b.autor === EU ? 1 : curt(b) - curt(a)));
  const respostas = (id: string) => todos.filter((c) => c.respostaDe === id).sort((a, b) => a.criadoEm - b.criadoEm);

  const enviar = (t = texto) => {
    if (!t.trim()) return;
    acoes.comentar(post, t.trim(), resp);
    setTexto("");
    setResp(undefined);
  };

  const Linha = ({ c, filho }: { c: Comentario; filho?: boolean }) => {
    const u = usuario(c.autor);
    const curtido = !!estado.curtidasComentario[c.id];
    return (
      <li className={filho ? "resposta" : ""}>
        <Avatar u={u} tam={filho ? 26 : 34} />
        <div className="com-corpo">
          <span className="com-topo">
            <Nome u={u} /> <time>{tempo(c.criadoEm)}</time>
            {c.autor === post.autor && <em className="selo-autor">Autor</em>}
          </span>
          <p>{c.texto}</p>
          <button
            className="com-responder"
            onClick={() => {
              setResp(filho ? todos.find((x) => x.id === c.respostaDe) : c);
              setTexto(`@${c.autor} `);
              entrada.current?.focus();
            }}
          >
            Responder
          </button>
        </div>
        <button className={`com-curtir ${curtido ? "curtido" : ""}`} onClick={() => acoes.curtirComentario(c)}>
          <Icone nome={curtido ? "coracaoCheio" : "coracao"} tam={14} />
          <span>{curt(c) > 0 ? curto(curt(c)) : ""}</span>
        </button>
      </li>
    );
  };

  return (
    <Folha titulo="Comentários" onFechar={onFechar} alta>
      <ul className="comentarios">
        {raiz.length === 0 && <li className="vazio">Ainda não há comentários. Comece a conversa.</li>}
        {raiz.map((c) => (
          <React.Fragment key={c.id}>
            <Linha c={c} />
            {respostas(c.id).map((r) => (
              <Linha key={r.id} c={r} filho />
            ))}
          </React.Fragment>
        ))}
      </ul>
      {resp && (
        <div className="respondendo">
          Respondendo a <b>@{resp.autor}</b>
          <button onClick={() => (setResp(undefined), setTexto(""))}>
            <Icone nome="fechar" tam={14} />
          </button>
        </div>
      )}
      <div className="emojis">
        {EMOJIS.map((em) => (
          <button key={em} onClick={() => enviar(em)}>
            {em}
          </button>
        ))}
      </div>
      <form className="comentar" onSubmit={(e) => (e.preventDefault(), enviar())}>
        <Avatar u={usuario(EU)} tam={32} />
        <input ref={entrada} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Comente para ${post.autor}...`} />
        <button type="submit" disabled={!texto.trim()}>
          Publicar
        </button>
      </form>
    </Folha>
  );
}

/** Enviar para amigos, repostar, copiar link. */
export function Compartilhar({ post, onFechar, avisar }: { post: Post; onFechar: () => void; avisar: (t: string) => void }) {
  const { estado, usuario, acoes } = useLoja();
  const [enviados, setEnviados] = useState<Record<string, boolean>>({});
  const amigos = Object.keys(estado.seguindo).filter((u) => estado.seguindo[u]);
  const repostado = !!estado.repostados[post.id];
  const link = `${location.origin}/p/${post.id}`;
  return (
    <Folha titulo="Compartilhar" onFechar={onFechar}>
      <div className="amigos">
        {amigos.map((id) => {
          const u = usuario(id);
          return (
            <button key={id} className={`amigo ${enviados[id] ? "enviado" : ""}`} onClick={() => setEnviados((s) => ({ ...s, [id]: true }))}>
              <Avatar u={u} tam={58} />
              <span>{u.nome}</span>
              <em>{enviados[id] ? "Enviado" : "Enviar"}</em>
            </button>
          );
        })}
      </div>
      <div className="compartilhar-acoes">
        <button
          className={repostado ? "ativo" : ""}
          onClick={() => {
            acoes.repostar(post);
            avisar(repostado ? "Repost removido" : "Repostado no seu perfil");
            onFechar();
          }}
        >
          <span>
            <Icone nome="repost" tam={22} />
          </span>
          {repostado ? "Desfazer repost" : "Repostar"}
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
            } catch {
              /* sem clipboard */
            }
            avisar("Link copiado");
            onFechar();
          }}
        >
          <span>
            <Icone nome="link" tam={22} />
          </span>
          Copiar link
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.share?.({ title: "Flagra", text: post.legenda, url: link });
            } catch {
              /* cancelado */
            }
          }}
        >
          <span>
            <Icone nome="enviar" tam={22} />
          </span>
          Compartilhar em...
        </button>
      </div>
    </Folha>
  );
}

/** Visualizador de stories: barras de progresso, avança sozinho em 5 s, toque à esquerda/direita. */
export function VerStories({ inicio, onFechar }: { inicio: number; onFechar: () => void }) {
  const { stories, usuario, acoes } = useLoja();
  const [i, setI] = useState(inicio);
  const [prog, setProg] = useState(0);
  const s = stories[i];
  useEffect(() => {
    if (!s) return onFechar();
    acoes.verStory(s.id);
    setProg(0);
    const t0 = performance.now();
    let raf = 0;
    const passo = (t: number) => {
      const p = (t - t0) / 5000;
      if (p >= 1) setI((x) => x + 1);
      else {
        setProg(p);
        raf = requestAnimationFrame(passo);
      }
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return null;
  const u = usuario(s.autor);
  return (
    <div className="stories-tela">
      <img src={s.midia} alt="" className="story-fundo" />
      <img src={s.midia} alt="" className="story-img" />
      <div className="story-barras">
        {stories.map((x, k) => (
          <i key={x.id}>
            <b style={{ width: `${k < i ? 100 : k === i ? prog * 100 : 0}%` }} />
          </i>
        ))}
      </div>
      <header className="story-topo">
        <Avatar u={u} tam={32} />
        <Nome u={u} /> <time>{tempo(s.criadoEm)}</time>
        <button onClick={onFechar} aria-label="Fechar">
          <Icone nome="fechar" tam={26} />
        </button>
      </header>
      <button className="story-tras" onClick={() => setI((x) => Math.max(0, x - 1))} aria-label="Anterior" />
      <button className="story-frente" onClick={() => setI((x) => x + 1)} aria-label="Próximo" />
      <form className="story-responder" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Enviar mensagem" />
        <Icone nome="coracao" tam={26} />
        <Icone nome="enviar" tam={24} />
      </form>
    </div>
  );
}
