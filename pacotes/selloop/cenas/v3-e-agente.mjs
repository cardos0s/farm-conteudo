// Vídeo 3 · cena E: a configuração da Lia no Agente Hub: conhecimento, habilidades, tom e a voz
// da resposta em áudio.
import { cenaDemo, NOITE } from "./comum.mjs";

export default cenaDemo({
  nome: "v3-e-agente",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  caminho: "/configuracoes/agente-hub",
  gravar: async (g, page) => {
    const menu = (nome) => page.getByRole("button", { name: nome, exact: true });
    await g.esperar(500);
    g.marca("abrir");
    await g.clicar(page.getByText("Lia", { exact: true }).first(), { depois: 900 });
    g.marca("conhecimento");
    await g.clicar(menu("Conhecimento"), { depois: 600 });
    await g.mover(page.getByText("Tabela de preços · dezembro 2026.pdf").first());
    await g.esperar(500);
    g.marca("habilidades");
    await g.clicar(menu("Habilidades"), { depois: 400 });
    await g.mover({ x: 1100, y: 620 });
    await g.rolar(650, { dur: 0.7 });
    await g.foco(page.getByText("Criar Card no CRM").first(), "crm");
    g.marca("tom");
    await g.clicar(menu("Perfil"), { depois: 450 });
    await g.mover(page.getByText("Tom de Comunicação").first());
    await g.esperar(300);
    g.marca("voz");
    await g.mover({ x: 1100, y: 620 });
    await g.rolar(520, { dur: 0.6 });
    await g.foco(page.getByText("Resposta em Áudio").first(), "voz");
    await g.mover(page.getByText("Resposta em Áudio").first());
    await g.esperar(2600);
    g.marca("fim");
  },
});
