// Gera a narração do Reel do Flagra com a ElevenLabs (uma fala por arquivo).
//
// Precisa no .env (ou no ambiente):
//   ELEVENLABS_API_KEY   chave da sua conta (elevenlabs.io → Profile → API key)
//   ELEVENLABS_VOICE_ID  id da voz (Voices → a voz "Julia Cardoso" → ⋯ → Copy voice ID)
//   ELEVENLABS_MODEL     opcional (padrão: eleven_multilingual_v2, bom para português)
//
// Uso:  node scripts/flagra/narrar.mjs          (gera só as falas novas ou que mudaram)
//       node scripts/flagra/narrar.mjs --tudo   (refaz todas)
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import "dotenv/config";

const chave = process.env.ELEVENLABS_API_KEY;
const voz = process.env.ELEVENLABS_VOICE_ID;
const modelo = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
if (!chave || !voz) {
  console.error("Preencha ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID no .env");
  process.exit(1);
}

// lê as falas do arquivo TypeScript sem precisar compilar
const fonte = readFileSync("remotion/aulas/flagra/narracao.ts", "utf8");
const consts = { EXPLICACAO: 6, APP: 90.5 };
for (const m of fonte.matchAll(/const (EXPLICACAO|APP) = ([\d.]+)/g)) consts[m[1]] = Number(m[2]);
const tempo = (expr) => {
  const a = expr.match(/^app\(([\d.]+)\)$/);
  if (a) return consts.APP + Number(a[1]);
  const s = expr.match(/^sd\(([\d.]+)\)$/);
  if (s) return consts.EXPLICACAO + Number(s[1]);
  return Number(expr);
};
const falas = [...fonte.matchAll(/\{\s*id: "([^"]+)",\s*em: ([^,]+),\s*texto:\s*"([^"]+)"/g)].map((m) => ({ id: m[1], em: tempo(m[2].trim()), texto: m[3] }));
if (!falas.length) throw new Error("Nenhuma fala encontrada em narracao.ts");

const pasta = "public/flagra/narracao";
mkdirSync(pasta, { recursive: true });
const indice = path.join(pasta, "indice.json");
const antes = existsSync(indice) ? JSON.parse(readFileSync(indice, "utf8")) : {};
const depois = {};
const tudo = process.argv.includes("--tudo");

const duracao = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

for (const [i, f] of falas.entries()) {
  const arquivo = path.join(pasta, `${f.id}.mp3`);
  const assinatura = createHash("sha1").update(`${voz}|${modelo}|${f.texto}`).digest("hex");
  if (!tudo && antes[f.id]?.assinatura === assinatura && existsSync(arquivo)) {
    depois[f.id] = antes[f.id];
  } else {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": chave, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: f.texto,
        model_id: modelo,
        language_code: "pt",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
        // contexto das falas vizinhas: a entonação fica contínua entre os arquivos
        previous_text: falas[i - 1]?.texto,
        next_text: falas[i + 1]?.texto,
      }),
    });
    if (!r.ok) throw new Error(`ElevenLabs respondeu ${r.status} na fala ${f.id}: ${await r.text()}`);
    writeFileSync(arquivo, Buffer.from(await r.arrayBuffer()));
    depois[f.id] = { assinatura };
    console.log("gerada:", f.id);
  }
  depois[f.id].duracao = duracao(arquivo);
}
writeFileSync(indice, JSON.stringify(depois, null, 2));

// avisa onde uma fala invade a próxima
console.log("\nfala                 início   duração   folga");
falas.forEach((f, i) => {
  const d = depois[f.id].duracao;
  const prox = falas[i + 1]?.em ?? 153.9;
  const folga = prox - (f.em + d);
  console.log(`${f.id.padEnd(20)} ${f.em.toFixed(1).padStart(6)}s ${d.toFixed(1).padStart(7)}s ${folga.toFixed(1).padStart(6)}s${folga < 0 ? "  ⚠ invade a próxima" : ""}`);
});
