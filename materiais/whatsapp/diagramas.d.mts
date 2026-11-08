// Tipos de diagramas.mjs, para usar os mesmos desenhos do PDF nos vídeos (Remotion).
type Diagrama = (rotulos?: Record<string, unknown>) => string;
export const capa: Diagrama;
export const tempoReal: Diagrama;
export const arquitetura: Diagrama;
export const caminhoMensagem: Diagrama;
export const tiques: Diagrama;
export const presenca: Diagrama;
export const grupos: Diagrama;
export const midia: Diagrama;
export const snowflake: Diagrama;
export const particoes: Diagrama;
export const reconexao: Diagrama;
export const caminhoLeigo: Diagrama;
export const gruposLeigo: Diagrama;
export const particoesLeigo: Diagrama;
export const reconexaoLeigo: Diagrama;
export const introRabiscos: (parte?: number) => string;
