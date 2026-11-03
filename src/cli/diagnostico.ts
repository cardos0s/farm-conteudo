import "./comum";
import { verticaisAtivas } from "../../verticais";
import { credenciaisInstagram } from "../publicacao/instagram";

// Testa o token do Instagram em todos os endereços que a Meta usa e mostra o que cada um responde.
// Serve para descobrir por que o token não acha a conta. Nunca mostra o token: ele é trocado por <TOKEN> na saída.
// Uso: npm run diagnostico

const versao = process.env.IG_GRAPH_VERSION || "v26.0";

function tipoDoToken(t: string) {
  if (t.startsWith("IG")) return "Instagram (login do Instagram, usa graph.instagram.com)";
  if (t.startsWith("EAA")) return "Facebook/Meta (login unificado ou do Facebook, usa graph.facebook.com)";
  return "desconhecido";
}

async function consultar(nome: string, url: string, token: string) {
  const u = new URL(url);
  u.searchParams.set("access_token", token);
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
    const corpo = (await r.text()).replaceAll(token, "<TOKEN>").slice(0, 600);
    console.log(`\n▶ ${nome}\n  ${url}\n  HTTP ${r.status}: ${corpo}`);
  } catch (e) {
    const causa = (e as { cause?: { code?: string } }).cause?.code;
    console.log(`\n▶ ${nome}\n  ${url}\n  falhou: ${(e as Error).message}${causa ? ` (${causa}: confira a internet)` : ""}`);
  }
}

for (const v of verticaisAtivas()) {
  const cred = credenciaisInstagram(v);
  console.log(`══ ${v.app.nome} ══`);
  if (!cred) {
    console.log(`Falta IG_${v.id.toUpperCase()}_TOKEN no .env.`);
    continue;
  }
  const t = cred.token;
  console.log(`Token: ${t.length} caracteres, começa com ${t.slice(0, 4)}…, tipo ${tipoDoToken(t)}`);
  console.log(`Espaço ou aspas no token: ${/[\s"']/.test(t) ? "SIM (tire do .env)" : "não"}`);
  console.log(`IG_GRAPH_HOST: ${process.env.IG_GRAPH_HOST || "graph.facebook.com (padrão)"} · IG_${v.id.toUpperCase()}_USER_ID: ${cred.usuario ?? "(vazio)"}`);

  const fb = `https://graph.facebook.com/${versao}`;
  await consultar("Quem é o token (login unificado/Facebook)", `${fb}/me?fields=id,name,client_business_id`, t);
  await consultar("Contas do Instagram do token (login unificado)", `${fb}/me/assigned_instagram_accounts?fields=id,username`, t);
  await consultar("Páginas e contas ligadas (login do Facebook)", `${fb}/me/accounts?fields=id,name,instagram_business_account{id,username}`, t);
  await consultar("Permissões concedidas", `${fb}/me/permissions`, t);
  if (cred.usuario) await consultar("A conta do IG_..._USER_ID", `${fb}/${cred.usuario}?fields=id,username,name`, t);
  await consultar("Quem é o token (login do Instagram)", `https://graph.instagram.com/${versao}/me?fields=user_id,username`, t);
}
console.log("\nMande essa saída para o Claude. Ela não contém o token.");
process.exit(0);
