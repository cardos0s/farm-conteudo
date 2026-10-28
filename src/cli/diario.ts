import { executar, verticaisDaLinha } from "./comum";
import { rodarDiario } from "../fabrica";

// Uso: npm run diario [cockpit] [rebanho] [focca]
await executar("produção diária", () => rodarDiario(verticaisDaLinha()));
