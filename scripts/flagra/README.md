# Reel do Flagra

Composição `ReelFlagra` (1080x1920): trecho do trailer com a pergunta → system design no canvas → demo do app → fecho.

1. **Trailer**: coloque o seu trecho vertical em `public/flagra/trailer.mp4` (fica sem som no vídeo). Sem o arquivo, aparece um quadro indicando onde ele entra.
2. **Demo do app** (`public/flagra/demo.mp4`, já incluída). Para gravar de novo depois de mudar o app:

```bash
cd apps/flagra && npm run dev          # em outro terminal
mkdir -p saida/quadros-demo
node scripts/flagra/gravar-demo.cjs saida/quadros-demo
cd saida/quadros-demo && ffmpeg -f concat -safe 0 -i lista.txt -vf "scale=780:1688:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -crf 22 -movflags +faststart ../../public/flagra/demo.mp4
```

   Se a duração mudar, atualize `PARTES.app` em `remotion/aulas/flagra/ReelFlagra.tsx`.
3. **Explicação**: os inícios de cada parte ficam em `remotion/aulas/systemdesign/roteiro.ts`.

## Narração (ElevenLabs)

O texto de cada fala e o segundo em que ela entra ficam em `remotion/aulas/flagra/narracao.ts`.

1. No `.env` da raiz: `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` (Voices → a voz → Copy voice ID).
2. Gere as falas (só refaz as que mudaram):

```bash
node scripts/flagra/narrar.mjs
```

   No fim aparece uma tabela com a duração de cada fala e um aviso onde ela invade a próxima. Encurte o texto ou mude o `em` dela e rode de novo.
3. Renderize: as falas que existirem em `public/flagra/narracao/` entram sozinhas.

```bash
npx remotion render remotion/index.ts ReelFlagra saida/reel-flagra.mp4
```

Os áudios ficam fora do git.
