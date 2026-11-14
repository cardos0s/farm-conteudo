"""Alinha uma narração gravada num arquivo só às falas de um episódio (tarefa ou colher).

Transcreve o áudio com tempos por palavra (faster-whisper), encontra onde cada fala do roteiro
começa e termina, grava remotion/explica-mente/<episodio>/tempos.json (cenas e legendas passam a
acompanhar a voz) e salva a locução em saida/explica-mente/<episodio>/locucao.wav.
Uso: python3 scripts/explica-mente/alinhar_narracao.py <episodio> <narracao.mp3> [modelo]
Requer: pip install faster-whisper numpy, e ffmpeg.
"""
import difflib
import json
import math
import os
import re
import subprocess
import sys
import unicodedata
import wave

import numpy as np
from faster_whisper import WhisperModel

FPS = 30
episodio = sys.argv[1]
audio = sys.argv[2]
modelo = sys.argv[3] if len(sys.argv) > 3 else "small"
raiz = os.path.join(os.path.dirname(__file__), "..", "..")
roteiro = open(os.path.join(raiz, f"remotion/explica-mente/{episodio}/roteiro.ts"), encoding="utf-8").read()
falas = [(int(a), int(b), t) for a, b, t in re.findall(r'(?:\{ de: |\bn\()(\d+), (?:ate: )?(\d+), (?:quem: "\w+", texto: )?"([^"]+)"', roteiro)]
m = re.search(r"TOTAL_QUADROS = (\d+)( \* FPS)?", roteiro)
total_roteiro = int(m.group(1)) * (FPS if m.group(2) else 1)


def limpa(p):
    p = unicodedata.normalize("NFD", p.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in p if unicodedata.category(c) != "Mn"))


saida = os.path.join(raiz, f"saida/explica-mente/{episodio}")
os.makedirs(saida, exist_ok=True)
locucao = os.path.join(saida, "locucao.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", audio, "-ar", "48000", "-ac", "2", locucao], check=True)
mono = os.path.join(saida, "locucao.16k.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", audio, "-ar", "16000", "-ac", "1", mono], check=True)
w = wave.open(mono)
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
duracao = len(x) / 16000
os.remove(mono)

segs, _ = WhisperModel(modelo, device="cpu", compute_type="int8").transcribe(x, language="pt", word_timestamps=True)
ditas = [(p.start, p.end, limpa(p.word)) for s in segs for p in s.words if limpa(p.word)]

# casa as palavras do roteiro com as palavras ditas
esperadas = [(i, limpa(p)) for i, (_, _, t) in enumerate(falas) for p in t.split() if limpa(p)]
casadas = difflib.SequenceMatcher(None, [p for _, p in esperadas], [p for _, _, p in ditas], autojunk=False).get_matching_blocks()
tempo = {}
for a, b, n in casadas:
    for j in range(n):
        tempo.setdefault(esperadas[a + j][0], []).append(ditas[b + j])
faltando = [i + 1 for i in range(len(falas)) if i not in tempo]
if faltando:
    sys.exit(f"Não encontrei no áudio as falas {faltando}. O texto falado é o do roteiro?")

tempos = []
for i in range(len(falas)):
    de = max(0, math.floor(tempo[i][0][0] * FPS) - 2)
    ate = math.ceil(tempo[i][-1][1] * FPS) + 4
    if tempos and de < tempos[-1][1] + 1:
        meio = (tempos[-1][1] - 4 + de + 2) // 2
        tempos[-1][1], de = meio, meio + 1
    tempos.append([de, ate])
    print(f"{i + 1:02d}  {de / FPS:6.2f} s a {ate / FPS:6.2f} s  {falas[i][2]}")
total = max(tempos[-1][1], math.ceil(duracao * FPS)) + (total_roteiro - falas[-1][1])
json.dump({"total": total, "falas": tempos}, open(os.path.join(raiz, f"remotion/explica-mente/{episodio}/tempos.json"), "w"))
print(f"ok: {locucao} · vídeo com {total / FPS:.1f} s")
