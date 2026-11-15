import React, { useEffect, useMemo, useRef, useState } from "react";
import { carregarMeus, salvarMeu } from "./armazenamento";
import { Comentarios } from "./componentes/Comentarios";
import { Criar, type NovoPost } from "./componentes/Criar";
import { Icone } from "./componentes/Icone";
import { PostCard } from "./componentes/PostCard";
import { comentariosDe, POSTS } from "./dados";
import type { Comentario, Post } from "./tipos";

type Aba = "seguindo" | "pravoce" | "perto";

export function App() {
  const [meus, setMeus] = useState<Post[]>([]);
  const [aba, setAba] = useState<Aba>("pravoce");
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set());
  const [salvos, setSalvos] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<Record<string, Comentario[]>>({});
  const [abertoComentarios, setAbertoComentarios] = useState<Post>();
  const [criando, setCriando] = useState(false);
  const [mudo, setMudo] = useState(true);
  const [aviso, setAviso] = useState<string>();
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => void carregarMeus().then(setMeus), []);

  const posts = useMemo(() => {
    const todos = [...meus, ...POSTS];
    if (aba === "seguindo") return todos.filter((p) => p.seguindo || p.meu);
    if (aba === "perto") return todos.filter((p) => p.meu || /, (SP|PR|RJ|MG)$/.test(p.local));
    return todos;
  }, [meus, aba]);

  const avisar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(undefined), 1800);
  };

  const alternar = (set: Set<string>, id: string, forcar?: boolean) => {
    const s = new Set(set);
    if (forcar ?? !s.has(id)) s.add(id);
    else s.delete(id);
    return s;
  };

  const compartilhar = async (p: Post) => {
    const dados = { title: `FLAGRA: ${p.manchete}`, text: `${p.manchete} — @${p.autor} no Flagra`, url: location.href };
    try {
      if (navigator.share) await navigator.share(dados);
      else {
        await navigator.clipboard.writeText(`${dados.text} ${dados.url}`);
        avisar("Link copiado");
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  const postar = async (n: NovoPost) => {
    const novo = await salvarMeu(
      {
        id: `meu-${Date.now()}`,
        autor: "voce",
        manchete: n.manchete,
        legenda: n.legenda,
        hashtags: n.hashtags,
        local: n.local,
        curtidas: 0,
        comentarios: 0,
        compartilhamentos: 0,
        cena: { emoji: "📸", cores: ["#ffe14d", "#ff3b5c", "#111"] },
        meu: true,
      },
      n.arquivo,
    );
    setMeus((m) => [novo, ...m]);
    setAba("pravoce");
    setCriando(false);
    requestAnimationFrame(() => feed.current?.scrollTo({ top: 0 }));
    avisar("Seu flagra está no ar");
  };

  return (
    <div className="mesa">
      <div className="moldura">
        <header className="topo">
          <span className="ao-vivo">AO VIVO</span>
          <nav className="abas">
            {(
              [
                ["seguindo", "Seguindo"],
                ["pravoce", "Pra você"],
                ["perto", "Perto"],
              ] as [Aba, string][]
            ).map(([id, nome]) => (
              <button key={id} className={aba === id ? "ativa" : ""} onClick={() => (setAba(id), feed.current?.scrollTo({ top: 0 }))}>
                {nome}
              </button>
            ))}
          </nav>
          <Icone nome="lupa" tam={24} cor="#fff" />
        </header>

        <div className="feed" ref={feed}>
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              curtido={curtidos.has(p.id)}
              salvo={salvos.has(p.id)}
              comentarios={p.comentarios + (extras[p.id]?.length ?? 0)}
              mudo={mudo}
              onCurtir={(forcar) => setCurtidos((s) => alternar(s, p.id, forcar))}
              onSalvar={() => {
                setSalvos((s) => alternar(s, p.id));
                if (!salvos.has(p.id)) avisar("Salvo na sua coleção");
              }}
              onComentar={() => setAbertoComentarios(p)}
              onCompartilhar={() => compartilhar(p)}
              onMudo={() => setMudo((m) => !m)}
            />
          ))}
        </div>

        <nav className="barra">
          <button className="ativa">
            <Icone nome="casa" tam={24} />
            Início
          </button>
          <button onClick={() => avisar("Em breve")}>
            <Icone nome="lupa" tam={24} />
            Explorar
          </button>
          <button className="botao-mais" onClick={() => setCriando(true)} aria-label="Novo flagra">
            <span>
              <Icone nome="mais" tam={22} cor="#111" />
            </span>
          </button>
          <button onClick={() => avisar("Em breve")}>
            <Icone nome="sino" tam={24} />
            Alertas
          </button>
          <button onClick={() => avisar("Em breve")}>
            <Icone nome="pessoa" tam={24} />
            Perfil
          </button>
        </nav>

        {abertoComentarios && (
          <Comentarios
            total={abertoComentarios.comentarios + (extras[abertoComentarios.id]?.length ?? 0)}
            lista={[...(extras[abertoComentarios.id] ?? []), ...(abertoComentarios.meu ? [] : comentariosDe(abertoComentarios.id))]}
            onFechar={() => setAbertoComentarios(undefined)}
            onEnviar={(texto) =>
              setExtras((e) => ({
                ...e,
                [abertoComentarios.id]: [{ autor: "voce", texto, ha: 0, curtidas: 0 }, ...(e[abertoComentarios.id] ?? [])],
              }))
            }
          />
        )}
        {criando && <Criar onFechar={() => setCriando(false)} onPostar={postar} />}
        {aviso && <div className="aviso">{aviso}</div>}
      </div>
    </div>
  );
}
