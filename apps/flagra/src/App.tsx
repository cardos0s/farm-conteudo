import React, { useRef, useState } from "react";
import { Avatar } from "./componentes/Avatar";
import { Compartilhar, Comentarios, VerStories } from "./componentes/Folhas";
import { Icone } from "./componentes/Icone";
import { PainelRaioX } from "./componentes/RaioX";
import { EU } from "./motor/dados";
import { ProvedorLoja, useLoja } from "./motor/loja";
import type { Post } from "./motor/tipos";
import { Criar } from "./telas/Criar";
import { Feed } from "./telas/Feed";
import { Atividade, Detalhe, Explorar, Perfil } from "./telas/Outras";
import { Reels } from "./telas/Reels";

type Aba = "inicio" | "explorar" | "reels" | "perfil";
type Camada = { tipo: "perfil"; id: string } | { tipo: "post"; id: string } | { tipo: "atividade" };

function Telas() {
  const { usuario, acoes, porId } = useLoja();
  const [aba, setAba] = useState<Aba>("inicio");
  const [pilha, setPilha] = useState<Camada[]>([]);
  const [comentarios, setComentarios] = useState<Post>();
  const [compartilhar, setCompartilhar] = useState<Post>();
  const [story, setStory] = useState<number>();
  const [criando, setCriando] = useState(false);
  const [reelInicio, setReelInicio] = useState<string>();
  const [aviso, setAviso] = useState<string>();
  const rolagemFeed = useRef<HTMLDivElement>(null);

  const avisar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(undefined), 1800);
  };
  const abrirPerfil = (id: string) => setPilha((p) => [...p, { tipo: "perfil", id }]);
  const abrirPost = (p: Post) => {
    if (p.tipo === "reel") {
      setPilha([]);
      setReelInicio(p.id);
      setAba("reels");
    } else setPilha((s) => [...s, { tipo: "post", id: p.id }]);
  };
  const voltar = () => setPilha((p) => p.slice(0, -1));
  const irPara = (a: Aba) => {
    setPilha([]);
    if (a === "inicio" && aba === "inicio") atualizar();
    if (a !== "reels") setReelInicio(undefined);
    setAba(a);
  };
  const atualizar = () => {
    acoes.recalcularFeed();
    rolagemFeed.current?.scrollTo({ top: 0, behavior: "smooth" });
    avisar("Feed atualizado com seus sinais");
  };

  const topo = pilha[pilha.length - 1];
  const folhas = { onComentarios: setComentarios, onCompartilhar: setCompartilhar, onPerfil: abrirPerfil };

  return (
    <div className="mesa">
      <div className={`moldura ${aba === "reels" && !topo ? "escura" : ""}`}>
        <main className="conteudo">
          <div hidden={aba !== "inicio" || !!topo} className="aba">
            <Feed rolagem={rolagemFeed} {...folhas} onStory={setStory} onAtividade={() => setPilha([{ tipo: "atividade" }])} onCriar={() => setCriando(true)} onAtualizar={atualizar} />
          </div>
          {aba === "explorar" && !topo && <Explorar onAbrir={abrirPost} />}
          {aba === "reels" && !topo && <Reels inicio={reelInicio} {...folhas} />}
          {aba === "perfil" && !topo && <Perfil id={EU} onAbrir={abrirPost} onCriar={() => setCriando(true)} />}
          {topo?.tipo === "perfil" && <Perfil key={topo.id} id={topo.id} onVoltar={voltar} onAbrir={abrirPost} onCriar={() => setCriando(true)} />}
          {topo?.tipo === "atividade" && <Atividade onVoltar={voltar} onPerfil={abrirPerfil} />}
          {topo?.tipo === "post" &&
            (() => {
              const p = porId(topo.id);
              return p ? <Detalhe post={p} onVoltar={voltar} onComentarios={() => setComentarios(p)} onCompartilhar={() => setCompartilhar(p)} onPerfil={abrirPerfil} /> : null;
            })()}
        </main>

        <PainelRaioX />

        <nav className="barra">
          <button onClick={() => irPara("inicio")} aria-label="Início">
            <Icone nome={aba === "inicio" && !topo ? "casaCheia" : "casa"} tam={26} />
          </button>
          <button onClick={() => irPara("explorar")} className={aba === "explorar" && !topo ? "ativa" : ""} aria-label="Explorar">
            <Icone nome="lupa" tam={26} />
          </button>
          <button onClick={() => setCriando(true)} aria-label="Criar">
            <Icone nome="mais" tam={26} />
          </button>
          <button onClick={() => irPara("reels")} className={aba === "reels" && !topo ? "ativa" : ""} aria-label="Reels">
            <Icone nome="reels" tam={26} />
          </button>
          <button onClick={() => irPara("perfil")} className={`barra-eu ${aba === "perfil" && !topo ? "ativa" : ""}`} aria-label="Perfil">
            <Avatar u={usuario(EU)} tam={26} />
          </button>
        </nav>

        {comentarios && <Comentarios post={porId(comentarios.id) ?? comentarios} onFechar={() => setComentarios(undefined)} />}
        {compartilhar && <Compartilhar post={porId(compartilhar.id) ?? compartilhar} onFechar={() => setCompartilhar(undefined)} avisar={avisar} />}
        {story !== undefined && <VerStories inicio={story} onFechar={() => setStory(undefined)} />}
        {criando && (
          <Criar
            onFechar={() => setCriando(false)}
            onPublicado={(reel) => {
              setCriando(false);
              setPilha([]);
              setAba(reel ? "reels" : "inicio");
              rolagemFeed.current?.scrollTo({ top: 0 });
              avisar(reel ? "Reel publicado" : "Post publicado");
            }}
          />
        )}
        {aviso && <div className="aviso">{aviso}</div>}
      </div>
    </div>
  );
}

export function App() {
  return (
    <ProvedorLoja>
      <Telas />
    </ProvedorLoja>
  );
}
