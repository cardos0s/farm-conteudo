#!/usr/bin/env bash
# Monta uma folha de contato com quadros do vídeo. Uso: folha.sh <saida.jpg> <colunas> <quadro> [quadro...]
set -euo pipefail
saida=$1; colunas=$2; shift 2
pasta=$(mktemp -d)
npx tsx scripts/explica-mente/quadros.ts "$pasta" 0.25 "$@" >/dev/null 2>&1
n=$#; linhas=$(( (n + colunas - 1) / colunas ))
ffmpeg -v error -y -pattern_type glob -i "$pasta/q*.jpg" -vf "tile=${colunas}x${linhas}" -q:v 3 "$saida"
rm -rf "$pasta"; echo "$saida"
