import { readFile } from "node:fs/promises";
import { executar } from "./comum";
import { buscarVertical } from "../../verticais";
import { produzirUgc } from "../ugc/produzir";

// Vídeo UGC com a personagem de IA da vertical.
// Uso:
//   npm run ugc focca -- --briefing "Mostrar como o Focca monta o cronograma a partir do edital"
//   npm run ugc focca -- --briefing-arquivo briefings/cronograma.md --so-roteiro
//   npm run ugc focca -- --continuar focca-ugc-202610311200-ab12

const args = process.argv.slice(2);
const valor = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const vertical = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--briefing") && args[i - 1] !== "--continuar");

await executar("vídeo UGC", async () => {
  if (!vertical) throw new Error("Diga a vertical: npm run ugc focca -- --briefing \"...\"");
  const arquivo = valor("--briefing-arquivo");
  const briefing = arquivo ? await readFile(arquivo, "utf8") : valor("--briefing");
  const peca = await produzirUgc(buscarVertical(vertical), {
    briefing,
    soRoteiro: args.includes("--so-roteiro"),
    continuar: valor("--continuar"),
  });
  if (peca) console.log(`Pronto: ${peca.videoPath}`);
});
