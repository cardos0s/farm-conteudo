// Reel 1 (tomada contínua) · cena A: a caixa de entrada da administradora. Os três canais na mesma
// lista, mensagens chegando ao vivo, a aba Todos com as equipes e a conversa transferida.
import { cenaDemo, itemDaLista } from "./comum.mjs";

export default cenaDemo({
  nome: "f1-a-caixa",
  usuario: "patricia",
  gravar: async (g, page, demo) => {
    const nome = (n) => page.getByText(n).first();
    await g.esperar(400);
    g.marca("novos");
    // uma conversa de cada canal, para a montagem destacar
    await g.recorte(itemDaLista(page, "Juliana Prado"), "conversa-whatsapp");
    await g.recorte(itemDaLista(page, "Fábio Martins"), "conversa-instagram");
    await g.recorte(itemDaLista(page, "Carla Mendes"), "conversa-messenger");
    g.marca("whatsapp");
    await g.mover(nome("Juliana Prado"));
    await g.esperar(350);
    g.marca("instagram");
    await g.mover(nome("Fábio Martins"));
    await g.esperar(350);
    g.marca("messenger");
    await g.mover(nome("Carla Mendes"));
    await g.esperar(350);
    // tudo chega no mesmo lugar: uma mensagem nova de cada canal, ao vivo
    g.marca("chegam");
    demo.chegar("juliana", { texto: "Consegue entregar amanhã cedo?" });
    await g.esperar(520);
    demo.chegar("fabio", { texto: "Qual o prazo pra Joinville?" });
    await g.esperar(520);
    demo.chegar("carla", { texto: "Aceitam cartão em 3x?" });
    await g.esperar(700);
    g.marca("todos");
    await g.clicar("button[aria-label=Todos]", { depois: 700 });
    await g.recorte(itemDaLista(page, "Marina Costa"), "conversa-comercial");
    await g.recorte(itemDaLista(page, "Elaine Oliveira"), "conversa-financeiro");
    g.marca("equipes");
    await g.mover(nome("Marina Costa"));
    await g.esperar(450);
    await g.mover(nome("Elaine Oliveira"));
    await g.esperar(450);
    g.marca("elaine");
    await g.clicar(nome("Elaine Oliveira"), { depois: 900 });
    const transferida = page.getByText("Conversa transferida para Financeiro.").first();
    await g.foco(transferida, "transferida");
    await g.recorte(transferida, "transferida", { margem: 6 });
    g.marca("transferida");
    await g.mover(transferida);
    await g.esperar(1500);
  },
});
