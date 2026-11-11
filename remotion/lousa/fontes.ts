import { continueRender, delayRender, staticFile } from "remotion";

// Excalifont é a fonte manuscrita atual do Excalidraw; a Virgil (a clássica) cobre os poucos
// glifos que faltam e a Cascadia Code é a fonte de código. As três são SIL Open Font License
// e ficam em public/fontes/.
export const FONTE_LOUSA = "Excalifont, Virgil, 'Comic Sans MS', cursive";
/** Cascadia Code: a fonte de código do Excalidraw (Microsoft, SIL OFL 1.1). Monoespaçada, avanço 0,586 em. */
export const FONTE_CODIGO = "Cascadia, 'Cascadia Code', ui-monospace, Menlo, monospace";
export const AVANCO_CODIGO = 0.5859;

const arquivos = [
  { familia: "Excalifont", arquivo: "fontes/Excalifont-Regular.woff2" },
  { familia: "Virgil", arquivo: "fontes/Virgil-Regular.woff2" },
  { familia: "Cascadia", arquivo: "fontes/CascadiaCode-Regular.woff2" },
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
