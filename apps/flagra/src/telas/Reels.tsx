import React, { useEffect, useRef, useState } from "react";
import { Avatar, Nome } from "../componentes/Avatar";
import { Icone } from "../componentes/Icone";
import { NotaChip } from "../componentes/RaioX";
import { EU } from "../motor/dados";
import { useLoja, type ItemFeed } from "../motor/loja";
import type { Post } from "../motor/tipos";
import { curto } from "../util";

type Props = { inicio?: string; onComentarios: (p: Post) => void; onCompartilhar: (p: Post) => void; onPerfil: (id: string) => void };

export function Reels({ inicio, onComentarios, onCompartilhar, onPerfil }: Props) {
  const { reels, acoes } = useLoja();
  const lista = useRef<HTMLDivElement>(null);
  const [mudo, setMudo] = useState(true);
  useEffect(() => {
    acoes.recalcularReels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const ordem = reels.map((r) => r.chave).join(",");
  useEffect(() => {
    if (!inicio || !lista.current) return;
    const i = reels.findIndex((r) => r.chave === inicio);
    if (i >= 0) lista.current.scrollTo({ top: i * lista.current.clientHeight });
  }, [inicio, ordem]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tela reels" ref={lista}>
      <header className="reels-topo">
        <b>Reels</b>
        <Icone nome="camera" tam={26} />
      </header>
      {reels.map((item, i) => (
        <Reel key={item.chave} item={item} posicao={i} mudo={mudo} onMudo={() => setMudo((m) => !m)} onComentarios={() => onComentarios(item.post)} onCompartilhar={() => onCompartilhar(item.post)} onPerfil={onPerfil} />
      ))}
    </div>
  );
}

function Reel({ item, posicao, mudo, onMudo, onComentarios, onCompartilhar, onPerfil }: { item: ItemFeed; posicao: number; mudo: boolean; onMudo: () => void; onComentarios: () => void; onCompartilhar: () => void; onPerfil: (id: string) => void }) {
  const { post } = item;
  const { estado, usuario, acoes, raioX } = useLoja();
  const raiz = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [ativo, setAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [prog, setProg] = useState(0);
  const [vendo, setVendo] = useState(0);
  const [coracao, setCoracao] = useState(0);
  const visto = useRef(0);
  const ultimoT = useRef(0);
  const ultimoToque = useRef(0);
  const simples = useRef<number | undefined>(undefined);
  const autor = usuario(post.autor);
  const curtido = !!estado.curtidos[post.id];
  const repostado = !!estado.repostados[post.id];
  const segue = !!estado.seguindo[post.autor] || post.autor === EU;

  useEffect(() => {
    const el = raiz.current!;
    const obs = new IntersectionObserver(([e]) => setAtivo(e.intersectionRatio > 0.7), { threshold: [0, 0.7, 1] });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Toca só o reel na tela. Quando ele sai, manda a "visualização" com o tempo assistido.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (ativo) {
      visto.current = 0;
      ultimoT.current = v.currentTime;
      setVendo(0);
      setPausado(false);
      v.play().catch(() => undefined);
    } else {
      v.pause();
      if (visto.current > 0) acoes.assistir(post, visto.current, v.duration);
      visto.current = 0;
    }
  }, [ativo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = video.current;
    if (!v || !ativo) return;
    if (pausado) v.pause();
    else v.play().catch(() => undefined);
  }, [pausado, ativo]);

  const tempoAtual = (v: HTMLVideoElement) => {
    const d = v.currentTime - ultimoT.current;
    visto.current += d >= 0 ? d : v.currentTime; // voltou ao início no loop
    ultimoT.current = v.currentTime;
    setProg(v.currentTime / (v.duration || 1));
    setVendo(visto.current);
  };

  const toque = () => {
    const agora = Date.now();
    if (agora - ultimoToque.current < 300) {
      window.clearTimeout(simples.current);
      acoes.curtir(post, true);
      setCoracao(agora);
      ultimoToque.current = 0;
      return;
    }
    ultimoToque.current = agora;
    simples.current = window.setTimeout(() => setPausado((p) => !p), 300);
  };

  return (
    <section className="reel" ref={raiz}>
      <video ref={video} src={post.midia.url} loop muted={mudo} playsInline preload="auto" onTimeUpdate={(e) => tempoAtual(e.currentTarget)} onPointerUp={toque} />
      <div className="reel-sombra" />
      {pausado && <div className="reel-pausa">▶</div>}
      {coracao > 0 && (
        <span key={coracao} className="estouro">
          <Icone nome="coracaoCheio" tam={110} />
        </span>
      )}
      {raioX && (
        <div className="reel-raiox">
          <NotaChip nota={item.nota} posicao={posicao} />
          <span className="reel-assistido">
            assistindo: {vendo.toFixed(1)} s · {Math.round(Math.min(1, prog) * 100)}%
          </span>
        </div>
      )}
      <button className="reel-som" onClick={onMudo} aria-label="Som">
        <Icone nome={mudo ? "mudo" : "som"} tam={18} />
      </button>

      <div className="reel-acoes">
        <button className={`acao ${curtido ? "curtido" : ""}`} onClick={() => acoes.curtir(post)}>
          <Icone nome={curtido ? "coracaoCheio" : "coracao"} tam={30} />
          <span>{curto(post.curtidas)}</span>
        </button>
        <button className="acao" onClick={onComentarios}>
          <Icone nome="comentario" tam={29} />
          <span>{curto(post.comentarios)}</span>
        </button>
        <button className={`acao ${repostado ? "repostado" : ""}`} onClick={() => acoes.repostar(post)}>
          <Icone nome="repost" tam={29} />
          <span>{curto(post.reposts)}</span>
        </button>
        <button className="acao" onClick={onCompartilhar}>
          <Icone nome="enviar" tam={27} />
        </button>
        <button className="acao">
          <Icone nome="pontos" tam={24} />
        </button>
        <span className="reel-audio">
          <Avatar u={autor} tam={30} />
        </span>
      </div>

      <div className="reel-info">
        <div className="reel-autor">
          <button onClick={() => onPerfil(autor.id)}>
            <Avatar u={autor} tam={32} />
          </button>
          <button onClick={() => onPerfil(autor.id)}>
            <Nome u={autor} />
          </button>
          {!segue && (
            <button className="botao-seguir-reel" onClick={() => acoes.seguir(autor.id)}>
              Seguir
            </button>
          )}
        </div>
        <p className="reel-legenda">{post.legenda}</p>
        <div className="reel-musica">
          <Icone nome="musica" tam={13} />
          <span>{post.audio ?? `som original · ${autor.id}`}</span>
          <em>{curto(post.visualizacoes)} visualizações</em>
        </div>
      </div>
      <div className="reel-progresso">
        <i style={{ width: `${prog * 100}%` }} />
      </div>
    </section>
  );
}
