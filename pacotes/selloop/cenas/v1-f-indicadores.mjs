// Vídeo 1 · cena F: a gestora acompanha os indicadores de atendimento e a nota média.
import { cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-f-indicadores",
  usuario: "patricia",
  gravar: async (g, page) => {
    await g.esperar(600);
    g.marca("abrir");
    await g.clicar(page.getByRole("button", { name: "Indicadores de Atendimento" }), { depois: 1800 });
    g.marca("cartoes");
    await g.mover(page.getByText("Em Atendimento").first());
    await g.esperar(900);
    await g.mover(page.getByText("Capacidade de atendimento").first());
    await g.esperar(900);
    g.marca("canais");
    await g.mover(page.getByText("ATENDIMENTOS POR CANAL").first());
    await g.esperar(700);
    await g.rolar(650, { dur: 1.2 });
    g.marca("satisfacao");
    await g.mover(page.getByText(/NOTA MÉDIA DA EMPRESA/i).first());
    await g.esperar(2200);
  },
});
