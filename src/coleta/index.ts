import Parser from "rss-parser";
import type { Vertical } from "../core/vertical";
import { lerChave } from "../core/estado";

export interface Noticia {
  fonte: string;
  titulo: string;
  url: string;
  resumo: string;
  publicadaEm: string;
}

/** Dado estruturado de uma API. `texto` é o que o redator lê; tudo nele pode ser citado. */
export interface Dado {
  id: string;
  fonte: string;
  url: string;
  titulo: string;
  texto: string;
}

export interface Coleta {
  noticias: Noticia[];
  dados: Dado[];
  falhas: string[];
}

const UA = "Mozilla/5.0 (compatible; FabricaConteudo/1.0)";
const parser = new Parser({ timeout: 20000, headers: { "User-Agent": UA } });

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} em ${url}`);
  return (await r.json()) as T;
}

const limpar = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function coletarRss(v: Vertical, falhas: string[], horas = 48): Promise<Noticia[]> {
  const limite = Date.now() - horas * 3600_000;
  const listas = await Promise.all(
    v.fontes.rss.map(async (f) => {
      try {
        const feed = await parser.parseURL(f.url);
        return feed.items
          .filter((i) => i.link && i.title)
          .map((i) => ({
            fonte: f.nome,
            titulo: limpar(i.title),
            url: i.link!,
            resumo: limpar(i.contentSnippet || i.content || "").slice(0, 600),
            publicadaEm: i.isoDate || new Date().toISOString(),
          }))
          .filter((n) => Date.parse(n.publicadaEm) >= limite);
      } catch (e) {
        falhas.push(`RSS ${f.nome}: ${(e as Error).message}`);
        return [];
      }
    }),
  );
  return listas.flat().sort((a, b) => b.publicadaEm.localeCompare(a.publicadaEm));
}

// ── Cockpit: API aberta Jolpica (sucessora da Ergast) ──────────────
const JOLPICA = "https://api.jolpi.ca/ergast/f1";

async function dadosJolpica(): Promise<Dado[]> {
  type Mr<T> = { MRData: T };
  const [pilotos, construtores, ultima, calendario] = await Promise.all([
    json<Mr<any>>(`${JOLPICA}/current/driverStandings.json`),
    json<Mr<any>>(`${JOLPICA}/current/constructorStandings.json`),
    json<Mr<any>>(`${JOLPICA}/current/last/results.json`),
    json<Mr<any>>(`${JOLPICA}/current.json`),
  ]);
  const dados: Dado[] = [];

  const lp = pilotos.MRData.StandingsTable.StandingsLists[0];
  if (lp) {
    const linhas = lp.DriverStandings.slice(0, 10).map(
      (s: any) => `${s.position}. ${s.Driver.givenName} ${s.Driver.familyName} (${s.Constructors[0]?.name}) — ${s.points} pts, ${s.wins} vitórias`,
    );
    dados.push({
      id: "f1-pilotos",
      fonte: "Jolpica F1 API",
      url: `${JOLPICA}/current/driverStandings.json`,
      titulo: `Classificação de pilotos ${lp.season} após a etapa ${lp.round}`,
      texto: linhas.join("\n"),
    });
  }

  const lc = construtores.MRData.StandingsTable.StandingsLists[0];
  if (lc) {
    dados.push({
      id: "f1-construtores",
      fonte: "Jolpica F1 API",
      url: `${JOLPICA}/current/constructorStandings.json`,
      titulo: `Classificação de construtores ${lc.season} após a etapa ${lc.round}`,
      texto: lc.ConstructorStandings.map((s: any) => `${s.position}. ${s.Constructor.name} — ${s.points} pts`).join("\n"),
    });
  }

  const corrida = ultima.MRData.RaceTable.Races[0];
  if (corrida) {
    const linhas = corrida.Results.slice(0, 10).map(
      (r: any) =>
        `${r.position}. ${r.Driver.givenName} ${r.Driver.familyName} (${r.Constructor.name}) — largou em ${r.grid}, ${r.status}${r.FastestLap?.rank === "1" ? ", volta mais rápida " + r.FastestLap.Time.time : ""}`,
    );
    dados.push({
      id: "f1-ultima-corrida",
      fonte: "Jolpica F1 API",
      url: `${JOLPICA}/current/last/results.json`,
      titulo: `Resultado: ${corrida.raceName} (${corrida.date})`,
      texto: linhas.join("\n"),
    });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const proxima = calendario.MRData.RaceTable.Races.find((r: any) => r.date >= hoje);
  if (proxima) {
    const dias = Math.ceil((Date.parse(proxima.date) - Date.parse(hoje)) / 86400_000);
    dados.push({
      id: "f1-proxima-corrida",
      fonte: "Jolpica F1 API",
      url: `${JOLPICA}/current.json`,
      titulo: `Próxima corrida: ${proxima.raceName}`,
      texto: `${proxima.raceName}, etapa ${proxima.round}, no circuito ${proxima.Circuit.circuitName} (${proxima.Circuit.Location.locality}, ${proxima.Circuit.Location.country}). Data: ${proxima.date}. Faltam ${dias} dias.`,
    });
  }
  return dados;
}

// ── Rebanho: previsão do tempo nas principais praças (Open-Meteo, sem chave) ──
async function dadosClima(v: Vertical): Promise<Dado[]> {
  const linhas = await Promise.all(
    (v.fontes.cidades ?? []).map(async (c) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo&forecast_days=7`;
      const r = await json<any>(url);
      const chuva = r.daily.precipitation_sum.reduce((a: number, b: number) => a + (b ?? 0), 0);
      const max = Math.max(...r.daily.temperature_2m_max);
      const min = Math.min(...r.daily.temperature_2m_min);
      return `${c.nome}: ${chuva.toFixed(0)} mm de chuva previstos em 7 dias; máxima de ${max.toFixed(0)} °C e mínima de ${min.toFixed(0)} °C`;
    }),
  );
  if (!linhas.length) return [];
  return [
    {
      id: "clima-7-dias",
      fonte: "Open-Meteo",
      url: "https://open-meteo.com",
      titulo: `Previsão de 7 dias nas praças pecuárias (a partir de ${new Date().toLocaleDateString("pt-BR")})`,
      texto: linhas.join("\n"),
    },
  ];
}

// ── Focca: contagem regressiva para as provas cadastradas ──────────
function dadosProvas(v: Vertical): Dado[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const futuras = (v.fontes.provas ?? [])
    .map((p) => ({ ...p, dias: Math.ceil((Date.parse(`${p.data}T00:00:00`) - hoje.getTime()) / 86400_000) }))
    .filter((p) => p.dias >= 0)
    .sort((a, b) => a.dias - b.dias);
  if (!futuras.length) return [];
  return [
    {
      id: "provas-contagem",
      fonte: "Calendário oficial de provas (configurado em verticais/focca.ts)",
      url: "",
      titulo: "Contagem regressiva das provas",
      texto: futuras.map((p) => `${p.nome}: ${p.data}, faltam ${p.dias} dias`).join("\n"),
    },
  ];
}

export async function coletar(v: Vertical): Promise<Coleta> {
  const falhas: string[] = [];
  const usadas = new Set(await lerChave<string[]>(`usadas-${v.id}`, []));
  const noticias = (await coletarRss(v, falhas)).filter((n) => !usadas.has(n.url));

  const dados: Dado[] = [];
  for (const fonte of v.fontes.dados) {
    try {
      if (fonte === "jolpica") dados.push(...(await dadosJolpica()));
      if (fonte === "open-meteo") dados.push(...(await dadosClima(v)));
      if (fonte === "calendario-provas") dados.push(...dadosProvas(v));
    } catch (e) {
      falhas.push(`Dados ${fonte}: ${(e as Error).message}`);
    }
  }
  // Não manda manchetes repetidas de veículos diferentes para a triagem.
  const vistos = new Set<string>();
  const unicas = noticias.filter((n) => {
    const chave = n.titulo.toLowerCase().slice(0, 60);
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
  return { noticias: unicas.slice(0, 40), dados, falhas };
}

/** Busca o texto do artigo para o redator e o revisor terem mais do que o resumo do feed. */
export async function textoDoArtigo(url: string, limite = 6000): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return "";
    const html = await r.text();
    const corpo = html
      .replace(/<(script|style|noscript|nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ")
      .match(/<p[\s>][\s\S]*?<\/p>/gi);
    return limpar((corpo ?? []).join("\n")).slice(0, limite);
  } catch {
    return "";
  }
}
