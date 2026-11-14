#!/usr/bin/env bash
# Produz um episódio do começo ao fim: narração no ElevenLabs, alinhamento com as legendas e render.
# Uso: scripts/explica-mente/produzir.sh <episodio>      (PYTHON=... para apontar o Python com faster-whisper)
set -euo pipefail
ep=$1
py=${PYTHON:-python3}
"$py" scripts/explica-mente/narrar.py "$ep" || true
"$py" scripts/explica-mente/alinhar_narracao.py "$ep" "saida/explica-mente/$ep/narracao.mp3" 2>&1 | grep -v Warning
npm run -s render:explica -- "$ep" 2>&1 | grep --line-buffered -E "^[0-9]+%|ok:|rror"
