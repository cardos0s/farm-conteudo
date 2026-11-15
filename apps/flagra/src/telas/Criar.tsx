import React, { useEffect, useRef, useState } from "react";
import { Icone } from "../componentes/Icone";
import { useLoja } from "../motor/loja";
import { quadroDe } from "../util";

/** Novo post (foto) ou reel (vídeo). A legenda pode ser escrita pela IA a partir da mídia. */
export function Criar({ onFechar, onPublicado }: { onFechar: () => void; onPublicado: (reel: boolean) => void }) {
  const { acoes } = useLoja();
  const entrada = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File>();
  const [previa, setPrevia] = useState<string>();
  const [legenda, setLegenda] = useState("");
  const [local, setLocal] = useState("");
  const [gerando, setGerando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState<string>();
  const reel = !!arquivo?.type.startsWith("video");

  useEffect(() => {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  useEffect(() => {
    entrada.current?.click();
  }, []);

  const gerar = async () => {
    if (!arquivo) return;
    setErro(undefined);
    setGerando(true);
    try {
      const r = await fetch("/api/legenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: legenda, local, imagem: { tipo: "image/jpeg", base64: await quadroDe(arquivo) } }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro ?? "Não deu para gerar agora");
      setLegenda(`${d.legenda} ${d.hashtags.map((h: string) => `#${h}`).join(" ")}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para gerar agora");
    } finally {
      setGerando(false);
    }
  };

  const publicar = async () => {
    if (!arquivo || publicando) return;
    setPublicando(true);
    const tags = [...legenda.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase());
    const texto = legenda.replace(/#[\p{L}\p{N}_]+/gu, "").trim();
    await acoes.postar({ legenda: texto, tags, local, arquivo });
    onPublicado(reel);
  };

  return (
    <div className="criar">
      <header className="perfil-barra">
        <button onClick={onFechar} aria-label="Fechar">
          <Icone nome="fechar" tam={24} />
        </button>
        <b>{arquivo ? (reel ? "Novo reel" : "Novo post") : "Nova publicação"}</b>
        <button className="link-azul" disabled={!arquivo || publicando} onClick={publicar}>
          {publicando ? "Publicando..." : "Compartilhar"}
        </button>
      </header>
      <input ref={entrada} type="file" accept="image/*,video/*" hidden onChange={(e) => e.target.files?.[0] && setArquivo(e.target.files[0])} />
      <button className={`criar-midia ${reel ? "vertical" : ""}`} onClick={() => entrada.current?.click()}>
        {previa ? (
          reel ? (
            <video src={previa} autoPlay muted loop playsInline />
          ) : (
            <img src={previa} alt="" />
          )
        ) : (
          <span>
            <Icone nome="camera" tam={44} />
            Escolher foto ou vídeo
            <small>foto vira post · vídeo vira reel</small>
          </span>
        )}
      </button>
      <div className="criar-campos">
        <textarea rows={3} value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Escreva uma legenda... (use #temas)" />
        <button className="botao-ia" disabled={!arquivo || gerando} onClick={gerar}>
          <Icone nome="brilho" tam={16} /> {gerando ? "Escrevendo..." : "Legenda com IA"}
        </button>
        {erro && <p className="erro">{erro}</p>}
        <label className="criar-linha">
          <Icone nome="pino" tam={20} />
          <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Adicionar localização" />
        </label>
      </div>
    </div>
  );
}
