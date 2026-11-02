import type { Vertical } from "../core/vertical";

// Publicação de Reels e carrosséis pela Instagram Graph API (conta profissional ligada a uma página do Facebook).
// Reel: cria o contêiner com a URL do vídeo, espera o processamento e publica.
// Carrossel: cria um contêiner por imagem, junta todos num contêiner CAROUSEL e publica (conta como 1 post no limite diário da API).

const versao = () => process.env.IG_GRAPH_VERSION || "v23.0";
const base = () => `https://graph.facebook.com/${versao()}`;

export function credenciaisInstagram(v: Vertical) {
  const prefixo = `IG_${v.id.toUpperCase()}`;
  const usuario = process.env[`${prefixo}_USER_ID`];
  const token = process.env[`${prefixo}_TOKEN`];
  return usuario && token ? { usuario, token } : null;
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

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function exigirCredenciais(v: Vertical) {
  const cred = credenciaisInstagram(v);
  if (!cred) throw new Error(`Credenciais do Instagram de ${v.app.nome} não configuradas`);
  return cred;
}

export async function publicarReel(v: Vertical, videoUrl: string, legenda: string): Promise<{ id: string; permalink?: string }> {
  const cred = exigirCredenciais(v);
  const conteiner = await graph("POST", `${cred.usuario}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption: legenda,
    share_to_feed: "true",
    thumb_offset: "1500",
    access_token: cred.token,
  });
  await esperar(15000);
  await esperarConteiner(conteiner.id, cred.token);
  return publicarConteiner(cred.usuario, cred.token, conteiner.id);
}

/** Publica de 2 a 10 imagens JPEG (URLs públicas) como um carrossel. */
export async function publicarCarrossel(v: Vertical, imagensUrl: string[], legenda: string): Promise<{ id: string; permalink?: string }> {
  const cred = exigirCredenciais(v);
  if (imagensUrl.length < 2 || imagensUrl.length > 10) throw new Error(`Carrossel precisa de 2 a 10 imagens (veio com ${imagensUrl.length})`);

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
