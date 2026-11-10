// Vídeo 2 · cena A: do Loop Chat para o painel de campanhas (indicadores, gráfico e funil).
import { blocoDe, cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v2-a-painel",
  usuario: "patricia",
  gravar: async (g, page) => {
    await g.esperar(700);
    g.marca("aba");
    await g.clicar(page.getByText("Campanhas", { exact: true }).first(), { depois: 1500 });
    g.marca("indicadores");
    // os indicadores do período, o gráfico e o funil
    await g.recorte(blocoDe(page.getByText("Mensagens enviadas").first(), { altura: 100 }), "enviadas");
    await g.recorte(blocoDe(page.getByText("Entregues", { exact: true }).first(), { altura: 100 }), "entregues");
    await g.recorte(blocoDe(page.getByText("Lidas", { exact: true }).first(), { altura: 100 }), "lidas");
    await g.recorte(blocoDe(page.getByText("Responderam", { exact: true }).first(), { altura: 100 }), "responderam");
    await g.recorte(blocoDe(page.getByText("Mensagens por dia").first(), { altura: 250 }), "grafico");
    await g.recorte(blocoDe(page.getByText("Funil", { exact: true }).first(), { altura: 250 }), "funil");
    await g.mover(page.getByText("Mensagens enviadas").first());
    await g.esperar(700);
    await g.mover(page.getByText("Lidas", { exact: true }).first());
    await g.esperar(600);
    await g.mover(page.getByText("Responderam", { exact: true }).first());
    await g.esperar(700);
    g.marca("grafico");
    await g.mover(page.getByText("Mensagens por dia").first());
    await g.esperar(900);
    await g.mover(page.getByText("Funil", { exact: true }).first());
    await g.esperar(1500);
  },
});
