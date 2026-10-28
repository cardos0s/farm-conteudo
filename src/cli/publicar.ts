import { executar } from "./comum";
import { publicarVencidas } from "../fabrica";

// Publica os Reels aprovados cujo horário chegou. O bot já faz isso sozinho a cada minuto;
// este comando existe para quem preferir rodar a publicação pelo cron.
await executar("publicação", async () => {
  const n = await publicarVencidas();
  console.log(`${n} peça(s) publicada(s).`);
});
