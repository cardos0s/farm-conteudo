import "dotenv/config";
import { verticais, verticaisAtivas } from "../../verticais";
import { alertar } from "../publicacao/telegram";

/** Lê as verticais pedidas na linha de comando (as ativas, se nenhuma for passada). */
export function verticaisDaLinha() {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const escolhidas = ids.length ? verticais.filter((v) => ids.includes(v.id)) : verticaisAtivas();
  if (!escolhidas.length) throw new Error(ids.length ? `Vertical desconhecida: ${ids.join(", ")}` : "Nenhuma vertical ativa em verticais/");
  return escolhidas;
}

export const temFlag = (f: string) => process.argv.includes(f);

/** Roda a tarefa e avisa no Telegram se ela quebrar. */
export async function executar(nome: string, tarefa: () => Promise<void>) {
  try {
    await tarefa();
  } catch (e) {
    await alertar(e, nome);
    process.exitCode = 1;
  }
  // Conexões HTTP mantidas abertas pelas bibliotecas não devem segurar o cron.
  process.exit();
}
