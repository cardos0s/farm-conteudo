import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Roteiro } from "./roteiro";
import type { Vertical } from "./vertical";

// Cada peça fica num arquivo JSON próprio em dados/pecas/, assim o cron diário
// e o bot do Telegram podem rodar ao mesmo tempo sem pisar no estado um do outro.

export const DIR_DADOS = process.env.FABRICA_DADOS || "dados";
const DIR_PECAS = path.join(DIR_DADOS, "pecas");

export type StatusPeca =
  | "aguardando" // enviada ao Telegram, esperando aprovação
  | "aprovada" // aprovada, na fila de publicação
  | "rejeitada"
  | "publicada"
  | "erro";

export interface Peca {
  id: string;
  tipo: "reel" | "newsletter";
  vertical: Vertical["id"];
  criadaEm: string;
  status: StatusPeca;
  titulo: string;
  fontes: { nome: string; url: string }[];
  roteiro?: Roteiro;
  legenda?: string;
  blocoNewsletter?: string;
  /** Newsletter: HTML completo e assunto. */
  html?: string;
  assunto?: string;
  videoPath?: string;
  agendadaPara?: string;
  publicadaEm?: string;
  idExterno?: string;
  permalink?: string;
  erro?: string;
  tentativas?: number;
}

async function escreverAtomico(arquivo: string, dados: unknown) {
  await mkdir(path.dirname(arquivo), { recursive: true });
  const tmp = `${arquivo}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(dados, null, 2));
  await rename(tmp, arquivo);
}

export async function salvarPeca(p: Peca): Promise<Peca> {
  await escreverAtomico(path.join(DIR_PECAS, `${p.id}.json`), p);
  return p;
}

export async function lerPeca(id: string): Promise<Peca | null> {
  try {
    return JSON.parse(await readFile(path.join(DIR_PECAS, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function listarPecas(filtro: (p: Peca) => boolean = () => true): Promise<Peca[]> {
  let arquivos: string[] = [];
  try {
    arquivos = (await readdir(DIR_PECAS)).filter((a) => a.endsWith(".json"));
  } catch {
    return [];
  }
  const pecas: Peca[] = [];
  for (const a of arquivos) {
    const p = await lerPeca(a.replace(/\.json$/, ""));
    if (p && filtro(p)) pecas.push(p);
  }
  return pecas.sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));
}

export async function atualizarPeca(id: string, mudancas: Partial<Peca>): Promise<Peca> {
  const atual = await lerPeca(id);
  if (!atual) throw new Error(`Peça não encontrada: ${id}`);
  return salvarPeca({ ...atual, ...mudancas });
}

/** Pequeno armazenamento chave-valor para o que não é peça (offset do Telegram, URLs já usadas). */
export async function lerChave<T>(chave: string, padrao: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(DIR_DADOS, `${chave}.json`), "utf8"));
  } catch {
    return padrao;
  }
}

export async function gravarChave(chave: string, valor: unknown) {
  await escreverAtomico(path.join(DIR_DADOS, `${chave}.json`), valor);
}

export function novoId(vertical: string, tipo: string): string {
  const agora = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  return `${vertical}-${tipo}-${agora}-${Math.random().toString(36).slice(2, 6)}`;
}
