import React, { useEffect, useRef, useState } from "react";
import type { Post } from "../tipos";
import { numero, tempo } from "../util";
import { Avatar } from "./Avatar";
import { Icone } from "./Icone";

type Props = {
  post: Post;
  curtido: boolean;
  salvo: boolean;
  comentarios: number;
  mudo: boolean;
  onCurtir: (forcar?: boolean) => void;
  onSalvar: () => void;
  onComentar: () => void;
  onCompartilhar: () => void;
  onMudo: () => void;
};

/** Um post em tela cheia: mídia (ou cena), selo FLAGRA, manchete, legenda e a coluna de ações. */
export function PostCard({ post, curtido, salvo, comentarios, mudo, onCurtir, onSalvar, onComentar, onCompartilhar, onMudo }: Props) {
  const raiz = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visivel, setVisivel] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [coracoes, setCoracoes] = useState<{ id: number; x: number; y: number }[]>([]);
  const ultimoToque = useRef(0);
  const toqueSimples = useRef<number | undefined>(undefined);

  // Toca só o post que está na tela.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisivel(e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (visivel && !pausado) v.play().catch(() => undefined);
    else v.pause();
    if (!visivel) setPausado(false);
  }, [visivel, pausado]);

  // Toque duplo curte (com coração onde o dedo tocou); toque simples pausa o vídeo.
  const tocar = (e: React.PointerEvent) => {
    const agora = Date.now();
    if (agora - ultimoToque.current < 280) {
      window.clearTimeout(toqueSimples.current);
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const id = agora;
      setCoracoes((c) => [...c, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
      window.setTimeout(() => setCoracoes((c) => c.filter((h) => h.id !== id)), 900);
      onCurtir(true);
      ultimoToque.current = 0;
      return;
    }
    ultimoToque.current = agora;
    if (post.midia?.tipo === "video") toqueSimples.current = window.setTimeout(() => setPausado((p) => !p), 290);
  };

  const texto = post.legenda;

  return (
    <article className="post" ref={raiz}>
      <div className="palco" onPointerUp={tocar}>
        {post.midia?.tipo === "video" ? (
          <video
            ref={video}
            src={post.midia.url}
            loop
            muted={mudo}
            playsInline
            preload="metadata"
            onTimeUpdate={(e) => setProgresso(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
          />
        ) : post.midia?.tipo === "imagem" ? (
          <img src={post.midia.url} alt="" className={visivel ? "kenburns" : ""} />
        ) : (
          <Cena post={post} ativa={visivel} />
        )}
        <div className="sombra" />
        {pausado && <div className="pausa">❚❚</div>}
        {coracoes.map((h) => (
          <span key={h.id} className="estouro" style={{ left: h.x, top: h.y }}>
            <Icone nome="coracao" tam={96} cor="#ff3b5c" />
          </span>
        ))}
      </div>

      <div className="info">
        <div className="selo">
          <span className="selo-flagra">FLAGRA</span>
          <span className="selo-local">
            <Icone nome="pino" tam={13} /> {post.local}
          </span>
        </div>
        <h2 className="manchete">{post.manchete}</h2>
        <div className="autor">
          @{post.autor}
          {post.verificado && <Icone nome="verificado" tam={15} cor="#ffe14d" />}
          <span className="tempo">· {tempo(post.ha)}</span>
        </div>
        <p className="legenda">
          {texto}{" "}
          {post.hashtags.map((h) => (
            <span key={h} className="hashtag">
              #{h}{" "}
            </span>
          ))}
        </p>
        <div className="som">
          <Icone nome="nota" tam={14} />
          <div className="som-faixa">
            <span>som original · @{post.autor} &nbsp;&nbsp;&nbsp; som original · @{post.autor} &nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>
      </div>

      <div className="acoes">
        <div className="acao-avatar">
          <Avatar nome={post.autor} tam={48} />
          {!post.meu && <span className="seguir">+</span>}
        </div>
        <button className={`acao ${curtido ? "curtido" : ""}`} onClick={() => onCurtir()} aria-label="Curtir">
          <Icone nome="coracao" tam={34} cor={curtido ? "#ff3b5c" : "#fff"} />
          <span>{numero(post.curtidas + (curtido ? 1 : 0))}</span>
        </button>
        <button className="acao" onClick={onComentar} aria-label="Comentários">
          <Icone nome="balao" tam={32} />
          <span>{numero(comentarios)}</span>
        </button>
        <button className={`acao ${salvo ? "salvo" : ""}`} onClick={onSalvar} aria-label="Salvar">
          <Icone nome="salvar" tam={30} cor={salvo ? "#ffe14d" : "#fff"} />
          <span>{salvo ? "Salvo" : "Salvar"}</span>
        </button>
        <button className="acao" onClick={onCompartilhar} aria-label="Compartilhar">
          <Icone nome="enviar" tam={30} cor="#fff" />
          <span>{numero(post.compartilhamentos)}</span>
        </button>
        {post.midia?.tipo === "video" && (
          <button className="acao" onClick={onMudo} aria-label={mudo ? "Ligar som" : "Desligar som"}>
            <Icone nome={mudo ? "mudo" : "som"} tam={26} cor="#fff" />
          </button>
        )}
        <div className={`disco ${visivel && !pausado ? "girando" : ""}`}>
          <Icone nome="nota" tam={18} />
        </div>
      </div>

      {post.midia?.tipo === "video" && (
        <div className="progresso">
          <div style={{ width: `${progresso * 100}%` }} />
        </div>
      )}
    </article>
  );
}

/** Post sem mídia: "gravação" estilizada com gradiente, emoji, REC e granulado. */
function Cena({ post, ativa }: { post: Post; ativa: boolean }) {
  const [a, b, c] = post.cena?.cores ?? ["#6366f1", "#ec4899", "#111"];
  return (
    <div className={`cena ${ativa ? "ativa" : ""}`} style={{ background: `radial-gradient(120% 80% at 30% 20%, ${a}, ${b} 45%, ${c})` }}>
      <div className="cena-emoji">{post.cena?.emoji ?? "📸"}</div>
      <div className="cena-rec">
        <i /> REC
      </div>
      <div className="cena-hora">{new Date(Date.now() - post.ha * 60_000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="cena-mira" />
      <div className="cena-grao" />
    </div>
  );
}
