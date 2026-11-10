// Reel 3 (tomada contínua) · cena E: a configuração da Lia, em Configurações → Atendimento → Agente
// Hub. O cursor abre a Lia e passa por Conhecimento, Habilidades e Perfil (o tom e a voz da resposta
// em áudio). A cena começa já no Agente Hub: a aba Canais, que vem antes dele no menu, não abre na demo.
import { blocoDe, cenaDemo, NOITE } from "./comum.mjs";

export default cenaDemo({
  nome: "f3-e-agente",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  caminho: "/configuracoes/agente-hub",
  gravar: async (g, page) => {
    const menu = (nome) => page.getByRole("button", { name: nome, exact: true });
    await g.esperar(400);
    const lia = page.getByText("Lia", { exact: true }).first();
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
