import { executar, temFlag, verticaisDaLinha } from "./comum";
import { rodarNewsletter } from "../fabrica";

// Roda todo dia pelo cron; cada vertical só gera a edição no seu dia da semana.
// Uso: npm run newsletter [vertical...] [--agora]   (--agora ignora o dia da semana)
await executar("newsletter", () => rodarNewsletter(verticaisDaLinha(), temFlag("--agora")));
