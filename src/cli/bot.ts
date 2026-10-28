import "./comum";
import { aprovar, publicarVencidas, rejeitar, statusTexto } from "../fabrica";
import { gravarChave, lerChave } from "../core/estado";
import { alertar, enviarMensagem, receberAtualizacoes, responderClique, telegramConfigurado } from "../publicacao/telegram";

// Processo contínuo: recebe os cliques de Aprovar/Rejeitar e publica no horário marcado.
// Deixe rodando com pm2 ou systemd (veja o README).

if (!telegramConfigurado()) {
  console.error("Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env");
  process.exit(1);
}

const AJUDA = `Comandos:
/status — o que está esperando, agendado e publicado
/publicar — publica agora o que já passou do horário`;

let publicando = false;
async function tickPublicacao() {
  if (publicando) return;
  publicando = true;
  try {
    await publicarVencidas();
  } catch (e) {
    await alertar(e, "publicação");
  } finally {
    publicando = false;
  }
}

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
      if (cmd.startsWith("/status")) await enviarMensagem(await statusTexto());
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
