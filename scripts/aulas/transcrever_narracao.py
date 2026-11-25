#!/usr/bin/env python3
"""Transcreve uma narração (um arquivo só) com o tempo de cada palavra, para sincronizar um Reel.

Uso: python3 scripts/aulas/transcrever_narracao.py <audio> <saida.json> [modelo]
Requer: pip install faster-whisper (o modelo é baixado do Hugging Face na primeira vez)
Saída: {"duracao": s, "palavras": [{"p": "palavra", "de": s, "ate": s}, ...], "texto": "..."}
"""
import json
import subprocess
import sys

import numpy as np

from faster_whisper import WhisperModel

audio, saida = sys.argv[1], sys.argv[2]
modelo = sys.argv[3] if len(sys.argv) > 3 else "large-v3-turbo"
CONTEXTO = (
    "Aproveitei a Black Friday no Paraguai. Um Pix, trinta minutos. Transação duplicada. "
    "Máquina de estados, reconciliação, observabilidade, contingência, webhook, provedor."
)

# decodifica com o ffmpeg (16 kHz mono), sem depender da leitura de áudio do faster-whisper
bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
amostras = np.frombuffer(bruto, dtype=np.float32)

m = WhisperModel(modelo, device="cpu", compute_type="int8")
segmentos, info = m.transcribe(amostras, language="pt", word_timestamps=True, initial_prompt=CONTEXTO, vad_filter=False, beam_size=5)
palavras = []
for seg in segmentos:
    for w in seg.words:
        palavras.append({"p": w.word.strip(), "de": round(w.start, 3), "ate": round(w.end, 3)})
dados = {"duracao": round(info.duration, 3), "palavras": palavras, "texto": " ".join(p["p"] for p in palavras)}
with open(saida, "w", encoding="utf-8") as f:
    json.dump(dados, f, ensure_ascii=False, indent=1)
    f.write("\n")
print(dados["texto"])
