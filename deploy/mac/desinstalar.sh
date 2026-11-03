#!/bin/bash
# Para o robô no Mac. Os arquivos, a agenda e o .env continuam como estão; para voltar, rode instalar.sh.
set -euo pipefail
PLIST="$HOME/Library/LaunchAgents/com.fabrica-conteudo.publicar.plist"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
echo "Robô parado. Nada mais é publicado até você rodar: bash deploy/mac/instalar.sh"
