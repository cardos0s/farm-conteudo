import { executar, temFlag } from "./comum";
import { criarPastasDeEntrada, importarEntrada } from "../entrada";
import { publicarVencidas } from "../fabrica";
import { renovarTokenInstagram } from "../publicacao/instagram";
import { verticaisAtivas } from "../../verticais";

// Agenda o que apareceu em entrada/ e publica o que chegou no horário. O bot já faz isso sozinho
// a cada minuto; este comando existe para quem roda sem o bot (cron, ou o agente do Mac em deploy/mac/).
// Use um ou outro, não os dois ao mesmo tempo.
// Roda a cada minuto, então só escreve no registro quando algo acontece (ou com --falar).
await executar("publicação", async () => {
  await criarPastasDeEntrada(verticaisAtivas());
  for (const v of verticaisAtivas()) await renovarTokenInstagram(v);
  const agendados = await importarEntrada(verticaisAtivas());
  const publicados = await publicarVencidas();
  if (agendados || publicados || temFlag("--falar")) {
    console.log(`[${new Date().toLocaleString("pt-BR")}] ${agendados} item(ns) agendado(s), ${publicados} publicado(s).`);
  }
});
