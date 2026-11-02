import type { Marca } from "./roteiro";

export type FonteDados = "jolpica" | "open-meteo" | "calendario-provas";

export interface FonteRss {
  nome: string;
  url: string;
}

export interface Prova {
  nome: string;
  /** AAAA-MM-DD */
  data: string;
}

export interface Vertical {
  id: "cockpit" | "rebanho" | "focca";
  /**
   * Se a fábrica produz para este app quando o comando roda sem nomes (o caso do cron).
   * Uma vertical pausada continua configurada e ainda roda se for pedida pelo nome: `npm run diario focca`.
   */
  ativa: boolean;
  app: {
    nome: string;
    descricao: string;
    /** Link base do app; os parâmetros UTM são adicionados por canal. */
    link: string;
  };
  nicho: string;
  publico: string;
  tom: string;
  /** O que a marca nunca faz. Entra no prompt do redator e do revisor. */
  regras: string[];
  fontes: {
    rss: FonteRss[];
    dados: FonteDados[];
    /** Cidades para clima (open-meteo). */
    cidades?: { nome: string; lat: number; lon: number }[];
    /** Datas de provas para contagem regressiva (calendario-provas). */
    provas?: Prova[];
  };
  marca: Marca;
  volume: {
    /** Reels por dia. Cada um ocupa um horário de HORARIOS.reel. */
    reelsPorDia: number;
    /** Carrosséis por dia. Cada um ocupa um horário de HORARIOS.carrossel. */
    carrosseisPorDia: number;
    /** Dia da semana da newsletter, 0 = domingo. */
    diaNewsletter: number;
    /**
     * "manual": cada peça espera o seu ✅ no Telegram.
     * "automatica": o que passa no revisor já entra na agenda; no Telegram chega só um aviso com o botão de cancelar.
     */
    aprovacao: "manual" | "automatica";
  };
  newsletter: { nome: string; descricao: string };
  hashtags: string[];
}

export function linkRastreado(v: Vertical, canal: "instagram" | "newsletter", campanha = "fabrica"): string {
  const url = new URL(v.app.link);
  url.searchParams.set("utm_source", canal);
  url.searchParams.set("utm_medium", canal === "newsletter" ? "email" : "social");
  url.searchParams.set("utm_campaign", `${v.id}-${campanha}`);
  return url.toString();
}
