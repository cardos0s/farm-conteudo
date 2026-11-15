import React, { useState } from "react";
import type { Comentario } from "../tipos";
import { numero, tempo } from "../util";
import { Avatar } from "./Avatar";
import { Icone } from "./Icone";

export function Comentarios({ total, lista, onFechar, onEnviar }: { total: number; lista: Comentario[]; onFechar: () => void; onEnviar: (t: string) => void }) {
  const [texto, setTexto] = useState("");
  const [curtidos, setCurtidos] = useState<Set<number>>(new Set());
  return (
    <div className="veu" onClick={onFechar}>
      <section className="folha" onClick={(e) => e.stopPropagation()}>
        <header className="folha-topo">
          <span>{numero(total)} comentários</span>
          <button className="icone-botao" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" tam={22} cor="#fff" />
          </button>
        </header>
        <ul className="comentarios">
          {lista.map((c, i) => (
            <li key={i}>
              <Avatar nome={c.autor} tam={36} />
              <div>
                <b>@{c.autor}</b> <span className="tempo">{tempo(c.ha)}</span>
                <p>{c.texto}</p>
              </div>
              <button
                className="mini-curtir"
                onClick={() => setCurtidos((s) => (s.has(i) ? (s.delete(i), new Set(s)) : new Set(s.add(i))))}
              >
                <Icone nome="coracao" tam={16} cor={curtidos.has(i) ? "#ff3b5c" : "#888"} />
                <span>{numero(c.curtidas + (curtidos.has(i) ? 1 : 0))}</span>
              </button>
            </li>
          ))}
        </ul>
        <form
          className="comentar"
          onSubmit={(e) => {
            e.preventDefault();
            if (!texto.trim()) return;
            onEnviar(texto.trim());
            setTexto("");
          }}
        >
          <Avatar nome="voce" tam={32} />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Comente algo..." />
          <button type="submit" disabled={!texto.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
