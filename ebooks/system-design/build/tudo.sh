#!/usr/bin/env bash
# Monta o ebook inteiro: confere o formato, renderiza os diagramas e gera HTML, PDF e EPUB em dist/.
#
#   npm run ebook:system-design
#   (ou) bash ebooks/system-design/build/tudo.sh
set -euo pipefail
cd "$(dirname "$0")/../../.."
E=ebooks/system-design

if ! python3 "$E/build/checar.py" > /dev/null; then
  python3 "$E/build/checar.py" | grep -A6 "^ERRO"
  exit 1
fi
node "$E/diagramas/renderizar.mjs" > /dev/null
python3 "$E/build/montar.py"
node "$E/build/pdf.mjs"
node "$E/build/imagens.mjs"
python3 "$E/build/montar.py" --epub | grep "^EPUB\|problema"
