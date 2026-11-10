// Partes comuns das cenas gravadas na Selloop com a Nova Rota (servidor de demonstração).
import { instalarDemo } from "../demo/servidor.mjs";

export const APP = "https://app.selloop.com.br";
/** Terça, 10/11/2026, 10:32 em Florianópolis: o "agora" das cenas do vídeo 1. */
export const MANHA = new Date("2026-11-10T10:32:00-03:00");
/** A mesma terça, 23:47: o time já foi para casa e a Lia atende (vídeo 3). */
export const NOITE = new Date("2026-11-10T23:47:00-03:00");

/** Cria uma cena que instala a demo antes de abrir a página e guarda o controle em `cena.demo`. */
export function cenaDemo({ nome, usuario = "patricia", agora = MANHA, cenario = "dia", caminho = "/atendimento", preparar, gravar }) {
  const cena = {
    nome,
    url: `${APP}${caminho}`,
    demo: null,
    antes: async (page) => {
      cena.demo = await instalarDemo(page, { usuario, agora, cenario, avisar: true });
    },
    preparar: async (page) => {
      await page.waitForTimeout(1200);
      if (preparar) await preparar(page, cena.demo);
    },
    gravar: async (g, page) => gravar(g, page, cena.demo),
  };
  return cena;
}

/**
 * Abre um recurso do clipe "Anexos e recursos" da conversa. `recorte` marca o menu aberto para a
 * montagem; `parte` ([primeiro, último]) marca também só esse trecho do menu, como `<recorte>-parte`.
 */
export async function clipe(g, page, recurso, { recorte, parte } = {}) {
  await g.clicar('button[title="Anexos e recursos"]', { depois: 380 });
  const item = page.getByRole("button", { name: recurso, exact: true });
  if (recorte) await g.recorte(item.locator("xpath=.."), recorte);
  if (recorte && parte) await g.recorte(parte.map((nome) => page.getByRole("button", { name: nome, exact: true })), `${recorte}-parte`);
  await g.clicar(item, { depois: 1100 });
}

/** A mensagem (balão) mais recente da conversa que contém o texto. */
export const bolha = (page, texto) => page.locator("li[data-mensagem-id]").filter({ hasText: texto }).last();

/** Marca para a montagem a mensagem mais recente com o texto (só a parte visível na área da conversa). */
export const recorteBolha = (g, page, texto, nome) => g.recorte(bolha(page, texto), nome, { dentro: ".papel-conversa" });

/** O cartão (painel com sombra) em volta de um elemento. */
export const cartao = (loc) => loc.locator("xpath=ancestor-or-self::*[contains(concat(' ', normalize-space(@class), ' '), ' shadow-card ')][1]");

/** O cartãozinho (caixa de canto arredondado menor) em volta de um elemento, como os números ao lado de um gráfico. */
export const cartaozinho = (loc) => loc.locator("xpath=ancestor-or-self::*[contains(concat(' ', normalize-space(@class), ' '), ' rounded-xl ')][1]");

/**
 * O bloco em volta de um elemento: o menor antecessor com pelo menos esta largura e altura (px).
 * Devolve uma função, para o gravador e o recortador medirem só na hora do recorte.
 */
export const blocoDe = (loc, { largura = 0, altura = 0 } = {}) => async () => {
  await loc.waitFor({ state: "visible", timeout: 15000 });
  return loc.evaluate(
    (el, { largura, altura }) => {
      for (let e = el; e; e = e.parentElement) {
        const b = e.getBoundingClientRect();
        if (b.width >= largura && b.height >= altura) return { x: b.x, y: b.y, w: b.width, h: b.height };
      }
      return null;
    },
    { largura, altura },
  );
};

/** Só o começo de uma caixa: os primeiros `largura` × `altura` px a partir do canto de cima à esquerda. */
export const parteDe = (caixa, { largura = Infinity, altura = Infinity } = {}) => async () => {
  const c = await caixa();
  return c && { ...c, w: Math.min(c.w, largura), h: Math.min(c.h, altura) };
};

/** A linha da lista de conversas de um contato. */
export const itemDaLista = (page, contato) => page.locator("li").filter({ has: page.locator("button") }).filter({ hasText: contato }).first();

/** A janela (modal) da frente. */
export const janela = (page) => page.locator("[data-modal=true]").last();

export async function abrirConversa(page, aba, contato) {
  if (aba) await page.click(`button[aria-label=${aba}]`);
  await page.waitForTimeout(800);
  await page.getByText(contato).first().click();
  await page.waitForTimeout(1500);
}
