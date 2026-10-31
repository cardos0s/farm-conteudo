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
    videosPorDia: number;
    /** Dia da semana da newsletter, 0 = domingo. */
    diaNewsletter: number;
  };
  newsletter: { nome: string; descricao: string };
  hashtags: string[];
  /** Vídeos UGC com personagem de IA (npm run ugc). */
  ugc?: {
    /** Pasta em personas/. */
    persona: string;
    /** Pasta em estilos/ (saída da skill decupar-perfil). */
    estilo: string;
    /** Prints ou gravações de tela do app, que podem aparecer no vídeo. Caminhos a partir da raiz do projeto. */
    telas: { nome: string; arquivo: string; descricao: string }[];
    /** Fatos verificados que a personagem pode citar (números, recursos, preço). Nada fora daqui vira afirmação. */
    fatos: string[];
  };
}

export function linkRastreado(v: Vertical, canal: "instagram" | "newsletter", campanha = "fabrica"): string {
  const url = new URL(v.app.link);
  url.searchParams.set("utm_source", canal);
  url.searchParams.set("utm_medium", canal === "newsletter" ? "email" : "social");
  url.searchParams.set("utm_campaign", `${v.id}-${campanha}`);
  return url.toString();
}
