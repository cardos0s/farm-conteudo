import React, { useEffect, useRef, useState } from "react";
import { EU } from "../motor/dados";
import { useLoja, type ItemFeed } from "../motor/loja";
import { curto, longo, tempoLongo } from "../util";
import { Avatar, Nome } from "./Avatar";
import { Icone } from "./Icone";
import { NotaChip } from "./RaioX";

type Props = { item: ItemFeed; posicao?: number; onComentarios: () => void; onCompartilhar: () => void; onPerfil: (id: string) => void };

/** Um post do feed: cabeçalho, mídia (toque duplo curte), ações, curtidas, legenda e comentários. */
export function PostFeed({ item, posicao, onComentarios, onCompartilhar, onPerfil }: Props) {
  const { post, via } = item;
  const { estado, usuario, acoes, raioX, comentariosDe, destaque } = useLoja();
  const autor = usuario(post.autor);
  const curtido = !!estado.curtidos[post.id];
  const salvo = !!estado.salvos[post.id];
  const repostado = !!estado.repostados[post.id];
  const segue = !!estado.seguindo[post.autor] || post.autor === EU;
  const [coracao, setCoracao] = useState(0);
  const [pulso, setPulso] = useState(false);
  const ultimo = useRef(0);
  const [expandido, setExpandido] = useState(false);

  // Quem aparece em "Curtido por": alguém que você segue, como nos apps grandes.
  const amigo = Object.keys(estado.seguindo).find((u) => estado.seguindo[u] && u !== post.autor);
  const primeiro = comentariosDe(post.id).filter((c) => !c.respostaDe).sort((a, b) => b.curtidas - a.curtidas)[0];

  // O modo demo dispara o coração da curtida por evento.
  useEffect(() => {
    const ouvir = (ev: Event) => {
      if ((ev as CustomEvent).detail === post.id) setCoracao(Date.now());
    };
    window.addEventListener("flagra:coracao", ouvir);
    return () => window.removeEventListener("flagra:coracao", ouvir);
  }, [post.id]);

  const toque = () => {
    const agora = Date.now();
    if (agora - ultimo.current < 300) {
      acoes.curtir(post, true);
      setCoracao(agora);
      ultimo.current = 0;
    } else ultimo.current = agora;
  };
  const curtir = () => {
    acoes.curtir(post);
    setPulso(true);
    window.setTimeout(() => setPulso(false), 350);
  };

  return (
    <article className={`post ${destaque === post.id ? "em-destaque" : ""}`} data-post={post.id}>
      {via && (
        <div className="post-repost" onClick={() => onPerfil(via)}>
          <Icone nome="repost" tam={14} /> <b>{via}</b> repostou
        </div>
      )}
      <header className="post-topo">
        <button onClick={() => onPerfil(autor.id)}>
          <Avatar u={autor} tam={32} />
        </button>
        <div className="post-quem">
          <span className="post-linha1">
            <button onClick={() => onPerfil(autor.id)}>
              <Nome u={autor} />
            </button>
            {!segue && (
              <>
                <span className="ponto">•</span>
                <button className="link-seguir" onClick={() => acoes.seguir(autor.id)}>
                  Seguir
                </button>
              </>
            )}
          </span>
          {post.local && <span className="post-local">{post.local}</span>}
        </div>
        <Icone nome="pontos" tam={20} />
      </header>

      <div className="post-midia" style={{ aspectRatio: Math.min(1.91, Math.max(0.8, post.midia.proporcao ?? 0.8)) }} onPointerUp={toque}>
        {post.midia.tipo === "video" ? <video src={post.midia.url} autoPlay muted loop playsInline /> : <img src={post.midia.url} alt="" draggable={false} />}
        {coracao > 0 && (
          <span key={coracao} className="estouro">
            <Icone nome="coracaoCheio" tam={110} />
          </span>
        )}
        {raioX && <NotaChip key={destaque === post.id ? "d" : "n"} nota={item.nota} posicao={posicao} aberto={destaque === post.id} />}
      </div>

      <div className="post-acoes">
        <button className={`acao ${curtido ? "curtido" : ""} ${pulso ? "pulso" : ""}`} onClick={curtir} aria-label="Curtir">
          <Icone nome={curtido ? "coracaoCheio" : "coracao"} tam={26} />
          <span>{curto(post.curtidas)}</span>
        </button>
        <button className="acao" onClick={onComentarios} aria-label="Comentar">
          <Icone nome="comentario" tam={25} />
          <span>{curto(post.comentarios)}</span>
        </button>
        <button className={`acao ${repostado ? "repostado" : ""}`} onClick={() => acoes.repostar(post)} aria-label="Repostar">
          <Icone nome="repost" tam={25} />
          <span>{curto(post.reposts)}</span>
        </button>
        <button className="acao" onClick={onCompartilhar} aria-label="Compartilhar">
          <Icone nome="enviar" tam={24} />
        </button>
        <button className={`acao salvar ${salvo ? "salvo" : ""}`} onClick={() => acoes.salvar(post)} aria-label="Salvar">
          <Icone nome={salvo ? "salvarCheio" : "salvar"} tam={25} />
        </button>
      </div>

      <div className="post-texto">
        {amigo && (
          <p className="curtido-por">
            Curtido por <b>{amigo}</b> e <b>outras {longo(Math.max(0, post.curtidas - 1))} pessoas</b>
          </p>
        )}
        <p className={`legenda ${expandido ? "aberta" : ""}`} onClick={() => setExpandido(true)}>
          <b>{autor.id}</b> {post.legenda}{" "}
          {post.tags.slice(0, 3).map((t) => (
            <span key={t} className="hashtag">
              #{t}{" "}
            </span>
          ))}
        </p>
        {post.comentarios > 0 && (
          <button className="ver-comentarios" onClick={onComentarios}>
            Ver todos os {longo(post.comentarios)} comentários
          </button>
        )}
        {primeiro && (
          <p className="comentario-previa">
            <b>{primeiro.autor}</b> {primeiro.texto}
          </p>
        )}
        <time>{tempoLongo(post.criadoEm)}</time>
      </div>
    </article>
  );
}
