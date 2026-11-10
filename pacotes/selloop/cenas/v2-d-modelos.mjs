// Vídeo 2 · cena D: os modelos da Nova Rota, um para cada uso (promoção, comunicado, lembrete de
// boleto, lançamento, reativação e convite), vistos como chegam no WhatsApp do cliente.
import { cenaDemo } from "./comum.mjs";

const MODELOS = [
  ["promocao", "Semana do Atacado"],
  ["comunicado", "Horário de fim de ano"],
  ["boleto", "Lembrete de boleto"],
  ["lancamento", "Lançamento: cafés especiais"],
  ["reativacao", "Reativação: 60 dias sem pedido"],
  ["convite", "Convite: degustação"],
];

export default cenaDemo({
  nome: "v2-d-modelos",
  usuario: "patricia",
  preparar: async (page) => {
    await page.getByText("Campanhas", { exact: true }).first().click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Nova campanha" }).click();
    await page.waitForTimeout(900);
    // o seletor de modelos só abre depois de escolher o canal
    const camp = page.locator("[data-modal=true]").first();
    await camp.locator("select").nth(1).selectOption({ index: 1 });
    await page.waitForTimeout(500);
    await camp.getByText("Escolher modelo").first().click();
    await page.waitForTimeout(1200);
  },
  gravar: async (g, page) => {
    const modal = () => page.locator("[data-modal=true]").last();
    await g.esperar(400);
    for (const [marca, nome] of MODELOS) {
      g.marca(marca);
      await g.clicar(modal().getByText(nome, { exact: true }).first(), { depois: 1250 });
      await g.recorte(modal().locator("div.max-w-\\[19rem\\]").first(), `previa-${marca}`);
    }
    await g.esperar(600);
    g.marca("fim");
  },
});
