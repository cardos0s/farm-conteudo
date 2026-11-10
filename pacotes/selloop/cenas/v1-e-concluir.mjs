// Vídeo 1 · cena E: concluir com pesquisa de satisfação; a avaliação da cliente chega ao vivo.
import { abrirConversa, cenaDemo, recorteBolha } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-e-concluir",
  usuario: "diogo",
  preparar: async (page) => abrirConversa(page, "Meus", "Marina Costa"),
  gravar: async (g, page, demo) => {
    await g.esperar(700);
    g.marca("concluir");
    await g.clicar(page.getByRole("button", { name: "Concluir", exact: true }).first(), { depois: 900 });
    await g.mover(page.getByText("Pesquisa de satisfação").first());
    await g.esperar(600);
    // a caixa "Finalizar atendimento": o bloco mais interno que tem o título e os botões
    await g.recorte(page.locator("div").filter({ hasText: "Finalizar atendimento" }).filter({ has: page.getByRole("button", { name: "Cancelar" }) }).last(), "concluir");
    await g.clicar(page.getByRole("button", { name: "Finalizar" }), { depois: 1800 });
    await recorteBolha(g, page, "Como você avalia", "pesquisa");
    g.marca("avaliacao");
    demo.chegar("marina", { texto: "⭐⭐⭐⭐⭐" });
    await g.esperar(2600);
    // a nota chega como um selo na conversa: "Marina Costa avaliou a conversa em ⭐⭐⭐⭐⭐"
    await g.recorte(page.getByText(/avaliou a conversa/).first(), "avaliacao", { margem: 6 });
  },
});
