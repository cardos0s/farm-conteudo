import "./comum";
import Parser from "rss-parser";
import { verticais } from "../../verticais";
import { linkRastreado } from "../core/vertical";
import { credenciaisInstagram } from "../publicacao/instagram";
import { publicacaoBeehiiv } from "../publicacao/beehiiv";
import { telegramConfigurado } from "../publicacao/telegram";

// Confere configuração, credenciais e se cada feed RSS está respondendo.
const ok = (b: boolean) => (b ? "✅" : "❌");
const parser = new Parser({ timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 (compatible; FabricaConteudo/1.0)" } });

console.log(`${ok(!!process.env.ANTHROPIC_API_KEY)} ANTHROPIC_API_KEY`);
console.log(`${ok(telegramConfigurado())} Telegram`);
console.log(`${ok(!!(process.env.S3_BUCKET && process.env.S3_PUBLIC_URL))} Armazenamento público (S3/R2)`);

let feedsQuebrados = 0;
for (const v of verticais) {
  console.log(`\n── ${v.app.nome} ──`);
  console.log(`   Link rastreado: ${linkRastreado(v, "instagram")}`);
  console.log(`${ok(!!credenciaisInstagram(v))} Instagram`);
  console.log(`${ok(!!publicacaoBeehiiv(v) && !!process.env.BEEHIIV_API_KEY)} Beehiiv`);
  for (const f of v.fontes.rss) {
    try {
      const feed = await parser.parseURL(f.url);
      console.log(`✅ RSS ${f.nome}: ${feed.items.length} itens`);
    } catch (e) {
      feedsQuebrados++;
      console.log(`❌ RSS ${f.nome}: ${(e as Error).message}`);
    }
  }
}
process.exit(feedsQuebrados ? 1 : 0);
