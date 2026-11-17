# Transcreve a narração com tempo por palavra (faster-whisper).
# Uso: ffmpeg -i narracao.mp3 -ac 1 -ar 16000 -f f32le narracao.f32
#      python3 scripts/flagra/transcrever-narracao.py narracao.f32 palavras.json
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
import numpy as np
audio = np.fromfile(sys.argv[1], dtype=np.float32)
segs, info = m.transcribe(audio, language="pt", word_timestamps=True, vad_filter=False, beam_size=5)
palavras = []
for s in segs:
    for w in s.words:
        palavras.append({"p": w.word.strip(), "i": round(w.start, 2), "f": round(w.end, 2)})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}")
json.dump(palavras, open(sys.argv[2], "w"), ensure_ascii=False)
