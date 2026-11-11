import { criarRoteiro, type EdlAula } from "../comum/roteiro";
import edl from "./edicao/edl.json";

export const { FPS, TOTAL_QUADROS, FIM, segmentos, S } = criarRoteiro(edl as unknown as EdlAula);

/** Segundo do clipe IMG_3604 convertido para o tempo do Reel. */
export const s = (t: number) => S("3604", t);
