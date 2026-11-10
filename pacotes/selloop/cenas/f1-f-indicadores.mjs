// Reel 1 (tomada contínua) · cena F: a gestora abre os indicadores de atendimento e desce até a nota média.
import { cartao, cartaozinho, cenaDemo } from "./comum.mjs";

export default cenaDemo({
  nome: "f1-f-indicadores",
  usuario: "patricia",
  gravar: async (g, page) => {
    await g.esperar(400);
    g.marca("abrir");
    await g.clicar(page.getByRole("button", { name: "Indicadores de Atendimento" }), { depois: 1500 });
    g.marca("cartoes");
    // os quatro contadores do topo, os números ao lado do gráfico e os cartões de tempo e de canal
    const contadores = page.locator("section button.shadow-card");
    for (let i = 0; i < 4; i++) await g.recorte(contadores.nth(i), `contador-${i + 1}`);
    await g.recorte(cartao(page.getByText("Capacidade de atendimento").first()), "capacidade");
    await g.recorte(cartaozinho(page.getByText("Novos", { exact: true }).last()), "novos");
    await g.recorte(cartaozinho(page.getByText("Desempenho", { exact: true }).last()), "desempenho");
    await g.recorte(cartao(page.getByText(/tempo médio de espera/i).first()), "espera");
    await g.recorte(cartao(page.getByText(/duração média do atendimento/i).first()), "duracao");
    await g.recorte(cartao(page.getByText(/atendimentos por canal/i).first()), "canais");
    g.marca("volume");
    await g.mover(page.getByText("Capacidade de atendimento").first());
    await g.esperar(600);
    g.marca("espera");
    await g.mover(page.getByText(/tempo médio de espera/i).first());
    await g.esperar(600);
    g.marca("descer");
    // o cursor vai para a margem e o painel rola: nenhum gráfico abre dica enquanto a página passa
    await g.mover({ x: 1588, y: 520 }, { dur: 0.35 });
    await g.rolar(650, { dur: 1.1, em: page.getByText("Capacidade de atendimento").first() });
    await g.recorte(cartao(page.getByText(/equipe campeã/i).first()), "equipe-campea");
    await g.recorte(cartao(page.getByText(/atendente campeão/i).first()), "atendente-campeao");
    await g.recorte(cartao(page.getByText(/mensagens recebidas por hora/i).first()), "por-hora");
    await g.recorte(cartao(page.getByText(/NOTA MÉDIA DA EMPRESA/i).first()), "nota-media");
    await g.recorte(cartao(page.getByText(/nota média por usuário/i).first()), "nota-usuarios");
    g.marca("equipes");
    await g.mover(page.getByText(/equipe campeã/i).first());
    await g.esperar(600);
    g.marca("satisfacao");
    await g.mover(page.getByText(/NOTA MÉDIA DA EMPRESA/i).first());
    await g.esperar(1600);
  },
});
