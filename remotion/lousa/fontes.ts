import { continueRender, delayRender, staticFile } from "remotion";

// Excalifont é a fonte manuscrita atual do Excalidraw; a Virgil (a clássica) cobre os poucos
// glifos que faltam. As duas são SIL Open Font License e ficam em public/fontes/.
export const FONTE_LOUSA = "Excalifont, Virgil, 'Comic Sans MS', cursive";
// Fonte de código do Excalidraw (monoespaçada: cada caractere ocupa 0,55 do tamanho da fonte).
export const FONTE_CODIGO = "'Comic Shanns', 'DejaVu Sans Mono', monospace";
export const AVANCO_CODIGO = 0.55;

const arquivos = [
  { familia: "Excalifont", arquivo: "fontes/Excalifont-Regular.woff2" },
  { familia: "Virgil", arquivo: "fontes/Virgil-Regular.woff2" },
  { familia: "Comic Shanns", arquivo: "fontes/ComicShanns-Regular.woff2" },
];

if (typeof document !== "undefined") {
  const espera = delayRender("Carregando fontes da lousa");
  Promise.all(
    arquivos.map(async ({ familia, arquivo }) => {
      const face = new FontFace(familia, `url(${staticFile(arquivo)})`);
      await face.load();
      document.fonts.add(face);
    }),
  )
    .catch((e) => console.error("Falha ao carregar fontes da lousa", e))
    .finally(() => continueRender(espera));
}
