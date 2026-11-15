import React, { useEffect, useRef, useState } from "react";
import { quadroDe } from "../util";
import { Icone } from "./Icone";

export type NovoPost = { manchete: string; legenda: string; hashtags: string[]; local: string; arquivo?: File };

/** Tela de novo flagra: escolhe a mídia, conta o que aconteceu e a IA escreve a manchete. */
export function Criar({ onFechar, onPostar }: { onFechar: () => void; onPostar: (p: NovoPost) => Promise<void> }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File>();
  const [previa, setPrevia] = useState<string>();
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [manchete, setManchete] = useState("");
  const [legenda, setLegenda] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [gerando, setGerando] = useState(false);
  const [postando, setPostando] = useState(false);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const gerar = async () => {
    setErro(undefined);
    setGerando(true);
    try {
      const imagem = arquivo ? { tipo: "image/jpeg" as const, base64: await quadroDe(arquivo) } : undefined;
      const r = await fetch("/api/legenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao, local, imagem }),
      });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro ?? "Não deu para gerar agora");
      setManchete(dados.manchete);
      setLegenda(dados.legenda);
      setHashtags(dados.hashtags.map((h: string) => `#${h}`).join(" "));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para gerar agora");
    } finally {
      setGerando(false);
    }
  };

  const podePostar = manchete.trim() && !postando;
  const postar = async () => {
    if (!podePostar) return;
    setPostando(true);
    await onPostar({
      manchete: manchete.trim(),
      legenda: legenda.trim(),
      hashtags: hashtags.split(/[\s,]+/).map((h) => h.replace(/^#/, "").toLowerCase()).filter(Boolean),
      local: local.trim() || "Por aí",
      arquivo,
    });
  };

  return (
    <div className="criar">
      <header className="criar-topo">
        <button className="icone-botao" onClick={onFechar} aria-label="Fechar">
          <Icone nome="fechar" tam={24} cor="#fff" />
        </button>
        <span>Novo flagra</span>
        <button className="botao-postar" disabled={!podePostar} onClick={postar}>
          {postando ? "Postando..." : "Postar"}
        </button>
      </header>

      <div className="criar-corpo">
        <button className={`escolher ${previa ? "com-previa" : ""}`} onClick={() => entrada.current?.click()}>
          {previa && arquivo?.type.startsWith("video") ? (
            <video src={previa} muted autoPlay loop playsInline />
          ) : previa ? (
            <img src={previa} alt="" />
          ) : (
            <span className="escolher-vazio">
              <Icone nome="camera" tam={40} />
              Gravar ou escolher
              <small>vídeo vertical ou foto</small>
            </span>
          )}
        </button>
        <input ref={entrada} type="file" accept="video/*,image/*" hidden onChange={(e) => e.target.files?.[0] && setArquivo(e.target.files[0])} />

        <label className="campo">
          O que aconteceu?
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: tinha um jacaré enorme boiando na piscina do prédio e o pessoal assistindo da varanda"
          />
        </label>
        <label className="campo">
          Onde?
          <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Bairro, cidade" />
        </label>

        <button className="botao-ia" onClick={gerar} disabled={gerando || (!descricao.trim() && !arquivo)}>
          <Icone nome="brilho" tam={20} />
          {gerando ? "Escrevendo a manchete..." : manchete ? "Gerar outra manchete" : "Escrever manchete com IA"}
        </button>
        {erro && <p className="erro">{erro}</p>}

        <div className={`resultado ${manchete ? "pronto" : ""}`}>
          <span className="selo-flagra">FLAGRA</span>
          <textarea className="campo-manchete" rows={2} value={manchete} onChange={(e) => setManchete(e.target.value)} placeholder="Manchete" />
          <textarea rows={2} value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda" />
          <input className="campo-hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#hashtags" />
        </div>
      </div>
    </div>
  );
}
