// Reel 3 (tomada contínua) · cena A: a noite da Lia, por dentro da plataforma, no ritmo da edição.
// 1) A conversa do Fábio: a Lia está atendendo, entende o áudio (transcrição) e responde em áudio.
// 2) Numa tomada só: o orçamento chega na conversa; pela barra lateral, a visita na Agenda e a
//    oportunidade em Vendas; de volta à conversa, a transferência para o Comercial com o resumo.
// As mensagens do cliente e da Lia chegam ao vivo pelo realtime da demo.
import { falasLia, orcamentos } from "../demo/dados.mjs";
import { blocoDe, cenaDemo, NOITE, recorteBolha } from "./comum.mjs";

const LIA = { dir: "out", quem: "lia" };
const RESUMO =
  "Resumo da Lia: Fábio, da Lanchonete do Porto (Joinville), pediu 40 fardos de Refrigerante Cola 2 L: R$ 1.839,12 no Pix, entrega na quinta, 12/11. " +
  "Visita do Diogo marcada para quinta às 10h. Pediu prazo de 28 dias no boleto: precisa da aprovação do comercial.";

export default cenaDemo({
  nome: "f3-a-conversa",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  gravar: async (g, page, demo) => {
    const lateral = (nome) => page.locator(`a[aria-label="${nome}"]`).first();
    const papel = page.locator(".papel-conversa");
    /** Espera um elemento aparecer e marca o instante. */
    const aoAparecer = async (loc, nome) => {
      await loc.waitFor({ state: "visible", timeout: 60000 });
      g.marca(nome);
    };
    await g.esperar(400);

    // ── quem responde é a Lia: o áudio do cliente, a transcrição e a resposta em áudio ──
    g.marca("abrir");
    await g.clicar(page.getByText("Fábio Martins").first(), { depois: 600 });
    await g.recorte(page.locator('span[title="Este agente de IA está respondendo a conversa"]').first(), "lia-atendendo", { margem: 6, semMouse: true });
    g.marca("lia");
    await g.mover(page.getByText(/Lia atendendo/).first());
    await g.esperar(500);

    g.marca("transcricao");
    await g.clicar(page.getByRole("button", { name: "Ver transcrição" }).first(), { depois: 300 });
    await aoAparecer(papel.getByText(/Opa, boa noite/).first(), "transcrito");
    await g.esperar(300);
    await recorteBolha(g, page, "Opa, boa noite", "audio-fabio");
    await g.esperar(500);

    g.marca("resposta");
    demo.chegar("fabio", { ...LIA, texto: "", tipo: "audio", extra: { fileUrl: "/api/uploads/demo/audios/lia-01.mp3", transcription: falasLia.resposta } });
    await g.esperar(600);
    g.marca("transcricao-lia");
    await g.clicar(page.getByRole("button", { name: "Ver transcrição" }).last(), { depois: 300 });
    await aoAparecer(papel.getByText(/Entregamos em Joinville/).first(), "respondido");
    await g.esperar(300);
    await recorteBolha(g, page, "Entregamos em Joinville", "audio-lia");
    await g.esperar(1500);

    // ── o orçamento: a Lia manda, o cliente monta e devolve ──
    g.marca("orcamento");
    demo.chegar("fabio", { texto: "Manda sim! 👍" });
    await g.esperar(500);
    const orc = orcamentos[0];
    demo.chegar("fabio", { ...LIA, texto: "Aqui está, Fábio! Monte seu pedido e veja o total na hora 👇", extra: { flow: { cta: orc.botao, orcamentoModeloId: orc.id } } });
    await g.esperar(700);
    await recorteBolha(g, page, "Montar orçamento", "orcamento-envio");
    g.marca("orcamento-pedido");
    demo.solicitarOrcamento("fabio", [["refri", 40]], { entrega: "Entrega · Joinville/SC" });
    await aoAparecer(papel.getByText("Total estimado").last(), "orcamento-chegou");
    await g.esperar(350);
    await recorteBolha(g, page, "Total estimado", "orcamento");
    await g.esperar(900);

    // ── a visita: combinada na conversa e marcada na Agenda do vendedor ──
    g.marca("visita");
    demo.chegar("fabio", { ...LIA, texto: "Pedido anotado! ✅ Entrega na quinta, 12/11. Quer que o Diogo, nosso vendedor, passe aí às 10h pra fechar e te mostrar a linha de cafés?" });
    await g.esperar(450);
    demo.chegar("fabio", { texto: "Pode ser! 10h tá ótimo" });
    await g.esperar(450);
    demo.chegar("fabio", { ...LIA, texto: "Combinado! 📅 Visita marcada: quinta, 12/11, às 10h, com o Diogo." });
    await g.esperar(500);
    await recorteBolha(g, page, "Visita marcada", "visita-combinada");
    g.marca("agenda");
    await g.clicar(lateral("Agenda"), { depois: 300 });
    const visitaNoDia = page.getByText(/10:00\s*Visita · Lanch/).first();
    await aoAparecer(visitaNoDia, "agenda-aberta");
    await g.esperar(300);
    // o dia 12 abre no painel ao lado, com a visita marcada pela Lia
    await g.clicar(page.getByText("12", { exact: true }).first(), { depois: 300 });
    const visita = page.getByText("Visita", { exact: true }).last();
    await aoAparecer(visita, "painel");
    await g.recorte(blocoDe(visitaNoDia, { largura: 130, altura: 20 }), "visita-dia", { margem: 4 });
    await g.recorte(blocoDe(visita, { largura: 250, altura: 60 }), "visita");
    await g.mover(visita);
    await g.esperar(1100);

    // ── a oportunidade: o card que a Lia criou no funil de vendas ──
    g.marca("funil");
    await g.clicar(lateral("Vendas"), { depois: 300 });
    const card = page.getByText("Lanchonete do Porto · 40 fardos").first();
    await aoAparecer(card, "funil-aberto");
    await g.esperar(300);
    await g.recorte(blocoDe(card, { largura: 250, altura: 120 }), "card", { semMouse: true });
    await g.mover(card);
    g.marca("card");
    await g.esperar(1300);

    // ── de volta à conversa: o assunto pede uma pessoa, e a Lia transfere com o resumo ──
    g.marca("voltar");
    await g.clicar(lateral("Atendimento"), { depois: 400 });
    await g.clicar(page.getByText("Fábio Martins").first(), { depois: 600 });
    g.marca("transferir");
    demo.chegar("fabio", { texto: "Vocês fazem 28 dias no boleto?" });
    await g.esperar(700);
    demo.chegar("fabio", { ...LIA, texto: "Prazo no boleto quem aprova é o nosso time comercial. Vou te passar agora pra eles, que já recebem o resumo da nossa conversa. 😉" });
    await g.esperar(800);
    demo.transferir("fabio", "comercial", { resumo: RESUMO });
    const pilula = papel.getByText("Conversa transferida para Comercial.").first();
    await aoAparecer(pilula, "transferida");
    await g.esperar(300);
    await g.recorte(pilula, "transferida", { margem: 6 });
    await g.esperar(400);
    // a nota interna só aparece quando o realtime reconecta (~2 s)
    demo.reconectar();
    const resumo = page.getByText(/^Resumo da Lia/).first();
    await resumo.waitFor({ state: "attached", timeout: 120000 });
    g.marca("nota");
    await g.esperar(300);
    // o cursor vai até a nota (a conversa desce até ela, se precisar)
    await g.mover(resumo);
    await g.esperar(500);
    await g.recorte(blocoDe(resumo, { largura: 300, altura: 90 }), "resumo", { dentro: ".papel-conversa" });
    g.marca("fim");
    await g.esperar(1500);
  },
});
