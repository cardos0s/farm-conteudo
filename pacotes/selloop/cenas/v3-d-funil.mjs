// Vídeo 3 · cena D: a oportunidade que a Lia criou no funil de vendas (Novo lead).
import { cenaDemo, NOITE } from "./comum.mjs";

export default cenaDemo({
  nome: "v3-d-funil",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  caminho: "/pipeline",
  gravar: async (g, page) => {
    await g.esperar(600);
    g.marca("card");
    await g.foco(page.getByText("Lanchonete do Porto · 40 fardos").first(), "card-lia");
    await g.mover(page.getByText("Lanchonete do Porto · 40 fardos").first());
    await g.esperar(2200);
    g.marca("fim");
  },
});
