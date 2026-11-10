// Reel 3 (tomada contínua) · cena E: o caminho até a configuração da Lia e o que se ajusta nela.
// Do atendimento: a engrenagem (Configurações) → Atendimento → a aba Agente Hub → Lia → Conhecimento →
// Habilidades → Perfil (o tom e, descendo a página, a voz da resposta em áudio).
import { blocoDe, cenaDemo, NOITE } from "./comum.mjs";

export default cenaDemo({
  nome: "f3-e-agente",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  gravar: async (g, page) => {
    const menu = (nome) => page.getByRole("button", { name: nome, exact: true });
    const aparecer = (loc) => loc.waitFor({ state: "visible", timeout: 60000 });
    await g.esperar(400);

    // ── o caminho: a engrenagem, Atendimento no menu das configurações e a aba Agente Hub ──
    g.marca("configuracoes");
    await g.clicar(page.locator('a[href="/configuracoes"]').first(), { depois: 300 });
    const noMenu = page.locator('a[href="/configuracoes/canais"]').first();
    await aparecer(noMenu);
    await g.esperar(250);
    g.marca("atendimento");
    await g.clicar(noMenu, { depois: 300 });
    const aba = page.getByText("Agente Hub", { exact: true }).first();
    await aparecer(aba);
    await g.esperar(250);
    g.marca("agente-hub");
    await g.clicar(aba, { depois: 300 });
    const lia = page.getByText("Lia", { exact: true }).first();
    await aparecer(lia);
    await g.esperar(250);
    g.marca("abrir");
    await g.clicar(lia, { depois: 600 });

    // ── o que a empresa sabe: documentos e o site ──
    g.marca("conhecimento");
    await g.clicar(menu("Conhecimento"), { depois: 400 });
    const tabela = page.getByText("Tabela de preços · dezembro 2026.pdf").first();
    await g.mover(tabela);
    await g.esperar(400);
    await g.recorte([blocoDe(tabela, { largura: 300, altura: 44 }), blocoDe(page.getByText("novarota.com.br").first(), { largura: 300, altura: 44 })], "conhecimento", { margem: 8, semMouse: true });

    // ── as habilidades ──
    g.marca("habilidades");
    await g.clicar(menu("Habilidades"), { depois: 450 });

    // ── o perfil: o tom e, descendo a página, a voz da resposta em áudio ──
    g.marca("tom");
    await g.clicar(menu("Perfil"), { depois: 450 });
    const tom = page.getByText("Tom de Comunicação").first();
    await g.recorte([blocoDe(tom, { largura: 500, altura: 40 }), blocoDe(page.getByText("Emojis", { exact: true }).first(), { largura: 500, altura: 40 })], "tom", { margem: 10, semMouse: true });
    g.marca("voz");
    const voz = page.getByText("Resposta em Áudio").first();
    await g.mover(voz);
    await g.esperar(400);
    await g.recorte(blocoDe(voz, { largura: 500, altura: 80 }), "voz", { margem: 10, semMouse: true });
    g.marca("fim");
    await g.esperar(1500);
  },
});
