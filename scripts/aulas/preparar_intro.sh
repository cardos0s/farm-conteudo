#!/usr/bin/env bash
# Prepara os vídeos curtos da intro de um Reel (cortes rápidos com som ambiente):
#  - vertical 1080x1920, 30 fps, H.264 (o render lê qualquer formato do celular, HEVC incluído)
#  - som ambiente no mesmo volume em todos os clipes (loudnorm ~-18 LUFS), para os cortes não pularem
# Uso: scripts/aulas/preparar_intro.sh <slug> <nome>=<arquivo> [<nome>=<arquivo> ...]
#   ex.: scripts/aulas/preparar_intro.sh pix placas=IMG_1.MOV impressora=IMG_2.MP4 bateria=IMG_3.MP4
# Os arquivos vão para public/aulas/<slug>/paraguai/<nome>.mp4 (fora do git).
set -euo pipefail
SLUG=$1; shift
RAIZ=$(cd "$(dirname "$0")/../.." && pwd)
DEST="$RAIZ/public/aulas/$SLUG/paraguai"
mkdir -p "$DEST"
for par in "$@"; do
  nome=${par%%=*}; arq=${par#*=}
  ffmpeg -v error -y -i "$arq" \
    -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
    -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p \
    -af "loudnorm=I=-18:TP=-2:LRA=11" -c:a aac -b:a 192k -ar 48000 -ac 2 \
    -movflags +faststart "$DEST/$nome.mp4"
  echo "ok: $nome"
done
