// Vídeo 1 · cena D: a cliente pede o histórico; o PDF da conversa sai da Central de Protocolos e vai para ela.
import fs from "node:fs";
import path from "node:path";
import { abrirConversa, cenaDemo, clipe, recorteBolha } from "./comum.mjs";

const PDF = path.resolve("public/selloop/telas/v1-d-protocolo/protocolo.pdf");

export default cenaDemo({
  nome: "v1-d-protocolo",
  usuario: "diogo",
  preparar: async (page, demo) => {
    await abrirConversa(page, "Meus", "Marina Costa");
  },
  gravar: async (g, page, demo) => {
    await g.esperar(600);
    g.marca("pedido");
    demo.chegar("marina", { texto: "Diogo, consegue me mandar o histórico da nossa conversa? Quero guardar." });
    await g.esperar(2200);
    await recorteBolha(g, page, "consegue me mandar o histórico", "pedido");
    g.marca("protocolos");
    await g.clicar(page.getByRole("button", { name: "Central de Protocolos" }), { depois: 1600 });
    await g.digitar('input[aria-label="Buscar protocolo ou contato"]', "Marina", { cps: 12 });
    await g.esperar(1200);
    await g.clicar(page.locator("tr").filter({ hasText: "Marina Costa" }).locator('input[type="checkbox"]').first(), { depois: 700 });
    // o protocolo do atendimento (número, contato e atendente) e o botão de gerar o PDF
    const linha = page.locator("tr").filter({ hasText: "Marina Costa" }).first();
    await g.recorte([linha.locator("td").nth(1), linha.locator("td").nth(3)], "protocolo", { margem: 6 });
    await g.recorte(page.getByRole("button", { name: /Gerar PDF/ }), "gerar-pdf", { margem: 6 });
    g.marca("gerar");
    const baixando = page.waitForEvent("download", { timeout: 20000 });
    await g.clicar(page.getByRole("button", { name: /Gerar PDF/ }), { depois: 300 });
    const download = await baixando;
    fs.mkdirSync(path.dirname(PDF), { recursive: true });
    await download.saveAs(PDF);
    g.marca("pdf-pronto");
    await g.esperar(1800);
    g.marca("enviar");
    await g.clicar(page.getByRole("button", { name: "Loop Chat" }), { depois: 1000 });
    await g.clicar("button[aria-label=Meus]", { depois: 900 });
    await g.clicar(page.getByText("Marina Costa").first(), { depois: 1300 });
    const escolhendo = page.waitForEvent("filechooser", { timeout: 15000 });
    await clipe(g, page, "Documento");
    const seletor = await escolhendo;
    await seletor.setFiles(PDF);
    await g.esperar(1400);
    await g.clicar(page.getByRole("button", { name: /^Enviar$/ }).last(), { depois: 2000 });
    await recorteBolha(g, page, "protocolo", "pdf-enviado");
    g.marca("fim");
    await g.esperar(800);
  },
});
