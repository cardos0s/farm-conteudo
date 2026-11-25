#!/usr/bin/env bash
# Trata a narração do Reel do Pix para a mixagem:
#  - passa-altas em 80 Hz (tira ronco e graves de manuseio)
#  - +8 dB em "E isso aconteceu" (2,15–3,75 s), gravado bem mais baixo que o resto
# Uso: scripts/aulas/tratar_narracao_pix.sh <narracao gravada> (gera public/aulas/pix/narracao.wav)
set -euo pipefail
RAIZ=$(cd "$(dirname "$0")/../.." && pwd)
mkdir -p "$RAIZ/public/aulas/pix"
ffmpeg -v error -y -i "$1" \
  -af "highpass=f=80,volume=8dB:enable='between(t,2.15,3.75)'" \
  -ar 48000 -ac 1 -c:a pcm_s16le "$RAIZ/public/aulas/pix/narracao.wav"
echo "ok: public/aulas/pix/narracao.wav"
