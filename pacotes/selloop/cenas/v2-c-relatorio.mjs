// Vídeo 2 · cena C: o relatório de uma campanha concluída (recebeu, leu, respondeu), o fluxo com os
// números de cada mensagem e os leads que não interagiram ganhando a tag "Nova abordagem".
import { cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "v2-c-relatorio",
  usuario: "patricia",
  preparar: async (page) => {
    await page.getByText("Campanhas", { exact: true }).first().click();
    await page.waitForTimeout(1500);
    await page.mouse.move(800, 600);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(700);
  },
  gravar: async (g, page) => {
    const topo = () => page.locator("[data-modal=true]").last();
    await g.esperar(400);
    g.marca("abrir");
    await g.clicar(page.getByText("Semana do Atacado · bebidas e mercearia").first(), { depois: 1400 });

    g.marca("numeros");
    await g.foco(page.getByText(/^total de envios$/i).first(), "envios");
    await g.mover(page.getByText(/^total de envios$/i).first());
    await g.esperar(500);
    await g.mover(page.getByText(/^lidos$/i).first());
    await g.esperar(500);
    await g.mover(page.getByText(/^interagidos$/i).first());
    await g.esperar(500);
    await g.mover(page.getByText(/^taxa de conversão$/i).first());
    await g.esperar(700);

    g.marca("fluxo");
    await g.clicar(page.getByText("Ver fluxo e números por mensagem").first(), { depois: 1300 });
    await g.mover({ x: 760, y: 560 });
    await g.rolar(380, { dur: 1.1 });
    await g.esperar(900);
    const x = topo().locator("button").first(); // o X da janela do fluxo
    await g.clicar(x, { depois: 800 });

    g.marca("sem-interacao");
    await g.clicar(page.getByRole("button", { name: "Sem interação", exact: true }), { depois: 1300 });
    await g.mover(topo().getByText(/^Não interagiram/).first());
    await g.esperar(500);
    g.marca("tag");
    // a primeira "Nova abordagem" é a de "Colocar tags" (a segunda é a de "Remover tags")
    await g.clicar(topo().getByRole("button", { name: "Nova abordagem", exact: true }).first(), { depois: 600 });
    await g.clicar(topo().getByRole("button", { name: /^Aplicar a \d+ lead/ }), { depois: 1500 });
    g.marca("fim");
    await g.esperar(1000);
  },
});
