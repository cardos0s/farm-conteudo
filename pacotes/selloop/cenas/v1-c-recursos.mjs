// Vídeo 1 · cena C: na conversa da Marina, todos os recursos do clipe, com as respostas dela chegando ao vivo.
import { abrirConversa, cenaDemo, clipe, recorteBolha } from "./comum.mjs";

export default cenaDemo({
  nome: "v1-c-recursos",
  usuario: "diogo",
  preparar: async (page) => abrirConversa(page, "Meus", "Marina Costa"),
  gravar: async (g, page, demo) => {
    await g.esperar(800);

    g.marca("produtos");
    await clipe(g, page, "Produtos", { recorte: "menu", parte: ["Produtos", "Agendar mensagem"] });
    for (const n of ["Café Torrado", "Açúcar Cristal", "Refrigerante Cola"]) {
      await g.clicar(page.locator("button[aria-pressed]").filter({ hasText: n }).first(), { depois: 260 });
    }
    await g.clicar(page.getByText("Cartões em sequência").first(), { depois: 350 });
    await g.clicar(page.getByRole("button", { name: "Enviar 3 produtos" }), { depois: 1400 });
    await recorteBolha(g, page, "Refrigerante Cola 2 L", "produto");
    demo.chegar("marina", { texto: "Perfeito! Me manda um orçamento pra eu montar as quantidades?" });
    await g.esperar(1600);

    g.marca("orcamento");
    await clipe(g, page, "Orçamento");
    await g.clicar(page.getByText("Orçamento atacado").first(), { depois: 300 });
    await g.clicar(page.getByRole("button", { name: "Enviar", exact: true }).last(), { depois: 1500 });
    await recorteBolha(g, page, "Montar orçamento", "orcamento-envio");
    demo.solicitarOrcamento("marina", [["cafe", 20], ["acucar", 12], ["refri", 10]]);
    await g.esperar(2200);
    await recorteBolha(g, page, "Total estimado", "orcamento");

    g.marca("formulario");
    await clipe(g, page, "Formulário");
    await g.clicar(page.getByText("Cadastro de cliente").first(), { depois: 300 });
    await g.clicar(page.getByRole("button", { name: "Enviar", exact: true }).last(), { depois: 1500 });
    demo.responderFormulario("marina", "Cadastro de cliente", [["CNPJ", "23.456.789/0001-10"], ["Endereço", "Av. Beira-Mar, 845 · Estreito"], ["Recebimento", "Manhã"]]);
    await g.esperar(2000);
    await recorteBolha(g, page, "Av. Beira-Mar, 845", "formulario");

    g.marca("enquete");
    await clipe(g, page, "Enquete");
    await g.clicar(page.getByText("Qual o melhor dia").first(), { depois: 300 });
    await g.clicar(page.getByRole("button", { name: "Enviar", exact: true }).last(), { depois: 1600 });
    demo.votar("marina", "Quinta-feira");
    await g.esperar(1800);
    await recorteBolha(g, page, "Qual o melhor dia", "enquete");

    g.marca("pagamento");
    await clipe(g, page, "Solicitar pagamento");
    await g.digitar("input[inputmode=decimal]", "1076,70", { cps: 12 });
    await g.digitar('input[placeholder*="Consulta"]', "Pedido 1189 · Mercado Bom Dia", { cps: 22 });
    await g.clicar(page.getByRole("button", { name: "Enviar cobrança" }), { depois: 2000 });
    await recorteBolha(g, page, "Pedido 1189", "cobranca");
    g.marca("pago");
    demo.pagar("marina");
    await g.esperar(1800);
    await recorteBolha(g, page, "Pedido 1189", "cobranca-paga");

    demo.chegar("marina", { texto: "Paguei! Me manda a nota do pedido passado também? É pra contabilidade." });
    await g.esperar(1500);
    g.marca("notas");
    await clipe(g, page, "Notas e pedidos");
    await g.clicar(page.locator("li").filter({ hasText: "NF-e 4521" }).getByRole("button", { name: "Enviar" }), { depois: 1500 });
    await g.clicar(page.getByRole("button", { name: /^Enviar$/ }).last(), { depois: 1600 });
    await recorteBolha(g, page, "nfe-4521", "nota");

    g.marca("agendar");
    await clipe(g, page, "Agendar mensagem");
    await g.clicar(page.getByText("12 de nov., 09:00").first(), { depois: 300 });
    await g.clicar(page.getByText("Selecione uma mensagem entre seus modelos aprovados").first(), { depois: 400 });
    await g.clicar(page.getByRole("button", { name: "Próximo" }), { depois: 1000 });
    await g.clicar(page.getByText("Pedido saiu para entrega").first(), { depois: 700 });
    await g.digitar('input[placeholder="9h às 12h"]', "9h às 12h", { cps: 14 });
    await g.clicar(page.getByRole("button", { name: "Agendar" }), { depois: 1800 });
    await recorteBolha(g, page, "Seu pedido sai hoje", "agendada");
    g.marca("fim");
    await g.esperar(1200);
  },
});
