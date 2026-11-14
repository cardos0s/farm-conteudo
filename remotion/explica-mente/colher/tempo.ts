import { criarTempo } from "../tempo";
import { FALAS, TOTAL_QUADROS } from "./roteiro";
import tempos from "./tempos.json";

export const { TOTAL, noRoteiro } = criarTempo(FALAS, TOTAL_QUADROS, tempos);
