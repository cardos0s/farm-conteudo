// Vídeo 2 · cena B: a gestora monta uma campanha do zero e agenda o disparo.
// Identificação → público (tags) → validação de WhatsApp → agendamento e regras de envio → modelo
// aprovado com banner → Lia assume quem responder → sequência com "última chamada" 2 dias depois →
// confirmação. Cada etapa tem uma marca para a locução.
import { blocoDe, cenaDemo, parteDe } from "./comum.mjs";

const NOME = "Semana do Atacado · dezembro";

export default cenaDemo({
  nome: "v2-b-nova-campanha",
  usuario: "patricia",
  preparar: async (page) => {
    await page.getByText("Campanhas", { exact: true }).first().click();
    await page.waitForTimeout(1500);
  },
  gravar: async (g, page) => {
    // a janela da campanha fica embaixo; as janelas de cada etapa abrem por cima dela
    const camp = () => page.locator("[data-modal=true]").first();
    const topo = () => page.locator("[data-modal=true]").last();
    await g.esperar(500);

    g.marca("nova");
    await g.clicar(page.getByRole("button", { name: "Nova campanha" }), { depois: 900 });
    await g.digitar(camp().locator("input").first(), NOME, { cps: 22 });
    await g.escolher(camp().locator("select").nth(0), { label: "Comercial" }, { depois: 350 });
    await g.escolher(camp().locator("select").nth(1), { index: 1 }, { depois: 450 });
    await g.recorte(blocoDe(camp().getByText("Identificação").first(), { largura: 500, altura: 150 }), "identificacao");

    g.marca("publico");
    await g.clicar(camp().getByText("Definir público").first(), { depois: 900 });
    await g.clicar(topo().getByRole("button", { name: "Mercados", exact: true }).first(), { depois: 450 });
    await g.clicar(topo().getByRole("button", { name: "Padarias", exact: true }).first(), { depois: 800 });
    await g.foco(topo().getByText(/contato\(s\) selecionado\(s\)/).first(), "selecionados");
    await g.mover(topo().getByText(/contato\(s\) selecionado\(s\)/).first());
    await g.esperar(500);
    await g.recorte(blocoDe(topo().getByText("Tags que contêm").first(), { largura: 380, altura: 90 }), "tags", { margem: 6 });
    await g.recorte(blocoDe(topo().getByText(/contato\(s\) selecionado\(s\)/).first(), { largura: 300, altura: 50 }), "selecionados");

    g.marca("validar");
    await g.clicar(topo().getByText("Validar WhatsApp").first(), { depois: 1500 });
    await g.foco(topo().getByText(/sem WhatsApp/).first(), "sem-whatsapp");
    await g.mover(topo().getByText(/sem WhatsApp/).first());
    await g.esperar(500);
    await g.recorte([topo().getByText(/sem WhatsApp/).first(), blocoDe(topo().getByText("Nicolas Fernandes").first(), { largura: 500, altura: 150 })], "sem-whatsapp", { margem: 8 });
    await g.clicar(topo().getByRole("button", { name: /^Remover \d+ da lista$/ }), { depois: 900 });
    await g.clicar(topo().getByRole("button", { name: "Definir", exact: true }), { depois: 800 });

    g.marca("agendar");
    await g.clicar(camp().getByRole("button", { name: "Agendar", exact: true }).first(), { depois: 450 });
    const data = camp().locator("input[type=datetime-local]").first();
    await g.digitar(data, "01122026", { cps: 12 });
    await page.keyboard.press("ArrowRight");
    await g.digitar(null, "0900", { cps: 10 });
    await g.esperar(300);
    await g.recorte([camp().getByRole("button", { name: "Agendar", exact: true }).first(), data], "agendamento", { margem: 10 });
    g.marca("regras");
    await g.clicar(camp().getByText("Configurações personalizadas").first(), { depois: 900 });
    await g.clicar(topo().getByText("Intervalo aleatório").first(), { depois: 500 });
    await g.foco(topo().getByText("Máximo de envios por dia").first(), "limite");
    await g.mover(topo().getByText("Máximo de envios por dia").first());
    await g.esperar(500);
    await g.mover(topo().getByText("Dias e horários de envio").first());
    await g.esperar(600);
    await g.recorte([topo().getByText("Intervalo entre envios").first(), blocoDe(topo().getByText("Dias e horários de envio").first(), { largura: 600, altura: 110 })], "regras", { margem: 12 });
    await g.clicar(topo().getByRole("button", { name: "Definir", exact: true }), { depois: 700 });

    g.marca("modelo");
    await g.clicar(camp().getByText("Escolher modelo").first(), { depois: 900 });
    await g.clicar(topo().getByText("Semana do Atacado", { exact: true }).first(), { depois: 1500 });
    g.marca("modelo-preview");
    await g.mover(topo().getByText("Quero aproveitar").first());
    await g.esperar(900);
    await g.recorte(topo().locator("div.max-w-\\[19rem\\]").first(), "modelo");
    await g.clicar(topo().getByRole("button", { name: "Usar este modelo" }), { depois: 900 });

    g.marca("resposta");
    await g.clicar(camp().getByText("Agente IA", { exact: true }).first(), { depois: 500 });
    await g.escolher(camp().locator("select").last(), { label: "Lia" }, { depois: 900 });
    await g.recorte(blocoDe(camp().getByText("Quando o lead responder").first(), { largura: 300, altura: 150 }), "resposta");

    g.marca("sequencia");
    await g.clicar(camp().getByText("Editar sequência").first(), { depois: 1100 });
    await g.foco(topo().getByText("Agente IA · Lia").first(), "seq-lia");
    await g.mover(topo().getByText("Agente IA · Lia").first());
    await g.esperar(600);
    await g.clicar(topo().getByText("Adicionar mensagem").first(), { depois: 900 });
    await g.clicar(topo().getByText(/^Esperar 1 dia$/).first(), { depois: 500 });
    const dias = topo().locator("input").first();
    await g.clicar(dias, { depois: 150 });
    await page.keyboard.press("Control+A");
    await g.digitar(null, "2", { cps: 8 });
    await g.esperar(500);
    await g.clicar(topo().getByText("Enviar WhatsApp · mensagem 2").first(), { depois: 700 });
    await g.clicar(topo().getByRole("button", { name: "Escolher modelo" }).first(), { depois: 900 });
    await g.clicar(topo().getByText("Última chamada: Semana do Atacado", { exact: true }).first(), { depois: 1100 });
    await g.clicar(topo().getByRole("button", { name: "Usar este modelo" }), { depois: 1000 });
    g.marca("sequencia-pronta");
    await g.mover(topo().getByText(/^Esperar 2 dias$/).first());
    await g.esperar(500);
    // desce o fluxo para aparecer inteiro: a espera de 2 dias, a 2ª mensagem e quem atende a resposta
    await g.rolar(330, { dur: 0.8 });
    await g.esperar(700);
    await g.recorte(
      [
        blocoDe(topo().getByText(/^Esperar 2 dias$/).first(), { largura: 120, altura: 36 }),
        blocoDe(topo().getByText("Enviar WhatsApp · mensagem 2").first(), { largura: 300, altura: 150 }),
        blocoDe(topo().getByText("Agente IA · Lia").last(), { largura: 200, altura: 80 }),
      ],
      "sequencia",
      { margem: 14, dentro: blocoDe(topo().getByText(/^Esperar 2 dias$/).first(), { largura: 600, altura: 450 }) },
    );
    await g.clicar(topo().getByRole("button", { name: "Pronto", exact: true }), { depois: 900 });

    g.marca("confirmar");
    await g.clicar(camp().getByRole("button", { name: "Agendar campanha" }), { depois: 1300 });
    await g.mover(topo().getByText("Duração estimada").first());
    await g.esperar(900);
    await g.recorte(blocoDe(topo().getByText("Confirmar agendamento").first(), { largura: 500, altura: 400 }), "confirmacao");
    await g.clicar(topo().getByRole("button", { name: "Confirmar e agendar" }), { depois: 1400 });
    g.marca("agendada");
    // desce até a lista: a campanha nova aparece no topo, agendada para 01/12, 09:00
    await g.mover({ x: 800, y: 600 });
    await g.rolar(560, { dur: 1.0 });
    await g.foco(page.getByText(NOME).first(), "linha-nova");
    await g.mover(page.getByText(NOME).first());
    await g.esperar(1600);
    // a linha da campanha nova (nome, data e destinatários) e o status "Agendada"
    await g.recorte(parteDe(blocoDe(page.getByText(NOME).first(), { largura: 1000 }), { largura: 700 }), "linha-nova");
    await g.recorte(page.locator("span").filter({ hasText: /^Agendada$/ }).first(), "status-nova", { margem: 8 });
  },
});
