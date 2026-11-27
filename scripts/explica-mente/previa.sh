#!/usr/bin/env bash
# Prévia de um episódio: gera a narração (se faltar), alinha e monta uma folha com um quadro por fala.
# Uso: scripts/explica-mente/previa.sh <episodio> [refazer-voz]
set -euo pipefail
ep=$1
py=${PYTHON:-python3}
python3 scripts/explica-mente/registrar.py "$ep"
[ "${2:-}" = "refazer-voz" ] && rm -f "saida/explica-mente/$ep/narracao.mp3"
"$py" scripts/explica-mente/narrar.py "$ep" >/dev/null 2>&1 || true
"$py" scripts/explica-mente/alinhar_narracao.py "$ep" "saida/explica-mente/$ep/narracao.mp3" 2>&1 | grep -E "^ok|Não" || true
quadros=$(python3 -c "
import json;d=json.load(open('remotion/explica-mente/$ep/tempos.json'));f=d['falas']
qs=[]
for a,b in f:
    qs+= [int(a+(b-a)*0.3), int(a+(b-a)*0.8)] if b-a>90 else [int((a+b)/2)]
print(' '.join(map(str,qs+[d['total']-30])))")
id="ExplicaMente$(python3 -c "print('$ep'[0].upper()+'$ep'[1:])")"
VIDEO=$id scripts/explica-mente/folha.sh "saida/explica-mente/previa-$ep.jpg" 8 $quadros
