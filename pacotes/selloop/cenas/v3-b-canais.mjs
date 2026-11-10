// Vídeo 3 · cena B: a Lia atendendo à noite nos três canais (WhatsApp, Instagram e Messenger).
import { cenaDemo, itemDaLista, NOITE, recorteBolha } from "./comum.mjs";

export default cenaDemo({
  nome: "v3-b-canais",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  gravar: async (g, page) => {
    await g.esperar(500);
    g.marca("lista");
    await g.recorte(itemDaLista(page, "Helena Prado"), "conversa-whatsapp");
    await g.recorte(itemDaLista(page, "Bianca Duarte"), "conversa-instagram");
    await g.recorte(itemDaLista(page, "Marcos Teixeira"), "conversa-messenger");
    // a fila da noite: quatro conversas, todas com a Lia
    await g.mover(page.getByText("Fábio Martins").first());
    await g.esperar(500);
    await g.mover(page.getByText("Marcos Teixeira").first());
    await g.esperar(400);
    g.marca("whatsapp");
    await g.clicar(page.getByText("Helena Prado").first(), { depois: 1000 });
    await recorteBolha(g, page, "2ª via do boleto do pedido 1188, com vencimento", "resposta-whatsapp");
    g.marca("instagram");
    await g.clicar(page.getByText("Bianca Duarte").first(), { depois: 1000 });
    await recorteBolha(g, page, "linha de cafés especiais", "resposta-instagram");
    g.marca("messenger");
    await g.clicar(page.getByText("Marcos Teixeira").first(), { depois: 1900 });
    await recorteBolha(g, page, "O pedido mínimo é de R$ 300", "resposta-messenger");
    g.marca("fim");
  },
});
