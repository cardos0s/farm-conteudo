import React from "react";
import { corDe } from "../util";

export function Avatar({ nome, tam = 44 }: { nome: string; tam?: number }) {
  return (
    <span className="avatar" style={{ width: tam, height: tam, background: corDe(nome), fontSize: tam * 0.42 }}>
      {nome.replace(/[^a-z0-9]/gi, "").slice(0, 1).toUpperCase()}
    </span>
  );
}
