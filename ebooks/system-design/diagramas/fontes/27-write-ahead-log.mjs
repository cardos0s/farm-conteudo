// Capítulo 27 — WAL: 1) grava no log e faz fsync, 2) confirma, 3) grava as páginas depois; numa queda, replay do log.
export default (d) => {
  d.tela(720, 448).titulo(
    "Write-Ahead Log: a ordem das gravações",
    "O cliente envia um UPDATE. O banco altera a página em memória e, no passo 1, anexa um registro ao fim do WAL no disco e faz fsync. No passo 2, confirma ao cliente. No passo 3, mais tarde, num checkpoint, grava as páginas alteradas no arquivo de dados. Se o banco cair antes do passo 3, na volta ele relê o WAL a partir do último checkpoint e refaz as mudanças nas páginas de dados (replay).",
  );

  d.pessoa(64, 102, 56, { rotulo: "cliente" });
  const banco = d.caixa(196, 58, 220, 88, "Banco (memória)\npágina alterada", { tom: "azul" });
  d.seta([98, 86], banco.naEsq(0.32), { rotulo: "UPDATE", desloc: 14, tamRotulo: 16 });
  d.seta(banco.naEsq(0.72), [98, 118], { rotulo: "2. OK", desloc: 14, cor: "verde", corRotulo: "verde", tamRotulo: 17 });

  // o log no disco: só anexa no fim
  const log = d.celulas(196, 246, ["41", "42", "43", "44"], { lado: 50, destacadas: [3], tom: "verde" });
  d.texto(log.cx, 324, "WAL no disco: só anexa\nno fim, em sequência", { ancora: "middle", tam: 16, cor: "cinza" });
  d.seta(banco.emBaixo(0.8), log.celula(3).topo, { rotulo: "1. grava no log\ne faz fsync", desloc: -84, tamRotulo: 17 });

  // páginas de dados
  const pag = d.cilindro(534, 212, 160, 116, "páginas\nde dados", { tom: "azul" });
  d.seta(banco.dir, pag.topo, { tracejado: true, rotulo: "3. depois, no\ncheckpoint", desloc: 36, tamRotulo: 17 });

  // queda e replay
  d.seta(log.dir, pag.naEsq(0.52), { cor: "vermelho", rotulo: "replay", desloc: 16, corRotulo: "vermelho", tamRotulo: 17 });
  d.xis(84, 404, 20);
  d.texto(108, 398, "Caiu antes do passo 3? Na volta, o banco relê o WAL desde\no último checkpoint e refaz as mudanças nas páginas.", { tam: 17 });
};
