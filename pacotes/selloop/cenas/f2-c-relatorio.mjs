// Reel 2 (tomada contínua) · cena C: o relatório de uma campanha concluída (recebeu, leu, respondeu) e
// os leads que não interagiram ganhando a tag "Nova abordagem".
import { blocoDe, cenaDemo, parteDe } from "./comum.mjs";

export default cenaDemo({
  nome: "f2-c-relatorio",
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
    const numero = (re) => page.getByText(re).first();
    await g.esperar(400);
    g.marca("abrir");
    await g.clicar(page.getByText("Semana do Atacado · bebidas e mercearia").first(), { depois: 300 });
    await numero(/^total de envios$/i).waitFor({ state: "visible", timeout: 60000 });
    await g.esperar(700);

    g.marca("numeros");
    await g.recorte(blocoDe(numero(/^total de envios$/i), { altura: 150 }), "envios");
    await g.recorte(blocoDe(numero(/^lidos$/i), { altura: 150 }), "lidos");
    await g.recorte(blocoDe(numero(/^interagidos$/i), { altura: 150 }), "interagidos");
    await g.recorte(blocoDe(numero(/^taxa de conversão$/i), { altura: 150 }), "conversao");
    await g.recorte(blocoDe(page.getByText("Falar com vendedor").first(), { altura: 380 }), "celular");
    g.marca("envios");
    await g.mover(numero(/^total de envios$/i));
    await g.esperar(300);
    g.marca("lidos");
    await g.mover(numero(/^lidos$/i));
    await g.esperar(300);
    g.marca("interagidos");
    await g.mover(numero(/^interagidos$/i));
    await g.esperar(300);
    g.marca("conversao");
    await g.mover(numero(/^taxa de conversão$/i));
    await g.esperar(600);

    g.marca("sem-interacao");
    await g.clicar(page.getByRole("button", { name: "Sem interação", exact: true }), { depois: 300 });
    const lista = topo().getByText(/^Não interagiram/).first();
    await lista.waitFor({ state: "visible", timeout: 60000 });
    g.marca("leads");
    await g.mover(lista);
    await g.esperar(300);
    await g.recorte(parteDe(blocoDe(topo().getByText(/Selecionar todos/).first(), { largura: 600, altura: 400 }), { altura: 310 }), "leads");
    await g.esperar(500);
    g.marca("tag");
    // a primeira "Nova abordagem" é a de "Colocar tags" (a segunda é a de "Remover tags")
    await g.clicar(topo().getByRole("button", { name: "Nova abordagem", exact: true }).first(), { depois: 400 });
    await g.recorte(blocoDe(topo().getByText("Colocar tags").first(), { largura: 280, altura: 110 }), "tag");
    g.marca("aplicar");
    await g.clicar(topo().getByRole("button", { name: /^Aplicar a \d+ lead/ }), { depois: 300 });
    const aplicado = topo().getByText(/Ações aplicadas a/).first();
    await aplicado.waitFor({ state: "visible", timeout: 60000 });
    g.marca("aplicado");
    await g.esperar(300);
    await g.recorte(parteDe(blocoDe(aplicado, { largura: 500 }), { largura: 330 }), "aplicado");
    g.marca("fim");
    await g.esperar(1300);
  },
});
