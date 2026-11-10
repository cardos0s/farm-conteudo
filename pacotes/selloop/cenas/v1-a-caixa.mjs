// Vídeo 1 · cena A: a caixa de entrada vista pela administradora (todos os canais, todas as equipes).
import { cenaDemo, itemDaLista } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-a-caixa",
  usuario: "patricia",
  gravar: async (g, page) => {
    await g.esperar(900);
    g.marca("novos");
    // uma conversa de cada canal, para a montagem destacar
    await g.recorte(itemDaLista(page, "Juliana Prado"), "conversa-whatsapp");
    await g.recorte(itemDaLista(page, "Fábio Martins"), "conversa-instagram");
    await g.recorte(itemDaLista(page, "Carla Mendes"), "conversa-messenger");
    await g.mover(page.getByText("Fábio Martins").first());
    await g.esperar(450);
    await g.mover(page.getByText("Carla Mendes").first());
    await g.esperar(450);
    await g.mover(page.getByText("Juliana Prado").first());
    await g.esperar(700);
    g.marca("todos");
    await g.clicar("button[aria-label=Todos]", { depois: 1300 });
    await g.recorte(itemDaLista(page, "Marina Costa"), "conversa-comercial");
    await g.recorte(itemDaLista(page, "Elaine Oliveira"), "conversa-financeiro");
    await g.mover(page.getByText("Elaine Oliveira").first());
    await g.esperar(500);
    g.marca("elaine");
    await g.clicar(page.getByText("Elaine Oliveira").first(), { depois: 1500 });
    await g.foco(page.getByText("Conversa transferida para Financeiro.").first(), "transferida");
    await g.recorte(page.getByText("Conversa transferida para Financeiro.").first(), "transferida", { margem: 6 });
    await g.mover(page.getByText("Conversa transferida para Financeiro.").first());
    await g.esperar(2200);
  },
});
