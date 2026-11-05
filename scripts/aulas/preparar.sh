#!/usr/bin/env bash
# Prepara os clipes do iPhone (HEVC 10 bits, HDR HLG) para a edição:
#  - áudio 16 kHz mono para transcrição e análise de pausas (audio/)
#  - vídeo 2560x1440 30 fps SDR BT.709 com tone mapping "hable" (1440p/), com margem para zoom e PiP
#  - cópia só do vídeo em public/aulas/<slug>/ para o Remotion
# Uso: scripts/aulas/preparar.sh <pasta-de-trabalho> <slug>
set -euo pipefail
PASTA=$1; SLUG=$2
RAIZ=$(cd "$(dirname "$0")/../.." && pwd)
mkdir -p "$PASTA/audio" "$PASTA/1440p" "$RAIZ/public/aulas/$SLUG"
TM="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
for f in "$PASTA"/originais/*.MOV "$PASTA"/originais/*.mov; do
  [ -e "$f" ] || continue
  n=$(basename "${f%.*}")
  ffmpeg -v error -y -i "$f" -map 0:a:0 -ac 1 -ar 16000 -c:a pcm_s16le "$PASTA/audio/$n.16k.wav"
  # a rotação do iPhone é aplicada automaticamente pelo ffmpeg antes dos filtros
  ffmpeg -v error -y -skip_loop_filter all -i "$f" -map 0:v:0 -map 0:a:0 \
    -vf "fps=30,scale=2560:1440:flags=lanczos,$TM" \
    -c:v libx264 -preset superfast -crf 15 -g 30 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a pcm_s16le -ar 48000 -ac 2 "$PASTA/1440p/$n.mov"
  ffmpeg -v error -y -i "$PASTA/1440p/$n.mov" -map 0:v:0 -c:v copy -movflags +faststart "$RAIZ/public/aulas/$SLUG/$n.mp4"
  echo "ok: $n"
done
