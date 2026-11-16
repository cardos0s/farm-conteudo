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
