// Vídeo 2 · cena A: do Loop Chat para o painel de campanhas (indicadores, gráfico e funil).
import { cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v2-a-painel",
  usuario: "patricia",
  gravar: async (g, page) => {
    await g.esperar(700);
    g.marca("aba");
    await g.clicar(page.getByText("Campanhas", { exact: true }).first(), { depois: 1500 });
    g.marca("indicadores");
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
