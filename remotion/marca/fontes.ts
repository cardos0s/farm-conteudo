import "@fontsource/archivo-black/400.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/roboto-slab/400.css";
import "@fontsource/roboto-slab/800.css";
import { continueRender, delayRender } from "remotion";

// Fontes das três marcas, empacotadas junto com o projeto (sem depender de internet no render).
// O render só começa depois que todas carregam.
const familias = ["400 1em 'Archivo Black'", "400 1em Inter", "700 1em Inter", "800 1em Poppins", "700 1em Poppins", "800 1em 'Roboto Slab'", "400 1em 'Roboto Slab'"];

const espera = delayRender("Carregando fontes das marcas");
Promise.all(familias.map((f) => document.fonts.load(f, "Aáçõ1")))
  .catch((e) => console.error("Falha ao carregar fontes", e))
  .finally(() => continueRender(espera));
