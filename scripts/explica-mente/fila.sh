#!/usr/bin/env bash
# Renderiza vários episódios em fila, um de cada vez, anotando o resultado num registro.
# Uso: scripts/explica-mente/fila.sh <registro.log> <episodio> [episodio...]
# ESPERAR_ARQUIVO e ESPERAR_LINHAS (opcionais): só começa quando esse arquivo tiver tantas linhas "ok:" ou de erro.
set -uo pipefail
log=$1; shift
if [ -n "${ESPERAR_ARQUIVO:-}" ]; then
  until [ "$(grep -cE 'ok:|rror' "$ESPERAR_ARQUIVO" 2>/dev/null)" -ge "${ESPERAR_LINHAS:-1}" ]; do sleep 20; done
fi
for ep in "$@"; do
  npm run -s render:explica -- "$ep" 2>&1 | grep --line-buffered -E "ok:|rror" >> "$log"
  date +"%H:%M $ep" >> "$log"
done
echo "fim" >> "$log"
