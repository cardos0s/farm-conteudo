"""Transcreve cada clipe com palavras e tempos (faster-whisper), dividindo o áudio nas pausas.

Transcrever em blocos curtos evita que o Whisper pule trechos (aconteceu em listas faladas rápido,
como as instruções da CPU) e as bordas das palavras são ajustadas para fora dos silêncios.
Uso: python3 scripts/aulas/transcrever.py <pasta-de-trabalho> [modelo]
Requer: pip install faster-whisper numpy
Saída: <pasta>/transcricao/<clipe>.json (palavras) e .txt (frases com tempo)
"""
import glob
import json
import os
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

pasta = sys.argv[1]
modelo = sys.argv[2] if len(sys.argv) > 2 else "large-v3-turbo"
CONTEXTO = ("Algoritmos e estruturas de dados, complexidade de algoritmos, notação Big O, modelo RAM, "
            "T de N, O de N, O de 1, log N, quicksort, merge sort, hash map, hash set, array, IA.")
os.makedirs(os.path.join(pasta, "transcricao"), exist_ok=True)
m = WhisperModel(modelo, device="cpu", compute_type="int8")

for caminho in sorted(glob.glob(os.path.join(pasta, "audio", "*.16k.wav"))):
    nome = os.path.basename(caminho).split(".")[0]
    w = wave.open(caminho)
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    janelas = np.lib.stride_tricks.sliding_window_view(x, 480)[::160]
    db = 20 * np.log10(np.sqrt((janelas ** 2).mean(axis=1)) + 1e-9)
    piso, fala = np.percentile(db, 10), np.percentile(db, 90)
    quieto = db < piso + (fala - piso) * 0.30
    # pontos de corte no meio de silêncios de 0,35 s ou mais; blocos de até ~18 s
    cortes, i = [0.0], 0
    while i < len(quieto):
        if quieto[i]:
            j = i
            while j < len(quieto) and quieto[j]:
                j += 1
            if j - i >= 35:
                cortes.append((i + j) / 200)
            i = j
        else:
            i += 1
    dur = len(x) / 16000
    cortes.append(dur)
    blocos, a = [], 0.0
    for k in range(1, len(cortes)):
        if cortes[k] - a > 18 or k == len(cortes) - 1:
            b = cortes[k] if cortes[k] - a <= 18 or k == 1 else cortes[k - 1]
            b = cortes[k] if b <= a else b
            blocos.append((a, b))
            a = b
    palavras = []
    for a, b in blocos:
        segs, _ = m.transcribe(x[int(a * 16000):int(b * 16000)], language="pt", word_timestamps=True, beam_size=5,
                               condition_on_previous_text=False, initial_prompt=CONTEXTO)
        for s in segs:
            for p in s.words:
                palavras.append({"start": round(a + p.start, 3), "end": round(a + p.end, 3), "word": p.word.strip(), "p": round(p.probability, 3)})
    q = lambda t: quieto[min(len(quieto) - 1, max(0, int(t * 100)))]
    for p in palavras:  # tira silêncio das bordas de cada palavra
        s, e = p["start"], p["end"]
        while s < e - 0.05 and q(s):
            s += 0.01
        while e > s + 0.05 and q(e - 0.01):
            e -= 0.01
        p["start"], p["end"] = round(s, 2), round(e, 2)
    json.dump({"nome": nome, "duracao": dur, "palavras": palavras}, open(os.path.join(pasta, "transcricao", nome + ".json"), "w"), ensure_ascii=False)
    with open(os.path.join(pasta, "transcricao", nome + ".txt"), "w") as f:
        linha, t0 = "", None
        for p in palavras:
            t0 = p["start"] if t0 is None else t0
            linha += p["word"] + " "
            if p["word"].endswith((".", "?", "!")) or len(linha) > 100:
                f.write(f"[{t0:7.2f}] {linha.strip()}\n")
                linha, t0 = "", None
        if linha:
            f.write(f"[{t0:7.2f}] {linha.strip()}\n")
    print(f"{nome}: {len(palavras)} palavras em {len(blocos)} blocos")
