"""Gera a narração de um episódio no ElevenLabs, num arquivo só.

Lê os textos do roteiro (TEXTOS e PARAGRAFOS) e salva saida/explica-mente/<episodio>/narracao.mp3.
Não refaz se o arquivo já existir (apague para gerar de novo).
Uso: python3 scripts/explica-mente/narrar.py <episodio> [id-da-voz] [modelo]
Precisa de ELEVENLABS_API_KEY no ambiente.
"""
import json
import os
import re
import sys
import urllib.request

episodio = sys.argv[1]
voz = sys.argv[2] if len(sys.argv) > 2 else "ELKyZnHR8aUSpGEttThQ"  # juliana 2
modelo = sys.argv[3] if len(sys.argv) > 3 else "eleven_v4"
raiz = os.path.join(os.path.dirname(__file__), "..", "..")
roteiro = open(os.path.join(raiz, f"remotion/explica-mente/{episodio}/roteiro.ts"), encoding="utf-8").read()
bloco = re.search(r"TEXTOS = \[(.*?)\n\];", roteiro, re.S).group(1)
textos = [t.replace('\\"', '"') for t in re.findall(r'^\s*"((?:[^"\\]|\\.)*)",?\s*$', bloco, re.M)]
par = re.search(r"PARAGRAFOS = \[([\d, ]*)\]", roteiro)
inicios = sorted({0, *[int(x) for x in par.group(1).split(",") if x.strip()]}) if par else [0]
texto = "\n\n".join(" ".join(textos[a:b]) for a, b in zip(inicios, inicios[1:] + [len(textos)]))

pasta = os.path.join(raiz, f"saida/explica-mente/{episodio}")
os.makedirs(pasta, exist_ok=True)
open(os.path.join(pasta, "narracao.txt"), "w", encoding="utf-8").write(texto)
saida = os.path.join(pasta, "narracao.mp3")
if os.path.exists(saida):
    sys.exit(f"já existe: {saida}")
req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=mp3_44100_128",
    data=json.dumps({"text": texto, "model_id": modelo}).encode(),
    headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "content-type": "application/json"},
)
open(saida, "wb").write(urllib.request.urlopen(req, timeout=300).read())
print(f"ok: {saida} ({len(textos)} falas, {len(texto)} caracteres)")
