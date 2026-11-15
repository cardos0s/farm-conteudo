import React from "react";
import { Avatar } from "../componentes/Avatar";
import { Icone } from "../componentes/Icone";
import { PostFeed } from "../componentes/PostFeed";
import { EU } from "../motor/dados";
import { useLoja } from "../motor/loja";
import type { Post } from "../motor/tipos";

type Props = {
  rolagem: React.RefObject<HTMLDivElement | null>;
  onComentarios: (p: Post) => void;
  onCompartilhar: (p: Post) => void;
  onPerfil: (id: string) => void;
  onStory: (i: number) => void;
  onAtividade: () => void;
  onCriar: () => void;
  onAtualizar: () => void;
};

export function Feed({ rolagem, onComentarios, onCompartilhar, onPerfil, onStory, onAtividade, onCriar, onAtualizar }: Props) {
  const { feed, stories, estado, usuario, raioX, setRaioX, notificacoes } = useLoja();
  const novas = notificacoes.some((n) => Date.now() - n.em < 10 * 60_000);
  // Stories não vistos primeiro, como nos apps grandes.
  const ordem = stories.map((s, i) => ({ s, i })).sort((a, b) => Number(!!estado.storiesVistos[a.s.id]) - Number(!!estado.storiesVistos[b.s.id]));
  return (
    <div className="tela rolavel" ref={rolagem}>
      <header className="feed-topo">
        <button className="logo" onClick={onAtualizar} aria-label="Atualizar feed">
          flagra<i />
        </button>
        <div className="feed-topo-acoes">
          <button className={`pilula-raiox ${raioX ? "ligado" : ""}`} onClick={() => setRaioX(!raioX)}>
            <Icone nome="raiox" tam={16} /> Raio-X
          </button>
          <button className="com-ponto" onClick={onAtividade} aria-label="Notificações">
            <Icone nome="coracao" tam={26} />
            {novas && <i className="ponto-vermelho" />}
          </button>
          <button aria-label="Mensagens">
            <Icone nome="enviar" tam={25} />
          </button>
        </div>
      </header>

      <div className="stories">
        <button className="story" onClick={onCriar}>
          <span className="story-eu">
            <Avatar u={usuario(EU)} tam={62} />
            <i>+</i>
          </span>
          <span>Seu story</span>
        </button>
        {ordem.map(({ s, i }) => {
          const u = usuario(s.autor);
          return (
            <button key={s.id} className="story" onClick={() => onStory(i)}>
              <Avatar u={u} tam={62} anel={estado.storiesVistos[s.id] ? "visto" : "novo"} />
              <span>{u.id}</span>
            </button>
          );
        })}
      </div>

      {feed.map((item, i) => (
        <PostFeed key={item.chave} item={item} posicao={i} onComentarios={() => onComentarios(item.post)} onCompartilhar={() => onCompartilhar(item.post)} onPerfil={onPerfil} />
      ))}
      <div className="fim-feed">
        <span>✓</span>
        <b>Você está em dia</b>
        <p>Você viu todos os posts novos dos últimos dias.</p>
        <button onClick={onAtualizar}>Atualizar o feed</button>
      </div>
    </div>
  );
}
