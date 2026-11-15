import React, { useEffect, useRef, useState } from "react";
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
  const { usuario, acoes, porId, stories, estado, comentariosDe, setRaioX, setDestaque, setModoDemo } = useLoja();
  const [aba, setAba] = useState<Aba>("inicio");
  const [pilha, setPilha] = useState<Camada[]>([]);
  const [comentarios, setComentarios] = useState<Post>();
  const [compartilhar, setCompartilhar] = useState<Post>();
  const [story, setStory] = useState<number>();
  const [storyFixo, setStoryFixo] = useState<number>();
  const [demo, setDemo] = useState<number>();
  const timers = useRef<number[]>([]);
  const inicioPasso = useRef(0);
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

  // ── Modo demo: um roteiro que toca cada mecânica com a Duda e o Rafa, passo a passo ──
  const depois = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const rolarAte = (id: string) => document.querySelector(`[data-post="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const abrirStory = (id: string) => {
    const i = stories.findIndex((s) => s.id === id);
    setStory(i);
    setStoryFixo(i);
  };
  const POST = "duda-mapa";
  const passos: { titulo: string; texto: string; rodar: () => void }[] = [
    {
      titulo: "Conheça a Duda e o Rafa",
      texto: "Um casal na estrada pela Flórida. Você já segue o Rafa, mas ainda não segue a Duda.",
      rodar: () => {
        acoes.reiniciar();
        setPilha([]);
        setAba("inicio");
        setComentarios(undefined);
        setStory(undefined);
        rolagemFeed.current?.scrollTo({ top: 0 });
      },
    },
    { titulo: "Stories", texto: "Anel colorido = story que você ainda não viu. Cada pessoa pode ter vários, em sequência, e eles somem em 24 h.", rodar: () => abrirStory("duda-1") },
    {
      titulo: "Enquete no story",
      texto: "Figurinha também é interação: o voto vai para a Duda, a porcentagem atualiza e a afinidade com ela sobe.",
      rodar: () => {
        abrirStory("duda-2");
        depois(1400, () => {
          const s = stories.find((x) => x.id === "duda-2");
          if (s) acoes.votarEnquete(s, 0);
        });
      },
    },
    {
      titulo: "Anel cinza",
      texto: "Viu todos os stories da Duda: o anel dela fica cinza e vai para o fim da fila.",
      rodar: () => {
        abrirStory("duda-3");
        depois(2200, () => {
          setStory(undefined);
          setStoryFixo(undefined);
          rolagemFeed.current?.scrollTo({ top: 0, behavior: "smooth" });
          // O anel da Duda foi para o fim da fila: rola a fileira até ele.
          depois(400, () => document.querySelector(".stories")?.scrollTo({ left: 9999, behavior: "smooth" }));
        });
      },
    },
    {
      titulo: "Repost",
      texto: "Esse post é da Duda, que você não segue. Ele chegou no seu feed porque o Rafa repostou.",
      rodar: () => {
        setRaioX(true);
        setDestaque(POST);
        depois(150, () => rolarAte(POST));
      },
    },
    { titulo: "Seguir", texto: "Seguir grava uma linha (você → Duda). Daqui pra frente os posts dela entram direto no seu feed, com afinidade maior.", rodar: () => !estado.seguindo["duda.sem.freio"] && acoes.seguir("duda.sem.freio") },
    {
      titulo: "Curtida",
      texto: "Toque duplo na foto: uma linha na tabela de curtidas, contador +1, notificação para a Duda e um sinal para o ranking.",
      rodar: () => {
        rolarAte(POST);
        const p = porId(POST);
        if (!p) return;
        window.dispatchEvent(new CustomEvent("flagra:coracao", { detail: POST }));
        acoes.curtir(p, true);
      },
    },
    {
      titulo: "Comentários",
      texto: "Comentário tem resposta em thread. A Duda e o Rafa estão discutindo aqui, e você entra na conversa.",
      rodar: () => {
        const p = porId(POST);
        if (!p) return;
        setComentarios(p);
        depois(1800, () => {
          const raiz = comentariosDe(POST).find((c) => c.autor === "rafa.na.estrada" && !c.respostaDe);
          acoes.comentar(p, "@rafa.na.estrada kkkkk tô acompanhando de camarote", raiz);
        });
      },
    },
    {
      titulo: "Repostar",
      texto: "Repost não copia o post: guarda só a referência e leva o post para o feed de quem segue você.",
      rodar: () => {
        setComentarios(undefined);
        const p = porId(POST);
        if (p && !estado.repostados[POST]) depois(400, () => acoes.repostar(p));
      },
    },
    {
      titulo: "Reels",
      texto: "Nos Reels quem manda é o tempo assistido. E o reel do Rafa está bombando agora: veja a nota subir.",
      rodar: () => {
        setDestaque(undefined);
        setPilha([]);
        setReelInicio("reel-rafa-fuga");
        setAba("reels");
        depois(1500, () => {
          const r = porId("reel-rafa-fuga");
          if (r) acoes.impulsionar(r, 8);
        });
      },
    },
    {
      titulo: "O feed se reorganiza",
      texto: "Você viu, votou, seguiu, curtiu, comentou e repostou a Duda. Ao atualizar o feed, o ranking recalcula e os posts dela sobem.",
      rodar: () => {
        setAba("inicio");
        setReelInicio(undefined);
        depois(200, () => {
          acoes.recalcularFeed();
          rolagemFeed.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
      },
    },
    { titulo: "É isso que tem por trás do feed", texto: "Tabelas, contadores, notificações e uma nota para cada post. Toque em Sair para usar o app livre.", rodar: () => setRaioX(true) },
  ];

  useEffect(() => {
    if (demo === undefined) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setModoDemo(true);
    inicioPasso.current = Date.now();
    passos[demo]?.rodar();
  }, [demo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const iniciar = () => setDemo(0);
    window.addEventListener("flagra:demo", iniciar);
    if (new URLSearchParams(location.search).has("demo")) iniciar();
    return () => window.removeEventListener("flagra:demo", iniciar);
  }, []);

  useEffect(() => {
    if (demo === undefined) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") (e.preventDefault(), setDemo((d) => (d === undefined ? d : Math.min(passos.length - 1, d + 1))));
      if (e.key === "Escape") sairDemo();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [demo]); // eslint-disable-line react-hooks/exhaustive-deps

  const sairDemo = () => {
    timers.current.forEach(clearTimeout);
    setDemo(undefined);
    setModoDemo(false);
    setDestaque(undefined);
    setStoryFixo(undefined);
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
        {story !== undefined && (
          <VerStories
            key={storyFixo === undefined ? "livre" : "demo"}
            inicio={story}
            indice={storyFixo}
            onFechar={() => {
              setStory(undefined);
              setStoryFixo(undefined);
            }}
          />
        )}
        {demo !== undefined && (
          <div className="demo">
            <div className="demo-topo">
              <span>
                Demo · {demo + 1}/{passos.length}
              </span>
              <span className="demo-botoes">
                <button onClick={sairDemo}>Sair</button>
                {demo < passos.length - 1 ? (
                  <button className="demo-proximo" onClick={() => setDemo(demo + 1)}>
                    Próximo ›
                  </button>
                ) : (
                  <button className="demo-proximo" onClick={sairDemo}>
                    Usar o app
                  </button>
                )}
              </span>
            </div>
            <b>{passos[demo].titulo}</b>
            <p>{passos[demo].texto}</p>
            {(() => {
              const ev = estado.eventos.find((x) => x.em >= inicioPasso.current - 50);
              return ev ? (
                <div className="demo-por-tras" key={ev.id}>
                  <span>
                    {ev.icone} por trás: {ev.titulo}
                  </span>
                  <ol>
                    {ev.passos.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                </div>
              ) : null;
            })()}
            <div className="demo-pontos">
              {passos.map((_, k) => (
                <i key={k} className={k <= demo ? "feito" : ""} />
              ))}
            </div>
          </div>
        )}
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
