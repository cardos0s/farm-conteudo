import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { FALAS, FPS, TOTAL_QUADROS } from "../../remotion/explica-mente/roteiro";

// Junta os áudios das falas (um arquivo por fala) numa locução única, cada um no tempo da sua legenda.
// Nome dos arquivos: o número da fala (01.mp3, 02.mp3 ...) ou um intervalo gravado de uma vez (04-08.mp3).
// Uso: npx tsx scripts/explica-mente/montar_locucao.ts [pasta-dos-audios] [saida.wav]

const pasta = process.argv[2] ?? "saida/explica-mente/vozes";
const saida = process.argv[3] ?? "saida/explica-mente/locucao.wav";

const clipes = readdirSync(pasta)
  .map((nome) => ({ nome, m: nome.match(/^(\d+)(?:-(\d+))?\.(mp3|wav|m4a|ogg)$/i) }))
  .filter((c) => c.m)
  .map(({ nome, m }) => ({ nome, de: Number(m![1]), ate: Number(m![2] ?? m![1]) }))
  .sort((a, b) => a.de - b.de);
if (!clipes.length) throw new Error(`Nenhum áudio em ${pasta} (esperado 01.mp3, 02.mp3, ... ou 04-08.mp3)`);

const args: string[] = ["-v", "error", "-y"];
const filtros: string[] = [];
clipes.forEach((c, i) => {
  const primeira = FALAS[c.de - 1];
  const ultima = FALAS[c.ate - 1];
  if (!primeira || !ultima) throw new Error(`${c.nome}: o roteiro tem ${FALAS.length} falas`);
  const arquivo = path.join(pasta, c.nome);
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo]).toString());
  const inicio = primeira.de / FPS;
  const espaco = ultima.ate / FPS - inicio;
  const sobra = espaco - dur;
  console.log(`${c.nome.padEnd(10)} entra em ${inicio.toFixed(2)} s · dura ${dur.toFixed(2)} s · espaço ${espaco.toFixed(2)} s ${sobra < 0 ? `· PASSA ${(-sobra).toFixed(2)} s` : ""}`);
  args.push("-i", arquivo);
  filtros.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(inicio * 1000)}:all=1[a${i}]`);
});
filtros.push(`${clipes.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clipes.length}:normalize=0,apad,atrim=0:${TOTAL_QUADROS / FPS}[m]`);
execFileSync("ffmpeg", [...args, "-filter_complex", filtros.join(";"), "-map", "[m]", "-ar", "48000", saida], { stdio: "inherit" });
console.log(`ok: ${saida}`);
