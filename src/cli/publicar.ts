import { executar } from "./comum";
import { criarPastasDeEntrada, importarEntrada } from "../entrada";
import { publicarVencidas } from "../fabrica";
import { verticaisAtivas } from "../../verticais";

// Agenda o que apareceu em entrada/ e publica o que chegou no horário. O bot já faz isso sozinho
// a cada minuto; este comando existe para quem preferir rodar pelo cron, sem o bot.
// Use um ou outro, não os dois ao mesmo tempo.
await executar("publicação", async () => {
  await criarPastasDeEntrada(verticaisAtivas());
  const agendados = await importarEntrada(verticaisAtivas());
  const publicados = await publicarVencidas();
  console.log(`${agendados} item(ns) agendado(s), ${publicados} publicado(s).`);
});
