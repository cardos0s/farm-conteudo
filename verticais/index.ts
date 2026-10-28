import type { Vertical } from "../src/core/vertical";
import cockpit from "./cockpit";
import focca from "./focca";
import rebanho from "./rebanho";

// Para abrir uma vertical nova: crie o arquivo de configuração e adicione aqui.
export const verticais: Vertical[] = [cockpit, rebanho, focca];

export function buscarVertical(id: string): Vertical {
  const v = verticais.find((x) => x.id === id);
  if (!v) throw new Error(`Vertical desconhecida: ${id}`);
  return v;
}
