#!/bin/bash
# Deixa o robô rodando sozinho no Mac: a cada minuto ele lê entrada/ e publica o que chegou no horário.
# Uso, dentro da pasta do projeto:  bash deploy/mac/instalar.sh
# Para parar:                       bash deploy/mac/desinstalar.sh
set -euo pipefail

cd "$(dirname "$0")/../.."
PROJETO="$(pwd)"
ROTULO="com.fabrica-conteudo.publicar"
PLIST="$HOME/Library/LaunchAgents/$ROTULO.plist"
LOG="$PROJETO/dados/publicar.log"

NPM="$(command -v npm || true)"
NODE="$(command -v node || true)"
if [ -z "$NPM" ] || [ -z "$NODE" ]; then
  echo "Não achei o Node. Instale pelo nodejs.org (botão LTS) e rode de novo."
  exit 1
fi
if [ ! -f .env ]; then
  echo "Falta o arquivo .env nesta pasta. Crie com: cp .env.example .env"
  exit 1
fi
case "$PROJETO" in
  "$HOME/Documents"* | "$HOME/Desktop"* | "$HOME/Downloads"* | "$HOME/Library/Mobile Documents"*)
    echo "Atenção: o projeto está em $PROJETO."
    echo "O macOS costuma bloquear robôs em Documentos, Mesa e Downloads. Se o registro mostrar"
    echo "'Operation not permitted', mova a pasta para $HOME/farm-conteudo e instale de novo."
    ;;
esac

# Caracteres especiais de XML no caminho (& < >) quebrariam o arquivo de configuração.
xml() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

mkdir -p "$PROJETO/dados" "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$ROTULO</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(xml "$NPM")</string>
    <string>run</string>
    <string>--silent</string>
    <string>publicar</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$(xml "$PROJETO")</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$(xml "$(dirname "$NODE")"):/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    <key>TZ</key>
    <string>America/Sao_Paulo</string>
  </dict>
  <!-- A cada 60 s. O macOS não abre uma rodada nova enquanto a anterior (um upload, por exemplo) não terminar. -->
  <key>StartInterval</key>
  <integer>60</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$(xml "$LOG")</string>
  <key>StandardErrorPath</key>
  <string>$(xml "$LOG")</string>
</dict>
</plist>
PLIST

# Se já estava instalado, recarrega com a configuração nova.
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Pronto: o robô roda a cada minuto, mesmo com o Terminal fechado, e volta sozinho quando o Mac reinicia."
echo "Registro do que ele faz:  tail -f dados/publicar.log"
echo "Agenda:                   npm run status"
echo "Para parar:               bash deploy/mac/desinstalar.sh"
echo
echo "Lembre: com o Mac dormindo ou desligado ele não posta. Um post atrasado sai assim que o Mac acordar."
