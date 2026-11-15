import React from "react";
import type { Usuario } from "../motor/tipos";
import { corDe } from "../util";

/** Foto de perfil. `anel`: "novo" (story não visto, gradiente), "visto" (cinza) ou nenhum. */
export function Avatar({ u, tam = 32, anel }: { u: Usuario; tam?: number; anel?: "novo" | "visto" }) {
  const miolo = u.avatar ? (
    <img src={u.avatar} alt="" className="avatar" style={{ width: tam, height: tam }} />
  ) : (
    <span className="avatar avatar-letra" style={{ width: tam, height: tam, background: corDe(u.id), fontSize: tam * 0.42 }}>
      {u.nome.slice(0, 1).toUpperCase()}
    </span>
  );
  if (!anel) return miolo;
  return <span className={`anel anel-${anel}`}>{miolo}</span>;
}

export function Nome({ u, className }: { u: Usuario; className?: string }) {
  return (
    <span className={`nome ${className ?? ""}`}>
      {u.id}
      {u.verificado && (
        <svg viewBox="0 0 24 24" width="13" height="13" className="selo-verificado" aria-label="verificado">
          <path fill="#0095f6" d="M12 1.6l2.5 1.8 3.1-.1 1 2.9 2.5 1.9-1 3 1 3-2.5 1.8-1 3-3.1-.1L12 22.4l-2.5-1.8-3.1.1-1-2.9-2.5-1.9 1-3-1-3 2.5-1.8 1-3 3.1.1z" />
          <path d="M8 12.2l2.7 2.7L16.2 9.4" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
