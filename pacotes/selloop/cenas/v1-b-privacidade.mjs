// Vídeo 1 · cena B: o atendente (perfil Operador) só vê Novos e Meus.
import { cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-b-privacidade",
  usuario: "diogo",
  gravar: async (g, page) => {
    await g.esperar(900);
    g.marca("abas");
    await g.mover("button[aria-label=Novos]");
    await g.esperar(700);
    g.marca("meus");
    await g.clicar("button[aria-label=Meus]", { depois: 1400 });
    await g.mover(page.getByText("Marina Costa").first());
    await g.esperar(1500);
  },
});
