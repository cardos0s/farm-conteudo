// Vídeo 3 · cena C: a visita que a Lia marcou aparece na agenda do vendedor (quinta, 12/11, 10h).
import { blocoDe, cenaDemo, NOITE } from "./comum.mjs";

export default cenaDemo({
  nome: "v3-c-agenda",
  usuario: "patricia",
  agora: NOITE,
  cenario: "noite",
  caminho: "/agenda",
  gravar: async (g, page) => {
    await g.esperar(600);
    g.marca("dia");
    await g.mover(page.getByText(/10:00\s*Visita · Lanch/).first());
    await g.esperar(500);
    // o dia 12 abre no painel ao lado, com a visita marcada pela Lia
    await g.clicar(page.getByText("12", { exact: true }).first(), { depois: 1200 });
    g.marca("painel");
    // no painel do dia, o primeiro item é a visita das 10h
    await g.foco(page.getByText("Visita", { exact: true }).last(), "visita");
    await g.mover(page.getByText("Visita", { exact: true }).last());
    await g.esperar(1800);
    await g.recorte(blocoDe(page.getByText(/10:00\s*Visita · Lanch/).first(), { largura: 130, altura: 20 }), "visita-dia", { margem: 4 });
    await g.recorte(blocoDe(page.getByText("Visita", { exact: true }).last(), { largura: 250, altura: 60 }), "visita");
    g.marca("fim");
  },
});
