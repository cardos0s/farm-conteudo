import { executar } from "./comum";
import { atualizarPeca, listarPecas } from "../core/estado";

// Depois de corrigir o que fez um post falhar (token, permissão), coloca os Reels e carrosséis com erro
// de volta na fila para sair já, na próxima rodada do robô (em até 1 minuto). Os outros posts não mudam de dia.
// Uso: npm run tentar-de-novo
await executar("tentar de novo", async () => {
  const comErro = await listarPecas((p) => (p.tipo === "reel" || p.tipo === "carrossel") && p.status === "erro");
  if (!comErro.length) {
    console.log("Nenhum post com erro.");
    return;
  }
  const agora = new Date().toISOString();
  for (const p of comErro) {
    console.log(`↻ ${p.titulo} (erro anterior: ${p.erro ?? "?"})`);
    await atualizarPeca(p.id, { status: "aprovada", agendadaPara: agora, tentativas: 0, erro: undefined });
  }
  console.log(`\n${comErro.length} post(s) de volta na fila. O robô publica na próxima rodada (em até 1 minuto).`);
  console.log("Acompanhe com: tail -f dados/publicar.log");
});
