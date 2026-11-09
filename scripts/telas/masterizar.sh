#!/bin/bash
# Masteriza o áudio de um vídeo renderizado: loudness em -16 LUFS (padrão de vídeo para web e redes),
# pico real até -1,5 dBTP, em duas passadas do loudnorm. O vídeo é copiado sem reencode.
#
# Uso: scripts/telas/masterizar.sh <entrada.mp4> [saida.mp4]
#      sem saída, substitui a entrada.
set -euo pipefail

ENT="$1"
SAI="${2:-}"
ALVO_I=-16
ALVO_TP=-1.5
ALVO_LRA=11

medida=$(ffmpeg -hide_banner -nostats -i "$ENT" -af "loudnorm=I=$ALVO_I:TP=$ALVO_TP:LRA=$ALVO_LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
ler() { echo "$medida" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
I=$(ler input_i); TP=$(ler input_tp); LRA=$(ler input_lra); TH=$(ler input_thresh); OFF=$(ler target_offset)
echo "antes: $I LUFS · pico $TP dBTP · LRA $LRA"

tmp="$(mktemp --suffix=.mp4)"
ffmpeg -hide_banner -v error -y -i "$ENT" -c:v copy \
  -af "loudnorm=I=$ALVO_I:TP=$ALVO_TP:LRA=$ALVO_LRA:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart "$tmp"

if [ -n "$SAI" ]; then mv "$tmp" "$SAI"; else mv "$tmp" "$ENT"; SAI="$ENT"; fi
chmod 644 "$SAI"
depois=$(ffmpeg -hide_banner -nostats -i "$SAI" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' ' | tr '\n' ' ')
echo "depois: $depois"
