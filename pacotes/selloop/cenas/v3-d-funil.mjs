// Vídeo 3 · cena D: a oportunidade que a Lia criou no funil de vendas (Novo lead).
import { blocoDe, cenaDemo, NOITE } from "./comum.mjs";

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
    await g.recorte(blocoDe(page.getByText("Lanchonete do Porto · 40 fardos").first(), { largura: 250, altura: 120 }), "card", { semMouse: true });
    g.marca("fim");
  },
});
