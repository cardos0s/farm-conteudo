import React from "react";
import { Chip, ui } from "../../../lousa/Janelas";
import { TUDO } from "../regioes";

// Em escala: na visão geral do canvas, pedidos travados vão pipocando por todo lado.

const N = 20;
const PEDIDOS = Array.from({ length: N }, (_, i) => {
  // posições espalhadas, determinísticas (sequência de Halton nas bases 2 e 3)
  const halton = (n: number, b: number) => {
    let f = 1;
    let r = 0;
    while (n > 0) {
      f /= b;
      r += f * (n % b);
      n = Math.floor(n / b);
    }
    return r;
  };
  return {
    x: TUDO.x + 380 + halton(i + 1, 2) * (TUDO.w - 760),
    y: TUDO.y + 160 + halton(i + 1, 3) * (TUDO.h - 320),
    n: 4822 + ((i * 37) % 180),
  };
});

export function CenaEscala() {
  return (
    <>
      {PEDIDOS.map((p, i) => (
        <Chip key={i} x={p.x} y={p.y} texto={`pedido #${p.n} · ???`} fundo="#fff4e6" cor={ui.laranja} tam={64} de={74.2 + i * 0.17} ate={81.4} />
      ))}
    </>
  );
}
