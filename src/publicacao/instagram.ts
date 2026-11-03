import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gravarChave, lerChave } from "../core/estado";
import type { Vertical } from "../core/vertical";

// Publicação de Reels e carrosséis pela API do Instagram.
// Reel: cria o contêiner com a URL do vídeo, espera o processamento e publica.
// Carrossel: cria um contêiner por imagem, junta todos num contêiner CAROUSEL e publica (conta como 1 post no limite diário da API).
//
// As três formas de acesso da Meta usam os mesmos passos de publicação; muda o host e o token:
// - Login unificado (padrão, recomendado pela Meta): graph.facebook.com, token de usuário do sistema (SUAT),
//   que pode nunca vencer. Precisa de portfólio empresarial, não de página do Facebook.
// - Login do Instagram: IG_GRAPH_HOST=graph.instagram.com, token de 60 dias (a fábrica renova sozinha).
// - Login do Facebook (legado): graph.facebook.com com IG_<APP>_USER_ID e conta ligada a uma página.

const HOST_INSTAGRAM = "graph.instagram.com";
const host = () => process.env.IG_GRAPH_HOST || "graph.facebook.com";
const versao = () => process.env.IG_GRAPH_VERSION || "v26.0";
const base = () => `https://${host()}/${versao()}`;
const DIA = 86400_000;

/** O token do .env (e o ID da conta, se informado). Serve para saber se o Instagram do app está configurado. */
export function credenciaisInstagram(v: Vertical) {
  const prefixo = `IG_${v.id.toUpperCase()}`;
  const token = process.env[`${prefixo}_TOKEN`];
  const usuario = process.env[`${prefixo}_USER_ID`] || undefined;
  return token ? { usuario, token } : null;
}

async function graph(metodo: "GET" | "POST", caminho: string, params: Record<string, string>) {
  const url = new URL(`${base()}/${caminho}`);
  const corpo = new URLSearchParams(params);
  const r = await fetch(metodo === "GET" ? `${url}?${corpo}` : url, {
    method: metodo,
    body: metodo === "POST" ? corpo : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const j = (await r.json()) as any;
  if (!r.ok || j.error) throw new Error(`Instagram ${caminho}: ${j.error?.message ?? r.status}`);
  return j;
}

// ── Token: renovação automática ────────────────────────────────────
// Só para o login do Instagram: o token de longa duração dele vence em 60 dias. A fábrica renova sozinha a cada 7 dias
// e guarda o token novo em dados/ (o do .env continua sendo o ponto de partida). Se você trocar o token
// do .env, a fábrica percebe e recomeça a partir dele.

interface TokenGuardado {
  /** Impressão digital do token do .env de onde este veio. */
  origem: string;
  token: string;
  renovadoEm: string;
  expiraEm?: string;
}

export const RENOVAR_TOKEN_A_CADA = 7 * DIA;
const chaveToken = (v: Vertical) => `token-instagram-${v.id}`;
const impressao = (t: string) => createHash("sha256").update(t).digest("hex").slice(0, 16);

function exigirCredenciais(v: Vertical) {
  const cred = credenciaisInstagram(v);
  if (!cred) throw new Error(`Token do Instagram do ${v.app.nome} não configurado (IG_${v.id.toUpperCase()}_TOKEN)`);
  return cred;
}

/** O token mais novo: o renovado, se houver, ou o do .env. */
async function tokenAtual(v: Vertical): Promise<string> {
  const cred = exigirCredenciais(v);
  const guardado = await lerChave<TokenGuardado | null>(chaveToken(v), null);
  return guardado && guardado.origem === impressao(cred.token) ? guardado.token : cred.token;
}

/**
 * Renova o token se a última renovação tiver mais de 7 dias. Só se aplica ao login do Instagram.
 * Na primeira vez, só registra o token do .env (a API exige que ele tenha pelo menos 24 h para renovar).
 */
export async function renovarTokenInstagram(v: Vertical, agora = Date.now()): Promise<"renovado" | "em-dia" | "nao-se-aplica"> {
  const cred = credenciaisInstagram(v);
  if (!cred || host() !== HOST_INSTAGRAM) return "nao-se-aplica";
  const origem = impressao(cred.token);
  const guardado = await lerChave<TokenGuardado | null>(chaveToken(v), null);
  if (!guardado || guardado.origem !== origem) {
    await gravarChave(chaveToken(v), { origem, token: cred.token, renovadoEm: new Date(agora).toISOString() } satisfies TokenGuardado);
    return "em-dia";
  }
  if (agora - Date.parse(guardado.renovadoEm) < RENOVAR_TOKEN_A_CADA) return "em-dia";

  const url = `https://${HOST_INSTAGRAM}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: guardado.token })}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const j = (await r.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!r.ok || !j.access_token) {
    const vence = new Date(Date.parse(guardado.renovadoEm) + 60 * DIA).toLocaleDateString("pt-BR");
    throw new Error(
      `não consegui renovar o token do Instagram do ${v.app.nome} (${j.error?.message ?? r.status}). Ele vence por volta de ${vence}: gere um novo no painel da Meta e troque IG_${v.id.toUpperCase()}_TOKEN no .env.`,
    );
  }
  await gravarChave(chaveToken(v), {
    origem,
    token: j.access_token,
    renovadoEm: new Date(agora).toISOString(),
    expiraEm: j.expires_in ? new Date(agora + j.expires_in * 1000).toISOString() : undefined,
  } satisfies TokenGuardado);
  return "renovado";
}

/** Descobre a conta do token: o ID usado para publicar e o @. */
export async function contaInstagram(v: Vertical): Promise<{ id: string; username?: string }> {
  const cred = exigirCredenciais(v);
  const token = await tokenAtual(v);
  if (host() !== HOST_INSTAGRAM) {
    if (cred.usuario) {
      const conta = await graph("GET", cred.usuario, { fields: "username", access_token: token });
      return { id: cred.usuario, username: conta.username };
    }
    // Login unificado: /me é o usuário do sistema; as contas do Instagram vêm de assigned_instagram_accounts.
    let { data = [] } = await graph("GET", "me/assigned_instagram_accounts", { fields: "id,username", access_token: token });
    if (!data.length) {
      // Login do Facebook (ou token de página): a conta vem pela página ligada a ela.
      const paginas = await graph("GET", "me/accounts", { fields: "instagram_business_account{id,username}", access_token: token }).catch(() => ({ data: [] }));
      data = (paginas.data ?? []).map((p: { instagram_business_account?: unknown }) => p.instagram_business_account).filter(Boolean);
    }
    if (!data.length) {
      throw new Error(
        `o token não dá acesso a nenhuma conta do Instagram. Preencha IG_${v.id.toUpperCase()}_USER_ID com o número da conta (aparece na tabela "Gerar tokens de acesso" do painel da Meta) ou rode npm run diagnostico`,
      );
    }
    if (data.length > 1) {
      const lista = data.map((c: { id: string; username?: string }) => `@${c.username} (${c.id})`).join(", ");
      throw new Error(`o token dá acesso a mais de uma conta: ${lista}. Coloque o número da conta certa em IG_${v.id.toUpperCase()}_USER_ID`);
    }
    return { id: String(data[0].id), username: data[0].username };
  }
  const eu = await graph("GET", "me", { fields: "user_id,username", access_token: token });
  return { id: cred.usuario ?? String(eu.user_id ?? eu.id), username: eu.username };
}

const contas = new Map<string, string>();
async function credenciaisDePublicacao(v: Vertical) {
  const cred = exigirCredenciais(v);
  const token = await tokenAtual(v);
  let usuario = cred.usuario ?? contas.get(v.id);
  if (!usuario) {
    usuario = (await contaInstagram(v)).id;
    contas.set(v.id, usuario);
  }
  return { usuario, token };
}

/** Multiplica as esperas pelo processamento do Instagram. Os testes zeram para não esperar de verdade. */
export const ritmo = { escala: 1 };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms * ritmo.escala));

/** Espera o contêiner ficar pronto. Vídeo costuma levar de 30 s a 2 min; imagem, poucos segundos. */
async function esperarConteiner(id: string, token: string, intervalo = 15000, tentativas = 40) {
  for (let i = 0; i < tentativas; i++) {
    const st = await graph("GET", id, { fields: "status_code,status", access_token: token });
    if (st.status_code === "FINISHED") return;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`Instagram recusou a mídia: ${st.status}`);
    await esperar(intervalo);
  }
  throw new Error(`Instagram não terminou de processar a mídia em ${Math.round((intervalo * tentativas) / 60000)} minutos`);
}

async function publicarConteiner(usuario: string, token: string, conteiner: string) {
  const pub = await graph("POST", `${usuario}/media_publish`, { creation_id: conteiner, access_token: token });
  const info = await graph("GET", pub.id, { fields: "permalink", access_token: token }).catch(() => null);
  return { id: pub.id as string, permalink: info?.permalink as string | undefined };
}

/**
 * O login unificado e o do Facebook (graph.facebook.com) aceitam o vídeo direto do disco, pelo upload
 * retomável em rupload.facebook.com. O login do Instagram (graph.instagram.com) só aceita link público.
 * Imagens, em qualquer login, só por link público.
 */
export const uploadDiretoDeVideo = () => host() !== HOST_INSTAGRAM;

/** Envia os bytes do vídeo para o contêiner criado com upload_type=resumable. */
async function enviarVideoDireto(conteiner: { id: string; uri?: string }, arquivo: string, token: string) {
  const video = await readFile(arquivo);
  const uri = conteiner.uri ?? `https://rupload.facebook.com/ig-api-upload/${versao()}/${conteiner.id}`;
  const r = await fetch(uri, {
    method: "POST",
    headers: { Authorization: `OAuth ${token}`, offset: "0", file_size: String(video.byteLength) },
    body: video,
    signal: AbortSignal.timeout(15 * 60_000),
  });
  const j = (await r.json().catch(() => ({}))) as { success?: boolean; debug_info?: { message?: string } };
  if (!r.ok || !j.success) throw new Error(`Instagram recusou o envio do vídeo: ${j.debug_info?.message ?? r.status}`);
}

/**
 * Testa se o token pode publicar, sem publicar nada: cria um contêiner de Reel vazio (upload retomável),
 * que nunca é enviado nem publicado e expira sozinho em 24 h. Não conta no limite de posts por dia.
 */
export async function testarPermissaoDePublicacao(v: Vertical): Promise<void> {
  const cred = await credenciaisDePublicacao(v);
  await graph("POST", `${cred.usuario}/media`, {
    media_type: "REELS",
    upload_type: "resumable",
    caption: "teste de permissão (não publicado)",
    access_token: cred.token,
  });
}

/** Publica um Reel a partir do arquivo no disco (upload direto) ou de um link público. */
export async function publicarReel(
  v: Vertical,
  video: { arquivo: string } | { url: string },
  legenda: string,
): Promise<{ id: string; permalink?: string }> {
  const cred = await credenciaisDePublicacao(v);
  const origem: Record<string, string> = "url" in video ? { video_url: video.url } : { upload_type: "resumable" };
  const conteiner = await graph("POST", `${cred.usuario}/media`, {
    media_type: "REELS",
    ...origem,
    caption: legenda,
    share_to_feed: "true",
    thumb_offset: "1500",
    access_token: cred.token,
  });
  if ("arquivo" in video) await enviarVideoDireto(conteiner, video.arquivo, cred.token);
  await esperar(15000);
  await esperarConteiner(conteiner.id, cred.token);
  return publicarConteiner(cred.usuario, cred.token, conteiner.id);
}

/** Publica de 2 a 20 imagens JPEG (URLs públicas) como um carrossel. */
export async function publicarCarrossel(v: Vertical, imagensUrl: string[], legenda: string): Promise<{ id: string; permalink?: string }> {
  const cred = await credenciaisDePublicacao(v);
  if (imagensUrl.length < 2 || imagensUrl.length > 20) throw new Error(`Carrossel precisa de 2 a 20 imagens (veio com ${imagensUrl.length})`);

  const filhos: string[] = [];
  for (const url of imagensUrl) {
    const item = await graph("POST", `${cred.usuario}/media`, { image_url: url, is_carousel_item: "true", access_token: cred.token });
    filhos.push(item.id);
  }
  for (const id of filhos) await esperarConteiner(id, cred.token, 3000, 40);

  const conteiner = await graph("POST", `${cred.usuario}/media`, {
    media_type: "CAROUSEL",
    children: filhos.join(","),
    caption: legenda,
    access_token: cred.token,
  });
  await esperarConteiner(conteiner.id, cred.token, 3000, 60);
  return publicarConteiner(cred.usuario, cred.token, conteiner.id);
}
