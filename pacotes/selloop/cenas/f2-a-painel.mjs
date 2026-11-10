// Reel 2 (tomada contínua) · cena A: do Loop Chat para o painel de campanhas; o cursor passa pelos
// números do período (enviadas, entregues, lidas, responderam).
import { blocoDe, cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "f2-a-painel",
  usuario: "patricia",
  gravar: async (g, page) => {
    const rotulo = (t) => page.getByText(t, { exact: true }).first();
    await g.esperar(400);
    g.marca("aba");
    await g.clicar(rotulo("Campanhas"), { depois: 1200 });
    g.marca("indicadores");
    // os indicadores do período, o gráfico e o funil
    await g.recorte(blocoDe(page.getByText("Mensagens enviadas").first(), { altura: 100 }), "enviadas");
    await g.recorte(blocoDe(rotulo("Entregues"), { altura: 100 }), "entregues");
    await g.recorte(blocoDe(rotulo("Lidas"), { altura: 100 }), "lidas");
    await g.recorte(blocoDe(rotulo("Responderam"), { altura: 100 }), "responderam");
    await g.recorte(blocoDe(page.getByText("Mensagens por dia").first(), { altura: 250 }), "grafico");
    await g.recorte(blocoDe(rotulo("Funil"), { altura: 250 }), "funil");
    g.marca("enviadas");
    await g.mover(page.getByText("Mensagens enviadas").first());
    await g.esperar(350);
    g.marca("entregues");
    await g.mover(rotulo("Entregues"));
    await g.esperar(350);
    g.marca("lidas");
    await g.mover(rotulo("Lidas"));
    await g.esperar(350);
    g.marca("responderam");
    await g.mover(rotulo("Responderam"));
    await g.esperar(1500);
  },
});
