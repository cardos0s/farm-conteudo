import { executar } from "./comum";
import { statusTexto } from "../fabrica";

// O mesmo /status do bot do Telegram, para quem roda sem Telegram: o que foi ao ar e os próximos posts.
await executar("status", async () => {
  console.log(await statusTexto());
});
