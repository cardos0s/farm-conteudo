// Vídeo 3 · cena A: 23h47, o Fábio manda um áudio no WhatsApp e quem responde é a Lia, em áudio.
// Depois ela manda o orçamento, marca a visita do vendedor e passa a conversa para o Comercial com
// o resumo numa nota interna. As mensagens do cliente e da Lia chegam ao vivo pelo realtime da demo.
import { falasLia, orcamentos } from "../demo/dados.mjs";
import { blocoDe, cenaDemo, NOITE, recorteBolha } from "./comum.mjs";

const LIA = { dir: "out", quem: "lia" };
const RESUMO =
  "Resumo da Lia: Fábio, da Lanchonete do Porto (Joinville), pediu 40 fardos de Refrigerante Cola 2 L: R$ 1.839,12 no Pix, entrega na quinta, 12/11. " +
  "Visita do Diogo marcada para quinta às 10h. Pediu prazo de 28 dias no boleto: precisa da aprovação do comercial.";

export default cenaDemo({
  nome: "v3-a-conversa",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  gravar: async (g, page, demo) => {
    await g.esperar(700);
    g.marca("lista");
    await g.mover(page.getByText("Fábio Martins").first());
    await g.esperar(500);
    g.marca("abrir");
    await g.clicar(page.getByText("Fábio Martins").first(), { depois: 1300 });
    await g.foco(page.getByText(/Lia atendendo/).first(), "lia-atendendo");
    await g.mover(page.getByText(/Lia atendendo/).first());
    await g.esperar(900);
    await g.recorte(page.locator('span[title="Este agente de IA está respondendo a conversa"]').first(), "lia-atendendo", { margem: 6, semMouse: true });

    g.marca("transcricao");
    await g.clicar(page.getByRole("button", { name: "Ver transcrição" }).first(), { depois: 1500 });
    await recorteBolha(g, page, "Opa, boa noite", "audio-fabio");

    g.marca("resposta");
    demo.chegar("fabio", { ...LIA, texto: "", tipo: "audio", extra: { fileUrl: "/api/uploads/demo/audios/lia-01.mp3", transcription: falasLia.resposta } });
    await g.esperar(1400);
    await g.clicar(page.getByRole("button", { name: "Ver transcrição" }).last(), { depois: 1800 });
    await recorteBolha(g, page, "Entregamos em Joinville", "audio-lia");

    g.marca("orcamento");
    demo.chegar("fabio", { texto: "Manda sim! 👍" });
    await g.esperar(1000);
    const orc = orcamentos[0];
    demo.chegar("fabio", { ...LIA, texto: "Aqui está, Fábio! Monte seu pedido e veja o total na hora 👇", extra: { flow: { cta: orc.botao, orcamentoModeloId: orc.id } } });
    await g.esperar(1500);
    await recorteBolha(g, page, "Montar orçamento", "orcamento-envio");
    demo.solicitarOrcamento("fabio", [["refri", 40]], { entrega: "Entrega · Joinville/SC" });
    await g.esperar(2200);
    await recorteBolha(g, page, "Total estimado", "orcamento");

    g.marca("visita");
    demo.chegar("fabio", { ...LIA, texto: "Pedido anotado! ✅ Entrega na quinta, 12/11. Quer que o Diogo, nosso vendedor, passe aí às 10h pra fechar e te mostrar a linha de cafés?" });
    await g.esperar(1300);
    demo.chegar("fabio", { texto: "Pode ser! 10h tá ótimo" });
    await g.esperar(1000);
    demo.chegar("fabio", { ...LIA, texto: "Combinado! 📅 Visita marcada: quinta, 12/11, às 10h, com o Diogo." });
    await g.esperar(1800);
    await recorteBolha(g, page, "Visita marcada", "visita");

    g.marca("transferir");
    demo.chegar("fabio", { texto: "Vocês fazem 28 dias no boleto?" });
    await g.esperar(1200);
    demo.chegar("fabio", { ...LIA, texto: "Prazo no boleto quem aprova é o nosso time comercial. Vou te passar agora pra eles, que já recebem o resumo da nossa conversa. 😉" });
    await g.esperar(1300);
    demo.transferir("fabio", "comercial", { resumo: RESUMO });
    await g.esperar(900);
    // a nota interna só aparece quando o realtime reconecta (~2 s)
    demo.reconectar();
    await g.esperar(3200);
    g.marca("nota");
    await g.mover({ x: 1000, y: 600 });
    await g.rolar(600, { dur: 0.8 });
    await g.foco(page.getByText(/^Resumo da Lia/).first(), "resumo");
    await g.mover(page.getByText(/^Resumo da Lia/).first());
    await g.esperar(2400);
    await g.recorte(page.locator(".papel-conversa").getByText("Conversa transferida para Comercial.").first(), "transferida", { margem: 6 });
    await g.recorte(blocoDe(page.getByText(/^Resumo da Lia/).first(), { largura: 300, altura: 90 }), "resumo", { dentro: ".papel-conversa" });
    g.marca("fim");
  },
});
