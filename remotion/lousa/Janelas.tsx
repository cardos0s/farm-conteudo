import React, { useId } from "react";
import { Easing } from "remotion";
import { AVANCO_CODIGO, FONTE_CODIGO } from "./fontes";
import { tinta } from "./paleta";
import { progresso, saida, useT } from "./tempo";
import { Texto } from "./Texto";

// Peças "de aplicativo" para a lousa, no estilo dos canvas de terminais (painéis limpos, com sombra,
// espalhados num canvas pontilhado). Os rabiscos continuam à mão (Esboco); as janelas são nítidas.

export const FONTE_UI = "Inter, 'Helvetica Neue', Arial, sans-serif";

export const ui = {
  fundo: "#ffffff",
  barra: "#f6f6f3",
  borda: "#dcdcd5",
  linha: "#e9e9e3",
  texto: "#2b2b2b",
  apagado: "#8a8f98",
  violeta: "#7048e8",
  verde: "#2b8a3e",
  vermelho: "#e03131",
  laranja: "#e8590c",
  azul: "#1971c2",
  rosa: "#e64980",
} as const;

/** Largura aproximada de um texto em Inter (média por caractere). */
export const larguraUI = (s: string, tam: number, negrito = false) => [...s].length * tam * (negrito ? 0.6 : 0.56);

const entrar = Easing.out(Easing.back(1.5));

/** Escala/opacidade de quando um painel "cai" no canvas. */
function useEntrada(de: number, ate?: number) {
  const t = useT();
  if (t < de) return null;
  const p = progresso(t, de, 0.38, entrar);
  const alfa = Math.min(1, (t - de) / 0.18) * saida(t, ate, 0.3);
  if (alfa <= 0) return null;
  return { escala: 0.9 + 0.1 * p, alfa };
}

export type JanelaProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  titulo: string;
  /** cor do ponto de status ao lado do título */
  status?: string;
  /** etiqueta à direita da barra (ex.: o modelo) */
  chip?: { texto: string; fundo: string; cor: string; de?: number };
  de: number;
  ate?: number;
  /** destaca a borda (ex.: o agente que está trabalhando agora) */
  ativo?: [number, number][];
  corAtivo?: string;
  children?: React.ReactNode;
};

export const BARRA = 50;

/** Painel com barra de título; os filhos são desenhados no corpo, com origem no canto do corpo. */
export function Janela({ x, y, w, h, titulo, status = "#c9c9c2", chip, de, ate, ativo, corAtivo = ui.violeta, children }: JanelaProps) {
  const t = useT();
  const e = useEntrada(de, ate);
  if (!e) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const aceso = ativo?.some(([a, b]) => t >= a && t < b) ?? false;
  const chipVisivel = chip && t >= (chip.de ?? de);
  const pChip = chip ? progresso(t, chip.de ?? de, 0.3, entrar) : 0;
  const wChip = chip ? larguraUI(chip.texto, 20, true) + 28 : 0;
  return (
    <g opacity={e.alfa} transform={`translate(${cx} ${cy}) scale(${e.escala}) translate(${-cx} ${-cy})`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={16}
        fill={ui.fundo}
        stroke={aceso ? corAtivo : ui.borda}
        strokeWidth={aceso ? 3.5 : 1.6}
        style={{ filter: "drop-shadow(0 10px 18px rgba(30, 30, 25, 0.12))" }}
      />
      <path d={`M${x + 1} ${y + BARRA} V${y + 16} Q${x + 1} ${y + 1} ${x + 16} ${y + 1} H${x + w - 16} Q${x + w - 1} ${y + 1} ${x + w - 1} ${y + 16} V${y + BARRA} Z`} fill={ui.barra} />
      <line x1={x} y1={y + BARRA} x2={x + w} y2={y + BARRA} stroke={ui.linha} strokeWidth={1.5} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 24 + i * 20} cy={y + BARRA / 2} r={6} fill="#dedfd8" />
      ))}
      <circle cx={x + 94} cy={y + BARRA / 2} r={7} fill={status} />
      <text x={x + 110} y={y + BARRA / 2 + 8} fontFamily={FONTE_UI} fontWeight={700} fontSize={23} fill={ui.texto}>
        {titulo}
      </text>
      {chipVisivel && chip && (
        <g opacity={Math.min(1, pChip * 1.5)} transform={`translate(${x + w - 14 - wChip / 2} ${y + BARRA / 2}) scale(${0.8 + 0.2 * pChip})`}>
          <rect x={-wChip / 2} y={-16} width={wChip} height={32} rx={16} fill={chip.fundo} />
          <text x={0} y={7} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={20} fill={chip.cor}>
            {chip.texto}
          </text>
        </g>
      )}
      <g transform={`translate(${x} ${y + BARRA})`}>{children}</g>
    </g>
  );
}

/** Pedaço de uma linha de terminal: texto e cor. */
export type Trecho = [string, string?];
export type LinhaTerminal = {
  /** quando a linha começa a ser digitada */
  de: number;
  partes: Trecho[] | string;
  /** segundos por caractere */
  ritmo?: number;
  /** indicador "pensando" no lugar do 1º caractere até `troca` */
  gira?: boolean;
  /** a partir de `t`, a linha passa a mostrar `partes` (sem digitar) */
  troca?: { t: number; partes: Trecho[] | string };
  /** some a partir deste segundo */
  ate?: number;
  /** posição (linha) no corpo; por padrão, a ordem na lista */
  pos?: number;
};

const GIRO = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const comoTrechos = (p: Trecho[] | string): Trecho[] => (typeof p === "string" ? [[p]] : p);

export type TerminalProps = Omit<JanelaProps, "children"> & {
  linhas: LinhaTerminal[];
  tam?: number;
  /** espaço entre linhas, em múltiplos de `tam` */
  entre?: number;
  /** cor padrão do texto */
  corTexto?: string;
  /** primeira linha começa aqui (px abaixo da barra) */
  topo?: number;
  /** cursor piscando depois da última linha digitada */
  cursor?: boolean;
};

/** Painel de terminal: as linhas são digitadas no tempo, com cursor e indicador "pensando". */
export function Terminal({ linhas, tam = 26, entre = 1.5, corTexto = ui.texto, topo, cursor = true, ...janela }: TerminalProps) {
  const t = useT();
  const y0 = topo ?? 22 + tam;
  const cursores: { x: number; y: number; de: number }[] = [];
  const conteudo = linhas.map((l, i) => {
    if (t < l.de || (l.ate !== undefined && t >= l.ate)) return null;
    const trocou = l.troca && t >= l.troca.t;
    const trechos = comoTrechos(trocou ? l.troca!.partes : l.partes);
    const total = trechos.reduce((a, [s]) => a + [...s].length, 0);
    const ritmo = l.ritmo ?? 0.02;
    const n = trocou ? total : Math.min(total, Math.floor((t - l.de) / ritmo) + 1);
    const y = y0 + (l.pos ?? i) * tam * entre;
    let resto = n;
    const tspans: React.ReactNode[] = [];
    trechos.forEach(([s, c], k) => {
      if (resto <= 0) return;
      let parte = [...s].slice(0, resto).join("");
      if (k === 0 && l.gira && !trocou && parte.length > 0) {
        parte = GIRO[Math.floor(t * 12) % GIRO.length] + parte.slice(1);
      }
      resto -= [...s].length;
      tspans.push(
        <tspan key={k} fill={c ?? corTexto}>
          {parte}
        </tspan>,
      );
    });
    if (!trocou && t < l.de + total * ritmo + 1.2) cursores.push({ x: 26 + n * tam * AVANCO_CODIGO, y, de: l.de });
    return (
      <text key={i} x={26} y={y} fontFamily={FONTE_CODIGO} fontSize={tam} style={{ whiteSpace: "pre" }}>
        {tspans}
      </text>
    );
  });
  // cursor na linha que começou por último
  const c = cursores.sort((a, b) => b.de - a.de)[0];
  const pisca = Math.floor(t * 2) % 2 === 0;
  return (
    <Janela {...janela}>
      {conteudo}
      {cursor && c && pisca && <rect x={c.x + 2} y={c.y - tam * 0.82} width={tam * 0.52} height={tam * 1.02} fill={ui.violeta} opacity={0.75} />}
    </Janela>
  );
}

/** Etiqueta em pílula (ex.: nome de ferramenta). (x, y) é o centro. */
export function Chip({ x, y, texto, fundo = "#f1f3f5", cor = ui.texto, tam = 24, de, ate }: { x: number; y: number; texto: string; fundo?: string; cor?: string; tam?: number; de: number; ate?: number }) {
  const e = useEntrada(de, ate);
  if (!e) return null;
  const w = larguraUI(texto, tam, true) + tam * 1.4;
  const h = tam * 1.7;
  return (
    <g opacity={e.alfa} transform={`translate(${x} ${y}) scale(${e.escala})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fundo} stroke="rgba(0,0,0,0.06)" style={{ filter: "drop-shadow(0 4px 8px rgba(30,30,25,0.10))" }} />
      <text x={0} y={tam * 0.36} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={tam} fill={cor}>
        {texto}
      </text>
    </g>
  );
}

/** Nota adesiva com texto manuscrito. */
export function Nota({
  x,
  y,
  w,
  h,
  texto,
  tam = 46,
  fundo = "#fff3bf",
  corTexto = tinta,
  destaque = ui.rosa,
  girar = -1.5,
  de,
  durTexto,
  ate,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  texto?: string;
  tam?: number;
  fundo?: string;
  corTexto?: string;
  destaque?: string;
  girar?: number;
  de: number;
  durTexto?: number;
  ate?: number;
  children?: React.ReactNode;
}) {
  const e = useEntrada(de, ate);
  if (!e) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={e.alfa} transform={`rotate(${girar} ${cx} ${cy}) translate(${cx} ${cy}) scale(${e.escala}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fundo} style={{ filter: "drop-shadow(0 8px 14px rgba(60, 50, 0, 0.16))" }} />
      <rect x={x} y={y} width={w} height={14} rx={4} fill="rgba(0,0,0,0.035)" />
      {texto && (
        <Texto x={x + 34} y={y + 40 + tam} tam={tam} cor={corTexto} destaque={destaque} de={de + 0.2} dur={durTexto}>
          {texto}
        </Texto>
      )}
      {children}
    </g>
  );
}

type Ponto = [number, number];

/** Ponto e direção na curva quadrática a-c-b em s (0..1). */
function naCurva(a: Ponto, c: Ponto, b: Ponto, s: number): { p: Ponto; ang: number } {
  const u = 1 - s;
  const p: Ponto = [u * u * a[0] + 2 * u * s * c[0] + s * s * b[0], u * u * a[1] + 2 * u * s * c[1] + s * s * b[1]];
  const dx = 2 * u * (c[0] - a[0]) + 2 * s * (b[0] - c[0]);
  const dy = 2 * u * (c[1] - a[1]) + 2 * s * (b[1] - c[1]);
  return { p, ang: Math.atan2(dy, dx) };
}

/**
 * Seta tracejada (curva suave) que se desenha no tempo; durante `fluxo` os traços correm na direção
 * da seta, e `carga` faz uma etiqueta viajar de uma ponta à outra.
 */
export function SetaTracejada({
  desde,
  para,
  via,
  cor = ui.apagado,
  espessura = 4,
  traco = "13 11",
  ponta = 20,
  de,
  dur = 0.6,
  ate,
  fluxo,
  carga,
}: {
  desde: Ponto;
  para: Ponto;
  via?: Ponto;
  cor?: string;
  espessura?: number;
  traco?: string;
  ponta?: number;
  de: number;
  dur?: number;
  ate?: number;
  fluxo?: [number, number];
  carga?: { texto: string; de: number; dur?: number; fundo?: string; cor?: string };
}) {
  const t = useT();
  const id = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");
  if (t < de) return null;
  const alfa = saida(t, ate, 0.3);
  if (alfa <= 0) return null;
  const c: Ponto = via ?? [(desde[0] + para[0]) / 2, (desde[1] + para[1]) / 2];
  const d = `M${desde[0]} ${desde[1]} Q${c[0]} ${c[1]} ${para[0]} ${para[1]}`;
  const p = progresso(t, de, dur);
  const corre = fluxo && t >= fluxo[0] && t < fluxo[1] ? -(t - fluxo[0]) * 48 : 0;
  const fim = naCurva(desde, c, para, 1);
  const cabeca = progresso(t, de + dur * 0.85, 0.15);
  const a1: Ponto = [para[0] - ponta * Math.cos(fim.ang - 0.5), para[1] - ponta * Math.sin(fim.ang - 0.5)];
  const a2: Ponto = [para[0] - ponta * Math.cos(fim.ang + 0.5), para[1] - ponta * Math.sin(fim.ang + 0.5)];
  let etiqueta: React.ReactNode = null;
  if (carga && t >= carga.de) {
    const q = progresso(t, carga.de, carga.dur ?? 0.9);
    const { p: pos } = naCurva(desde, c, para, q);
    const sai = progresso(t, carga.de + (carga.dur ?? 0.9), 0.25);
    const w = larguraUI(carga.texto, 19, true) + 24;
    etiqueta = (
      <g opacity={1 - sai} transform={`translate(${pos[0]} ${pos[1]})`}>
        <rect x={-w / 2} y={-17} width={w} height={34} rx={9} fill={carga.fundo ?? "#ffffff"} stroke={cor} strokeWidth={2} />
        <text x={0} y={7} textAnchor="middle" fontFamily={FONTE_UI} fontWeight={700} fontSize={19} fill={carga.cor ?? ui.texto}>
          {carga.texto}
        </text>
      </g>
    );
  }
  return (
    <g opacity={alfa}>
      <mask id={id} maskUnits="userSpaceOnUse">
        <path d={d} stroke="#fff" strokeWidth={espessura + 10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
      </mask>
      <path d={d} stroke={cor} strokeWidth={espessura} fill="none" strokeLinecap="round" strokeDasharray={traco} strokeDashoffset={corre} mask={`url(#${id})`} />
      {cabeca > 0 && (
        <path
          d={`M${a1[0]} ${a1[1]} L${para[0]} ${para[1]} L${a2[0]} ${a2[1]}`}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={cabeca}
        />
      )}
      {etiqueta}
    </g>
  );
}

/** Celular com um app de tarefas (mockup simples). */
export function Celular({ x, y, w = 210, de, ate, itens = ["telas", "banco de dados", "login", "notificações"] }: { x: number; y: number; w?: number; de: number; ate?: number; itens?: string[] }) {
  const t = useT();
  const e = useEntrada(de, ate);
  if (!e) return null;
  const h = w * 2.02;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={e.alfa} transform={`translate(${cx} ${cy}) scale(${e.escala}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={34} fill="#1f1f1f" style={{ filter: "drop-shadow(0 12px 20px rgba(30,30,25,0.16))" }} />
      <rect x={x + 9} y={y + 9} width={w - 18} height={h - 18} rx={27} fill="#ffffff" />
      <rect x={cx - 34} y={y + 18} width={68} height={18} rx={9} fill="#1f1f1f" />
      <text x={x + 26} y={y + 82} fontFamily={FONTE_UI} fontWeight={700} fontSize={22} fill={ui.texto}>
        Tarefas
      </text>
      {itens.map((s, i) => {
        const yi = y + 112 + i * 62;
        const marcado = t >= de + 0.5 + i * 0.25;
        return (
          <g key={s}>
            <rect x={x + 22} y={yi} width={w - 44} height={48} rx={10} fill="#f4f4f1" />
            <rect x={x + 34} y={yi + 13} width={22} height={22} rx={6} fill={marcado ? ui.violeta : "#ffffff"} stroke={marcado ? ui.violeta : "#c9c9c2"} strokeWidth={2} />
            {marcado && <path d={`M${x + 39} ${yi + 24} l5 5 l9 -10`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <text x={x + 66} y={yi + 31} fontFamily={FONTE_UI} fontSize={17} fill={ui.texto}>
              {s}
            </text>
          </g>
        );
      })}
    </g>
  );
}
