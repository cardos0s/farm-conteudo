import { criarRoteiro, type EdlAula } from "../comum/roteiro";
import edl from "./edicao/edl.json";

export type { Segmento } from "../comum/roteiro";
export const { FPS, TOTAL_QUADROS, FIM, segmentos, S, pausas, fimDo } = criarRoteiro(edl as unknown as EdlAula);
