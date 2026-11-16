// Grava a demo guiada do Flagra em resolução de celular 2x (quadros do screencast do Chrome).
// Uso: node gravar2.cjs <pasta-de-quadros>   (o app precisa estar em http://localhost:5173)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const pasta = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/'); await p.waitForTimeout(2000);
  await p.goto('http://localhost:5173/?demo'); await p.waitForTimeout(600);
  const cdp = await ctx.newCDPSession(p);
  const quadros = [];
  cdp.on('Page.screencastFrame', async (f) => {
    const nome = `q${String(quadros.length).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(pasta, nome), Buffer.from(f.data, 'base64'));
    quadros.push({ nome, t: f.metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  const passos = [3.5, 4.5, 5.0, 4.5, 4.5, 3.5, 4.0, 5.5, 3.5, 9.0, 5.5, 3.5];
  for (let i = 0; i < passos.length; i++) {
    await p.waitForTimeout(passos[i] * 1000);
    if (i < passos.length - 1) await p.click('.demo-proximo');
  }
  await cdp.send('Page.stopScreencast');
  const fim = Date.now() / 1000;
  // lista para o ffmpeg (concat com duração de cada quadro)
  let lista = '';
  quadros.forEach((q, i) => {
    const prox = i + 1 < quadros.length ? quadros[i + 1].t : quadros[0].t + (fim - quadros[0].t);
    lista += `file '${q.nome}'\nduration ${Math.max(0.001, prox - q.t).toFixed(4)}\n`;
  });
  lista += `file '${quadros[quadros.length - 1].nome}'\n`;
  fs.writeFileSync(path.join(pasta, 'lista.txt'), lista);
  console.log('quadros', quadros.length, 'duração', (quadros[quadros.length - 1].t - quadros[0].t).toFixed(1));
  await ctx.close(); await b.close();
})();
