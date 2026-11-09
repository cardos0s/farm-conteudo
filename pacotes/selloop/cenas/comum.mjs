// Partes comuns das cenas gravadas na Selloop com a Nova Rota (servidor de demonstração).
import { instalarDemo } from "../demo/servidor.mjs";

export const APP = "https://app.selloop.com.br";
/** Terça, 10/11/2026, 10:32 em Florianópolis: o "agora" das cenas do vídeo 1. */
export const MANHA = new Date("2026-11-10T10:32:00-03:00");

/** Cria uma cena que instala a demo antes de abrir a página e guarda o controle em `cena.demo`. */
export function cenaDemo({ nome, usuario = "patricia", agora = MANHA, caminho = "/atendimento", preparar, gravar }) {
  const cena = {
    nome,
    url: `${APP}${caminho}`,
    demo: null,
    antes: async (page) => {
      cena.demo = await instalarDemo(page, { usuario, agora, avisar: true });
    },
    preparar: async (page) => {
      await page.waitForTimeout(1200);
      if (preparar) await preparar(page, cena.demo);
    },
    gravar: async (g, page) => gravar(g, page, cena.demo),
  };
  return cena;
}

/** Abre um recurso do clipe "Anexos e recursos" da conversa. */
export async function clipe(g, page, recurso) {
  await g.clicar('button[title="Anexos e recursos"]', { depois: 380 });
  await g.clicar(page.getByRole("button", { name: recurso, exact: true }), { depois: 1100 });
}

export async function abrirConversa(page, aba, contato) {
  if (aba) await page.click(`button[aria-label=${aba}]`);
  await page.waitForTimeout(800);
  await page.getByText(contato).first().click();
  await page.waitForTimeout(1500);
}
