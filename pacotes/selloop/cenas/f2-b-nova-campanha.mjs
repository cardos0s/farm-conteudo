// Reel 2 (tomada contínua) · cena B: a gestora monta uma campanha do zero e agenda o disparo, numa
// tomada só, no ritmo da edição. Identificação → público (tags) → validação de WhatsApp →
// agendamento e regras de envio → modelo aprovado → quem responde (a Lia) → sequência (o lembrete e
// o prazo de 2 dias) → confirmação → a campanha nova na lista. Cada etapa tem a sua marca.
import { blocoDe, cenaDemo, parteDe } from "./comum.mjs";

const NOME = "Semana do Atacado · dezembro";

export default cenaDemo({
  nome: "f2-b-nova-campanha",
  usuario: "patricia",
  preparar: async (page) => {
    await page.getByText("Campanhas", { exact: true }).first().click();
    await page.waitForTimeout(1500);
  },
  gravar: async (g, page) => {
    // a janela da campanha fica embaixo; as janelas de cada etapa abrem por cima dela
    const camp = () => page.locator("[data-modal=true]").first();
    const topo = () => page.locator("[data-modal=true]").last();
    /** Espera um elemento aparecer e marca o instante. */
    const aoAparecer = async (loc, nome) => {
      await loc.waitFor({ state: "visible", timeout: 60000 });
      g.marca(nome);
    };
    await g.esperar(400);

    // ── identificação: nome, equipe e número ──
    g.marca("nova");
    await g.clicar(page.getByRole("button", { name: "Nova campanha" }), { depois: 450 });
    g.marca("nome");
    await g.digitar(camp().locator("input").first(), NOME, { cps: 44 });
    g.marca("equipe");
    await g.escolher(camp().locator("select").nth(0), { label: "Comercial" }, { depois: 250 });
    g.marca("canal");
    await g.escolher(camp().locator("select").nth(1), { index: 1 }, { depois: 400 });
    await g.recorte(blocoDe(camp().getByText("Identificação").first(), { largura: 500, altura: 150 }), "identificacao");

    // ── público: as tags da carteira ──
    g.marca("publico");
    await g.clicar(camp().getByText("Definir público").first(), { depois: 500 });
    await g.clicar(topo().getByRole("button", { name: "Mercados", exact: true }).first(), { depois: 250 });
    await g.clicar(topo().getByRole("button", { name: "Padarias", exact: true }).first(), { depois: 450 });
    const selecionados = topo().getByText(/contato\(s\) selecionado\(s\)/).first();
    await g.recorte(blocoDe(topo().getByText("Tags que contêm").first(), { largura: 380, altura: 90 }), "tags", { margem: 6 });
    // o cursor passa pelos outros filtros da carteira: segmento e cidade
    g.marca("segmentos");
    await g.mover(topo().getByText("Padarias e cafés").first());
    await g.esperar(250);
    g.marca("cidade");
    await g.mover(topo().getByText("Cidade", { exact: true }).first());
    await g.esperar(250);
    g.marca("selecionados");
    await g.mover(selecionados);
    await g.esperar(300);
    await g.recorte(blocoDe(selecionados, { largura: 300, altura: 50 }), "selecionados");
    await g.esperar(400);

    // ── validação de WhatsApp ──
    g.marca("validar");
    await g.clicar(topo().getByText("Validar WhatsApp").first(), { depois: 300 });
    const semWhats = topo().getByText(/sem WhatsApp/).first();
    await aoAparecer(semWhats, "validado");
    await g.mover(semWhats);
    await g.esperar(300);
    await g.recorte([semWhats, blocoDe(topo().getByText("Nicolas Fernandes").first(), { largura: 500, altura: 150 })], "sem-whatsapp", { margem: 8 });
    await g.esperar(500);
    g.marca("remover");
    await g.clicar(topo().getByRole("button", { name: /^Remover \d+ da lista$/ }), { depois: 500 });
    await g.clicar(topo().getByRole("button", { name: "Definir", exact: true }), { depois: 500 });

    // ── agendamento e regras de envio ──
    g.marca("agendar");
    await g.clicar(camp().getByRole("button", { name: "Agendar", exact: true }).first(), { depois: 300 });
    const data = camp().locator("input[type=datetime-local]").first();
    await g.digitar(data, "01122026", { cps: 44 });
    await page.keyboard.press("ArrowRight");
    await g.digitar(null, "0900", { cps: 40 });
    await g.recorte([camp().getByRole("button", { name: "Agendar", exact: true }).first(), data], "agendamento", { margem: 10 });
    g.marca("agendado");
    await g.esperar(400);
    g.marca("regras");
    await g.clicar(camp().getByText("Configurações personalizadas").first(), { depois: 400 });
    // o cursor passa pelas regras: o intervalo entre os envios e o limite por dia
    g.marca("intervalo");
    await g.mover(topo().getByText("Intervalo entre envios").first());
    await g.esperar(300);
    g.marca("limite");
    await g.mover(topo().getByText("Máximo de envios por dia").first());
    await g.esperar(500);
    await g.recorte([topo().getByText("Intervalo entre envios").first(), blocoDe(topo().getByText("Dias e horários de envio").first(), { largura: 600, altura: 110 })], "regras", { margem: 12 });
    g.marca("regras-ok");
    await g.clicar(topo().getByRole("button", { name: "Definir", exact: true }), { depois: 500 });

    // ── o modelo aprovado ──
    g.marca("modelo");
    await g.clicar(camp().getByText("Escolher modelo").first(), { depois: 500 });
    await g.clicar(topo().getByText("Semana do Atacado", { exact: true }).first(), { depois: 300 });
    const previa = topo().locator("div.max-w-\\[19rem\\]").first();
    await aoAparecer(previa.getByText("Quero aproveitar").first(), "modelo-preview");
    await g.esperar(300);
    await g.recorte(previa, "modelo");
    await g.mover(previa.getByText("Quero aproveitar").first());
    await g.esperar(700);
    g.marca("usar-modelo");
    await g.clicar(topo().getByRole("button", { name: "Usar este modelo" }), { depois: 600 });

    // ── quem responde: o time ou a agente de IA ──
    g.marca("resposta");
    await g.mover(camp().getByText("Quando o lead responder").first());
    await g.esperar(500);
    g.marca("agente");
    await g.clicar(camp().getByText("Agente IA", { exact: true }).first(), { depois: 300 });
    await g.escolher(camp().locator("select").last(), { label: "Lia" }, { depois: 500 });
    await g.recorte(blocoDe(camp().getByText("Quando o lead responder").first(), { largura: 300, altura: 150 }), "resposta");
    g.marca("lia");
    await g.esperar(500);

    // ── a sequência: o lembrete (2ª mensagem) e o prazo (2 dias depois) ──
    g.marca("sequencia");
    await g.clicar(camp().getByText("Editar sequência").first(), { depois: 600 });
    g.marca("editor");
    await g.clicar(topo().getByText("Adicionar mensagem").first(), { depois: 500 });
    g.marca("lembrete");
    await g.clicar(topo().getByText("Enviar WhatsApp · mensagem 2").first(), { depois: 350 });
    await g.clicar(topo().getByRole("button", { name: "Escolher modelo" }).first(), { depois: 500 });
    await g.clicar(topo().getByText("Última chamada: Semana do Atacado", { exact: true }).first(), { depois: 500 });
    await g.clicar(topo().getByRole("button", { name: "Usar este modelo" }), { depois: 600 });
    g.marca("prazo");
    await g.clicar(topo().getByText(/^Esperar 1 dia$/).first(), { depois: 300 });
    const dias = topo().locator("input").first();
    await g.clicar(dias, { depois: 120 });
    await page.keyboard.press("Control+A");
    await g.digitar(null, "2", { cps: 8 });
    await g.esperar(300);
    g.marca("sequencia-pronta");
    // desce o fluxo para aparecer inteiro: a espera de 2 dias, a 2ª mensagem e quem atende a resposta
    await g.mover(topo().getByText(/^Esperar 2 dias$/).first());
    await g.rolar(330, { dur: 0.7 });
    await g.esperar(300);
    await g.recorte(
      [
        blocoDe(topo().getByText(/^Esperar 2 dias$/).first(), { largura: 120, altura: 36 }),
        blocoDe(topo().getByText("Enviar WhatsApp · mensagem 2").first(), { largura: 300, altura: 150 }),
        blocoDe(topo().getByText("Agente IA · Lia").last(), { largura: 200, altura: 80 }),
      ],
      "sequencia",
      { margem: 14, dentro: blocoDe(topo().getByText(/^Esperar 2 dias$/).first(), { largura: 600, altura: 450 }) },
    );
    g.marca("sequencia-vista");
    await g.esperar(600);
    g.marca("pronto");
    await g.clicar(topo().getByRole("button", { name: "Pronto", exact: true }), { depois: 500 });

    // ── conferir, confirmar e a campanha agendada na lista ──
    g.marca("confirmar");
    await g.clicar(camp().getByRole("button", { name: "Agendar campanha" }), { depois: 300 });
    await aoAparecer(topo().getByText("Confirmar agendamento").first(), "resumo");
    await g.esperar(300);
    await g.recorte(blocoDe(topo().getByText("Confirmar agendamento").first(), { largura: 500, altura: 400 }), "confirmacao");
    await g.mover(topo().getByText("Duração estimada").first());
    await g.esperar(500);
    g.marca("confirma");
    await g.clicar(topo().getByRole("button", { name: "Confirmar e agendar" }), { depois: 700 });
    g.marca("agendada");
    // o cursor vai para a margem e a página desce até a lista: a campanha nova está no topo dela
    await g.mover({ x: 1588, y: 620 }, { dur: 0.35 });
    await g.rolar(560, { dur: 0.9, em: page.getByText("Mensagens por dia").first() });
    await g.foco(page.getByText(NOME).first(), "linha-nova");
    g.marca("lista");
    await g.mover(page.getByText(NOME).first());
    await g.esperar(400);
    // a linha da campanha nova (nome, data e destinatários) e o status "Agendada"
    await g.recorte(parteDe(blocoDe(page.getByText(NOME).first(), { largura: 1000 }), { largura: 700 }), "linha-nova");
    await g.recorte(page.locator("span").filter({ hasText: /^Agendada$/ }).first(), "status-nova", { margem: 8 });
    g.marca("fim");
    await g.esperar(1500);
  },
});
