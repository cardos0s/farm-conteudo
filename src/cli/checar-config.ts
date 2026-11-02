import { temFlag } from "./comum";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Parser from "rss-parser";
import { verticais, verticaisAtivas } from "../../verticais";
import { linkRastreado } from "../core/vertical";
import { contaInstagram, credenciaisInstagram } from "../publicacao/instagram";
import { enviarParaPublico } from "../publicacao/armazenamento";
import { publicacaoBeehiiv } from "../publicacao/beehiiv";
import { telegramConfigurado } from "../publicacao/telegram";

// Confere a configuração e testa de verdade o que dá para testar: o token do Instagram e o envio ao bucket.
// Uso: npm run checar            (o necessário para postar)
//      npm run checar -- --tudo  (inclui Claude, Beehiiv e os feeds RSS da produção automática)
const ok = (b: boolean) => (b ? "✅" : "❌");
const tudo = temFlag("--tudo");
const parser = new Parser({ timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 (compatible; FabricaConteudo/1.0)" } });
let falhas = 0;

/** Envia um arquivo pequeno ao bucket e confere se o link público abre, do mesmo jeito que o Instagram vai abrir. */
async function testarArmazenamento() {
  const faltando = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"].filter((k) => !process.env[k]);
  if (faltando.length) {
    falhas++;
    return console.log(`❌ Armazenamento público: falta ${faltando.join(", ")}`);
  }
  const arquivo = path.join(tmpdir(), "teste-fabrica.txt");
  const conteudo = `teste ${new Date().toISOString()}`;
  try {
    await writeFile(arquivo, conteudo);
    const url = await enviarParaPublico(arquivo, "teste");
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (r.ok && (await r.text()) === conteudo) return console.log(`✅ Armazenamento público: enviei um arquivo de teste e o link abriu (${url})`);
    falhas++;
    console.log(`❌ Armazenamento público: o envio funcionou, mas o link público respondeu ${r.status}. Confira se o acesso público do bucket está ligado e se S3_PUBLIC_URL é o endereço dele (${url})`);
  } catch (e) {
    falhas++;
    console.log(`❌ Armazenamento público: não consegui enviar (${(e as Error).message}). Confira S3_ENDPOINT, S3_BUCKET e as chaves.`);
  } finally {
    await rm(arquivo, { force: true });
  }
}

await testarArmazenamento();
console.log(telegramConfigurado() ? "✅ Telegram" : "⚪ Telegram (opcional: sem ele, não chegam confirmações nem alertas)");
if (tudo) console.log(`${ok(!!process.env.ANTHROPIC_API_KEY)} ANTHROPIC_API_KEY (produção automática)`);

const pausadas = verticais.filter((v) => !v.ativa).map((v) => v.app.nome);
if (pausadas.length) console.log(`⏸  Pausadas (não rodam pelo cron): ${pausadas.join(", ")}`);

for (const v of verticaisAtivas()) {
  console.log(`\n── ${v.app.nome} ──`);
  if (!credenciaisInstagram(v)) {
    falhas++;
    console.log(`❌ Instagram (falta IG_${v.id.toUpperCase()}_TOKEN)`);
  } else {
    try {
      const conta = await contaInstagram(v);
      console.log(`✅ Instagram: @${conta.username ?? "?"} (conta ${conta.id})`);
    } catch (e) {
      falhas++;
      console.log(`❌ Instagram: o token não funcionou (${(e as Error).message})`);
    }
  }
  if (!tudo) continue;
  console.log(`   Link rastreado: ${linkRastreado(v, "instagram")}`);
  console.log(`   Produção automática: ${v.volume.reelsPorDia} Reels + ${v.volume.carrosseisPorDia} carrosséis por dia · aprovação ${v.volume.aprovacao}`);
  console.log(`${ok(!!publicacaoBeehiiv(v) && !!process.env.BEEHIIV_API_KEY)} Beehiiv`);
  for (const f of v.fontes.rss) {
    try {
      const feed = await parser.parseURL(f.url);
      console.log(`✅ RSS ${f.nome}: ${feed.items.length} itens`);
    } catch (e) {
      falhas++;
      console.log(`❌ RSS ${f.nome}: ${(e as Error).message}`);
    }
  }
}

console.log(falhas ? `\n${falhas} item(ns) para resolver.` : "\nTudo pronto para postar.");
process.exit(falhas ? 1 : 0);
