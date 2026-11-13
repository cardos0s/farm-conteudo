import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as tenis from "../../remotion/explica-mente/roteiro";
import * as tarefa from "../../remotion/explica-mente/tarefa/roteiro";

// Junta os áudios das falas (um arquivo por fala) numa locução única.
// Nome dos arquivos: o número da fala (01.mp3, 02.mp3 ...) ou um intervalo gravado de uma vez (04-08.mp3).
// No episódio "tarefa" o vídeo se ajusta à voz: as falas entram uma atrás da outra e os novos tempos
// vão para remotion/explica-mente/tarefa/tempos.json (cenas e legendas acompanham).
// No episódio "tenis" cada áudio entra no tempo fixo da sua legenda.
// Uso: npx tsx scripts/explica-mente/montar_locucao.ts [tenis|tarefa] [pasta-dos-audios] [saida.wav]

const nome = process.argv[2] ?? "tenis";
const roteiro = { tenis, tarefa }[nome];
if (!roteiro) throw new Error(`Vídeo desconhecido: "${nome}". Opções: tenis, tarefa`);
const arquivoTempos = { tenis: null, tarefa: "remotion/explica-mente/tarefa/tempos.json" }[nome];
const { FALAS, FPS, TOTAL_QUADROS } = roteiro;
const pasta = process.argv[3] ?? `saida/explica-mente/${nome}/vozes`;
const saida = process.argv[4] ?? `saida/explica-mente/${nome}/locucao.wav`;

const clipes = readdirSync(pasta)
  .map((arq) => ({ arq, m: arq.match(/^(\d+)(?:-(\d+))?\.(mp3|wav|m4a|ogg)$/i) }))
  .filter((c) => c.m)
  .map(({ arq, m }) => ({ arq, de: Number(m![1]), ate: Number(m![2] ?? m![1]) }))
  .sort((a, b) => a.de - b.de);
if (!clipes.length) throw new Error(`Nenhum áudio em ${pasta} (esperado 01.mp3, 02.mp3, ... ou 04-08.mp3)`);

// tira o silêncio do começo e do fim de cada áudio
const limpos = path.join(path.dirname(saida), "vozes-sem-silencio");
mkdirSync(limpos, { recursive: true });
const SEM_SILENCIO = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse";
const itens = clipes.map((c) => {
  if (!FALAS[c.de - 1] || !FALAS[c.ate - 1]) throw new Error(`${c.arq}: o roteiro tem ${FALAS.length} falas`);
  const arquivo = path.join(limpos, c.arq.replace(/\.\w+$/, ".wav"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(pasta, c.arq), "-af", SEM_SILENCIO, "-ar", "48000", "-ac", "2", arquivo]);
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo]).toString());
  return { ...c, arquivo, dur, inicio: FALAS[c.de - 1].de };
});

let total = TOTAL_QUADROS;
if (arquivoTempos) {
  // uma fala atrás da outra, com um respiro curto entre elas
  if (itens.some((c) => c.de !== c.ate) || itens.length !== FALAS.length) throw new Error("Para ajustar o vídeo à voz é preciso um áudio por fala");
  const tempos: [number, number][] = [];
  let cursor = FALAS[0].de;
  itens.forEach((c, i) => {
    if (i > 0) cursor += Math.min(9, Math.max(5, FALAS[i].de - FALAS[i - 1].ate));
    c.inicio = cursor;
    cursor += Math.ceil(c.dur * FPS) + 2;
    tempos.push([c.inicio, cursor]);
  });
  total = cursor + (TOTAL_QUADROS - FALAS[FALAS.length - 1].ate);
  writeFileSync(arquivoTempos, `${JSON.stringify({ total, falas: tempos })}\n`);
  console.log(`tempos ajustados à voz: ${arquivoTempos} (${(total / FPS).toFixed(1)} s no total)`);
}

const args: string[] = ["-v", "error", "-y"];
const filtros: string[] = [];
itens.forEach((c, i) => {
  const espaco = (FALAS[c.ate - 1].ate - FALAS[c.de - 1].de) / FPS;
  const passa = !arquivoTempos && c.dur > espaco ? ` · PASSA ${(c.dur - espaco).toFixed(2)} s` : "";
  console.log(`${c.arq.padEnd(10)} entra em ${(c.inicio / FPS).toFixed(2)} s · dura ${c.dur.toFixed(2)} s${passa}`);
  args.push("-i", c.arquivo);
  filtros.push(`[${i}:a]adelay=${Math.round((c.inicio / FPS) * 1000)}:all=1[a${i}]`);
});
filtros.push(`${itens.map((_, i) => `[a${i}]`).join("")}amix=inputs=${itens.length}:normalize=0,apad,atrim=0:${total / FPS}[m]`);
execFileSync("ffmpeg", [...args, "-filter_complex", filtros.join(";"), "-map", "[m]", "-ar", "48000", saida], { stdio: "inherit" });
console.log(`ok: ${saida}`);
