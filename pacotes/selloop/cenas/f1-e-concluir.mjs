// Reel 1 (tomada contínua) · cena E: concluir com pesquisa de satisfação; a avaliação da cliente chega ao vivo.
import { abrirConversa, cenaDemo, recorteBolha } from "./comum.mjs";

export default cenaDemo({
  nome: "f1-e-concluir",
  usuario: "diogo",
  preparar: async (page) => abrirConversa(page, "Meus", "Marina Costa"),
  gravar: async (g, page, demo) => {
    await g.esperar(400);
    g.marca("concluir");
    await g.clicar(page.getByRole("button", { name: "Concluir", exact: true }).first(), { depois: 450 });
    g.marca("caixa");
    await g.mover(page.getByText("Pesquisa de satisfação").first());
    await g.esperar(450);
    // a caixa "Finalizar atendimento": o bloco mais interno que tem o título e os botões
    await g.recorte(page.locator("div").filter({ hasText: "Finalizar atendimento" }).filter({ has: page.getByRole("button", { name: "Cancelar" }) }).last(), "concluir");
    g.marca("finalizar");
    await g.clicar(page.getByRole("button", { name: "Finalizar" }), { depois: 900 });
    g.marca("pesquisa");
    await recorteBolha(g, page, "Como você avalia", "pesquisa");
    await g.esperar(900);
    g.marca("avaliacao");
    demo.chegar("marina", { texto: "⭐⭐⭐⭐⭐" });
    await g.esperar(900);
    // a nota chega como um selo na conversa: "Marina Costa avaliou a conversa em ⭐⭐⭐⭐⭐"
    await g.recorte(page.getByText(/avaliou a conversa/).first(), "avaliacao", { margem: 6 });
    g.marca("fim");
    await g.esperar(1200);
  },
});
