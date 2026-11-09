import React from "react";
import { AbsoluteFill } from "remotion";
import gravacaoLogin from "../../public/selloop/telas/teste-login/eventos.json";
import type { Plano } from "./camera";
import type { Gravacao } from "./gravacao";
import "./marca";
import { BalaoCanal, Chip, Fundo, Legenda } from "./Pecas";
import { Tela } from "./Tela";

// Teste do acabamento (fundo, janela, câmera, cursor, balões e legenda) com a tela de login.

const g = gravacaoLogin as unknown as Gravacao;

const planos: Plano[] = [
  { t: 0, zoom: 1 },
  { t: 1.1, caixa: { x: 1040, y: 290, w: 450, h: 360 }, folga: 60, dur: 1.1 },
  { t: 6.4, zoom: 1, dur: 1.1 },
];

export const DURACAO_TESTE = Math.ceil(g.duracao * 10) / 10;

export const SelloopTeste: React.FC = () => (
  <AbsoluteFill>
    <Fundo />
    <Tela gravacao={g} video="selloop/telas/teste-login/tela.mp4" url="app.selloop.com.br" planos={planos} />
    <BalaoCanal canal="whatsapp" x={300} y={250} de={0.25} ate={1.3} />
    <BalaoCanal canal="instagram" x={250} y={470} de={0.4} ate={1.3} />
    <BalaoCanal canal="messenger" x={330} y={690} de={0.55} ate={1.3} />
    <Chip x={1450} y={210} texto="Acesso do administrador" de={2.0} ate={5.6} destaque />
    <Legenda falas={[{ de: 0.3, ate: 3.8, texto: "Seu cliente chama no WhatsApp, no Instagram, no Messenger." }, { de: 3.9, ate: 7.6, texto: "Na Selloop, tudo chega no mesmo lugar." }]} />
  </AbsoluteFill>
);
