import type { Vertical } from "../core/vertical";

// Publicação de Reels pela Instagram Graph API (conta profissional ligada a uma página do Facebook).
// Fluxo: cria o contêiner com a URL do vídeo, espera o processamento e publica.

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

export async function publicarReel(v: Vertical, videoUrl: string, legenda: string): Promise<{ id: string; permalink?: string }> {
  const cred = credenciaisInstagram(v);
  if (!cred) throw new Error(`Credenciais do Instagram de ${v.app.nome} não configuradas`);

  const conteiner = await graph("POST", `${cred.usuario}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption: legenda,
    share_to_feed: "true",
    thumb_offset: "1500",
    access_token: cred.token,
  });

  // O processamento costuma levar de 30 s a 2 min.
  for (let i = 0; i < 40; i++) {
    await esperar(15000);
    const st = await graph("GET", conteiner.id, { fields: "status_code,status", access_token: cred.token });
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`Instagram recusou o vídeo: ${st.status}`);
    if (i === 39) throw new Error("Instagram não terminou de processar o vídeo em 10 minutos");
  }

  const pub = await graph("POST", `${cred.usuario}/media_publish`, { creation_id: conteiner.id, access_token: cred.token });
  const info = await graph("GET", pub.id, { fields: "permalink", access_token: cred.token }).catch(() => null);
  return { id: pub.id, permalink: info?.permalink };
}
