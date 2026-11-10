// Caixa de um elemento na tela, comum ao gravador (gravar.mjs) e ao recortador (recortar.mjs).

/**
 * Caixa (px CSS) de um seletor, locator, {x,y,w,h}, função que devolve um desses, ou de uma lista
 * deles (a união), com margem.
 * `dentro` (seletor, locator, caixa ou função que devolve uma caixa) limita a caixa à parte visível
 * dentro desse elemento, por exemplo a área de rolagem da conversa quando a mensagem é mais alta que ela.
 */
export async function caixaDe(page, alvo, margem = 0, dentro = null) {
  const lista = Array.isArray(alvo) ? alvo : [alvo];
  const caixas = [];
  for (let a of lista) {
    // função: a caixa é calculada só agora (depois que a tela assentou)
    if (typeof a === "function") a = await a();
    if (!a) throw new Error("Recorte sem alvo.");
    if (typeof a === "object" && "w" in a && "h" in a) {
      caixas.push(a);
      continue;
    }
    const loc = typeof a === "string" ? page.locator(a).first() : a;
    await loc.waitFor({ state: "visible", timeout: 15000 });
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Sem posição na tela: ${a}`);
    caixas.push({ x: b.x, y: b.y, w: b.width, h: b.height });
  }
  let x0 = Math.min(...caixas.map((c) => c.x)) - margem;
  let y0 = Math.min(...caixas.map((c) => c.y)) - margem;
  let x1 = Math.max(...caixas.map((c) => c.x + c.w)) + margem;
  let y1 = Math.max(...caixas.map((c) => c.y + c.h)) + margem;
  if (dentro) {
    let limite = typeof dentro === "function" ? await dentro() : dentro;
    if (typeof limite === "string") limite = page.locator(limite).first();
    if (limite && !("w" in limite)) {
      const b = await limite.boundingBox();
      limite = b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
    }
    if (limite) {
      x0 = Math.max(x0, limite.x);
      y0 = Math.max(y0, limite.y);
      x1 = Math.min(x1, limite.x + limite.w);
      y1 = Math.min(y1, limite.y + limite.h);
    }
  }
  const r = (v) => Math.round(v * 100) / 100;
  return { x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0) };
}
