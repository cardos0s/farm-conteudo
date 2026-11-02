import "./comum";
import { aprovar, aprovarTudo, publicarVencidas, rejeitar, statusTexto } from "../fabrica";
import { gravarChave, lerChave } from "../core/estado";
import { criarPastasDeEntrada, importarEntrada } from "../entrada";
import { verticaisAtivas } from "../../verticais";
import { renovarTokenInstagram } from "../publicacao/instagram";
import { alertar, enviarMensagem, receberAtualizacoes, responderClique, telegramConfigurado } from "../publicacao/telegram";

// Processo contínuo: a cada minuto, agenda o que apareceu na pasta entrada/ e publica o que chegou no horário.
// Também recebe os cliques de Aprovar/Rejeitar/Cancelar no Telegram.
// Deixe rodando com pm2 ou systemd (veja o README).

if (!telegramConfigurado()) {
  console.error("Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env");
  process.exit(1);
}

const AJUDA = `Comandos:
/status — o que está esperando, agendado e publicado, e os próximos posts
/aprovar_tudo — aprova todos os Reels e carrosséis esperando e distribui nos horários
/publicar — confere a pasta de entrada agora e publica o que já passou do horário`;

let publicando = false;
async function tickPublicacao() {
  if (publicando) return;
  publicando = true;
  try {
    await importarEntrada(verticaisAtivas());
    await publicarVencidas();
  } catch (e) {
    await alertar(e, "publicação");
  } finally {
    publicando = false;
  }
}

/** O token do Instagram vence em 60 dias; a renovação roda a cada 6 h e só chama a API quando passou de 7 dias. */
async function renovarTokens() {
  for (const v of verticaisAtivas()) {
    try {
      if ((await renovarTokenInstagram(v)) === "renovado") console.log(`Token do Instagram do ${v.app.nome} renovado.`);
    } catch (e) {
      await alertar(e, `token do Instagram (${v.app.nome})`);
    }
  }
}

await criarPastasDeEntrada(verticaisAtivas());
await renovarTokens();
setInterval(renovarTokens, 6 * 3600_000);
let offset = await lerChave<number>("telegram-offset", 0);
setInterval(tickPublicacao, 60_000);
void tickPublicacao();
console.log("Bot da fábrica rodando.");

for (;;) {
  try {
    const { cliques, comandos, proximo } = await receberAtualizacoes(offset);
    for (const c of cliques) {
      const [acao, id] = c.dados.split(/:(.*)/s);
      const resposta = acao === "ok" ? await aprovar(id) : await rejeitar(id);
      await responderClique(c, resposta.slice(0, 190), resposta);
    }
    for (const cmd of comandos) {
      if (cmd.startsWith("/aprovar_tudo")) await enviarMensagem(await aprovarTudo());
      else if (cmd.startsWith("/status")) await enviarMensagem(await statusTexto());
      else if (cmd.startsWith("/publicar")) await tickPublicacao();
      else await enviarMensagem(AJUDA);
    }
    if (proximo !== offset) {
      offset = proximo;
      await gravarChave("telegram-offset", offset);
    }
  } catch (e) {
    console.error(e);
    await new Promise((r) => setTimeout(r, 10_000));
  }
}
