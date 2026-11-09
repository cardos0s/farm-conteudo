// Vídeo 1 · cena A: a caixa de entrada vista pela administradora (todos os canais, todas as equipes).
import { cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-a-caixa",
  usuario: "patricia",
  gravar: async (g, page) => {
    await g.esperar(900);
    g.marca("novos");
    await g.mover(page.getByText("Fábio Martins").first());
    await g.esperar(450);
    await g.mover(page.getByText("Carla Mendes").first());
    await g.esperar(450);
    await g.mover(page.getByText("Juliana Prado").first());
    await g.esperar(700);
    g.marca("todos");
    await g.clicar("button[aria-label=Todos]", { depois: 1300 });
    await g.mover(page.getByText("Elaine Oliveira").first());
    await g.esperar(500);
    g.marca("elaine");
    await g.clicar(page.getByText("Elaine Oliveira").first(), { depois: 1500 });
    await g.foco(page.getByText("Conversa transferida para Financeiro.").first(), "transferida");
    await g.mover(page.getByText("Conversa transferida para Financeiro.").first());
    await g.esperar(2200);
  },
});
