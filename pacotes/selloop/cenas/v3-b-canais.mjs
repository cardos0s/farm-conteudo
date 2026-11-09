// Vídeo 3 · cena B: a Lia atendendo à noite nos três canais (WhatsApp, Instagram e Messenger).
import { cenaDemo, NOITE } from "./comum.mjs";

export default cenaDemo({
  nome: "v3-b-canais",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  gravar: async (g, page) => {
    await g.esperar(500);
    g.marca("lista");
    // a fila da noite: quatro conversas, todas com a Lia
    await g.mover(page.getByText("Fábio Martins").first());
    await g.esperar(500);
    await g.mover(page.getByText("Marcos Teixeira").first());
    await g.esperar(400);
    g.marca("whatsapp");
    await g.clicar(page.getByText("Helena Prado").first(), { depois: 1000 });
    g.marca("instagram");
    await g.clicar(page.getByText("Bianca Duarte").first(), { depois: 1000 });
    g.marca("messenger");
    await g.clicar(page.getByText("Marcos Teixeira").first(), { depois: 1900 });
    g.marca("fim");
  },
});
