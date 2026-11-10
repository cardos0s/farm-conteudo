// Reel 1 (tomada contínua) · cena D: todo atendimento tem protocolo. Da conversa para a Central de
// Protocolos, o PDF do atendimento da Marina e a volta para a conversa, para enviar o arquivo.
import fs from "node:fs";
import path from "node:path";
import { abrirConversa, cenaDemo, recorteBolha } from "./comum.mjs";

const PDF = path.resolve("public/selloop/filme/f1-d-protocolo/protocolo.pdf");
const CLIPE = 'button[title="Anexos e recursos"]';

export default cenaDemo({
  nome: "f1-d-protocolo",
  usuario: "diogo",
  preparar: async (page, demo) => {
    await abrirConversa(page, "Meus", "Marina Costa");
    demo.chegar("marina", { texto: "Diogo, consegue me mandar o histórico da nossa conversa? Quero guardar." });
    await page.waitForTimeout(900);
  },
  gravar: async (g, page) => {
    await g.esperar(400);
    // o pedido da cliente, já na conversa
    await recorteBolha(g, page, "consegue me mandar o histórico", "pedido");
    g.marca("protocolos");
    await g.clicar(page.getByRole("button", { name: "Central de Protocolos" }), { depois: 900 });
    g.marca("lista");
    await g.digitar('input[aria-label="Buscar protocolo ou contato"]', "Marina", { cps: 22 });
    await g.esperar(500);
    // o protocolo do atendimento (número, contato e atendente)
    const linha = page.locator("tr").filter({ hasText: "Marina Costa" }).first();
    await g.recorte([linha.locator("td").nth(1), linha.locator("td").nth(3)], "protocolo", { margem: 6 });
    g.marca("protocolo");
    await g.clicar(linha.locator('input[type="checkbox"]').first(), { depois: 350 });
    await g.recorte(page.getByRole("button", { name: /Gerar PDF/ }), "gerar-pdf", { margem: 6 });
    g.marca("gerar");
    const baixando = page.waitForEvent("download", { timeout: 60000 });
    await g.clicar(page.getByRole("button", { name: /Gerar PDF/ }), { depois: 300 });
    const download = await baixando;
    fs.mkdirSync(path.dirname(PDF), { recursive: true });
    await download.saveAs(PDF);
    g.marca("pdf-pronto");
    await g.esperar(900);
    // de volta à conversa, para enviar o arquivo
    g.marca("voltar");
    await g.clicar(page.getByRole("button", { name: "Loop Chat" }), { depois: 600 });
    if (!(await page.locator(CLIPE).isVisible().catch(() => false))) {
      console.log("[cena] a conversa não ficou aberta ao voltar: abrindo de novo");
      await g.clicar("button[aria-label=Meus]", { depois: 450 });
      await g.clicar(page.getByText("Marina Costa").first(), { depois: 700 });
    }
    g.marca("anexar");
    const escolhendo = page.waitForEvent("filechooser", { timeout: 60000 });
    await g.clicar(CLIPE, { depois: 260 });
    await g.clicar(page.getByRole("button", { name: "Documento", exact: true }), { depois: 300 });
    const seletor = await escolhendo;
    await seletor.setFiles(PDF);
    await g.esperar(700);
    g.marca("enviar");
    await g.clicar(page.getByRole("button", { name: /^Enviar$/ }).last(), { depois: 900 });
    g.marca("pdf-chegou");
    await recorteBolha(g, page, "protocolo", "pdf-enviado");
    g.marca("fim");
    await g.esperar(1200);
  },
});
