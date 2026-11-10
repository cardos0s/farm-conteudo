// Reel 1 (tomada contínua) · cena C: na conversa da Marina, o caminho de cada recurso do clipe —
// abrir o clipe, escolher, enviar — e a resposta dela chegando ao vivo. Filmada quadro a quadro
// (scripts/telas/filmar.mjs), já no ritmo da edição: o cursor não espera à toa.
import { abrirConversa, cenaDemo, recorteBolha } from "./comum.mjs";

const CLIPE = 'button[title="Anexos e recursos"]';

export default cenaDemo({
  nome: "f1-c-recursos",
  usuario: "diogo",
  preparar: async (page) => abrirConversa(page, "Meus", "Marina Costa"),
  gravar: async (g, page, demo) => {
    const item = (nome) => page.getByRole("button", { name: nome, exact: true });
    /** Abre o clipe e escolhe um recurso: os dois primeiros cliques de todo caminho. */
    const abrir = async (recurso, { depois = 420 } = {}) => {
      await g.clicar(CLIPE, { depois: 260 });
      await g.clicar(item(recurso), { depois });
    };
    await g.esperar(500);

    // ── o clipe: tudo à mão ──
    g.marca("clipe");
    await g.clicar(CLIPE, { depois: 300 });
    await g.recorte(item("Produtos").locator("xpath=.."), "menu");
    g.marca("menu");
    await g.esperar(900);

    // ── catálogo ──
    g.marca("produtos");
    await g.clicar(item("Produtos"), { depois: 420 });
    await g.clicar(page.locator("button[aria-pressed]").filter({ hasText: "Café Torrado" }).first(), { depois: 160 });
    await g.clicar(page.getByText("Cartão do produto").first(), { depois: 160 });
    await g.clicar(page.getByRole("button", { name: /^Enviar Café Torrado/ }), { depois: 700 });
    g.marca("produtos-chegou");
    await recorteBolha(g, page, "Café Torrado e Moído", "produto");
    await g.esperar(700);
    demo.chegar("marina", { texto: "Perfeito! Me manda um orçamento pra eu montar as quantidades?" });
    await g.esperar(700);

    // ── orçamento ──
    g.marca("orcamento");
    await abrir("Orçamento");
    await g.clicar(page.getByText("Orçamento atacado").first(), { depois: 200 });
    await g.clicar(page.getByRole("button", { name: "Enviar", exact: true }).last(), { depois: 700 });
    await recorteBolha(g, page, "Montar orçamento", "orcamento-envio");
    g.marca("orcamento-pedido");
    demo.solicitarOrcamento("marina", [["cafe", 20], ["acucar", 12], ["refri", 10]]);
    await g.esperar(700);
    g.marca("orcamento-chegou");
    await recorteBolha(g, page, "Total estimado", "orcamento");
    await g.esperar(700);

    // ── formulário ──
    g.marca("formulario");
    await abrir("Formulário");
    await g.clicar(page.getByText("Cadastro de cliente").first(), { depois: 200 });
    await g.clicar(page.getByRole("button", { name: "Enviar", exact: true }).last(), { depois: 700 });
    demo.responderFormulario("marina", "Cadastro de cliente", [["CNPJ", "23.456.789/0001-10"], ["Endereço", "Av. Beira-Mar, 845 · Estreito"], ["Recebimento", "Manhã"]]);
    await g.esperar(700);
    g.marca("formulario-chegou");
    await recorteBolha(g, page, "Av. Beira-Mar, 845", "formulario");
    await g.esperar(700);

    // ── enquete ──
    g.marca("enquete");
    await abrir("Enquete");
    await g.clicar(page.getByText("Qual o melhor dia").first(), { depois: 200 });
    await g.clicar(page.getByRole("button", { name: "Enviar", exact: true }).last(), { depois: 800 });
    demo.votar("marina", "Quinta-feira");
    await g.esperar(700);
    g.marca("enquete-chegou");
    await recorteBolha(g, page, "Qual o melhor dia", "enquete");
    await g.esperar(700);

    // ── cobrança por Pix ──
    g.marca("pagamento");
    await abrir("Solicitar pagamento");
    await g.digitar("input[inputmode=decimal]", "1076,70", { cps: 26 });
    await g.digitar('input[placeholder*="Consulta"]', "Pedido 1189 · Mercado Bom Dia", { cps: 46 });
    await g.clicar(page.getByRole("button", { name: "Enviar cobrança" }), { depois: 900 });
    g.marca("cobranca-chegou");
    await recorteBolha(g, page, "Pedido 1189", "cobranca");
    await g.esperar(500);
    g.marca("pago");
    demo.pagar("marina");
    await g.esperar(900);
    await recorteBolha(g, page, "Pedido 1189", "cobranca-paga");
    await g.esperar(500);

    // ── nota fiscal ──
    demo.chegar("marina", { texto: "Paguei! Me manda a nota do pedido passado também? É pra contabilidade." });
    await g.esperar(600);
    g.marca("notas");
    await abrir("Notas e pedidos", { depois: 700 });
    await g.clicar(page.locator("li").filter({ hasText: "NF-e 4521" }).getByRole("button", { name: "Enviar" }), { depois: 600 });
    await g.clicar(page.getByRole("button", { name: /^Enviar$/ }).last(), { depois: 800 });
    g.marca("nota-chegou");
    await recorteBolha(g, page, "nfe-4521", "nota");
    await g.esperar(700);

    // ── mensagem agendada ──
    g.marca("agendar");
    await abrir("Agendar mensagem");
    await g.clicar(page.getByText("12 de nov., 09:00").first(), { depois: 160 });
    await g.clicar(page.getByText("Selecione uma mensagem entre seus modelos aprovados").first(), { depois: 200 });
    await g.clicar(page.getByRole("button", { name: "Próximo" }), { depois: 500 });
    await g.clicar(page.getByText("Pedido saiu para entrega").first(), { depois: 400 });
    await g.digitar('input[placeholder="9h às 12h"]', "9h às 12h", { cps: 30 });
    await g.clicar(page.getByRole("button", { name: "Agendar" }), { depois: 900 });
    g.marca("agendada-chegou");
    await recorteBolha(g, page, "Seu pedido sai hoje", "agendada");
    g.marca("fim");
    await g.esperar(900);
  },
});
