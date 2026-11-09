// Vídeo 1 · cena E: concluir com pesquisa de satisfação; a avaliação da cliente chega ao vivo.
import { abrirConversa, cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-e-concluir",
  usuario: "diogo",
  preparar: async (page) => abrirConversa(page, "Meus", "Marina Costa"),
  gravar: async (g, page, demo) => {
    await g.esperar(700);
    g.marca("concluir");
    await g.clicar(page.getByRole("button", { name: "Concluir", exact: true }).first(), { depois: 900 });
    await g.mover(page.getByText("Pesquisa de satisfação").first());
    await g.esperar(600);
    await g.clicar(page.getByRole("button", { name: "Finalizar" }), { depois: 1800 });
    g.marca("avaliacao");
    demo.chegar("marina", { texto: "⭐⭐⭐⭐⭐" });
    await g.esperar(2600);
  },
});
